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
		];
	};

	$hero_fields = [
		[ 'key' => 'field_sz_hero_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text', 'required' => 1 ],
		[ 'key' => 'field_sz_hero_tagline', 'label' => 'Tagline', 'name' => 'tagline', 'type' => 'text' ],
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
	], $style_fields( 'sz_text' ));

	$image_text_fields = array_merge([
		[ 'key' => 'field_sz_image_text_eyebrow', 'label' => 'Eyebrow', 'name' => 'eyebrow', 'type' => 'text' ],
		[ 'key' => 'field_sz_image_text_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_image_text_body', 'label' => 'Body', 'name' => 'body', 'type' => 'wysiwyg' ],
		[ 'key' => 'field_sz_image_text_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array', 'required' => 1 ],
		[ 'key' => 'field_sz_image_text_image_mobile', 'label' => 'Image (Mobile)', 'name' => 'image_mobile', 'type' => 'image', 'return_format' => 'array' ],
		[ 'key' => 'field_sz_image_text_image_position', 'label' => 'Image Position', 'name' => 'image_position', 'type' => 'select', 'choices' => [ 'left' => 'Left', 'right' => 'Right' ] ],
		[ 'key' => 'field_sz_image_text_image_ratio', 'label' => 'Image Ratio', 'name' => 'image_ratio', 'type' => 'select', 'choices' => [ 'landscape' => 'Landscape', 'portrait' => 'Portrait', 'square' => 'Square' ] ],
		[ 'key' => 'field_sz_image_text_image_style', 'label' => 'Image Style', 'name' => 'image_style', 'type' => 'select', 'choices' => [ 'soft' => 'Soft', 'framed' => 'Framed', 'plain' => 'Plain' ] ],
		[ 'key' => 'field_sz_image_text_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text' ],
		[ 'key' => 'field_sz_image_text_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url' ],
	], $style_fields( 'sz_image_text' ));

	$services_fields = array_merge([
		[ 'key' => 'field_sz_services_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text' ],
		[ 'key' => 'field_sz_services_subheading', 'label' => 'Subheading', 'name' => 'subheading', 'type' => 'text' ],
		[ 'key' => 'field_sz_services_columns', 'label' => 'Columns', 'name' => 'columns', 'type' => 'select', 'choices' => [ 2 => '2', 3 => '3', 4 => '4' ] ],
		[ 'key' => 'field_sz_services_card_style', 'label' => 'Card Style', 'name' => 'card_style', 'type' => 'select', 'choices' => [ 'elevated' => 'Elevated', 'outline' => 'Outline', 'minimal' => 'Minimal' ] ],
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
			],
		],
		[ 'key' => 'field_sz_services_cta_text', 'label' => 'CTA Text', 'name' => 'cta_text', 'type' => 'text' ],
		[ 'key' => 'field_sz_services_cta_url', 'label' => 'CTA URL', 'name' => 'cta_url', 'type' => 'url' ],
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
				[ 'key' => 'field_sz_pricing_package_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea' ],
				[ 'key' => 'field_sz_pricing_package_inclusions', 'label' => 'Inclusions', 'name' => 'inclusions', 'type' => 'wysiwyg' ],
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
