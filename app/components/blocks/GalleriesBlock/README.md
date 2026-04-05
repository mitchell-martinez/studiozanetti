# GalleriesBlock Component

A Flothemes-style, click-to-expand image gallery block for full-page portfolio sections.

## What It Does

- Lets the admin add all photos in one place under **Insert Images**.
- Auto-structures photos into equal-width columns.
- Uses **3 columns on desktop** and **2 columns on mobile**.
- Keeps **0.5rem spacing** between columns and items.
- Applies fixed vertical rhythm using **Small spacing (2rem)** above title, title to description, description to gallery, and below gallery.
- Applies fixed gallery side padding of **2rem**.
- Opens each image in a large modal preview on click.
- Includes a subtle "move into place" load animation.

## WordPress Admin Setup

1. Edit any page in WordPress.
2. In **Page Blocks**, add layout **galleries**.
3. Fill in:
   - **Heading** (optional)
  - **Description** (optional)
   - **Insert Images** (required repeater)
     - **Image** (required)
     - **Caption** (optional)
   - **Desktop Columns** (optional, defaults to 3)
   - **Mobile Columns** (optional, defaults to 2)

Note: spacing around this component is intentionally fixed to keep configuration lightweight.

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

## Setting Up Gallery Pages (Hierarchical URLs)

To get clean URLs like `/gallery/stylish-brides/`, use WordPress page hierarchy:

1. Create a **parent page** called "Gallery" (slug: `gallery`).
   - This page acts as a container. Add a `GalleryCategoriesBlock` to it so visitors can browse all galleries, or leave it empty and set it to **noindex** via Yoast.
2. Create **child pages** for each gallery (e.g. "Stylish Brides").
   - In the page editor, under **Page Attributes → Parent**, select "Gallery".
   - Add a `GalleriesBlock` with the gallery images.
3. The frontend automatically resolves hierarchical paths — no code changes needed.

This approach means:
- The admin can create, rename, reorder, and delete gallery pages freely.
- SEO (canonical URLs, sitemap, Yoast meta) all work automatically for nested pages.
- There is no hard-coded `/gallery` route in the frontend.
