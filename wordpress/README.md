# WordPress Configuration — Studio Zanetti Headless CMS

This directory contains the WordPress must-use plugin (`mu-plugin`) that configures the WordPress backend for the headless React Router front-end.

---

## Quick Setup

### 1. Install the mu-plugins

Copy the required files into your WordPress installation:

```
wp-content/
  mu-plugins/
    sz-headless.php        ← headless config + APIs
    sz-media-folders.php   ← media folder organization
    sz-attachment-permalinks.php ← collision-proof media permalinks
```

> **mu-plugins** are "must-use" plugins that are always active and cannot be deactivated from the admin. This is ideal for headless infrastructure code.

### 1b. Media folders (new)

After `sz-media-folders.php` is installed, editors can organize assets under:

1. **Media -> Folders** to create folder structure (supports parent/child folders)
2. **Media -> Library** to filter by folder in list view
3. Attachment details panel to assign a file to a folder

This keeps a large media library manageable for non-technical admins.

### 1c. Media permalinks

`sz-attachment-permalinks.php` keeps attachment records from consuming useful page slugs. Attachment pages use ID-based URLs such as `/image/893/`, while internal attachment slugs use `sz-image-893`.

Existing media is migrated automatically in small batches whenever an administrator loads WordPress admin. This changes only WordPress attachment records. Uploaded files remain at their existing `/wp-content/uploads/...` URLs, so images already used by pages, ACF fields, galleries, and posts continue to work.

### 2. Add constants to `wp-config.php`

Open `wp-config.php` in your WordPress root and add these lines **above** the `/* That's all, stop editing! */` comment:

```php
// Studio Zanetti — Headless front-end URL
define( 'SZ_FRONTEND_URL', 'https://your-domain.example.com' );

// Shared secret for preview authentication (generate a long random string)
define( 'SZ_PREVIEW_SECRET', 'replace-with-a-random-secret-string' );
```

For local development:

```php
define( 'SZ_FRONTEND_URL', 'http://localhost:5173' );
define( 'SZ_PREVIEW_SECRET', 'dev-preview-secret' );
```

### 3. Required WordPress Plugins

| Plugin                              | Purpose                                  | Required?        |
| ----------------------------------- | ---------------------------------------- | ---------------- |
| **Advanced Custom Fields Pro**      | Page builder blocks via Flexible Content | Yes              |
| _or_ ACF free + **ACF to REST API** | Exposes ACF fields in REST API           | Yes (if not Pro) |
| **Yoast SEO**                       | Meta titles, descriptions, OG images     | Recommended      |

### 4. Set the frontend `.env`

In the React Router project, create a `.env` or `.env.local` file:

```env
WORDPRESS_URL=https://cms.example.com
PREVIEW_SECRET=replace-with-a-random-secret-string
```

---

## What the mu-plugin does

### Navigation Menus

**REST endpoint:** `GET /wp-json/sz/v1/nav-menu/primary`

The front-end Navbar and Footer are driven by WordPress native menus.

**Setup in WordPress admin:**

1. Go to **Appearance → Menus**
2. Create a new menu called "Primary Navigation"
3. Add pages, custom links, or categories as menu items
4. **To create dropdown sub-links:** drag a menu item slightly to the right under its parent
5. Under **Menu Settings** at the bottom, check the **"Primary Navigation"** location
6. Click **Save Menu**

**Example menu structure for a photography site:**

```
Home              → /
Gallery           → /gallery
  ├─ Weddings     → /gallery?category=Weddings
  ├─ Portraits    → /gallery?category=Portraits
  └─ Events       → /gallery?category=Events
About             → /about
Pricing           → /pricing
Contact           → /contact
```

The Navbar renders top-level items as links and child items as dropdown sub-menus. On mobile, dropdowns appear as expandable accordion sections.

> **Tip:** The Gallery sub-links use `?category=` query parameters. The Gallery page reads this from the URL and auto-filters to that category.

### Visual Site Menu Manager

