<?php
/**
 * Plugin Name: Studio Zanetti — ACF Schema
 * Description: Registers all ACF field groups for headless flexible content via code.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
	];

	$spacing_choices = [
		'none' => 'None',
		'sm'   => 'Small',
		'md'   => 'Medium',
		'lg'   => 'Large',
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
		[ 'key' => 'field_sz_text_body', 'label' => 'Body', 'name' => 'body', 'type' => 'wysiwyg' ],
		[ 'key' => 'field_sz_text_align', 'label' => 'Text Align', 'name' => 'align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right', 'justify' => 'Justified' ], 'default_value' => 'left', 'instructions' => 'Alignment of text content within the block.' ],
		[ 'key' => 'field_sz_text_block_align', 'label' => 'Block Align', 'name' => 'block_align', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right' ], 'default_value' => 'left', 'instructions' => 'Horizontal position of the entire block on the page.' ],
		[ 'key' => 'field_sz_text_max_width', 'label' => 'Max Width', 'name' => 'max_width', 'type' => 'select', 'choices' => [ 'narrow' => 'Narrow', 'normal' => 'Normal', 'wide' => 'Wide' ] ],
		[ 'key' => 'field_sz_text_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text' ],
		[ 'key' => 'field_sz_text_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url' ],
		[ 'key' => 'field_sz_text_font_size', 'label' => 'Body Font Size', 'name' => 'font_size', 'type' => 'select', 'choices' => [ 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large' ], 'default_value' => 'sm', 'instructions' => 'Controls the font size of the rich-text body content.' ],
	], $style_fields( 'sz_text' ));

	$image_text_fields = array_merge([
		[ 'key' => 'field_sz_image_text_eyebrow', 'label' => 'Eyebrow', 'name' => 'eyebrow', 'type' => 'text' ],
		[ 'key' => 'field_sz_image_text_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_image_text_body', 'label' => 'Body', 'name' => 'body', 'type' => 'wysiwyg' ],
		[ 'key' => 'field_sz_image_text_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array', 'required' => 1 ],
		[ 'key' => 'field_sz_image_text_image_mobile', 'label' => 'Image (Mobile)', 'name' => 'image_mobile', 'type' => 'image', 'return_format' => 'array' ],
		[ 'key' => 'field_sz_image_text_image_position', 'label' => 'Image Position', 'name' => 'image_position', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'right' => 'Right' ] ],
		[ 'key' => 'field_sz_image_text_image_ratio', 'label' => 'Image Ratio', 'name' => 'image_ratio', 'type' => 'select', 'choices' => [ 'landscape' => 'Landscape', 'portrait' => 'Portrait', 'square' => 'Square', 'auto' => 'Auto (natural)' ] ],
		[ 'key' => 'field_sz_image_text_image_style', 'label' => 'Image Style', 'name' => 'image_style', 'type' => 'select', 'choices' => [ 'soft' => 'Soft', 'framed' => 'Framed', 'plain' => 'Plain' ] ],
		[ 'key' => 'field_sz_image_text_image_max_width', 'label' => 'Image Max Width (px)', 'name' => 'image_max_width', 'type' => 'number', 'instructions' => 'Optional. Caps the image width in pixels. Height scales proportionally.', 'min' => 0 ],
		[ 'key' => 'field_sz_image_text_image_max_height', 'label' => 'Image Max Height (px)', 'name' => 'image_max_height', 'type' => 'number', 'instructions' => 'Optional. Caps the image height in pixels. Width scales proportionally.', 'min' => 0 ],
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

	$biography_fields = array_merge([
		[ 'key' => 'field_sz_bio_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array' ],
		[ 'key' => 'field_sz_bio_name', 'label' => 'Name', 'name' => 'name', 'type' => 'text', 'required' => 1 ],
		[ 'key' => 'field_sz_bio_role', 'label' => 'Role', 'name' => 'role', 'type' => 'text' ],
		[ 'key' => 'field_sz_bio_bio', 'label' => 'Bio', 'name' => 'bio', 'type' => 'wysiwyg', 'required' => 1 ],
		[ 'key' => 'field_sz_bio_quote', 'label' => 'Quote', 'name' => 'quote', 'type' => 'textarea' ],
		[ 'key' => 'field_sz_bio_signature_text', 'label' => 'Signature Text', 'name' => 'signature_text', 'type' => 'text' ],
	], $style_fields( 'sz_bio' ));

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

	$testimonial_fields = array_merge([
		[ 'key' => 'field_sz_testimonial_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_testimonial_subheading', 'label' => 'Subheading', 'name' => 'subheading', 'type' => 'text' ],
		[ 'key' => 'field_sz_testimonial_rotate_seconds', 'label' => 'Auto Rotate Seconds', 'name' => 'auto_rotate_seconds', 'type' => 'number', 'min' => 3 ],
		[
			'key' => 'field_sz_testimonial_items',
			'label' => 'Testimonials',
			'name' => 'testimonials',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Testimonial',
			'sub_fields' => [
				[ 'key' => 'field_sz_testimonial_quote', 'label' => 'Quote', 'name' => 'quote', 'type' => 'textarea', 'required' => 1 ],
				[ 'key' => 'field_sz_testimonial_name', 'label' => 'Name', 'name' => 'name', 'type' => 'text', 'required' => 1 ],
				[ 'key' => 'field_sz_testimonial_context', 'label' => 'Context', 'name' => 'context', 'type' => 'text' ],
				[ 'key' => 'field_sz_testimonial_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array' ],
			],
		],
	], $style_fields( 'sz_testimonial' ));

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
				[ 'key' => 'field_sz_faq_answer', 'label' => 'Answer', 'name' => 'answer', 'type' => 'wysiwyg', 'required' => 1 ],
			],
		],
	], $style_fields( 'sz_faq' ));

	$process_fields = array_merge([
		[ 'key' => 'field_sz_process_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_process_intro', 'label' => 'Intro', 'name' => 'intro', 'type' => 'textarea' ],
		[
			'key' => 'field_sz_process_steps',
			'label' => 'Steps',
			'name' => 'steps',
			'type' => 'repeater',
			'layout' => 'row',
			'button_label' => 'Add Step',
			'sub_fields' => [
				[ 'key' => 'field_sz_process_step_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text', 'required' => 1 ],
				[ 'key' => 'field_sz_process_step_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea', 'required' => 1 ],
				[ 'key' => 'field_sz_process_step_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array' ],
			],
		],
	], $style_fields( 'sz_process' ));

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
				[ 'key' => 'field_sz_pricing_package_pricing', 'label' => 'Pricing Tiers', 'name' => 'pricing', 'type' => 'wysiwyg', 'instructions' => 'Pricing options / tiers (shown on the left in horizontal layout).' ],
				[ 'key' => 'field_sz_pricing_package_inclusions', 'label' => 'Inclusions', 'name' => 'inclusions', 'type' => 'wysiwyg', 'instructions' => 'What is included (shown on the right in horizontal layout).' ],
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

	$galleries_fields = array_merge([
		[ 'key' => 'field_sz_galleries_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
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
	], $style_fields( 'sz_galleries' ));

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
		[ 'key' => 'field_sz_image_block_text_align', 'label' => 'Text Align', 'name' => 'text_align', 'type' => 'select', 'choices' => [ 'center' => 'Centre', 'left' => 'Left', 'right' => 'Right' ], 'default_value' => 'center' ],
		[ 'key' => 'field_sz_image_block_text_max_width', 'label' => 'Text Max Width', 'name' => 'text_max_width', 'type' => 'select', 'choices' => [ 'narrow' => 'Narrow (1/4)', 'semi-narrow' => 'Semi-Narrow (1/3)', 'normal' => 'Normal (1/2)', 'wide' => 'Wide (2/3)', 'full' => 'Full Length' ], 'default_value' => 'normal', 'instructions' => 'Maximum width of the text overlay, as a fraction of the image width.' ],
		[ 'key' => 'field_sz_image_block_parallax_scroll', 'label' => 'Parallax Scroll', 'name' => 'parallax_scroll', 'type' => 'true_false', 'ui' => 1, 'default_value' => 0, 'instructions' => 'Enable parallax depth scrolling (CSS fixed background). When off, the image displays as a static full-width banner. Note: on iOS Safari this gracefully falls back to a static image.' ],
		[ 'key' => 'field_sz_image_block_aria_label', 'label' => 'Accessibility Label', 'name' => 'aria_label', 'type' => 'text', 'instructions' => 'Custom aria-label for screen readers. Defaults to "Full-width image banner".' ],
	];

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
					'layout_sz_biography' => [
						'key' => 'layout_sz_biography',
						'name' => 'biography',
						'label' => 'Biography',
						'display' => 'block',
						'sub_fields' => $biography_fields,
					],
					'layout_sz_pillar_grid' => [
						'key' => 'layout_sz_pillar_grid',
						'name' => 'pillar_grid',
						'label' => 'Pillar Grid',
						'display' => 'block',
						'sub_fields' => $pillar_fields,
					],
					'layout_sz_testimonial_carousel' => [
						'key' => 'layout_sz_testimonial_carousel',
						'name' => 'testimonial_carousel',
						'label' => 'Testimonial Carousel',
						'display' => 'block',
						'sub_fields' => $testimonial_fields,
					],
					'layout_sz_faq_accordion' => [
						'key' => 'layout_sz_faq_accordion',
						'name' => 'faq_accordion',
						'label' => 'FAQ Accordion',
						'display' => 'block',
						'sub_fields' => $faq_fields,
					],
					'layout_sz_process_timeline' => [
						'key' => 'layout_sz_process_timeline',
						'name' => 'process_timeline',
						'label' => 'Process Timeline',
						'display' => 'block',
						'sub_fields' => $process_fields,
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
						'label' => 'Galleries',
						'display' => 'block',
						'sub_fields' => $galleries_fields,
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
				'label' => 'Menu Override (location slug)',
				'name' => 'menu_override',
				'type' => 'text',
				'instructions' => 'Optional. Example: primary, weddings, events. Falls back to primary when empty/invalid.',
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
} );
