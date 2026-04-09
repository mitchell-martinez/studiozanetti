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

	// Normalise incoming gallery rows so ACF image subfields receive attachment IDs.
	$site_url = rtrim( get_site_url(), '/' );
	$blocks   = array_map( function ( $block ) use ( $site_url ) {
		if ( ! is_array( $block ) || ( $block['acf_fc_layout'] ?? '' ) !== 'galleries' ) {
			return $block;
		}

		if ( empty( $block['images'] ) || ! is_array( $block['images'] ) ) {
			return $block;
		}

		$normalised_rows = [];
		foreach ( $block['images'] as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			$image = $row['image'] ?? null;
			$attachment_id = 0;

			if ( is_numeric( $image ) ) {
				$attachment_id = (int) $image;
			} elseif ( is_array( $image ) && ! empty( $image['url'] ) && is_string( $image['url'] ) ) {
				$raw_url = $image['url'];
				$attachment_id = (int) attachment_url_to_postid( $raw_url );

				// If source domain differs, retry with the current site host + same path.
				if ( $attachment_id === 0 ) {
					$path = wp_parse_url( $raw_url, PHP_URL_PATH );
					if ( is_string( $path ) && $path !== '' ) {
						$attachment_id = (int) attachment_url_to_postid( $site_url . $path );
					}
				}
			}

			// Keep only rows with a resolvable image ID; image subfield is required.
			if ( $attachment_id > 0 ) {
				$normalised_rows[] = [
					'image'   => $attachment_id,
					'caption' => isset( $row['caption'] ) ? (string) $row['caption'] : '',
				];
			}
		}

		$block['images'] = $normalised_rows;
		return $block;
	}, $blocks );

	// Update by field name. Field group is registered in sz-acf-schema.php.
	$result = update_field( 'blocks', $blocks, $post_id );

	// update_field can return false when value is unchanged; verify persisted state.
	$persisted = function_exists( 'get_field' ) ? get_field( 'blocks', $post_id ) : null;
	if ( $result === false && $persisted !== $blocks ) {
		return new WP_REST_Response( [ 'message' => 'Failed to update page blocks.' ], 500 );
	}

	return new WP_REST_Response( [
		'id'             => $post_id,
		'status'         => 'updated',
		'blocks_count'   => count( $blocks ),
		'persisted'      => $persisted,
	], 200 );
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

	// Build a response matching the WPPage interface
	$acf_data = function_exists( 'get_fields' ) ? get_fields( $source->ID ) : [];

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
					: 'Click "Refresh Preview" after making changes. <kbd style="background:#f0f0f0;padding:2px 6px;border:1px solid #ccc;border-radius:3px;font-size:11px;">Ctrl+Shift+P</kbd>'; ?>
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
				<div id="sz-preview-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.9);z-index:10;font-size:14px;color:#666;">
					Loading preview…
				</div>
				<iframe
					id="sz-preview-frame"
					src="<?php echo esc_url( $preview_url ); ?>"
					style="width:100%;height:800px;border:none;display:block;transition:width 0.3s;margin:0 auto;"
					title="Live front-end preview"
				></iframe>
			</div>
		<?php endif; ?>

		<div class="sz-editor-hint">
			👆 Click any block above to jump to its fields below &nbsp;·&nbsp;
			<kbd style="background:#f0f0f0;padding:2px 6px;border:1px solid #ccc;border-radius:3px;font-size:11px;">Ctrl+Shift+P</kbd> to refresh
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

		var iframe          = document.getElementById('sz-preview-frame');
		var refreshBtn      = document.getElementById('sz-refresh-preview');
		var statusEl        = document.getElementById('sz-preview-status');
		var loadingOverlay  = document.getElementById('sz-preview-loading');
		var frameWrapper    = document.getElementById('sz-preview-frame-wrapper');
		var fullscreenBtn   = document.getElementById('sz-fullscreen-btn');

		if (!iframe || !refreshBtn) return;

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

		/* Hide the loading overlay once iframe loads */
		iframe.addEventListener('load', function () {
			hideLoading();
			setStatus('Updated ' + new Date().toLocaleTimeString() +
				' — Click "Refresh Preview" after making changes.');
		});

		/* ── Refresh: saves draft first, then reloads iframe ── */
		function refreshPreview() {
			showLoading();
			setStatus('Saving &amp; refreshing…');
			/* Trigger WP autosave to persist current field values */
			if (window.wp && wp.autosave && wp.autosave.server) {
				wp.autosave.server.triggerSave();
			}
			/* Wait for the save to complete, then reload iframe */
			setTimeout(function () {
				var src = iframe.src.replace(/&_cb=\d+/, '');
				iframe.src = src + '&_cb=' + Date.now();
			}, 2000);
		}

		/* ── Manual refresh button ───────────────────────────── */
		refreshBtn.addEventListener('click', refreshPreview);

		/* ── Keyboard shortcut: Ctrl+Shift+P ─────────────────── */
		document.addEventListener('keydown', function (e) {
			if (e.ctrlKey && e.shiftKey && e.key === 'P') {
				e.preventDefault();
				refreshPreview();
			}
		});

		/* ── postMessage bridge: click-to-edit ────────────────── */
		/* When the admin clicks a block in the iframe preview,   */
		/* the React app sends { source:'sz-preview', action:     */
		/* 'focus-block', index: N }. We scroll to and highlight  */
		/* the Nth ACF Flexible Content layout row in the editor. */
		window.addEventListener('message', function (event) {
			var data = event.data;
			if (!data || data.source !== 'sz-preview') return;

			if (data.action === 'focus-block' && typeof data.index === 'number') {
				/* Find all ACF Flexible Content layout rows */
				var layouts = document.querySelectorAll('.acf-flexible-content .layout');
				var target  = layouts[data.index];

				if (!target) return;

				/* Remove previous highlights */
				layouts.forEach(function (el) {
					el.style.outline = '';
					el.style.outlineOffset = '';
					el.style.transition = '';
				});

				/* Scroll to & highlight the target layout */
				target.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
					var newIframe = document.createElement('iframe');
					newIframe.id    = 'sz-preview-frame';
					newIframe.title = 'Live front-end preview';
					newIframe.style.cssText = 'width:100%;height:800px;border:none;display:block;';
					var postId = document.getElementById('post_ID').value;
					newIframe.src = '<?php echo esc_js( rtrim( SZ_FRONTEND_URL, "/" ) ); ?>/preview?id=' + postId +
						'&secret=<?php echo esc_js( rawurlencode( SZ_PREVIEW_SECRET ) ); ?>&iframe=true&_cb=' + Date.now();
					wrapper.appendChild(newIframe);
					document.getElementById('sz-preview-container').appendChild(wrapper);
					iframe = newIframe;
					frameWrapper = wrapper;
					refreshBtn.disabled = false;
					newIframe.addEventListener('load', function () {
						hideLoading();
						setStatus('Updated ' + new Date().toLocaleTimeString() +
							' — Click "Refresh Preview" after making changes.');
					});
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
		$data['acf']['blocks'] = array_map( 'sz_normalize_block_images', $data['acf']['blocks'] );
		$response->set_data( $data );
	}

	return $response;
}

/**
 * Walk a single ACF Flexible Content block and resolve every image field.
 */
function sz_normalize_block_images( array $block ): array {
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

	// Galleries block repeater: images[] rows contain { image, caption }.
	if ( ( $block['acf_fc_layout'] ?? '' ) === 'galleries' && ! empty( $block['images'] ) && is_array( $block['images'] ) ) {
		$rows = [];
		foreach ( $block['images'] as $row ) {
			if ( ! is_array( $row ) || ! array_key_exists( 'image', $row ) ) {
				continue;
			}

			$img = sz_resolve_image( $row['image'] );
			if ( ! $img ) {
				continue;
			}

			$rows[] = [
				'image'   => $img,
				'caption' => isset( $row['caption'] ) ? $row['caption'] : '',
			];
		}
		$block['images'] = $rows;
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
