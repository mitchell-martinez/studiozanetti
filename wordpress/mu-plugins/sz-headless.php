<?php
/**
 * Plugin Name:  Studio Zanetti — Headless Config
 * Description:  Configures WordPress as a headless CMS for the React Router front‑end.
 *               Registers nav‑menu locations, exposes menus & previews via REST API,
 *               hides unnecessary admin features, and redirects front‑end previews.
 * Version:      1.0.0
 * Author:       Studio Zanetti Dev
 *
 * ─── INSTALLATION ────────────────────────────────────────────────────────────
 *
 *  1. Copy this file into your WordPress installation at:
 *       wp-content/mu-plugins/sz-headless.php
 *
 *     "mu-plugins" (must-use plugins) are always active and cannot be
 *     deactivated — perfect for headless infrastructure code.
 *
 *  2. Add the following constants to wp-config.php (above the "That's all" line):
 *
 *       // Front-end URL (React Router app)
 *       define( 'SZ_FRONTEND_URL', 'https://your-domain.example.com' );
 *
 *       // Shared secret for preview authentication (generate a random string)
 *       define( 'SZ_PREVIEW_SECRET', 'your-random-secret-here' );
 *
 *  3. That's it! The features below activate automatically.
 *
 * ─── FEATURES ────────────────────────────────────────────────────────────────
 *
 *  • Registers "Primary Navigation" menu location  → Appearance → Menus
 *  • REST endpoint GET /wp-json/sz/v1/nav-menu/<location>
 *      Returns a nested JSON tree of menu items (with children for dropdowns).
 *  • REST endpoint GET /wp-json/sz/v1/preview/<id>?secret=<secret>
 *      Returns the latest revision/autosave of a page for front-end preview.
 *  • Rewrites the WP "Preview" button URL to point at the React front-end.
 *  • Hides the "Posts" menu (not used on this photography site).
 *  • Sets the admin default landing page to Pages instead of the Dashboard.
 *  • Removes unnecessary dashboard widgets to declutter the admin.
 *  • Adds minimal admin CSS to prevent the "squished posts" layout issue.
 *
 * ─── REQUIRED WP PLUGINS ────────────────────────────────────────────────────
 *
 *  • Advanced Custom Fields (Pro or free + "ACF to REST API")
 *  • Yoast SEO (optional, for <meta> tags)
 *
 * @package StudioZanetti
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. REGISTER NAVIGATION MENU LOCATIONS
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'after_setup_theme', function () {
	register_nav_menus( [
		'primary' => __( 'Primary Navigation', 'studio-zanetti' ),
	] );

	// Enable the Featured Image meta box for posts (and pages).
	// Without this, the Classic Editor hides the thumbnail panel entirely.
	add_theme_support( 'post-thumbnails' );
} );

add_action( 'init', function () {
	register_post_type( 'sz_gallery', [
		'labels' => [
			'name' => __( 'Gallery Library', 'studio-zanetti' ),
			'singular_name' => __( 'Gallery Entry', 'studio-zanetti' ),
			'add_new_item' => __( 'Add Gallery Entry', 'studio-zanetti' ),
			'edit_item' => __( 'Edit Gallery Entry', 'studio-zanetti' ),
		],
		'public' => false,
		'show_ui' => true,
		'show_in_menu' => true,
		'show_in_rest' => true,
		'menu_icon' => 'dashicons-format-gallery',
		'supports' => [ 'title' ],
		'has_archive' => false,
		'rewrite' => false,
	] );
} );

// ─────────────────────────────────────────────────────────────────────────────
// 2. REST API — NAVIGATION MENU ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
//
// GET /wp-json/sz/v1/nav-menu/primary
//
// Returns:
// [
//   { "id": 10, "title": "Home", "url": "/", "children": [] },
//   { "id": 11, "title": "Gallery", "url": "/gallery", "children": [
//       { "id": 111, "title": "Weddings", "url": "/gallery?category=Weddings", "children": [] },
//       ...
//   ]},
//   ...
// ]

add_action( 'rest_api_init', function () {
	register_rest_route( 'sz/v1', '/nav-menu/(?P<location>[a-zA-Z0-9_\-\+%]+)', [
		'methods'             => 'GET',
		'callback'            => 'sz_get_nav_menu',
		'permission_callback' => '__return_true',
		'args'                => [
			'location' => [
				'required'          => true,
				'sanitize_callback' => function ( $param ) {
					return sanitize_text_field( urldecode( $param ) );
				},
				'validate_callback' => function ( $param ) {
					return is_string( $param ) && strlen( $param ) <= 200;
				},
			],
		],
	] );

	// ── List all available menus (for admin dropdowns & frontend discovery) ──
	register_rest_route( 'sz/v1', '/menus', [
		'methods'             => 'GET',
		'callback'            => 'sz_list_menus',
		'permission_callback' => '__return_true',
	] );
} );

/**
 * REST callback: build a nested tree of menu items for a given location.
 */
function sz_get_nav_menu( WP_REST_Request $request ) {
	$location  = $request->get_param( 'location' );
	$locations = get_nav_menu_locations();

	$menu_id = null;

	// 1. Try registered theme location first.
	if ( ! empty( $locations[ $location ] ) ) {
		$menu_id = $locations[ $location ];
	} else {
		// 2. Fall back to looking up a menu by name or slug directly.
		//    This lets the menu_override ACF field accept either a theme
		//    location slug OR a menu name/slug from Appearance → Menus.
		$menu_obj = wp_get_nav_menu_object( $location );
		if ( $menu_obj ) {
			$menu_id = $menu_obj->term_id;
		}
	}

	if ( ! $menu_id ) {
		return new WP_REST_Response( [], 200 );
	}

	$items = wp_get_nav_menu_items( $menu_id );

	if ( ! $items ) {
		return new WP_REST_Response( [], 200 );
	}

	// Get the front-end URL to strip from absolute WP URLs → relative paths
	$frontend_url = defined( 'SZ_FRONTEND_URL' ) ? rtrim( SZ_FRONTEND_URL, '/' ) : '';
	$site_url     = rtrim( get_site_url(), '/' );

	// Flatten into associative array by menu item ID
	$flat = [];
	foreach ( $items as $item ) {
		$url = $item->url;

		// Convert absolute WP URLs to relative paths
		if ( $site_url && strpos( $url, $site_url ) === 0 ) {
			$url = substr( $url, strlen( $site_url ) ) ?: '/';
		}
		if ( $frontend_url && strpos( $url, $frontend_url ) === 0 ) {
			$url = substr( $url, strlen( $frontend_url ) ) ?: '/';
		}

		$flat[ $item->ID ] = [
			'id'        => (int) $item->ID,
			'title'     => $item->title,
			'url'       => $url,
			'parent_id' => (int) $item->menu_item_parent,
			'children'  => [],
		];
	}

	// Build tree: assign children to their parent items
	$tree = [];
	foreach ( $flat as &$node ) {
		if ( $node['parent_id'] && isset( $flat[ $node['parent_id'] ] ) ) {
			$flat[ $node['parent_id'] ]['children'][] = &$node;
		} else {
			$tree[] = &$node;
		}
	}
	unset( $node );

	// Remove the parent_id key from the output (front-end doesn't need it)
	$clean = sz_clean_menu_nodes( $tree );

	return new WP_REST_Response( $clean, 200 );
}

/**
 * Recursively strip internal keys from the menu tree.
 */
function sz_clean_menu_nodes( array $nodes ): array {
	return array_values( array_map( function ( $node ) {
		return [
			'id'       => $node['id'],
			'title'    => $node['title'],
			'url'      => $node['url'],
			'children' => sz_clean_menu_nodes( $node['children'] ),
		];
	}, $nodes ) );
}

/**
 * REST callback: list all available menus.
 *
 * Returns registered theme locations and all menus created in Appearance → Menus.
 * Used by the ACF `acf/load_field` filter to populate menu_override dropdowns,
 * and can also be consumed by the React front-end for future use.
 *
 * GET /wp-json/sz/v1/menus
 *
 * Response:
 * {
 *   "locations": { "primary": "Primary Navigation" },
 *   "menus": [
 *     { "id": 5, "name": "SSM", "slug": "ssm" },
 *     { "id": 6, "name": "Weddings", "slug": "weddings" }
 *   ]
 * }
 */
