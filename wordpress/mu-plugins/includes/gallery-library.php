<?php
/**
 * Compatibility between the original gallery repeater and the thumbnail gallery.
 */

function sz_gallery_library_image_ids( $value ): array {
	if ( is_string( $value ) ) {
		$value = explode( ',', $value );
	}
	$ids = [];
	foreach ( is_array( $value ) ? $value : [] as $image ) {
		if ( is_array( $image ) ) {
			$image = $image['image'] ?? $image['field_sz_gallery_library_image_item'] ?? $image;
		}
		if ( is_array( $image ) ) {
			$image = $image['ID'] ?? $image['id'] ?? 0;
		}
		if ( is_numeric( $image ) && (int) $image > 0 ) {
			$ids[] = (int) $image;
		}
	}
	return $ids;
}

function sz_load_gallery_library_images( $value, $post_id, array $field ): array {
	// A repeater stores its row count at "images", with IDs in images_N_image.
	// Read those IDs without writing anything just by opening a gallery or page.
	if ( is_numeric( $value ) ) {
		$images = [];
		for ( $index = 0; $index < (int) $value; $index++ ) {
			$images[] = get_post_meta( $post_id, $field['name'] . '_' . $index . '_image', true );
		}
		$value = $images;
	}
	return sz_gallery_library_image_ids( $value );
}

function sz_update_gallery_library_images( $value, $post_id, array $field ) {
	if ( 'field_sz_gallery_library_images' !== ( $field['key'] ?? '' ) ) {
		return $value;
	}
	// Keep the existing import endpoint's { image, caption } input working.
	// Subsequent saves store ACF's native ordered attachment IDs.
	return sz_gallery_library_image_ids( $value );
}
