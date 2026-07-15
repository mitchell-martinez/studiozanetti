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
		var previewWidthBeforeExpand = null;

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
							pageId: Number($card.data('page-id')) || 0
						};
					}).get()
				};
			}).get();
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

				if (isUnassignedColumn && Number(config.primaryMenuId) > 0) {
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
			$preview.removeClass('is-open').attr('aria-hidden', 'true').prop('hidden', true);
			$backdrop.prop('hidden', true);
			$('body').removeClass('sz-site-menu-preview-open');
			$previewFrame.attr('src', 'about:blank');
			$preview.removeClass('is-expanded').css('width', '');
			previewWidthBeforeExpand = null;

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
			$preview.prop('hidden', false).attr('aria-hidden', 'false').addClass('is-open');
			$backdrop.prop('hidden', false);
			$('body').addClass('sz-site-menu-preview-open');
			$preview.find('.sz-site-menu-preview__close').trigger('focus');
		});

		$previewFrame.on('load', function () {
			$previewLoading.hide();
		});

		$preview.on('click', '.sz-site-menu-preview__close', closePreview);
		$preview.on('click', '.sz-site-menu-preview__expand', function () {
			var $button = $(this);
			var expanding = !$preview.hasClass('is-expanded');

			if (expanding) {
				previewWidthBeforeExpand = $preview[0].getBoundingClientRect().width;
				$preview.addClass('is-expanded').css('width', 'calc(100vw - 160px)');
			} else {
				$preview.removeClass('is-expanded').css('width', previewWidthBeforeExpand ? previewWidthBeforeExpand + 'px' : '');
			}

			$button.attr('aria-label', expanding ? config.strings.collapse : config.strings.expand);
			$button.attr('title', expanding ? config.strings.collapse : config.strings.expand);
		});

		$preview.on('mousedown', '.sz-site-menu-preview__resize', function (event) {
			if (window.matchMedia('(max-width: 782px)').matches) {
				return;
			}

			event.preventDefault();
			$preview.removeClass('is-expanded');
			$('body').addClass('sz-site-menu-preview-resizing');

			$(document).on('mousemove.szSiteMenuResize', function (moveEvent) {
				var width = Math.max(360, Math.min(window.innerWidth - 160, window.innerWidth - moveEvent.clientX));
				$preview.css('width', width + 'px');
			}).one('mouseup.szSiteMenuResize', function () {
				$(document).off('mousemove.szSiteMenuResize');
				$('body').removeClass('sz-site-menu-preview-resizing');
			});
		});
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