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
					error.reportState = payload.data && payload.data.report_state ? payload.data.report_state : '';
					throw error;
				}
				return payload.data;
			});
	}

	function cancelActiveAnswer() {
		activeOperationId += 1;
		if (activeController) activeController.abort();
		activeController = null;
		document.querySelectorAll('.sz-website-help-app').forEach(function (app) {
			if (app.classList.contains('is-busy')) setBusy(app, false);
			setStatus(app, '');
		});
	}

	function setActiveThread(threadId) {
		activeThreadId = threadId;
		var fragment = threadId > 0 ? 'thread=' + threadId : '';
		var expand = document.querySelector('.sz-website-help-expand');
		if (expand) expand.hash = fragment;
		if (document.querySelector('.sz-website-help-app[data-mode="page"]')) {
			var url = new URL(window.location.href);
			url.hash = fragment;
			window.history.replaceState(null, '', url);
		}
	}

	function setBusy(app, busy) {
		app.classList.toggle('is-busy', busy);
		var send = app.querySelector('[data-help-form] [type="submit"]');
		var label = busy ? config.strings.thinking : config.strings.send;
		send.disabled = busy;
		send.setAttribute('aria-label', label);
		send.setAttribute('aria-busy', String(busy));
		send.title = label;
	}

	function setStatus(app, message) {
		var historyOnly = app.querySelector('.sz-website-help-conversation').hidden;
		app.querySelector('[data-help-status]').textContent = historyOnly ? '' : message;
		app.querySelector('[data-help-history-status]').textContent = historyOnly ? message : '';
	}

	function showError(app, error) {
		setStatus(app, error.message || config.strings.error);
	}

	function setHistory(app, open, focusQuestion) {
		var status = app.querySelector('[data-help-status]').textContent || app.querySelector('[data-help-history-status]').textContent;
		var wide = app.dataset.mode === 'page' && window.matchMedia('(min-width: 1000px)').matches;
		var conversation = app.querySelector('.sz-website-help-conversation');
		var toggle = app.querySelector('[data-help-history-toggle]');
		app.querySelector('.sz-website-help-layout').classList.toggle('is-history-open', open);
		app.querySelector('.sz-website-help-history').hidden = !open;
		conversation.hidden = open && !wide;
		setStatus(app, status);
		toggle.setAttribute('aria-expanded', String(open));
		app.querySelector('[data-help-history-label]').textContent = open ? (wide ? config.strings.hideHistory : config.strings.backToChat) : config.strings.history;
		if (conversation.hidden && conversation.contains(document.activeElement)) toggle.focus();
		if (focusQuestion) app.querySelector('[data-help-question]').focus();
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
			var gallery = document.querySelector('[data-key="field_sz_gallery_library_images"]');
			var images = gallery ? gallery.querySelectorAll('.acf-gallery-attachment') : [];
			return { image_count: images.length, has_captions: false };
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

	function createIcon(pathData) {
		var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		icon.setAttribute('class', 'sz-website-help-icon');
		icon.setAttribute('viewBox', '0 0 24 24');
		icon.setAttribute('aria-hidden', 'true');
		icon.setAttribute('focusable', 'false');
		var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', pathData);
		icon.appendChild(path);
		return icon;
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

	function reportButton(message) {
		if (!config.reportingEnabled || !message.message_index) return null;
		var reportState = message.report_state || 'claimable';
		var wrapper = document.createElement('span');
		wrapper.className = 'sz-website-help-report';
		var status = document.createElement('span');
		status.className = 'sz-website-help-report__status';
		status.setAttribute('aria-live', 'polite');
		var button = document.createElement('button');
		button.type = 'button';
		button.className = 'sz-website-help-report__button';
		button.title = reportState === 'sent' ? config.strings.reported : config.strings.reportAnswer;
		button.setAttribute('aria-label', button.title);
		button.disabled = reportState === 'sent' || reportState === 'pending';
		if (reportState === 'sent') button.classList.add('is-reported');
		var icon = createIcon('M5 21V3h14l-3 5 3 5H5');
		button.appendChild(icon);
		if (reportState === 'sent') status.textContent = config.strings.reported;
		if (reportState === 'pending') status.textContent = config.strings.reportSending;
		button.addEventListener('click', function () {
			if (!window.confirm(config.strings.confirmReport)) return;
			var threadId = activeThreadId;
			button.disabled = true;
			status.textContent = config.strings.reportSending;
			request('sz_website_help_report_answer', {
				thread_id: threadId,
				answer_index: message.message_index
			}).then(function () {
				message.report_state = 'sent';
				button.classList.add('is-reported');
				button.title = config.strings.reported;
				button.setAttribute('aria-label', config.strings.reported);
				status.textContent = config.strings.reported;
			}).catch(function (error) {
				button.disabled = error.reportState === 'pending';
				status.textContent = error.reportState === 'pending' ? config.strings.reportPending : (error.message || config.strings.error);
			});
		});
		wrapper.append(status, button);
		return wrapper;
	}

	// Render only handbook-supported formatting; never interpret answer text as HTML.
	function appendInline(parent, text, depth) {
		var tokens = /\\([\\`*_])|(`+)([\s\S]*?)\2|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\*([^*\n]+)\*|_([^_\n]+)_/g;
		var offset = 0;
		var match;
		while (depth < 10 && (match = tokens.exec(text))) {
			parent.appendChild(document.createTextNode(text.slice(offset, match.index)));
			if (match[1]) {
				parent.appendChild(document.createTextNode(match[1]));
			} else {
				var tag = match[2] ? 'code' : (match[4] || match[5] ? 'strong' : 'em');
				var node = document.createElement(tag);
				var value = match[3] !== undefined ? match[3] : (match[4] || match[5] || match[6] || match[7]);
				if (tag === 'code') node.textContent = value;
				else appendInline(node, value, depth + 1);
				parent.appendChild(node);
			}
			offset = tokens.lastIndex;
		}
		parent.appendChild(document.createTextNode(text.slice(offset)));
	}

	function appendAnswer(parent, text, depth) {
		if (depth > 10) {
			parent.appendChild(document.createTextNode(text));
			return;
		}
		var lines = text.replace(/\r\n?/g, '\n').split('\n');
		var itemPattern = /^(\s*)([-+*]|\d+\.)\s+(.*)$/;
		var startsBlock = /^(?:\s*$|\s*```|\s*~~~|#{1,6}\s|>\s?|(?:[-+*]|\d+\.)\s+)/;
		var i = 0;
		while (i < lines.length) {
			var line = lines[i];
			if (!line.trim()) { i += 1; continue; }
			var fence = line.match(/^\s*(`{3,}|~{3,}).*$/);
			var heading = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
			var item = line.match(itemPattern);
			if (fence) {
				var code = [];
				var closingFence = new RegExp('^\\s*' + fence[1][0] + '{' + fence[1].length + ',}\\s*$');
				i += 1;
				while (i < lines.length && !closingFence.test(lines[i])) code.push(lines[i++]);
				if (i < lines.length) i += 1;
				var pre = document.createElement('pre');
				var codeNode = document.createElement('code');
				codeNode.textContent = code.join('\n');
				pre.appendChild(codeNode);
				parent.appendChild(pre);
			} else if (heading) {
				var title = document.createElement('h' + Math.min(heading[1].length + 2, 6));
				appendInline(title, heading[2], 0);
				parent.appendChild(title);
				i += 1;
			} else if (item) {
				var ordered = /^\d/.test(item[2]);
				var list = document.createElement(ordered ? 'ol' : 'ul');
				if (ordered) list.start = parseInt(item[2], 10);
				var indent = item[1].length;
				while (i < lines.length) {
					item = lines[i].match(itemPattern);
					if (!item || item[1].length !== indent || /^\d/.test(item[2]) !== ordered) break;
					var contents = [item[3]];
					var contentIndent = item[0].length - item[3].length;
					i += 1;
					while (i < lines.length) {
						if (!lines[i].trim() && i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
							contents.push('');
							i += 1;
						} else if (lines[i].trim() && lines[i].search(/\S/) >= contentIndent) {
							contents.push(lines[i++].slice(contentIndent));
						} else break;
					}
					var li = document.createElement('li');
					appendAnswer(li, contents.join('\n'), depth + 1);
					list.appendChild(li);
				}
				parent.appendChild(list);
			} else if (/^>\s?/.test(line)) {
				var quoted = [];
				while (i < lines.length && /^>\s?/.test(lines[i])) quoted.push(lines[i++].replace(/^>\s?/, ''));
				var quote = document.createElement('blockquote');
				appendAnswer(quote, quoted.join('\n'), depth + 1);
				parent.appendChild(quote);
			} else {
				var paragraph = [line];
				i += 1;
				while (i < lines.length && !startsBlock.test(lines[i])) paragraph.push(lines[i++]);
				var p = document.createElement('p');
				appendInline(p, paragraph.join('\n'), 0);
				parent.appendChild(p);
			}
		}
	}

	function renderMessages(app, messages, sources) {
		var container = app.querySelector('[data-help-messages]');
		var empty = app.querySelector('[data-help-empty]');
		container.replaceChildren();
		(messages || []).forEach(function (message) {
			var article = document.createElement('article');
			article.className = 'sz-website-help-message sz-website-help-message--' + message.role;
			var header = document.createElement('header');
			header.className = 'sz-website-help-message__header';
			var label = document.createElement('strong');
			label.textContent = message.role === 'assistant' ? 'Website Help' : 'You';
			header.appendChild(label);
			if (message.role === 'assistant') {
				var report = reportButton(message);
				if (report) header.appendChild(report);
			}
			var content = document.createElement('div');
			content.className = 'sz-website-help-message__content';
			if (message.role === 'assistant') appendAnswer(content, message.content || '', 0);
			else content.textContent = message.content || '';
			article.append(header, content);
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
		container.hidden = !empty.hidden;
		container.scrollTop = container.scrollHeight;
		if (app.szHelpUpdateScroll) app.szHelpUpdateScroll();
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

	function openThread(app, threadId, focusQuestion) {
		cancelActiveAnswer();
		var operationId = activeOperationId;
		setStatus(app, config.strings.loading);
		return request('sz_website_help_get_thread', { thread_id: threadId }).then(function (data) {
			if (operationId !== activeOperationId) return;
			setActiveThread(data.thread.id);
			setStatus(app, '');
			document.querySelectorAll('.sz-website-help-app').forEach(function (target) {
				renderMessages(target, data.thread.messages);
				loadThreads(target);
			});
			if (focusQuestion) setHistory(app, false, true);
		}).catch(function (error) {
			if (operationId === activeOperationId) showError(app, error);
		});
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
				openThread(app, thread.id, true);
			});
			var optionsMenu = document.createElement('details');
			optionsMenu.setAttribute('data-help-options', '');
			optionsMenu.className = 'sz-website-help-thread__options';
			var summary = document.createElement('summary');
			summary.setAttribute('aria-label', config.strings.options + ': ' + thread.title);
			var optionsIcon = createIcon('M5 12h.01M12 12h.01M19 12h.01');
			summary.appendChild(optionsIcon);
			var actions = document.createElement('div');
			actions.className = 'sz-website-help-thread__actions';
			var pin = document.createElement('button');
			pin.type = 'button';
			pin.textContent = thread.pinned ? 'Unpin' : 'Pin';
			pin.addEventListener('click', function () {
				request('sz_website_help_update_thread', { thread_id: thread.id, pinned: thread.pinned ? '0' : '1' }).then(function () { loadThreads(app); }).catch(function (error) { showError(app, error); });
			});
			var rename = document.createElement('button');
			rename.type = 'button';
			rename.textContent = 'Rename';
			rename.addEventListener('click', function () {
				var title = window.prompt('Conversation name', thread.title);
				if (title) request('sz_website_help_update_thread', { thread_id: thread.id, title: title }).then(function () { loadThreads(app); }).catch(function (error) { showError(app, error); });
			});
			var remove = document.createElement('button');
			remove.type = 'button';
			remove.className = 'button-link-delete';
			remove.textContent = 'Delete';
			remove.addEventListener('click', function () {
				if (!window.confirm(config.strings.confirmDelete)) return;
				if (activeThreadId === thread.id) cancelActiveAnswer();
				request('sz_website_help_delete_thread', { thread_id: thread.id }).then(function () {
					if (activeThreadId === thread.id) { setActiveThread(0); renderMessages(app, []); }
					loadThreads(app);
				}).catch(function (error) { showError(app, error); });
			});
			actions.append(pin, rename, remove);
			optionsMenu.append(summary, actions);
			row.append(open, optionsMenu);
			container.appendChild(row);
		});
		if (!container.childElementCount) {
			var empty = document.createElement('p');
			empty.className = 'sz-website-help-history-empty';
			empty.textContent = config.strings.noHistory;
			container.appendChild(empty);
		}
	}

	function loadThreads(app) {
		var search = app.querySelector('[data-help-search]');
		var requestId = (app.szHelpHistoryRequestId || 0) + 1;
		app.szHelpHistoryRequestId = requestId;
		return request('sz_website_help_threads', { search: search ? search.value : '' }).then(function (data) {
			if (requestId === app.szHelpHistoryRequestId) {
				renderThreads(app, data.threads);
			}
		}).catch(function (error) {
			if (requestId === app.szHelpHistoryRequestId) showError(app, error);
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
			setActiveThread(result.thread.id);
			renderMessages(app, result.thread.messages);
			loadThreads(app);
			return Promise.resolve(result);
		}

		setActiveThread(result.thread.id);
		setStatus(app, config.strings.context);
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
		var questionRevision = 0;
		var contextOption = app.querySelector('[data-help-context-option]');
		contextOption.hidden = !config.liveContextAvailable;
		var historyToggle = app.querySelector('[data-help-history-toggle]');
		var wideScreen = window.matchMedia('(min-width: 1000px)');
		setHistory(app, app.dataset.mode === 'page' && wideScreen.matches);
		historyToggle.addEventListener('click', function () {
			var open = historyToggle.getAttribute('aria-expanded') !== 'true';
			setHistory(app, open);
			if (open) app.querySelector('[data-help-search]').focus();
		});
		wideScreen.addEventListener('change', function () {
			setHistory(app, historyToggle.getAttribute('aria-expanded') === 'true');
		});
		app.addEventListener('toggle', function (event) {
			var menu = event.target;
			if (!menu.matches('[data-help-options]') || !menu.open) return;
			app.querySelectorAll('[data-help-options][open]').forEach(function (other) {
				if (other !== menu) other.open = false;
			});
		}, true);
		app.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape') return;
			var menu = app.querySelector('[data-help-options][open]');
			if (menu) {
				menu.open = false;
				menu.querySelector('summary').focus();
			} else if (historyToggle.getAttribute('aria-expanded') === 'true') {
				setHistory(app, false, true);
			} else {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
		});
		function resizeQuestion() {
			if (!question.getClientRects().length) return;
			var style = window.getComputedStyle(question);
			var min = parseFloat(style.minHeight);
			var max = parseFloat(style.maxHeight);
			var border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
			question.style.height = min + 'px';
			var height = Math.min(Math.max(question.scrollHeight + border, min), max);
			question.style.height = height + 'px';
			question.style.overflowY = question.scrollHeight + border > height + 1 ? 'auto' : 'hidden';
		}
		if (window.ResizeObserver) {
			var previousWidth = 0;
			var questionObserver = new ResizeObserver(function (entries) {
				var width = entries[0].contentRect.width;
				if (width > 0 && width !== previousWidth) {
					previousWidth = width;
					resizeQuestion();
				}
			});
			questionObserver.observe(question);
		}
		window.addEventListener('resize', resizeQuestion);
		question.addEventListener('input', function () {
			questionRevision += 1;
			resizeQuestion();
		});

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			var value = question.value.trim();
			var sentRevision = questionRevision;
			if (!value) return;
			if (app.classList.contains('is-busy')) return;
			if (activeController) activeController.abort();
			var controller = new AbortController();
			var operationId = ++activeOperationId;
			activeController = controller;
			setBusy(app, true);
			setStatus(app, config.strings.loading);
			request('sz_website_help_ask', {
				thread_id: activeThreadId,
				question: value,
				tier_zero: JSON.stringify(tierZero()),
				allow_context: app.querySelector('[data-help-allow-context]').checked ? '1' : '0'
			}, controller.signal).then(function (result) {
				return continueExchange(app, result, controller.signal, operationId);
			}).then(function () {
				if (operationId !== activeOperationId) return;
				if (questionRevision === sentRevision && question.value.trim() === value) question.value = '';
				resizeQuestion();
				setStatus(app, '');
			}).catch(function (error) {
				if (error.name === 'AbortError' || operationId !== activeOperationId) return;
				if (error.threadId) {
					setActiveThread(error.threadId);
					loadThreads(app);
				}
				showError(app, error);
			}).finally(function () {
				if (activeController === controller) {
					setBusy(app, false);
					activeController = null;
				}
			});
		});

		app.querySelectorAll('[data-help-starter]').forEach(function (button) {
			button.addEventListener('click', function () { question.value = button.getAttribute('data-help-starter') || ''; questionRevision += 1; resizeQuestion(); question.focus(); });
		});
		app.querySelector('[data-help-new]').addEventListener('click', function () {
			cancelActiveAnswer();
			var operationId = activeOperationId;
			var previousQuestion = question.value;
			var previousRevision = questionRevision;
			request('sz_website_help_create_thread', {}).then(function (data) {
				if (operationId !== activeOperationId) return;
				setActiveThread(data.thread.id);
				renderMessages(app, []);
				loadThreads(app);
				if (questionRevision === previousRevision && question.value === previousQuestion) question.value = '';
				resizeQuestion();
				setStatus(app, '');
				setHistory(app, false, true);
			}).catch(function (error) {
				if (operationId === activeOperationId) showError(app, error);
			});
		});
		app.querySelector('[data-help-search]').addEventListener('input', function () { loadThreads(app); });
		app.querySelector('[data-help-context-filter]').addEventListener('change', function () { loadThreads(app); });
		var messages = app.querySelector('[data-help-messages]');
		var scrollButton = document.createElement('button');
		scrollButton.type = 'button';
		scrollButton.className = 'button sz-website-help-scroll';
		scrollButton.textContent = config.strings.latest;
		scrollButton.hidden = true;
		messages.insertAdjacentElement('afterend', scrollButton);
		function updateScroll() {
			scrollButton.hidden = messages.hidden || messages.scrollHeight - messages.clientHeight - messages.scrollTop < 80;
		}
		app.szHelpUpdateScroll = updateScroll;
		messages.addEventListener('scroll', updateScroll);
		window.addEventListener('resize', updateScroll);
		if (window.ResizeObserver) new ResizeObserver(updateScroll).observe(messages);
		scrollButton.addEventListener('click', function () {
			messages.scrollTop = messages.scrollHeight;
			updateScroll();
			question.focus();
		});
		app.querySelector('[data-help-delete-all]').addEventListener('click', function () {
			var options = app.querySelector('.sz-website-help-history__options');
			options.open = false;
			options.querySelector('summary').focus();
			if (!window.confirm(config.strings.confirmAll)) return;
			cancelActiveAnswer();
			request('sz_website_help_delete_all', {}).then(function () { setActiveThread(0); renderMessages(app, []); loadThreads(app); }).catch(function (error) { showError(app, error); });
		});
		loadThreads(app);
		if (app.dataset.mode === 'page') {
			var requestedThread = new URLSearchParams(window.location.hash.slice(1)).get('thread');
			if (requestedThread !== null) {
				var threadId = Number(requestedThread);
				if (/^[1-9]\d*$/.test(requestedThread) && Number.isSafeInteger(threadId)) {
					openThread(app, threadId, false);
				} else {
					showError(app, new Error(config.strings.invalidThread));
				}
			}
		}
	}

	document.querySelectorAll('.sz-website-help-app').forEach(initializeApp);

	var launcher = document.querySelector('.sz-website-help-launcher');
	var drawer = document.querySelector('.sz-website-help-drawer');
	var backdrop = document.querySelector('.sz-website-help-backdrop');
	var closeButton = drawer ? drawer.querySelector('.sz-website-help-close') : null;
	var backgroundElements = [];
	function fitDrawer() {
		if (!drawer || !window.visualViewport) return;
		var viewport = window.visualViewport;
		var mobile = window.matchMedia('(max-width: 782px)').matches;
		var top = Math.max(mobile ? 46 : 32, viewport.offsetTop);
		drawer.style.top = top + 'px';
		drawer.style.maxHeight = Math.max(0, viewport.height - (top - viewport.offsetTop) - (mobile ? 0 : 12)) + 'px';
	}
	function closeDrawer() {
		if (!drawer) return;
		cancelActiveAnswer();
		drawer.hidden = true;
		backdrop.hidden = true;
		launcher.setAttribute('aria-expanded', 'false');
		document.body.classList.remove('sz-website-help-open');
		backgroundElements.forEach(function (record) { record.element.inert = record.inert; });
		backgroundElements = [];
		if (lastFocusedElement) lastFocusedElement.focus();
	}
	if (launcher && drawer) {
		if (window.visualViewport) {
			window.visualViewport.addEventListener('resize', fitDrawer);
			window.visualViewport.addEventListener('scroll', fitDrawer);
		}
		launcher.addEventListener('click', function () {
			lastFocusedElement = document.activeElement;
			drawer.hidden = false;
			backdrop.hidden = false;
			launcher.setAttribute('aria-expanded', 'true');
			document.body.classList.add('sz-website-help-open');
			fitDrawer();
			for (var branch = drawer; branch && branch !== document.body; branch = branch.parentElement) {
				Array.prototype.forEach.call(branch.parentElement.children, function (element) {
					if (element === branch || element === backdrop) return;
					backgroundElements.push({ element: element, inert: element.inert });
					element.inert = true;
				});
			}
			setHistory(drawer.querySelector('.sz-website-help-app'), false);
			drawer.querySelector('[data-help-question]').focus();
		});
		closeButton.addEventListener('click', closeDrawer);
		backdrop.addEventListener('click', closeDrawer);
		drawer.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); }
			if (event.key !== 'Tab') return;
			var focusable = Array.prototype.filter.call(drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'), function (element) {
				return element.getClientRects().length && !element.closest('[hidden], [inert]');
			});
			if (!focusable.length) return;
			var first = focusable[0];
			var last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
			if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
		});
	}
}());
