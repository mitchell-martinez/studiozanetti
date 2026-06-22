<?php
/**
 * Plugin Name: Studio Zanetti — SEO & Social Manager
 * Description: Centralised admin page for managing page titles, descriptions, and featured images with live previews.
 * Version: 1.0.0
 * Author: Studio Zanetti
 * License: GPL v2
 * Requires: sz-headless.php
 *
 * Adds a dedicated WordPress admin page (SEO & Social Previews) where editors can
 * manage canonical page metadata (title, description, featured image) for all pages
 * in one place with live previews for Google, Facebook, and X (Twitter).
 *
 * All changes are automatically persisted to the same fields used by single-page
 * editing to ensure consistency across the admin interface.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MENU & ENQUEUE
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'admin_menu', function () {
	add_menu_page(
		'SEO & Social Previews',
		'SEO & Social',
		'edit_pages',
		'sz-social-seo-manager',
		'szRenderSocialSeoManager',
		'dashicons-share',
		25
	);
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( $hook !== 'toplevel_page_sz-social-seo-manager' ) {
		return;
	}

	if ( function_exists( 'wp_enqueue_media' ) ) {
		wp_enqueue_media();
	}
} );

// ─────────────────────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get social SEO metadata for a page.
 *
 * This reads canonical page data only (title, ACF page_description,
 * featured image) so single-page editing and bulk editing stay consistent.
 *
 * When $with_fallback is true, description falls back to excerpt/content for
 * preview convenience only.
 */
function szGetSocialMetaForPage( int $post_id, bool $with_fallback = false ): array {
	$title       = trim( (string) get_the_title( $post_id ) );
	$description = '';
	if ( function_exists( 'get_field' ) ) {
		$description = trim( (string) get_field( 'page_description', $post_id ) );
	}
	$image_id = (int) get_post_thumbnail_id( $post_id );

	$image = null;
	if ( $image_id > 0 ) {
		$image = sz_resolve_image( $image_id );
	}

	if ( ! $with_fallback ) {
		return [
			'title'       => $title,
			'description' => $description,
			'image'       => $image,
			'image_id'    => $image_id,
		];
	}

	$excerpt_text = trim( (string) wp_strip_all_tags( get_post_field( 'post_excerpt', $post_id ) ) );
	$content_text = trim( (string) wp_strip_all_tags( get_post_field( 'post_content', $post_id ) ) );
	$fallback_description = $description;
	if ( $fallback_description === '' ) {
		$fallback_description = $excerpt_text;
	}
	if ( $fallback_description === '' ) {
		$fallback_description = wp_trim_words( $content_text, 28, '…' );
	}

	return [
		'title'       => $title,
		'description' => $fallback_description,
		'image'       => $image,
		'image_id'    => $image_id,
	];
}

/**
 * Persist one or more social SEO rows using canonical page fields.
 */
function szPersistSocialSeoRows( array $raw_rows ): array {
	$saved_post_ids = [];

	foreach ( $raw_rows as $post_id_raw => $row ) {
		$post_id = (int) $post_id_raw;
		$post    = get_post( $post_id );
		if ( ! $post || $post->post_type !== 'page' ) {
			continue;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			continue;
		}
		if ( ! is_array( $row ) ) {
			continue;
		}

		$title       = isset( $row['title'] ) ? sanitize_text_field( wp_unslash( (string) $row['title'] ) ) : '';
		$description = isset( $row['description'] ) ? sanitize_textarea_field( wp_unslash( (string) $row['description'] ) ) : '';
		$image_id    = isset( $row['image_id'] ) ? (int) $row['image_id'] : 0;

		if ( $title !== '' && $title !== (string) get_the_title( $post_id ) ) {
			wp_update_post( [
				'ID'         => $post_id,
				'post_title' => $title,
			] );
		}

		if ( function_exists( 'update_field' ) ) {
			update_field( 'page_description', $description, $post_id );
		} else {
			update_post_meta( $post_id, 'page_description', $description );
		}

		if ( $image_id > 0 && get_post( $image_id ) ) {
			set_post_thumbnail( $post_id, $image_id );
		} else {
			delete_post_thumbnail( $post_id );
		}

		$saved_post_ids[] = $post_id;
	}

	return $saved_post_ids;
}

/**
 * Save social SEO metadata posted from the manager page.
 */
function szSaveSocialSeoManager(): void {
	if ( ! current_user_can( 'edit_pages' ) ) {
		return;
	}

	$raw_rows = $_POST['social'] ?? null;
	if ( ! is_array( $raw_rows ) ) {
		return;
	}

	szPersistSocialSeoRows( $raw_rows );
}

// ─────────────────────────────────────────────────────────────────────────────
// AJAX HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'wp_ajax_sz_social_seo_autosave', function () {
	if ( ! current_user_can( 'edit_pages' ) ) {
		wp_send_json_error( [ 'message' => 'Insufficient permissions.' ], 403 );
	}

	check_ajax_referer( 'sz_social_seo_manager_save', 'nonce' );

	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
	if ( $post_id <= 0 ) {
		wp_send_json_error( [ 'message' => 'Invalid page.' ], 400 );
	}

	$row = [
		'title'       => isset( $_POST['title'] ) ? wp_unslash( (string) $_POST['title'] ) : '',
		'description' => isset( $_POST['description'] ) ? wp_unslash( (string) $_POST['description'] ) : '',
		'image_id'    => isset( $_POST['image_id'] ) ? (int) $_POST['image_id'] : 0,
	];

	$saved = szPersistSocialSeoRows( [ $post_id => $row ] );
	if ( empty( $saved ) ) {
		wp_send_json_error( [ 'message' => 'Nothing was saved.' ], 400 );
	}

	$meta = szGetSocialMetaForPage( $post_id, true );

	wp_send_json_success( [
		'post_id' => $post_id,
		'meta'    => $meta,
	] );
} );

