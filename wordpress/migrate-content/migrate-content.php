<?php
/**
 * Studio Zanetti — Migrate post_content to ACF Flexible Content blocks.
 *
 * This script converts WordPress classic editor / Gutenberg post_content HTML
 * into ACF Flexible Content "blocks" rows so that all page content is editable
 * via the WYSIWYG ACF editor used by the React front-end.
 *
 * ─── USAGE ────────────────────────────────────────────────────────────────────
 *
 *  1. SSH into your server:
 *       ssh root@[SERVER IP]
 *
 *  2. SCP the script to the server:
 *       scp wordpress/migrate-content/migrate-content.php root@[SERVER IP]:/var/lib/docker/volumes/budgeto_wordpress-data/_data/migrate-content.php
 *
 *  3. Run it inside the WordPress container with WP-CLI:
 *
 *     DRY RUN (preview — no changes made):
 *       docker exec wordpress wp eval-file /var/www/html/migrate-content.php --allow-root
 *
 *     LIVE RUN (actually migrates):
 *       docker exec -e SZ_EXECUTE=1 wordpress wp eval-file /var/www/html/migrate-content.php --allow-root
 *
 *     MIGRATE A SINGLE PAGE:
 *       docker exec -e SZ_EXECUTE=1 -e SZ_PAGE_ID=9347 wordpress wp eval-file /var/www/html/migrate-content.php --allow-root
 *
 *  4. After verifying, delete the script:
 *       ssh root@[SERVER IP] rm /var/lib/docker/volumes/budgeto_wordpress-data/_data/migrate-content.php
 *
 * ─── WHAT IT DOES ─────────────────────────────────────────────────────────────
 *
 *  For each published page that has post_content but NO existing ACF blocks:
 *
 *    1. Parses the HTML into sections based on headings (<h1>–<h6>).
 *    2. Each heading + its following content becomes a `text_block` layout.
 *    3. If images are found alongside text, it uses `image_text` layout instead.
 *    4. If the page has only raw text with no headings, it becomes one `text_block`.
 *    5. Saves the ACF Flexible Content field (field name: "blocks").
 *    6. Clears the post_content field so there's no duplication.
 *
 *  Pages that ALREADY have ACF blocks are SKIPPED (never overwritten).
 *
 * @package StudioZanetti
 */

// ─── Parse flags via environment variables ────────────────────────────────────
// WP-CLI intercepts --flags, so we use env vars instead:
//   SZ_EXECUTE=1   → live run (otherwise dry-run)
//   SZ_PAGE_ID=123 → migrate only that page
$is_execute = ! empty( getenv( 'SZ_EXECUTE' ) );
$single_id  = getenv( 'SZ_PAGE_ID' ) ? (int) getenv( 'SZ_PAGE_ID' ) : null;

if ( ! $is_execute ) {
	WP_CLI::log( '' );
	WP_CLI::log( '╔══════════════════════════════════════════════════════╗' );
	WP_CLI::log( '║            DRY RUN — No changes will be made        ║' );
	WP_CLI::log( '║  Use: docker exec -e SZ_EXECUTE=1 wordpress ...     ║' );
	WP_CLI::log( '╚══════════════════════════════════════════════════════╝' );
	WP_CLI::log( '' );
}

// ─── Fetch pages ──────────────────────────────────────────────────────────────
if ( $single_id ) {
	$pages = [ get_post( $single_id ) ];
	if ( ! $pages[0] || $pages[0]->post_type !== 'page' ) {
		WP_CLI::error( "Page ID $single_id not found." );
	}
} else {
	$pages = get_posts( [
		'post_type'      => 'page',
		'post_status'    => 'any',
		'posts_per_page' => -1,
	] );
}

$migrated = 0;
$skipped  = 0;
$errors   = 0;

