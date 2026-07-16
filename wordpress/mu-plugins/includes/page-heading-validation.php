<?php

if ( ! function_exists( 'sz_heading_row_value' ) ) {
	function sz_heading_row_value( array $row, array $keys ) {
		foreach ( $keys as $key ) {
			if ( array_key_exists( $key, $row ) ) {
				return $row[ $key ];
			}
		}

		return null;
	}
}

if ( ! function_exists( 'sz_heading_layout_name' ) ) {
	function sz_heading_layout_name( array $row ): string {
		$layout = strtolower( trim( (string) sz_heading_row_value( $row, [ 'acf_fc_layout' ] ) ) );
		return preg_replace( '/^(layout_)?sz_/', '', $layout );
	}
}

if ( ! function_exists( 'sz_heading_text' ) ) {
	function sz_heading_text( $value ): string {
		return trim( strip_tags( is_scalar( $value ) ? (string) $value : '' ) );
	}
}

if ( ! function_exists( 'sz_heading_from_block' ) ) {
	function sz_heading_from_block( array $row, int $index ) {
		$layout = sz_heading_layout_name( $row );
		$text = '';
		$level = 2;
		$field = 'heading';

		switch ( $layout ) {
			case 'hero':
				$text = sz_heading_text( sz_heading_row_value( $row, [ 'field_sz_hero_title', 'title' ] ) );
				$level = 1;
				$field = 'title';
				break;
			case 'text_block':
				$text = sz_heading_text( sz_heading_row_value( $row, [ 'field_sz_text_heading', 'heading' ] ) );
				$level = (int) substr( (string) sz_heading_row_value( $row, [ 'field_sz_text_heading_level', 'heading_level' ] ), 1 );
				break;
			case 'image_text':
				$text = sz_heading_text( sz_heading_row_value( $row, [ 'field_sz_image_text_heading', 'heading' ] ) );
				$level = (int) substr( (string) sz_heading_row_value( $row, [ 'field_sz_image_text_heading_level', 'heading_level' ] ), 1 );
				break;
			case 'image_block':
				$text = sz_heading_text( sz_heading_row_value( $row, [ 'field_sz_image_block_title', 'title' ] ) );
				$level = (int) substr( (string) sz_heading_row_value( $row, [ 'field_sz_image_block_heading_tag', 'heading_tag' ] ), 1 );
				$field = 'title';
				break;
			case 'form_block':
				$text = sz_heading_text( sz_heading_row_value( $row, [ 'field_sz_form_heading', 'heading' ] ) );
				$level = (int) substr( (string) sz_heading_row_value( $row, [ 'field_sz_form_heading_tag', 'heading_tag' ] ), 1 );
				break;
			default:
				$text = sz_heading_text( sz_heading_row_value( $row, [ 'heading' ] ) );
				$level = 2;
				break;
		}

		if ( '' === $text ) {
			return null;
		}

		if ( $level < 1 || $level > 6 ) {
			$level = 2;
		}

		return [
			'block_index' => $index,
			'layout'      => $layout,
			'field'       => $field,
			'level'       => $level,
			'text'        => $text,
		];
	}
}

if ( ! function_exists( 'sz_audit_page_headings' ) ) {
	function sz_audit_page_headings( $blocks, bool $has_native_content = false ): array {
		$headings = [];
		if ( $has_native_content ) {
			$headings[] = [
				'block_index' => null,
				'layout'      => 'native_content',
				'field'       => 'post_title',
				'level'       => 1,
				'text'        => 'Page title',
			];
		}

		if ( is_array( $blocks ) ) {
			foreach ( array_values( $blocks ) as $index => $row ) {
				if ( ! is_array( $row ) ) {
					continue;
				}

				$heading = sz_heading_from_block( $row, $index );
				if ( null !== $heading ) {
					$headings[] = $heading;
				}
			}
		}

		$h1_count = count( array_filter( $headings, static function ( array $heading ): bool {
			return 1 === $heading['level'];
		} ) );
		$errors = [];
		if ( 0 === $h1_count ) {
			$errors[] = 'Add one visible H1 heading. A Hero title is the usual page H1.';
		} elseif ( $h1_count > 1 ) {
			$errors[] = 'Use exactly one H1 heading. Change the other section headings to H2 or lower.';
		}

		$warnings = [];
		$previous_level = null;
		foreach ( $headings as $heading ) {
			if ( null !== $previous_level && $heading['level'] > $previous_level + 1 ) {
				$warnings[] = sprintf(
					'Block %d (%s) skips from H%d to H%d.',
					$heading['block_index'] + 1,
					$heading['layout'],
					$previous_level,
					$heading['level']
				);
			}
			$previous_level = $heading['level'];
		}

		return [
			'headings' => $headings,
			'h1_count' => $h1_count,
			'errors'   => $errors,
			'warnings' => $warnings,
		];
	}
}
