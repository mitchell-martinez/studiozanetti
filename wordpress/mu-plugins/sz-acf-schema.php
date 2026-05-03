<?php
/**
 * Plugin Name: Studio Zanetti — ACF Schema
 * Description: Registers all ACF field groups for headless flexible content via code.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$sz_form_validation_include = __DIR__ . '/includes/form-block-validation.php';
if ( file_exists( $sz_form_validation_include ) ) {
	require_once $sz_form_validation_include;
}

if ( ! function_exists( 'sz_validate_form_field_rows' ) ) {
	function sz_validate_form_field_rows( $value ): array {
		if ( ! is_array( $value ) || empty( $value ) ) {
			return [ 'Add at least one row with Field ID "name" and enable Required on it.' ];
		}

		$matched_row_count  = 0;
		$required_row_count = 0;

		foreach ( $value as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			$field_id = strtolower( trim( (string) ( $row['field_sz_form_field_id'] ?? $row['field_id'] ?? '' ) ) );
			$vsco_key = strtolower( trim( (string) ( $row['field_sz_form_field_vsco_field_key'] ?? $row['vsco_field_key'] ?? '' ) ) );

			if ( 'name' !== $field_id && 'firstname' !== $vsco_key ) {
				continue;
			}

			$matched_row_count++;
			$required_value = $row['field_sz_form_field_required'] ?? $row['required'] ?? 0;
			$normalized_required = strtolower( trim( (string) $required_value ) );
			if (
				true === $required_value ||
				1 === (int) $required_value ||
				in_array( $normalized_required, [ '1', 'true', 'on', 'yes' ], true )
			) {
				$required_row_count++;
			}
		}

		if ( 0 === $matched_row_count ) {
			return [ 'Add at least one row with Field ID "name" and enable Required on it.' ];
		}

		if ( $required_row_count !== $matched_row_count ) {
			return [ 'Any row with Field ID "name" or VSCO Field Key "FirstName" must have Required enabled.' ];
		}

		return [];
	}
}

add_action( 'acf/input/admin_enqueue_scripts', 'sz_enqueue_form_block_admin_assets' );
function sz_enqueue_form_block_admin_assets() {
	if ( ! function_exists( 'wp_enqueue_script' ) ) {
		return;
	}

	if ( function_exists( 'get_current_screen' ) ) {
		$screen = get_current_screen();
		if ( ! $screen || 'post' !== $screen->base || 'page' !== $screen->post_type ) {
			return;
		}
	}

	$script_path = __DIR__ . '/assets/form-block-admin.js';
	if ( ! file_exists( $script_path ) ) {
		return;
	}

	$script_url = defined( 'WPMU_PLUGIN_URL' )
		? WPMU_PLUGIN_URL . '/assets/form-block-admin.js'
		: content_url( 'mu-plugins/assets/form-block-admin.js' );

	wp_enqueue_script(
		'sz-form-block-admin',
		$script_url,
		[ 'jquery', 'acf-input' ],
		(string) filemtime( $script_path ),
		true
	);
}

add_action( 'acf/init', function () {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	$theme_choices = [
		'light'     => 'Light',
		'rose'      => 'Rose',
		'champagne' => 'Champagne',
		'dark'      => 'Dark',
		'corporate' => 'Corporate',
	];

	$spacing_choices = [
		'none' => 'None',
		'sm'   => 'Small',
		'md'   => 'Medium',
		'lg'   => 'Large',
	];

	$vsco_job_type_choices = [
		'Bridal'            => 'Bridal',
		'Christening'       => 'Christening',
		'Couple'            => 'Couple',
		'Engagement'        => 'Engagement',
		'Engagement Party'  => 'Engagement Party',
		'Event'             => 'Event',
		'Family'            => 'Family',
		'Headshots'         => 'Headshots',
		'Holiday'           => 'Holiday',
		'Portraits'         => 'Portraits',
		'Studio'            => 'Studio',
		'Trash The Dress'   => 'Trash The Dress',
		'Wedding'           => 'Wedding',
	];

	$style_fields = function ( string $prefix ) use ( $theme_choices, $spacing_choices ): array {
		return [
			[
				'key'     => "field_{$prefix}_section_theme",
				'label'   => 'Section Theme',
				'name'    => 'section_theme',
				'type'    => 'select',
				'choices' => $theme_choices,
			],
			[
				'key'     => "field_{$prefix}_top_spacing",
				'label'   => 'Top Spacing',
				'name'    => 'top_spacing',
				'type'    => 'select',
				'choices' => $spacing_choices,
			],
			[
				'key'     => "field_{$prefix}_bottom_spacing",
				'label'   => 'Bottom Spacing',
				'name'    => 'bottom_spacing',
				'type'    => 'select',
				'choices' => $spacing_choices,
			],
			[
				'key'     => "field_{$prefix}_max_width",
				'label'   => 'Block Max Width',
				'name'    => 'max_width',
				'type'    => 'select',
				'choices' => [ '' => 'Default', 'narrow' => 'Narrow (680px)', 'normal' => 'Normal (1200px)', 'wide' => 'Wide (1440px)' ],
				'instructions' => 'Constrain the overall block width. Use "Custom" below for a specific pixel value.',
			],
			[
				'key'     => "field_{$prefix}_max_width_px",
				'label'   => 'Block Max Width (Custom px)',
				'name'    => 'max_width_px',
				'type'    => 'number',
				'min'     => 0,
				'instructions' => 'Optional. Overrides the preset max width above with a specific pixel value.',
			],
			[
				'key'     => "field_{$prefix}_background_image",
				'label'   => 'Background Image',
				'name'    => 'background_image',
				'type'    => 'image',
				'return_format' => 'array',
				'instructions' => 'Optional background image for the section.',
			],
			[
				'key'     => "field_{$prefix}_background_image_opacity",
				'label'   => 'Background Image Opacity',
				'name'    => 'background_image_opacity',
				'type'    => 'number',
				'min'     => 0,
				'max'     => 1,
				'step'    => 0.05,
				'default_value' => 0.15,
				'instructions' => 'Opacity of the background image (0 = fully dimmed, 1 = fully visible). Default: 0.15.',
				'conditional_logic' => [
					[
						[
							'field' => "field_{$prefix}_background_image",
							'operator' => '!=empty',
						],
					],
				],
			],
		];
	};

	$hero_fields = [
		[ 'key' => 'field_sz_hero_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text', 'required' => 1 ],
		[ 'key' => 'field_sz_hero_tagline', 'label' => 'Tagline', 'name' => 'tagline', 'type' => 'text' ],
		[ 'key' => 'field_sz_hero_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea', 'instructions' => 'Optional description displayed at the bottom of the hero.' ],
		[ 'key' => 'field_sz_hero_caption', 'label' => 'Caption', 'name' => 'caption', 'type' => 'text', 'instructions' => 'Optional caption displayed at the very bottom of the hero, below the description.' ],
		[ 'key' => 'field_sz_hero_use_featured_image', 'label' => 'Use Featured Image', 'name' => 'use_featured_image', 'type' => 'true_false', 'ui' => 1 ],
		[ 'key' => 'field_sz_hero_background_image', 'label' => 'Background Image', 'name' => 'background_image', 'type' => 'image', 'return_format' => 'array' ],
		[
			'key' => 'field_sz_hero_slides',
			'label' => 'Slides',
			'name' => 'slides',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Slide',
			'sub_fields' => [
				[ 'key' => 'field_sz_hero_slide_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array' ],
				[ 'key' => 'field_sz_hero_slide_tagline', 'label' => 'Slide Tagline', 'name' => 'tagline', 'type' => 'text', 'instructions' => 'Optional tagline for this slide, displayed at the bottom of the hero.' ],
				[ 'key' => 'field_sz_hero_slide_subtitle', 'label' => 'Slide Subtitle', 'name' => 'subtitle', 'type' => 'text', 'instructions' => 'Optional smaller subtitle for this slide, displayed below the tagline.' ],
			],
		],
		[ 'key' => 'field_sz_hero_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text' ],
		[ 'key' => 'field_sz_hero_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url' ],
		[ 'key' => 'field_sz_hero_secondary_cta_text', 'label' => 'Secondary CTA Text', 'name' => 'secondary_cta_text', 'type' => 'text' ],
		[ 'key' => 'field_sz_hero_secondary_cta_url', 'label' => 'Secondary CTA URL', 'name' => 'secondary_cta_url', 'type' => 'url' ],
		[ 'key' => 'field_sz_hero_content_align', 'label' => 'Content Align', 'name' => 'content_align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Center' ] ],
		[ 'key' => 'field_sz_hero_height', 'label' => 'Height', 'name' => 'height', 'type' => 'select', 'choices' => [ 'md' => 'Medium', 'lg' => 'Large', 'full' => 'Full Screen' ] ],
		[ 'key' => 'field_sz_hero_overlay_strength', 'label' => 'Overlay Strength', 'name' => 'overlay_strength', 'type' => 'select', 'choices' => [ 'light' => 'Light', 'medium' => 'Medium', 'strong' => 'Strong' ] ],
		[ 'key' => 'field_sz_hero_auto_rotate_seconds', 'label' => 'Auto Rotate Seconds', 'name' => 'auto_rotate_seconds', 'type' => 'number', 'min' => 2 ],
		[ 'key' => 'field_sz_hero_show_slide_dots', 'label' => 'Show Slide Dots', 'name' => 'show_slide_dots', 'type' => 'true_false', 'ui' => 1, 'default_value' => 1 ],
		[ 'key' => 'field_sz_hero_scroll_hint_text', 'label' => 'Scroll Hint Text', 'name' => 'scroll_hint_text', 'type' => 'text' ],
	];

	$text_fields = array_merge([
		[ 'key' => 'field_sz_text_eyebrow', 'label' => 'Eyebrow', 'name' => 'eyebrow', 'type' => 'text' ],
		[ 'key' => 'field_sz_text_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_text_body', 'label' => 'Body', 'name' => 'body', 'type' => 'wysiwyg', 'tabs' => 'all', 'toolbar' => 'full', 'media_upload' => 1 ],
		[ 'key' => 'field_sz_text_align', 'label' => 'Text Align', 'name' => 'align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right', 'justify' => 'Justified' ], 'default_value' => 'center', 'instructions' => 'Alignment of text content within the block.' ],
		[ 'key' => 'field_sz_text_block_align', 'label' => 'Block Align', 'name' => 'block_align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right' ], 'default_value' => 'center', 'instructions' => 'Horizontal position of the entire block on the page.' ],
		[ 'key' => 'field_sz_text_max_width', 'label' => 'Max Width', 'name' => 'max_width', 'type' => 'select', 'choices' => [ 'narrow' => 'Narrow', 'normal' => 'Normal', 'wide' => 'Wide' ] ],
		[ 'key' => 'field_sz_text_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text' ],
		[ 'key' => 'field_sz_text_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url' ],
		[ 'key' => 'field_sz_text_font_size', 'label' => 'Body Font Size', 'name' => 'font_size', 'type' => 'select', 'choices' => [ 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large' ], 'default_value' => 'sm', 'instructions' => 'Controls the font size of the rich-text body content.' ],
	], $style_fields( 'sz_text' ));

	$image_text_fields = array_merge([
		[ 'key' => 'field_sz_image_text_eyebrow', 'label' => 'Eyebrow', 'name' => 'eyebrow', 'type' => 'text' ],
		[ 'key' => 'field_sz_image_text_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_image_text_body', 'label' => 'Body', 'name' => 'body', 'type' => 'wysiwyg', 'tabs' => 'all', 'toolbar' => 'full', 'media_upload' => 1 ],
		[ 'key' => 'field_sz_image_text_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array', 'required' => 1 ],
		[ 'key' => 'field_sz_image_text_image_mobile', 'label' => 'Image (Mobile)', 'name' => 'image_mobile', 'type' => 'image', 'return_format' => 'array' ],
		[ 'key' => 'field_sz_image_text_image_position', 'label' => 'Image Position', 'name' => 'image_position', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'right' => 'Right' ] ],
		[ 'key' => 'field_sz_image_text_image_ratio', 'label' => 'Image Ratio', 'name' => 'image_ratio', 'type' => 'select', 'choices' => [ 'landscape' => 'Landscape', 'portrait' => 'Portrait', 'square' => 'Square', 'auto' => 'Auto (natural)' ] ],
		[ 'key' => 'field_sz_image_text_image_style', 'label' => 'Image Style', 'name' => 'image_style', 'type' => 'select', 'choices' => [ 'soft' => 'Soft', 'framed' => 'Framed', 'plain' => 'Plain' ] ],
		[ 'key' => 'field_sz_image_text_image_alignment', 'label' => 'Image Alignment', 'name' => 'image_alignment', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right' ], 'default_value' => 'left', 'instructions' => 'Controls how the image is horizontally aligned within its frame. Most visible when the image is cropped to a ratio.' ],
		[ 'key' => 'field_sz_image_text_image_vertical_align', 'label' => 'Image Vertical Alignment', 'name' => 'image_vertical_align', 'type' => 'select', 'choices' => [ 'top' => 'Top', 'middle' => 'Middle', 'bottom' => 'Bottom' ], 'default_value' => 'top', 'instructions' => 'Controls the vertical crop position of the image within its frame. Most visible when the image is cropped to a ratio.' ],
		[ 'key' => 'field_sz_image_text_image_max_width', 'label' => 'Image Max Width (px)', 'name' => 'image_max_width', 'type' => 'number', 'instructions' => 'Optional. Caps the image width in pixels. Height scales proportionally.', 'min' => 0 ],
		[ 'key' => 'field_sz_image_text_image_max_height', 'label' => 'Image Max Height (px)', 'name' => 'image_max_height', 'type' => 'number', 'instructions' => 'Optional. Caps the image height in pixels. Width scales proportionally.', 'min' => 0 ],
		[ 'key' => 'field_sz_image_text_text_vertical_align', 'label' => 'Text Vertical Alignment', 'name' => 'text_vertical_align', 'type' => 'select', 'choices' => [ 'top' => 'Top', 'middle' => 'Middle', 'bottom' => 'Bottom' ], 'default_value' => 'top', 'instructions' => 'Controls the vertical alignment of the text column relative to the image.' ],
		[ 'key' => 'field_sz_image_text_text_horizontal_align', 'label' => 'Text Horizontal Alignment', 'name' => 'text_horizontal_align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right' ], 'default_value' => 'left', 'instructions' => 'Controls the horizontal alignment of the text content.' ],
		[ 'key' => 'field_sz_image_text_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text' ],
		[ 'key' => 'field_sz_image_text_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url' ],
		[ 'key' => 'field_sz_image_text_image_caption', 'label' => 'Image Caption', 'name' => 'image_caption', 'type' => 'text', 'instructions' => 'Optional short caption displayed centred below the image.' ],
		[ 'key' => 'field_sz_image_text_font_size', 'label' => 'Body Font Size', 'name' => 'font_size', 'type' => 'select', 'choices' => [ 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large' ], 'default_value' => 'sm', 'instructions' => 'Controls the font size of the rich-text body content.' ],
		[ 'key' => 'field_sz_image_text_url', 'label' => 'Clickable URL', 'name' => 'url', 'type' => 'url', 'instructions' => 'Optional. When provided, the entire Image + Text block becomes a clickable link to this URL. The visual design remains unchanged.' ],
	], $style_fields( 'sz_image_text' ));

	$services_fields = array_merge([
		[ 'key' => 'field_sz_services_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_services_subheading', 'label' => 'Subheading', 'name' => 'subheading', 'type' => 'text' ],
		[ 'key' => 'field_sz_services_max_columns', 'label' => 'Maximum Columns', 'name' => 'max_columns', 'type' => 'select', 'choices' => [ '' => 'Default (3)', 1 => '1', 2 => '2', 3 => '3', 4 => '4' ], 'instructions' => 'Maximum number of columns in the grid. The grid will responsively reduce columns on smaller screens.' ],
		[ 'key' => 'field_sz_services_card_style', 'label' => 'Card Style', 'name' => 'card_style', 'type' => 'select', 'choices' => [ 'elevated' => 'Elevated', 'outline' => 'Outline', 'minimal' => 'Minimal' ] ],
		[ 'key' => 'field_sz_services_text_align', 'label' => 'Text Align', 'name' => 'text_align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right' ], 'default_value' => 'left', 'instructions' => 'Horizontal text alignment inside each service card.' ],
		[
			'key' => 'field_sz_services_items',
			'label' => 'Services',
			'name' => 'services',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Service',
			'sub_fields' => [
				[ 'key' => 'field_sz_services_item_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text', 'required' => 1 ],
				[ 'key' => 'field_sz_services_item_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea', 'required' => 1 ],
				[ 'key' => 'field_sz_services_item_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array' ],
				[ 'key' => 'field_sz_services_item_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url', 'instructions' => 'Optional. When provided the entire card becomes a clickable link to this URL.' ],
			],
		],
		[ 'key' => 'field_sz_services_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text' ],
		[ 'key' => 'field_sz_services_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url' ],
		[ 'key' => 'field_sz_services_font_size', 'label' => 'Font Size', 'name' => 'font_size', 'type' => 'select', 'choices' => [ 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large' ], 'default_value' => 'sm', 'instructions' => 'Controls the font size of the service card title and description text.' ],
	], $style_fields( 'sz_services' ));

	$pillar_fields = array_merge([
		[ 'key' => 'field_sz_pillars_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_pillars_subheading', 'label' => 'Subheading', 'name' => 'subheading', 'type' => 'text' ],
		[ 'key' => 'field_sz_pillars_columns', 'label' => 'Columns', 'name' => 'columns', 'type' => 'select', 'choices' => [ 2 => '2', 3 => '3', 4 => '4' ] ],
		[
			'key' => 'field_sz_pillars_items',
			'label' => 'Pillars',
			'name' => 'pillars',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Pillar',
			'sub_fields' => [
				[ 'key' => 'field_sz_pillar_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text', 'required' => 1 ],
				[ 'key' => 'field_sz_pillar_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea', 'required' => 1 ],
			],
		],
	], $style_fields( 'sz_pillars' ));

	$faq_fields = array_merge([
		[ 'key' => 'field_sz_faq_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_faq_intro', 'label' => 'Intro', 'name' => 'intro', 'type' => 'textarea' ],
		[ 'key' => 'field_sz_faq_open_first_item', 'label' => 'Open First Item', 'name' => 'open_first_item', 'type' => 'true_false', 'ui' => 1 ],
		[
			'key' => 'field_sz_faq_items',
			'label' => 'FAQ Items',
			'name' => 'faq_items',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add FAQ Item',
			'sub_fields' => [
				[ 'key' => 'field_sz_faq_question', 'label' => 'Question', 'name' => 'question', 'type' => 'text', 'required' => 1 ],
				[ 'key' => 'field_sz_faq_answer', 'label' => 'Answer', 'name' => 'answer', 'type' => 'wysiwyg', 'required' => 1, 'tabs' => 'all', 'toolbar' => 'full', 'media_upload' => 0 ],
			],
		],
	], $style_fields( 'sz_faq' ));

	$pricing_fields = array_merge([
		[ 'key' => 'field_sz_pricing_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_pricing_subheading', 'label' => 'Subheading', 'name' => 'subheading', 'type' => 'text' ],
		[
			'key' => 'field_sz_pricing_packages',
			'label' => 'Packages',
			'name' => 'packages',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Package',
			'sub_fields' => [
				[ 'key' => 'field_sz_pricing_package_name', 'label' => 'Name', 'name' => 'name', 'type' => 'text', 'required' => 1 ],
				[ 'key' => 'field_sz_pricing_package_price_label', 'label' => 'Price Label', 'name' => 'price_label', 'type' => 'text' ],
				[ 'key' => 'field_sz_pricing_package_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea', 'instructions' => 'Short clarifier shown below the package name, e.g. "Digital Only Package".' ],
				[ 'key' => 'field_sz_pricing_package_pricing', 'label' => 'Pricing Tiers', 'name' => 'pricing', 'type' => 'wysiwyg', 'tabs' => 'all', 'toolbar' => 'full', 'media_upload' => 1, 'instructions' => 'Pricing options / tiers (shown on the left in horizontal layout). Use Add Media if you want an inline image such as a pricing guide graphic.' ],
				[ 'key' => 'field_sz_pricing_package_inclusions', 'label' => 'Inclusions', 'name' => 'inclusions', 'type' => 'wysiwyg', 'tabs' => 'all', 'toolbar' => 'full', 'media_upload' => 1, 'instructions' => 'What is included (shown on the right in horizontal layout). Use Add Media if you want an inline image or badge inside this column.' ],
				[ 'key' => 'field_sz_pricing_package_tagline', 'label' => 'Tagline', 'name' => 'tagline', 'type' => 'text', 'instructions' => 'Short tagline displayed below all content, e.g. "Perfect for couples who want the full experience."' ],
				[ 'key' => 'field_sz_pricing_package_is_featured', 'label' => 'Featured', 'name' => 'is_featured', 'type' => 'true_false', 'ui' => 1 ],
				[ 'key' => 'field_sz_pricing_package_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text' ],
				[ 'key' => 'field_sz_pricing_package_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url' ],
			],
		],
	], $style_fields( 'sz_pricing' ));

	$gallery_categories_fields = array_merge([
		[ 'key' => 'field_sz_gallery_categories_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[
			'key' => 'field_sz_gallery_categories_items',
			'label' => 'Categories',
			'name' => 'categories',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Category',
			'sub_fields' => [
				[ 'key' => 'field_sz_gallery_category_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text', 'required' => 1 ],
				[ 'key' => 'field_sz_gallery_category_subtitle', 'label' => 'Subtitle', 'name' => 'subtitle', 'type' => 'text' ],
				[ 'key' => 'field_sz_gallery_category_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array' ],
				[ 'key' => 'field_sz_gallery_category_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url', 'required' => 1 ],
			],
		],
	], $style_fields( 'sz_gallery_categories' ));

	$galleries_fields = [
		[ 'key' => 'field_sz_galleries_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_galleries_description', 'label' => 'Description', 'name' => 'description', 'type' => 'wysiwyg', 'tabs' => 'visual', 'toolbar' => 'basic', 'media_upload' => 0 ],
		[ 'key' => 'field_sz_galleries_desktop_columns', 'label' => 'Desktop Columns', 'name' => 'desktop_columns', 'type' => 'number', 'min' => 2, 'max' => 4, 'default_value' => 3 ],
		[ 'key' => 'field_sz_galleries_mobile_columns', 'label' => 'Mobile Columns', 'name' => 'mobile_columns', 'type' => 'number', 'min' => 1, 'max' => 3, 'default_value' => 2 ],
		[
			'key' => 'field_sz_galleries_images',
			'label' => 'Insert Images',
			'name' => 'images',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Image',
			'min' => 1,
			'sub_fields' => [
				[ 'key' => 'field_sz_galleries_image_item', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array', 'required' => 1 ],
				[ 'key' => 'field_sz_galleries_image_caption', 'label' => 'Caption', 'name' => 'caption', 'type' => 'text' ],
			],
		],
	];

	$gallery_reference_fields = [
		[
			'key' => 'field_sz_gallery_reference_item',
			'label' => 'Reusable Gallery',
			'name' => 'gallery_reference',
			'type' => 'post_object',
			'post_type' => [ 'sz_gallery' ],
			'return_format' => 'id',
			'ui' => 1,
			'required' => 1,
			'instructions' => 'Choose a reusable gallery library entry. Manage its images from the Gallery Library menu in WordPress.',
		],
		[ 'key' => 'field_sz_gallery_reference_desktop_columns', 'label' => 'Desktop Columns', 'name' => 'desktop_columns', 'type' => 'number', 'min' => 2, 'max' => 4, 'default_value' => 3 ],
		[ 'key' => 'field_sz_gallery_reference_mobile_columns', 'label' => 'Mobile Columns', 'name' => 'mobile_columns', 'type' => 'number', 'min' => 1, 'max' => 3, 'default_value' => 2 ],
	];

	$gallery_library_fields = [
		[ 'key' => 'field_sz_gallery_library_description', 'label' => 'Description', 'name' => 'description', 'type' => 'wysiwyg', 'tabs' => 'visual', 'toolbar' => 'basic', 'media_upload' => 0 ],
		[
			'key' => 'field_sz_gallery_library_images',
			'label' => 'Insert Images',
			'name' => 'images',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Image',
			'min' => 1,
			'sub_fields' => [
				[ 'key' => 'field_sz_gallery_library_image_item', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array', 'required' => 1 ],
				[ 'key' => 'field_sz_gallery_library_image_caption', 'label' => 'Caption', 'name' => 'caption', 'type' => 'text' ],
			],
		],
	];

	$image_block_fields = [
		[ 'key' => 'field_sz_image_block_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array', 'required' => 1 ],
		[ 'key' => 'field_sz_image_block_height', 'label' => 'Height', 'name' => 'height', 'type' => 'select', 'choices' => [ 'md' => 'Medium', 'lg' => 'Large', 'full' => 'Full Screen' ], 'default_value' => 'lg' ],
		[ 'key' => 'field_sz_image_block_overlay_strength', 'label' => 'Overlay Strength', 'name' => 'overlay_strength', 'type' => 'select', 'choices' => [ '' => 'None', 'light' => 'Light', 'medium' => 'Medium', 'strong' => 'Strong' ], 'instructions' => 'Optional dark scrim over the image. Recommended when using overlay text.' ],
		[ 'key' => 'field_sz_image_block_overlay_text', 'label' => 'Overlay Text', 'name' => 'overlay_text', 'type' => 'text', 'instructions' => 'Optional large text displayed over the image.' ],
		[ 'key' => 'field_sz_image_block_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text', 'instructions' => 'Optional centred title over the image.' ],
		[ 'key' => 'field_sz_image_block_heading_tag', 'label' => 'Heading Tag', 'name' => 'heading_tag', 'type' => 'select', 'choices' => [ 'h1' => 'H1', 'h2' => 'H2 (default)', 'h3' => 'H3', 'h4' => 'H4', 'h5' => 'H5', 'h6' => 'H6' ], 'default_value' => 'h2', 'instructions' => 'HTML heading level for the title. Choose based on page hierarchy.' ],
		[ 'key' => 'field_sz_image_block_title_pop_out', 'label' => 'Title Pop Out', 'name' => 'title_pop_out', 'type' => 'true_false', 'ui' => 1, 'default_value' => 1, 'instructions' => 'Enlarge the title text on mouseover. Enabled by default.' ],
		[ 'key' => 'field_sz_image_block_subtitle', 'label' => 'Subtitle', 'name' => 'subtitle', 'type' => 'text', 'instructions' => 'Optional subtitle displayed below the title.' ],
		[ 'key' => 'field_sz_image_block_subtitle_pop_out', 'label' => 'Subtitle Pop Out', 'name' => 'subtitle_pop_out', 'type' => 'true_false', 'ui' => 1, 'default_value' => 0, 'instructions' => 'Enlarge the subtitle text on mouseover. Disabled by default.' ],
		[ 'key' => 'field_sz_image_block_heading_opacity', 'label' => 'Heading Opacity', 'name' => 'heading_opacity', 'type' => 'number', 'min' => 0, 'max' => 1, 'step' => 0.05, 'default_value' => 1, 'instructions' => 'Opacity for title and subtitle text. 1 = fully visible, 0 = invisible.' ],
		[ 'key' => 'field_sz_image_block_image_shadow_strength', 'label' => 'Image Shadow Strength', 'name' => 'image_shadow_strength', 'type' => 'number', 'min' => 0, 'max' => 1, 'step' => 0.05, 'default_value' => 0, 'instructions' => 'Darkens the image itself. 0 = no shadow, 0.5 = fairly strong shadow, 1 = fully black image.' ],
		[ 'key' => 'field_sz_image_block_text_align', 'label' => 'Text Align', 'name' => 'text_align', 'type' => 'select', 'choices' => [ 'center' => 'Centre', 'left' => 'Left', 'right' => 'Right' ], 'default_value' => 'center' ],
		[ 'key' => 'field_sz_image_block_text_max_width', 'label' => 'Text Max Width', 'name' => 'text_max_width', 'type' => 'select', 'choices' => [ 'narrow' => 'Narrow (1/4)', 'semi-narrow' => 'Semi-Narrow (1/3)', 'normal' => 'Normal (1/2)', 'wide' => 'Wide (2/3)', 'full' => 'Full Length' ], 'default_value' => 'normal', 'instructions' => 'Maximum width of the text overlay, as a fraction of the image width.' ],
		[ 'key' => 'field_sz_image_block_parallax_scroll', 'label' => 'Parallax Scroll', 'name' => 'parallax_scroll', 'type' => 'true_false', 'ui' => 1, 'default_value' => 0, 'instructions' => 'Enable parallax depth scrolling (CSS fixed background). When off, the image displays as a static full-width banner. Note: on iOS Safari this gracefully falls back to a static image.' ],
		[ 'key' => 'field_sz_image_block_aria_label', 'label' => 'Accessibility Label', 'name' => 'aria_label', 'type' => 'text', 'instructions' => 'Custom aria-label for screen readers. Defaults to "Full-width image banner".' ],
		[ 'key' => 'field_sz_image_block_color_theme', 'label' => 'Colour Theme', 'name' => 'color_theme', 'type' => 'select', 'choices' => [ '' => 'Default', 'corporate' => 'Corporate' ], 'default_value' => '', 'instructions' => 'Choose a colour theme. Corporate replaces soft pink tones with sharp greys and blacks.' ],
	];

	$form_fields = array_merge([
		[ 'key' => 'field_sz_form_form_id', 'label' => 'Form ID', 'name' => 'form_id', 'type' => 'text', 'required' => 1, 'instructions' => 'Required stable identifier used by the secure submit route. Keep it unique on the page and do not change it after publishing.' ],
		[ 'key' => 'field_sz_form_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_form_heading_tag', 'label' => 'Heading Tag', 'name' => 'heading_tag', 'type' => 'select', 'choices' => [ 'h1' => 'H1', 'h2' => 'H2 (default)', 'h3' => 'H3', 'h4' => 'H4', 'h5' => 'H5', 'h6' => 'H6' ], 'default_value' => 'h2', 'instructions' => 'Semantic HTML heading level for the visible heading.' ],
		[ 'key' => 'field_sz_form_heading_align', 'label' => 'Heading Alignment', 'name' => 'heading_align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right' ], 'default_value' => 'left' ],
		[ 'key' => 'field_sz_form_form_alignment', 'label' => 'Form Alignment', 'name' => 'form_alignment', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre' ], 'default_value' => 'left', 'instructions' => 'Horizontal alignment of the form panel within this section.' ],
		[ 'key' => 'field_sz_form_intro', 'label' => 'Intro', 'name' => 'intro', 'type' => 'wysiwyg', 'tabs' => 'all', 'toolbar' => 'full', 'media_upload' => 0, 'instructions' => 'Optional intro copy shown above the form.' ],
		[ 'key' => 'field_sz_form_submit_text', 'label' => 'Submit Button Text', 'name' => 'submit_text', 'type' => 'text', 'default_value' => 'Send message' ],
		[ 'key' => 'field_sz_form_submit_alignment', 'label' => 'Submit Button Alignment', 'name' => 'submit_alignment', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre' ], 'default_value' => 'left' ],
		[ 'key' => 'field_sz_form_success_message', 'label' => 'Success Message', 'name' => 'success_message', 'type' => 'textarea', 'instructions' => 'Shown in-page after a successful submission.' ],
		[ 'key' => 'field_sz_form_delivery_target', 'label' => 'Send Enquiry To', 'name' => 'delivery_target', 'type' => 'select', 'required' => 1, 'allow_null' => 1, 'choices' => [ 'email' => 'Email', 'vsco' => 'VSCO Workspace', 'both' => 'Email + VSCO Workspace' ], 'instructions' => 'Choose where this form submission should be delivered.' ],
		[ 'key' => 'field_sz_form_email_subject', 'label' => 'Email Subject', 'name' => 'email_subject', 'type' => 'text', 'required' => 0, 'instructions' => 'Used by the server-side WordPress lookup when sending form submissions by email.', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'email' ] ], [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'both' ] ] ] ],
		[ 'key' => 'field_sz_form_email_to', 'label' => 'Email To', 'name' => 'email_to', 'type' => 'email', 'required' => 0, 'instructions' => 'Recipient address used when sending form submissions by email.', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'email' ] ], [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'both' ] ] ] ],
		[ 'key' => 'field_sz_form_offer_submitter_email_copy', 'label' => 'Offer Submitter Email Copy', 'name' => 'offer_submitter_email_copy', 'type' => 'true_false', 'ui' => 1, 'default_value' => 0, 'instructions' => 'Show a checkbox at the bottom of the form so submitters can request an emailed copy of their answers. Requires at least one Email field below. If the form has more than one Email field, turn on “Use This One For Customer Copy” on the correct Email field.', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'email' ] ], [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'both' ] ] ] ],
		[ 'key' => 'field_sz_form_vsco_job_type', 'label' => 'VSCO Job Type', 'name' => 'vsco_job_type', 'type' => 'select', 'choices' => $vsco_job_type_choices, 'allow_null' => 0, 'required' => 1, 'instructions' => 'Required when VSCO delivery is enabled. Must match the Job Type names configured in VSCO Workspace.', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'vsco' ] ], [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'both' ] ] ] ],
		[ 'key' => 'field_sz_form_vsco_source', 'label' => 'VSCO Lead Source', 'name' => 'vsco_source', 'type' => 'text', 'instructions' => 'Optional Source value sent to VSCO (for example "Website Contact Form").', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'vsco' ] ], [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'both' ] ] ] ],
		[ 'key' => 'field_sz_form_vsco_brand', 'label' => 'VSCO Brand', 'name' => 'vsco_brand', 'type' => 'text', 'instructions' => 'Optional brand name or brand ID to assign new leads to in VSCO.', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'vsco' ] ], [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'both' ] ] ] ],
		[ 'key' => 'field_sz_form_vsco_send_email_notification', 'label' => 'VSCO Email Notification', 'name' => 'vsco_send_email_notification', 'type' => 'true_false', 'ui' => 1, 'default_value' => 1, 'instructions' => 'When enabled, VSCO sends its own new lead email notification. Turn off to suppress VSCO email notifications for this form.', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'vsco' ] ], [ [ 'field' => 'field_sz_form_delivery_target', 'operator' => '==', 'value' => 'both' ] ] ] ],
		[
			'key' => 'field_sz_form_fields',
			'label' => 'Fields',
			'name' => 'fields',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Field',
			'instructions' => 'Add your form rows here. Validation requires at least one row with Field ID `name` or VSCO Field Key `FirstName`, and that row must have Required enabled, before publishing.',
			'sub_fields' => [
				[ 'key' => 'field_sz_form_field_id', 'label' => 'Field ID', 'name' => 'field_id', 'type' => 'text', 'required' => 1, 'instructions' => 'Machine-safe key sent to the secure submit route, for example `email` or `event_date`.' ],
				[ 'key' => 'field_sz_form_field_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text', 'required' => 1 ],
				[ 'key' => 'field_sz_form_field_type', 'label' => 'Field Type', 'name' => 'type', 'type' => 'select', 'required' => 1, 'choices' => [ 'text' => 'Text', 'email' => 'Email', 'tel' => 'Telephone', 'number' => 'Number', 'date' => 'Date', 'time' => 'Time', 'datetime-local' => 'Date & Time', 'textarea' => 'Textarea', 'select' => 'Select Dropdown', 'radio' => 'Radio Group', 'checkbox' => 'Checkbox Group' ], 'default_value' => 'text' ],
				[ 'key' => 'field_sz_form_field_help_text', 'label' => 'Help Text', 'name' => 'help_text', 'type' => 'textarea', 'rows' => 2 ],
				[ 'key' => 'field_sz_form_field_required', 'label' => 'Required', 'name' => 'required', 'type' => 'true_false', 'ui' => 1, 'default_value' => 0 ],
				[ 'key' => 'field_sz_form_field_use_for_submitter_copy', 'label' => 'Use This One For Customer Copy', 'name' => 'use_for_submitter_copy', 'type' => 'true_false', 'ui' => 1, 'default_value' => 0, 'instructions' => 'Turn this on for the Email field that should receive the customer copy. If there is only one Email field, it is used automatically.', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'email' ] ] ] ],
				[ 'key' => 'field_sz_form_field_vsco_field_key', 'label' => 'VSCO Field Key', 'name' => 'vsco_field_key', 'type' => 'text', 'instructions' => 'Optional exact VSCO field name (for example FirstName, LastName, Email, JobType, EventDate, Source). Leave blank to use Field ID.' ],
				[ 'key' => 'field_sz_form_field_placeholder', 'label' => 'Placeholder', 'name' => 'placeholder', 'type' => 'text', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '!=', 'value' => 'checkbox' ] ] ] ],
				[ 'key' => 'field_sz_form_field_autocomplete', 'label' => 'Autocomplete', 'name' => 'autocomplete', 'type' => 'text', 'instructions' => 'Optional browser autocomplete token such as `name`, `email`, or `tel`.', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'text' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'email' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'tel' ] ] ] ],
				[ 'key' => 'field_sz_form_field_default_value_text', 'label' => 'Default Value', 'name' => 'default_value', 'type' => 'text', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'text' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'email' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'tel' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'date' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'time' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'datetime-local' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'textarea' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'select' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'radio' ] ] ] ],
				[ 'key' => 'field_sz_form_field_default_value_number', 'label' => 'Default Number', 'name' => 'default_value', 'type' => 'number', 'min' => 0, 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'number' ] ] ] ],
				[ 'key' => 'field_sz_form_field_rows', 'label' => 'Textarea Rows', 'name' => 'rows', 'type' => 'number', 'default_value' => 5, 'min' => 2, 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'textarea' ] ] ] ],
				[ 'key' => 'field_sz_form_field_min', 'label' => 'Minimum', 'name' => 'min', 'type' => 'number', 'default_value' => 0, 'min' => 0, 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'number' ] ] ] ],
				[ 'key' => 'field_sz_form_field_max', 'label' => 'Maximum', 'name' => 'max', 'type' => 'number', 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'number' ] ] ] ],
				[ 'key' => 'field_sz_form_field_step', 'label' => 'Step', 'name' => 'step', 'type' => 'number', 'default_value' => 1, 'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'number' ] ] ] ],
				[
					'key' => 'field_sz_form_field_options',
					'label' => 'Options',
					'name' => 'options',
					'type' => 'repeater',
					'layout' => 'table',
					'button_label' => 'Add Option',
					'conditional_logic' => [ [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'select' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'radio' ] ], [ [ 'field' => 'field_sz_form_field_type', 'operator' => '==', 'value' => 'checkbox' ] ] ],
					'instructions' => 'For checkbox fields, each option is shown as a stacked checkbox and email output includes each option as True or False.',
					'sub_fields' => [
						[ 'key' => 'field_sz_form_field_option_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text', 'required' => 1 ],
						[ 'key' => 'field_sz_form_field_option_value', 'label' => 'Value', 'name' => 'value', 'type' => 'text', 'required' => 1, 'instructions' => 'Machine-safe submitted value such as `email`, `phone`, or `wedding`.' ],
					],
				],
			],
		],
	], $style_fields( 'sz_form' ));

	// ─── Shared reusable button sub-fields (used in button_group repeater) ───
	$button_sub_fields = [
		[ 'key' => 'field_sz_btn_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text', 'required' => 1, 'instructions' => 'The text displayed on the button.' ],
		[ 'key' => 'field_sz_btn_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url', 'required' => 1 ],
		[ 'key' => 'field_sz_btn_variant', 'label' => 'Style', 'name' => 'variant', 'type' => 'select', 'choices' => [ 'primary' => 'Primary (Accent Fill)', 'secondary' => 'Secondary (Soft Fill)', 'outline' => 'Outline', 'dark' => 'Dark', 'text' => 'Text (Link-style)' ], 'default_value' => 'primary' ],
		[ 'key' => 'field_sz_btn_size', 'label' => 'Size', 'name' => 'size', 'type' => 'select', 'choices' => [ 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large' ], 'default_value' => 'md' ],
		[ 'key' => 'field_sz_btn_open_new_tab', 'label' => 'Open in New Tab', 'name' => 'open_in_new_tab', 'type' => 'true_false', 'ui' => 1 ],
	];

	$button_group_fields = array_merge([
		[
			'key' => 'field_sz_button_group_buttons',
			'label' => 'Buttons',
			'name' => 'buttons',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Button',
			'min' => 1,
			'sub_fields' => $button_sub_fields,
		],
		[ 'key' => 'field_sz_button_group_alignment', 'label' => 'Alignment', 'name' => 'alignment', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right' ], 'default_value' => 'center' ],
		[ 'key' => 'field_sz_button_group_spacing', 'label' => 'Spacing', 'name' => 'spacing', 'type' => 'select', 'choices' => [ 'tight' => 'Tight', 'normal' => 'Normal', 'loose' => 'Loose' ], 'default_value' => 'normal' ],
	], $style_fields( 'sz_button_group' ));

	$text_grid_fields = array_merge([
		[ 'key' => 'field_sz_text_grid_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_text_grid_subheading', 'label' => 'Subheading', 'name' => 'subheading', 'type' => 'text' ],
		[ 'key' => 'field_sz_text_grid_max_columns', 'label' => 'Maximum Columns', 'name' => 'max_columns', 'type' => 'select', 'choices' => [ '' => 'Default (3)', 1 => '1', 2 => '2', 3 => '3', 4 => '4' ], 'instructions' => 'Maximum number of columns in the grid. The grid will responsively reduce columns on smaller screens.' ],
		[ 'key' => 'field_sz_text_grid_card_style', 'label' => 'Card Style', 'name' => 'card_style', 'type' => 'select', 'choices' => [ 'elevated' => 'Elevated', 'outline' => 'Outline', 'minimal' => 'Minimal' ], 'default_value' => 'elevated' ],
		[ 'key' => 'field_sz_text_grid_text_align', 'label' => 'Text Align', 'name' => 'text_align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right' ], 'default_value' => 'left' ],
		[
			'key' => 'field_sz_text_grid_items',
			'label' => 'Items',
			'name' => 'items',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Item',
			'min' => 1,
			'sub_fields' => [
				[ 'key' => 'field_sz_text_grid_item_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text' ],
				[ 'key' => 'field_sz_text_grid_item_body', 'label' => 'Body', 'name' => 'body', 'type' => 'textarea' ],
				[ 'key' => 'field_sz_text_grid_item_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text', 'instructions' => 'Optional link label for this card.' ],
				[ 'key' => 'field_sz_text_grid_item_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url', 'instructions' => 'Optional link destination for this card.' ],
			],
		],
		[ 'key' => 'field_sz_text_grid_font_size', 'label' => 'Font Size', 'name' => 'font_size', 'type' => 'select', 'choices' => [ 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large' ], 'default_value' => 'sm', 'instructions' => 'Controls the font size of the card title and body text.' ],
		[ 'key' => 'field_sz_text_grid_cta_variant', 'label' => 'CTA Button Style', 'name' => 'cta_variant', 'type' => 'select', 'choices' => [ 'outline' => 'Outline', 'primary' => 'Primary (Accent Fill)', 'secondary' => 'Secondary (Soft Fill)', 'dark' => 'Dark', 'text' => 'Text (Link-style)' ], 'default_value' => 'outline', 'instructions' => 'Visual style of the per-card CTA buttons.' ],
		[ 'key' => 'field_sz_text_grid_cta_size', 'label' => 'CTA Button Size', 'name' => 'cta_size', 'type' => 'select', 'choices' => [ 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large' ], 'default_value' => 'sm', 'instructions' => 'Size of the per-card CTA buttons.' ],
	], $style_fields( 'sz_text_grid' ));

	$instagram_feed_fields = array_merge([
		[ 'key' => 'field_sz_instagram_feed_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_instagram_feed_subheading', 'label' => 'Subheading', 'name' => 'subheading', 'type' => 'text' ],
		[ 'key' => 'field_sz_instagram_feed_username', 'label' => 'Username', 'name' => 'username', 'type' => 'text', 'required' => 1, 'instructions' => 'Instagram username (without @).' ],
		[ 'key' => 'field_sz_instagram_feed_profile_url', 'label' => 'Profile URL', 'name' => 'profile_url', 'type' => 'url', 'required' => 1, 'instructions' => 'Full URL to the Instagram profile.' ],
		[ 'key' => 'field_sz_instagram_feed_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text', 'instructions' => 'Text for the follow button. Defaults to "Follow on Instagram".' ],
		[ 'key' => 'field_sz_instagram_feed_columns', 'label' => 'Columns', 'name' => 'columns', 'type' => 'select', 'choices' => [ '' => 'Default (3)', 2 => '2', 3 => '3', 4 => '4', 6 => '6' ], 'instructions' => 'Number of columns for the image grid.' ],
		[
			'key' => 'field_sz_instagram_feed_images',
			'label' => 'Images',
			'name' => 'images',
			'type' => 'gallery',
			'required' => 1,
			'return_format' => 'array',
			'preview_size' => 'medium',
			'instructions' => 'Upload images to display in the Instagram-style grid.',
		],
	], $style_fields( 'sz_instagram_feed' ));

	// ─── Blog Posts block ────────────────────────────────────────────────────
	//
	// A dynamic listing block that automatically displays posts tagged for the
	// page it sits on. The admin does NOT choose posts here — they assign pages
	// to each post via the "Blog Post Settings" field group on the Post editor.
	//
	// This block provides display configuration: layout, card style, pagination,
	// and which metadata to show.

	$blog_posts_fields = array_merge([
		[ 'key' => 'field_sz_blog_posts_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text', 'instructions' => 'Optional heading displayed above the posts grid.' ],
		[ 'key' => 'field_sz_blog_posts_subheading', 'label' => 'Subheading', 'name' => 'subheading', 'type' => 'text' ],
		[ 'key' => 'field_sz_blog_posts_categories', 'label' => 'Categories', 'name' => 'categories', 'type' => 'taxonomy', 'taxonomy' => 'category', 'field_type' => 'multi_select', 'return_format' => 'id', 'add_term' => 0, 'allow_null' => 1, 'instructions' => 'Select one or more categories to filter posts. Leave empty to show all posts.' ],
		[ 'key' => 'field_sz_blog_posts_per_page', 'label' => 'Posts Per Page', 'name' => 'posts_per_page', 'type' => 'number', 'default_value' => 6, 'min' => 1, 'max' => 50, 'instructions' => 'Number of posts to show per page.' ],
		[ 'key' => 'field_sz_blog_posts_show_pagination', 'label' => 'Show Pagination', 'name' => 'show_pagination', 'type' => 'true_false', 'ui' => 1, 'default_value' => 1, 'instructions' => 'Show page navigation when there are more posts than the per-page limit.' ],
		[ 'key' => 'field_sz_blog_posts_layout', 'label' => 'Layout', 'name' => 'layout', 'type' => 'select', 'choices' => [ 'grid' => 'Grid', 'list' => 'List' ], 'default_value' => 'grid' ],
		[ 'key' => 'field_sz_blog_posts_max_columns', 'label' => 'Maximum Columns', 'name' => 'max_columns', 'type' => 'select', 'choices' => [ '' => 'Default (3)', 2 => '2', 3 => '3', 4 => '4' ], 'instructions' => 'Maximum columns in grid layout. Ignored in list layout.' ],
		[ 'key' => 'field_sz_blog_posts_card_style', 'label' => 'Card Style', 'name' => 'card_style', 'type' => 'select', 'choices' => [ 'elevated' => 'Elevated', 'outline' => 'Outline', 'minimal' => 'Minimal' ], 'default_value' => 'elevated' ],
		[ 'key' => 'field_sz_blog_posts_show_excerpt', 'label' => 'Show Excerpt', 'name' => 'show_excerpt', 'type' => 'true_false', 'ui' => 1, 'default_value' => 1 ],
		[ 'key' => 'field_sz_blog_posts_show_featured_image', 'label' => 'Show Featured Image', 'name' => 'show_featured_image', 'type' => 'true_false', 'ui' => 1, 'default_value' => 1 ],
		[ 'key' => 'field_sz_blog_posts_show_date', 'label' => 'Show Date', 'name' => 'show_date', 'type' => 'true_false', 'ui' => 1, 'default_value' => 1 ],
		[ 'key' => 'field_sz_blog_posts_show_reading_time', 'label' => 'Show Reading Time', 'name' => 'show_reading_time', 'type' => 'true_false', 'ui' => 1, 'default_value' => 1 ],
	], $style_fields( 'sz_blog_posts' ));

	acf_add_local_field_group([
		'key' => 'group_sz_gallery_library',
		'title' => 'Gallery Library',
		'show_in_rest' => 1,
		'fields' => $gallery_library_fields,
		'location' => [
			[
				[
					'param' => 'post_type',
					'operator' => '==',
					'value' => 'sz_gallery',
				],
			],
		],
	]);

	acf_add_local_field_group([
		'key' => 'group_sz_page_blocks',
		'title' => 'Page Blocks',
		'show_in_rest' => 1,
		'fields' => [
			[
				'key' => 'field_sz_blocks',
				'label' => 'Blocks',
				'name' => 'blocks',
				'type' => 'flexible_content',
				'button_label' => 'Add Block',
				'layouts' => [
					'layout_sz_hero' => [
						'key' => 'layout_sz_hero',
						'name' => 'hero',
						'label' => 'Hero',
						'display' => 'block',
						'sub_fields' => $hero_fields,
					],
					'layout_sz_text_block' => [
						'key' => 'layout_sz_text_block',
						'name' => 'text_block',
						'label' => 'Text Block',
						'display' => 'block',
						'sub_fields' => $text_fields,
					],
					'layout_sz_image_text' => [
						'key' => 'layout_sz_image_text',
						'name' => 'image_text',
						'label' => 'Image + Text',
						'display' => 'block',
						'sub_fields' => $image_text_fields,
					],
					'layout_sz_services_grid' => [
						'key' => 'layout_sz_services_grid',
						'name' => 'services_grid',
						'label' => 'Services Grid',
						'display' => 'block',
						'sub_fields' => $services_fields,
					],
					'layout_sz_pillar_grid' => [
						'key' => 'layout_sz_pillar_grid',
						'name' => 'pillar_grid',
						'label' => 'Pillar Grid',
						'display' => 'block',
						'sub_fields' => $pillar_fields,
					],
					'layout_sz_faq_accordion' => [
						'key' => 'layout_sz_faq_accordion',
						'name' => 'faq_accordion',
						'label' => 'FAQ Accordion',
						'display' => 'block',
						'sub_fields' => $faq_fields,
					],
					'layout_sz_form_block' => [
						'key' => 'layout_sz_form_block',
						'name' => 'form_block',
						'label' => 'Form',
						'display' => 'block',
						'sub_fields' => $form_fields,
					],
					'layout_sz_pricing_packages' => [
						'key' => 'layout_sz_pricing_packages',
						'name' => 'pricing_packages',
						'label' => 'Pricing Packages',
						'display' => 'block',
						'sub_fields' => $pricing_fields,
					],
					'layout_sz_gallery_categories' => [
						'key' => 'layout_sz_gallery_categories',
						'name' => 'gallery_categories',
						'label' => 'Gallery Categories',
						'display' => 'block',
						'sub_fields' => $gallery_categories_fields,
					],
					'layout_sz_galleries' => [
						'key' => 'layout_sz_galleries',
						'name' => 'galleries',
						'label' => 'Galleries (Legacy Inline)',
						'display' => 'block',
						'sub_fields' => $galleries_fields,
					],
					'layout_sz_gallery_reference' => [
						'key' => 'layout_sz_gallery_reference',
						'name' => 'gallery_reference',
						'label' => 'Reusable Gallery',
						'display' => 'block',
						'sub_fields' => $gallery_reference_fields,
					],
					'layout_sz_image_block' => [
						'key' => 'layout_sz_image_block',
						'name' => 'image_block',
						'label' => 'Image',
						'display' => 'block',
						'sub_fields' => $image_block_fields,
					],
					'layout_sz_button_group' => [
						'key' => 'layout_sz_button_group',
						'name' => 'button_group',
						'label' => 'Button Group',
						'display' => 'block',
						'sub_fields' => $button_group_fields,
					],
					'layout_sz_text_grid' => [
						'key' => 'layout_sz_text_grid',
						'name' => 'text_grid',
						'label' => 'Text Grid',
						'display' => 'block',
						'sub_fields' => $text_grid_fields,
					],
					'layout_sz_instagram_feed' => [
						'key' => 'layout_sz_instagram_feed',
						'name' => 'instagram_feed',
						'label' => 'Instagram Feed',
						'display' => 'block',
						'sub_fields' => $instagram_feed_fields,
					],
					'layout_sz_blog_posts' => [
						'key' => 'layout_sz_blog_posts',
						'name' => 'blog_posts',
						'label' => 'Blog Posts',
						'display' => 'block',
						'sub_fields' => $blog_posts_fields,
					],
				],
			],
		],
		'location' => [
			[
				[
					'param' => 'post_type',
					'operator' => '==',
					'value' => 'page',
				],
			],
		],
	]);

	acf_add_local_field_group([
		'key' => 'group_sz_page_settings',
		'title' => 'Page Settings',
		'show_in_rest' => 1,
		'fields' => [
			[
				'key' => 'field_sz_menu_override',
				'label' => 'Menu Override',
				'name' => 'menu_override',
				'type' => 'select',
				'allow_null' => 1,
				'ui' => 1,
				'choices' => [],
				'instructions' => 'Optional. Choose a menu from Appearance → Menus to display in the header instead of the primary menu. Falls back to Primary when empty or not found.',
			],
			[
				'key' => 'field_sz_container_only',
				'label' => 'Container Only (no direct access)',
				'name' => 'container_only',
				'type' => 'true_false',
				'default_value' => 0,
				'ui' => 1,
				'instructions' => 'When enabled, this page exists only for URL hierarchy (e.g. /gallery/) — visiting the page directly returns a 404. Child pages underneath it still work normally.',
			],
		],
		'location' => [
			[
				[
					'param' => 'post_type',
					'operator' => '==',
					'value' => 'page',
				],
			],
		],
	]);

	// ─── Category Settings ──────────────────────────────────────────────────
	//
	// Adds a menu override to post categories so that blog posts inherit
	// the header menu from their primary category. This lets the admin
	// configure e.g. "Weddings" category → show the weddings header menu
	// on all wedding blog posts.

	acf_add_local_field_group([
		'key' => 'group_sz_category_settings',
		'title' => 'Category Settings',
		'show_in_rest' => 1,
		'fields' => [
			[
				'key' => 'field_sz_cat_menu_override',
				'label' => 'Menu Override',
				'name' => 'menu_override',
				'type' => 'select',
				'allow_null' => 1,
				'ui' => 1,
				'choices' => [],
				'instructions' => 'Optional. Choose a menu from Appearance → Menus to display in the header when viewing blog posts in this category. Falls back to Primary when empty.',
			],
		],
		'location' => [
			[
				[
					'param' => 'taxonomy',
					'operator' => '==',
					'value' => 'category',
				],
			],
		],
	]);

} );

// ─── Dynamic menu choices for menu_override select fields ────────────────────
//
// Populates the menu_override dropdowns at render time with all menus from
// Appearance → Menus plus registered theme locations. If an existing saved
// value doesn't match any current menu (e.g. a text-based legacy value),
// it is preserved as an extra choice to prevent data loss.

add_filter( 'acf/load_field/key=field_sz_menu_override', 'sz_populate_menu_override_choices' );
add_filter( 'acf/load_field/key=field_sz_cat_menu_override', 'sz_populate_menu_override_choices' );

function sz_populate_menu_override_choices( array $field ): array {
	$choices = [];

	// 1. Add registered theme locations
	$locations = get_registered_nav_menus();
	foreach ( $locations as $slug => $label ) {
		$choices[ $slug ] = $label . ' (' . $slug . ')';
	}

	// 2. Add all menus created in Appearance → Menus
	$nav_menus = wp_get_nav_menus();
	foreach ( $nav_menus as $menu ) {
		$slug = $menu->slug;
		// Avoid duplicate if a menu slug matches a theme location slug
		if ( ! isset( $choices[ $slug ] ) ) {
			$choices[ $slug ] = $menu->name . ' (' . $slug . ')';
		}
	}

	// 3. Preserve any existing saved value that doesn't match current menus
	//    (backward compatibility for legacy text-based overrides)
	if ( ! empty( $field['value'] ) && is_string( $field['value'] ) && ! isset( $choices[ $field['value'] ] ) ) {
		$choices[ $field['value'] ] = $field['value'] . ' (legacy)';
	}

	$field['choices'] = $choices;
	return $field;
}


/*
 * Form Block validation guard (non-destructive):
 * require at least one row with Field ID = "name" OR VSCO Field Key = "FirstName",
 * and require all matching rows to have Required enabled.
 *
 * This intentionally does not mutate, prepend, remove, or re-key rows.
 */
add_filter( 'acf/validate_value/key=field_sz_form_fields', 'sz_form_validate_required_name_or_firstname', 20, 4 );
function sz_form_validate_required_name_or_firstname( $valid, $value, $field = null, $input = '' ) {
	if ( $valid !== true ) {
		return $valid;
	}

	$errors = sz_validate_form_field_rows( $value );
	if ( empty( $errors ) ) {
		return $valid;
	}

	return implode( ' ', array_values( array_unique( $errors ) ) );
}
