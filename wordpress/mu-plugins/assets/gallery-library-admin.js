(function () {
	'use strict';

	if (!window.acf) return;

	function prepareGallery(field) {
		var main = field.$el[0].querySelector('.acf-gallery-main');
		if (!main) return;
		var toolbar = main.querySelector('.acf-gallery-toolbar');
		if (!toolbar) return;
		// Keep visual order and keyboard navigation in the same order.
		main.prepend(toolbar);
		var add = toolbar.querySelector('.acf-gallery-add');
		if (add) add.textContent = window.szGalleryLibrary.addImage;

		var collection = main.querySelector('.acf-gallery-attachments');
		if (!collection || collection.dataset.szGalleryReady) return;
		collection.dataset.szGalleryReady = 'true';

		// Thumbnail clicks use the same WordPress image dialog as the Edit button.
		// ACF keeps its sorting, selection, and preview refresh behavior.
		field.selectAttachment = function (id) {
			field.editAttachment(id);
		};

		function prepareImage(card) {
			var id = Number(card.dataset.id);
			if (!id || card.querySelector('.sz-gallery-edit')) return;
			var actions = card.querySelector('.actions');
			if (!actions) return;
			var image = card.querySelector('img');
			var name = image ? (image.alt || image.title || String(id)) : String(id);
			var edit = document.createElement('button');
			edit.type = 'button';
			edit.className = 'button button-small sz-gallery-edit';
			edit.textContent = window.szGalleryLibrary.edit;
			edit.setAttribute('aria-label', window.szGalleryLibrary.editImage + ' ' + name);
			edit.addEventListener('click', function (event) {
				event.preventDefault();
				event.stopPropagation();
				field.editAttachment(id);
			});
			actions.prepend(edit);

			var remove = actions.querySelector('.acf-gallery-remove');
			if (remove) {
				remove.className = 'button button-small acf-gallery-remove';
				remove.textContent = window.szGalleryLibrary.remove;
				remove.setAttribute('aria-label', window.szGalleryLibrary.removeImage + ' ' + name);
			}
		}

		Array.prototype.forEach.call(collection.children, prepareImage);
		// ACF appends selected media without firing append_field for each image.
		var observer = new MutationObserver(function (records) {
			records.forEach(function (record) {
				Array.prototype.forEach.call(record.addedNodes, function (node) {
					if (node.nodeType === 1 && node.matches('.acf-gallery-attachment')) prepareImage(node);
				});
			});
		});
		observer.observe(collection, { childList: true });
		window.acf.addAction('remove_field/key=field_sz_gallery_library_images', function (removed) {
			if (removed === field) observer.disconnect();
		});
	}

	window.acf.addAction('ready_field/key=field_sz_gallery_library_images', prepareGallery);
	window.acf.addAction('append_field/key=field_sz_gallery_library_images', prepareGallery);
})();
