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
 *       define( 'SZ_FRONTEND_URL', 'https://studiozanetti.com' );
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
	register_rest_route( 'sz/v1', '/nav-menu/(?P<location>[a-zA-Z0-9_-]+)', [
		'methods'             => 'GET',
		'callback'            => 'sz_get_nav_menu',
		'permission_callback' => '__return_true',
		'args'                => [
			'location' => [
				'required'          => true,
				'validate_callback' => function ( $param ) {
					return is_string( $param ) && preg_match( '/^[a-zA-Z0-9_-]+$/', $param );
				},
			],
		],
	] );
} );

/**
 * REST callback: build a nested tree of menu items for a given location.
 */
function sz_get_nav_menu( WP_REST_Request $request ) {
	$location  = $request->get_param( 'location' );
	$locations = get_nav_menu_locations();

	if ( empty( $locations[ $location ] ) ) {
		return new WP_REST_Response( [], 200 );
	}

	$menu_id = $locations[ $location ];
	$items   = wp_get_nav_menu_items( $menu_id );

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
// 4. REDIRECT PREVIEW BUTTON TO REACT FRONT-END
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
// 5. ADMIN CLEANUP — HIDE POSTS, DECLUTTER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hide the "Posts" menu item. Studio Zanetti uses Pages + CPTs, not blog posts.
 * This prevents the "squished blog posts" issue in the admin.
 */
add_action( 'admin_menu', function () {
	remove_menu_page( 'edit.php' );           // Posts
	remove_menu_page( 'edit-comments.php' );  // Comments
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
// 6. ADMIN CSS FIXES
// ─────────────────────────────────────────────────────────────────────────────
//
// Prevents layout issues such as columns being squished in the admin list views.

add_action( 'admin_head', function () {
	?>
	<style>
		/* Ensure the Pages list table has reasonable column widths */
		.wp-list-table .column-title { width: 40%; }
		.wp-list-table .column-author { width: 15%; }
		.wp-list-table .column-date { width: 15%; }

		/* Give ACF flexible content fields more breathing room */
		.acf-flexible-content .layout {
			margin-bottom: 1rem;
			border: 1px solid #ddd;
			border-radius: 4px;
		}

		/* Make the admin area feel less cramped on smaller screens */
		@media screen and (max-width: 782px) {
			.wp-list-table td,
			.wp-list-table th {
				padding: 8px 6px;
			}
		}
	</style>
	<?php
} );

// ─────────────────────────────────────────────────────────────────────────────
// 7. LIVE PREVIEW PANEL IN PAGE EDITOR
// ─────────────────────────────────────────────────────────────────────────────
//
// Shows an iframe of the React front-end inside the WordPress page editor so
// the admin can see exactly what visitors will see while editing ACF fields.
// Auto-refreshes on save / autosave and when ACF fields change (debounced).

add_action( 'add_meta_boxes', function () {
	add_meta_box(
		'sz-live-preview',
		'Live Front-End Preview',
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
				<?php echo $is_new_post ? 'Save this page as a draft first to enable preview.' : 'Ready'; ?>
			</span>
			<label style="margin-left:auto;font-size:13px;cursor:pointer;">
				<input type="checkbox" id="sz-auto-refresh" checked> Auto-refresh on changes
			</label>
		</div>

		<div id="sz-preview-sizes" style="display:flex;gap:6px;margin-bottom:10px;">
			<button type="button" class="button sz-size-btn active" data-width="100%">🖥 Desktop</button>
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

		var iframe          = document.getElementById('sz-preview-frame');
		var refreshBtn      = document.getElementById('sz-refresh-preview');
		var statusEl        = document.getElementById('sz-preview-status');
		var autoRefreshCb   = document.getElementById('sz-auto-refresh');
		var loadingOverlay  = document.getElementById('sz-preview-loading');
		var frameWrapper    = document.getElementById('sz-preview-frame-wrapper');
		var fullscreenBtn   = document.getElementById('sz-fullscreen-btn');

		if (!iframe || !refreshBtn) return;

		/* ── Helpers ─────────────────────────────────────────── */
		function setStatus(text) {
			if (statusEl) statusEl.textContent = text;
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
			setStatus('Updated ' + new Date().toLocaleTimeString());
		});

		/* ── Refresh logic ───────────────────────────────────── */
		function refreshPreview() {
			showLoading();
			setStatus('Refreshing…');
			/* Cache-bust to force reload */
			var src = iframe.src.replace(/&_cb=\d+/, '');
			iframe.src = src + '&_cb=' + Date.now();
		}

		/* Save draft then refresh after a short delay */
		function saveAndRefresh() {
			setStatus('Saving…');
			if (window.wp && wp.autosave && wp.autosave.server) {
				wp.autosave.server.triggerSave();
			}
			/* Allow time for autosave request to complete */
			setTimeout(refreshPreview, 2000);
		}

		/* ── Manual refresh button ───────────────────────────── */
		refreshBtn.addEventListener('click', function () {
			saveAndRefresh();
		});

		/* ── ACF field change detection ──────────────────────── */
		if (typeof acf !== 'undefined') {
			var debounceTimer;
			acf.addAction('change', function () {
				if (!autoRefreshCb || !autoRefreshCb.checked) return;
				clearTimeout(debounceTimer);
				setStatus('Change detected — will refresh…');
				debounceTimer = setTimeout(saveAndRefresh, 3000);
			});

			/* Also listen for Flexible Content layout reorder/add/remove */
			acf.addAction('append', function () {
				if (!autoRefreshCb || !autoRefreshCb.checked) return;
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(saveAndRefresh, 2000);
			});
			acf.addAction('remove', function () {
				if (!autoRefreshCb || !autoRefreshCb.checked) return;
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(saveAndRefresh, 2000);
			});
			acf.addAction('sortstop', function () {
				if (!autoRefreshCb || !autoRefreshCb.checked) return;
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(saveAndRefresh, 2000);
			});
		}

		/* ── Refresh after WordPress autosave ────────────────── */
		if (typeof jQuery !== 'undefined') {
			jQuery(document).on('after-autosave', function () {
				if (autoRefreshCb && autoRefreshCb.checked) {
					setTimeout(refreshPreview, 500);
				}
			});
		}

		/* ── Refresh after manual Publish / Update ───────────── */
		if (typeof jQuery !== 'undefined') {
			jQuery(document).on('heartbeat-tick', function (e, data) {
				if (data['wp-refresh-post-lock']) {
					/* Another user modified this — refresh */
					refreshPreview();
				}
			});
		}

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
		/* Set initial Desktop button as primary */
		var activeBtn = document.querySelector('.sz-size-btn.active');
		if (activeBtn) activeBtn.classList.add('button-primary');

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
					/* Re-apply the active size */
					var active = document.querySelector('.sz-size-btn.active');
					if (active) {
						var w = active.dataset.width;
						iframe.style.width  = w;
						iframe.style.margin = (w === '100%') ? '0' : '0 auto';
					}
				}
			});
			/* ESC key to exit full screen */
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
					/* Build the iframe dynamically */
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
					/* Update references */
					iframe = newIframe;
					frameWrapper = wrapper;
					refreshBtn.disabled = false;
					newIframe.addEventListener('load', function () {
						setStatus('Updated ' + new Date().toLocaleTimeString());
					});
				}
			});
		}
	})();
	</script>
	<?php
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ENSURE ACF FIELDS SHOW IN REST API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * If using ACF free (not Pro), the "ACF to REST API" plugin handles this.
 * If using ACF Pro, this filter ensures field groups expose their data
 * in the REST API response (show_in_rest).
 */
add_filter( 'acf/rest_api/field_settings/show_in_rest', '__return_true' );

// ─────────────────────────────────────────────────────────────────────────────
// 9. CORS — ALLOW FRONT-END ORIGIN
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