function sz_list_menus(): WP_REST_Response {
	// Registered theme locations (slug → label)
	$registered  = get_registered_nav_menus();

	// All menus created in Appearance → Menus
	$nav_menus = wp_get_nav_menus();
	$menus     = [];
	foreach ( $nav_menus as $menu ) {
		$menus[] = [
			'id'   => (int) $menu->term_id,
			'name' => $menu->name,
			'slug' => $menu->slug,
		];
	}

	return new WP_REST_Response( [
		'locations' => $registered,
		'menus'     => $menus,
	], 200 );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2c. REST API — EXPOSE CATEGORY MENU OVERRIDE
// ─────────────────────────────────────────────────────────────────────────────
//
// Adds a `menu_override` field to the WP REST category response so the
// front-end can read a category's preferred header menu without extra calls.
// The value is set via the "Category Settings" ACF field group.

add_action( 'rest_api_init', function () {
	register_rest_field( 'category', 'menu_override', [
		'get_callback' => function ( $term_arr ) {
			if ( ! function_exists( 'get_field' ) ) {
				return '';
			}
			$value = get_field( 'menu_override', 'term_' . $term_arr['id'] );
			return is_string( $value ) ? $value : '';
		},
		'schema' => [
			'description' => 'Optional menu slug override for this category.',
			'type'        => 'string',
		],
	] );
} );

// ─────────────────────────────────────────────────────────────────────────────
// 2d. REST API — PAGE BLOCKS WRITE ENDPOINT (ACF PRO COMPATIBLE)
// ─────────────────────────────────────────────────────────────────────────────
//
// POST /wp-json/sz/v1/page-blocks/<id>
// Body: { "blocks": [ ...acf flexible content rows... ] }
//
// This endpoint is used by local migration/import scripts when wp/v2 does not
// accept writing `acf` fields directly and no acf/v3 write route is available.

add_action( 'rest_api_init', function () {
	register_rest_route( 'sz/v1', '/page-blocks/(?P<id>\d+)', [
		'methods'             => 'POST',
		'callback'            => 'sz_update_page_blocks',
		'permission_callback' => function ( WP_REST_Request $request ) {
			$post_id = (int) $request->get_param( 'id' );
			return $post_id > 0 && current_user_can( 'edit_post', $post_id );
		},
		'args'                => [
			'id' => [
				'required'          => true,
				'validate_callback' => function ( $param ) {
					return is_numeric( $param ) && (int) $param > 0;
				},
			],
		],
	] );

	register_rest_route( 'sz/v1', '/gallery-library', [
		'methods'             => 'POST',
		'callback'            => 'sz_upsert_gallery_library_item',
		'permission_callback' => function () {
			return current_user_can( 'edit_pages' );
		},
	] );

	register_rest_route( 'sz/v1', '/resolve-media', [
		'methods'             => 'GET',
		'callback'            => 'sz_resolve_media_reference',
		'permission_callback' => function () {
			return current_user_can( 'upload_files' );
		},
		'args'                => [
			'source_url' => [
				'required' => true,
				'type'     => 'string',
			],
		],
	] );
} );

/**
 * REST callback: update `blocks` ACF field for a page.
 */
function sz_update_page_blocks( WP_REST_Request $request ) {
	$post_id = (int) $request->get_param( 'id' );
	$post    = get_post( $post_id );

	if ( ! $post || $post->post_type !== 'page' ) {
		return new WP_REST_Response( [ 'message' => 'Page not found.' ], 404 );
	}

	$params = $request->get_json_params();
	$blocks = is_array( $params ) && array_key_exists( 'blocks', $params ) ? $params['blocks'] : null;

	if ( ! is_array( $blocks ) ) {
		return new WP_REST_Response( [ 'message' => 'Invalid request body. Expected "blocks" array.' ], 400 );
	}

	if ( ! function_exists( 'update_field' ) ) {
		return new WP_REST_Response( [ 'message' => 'ACF is not available.' ], 500 );
	}

	if ( ! function_exists( 'media_sideload_image' ) ) {
		require_once ABSPATH . 'wp-admin/includes/media.php';
	}
	if ( ! function_exists( 'download_url' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
	}
	if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}

	// Normalise incoming blocks so ACF image fields receive attachment IDs.
	$site_url = rtrim( get_site_url(), '/' );
	$blocks   = array_map( function ( $block ) use ( $site_url ) {
		return sz_prepare_block_for_acf_write( $block, $site_url );
	}, $blocks );

	// Update by field name. Field group is registered in sz-acf-schema.php.
	$result = update_field( 'blocks', $blocks, $post_id );

	// ACF can return false when the computed value is effectively unchanged.
	// Treat that as non-fatal to avoid false 500 responses during idempotent writes.
	$persisted = function_exists( 'get_field' ) ? get_field( 'blocks', $post_id ) : null;

	return new WP_REST_Response( [
		'id'             => $post_id,
		'status'         => $result === false ? 'unchanged_or_not_modified' : 'updated',
		'blocks_count'   => count( $blocks ),
		'persisted'      => $persisted,
	], 200 );
}

/**
 * REST callback: create or update a reusable gallery library entry.
 */
function sz_upsert_gallery_library_item( WP_REST_Request $request ) {
	$params      = $request->get_json_params();
	$title       = is_array( $params ) && isset( $params['title'] ) ? sanitize_text_field( (string) $params['title'] ) : '';
	$description = is_array( $params ) && isset( $params['description'] ) ? (string) $params['description'] : '';
	$images      = is_array( $params ) && isset( $params['images'] ) && is_array( $params['images'] ) ? $params['images'] : [];
	$slug_input  = is_array( $params ) && isset( $params['slug'] ) ? sanitize_title( (string) $params['slug'] ) : '';

	if ( $title === '' ) {
		return new WP_REST_Response( [ 'message' => 'Gallery title is required.' ], 400 );
	}

	if ( ! function_exists( 'update_field' ) ) {
		return new WP_REST_Response( [ 'message' => 'ACF is not available.' ], 500 );
	}

	if ( ! function_exists( 'media_sideload_image' ) ) {
		require_once ABSPATH . 'wp-admin/includes/media.php';
	}
	if ( ! function_exists( 'download_url' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
	}
	if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}

	$slug     = $slug_input !== '' ? $slug_input : sanitize_title( $title );
	$existing = $slug !== '' ? get_page_by_path( $slug, OBJECT, 'sz_gallery' ) : null;

	$post_args = [
		'post_type'   => 'sz_gallery',
		'post_status' => 'publish',
		'post_title'  => $title,
		'post_name'   => $slug,
	];

	if ( $existing instanceof WP_Post ) {
		$post_args['ID'] = $existing->ID;
		$gallery_id      = wp_update_post( $post_args, true );
	} else {
		$gallery_id = wp_insert_post( $post_args, true );
	}

	if ( is_wp_error( $gallery_id ) || ! $gallery_id ) {
		return new WP_REST_Response( [ 'message' => 'Failed to save gallery library entry.' ], 500 );
	}

	$site_url        = rtrim( get_site_url(), '/' );
	$normalised_rows = sz_prepare_gallery_rows_for_acf_write( $images, $site_url );
	$attempted_count = count( $images );
	$persisted_count = count( $normalised_rows );

	if ( $attempted_count > 0 && $persisted_count === 0 ) {
		return new WP_REST_Response( [
			'message' => 'Gallery images could not be imported into the WordPress Media Library.',
			'attempted_images' => $attempted_count,
			'persisted_images' => $persisted_count,
		], 422 );
	}

	// Use explicit field keys first to avoid ambiguous field-name resolution.
	update_field( 'field_sz_gallery_library_description', $description, $gallery_id );
	update_field( 'field_sz_gallery_library_images', $normalised_rows, $gallery_id );

	// Name-based fallback for environments with different field-key mapping states.
	update_field( 'description', $description, $gallery_id );
	update_field( 'images', $normalised_rows, $gallery_id );

	// Ensure we read fresh values after writes.
	clean_post_cache( $gallery_id );
	wp_cache_delete( $gallery_id, 'post_meta' );

	$persisted_images_raw = function_exists( 'get_field' ) ? get_field( 'images', $gallery_id ) : [];
	$persisted_images     = is_array( $persisted_images_raw ) ? sz_normalize_gallery_rows( $persisted_images_raw ) : [];

	if ( $attempted_count > 0 && count( $persisted_images ) === 0 ) {
		return new WP_REST_Response( [
			'message' => 'Gallery write did not persist images to ACF.',
			'attempted_images' => $attempted_count,
			'prepared_images' => $persisted_count,
			'persisted_images' => 0,
		], 500 );
	}

	return new WP_REST_Response( sz_get_reusable_gallery_payload( (int) $gallery_id ), 200 );
}

/**
 * REST callback: resolve existing media by source URL/path without uploading.
 */
function sz_resolve_media_reference( WP_REST_Request $request ) {
	$source_url = trim( (string) $request->get_param( 'source_url' ) );
	if ( $source_url === '' ) {
		return new WP_REST_Response( [ 'message' => 'source_url is required.' ], 400 );
	}

	$site_url      = rtrim( get_site_url(), '/' );
	$attachment_id = (int) attachment_url_to_postid( $source_url );

	if ( $attachment_id <= 0 ) {
		$attachment_id = sz_find_attachment_by_source_url( $source_url );
	}

	if ( $attachment_id <= 0 ) {
		$path = wp_parse_url( $source_url, PHP_URL_PATH );
		if ( is_string( $path ) && $path !== '' ) {
			$site_url_path = $site_url . $path;

			$attachment_id = (int) attachment_url_to_postid( $site_url_path );
			if ( $attachment_id <= 0 ) {
				$attachment_id = sz_find_attachment_by_source_url( $site_url_path );
			}
		}
	}

	if ( $attachment_id <= 0 ) {
		return new WP_REST_Response( [ 'message' => 'No matching media found.' ], 404 );
	}

	$media_url = wp_get_attachment_url( $attachment_id );

	return new WP_REST_Response( [
		'id'  => $attachment_id,
		'url' => $media_url ? $media_url : '',
	], 200 );
}

/**
 * Prepare gallery repeater rows for ACF writes.
 */
function sz_prepare_gallery_rows_for_acf_write( array $rows, string $site_url ): array {
	$normalised_rows = [];

	foreach ( $rows as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}

		$image         = $row['image'] ?? null;
		$attachment_id = sz_resolve_or_import_attachment_id( $image, $site_url );
		if ( $attachment_id <= 0 ) {
			continue;
		}

		$normalised_rows[] = [
			'image'   => $attachment_id,
			'caption' => isset( $row['caption'] ) ? (string) $row['caption'] : '',
		];
	}

	return $normalised_rows;
}

/**
 * Convert gallery image rows to the frontend shape.
 */
function sz_normalize_gallery_rows( array $rows ): array {
	$normalized = [];

	foreach ( $rows as $row ) {
		if ( ! is_array( $row ) || ! array_key_exists( 'image', $row ) ) {
			continue;
		}

		$img = sz_resolve_image( $row['image'] );
		if ( ! $img ) {
			continue;
		}

		$normalized[] = [
			'image'   => $img,
			'caption' => isset( $row['caption'] ) ? $row['caption'] : '',
		];
	}

	return $normalized;
}

/**
 * Build the resolved gallery payload used by the frontend and importer.
 */
function sz_get_reusable_gallery_payload( int $gallery_id ): array {
	$post = get_post( $gallery_id );
	if ( ! $post || $post->post_type !== 'sz_gallery' ) {
		return [];
	}

	$fields      = function_exists( 'get_fields' ) ? get_fields( $gallery_id ) : [];
	$description = is_array( $fields ) && isset( $fields['description'] ) ? (string) $fields['description'] : '';
	$images      = is_array( $fields ) && isset( $fields['images'] ) && is_array( $fields['images'] ) ? $fields['images'] : [];

	return [
		'id'          => (int) $gallery_id,
		'slug'        => $post->post_name,
		'title'       => get_the_title( $post ),
		'description' => $description,
		'images'      => sz_normalize_gallery_rows( $images ),
	];
}

/**
 * Resolve a stored gallery reference value into a reusable gallery payload.
 */
function sz_resolve_gallery_reference( $value ): ?array {
	$gallery_id = 0;

	if ( $value instanceof WP_Post ) {
		$gallery_id = (int) $value->ID;
	} elseif ( is_array( $value ) ) {
		if ( isset( $value['id'] ) && is_numeric( $value['id'] ) ) {
			$gallery_id = (int) $value['id'];
		} elseif ( isset( $value['ID'] ) && is_numeric( $value['ID'] ) ) {
			$gallery_id = (int) $value['ID'];
		}
	} elseif ( is_numeric( $value ) ) {
		$gallery_id = (int) $value;
	}

	if ( $gallery_id <= 0 ) {
		return null;
	}

	$payload = sz_get_reusable_gallery_payload( $gallery_id );
	return empty( $payload ) ? null : $payload;
}

/**
 * Prepare a flexible-content block payload for ACF writes by converting
 * image objects/URLs back to attachment IDs where possible.
 */
function sz_prepare_block_for_acf_write( $block, string $site_url ) {
	if ( ! is_array( $block ) ) {
		return $block;
	}

	$image_keys = [ 'background_image', 'image', 'image_mobile' ];
	foreach ( $image_keys as $key ) {
		if ( array_key_exists( $key, $block ) ) {
			$resolved_id = sz_resolve_or_import_attachment_id( $block[ $key ], $site_url );
			if ( $resolved_id > 0 ) {
				$block[ $key ] = $resolved_id;
			}
		}
	}

	if ( ( $block['acf_fc_layout'] ?? '' ) === 'hero' && ! empty( $block['slides'] ) && is_array( $block['slides'] ) ) {
		$slides = [];
		foreach ( $block['slides'] as $slide ) {
			if ( ! is_array( $slide ) ) {
				continue;
			}

			$raw_image = array_key_exists( 'image', $slide ) ? $slide['image'] : $slide;
			$slide_id  = sz_resolve_or_import_attachment_id( $raw_image, $site_url );
			if ( $slide_id <= 0 ) {
				continue;
			}

			$next_slide = [ 'image' => $slide_id ];
			if ( isset( $slide['tagline'] ) ) {
				$next_slide['tagline'] = (string) $slide['tagline'];
			}
			if ( isset( $slide['subtitle'] ) ) {
				$next_slide['subtitle'] = (string) $slide['subtitle'];
			}

			$slides[] = $next_slide;
		}

		$block['slides'] = $slides;
	}

	$repeater_keys = [ 'services', 'categories', 'testimonials', 'steps', 'packages' ];
	foreach ( $repeater_keys as $rk ) {
		if ( empty( $block[ $rk ] ) || ! is_array( $block[ $rk ] ) ) {
			continue;
		}

		$block[ $rk ] = array_map( function ( $row ) use ( $site_url ) {
			if ( ! is_array( $row ) || ! array_key_exists( 'image', $row ) ) {
				return $row;
			}

			$resolved_id = sz_resolve_or_import_attachment_id( $row['image'], $site_url );
			if ( $resolved_id > 0 ) {
				$row['image'] = $resolved_id;
			}

			return $row;
		}, $block[ $rk ] );
	}

	if ( ( $block['acf_fc_layout'] ?? '' ) === 'gallery_reference' && ! empty( $block['images'] ) && is_array( $block['images'] ) ) {
		$block['images'] = sz_prepare_gallery_rows_for_acf_write( $block['images'], $site_url );
	}

	if ( ( $block['acf_fc_layout'] ?? '' ) === 'gallery_reference' && array_key_exists( 'gallery_reference', $block ) ) {
		$reference = $block['gallery_reference'];

		if ( $reference instanceof WP_Post ) {
			$block['gallery_reference'] = (int) $reference->ID;
		} elseif ( is_array( $reference ) ) {
			if ( isset( $reference['id'] ) && is_numeric( $reference['id'] ) ) {
				$block['gallery_reference'] = (int) $reference['id'];
			} elseif ( isset( $reference['ID'] ) && is_numeric( $reference['ID'] ) ) {
				$block['gallery_reference'] = (int) $reference['ID'];
			}
		}
	}

	if ( ( $block['acf_fc_layout'] ?? '' ) === 'instagram_feed' && ! empty( $block['images'] ) && is_array( $block['images'] ) ) {
		$block['images'] = array_values( array_filter( array_map( function ( $image ) use ( $site_url ) {
			$id = sz_resolve_or_import_attachment_id( $image, $site_url );
			return $id > 0 ? $id : null;
		}, $block['images'] ) ) );
	}

	return $block;
}

