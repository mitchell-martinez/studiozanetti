<?php
/**
 * Plugin Name:  Studio Zanetti - Site Menu Manager
 * Description:  Adds a visual, autosaving menu board to Appearance > Menus.
 * Version:      1.0.0
 * Author:       Studio Zanetti Dev
 *
 * Copy this file and the assets/site-menu-manager files into wp-content/mu-plugins.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the visual menu manager beneath Appearance.
 */
function sz_site_menu_manager_register_page() {
	add_submenu_page(
		'themes.php',
		__( 'Site Menus', 'studio-zanetti' ),
		__( 'Site Menus', 'studio-zanetti' ),
		'edit_theme_options',
		'sz-site-menu-manager',
		'sz_site_menu_manager_render_page'
	);
}
add_action( 'admin_menu', 'sz_site_menu_manager_register_page' );

/**
 * Add the manager to the tabs on WordPress's native Menus screen.
 */
function sz_site_menu_manager_add_native_tab() {
	$url = admin_url( 'themes.php?page=sz-site-menu-manager' );
	?>
	<script>
	(function () {
		var tabs = document.querySelector('.nav-tab-wrapper');
		if (!tabs || tabs.querySelector('[data-sz-site-menus-tab]')) {
			return;
		}

		var tab = document.createElement('a');
		tab.className = 'nav-tab';
		tab.href = <?php echo wp_json_encode( $url ); ?>;
		tab.textContent = <?php echo wp_json_encode( __( 'Site Menus', 'studio-zanetti' ) ); ?>;
		tab.setAttribute('data-sz-site-menus-tab', 'true');
		tabs.appendChild(tab);
	}());
	</script>
	<?php
}
add_action( 'admin_footer-nav-menus.php', 'sz_site_menu_manager_add_native_tab' );

/**
 * Load the manager assets only on its admin screen.
 */
function sz_site_menu_manager_enqueue_assets( $hook ) {
	if ( 'appearance_page_sz-site-menu-manager' !== $hook ) {
		return;
	}

	$script_path = __DIR__ . '/assets/site-menu-manager.js';
	$style_path  = __DIR__ . '/assets/site-menu-manager.css';

	wp_enqueue_style( 'dashicons' );
	wp_enqueue_style(
		'sz-site-menu-manager',
		plugins_url( 'assets/site-menu-manager.css', __FILE__ ),
		[],
		file_exists( $style_path ) ? filemtime( $style_path ) : '1.0.0'
	);

	wp_enqueue_script( 'jquery-ui-sortable' );
	wp_enqueue_script(
		'sz-site-menu-manager',
		plugins_url( 'assets/site-menu-manager.js', __FILE__ ),
		[ 'jquery', 'jquery-ui-sortable' ],
		file_exists( $script_path ) ? filemtime( $script_path ) : '1.0.0',
		true
	);

	$locations = get_nav_menu_locations();

	wp_localize_script( 'sz-site-menu-manager', 'szSiteMenuManager', [
		'ajaxUrl' => admin_url( 'admin-ajax.php' ),
		'nonce'   => wp_create_nonce( 'sz_site_menu_manager' ),
		'primaryMenuId' => isset( $locations['primary'] ) ? (int) $locations['primary'] : 0,
		'strings' => [
			'idle'        => __( 'All changes saved', 'studio-zanetti' ),
			'saving'      => __( 'Saving...', 'studio-zanetti' ),
			'saveError'   => __( 'Changes could not be saved. Try moving the item again.', 'studio-zanetti' ),
			'creating'    => __( 'Creating menu...', 'studio-zanetti' ),
			'createError' => __( 'The menu could not be created.', 'studio-zanetti' ),
			'viewing'     => __( 'Viewing %s', 'studio-zanetti' ),
			'expand'      => __( 'Expand preview', 'studio-zanetti' ),
			'collapse'    => __( 'Restore preview width', 'studio-zanetti' ),
		],
	] );
}
add_action( 'admin_enqueue_scripts', 'sz_site_menu_manager_enqueue_assets' );

/**
 * Return published and editable non-published pages for the board.
 */
