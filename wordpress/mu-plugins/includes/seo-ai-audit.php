<?php

if ( ! function_exists( 'sz_ai_plain_text' ) ) {
	function sz_ai_plain_text( $value ): string {
		if ( is_array( $value ) ) {
			$value = implode( ' ', array_map( 'sz_ai_plain_text', $value ) );
		}

		return trim( preg_replace( '/\s+/', ' ', strip_tags( is_scalar( $value ) ? (string) $value : '' ) ) );
	}
}

if ( ! function_exists( 'sz_ai_finding' ) ) {
	function sz_ai_finding( string $id, string $category, string $status, string $summary, string $evidence, string $target ): array {
		return [
			'id'       => $id,
			'category' => $category,
			'status'   => $status,
			'summary'  => $summary,
			'evidence' => $evidence,
			'target'   => $target,
		];
	}
}

if ( ! function_exists( 'sz_ai_terms' ) ) {
	function sz_ai_terms( $rows, array $keys ): array {
		if ( ! is_array( $rows ) ) {
			return [];
		}

		$terms = [];
		foreach ( $rows as $row ) {
			if ( is_scalar( $row ) ) {
				$value = sz_ai_plain_text( $row );
				if ( '' !== $value ) {
					$terms[] = strtolower( $value );
				}
				continue;
			}

			if ( ! is_array( $row ) ) {
				continue;
			}

			foreach ( $keys as $key ) {
				$value = sz_ai_plain_text( $row[ $key ] ?? '' );
				if ( '' !== $value ) {
					$terms[] = strtolower( $value );
				}
			}
		}

		return array_values( array_unique( $terms ) );
	}
}

if ( ! function_exists( 'sz_ai_contains_term' ) ) {
	function sz_ai_contains_term( string $haystack, array $terms ): bool {
		$haystack = strtolower( $haystack );
		foreach ( $terms as $term ) {
			if ( '' !== $term && false !== strpos( $haystack, strtolower( $term ) ) ) {
				return true;
			}
		}

		return false;
	}
}

if ( ! function_exists( 'sz_ai_visible_block_copy' ) ) {
	function sz_ai_visible_block_copy( $blocks ): string {
		if ( ! is_array( $blocks ) ) {
			return '';
		}

		$copy = [];
		$copy_keys = [ 'title', 'heading', 'tagline', 'description', 'body', 'intro', 'subheading', 'caption', 'overlay_text' ];
		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}
			foreach ( $copy_keys as $key ) {
				if ( array_key_exists( $key, $block ) ) {
					$copy[] = sz_ai_plain_text( $block[ $key ] );
				}
			}
		}

		return trim( implode( ' ', array_filter( $copy ) ) );
	}
}

if ( ! function_exists( 'sz_ai_service_keys' ) ) {
	function sz_ai_service_keys( $services ): array {
		if ( ! is_array( $services ) ) {
			return [];
		}

		$keys = [];
		foreach ( $services as $service ) {
			if ( ! is_array( $service ) ) {
				continue;
			}
			$key = strtolower( trim( (string) ( $service['key'] ?? '' ) ) );
			if ( '' !== $key ) {
				$keys[] = $key;
			}
		}
		return array_values( array_unique( $keys ) );
	}
}

if ( ! function_exists( 'sz_ai_block_service_references' ) ) {
	function sz_ai_block_service_references( $blocks ): array {
		if ( ! is_array( $blocks ) ) {
			return [];
		}

		$references = [];
		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}

			$layout = strtolower( trim( (string) ( $block['acf_fc_layout'] ?? '' ) ) );
			$layout = preg_replace( '/^(layout_)?sz_/', '', $layout );
			if ( 'pricing_packages' === $layout ) {
				$reference = strtolower( trim( (string) ( $block['service_reference'] ?? '' ) ) );
				if ( '' !== $reference ) {
					$references[] = $reference;
				}
				continue;
			}

			if ( 'services_grid' !== $layout || ! is_array( $block['services'] ?? null ) ) {
				continue;
			}
			foreach ( $block['services'] as $service ) {
				if ( ! is_array( $service ) ) {
					continue;
				}
				$reference = strtolower( trim( (string) ( $service['service_reference'] ?? '' ) ) );
				if ( '' !== $reference ) {
					$references[] = $reference;
				}
			}
		}

		return array_values( array_unique( $references ) );
	}
}

