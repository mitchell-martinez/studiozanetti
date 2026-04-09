<?php
/**
 * Plugin Name:  Studio Zanetti — Duplicate Page
 * Description:  Adds a "Duplicate" action link to pages (and posts) in the WordPress
 *               admin list table. Clicking it creates a draft copy of the page with
 *               all meta fields (including ACF blocks) and redirects to the editor.
 * Version:      1.0.0
 * Author:       Studio Zanetti Dev
 *
 * ─── INSTALLATION ────────────────────────────────────────────────────────────
 *
 *  Copy this file into your WordPress installation at:
 *    wp-content/mu-plugins/sz-duplicate-page.php
 *
 *  That's it — works automatically with no configuration.
 *
 * ─── HOW TO USE ──────────────────────────────────────────────────────────────
 *
 *  1. Go to Pages → All Pages
 *  2. Hover over any page
 *  3. Click the "Duplicate" link that appears in the row actions
 *  4. A new draft copy opens in the editor — rename and publish when ready
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Add "Duplicate" to the row actions on the Pages (and Posts) list table.
 */
function sz_duplicate_page_row_action( $actions, $post ) {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return $actions;
	}

	$url = wp_nonce_url(
		admin_url( 'admin-post.php?action=sz_duplicate_page&post_id=' . $post->ID ),
		'sz_duplicate_page_' . $post->ID
	);

	$actions['sz_duplicate'] = sprintf(
		'<a href="%s" title="%s" aria-label="%s">%s</a>',
		esc_url( $url ),
		esc_attr__( 'Duplicate this item', 'flavor' ),
		esc_attr( sprintf( __( 'Duplicate "%s"', 'flavor' ), $post->post_title ) ),
		__( 'Duplicate', 'flavor' )
	);

	return $actions;
}
add_filter( 'page_row_actions', 'sz_duplicate_page_row_action', 10, 2 );
add_filter( 'post_row_actions', 'sz_duplicate_page_row_action', 10, 2 );

/**
 * Handle the duplication request.
 */
function sz_duplicate_page_handler() {
	$post_id = isset( $_GET['post_id'] ) ? absint( $_GET['post_id'] ) : 0;

	if ( ! $post_id ) {
		wp_die( __( 'No page to duplicate.', 'flavor' ) );
	}

	if ( ! wp_verify_nonce( $_GET['_wpnonce'] ?? '', 'sz_duplicate_page_' . $post_id ) ) {
		wp_die( __( 'Security check failed.', 'flavor' ) );
	}

	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( __( 'You do not have permission to duplicate pages.', 'flavor' ) );
	}

	$original = get_post( $post_id );

	if ( ! $original ) {
		wp_die( __( 'Original page not found.', 'flavor' ) );
	}

	// Create the duplicate as a draft.
	$new_post_id = wp_insert_post( array(
		'post_title'     => $original->post_title . ' (Copy)',
		'post_content'   => $original->post_content,
		'post_excerpt'   => $original->post_excerpt,
		'post_status'    => 'draft',
		'post_type'      => $original->post_type,
		'post_parent'    => $original->post_parent,
		'post_author'    => get_current_user_id(),
		'menu_order'     => $original->menu_order,
		'comment_status' => $original->comment_status,
		'ping_status'    => $original->ping_status,
		'post_password'  => $original->post_password,
	) );

	if ( is_wp_error( $new_post_id ) ) {
		wp_die( __( 'Could not create duplicate.', 'flavor' ) );
	}

	// Copy all post meta (ACF fields, featured image, etc.).
	$meta = get_post_meta( $original->ID );
	if ( $meta ) {
		foreach ( $meta as $key => $values ) {
			// Skip internal WP keys that shouldn't be copied.
			if ( $key === '_edit_lock' || $key === '_edit_last' ) {
				continue;
			}
			foreach ( $values as $value ) {
				add_post_meta( $new_post_id, $key, maybe_unserialize( $value ) );
			}
		}
	}

	// Copy taxonomy terms (categories, tags, etc.).
	$taxonomies = get_object_taxonomies( $original->post_type );
	foreach ( $taxonomies as $taxonomy ) {
		$terms = wp_get_object_terms( $original->ID, $taxonomy, array( 'fields' => 'ids' ) );
		if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
			wp_set_object_terms( $new_post_id, $terms, $taxonomy );
		}
	}

	// Redirect to the new draft in the editor.
	wp_safe_redirect( admin_url( 'post.php?action=edit&post=' . $new_post_id ) );
	exit;
}
add_action( 'admin_post_sz_duplicate_page', 'sz_duplicate_page_handler' );
