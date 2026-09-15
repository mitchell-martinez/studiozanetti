<?php

if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $value ): string {
		return trim( preg_replace( '/\s+/', ' ', strip_tags( is_scalar( $value ) ? (string) $value : '' ) ) );
	}
}

if ( ! function_exists( 'sanitize_key' ) ) {
	function sanitize_key( $value ): string {
		return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( is_scalar( $value ) ? (string) $value : '' ) );
	}
}

require_once __DIR__ . '/../mu-plugins/includes/website-help.php';

$failures = [];

function sz_website_help_test_assert( string $name, $expected, $actual, array &$failures ): void {
	if ( $expected === $actual ) {
		return;
	}

	$failures[] = [ 'name' => $name, 'expected' => $expected, 'actual' => $actual ];
}

$manifest_path = __DIR__ . '/../mu-plugins/website-help/manifest.php';
$topics_directory = __DIR__ . '/../mu-plugins/website-help/topics';
$manifest = sz_website_help_load_manifest( $manifest_path );

sz_website_help_test_assert(
	'manifest is valid',
	[],
	sz_website_help_validate_manifest( $manifest, $topics_directory ),
	$failures
);

$gallery_topics = sz_website_help_retrieve_topics(
	$manifest,
	$topics_directory,
	'How should I name a reusable gallery?',
	[ 'screen_id' => 'edit-sz_gallery', 'post_type' => 'sz_gallery' ]
);
$gallery_topic_ids = array_column( $gallery_topics, 'id' );
sz_website_help_test_assert( 'capability rules are always included', true, in_array( 'capabilities', $gallery_topic_ids, true ), $failures );
sz_website_help_test_assert( 'gallery guidance is retrieved', true, in_array( 'galleries', $gallery_topic_ids, true ), $failures );
sz_website_help_test_assert( 'unrelated footer guidance is excluded', false, in_array( 'footer', $gallery_topic_ids, true ), $failures );
foreach ( $gallery_topics as $gallery_topic ) {
	$source_body = trim( (string) file_get_contents( $topics_directory . '/' . $gallery_topic['topic_file'] ) );
	sz_website_help_test_assert( 'retrieval returns complete topic ' . $gallery_topic['id'], $source_body, $gallery_topic['body'], $failures );
}

$retrieval_cases = [
	[ 'How do I add a Hero block to a page?', [ 'screen_id' => 'page', 'post_type' => 'page' ], 'page-blocks' ],
	[ 'Where do I set alternative text and media folders?', [ 'screen_id' => 'upload', 'post_type' => 'attachment' ], 'media' ],
	[ 'How do I make a dropdown in the main navigation?', [ 'screen_id' => 'nav-menus', 'post_type' => '' ], 'menus' ],
	[ 'Why is the required name field needed on my enquiry form?', [ 'screen_id' => 'page', 'post_type' => 'page' ], 'forms' ],
	[ 'Where do I update the Google title and SEO audit?', [ 'screen_id' => 'toplevel_page_sz-social-seo-manager', 'post_type' => 'page' ], 'seo' ],
	[ 'Can the website take online payments?', [ 'screen_id' => 'dashboard', 'post_type' => '' ], 'unsupported-features' ],
	[ 'I am new. Where do I change something on the website?', [ 'screen_id' => 'dashboard', 'post_type' => '' ], 'getting-started' ],
	[ 'I made a mistake. Can I restore a revision?', [ 'screen_id' => 'page', 'post_type' => 'page' ], 'safe-editing-recovery' ],
	[ 'What should I check before I publish this page?', [ 'screen_id' => 'page', 'post_type' => 'page' ], 'publishing-checklist' ],
	[ 'Who can see my chat history and what editor context is stored?', [ 'screen_id' => 'toplevel_page_sz-website-help', 'post_type' => '' ], 'help-privacy-history' ],
];
foreach ( $retrieval_cases as $retrieval_case ) {
	$retrieved = sz_website_help_retrieve_topics( $manifest, $topics_directory, $retrieval_case[0], $retrieval_case[1], 4 );
	sz_website_help_test_assert(
		'retrieval selects ' . $retrieval_case[2],
		true,
		in_array( $retrieval_case[2], array_column( $retrieved, 'id' ), true ),
		$failures
	);
}

