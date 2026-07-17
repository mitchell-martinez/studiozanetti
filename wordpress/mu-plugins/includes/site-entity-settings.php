<?php

if ( ! function_exists( 'sz_entity_text' ) ) {
	function sz_entity_text( $value ): string {
		$value = is_scalar( $value ) ? (string) $value : '';
		return function_exists( 'sanitize_text_field' )
			? sanitize_text_field( $value )
			: trim( strip_tags( $value ) );
	}
}

if ( ! function_exists( 'sz_entity_textarea' ) ) {
	function sz_entity_textarea( $value ): string {
		$value = is_scalar( $value ) ? (string) $value : '';
		return function_exists( 'sanitize_textarea_field' )
			? sanitize_textarea_field( $value )
			: trim( strip_tags( $value ) );
	}
}

if ( ! function_exists( 'sz_entity_url' ) ) {
	function sz_entity_url( $value ): string {
		$value = sz_entity_text( $value );
		if ( '' === $value ) {
			return '';
		}

		if ( function_exists( 'esc_url_raw' ) ) {
			return (string) esc_url_raw( $value );
		}

		$scheme = strtolower( (string) parse_url( $value, PHP_URL_SCHEME ) );
		return in_array( $scheme, [ 'http', 'https' ], true ) && filter_var( $value, FILTER_VALIDATE_URL )
			? $value
			: '';
	}
}

if ( ! function_exists( 'sz_entity_email' ) ) {
	function sz_entity_email( $value ): string {
		$value = sz_entity_text( $value );
		if ( function_exists( 'sanitize_email' ) ) {
			return (string) sanitize_email( $value );
		}

		return filter_var( $value, FILTER_VALIDATE_EMAIL ) ? $value : '';
	}
}

if ( ! function_exists( 'sz_entity_number' ) ) {
	function sz_entity_number( $value ) {
		return is_numeric( $value ) ? (float) $value : null;
	}
}

if ( ! function_exists( 'sz_entity_truthy' ) ) {
	function sz_entity_truthy( $value ): bool {
		if ( is_bool( $value ) ) {
			return $value;
		}

		return in_array( strtolower( trim( (string) $value ) ), [ '1', 'true', 'yes', 'on' ], true );
	}
}

if ( ! function_exists( 'sz_entity_string_list' ) ) {
	function sz_entity_string_list( $rows, array $keys ): array {
		if ( ! is_array( $rows ) ) {
			return [];
		}

		$values = [];
		foreach ( $rows as $row ) {
			$value = '';
			if ( is_scalar( $row ) ) {
				$value = sz_entity_text( $row );
			} elseif ( is_array( $row ) ) {
				foreach ( $keys as $key ) {
					if ( array_key_exists( $key, $row ) ) {
						$value = sz_entity_text( $row[ $key ] );
						break;
					}
				}
			}

			if ( '' !== $value && ! in_array( $value, $values, true ) ) {
				$values[] = $value;
			}
		}

		return $values;
	}
}

if ( ! function_exists( 'sz_entity_url_list' ) ) {
	function sz_entity_url_list( $rows ): array {
		if ( ! is_array( $rows ) ) {
			return [];
		}

		$values = [];
		foreach ( $rows as $row ) {
			$raw = is_array( $row ) ? ( $row['url'] ?? $row['value'] ?? '' ) : $row;
			$url = sz_entity_url( $raw );
			if ( '' !== $url && ! in_array( $url, $values, true ) ) {
				$values[] = $url;
			}
		}

		return $values;
	}
}

if ( ! function_exists( 'sz_entity_address' ) ) {
	function sz_entity_address( $raw ): array {
		$raw = is_array( $raw ) ? $raw : [];
		return array_filter( [
			'street_address'   => sz_entity_text( $raw['street_address'] ?? '' ),
			'address_locality' => sz_entity_text( $raw['address_locality'] ?? '' ),
			'address_region'   => sz_entity_text( $raw['address_region'] ?? '' ),
			'postal_code'      => sz_entity_text( $raw['postal_code'] ?? '' ),
			'address_country'  => sz_entity_text( $raw['address_country'] ?? '' ),
		], static function ( $value ) {
			return '' !== $value;
		} );
	}
}

if ( ! function_exists( 'sz_entity_geo' ) ) {
	function sz_entity_geo( $raw ): array {
		$raw = is_array( $raw ) ? $raw : [];
		$latitude = sz_entity_number( $raw['latitude'] ?? null );
		$longitude = sz_entity_number( $raw['longitude'] ?? null );

		return null !== $latitude && null !== $longitude
			? [ 'latitude' => $latitude, 'longitude' => $longitude ]
			: [];
	}
}

if ( ! function_exists( 'sz_entity_image' ) ) {
	function sz_entity_image( $value, $image_resolver = null ) {
		if ( is_callable( $image_resolver ) ) {
			return call_user_func( $image_resolver, $value );
		}

		if ( is_array( $value ) && ! empty( $value['url'] ) ) {
			return array_filter( [
				'url'                  => sz_entity_url( $value['url'] ),
				'alt'                  => sz_entity_text( $value['alt'] ?? '' ),
				'width'                => sz_entity_number( $value['width'] ?? null ),
				'height'               => sz_entity_number( $value['height'] ?? null ),
				'caption'              => sz_entity_text( $value['caption'] ?? '' ),
				'license'              => sz_entity_url( $value['license'] ?? '' ),
				'acquire_license_page' => sz_entity_url( $value['acquire_license_page'] ?? '' ),
				'credit_text'          => sz_entity_text( $value['credit_text'] ?? '' ),
				'copyright_notice'     => sz_entity_text( $value['copyright_notice'] ?? '' ),
			], static function ( $item ) {
				return null !== $item && '' !== $item;
			} );
		}

		return null;
	}
}