if ( ! function_exists( 'sz_ai_audit_content' ) ) {
	function sz_ai_audit_content( array $page, array $site ): array {
		$blocks = is_array( $page['blocks'] ?? null ) ? $page['blocks'] : [];
		$heading_audit = function_exists( 'sz_audit_page_headings' )
			? sz_audit_page_headings( $blocks, empty( $blocks ) )
			: [ 'h1_count' => 0, 'warnings' => [] ];
		$h1_count = (int) ( $heading_audit['h1_count'] ?? 0 );
		$heading_warnings = is_array( $heading_audit['warnings'] ?? null ) ? $heading_audit['warnings'] : [];
		$visible_copy = trim( sz_ai_plain_text( $page['content'] ?? '' ) . ' ' . sz_ai_visible_block_copy( $blocks ) );
		$word_count = str_word_count( $visible_copy );
		$search_copy = trim( sz_ai_plain_text( $page['title'] ?? '' ) . ' ' . sz_ai_plain_text( $page['description'] ?? '' ) . ' ' . $visible_copy );
		$services = is_array( $site['services'] ?? null ) ? $site['services'] : [];
		$business = is_array( $site['business'] ?? null ) ? $site['business'] : [];
		$service_terms = sz_ai_terms( $services, [ 'name', 'service_type' ] );
		$area_terms = sz_ai_terms( $business['area_served'] ?? [], [ 'name' ] );
		$has_service_language = empty( $service_terms ) || sz_ai_contains_term( $search_copy, $service_terms );
		$has_area_language = empty( $area_terms ) || sz_ai_contains_term( $search_copy, $area_terms );

		return [
			sz_ai_finding( 'exactly-one-h1', 'content', 1 === $h1_count ? 'pass' : 'error', 1 === $h1_count ? 'Page has exactly one H1.' : 'Page must have exactly one H1.', sprintf( '%d visible H1 headings found.', $h1_count ), 'page_blocks' ),
			sz_ai_finding( 'heading-order', 'content', empty( $heading_warnings ) ? 'pass' : 'warning', empty( $heading_warnings ) ? 'Heading order has no detected skips.' : 'Heading levels skip part of the hierarchy.', empty( $heading_warnings ) ? 'Rendered headings progress without a detected level skip.' : implode( ' ', $heading_warnings ), 'page_blocks' ),
			sz_ai_finding( 'descriptive-copy', 'content', $word_count >= 80 ? 'pass' : 'warning', $word_count >= 80 ? 'Page includes substantial descriptive copy.' : 'Page may have too little descriptive copy.', sprintf( '%d visible descriptive words detected; the advisory threshold is 80.', $word_count ), 'page_content' ),
			sz_ai_finding( 'service-language', 'content', $has_service_language ? 'pass' : 'warning', $has_service_language ? 'Page aligns with configured service language.' : 'Page does not mention a configured service.', empty( $service_terms ) ? 'No service vocabulary is configured yet.' : 'Compared against public service names and types in Site Settings.', 'page_content' ),
			sz_ai_finding( 'locality-language', 'content', $has_area_language ? 'pass' : 'warning', $has_area_language ? 'Page aligns with configured service-area language.' : 'Page does not mention a configured service area.', empty( $area_terms ) ? 'No service-area vocabulary is configured yet.' : 'Compared against public service areas; natural language is sufficient.', 'page_content' ),
		];
	}
}

if ( ! function_exists( 'sz_ai_length_summary' ) ) {
	function sz_ai_length_summary( int $length, int $maximum, string $label ): string {
		if ( 0 === $length ) {
			return $label . ' is missing.';
		}
		if ( $length > $maximum ) {
			return $label . ' may be truncated.';
		}
		return $label . ' is present.';
	}
}

