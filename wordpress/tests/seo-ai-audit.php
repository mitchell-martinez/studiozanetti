<?php

require_once __DIR__ . '/../mu-plugins/includes/page-heading-validation.php';
require_once __DIR__ . '/../mu-plugins/includes/seo-ai-audit.php';

$failures = [];

function sz_ai_test_assert( string $name, $expected, $actual, array &$failures ): void {
	if ( $expected === $actual ) {
		return;
	}
	$failures[] = [ 'name' => $name, 'expected' => $expected, 'actual' => $actual ];
}

function sz_ai_test_find( array $audit, string $id ): array {
	foreach ( $audit['findings'] as $finding ) {
		if ( $id === $finding['id'] ) {
			return $finding;
		}
	}
	return [];
}

$site = [
	'site_name' => 'Example Studio',
	'business' => [
		'address' => [ 'address_locality' => 'Example City', 'address_country' => 'AU' ],
		'area_served' => [ 'Example City' ],
	],
	'primary_photographer' => [ 'enabled' => true, 'name' => 'Example Photographer', 'job_title' => 'Photographer' ],
	'services' => [ [ 'key' => 'weddings', 'name' => 'Wedding Photography', 'service_type' => 'Wedding photography' ] ],
];

$healthy = sz_audit_page_ai_searchability( [
	'title' => 'Wedding Photography in Example City',
	'description' => 'Documentary wedding photography for celebrations throughout Example City.',
	'content' => str_repeat( 'Wedding photography in Example City tells a truthful story. ', 12 ),
	'blocks' => [
		[ 'acf_fc_layout' => 'hero', 'title' => 'Wedding Photography in Example City' ],
		[ 'acf_fc_layout' => 'text_block', 'heading' => 'Our approach', 'heading_level' => 'h2', 'body' => str_repeat( 'Visible descriptive copy. ', 20 ) ],
		[ 'acf_fc_layout' => 'services_grid', 'services' => [ [ 'title' => 'Weddings', 'service_reference' => 'weddings' ] ] ],
		[ 'acf_fc_layout' => 'pricing_packages', 'service_reference' => 'weddings', 'packages' => [ [ 'name' => 'Coverage' ] ] ],
	],
	'featured_image' => [ 'url' => 'https://example.com/image.jpg', 'alt' => 'Wedding portrait', 'width' => 1600, 'height' => 900 ],
	'service_reference' => 'weddings',
], $site );

sz_ai_test_assert( 'healthy page H1 passes', 'pass', sz_ai_test_find( $healthy, 'exactly-one-h1' )['status'] ?? '', $failures );
sz_ai_test_assert( 'service reference resolves', 'pass', sz_ai_test_find( $healthy, 'service-reference' )['status'] ?? '', $failures );
sz_ai_test_assert( 'block service references resolve', 'pass', sz_ai_test_find( $healthy, 'block-service-references' )['status'] ?? '', $failures );
sz_ai_test_assert( 'large selected image passes', 'pass', sz_ai_test_find( $healthy, 'image-dimensions' )['status'] ?? '', $failures );
sz_ai_test_assert( 'healthy page has no blocking errors', 0, $healthy['counts']['error'], $failures );
sz_ai_test_assert( 'audit has no opaque score', false, array_key_exists( 'score', $healthy ), $failures );

$problem = sz_audit_page_ai_searchability( [
	'title' => '',
	'description' => '',
	'content' => 'Thin copy.',
	'blocks' => [
		[ 'acf_fc_layout' => 'text_block', 'heading' => 'Section', 'heading_level' => 'h2' ],
		[ 'acf_fc_layout' => 'services_grid', 'services' => [ [ 'title' => 'Legacy', 'service_reference' => 'missing-service' ] ] ],
	],
	'featured_image' => [ 'url' => 'https://example.com/small.jpg', 'alt' => '', 'width' => 600, 'height' => 400 ],
	'service_reference' => 'missing-service',
	'is_venue_page' => true,
	'venue' => [ 'name' => '' ],
], $site );

sz_ai_test_assert( 'zero H1 is the blocking error', 'error', sz_ai_test_find( $problem, 'exactly-one-h1' )['status'] ?? '', $failures );
sz_ai_test_assert( 'thin copy remains advisory', 'warning', sz_ai_test_find( $problem, 'descriptive-copy' )['status'] ?? '', $failures );
sz_ai_test_assert( 'invalid service reference warns', 'warning', sz_ai_test_find( $problem, 'service-reference' )['status'] ?? '', $failures );
sz_ai_test_assert( 'invalid block service reference warns', 'warning', sz_ai_test_find( $problem, 'block-service-references' )['status'] ?? '', $failures );
sz_ai_test_assert( 'incomplete venue warns', 'warning', sz_ai_test_find( $problem, 'venue-entity' )['status'] ?? '', $failures );
sz_ai_test_assert( 'missing image alt warns', 'warning', sz_ai_test_find( $problem, 'image-alt' )['status'] ?? '', $failures );
sz_ai_test_assert( 'only H1 issue is an error', 1, $problem['counts']['error'], $failures );

if ( ! empty( $failures ) ) {
	foreach ( $failures as $failure ) {
		fwrite( STDERR, "FAILED: {$failure['name']}\n" );
		fwrite( STDERR, 'Expected: ' . json_encode( $failure['expected'] ) . "\n" );
		fwrite( STDERR, 'Actual: ' . json_encode( $failure['actual'] ) . "\n\n" );
	}
	exit( 1 );
}

fwrite( STDOUT, "Passed 13 PHP SEO and AI audit tests.\n" );