function sz_site_menu_manager_get_pages() {
	return get_posts( [
		'post_type'      => 'page',
		'post_status'    => [ 'publish', 'draft', 'pending', 'private', 'future' ],
		'posts_per_page' => -1,
		'orderby'        => 'title',
		'order'          => 'ASC',
	] );
}

/**
 * Build the front-end preview URL already used by the page editor.
 */
function sz_site_menu_manager_get_preview_url( $page_id ) {
	$page = get_post( $page_id );

	if ( $page && 'publish' === $page->post_status && defined( 'SZ_FRONTEND_URL' ) ) {
		$page_path = trim( (string) get_page_uri( $page_id ), '/' );
		return rtrim( SZ_FRONTEND_URL, '/' ) . ( '' !== $page_path ? '/' . $page_path : '/' );
	}

	if ( $page && defined( 'SZ_FRONTEND_URL' ) && defined( 'SZ_PREVIEW_SECRET' ) ) {
		return add_query_arg(
			[
				'id'     => (int) $page_id,
				'secret' => SZ_PREVIEW_SECRET,
				'iframe' => 'true',
			],
			rtrim( SZ_FRONTEND_URL, '/' ) . '/preview'
		);
	}

	return get_permalink( $page_id );
}

/**
 * Render one draggable item card.
 */
function sz_site_menu_manager_render_card( $item, $menus, $current_menu_id = 0, $has_primary_menu = true ) {
	$page_id    = isset( $item['page_id'] ) ? (int) $item['page_id'] : 0;
	$title      = isset( $item['title'] ) ? $item['title'] : '';
	$type_label = isset( $item['type_label'] ) ? $item['type_label'] : __( 'Page', 'studio-zanetti' );
	$preview    = isset( $item['preview_url'] ) ? $item['preview_url'] : '';
	$client_id  = 'page-' . $page_id;
	?>
	<li
		class="sz-site-menu-card"
		data-page-id="<?php echo esc_attr( $page_id ); ?>"
		data-client-id="<?php echo esc_attr( $client_id ); ?>"
	>
		<div class="sz-site-menu-card__main">
			<span class="dashicons dashicons-menu sz-site-menu-card__handle" aria-hidden="true"></span>
			<?php if ( $preview ) : ?>
				<button
					type="button"
					class="sz-site-menu-card__preview"
					data-preview-url="<?php echo esc_url( $preview ); ?>"
					data-page-title="<?php echo esc_attr( $title ); ?>"
				>
					<span class="sz-site-menu-card__title"><?php echo esc_html( $title ); ?></span>
					<span class="sz-site-menu-card__type"><?php echo esc_html( $type_label ); ?></span>
				</button>
			<?php else : ?>
				<span class="sz-site-menu-card__copy">
					<span class="sz-site-menu-card__title"><?php echo esc_html( $title ); ?></span>
					<span class="sz-site-menu-card__type"><?php echo esc_html( $type_label ); ?></span>
				</span>
			<?php endif; ?>
		</div>
		<div class="sz-site-menu-card__actions">
			<label class="screen-reader-text" for="sz-move-<?php echo esc_attr( $client_id ); ?>">
				<?php echo esc_html( sprintf( __( 'Move %s to another menu', 'studio-zanetti' ), $title ) ); ?>
			</label>
			<select id="sz-move-<?php echo esc_attr( $client_id ); ?>" class="sz-site-menu-card__move">
				<?php if ( ! $has_primary_menu || 0 === $current_menu_id ) : ?>
					<option value="0" <?php selected( 0, $current_menu_id ); ?>><?php esc_html_e( 'Unassigned pages', 'studio-zanetti' ); ?></option>
				<?php endif; ?>
				<?php foreach ( $menus as $menu ) : ?>
					<option value="<?php echo esc_attr( $menu->term_id ); ?>" <?php selected( (int) $menu->term_id, $current_menu_id ); ?>>
						<?php echo esc_html( $menu->name ); ?>
					</option>
				<?php endforeach; ?>
			</select>
			<button type="button" class="button-link sz-site-menu-card__order" data-direction="up" title="<?php esc_attr_e( 'Move up', 'studio-zanetti' ); ?>">
				<span class="dashicons dashicons-arrow-up-alt2" aria-hidden="true"></span>
				<span class="screen-reader-text"><?php esc_html_e( 'Move up', 'studio-zanetti' ); ?></span>
			</button>
			<button type="button" class="button-link sz-site-menu-card__order" data-direction="down" title="<?php esc_attr_e( 'Move down', 'studio-zanetti' ); ?>">
				<span class="dashicons dashicons-arrow-down-alt2" aria-hidden="true"></span>
				<span class="screen-reader-text"><?php esc_html_e( 'Move down', 'studio-zanetti' ); ?></span>
			</button>
		</div>
	</li>
	<?php
}