/**
 * Resolve an ACF gallery image value to an attachment ID.
 * Falls back to sideloading external URLs into the Media Library.
 */
function sz_resolve_or_import_attachment_id( $image, string $site_url ): int {
	if ( is_numeric( $image ) ) {
		return (int) $image;
	}

	if ( is_string( $image ) && filter_var( $image, FILTER_VALIDATE_URL ) ) {
		$image = [ 'url' => $image ];
	}

	if ( ! is_array( $image ) || empty( $image['url'] ) || ! is_string( $image['url'] ) ) {
		return 0;
	}

	$raw_url = trim( $image['url'] );
	if ( $raw_url === '' ) {
		return 0;
	}

	$attachment_id = (int) attachment_url_to_postid( $raw_url );
	if ( $attachment_id > 0 ) {
		return $attachment_id;
	}

	// Reuse existing sideloaded media by original source URL.
	$existing_by_source = sz_find_attachment_by_source_url( $raw_url );
	if ( $existing_by_source > 0 ) {
		return $existing_by_source;
	}

	$path = wp_parse_url( $raw_url, PHP_URL_PATH );
	if ( is_string( $path ) && $path !== '' ) {
		$attachment_id = (int) attachment_url_to_postid( $site_url . $path );
		if ( $attachment_id > 0 ) {
			return $attachment_id;
		}

		// Also check if this path was sideloaded from another host earlier.
		$existing_by_source_path = sz_find_attachment_by_source_url( $site_url . $path );
		if ( $existing_by_source_path > 0 ) {
			return $existing_by_source_path;
		}
	}

	if ( ! function_exists( 'media_sideload_image' ) ) {
		return 0;
	}

	// Import into media library and capture attachment ID for ACF image fields.
	$sideloaded_id = media_sideload_image( $raw_url, 0, null, 'id' );
	if ( is_wp_error( $sideloaded_id ) ) {
		return 0;
	}

	return (int) $sideloaded_id;
}

/**
 * Find an attachment ID by its recorded sideload source URL.
 */
function sz_find_attachment_by_source_url( string $source_url ): int {
	$source_url = trim( $source_url );
	if ( $source_url === '' ) {
		return 0;
	}

	$candidates = [ $source_url ];

	$without_query = preg_replace( '/\?.*$/', '', $source_url );
	if ( is_string( $without_query ) && $without_query !== '' && $without_query !== $source_url ) {
		$candidates[] = $without_query;
	}

	foreach ( $candidates as $candidate ) {
		$existing = get_posts( [
			'post_type'              => 'attachment',
			'post_status'            => 'inherit',
			'posts_per_page'         => 1,
			'fields'                 => 'ids',
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
			'update_post_meta_cache' => false,
			'meta_key'               => '_source_url',
			'meta_value'             => $candidate,
		] );

		if ( ! empty( $existing ) ) {
			return (int) $existing[0];
		}
	}

	return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. REST API — PREVIEW ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
//
// GET /wp-json/sz/v1/preview/<id>?secret=<SZ_PREVIEW_SECRET>
//
// Returns the latest autosave / revision of a page in the same shape as
// the standard wp/v2/pages response, so the front-end BlockRenderer can
// render it identically.

add_action( 'rest_api_init', function () {
	register_rest_route( 'sz/v1', '/preview/(?P<id>\d+)', [
		'methods'             => 'GET',
		'callback'            => 'sz_get_preview',
		'permission_callback' => '__return_true',
		'args'                => [
			'id'     => [
				'required'          => true,
				'validate_callback' => function ( $param ) {
					return is_numeric( $param );
				},
			],
			'secret' => [
				'required' => false,
				'type'     => 'string',
			],
		],
	] );
} );

/**
 * REST callback: return the latest revision of a page for preview.
 */
function sz_get_preview( WP_REST_Request $request ) {
	// Validate shared secret
	$expected_secret = defined( 'SZ_PREVIEW_SECRET' ) ? SZ_PREVIEW_SECRET : '';
	$provided_secret = $request->get_param( 'secret' ) ?? '';

	if ( empty( $expected_secret ) || ! hash_equals( $expected_secret, $provided_secret ) ) {
		return new WP_REST_Response( [ 'message' => 'Invalid or missing preview secret.' ], 403 );
	}

	$post_id = (int) $request->get_param( 'id' );
	$post    = get_post( $post_id );

	if ( ! $post || $post->post_type !== 'page' ) {
		return new WP_REST_Response( [ 'message' => 'Page not found.' ], 404 );
	}

	// Try to get the latest autosave (preview revision)
	$autosave = wp_get_post_autosave( $post_id );
	$source   = $autosave ?: $post;

	// Build a response matching the WPPage interface.
	// ACF values (especially repeater + WYSIWYG combinations like pricing packages)
	// are often not persisted on autosave/revision posts, so fall back to the
	// parent page ID when revision ACF is empty.
	$acf_data = [];
	if ( function_exists( 'get_fields' ) ) {
		$acf_data = get_fields( $source->ID );

		if ( ( $acf_data === false || empty( $acf_data ) ) && $source->ID !== $post_id ) {
			$acf_data = get_fields( $post_id );
		}
	}

	if ( is_array( $acf_data ) && ! empty( $acf_data['blocks'] ) && is_array( $acf_data['blocks'] ) ) {
		$acf_data['blocks'] = array_map( 'sz_normalize_block_images', $acf_data['blocks'] );
	}

	$response = [
		'id'      => $post_id,
		'slug'    => $post->post_name,
		'status'  => $post->post_status,
		'title'   => [ 'rendered' => get_the_title( $source ) ],
		'content' => [ 'rendered' => apply_filters( 'the_content', $source->post_content ) ],
		'excerpt' => [ 'rendered' => get_the_excerpt( $source ) ],
		'acf'     => $acf_data ?: new stdClass(),
	];

	// Include Yoast SEO meta if available
	if ( class_exists( 'WPSEO_Meta' ) ) {
		$response['yoast_head_json'] = [
			'title'       => WPSEO_Meta::get_value( 'title', $post_id ),
			'description' => WPSEO_Meta::get_value( 'metadesc', $post_id ),
		];
	}

	return new WP_REST_Response( $response, 200 );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. REDIRECT ALL FRONT-END PAGE VIEWS TO REACT SITE
// ─────────────────────────────────────────────────────────────────────────────
//
// When anyone visits a page on the WordPress domain,
// they are redirected to the same path on the React front-end. This means:
//   • "View Page" / "View Site" in WP admin → React front-end
//   • Direct URL visits → React front-end
//   • Published pages → React front-end
//
// WordPress admin, REST API, login, and asset URLs are NOT redirected.

add_action( 'template_redirect', function () {
	if ( ! defined( 'SZ_FRONTEND_URL' ) ) {
		return;
	}

	// Never redirect admin, AJAX, cron, or REST API requests
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return;
	}

	// Never redirect WordPress infrastructure paths
	$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
	if ( preg_match( '#^/(wp-admin|wp-json|wp-content|wp-login|wp-cron|wp-includes)#i', $request_uri ) ) {
		return;
	}

	// Build the front-end URL with the same path
	$frontend_url = rtrim( SZ_FRONTEND_URL, '/' );

	// For the homepage
	if ( is_front_page() || is_home() ) {
		wp_redirect( $frontend_url . '/', 302 );
		exit;
	}

	// For pages, use the page slug to build the correct path
	if ( is_page() ) {
		$slug = get_post_field( 'post_name', get_queried_object_id() );
		wp_redirect( $frontend_url . '/' . $slug, 302 );
		exit;
	}

	// For single posts (blog), redirect to /{slug}
	if ( is_single() ) {
		$slug = get_post_field( 'post_name', get_queried_object_id() );
		wp_redirect( $frontend_url . '/' . $slug, 302 );
		exit;
	}

	// Fallback: redirect with the current request URI
	wp_redirect( $frontend_url . $request_uri, 302 );
	exit;
} );

// ─────────────────────────────────────────────────────────────────────────────
// 4b. REDIRECT PREVIEW BUTTON TO REACT FRONT-END
// ─────────────────────────────────────────────────────────────────────────────

add_filter( 'preview_post_link', function ( $link, $post ) {
	if ( ! defined( 'SZ_FRONTEND_URL' ) || ! defined( 'SZ_PREVIEW_SECRET' ) ) {
		return $link;
	}

	return sprintf(
		'%s/preview?id=%d&secret=%s',
		rtrim( SZ_FRONTEND_URL, '/' ),
		$post->ID,
		urlencode( SZ_PREVIEW_SECRET )
	);
}, 10, 2 );

// ─────────────────────────────────────────────────────────────────────────────
// 4c. REWRITE "VIEW PAGE" PERMALINK IN ADMIN TO POINT AT REACT SITE
// ─────────────────────────────────────────────────────────────────────────────

add_filter( 'page_link', function ( $link, $post_id ) {
	if ( ! defined( 'SZ_FRONTEND_URL' ) || ! is_admin() ) {
		return $link;
	}
	$slug = get_post_field( 'post_name', $post_id );
	if ( ! $slug ) {
		return $link;
	}
	$frontend = rtrim( SZ_FRONTEND_URL, '/' );
	// Homepage check
	if ( (int) get_option( 'page_on_front' ) === (int) $post_id ) {
		return $frontend . '/';
	}
	return $frontend . '/' . $slug;
}, 10, 2 );

/**
 * Rewrite "View Post" permalink in admin to point at the React front-end.
 */
add_filter( 'post_link', function ( $link, $post ) {
	if ( ! defined( 'SZ_FRONTEND_URL' ) || ! is_admin() ) {
		return $link;
	}
	$slug = $post->post_name;
	if ( ! $slug ) {
		return $link;
	}
	return rtrim( SZ_FRONTEND_URL, '/' ) . '/' . $slug;
}, 10, 2 );

// ─────────────────────────────────────────────────────────────────────────────
// 5. ADMIN CLEANUP — HIDE POSTS, DECLUTTER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hide the Comments menu item — not used on this site.
 * Posts are now visible for blog functionality.
 */
add_action( 'admin_menu', function () {
	remove_menu_page( 'edit-comments.php' );  // Comments
} );

// ─────────────────────────────────────────────────────────────────────────────
// 5b. SOCIAL SEO MANAGER — CENTRALIZED TITLES/DESCRIPTIONS/IMAGES
// ─────────────────────────────────────────────────────────────────────────────
//
// Adds a dedicated admin page where editors can manage social/SEO metadata
// for all pages in one place, with live previews for Google, Facebook, and X.

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
							data-page-title="<?php echo esc_attr( strtolower( $page_title ) ); ?>"
							data-page-path="<?php echo esc_attr( strtolower( $page_permalink_label ) ); ?>"
							data-expanded="true"
						>
							<div class="sz-social-row__header">
								<div class="sz-social-row__titleblock">
									<strong><?php echo esc_html( $page_title ); ?></strong>
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

			var title = (titleInput && titleInput.value.trim()) || defaultTitle;
			var description = (descInput && descInput.value.trim()) || defaultDescription;
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

/**
 * Use ACF-only editing for Pages.
 *
 * Disables Gutenberg for pages so editors don't see:
 * - Block Inserter UI
 * - "Choose a pattern" modal
 *
 * This keeps page authoring aligned with the headless React + ACF workflow.
 */
add_filter( 'use_block_editor_for_post_type', function ( $use_block_editor, $post_type ) {
	if ( $post_type === 'page' || $post_type === 'post' ) {
		return false;
	}

	return $use_block_editor;
}, 10, 2 );

/**
 * Extra safety: disable block patterns globally in admin.
 */
add_filter( 'should_load_remote_block_patterns', '__return_false' );
add_filter( 'should_load_block_patterns', '__return_false' );

/**
 * Remove the default page content editor; content lives in ACF blocks.
 */
add_action( 'init', function () {
	remove_post_type_support( 'page', 'editor' );
}, 20 );

/**
 * Ensure page titles remain available for editors.
 *
 * Some themes/plugins can remove title support for pages; we force it on.
 */
add_action( 'init', function () {
	add_post_type_support( 'page', 'title' );
}, 30 );

/**
 * Add guidance under the Featured Image metabox for page editors.
 */
add_filter( 'admin_post_thumbnail_html', function ( $content, $post_id ) {
	$post = get_post( $post_id );
	if ( ! ( $post instanceof WP_Post ) || $post->post_type !== 'page' ) {
		return $content;
	}

	if ( strpos( $content, 'sz-featured-image-help' ) !== false ) {
		return $content;
	}

	$help = '<p class="description sz-featured-image-help">Used as the display image for social media link previews.</p>';
	return $content . $help;
}, 10, 2 );

/**
 * Prevent the page title box from being hidden via per-user Screen Options.
 */
add_action( 'admin_init', function () {
	global $pagenow;

	if ( ! in_array( $pagenow, [ 'post.php', 'post-new.php' ], true ) ) {
		return;
	}

	$post_type = $_GET['post_type'] ?? null;
	if ( $pagenow === 'post.php' && isset( $_GET['post'] ) ) {
		$post_type = get_post_type( (int) $_GET['post'] );
	}

	if ( $post_type !== 'page' ) {
		return;
	}

	$user_id = get_current_user_id();
	if ( ! $user_id ) {
		return;
	}

	$hidden = get_user_option( 'metaboxhidden_page', $user_id );
	if ( is_array( $hidden ) && in_array( 'titlediv', $hidden, true ) ) {
		$hidden = array_values( array_diff( $hidden, [ 'titlediv' ] ) );
		update_user_option( $user_id, 'metaboxhidden_page', $hidden, true );
	}
} );

/**
 * Redirect the admin default landing page to Pages list
 * instead of the Dashboard (which can look empty/cluttered for a headless site).
 */
add_filter( 'login_redirect', function ( $redirect_to, $requested_redirect_to, $user ) {
	if ( $requested_redirect_to === admin_url() && ! is_wp_error( $user ) ) {
		return admin_url( 'edit.php?post_type=page' );
	}
	return $redirect_to;
}, 10, 3 );

/**
 * Also redirect Dashboard visits to Pages.
 */
add_action( 'admin_init', function () {
	global $pagenow;
	if ( $pagenow === 'index.php' && ! isset( $_GET['page'] ) ) {
		wp_safe_redirect( admin_url( 'edit.php?post_type=page' ) );
		exit;
	}
} );

/**
 * Warn editors when PHP input variable limits are likely to truncate ACF data.
 *
 * Large Flexible Content pages (especially image repeaters) can exceed
 * `max_input_vars`, causing silent field loss on save/publish.
 */
add_action( 'admin_notices', function () {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || $screen->base !== 'post' || $screen->post_type !== 'page' ) {
		return;
	}

	$raw_limit = ini_get( 'max_input_vars' );
	$limit     = is_string( $raw_limit ) ? (int) $raw_limit : 0;

	if ( $limit <= 0 || $limit >= 5000 ) {
		return;
	}

	echo '<div class="notice notice-warning"><p>';
	echo '<strong>Studio Zanetti:</strong> This server is configured with <code>max_input_vars=' . esc_html( (string) $limit ) . '</code>. ';
	echo 'Large page builder edits may be truncated on save (blocks can disappear). ';
	echo 'Recommended minimum for this site: <code>5000</code> (preferably <code>10000</code>).';
	echo '</p></div>';
} );

