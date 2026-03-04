# WordPress Configuration — Studio Zanetti Headless CMS

This directory contains the WordPress must-use plugin (`mu-plugin`) that configures the WordPress backend for the headless React Router front-end.

---

## Quick Setup

### 1. Install the mu-plugin

Copy `mu-plugins/sz-headless.php` into your WordPress installation:

```
wp-content/
  mu-plugins/
    sz-headless.php   ← copy this file here
```

> **mu-plugins** are "must-use" plugins that are always active and cannot be deactivated from the admin. This is ideal for headless infrastructure code.

### 2. Add constants to `wp-config.php`

Open `wp-config.php` in your WordPress root and add these lines **above** the `/* That's all, stop editing! */` comment:

```php
// Studio Zanetti — Headless front-end URL
define( 'SZ_FRONTEND_URL', 'https://studiozanetti.com' );

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
WORDPRESS_URL=https://cms.studiozanetti.com
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