/**
 * Render the Appearance > Site Menus board.
 */
function sz_site_menu_manager_render_page() {
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to manage menus.', 'studio-zanetti' ) );
	}

	$menus          = wp_get_nav_menus( [ 'orderby' => 'name' ] );
	$pages          = sz_site_menu_manager_get_pages();
	$locations      = get_nav_menu_locations();
	$location_names = get_registered_nav_menus();
	$menu_cards     = [];
	$unassigned     = [];
	$primary_menu_id = isset( $locations['primary'] ) ? (int) $locations['primary'] : 0;

	foreach ( $menus as $menu ) {
		$menu_cards[ $menu->term_id ] = [];
	}

	foreach ( $pages as $page ) {
		$override = function_exists( 'get_field' ) ? (string) get_field( 'menu_override', $page->ID ) : (string) get_post_meta( $page->ID, 'menu_override', true );
		$override = sanitize_title( $override );
		$target_menu_id = 0;

		if ( '' === $override && $primary_menu_id > 0 ) {
			$target_menu_id = $primary_menu_id;
		} else {
			foreach ( $menus as $menu ) {
				if ( $override === $menu->slug ) {
					$target_menu_id = (int) $menu->term_id;
					break;
				}
			}
		}

		$card = [
			'page_id'     => (int) $page->ID,
			'title'       => get_the_title( $page ),
			'type_label'  => ucfirst( $page->post_status ) . ' ' . __( 'page', 'studio-zanetti' ),
			'preview_url' => sz_site_menu_manager_get_preview_url( $page->ID ),
		];

		if ( $target_menu_id > 0 && isset( $menu_cards[ $target_menu_id ] ) ) {
			$menu_cards[ $target_menu_id ][] = $card;
		} else {
			$unassigned[] = $card;
		}
	}

	$order_cards = function ( $left, $right ) {
		$left_order  = (int) get_post_meta( $left['page_id'], '_sz_site_menu_manager_order', true );
		$right_order = (int) get_post_meta( $right['page_id'], '_sz_site_menu_manager_order', true );

		if ( $left_order === $right_order ) {
			return strcasecmp( $left['title'], $right['title'] );
		}

		return $left_order <=> $right_order;
	};

	usort( $unassigned, $order_cards );
	foreach ( $menu_cards as &$cards ) {
		usort( $cards, $order_cards );
	}
	unset( $cards );
	?>
	<div class="wrap sz-site-menu-manager">
		<h1><?php esc_html_e( 'Menus', 'studio-zanetti' ); ?></h1>
		<nav class="nav-tab-wrapper wp-clearfix" aria-label="<?php esc_attr_e( 'Secondary menu', 'studio-zanetti' ); ?>">
			<a href="<?php echo esc_url( admin_url( 'nav-menus.php' ) ); ?>" class="nav-tab"><?php esc_html_e( 'Edit Menus', 'studio-zanetti' ); ?></a>
			<a href="<?php echo esc_url( admin_url( 'nav-menus.php?action=locations' ) ); ?>" class="nav-tab"><?php esc_html_e( 'Manage Locations', 'studio-zanetti' ); ?></a>
			<a href="<?php echo esc_url( admin_url( 'themes.php?page=sz-site-menu-manager' ) ); ?>" class="nav-tab nav-tab-active" aria-current="page"><?php esc_html_e( 'Site Menus', 'studio-zanetti' ); ?></a>
		</nav>

		<div class="sz-site-menu-toolbar">
			<form id="sz-site-menu-create" class="sz-site-menu-create">
				<label>
					<span><?php esc_html_e( 'Site name', 'studio-zanetti' ); ?></span>
					<input type="text" name="name" required placeholder="<?php esc_attr_e( 'Straight Weddings Site', 'studio-zanetti' ); ?>">
				</label>
				<label>
					<span><?php esc_html_e( 'Menu slug', 'studio-zanetti' ); ?></span>
					<input type="text" name="slug" placeholder="<?php esc_attr_e( 'weddings-site', 'studio-zanetti' ); ?>" pattern="[a-z0-9-]+">
				</label>
				<button type="submit" class="button button-primary"><?php esc_html_e( 'Add site menu', 'studio-zanetti' ); ?></button>
			</form>
			<output id="sz-site-menu-status" class="sz-site-menu-status" aria-live="polite">
				<span class="dashicons dashicons-saved" aria-hidden="true"></span>
				<span><?php esc_html_e( 'All changes saved', 'studio-zanetti' ); ?></span>
			</output>
		</div>

		<div class="sz-site-menu-board" data-site-menu-board>
			<section class="sz-site-menu-column sz-site-menu-column--unassigned" data-menu-id="0">
				<header class="sz-site-menu-column__header">
					<div>
						<h2><?php esc_html_e( 'Unassigned pages', 'studio-zanetti' ); ?></h2>
						<span class="sz-site-menu-column__count"></span>
					</div>
				</header>
				<ul class="sz-site-menu-list" aria-label="<?php esc_attr_e( 'Unassigned pages', 'studio-zanetti' ); ?>">
					<?php foreach ( $unassigned as $card ) : ?>
						<?php sz_site_menu_manager_render_card( $card, $menus, 0, $primary_menu_id > 0 ); ?>
					<?php endforeach; ?>
				</ul>
			</section>

			<?php foreach ( $menus as $menu ) : ?>
				<section class="sz-site-menu-column" data-menu-id="<?php echo esc_attr( $menu->term_id ); ?>">
					<header class="sz-site-menu-column__header">
						<div>
							<h2><?php echo esc_html( $menu->name ); ?></h2>
							<span class="sz-site-menu-column__count"></span>
						</div>
						<div class="sz-site-menu-column__badges">
							<?php foreach ( $locations as $location => $menu_id ) : ?>
								<?php if ( (int) $menu_id === (int) $menu->term_id ) : ?>
									<span class="sz-site-menu-badge"><?php echo esc_html( $location_names[ $location ] ?? $location ); ?></span>
								<?php endif; ?>
							<?php endforeach; ?>
						</div>
					</header>
					<ul class="sz-site-menu-list" aria-label="<?php echo esc_attr( $menu->name ); ?>">
						<?php foreach ( $menu_cards[ $menu->term_id ] as $card ) : ?>
							<?php sz_site_menu_manager_render_card( $card, $menus, (int) $menu->term_id, $primary_menu_id > 0 ); ?>
						<?php endforeach; ?>
					</ul>
				</section>
			<?php endforeach; ?>
		</div>
	</div>

	<aside id="sz-site-menu-preview" class="sz-site-menu-preview" role="dialog" aria-modal="true" aria-labelledby="sz-site-menu-preview-title" aria-hidden="true" hidden>
		<hr class="sz-site-menu-preview__resize" aria-label="<?php esc_attr_e( 'Resize page preview', 'studio-zanetti' ); ?>">
		<header class="sz-site-menu-preview__header">
			<h2 id="sz-site-menu-preview-title"><?php esc_html_e( 'Viewing page', 'studio-zanetti' ); ?></h2>
			<div class="sz-site-menu-preview__controls">
				<button type="button" class="sz-site-menu-preview__expand" aria-label="<?php esc_attr_e( 'Expand preview', 'studio-zanetti' ); ?>" title="<?php esc_attr_e( 'Expand preview', 'studio-zanetti' ); ?>">
					<span class="dashicons dashicons-editor-expand" aria-hidden="true"></span>
				</button>
				<button type="button" class="sz-site-menu-preview__close" aria-label="<?php esc_attr_e( 'Close preview', 'studio-zanetti' ); ?>">
					<span class="dashicons dashicons-no-alt" aria-hidden="true"></span>
				</button>
			</div>
		</header>
		<div class="sz-site-menu-preview__loading" aria-hidden="true"><?php esc_html_e( 'Loading preview...', 'studio-zanetti' ); ?></div>
		<iframe title="<?php esc_attr_e( 'Page preview', 'studio-zanetti' ); ?>" src="about:blank"></iframe>
	</aside>
	<div class="sz-site-menu-preview-backdrop" hidden></div>
	<?php
}

