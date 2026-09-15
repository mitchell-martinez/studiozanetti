# Pages and content blocks

A page has three separate kinds of information: its WordPress identity, its local Page Settings, and its ordered Page Blocks. Changing one does not automatically change the others.

## Find and edit the right page

1. Open **Pages** and search by title if necessary.
2. Check the title and current status before editing. Similar pages can be drafts, parent containers, or older copies.
3. Find the required section in **Page Blocks** by its visible layout label. Expand collapsed rows to edit their fields.
4. Make one logical change at a time, refresh the Live Front-End Preview, and use its desktop, tablet, and mobile widths.
5. Use **Update** only when the saved page should change. Keep unfinished new pages as drafts.

Blocks render from top to bottom. Drag a block's layout header to reorder it. Reordering changes the page narrative and heading order, so preview the sections before and after the moved block. Removing a row removes that section from the next saved version; it does not delete media or reusable Gallery Library entries referenced by the block.

## Page Settings and their consequences

- **Page Description:** supports search and social descriptions. It should accurately summarize visible content.
- **Menu Override:** changes which header menu appears on this page. It does not add the page as a visible menu item.
- **Parent:** changes the page hierarchy and can change its public path. Confirm child-page consequences before changing it.
- **Slug:** controls the URL segment. Changing a published slug can break saved links and should be treated as a structural change.
- **Featured Image:** can appear in social previews or other page summaries; it is not automatically a visible page section.
- **Container Only (no direct access):** makes the page a URL-hierarchy container whose direct URL returns a 404 while child pages continue to work. Do not enable it on a page visitors should open.
- **Primary Service:** links the page to one authoritative Service Catalog entry for structured data. Leave it blank rather than guessing.
- **Venue Experience Page:** use only when the page is substantially about one real venue. Enter public, verifiable facts; these may be published as Place structured data.

## Content rules editors often discover late

- Keep exactly one visible H1. A Hero title is normally the H1; section headings usually begin at H2.
- Reuse an existing media item instead of uploading duplicate copies.
- A page can be published but absent from navigation. Menus are managed separately.
- A reusable gallery change can affect multiple pages; a normal Page Block change affects only this page.
- Blank optional fields are usually preferable to invented or placeholder facts.
- If WordPress shows a `max_input_vars` warning on a large page, stop editing and contact the webmaster before saving again because some fields may be omitted.

Website Help may request a block outline before asking for selected visible values. It cannot save, reorder, delete, or publish content. Useful follow-up questions include which block suits a section, whether a setting is local or shared, how to preserve a URL, and what to check before publishing.