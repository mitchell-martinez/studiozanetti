<?php
/** Server-rendered analytics visuals. All chart values come from report queries. */

function sz_analytics_render_traffic_chart( array $days ): void {
	if ( empty( $days ) ) {
		return;
	}
	$peak = max( max( array_column( $days, 'page_views' ) ), max( array_column( $days, 'sessions' ) ) );
	$step = max( 1, (int) ceil( $peak / 4 ) );
	$ceiling = $step * 4;
	$count = count( $days );
	$totals = [ 'page_views' => array_sum( array_column( $days, 'page_views' ) ), 'sessions' => array_sum( array_column( $days, 'sessions' ) ) ];
	$labels = [ 'page_views' => 'Page views', 'sessions' => 'Sessions' ];
	$points = [];
	foreach ( $labels as $metric => $label ) {
		$points[ $metric ] = [];
		foreach ( $days as $index => $day ) {
			$x = $count > 1 ? 48 + ( $index / ( $count - 1 ) ) * 864 : 480;
			$y = 180 - ( $day[ $metric ] / $ceiling ) * 156;
			$points[ $metric ][] = sprintf( '%.2F,%.2F', $x, $y );
		}
	}
	?>
	<div class="sz-traffic-chart">
		<div class="sz-chart-heading"><div><span class="sz-analytics-eyebrow">Your audience</span><h2>Traffic over time</h2></div><div class="sz-trend-controls" aria-label="Chart metric" hidden><button type="button" data-metric="page_views" aria-pressed="true">Page views</button><button type="button" data-metric="sessions" aria-pressed="false">Sessions</button></div></div>
		<div class="sz-chart-total"><strong data-chart-total><?php echo esc_html( number_format_i18n( $totals['page_views'] ) ); ?></strong><span data-chart-label>page views in this period</span><span class="sz-chart-average" data-chart-average><?php echo esc_html( number_format_i18n( $totals['page_views'] / $count, 1 ) ); ?> per day</span></div>
		<div class="sz-chart-plot">
			<svg viewBox="0 0 960 216" role="img" aria-labelledby="sz-traffic-chart-title">
				<title id="sz-traffic-chart-title">Daily page views. Exact figures are available in the daily figures table.</title>
				<defs><linearGradient id="sz-traffic-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8ce0ce" stop-opacity="0.25"/><stop offset="100%" stop-color="#8ce0ce" stop-opacity="0"/></linearGradient></defs>
				<?php for ( $line = 0; $line <= 4; $line++ ) : ?>
					<line x1="48" x2="912" y1="<?php echo esc_attr( (string) ( 24 + $line * 39 ) ); ?>" y2="<?php echo esc_attr( (string) ( 24 + $line * 39 ) ); ?>" class="sz-chart-grid"/>
					<text x="30" y="<?php echo esc_attr( (string) ( 28 + $line * 39 ) ); ?>" text-anchor="end" class="sz-chart-axis sz-chart-y-axis"><?php echo esc_html( number_format_i18n( $ceiling - $line * $step ) ); ?></text>
				<?php endfor; ?>
				<?php foreach ( $labels as $metric => $label ) : ?>
					<g class="sz-trend-series" data-metric="<?php echo esc_attr( $metric ); ?>" data-total="<?php echo esc_attr( number_format_i18n( $totals[ $metric ] ) ); ?>" data-average="<?php echo esc_attr( number_format_i18n( $totals[ $metric ] / $count, 1 ) ); ?>" <?php echo 'sessions' === $metric ? 'hidden' : ''; ?>>
						<path d="M <?php echo esc_attr( implode( ' L ', $points[ $metric ] ) ); ?> L <?php echo esc_attr( $count > 1 ? '912' : '480' ); ?>,180 L <?php echo esc_attr( $count > 1 ? '48' : '480' ); ?>,180 Z" fill="url(#sz-traffic-fill)"/>
						<polyline points="<?php echo esc_attr( implode( ' ', $points[ $metric ] ) ); ?>" class="sz-chart-line"/>
						<?php foreach ( $points[ $metric ] as $point ) : ?><?php [ $x, $y ] = explode( ',', $point ); ?><circle cx="<?php echo esc_attr( $x ); ?>" cy="<?php echo esc_attr( $y ); ?>" r="<?php echo $count > 45 ? '2' : '3'; ?>" class="sz-chart-point"/><?php endforeach; ?>
					</g>
				<?php endforeach; ?>
				<?php foreach ( array_unique( [ 0, (int) floor( ( $count - 1 ) / 3 ), (int) floor( ( $count - 1 ) * 2 / 3 ), $count - 1 ] ) as $index ) : ?>
					<text x="<?php echo esc_attr( (string) ( $count > 1 ? 48 + $index / ( $count - 1 ) * 864 : 480 ) ); ?>" y="207" text-anchor="middle" class="sz-chart-axis"><?php echo esc_html( $days[ $index ]['label'] ); ?></text>
				<?php endforeach; ?>
				<?php foreach ( $days as $index => $day ) : ?>
					<rect class="sz-chart-hit" x="<?php echo esc_attr( (string) ( $count > 1 ? max( 36, 48 + ( $index - 0.5 ) / ( $count - 1 ) * 864 ) : 36 ) ); ?>" y="20" width="<?php echo esc_attr( (string) ( $count > 1 ? 864 / ( $count - 1 ) : 888 ) ); ?>" height="164" data-date="<?php echo esc_attr( $day['label'] ); ?>" data-page-views="<?php echo esc_attr( number_format_i18n( $day['page_views'] ) ); ?>" data-sessions="<?php echo esc_attr( number_format_i18n( $day['sessions'] ) ); ?>"><title><?php echo esc_html( $day['label'] . ': ' . $day['page_views'] . ' page views, ' . $day['sessions'] . ' sessions' ); ?></title></rect>
				<?php endforeach; ?>
			</svg>
			<div class="sz-chart-tooltip" hidden></div>
		</div>
		<div class="sz-chart-footer"><span><?php echo $peak > 0 ? 'Daily activity · UTC' : 'No traffic recorded in this period'; ?></span><details class="sz-chart-data"><summary>Daily figures</summary><?php sz_analytics_render_table( [ 'Date', 'Page views', 'Sessions' ], $days, [ 'event_date', 'page_views', 'sessions' ] ); ?></details></div>
	</div>
	<?php
}