The **Appearance → Menus → Site Menus** tab shows every page grouped by the menu that page uses as its site header. It reads and updates each page's **Menu Override** setting, which is the same setting the front-end uses to select a subsite. Pages with no override belong to the menu assigned to **Primary Navigation**.

To create and organize the weddings site:

1. Open **Appearance → Menus → Site Menus**.
2. Enter `Straight Weddings Site` for the site name and `weddings-site` for the menu slug, then select **Add site menu**.
3. Drag pages from **Primary Navigation** into **Straight Weddings Site**. Changes save their Menu Override automatically; this does not add the page as a visible navigation link.
4. Select a page name to preview it. The preview opens at full height on the right on desktop and in the bottom half of the screen on mobile. On desktop, drag its left edge or select the expand icon to change its width.
5. Select the **X**, press Escape, or select outside the preview to close it.

The menu dropdown and arrow buttons on each item provide alternatives to drag-and-drop. Use the standard **Edit Menus** tab to choose which pages and custom links are visibly shown in each navigation menu, create nested dropdown links, or edit a custom URL.

### Page Preview

**REST endpoint:** `GET /wp-json/sz/v1/preview/<page_id>?secret=<secret>`

When you click **"Preview"** on any page in WordPress, it opens the React front-end with a preview banner showing the draft content — exactly as it will look when published.

**How it works:**

1. WordPress "Preview" button URL is rewritten to point to `SZ_FRONTEND_URL/preview?id=<id>&secret=<secret>`
2. The React front-end calls back to WordPress to fetch the draft content
3. It renders using the same BlockRenderer components, with a gold "Preview Mode" banner

### Admin Cleanup

The mu-plugin automatically:

- **Hides the Posts menu** (not needed for a photography site that uses Pages and Gallery CPT)
- **Redirects the admin landing page** to the Pages list instead of the Dashboard
- **Removes unnecessary dashboard widgets** (Quick Draft, At a Glance, etc.)
- **Adds CSS fixes** to prevent the pages list from appearing "squished"
- **Hides the Comments menu** (not needed)

### CORS

The mu-plugin configures CORS headers on the REST API to allow requests from `SZ_FRONTEND_URL`.

### ACF REST API

The mu-plugin ensures ACF fields are exposed in the REST API via the `acf/rest_api/field_settings/show_in_rest` filter.

### Site Settings and public entities

Open **Site Settings** in the WordPress sidebar to manage the public facts used across the header, footer, and structured data. The fields are registered by `sz-acf-schema.php`; no manual ACF field-group setup is required.

Only enter information that is already intended to be public and can be verified:

1. **Site Name, Tagline, Copyright and Social Links** control the existing site branding and footer.
2. **Business Entity** supplies the business description, public contact details, full postal address, coordinates, service areas, logo, representative image, price range, founding date, awards, authoritative profile URLs, and reusable image-rights defaults.
3. **Primary Photographer** optionally publishes a linked Person entity. Enable it only when the named person should be publicly identified. Set **Business Relationship** to **Founder / owner** when the person owns the business or operates it as a sole trader; otherwise use **Employee**. Complete the public name and job title before using that person as an image or article creator.
4. **Service Catalog** is the authoritative list of services. Give every service a short stable key made from lowercase letters, numbers, and hyphens. Do not change a key after publishing because it forms the service's permanent structured-data ID.

Keep the public business name, address, phone number, and profile URLs consistent with external business listings. Blank optional fields are omitted from structured data rather than guessed.

### Page entities and selected images

The **Page Settings** panel provides two optional entity controls:

- **Primary Service** links a page to one service from the global catalog. Select the real service; the frontend never guesses from the page title or URL.
- **Venue Experience Page** enables a Place entity for pages substantially about one venue. Enter the public venue name, official URL, description, address, coordinates, and representative image.

Services Grid cards and Pricing Packages blocks also have an optional **Global Service** selector. Use it when the visible card or prices describe an authoritative service from Site Settings. Leave it blank for genuinely page-specific content; the frontend will publish a stable page-specific Service instead. Existing blocks continue to work without being edited.

For featured images, Hero images, Image blocks, Image + Text images, service images, and venue images, open the image in the Media Library to manage **Image Search Metadata**:

