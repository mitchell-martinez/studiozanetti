# Content Migration Script

Converts existing WordPress `post_content` HTML into ACF Flexible Content blocks so that all page content is editable through the ACF WYSIWYG editor.

## Prerequisites

- **ACF Pro** installed and activated  
- The **"Page Blocks"** Flexible Content field group must be registered in ACF with field name `blocks`  
- WP-CLI available in the WordPress container  

## Quick Start

### 1. Copy the script into the WordPress container

```bash
scp wordpress/migrate-content/migrate-content.php root@103.4.234.10:/var/lib/docker/volumes/budgeto_wordpress-data/_data/migrate-content.php
```

### 2. Dry Run (preview only — nothing is changed)

```bash
docker exec wordpress wp eval-file /var/www/html/migrate-content.php --allow-root
```

This lists every page and what the script **would** do: how many blocks it would create, the layout types, and a preview of the first block.

### 3. Live Run (performs the migration)

```bash
docker exec -e SZ_EXECUTE=1 wordpress wp eval-file /var/www/html/migrate-content.php --allow-root
```

### 4. Migrate a single page

```bash
docker exec -e SZ_EXECUTE=1 -e SZ_PAGE_ID=9347 wordpress wp eval-file /var/www/html/migrate-content.php --allow-root
```

### 5. Clean up

```bash
ssh root@103.4.234.10 rm /var/lib/docker/volumes/budgeto_wordpress-data/_data/migrate-content.php
```

## What It Does

For each published page:

| Condition | Action |
|-----------|--------|
| `post_content` is empty | **Skip** |
| Page already has ACF blocks | **Skip** (never overwrites) |
| `post_content` has HTML | **Parse → Migrate → Clear `post_content`** |

### Parsing Logic

1. **Strips** Gutenberg block comments (`<!-- wp:... -->`) and old theme wrapper `<div>` classes (`ppb_text`, `standard_wrapper`, etc.).
2. **Splits** on `<h1>`–`<h6>` headings — each heading starts a new section.
3. Maps sections to ACF layout types:

| Content Pattern | ACF Layout |
|-----------------|------------|
| Heading + text (no images) | `text_block` |
| Heading + text + image | `image_text` |
| Text only (no headings) | Single `text_block` |

4. For `image_text` blocks, the script tries to find the WordPress **attachment ID** by matching the image URL in the media library. If not found, the image field is left empty (a warning is logged).

## Safety

- **Dry-run by default**: Nothing changes unless you pass `--execute`.
- **Never overwrites** pages that already have ACF blocks.
- **Clears `post_content`** only after successful ACF save — if `update_field()` fails, the original content is untouched.
- **Single-page mode** (`--id=XXXX`) lets you test on one page first.

## After Migration

1. Visit each page in the WordPress admin to verify the content.
2. Use the ACF editor to refine headings, body text, and images.
3. The React frontend reads from `page.acf.blocks` — migrated content will appear automatically.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `update_field() returned false` | The ACF "blocks" Flexible Content field isn't registered. Create the field group first (see main README). |
| Images showing as empty | The script couldn't match the image URL to a media library item. Set images manually in the ACF editor. |
| Old theme HTML in body text | The parser strips common wrapper divs but some custom markup may remain. Edit in ACF to clean up. |
