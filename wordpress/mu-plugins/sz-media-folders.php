<?php
/**
 * Plugin Name:  Studio Zanetti - Media Folders
 * Description:  Adds folder organization for WordPress media attachments.
 *               Admins can create folders, assign media to a folder, and
 *               filter the Media Library by folder.
 * Version:      1.0.0
 * Author:       Studio Zanetti Dev
 *
 * Installation:
 *  Copy this file to wp-content/mu-plugins/sz-media-folders.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register a hierarchical taxonomy used as media folders.
 */
function sz_register_media_folder_taxonomy() {
	$labels = [
		'name'              => __( 'Media Folders', 'studio-zanetti' ),
		'singular_name'     => __( 'Media Folder', 'studio-zanetti' ),
		'search_items'      => __( 'Search Media Folders', 'studio-zanetti' ),
		'all_items'         => __( 'All Media Folders', 'studio-zanetti' ),
		'parent_item'       => __( 'Parent Folder', 'studio-zanetti' ),
		'parent_item_colon' => __( 'Parent Folder:', 'studio-zanetti' ),
		'edit_item'         => __( 'Edit Folder', 'studio-zanetti' ),
		'update_item'       => __( 'Update Folder', 'studio-zanetti' ),
		'add_new_item'      => __( 'Add New Folder', 'studio-zanetti' ),
		'new_item_name'     => __( 'New Folder Name', 'studio-zanetti' ),
		'menu_name'         => __( 'Folders', 'studio-zanetti' ),
	];

	register_taxonomy(
		'sz_media_folder',
		'attachment',
		[
			'hierarchical'      => true,
			'labels'            => $labels,
			'public'            => false,
			'show_ui'           => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'show_tagcloud'     => false,
			'show_in_nav_menus' => false,
			'query_var'         => 'sz_media_folder',
			'rewrite'           => false,
		]
	);
}
add_action( 'init', 'sz_register_media_folder_taxonomy' );

/**
 * Expose a folder dropdown on each media item in the attachment details panel.
 */
function sz_media_folder_attachment_fields_to_edit( $form_fields, $post ) {
	$term_ids = wp_get_object_terms(
		$post->ID,
		'sz_media_folder',
		[
			'fields' => 'ids',
		]
	);

	$selected = 0;
	if ( ! is_wp_error( $term_ids ) && ! empty( $term_ids ) ) {
		$selected = (int) $term_ids[0];
	}

	$dropdown = wp_dropdown_categories(
		[
			'taxonomy'         => 'sz_media_folder',
			'name'             => 'attachments[' . $post->ID . '][sz_media_folder]',
			'echo'             => 0,
			'hide_empty'       => false,
			'hierarchical'     => true,
			'show_option_none' => __( 'No folder', 'studio-zanetti' ),
			'option_none_value' => '0',
			'selected'         => $selected,
		]
	);

	$form_fields['sz_media_folder'] = [
		'label' => __( 'Folder', 'studio-zanetti' ),
		'input' => 'html',
		'html'  => $dropdown,
		'helps' => __( 'Use folders to keep media organized for editors.', 'studio-zanetti' ),
	];

	return $form_fields;
}
add_filter( 'attachment_fields_to_edit', 'sz_media_folder_attachment_fields_to_edit', 10, 2 );

/**
 * Save folder assignments from the media attachment details panel.
 */
function sz_media_folder_attachment_fields_to_save( $post, $attachment ) {
	if ( ! current_user_can( 'upload_files' ) ) {
		return $post;
	}

	if ( ! isset( $attachment['sz_media_folder'] ) ) {
		return $post;
	}

	$folder_id = absint( $attachment['sz_media_folder'] );

	if ( $folder_id > 0 ) {
		wp_set_object_terms( $post['ID'], [ $folder_id ], 'sz_media_folder', false );
	} else {
		wp_set_object_terms( $post['ID'], [], 'sz_media_folder', false );
	}

	return $post;
}
add_filter( 'attachment_fields_to_save', 'sz_media_folder_attachment_fields_to_save', 10, 2 );

/**
 * Add folder filter dropdown on Media Library list view.
 */
function sz_media_folder_add_admin_filter() {
	global $pagenow;

	if ( 'upload.php' !== $pagenow ) {
		return;
	}

	$selected = isset( $_GET['sz_media_folder'] ) ? absint( $_GET['sz_media_folder'] ) : 0;

	wp_dropdown_categories(
		[
			'taxonomy'         => 'sz_media_folder',
			'name'             => 'sz_media_folder',
			'orderby'          => 'name',
			'show_count'       => false,
			'hide_empty'       => false,
			'hierarchical'     => true,
			'show_option_all'  => __( 'All folders', 'studio-zanetti' ),
			'selected'         => $selected,
		]
	);
}
add_action( 'restrict_manage_posts', 'sz_media_folder_add_admin_filter' );

/**
 * Apply selected folder filter to Media Library queries.
 */
function sz_media_folder_filter_admin_query( $query ) {
	if ( ! is_admin() || ! $query->is_main_query() ) {
		return;
	}

	global $pagenow;
	if ( 'upload.php' !== $pagenow ) {
		return;
	}

	$folder_id = isset( $_GET['sz_media_folder'] ) ? absint( $_GET['sz_media_folder'] ) : 0;
	if ( $folder_id <= 0 ) {
		return;
	}

	$query->set( 'tax_query', [
		[
			'taxonomy' => 'sz_media_folder',
			'field'    => 'term_id',
			'terms'    => [ $folder_id ],
		],
	] );
}
add_action( 'pre_get_posts', 'sz_media_folder_filter_admin_query' );

