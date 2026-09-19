<?php

require_once __DIR__ . '/../mu-plugins/includes/analytics-validation.php';

$failures = [];

function sz_analytics_test_assert( string $name, bool $condition, array &$failures ): void {
	if ( ! $condition ) {
		$failures[] = $name;
	}
}

$valid_event = [
	'eventType'       => 'page_view',
	'occurredAt'      => '2026-09-19T03:15:00.123Z',
	'pagePath'        => '/weddings',
	'pageId'          => 42,
	'siteGroup'       => 'weddings',
	'regionBucket'    => 'AU-NSW',
	'referrerCategory' => 'search',
	'referrerDomain'  => 'google.com',
	'sessionHash'     => str_repeat( 'a', 64 ),
	'sessionSequence' => 1,
];

$normalized = sz_analytics_validate_event( $valid_event );
sz_analytics_test_assert( 'accepts a valid event', is_array( $normalized ), $failures );
sz_analytics_test_assert( 'normalizes UTC storage time', '2026-09-19 03:15:00' === ( $normalized['occurred_at'] ?? '' ), $failures );
sz_analytics_test_assert( 'keeps the coarse region only', 'AU-NSW' === ( $normalized['region_bucket'] ?? '' ), $failures );

sz_analytics_test_assert(
	'rejects unknown event types',
	null === sz_analytics_validate_event( array_merge( $valid_event, [ 'eventType' => 'mouse_move' ] ) ),
	$failures
);
sz_analytics_test_assert(
	'rejects invalid scroll thresholds',
	null === sz_analytics_validate_event( array_merge( $valid_event, [ 'eventType' => 'scroll_depth', 'scrollDepth' => 63 ] ) ),
	$failures
);
sz_analytics_test_assert(
	'rejects query strings in page paths',
	null === sz_analytics_validate_event( array_merge( $valid_event, [ 'pagePath' => '/weddings?email=private' ] ) ),
	$failures
);
sz_analytics_test_assert(
	'rejects malformed session hashes',
	null === sz_analytics_validate_event( array_merge( $valid_event, [ 'sessionHash' => 'not-a-hash' ] ) ),
	$failures
);

$private_campaign = sz_analytics_validate_event(
	array_merge( $valid_event, [ 'utmSource' => 'person@example.com', 'utmCampaign' => 'secret/token' ] )
);
sz_analytics_test_assert(
	'drops campaign values that could contain private data',
	is_array( $private_campaign ) && '' === $private_campaign['utm_source'] && '' === $private_campaign['utm_campaign'],
	$failures
);

sz_analytics_test_assert(
	'rejects hashed sessions without an event sequence',
	null === sz_analytics_validate_event( array_diff_key( $valid_event, [ 'sessionSequence' => true ] ) ),
	$failures
);

if ( ! empty( $failures ) ) {
	foreach ( $failures as $failure ) {
		fwrite( STDERR, "FAILED: {$failure}\n" );
	}
	exit( 1 );
}

fwrite( STDOUT, "Passed 9 PHP analytics validation tests.\n" );