/**
 * Remove clutter from the Dashboard widgets.
 */
add_action( 'wp_dashboard_setup', function () {
	remove_meta_box( 'dashboard_quick_press', 'dashboard', 'side' );   // Quick Draft
	remove_meta_box( 'dashboard_right_now', 'dashboard', 'normal' );   // At a Glance
	remove_meta_box( 'dashboard_activity', 'dashboard', 'normal' );    // Activity
	remove_meta_box( 'dashboard_primary', 'dashboard', 'side' );       // WordPress Events/News
} );

// ─────────────────────────────────────────────────────────────────────────────
// 6. ADMIN CSS — WYSIWYG-STYLE EDITOR LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
//
// Keep styling intentionally light and scoped so the classic Page editor
// remains stable and predictable.

add_action( 'admin_head', function () {
	global $pagenow;
	?>
	<style>
		/* ── Pages list table ───────────────────────────────── */
		.wp-list-table .column-title { width: 40%; }
		.wp-list-table .column-author { width: 15%; }
		.wp-list-table .column-date { width: 15%; }

		/* ── Page editor: stable scoped layout ──────────────── */
		<?php if ( in_array( $pagenow, [ 'post.php', 'post-new.php' ], true ) ) : ?>

		body.post-type-page #titlediv,
		body.post-type-page #titlewrap,
		body.post-type-page #title {
			display: block !important;
			visibility: visible !important;
			opacity: 1 !important;
		}

		body.post-type-page #postimagediv,
		body.post-type-page #postimagediv .inside {
			display: block !important;
			visibility: visible !important;
			opacity: 1 !important;
		}

		body.post-type-page #titlediv {
			margin: 12px 0 16px !important;
		}

		body.post-type-page #title {
			font-size: 24px !important;
			line-height: 1.3 !important;
			padding: 12px !important;
			min-height: 52px !important;
			border-radius: 6px !important;
		}

		body.post-type-page #acf-group_sz_page_settings {
			margin-top: 12px !important;
		}

		body.post-type-page #acf-group_sz_page_settings .inside {
			padding-bottom: 12px !important;
		}

		body.post-type-page #acf-group_sz_page_settings .acf-fields > .acf-field {
			padding-left: 12px !important;
			padding-right: 12px !important;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent {
			padding: 12px;
			margin-top: 0;
			border-bottom: 1px solid #dcdcde;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #pageparentdiv {
			margin: 0 !important;
			border: none;
			box-shadow: none;
			background: transparent;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #pageparentdiv .hndle,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #pageparentdiv .handlediv {
			display: none;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #pageparentdiv .postbox-header,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #pageparentdiv .handle-actions,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #pageparentdiv .handle-order-higher,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #pageparentdiv .handle-order-lower {
			display: none !important;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #pageparentdiv .inside {
			padding: 0 !important;
			margin: 0 !important;
		}

		/* Hide Template and Order in Page Attributes — keep Parent only */
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent .page-template-label-wrapper,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #page_template,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent .menu-order-label-wrapper,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent #menu_order,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-parent .howto {
			display: none !important;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-slug {
			padding: 12px;
			margin-top: 12px;
			border-top: 1px solid #dcdcde;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-slug h3 {
			margin: 0 0 8px;
			font-size: 13px;
			line-height: 1.4;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-slug p.description {
			margin: 0 0 8px;
			color: #50575e;
			font-size: 13px;
		}

		body.post-type-page #acf-group_sz_page_settings #sz-editable-slug {
			padding: 6px 8px;
			border: 1px solid #dcdcde;
			border-radius: 4px;
			font-size: 13px;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image {
			padding: 12px;
			margin: 12px 0 0 0;
			border-top: 1px solid #dcdcde;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image h3 {
			margin: 0 0 8px;
			font-size: 13px;
			line-height: 1.4;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv {
			margin: 0 !important;
			border: none !important;
			box-shadow: none !important;
			background: transparent !important;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv .hndle,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv .handlediv {
			display: none !important;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv .postbox-header,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv .handle-actions,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv .handle-order-higher,
		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv .handle-order-lower {
			display: none !important;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv .inside {
			padding: 0 !important;
			margin: 0 !important;
		}

		body.post-type-page #acf-group_sz_page_settings .sz-page-settings-featured-image #postimagediv.closed .inside {
			display: block !important;
		}

		body.post-type-page #pageparentdiv {
			margin-top: 12px !important;
		}

		body.post-type-page #authordiv {
			margin-top: 40px !important;
		}

		/* Keep preview panel clean but non-invasive */
		#sz-live-preview {
			border: 1px solid #dcdcde !important;
			border-radius: 8px !important;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
			margin: 0 0 16px !important;
			background: #fff !important;
		}
		#sz-live-preview .inside {
			padding: 10px 12px 12px !important;
			margin: 0 !important;
		}

		/* ACF block rows: subtle spacing only */
		body.post-type-page .acf-flexible-content .layout {
			margin-bottom: 1rem;
			border: 1px solid #ddd;
			border-radius: 6px;
			transition: outline 0.3s;
		}

		body.post-type-page .acf-flexible-content .layout.sz-highlight {
			outline: 3px solid #0073aa;
			outline-offset: 2px;
		}

		/* Hide default content editor region if present */
		body.post-type-page #postdivrich {
			display: none !important;
		}

		/* Hint text under the preview */
		.sz-editor-hint {
			text-align: center;
			padding: 8px;
			color: #888;
			font-size: 13px;
			background: #f9f9f9;
			border-top: 1px solid #eee;
		}

		/* Responsive: smaller screens */
		@media screen and (max-width: 782px) {
			.wp-list-table td,
			.wp-list-table th {
				padding: 8px 6px;
			}
		}

		/* ── Post editor: font consistency with live site ──── */
		body.post-type-post #title {
			font-family: Georgia, 'Times New Roman', serif;
			font-size: 24px;
			line-height: 1.3;
		}

		body.post-type-post #titlediv {
			margin: 12px 0 16px;
		}

		<?php endif; ?>
	</style>
	<?php
} );

/**
 * Inject live-site fonts into the Classic Editor (TinyMCE) iframe so the
 * editing experience matches the front-end typography.
 */
