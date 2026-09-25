<?php

require_once __DIR__ . '/../mu-plugins/includes/analytics-reporting.php';

$failures = [];

function sz_analytics_reporting_assert( string $name, bool $condition, array &$failures ): void {
	if ( ! $condition ) {
		$failures[] = $name;
	}
}

$session_hash = str_repeat( 'a', 64 );
$events = [
	[
		'id'                => 14,
		'occurred_at'       => '2026-09-24 05:08:00',
		'event_type'        => 'form_submit',
		'page_path'         => '/get-in-touch',
		'region_bucket'     => 'AU-NSW',
		'session_hash'      => $session_hash,
		'event_sequence'    => 4,
		'form_id'           => 'website-corporate-enquiry',
	],
	[
		'id'                => 11,
		'occurred_at'       => '2026-09-24 05:00:00',
		'event_type'        => 'page_view',
		'page_path'         => '/conference-photography-sydney',
		'region_bucket'     => 'AU-NSW',
		'session_hash'      => $session_hash,
		'event_sequence'    => 1,
		'referrer_category' => 'search',
		'referrer_domain'   => 'google.com',
	],
	[
		'id'             => 13,
		'occurred_at'    => '2026-09-24 05:07:00',
		'event_type'     => 'form_start',
		'page_path'      => '/get-in-touch',
		'region_bucket'  => 'AU-NSW',
		'session_hash'   => $session_hash,
		'event_sequence' => 3,
		'form_id'        => 'website-corporate-enquiry',
	],
	[
		'id'             => 12,
		'occurred_at'    => '2026-09-24 05:04:00',
		'event_type'     => 'scroll_depth',
		'page_path'      => '/conference-photography-sydney',
		'region_bucket'  => 'AU-NSW',
		'session_hash'   => $session_hash,
		'event_sequence' => 2,
		'scroll_depth'   => 75,
	],
];

$summaries = sz_analytics_build_session_summaries(
	[
		[
			'session_hash'  => $session_hash,
			'selector_id'   => 11,
			'started_at'    => '2026-09-24 05:00:00',
			'ended_at'      => '2026-09-24 05:08:00',
			'region_bucket' => 'AU-NSW',
			'page_views'    => 2,
			'converted'     => 1,
		],
	],
	array_values( array_filter( $events, static fn( array $event ): bool => 'page_view' === $event['event_type'] ) )
);

sz_analytics_reporting_assert( 'builds one session summary', 1 === count( $summaries ), $failures );
sz_analytics_reporting_assert( 'uses the first page as landing page', '/conference-photography-sydney' === $summaries[0]['landing_page'], $failures );
sz_analytics_reporting_assert( 'formats source and domain', 'Search (google.com)' === $summaries[0]['source'], $failures );
sz_analytics_reporting_assert( 'marks submitted sessions as converted', true === $summaries[0]['converted'], $failures );

$detail = sz_analytics_build_session_detail( $events );
sz_analytics_reporting_assert( 'builds session detail', is_array( $detail ), $failures );
sz_analytics_reporting_assert( 'orders mixed events by sequence', [ 'Viewed', 'Reached 75%', 'Started form', 'Submitted form' ] === array_column( $detail['timeline'], 'label' ), $failures );
sz_analytics_reporting_assert( 'calculates elapsed duration', 480 === $detail['duration_seconds'], $failures );
sz_analytics_reporting_assert( 'counts page views', 1 === $detail['page_views'], $failures );
sz_analytics_reporting_assert( 'keeps unknown attribution concise', 'Unknown' === sz_analytics_source_label( 'invented' ), $failures );
sz_analytics_reporting_assert( 'returns null for an empty journey', null === sz_analytics_build_session_detail( [] ), $failures );
sz_analytics_reporting_assert( 'does not expose session hashes in summaries', false === strpos( serialize( $summaries ), $session_hash ), $failures );
sz_analytics_reporting_assert( 'does not expose session hashes in detail', false === strpos( serialize( $detail ), $session_hash ), $failures );

if ( ! empty( $failures ) ) {
	foreach ( $failures as $failure ) {
		fwrite( STDERR, "FAILED: {$failure}\n" );
	}
	exit( 1 );
}

fwrite( STDOUT, "Passed 12 PHP analytics reporting tests.\n" );
