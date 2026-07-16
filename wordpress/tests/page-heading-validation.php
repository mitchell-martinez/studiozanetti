<?php

require_once __DIR__ . '/../mu-plugins/includes/page-heading-validation.php';

$failures = [];

function sz_heading_test_assert( string $name, $expected, $actual, array &$failures ): void {
	if ( $expected === $actual ) {
		return;
	}

	$failures[] = [ 'name' => $name, 'expected' => $expected, 'actual' => $actual ];
}

$hero = sz_audit_page_headings( [
	[ 'acf_fc_layout' => 'hero', 'title' => 'Sydney wedding photography' ],
	[ 'acf_fc_layout' => 'text_block', 'heading' => 'Approach', 'heading_level' => 'h2' ],
] );
sz_heading_test_assert( 'hero title is the only H1', 1, $hero['h1_count'], $failures );
sz_heading_test_assert( 'valid hierarchy has no errors', [], $hero['errors'], $failures );

$key_shaped = sz_audit_page_headings( [
	[
		'acf_fc_layout' => 'layout_sz_text_block',
		'field_sz_text_heading' => 'Page lead',
		'field_sz_text_heading_level' => 'h1',
	],
	[
		'acf_fc_layout' => 'layout_sz_form_block',
		'field_sz_form_heading' => 'Enquire',
		'field_sz_form_heading_tag' => 'h3',
	],
] );
sz_heading_test_assert( 'key-shaped ACF rows normalize', 1, $key_shaped['h1_count'], $failures );
sz_heading_test_assert( 'heading level skip is advisory', 1, count( $key_shaped['warnings'] ), $failures );

$multiple = sz_audit_page_headings( [
	[ 'acf_fc_layout' => 'hero', 'title' => 'First' ],
	[ 'acf_fc_layout' => 'image_block', 'title' => 'Second', 'heading_tag' => 'h1' ],
] );
sz_heading_test_assert( 'multiple rendered H1 headings are rejected', 2, $multiple['h1_count'], $failures );
sz_heading_test_assert( 'multiple H1 produces one publishing error', 1, count( $multiple['errors'] ), $failures );

$blank = sz_audit_page_headings( [
	[ 'acf_fc_layout' => 'hero', 'title' => '   ' ],
	[ 'acf_fc_layout' => 'image_text', 'heading' => '', 'heading_level' => 'h1' ],
] );
sz_heading_test_assert( 'blank headings do not count', 0, $blank['h1_count'], $failures );
sz_heading_test_assert( 'zero H1 produces one publishing error', 1, count( $blank['errors'] ), $failures );

$native = sz_audit_page_headings( [], true );
sz_heading_test_assert( 'native-content route title supplies H1', 1, $native['h1_count'], $failures );
sz_heading_test_assert( 'native-content page is valid without blocks', [], $native['errors'], $failures );

if ( ! empty( $failures ) ) {
	foreach ( $failures as $failure ) {
		fwrite( STDERR, "FAILED: {$failure['name']}\n" );
		fwrite( STDERR, 'Expected: ' . json_encode( $failure['expected'] ) . "\n" );
		fwrite( STDERR, 'Actual: ' . json_encode( $failure['actual'] ) . "\n\n" );
	}
	exit( 1 );
}

fwrite( STDOUT, "Passed 10 PHP page heading validation tests.\n" );
