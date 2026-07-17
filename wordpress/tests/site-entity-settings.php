<?php

require_once __DIR__ . '/../mu-plugins/includes/site-entity-settings.php';

function assert_same( $expected, $actual, $message ) {
	if ( $expected !== $actual ) {
		fwrite( STDERR, $message . PHP_EOL );
		fwrite( STDERR, 'Expected: ' . var_export( $expected, true ) . PHP_EOL );
		fwrite( STDERR, 'Actual: ' . var_export( $actual, true ) . PHP_EOL );
		exit( 1 );
	}
}

$settings = sz_sanitize_site_entity_settings( [
	'business' => [
		'description' => '  Documentary <b>photography</b>  ',
		'email' => ' hello@example.com ',
		'telephone' => ' 0400 000 000 ',
		'address' => [
			'street_address' => ' 1 Example Street ',
			'address_locality' => ' Sydney ',
			'address_region' => ' NSW ',
			'postal_code' => ' 2000 ',
			'address_country' => ' AU ',
		],
		'geo' => [ 'latitude' => '-33.8688', 'longitude' => '151.2093' ],
		'area_served' => [ [ 'name' => ' Sydney ' ], 'New South Wales', [ 'name' => '' ] ],
		'logo' => 41,
		'awards' => [ [ 'award' => ' Industry Award ' ], [ 'award' => 'Industry Award' ] ],
		'same_as' => [ [ 'url' => 'https://example.com/profile' ], [ 'url' => 'javascript:bad' ] ],
	],
	'primary_photographer' => [
		'enabled' => '1',
		'name' => ' Primary Photographer ',
		'business_relationship' => 'founder',
		'job_title' => 'Photographer',
		'image' => 42,
		'knows_about' => [ [ 'topic' => 'Wedding photography' ] ],
	],
	'services' => [
		[
			'key' => ' Wedding Photography ',
			'name' => ' Wedding Photography ',
			'service_type' => 'Wedding photography',
			'area_served' => [ [ 'name' => 'Sydney' ] ],
		],
		[ 'key' => 'wedding-photography', 'name' => 'Duplicate' ],
		[ 'key' => '', 'name' => 'Missing key' ],
	],
], static function ( $value ) {
	return is_numeric( $value ) ? [ 'id' => (int) $value, 'url' => 'https://example.com/image.jpg' ] : null;
} );

assert_same( 'Documentary photography', $settings['business']['description'], 'Business description should be sanitized.' );
assert_same( '-33.8688', (string) $settings['business']['geo']['latitude'], 'Latitude should be numeric.' );
assert_same( [ 'Sydney', 'New South Wales' ], $settings['business']['area_served'], 'Repeater strings should normalize.' );
assert_same( [ 'Industry Award' ], $settings['business']['awards'], 'Repeated awards should be deduplicated.' );
assert_same( [ 'https://example.com/profile' ], $settings['business']['same_as'], 'Invalid public profile URLs should be removed.' );
assert_same( 41, $settings['business']['logo']['id'], 'Image resolver should control public media output.' );
assert_same( true, $settings['primary_photographer']['enabled'], 'Photographer enabled flag should normalize.' );
assert_same( 'Primary Photographer', $settings['primary_photographer']['name'], 'Photographer name should be trimmed.' );
assert_same( 'founder', $settings['primary_photographer']['business_relationship'], 'Photographer business relationship should normalize.' );
assert_same( 1, count( $settings['services'] ), 'Services need a unique non-empty key and name.' );
assert_same( 'wedding-photography', $settings['services'][0]['key'], 'Service keys should be stable slugs.' );

$empty = sz_sanitize_site_entity_settings( [] );
assert_same( [], $empty['business'], 'Empty business settings should remain empty.' );
assert_same( [ 'enabled' => false ], $empty['primary_photographer'], 'Disabled photographer state should remain explicit.' );
assert_same( [], $empty['services'], 'Empty services should remain empty.' );

fwrite( STDOUT, "Site entity settings tests passed.\n" );