if ( ! function_exists( 'sz_ai_audit_search_social' ) ) {
	function sz_ai_audit_search_social( array $page ): array {
		$title = sz_ai_plain_text( $page['title'] ?? '' );
		$description = sz_ai_plain_text( $page['description'] ?? '' );
		$title_length = strlen( $title );
		$description_length = strlen( $description );
		$image = is_array( $page['featured_image'] ?? null ) ? $page['featured_image'] : [];
		$has_image = ! empty( $image['url'] ) || ! empty( $image['id'] );
		$findings = [
			sz_ai_finding( 'search-title', 'search_social', $title_length > 0 && $title_length <= 60 ? 'pass' : 'warning', sz_ai_length_summary( $title_length, 60, 'Search title' ), sprintf( '%d characters; the advisory maximum is 60.', $title_length ), 'search_preview' ),
			sz_ai_finding( 'meta-description', 'search_social', $description_length > 0 && $description_length <= 160 ? 'pass' : 'warning', sz_ai_length_summary( $description_length, 160, 'Page description' ), sprintf( '%d characters; the advisory maximum is 160.', $description_length ), 'search_preview' ),
			sz_ai_finding( 'featured-image', 'search_social', $has_image ? 'pass' : 'warning', $has_image ? 'Featured image is available for sharing.' : 'Featured image is missing.', $has_image ? 'A selected image can supply page and social image metadata.' : 'No featured attachment is selected.', 'featured_image' ),
		];

		if ( ! $has_image ) {
			return $findings;
		}

		$alt = sz_ai_plain_text( $image['alt'] ?? '' );
		$width = (int) ( $image['width'] ?? 0 );
		$height = (int) ( $image['height'] ?? 0 );
		$large_enough = $width >= 1200 && $height >= 630;
		$findings[] = sz_ai_finding( 'image-alt', 'search_social', '' !== $alt ? 'pass' : 'warning', '' !== $alt ? 'Featured image has alternative text.' : 'Featured image alternative text is missing.', '' !== $alt ? $alt : 'No attachment alt text found.', 'featured_image' );
		$findings[] = sz_ai_finding( 'image-dimensions', 'search_social', $large_enough ? 'pass' : 'warning', $large_enough ? 'Featured image is large enough for common social cards.' : 'Featured image may be too small for large social cards.', sprintf( '%d x %d pixels; 1200 x 630 is the advisory target.', $width, $height ), 'featured_image' );
		return $findings;
	}
}

if ( ! function_exists( 'sz_ai_audit_entities' ) ) {
	function sz_ai_audit_entities( array $page, array $site ): array {
		$business = is_array( $site['business'] ?? null ) ? $site['business'] : [];
		$services = is_array( $site['services'] ?? null ) ? $site['services'] : [];
		$address = is_array( $business['address'] ?? null ) ? array_filter( $business['address'] ) : [];
		$business_complete = '' !== sz_ai_plain_text( $site['site_name'] ?? '' ) && ! empty( $address );
		$findings = [
			sz_ai_finding( 'business-identity', 'entities', $business_complete ? 'pass' : 'warning', $business_complete ? 'Business identity has a name and public address.' : 'Business entity is missing a name or public address.', empty( $address ) ? 'No public PostalAddress fields are configured.' : 'Public business address fields are configured.', 'site_settings' ),
			sz_ai_finding( 'service-catalog', 'entities', ! empty( $services ) ? 'pass' : 'warning', ! empty( $services ) ? 'Global service catalog is configured.' : 'Global service catalog is empty.', sprintf( '%d configured services found.', count( $services ) ), 'site_settings' ),
		];

		$photographer = is_array( $site['primary_photographer'] ?? null ) ? $site['primary_photographer'] : [];
		if ( ! empty( $photographer['enabled'] ) ) {
			$person_complete = '' !== sz_ai_plain_text( $photographer['name'] ?? '' ) && '' !== sz_ai_plain_text( $photographer['job_title'] ?? '' );
			$findings[] = sz_ai_finding( 'primary-photographer', 'entities', $person_complete ? 'pass' : 'warning', $person_complete ? 'Primary photographer Person entity has core identity fields.' : 'Enabled primary photographer is missing a name or job title.', $person_complete ? 'The Person entity is linked to the business.' : 'Complete the enabled Person entity before using it as a creator.', 'site_settings' );
		}

		if ( ! empty( $page['is_venue_page'] ) ) {
			$venue = is_array( $page['venue'] ?? null ) ? $page['venue'] : [];
			$venue_name = sz_ai_plain_text( $venue['name'] ?? '' );
			$venue_address = is_array( $venue['address'] ?? null ) ? array_filter( $venue['address'] ) : [];
			$venue_complete = '' !== $venue_name && ! empty( $venue_address );
			$findings[] = sz_ai_finding( 'venue-entity', 'entities', $venue_complete ? 'pass' : 'warning', $venue_complete ? 'Venue Place has a name and address.' : 'Venue page is missing Place details.', $venue_complete ? $venue_name : 'A venue name and public address are needed for a useful Place entity.', 'page_settings' );
		}

		return $findings;
	}
}

