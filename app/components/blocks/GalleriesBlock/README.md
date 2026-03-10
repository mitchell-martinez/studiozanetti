# GalleriesBlock Component

A Flothemes-style, click-to-expand image gallery block for full-page portfolio sections.

## What It Does

- Lets the admin add all photos in one place under **Insert Images**.
- Auto-structures photos into equal-width columns.
- Uses **3 columns on desktop** and **2 columns on mobile**.
- Keeps **0.5rem spacing** between columns and items.
- Opens each image in a large modal preview on click.
- Includes a subtle "move into place" load animation.

## WordPress Admin Setup

1. Edit any page in WordPress.
2. In **Page Blocks**, add layout **galleries**.
3. Fill in:
   - **Heading** (optional)
   - **Insert Images** (required repeater)
     - **Image** (required)
     - **Caption** (optional)
   - **Desktop Columns** (optional, defaults to 3)
   - **Mobile Columns** (optional, defaults to 2)
   - **Section Theme / Spacing** (optional)

## Tips

- Upload a mix of portrait and landscape photos for a natural editorial rhythm.
- Keep image alt text descriptive for accessibility and SEO.
- Use captions only when they add value (location, moment, context).

## Import Existing Live Galleries

You can auto-generate this block data from an existing live gallery page:

```bash
npm run gallery:import-live -- --url https://studiozanetti.com.au/gallery/stylish-brides/
```

Or import straight into a WordPress page (dry-run by default):

```bash
npm run gallery:import-live-to-wp -- --source-url https://studiozanetti.com.au/gallery/stylish-brides/ --wp-url https://your-wordpress-site.com --page-slug your-page-slug
```

For full options and file output examples, see `docs/import-live-gallery.md`.