foreach ( $pages as $page ) {
	$page_id = $page->ID;
	$slug    = $page->post_name;
	$content = trim( $page->post_content );

	// Skip pages with no content
	if ( empty( $content ) ) {
		WP_CLI::log( "  SKIP  ID=$page_id slug=$slug — empty post_content" );
		$skipped++;
		continue;
	}

	// Skip pages that already have ACF blocks
	$existing_blocks = get_field( 'blocks', $page_id );
	if ( ! empty( $existing_blocks ) && is_array( $existing_blocks ) ) {
		WP_CLI::log( "  SKIP  ID=$page_id slug=$slug — already has " . count( $existing_blocks ) . " ACF block(s)" );
		$skipped++;
		continue;
	}

	// Parse the content into ACF block rows
	$blocks = sz_parse_content_to_blocks( $content );

	if ( empty( $blocks ) ) {
		WP_CLI::log( "  SKIP  ID=$page_id slug=$slug — parser produced no blocks" );
		$skipped++;
		continue;
	}

	$block_summary = implode( ', ', array_map( function ( $b ) {
		return $b['acf_fc_layout'];
	}, $blocks ) );

	if ( $is_execute ) {
		// Save ACF blocks
		$result = update_field( 'blocks', $blocks, $page_id );

		if ( $result ) {
			// Clear post_content to avoid duplication
			wp_update_post( [
				'ID'           => $page_id,
				'post_content' => '',
			] );

			WP_CLI::success( "ID=$page_id slug=$slug — migrated " . count( $blocks ) . " block(s): $block_summary" );
			$migrated++;
		} else {
			WP_CLI::warning( "ID=$page_id slug=$slug — update_field() returned false. Is the 'blocks' Flexible Content field registered?" );
			$errors++;
		}
	} else {
		WP_CLI::log( "  WOULD MIGRATE  ID=$page_id slug=$slug → " . count( $blocks ) . " block(s): $block_summary" );
		// Show a preview of the first block
		$first = $blocks[0];
		$heading = $first['heading'] ?? '(no heading)';
		$body_preview = isset( $first['body'] ) ? substr( strip_tags( $first['body'] ), 0, 80 ) . '…' : '(no body)';
		WP_CLI::log( "               First block: heading=\"$heading\" body=\"$body_preview\"" );
		$migrated++;
	}
}

WP_CLI::log( '' );
WP_CLI::log( "═══ Summary ═══" );
WP_CLI::log( "  " . ( $is_execute ? 'Migrated' : 'Would migrate' ) . ":  $migrated page(s)" );
WP_CLI::log( "  Skipped:  $skipped page(s)" );
if ( $errors > 0 ) {
	WP_CLI::log( "  Errors:   $errors page(s)" );
}
WP_CLI::log( '' );