/**
 * Persist card positions and cross-menu moves.
 */
function sz_site_menu_manager_save_board() {
	check_ajax_referer( 'sz_site_menu_manager', 'nonce' );

	if ( ! current_user_can( 'edit_theme_options' ) ) {
		wp_send_json_error( [ 'message' => __( 'You do not have permission to manage menus.', 'studio-zanetti' ) ], 403 );
	}

	$raw_board = isset( $_POST['board'] ) ? wp_unslash( $_POST['board'] ) : '';
	$board     = json_decode( $raw_board, true );

	if ( ! is_array( $board ) ) {
		wp_send_json_error( [ 'message' => __( 'The menu layout was invalid.', 'studio-zanetti' ) ], 400 );
	}

	$valid_menus = [];
	foreach ( wp_get_nav_menus() as $menu ) {
		$valid_menus[ (int) $menu->term_id ] = (string) $menu->slug;
	}

	$locations       = get_nav_menu_locations();
	$primary_menu_id = isset( $locations['primary'] ) ? (int) $locations['primary'] : 0;
	$updated_pages   = [];
	foreach ( $board as $column ) {
		$menu_id = isset( $column['menuId'] ) ? absint( $column['menuId'] ) : 0;
		$items   = isset( $column['items'] ) && is_array( $column['items'] ) ? $column['items'] : [];

		if ( $menu_id > 0 && ! isset( $valid_menus[ $menu_id ] ) ) {
			wp_send_json_error( [ 'message' => __( 'A menu no longer exists.', 'studio-zanetti' ) ], 400 );
		}

		foreach ( $items as $index => $submitted_item ) {
			$page_id   = isset( $submitted_item['pageId'] ) ? absint( $submitted_item['pageId'] ) : 0;

			if ( $page_id <= 0 || 'page' !== get_post_type( $page_id ) ) {
				continue;
			}

			$override = ( $menu_id > 0 && $menu_id !== $primary_menu_id ) ? $valid_menus[ $menu_id ] : '';
			if ( function_exists( 'update_field' ) ) {
				update_field( 'field_sz_menu_override', $override, $page_id );
			} else {
				update_post_meta( $page_id, 'menu_override', $override );
			}
			update_post_meta( $page_id, '_sz_site_menu_manager_order', $index + 1 );
			$updated_pages[] = $page_id;
		}
	}

	wp_send_json_success( [
		'message'      => __( 'All changes saved', 'studio-zanetti' ),
		'updatedPages' => array_values( array_unique( $updated_pages ) ),
	] );
}
add_action( 'wp_ajax_sz_site_menu_manager_save', 'sz_site_menu_manager_save_board' );

