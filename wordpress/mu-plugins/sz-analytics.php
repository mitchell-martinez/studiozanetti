<?php
/**
 * Plugin Name: Studio Zanetti Analytics
 * Description: Privacy-first, first-party website analytics in WordPress.
 * Version: 1.1.0
 * Author: Studio Zanetti
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/analytics-validation.php';

const SZ_ANALYTICS_SCHEMA_VERSION = '1.1.0';
const SZ_ANALYTICS_RETENTION_DAYS = 90;

function sz_analytics_events_table(): string {
	global $wpdb;
	return $wpdb->prefix . 'sz_analytics_events';
}

function sz_analytics_daily_table(): string {
	global $wpdb;
	return $wpdb->prefix . 'sz_analytics_daily';
}

function sz_analytics_install_schema(): void {
	if ( get_option( 'sz_analytics_schema_version' ) === SZ_ANALYTICS_SCHEMA_VERSION ) {
		return;
	}

	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$charset_collate = $wpdb->get_charset_collate();
	$events_table = sz_analytics_events_table();
	$daily_table = sz_analytics_daily_table();

	dbDelta( "CREATE TABLE {$events_table} (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		occurred_at datetime NOT NULL,
		event_type varchar(24) NOT NULL,
		page_path varchar(512) NOT NULL,
		page_id bigint(20) unsigned NOT NULL DEFAULT 0,
		site_group varchar(64) NOT NULL DEFAULT '',
		referrer_category varchar(24) NOT NULL DEFAULT '',
		referrer_domain varchar(190) NOT NULL DEFAULT '',
		region_bucket varchar(24) NOT NULL DEFAULT 'unknown',
		session_hash char(64) NOT NULL DEFAULT '',
		event_sequence bigint(20) unsigned NOT NULL DEFAULT 0,
		scroll_depth tinyint(3) unsigned NOT NULL DEFAULT 0,
		form_id varchar(100) NOT NULL DEFAULT '',
		has_pricing_block tinyint(1) unsigned NOT NULL DEFAULT 0,
		has_form_block tinyint(1) unsigned NOT NULL DEFAULT 0,
		utm_source varchar(100) NOT NULL DEFAULT '',
		utm_medium varchar(100) NOT NULL DEFAULT '',
		utm_campaign varchar(100) NOT NULL DEFAULT '',
		PRIMARY KEY  (id),
		KEY occurred_at (occurred_at),
		KEY event_type (event_type),
		KEY page_id (page_id),
		KEY session_hash (session_hash),
		KEY session_sequence (session_hash, event_sequence),
		KEY region_bucket (region_bucket)
	) {$charset_collate};" );

	dbDelta( "CREATE TABLE {$daily_table} (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		event_date date NOT NULL,
		dimension_hash char(64) NOT NULL,
		event_type varchar(24) NOT NULL,
		page_path varchar(512) NOT NULL,
		page_id bigint(20) unsigned NOT NULL DEFAULT 0,
		site_group varchar(64) NOT NULL DEFAULT '',
		referrer_category varchar(24) NOT NULL DEFAULT '',
		referrer_domain varchar(190) NOT NULL DEFAULT '',
		region_bucket varchar(24) NOT NULL DEFAULT 'unknown',
		scroll_depth tinyint(3) unsigned NOT NULL DEFAULT 0,
		form_id varchar(100) NOT NULL DEFAULT '',
		has_pricing_block tinyint(1) unsigned NOT NULL DEFAULT 0,
		has_form_block tinyint(1) unsigned NOT NULL DEFAULT 0,
		utm_source varchar(100) NOT NULL DEFAULT '',
		utm_medium varchar(100) NOT NULL DEFAULT '',
		utm_campaign varchar(100) NOT NULL DEFAULT '',
		event_count bigint(20) unsigned NOT NULL DEFAULT 0,
		PRIMARY KEY  (id),
		UNIQUE KEY event_dimension (event_date, dimension_hash),
		KEY event_date (event_date),
		KEY event_type (event_type)
	) {$charset_collate};" );

	update_option( 'sz_analytics_schema_version', SZ_ANALYTICS_SCHEMA_VERSION, false );
}
add_action( 'init', 'sz_analytics_install_schema' );

function sz_analytics_schedule_retention(): void {
	if ( ! wp_next_scheduled( 'sz_analytics_daily_retention' ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'sz_analytics_daily_retention' );
	}
}
add_action( 'init', 'sz_analytics_schedule_retention' );

function sz_analytics_rollup_and_purge(): void {
	global $wpdb;
	$events_table = sz_analytics_events_table();
	$daily_table = sz_analytics_daily_table();
	$cutoff = gmdate( 'Y-m-d 00:00:00', time() - ( SZ_ANALYTICS_RETENTION_DAYS * DAY_IN_SECONDS ) );
	$columns = "(
		event_date, dimension_hash, event_type, page_path, page_id, site_group,
		referrer_category, referrer_domain, region_bucket, scroll_depth, form_id,
		has_pricing_block, has_form_block, utm_source, utm_medium, utm_campaign, event_count
	)";
	$run_rollup = static function ( string $select_sql ) use ( $wpdb, $daily_table, $columns, $cutoff ): bool {
		$result = $wpdb->query(
			$wpdb->prepare(
				"INSERT INTO {$daily_table} {$columns}
				{$select_sql}
				ON DUPLICATE KEY UPDATE event_count = VALUES(event_count)",
				$cutoff
			)
		);

		return false !== $result;
	};

	$wpdb->query( 'START TRANSACTION' );
	$rollups_succeeded = $run_rollup(
		"SELECT
			DATE(occurred_at),
			SHA2(CONCAT_WS(CHAR(31), event_type, page_path, page_id, site_group,
				referrer_category, referrer_domain, region_bucket, scroll_depth, form_id,
				has_pricing_block, has_form_block, utm_source, utm_medium, utm_campaign), 256),
			event_type, page_path, page_id, site_group, referrer_category, referrer_domain,
			region_bucket, scroll_depth, form_id, has_pricing_block, has_form_block,
			utm_source, utm_medium, utm_campaign, COUNT(*)
		FROM {$events_table}
		WHERE occurred_at < %s
		GROUP BY DATE(occurred_at), event_type, page_path, page_id, site_group,
			referrer_category, referrer_domain, region_bucket, scroll_depth, form_id,
			has_pricing_block, has_form_block, utm_source, utm_medium, utm_campaign"
	);

	foreach ( [ 'MIN' => 'session_start', 'MAX' => 'session_exit' ] as $aggregate => $metric ) {
		$rollups_succeeded = $rollups_succeeded && $run_rollup(
			"SELECT
				DATE(view_event.occurred_at),
				SHA2(CONCAT_WS(CHAR(31), '{$metric}', view_event.page_path, view_event.page_id,
					view_event.site_group, view_event.referrer_category, view_event.referrer_domain,
					view_event.region_bucket, view_event.has_pricing_block, view_event.has_form_block,
					view_event.utm_source, view_event.utm_medium, view_event.utm_campaign), 256),
				'{$metric}', view_event.page_path, view_event.page_id, view_event.site_group,
				view_event.referrer_category, view_event.referrer_domain, view_event.region_bucket,
				0, '', view_event.has_pricing_block, view_event.has_form_block,
				view_event.utm_source, view_event.utm_medium, view_event.utm_campaign, COUNT(*)
			FROM {$events_table} view_event
			INNER JOIN (
				SELECT DATE(occurred_at) AS event_date, session_hash, {$aggregate}(event_sequence) AS selected_sequence
				FROM {$events_table}
				WHERE occurred_at < %s AND event_type = 'page_view' AND session_hash <> ''
				GROUP BY DATE(occurred_at), session_hash
			) daily_session ON daily_session.session_hash = view_event.session_hash
				AND daily_session.selected_sequence = view_event.event_sequence
			GROUP BY DATE(view_event.occurred_at), view_event.page_path, view_event.page_id,
				view_event.site_group, view_event.referrer_category, view_event.referrer_domain,
				view_event.region_bucket, view_event.has_pricing_block, view_event.has_form_block,
				view_event.utm_source, view_event.utm_medium, view_event.utm_campaign"
		);
	}

	$form_metrics = [
		'form_session_start'     => 'SUM(started)',
		'form_session_submit'    => 'SUM(submitted)',
		'form_session_abandoned' => 'SUM(started = 1 AND submitted = 0)',
	];
	foreach ( $form_metrics as $metric => $count_expression ) {
		$rollups_succeeded = $rollups_succeeded && $run_rollup(
			"SELECT
				form_sessions.event_date,
				SHA2(CONCAT_WS(CHAR(31), '{$metric}', form_sessions.page_path,
					form_sessions.region_bucket, form_sessions.form_id), 256),
				'{$metric}', form_sessions.page_path, 0, '', '', '', form_sessions.region_bucket,
				0, form_sessions.form_id, 0, 0, '', '', '', {$count_expression}
			FROM (
				SELECT DATE(occurred_at) AS event_date, session_hash, page_path, region_bucket,
					form_id, MAX(event_type = 'form_start') AS started,
					MAX(event_type = 'form_submit') AS submitted
				FROM {$events_table}
				WHERE occurred_at < %s AND event_type IN ('form_start', 'form_submit')
					AND session_hash <> ''
				GROUP BY DATE(occurred_at), session_hash, page_path, region_bucket, form_id
			) form_sessions
			GROUP BY form_sessions.event_date, form_sessions.page_path,
				form_sessions.region_bucket, form_sessions.form_id
			HAVING {$count_expression} > 0"
		);
	}

	if ( ! $rollups_succeeded ) {
		$wpdb->query( 'ROLLBACK' );
		return;
	}

	$deleted = $wpdb->query( $wpdb->prepare( "DELETE FROM {$events_table} WHERE occurred_at < %s", $cutoff ) );
	$wpdb->query( false === $deleted ? 'ROLLBACK' : 'COMMIT' );
}
add_action( 'sz_analytics_daily_retention', 'sz_analytics_rollup_and_purge' );

function sz_analytics_ingest_permission( WP_REST_Request $request ) {
	$expected = trim( (string) getenv( 'SZ_ANALYTICS_INGEST_SECRET' ) );
	$provided = trim( (string) $request->get_header( 'X-SZ-Analytics-Key' ) );
	if ( '' === $expected || '' === $provided || ! hash_equals( $expected, $provided ) ) {
		return new WP_Error( 'sz_analytics_forbidden', 'Analytics ingest is unavailable.', [ 'status' => 403 ] );
	}

	return true;
}

function sz_analytics_ingest_events( WP_REST_Request $request ) {
	global $wpdb;
	$payload = $request->get_json_params();
	$events = is_array( $payload ) && isset( $payload['events'] ) && is_array( $payload['events'] )
		? array_slice( $payload['events'], 0, 100 )
		: [];
	if ( empty( $events ) ) {
		return new WP_Error( 'sz_analytics_invalid', 'No valid analytics events were provided.', [ 'status' => 400 ] );
	}

	$validated = [];
	foreach ( $events as $event ) {
		$normalized = sz_analytics_validate_event( $event );
		if ( null === $normalized ) {
			return new WP_Error( 'sz_analytics_invalid', 'An analytics event was invalid.', [ 'status' => 400 ] );
		}
		$validated[] = $normalized;
	}

	$table = sz_analytics_events_table();
	$wpdb->query( 'START TRANSACTION' );
	foreach ( $validated as $event ) {
		$inserted = $wpdb->insert(
			$table,
			$event,
			[ '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%d', '%d', '%s', '%s', '%s' ]
		);
		if ( false === $inserted ) {
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error( 'sz_analytics_storage', 'Analytics storage failed.', [ 'status' => 500 ] );
		}
	}
	$wpdb->query( 'COMMIT' );

	return new WP_REST_Response( [ 'stored' => count( $validated ) ], 201 );
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'sz/v1', '/analytics/events', [
		'methods'             => 'POST',
		'callback'            => 'sz_analytics_ingest_events',
		'permission_callback' => 'sz_analytics_ingest_permission',
	] );
} );

function sz_analytics_admin_menu(): void {
	add_menu_page(
		'Website Analytics',
		'Analytics',
		'manage_options',
		'sz-analytics',
		'sz_analytics_render_dashboard',
		'dashicons-chart-area',
		26
	);
}
add_action( 'admin_menu', 'sz_analytics_admin_menu' );

function sz_analytics_admin_assets( string $hook ): void {
	if ( 'toplevel_page_sz-analytics' !== $hook ) {
		return;
	}

	$style_path = __DIR__ . '/assets/analytics.css';
	wp_enqueue_style(
		'sz-analytics',
		plugins_url( 'assets/analytics.css', __FILE__ ),
		[],
		file_exists( $style_path ) ? filemtime( $style_path ) : SZ_ANALYTICS_SCHEMA_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'sz_analytics_admin_assets' );

function sz_analytics_date_range(): array {
	$today = new DateTimeImmutable( 'today', new DateTimeZone( 'UTC' ) );
	$default_start = $today->modify( '-29 days' );
	$start_raw = isset( $_GET['start'] ) ? sanitize_text_field( wp_unslash( $_GET['start'] ) ) : '';
	$end_raw = isset( $_GET['end'] ) ? sanitize_text_field( wp_unslash( $_GET['end'] ) ) : '';
	$start = DateTimeImmutable::createFromFormat( '!Y-m-d', $start_raw, new DateTimeZone( 'UTC' ) ) ?: $default_start;
	$end = DateTimeImmutable::createFromFormat( '!Y-m-d', $end_raw, new DateTimeZone( 'UTC' ) ) ?: $today;
	$earliest = $today->modify( '-' . ( SZ_ANALYTICS_RETENTION_DAYS - 1 ) . ' days' );

	if ( $start < $earliest ) {
		$start = $earliest;
	}
	if ( $end > $today ) {
		$end = $today;
	}
	if ( $start > $end ) {
		$start = $end;
	}

	return [ $start, $end ];
}

function sz_analytics_query_rows( string $sql, array $params = [] ): array {
	global $wpdb;
	$prepared = empty( $params ) ? $sql : $wpdb->prepare( $sql, ...$params );
	$rows = $wpdb->get_results( $prepared, ARRAY_A );
	return is_array( $rows ) ? $rows : [];
}

function sz_analytics_render_table( array $headers, array $rows, array $keys ): void {
	if ( empty( $rows ) ) {
		echo '<p class="sz-analytics-empty">No data has been recorded for this period.</p>';
		return;
	}
	?>
	<div class="sz-analytics-table-wrap">
		<table class="widefat striped">
			<thead><tr><?php foreach ( $headers as $header ) : ?><th><?php echo esc_html( $header ); ?></th><?php endforeach; ?></tr></thead>
			<tbody>
			<?php foreach ( $rows as $row ) : ?>
				<tr><?php foreach ( $keys as $key ) : ?><td><?php echo esc_html( (string) ( $row[ $key ] ?? '' ) ); ?></td><?php endforeach; ?></tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}

function sz_analytics_render_dashboard(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to view analytics.', 'studio-zanetti' ) );
	}

	global $wpdb;
	$table = sz_analytics_events_table();
	[ $start, $end ] = sz_analytics_date_range();
	$from = $start->format( 'Y-m-d 00:00:00' );
	$until = $end->modify( '+1 day' )->format( 'Y-m-d 00:00:00' );
	$where = 'occurred_at >= %s AND occurred_at < %s';
	$params = [ $from, $until ];

	$summary_rows = sz_analytics_query_rows(
		"SELECT
			SUM(event_type = 'page_view') AS page_views,
			COUNT(DISTINCT NULLIF(session_hash, '')) AS sessions,
			SUM(event_type = 'page_view' AND has_pricing_block = 1) AS pricing_views,
			SUM(event_type = 'page_view' AND has_form_block = 1) AS contact_views,
			SUM(event_type = 'form_start') AS form_starts,
			SUM(event_type = 'form_submit') AS form_submits
		FROM {$table} WHERE {$where}",
		$params
	);
	$summary = $summary_rows[0] ?? [];
	$sources = sz_analytics_query_rows(
		"SELECT COALESCE(NULLIF(first_view.referrer_category, ''), 'unknown') AS source,
			COALESCE(NULLIF(first_view.referrer_domain, ''), '—') AS domain, COUNT(*) AS sessions
		FROM {$table} first_view
		INNER JOIN (
			SELECT session_hash, MIN(event_sequence) AS first_sequence
			FROM {$table}
			WHERE {$where} AND event_type = 'page_view' AND session_hash <> ''
			GROUP BY session_hash
		) session_start ON session_start.session_hash = first_view.session_hash
			AND session_start.first_sequence = first_view.event_sequence
		GROUP BY source, domain ORDER BY sessions DESC LIMIT 50",
		$params
	);
	$landing_pages = sz_analytics_query_rows(
		"SELECT first_view.page_path,
			COALESCE(NULLIF(first_view.referrer_category, ''), 'unknown') AS source,
			COUNT(*) AS sessions
		FROM {$table} first_view
		INNER JOIN (
			SELECT session_hash, MIN(event_sequence) AS first_sequence
			FROM {$table}
			WHERE {$where} AND event_type = 'page_view' AND session_hash <> ''
			GROUP BY session_hash
		) session_start ON session_start.session_hash = first_view.session_hash
			AND session_start.first_sequence = first_view.event_sequence
		GROUP BY first_view.page_path, source ORDER BY sessions DESC LIMIT 50",
		$params
	);
	$sites = sz_analytics_query_rows(
		"SELECT COALESCE(NULLIF(site_group, ''), 'unknown') AS site_group, COUNT(*) AS views,
			COUNT(DISTINCT NULLIF(session_hash, '')) AS sessions
		FROM {$table} WHERE {$where} AND event_type = 'page_view'
		GROUP BY site_group ORDER BY views DESC",
		$params
	);
	$pages = sz_analytics_query_rows(
		"SELECT page_path, COUNT(*) AS views,
			IF(MAX(has_pricing_block) = 1, 'Yes', 'No') AS pricing,
			IF(MAX(has_form_block) = 1, 'Yes', 'No') AS contact
		FROM {$table} WHERE {$where} AND event_type = 'page_view'
		GROUP BY page_path ORDER BY views DESC LIMIT 50",
		$params
	);
	$regions = sz_analytics_query_rows(
		"SELECT region_bucket,
			SUM(event_type = 'page_view') AS page_views,
			SUM(event_type = 'page_view' AND has_pricing_block = 1) AS pricing_views,
			SUM(event_type = 'page_view' AND has_form_block = 1) AS contact_views,
			SUM(event_type = 'form_start') AS form_starts,
			SUM(event_type = 'form_submit') AS form_submits
		FROM {$table} WHERE {$where}
		GROUP BY region_bucket ORDER BY page_views DESC",
		$params
	);
	$forms = sz_analytics_query_rows(
		"SELECT region_bucket, page_path, form_id,
			SUM(started) AS starts, SUM(submitted) AS submits,
			SUM(started = 1 AND submitted = 0) AS abandoned
		FROM (
			SELECT region_bucket, page_path, COALESCE(NULLIF(form_id, ''), 'unknown') AS form_id,
				session_hash, MAX(event_type = 'form_start') AS started,
				MAX(event_type = 'form_submit') AS submitted
			FROM {$table}
			WHERE {$where} AND event_type IN ('form_start', 'form_submit') AND session_hash <> ''
			GROUP BY region_bucket, page_path, form_id, session_hash
		) form_sessions
		GROUP BY region_bucket, page_path, form_id ORDER BY starts DESC",
		$params
	);
	$scroll = sz_analytics_query_rows(
		"SELECT page_path, scroll_depth, COUNT(*) AS reaches
		FROM {$table} WHERE {$where} AND event_type = 'scroll_depth'
		GROUP BY page_path, scroll_depth ORDER BY page_path, scroll_depth",
		$params
	);
	$exits = sz_analytics_query_rows(
		"SELECT last_view.region_bucket, last_view.page_path, COUNT(*) AS exits
		FROM {$table} last_view
		INNER JOIN (
			SELECT session_hash, MAX(event_sequence) AS last_sequence
			FROM {$table}
			WHERE {$where} AND event_type = 'page_view' AND session_hash <> ''
			GROUP BY session_hash
		) session_end ON session_end.session_hash = last_view.session_hash
			AND session_end.last_sequence = last_view.event_sequence
		GROUP BY last_view.region_bucket, last_view.page_path
		ORDER BY exits DESC LIMIT 50",
		$params
	);
	$archive = sz_analytics_query_rows(
		"SELECT event_date,
			SUM(IF(event_type = 'page_view', event_count, 0)) AS page_views,
			SUM(IF(event_type = 'page_view' AND has_pricing_block = 1, event_count, 0)) AS pricing_views,
			SUM(IF(event_type = 'page_view' AND has_form_block = 1, event_count, 0)) AS contact_views,
			SUM(IF(event_type = 'form_start', event_count, 0)) AS form_starts,
			SUM(IF(event_type = 'form_submit', event_count, 0)) AS form_submits
		FROM " . sz_analytics_daily_table() . '
		GROUP BY event_date ORDER BY event_date DESC LIMIT 365'
	);
	$archive_sources = sz_analytics_query_rows(
		"SELECT COALESCE(NULLIF(referrer_category, ''), 'unknown') AS source,
			COALESCE(NULLIF(referrer_domain, ''), '—') AS domain, SUM(event_count) AS sessions
		FROM " . sz_analytics_daily_table() . " WHERE event_type = 'session_start'
		GROUP BY source, domain ORDER BY sessions DESC LIMIT 50"
	);
	$archive_landings = sz_analytics_query_rows(
		"SELECT page_path, COALESCE(NULLIF(referrer_category, ''), 'unknown') AS source,
			SUM(event_count) AS sessions
		FROM " . sz_analytics_daily_table() . " WHERE event_type = 'session_start'
		GROUP BY page_path, source ORDER BY sessions DESC LIMIT 50"
	);
	$archive_exits = sz_analytics_query_rows(
		"SELECT region_bucket, page_path, SUM(event_count) AS exits
		FROM " . sz_analytics_daily_table() . " WHERE event_type = 'session_exit'
		GROUP BY region_bucket, page_path ORDER BY exits DESC LIMIT 50"
	);
	$archive_forms = sz_analytics_query_rows(
		"SELECT region_bucket, page_path, form_id,
			SUM(IF(event_type = 'form_session_start', event_count, 0)) AS starts,
			SUM(IF(event_type = 'form_session_submit', event_count, 0)) AS submits,
			SUM(IF(event_type = 'form_session_abandoned', event_count, 0)) AS abandoned
		FROM " . sz_analytics_daily_table() . "
		WHERE event_type IN ('form_session_start', 'form_session_submit', 'form_session_abandoned')
		GROUP BY region_bucket, page_path, form_id ORDER BY starts DESC LIMIT 50"
	);
	$archived_count = (int) $wpdb->get_var(
		"SELECT COALESCE(SUM(event_count), 0) FROM " . sz_analytics_daily_table() . "
		WHERE event_type IN ('page_view', 'form_start', 'form_submit', 'scroll_depth')"
	);
	$secret_configured = '' !== trim( (string) getenv( 'SZ_ANALYTICS_INGEST_SECRET' ) );
	?>
	<div class="wrap sz-analytics">
		<h1>Website Analytics</h1>
		<p class="description">First-party analytics with no cookies, no IP storage and no third-party tracking.</p>
		<?php if ( ! $secret_configured ) : ?>
			<div class="notice notice-error inline"><p>Analytics collection is disabled because the ingest secret is not configured.</p></div>
		<?php endif; ?>

		<form class="sz-analytics-range" method="get">
			<input type="hidden" name="page" value="sz-analytics">
			<label>From <input type="date" name="start" value="<?php echo esc_attr( $start->format( 'Y-m-d' ) ); ?>"></label>
			<label>To <input type="date" name="end" value="<?php echo esc_attr( $end->format( 'Y-m-d' ) ); ?>"></label>
			<button class="button button-primary" type="submit">Apply</button>
		</form>

		<div class="sz-analytics-cards">
			<?php
			$cards = [
				'Page views'    => $summary['page_views'] ?? 0,
				'Sessions'      => $summary['sessions'] ?? 0,
				'Pricing views' => $summary['pricing_views'] ?? 0,
				'Contact views' => $summary['contact_views'] ?? 0,
				'Form starts'   => $summary['form_starts'] ?? 0,
				'Form submits'  => $summary['form_submits'] ?? 0,
			];
			foreach ( $cards as $label => $value ) :
			?>
				<div class="sz-analytics-card"><strong><?php echo esc_html( number_format_i18n( (int) $value ) ); ?></strong><span><?php echo esc_html( $label ); ?></span></div>
			<?php endforeach; ?>
		</div>

		<nav class="sz-analytics-nav" aria-label="Analytics sections">
			<a href="#sources">Sources</a><a href="#landing-pages">Landing pages</a><a href="#sites">Sites</a><a href="#pages">Key pages</a><a href="#regions">Regions</a><a href="#forms">Forms</a><a href="#scroll">Pricing depth</a><a href="#exits">Exit pages</a><a href="#archive">Archive</a>
		</nav>

		<section id="sources"><h2>Traffic sources</h2><p class="description">Sources are attributed from each daily session's first page. AI assistants often omit referral data, so their count is a confirmed minimum.</p><?php sz_analytics_render_table( [ 'Source', 'Domain', 'Sessions' ], $sources, [ 'source', 'domain', 'sessions' ] ); ?></section>
		<section id="landing-pages"><h2>Landing pages</h2><?php sz_analytics_render_table( [ 'Landing page', 'Source', 'Sessions' ], $landing_pages, [ 'page_path', 'source', 'sessions' ] ); ?></section>
		<section id="sites"><h2>Sites</h2><?php sz_analytics_render_table( [ 'Site', 'Views', 'Sessions' ], $sites, [ 'site_group', 'views', 'sessions' ] ); ?></section>
		<section id="pages"><h2>Key pages</h2><?php sz_analytics_render_table( [ 'Page', 'Views', 'Pricing', 'Contact form' ], $pages, [ 'page_path', 'views', 'pricing', 'contact' ] ); ?></section>
		<section id="regions"><h2>Regional funnel</h2><p class="description">Location is derived from the browser timezone. Unknown includes browsers that intentionally hide timezone data.</p><?php sz_analytics_render_table( [ 'Region', 'Page views', 'Pricing views', 'Contact views', 'Form starts', 'Form submits' ], $regions, [ 'region_bucket', 'page_views', 'pricing_views', 'contact_views', 'form_starts', 'form_submits' ] ); ?></section>
		<section id="forms"><h2>Form progress</h2><?php sz_analytics_render_table( [ 'Region', 'Page', 'Form', 'Started sessions', 'Submitted sessions', 'Abandoned' ], $forms, [ 'region_bucket', 'page_path', 'form_id', 'starts', 'submits', 'abandoned' ] ); ?></section>
		<section id="scroll"><h2>Pricing page scroll depth</h2><?php sz_analytics_render_table( [ 'Page', 'Depth', 'Reaches' ], $scroll, [ 'page_path', 'scroll_depth', 'reaches' ] ); ?></section>
		<section id="exits"><h2>Exit pages</h2><p class="description">The last recorded page in each privacy-preserving daily session.</p><?php sz_analytics_render_table( [ 'Region', 'Page', 'Exits' ], $exits, [ 'region_bucket', 'page_path', 'exits' ] ); ?></section>
		<section id="archive">
			<h2>Archived analytics</h2>
			<p class="description">After 90 days, detailed events and session hashes are removed. Non-identifying daily totals and funnel summaries remain indefinitely.</p>
			<h3>Daily totals</h3><?php sz_analytics_render_table( [ 'Date', 'Page views', 'Pricing views', 'Contact views', 'Form starts', 'Form submits' ], $archive, [ 'event_date', 'page_views', 'pricing_views', 'contact_views', 'form_starts', 'form_submits' ] ); ?>
			<h3>Traffic sources</h3><?php sz_analytics_render_table( [ 'Source', 'Domain', 'Sessions' ], $archive_sources, [ 'source', 'domain', 'sessions' ] ); ?>
			<h3>Landing pages</h3><?php sz_analytics_render_table( [ 'Landing page', 'Source', 'Sessions' ], $archive_landings, [ 'page_path', 'source', 'sessions' ] ); ?>
			<h3>Form progress</h3><?php sz_analytics_render_table( [ 'Region', 'Page', 'Form', 'Started sessions', 'Submitted sessions', 'Abandoned' ], $archive_forms, [ 'region_bucket', 'page_path', 'form_id', 'starts', 'submits', 'abandoned' ] ); ?>
			<h3>Exit pages</h3><?php sz_analytics_render_table( [ 'Region', 'Page', 'Exits' ], $archive_exits, [ 'region_bucket', 'page_path', 'exits' ] ); ?>
		</section>

		<p class="sz-analytics-footnote">Detailed events are retained for <?php echo esc_html( (string) SZ_ANALYTICS_RETENTION_DAYS ); ?> days. <?php echo esc_html( number_format_i18n( $archived_count ) ); ?> older events have been retained as anonymous daily totals.</p>
	</div>
	<?php
}