$follow_up_query = sz_website_help_retrieval_query(
	'What happens if I rename it?',
	[
		[ 'role' => 'user', 'content' => 'How do reusable galleries work?' ],
		[ 'role' => 'assistant', 'content' => 'They are managed in Gallery Library.' ],
	]
);
$follow_up_topics = sz_website_help_retrieve_topics( $manifest, $topics_directory, $follow_up_query, [], 4 );
sz_website_help_test_assert( 'follow-up retrieval preserves the preceding user topic', true, in_array( 'galleries', array_column( $follow_up_topics, 'id' ), true ), $failures );
sz_website_help_test_assert( 'assistant wording does not enter the retrieval query', false, strpos( $follow_up_query, 'managed in Gallery Library' ) !== false, $failures );

$tier_zero = sz_website_help_tier_zero_context([
	'screen_id'              => 'page',
	'screen_label'           => 'Edit Page',
	'object_type'            => 'page',
	'object_id'              => 123,
	'object_title'           => 'Private working title',
	'slug'                   => 'private-working-title',
	'status'                 => 'draft',
	'has_unsaved_changes'    => true,
	'live_context_available' => true,
]);
sz_website_help_test_assert(
	'Tier 0 contains only approved metadata',
	[ 'screen_id', 'screen_label', 'object_type', 'has_unsaved_changes', 'live_context_available' ],
	array_keys( $tier_zero ),
	$failures
);
sz_website_help_test_assert( 'Tier 0 records unsaved changes', true, $tier_zero['has_unsaved_changes'], $failures );

$outline_request = sz_website_help_validate_context_request([ 'scope' => 'editor_outline' ]);
sz_website_help_test_assert( 'outline-only requests are valid', true, $outline_request['valid'], $failures );
sz_website_help_test_assert(
	'outline requests cannot smuggle field values',
	[ 'scope' => 'editor_outline' ],
	$outline_request['request'],
	$failures
);

$broad_request = sz_website_help_validate_context_request([ 'scope' => 'everything' ]);
sz_website_help_test_assert( 'unknown broad scopes are rejected', false, $broad_request['valid'], $failures );

$unjustified_full_object = sz_website_help_validate_context_request([ 'scope' => 'full_object', 'reason' => 'all' ]);
sz_website_help_test_assert( 'full-object requests require a reason', false, $unjustified_full_object['valid'], $failures );

$sanitized_form = sz_website_help_sanitize_context_payload(
	[ 'scope' => 'blocks', 'indexes' => [ 1 ] ],
	[
		'blocks' => [
			[ 'acf_fc_layout' => 'hero', 'title' => 'Unrequested hero' ],
			[
				'acf_fc_layout'  => 'form_block',
				'heading'        => 'Contact us',
				'delivery_target' => 'both',
				'email_to'       => 'private@example.test',
				'vsco_job_type'  => 'Private workflow',
				'fields'         => [
					[
						'label'         => 'Your email',
						'type'          => 'email',
						'help_text'     => 'We will reply here.',
						'required'      => true,
						'default_value' => 'person@example.test',
						'vsco_field_key' => 'Email',
					],
				],
			],
		],
	]
);
sz_website_help_test_assert( 'targeted block context is valid', true, $sanitized_form['valid'], $failures );
sz_website_help_test_assert( 'only requested block indexes are returned', [ 1 ], array_keys( $sanitized_form['context']['blocks'] ), $failures );
$sanitized_form_json = json_encode( $sanitized_form['context'] );
sz_website_help_test_assert( 'form recipient is redacted', false, strpos( $sanitized_form_json, 'private@example.test' ) !== false, $failures );
sz_website_help_test_assert( 'form default value is redacted', false, strpos( $sanitized_form_json, 'person@example.test' ) !== false, $failures );
sz_website_help_test_assert( 'VSCO integration values are redacted', false, strpos( $sanitized_form_json, 'Private workflow' ) !== false, $failures );
sz_website_help_test_assert( 'visible form labels remain available', true, strpos( $sanitized_form_json, 'Your email' ) !== false, $failures );