// ─────────────────────────────────────────────────────────────────────────────
// RENDER ADMIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render SEO & Social manager admin page.
 */
function szRenderSocialSeoManager() {
	if ( ! current_user_can( 'edit_pages' ) ) {
		wp_die( 'Insufficient permissions.' );
	}

	$did_save = false;
	if ( isset( $_POST['sz_social_save_all'] ) ) {
		check_admin_referer( 'sz_social_seo_manager_save', 'sz_social_seo_manager_nonce' );
		szSaveSocialSeoManager();
		$did_save = true;
	}

	$pages = get_pages( [
		'post_status' => [ 'publish', 'draft', 'private', 'pending' ],
		'sort_column' => 'menu_order,post_title',
		'sort_order'  => 'ASC',
	] );

	$pages = array_values( array_filter( $pages, function ( $page ) {
		if ( ! ( $page instanceof WP_Post ) ) {
			return false;
		}

		if ( ! function_exists( 'get_field' ) ) {
			return true;
		}

		return ! (bool) get_field( 'container_only', $page->ID );
	} ) );

	// Calculate summary stats for all pages
	$stats = [
		'missing_title'         => 0,
		'missing_description'   => 0,
		'missing_image'         => 0,
		'too_long_title'        => 0,
		'too_long_description'  => 0,
		'broken_image'          => 0,
	];

	foreach ( $pages as $page ) {
		$post_id  = (int) $page->ID;
		$override = szGetSocialMetaForPage( $post_id, false );

		if ( empty( $override['title'] ) ) {
			$stats['missing_title']++;
		} elseif ( strlen( (string) $override['title'] ) > 60 ) {
			$stats['too_long_title']++;
		}

		if ( empty( $override['description'] ) ) {
			$stats['missing_description']++;
		} elseif ( strlen( (string) $override['description'] ) > 160 ) {
			$stats['too_long_description']++;
		}

		$image_id = (int) ( $override['image_id'] ?? 0 );
		if ( $image_id <= 0 ) {
			$stats['missing_image']++;
		}
	}

	?>
	<div class="wrap sz-social-seo-wrap">
		<h1>SEO &amp; Social Previews</h1>
		<p>Manage page title, page description, and featured image in one place. This editor uses the same fields as the single-page editor to keep SEO and social previews consistent.</p>
		<div class="sz-social-toolbar">
			<label for="sz-social-filter" class="screen-reader-text">Filter pages</label>
			<input id="sz-social-filter" type="search" class="regular-text" placeholder="Filter pages by title or path" />
			<button type="button" class="button" id="sz-expand-all">Expand All</button>
			<button type="button" class="button" id="sz-collapse-all">Collapse All</button>
			<span class="sz-autosave-status" aria-live="polite">Autosave ready</span>
			<span class="sz-filter-count" aria-live="polite"></span>
		</div>

		<?php if ( $did_save ) : ?>
			<div class="notice notice-success is-dismissible"><p>SEO &amp; social settings saved.</p></div>
		<?php endif; ?>

		<!-- Summary Stats Panel -->
		<?php if ( array_sum( array_values( $stats ) ) > 0 ) : ?>
			<div class="sz-summary-panel">
				<div class="sz-summary-title">Compliance Summary</div>
				<div class="sz-summary-badges">
					<?php if ( $stats['missing_title'] > 0 ) : ?>
						<div class="sz-summary-badge sz-badge-missing">
							<span class="sz-badge-icon">○</span>
							<span class="sz-badge-label"><?php echo esc_html( $stats['missing_title'] ); ?> page<?php echo $stats['missing_title'] !== 1 ? 's' : ''; ?> missing <strong>title</strong></span>
						</div>
					<?php endif; ?>
					<?php if ( $stats['missing_description'] > 0 ) : ?>
						<div class="sz-summary-badge sz-badge-missing">
							<span class="sz-badge-icon">○</span>
							<span class="sz-badge-label"><?php echo esc_html( $stats['missing_description'] ); ?> page<?php echo $stats['missing_description'] !== 1 ? 's' : ''; ?> missing <strong>description</strong></span>
						</div>
					<?php endif; ?>
					<?php if ( $stats['missing_image'] > 0 ) : ?>
						<div class="sz-summary-badge sz-badge-missing">
							<span class="sz-badge-icon">○</span>
							<span class="sz-badge-label"><?php echo esc_html( $stats['missing_image'] ); ?> page<?php echo $stats['missing_image'] !== 1 ? 's' : ''; ?> missing <strong>image</strong></span>
						</div>
					<?php endif; ?>
					<?php if ( $stats['too_long_title'] > 0 ) : ?>
						<div class="sz-summary-badge sz-badge-warning">
							<span class="sz-badge-icon">!</span>
							<span class="sz-badge-label"><?php echo esc_html( $stats['too_long_title'] ); ?> page<?php echo $stats['too_long_title'] !== 1 ? 's' : ''; ?> with <strong>title too long</strong> (>60 chars)</span>
						</div>
					<?php endif; ?>
					<?php if ( $stats['too_long_description'] > 0 ) : ?>
						<div class="sz-summary-badge sz-badge-warning">
							<span class="sz-badge-icon">!</span>
							<span class="sz-badge-label"><?php echo esc_html( $stats['too_long_description'] ); ?> page<?php echo $stats['too_long_description'] !== 1 ? 's' : ''; ?> with <strong>description too long</strong> (>160 chars)</span>
						</div>
					<?php endif; ?>
				</div>
			</div>
		<?php endif; ?>

		<form method="post">
			<?php wp_nonce_field( 'sz_social_seo_manager_save', 'sz_social_seo_manager_nonce' ); ?>
			<div class="sz-social-cards">
					<?php foreach ( $pages as $page ) : ?>
						<?php
						$post_id     = (int) $page->ID;
						$override    = szGetSocialMetaForPage( $post_id, false );
						$preview     = szGetSocialMetaForPage( $post_id, true );
						$page_url    = get_permalink( $post_id ) ?: '';
						$page_title  = (string) get_the_title( $post_id );
						$page_path   = '/' . ltrim( (string) get_page_uri( $post_id ), '/' );
						$page_permalink_label = $page_url !== '' ? $page_url : $page_path;
						$has_title           = ! empty( $override['title'] );
						$has_seo_description = ! empty( $override['description'] );
						$has_share_image     = (int) ( $override['image_id'] ?? 0 ) > 0;
						$preview_img = is_array( $preview['image'] ?? null ) && ! empty( $preview['image']['url'] )
							? (string) $preview['image']['url']
							: '';
						?>
						<section
							class="sz-social-row"
							data-post-id="<?php echo esc_attr( (string) $post_id ); ?>"
							data-base-title="<?php echo esc_attr( $page_title ); ?>"
							data-page-title="<?php echo esc_attr( strtolower( $page_title ) ); ?>"
							data-page-path="<?php echo esc_attr( strtolower( $page_permalink_label ) ); ?>"
							data-expanded="true"
						>
							<div class="sz-social-row__header">
								<div class="sz-social-row__titleblock">
									<strong class="sz-page-card-title"><?php echo esc_html( $page_title ); ?></strong>
									<small><?php echo esc_html( $page_permalink_label ); ?></small>
									<div class="sz-field-badges">
										<span class="sz-field-badge" data-field="title"><?php echo $has_title ? '✓' : '○'; ?> Title</span>
										<span class="sz-field-badge" data-field="description"><?php echo $has_seo_description ? '✓' : '○'; ?> Description</span>
										<span class="sz-field-badge" data-field="image"><?php echo $has_share_image ? '✓' : '○'; ?> Image</span>
									</div>
									<span class="sz-save-state" aria-live="polite">Saved</span>
									<a href="<?php echo esc_url( get_edit_post_link( $post_id, '' ) ?: '' ); ?>">Edit Page</a>
								</div>
								<button type="button" class="button sz-row-toggle" aria-expanded="true">Collapse</button>
							</div>
							<div class="sz-social-row__body">
								<div class="sz-social-fields-grid">
									<div class="sz-field-box">
										<label class="sz-field-label" for="sz-social-title-<?php echo esc_attr( (string) $post_id ); ?>">Title</label>
										<input
											id="sz-social-title-<?php echo esc_attr( (string) $post_id ); ?>"
									type="text"
									class="regular-text sz-social-title"
									name="social[<?php echo esc_attr( (string) $post_id ); ?>][title]"
									value="<?php echo esc_attr( (string) ( $override['title'] ?? '' ) ); ?>"
									placeholder="Page title shown in browser tabs, search results, and social shares"
								>
											<small>The title shown in browser tabs, search results, and social shares.</small>
										<div class="sz-char-guidance" data-kind="title">
									<small class="sz-char-item" data-limit="60">Google: <span class="sz-char-count">0</span>/60</small>
									<small class="sz-char-item" data-limit="88">Facebook: <span class="sz-char-count">0</span>/88</small>
									<small class="sz-char-item" data-limit="70">X: <span class="sz-char-count">0</span>/70</small>
										</div>
								</div>
									<div class="sz-field-box">
										<label class="sz-field-label" for="sz-social-description-<?php echo esc_attr( (string) $post_id ); ?>">Description</label>
										<textarea
											id="sz-social-description-<?php echo esc_attr( (string) $post_id ); ?>"
									rows="4"
									class="large-text sz-social-description"
									name="social[<?php echo esc_attr( (string) $post_id ); ?>][description]"
									placeholder="Page description shown in search engines and on social media"
								><?php echo esc_textarea( (string) ( $override['description'] ?? '' ) ); ?></textarea>
											<small>The page description shown in search results and on social media.</small>
										<div class="sz-char-guidance" data-kind="description">
									<small class="sz-char-item" data-limit="160">Google: <span class="sz-char-count">0</span>/160</small>
									<small class="sz-char-item" data-limit="200">Facebook: <span class="sz-char-count">0</span>/200</small>
									<small class="sz-char-item" data-limit="200">X: <span class="sz-char-count">0</span>/200</small>
										</div>
								</div>
									<div class="sz-field-box">
										<label class="sz-field-label" for="sz-social-image-url-<?php echo esc_attr( (string) $post_id ); ?>">Featured Image</label>
										<input
									type="hidden"
									class="sz-social-image-id"
									name="social[<?php echo esc_attr( (string) $post_id ); ?>][image_id]"
									value="<?php echo esc_attr( (string) ( $override['image_id'] ?? 0 ) ); ?>"
								>
										<input
											id="sz-social-image-url-<?php echo esc_attr( (string) $post_id ); ?>"
									type="text"
									class="regular-text sz-social-image-url"
									value="<?php echo esc_attr( $preview_img ); ?>"
									readonly
								>
										<p class="sz-image-actions">
									<button type="button" class="button sz-pick-image">Choose Image</button>
									<button type="button" class="button sz-clear-image">Clear</button>
								</p>
										<small>Used as the display image for social media link previews.</small>
									</div>
								</div>
								<div class="sz-preview-section">
									<div class="sz-preview-section__label">Live Previews</div>
									<div
									class="sz-preview-cards"
									data-default-title="<?php echo esc_attr( (string) ( $preview['title'] ?? '' ) ); ?>"
									data-default-description="<?php echo esc_attr( (string) ( $preview['description'] ?? '' ) ); ?>"
									data-url="<?php echo esc_attr( (string) $page_url ); ?>"
								>
									<div class="sz-card sz-card-google">
										<div class="sz-card-label">Google</div>
										<div class="sz-card-url"></div>
										<div class="sz-card-title"></div>
										<div class="sz-card-description"></div>
									</div>
									<div class="sz-card sz-card-facebook">
										<div class="sz-card-label">Facebook</div>
										<div class="sz-card-image-wrap"><img class="sz-card-image" alt="" /></div>
										<div class="sz-card-title"></div>
										<div class="sz-card-description"></div>
									</div>
									<div class="sz-card sz-card-twitter">
										<div class="sz-card-label">X (Twitter)</div>
										<div class="sz-card-image-wrap"><img class="sz-card-image" alt="" /></div>
										<div class="sz-card-title"></div>
										<div class="sz-card-description"></div>
									</div>
								</div>
								</div>
							</div>
						</section>
					<?php endforeach; ?>
			</div>

			<p style="margin-top:16px;">
				<button type="submit" name="sz_social_save_all" class="button button-primary button-large">Save All Changes</button>
			</p>
		</form>
	</div>

	<style>
		.sz-social-seo-wrap .sz-social-toolbar {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 10px;
			margin: 10px 0 14px;
		}
		.sz-social-seo-wrap .sz-social-cards {
			display: grid;
			gap: 16px;
		}
		.sz-social-seo-wrap .sz-social-row {
			border: 1px solid #d0d7de;
			border-radius: 14px;
			background: #ffffff;
			box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
			overflow: hidden;
		}
		.sz-social-seo-wrap .sz-social-row__header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			gap: 16px;
			padding: 16px 18px;
			background: linear-gradient(180deg, #fcfcfd 0%, #f8fafc 100%);
			border-bottom: 1px solid #eaecf0;
		}
		.sz-social-seo-wrap .sz-social-row__titleblock {
			display: grid;
			gap: 4px;
		}
		.sz-social-seo-wrap .sz-social-row__titleblock strong {
			font-size: 16px;
		}
		.sz-social-seo-wrap .sz-social-row__titleblock small {
			color: #667085;
		}
		.sz-social-seo-wrap .sz-field-badges {
			display: flex;
			gap: 6px;
			flex-wrap: wrap;
		}
		.sz-social-seo-wrap .sz-field-badge {
			display: inline-flex;
			align-items: center;
			gap: 3px;
			padding: 2px 10px;
			border-radius: 999px;
			font-size: 11px;
			font-weight: 600;
			line-height: 1.8;
			background: #e8eaed;
			color: #3c434a;
			transition: background 0.15s, color 0.15s;
		}
		.sz-social-seo-wrap .sz-field-badge.sz-badge-set {
			background: #d4f5dd;
			color: #155724;
		}
		.sz-social-seo-wrap .sz-field-badge.sz-badge-missing {
			background: #e8eaed;
			color: #3c434a;
		}
		.sz-social-seo-wrap .sz-field-badge.sz-badge-optional {
			background: #e8eaed;
			color: #3c434a;
		}
		.sz-social-seo-wrap .sz-field-badge.sz-badge-warning {
			background: #fdf0d5;
			color: #7a4f00;
		}
		.sz-social-seo-wrap .sz-social-row__body {
			padding: 18px;
			display: grid;
			gap: 18px;
		}
		.sz-social-seo-wrap .sz-social-row[data-expanded="false"] .sz-social-row__body {
			display: none;
		}
		.sz-social-seo-wrap .sz-social-fields-grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(280px, 1fr));
			gap: 16px;
		}
		.sz-social-seo-wrap .sz-field-box {
			display: grid;
			gap: 8px;
			padding: 14px;
			border: 1px solid #eaecf0;
			border-radius: 12px;
			background: #fbfdff;
			min-width: 0;
		}
		.sz-social-seo-wrap .sz-field-label {
			font-size: 12px;
			font-weight: 600;
			letter-spacing: 0.02em;
			color: #344054;
		}
		.sz-social-seo-wrap .sz-field-box input[type="text"],
		.sz-social-seo-wrap .sz-field-box textarea {
			width: 100%;
			max-width: none;
		}
		.sz-social-seo-wrap .sz-image-actions {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
			margin: 0;
		}
		.sz-social-seo-wrap .sz-summary-panel {
			margin: 16px 0;
			padding: 16px;
			border: 1px solid #e8e8e8;
			border-radius: 8px;
			background: #fbfcfd;
		}
		.sz-social-seo-wrap .sz-summary-title {
			font-size: 14px;
			font-weight: 600;
			color: #344054;
			margin-bottom: 12px;
		}
		.sz-social-seo-wrap .sz-summary-badges {
			display: grid;
			gap: 10px;
		}
		.sz-social-seo-wrap .sz-summary-badge {
			display: flex;
			align-items: flex-start;
			gap: 10px;
			padding: 10px 12px;
			border-radius: 8px;
			font-size: 13px;
			line-height: 1.5;
		}
		.sz-social-seo-wrap .sz-summary-badge.sz-badge-missing {
			background: #fef3f2;
			border: 1px solid #fecdca;
			color: #7a271a;
		}
		.sz-social-seo-wrap .sz-summary-badge.sz-badge-warning {
			background: #fdf8f3;
			border: 1px solid #fed3b5;
			color: #7a4f00;
		}
		.sz-social-seo-wrap .sz-badge-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 20px;
			height: 20px;
			min-width: 20px;
			border-radius: 4px;
			font-size: 11px;
			font-weight: 700;
			background: rgba(0,0,0,0.08);
		}
		.sz-social-seo-wrap .sz-summary-badge.sz-badge-missing .sz-badge-icon {
			background: #d32f2f;
			color: white;
		}
		.sz-social-seo-wrap .sz-summary-badge.sz-badge-warning .sz-badge-icon {
			background: #f57c00;
			color: white;
		}
		.sz-social-seo-wrap .sz-badge-label {
			flex: 1;
		}
		.sz-social-seo-wrap .sz-image-broken-badge {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 18px;
			height: 18px;
			margin-left: 6px;
			border-radius: 3px;
			background: #d32f2f;
			color: white;
			font-size: 10px;
			font-weight: 700;
			cursor: help;
			title: "Image URL is broken or inaccessible";
		}
		.sz-social-seo-wrap .sz-filter-count {
			color: #50575e;
			font-size: 12px;
		}
		.sz-social-seo-wrap .sz-autosave-status,
		.sz-social-seo-wrap .sz-save-state {
			font-size: 12px;
			color: #667085;
		}
		.sz-social-seo-wrap .sz-autosave-status.sz-state-saving,
		.sz-social-seo-wrap .sz-save-state.sz-state-saving {
			color: #8a6d3b;
		}
		.sz-social-seo-wrap .sz-autosave-status.sz-state-saved,
		.sz-social-seo-wrap .sz-save-state.sz-state-saved {
			color: #155724;
		}
		.sz-social-seo-wrap .sz-autosave-status.sz-state-error,
		.sz-social-seo-wrap .sz-save-state.sz-state-error {
			color: #b32d2e;
		}
		.sz-social-seo-wrap .sz-status-badge {
			display: inline-block;
			margin-left: 8px;
			padding: 2px 8px;
			border-radius: 999px;
			font-size: 11px;
			line-height: 1.7;
			font-weight: 600;
			vertical-align: middle;
		}
		.sz-social-seo-wrap .sz-status-complete {
			background: #d4f5dd;
			color: #155724;
		}
		.sz-social-seo-wrap .sz-status-incomplete {
			background: #e8eaed;
			color: #3c434a;
		}
		.sz-social-seo-wrap .sz-char-guidance {
			display: grid;
			gap: 2px;
			margin-top: 6px;
		}
		.sz-social-seo-wrap .sz-char-item {
			color: #50575e;
		}
		.sz-social-seo-wrap .sz-char-item.sz-near-limit {
			color: #8a6d3b;
		}
		.sz-social-seo-wrap .sz-char-item.sz-over-limit {
			color: #b32d2e;
		}
		.sz-social-seo-wrap .sz-preview-cards {
			display: grid;
			grid-template-columns: repeat(3, minmax(260px, 1fr));
			gap: 12px;
		}
		.sz-social-seo-wrap .sz-preview-section {
			display: grid;
			gap: 10px;
		}
		.sz-social-seo-wrap .sz-preview-section__label {
			font-size: 12px;
			font-weight: 600;
			letter-spacing: 0.02em;
			color: #344054;
		}
		.sz-social-seo-wrap .sz-card {
			border: 1px solid #dcdcde;
			border-radius: 12px;
			padding: 12px;
			background: #fff;
			min-width: 0;
		}
		.sz-social-seo-wrap .sz-card-label {
			font-size: 11px;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: #666;
			margin-bottom: 4px;
		}
		.sz-social-seo-wrap .sz-card-url {
			font-size: 12px;
			color: #188038;
			margin-bottom: 3px;
			word-break: break-word;
		}
		.sz-social-seo-wrap .sz-card-title {
			font-weight: 600;
			color: #1a0dab;
			margin-bottom: 3px;
		}
		.sz-social-seo-wrap .sz-card-description {
			font-size: 12px;
			color: #4d5156;
		}
		.sz-social-seo-wrap .sz-card-image-wrap {
			display: none;
			margin-bottom: 6px;
			background: #f2f2f2;
			border-radius: 6px;
			overflow: hidden;
		}
		.sz-social-seo-wrap .sz-card-image-wrap.sz-has-image {
			display: block;
		}
		.sz-social-seo-wrap .sz-card-image {
			display: block;
			width: 100%;
			height: 160px;
			object-fit: cover;
		}
		@media screen and (max-width: 1200px) {
			.sz-social-seo-wrap .sz-preview-cards {
				grid-template-columns: 1fr;
			}
		}
		@media screen and (max-width: 900px) {
			.sz-social-seo-wrap .sz-social-fields-grid {
				grid-template-columns: 1fr;
			}
			.sz-social-seo-wrap .sz-social-row__header {
				flex-direction: column;
			}
		}
	</style>

	<script>
	(function () {
		'use strict';

		var AJAX_URL = <?php echo wp_json_encode( admin_url( 'admin-ajax.php' ) ); ?>;
		var AUTOSAVE_NONCE = <?php echo wp_json_encode( wp_create_nonce( 'sz_social_seo_manager_save' ) ); ?>;
		var autosaveTimers = {};
		var autosaveRequests = {};
		var dirtyRows = {};
		var autosaveStatus = document.querySelector('.sz-autosave-status');
		var isFormSubmitting = false;

		var PREVIEW_LIMITS = {
			google: { title: 60, description: 160 },
			facebook: { title: 88, description: 200 },
			twitter: { title: 70, description: 200 }
		};

		var RECOMMENDED_LIMITS = {
			title: Math.min(PREVIEW_LIMITS.google.title, PREVIEW_LIMITS.facebook.title, PREVIEW_LIMITS.twitter.title),
			description: Math.min(PREVIEW_LIMITS.google.description, PREVIEW_LIMITS.facebook.description, PREVIEW_LIMITS.twitter.description)
		};

		function truncate(text, max) {
			if (!text) return '';
			if (text.length <= max) return text;
			return text.slice(0, max - 1).trimEnd() + '…';
		}

		function hasInvalidText(value, fieldType) {
			if (!value) return false;
			if (/[<>]/.test(value)) return true;
			if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) return true;
			return false;
		}

		function isLikelyValidImageUrl(value) {
			if (!value) return true;
			try {
				var parsed = new URL(value, window.location.origin);
				return parsed.protocol === 'http:' || parsed.protocol === 'https:';
			} catch (e) {
				return false;
			}
		}

		function hasUnsavedChanges() {
			if (Object.keys(dirtyRows).length > 0) return true;
			if (Object.keys(autosaveTimers).length > 0) return true;
			if (Object.keys(autosaveRequests).length > 0) return true;
			return false;
		}

		function setGlobalAutosaveStatus(text, state) {
			if (!autosaveStatus) return;
			autosaveStatus.textContent = text;
			autosaveStatus.classList.remove('sz-state-saving', 'sz-state-saved', 'sz-state-error');
			if (state) autosaveStatus.classList.add(state);
		}

		function setRowSaveState(row, text, state) {
			var saveState = row.querySelector('.sz-save-state');
			if (!saveState) return;
			saveState.textContent = text;
			saveState.classList.remove('sz-state-saving', 'sz-state-saved', 'sz-state-error');
			if (state) saveState.classList.add(state);
		}

		function collectRowPayload(row) {
			var postId = row.getAttribute('data-post-id') || '';
			var title = row.querySelector('.sz-social-title');
			var description = row.querySelector('.sz-social-description');
			var imageId = row.querySelector('.sz-social-image-id');

			return {
				post_id: postId,
				title: title ? title.value : '',
				description: description ? description.value : '',
				image_id: imageId ? imageId.value : '0'
			};
		}

		function syncRowHeaderTitle(row, nextTitle) {
			var titleEl = row.querySelector('.sz-page-card-title');
			var safeTitle = (nextTitle || '').trim();

			if (!safeTitle) return;

			if (titleEl) {
				titleEl.textContent = safeTitle;
			}

			row.setAttribute('data-page-title', safeTitle.toLowerCase());
		}

		function saveRow(row) {
			var payload = collectRowPayload(row);
			if (!payload.post_id) return;

			if (autosaveRequests[payload.post_id]) {
				autosaveRequests[payload.post_id].abort();
			}

			setRowSaveState(row, 'Saving…', 'sz-state-saving');
			setGlobalAutosaveStatus('Saving changes…', 'sz-state-saving');

			var formData = new FormData();
			formData.append('action', 'sz_social_seo_autosave');
			formData.append('nonce', AUTOSAVE_NONCE);
			formData.append('post_id', payload.post_id);
			formData.append('title', payload.title);
			formData.append('description', payload.description);
			formData.append('image_id', payload.image_id);

			var controller = new AbortController();
			autosaveRequests[payload.post_id] = controller;

			fetch(AJAX_URL, {
				method: 'POST',
				body: formData,
				signal: controller.signal,
				credentials: 'same-origin'
			})
				.then(function (response) { return response.json(); })
				.then(function (result) {
					if (!result || !result.success) {
						throw new Error((result && result.data && result.data.message) || 'Autosave failed.');
					}

					var savedMeta = result && result.data && result.data.meta ? result.data.meta : null;
					if (savedMeta && typeof savedMeta.title === 'string' && savedMeta.title.trim()) {
						var canonicalTitle = savedMeta.title.trim();
						row.setAttribute('data-base-title', canonicalTitle);
						syncRowHeaderTitle(row, canonicalTitle);

						var cards = row.querySelector('.sz-preview-cards');
						if (cards) {
							cards.setAttribute('data-default-title', canonicalTitle);
						}
					}

					delete dirtyRows[payload.post_id];
					delete autosaveTimers[payload.post_id];
					setRowSaveState(row, 'Saved', 'sz-state-saved');
					setGlobalAutosaveStatus('All changes saved', 'sz-state-saved');
				})
				.catch(function (error) {
					if (error && error.name === 'AbortError') return;
					dirtyRows[payload.post_id] = true;
					setRowSaveState(row, 'Save failed', 'sz-state-error');
					setGlobalAutosaveStatus('Autosave failed', 'sz-state-error');
				})
				.finally(function () {
					if (autosaveRequests[payload.post_id] === controller) {
						delete autosaveRequests[payload.post_id];
					}
				});
		}

		function scheduleAutosave(row) {
			var postId = row.getAttribute('data-post-id');
			if (!postId) return;
			if (autosaveTimers[postId]) {
				window.clearTimeout(autosaveTimers[postId]);
			}
			dirtyRows[postId] = true;
			setRowSaveState(row, 'Unsaved changes', null);
			setGlobalAutosaveStatus('Unsaved changes', null);
			autosaveTimers[postId] = window.setTimeout(function () {
				saveRow(row);
			}, 700);
		}

		function updateRowPreview(row) {
			var titleInput = row.querySelector('.sz-social-title');
			var descInput = row.querySelector('.sz-social-description');
			var imageIdInput = row.querySelector('.sz-social-image-id');
			var imgUrlInput = row.querySelector('.sz-social-image-url');
			var statusBadge = row.querySelector('.sz-status-badge');
			var cards = row.querySelector('.sz-preview-cards');

			if (!cards) return;

			var defaultTitle = cards.getAttribute('data-default-title') || '';
			var defaultDescription = cards.getAttribute('data-default-description') || '';
			var pageUrl = cards.getAttribute('data-url') || '';
			var baseTitle = row.getAttribute('data-base-title') || defaultTitle;

			var title = (titleInput && titleInput.value.trim()) || defaultTitle;
			var description = (descInput && descInput.value.trim()) || defaultDescription;
			var cardHeadingTitle = (titleInput && titleInput.value.trim()) || baseTitle;
			syncRowHeaderTitle(row, cardHeadingTitle);
			var hasTitle = titleInput && titleInput.value.trim().length > 0;
			var hasSeoDescription = descInput && descInput.value.trim().length > 0;
			var hasShareImage = imageIdInput && imageIdInput.value.trim().length > 0 && imageIdInput.value.trim() !== '0';
			var imageUrl = (imgUrlInput && imgUrlInput.value.trim()) || '';

			var titleInvalid = hasTitle && (hasInvalidText(title, 'title') || title.length > RECOMMENDED_LIMITS.title);
			var descriptionInvalid = hasSeoDescription && (hasInvalidText(description, 'description') || description.length > RECOMMENDED_LIMITS.description);
			var imageInvalid = hasShareImage && !isLikelyValidImageUrl(imageUrl);

			var fieldBadgeStates = {
				title: !hasTitle ? 'optional' : (titleInvalid ? 'warning' : 'set'),
				description: !hasSeoDescription ? 'optional' : (descriptionInvalid ? 'warning' : 'set'),
				image: !hasShareImage ? 'optional' : (imageInvalid ? 'warning' : 'set')
			};

			row.querySelectorAll('.sz-field-badge').forEach(function (badge) {
				var field = badge.getAttribute('data-field');
				if (!field || !fieldBadgeStates[field]) return;
				var state = fieldBadgeStates[field];
				badge.classList.remove('sz-badge-set', 'sz-badge-missing', 'sz-badge-optional', 'sz-badge-warning');
				badge.classList.add('sz-badge-' + state);
				var icon = state === 'set' ? '✓' : (state === 'warning' ? '!' : '○');
				badge.textContent = icon + ' ' + field.charAt(0).toUpperCase() + field.slice(1);
			});

			updateCounters(row, title, description);

			cards.querySelectorAll('.sz-card-google .sz-card-url').forEach(function (el) {
				el.textContent = pageUrl;
			});

			var googleCard = cards.querySelector('.sz-card-google');
			if (googleCard) {
				var googleTitle = googleCard.querySelector('.sz-card-title');
				var googleDescription = googleCard.querySelector('.sz-card-description');
				if (googleTitle) googleTitle.textContent = truncate(title, PREVIEW_LIMITS.google.title);
				if (googleDescription) googleDescription.textContent = truncate(description, PREVIEW_LIMITS.google.description);
			}

			var facebookCard = cards.querySelector('.sz-card-facebook');
			if (facebookCard) {
				var facebookTitle = facebookCard.querySelector('.sz-card-title');
				var facebookDescription = facebookCard.querySelector('.sz-card-description');
				if (facebookTitle) facebookTitle.textContent = truncate(title, PREVIEW_LIMITS.facebook.title);
				if (facebookDescription) facebookDescription.textContent = truncate(description, PREVIEW_LIMITS.facebook.description);
			}

			var twitterCard = cards.querySelector('.sz-card-twitter');
			if (twitterCard) {
				var twitterTitle = twitterCard.querySelector('.sz-card-title');
				var twitterDescription = twitterCard.querySelector('.sz-card-description');
				if (twitterTitle) twitterTitle.textContent = truncate(title, PREVIEW_LIMITS.twitter.title);
				if (twitterDescription) twitterDescription.textContent = truncate(description, PREVIEW_LIMITS.twitter.description);
			}

			cards.querySelectorAll('.sz-card-image').forEach(function (img) {
				var wrap = img.closest('.sz-card-image-wrap');
				if (!wrap) return;
				if (imageUrl) {
					img.src = imageUrl;
					wrap.classList.add('sz-has-image');
				} else {
					img.removeAttribute('src');
					wrap.classList.remove('sz-has-image');
				}
			});
		}

		function updateCounters(row, titleValue, descriptionValue) {
			var titleLength = (titleValue || '').length;
			var descriptionLength = (descriptionValue || '').length;

			row.querySelectorAll('.sz-char-guidance[data-kind="title"] .sz-char-item').forEach(function (item) {
				var limit = parseInt(item.getAttribute('data-limit') || '0', 10);
				var countEl = item.querySelector('.sz-char-count');
				if (countEl) countEl.textContent = String(titleLength);
				item.classList.toggle('sz-near-limit', limit > 0 && titleLength >= Math.floor(limit * 0.9) && titleLength <= limit);
				item.classList.toggle('sz-over-limit', limit > 0 && titleLength > limit);
			});

			row.querySelectorAll('.sz-char-guidance[data-kind="description"] .sz-char-item').forEach(function (item) {
				var limit = parseInt(item.getAttribute('data-limit') || '0', 10);
				var countEl = item.querySelector('.sz-char-count');
				if (countEl) countEl.textContent = String(descriptionLength);
				item.classList.toggle('sz-near-limit', limit > 0 && descriptionLength >= Math.floor(limit * 0.9) && descriptionLength <= limit);
				item.classList.toggle('sz-over-limit', limit > 0 && descriptionLength > limit);
			});
		}

		function bindImagePicker(row) {
			var pickBtn = row.querySelector('.sz-pick-image');
			var clearBtn = row.querySelector('.sz-clear-image');
			var imageIdInput = row.querySelector('.sz-social-image-id');
			var imageUrlInput = row.querySelector('.sz-social-image-url');

			if (pickBtn) {
				pickBtn.addEventListener('click', function () {
					if (!window.wp || !window.wp.media) {
						return;
					}

					var postId = parseInt(row.getAttribute('data-post-id') || '0', 10);
					var frame = window.wp.media({
						title: 'Choose Social Preview Image',
						button: { text: 'Use this image' },
						multiple: false,
						post: postId || undefined,
					});

					frame.on('select', function () {
						var media = frame.state().get('selection').first().toJSON();
						if (imageIdInput) imageIdInput.value = String(media.id || '');
						if (imageUrlInput) imageUrlInput.value = media.url || '';
						updateRowPreview(row);
						validateImageInRow(row);
						scheduleAutosave(row);
					});

					frame.open();
				});
			}

			if (clearBtn) {
				clearBtn.addEventListener('click', function () {
					if (imageIdInput) imageIdInput.value = '';
					if (imageUrlInput) imageUrlInput.value = '';
					updateRowPreview(row);
					scheduleAutosave(row);
				});
			}
		}

		function validateImageInRow(row) {
			var imageUrlInput = row.querySelector('.sz-social-image-url');
			if (!imageUrlInput) return;

			var imageUrl = (imageUrlInput.value || '').trim();
			if (!imageUrl) return;

			var imageBadge = row.querySelector('.sz-image-broken-badge');
			if (imageBadge) {
				imageBadge.remove();
			}

			if (!isLikelyValidImageUrl(imageUrl)) {
				var newBadge = document.createElement('span');
				newBadge.className = 'sz-image-broken-badge';
				newBadge.textContent = '!';
				newBadge.title = 'Image URL appears to be broken or inaccessible';
				imageUrlInput.parentElement.insertBefore(newBadge, imageUrlInput.nextSibling);
				return;
			}

			var img = new Image();
			var timeout = window.setTimeout(function () {
				img.onload = img.onerror = null;
				var badge = document.createElement('span');
				badge.className = 'sz-image-broken-badge';
				badge.textContent = '!';
				badge.title = 'Image URL is not accessible (timed out after 5s)';
				imageUrlInput.parentElement.insertBefore(badge, imageUrlInput.nextSibling);
			}, 5000);

			img.onload = function () {
				window.clearTimeout(timeout);
			};

			img.onerror = function () {
				window.clearTimeout(timeout);
				var badge = document.createElement('span');
				badge.className = 'sz-image-broken-badge';
				badge.textContent = '!';
				badge.title = 'Image URL is broken or inaccessible';
				imageUrlInput.parentElement.insertBefore(badge, imageUrlInput.nextSibling);
			};

			img.src = imageUrl;
		}

		function setRowExpanded(row, expanded) {
			if (!row) return;
			row.setAttribute('data-expanded', expanded ? 'true' : 'false');
			var toggle = row.querySelector('.sz-row-toggle');
			if (toggle) {
				toggle.textContent = expanded ? 'Collapse' : 'Expand';
				toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			}
		}

		function bindRowToggle(row) {
			var toggle = row.querySelector('.sz-row-toggle');
			if (!toggle) return;

			toggle.addEventListener('click', function () {
				var expanded = row.getAttribute('data-expanded') !== 'false';
				setRowExpanded(row, !expanded);
			});
		}

		function filterRows() {
			var filterInput = document.getElementById('sz-social-filter');
			var countEl = document.querySelector('.sz-filter-count');
			if (!filterInput) return;

			var query = (filterInput.value || '').trim().toLowerCase();
			var visible = 0;
			var total = 0;

			document.querySelectorAll('.sz-social-row').forEach(function (row) {
				total += 1;
				var title = row.getAttribute('data-page-title') || '';
				var path = row.getAttribute('data-page-path') || '';
				var match = !query || title.indexOf(query) !== -1 || path.indexOf(query) !== -1;
				row.style.display = match ? '' : 'none';
				if (match) {
					visible += 1;
					if (query) setRowExpanded(row, true);
				}
			});

			if (countEl) {
				countEl.textContent = visible + ' of ' + total + ' pages shown';
			}
		}

		window.addEventListener('beforeunload', function (event) {
			if (isFormSubmitting || !hasUnsavedChanges()) return;
			event.preventDefault();
			event.returnValue = '';
		});

		document.querySelectorAll('.sz-social-row').forEach(function (row) {
			row.querySelectorAll('.sz-social-title, .sz-social-description, .sz-social-image-url').forEach(function (input) {
				input.addEventListener('input', function () {
					updateRowPreview(row);
					scheduleAutosave(row);
				});
			});

			bindRowToggle(row);
			bindImagePicker(row);
			setRowSaveState(row, 'Saved', 'sz-state-saved');
			updateRowPreview(row);
			validateImageInRow(row);
		});

		var socialForm = document.querySelector('.sz-social-seo-wrap form');
		if (socialForm) {
			socialForm.addEventListener('submit', function () {
				isFormSubmitting = true;
			});
		}

		var expandAllBtn = document.getElementById('sz-expand-all');
		if (expandAllBtn) {
			expandAllBtn.addEventListener('click', function () {
				document.querySelectorAll('.sz-social-row').forEach(function (row) {
					setRowExpanded(row, true);
				});
			});
		}

		var collapseAllBtn = document.getElementById('sz-collapse-all');
		if (collapseAllBtn) {
			collapseAllBtn.addEventListener('click', function () {
				document.querySelectorAll('.sz-social-row').forEach(function (row) {
					setRowExpanded(row, false);
				});
			});
		}

		var filterInput = document.getElementById('sz-social-filter');
		if (filterInput) {
			filterInput.addEventListener('input', filterRows);
		}
		filterRows();
	})();
	</script>
	<?php
}