if ( ! function_exists( 'sz_sanitize_site_entity_settings' ) ) {
	function sz_sanitize_site_entity_settings( array $raw, $image_resolver = null ): array {
		$business_raw = is_array( $raw['business'] ?? null ) ? $raw['business'] : [];
		$photographer_raw = is_array( $raw['primary_photographer'] ?? null ) ? $raw['primary_photographer'] : [];
		$services_raw = is_array( $raw['services'] ?? null ) ? $raw['services'] : [];

		$business = array_filter( [
			'description'                => sz_entity_textarea( $business_raw['description'] ?? '' ),
			'email'                      => sz_entity_email( $business_raw['email'] ?? '' ),
			'telephone'                  => sz_entity_text( $business_raw['telephone'] ?? '' ),
			'image_license'              => sz_entity_url( $business_raw['image_license'] ?? '' ),
			'image_acquire_license_page' => sz_entity_url( $business_raw['image_acquire_license_page'] ?? '' ),
			'image_credit_text'          => sz_entity_text( $business_raw['image_credit_text'] ?? '' ),
			'image_copyright_notice'     => sz_entity_text( $business_raw['image_copyright_notice'] ?? '' ),
			'address'                    => sz_entity_address( $business_raw['address'] ?? [] ),
			'geo'                        => sz_entity_geo( $business_raw['geo'] ?? [] ),
			'area_served'                => sz_entity_string_list( $business_raw['area_served'] ?? [], [ 'name', 'value' ] ),
			'logo'                       => sz_entity_image( $business_raw['logo'] ?? null, $image_resolver ),
			'image'                      => sz_entity_image( $business_raw['image'] ?? null, $image_resolver ),
			'price_range'                => sz_entity_text( $business_raw['price_range'] ?? '' ),
			'founding_date'              => sz_entity_text( $business_raw['founding_date'] ?? '' ),
			'awards'                     => sz_entity_string_list( $business_raw['awards'] ?? [], [ 'award', 'name', 'value' ] ),
			'same_as'                    => sz_entity_url_list( $business_raw['same_as'] ?? [] ),
		], static function ( $value ) {
			return null !== $value && '' !== $value && [] !== $value;
		} );

		$photographer = array_filter( [
			'enabled'               => sz_entity_truthy( $photographer_raw['enabled'] ?? false ),
			'name'                  => sz_entity_text( $photographer_raw['name'] ?? '' ),
			'business_relationship' => in_array( $photographer_raw['business_relationship'] ?? '', [ 'founder', 'employee' ], true ) ? $photographer_raw['business_relationship'] : '',
			'job_title'             => sz_entity_text( $photographer_raw['job_title'] ?? '' ),
			'description'           => sz_entity_textarea( $photographer_raw['description'] ?? '' ),
			'url'                   => sz_entity_url( $photographer_raw['url'] ?? '' ),
			'image'                 => sz_entity_image( $photographer_raw['image'] ?? null, $image_resolver ),
			'same_as'               => sz_entity_url_list( $photographer_raw['same_as'] ?? [] ),
			'knows_about'           => sz_entity_string_list( $photographer_raw['knows_about'] ?? [], [ 'topic', 'name', 'value' ] ),
			'awards'                => sz_entity_string_list( $photographer_raw['awards'] ?? [], [ 'award', 'name', 'value' ] ),
		], static function ( $value, $key ) {
			return 'enabled' === $key || ( null !== $value && '' !== $value && [] !== $value );
		}, ARRAY_FILTER_USE_BOTH );

		$services = [];
		$seen_keys = [];
		foreach ( $services_raw as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			$key = preg_replace( '/[^a-z0-9-]+/', '-', strtolower( sz_entity_text( $row['key'] ?? '' ) ) );
			$key = trim( $key, '-' );
			$name = sz_entity_text( $row['name'] ?? '' );
			if ( '' === $key || '' === $name || isset( $seen_keys[ $key ] ) ) {
				continue;
			}
			$seen_keys[ $key ] = true;

			$services[] = array_filter( [
				'key'           => $key,
				'name'          => $name,
				'service_type'  => sz_entity_text( $row['service_type'] ?? '' ),
				'description'   => sz_entity_textarea( $row['description'] ?? '' ),
				'url'           => sz_entity_url( $row['url'] ?? '' ),
				'image'         => sz_entity_image( $row['image'] ?? null, $image_resolver ),
				'area_served'   => sz_entity_string_list( $row['area_served'] ?? [], [ 'name', 'value' ] ),
			], static function ( $value ) {
				return null !== $value && '' !== $value && [] !== $value;
			} );
		}

		return [
			'business'            => $business,
			'primary_photographer' => $photographer,
			'services'            => $services,
		];
	}
}
