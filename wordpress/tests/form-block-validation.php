<?php

require_once __DIR__ . '/../mu-plugins/includes/form-block-validation.php';

$failures = [];

function sz_test_assert_same_errors( string $name, array $expected, array $actual, array &$failures ): void {
	sort( $expected );
	sort( $actual );

	if ( $expected === $actual ) {
		return;
	}

	$failures[] = [
		'name'     => $name,
		'expected' => $expected,
		'actual'   => $actual,
	];
}

sz_test_assert_same_errors(
	'accepts canonical reserved name row',
	[],
	sz_validate_form_field_rows([
		[
			'field_sz_form_field_id'             => 'name',
			'field_sz_form_field_type'           => 'text',
			'field_sz_form_field_required'       => 1,
			'field_sz_form_field_vsco_field_key' => 'FirstName',
		],
	]),
	$failures,
);

sz_test_assert_same_errors(
	'accepts legacy reserved name row without explicit FirstName mapping',
	[],
	sz_validate_form_field_rows([
		[
			'field_id' => 'name',
			'type'     => 'text',
			'required' => true,
		],
	]),
	$failures,
);

sz_test_assert_same_errors(
	'rejects missing reserved name row',
	[
		'The form must include one reserved Name field with Field ID name.',
	],
	sz_validate_form_field_rows([
		[
			'field_id'       => 'email',
			'type'           => 'email',
			'required'       => true,
			'vsco_field_key' => 'Email',
		],
	]),
	$failures,
);

sz_test_assert_same_errors(
	'rejects reserved name row without required enabled',
	[
		'The reserved Name field must have Required enabled.',
	],
	sz_validate_form_field_rows([
		[
			'field_id'       => 'name',
			'type'           => 'text',
			'required'       => false,
			'vsco_field_key' => 'FirstName',
		],
	]),
	$failures,
);

sz_test_assert_same_errors(
	'rejects duplicate reserved name rows',
	[
		'Field ID name is duplicated. Field IDs must be unique.',
		'Only one reserved Name field is allowed in a form.',
	],
	sz_validate_form_field_rows([
		[
			'field_id'       => 'name',
			'type'           => 'text',
			'required'       => true,
			'vsco_field_key' => 'FirstName',
		],
		[
			'field_id'       => 'name',
			'type'           => 'text',
			'required'       => true,
			'vsco_field_key' => 'FirstName',
		],
	]),
	$failures,
);

sz_test_assert_same_errors(
	'rejects non-name rows mapped to FirstName',
	[
		'The reserved Name field must be the same row that maps to VSCO Field Key FirstName.',
		'VSCO Field Key FirstName is reserved for the Name field.',
	],
	sz_validate_form_field_rows([
		[
			'field_id' => 'name',
			'type'     => 'text',
			'required' => true,
		],
		[
			'field_id'       => 'first_name_override',
			'type'           => 'text',
			'required'       => true,
			'vsco_field_key' => 'FirstName',
		],
	]),
	$failures,
);

sz_test_assert_same_errors(
	'rejects multiple explicit FirstName mappings',
	[
		'VSCO Field Key FirstName can only be used once in a form.',
		'VSCO Field Key FirstName is reserved for the Name field.',
	],
	sz_validate_form_field_rows([
		[
			'field_id'       => 'name',
			'type'           => 'text',
			'required'       => true,
			'vsco_field_key' => 'FirstName',
		],
		[
			'field_id'       => 'alternate_name',
			'type'           => 'text',
			'required'       => true,
			'vsco_field_key' => 'FirstName',
		],
	]),
	$failures,
);

if ( ! empty( $failures ) ) {
	foreach ( $failures as $failure ) {
		fwrite( STDERR, "FAILED: {$failure['name']}\n" );
		fwrite( STDERR, 'Expected: ' . json_encode( $failure['expected'], JSON_PRETTY_PRINT ) . "\n" );
		fwrite( STDERR, 'Actual: ' . json_encode( $failure['actual'], JSON_PRETTY_PRINT ) . "\n\n" );
	}

	exit( 1 );
}

fwrite( STDOUT, "Passed 7 PHP form validation tests.\n" );