function sz_analytics_render_enquiry_summary( array $summary ): void {
	$sessions = (int) ( $summary['sessions'] ?? 0 );
	$enquiry_sessions = (int) ( $summary['enquiry_sessions'] ?? 0 );
	$rate = $sessions > 0 ? $enquiry_sessions / $sessions * 100 : 0;
	?>
	<aside class="sz-enquiry-summary" aria-label="Enquiry activity">
		<div class="sz-chart-heading"><div><span class="sz-analytics-eyebrow">The next step</span><h2>Enquiry activity</h2></div><span class="sz-enquiry-icon dashicons dashicons-email-alt" aria-hidden="true"></span></div>
		<div class="sz-enquiry-rate"><div class="sz-rate-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="sz-rate-track"/><circle cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="<?php echo esc_attr( sprintf( '%.2F 100', $rate ) ); ?>" class="sz-rate-value"/></svg><strong><?php echo esc_html( number_format_i18n( $rate, 1 ) ); ?>%</strong></div><div><strong>Session enquiry rate</strong><p><?php echo esc_html( number_format_i18n( $enquiry_sessions ) . ' of ' . number_format_i18n( $sessions ) ); ?> sessions sent a form.</p></div></div>
		<dl class="sz-enquiry-counts"><div><dt>Contact page views</dt><dd><?php echo esc_html( number_format_i18n( (int) ( $summary['contact_views'] ?? 0 ) ) ); ?></dd></div><div><dt>Form starts</dt><dd><?php echo esc_html( number_format_i18n( (int) ( $summary['form_starts'] ?? 0 ) ) ); ?></dd></div><div><dt>Form submissions</dt><dd><?php echo esc_html( number_format_i18n( (int) ( $summary['form_submits'] ?? 0 ) ) ); ?></dd></div></dl>
		<a class="sz-enquiry-link" href="#forms">View form report<span class="dashicons dashicons-arrow-right-alt2" aria-hidden="true"></span></a>
	</aside>
	<?php
}

