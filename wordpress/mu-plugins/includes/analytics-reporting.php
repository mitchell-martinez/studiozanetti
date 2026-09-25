<?php

if ( ! function_exists( 'sz_analytics_source_label' ) ) {
	function sz_analytics_source_label( string $category, string $domain = '' ): string {
		$labels = [
			'direct'       => 'Direct',
			'internal'     => 'Internal',
			'search'       => 'Search',
			'ai_assistant' => 'AI assistant',
			'social'       => 'Social',
			'referral'     => 'Referral',
			'unknown'      => 'Unknown',
		];
		$label = $labels[ $category ] ?? 'Unknown';

		return '' !== $domain ? $label . ' (' . $domain . ')' : $label;
	}
}

if ( ! function_exists( 'sz_analytics_sort_events' ) ) {
	function sz_analytics_sort_events( array $events ): array {
		usort( $events, static function ( array $left, array $right ): int {
			$sequence_comparison = (int) ( $left['event_sequence'] ?? 0 ) <=> (int) ( $right['event_sequence'] ?? 0 );
			return 0 !== $sequence_comparison
				? $sequence_comparison
				: (int) ( $left['id'] ?? 0 ) <=> (int) ( $right['id'] ?? 0 );
		} );

		return $events;
	}
}

if ( ! function_exists( 'sz_analytics_build_session_summaries' ) ) {
	function sz_analytics_build_session_summaries( array $session_rows, array $page_view_rows ): array {
		$first_views = [];
		foreach ( sz_analytics_sort_events( $page_view_rows ) as $view ) {
			$session_hash = (string) ( $view['session_hash'] ?? '' );
			if ( '' !== $session_hash && ! isset( $first_views[ $session_hash ] ) ) {
				$first_views[ $session_hash ] = $view;
			}
		}

		$summaries = [];
		foreach ( $session_rows as $row ) {
			$session_hash = (string) ( $row['session_hash'] ?? '' );
			$first_view = $first_views[ $session_hash ] ?? [];
			$source_category = (string) ( $first_view['referrer_category'] ?? 'unknown' );
			$source_domain = (string) ( $first_view['referrer_domain'] ?? '' );
			$summaries[] = [
				'selector_id'   => (int) ( $row['selector_id'] ?? 0 ),
				'started_at'    => (string) ( $row['started_at'] ?? '' ),
				'ended_at'      => (string) ( $row['ended_at'] ?? '' ),
				'landing_page'  => (string) ( $first_view['page_path'] ?? 'Unknown' ),
				'source'        => sz_analytics_source_label( $source_category, $source_domain ),
				'source_type'   => in_array( $source_category, [ 'direct', 'internal', 'search', 'ai_assistant', 'social', 'referral' ], true ) ? $source_category : 'unknown',
				'region_bucket' => (string) ( $row['region_bucket'] ?? 'unknown' ),
				'page_views'    => (int) ( $row['page_views'] ?? 0 ),
				'converted'     => ! empty( $row['converted'] ),
			];
		}

		return $summaries;
	}
}

if ( ! function_exists( 'sz_analytics_build_session_detail' ) ) {
	function sz_analytics_build_session_detail( array $events ): ?array {
		$events = sz_analytics_sort_events( $events );
		if ( empty( $events ) ) {
			return null;
		}

		$first_view = null;
		$page_views = 0;
		$converted = false;
		$timeline = [];
		foreach ( $events as $event ) {
			$event_type = (string) ( $event['event_type'] ?? '' );
			if ( 'page_view' === $event_type ) {
				$first_view = $first_view ?? $event;
				++$page_views;
			}
			if ( 'form_submit' === $event_type ) {
				$converted = true;
			}

			$labels = [
				'page_view'   => 'Viewed',
				'scroll_depth' => 'Reached ' . (int) ( $event['scroll_depth'] ?? 0 ) . '%',
				'form_start'  => 'Started form',
				'form_submit' => 'Submitted form',
			];
			if ( ! isset( $labels[ $event_type ] ) ) {
				continue;
			}

			$timeline[] = [
				'occurred_at' => (string) ( $event['occurred_at'] ?? '' ),
				'type'        => $event_type,
				'label'       => $labels[ $event_type ],
				'page_path'   => (string) ( $event['page_path'] ?? '' ),
				'form_id'     => in_array( $event_type, [ 'form_start', 'form_submit' ], true ) ? (string) ( $event['form_id'] ?? '' ) : '',
			];
		}

		$first_event = reset( $events );
		$last_event = end( $events );
		$source_category = (string) ( $first_view['referrer_category'] ?? 'unknown' );
		$source_domain = (string) ( $first_view['referrer_domain'] ?? '' );
		$started_at = (string) ( $first_event['occurred_at'] ?? '' );
		$ended_at = (string) ( $last_event['occurred_at'] ?? '' );
		$duration_seconds = max( 0, strtotime( $ended_at ) - strtotime( $started_at ) );

		return [
			'started_at'       => $started_at,
			'ended_at'         => $ended_at,
			'duration_seconds' => $duration_seconds,
			'landing_page'     => (string) ( $first_view['page_path'] ?? 'Unknown' ),
			'source'           => sz_analytics_source_label( $source_category, $source_domain ),
			'source_type'      => in_array( $source_category, [ 'direct', 'internal', 'search', 'ai_assistant', 'social', 'referral' ], true ) ? $source_category : 'unknown',
			'region_bucket'    => (string) ( $first_event['region_bucket'] ?? 'unknown' ),
			'page_views'       => $page_views,
			'converted'        => $converted,
			'timeline'         => $timeline,
		];
	}
}
