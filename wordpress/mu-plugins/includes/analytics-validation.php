<?php

if ( ! function_exists( 'sz_analytics_optional_string' ) ) {
	function sz_analytics_optional_string( array $event, string $key, int $max_length, ?string $pattern = null ): string {
		if ( ! isset( $event[ $key ] ) || ! is_string( $event[ $key ] ) ) {
			return '';
		}

		$value = trim( substr( $event[ $key ], 0, $max_length ) );
		if ( '' === $value || ( null !== $pattern && 1 !== preg_match( $pattern, $value ) ) ) {
			return '';
		}

		return $value;
	}
}

if ( ! function_exists( 'sz_analytics_validate_event' ) ) {
	function sz_analytics_validate_event( $event ): ?array {
		if ( ! is_array( $event ) ) {
			return null;
		}

		$event_types = [ 'page_view', 'form_start', 'form_submit', 'scroll_depth' ];
		$referrer_categories = [ 'direct', 'internal', 'search', 'ai_assistant', 'social', 'referral', 'unknown' ];
		$region_buckets = [ 'AU-NSW', 'AU-VIC', 'AU-QLD', 'AU-WA', 'AU-SA', 'AU-TAS', 'AU-NT', 'international', 'unknown' ];
		$event_type = sz_analytics_optional_string( $event, 'eventType', 24, '/^[a-z_]+$/' );
		$page_path = sz_analytics_optional_string( $event, 'pagePath', 512 );
		$region_bucket = sz_analytics_optional_string( $event, 'regionBucket', 24, '/^[A-Za-z-]+$/' );
		$occurred_at_raw = sz_analytics_optional_string( $event, 'occurredAt', 40 );

		if (
			! in_array( $event_type, $event_types, true ) ||
			'' === $page_path ||
			'/' !== $page_path[0] ||
			false !== strpos( $page_path, '?' ) ||
			false !== strpos( $page_path, '#' ) ||
			! in_array( $region_bucket, $region_buckets, true )
		) {
			return null;
		}

		$occurred_at = DateTimeImmutable::createFromFormat( 'Y-m-d\TH:i:s.v\Z', $occurred_at_raw, new DateTimeZone( 'UTC' ) );
		if ( false === $occurred_at || $occurred_at->format( 'Y-m-d\TH:i:s.v\Z' ) !== $occurred_at_raw ) {
			return null;
		}

		$scroll_depth = isset( $event['scrollDepth'] ) ? (int) $event['scrollDepth'] : 0;
		if ( 'scroll_depth' === $event_type && ! in_array( $scroll_depth, [ 25, 50, 75, 100 ], true ) ) {
			return null;
		}

		$referrer_category = sz_analytics_optional_string( $event, 'referrerCategory', 24, '/^[a-z_]+$/' );
		if ( '' !== $referrer_category && ! in_array( $referrer_category, $referrer_categories, true ) ) {
			return null;
		}

		$session_hash = sz_analytics_optional_string( $event, 'sessionHash', 64, '/^[a-f0-9]{64}$/' );
		if ( isset( $event['sessionHash'] ) && '' !== $event['sessionHash'] && '' === $session_hash ) {
			return null;
		}
		$event_sequence = isset( $event['sessionSequence'] ) && is_int( $event['sessionSequence'] ) && $event['sessionSequence'] > 0
			? $event['sessionSequence']
			: 0;
		if ( '' !== $session_hash && 0 === $event_sequence ) {
			return null;
		}

		return [
			'event_type'        => $event_type,
			'occurred_at'       => $occurred_at->setTimezone( new DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' ),
			'page_path'         => $page_path,
			'page_id'           => isset( $event['pageId'] ) && is_int( $event['pageId'] ) && $event['pageId'] > 0 ? $event['pageId'] : 0,
			'site_group'        => sz_analytics_optional_string( $event, 'siteGroup', 64, '/^[a-z0-9_-]+$/i' ),
			'referrer_category' => $referrer_category,
			'referrer_domain'   => sz_analytics_optional_string( $event, 'referrerDomain', 190, '/^[a-z0-9.-]+$/i' ),
			'region_bucket'     => $region_bucket,
			'session_hash'      => $session_hash,
			'event_sequence'    => $event_sequence,
			'scroll_depth'      => 'scroll_depth' === $event_type ? $scroll_depth : 0,
			'form_id'           => sz_analytics_optional_string( $event, 'formId', 100, '/^[a-z0-9_-]+$/i' ),
			'has_pricing_block' => ! empty( $event['hasPricingBlock'] ) ? 1 : 0,
			'has_form_block'    => ! empty( $event['hasFormBlock'] ) ? 1 : 0,
			'utm_source'        => '',
			'utm_medium'        => '',
			'utm_campaign'      => '',
		];
	}
}