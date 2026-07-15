(function ($) {
	'use strict';

	$(function () {
		var config = window.szSiteMenuManager;
		var $board = $('[data-site-menu-board]');
		var $status = $('#sz-site-menu-status');
		var $preview = $('#sz-site-menu-preview');
		var $backdrop = $('.sz-site-menu-preview-backdrop');
		var $previewFrame = $preview.find('iframe');
		var $previewLoading = $preview.find('.sz-site-menu-preview__loading');
		var saveTimer = null;
		var saveInProgress = false;
		var savePending = false;
		var lastPreviewTrigger = null;

		if (!config || !$board.length) {
			return;
		}

		function setStatus(message, state) {
			var icon = state === 'error' ? 'dashicons-warning' : (state === 'saving' ? 'dashicons-update' : 'dashicons-saved');
			$status
				.removeClass('is-saving is-error')
				.addClass(state === 'saving' ? 'is-saving' : '')
				.addClass(state === 'error' ? 'is-error' : '');
			$status.find('.dashicons').attr('class', 'dashicons ' + icon);
			$status.find('span:last').text(message);
		}

		function updateBoardDetails() {
			$('.sz-site-menu-column').each(function () {
				var $column = $(this);
				var count = $column.find('.sz-site-menu-card').length;
				$column.find('.sz-site-menu-column__count').text(count === 1 ? '1 item' : count + ' items');
				$column.find('.sz-site-menu-card__move').val(String($column.data('menu-id')));
			});
		}

		function serializeBoard() {
			return $('.sz-site-menu-column').map(function () {
				var $column = $(this);
				return {
					menuId: Number($column.data('menu-id')),
					items: $column.find('.sz-site-menu-card').map(function () {
						var $card = $(this);
						return {
							clientId: String($card.data('client-id') || ''),
							itemId: Number($card.attr('data-item-id')) || 0,
							pageId: Number($card.data('page-id')) || 0
						};
					}).get()
				};
			}).get();
		}

		function applySavedIds(created, deleted) {
			(created || []).forEach(function (item) {
				$board.find('[data-client-id="' + item.clientId + '"]').attr('data-item-id', item.itemId);
			});

			(deleted || []).forEach(function (item) {
				var $card = $board.find('[data-client-id="' + item.clientId + '"]');
				if (Number($card.attr('data-item-id')) === Number(item.itemId)) {
					$card.attr('data-item-id', '0');
				}
			});
		}

		function reconcileUnassignedPages() {
			var assignedPageIds = {};

			$('.sz-site-menu-column:not([data-menu-id="0"]) .sz-site-menu-card').each(function () {
				var pageId = Number($(this).data('page-id'));
				if (pageId > 0) {
					assignedPageIds[pageId] = true;
				}
			});

			$('.sz-site-menu-column[data-menu-id="0"] .sz-site-menu-card').each(function () {
				if (assignedPageIds[Number($(this).data('page-id'))]) {
					$(this).remove();
				}
			});

			updateBoardDetails();
		}

		function saveBoard() {
			if (saveInProgress) {
				savePending = true;
				return;
			}

			saveInProgress = true;
			savePending = false;
			setStatus(config.strings.saving, 'saving');

			$.ajax({
				url: config.ajaxUrl,
				method: 'POST',
				dataType: 'json',
				data: {
					action: 'sz_site_menu_manager_save',
					nonce: config.nonce,
					board: JSON.stringify(serializeBoard())
				}
			}).done(function (response) {
				if (!response.success) {
					setStatus(response.data && response.data.message ? response.data.message : config.strings.saveError, 'error');
					return;
				}

				applySavedIds(response.data.created, response.data.deleted);
				reconcileUnassignedPages();
				setStatus(response.data.message || config.strings.idle, 'idle');
			}).fail(function (request) {
				var response = request.responseJSON;
				setStatus(response && response.data && response.data.message ? response.data.message : config.strings.saveError, 'error');
			}).always(function () {
				saveInProgress = false;
				if (savePending) {
					saveBoard();
				}
			});
		}

		function queueSave() {
			window.clearTimeout(saveTimer);
			updateBoardDetails();
			saveTimer = window.setTimeout(saveBoard, 250);
		}

		$('.sz-site-menu-list').sortable({
			connectWith: '.sz-site-menu-list',
			handle: '.sz-site-menu-card__handle',
			placeholder: 'sz-site-menu-card sz-site-menu-card--placeholder',
			forcePlaceholderSize: true,
			tolerance: 'pointer',
			receive: function (event, ui) {
				var isUnassignedColumn = Number($(this).closest('.sz-site-menu-column').data('menu-id')) === 0;
				var isPage = Number(ui.item.data('page-id')) > 0;

				if (isUnassignedColumn && !isPage) {
					$(ui.sender).sortable('cancel');
				}
			},
			update: queueSave
		});

		$board.on('change', '.sz-site-menu-card__move', function () {
			var $select = $(this);
			var $card = $select.closest('.sz-site-menu-card');
			var targetMenuId = $select.val();
			var $target = $('.sz-site-menu-column[data-menu-id="' + targetMenuId + '"] .sz-site-menu-list');

			if (!$target.length) {
				return;
			}

			$target.append($card);
			queueSave();
			$card.find('.sz-site-menu-card__preview').trigger('focus');
		});

		$board.on('click', '.sz-site-menu-card__order', function () {
			var $button = $(this);
			var $card = $button.closest('.sz-site-menu-card');
			var direction = $button.data('direction');
			var $sibling = direction === 'up' ? $card.prev() : $card.next();

			if (!$sibling.length) {
				return;
			}

			if (direction === 'up') {
				$card.insertBefore($sibling);
			} else {
				$card.insertAfter($sibling);
			}

			queueSave();
			$button.trigger('focus');
		});

		function closePreview() {
			$preview.removeClass('is-open');
			$backdrop.prop('hidden', true);
			$('body').removeClass('sz-site-menu-preview-open');
			$previewFrame.attr('src', 'about:blank');
			if ($preview[0].open) {
				$preview[0].close();
			}

			if (lastPreviewTrigger) {
				lastPreviewTrigger.focus();
			}
		}

		$board.on('click', '.sz-site-menu-card__preview', function () {
			var trigger = this;
			var title = $(trigger).data('page-title');
			var url = $(trigger).data('preview-url');

			if (!url) {
				return;
			}

			lastPreviewTrigger = trigger;
			$preview.find('h2').text(config.strings.viewing.replace('%s', title));
			$previewLoading.show();
			$previewFrame.attr('src', url);
			$preview[0].show();
			$preview.addClass('is-open');
			$backdrop.prop('hidden', false);
			$('body').addClass('sz-site-menu-preview-open');
			$preview.find('.sz-site-menu-preview__close').trigger('focus');
		});

		$previewFrame.on('load', function () {
			$previewLoading.hide();
		});

		$preview.on('click', '.sz-site-menu-preview__close', closePreview);
		$backdrop.on('click', closePreview);
		$(document).on('keydown', function (event) {
			if (event.key === 'Escape' && $preview.hasClass('is-open')) {
				closePreview();
			}
		});

		$('#sz-site-menu-create').on('submit', function (event) {
			event.preventDefault();
			var $form = $(this);
			var $button = $form.find('button[type="submit"]');

			$button.prop('disabled', true);
			setStatus(config.strings.creating, 'saving');

			$.ajax({
				url: config.ajaxUrl,
				method: 'POST',
				dataType: 'json',
				data: {
					action: 'sz_site_menu_manager_create',
					nonce: config.nonce,
					name: $form.find('[name="name"]').val(),
					slug: $form.find('[name="slug"]').val()
				}
			}).done(function (response) {
				if (!response.success) {
					setStatus(response.data && response.data.message ? response.data.message : config.strings.createError, 'error');
					return;
				}

				window.location.reload();
			}).fail(function (request) {
				var response = request.responseJSON;
				setStatus(response && response.data && response.data.message ? response.data.message : config.strings.createError, 'error');
			}).always(function () {
				$button.prop('disabled', false);
			});
		});

		updateBoardDetails();
	});
}(jQuery));