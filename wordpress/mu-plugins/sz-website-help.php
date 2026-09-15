<?php
/**
 * Plugin Name: Studio Zanetti - Website Help
 * Description: Private, read-only WordPress guidance for Studio Zanetti editors.
 * Version: 1.0.0
 * Author: Studio Zanetti
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$sz_website_help_include = __DIR__ . '/includes/website-help.php';
if ( file_exists( $sz_website_help_include ) ) {
	require_once $sz_website_help_include;
}

function sz_website_help_enabled(): bool {
	return defined( 'SZ_WEBSITE_HELP_ENABLED' ) && true === SZ_WEBSITE_HELP_ENABLED;
}

function sz_website_help_manifest(): array {
	static $manifest = null;
	if ( null === $manifest ) {
		$manifest = sz_website_help_load_manifest( __DIR__ . '/website-help/manifest.php' );
	}

	return $manifest;
}

function sz_website_help_topics_directory(): string {
	return __DIR__ . '/website-help/topics';
}

add_action( 'init', function () {
	register_post_type( 'sz_help_thread', [
		'labels'              => [
			'name'          => __( 'Website Help Threads', 'studio-zanetti' ),
			'singular_name' => __( 'Website Help Thread', 'studio-zanetti' ),
		],
		'public'              => false,
		'publicly_queryable'  => false,
		'show_ui'             => false,
		'show_in_menu'        => false,
		'show_in_rest'        => false,
		'exclude_from_search' => true,
		'can_export'          => false,
		'supports'            => [ 'title', 'author' ],
		'map_meta_cap'        => false,
		'capabilities'        => [
			'create_posts'       => 'do_not_allow',
			'edit_post'          => 'do_not_allow',
			'read_post'          => 'do_not_allow',
			'delete_post'        => 'do_not_allow',
			'edit_posts'         => 'do_not_allow',
			'edit_others_posts'  => 'do_not_allow',
			'delete_posts'       => 'do_not_allow',
			'publish_posts'      => 'do_not_allow',
			'read_private_posts' => 'do_not_allow',
		],
	] );
} );

function sz_website_help_require_ajax(): void {
	if ( ! sz_website_help_enabled() ) {
		wp_send_json_error( [ 'message' => __( 'Website Help is currently unavailable.', 'studio-zanetti' ) ], 503 );
	}

	check_ajax_referer( 'sz_website_help', 'nonce' );
	if ( ! current_user_can( 'edit_pages' ) ) {
		wp_send_json_error( [ 'message' => __( 'You do not have permission to use Website Help.', 'studio-zanetti' ) ], 403 );
	}
}

function sz_website_help_get_owned_thread( int $thread_id ) {
	$thread = $thread_id > 0 ? get_post( $thread_id ) : null;
	if ( ! $thread instanceof WP_Post || 'sz_help_thread' !== $thread->post_type ) {
		return null;
	}

	return sz_website_help_user_can_access_thread(
		get_current_user_id(),
		(int) $thread->post_author,
		current_user_can( 'edit_pages' )
	) ? $thread : null;
}

function sz_website_help_create_thread( string $question = '' ) {
	$title = trim( sz_website_help_sanitize_scalar( $question, 80 ) );
	if ( '' === $title ) {
		$title = __( 'New website question', 'studio-zanetti' );
	}

	return wp_insert_post( [
		'post_type'   => 'sz_help_thread',
		'post_status' => 'private',
		'post_author' => get_current_user_id(),
		'post_title'  => $title,
	], true );
}

function sz_website_help_thread_messages( int $thread_id ): array {
	$messages = get_post_meta( $thread_id, '_sz_help_messages', true );

	return is_array( $messages ) ? $messages : [];
}

function sz_website_help_append_exchange( int $thread_id, string $question, array $answer, array $context_label ): bool {
	global $wpdb;

	$lock_name = 'sz_help_thread_' . $thread_id;
	$lock_acquired = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, %d)', $lock_name, 5 ) );
	if ( 1 !== $lock_acquired ) {
		return false;
	}

	try {
		$messages = sz_website_help_thread_messages( $thread_id );
		$timestamp = time();
		$messages[] = [
			'role'          => 'user',
			'content'       => sz_website_help_sanitize_scalar( $question, 4000 ),
			'timestamp'     => $timestamp,
			'context_label' => $context_label,
		];
		$messages[] = [
			'role'              => 'assistant',
			'content'           => sz_website_help_sanitize_scalar( $answer['answer'] ?? '', 12000 ),
			'status'            => $answer['status'] ?? 'uncertain',
			'developer_request' => $answer['developer_request'] ?? null,
			'source_topic_ids'  => $answer['source_topic_ids'] ?? [],
			'timestamp'         => $timestamp,
			'context_label'     => $context_label,
		];
		$updated = false !== update_post_meta( $thread_id, '_sz_help_messages', $messages );
		if ( $updated ) {
			wp_update_post( [ 'ID' => $thread_id, 'post_modified' => current_time( 'mysql' ) ] );
		}

		return $updated;
	} finally {
		$wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock_name ) );
	}
}

function sz_website_help_thread_payload( WP_Post $thread, bool $with_messages = false ): array {
	$payload = [
		'id'       => (int) $thread->ID,
		'title'    => get_the_title( $thread ),
		'pinned'   => (bool) get_post_meta( $thread->ID, '_sz_help_pinned', true ),
		'modified' => get_post_modified_time( DATE_ATOM, true, $thread ),
	];
	if ( $with_messages ) {
		$payload['messages'] = array_map( static function ( array $message ): array {
			if ( 'assistant' === ( $message['role'] ?? '' ) ) {
				$message['sources'] = sz_website_help_source_links( is_array( $message['source_topic_ids'] ?? null ) ? $message['source_topic_ids'] : [] );
			}

			return $message;
		}, sz_website_help_thread_messages( $thread->ID ) );
	}

	$payload['context_labels'] = array_values( array_filter( array_map( static function ( array $message ) {
		return is_array( $message['context_label'] ?? null ) ? $message['context_label'] : null;
	}, sz_website_help_thread_messages( $thread->ID ) ) ) );

	return $payload;
}

function sz_website_help_source_links( array $topic_ids ): array {
	$links = [];
	foreach ( sz_website_help_manifest()['topics'] ?? [] as $topic ) {
		if ( ! in_array( $topic['id'] ?? '', $topic_ids, true ) ) {
			continue;
		}

		$destination = $topic['admin_page'] ?? null;
		$url = '';
		if ( is_array( $destination ) && 'post_type' === ( $destination['type'] ?? '' ) ) {
			$url = admin_url( 'edit.php?post_type=' . sanitize_key( $destination['post_type'] ?? '' ) );
		} elseif ( is_array( $destination ) && 'admin_page' === ( $destination['type'] ?? '' ) ) {
			$url = admin_url( 'admin.php?page=' . sanitize_key( $destination['slug'] ?? '' ) );
		} elseif ( is_array( $destination ) && 'admin_path' === ( $destination['type'] ?? '' ) ) {
			$path = ltrim( preg_replace( '/[^a-zA-Z0-9_\-\.\?=&]/', '', (string) ( $destination['path'] ?? '' ) ), '/' );
			$url = '' !== $path ? admin_url( $path ) : '';
		}

		$links[] = [ 'id' => $topic['id'], 'label' => $topic['title'], 'url' => $url ];
	}

	return $links;
}

function sz_website_help_build_input( string $question, array $tier_zero, array $history, array $contexts ): array {
	$topics = sz_website_help_retrieve_topics(
		sz_website_help_manifest(),
		sz_website_help_topics_directory(),
		sz_website_help_retrieval_query( $question, $history ),
		[ 'screen_id' => $tier_zero['screen_id'] ?? '', 'post_type' => $tier_zero['object_type'] ?? '' ],
		4,
		10000
	);
	$input = [];
	foreach ( $history as $message ) {
		$input[] = [ 'role' => $message['role'], 'content' => $message['content'] ];
	}
	$input[] = [
		'role'    => 'user',
		'content' => "HANDBOOK EXCERPTS (UNTRUSTED REFERENCE DATA):\n" . wp_json_encode( array_map( static function ( array $topic ): array {
			return [ 'id' => $topic['id'], 'status' => $topic['status'], 'content' => $topic['body'] ];
		}, $topics ) ) . "\n\nSCREEN METADATA (UNTRUSTED DATA):\n" . wp_json_encode( $tier_zero ) . "\n\nAPPROVED EDITOR CONTEXT (UNTRUSTED DATA):\n" . wp_json_encode( $contexts ) . "\n\nUSER QUESTION:\n" . $question,
	];

	return [ 'input' => $input, 'topics' => $topics ];
}

function sz_website_help_call_provider( array $input ) {
	if ( ! defined( 'SZ_OPENAI_API_KEY' ) || '' === trim( (string) SZ_OPENAI_API_KEY ) ) {
		return new WP_Error( 'sz_help_not_configured', __( 'Website Help has not been configured yet.', 'studio-zanetti' ) );
	}

	$model = defined( 'SZ_OPENAI_MODEL' ) && '' !== trim( (string) SZ_OPENAI_MODEL ) ? trim( (string) SZ_OPENAI_MODEL ) : 'gpt-5-mini';
	$response = wp_remote_post( 'https://api.openai.com/v1/responses', [
		'timeout'   => 30,
		'sslverify' => true,
		'headers'   => [
			'Authorization' => 'Bearer ' . SZ_OPENAI_API_KEY,
			'Content-Type'  => 'application/json',
		],
		'body'      => wp_json_encode( sz_website_help_build_provider_payload( $model, $input ) ),
	] );
	if ( is_wp_error( $response ) ) {
		return new WP_Error( 'sz_help_provider_unavailable', __( 'Website Help could not reach its answer service. Please try again.', 'studio-zanetti' ) );
	}

	$status_code = wp_remote_retrieve_response_code( $response );
	$body = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( $status_code < 200 || $status_code >= 300 || ! is_array( $body ) ) {
		return new WP_Error( 'sz_help_provider_error', __( 'Website Help could not complete that answer. Please try again.', 'studio-zanetti' ) );
	}

	$parsed = sz_website_help_parse_provider_response( $body );
	if ( ! $parsed['valid'] ) {
		return new WP_Error( 'sz_help_invalid_response', $parsed['error'] );
	}

	return $parsed;
}

function sz_website_help_check_rate_limit() {
	global $wpdb;

	$user_id = get_current_user_id();
	$key = 'sz_help_rate_' . $user_id;
	$lock_name = 'sz_help_rate_' . $user_id;
	$lock_acquired = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, %d)', $lock_name, 2 ) );
	if ( 1 !== $lock_acquired ) {
		return new WP_Error( 'sz_help_rate_busy', __( 'Website Help is busy. Please try again.', 'studio-zanetti' ) );
	}

	try {
		$timestamps = get_transient( $key );
		$rate = sz_website_help_rate_limit_check( is_array( $timestamps ) ? $timestamps : [], time() );
		if ( ! $rate['allowed'] ) {
			return new WP_Error( 'sz_help_rate_limited', __( 'You have asked several questions recently. Please wait and try again.', 'studio-zanetti' ) );
		}
		set_transient( $key, $rate['timestamps'], DAY_IN_SECONDS );
	} finally {
		$wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock_name ) );
	}

	return true;
}

function sz_website_help_issue_context_token( array $record ): array {
	$token = sz_website_help_create_scope_token();
	$record = sz_website_help_scope_exchange_record(
		$record,
		$token,
		get_current_user_id(),
		$record['request'],
		time() + 300,
		$record['round']
	);
	set_transient( 'sz_help_scope_' . hash( 'sha256', $token ), $record, 300 );

	return [ 'token' => $token, 'request' => $record['request'], 'round' => $record['round'] ];
}

function sz_website_help_claim_context_record( string $token ) {
	global $wpdb;

	$token_hash = hash( 'sha256', $token );
	$transient_key = 'sz_help_scope_' . $token_hash;
	$lock_name = 'sz_help_' . substr( $token_hash, 0, 40 );
	$lock_acquired = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, %d)', $lock_name, 2 ) );
	if ( 1 !== $lock_acquired ) {
		return null;
	}

	$record = get_transient( $transient_key );
	delete_transient( $transient_key );
	$wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock_name ) );

	return is_array( $record ) ? $record : null;
}

function sz_website_help_process_answer( array $exchange ) {
	$thread = sz_website_help_get_owned_thread( (int) $exchange['thread_id'] );
	if ( ! $thread ) {
		return new WP_Error( 'sz_help_invalid_thread', __( 'That help conversation is unavailable.', 'studio-zanetti' ) );
	}

	$history = sz_website_help_select_history( sz_website_help_thread_messages( $thread->ID ), $exchange['question'] );
	$built = sz_website_help_build_input( $exchange['question'], $exchange['tier_zero'], $history, $exchange['contexts'] );
	$answer = sz_website_help_call_provider( $built['input'] );
	if ( is_wp_error( $answer ) ) {
		return $answer;
	}

	if ( 'context_request' === $answer['type'] ) {
		$round = (int) $exchange['round'] + 1;
		$round_validation = sz_website_help_validate_context_round( $answer['context_request'], $exchange['scope_keys'], $round );
		if ( ! $round_validation['valid'] || empty( $exchange['allow_context'] ) ) {
			return new WP_Error( 'sz_help_context_unavailable', __( 'More editor context was needed, but it was unavailable. Try asking with editor context enabled or ask the webmaster.', 'studio-zanetti' ) );
		}

		return [
			'type'    => 'context_request',
			'thread'  => sz_website_help_thread_payload( $thread ),
			'exchange' => sz_website_help_issue_context_token( array_merge( $exchange, [
				'request'    => $round_validation['request'],
				'round'      => $round,
				'scope_keys' => array_merge( $exchange['scope_keys'], [ $round_validation['scope_key'] ] ),
			] ) ),
		];
	}

	$topic_ids = array_column( $built['topics'], 'id' );
	$answer['source_topic_ids'] = array_values( array_intersect( $answer['source_topic_ids'], $topic_ids ) );
	$context_label = sz_website_help_context_label( $exchange['tier_zero'], $exchange['contexts'] );
	if ( ! sz_website_help_append_exchange( $thread->ID, $exchange['question'], $answer, $context_label ) ) {
		return new WP_Error( 'sz_help_history_busy', __( 'The answer was ready, but the conversation could not be updated. Please try again.', 'studio-zanetti' ) );
	}

	return [
		'type'          => 'final',
		'thread'        => sz_website_help_thread_payload( $thread, true ),
		'answer'        => $answer,
		'sources'       => sz_website_help_source_links( $answer['source_topic_ids'] ),
		'context_label' => $context_label,
	];
}

function sz_website_help_ajax_ask(): void {
	sz_website_help_require_ajax();
	$rate = sz_website_help_check_rate_limit();
	if ( is_wp_error( $rate ) ) {
		wp_send_json_error( [ 'message' => $rate->get_error_message() ], 429 );
	}

	$question = isset( $_POST['question'] ) ? trim( sanitize_textarea_field( wp_unslash( $_POST['question'] ) ) ) : '';
	if ( '' === $question || strlen( $question ) > 4000 ) {
		wp_send_json_error( [ 'message' => __( 'Enter a question of no more than 4,000 characters.', 'studio-zanetti' ) ], 400 );
	}

	$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
	$thread = $thread_id ? sz_website_help_get_owned_thread( $thread_id ) : null;
	if ( $thread_id && ! $thread ) {
		wp_send_json_error( [ 'message' => __( 'That help conversation is unavailable.', 'studio-zanetti' ) ], 404 );
	}
	if ( ! $thread ) {
		$thread_id = sz_website_help_create_thread( $question );
		if ( is_wp_error( $thread_id ) ) {
			wp_send_json_error( [ 'message' => __( 'The help conversation could not be created.', 'studio-zanetti' ) ], 500 );
		}
	}

	$raw_tier_zero = isset( $_POST['tier_zero'] ) ? json_decode( wp_unslash( $_POST['tier_zero'] ), true ) : [];
	$exchange = [
		'thread_id'    => (int) $thread_id,
		'question'     => $question,
		'tier_zero'    => sz_website_help_tier_zero_context( is_array( $raw_tier_zero ) ? $raw_tier_zero : [] ),
		'contexts'     => [],
		'scope_keys'   => [],
		'round'        => 0,
		'allow_context' => ! empty( $_POST['allow_context'] ),
	];
	$result = sz_website_help_process_answer( $exchange );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( [ 'message' => $result->get_error_message(), 'thread_id' => (int) $thread_id ], 502 );
	}

	wp_send_json_success( $result );
}
add_action( 'wp_ajax_sz_website_help_ask', 'sz_website_help_ajax_ask' );

function sz_website_help_ajax_context(): void {
	sz_website_help_require_ajax();
	$token = isset( $_POST['token'] ) ? sanitize_text_field( wp_unslash( $_POST['token'] ) ) : '';
	$record = sz_website_help_claim_context_record( $token );
	$validation = sz_website_help_validate_scope_token_record( is_array( $record ) ? $record : [], $token, get_current_user_id(), time() );
	if ( ! $validation['valid'] ) {
		wp_send_json_error( [ 'message' => $validation['error'] ], 400 );
	}

	$raw_payload = isset( $_POST['context'] ) ? json_decode( wp_unslash( $_POST['context'] ), true ) : [];
	$sanitized = sz_website_help_sanitize_context_payload( $validation['request'], is_array( $raw_payload ) ? $raw_payload : [] );
	if ( ! $sanitized['valid'] ) {
		wp_send_json_error( [ 'message' => $sanitized['error'] ], 400 );
	}

	$record['contexts'][] = [ 'scope' => $sanitized['scope'], 'data' => $sanitized['context'] ];
	$record['round'] = $validation['round'];
	$result = sz_website_help_process_answer( $record );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( [ 'message' => $result->get_error_message() ], 502 );
	}

	wp_send_json_success( $result );
}
add_action( 'wp_ajax_sz_website_help_context', 'sz_website_help_ajax_context' );

function sz_website_help_ajax_threads(): void {
	sz_website_help_require_ajax();
	$query = new WP_Query( [
		'post_type'      => 'sz_help_thread',
		'post_status'    => 'private',
		'author'         => get_current_user_id(),
		'posts_per_page' => -1,
		'orderby'        => 'modified',
		'order'          => 'DESC',
	] );
	$search = isset( $_POST['search'] ) ? strtolower( sanitize_text_field( wp_unslash( $_POST['search'] ) ) ) : '';
	$threads = [];
	foreach ( $query->posts as $thread ) {
		$payload = sz_website_help_thread_payload( $thread );
		if ( '' !== $search ) {
			$haystack = strtolower( $payload['title'] . ' ' . wp_json_encode( sz_website_help_thread_messages( $thread->ID ) ) );
			if ( false === strpos( $haystack, $search ) ) {
				continue;
			}
		}
		$threads[] = $payload;
	}
	usort( $threads, static function ( array $left, array $right ): int {
		if ( $left['pinned'] !== $right['pinned'] ) {
			return $left['pinned'] ? -1 : 1;
		}

		return strcmp( $right['modified'], $left['modified'] );
	} );
	wp_send_json_success( [ 'threads' => $threads ] );
}
add_action( 'wp_ajax_sz_website_help_threads', 'sz_website_help_ajax_threads' );

function sz_website_help_ajax_get_thread(): void {
	sz_website_help_require_ajax();
	$thread = sz_website_help_get_owned_thread( isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0 );
	if ( ! $thread ) {
		wp_send_json_error( [ 'message' => __( 'That help conversation is unavailable.', 'studio-zanetti' ) ], 404 );
	}
	wp_send_json_success( [ 'thread' => sz_website_help_thread_payload( $thread, true ) ] );
}
add_action( 'wp_ajax_sz_website_help_get_thread', 'sz_website_help_ajax_get_thread' );

function sz_website_help_ajax_create_thread(): void {
	sz_website_help_require_ajax();
	$thread_id = sz_website_help_create_thread();
	if ( is_wp_error( $thread_id ) ) {
		wp_send_json_error( [ 'message' => __( 'The help conversation could not be created.', 'studio-zanetti' ) ], 500 );
	}
	wp_send_json_success( [ 'thread' => sz_website_help_thread_payload( get_post( $thread_id ), true ) ] );
}
add_action( 'wp_ajax_sz_website_help_create_thread', 'sz_website_help_ajax_create_thread' );

function sz_website_help_ajax_update_thread(): void {
	sz_website_help_require_ajax();
	$thread = sz_website_help_get_owned_thread( isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0 );
	if ( ! $thread ) {
		wp_send_json_error( [ 'message' => __( 'That help conversation is unavailable.', 'studio-zanetti' ) ], 404 );
	}
	if ( isset( $_POST['title'] ) ) {
		$title = substr( sanitize_text_field( wp_unslash( $_POST['title'] ) ), 0, 100 );
		if ( '' !== $title ) {
			wp_update_post( [ 'ID' => $thread->ID, 'post_title' => $title ] );
		}
	}
	if ( isset( $_POST['pinned'] ) ) {
		update_post_meta( $thread->ID, '_sz_help_pinned', '1' === (string) $_POST['pinned'] ? 1 : 0 );
	}
	wp_send_json_success( [ 'thread' => sz_website_help_thread_payload( get_post( $thread->ID ), true ) ] );
}
add_action( 'wp_ajax_sz_website_help_update_thread', 'sz_website_help_ajax_update_thread' );

function sz_website_help_ajax_delete_thread(): void {
	sz_website_help_require_ajax();
	$thread = sz_website_help_get_owned_thread( isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0 );
	if ( ! $thread ) {
		wp_send_json_error( [ 'message' => __( 'That help conversation is unavailable.', 'studio-zanetti' ) ], 404 );
	}
	wp_delete_post( $thread->ID, true );
	wp_send_json_success();
}
add_action( 'wp_ajax_sz_website_help_delete_thread', 'sz_website_help_ajax_delete_thread' );

function sz_website_help_ajax_delete_all(): void {
	sz_website_help_require_ajax();
	$thread_ids = get_posts( [
		'post_type'      => 'sz_help_thread',
		'post_status'    => 'private',
		'author'         => get_current_user_id(),
		'posts_per_page' => -1,
		'fields'         => 'ids',
	] );
	foreach ( $thread_ids as $thread_id ) {
		wp_delete_post( $thread_id, true );
	}
	wp_send_json_success();
}
add_action( 'wp_ajax_sz_website_help_delete_all', 'sz_website_help_ajax_delete_all' );

function sz_website_help_render_app( string $mode ): void {
	?>
	<div class="sz-website-help-app" data-mode="<?php echo esc_attr( $mode ); ?>">
		<div class="sz-website-help-layout">
			<aside class="sz-website-help-history" aria-label="<?php esc_attr_e( 'Help conversations', 'studio-zanetti' ); ?>">
				<div class="sz-website-help-history__toolbar">
					<button type="button" class="button" data-help-new><?php esc_html_e( 'New conversation', 'studio-zanetti' ); ?></button>
					<input type="search" data-help-search placeholder="<?php esc_attr_e( 'Search history', 'studio-zanetti' ); ?>" aria-label="<?php esc_attr_e( 'Search help history', 'studio-zanetti' ); ?>">
					<select data-help-context-filter aria-label="<?php esc_attr_e( 'Filter help history by page or screen', 'studio-zanetti' ); ?>">
						<option value=""><?php esc_html_e( 'All pages and screens', 'studio-zanetti' ); ?></option>
					</select>
				</div>
				<div data-help-threads></div>
				<button type="button" class="button-link-delete" data-help-delete-all><?php esc_html_e( 'Delete all my help history', 'studio-zanetti' ); ?></button>
			</aside>
			<section class="sz-website-help-conversation" aria-label="<?php esc_attr_e( 'Website Help conversation', 'studio-zanetti' ); ?>">
				<div class="sz-website-help-empty" data-help-empty>
					<h2><?php esc_html_e( 'What do you need help with?', 'studio-zanetti' ); ?></h2>
					<div class="sz-website-help-starters">
						<button type="button" class="button" data-help-starter="How do I add a gallery to a page?"><?php esc_html_e( 'Add a gallery', 'studio-zanetti' ); ?></button>
						<button type="button" class="button" data-help-starter="How do I update the main menu?"><?php esc_html_e( 'Update a menu', 'studio-zanetti' ); ?></button>
						<button type="button" class="button" data-help-starter="How do I improve a page for search engines?"><?php esc_html_e( 'Improve page SEO', 'studio-zanetti' ); ?></button>
					</div>
				</div>
				<div class="sz-website-help-messages" data-help-messages aria-live="polite"></div>
				<form class="sz-website-help-composer" data-help-form>
					<label for="sz-help-question-<?php echo esc_attr( $mode ); ?>"><?php esc_html_e( 'Ask about this website', 'studio-zanetti' ); ?></label>
					<textarea id="sz-help-question-<?php echo esc_attr( $mode ); ?>" data-help-question rows="3" maxlength="4000" required></textarea>
					<label class="sz-website-help-context" data-help-context-option>
						<input type="checkbox" data-help-allow-context checked>
						<span><?php esc_html_e( 'Use my current unsaved edits when needed', 'studio-zanetti' ); ?></span>
					</label>
					<p class="description" data-help-privacy><?php esc_html_e( 'Only the specific editor details needed for this answer are sent to OpenAI. Raw editor context is not stored in help history.', 'studio-zanetti' ); ?></p>
					<div class="sz-website-help-composer__actions">
						<span data-help-status aria-live="polite"></span>
						<button type="submit" class="button button-primary"><?php esc_html_e( 'Ask', 'studio-zanetti' ); ?></button>
					</div>
				</form>
			</section>
		</div>
	</div>
	<?php
}

function sz_website_help_render_page(): void {
	if ( ! current_user_can( 'edit_pages' ) ) {
		wp_die( esc_html__( 'You do not have permission to use Website Help.', 'studio-zanetti' ) );
	}
	?>
	<div class="wrap sz-website-help-page">
		<h1><?php esc_html_e( 'Website Help', 'studio-zanetti' ); ?></h1>
		<?php if ( ! defined( 'SZ_OPENAI_API_KEY' ) || '' === trim( (string) SZ_OPENAI_API_KEY ) ) : ?>
			<div class="notice notice-warning inline"><p><?php esc_html_e( 'Website Help is enabled but its OpenAI key is not configured.', 'studio-zanetti' ); ?></p></div>
		<?php endif; ?>
		<?php sz_website_help_render_app( 'page' ); ?>
	</div>
	<?php
}

add_action( 'admin_menu', function () {
	if ( ! sz_website_help_enabled() ) {
		return;
	}
	add_menu_page(
		__( 'Website Help', 'studio-zanetti' ),
		__( 'Website Help', 'studio-zanetti' ),
		'edit_pages',
		'sz-website-help',
		'sz_website_help_render_page',
		'dashicons-editor-help',
		26
	);
} );

add_action( 'admin_enqueue_scripts', function () {
	if ( ! sz_website_help_enabled() || ! current_user_can( 'edit_pages' ) ) {
		return;
	}

	$script_path = __DIR__ . '/assets/website-help.js';
	$style_path = __DIR__ . '/assets/website-help.css';
	wp_enqueue_style( 'dashicons' );
	wp_enqueue_style( 'sz-website-help', plugins_url( 'assets/website-help.css', __FILE__ ), [], filemtime( $style_path ) );
	wp_enqueue_script( 'sz-website-help', plugins_url( 'assets/website-help.js', __FILE__ ), [], filemtime( $script_path ), true );

	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	$post_type = $screen && isset( $screen->post_type ) ? (string) $screen->post_type : '';
	wp_localize_script( 'sz-website-help', 'szWebsiteHelp', [
		'ajaxUrl'              => admin_url( 'admin-ajax.php' ),
		'nonce'                => wp_create_nonce( 'sz_website_help' ),
		'screenId'             => $screen ? (string) $screen->id : '',
		'screenLabel'          => $screen ? (string) $screen->base : '',
		'objectType'           => $post_type,
		'liveContextAvailable' => $screen && 'post' === $screen->base && in_array( $post_type, [ 'page', 'post', 'sz_gallery' ], true ),
		'strings'              => [
			'loading'       => __( 'Checking the website handbook...', 'studio-zanetti' ),
			'context'       => __( 'Checking the requested editor details...', 'studio-zanetti' ),
			'error'         => __( 'Website Help could not complete that request.', 'studio-zanetti' ),
			'confirmDelete' => __( 'Delete this conversation permanently?', 'studio-zanetti' ),
			'confirmAll'    => __( 'Delete all of your Website Help history permanently?', 'studio-zanetti' ),
		],
	] );
} );

add_action( 'admin_footer', function () {
	if ( ! sz_website_help_enabled() || ! current_user_can( 'edit_pages' ) ) {
		return;
	}
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( $screen && 'toplevel_page_sz-website-help' === $screen->id ) {
		return;
	}
	?>
	<button type="button" class="sz-website-help-launcher" aria-controls="sz-website-help-drawer" aria-expanded="false">
		<span class="dashicons dashicons-editor-help" aria-hidden="true"></span>
		<span><?php esc_html_e( 'Website Help', 'studio-zanetti' ); ?></span>
	</button>
	<div class="sz-website-help-backdrop" hidden></div>
	<aside id="sz-website-help-drawer" class="sz-website-help-drawer" role="dialog" aria-modal="true" aria-labelledby="sz-website-help-drawer-title" hidden>
		<header>
			<h2 id="sz-website-help-drawer-title"><?php esc_html_e( 'Website Help', 'studio-zanetti' ); ?></h2>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=sz-website-help' ) ); ?>"><?php esc_html_e( 'Open full page', 'studio-zanetti' ); ?></a>
			<button type="button" class="sz-website-help-close" aria-label="<?php esc_attr_e( 'Close Website Help', 'studio-zanetti' ); ?>">
				<span class="dashicons dashicons-no-alt" aria-hidden="true"></span>
			</button>
		</header>
		<?php sz_website_help_render_app( 'drawer' ); ?>
	</aside>
	<?php
} );