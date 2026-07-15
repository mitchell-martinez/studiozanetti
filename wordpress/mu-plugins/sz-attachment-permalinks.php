<?php
/**
 * Plugin Name: Studio Zanetti - Attachment Permalinks
 * Description: Keeps media attachment slugs out of the page namespace and exposes attachment pages under /image/{id}/.
 * Version: 1.0.0
 * Author: Studio Zanetti Dev
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SZ_ATTACHMENT_PERMALINK_VERSION = '1.0.0';
const SZ_ATTACHMENT_MIGRATION_BATCH_SIZE = 200;

/**
 * Return the internal slug used by an attachment record.
 */
function sz_attachment_internal_slug( $attachment_id ) {
	return 'sz-image-' . absint( $attachment_id );
}

/**
 * Prevent attachment filenames from reserving useful page slugs.
 */
function sz_attachment_unique_post_slug( $slug, $post_id, $post_status, $post_type ) {
	if ( 'attachment' !== $post_type || ! $post_id ) {
		return $slug;
	}

	return sz_attachment_internal_slug( $post_id );
}
add_filter( 'wp_unique_post_slug', 'sz_attachment_unique_post_slug', 10, 4 );

/**
 * Assign the collision-proof slug after a new attachment receives its ID.
 */
function sz_attachment_normalize_new_slug( $attachment_id ) {
	$desired_slug = sz_attachment_internal_slug( $attachment_id );

	if ( get_post_field( 'post_name', $attachment_id ) === $desired_slug ) {
		return;
	}

	wp_update_post(
		array(
			'ID'        => absint( $attachment_id ),
			'post_name' => $desired_slug,
		)
	);
}
add_action( 'add_attachment', 'sz_attachment_normalize_new_slug' );

/**
 * Keep public attachment-page URLs separate from normal page URLs.
 */
function sz_attachment_link( $url, $attachment_id ) {
	return home_url( user_trailingslashit( 'image/' . absint( $attachment_id ) ) );
}
add_filter( 'attachment_link', 'sz_attachment_link', 10, 2 );

/**
 * Resolve /image/{id}/ as the corresponding WordPress attachment page.
 */
function sz_attachment_rewrite_rule() {
	add_rewrite_rule( '^image/([0-9]+)/?$', 'index.php?attachment_id=$matches[1]', 'top' );
}
add_action( 'init', 'sz_attachment_rewrite_rule' );

/**
 * Flush rewrite rules once when this MU-plugin version changes.
 */
function sz_attachment_maybe_flush_rewrite_rules() {
	if ( get_option( 'sz_attachment_permalink_version' ) === SZ_ATTACHMENT_PERMALINK_VERSION ) {
		return;
	}

	flush_rewrite_rules( false );
	update_option( 'sz_attachment_permalink_version', SZ_ATTACHMENT_PERMALINK_VERSION, false );
}
add_action( 'admin_init', 'sz_attachment_maybe_flush_rewrite_rules' );

/**
 * Migrate existing attachments in bounded batches during authenticated admin requests.
 */
function sz_attachment_migrate_existing_slugs() {
	$last_id = absint( get_option( 'sz_attachment_slug_migration_last_id', 0 ) );

	global $wpdb;
	$ids = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_status = 'inherit' AND ID > %d ORDER BY ID ASC LIMIT %d",
			$last_id,
			SZ_ATTACHMENT_MIGRATION_BATCH_SIZE
		)
	);

	if ( empty( $ids ) ) {
		update_option( 'sz_attachment_slug_migration_complete', SZ_ATTACHMENT_PERMALINK_VERSION, false );
		delete_option( 'sz_attachment_slug_migration_last_id' );
		return;
	}

	foreach ( $ids as $attachment_id ) {
		$attachment_id = absint( $attachment_id );
		$desired_slug  = sz_attachment_internal_slug( $attachment_id );

		if ( get_post_field( 'post_name', $attachment_id ) !== $desired_slug ) {
			wp_update_post(
				array(
					'ID'        => $attachment_id,
					'post_name' => $desired_slug,
				)
			);
		}

		$last_id = $attachment_id;
	}

	update_option( 'sz_attachment_slug_migration_last_id', $last_id, false );
}

/**
 * Continue migration until every existing attachment has an internal ID slug.
 */
function sz_attachment_maybe_migrate_existing_slugs() {
	if ( get_option( 'sz_attachment_slug_migration_complete' ) === SZ_ATTACHMENT_PERMALINK_VERSION ) {
		return;
	}

	sz_attachment_migrate_existing_slugs();
}
add_action( 'admin_init', 'sz_attachment_maybe_migrate_existing_slugs' );