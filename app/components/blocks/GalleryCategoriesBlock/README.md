# GalleryCategoriesBlock Component

Visual category tiles linking to gallery/category pages.

## WordPress Admin Setup

1. Edit a page in WordPress.
2. In **Content Blocks** add layout **gallery_categories**.
3. Fill fields:
   - **Heading** (optional)
   - **Categories** (repeater)
     - **Title** (required)
     - **Subtitle** (optional)
     - **Image** (optional, recommended)
     - **URL** (required)
   - **Section Theme / Spacing** (optional styling controls)

## Notes

- Good for sections like `The Brides`, `The Grooms`, `Candid`, `Engagements`.
- Use strong vertical images and clear short labels.
- This block pairs well with hierarchical gallery pages — see the [GalleriesBlock README](../GalleriesBlock/README.md#setting-up-gallery-pages-hierarchical-urls) for setup instructions on creating a parent "Gallery" page with child gallery pages underneath.