$post_content_request = sz_website_help_validate_context_request([ 'scope' => 'field_group', 'field_group' => 'post_content' ]);
sz_website_help_test_assert( 'post content can be requested as a narrow field group', true, $post_content_request['valid'], $failures );
$post_content = sz_website_help_sanitize_context_payload(
	$post_content_request['request'],
	[ 'content' => 'Unsaved editor copy', 'password' => 'must not survive' ]
);
sz_website_help_test_assert( 'unsaved post content remains available', 'Unsaved editor copy', $post_content['context']['post_content']['content'], $failures );
sz_website_help_test_assert( 'unapproved post fields are removed', false, isset( $post_content['context']['post_content']['password'] ), $failures );

$context_label = sz_website_help_context_label(
	[ 'screen_label' => 'Edit Page', 'object_type' => 'page' ],
	[
		[ 'scope' => 'object_identity', 'data' => [ 'id' => 42, 'title' => 'Portfolio' ] ],
		[ 'scope' => 'editor_outline', 'data' => [ 'blocks' => [ [ 'layout' => 'hero', 'label' => 'Hero' ] ] ] ],
	]
);
sz_website_help_test_assert( 'context labels retain the page title', 'Portfolio', $context_label['object_title'], $failures );
sz_website_help_test_assert( 'context labels retain block names without values', [ 'Hero' ], $context_label['block_names'], $failures );
sz_website_help_test_assert( 'context labels record only requested scopes', [ 'object_identity', 'editor_outline' ], $context_label['scopes'], $failures );

$oversized_context = sz_website_help_sanitize_context_payload(
	[ 'scope' => 'blocks', 'indexes' => [ 0 ] ],
	[ 'blocks' => [ [ 'acf_fc_layout' => 'text_block', 'content' => str_repeat( 'x', 1000 ) ] ] ],
	100
);
sz_website_help_test_assert( 'oversized context is rejected', false, $oversized_context['valid'], $failures );

$provider_payload = sz_website_help_build_provider_payload(
	'gpt-5-mini',
	[ [ 'role' => 'user', 'content' => 'How do I edit a gallery?' ] ]
);
sz_website_help_test_assert( 'provider storage is disabled', false, $provider_payload['store'], $failures );
sz_website_help_test_assert( 'provider payload has no tools', false, array_key_exists( 'tools', $provider_payload ), $failures );
sz_website_help_test_assert( 'provider response format is strict', true, $provider_payload['text']['format']['strict'], $failures );
$context_schema_variants = $provider_payload['text']['format']['schema']['properties']['context_request']['anyOf'];
foreach ( $context_schema_variants as $variant ) {
	if ( 'null' === ( $variant['type'] ?? '' ) ) {
		continue;
	}
	sz_website_help_test_assert( 'every context schema object is closed', false, $variant['additionalProperties'], $failures );
}
sz_website_help_test_assert( 'strict schema avoids unsupported uniqueItems', false, strpos( json_encode( $provider_payload['text']['format']['schema'] ), 'uniqueItems' ) !== false, $failures );

$parsed_final = sz_website_help_parse_provider_response([
	'output' => [
		[
			'content' => [
				[
					'type' => 'output_text',
					'text' => json_encode([
						'type'              => 'final',
						'answer'            => 'Open Gallery Library.',
						'status'            => 'available',
						'developer_request' => null,
						'source_topic_ids'  => [ 'galleries' ],
					]),
				],
			],
		],
	],
]);
sz_website_help_test_assert( 'valid final responses are parsed', true, $parsed_final['valid'], $failures );
sz_website_help_test_assert( 'final answer sources are retained', [ 'galleries' ], $parsed_final['source_topic_ids'], $failures );

$invalid_response = sz_website_help_parse_provider_response([ 'output_text' => '{"type":"context_request","context_request":{"scope":"everything"}}' ]);
sz_website_help_test_assert( 'invalid provider context requests are rejected', false, $invalid_response['valid'], $failures );

sz_website_help_test_assert( 'thread authors can access their own history', true, sz_website_help_user_can_access_thread( 7, 7, true ), $failures );
sz_website_help_test_assert( 'administrative capability does not bypass thread ownership', false, sz_website_help_user_can_access_thread( 8, 7, true ), $failures );
sz_website_help_test_assert( 'ownership does not bypass missing editor capability', false, sz_website_help_user_can_access_thread( 7, 7, false ), $failures );