add_filter( 'tiny_mce_before_init', function ( $settings ) {
	$font_css  = 'body { font-family: \'Segoe UI\', system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.6; color: #4a3b4f; }';
	$font_css .= ' h1, h2, h3, h4 { font-family: Georgia, \'Times New Roman\', serif; line-height: 1.2; }';

	if ( ! empty( $settings['content_style'] ) ) {
		$settings['content_style'] .= ' ' . $font_css;
	} else {
		$settings['content_style'] = $font_css;
	}

	// Force Enter key to create <p> tags instead of <br> or &nbsp;
	$settings['forced_root_block'] = 'p';
	$settings['force_br_newlines'] = false;
	$settings['force_p_newlines']  = true;

	return $settings;
} );

/**
 * Defensive safety net for ACF WYSIWYG values returned via REST.
 *
 * The TinyMCE editor stores HTML containing `<p>` and `<br>` tags, and ACF's
 * own format_value normally runs `apply_filters( 'the_content', … )` (which
 * includes `wpautop`). However, in some edge cases — content imported as
 * plain text, third-party REST consumers requesting unformatted values, or
 * fields whose stored value lost its paragraph wrapping — the React front-end
 * receives raw text with literal newline characters. Browsers collapse those
 * newlines to a single space, so multi-paragraph content renders as one long
 * sentence.
 *
 * This filter guarantees that any wysiwyg value reaching the REST API is run
 * through `wpautop` so the front-end always receives proper paragraph and
 * line-break markup. It is idempotent on already-wrapped HTML.
 */
add_filter( 'acf/format_value/type=wysiwyg', function ( $value ) {
	if ( ! is_string( $value ) || $value === '' ) {
		return $value;
	}

	// Avoid double-wrapping: if the value already starts with a block-level
	// tag, wpautop is effectively a no-op but skipping it also saves work.
	if ( ! preg_match( '/<\\s*(p|div|h[1-6]|ul|ol|blockquote|pre|table|figure|section|article)\\b/i', $value ) ) {
		$value = wpautop( $value );
	}

	return $value;
}, 20 );

// ─────────────────────────────────────────────────────────────────────────────
// 7. LIVE PREVIEW PANEL IN PAGE EDITOR
// ─────────────────────────────────────────────────────────────────────────────
//
// Shows an iframe of the React front-end inside the WordPress page editor.
// The preview ONLY refreshes when the admin explicitly clicks "Refresh Preview"
// or uses the Ctrl+Shift+P shortcut. No auto-refresh timers.
//
// Clicking a block in the preview scrolls to and highlights the matching
// ACF Flexible Content layout row in the editor (via postMessage bridge).

add_action( 'add_meta_boxes', function () {
	add_meta_box(
		'sz-live-preview',
		'🖥 Live Front-End Preview',
		'sz_live_preview_html',
		'page',
		'normal',
		'high'
	);
} );

/**
 * Render the live preview metabox HTML.
 */
function sz_live_preview_html( $post ) {
	if ( ! defined( 'SZ_FRONTEND_URL' ) || ! defined( 'SZ_PREVIEW_SECRET' ) ) {
		echo '<div style="padding:2rem;text-align:center;background:#fff8e1;border:1px solid #ffe082;border-radius:6px;">';
		echo '<h3 style="margin:0 0 0.5rem;">⚠️ Preview not configured</h3>';
		echo '<p>Add these constants to <code>wp-config.php</code> to enable the live preview:</p>';
		echo '<pre style="text-align:left;background:#f5f5f5;padding:1rem;border-radius:4px;max-width:500px;margin:1rem auto;">define( \'SZ_FRONTEND_URL\', \'https://your-frontend.com\' );<br>define( \'SZ_PREVIEW_SECRET\', \'your-random-secret\' );</pre>';
		echo '</div>';
		return;
	}

	$preview_url = sprintf(
		'%s/preview?id=%d&secret=%s&iframe=true',
		rtrim( SZ_FRONTEND_URL, '/' ),
		$post->ID,
		rawurlencode( SZ_PREVIEW_SECRET )
	);

	$is_new_post = ( $post->post_status === 'auto-draft' );
	?>
	<div id="sz-preview-container">
		<div id="sz-preview-toolbar" style="display:flex;align-items:center;gap:12px;padding:10px 0;flex-wrap:wrap;">
			<button type="button" id="sz-refresh-preview" class="button button-primary" <?php echo $is_new_post ? 'disabled' : ''; ?>>
				↻ Refresh Preview
			</button>
			<span id="sz-preview-status" style="color:#666;font-size:13px;">
				<?php echo $is_new_post
					? 'Save this page as a draft first to enable preview.'
					: 'Loading preview…'; ?>
			</span>
		</div>

		<div id="sz-preview-sizes" style="display:flex;gap:6px;margin-bottom:10px;">
			<button type="button" class="button button-primary sz-size-btn active" data-width="100%">🖥 Desktop</button>
			<button type="button" class="button sz-size-btn" data-width="768px">📱 Tablet</button>
			<button type="button" class="button sz-size-btn" data-width="375px">📱 Mobile</button>
			<button type="button" class="button" id="sz-fullscreen-btn" style="margin-left:auto;">⛶ Full Screen</button>
		</div>

		<?php if ( $is_new_post ) : ?>
			<div id="sz-preview-placeholder" style="background:#f9f9f9;border:2px dashed #ddd;border-radius:8px;padding:4rem 2rem;text-align:center;color:#999;">
				<p style="font-size:16px;margin:0;">Save this page as a <strong>Draft</strong> to see the live preview here.</p>
			</div>
		<?php else : ?>
			<div id="sz-preview-frame-wrapper" style="position:relative;background:#f0f0f0;border-radius:8px;overflow:hidden;transition:all 0.3s;">
				<div id="sz-preview-loading" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(255,255,255,0.9);z-index:10;font-size:14px;color:#666;">
					Loading preview…
				</div>
				<iframe
					id="sz-preview-frame"
					data-src="<?php echo esc_url( $preview_url ); ?>"
					src="<?php echo esc_url( $preview_url ); ?>&_cb=<?php echo time(); ?>"
					style="width:100%;height:800px;border:none;display:block;transition:width 0.3s;margin:0 auto;"
					data-loaded="true"
					title="Live front-end preview"
				></iframe>
			</div>
		<?php endif; ?>

		<div class="sz-editor-hint">
			👆 Click any block above to jump to its fields below &nbsp;·&nbsp;
			<kbd style="background:#f0f0f0;padding:2px 6px;border:1px solid #ccc;border-radius:3px;font-size:11px;">Ctrl+Shift+P</kbd> to refresh preview
		</div>
	</div>
	<?php
}

/**
 * Enqueue the live preview JavaScript on the page editor screen.
 */
add_action( 'admin_footer-post.php', 'sz_live_preview_js' );
add_action( 'admin_footer-post-new.php', 'sz_live_preview_js' );

