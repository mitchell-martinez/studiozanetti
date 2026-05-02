<?php

if ( ! function_exists( 'sz_form_normalize_validation_token' ) ) {
	function sz_form_normalize_validation_token( $value ): string {
		return strtolower( trim( (string) $value ) );
	}
}

if ( ! function_exists( 'sz_form_is_truthy_required' ) ) {
	function sz_form_is_truthy_required( $value ): bool {
		if ( is_bool( $value ) ) {
			return $value;
		}

		if ( is_int( $value ) || is_float( $value ) ) {
			return (int) $value === 1;
		}

		$normalized = sz_form_normalize_validation_token( $value );
		return in_array( $normalized, [ '1', 'true', 'on', 'yes' ], true );
	}
}

if ( ! function_exists( 'sz_form_get_validation_row_value' ) ) {
	function sz_form_get_validation_row_value( array $row, array $keys ) {
		foreach ( $keys as $key ) {
			if ( array_key_exists( $key, $row ) ) {
				return $row[ $key ];
			}
		}

		return null;
	}
}

if ( ! function_exists( 'sz_form_is_submitter_copy_enabled_for_row' ) ) {
	function sz_form_is_submitter_copy_enabled_for_row( array $row ): bool {
		$value = sz_form_get_validation_row_value(
			$row,
			[ 'field_sz_form_field_use_for_submitter_copy', 'use_for_submitter_copy' ]
		);

		return sz_form_is_truthy_required( $value );
	}
}

if ( ! function_exists( 'sz_validate_form_field_rows' ) ) {
	function sz_validate_form_field_rows( $value ): array {
		if ( ! is_array( $value ) || empty( $value ) ) {
			return [ 'Add at least one row with Field ID "name" and enable Required on it.' ];
		}

		$errors                     = [];
		$seen_field_ids             = [];
		$duplicate_field_ids        = [];
		$reserved_name_row_count    = 0;
		$first_name_mapping_count   = 0;
		$reserved_name_mapping_hits = 0;
		$submitter_copy_row_count   = 0;

		foreach ( $value as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			$field_id = sz_form_normalize_validation_token(
				sz_form_get_validation_row_value( $row, [ 'field_sz_form_field_id', 'field_id' ] )
			);
			$vsco_key = sz_form_normalize_validation_token(
				sz_form_get_validation_row_value( $row, [ 'field_sz_form_field_vsco_field_key', 'vsco_field_key' ] )
			);
			$field_type = sz_form_normalize_validation_token(
				sz_form_get_validation_row_value( $row, [ 'field_sz_form_field_type', 'type' ] )
			);
			$required_value = sz_form_get_validation_row_value( $row, [ 'field_sz_form_field_required', 'required' ] );
			$use_for_submitter_copy = sz_form_is_submitter_copy_enabled_for_row( $row );

			if ( $field_id !== '' ) {
				if ( isset( $seen_field_ids[ $field_id ] ) ) {
					$duplicate_field_ids[ $field_id ] = true;
				}
				$seen_field_ids[ $field_id ] = true;
			}

			if ( $field_id === 'name' ) {
				$reserved_name_row_count++;

				if ( $field_type !== '' && $field_type !== 'text' ) {
					$errors[] = 'The reserved Name field must use the Text field type.';
				}

				if ( ! sz_form_is_truthy_required( $required_value ) ) {
					$errors[] = 'The reserved Name field must have Required enabled.';
				}

				if ( $vsco_key !== '' && $vsco_key !== 'firstname' ) {
					$errors[] = 'The reserved Name field must map to VSCO Field Key FirstName.';
				}
			}

			if ( $vsco_key === 'firstname' ) {
				$first_name_mapping_count++;

				if ( $field_id === 'name' ) {
					$reserved_name_mapping_hits++;
				} else {
					$errors[] = 'VSCO Field Key FirstName is reserved for the Name field.';
				}
			}

			if ( $use_for_submitter_copy ) {
				$submitter_copy_row_count++;

				if ( $field_type !== 'email' ) {
					$errors[] = 'Only Email fields can be selected for submitter copy delivery.';
				}
			}
		}

		foreach ( array_keys( $duplicate_field_ids ) as $duplicate_field_id ) {
			$errors[] = sprintf( 'Field ID %s is duplicated. Field IDs must be unique.', $duplicate_field_id );
		}

		if ( $reserved_name_row_count === 0 ) {
			$errors[] = 'The form must include one reserved Name field with Field ID name.';
		}

		if ( $reserved_name_row_count > 1 ) {
			$errors[] = 'Only one reserved Name field is allowed in a form.';
		}

		if ( $first_name_mapping_count > 1 ) {
			$errors[] = 'VSCO Field Key FirstName can only be used once in a form.';
		}

		if ( $submitter_copy_row_count > 1 ) {
			$errors[] = 'Only one Email field can be selected for submitter copy delivery.';
		}

		if ( 1 === $reserved_name_row_count && 1 === $first_name_mapping_count && 1 !== $reserved_name_mapping_hits ) {
			$errors[] = 'The reserved Name field must be the same row that maps to VSCO Field Key FirstName.';
		}

		return array_values( array_unique( $errors ) );
	}
}

if ( ! function_exists( 'sz_validate_form_submitter_copy_configuration' ) ) {
	function sz_validate_form_submitter_copy_configuration( array $layout ): array {
		$offer_submitter_copy = sz_form_is_truthy_required(
			sz_form_get_validation_row_value(
				$layout,
				[ 'field_sz_form_offer_submitter_email_copy', 'offer_submitter_email_copy' ]
			)
		);

		if ( ! $offer_submitter_copy ) {
			return [];
		}

		$rows = sz_form_get_validation_row_value( $layout, [ 'field_sz_form_fields', 'fields' ] );
		if ( ! is_array( $rows ) || empty( $rows ) ) {
			return [];
		}

		$submitter_copy_row_count = 0;

		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			if ( sz_form_is_submitter_copy_enabled_for_row( $row ) ) {
				$submitter_copy_row_count++;
			}
		}

		if ( 0 === $submitter_copy_row_count ) {
			return [ 'Select one Email field to use when submitters request a copy of the form.' ];
		}

		return [];
	}
}

if ( ! function_exists( 'sz_collect_form_block_layouts' ) ) {
	function sz_collect_form_block_layouts( $value, array &$layouts ) {
		if ( ! is_array( $value ) ) {
			return;
		}

		if ( isset( $value['acf_fc_layout'] ) && 'form_block' === $value['acf_fc_layout'] ) {
			$layouts[] = $value;
		}

		foreach ( $value as $item ) {
			if ( is_array( $item ) ) {
				sz_collect_form_block_layouts( $item, $layouts );
			}
		}
	}
}

if ( ! function_exists( 'sz_validate_submitter_copy_form_blocks_on_save' ) ) {
	function sz_validate_submitter_copy_form_blocks_on_save() {
		if ( ! function_exists( 'acf_add_validation_error' ) ) {
			return;
		}

		$posted_acf = isset( $_POST['acf'] ) && is_array( $_POST['acf'] ) ? $_POST['acf'] : [];
		if ( empty( $posted_acf ) ) {
			return;
		}

		$layouts = [];
		sz_collect_form_block_layouts( $posted_acf, $layouts );

		$errors = [];
		foreach ( $layouts as $layout ) {
			$errors = array_merge( $errors, sz_validate_form_submitter_copy_configuration( $layout ) );
		}

		foreach ( array_values( array_unique( $errors ) ) as $error ) {
			acf_add_validation_error( '', $error );
		}
	}
}