$rate_allowed = sz_website_help_rate_limit_check( [ 900, 950 ], 1000, 300, 3, 100 );
sz_website_help_test_assert( 'rate limiter accepts requests below the threshold', true, $rate_allowed['allowed'], $failures );
$rate_blocked = sz_website_help_rate_limit_check( [ 800, 900, 950 ], 1000, 300, 3, 100 );
sz_website_help_test_assert( 'rate limiter blocks the short-window threshold', 'short_window', $rate_blocked['reason'], $failures );

$scope_token = sz_website_help_create_scope_token();
$scope_record = sz_website_help_scope_token_record( $scope_token, 7, [ 'scope' => 'blocks', 'indexes' => [ 2 ] ], 1200, 1 );
$valid_scope_token = sz_website_help_validate_scope_token_record( $scope_record, $scope_token, 7, 1100 );
sz_website_help_test_assert( 'opaque scope tokens validate for their user', true, $valid_scope_token['valid'], $failures );
sz_website_help_test_assert( 'scope tokens are user-bound', false, sz_website_help_validate_scope_token_record( $scope_record, $scope_token, 8, 1100 )['valid'], $failures );
sz_website_help_test_assert( 'scope tokens expire', false, sz_website_help_validate_scope_token_record( $scope_record, $scope_token, 7, 1300 )['valid'], $failures );
$second_token = sz_website_help_create_scope_token();
$second_record = sz_website_help_scope_exchange_record(
	$scope_record,
	$second_token,
	7,
	[ 'scope' => 'object_identity' ],
	1500,
	2
);
sz_website_help_test_assert( 'second-round records use the new token', true, sz_website_help_validate_scope_token_record( $second_record, $second_token, 7, 1400 )['valid'], $failures );
sz_website_help_test_assert( 'second-round records reject the old token', false, sz_website_help_validate_scope_token_record( $second_record, $scope_token, 7, 1400 )['valid'], $failures );

$first_round = sz_website_help_validate_context_round( [ 'scope' => 'editor_outline' ], [], 1 );
sz_website_help_test_assert( 'first context expansion is accepted', true, $first_round['valid'], $failures );
sz_website_help_test_assert(
	'repeated context scopes are rejected',
	false,
	sz_website_help_validate_context_round( [ 'scope' => 'editor_outline' ], [ $first_round['scope_key'] ], 2 )['valid'],
	$failures
);
sz_website_help_test_assert( 'third context expansion is rejected', false, sz_website_help_validate_context_round( [ 'scope' => 'object_identity' ], [], 3 )['valid'], $failures );

$history = [];
for ( $index = 0; $index < 12; $index++ ) {
	$history[] = [
		'role'      => 0 === $index % 2 ? 'user' : 'assistant',
		'content'   => 1 === $index ? 'Earlier gallery naming decision' : 'Unrelated message ' . $index,
		'timestamp' => $index,
	];
}
$selected_history = sz_website_help_select_history( $history, 'What was the gallery naming decision?', 4, 2, 1000 );
sz_website_help_test_assert( 'history includes a relevant older turn', true, in_array( 'Earlier gallery naming decision', array_column( $selected_history, 'content' ), true ), $failures );
sz_website_help_test_assert( 'history includes bounded recent turns', 5, count( $selected_history ), $failures );

$url_context = sz_website_help_sanitize_context_payload(
	[ 'scope' => 'blocks', 'indexes' => [ 0 ] ],
	[ 'blocks' => [ [ 'acf_fc_layout' => 'text_block', 'content' => 'See https://private.example.test/path for details.', 'link' => 'https://private.example.test/raw' ] ] ]
);
$url_context_json = json_encode( $url_context['context'] );
sz_website_help_test_assert( 'raw URLs are removed from context', false, strpos( $url_context_json, 'https://' ) !== false, $failures );
sz_website_help_test_assert( 'link fields are not included in context', false, strpos( $url_context_json, 'private.example.test/raw' ) !== false, $failures );

if ( ! empty( $failures ) ) {
	foreach ( $failures as $failure ) {
		fwrite( STDERR, "FAILED: {$failure['name']}\n" );
		fwrite( STDERR, 'Expected: ' . json_encode( $failure['expected'], JSON_PRETTY_PRINT ) . "\n" );
		fwrite( STDERR, 'Actual: ' . json_encode( $failure['actual'], JSON_PRETTY_PRINT ) . "\n\n" );
	}
	exit( 1 );
}

fwrite( STDOUT, "Passed 50 PHP website help tests.\n" );