- Use **SEO Caption Override** only for a concise factual caption. The standard Media caption is used when the override is blank.
- Blank **Image Creator** values use the published Primary Photographer. Choose **Business / non-photographic asset** only for a logo, graphic, or other asset created by the business rather than the photographer.
- Use the licence, licensing-page, credit, and copyright overrides only when this image differs from the defaults under **Site Settings → Business Entity**. Never claim rights the business does not hold.
- Add **Location Created** only when the place is known and suitable for publication.

Always complete the standard Media Library alternative text for meaningful images. Alternative text remains an accessibility field; the SEO caption does not replace it.

### Page headings

Every Flexible Content page must render exactly one H1. A Hero title is the usual H1. Text, Image + Text, Image and Form blocks can also be configured as H1 when they are the page lead, but using more than one H1 blocks the page save.

Write a truthful, descriptive H1 that identifies the page's main subject. For a location-specific service page, naturally include the real service and area when useful. Do not repeat keywords or add locations the page does not serve. Other page sections should normally start at H2; heading-level skips appear as advisory audit findings.

Pages that use the native WordPress content editor instead of Flexible Content automatically render the page title as their H1.

### SEO, AI & Social manager

Open **SEO, AI & Social** in the WordPress sidebar. The existing URL and bookmarks remain valid.

The screen has two tabs:

1. **Search & Social Previews** manages canonical page titles, descriptions, and featured images with Google, Facebook, and X previews. These are the same fields used by each Page editor and continue to autosave.
2. **AI Searchability Audit** automatically reviews saved, non-container Pages. It does not send content to an AI service. Filter by page, status, or category, expand a page for evidence, and use the edit links to open the relevant page, Site Settings, or image. **Refresh Audit** recalculates one page after changes.

The audit groups transparent checks into Content Structure, Search & Social, Entity Graph, and Schema Consistency. Only zero or multiple H1 headings are publishing errors. Missing or long metadata, thin copy, heading skips, missing service/locality language, incomplete entities, image metadata, unresolved references, and incomplete FAQ rows are advisory warnings.

A page passing the audit does not guarantee rankings, rich results, or inclusion in an AI answer. The audit verifies code and editor inputs it can observe. Search authority still depends on useful original content, reputable links, consistent public business profiles and citations, relationships with venues and suppliers, and ongoing Search Console review.

The frontend emits one server-rendered Schema.org graph linking the business, website, optional primary photographer, services, pages, breadcrumbs, explicit venues, and selected images through stable IDs. It intentionally excludes self-serving Review/AggregateRating data, the deprecated ProfessionalService type, and a standalone Award type. FAQ data remains machine-readable only when complete visible FAQ rows exist; it should not be treated as a guaranteed Google rich-result feature.

### Lightweight WordPress tests

Run all pure-PHP validation and audit fixtures with:

```bash
npm run test:wordpress
```

The command requires a local `php` executable. It does not bootstrap WordPress or connect to production data.

---

## Developing Locally

Run the mock WordPress server instead of a real WordPress installation:

```bash
# Terminal 1 — mock WordPress API
npm run dev:mock

# Terminal 2 — React Router dev server
WORDPRESS_URL=http://localhost:8787 npm run dev
```

The mock server simulates all the endpoints including the nav menu and preview.

---

## Troubleshooting

| Problem                       | Solution                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| Navbar shows fallback links   | Check that a menu is assigned to the "Primary Navigation" location in Appearance → Menus              |
| Preview shows "404 Not Found" | Verify `SZ_PREVIEW_SECRET` matches in both `wp-config.php` and the frontend `.env`                    |
| ACF fields not in REST API    | Ensure "Show in REST API" is enabled on each ACF field group, or install the "ACF to REST API" plugin |
| Pages list looks squished     | The mu-plugin adds CSS fixes. Make sure `sz-headless.php` is in `wp-content/mu-plugins/`              |
| Posts menu still visible      | The `mu-plugins/` folder must be directly inside `wp-content/`, not a subfolder                       |
