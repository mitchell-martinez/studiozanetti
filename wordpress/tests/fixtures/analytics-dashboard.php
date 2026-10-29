<?php
/** Render the real analytics templates with synthetic data, without WordPress. */
define( 'ABSPATH', __DIR__ . '/' );
define( 'ARRAY_A', 'ARRAY_A' );
define( 'DAY_IN_SECONDS', 86400 );
define( 'HOUR_IN_SECONDS', 3600 );
define( 'MINUTE_IN_SECONDS', 60 );

function add_action( ...$args ): void {}
function current_user_can( $capability ): bool { return true; }
function esc_html( $value ): string { return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $value ): string { return esc_html( $value ); }
function esc_url( $value ): string { return esc_html( $value ); }
function sanitize_html_class( $value ): string { return preg_replace( '/[^A-Za-z0-9_-]/', '', $value ); }
function sanitize_key( $value ): string { return strtolower( sanitize_html_class( $value ) ); }
function sanitize_text_field( $value ): string { return strip_tags( $value ); }
function wp_unslash( $value ): string { return stripslashes( $value ); }
function absint( $value ): int { return abs( (int) $value ); }
function number_format_i18n( $value, $decimals = 0 ): string { return number_format( $value, $decimals ); }
function admin_url( $path ): string { return '/wp-admin/' . $path; }
function add_query_arg( $args, $url ): string { return $url . '?' . http_build_query( $args ); }
function get_date_from_gmt( $value, $format ): string { return ( new DateTimeImmutable( $value, new DateTimeZone( 'UTC' ) ) )->format( $format ); }
function mysql_to_rfc3339( $value ): string { return str_replace( ' ', 'T', $value ) . 'Z'; }

$view = $argv[1] ?? 'overview';
$today = new DateTimeImmutable( 'today', new DateTimeZone( 'UTC' ) );
$_GET = [ 'start' => $today->modify( '-29 days' )->format( 'Y-m-d' ), 'end' => $today->format( 'Y-m-d' ), 'analytics_view' => $view, 'session_event' => 1 ];
parse_str( $argv[2] ?? '', $query );
$_GET = array_merge( $_GET, $query );
putenv( 'SZ_ANALYTICS_INGEST_SECRET=synthetic-preview-only' );

$sources = [
	[ 'source' => 'direct', 'domain' => '—', 'sessions' => 432 ],
	[ 'source' => 'search', 'domain' => 'google.com', 'sessions' => 102 ],
	[ 'source' => 'internal', 'domain' => '—', 'sessions' => 31 ],
	[ 'source' => 'ai_assistant', 'domain' => 'chatgpt.com', 'sessions' => 23 ],
	[ 'source' => 'referral', 'domain' => 'reddit.com', 'sessions' => 12 ],
	[ 'source' => 'social', 'domain' => 'l.instagram.com', 'sessions' => 7 ],
	[ 'source' => 'social', 'domain' => 'facebook.com', 'sessions' => 7 ],
	[ 'source' => 'search', 'domain' => 'bing.com', 'sessions' => 3 ],
];
$landings = [
	[ 'page_path' => '/', 'source' => 'direct', 'sessions' => 166 ],
	[ 'page_path' => '/events-and-corporate-photographer-sydney', 'source' => 'search', 'sessions' => 36 ],
	[ 'page_path' => '/about-studio-zanetti', 'source' => 'direct', 'sessions' => 21 ],
	[ 'page_path' => '/' . str_repeat( 'long-page-path-', 24 ), 'source' => 'referral', 'sessions' => 1 ],
];
$forms = [ [ 'region_bucket' => 'AU-NSW', 'page_path' => '/get-in-touch', 'form_id' => 'website-enquiry', 'starts' => 7, 'submits' => 3, 'abandoned' => 4 ] ];
$hash = str_repeat( 'a', 64 );
$page_view = [ 'id' => 1, 'session_hash' => $hash, 'event_sequence' => 1, 'event_type' => 'page_view', 'page_path' => '/', 'referrer_category' => 'search', 'referrer_domain' => 'google.com', 'region_bucket' => 'AU-NSW', 'occurred_at' => $today->format( 'Y-m-d' ) . ' 05:00:00' ];
$weights = [ 23, 36, 29, 42, 34, 17, 21, 38, 48, 36, 33, 25, 20, 47, 58, 41, 32, 24, 19, 39, 51, 45, 33, 22, 28, 43, 54, 42, 37, 31 ];
$daily = [];
$start_date = new DateTimeImmutable( $_GET['start'], new DateTimeZone( 'UTC' ) );
$end_date = new DateTimeImmutable( $_GET['end'], new DateTimeZone( 'UTC' ) );
$day_count = $start_date->diff( $end_date )->days + 1;
$weights = array_map( static fn( $index ) => $weights[ $index % count( $weights ) ], range( 0, $day_count - 1 ) );
$remaining_views = 1015;
$remaining_sessions = 635;
foreach ( $weights as $index => $weight ) {
	$views = $index === $day_count - 1 ? $remaining_views : (int) floor( $weight / array_sum( $weights ) * 1015 );
	$sessions = $index === $day_count - 1 ? $remaining_sessions : (int) floor( $weight / array_sum( $weights ) * 635 );
	$daily[] = [ 'event_date' => $start_date->modify( '+' . $index . ' days' )->format( 'Y-m-d' ), 'page_views' => $views, 'sessions' => $sessions ];
	$remaining_views -= $views;
	$remaining_sessions -= $sessions;
}
$queues = [
	'overview' => [
		[ [ 'page_views' => 1015, 'sessions' => 635, 'pricing_views' => 169, 'contact_views' => 124, 'form_starts' => 7, 'form_submits' => 3, 'enquiry_sessions' => 2 ] ],
		$daily,
		$sources, $landings,
		[ [ 'site_group' => 'studio-zanetti', 'views' => 1015, 'sessions' => 635 ] ],
		[ [ 'page_path' => '/', 'views' => 420, 'pricing' => 'No', 'contact' => 'No' ], [ 'page_path' => '/get-in-touch', 'views' => 124, 'pricing' => 'Yes', 'contact' => 'Yes' ] ],
		[ [ 'region_bucket' => 'AU-NSW', 'page_views' => 900, 'pricing_views' => 150, 'contact_views' => 120, 'form_starts' => 7, 'form_submits' => 3 ] ],
		$forms,
		[ [ 'page_path' => '/pricing', 'scroll_depth' => 75, 'reaches' => 51 ] ],
		[ [ 'region_bucket' => 'AU-NSW', 'page_path' => '/', 'exits' => 200 ] ],
		[], $sources, $landings, [], $forms,
	],
	'sessions' => [ [ [ 'total' => 1 ] ], [ [ 'session_hash' => $hash, 'selector_id' => 1, 'started_at' => $page_view['occurred_at'], 'ended_at' => $page_view['occurred_at'], 'region_bucket' => 'AU-NSW', 'page_views' => 1, 'converted' => 0 ] ], [ $page_view ] ],
	'session' => [ [ [ 'session_hash' => $hash ] ], [ $page_view ] ],
];

$wpdb = new class( $queues[ $view ] ?? [] ) {
	public string $prefix = 'wp_';
	private array $rows;
	public function __construct( array $rows ) { $this->rows = $rows; }
	public function prepare( $sql, ...$params ): string { return $sql; }
	public function get_results( $sql, $format ): array { return array_shift( $this->rows ) ?? []; }
	public function get_var( $sql ): int { return 0; }
};

require __DIR__ . '/../../mu-plugins/sz-analytics.php';
sz_analytics_render_dashboard();
