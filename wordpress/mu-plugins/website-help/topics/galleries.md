# Gallery Library and gallery pages

A **Gallery Library** entry is a reusable ordered collection. A page displays it through a **Gallery Reference** block. Treat the library entry as the source of truth: changing its images or order changes every page that references it.

## Create or update a gallery

1. Reuse photographs already in **Media > Library** where possible and complete meaningful alternative text for each image.
2. Open **Gallery Library** and search for an existing collection before choosing **Add New**.
3. Give the entry a short internal title that identifies the shoot, location, client-safe event name, or collection. The title helps editors find it; it is not image alt text.
4. Under **Insert Images**, select **Add Image** at the top of the thumbnail grid. It opens the WordPress media library immediately; it does not add an empty row. Select one or several existing images, or use **Upload files** for new photographs, then confirm the selection. Cancelling the media window leaves the gallery unchanged.
5. New images are added to the end of the collection. The larger thumbnail grid expands with the page, so use the normal page scrollbar to see the whole collection. Drag thumbnails into the intended viewing order, or select **Remove** beneath a thumbnail to take it out of this collection. Keep at least one image. The old per-image **Caption** field has been removed; there are no caption rows to fill in.
6. Select **Edit** beneath an individual image, or click its thumbnail, to open the WordPress image editing dialog. Update the image's attachment details there and confirm with **Update Image**. Alternative text and other attachment metadata are shared by every use of that Media Library image; editing them is different from changing this collection's order.
7. Select **Update** (or **Publish** for a new entry) to save the gallery, then open every important page that uses it and preview the result. Closing the media window alone does not save gallery membership or ordering. Existing galleries retain their images and order in the thumbnail editor.

Removing a thumbnail removes that image from this gallery but does not delete the Media Library attachment. Add it again through **Add Image** if removed by mistake, then drag it back into place before saving. If unsaved gallery changes are wrong, reload without updating to return to the last saved collection. Deleting a Media Library attachment is different and can break every place that uses that file. Renaming the gallery does not rename image files or their attachment details.

## Place the gallery on a page

1. Open the page and add or expand **Gallery Reference**.
2. Select the reusable gallery.
3. Add an optional page-specific heading. Leave it blank to show no heading; the internal Gallery Library title is not automatically used as a public heading.
4. Choose 2–4 desktop columns and 1–3 mobile columns.
5. Preview ordering, crops, keyboard/lightbox behavior, and mobile density before updating the page.

Use **Gallery Categories** instead when the page needs image-led links to several gallery destinations. That block is navigation and does not replace a Gallery Library entry.

## Common questions

- **Can the same gallery appear on several pages?** Yes. This avoids copying image lists, but future edits affect every reference.
- **Can two pages show different headings for the same gallery?** Yes. The Gallery Reference heading belongs to the page block.
- **How do I add several images at once?** Use **Add Image** above the thumbnails, select multiple photographs in the media library, then confirm. Existing images remain in place and the new selection is added at the end.
- **How do I edit just one image?** Select its visible **Edit** button below the preview. This opens the WordPress image dialog for that attachment without removing it or changing the gallery order. Attachment edits are shared wherever that image is used.
- **Where did the caption rows go?** The reusable gallery editor now uses thumbnails and has no per-image caption field. Use the gallery **Description** for collection-wide context; this is shared by every page using the gallery. Alternative text still belongs to each Media Library attachment.
- **Can I make one image order for one page and a different order elsewhere?** Not with one shared entry. Create a separate gallery only when the collection genuinely needs independent curation.
- **Can I build a new filtering or masonry behavior?** Not through current editor fields; that requires frontend development.
- **What about older inline galleries?** They may remain in imported content, but new work should use Gallery Library plus Gallery Reference.

Website Help cannot upload, reorder, delete, or publish gallery content. Contact the webmaster for broken rendering, unavailable layout behavior, bulk migration, or a missing reusable entry that should exist.