/**
 * Create a menu/site column without leaving the board.
 */
function sz_site_menu_manager_create_menu() {
	check_ajax_referer( 'sz_site_menu_manager', 'nonce' );

	if ( ! current_user_can( 'edit_theme_options' ) ) {
		wp_send_json_error( [ 'message' => __( 'You do not have permission to manage menus.', 'studio-zanetti' ) ], 403 );
	}

	$name = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$slug = isset( $_POST['slug'] ) ? sanitize_title( wp_unslash( $_POST['slug'] ) ) : '';

	if ( '' === $name ) {
		wp_send_json_error( [ 'message' => __( 'Enter a site name.', 'studio-zanetti' ) ], 400 );
	}

	$menu_id = wp_create_nav_menu( $name );
	if ( is_wp_error( $menu_id ) ) {
		wp_send_json_error( [ 'message' => $menu_id->get_error_message() ], 400 );
	}

	if ( '' !== $slug ) {
		$result = wp_update_term( $menu_id, 'nav_menu', [ 'slug' => $slug ] );
		if ( is_wp_error( $result ) ) {
			wp_delete_nav_menu( $menu_id );
			wp_send_json_error( [ 'message' => $result->get_error_message() ], 400 );
		}
	}

	wp_send_json_success( [
		'menuId' => (int) $menu_id,
		'name'   => $name,
	] );
}
add_action( 'wp_ajax_sz_site_menu_manager_create', 'sz_site_menu_manager_create_menu' );