# Import Live Gallery Into WordPress Galleries

Use these utilities to pull image URLs from a live gallery page and either:

- generate a ready-to-paste legacy inline `galleries` block JSON payload, or
- create a reusable Gallery Library entry in WordPress and insert a lightweight `gallery_reference` block on the page.

## Quick command

```bash
npm run gallery:import-live -- --url https://studiozanetti.com.au/gallery/stylish-brides/
```

This prints JSON to the terminal.

## Save directly to a file

```bash
npm run gallery:import-live -- \
  --url https://studiozanetti.com.au/gallery/stylish-brides/ \
  --out app/components/blocks/GalleriesBlock/__mocks__/stylishBrides.json
```

## Import Directly Into WordPress Page Blocks

By default, direct WordPress import uses the reusable gallery flow:

1. create or update a Gallery Library entry in WordPress
2. insert a `gallery_reference` block on the target page

This keeps page saves much smaller than legacy inline galleries.

Dry run preview (no writes):

```bash
npm run gallery:import-live-to-wp -- \
  --source-url https://studiozanetti.com.au/gallery/stylish-brides/ \
  --wp-url https://your-wordpress-site.com \
  --page-slug your-page-slug
```

Execute write (requires WordPress Application Password auth):

```bash
npm run gallery:import-live-to-wp -- \
  --source-url https://studiozanetti.com.au/gallery/stylish-brides/ \
  --wp-url https://your-wordpress-site.com \
  --page-id 123 \
  --username your-wp-username \
  --app-password "xxxx xxxx xxxx xxxx xxxx xxxx" \
  --mode replace \
  --execute
```

`--mode` options:

- `append` (default): add a new gallery-like block to the end of existing ACF blocks.
- `replace`: replace the first existing `galleries` or `gallery_reference` block if present; otherwise append.

`--storage-mode` options:

- `reference` (default): create/update a reusable gallery entry and insert a `gallery_reference` block.
- `inline`: write a legacy inline `galleries` block directly onto the page.

## Common options

- `--heading "Stylish Brides"` set custom heading text
- `--limit 40` cap imported images
- `--gallery-slug stylish-brides` set a stable reusable gallery slug in WordPress
- `--scope "main .ppb_wrapper"` use a custom DOM container selector
- `--include-external` include image URLs hosted on other domains/CDNs
- `--mode append|replace` for direct WordPress import mode
- `--storage-mode reference|inline` choose reusable gallery references or legacy inline blocks
- `--verbose` print detailed progress logs and a long-request heartbeat

## Typical workflow

1. Run importer against a live gallery URL.
2. Review generated JSON and remove any stray non-gallery images if needed.
3. If using the legacy JSON mode, paste into the `images` repeater for the `galleries` block data.
4. If using direct WordPress import, the importer will create/update the reusable gallery entry for you.

Or use the direct WordPress import command to skip manual paste.

## Notes

- The direct WordPress importer uploads or reuses media in WordPress as needed.
- Best results come when gallery images are in the page `main` content area.
- If no images are found, try a more specific `--scope` selector.
- Direct WordPress writes are always dry-run unless `--execute` is passed.
