<?php

define( 'ABSPATH', __DIR__ . '/' );
$actions = [];
$filters = [];
$groups = [];
$meta = [ 42 => [ 'images_0_image' => '81', 'images_1_image' => '37', 'images_2_image' => '95' ] ];
$meta_reads = [];

function add_action( $name, $callback, ...$args ) {
	$GLOBALS['actions'][ $name ][] = $callback;
}

function add_filter( $name, $callback, $priority = 10, ...$args ) {
	$GLOBALS['filters'][ $name ][ $priority ][] = $callback;
}

function acf_add_local_field_group( $group ) {
	$GLOBALS['groups'][ $group['key'] ] = $group;
}

function get_post_meta( $post_id, $key, $single = false ) {
	$GLOBALS['meta_reads'][] = [ $post_id, $key ];
	return $GLOBALS['meta'][ $post_id ][ $key ] ?? '';
}

function sanitize_text_field( $value ) {
	return trim( strip_tags( $value ) );
}

function wp_get_attachment_caption( $id ) {
	return '';
}

function wp_get_attachment_image_src( $id, $size ) {
	return [ "https://example.com/{$id}.jpg", 1200, 800 ];
}

require_once __DIR__ . '/../mu-plugins/sz-acf-schema.php';
require_once __DIR__ . '/../mu-plugins/sz-headless.php';

function gallery_assert( $expected, $actual, $message ) {
	if ( $expected !== $actual ) {
		fwrite( STDERR, $message . "\nExpected: " . var_export( $expected, true ) . "\nActual: " . var_export( $actual, true ) . "\n" );
		exit( 1 );
	}
}

foreach ( $actions['acf/init'] as $callback ) {
	$callback();
}
$field = $groups['group_sz_gallery_library']['fields'][1];
gallery_assert( 'gallery', $field['type'], 'The reusable gallery must use the native thumbnail gallery.' );
gallery_assert( 'thumbnail', $field['preview_size'], 'Use thumbnail previews.' );
gallery_assert( 1, $field['min'], 'The collection still requires an image.' );
gallery_assert( false, isset( $field['sub_fields'] ), 'No per-image caption or image rows remain.' );
gallery_assert( [ 'sz_update_gallery_library_images' ], $filters['acf/update_value'][5], 'Import compatibility must run before ACF type filters.' );

$load = $filters['acf/load_value/key=field_sz_gallery_library_images'][10][0];
$ids = $load( '3', 42, $field );
gallery_assert( [ 81, 37, 95 ], $ids, 'Read existing repeater image IDs in their original order.' );
gallery_assert( 3, count( $meta_reads ), 'Read each legacy row once.' );
gallery_assert( [], $load( '0', 42, $field ), 'Empty legacy galleries must stay empty.' );
gallery_assert( [], $load( false, 42, $field ), 'New galleries start empty.' );

// Simulate the IDs ACF submits after dragging, removing, and adding thumbnails.
$update = $filters['acf/update_value'][5][0];
$saved = $update( [ '95', '81', '112' ], 42, $field );
$meta_reads = [];
gallery_assert( [ 95, 81, 112 ], $load( $saved, 42, $field ), 'Saving and reopening must preserve the edited order without resurrecting removed images.' );
gallery_assert( [], $meta_reads, 'Native galleries must not read stale repeater metadata.' );
gallery_assert( [], $load( $update( [], 42, $field ), 42, $field ), 'An empty native value must not restore old images.' );

$import = [ [ 'image' => 37, 'caption' => 'Old row caption' ], [ 'image' => [ 'ID' => 81 ] ] ];
gallery_assert( [ 37, 81 ], $update( $import, 42, $field ), 'Existing import rows must save as native gallery IDs.' );
gallery_assert( [ 95, 37 ], $update( '95,37', 42, $field ), 'Accept comma-separated attachment IDs.' );
gallery_assert( [ 81 ], $update( [ [ 'field_sz_gallery_library_image_item' => 81 ] ], 42, $field ), 'Accept legacy field-key rows.' );
gallery_assert( [ 37, 81 ], $update( [ 0, false, [], [ 'id' => 37 ], '81', 'invalid' ], 42, $field ), 'Ignore empty and invalid image values.' );
gallery_assert( $import, $update( $import, 42, [ 'key' => 'field_unrelated' ] ), 'Other ACF fields must be untouched.' );

$native = [
	[ 'url' => 'https://example.com/95.jpg', 'alt' => 'First photograph', 'width' => 1200, 'height' => 800 ],
	[ 'url' => 'https://example.com/81.jpg', 'alt' => 'Second photograph', 'width' => 800, 'height' => 1200 ],
];
$payload = sz_normalize_gallery_rows( $native );
gallery_assert( [ 'https://example.com/95.jpg', 'https://example.com/81.jpg' ], array_column( array_column( $payload, 'image' ), 'url' ), 'Native galleries must retain image order in the public payload.' );
gallery_assert( 'First photograph', $payload[0]['image']['alt'], 'Keep attachment alternative text.' );
gallery_assert( '', $payload[0]['caption'], 'Native gallery items have no per-gallery caption.' );
gallery_assert( $payload, sz_normalize_gallery_rows( $payload ), 'Repeated block normalization must preserve the public payload.' );
gallery_assert( [ 'https://example.com/95.jpg', 'https://example.com/81.jpg' ], array_column( array_column( sz_normalize_gallery_rows( [ 95, 81 ] ), 'image' ), 'url' ), 'Attachment ID return values must resolve too.' );
gallery_assert( 'Legacy caption', sz_normalize_gallery_rows( [ [ 'image' => $native[0], 'caption' => 'Legacy caption' ] ] )[0]['caption'], 'Continue to support already-normalized legacy block payloads.' );

echo "Passed gallery schema, storage compatibility, import, and public payload tests.\n";