if ( ! function_exists( 'sz_ai_audit_schema_consistency' ) ) {
	function sz_ai_audit_schema_consistency( array $page, array $site ): array {
		$findings = [];
		$services = is_array( $site['services'] ?? null ) ? $site['services'] : [];
		$service_keys = sz_ai_service_keys( $services );
		$service_reference = strtolower( trim( (string) ( $page['service_reference'] ?? '' ) ) );
		if ( '' !== $service_reference ) {
			$resolves = in_array( $service_reference, $service_keys, true );
			$findings[] = sz_ai_finding( 'service-reference', 'schema_consistency', $resolves ? 'pass' : 'warning', $resolves ? 'Page service reference resolves to the global catalog.' : 'Page service reference does not resolve.', $service_reference, $resolves ? 'page_settings' : 'site_settings' );
		}

		$blocks = is_array( $page['blocks'] ?? null ) ? $page['blocks'] : [];
		$block_references = sz_ai_block_service_references( $blocks );
		if ( ! empty( $block_references ) ) {
			$unresolved_references = array_values( array_diff( $block_references, $service_keys ) );
			$references_resolve = empty( $unresolved_references );
			$findings[] = sz_ai_finding(
				'block-service-references',
				'schema_consistency',
				$references_resolve ? 'pass' : 'warning',
				$references_resolve ? 'Block service references resolve to the global catalog.' : 'Some block service references do not resolve.',
				$references_resolve ? implode( ', ', $block_references ) : 'Unresolved: ' . implode( ', ', $unresolved_references ),
				'page_blocks'
			);
		}
		$faq_rows = [];
		foreach ( $blocks as $block ) {
			if ( is_array( $block ) && 'faq_accordion' === ( $block['acf_fc_layout'] ?? '' ) ) {
				$rows = is_array( $block['faq_items'] ?? null ) ? $block['faq_items'] : [];
				$faq_rows = array_merge( $faq_rows, $rows );
			}
		}
		if ( ! empty( $faq_rows ) ) {
			$complete = array_filter( $faq_rows, static function ( $row ): bool {
				return is_array( $row ) && '' !== sz_ai_plain_text( $row['question'] ?? '' ) && '' !== sz_ai_plain_text( $row['answer'] ?? '' );
			} );
			$consistent = count( $complete ) === count( $faq_rows );
			$findings[] = sz_ai_finding( 'faq-consistency', 'schema_consistency', $consistent ? 'pass' : 'warning', $consistent ? 'Visible FAQ rows are complete.' : 'Some FAQ rows cannot produce consistent schema.', sprintf( '%d of %d FAQ rows have a visible question and answer.', count( $complete ), count( $faq_rows ) ), 'page_blocks' );
		}

		$findings[] = sz_ai_finding( 'frontend-schema-invariants', 'schema_consistency', 'pass', 'Canonical URL, breadcrumb IDs and JSON serialization are verified by frontend tests.', 'These are code invariants rather than editable per-page inputs.', 'automated_tests' );
		$findings[] = sz_ai_finding( 'review-exclusion', 'schema_consistency', 'pass', 'Self-serving Review and AggregateRating schema are excluded.', 'The graph intentionally emits no self-serving rating markup.', 'automated_tests' );
		return $findings;
	}
}

if ( ! function_exists( 'sz_audit_page_ai_searchability' ) ) {
	function sz_audit_page_ai_searchability( array $page, array $site ): array {
		$findings = array_merge(
			sz_ai_audit_content( $page, $site ),
			sz_ai_audit_search_social( $page ),
			sz_ai_audit_entities( $page, $site ),
			sz_ai_audit_schema_consistency( $page, $site )
		);
		$counts = [ 'pass' => 0, 'warning' => 0, 'error' => 0 ];
		foreach ( $findings as $finding ) {
			$status = $finding['status'] ?? '';
			if ( isset( $counts[ $status ] ) ) {
				$counts[ $status ]++;
			}
		}
		return [ 'findings' => $findings, 'counts' => $counts ];
	}
}