function sz_live_preview_js() {
	global $post_type;
	if ( $post_type !== 'page' ) return;
	if ( ! defined( 'SZ_FRONTEND_URL' ) || ! defined( 'SZ_PREVIEW_SECRET' ) ) return;
	?>
	<script>
	(function () {
		'use strict';

		/* ── Force title field visibility (Screen Options safety) ── */
		var titleDiv = document.getElementById('titlediv');
		if (titleDiv) {
			titleDiv.style.display = 'block';
			titleDiv.style.visibility = 'visible';
			titleDiv.style.opacity = '1';
		}
		var titleWrap = document.getElementById('titlewrap');
		if (titleWrap) {
			titleWrap.style.display = 'block';
			titleWrap.style.visibility = 'visible';
			titleWrap.style.opacity = '1';
		}
		var titleInput = document.getElementById('title');
		if (titleInput) {
			titleInput.style.display = 'block';
			titleInput.style.visibility = 'visible';
			titleInput.style.opacity = '1';
		}

		function movePageEditorMetaBoxes() {
			var sideSortables = document.getElementById('side-sortables');
			var normalSortables = document.getElementById('normal-sortables');
			var pageSettingsBox = document.getElementById('acf-group_sz_page_settings');
			var publishBox = document.getElementById('submitdiv');
			var featuredImageBox = document.getElementById('postimagediv');
			var pageAttributesBox = document.getElementById('pageparentdiv');
			var authorBox = document.getElementById('authordiv');
			var revisionsBox = document.getElementById('revisionsdiv');
			var slugBox = document.getElementById('edit-slug-box');
			var slugMetaBox = document.getElementById('slugdiv');

			// Remove standalone slug box entirely (inline permalink editor + Slug metabox)
			if (slugBox && slugBox.parentNode) {
				slugBox.parentNode.removeChild(slugBox);
			}
			if (slugMetaBox && slugMetaBox.parentNode) {
				slugMetaBox.parentNode.removeChild(slugMetaBox);
			}

			if (sideSortables && pageSettingsBox) {
				var publishNext = publishBox && publishBox.parentNode === sideSortables
					? publishBox.nextSibling
					: sideSortables.firstChild;
				sideSortables.insertBefore(pageSettingsBox, publishNext);
			}

			if (pageSettingsBox) {
				var inside = pageSettingsBox.querySelector('.inside');
				
				// Add Page Parent (Page Attributes) to Page Settings
				if (inside && pageAttributesBox && !inside.querySelector('#pageparentdiv')) {
					var parentWrapper = document.createElement('div');
					parentWrapper.className = 'sz-page-settings-parent';
					inside.appendChild(parentWrapper);
					parentWrapper.appendChild(pageAttributesBox);
				}
				
				// Add editable slug field in Page Settings
				if (inside && !inside.querySelector('.sz-page-settings-slug')) {
					var slugWrapper = document.createElement('div');
					slugWrapper.className = 'sz-page-settings-slug';
					var slugHeading = document.createElement('h3');
					slugHeading.textContent = 'Slug';
					var slugCaption = document.createElement('p');
					slugCaption.className = 'description';
					slugCaption.textContent = 'Controls the URL of the page. Change this if you want to override the URL to something different to the Page Title.';
					var slugInput = document.createElement('input');
					slugInput.type = 'text';
					slugInput.id = 'sz-editable-slug';
					slugInput.name = 'post_name';
					slugInput.value = document.querySelector('input[name="post_name"]') ? document.querySelector('input[name="post_name"]').value : '';
					slugInput.style.width = '100%';
					slugInput.style.padding = '6px 8px';
					slugInput.style.border = '1px solid #dcdcde';
					slugInput.style.borderRadius = '4px';
					
					slugWrapper.appendChild(slugHeading);
					slugWrapper.appendChild(slugCaption);
					slugWrapper.appendChild(slugInput);
					inside.appendChild(slugWrapper);
				}
			}

			if (pageSettingsBox && featuredImageBox) {
				var inside = pageSettingsBox.querySelector('.inside');
				if (inside && !inside.querySelector('.sz-page-settings-featured-image')) {
					featuredImageBox.classList.remove('closed');
					var wrapper = document.createElement('div');
					wrapper.className = 'sz-page-settings-featured-image';
					var heading = document.createElement('h3');
					heading.textContent = 'Featured Image';
					wrapper.appendChild(heading);
					wrapper.appendChild(featuredImageBox);
					inside.appendChild(wrapper);
					var featuredImageInside = featuredImageBox.querySelector('.inside');
					if (featuredImageInside) {
						featuredImageInside.style.display = 'block';
					}
				}
			}

			if (normalSortables) {
				if (authorBox) {
					normalSortables.appendChild(authorBox);
				}
				if (revisionsBox) {
					normalSortables.appendChild(revisionsBox);
				}
			}
		}

		movePageEditorMetaBoxes();

		var iframe          = document.getElementById('sz-preview-frame');
		var refreshBtn      = document.getElementById('sz-refresh-preview');
		var statusEl        = document.getElementById('sz-preview-status');
		var loadingOverlay  = document.getElementById('sz-preview-loading');
		var initialPlaceholder = null; // removed: preview loads immediately
		var frameWrapper    = document.getElementById('sz-preview-frame-wrapper');
		var fullscreenBtn   = document.getElementById('sz-fullscreen-btn');
		var postForm        = document.getElementById('post');
		var maxInputVars    = <?php echo (int) ini_get( 'max_input_vars' ); ?>;
		var frontendBaseUrl = <?php echo wp_json_encode( rtrim( SZ_FRONTEND_URL, '/' ) ); ?>;
		var frontendOrigin  = '';
		var previewWindows  = [];
		var draftSyncTimer  = null;

		try {
			frontendOrigin = new URL(frontendBaseUrl).origin;
		} catch (err) {
			frontendOrigin = '';
		}

		if (!iframe || !refreshBtn) return;

		if (postForm) {
			postForm.addEventListener('submit', function (event) {
				var namedInputs = postForm.querySelectorAll('input[name], select[name], textarea[name]').length;
				var threshold = maxInputVars > 0 ? Math.floor(maxInputVars * 0.9) : 0;

				if (threshold > 0 && namedInputs >= threshold) {
					var message =
						'This page has ' + namedInputs + ' input fields and your server max_input_vars is ' + maxInputVars + '.\n\n' +
						'Saving now may truncate fields (blocks can disappear).\n\n' +
						'Click Cancel to stop and split content into smaller blocks/pages, or increase max_input_vars (recommended 5000-10000).';

					if (!window.confirm(message)) {
						event.preventDefault();
						return;
					}
				}

				setStatus('Saving in WordPress... large pages can take up to 1-2 minutes.');
				refreshBtn.disabled = true;
			});
		}

		/* ── Helpers ─────────────────────────────────────────── */
		function setStatus(text) {
			if (statusEl) statusEl.innerHTML = text;
		}

		function showLoading() {
			if (loadingOverlay) loadingOverlay.style.display = 'flex';
		}

		function hideLoading() {
			if (loadingOverlay) loadingOverlay.style.display = 'none';
		}

		function normalizeValue(value) {
			if (Array.isArray(value)) {
				return value.map(normalizeValue);
			}

			if (typeof value !== 'string') return value;

			var trimmed = value.trim();
			if (trimmed === '') return '';
			if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
				return Number(trimmed);
			}

			return value;
		}

		function getDirectFieldElements(container) {
			if (!container || !container.children) return [];

			var fields = [];
			Array.prototype.forEach.call(container.children, function (child) {
				if (!child || !child.classList) return;

				if (child.classList.contains('acf-field') && child.dataset && child.dataset.name) {
					fields.push(child);
					return;
				}

				Array.prototype.forEach.call(child.children || [], function (grandchild) {
					if (
						grandchild &&
						grandchild.classList &&
						grandchild.classList.contains('acf-field') &&
						grandchild.dataset &&
						grandchild.dataset.name
					) {
						fields.push(grandchild);
					}
				});
			});

			return fields;
		}

		function serializeFieldMap(container) {
			var data = {};
			getDirectFieldElements(container).forEach(function (fieldEl) {
				var fieldName = fieldEl.dataset ? fieldEl.dataset.name : '';
				if (!fieldName) return;

				var value = serializeField(fieldEl);
				if (typeof value === 'undefined') return;

				data[fieldName] = value;
			});

			return data;
		}

		function serializeImageField(fieldEl) {
			var image = fieldEl.querySelector('.acf-image-uploader img');
			if (!image || !image.getAttribute('src')) return undefined;

			return {
				url: image.getAttribute('src') || '',
				alt: image.getAttribute('alt') || '',
			};
		}

		function serializeRepeaterField(fieldEl) {
			var rows = fieldEl.querySelectorAll('.acf-table > tbody > .acf-row:not(.acf-clone), .acf-repeater > table > tbody > .acf-row:not(.acf-clone)');
			return Array.prototype.map.call(rows, function (row) {
				var fieldsContainer = row.querySelector(':scope > .acf-fields');
				return serializeFieldMap(fieldsContainer || row);
			});
		}

		function serializeFlexibleField(fieldEl) {
			var layouts = fieldEl.querySelectorAll('.acf-flexible-content > .values > .layout:not(.acf-clone), .acf-flexible-content .values > .layout:not(.acf-clone)');
			return Array.prototype.map.call(layouts, function (layout) {
				var fieldsContainer = layout.querySelector(':scope > .acf-fields');
				var layoutData = serializeFieldMap(fieldsContainer || layout);
				layoutData.acf_fc_layout = layout.dataset ? layout.dataset.layout : '';
				return layoutData;
			});
		}

		function serializeSimpleField(fieldEl) {
			var multipleSelect = fieldEl.querySelector('select[multiple]');
			if (multipleSelect) {
				return Array.prototype.map.call(multipleSelect.selectedOptions || [], function (option) {
					return normalizeValue(option.value);
				});
			}

			var select = fieldEl.querySelector('select');
			if (select) return normalizeValue(select.value);

			var checkboxList = fieldEl.querySelectorAll('.acf-checkbox-list input[type="checkbox"]:checked');
			if (checkboxList.length > 0) {
				return Array.prototype.map.call(checkboxList, function (input) {
					return normalizeValue(input.value);
				});
			}

			var radio = fieldEl.querySelector('.acf-radio-list input[type="radio"]:checked');
			if (radio) return normalizeValue(radio.value);

			var trueFalse = fieldEl.querySelector('input[type="checkbox"]');
			if (trueFalse && fieldEl.classList.contains('acf-field-true-false')) {
				return !!trueFalse.checked;
			}

			var textarea = fieldEl.querySelector('textarea');
			if (textarea) return textarea.value;

			var input = fieldEl.querySelector('input[type="text"], input[type="number"], input[type="url"], input[type="email"], input[type="tel"], input[type="hidden"]');
			if (input) return normalizeValue(input.value);

			return undefined;
		}

		function serializeField(fieldEl) {
			if (!fieldEl || !fieldEl.classList) return undefined;

			if (fieldEl.classList.contains('acf-field-flexible-content')) {
				return serializeFlexibleField(fieldEl);
			}

			if (fieldEl.classList.contains('acf-field-repeater')) {
				return serializeRepeaterField(fieldEl);
			}

			if (fieldEl.classList.contains('acf-field-group')) {
				var nestedFields = fieldEl.querySelector(':scope > .acf-fields') || fieldEl.querySelector('.acf-fields');
				return serializeFieldMap(nestedFields || fieldEl);
			}

			if (fieldEl.classList.contains('acf-field-image')) {
				return serializeImageField(fieldEl);
			}

			return serializeSimpleField(fieldEl);
		}

		function buildPreviewPageState() {
			var postIdInput = document.getElementById('post_ID');
			var titleValue = titleInput ? titleInput.value : '';
			var contentInput = document.getElementById('content');
			var blocksField = document.querySelector('.acf-field-flexible-content[data-name="blocks"]');
			var blocks = blocksField ? serializeFlexibleField(blocksField) : undefined;

			return {
				id: postIdInput ? parseInt(postIdInput.value, 10) || 0 : 0,
				title: { rendered: titleValue },
				content: { rendered: contentInput ? contentInput.value : '' },
				excerpt: { rendered: '' },
				acf: {
					blocks: Array.isArray(blocks) ? blocks : [],
				},
			};
		}

		function prunePreviewWindows() {
			previewWindows = previewWindows.filter(function (previewWindow) {
				return previewWindow && !previewWindow.closed;
			});
		}

		function postPreviewState(targetWindow) {
			if (!targetWindow || targetWindow.closed) return false;
			if (!frontendOrigin) return false;

			try {
				targetWindow.postMessage(
					{
						source: 'sz-editor',
						action: 'preview-state',
						page: buildPreviewPageState(),
					},
					frontendOrigin
				);
				return true;
			} catch (err) {
				return false;
			}
		}

		function broadcastPreviewState() {
			var sent = false;

			if (iframe && iframe.contentWindow) {
				sent = postPreviewState(iframe.contentWindow) || sent;
			}

			prunePreviewWindows();
			previewWindows.forEach(function (previewWindow) {
				sent = postPreviewState(previewWindow) || sent;
			});

			if (sent) {
				setStatus('Updated ' + new Date().toLocaleTimeString() + ' - Live preview includes unsaved changes.');
			}

			return sent;
		}

		function schedulePreviewUpdate() {
			if (draftSyncTimer) {
				window.clearTimeout(draftSyncTimer);
			}

			draftSyncTimer = window.setTimeout(function () {
				broadcastPreviewState();
			}, 250);
		}

		function bindPreviewFrame(frame) {
			if (!frame) return;

			frame.addEventListener('load', function () {
				if (frame.dataset.loaded !== 'true') return;
				hideLoading();
				setStatus(
					'Updated ' +
						new Date().toLocaleTimeString() +
						(pendingChanges
							? ' - Live preview includes unsaved changes.'
							: ' - Preview reflects current editor state.')
				);
				postPreviewState(frame.contentWindow);
			});
		}

		function ensurePreviewLoaded(forceReload) {
			var previewUrl = iframe ? iframe.getAttribute('data-src') : null;
			if (!iframe || !previewUrl) return;

			if (initialPlaceholder) {
				initialPlaceholder.style.display = 'none';
			}

			showLoading();
			setStatus((iframe.dataset.loaded === 'true' && forceReload)
				? 'Refreshing preview…'
				: 'Loading preview…');

			iframe.src = previewUrl + '&_cb=' + Date.now();
			iframe.dataset.loaded = 'true';
			refreshBtn.textContent = '↻ Refresh Preview';
		}

		var pendingChanges = false;

		function markPending() {
			if (refreshBtn.disabled) return;
			pendingChanges = true;
			setStatus('Updating live preview with your latest editor changes…');
			schedulePreviewUpdate();
		}

		/* Show initial loading state */
		showLoading();
		setStatus('Loading preview…');
		iframe.dataset.loaded = 'true';
		bindPreviewFrame(iframe);

		if (typeof jQuery !== 'undefined') {
			jQuery(document).on('after-autosave', function () {
				pendingChanges = true;
				broadcastPreviewState();
			});
		}

		refreshBtn.addEventListener('click', function () {
			refreshBtn.disabled = true;
			ensurePreviewLoaded(true);

			window.setTimeout(function () {
				refreshBtn.disabled = false;
				broadcastPreviewState();
			}, 400);
		});

		/* ── Mark pending on field edits ─────────────────────── */
		/* Do NOT reload the iframe here — content won't have     */
		/* changed in WordPress yet. Just show a pending status.  */
		if (postForm) {
			postForm.addEventListener('input', function (event) {
				var target = event.target;
				if (!target || !target.name) return;
				markPending();
			});

			postForm.addEventListener('change', function (event) {
				var target = event.target;
				if (!target || !target.name) return;
				markPending();
			});
		}

		if (typeof window.acf !== 'undefined' && typeof window.acf.addAction === 'function') {
			window.acf.addAction('ready', function () { movePageEditorMetaBoxes(); });
			window.acf.addAction('append', function () { markPending(); });
			window.acf.addAction('remove', function () { markPending(); });
			window.acf.addAction('sortstop', function () { markPending(); });
		}

		/* ── Keyboard shortcut: Ctrl+Shift+P ─────────────────── */
		document.addEventListener('keydown', function (e) {
			if (e.ctrlKey && e.shiftKey && e.key === 'P') {
				e.preventDefault();
				refreshBtn.click();
			}
		});

		document.addEventListener('click', function (event) {
			var target = event.target;
			if (!target || typeof target.closest !== 'function') return;

			var previewLink = target.closest('a[href*="/preview?id="], a[target="wp-preview"], #post-preview, #preview-action a');
			if (!previewLink || !previewLink.href) return;

			event.preventDefault();

			var previewWindow = window.open(previewLink.href, previewLink.target || 'wp-preview');
			if (!previewWindow) {
				window.location.href = previewLink.href;
				return;
			}

			previewWindows.push(previewWindow);
			prunePreviewWindows();
			setStatus('Opening preview with current unpublished changes…');
		}, true);

		/* ── postMessage bridge: click-to-edit ────────────────── */
		/* When the admin clicks a block in the iframe preview,   */
		/* the React app sends { source:'sz-preview', action:     */
		/* 'focus-block', index: N }. We scroll to and highlight  */
		/* the Nth ACF Flexible Content layout row in the editor. */
		window.addEventListener('message', function (event) {
			if (frontendOrigin && event.origin !== frontendOrigin) return;

			var data = event.data;
			if (!data || data.source !== 'sz-preview') return;

			if (data.action === 'ready-for-state') {
				postPreviewState(event.source);
				return;
			}

			if (data.action === 'focus-block' && typeof data.index === 'number') {
				/* Find only the page "blocks" flexible-content rows (ignore clones). */
				var blocksField = document.querySelector('.acf-field-flexible-content[data-name="blocks"]');
				if (!blocksField) return;

				var layouts = blocksField.querySelectorAll('.acf-flexible-content .layout:not(.acf-clone)');
				var target  = layouts[data.index];

				/* Fallback for index mismatches: locate the first row by layout type. */
				if (!target && typeof data.layoutType === 'string' && data.layoutType) {
					target = blocksField.querySelector('.acf-flexible-content .layout[data-layout="' + data.layoutType + '"]:not(.acf-clone)');
				}

				if (!target) return;

				/* Remove previous highlights */
				layouts.forEach(function (el) {
					el.style.outline = '';
					el.style.outlineOffset = '';
					el.style.transition = '';
				});

				/* Scroll to & highlight the target layout */
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				target.style.transition = 'outline-color 0.3s';
				target.style.outline = '3px solid #0073aa';
				target.style.outlineOffset = '2px';

				/* Open the layout if it's collapsed */
				if (target.classList.contains('-collapsed')) {
					var toggle = target.querySelector('.acf-fc-layout-handle');
					if (toggle) toggle.click();
				}

				/* Remove highlight after 3 seconds */
				setTimeout(function () {
					target.style.outline = '';
					target.style.outlineOffset = '';
				}, 3000);
			}
		});

		/* ── Responsive size toggles ─────────────────────────── */
		document.querySelectorAll('.sz-size-btn').forEach(function (btn) {
			btn.addEventListener('click', function () {
				document.querySelectorAll('.sz-size-btn').forEach(function (b) {
					b.classList.remove('active');
					b.classList.remove('button-primary');
				});
				this.classList.add('active');
				this.classList.add('button-primary');
				var w = this.dataset.width;
				iframe.style.width  = w;
				iframe.style.margin = (w === '100%') ? '0' : '0 auto';
			});
		});

		/* ── Full-screen toggle ───────────────────────────────── */
		if (fullscreenBtn && frameWrapper) {
			var isFullscreen = false;
			fullscreenBtn.addEventListener('click', function () {
				isFullscreen = !isFullscreen;
				if (isFullscreen) {
					frameWrapper.style.position = 'fixed';
					frameWrapper.style.inset    = '0';
					frameWrapper.style.zIndex   = '100000';
					frameWrapper.style.borderRadius = '0';
					iframe.style.height = '100vh';
					iframe.style.width  = '100%';
					fullscreenBtn.textContent = '✕ Exit Full Screen';
				} else {
					frameWrapper.style.position = 'relative';
					frameWrapper.style.inset    = 'auto';
					frameWrapper.style.zIndex   = 'auto';
					frameWrapper.style.borderRadius = '8px';
					iframe.style.height = '800px';
					fullscreenBtn.textContent = '⛶ Full Screen';
					var active = document.querySelector('.sz-size-btn.active');
					if (active) {
						var w = active.dataset.width;
						iframe.style.width  = w;
						iframe.style.margin = (w === '100%') ? '0' : '0 auto';
					}
				}
			});
			document.addEventListener('keydown', function (e) {
				if (e.key === 'Escape' && isFullscreen) {
					fullscreenBtn.click();
				}
			});
		}

		/* ── After first draft save, replace placeholder ─────── */
		var placeholder = document.getElementById('sz-preview-placeholder');
		if (placeholder && typeof jQuery !== 'undefined') {
			jQuery(document).on('after-autosave', function () {
				if (placeholder.parentNode) {
					placeholder.parentNode.removeChild(placeholder);
					var wrapper = document.createElement('div');
					wrapper.id = 'sz-preview-frame-wrapper';
					wrapper.style.cssText = 'position:relative;background:#f0f0f0;border-radius:8px;overflow:hidden;';
					var loading = document.createElement('div');
					loading.id = 'sz-preview-loading';
					loading.style.cssText = 'position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(255,255,255,0.9);z-index:10;font-size:14px;color:#666;';
					loading.textContent = 'Loading preview…';
					wrapper.appendChild(loading);
					var newIframe = document.createElement('iframe');
					newIframe.id    = 'sz-preview-frame';
					newIframe.title = 'Live front-end preview';
					newIframe.style.cssText = 'width:100%;height:800px;border:none;display:block;';
					var postId = document.getElementById('post_ID').value;
					var previewSrc = '<?php echo esc_js( rtrim( SZ_FRONTEND_URL, "/" ) ); ?>/preview?id=' + postId +
						'&secret=<?php echo esc_js( rawurlencode( SZ_PREVIEW_SECRET ) ); ?>&iframe=true';
					newIframe.setAttribute('data-src', previewSrc);
					newIframe.src = previewSrc + '&_cb=' + Date.now();
					newIframe.dataset.loaded = 'true';
					wrapper.appendChild(newIframe);
					document.getElementById('sz-preview-container').appendChild(wrapper);
					iframe = newIframe;
					frameWrapper = wrapper;
					loadingOverlay = loading;
					refreshBtn.disabled = false;
					refreshBtn.textContent = '↻ Refresh Preview';
					showLoading();
					setStatus('Loading preview…');
					bindPreviewFrame(newIframe);
				}
			});
		}
	})();
	</script>
	<?php
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ACF OPTIONS PAGE — SITE-WIDE SETTINGS (HEADER / FOOTER)
// ─────────────────────────────────────────────────────────────────────────────
//
// Creates a "Site Settings" options page in the WP admin sidebar.
// The admin edits these ONCE and the values apply to every page.
//
// WORDPRESS SETUP (done automatically by this code if ACF Pro is active):
//   ACF → Options Page: "Site Settings"
//   Field Group: "Site Settings" (location: Options Page → Site Settings)
//     ├── site_name      (Text)       — e.g. "Studio Zanetti"
//     ├── tagline         (Text)       — e.g. "Capturing moments, creating memories"
//     ├── copyright_text  (Text)       — e.g. "© 2026 Studio Zanetti. All rights reserved."
//     │                                  (Leave blank to auto-generate from site_name + year)
//     └── social_links    (Repeater)
//           ├── platform  (Text)       — e.g. "Instagram"
//           └── url       (URL)        — e.g. "https://instagram.com/studiozanetti"
//
// REST endpoint: GET /wp-json/sz/v1/site-settings
//   Returns: { site_name, tagline, copyright_text, social_links: [{platform, url}] }

