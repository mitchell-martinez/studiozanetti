# Import Live Gallery Into `GalleriesBlock`

Use this utility to pull image URLs from a live gallery page and generate a ready-to-paste `galleries` block JSON payload.

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

- `append` (default): add a new `galleries` block to the end of existing ACF blocks.
- `replace`: replace the first existing `galleries` block if present; otherwise append.

## Common options

- `--heading "Stylish Brides"` set custom heading text
- `--limit 40` cap imported images
- `--scope "main .ppb_wrapper"` use a custom DOM container selector
- `--include-external` include image URLs hosted on other domains/CDNs
- `--mode append|replace` for direct WordPress import mode
- `--verbose` print detailed progress logs and a long-request heartbeat

## Typical workflow

1. Run importer against a live gallery URL.
2. Review generated JSON and remove any stray non-gallery images if needed.
3. Paste into the `images` repeater for the `galleries` block data.
4. In WordPress, ensure those image URLs are still valid or re-upload if required.

Or use the direct WordPress import command to skip manual paste.

## Notes

- The importer extracts image URLs from page HTML; it does not upload media into WordPress.
- Best results come when gallery images are in the page `main` content area.
- If no images are found, try a more specific `--scope` selector.
- Direct WordPress writes are always dry-run unless `--execute` is passed.