function sz_analytics_render_sources( array $sources ): void {
	if ( empty( $sources ) ) {
		sz_analytics_render_table( [ 'Source', 'Domain', 'Sessions' ], [], [ 'source', 'domain', 'sessions' ] );
		return;
	}
	$colors = [ 'direct' => '#253f55', 'search' => '#527ddd', 'internal' => '#97a5b4', 'ai_assistant' => '#9073bf', 'referral' => '#d59a5c', 'social' => '#4baf9e', 'unknown' => '#b8bec9' ];
	$icons = [ 'direct' => 'admin-home', 'search' => 'search', 'internal' => 'admin-links', 'ai_assistant' => 'superhero-alt', 'referral' => 'external', 'social' => 'share', 'unknown' => 'admin-site-alt3' ];
	$mix = [];
	foreach ( $sources as $source ) {
		$key = isset( $colors[ $source['source'] ] ) ? $source['source'] : 'unknown';
		$mix[ $key ] = ( $mix[ $key ] ?? 0 ) + max( 0, (int) $source['sessions'] );
	}
	arsort( $mix );
	$total = array_sum( $mix );
	$stops = [];
	$offset = 0;
	foreach ( $mix as $key => $value ) {
		$end = $offset + ( $total > 0 ? $value / $total * 100 : 0 );
		$stops[] = sprintf( '%s %.3F%% %.3F%%', $colors[ $key ], $offset, $end );
		$offset = $end;
	}
	?>
	<div class="sz-sources-layout">
		<div>
		<div class="sz-analytics-table-wrap sz-source-detail" tabindex="0" role="region" aria-label="Traffic source details">
			<table class="widefat"><thead><tr><th scope="col">Referrer</th><th scope="col" class="sz-analytics-numeric">Sessions</th><th scope="col" class="sz-analytics-numeric">Share</th></tr></thead><tbody>
			<?php foreach ( $sources as $source ) : ?>
				<?php $key = isset( $colors[ $source['source'] ] ) ? $source['source'] : 'unknown'; $domain = (string) ( $source['domain'] ?? '' ); $has_domain = '' !== $domain && '—' !== $domain; $share = $total > 0 ? (int) $source['sessions'] / $total * 100 : 0; ?>
				<tr style="--sz-channel: <?php echo esc_attr( $colors[ $key ] ); ?>"><td><div class="sz-source-identity"><span class="sz-source-icon dashicons dashicons-<?php echo esc_attr( $icons[ $key ] ); ?>" aria-hidden="true"></span><div><strong><?php echo esc_html( $has_domain ? $domain : sz_analytics_source_label( $key ) . ' traffic' ); ?></strong><span><?php echo esc_html( $has_domain ? sz_analytics_source_label( $key ) : 'No referring domain' ); ?></span></div></div></td><td class="sz-analytics-numeric sz-source-number"><?php echo esc_html( number_format_i18n( (int) $source['sessions'] ) ); ?></td><td class="sz-analytics-numeric"><div class="sz-source-share"><span><?php echo esc_html( number_format_i18n( $share, 1 ) ); ?>%</span><span class="sz-source-share-track" aria-hidden="true"><span style="width: <?php echo esc_attr( sprintf( '%.3F', $share ) ); ?>%"></span></span></div></td></tr>
			<?php endforeach; ?>
			</tbody></table>
		</div>
		<?php if ( count( $sources ) > 6 ) : ?><p class="sz-source-scroll-note">Scroll the list to see all <?php echo esc_html( number_format_i18n( count( $sources ) ) ); ?> referrers.</p><?php endif; ?>
		</div>
		<aside class="sz-source-mix" aria-label="Source mix"><h3>Source mix</h3><p>How visitors found you</p><div class="sz-source-donut" style="background: <?php echo esc_attr( $total > 0 ? 'conic-gradient(' . implode( ', ', $stops ) . ')' : '#e6ebef' ); ?>"><div><strong><?php echo esc_html( number_format_i18n( $total ) ); ?></strong><span>sessions shown</span></div></div><ul><?php foreach ( $mix as $key => $value ) : ?><li><span class="sz-source-dot" style="background: <?php echo esc_attr( $colors[ $key ] ); ?>" aria-hidden="true"></span><span><?php echo esc_html( sz_analytics_source_label( $key ) ); ?></span><strong><?php echo esc_html( number_format_i18n( $total > 0 ? $value / $total * 100 : 0, 1 ) ); ?>%</strong></li><?php endforeach; ?></ul><small>Share of listed sessions. Up to 50 referrers are shown.</small></aside>
	</div>
	<?php
}