if ( ! $is_execute && $migrated > 0 ) {
	WP_CLI::log( 'Run again with --execute to perform the migration.' );
	WP_CLI::log( '' );
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parse HTML post_content into an array of ACF Flexible Content block rows.
 *
 * Strategy:
 *   1. Strip Gutenberg comments and old theme wrapper divs.
 *   2. Split on <h1>–<h6> tags — each heading starts a new section.
 *   3. Each section becomes either:
 *      - image_text  (if it contains an <img> alongside text)
 *      - text_block  (everything else)
 *   4. Standalone <img> / <figure> blocks with no text → skipped (images need
 *      to be re-uploaded via ACF Image fields manually).
 *
 * @param string $html Raw post_content HTML.
 * @return array ACF Flexible Content rows.
 */
function sz_parse_content_to_blocks( string $html ): array {
	// Strip Gutenberg block comments
	$html = preg_replace( '/<!--\s*\/?wp:[^>]*-->/', '', $html );

	// Strip old theme wrapper divs (class="one", "standard_wrapper", "ppb_text", etc.)
	// Keep inner content.
	$html = preg_replace( '/<div[^>]*class="[^"]*(?:one|standard_wrapper|page_content_wrapper|inner|ppb_)[^"]*"[^>]*>/i', '', $html );
	$html = preg_replace( '/<\/div>/', '', $html );

	// Normalize whitespace
	$html = trim( $html );

	if ( empty( $html ) ) {
		return [];
	}

	// Split into sections on headings. Each match captures:
	//   [1] = heading tag (h1–h6)
	//   [2] = heading attributes
	//   [3] = heading text
	//   [4] = content until next heading or end
	$pattern = '/<(h[1-6])([^>]*)>(.*?)<\/\1>(.*?)(?=<h[1-6]|$)/si';
	$found   = preg_match_all( $pattern, $html, $matches, PREG_SET_ORDER );

	$blocks = [];

	if ( $found && count( $matches ) > 0 ) {
		// Check if there's content BEFORE the first heading
		$first_heading_pos = strpos( $html, '<' . $matches[0][1] );
		if ( $first_heading_pos > 0 ) {
			$pre_content = trim( substr( $html, 0, $first_heading_pos ) );
			if ( ! empty( $pre_content ) && strlen( strip_tags( $pre_content ) ) > 5 ) {
				$blocks[] = sz_make_text_block( '', $pre_content );
			}
		}

		foreach ( $matches as $m ) {
			$heading = strip_tags( $m[3] );
			$body    = trim( $m[4] );

			// Skip empty sections
			if ( empty( $heading ) && empty( $body ) ) {
				continue;
			}

			// Check if this section has images
			$has_image = preg_match( '/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $body );

			if ( $has_image ) {
				// Extract the first image
				preg_match( '/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $body, $img_match );
				$img_url = $img_match[1] ?? '';

				// Get alt text
				$img_alt = '';
				if ( preg_match( '/alt=["\']([^"\']*)["\']/', $img_match[0] ?? '', $alt_match ) ) {
					$img_alt = $alt_match[1];
				}

				// Remove the image from the body text
				$text_body = preg_replace( '/<(?:figure|img)[^>]*>.*?<\/figure>|<img[^>]*\/?>/si', '', $body );
				$text_body = trim( $text_body );

				if ( ! empty( $text_body ) && strlen( strip_tags( $text_body ) ) > 5 ) {
					$blocks[] = [
						'acf_fc_layout'  => 'image_text',
						'image'          => sz_find_attachment_by_url( $img_url ),
						'heading'        => $heading,
						'body'           => $text_body,
						'image_position' => 'left',
					];
				} else {
					// Image with heading but no real body text — use text_block
					$blocks[] = sz_make_text_block( $heading, $body );
				}
			} else {
				$blocks[] = sz_make_text_block( $heading, $body );
			}
		}
	} else {
		// No headings found — treat the entire content as one text_block
		$blocks[] = sz_make_text_block( '', $html );
	}

	return $blocks;
}

/**
 * Create a text_block row.
 */
function sz_make_text_block( string $heading, string $body ): array {
	return [
		'acf_fc_layout' => 'text_block',
		'heading'        => $heading,
		'body'           => $body,
		'align'          => 'left',
		'cta_text'       => '',
		'cta_url'        => '',
	];
}

/**
 * Try to find a WordPress attachment ID from an image URL.
 * Returns an attachment ID (int) if found, or the URL string as fallback.
 * ACF Image fields accept attachment IDs.
 */
function sz_find_attachment_by_url( string $url ) {
	global $wpdb;

	if ( empty( $url ) ) {
		return '';
	}

	// Try to find by guid (full URL)
	$attachment_id = $wpdb->get_var( $wpdb->prepare(
		"SELECT ID FROM $wpdb->posts WHERE guid = %s AND post_type = 'attachment' LIMIT 1",
		$url
	) );

	if ( $attachment_id ) {
		return (int) $attachment_id;
	}

	// Try matching just the filename
	$filename = basename( parse_url( $url, PHP_URL_PATH ) );
	// Remove size suffix (e.g., -300x232)
	$filename_base = preg_replace( '/-\d+x\d+(?=\.\w+$)/', '', $filename );

	$attachment_id = $wpdb->get_var( $wpdb->prepare(
		"SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_wp_attached_file' AND meta_value LIKE %s LIMIT 1",
		'%' . $wpdb->esc_like( $filename_base )
	) );

	if ( $attachment_id ) {
		return (int) $attachment_id;
	}

	// Fallback: return empty (image will need to be manually set in ACF)
	WP_CLI::warning( "  Could not find attachment for: $url" );
	return '';
}
