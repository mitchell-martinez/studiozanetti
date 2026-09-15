(function () {
	'use strict';

	var config = window.szWebsiteHelp;
	if (!config) return;

	var activeThreadId = 0;
	var hasUnsavedChanges = false;
	var lastFocusedElement = null;
	var activeController = null;
	var activeOperationId = 0;

	document.addEventListener('change', function (event) {
		if (event.target && event.target.closest && event.target.closest('#post')) hasUnsavedChanges = true;
	});
	document.addEventListener('input', function (event) {
		if (event.target && event.target.closest && event.target.closest('#post')) hasUnsavedChanges = true;
	});

	function request(action, values, signal) {
		var body = new FormData();
		body.append('action', action);
		body.append('nonce', config.nonce);
		Object.keys(values || {}).forEach(function (key) {
			body.append(key, values[key]);
		});
		return fetch(config.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: body, signal: signal })
			.then(function (response) { return response.json(); })
			.then(function (payload) {
				if (!payload.success) {
					var error = new Error(payload.data && payload.data.message ? payload.data.message : config.strings.error);
					error.threadId = Number(payload.data && payload.data.thread_id ? payload.data.thread_id : 0);
					throw error;
				}
				return payload.data;
			});
	}

	function cancelActiveAnswer() {
		activeOperationId += 1;
		if (activeController) activeController.abort();
		activeController = null;
	}

	function staleOperationError() {
		var error = new Error('This request was superseded.');
		error.name = 'AbortError';
		return error;
	}

	function tierZero() {
		var editor = window.tinyMCE && window.tinyMCE.get ? window.tinyMCE.get('content') : null;
		var editorIsDirty = Boolean(editor && editor.isDirty && editor.isDirty());
		var autosaveIsDirty = Boolean(window.wp && window.wp.autosave && window.wp.autosave.server && window.wp.autosave.server.postChanged && window.wp.autosave.server.postChanged());
		return {
			screen_id: config.screenId,
			screen_label: config.screenLabel,
			object_type: config.objectType,
			has_unsaved_changes: hasUnsavedChanges || editorIsDirty || autosaveIsDirty,
			live_context_available: Boolean(config.liveContextAvailable)
		};
	}

	function scalarFieldValue(field) {
		if (!field) return '';
		if (field.type === 'checkbox') return field.checked;
		if (field.type === 'radio') {
			var selected = document.querySelector('[name="' + CSS.escape(field.name) + '"]:checked');
			return selected ? selected.value : '';
		}
		return field.value || '';
	}

	function safeBlockValue(row) {
		var allowed = [
			'acf_fc_layout', 'title', 'heading', 'heading_level', 'heading_tag', 'description', 'caption',
			'subtitle', 'tagline', 'content', 'text', 'intro', 'submit_text', 'success_message',
			'delivery_target', 'alignment', 'heading_align', 'form_alignment', 'layout_style', 'columns',
			'style', 'color_theme', 'aria_label', 'button_text'
		];
		var value = { acf_fc_layout: row.getAttribute('data-layout') || '' };
		row.querySelectorAll('[data-name]').forEach(function (fieldWrap) {
			var key = fieldWrap.getAttribute('data-name');
			if (allowed.indexOf(key) === -1 || Object.prototype.hasOwnProperty.call(value, key)) return;
			var field = fieldWrap.querySelector('input:not([type="hidden"]), textarea, select');
			if (field) value[key] = scalarFieldValue(field);
		});
		if (value.acf_fc_layout === 'form_block') {
			value.fields = Array.prototype.map.call(row.querySelectorAll('[data-name="fields"] .acf-row:not(.acf-clone)'), function (fieldRow) {
				return visibleFieldGroup.call(null, ['label', 'type', 'help_text', 'required'].map(function (key) { return key; }), fieldRow);
			}).filter(function (field) { return Object.keys(field).length; });
		}
		return value;
	}

	function blockRows() {
		return Array.prototype.slice.call(document.querySelectorAll('.acf-flexible-content .layout[data-layout]'));
	}

	function visibleFieldGroup(keys, root) {
		var group = {};
		root = root || document;
		(keys || []).forEach(function (key) {
			var wraps = root.querySelectorAll('.acf-field[data-name="' + CSS.escape(key) + '"]');
			Array.prototype.some.call(wraps, function (wrap) {
				if (wrap.offsetParent === null) return false;
				var field = wrap.querySelector('input:not([type="hidden"]):not([type="file"]), textarea, select');
				if (!field || /email|url|password/i.test(field.type || '') || /email|url|recipient|webhook/i.test(field.name || '')) return false;
				group[key] = scalarFieldValue(field);
				return true;
			});
		});
		return group;
	}

	function editorText() {
		var editor = window.tinyMCE && window.tinyMCE.get ? window.tinyMCE.get('content') : null;
		if (editor && !editor.isHidden()) return editor.getContent({ format: 'text' });
		var textarea = document.getElementById('content');
		return textarea ? textarea.value : '';
	}

	function extractContext(scopeRequest) {
		var scope = scopeRequest.scope;
		if (scope === 'object_identity') {
			return {
				id: Number((document.getElementById('post_ID') || {}).value || 0),
				title: ((document.getElementById('title') || {}).value || ''),
				slug: ((document.getElementById('post_name') || {}).value || ''),
				status: ((document.getElementById('post_status') || {}).value || ''),
				parent: Number((document.getElementById('parent_id') || {}).value || 0)
			};
		}
		if (scope === 'editor_outline') {
			return {
				blocks: blockRows().map(function (row, index) {
					var label = row.querySelector('.acf-fc-layout-handle');
					return { index: index, layout: row.getAttribute('data-layout') || '', label: label ? label.textContent.trim() : '' };
				}),
				sections: Array.prototype.map.call(document.querySelectorAll('.postbox .hndle'), function (heading) { return heading.textContent.trim(); })
			};
		}
		if (scope === 'blocks') {
			var rows = blockRows();
			var blocks = [];
			(scopeRequest.indexes || []).forEach(function (index) {
				if (rows[index]) blocks[index] = safeBlockValue(rows[index]);
			});
			return { blocks: blocks };
		}
		if (scope === 'gallery_summary') {
			var galleryRows = document.querySelectorAll('[data-name="images"] .acf-row:not(.acf-clone)');
			var captions = document.querySelectorAll('[data-name="caption"] input, [data-name="caption"] textarea');
			return { image_count: galleryRows.length, has_captions: Array.prototype.some.call(captions, function (field) { return Boolean(field.value.trim()); }) };
		}
		if (scope === 'field_group') {
			var allowedGroups = {
				page_settings: ['page_description', 'menu_override', 'container_only', 'service_reference', 'is_venue_page'],
				seo: ['page_description'],
				form_visible_fields: ['heading', 'intro', 'submit_text', 'success_message', 'delivery_target'],
				post_content: []
			};
			var group = visibleFieldGroup(allowedGroups[scopeRequest.field_group] || []);
			if (scopeRequest.field_group === 'post_content') group.content = editorText();
			return group;
		}
		if (scope === 'full_object') {
			return Object.assign(extractContext({ scope: 'object_identity' }), { blocks: blockRows().map(safeBlockValue) });
		}
		return {};
	}

	function sourceLinks(sources) {
		var sourceNav = document.createElement('nav');
		sourceNav.className = 'sz-website-help-sources';
		sourceNav.setAttribute('aria-label', 'Answer sources and related WordPress screens');
		(sources || []).forEach(function (source) {
			if (source.url) {
				var link = document.createElement('a');
				link.className = 'button';
				link.href = source.url;
				link.textContent = source.label;
				sourceNav.appendChild(link);
				return;
			}
			var citation = document.createElement('span');
			citation.className = 'sz-website-help-source-label';
			citation.textContent = source.label;
			sourceNav.appendChild(citation);
		});
		return sourceNav;
	}

	function copyButton(value, label) {
		var button = document.createElement('button');
		button.type = 'button';
		button.className = 'button button-small';
		button.textContent = label;
		button.addEventListener('click', function () {
			navigator.clipboard.writeText(value).then(function () { button.textContent = 'Copied'; });
		});
		return button;
	}

	function contextSummary(label) {
		if (!label || !(label.scopes || []).length) return null;
		var details = document.createElement('details');
		details.className = 'sz-website-help-context-used';
		var summary = document.createElement('summary');
		summary.textContent = 'Context used';
		var parts = [];
		if (label.screen) parts.push(label.screen);
		if (label.object_title) parts.push(label.object_title);
		if ((label.block_names || []).length) parts.push('Blocks: ' + label.block_names.join(', '));
		parts.push('Scopes: ' + label.scopes.join(', '));
		var body = document.createElement('p');
		body.textContent = parts.join(' | ');
		details.append(summary, body);
		return details;
	}

	function renderMessages(app, messages, sources) {
		var container = app.querySelector('[data-help-messages]');
		var empty = app.querySelector('[data-help-empty]');
		container.replaceChildren();
		(messages || []).forEach(function (message) {
			var article = document.createElement('article');
			article.className = 'sz-website-help-message sz-website-help-message--' + message.role;
			var label = document.createElement('strong');
			label.textContent = message.role === 'assistant' ? 'Website Help' : 'You';
			var content = document.createElement('div');
			content.className = 'sz-website-help-message__content';
			content.textContent = message.content || '';
			article.append(label, content);
			if (message.developer_request) {
				var requestBox = document.createElement('pre');
				requestBox.textContent = message.developer_request;
				article.append(requestBox, copyButton(message.developer_request, 'Copy request'));
			}
			if (message.technical_details) {
				var technical = document.createElement('details');
				var technicalSummary = document.createElement('summary');
				technicalSummary.textContent = 'Technical details';
				var technicalBody = document.createElement('p');
				technicalBody.textContent = message.technical_details;
				technical.append(technicalSummary, technicalBody);
				article.appendChild(technical);
			}
			var usedContext = contextSummary(message.context_label);
			if (usedContext) article.appendChild(usedContext);
			if (message.sources && message.sources.length) article.appendChild(sourceLinks(message.sources));
			container.appendChild(article);
		});
		if (sources && sources.length) {
			container.appendChild(sourceLinks(sources));
		}
		empty.hidden = Boolean(messages && messages.length);
		container.scrollTop = container.scrollHeight;
	}

	function threadContextValues(thread) {
		var values = [];
		(thread.context_labels || []).forEach(function (label) {
			[label.screen, label.object_title].concat(label.block_names || []).forEach(function (value) {
				if (value && values.indexOf(value) === -1) values.push(value);
			});
		});
		return values;
	}

	function renderThreads(app, threads) {
		var container = app.querySelector('[data-help-threads]');
		var filter = app.querySelector('[data-help-context-filter]');
		var selected = filter ? filter.value : '';
		var options = [];
		(threads || []).forEach(function (thread) { threadContextValues(thread).forEach(function (value) { if (options.indexOf(value) === -1) options.push(value); }); });
		if (filter) {
			filter.replaceChildren(new Option('All pages and screens', ''));
			options.sort().forEach(function (value) { filter.add(new Option(value, value)); });
			filter.value = selected;
		}
		container.replaceChildren();
		(threads || []).forEach(function (thread) {
			if (selected && threadContextValues(thread).indexOf(selected) === -1) return;
			var row = document.createElement('div');
			row.className = 'sz-website-help-thread';
			if (thread.id === activeThreadId) row.classList.add('is-active');
			var open = document.createElement('button');
			open.type = 'button';
			open.className = 'sz-website-help-thread__open';
			open.textContent = (thread.pinned ? 'Pinned: ' : '') + thread.title;
			open.addEventListener('click', function () {
				cancelActiveAnswer();
				var operationId = activeOperationId;
				request('sz_website_help_get_thread', { thread_id: thread.id }).then(function (data) {
					if (operationId !== activeOperationId) return;
					activeThreadId = thread.id;
					document.querySelectorAll('.sz-website-help-app').forEach(function (target) { renderMessages(target, data.thread.messages); loadThreads(target); });
				});
			});
			var pin = document.createElement('button');
			pin.type = 'button';
			pin.className = 'button-link';
			pin.textContent = thread.pinned ? 'Unpin' : 'Pin';
			pin.addEventListener('click', function () {
				request('sz_website_help_update_thread', { thread_id: thread.id, pinned: thread.pinned ? '0' : '1' }).then(function () { loadThreads(app); });
			});
			var rename = document.createElement('button');
			rename.type = 'button';
			rename.className = 'button-link';
			rename.textContent = 'Rename';
			rename.addEventListener('click', function () {
				var title = window.prompt('Conversation name', thread.title);
				if (title) request('sz_website_help_update_thread', { thread_id: thread.id, title: title }).then(function () { loadThreads(app); });
			});
			var remove = document.createElement('button');
			remove.type = 'button';
			remove.className = 'button-link-delete';
			remove.textContent = 'Delete';
			remove.addEventListener('click', function () {
				if (!window.confirm(config.strings.confirmDelete)) return;
				request('sz_website_help_delete_thread', { thread_id: thread.id }).then(function () {
					if (activeThreadId === thread.id) { activeThreadId = 0; renderMessages(app, []); }
					loadThreads(app);
				});
			});
			row.append(open, pin, rename, remove);
			container.appendChild(row);
		});
	}

	function loadThreads(app) {
		var search = app.querySelector('[data-help-search]');
		var requestId = (app.szHelpHistoryRequestId || 0) + 1;
		app.szHelpHistoryRequestId = requestId;
		return request('sz_website_help_threads', { search: search ? search.value : '' }).then(function (data) {
			if (requestId === app.szHelpHistoryRequestId) renderThreads(app, data.threads);
		});
	}

	function contextIsAllowed(scopeRequest) {
		var scope = (scopeRequest.scope || 'editor fields').replace(/_/g, ' ');
		var detail = scopeRequest.field_group ? ' (' + scopeRequest.field_group.replace(/_/g, ' ') + ')' : '';
		var reason = scopeRequest.reason ? '\n\nReason: ' + scopeRequest.reason : '';
		return window.confirm('Website Help would like to read this scope from the current editor: ' + scope + detail + '.' + reason + '\n\nThis read-only context is sent only for this answer and raw field values are not saved in conversation history. Continue?');
	}

	function continueExchange(app, result, signal, operationId) {
		if (operationId !== activeOperationId) return Promise.reject(staleOperationError());
		if (result.type === 'final') {
			activeThreadId = result.thread.id;
			renderMessages(app, result.thread.messages);
			loadThreads(app);
			return Promise.resolve(result);
		}

		activeThreadId = result.thread.id;
		app.querySelector('[data-help-status]').textContent = config.strings.context;
		if (!contextIsAllowed(result.exchange.request)) {
			var declined = new Error('Context was not shared. Your question was not added to history; clarify it or turn off editor context and try again.');
			declined.name = 'ContextDeclined';
			return Promise.reject(declined);
		}
		var context = extractContext(result.exchange.request);
		return request('sz_website_help_context', {
			token: result.exchange.token,
			context: JSON.stringify(context)
		}, signal).then(function (next) { return continueExchange(app, next, signal, operationId); });
	}

	function initializeApp(app) {
		var form = app.querySelector('[data-help-form]');
		var question = app.querySelector('[data-help-question]');
		var status = app.querySelector('[data-help-status]');
		var contextOption = app.querySelector('[data-help-context-option]');
		contextOption.hidden = !config.liveContextAvailable;

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			var value = question.value.trim();
			if (!value) return;
			var submit = form.querySelector('[type="submit"]');
			if (activeController) activeController.abort();
			var controller = new AbortController();
			var operationId = ++activeOperationId;
			activeController = controller;
			submit.disabled = true;
			status.textContent = config.strings.loading;
			request('sz_website_help_ask', {
				thread_id: activeThreadId,
				question: value,
				tier_zero: JSON.stringify(tierZero()),
				allow_context: app.querySelector('[data-help-allow-context]').checked ? '1' : '0'
			}, controller.signal).then(function (result) {
				return continueExchange(app, result, controller.signal, operationId);
			}).then(function () {
				if (operationId !== activeOperationId) return;
				question.value = '';
				status.textContent = '';
			}).catch(function (error) {
				if (error.name === 'AbortError') return;
				if (error.threadId) {
					activeThreadId = error.threadId;
					loadThreads(app);
				}
				status.textContent = error.message || config.strings.error;
			}).finally(function () {
				submit.disabled = false;
				if (activeController === controller) activeController = null;
			});
		});

		app.querySelectorAll('[data-help-starter]').forEach(function (button) {
			button.addEventListener('click', function () { question.value = button.getAttribute('data-help-starter') || ''; question.focus(); });
		});
		app.querySelector('[data-help-new]').addEventListener('click', function () {
			cancelActiveAnswer();
			var operationId = activeOperationId;
			request('sz_website_help_create_thread', {}).then(function (data) {
				if (operationId !== activeOperationId) return;
				activeThreadId = data.thread.id;
				renderMessages(app, []);
				loadThreads(app);
				question.focus();
			});
		});
		app.querySelector('[data-help-search]').addEventListener('input', function () { loadThreads(app); });
		app.querySelector('[data-help-context-filter]').addEventListener('change', function () { loadThreads(app); });
		var messages = app.querySelector('[data-help-messages]');
		var scrollButton = document.createElement('button');
		scrollButton.type = 'button';
		scrollButton.className = 'button sz-website-help-scroll';
		scrollButton.textContent = 'Back to question';
		scrollButton.hidden = true;
		messages.insertAdjacentElement('afterend', scrollButton);
		scrollButton.addEventListener('click', function () { question.focus(); });
		new MutationObserver(function () { scrollButton.hidden = messages.scrollHeight < messages.clientHeight * 1.5; }).observe(messages, { childList: true });
		app.querySelector('[data-help-delete-all]').addEventListener('click', function () {
			if (!window.confirm(config.strings.confirmAll)) return;
			request('sz_website_help_delete_all', {}).then(function () { activeThreadId = 0; renderMessages(app, []); loadThreads(app); });
		});
		loadThreads(app).catch(function (error) { status.textContent = error.message || config.strings.error; });
	}

	document.querySelectorAll('.sz-website-help-app').forEach(initializeApp);

	var launcher = document.querySelector('.sz-website-help-launcher');
	var drawer = document.querySelector('.sz-website-help-drawer');
	var backdrop = document.querySelector('.sz-website-help-backdrop');
	var closeButton = drawer ? drawer.querySelector('.sz-website-help-close') : null;
	function closeDrawer() {
		if (!drawer) return;
		cancelActiveAnswer();
		drawer.hidden = true;
		backdrop.hidden = true;
		launcher.setAttribute('aria-expanded', 'false');
		document.body.classList.remove('sz-website-help-open');
		if (lastFocusedElement) lastFocusedElement.focus();
	}
	if (launcher && drawer) {
		launcher.addEventListener('click', function () {
			lastFocusedElement = document.activeElement;
			drawer.hidden = false;
			backdrop.hidden = false;
			launcher.setAttribute('aria-expanded', 'true');
			document.body.classList.add('sz-website-help-open');
			drawer.querySelector('[data-help-question]').focus();
		});
		closeButton.addEventListener('click', closeDrawer);
		backdrop.addEventListener('click', closeDrawer);
		drawer.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') closeDrawer();
			if (event.key !== 'Tab') return;
			var focusable = drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])');
			if (!focusable.length) return;
			var first = focusable[0];
			var last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
			if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
		});
	}
}());