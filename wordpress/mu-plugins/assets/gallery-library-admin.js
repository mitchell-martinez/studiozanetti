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
	}

	window.acf.addAction('ready_field/key=field_sz_gallery_library_images', prepareGallery);
	window.acf.addAction('append_field/key=field_sz_gallery_library_images', prepareGallery);
})();