// Register the Options Page (requires ACF Pro)
add_action( 'acf/init', function () {
	if ( ! function_exists( 'acf_add_options_page' ) ) {
		return;
	}

	acf_add_options_page( [
		'page_title' => __( 'Site Settings', 'studio-zanetti' ),
		'menu_title' => __( 'Site Settings', 'studio-zanetti' ),
		'menu_slug'  => 'site-settings',
		'capability' => 'edit_posts',
		'icon_url'   => 'dashicons-admin-customizer',
		'position'   => 2, // Near the top of the admin sidebar
		'redirect'   => false,
	] );
} );

// REST endpoint to expose site settings to the React front-end
add_action( 'rest_api_init', function () {
	register_rest_route( 'sz/v1', '/site-settings', [
		'methods'             => 'GET',
		'callback'            => 'sz_get_site_settings',
		'permission_callback' => '__return_true',
	] );
} );

/**
 * REST callback: return global site settings from the ACF options page.
 */
function sz_get_site_settings() {
	if ( ! function_exists( 'get_field' ) ) {
		return new WP_REST_Response( [
			'site_name'      => get_bloginfo( 'name' ),
			'tagline'        => get_bloginfo( 'description' ),
			'copyright_text' => '',
			'social_links'   => [],
		], 200 );
	}

	$site_name      = get_field( 'site_name', 'option' ) ?: get_bloginfo( 'name' );
	$tagline        = get_field( 'tagline', 'option' ) ?: get_bloginfo( 'description' );
	$copyright_text = get_field( 'copyright_text', 'option' ) ?: '';
	$social_raw     = get_field( 'social_links', 'option' ) ?: [];

	$social_links = [];
	if ( is_array( $social_raw ) ) {
		foreach ( $social_raw as $link ) {
			if ( ! empty( $link['platform'] ) && ! empty( $link['url'] ) ) {
				$social_links[] = [
					'platform' => sanitize_text_field( $link['platform'] ),
					'url'      => esc_url_raw( $link['url'] ),
				];
			}
		}
	}

	return new WP_REST_Response( [
		'site_name'      => $site_name,
		'tagline'        => $tagline,
		'copyright_text' => $copyright_text,
		'social_links'   => $social_links,
	], 200 );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. ENSURE ACF FIELDS SHOW IN REST API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * If using ACF free (not Pro), the "ACF to REST API" plugin handles this.
 * If using ACF Pro, this filter ensures field groups expose their data
 * in the REST API response (show_in_rest).
 */
add_filter( 'acf/rest_api/field_settings/show_in_rest', '__return_true' );

// ─────────────────────────────────────────────────────────────────────────────
// 9b. NORMALISE ACF IMAGE FIELDS IN REST API RESPONSES
// ─────────────────────────────────────────────────────────────────────────────
//
// ACF image fields may return bare numeric attachment IDs instead of full
// objects when the field's "Return Format" is set to "Image ID" (the default)
// in the WordPress admin. This filter intercepts every page REST response and
// resolves numeric IDs to the { url, alt, width, height } shape the React
// front-end expects.
//
// It also flattens the hero "slides" repeater from [ {image: …}, … ] to a
// flat array of image objects, matching the front-end WPImage[] type.

add_filter( 'rest_prepare_page', 'sz_normalize_page_images', 20, 3 );

function sz_normalize_page_images( WP_REST_Response $response, WP_Post $post, WP_REST_Request $request ): WP_REST_Response {
	$data = $response->get_data();

	if ( ! empty( $data['acf']['blocks'] ) && is_array( $data['acf']['blocks'] ) ) {
		$hydrate_gallery_references = $request->get_param( 'context' ) !== 'edit';
		$data['acf']['blocks']      = array_map( function ( $block ) use ( $hydrate_gallery_references ) {
			return sz_normalize_block_images( $block, $hydrate_gallery_references );
		}, $data['acf']['blocks'] );
		$response->set_data( $data );
	}

	return $response;
}

/**
 * Walk a single ACF Flexible Content block and resolve every image field.
 */
function sz_normalize_block_images( array $block, bool $hydrate_gallery_references = true ): array {
	if ( $hydrate_gallery_references && ( $block['acf_fc_layout'] ?? '' ) === 'gallery_reference' ) {
		$resolved_gallery = array_key_exists( 'gallery_reference', $block )
			? sz_resolve_gallery_reference( $block['gallery_reference'] )
			: null;

		if ( $resolved_gallery ) {
			// Keep the stored reference lightweight in page payloads; hydrate only render fields.
			$block['gallery_reference'] = $resolved_gallery['id'];
			$block['heading']           = array_key_exists( 'heading', $block )
				? (string) $block['heading']
				: $resolved_gallery['title'];
			$block['description']       = $block['description'] ?? $resolved_gallery['description'];
			$block['images']            = $resolved_gallery['images'];
		}
	}

	// Top-level image fields (hero, image_text, gallery_categories)
	$image_keys = [ 'background_image', 'image', 'image_mobile' ];

	foreach ( $image_keys as $key ) {
		if ( array_key_exists( $key, $block ) ) {
			$block[ $key ] = sz_resolve_image( $block[ $key ] );
		}
	}

	// Hero slides repeater: [ {image: id|obj}, … ] → [ WPImage, … ]
	if ( ! empty( $block['slides'] ) && is_array( $block['slides'] ) ) {
		$block['slides'] = array_values( array_filter( array_map( function ( $slide ) {
			// Repeater row with an "image" sub-field
			if ( is_array( $slide ) && array_key_exists( 'image', $slide ) ) {
				$img = sz_resolve_image( $slide['image'] );
				if ( ! $img ) return null;
				// Preserve tagline and subtitle from the repeater row
				if ( ! empty( $slide['tagline'] ) ) {
					$img['tagline'] = $slide['tagline'];
				}
				if ( ! empty( $slide['subtitle'] ) ) {
					$img['subtitle'] = $slide['subtitle'];
				}
				return $img;
			}
			// Already a flat image (defensive)
			return sz_resolve_image( $slide );
		}, $block['slides'] ) ) );
	}

	// Repeaters whose rows contain an optional "image" sub-field
	$repeater_keys = [ 'services', 'categories', 'testimonials', 'steps', 'packages' ];
	foreach ( $repeater_keys as $rk ) {
		if ( ! empty( $block[ $rk ] ) && is_array( $block[ $rk ] ) ) {
			$block[ $rk ] = array_map( function ( $row ) {
				if ( is_array( $row ) && array_key_exists( 'image', $row ) ) {
					$row['image'] = sz_resolve_image( $row['image'] );
				}
				return $row;
			}, $block[ $rk ] );
		}
	}

	// Reusable Gallery block repeater: images[] rows contain { image, caption }.
	if (
		( $block['acf_fc_layout'] ?? '' ) === 'gallery_reference' &&
		! empty( $block['images'] ) &&
		is_array( $block['images'] )
	) {
		$block['images'] = sz_normalize_gallery_rows( $block['images'] );
	}

	// Instagram feed block: images[] is a flat image array.
	if ( ( $block['acf_fc_layout'] ?? '' ) === 'instagram_feed' && ! empty( $block['images'] ) && is_array( $block['images'] ) ) {
		$block['images'] = array_values( array_filter( array_map( 'sz_resolve_image', $block['images'] ) ) );
	}

	return $block;
}

/**
 * Resolve a single image value to { url, alt, width, height } or null.
 *
 * Handles three formats ACF may return:
 *   1. Numeric attachment ID  →  look up via WP functions
 *   2. Full ACF array         →  extract the four fields we use
 *   3. URL string             →  wrap in { url }
 *
 * Returns null for empty / unresolvable values so the front-end can
 * safely skip rendering.
 */
function sz_resolve_image( $value ) {
	// Empty / false / "0"
	if ( empty( $value ) ) {
		return null;
	}

	// Already a resolved image object (ACF return_format = array)
	if ( is_array( $value ) && ! empty( $value['url'] ) ) {
		return [
			'url'    => $value['url'],
			'alt'    => $value['alt'] ?? '',
			'width'  => $value['width'] ?? null,
			'height' => $value['height'] ?? null,
		];
	}

	// Numeric attachment ID (ACF return_format = id, or manual entry)
	if ( is_numeric( $value ) ) {
		$id  = (int) $value;
		$src = wp_get_attachment_image_src( $id, 'full' );
		if ( ! $src ) {
			return null;
		}
		return [
			'url'    => $src[0],
			'alt'    => get_post_meta( $id, '_wp_attachment_image_alt', true ) ?: '',
			'width'  => $src[1],
			'height' => $src[2],
		];
	}

	// URL string (ACF return_format = url)
	if ( is_string( $value ) && filter_var( $value, FILTER_VALIDATE_URL ) ) {
		return [
			'url' => $value,
			'alt' => '',
		];
	}

	return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. REST API — BLOG POSTS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
//
// GET /wp-json/sz/v1/blog-posts?categories=1,2&page=1&per_page=6
//   Returns posts filtered by category (optional), with paginated envelope.
//   When categories is empty/omitted, returns all published posts.
//
// GET /wp-json/sz/v1/all-posts
//   Lightweight list of all published post slugs (for prerender / sitemap).

add_action( 'rest_api_init', function () {
	register_rest_route( 'sz/v1', '/blog-posts', [
		'methods'             => 'GET',
		'callback'            => 'sz_get_blog_posts',
		'permission_callback' => '__return_true',
		'args'                => [
			'categories' => [
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'page' => [
				'default'           => 1,
				'validate_callback' => function ( $param ) {
					return is_numeric( $param ) && (int) $param >= 1;
				},
			],
			'per_page' => [
				'default'           => 6,
				'validate_callback' => function ( $param ) {
					return is_numeric( $param ) && (int) $param >= 1 && (int) $param <= 100;
				},
			],
		],
	] );

	register_rest_route( 'sz/v1', '/all-posts', [
		'methods'             => 'GET',
		'callback'            => 'sz_get_all_post_slugs',
		'permission_callback' => '__return_true',
	] );
} );

/**
 * REST callback: return paginated posts, optionally filtered by categories.
 */
function sz_get_blog_posts( WP_REST_Request $request ) {
	$paged      = (int) ( $request->get_param( 'page' ) ?? 1 );
	$per_page   = (int) ( $request->get_param( 'per_page' ) ?? 6 );
	$categories = $request->get_param( 'categories' );

	$query_args = [
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => $per_page,
		'paged'          => $paged,
		'orderby'        => 'date',
		'order'          => 'DESC',
	];

	if ( ! empty( $categories ) ) {
		$cat_ids = array_filter( array_map( 'intval', explode( ',', $categories ) ) );
		if ( ! empty( $cat_ids ) ) {
			$query_args['category__in'] = $cat_ids;
		}
	}

	$query = new WP_Query( $query_args );
	$posts = array_map( 'sz_format_post_for_rest', $query->posts );

	return new WP_REST_Response( [
		'posts'       => $posts,
		'total'       => (int) $query->found_posts,
		'total_pages' => (int) $query->max_num_pages,
		'page'        => $paged,
	], 200 );
}

/**
 * REST callback: return list of all published post slugs.
 */
function sz_get_all_post_slugs() {
	$posts = get_posts( [
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	] );

	$slugs = array_map( function ( $id ) {
		return [
			'slug'     => get_post_field( 'post_name', $id ),
			'modified' => get_post_modified_time( 'c', true, $id ),
		];
	}, $posts );

	return new WP_REST_Response( $slugs, 200 );
}

/**
 * Format a WP_Post into the shape the React front-end expects (WPPost).
 */
function sz_format_post_for_rest( WP_Post $post ): array {
	$featured_image = null;
	$thumb_id       = get_post_thumbnail_id( $post->ID );
	if ( $thumb_id ) {
		$featured_image = sz_resolve_image( $thumb_id );
	}

	$raw_cat_ids = wp_get_post_categories( $post->ID );
	$categories  = array_values( array_filter( array_map( function ( $cat_id ) {
		$term = get_term( $cat_id, 'category' );
		if ( ! $term || is_wp_error( $term ) ) return null;
		$menu = function_exists( 'get_field' ) ? get_field( 'menu_override', 'term_' . $term->term_id ) : '';
		return [
			'id'            => $term->term_id,
			'name'          => $term->name,
			'slug'          => $term->slug,
			'menu_override' => is_string( $menu ) ? $menu : '',
		];
	}, is_array( $raw_cat_ids ) ? $raw_cat_ids : [] ) ) );

	$tags = wp_get_post_tags( $post->ID, [ 'fields' => 'ids' ] );

	// Yoast SEO meta if available
	$yoast = null;
	if ( class_exists( 'WPSEO_Meta' ) ) {
		$yoast = [
			'title'       => WPSEO_Meta::get_value( 'title', $post->ID ) ?: '',
			'description' => WPSEO_Meta::get_value( 'metadesc', $post->ID ) ?: '',
		];
	}

	return [
		'id'              => $post->ID,
		'slug'            => $post->post_name,
		'status'          => $post->post_status,
		'title'           => [ 'rendered' => get_the_title( $post ) ],
		'content'         => [ 'rendered' => apply_filters( 'the_content', $post->post_content ) ],
		'excerpt'         => [ 'rendered' => get_the_excerpt( $post ) ],
		'date'            => get_the_date( 'c', $post ),
		'modified'        => get_the_modified_date( 'c', $post ),
		'featured_image'  => $featured_image,
		'reading_time'    => max( 1, (int) round( str_word_count( wp_strip_all_tags( $post->post_content ) ) / 200 ) ),
		'categories'      => $categories,
		'tags'            => is_array( $tags ) ? $tags : [],
		'yoast_head_json' => $yoast,
	];
}

/**
 * Also normalise images in standard WP REST post responses (wp/v2/posts).
 * This ensures getPostBySlug() and getRelatedPosts() (which use wp/v2/posts)
 * return featured images in the expected { url, alt, width, height } format.
 */
add_filter( 'rest_prepare_post', function ( WP_REST_Response $response, WP_Post $post ) {
	$data = $response->get_data();

	// Add featured_image in our standard format
	$thumb_id = get_post_thumbnail_id( $post->ID );
	if ( $thumb_id ) {
		$data['featured_image'] = sz_resolve_image( $thumb_id );
	}

	// Normalise categories from integer IDs → { id, name, slug } objects
	if ( isset( $data['categories'] ) && is_array( $data['categories'] ) ) {
		$data['categories'] = array_values( array_filter( array_map( function ( $cat_id ) {
			if ( is_array( $cat_id ) && isset( $cat_id['id'] ) ) return $cat_id; // already an object
			$term = get_term( (int) $cat_id, 'category' );
			if ( ! $term || is_wp_error( $term ) ) return null;
			$menu = function_exists( 'get_field' ) ? get_field( 'menu_override', 'term_' . $term->term_id ) : '';
			return [
				'id'            => $term->term_id,
				'name'          => $term->name,
				'slug'          => $term->slug,
				'menu_override' => is_string( $menu ) ? $menu : '',
			];
		}, $data['categories'] ) ) );
	}

	// Add reading_time estimate (200 WPM)
	$data['reading_time'] = max( 1, (int) round( str_word_count( wp_strip_all_tags( $post->post_content ) ) / 200 ) );

	$response->set_data( $data );
	return $response;
}, 20, 2 );

// ─────────────────────────────────────────────────────────────────────────────
// 11. CORS — ALLOW FRONT-END ORIGIN
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function () {
	remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
	add_filter( 'rest_pre_serve_request', function ( $value ) {
		$origin = defined( 'SZ_FRONTEND_URL' ) ? SZ_FRONTEND_URL : '*';
		header( 'Access-Control-Allow-Origin: ' . $origin );
		header( 'Access-Control-Allow-Methods: GET, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Accept, Content-Type, Authorization' );
		return $value;
	} );
} );
