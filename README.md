# Studio Zanetti — Headless WordPress + React Router

Professional photography site for Studio Zanetti.  
Built with **React Router 7** (SSR) + **WordPress** as a headless CMS.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Do I need to write PHP? (No)](#2-do-i-need-to-write-php-no)
3. [Local quick start (no CMS)](#3-local-quick-start-no-cms)
4. [Staging environment with mock WordPress](#4-staging-environment-with-mock-wordpress)
5. [WordPress production setup](#5-wordpress-production-setup)
6. [Block component library](#6-block-component-library)
7. [Adding a new block](#7-adding-a-new-block)
8. [Environment variables](#8-environment-variables)
9. [Deployment](#9-deployment)

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────┐
│  WordPress Admin (PHP)                                   │
│  Michael logs in here and manages ALL content           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Pages  →  ACF Flexible Content block builder   │    │
│  │  Gallery Photos  →  CPT with image upload       │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                              │
│              WordPress REST API (JSON)                  │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │  GET /wp-json/wp/v2/pages
                           │  GET /wp-json/wp/v2/gallery_photo
                           ▼
┌─────────────────────────────────────────────────────────┐
│  React Router 7 SSR (Node.js — this repo)               │
│                                                         │
│  Route loader calls app/lib/wordpress.ts on each        │
│  request → passes JSON to React components              │
│                                                         │
│  app/components/blocks/BlockRenderer.tsx                │
│    dispatches by acf_fc_layout → renders a React        │
│    component for each block Michael has placed          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                    Browser (HTML/CSS/JS)
```

**Content flow:**

1. Michael opens WordPress admin → opens a page → drags blocks into position, fills in text and images → clicks **Publish**.
2. On the next page request the React Router SSR loader calls `getPageBySlug(slug)`.
3. WordPress returns a JSON array containing the page's `acf.blocks` array.
4. `BlockRenderer` maps each `acf_fc_layout` string to a React component and renders it.

No rebuilds or code changes are needed for Michael to update existing content or reorder blocks.

---

## 2. Do I need to write PHP? (No)

> "ACF blocks are apparently PHP — is it true that they require PHP?"

**Short answer:** Michael uses PHP on the _WordPress side_ to manage content. The React developer writes **zero PHP**.

Here is the full separation:

| Who | Where | Language |
|-----|-------|----------|
| **Michael** | WordPress admin → ACF block builder | Uses a PHP-powered web UI, but never writes code |
| **React developer** | `app/components/blocks/*.tsx` | TypeScript + React only |

**Why no PHP on the React side?**

Traditional WordPress themes use PHP _templates_ to render ACF blocks server-side.  
In our **headless** setup WordPress is only a data store + admin interface.  
The ACF Flexible Content field group stores Michael's content in the WordPress database.  
The REST API (enabled by default in WP 4.7+) exposes that content as **plain JSON** — the same format this mock server returns.

ACF blocks in headless mode look like this:

```json
{
  "acf_fc_layout": "services_grid",
  "heading": "What We Do",
  "services": [
    { "title": "Weddings", "description": "…", "image": { "url": "…", "alt": "…" } }
  ]
}
```

The React developer sees only that JSON and writes a React component to render it.  
`BlockRenderer.tsx` switches on `acf_fc_layout` and calls the right component.  
**That's the entire integration — pure TypeScript.**

---

## 3. Local quick start (no CMS)

```bash
git clone https://github.com/mitchell-martinez/studiozanetti
cd studiozanetti
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

All pages render using the **hardcoded fallback data** built into each route — identical to what Michael will see once WordPress is configured. The fallbacks are in:

- `app/routes/home.tsx` — hero, services, intro text
- `app/routes/about.tsx` — biography, pillars
- `app/routes/contact.tsx` — contact details (`FALLBACK_CONTACT_ITEMS`)
- `app/routes/gallery.tsx` — 12 placeholder gallery images (`ALL_IMAGES`)

Once WordPress is live and `WORDPRESS_URL` is set, the fallbacks are bypassed automatically — no code changes required.

---

## 4. Staging environment with mock WordPress

To test the **dynamic CMS code path** (blocks rendering from real JSON, gallery from CPT data, dynamic `/pricing` route, Yoast SEO meta) without a real WordPress installation:

### Step 1 — Create your local env file

```bash
cp .env.example .env.development.local
```

Edit `.env.development.local` and set:

```
WORDPRESS_URL=http://localhost:8787
```

_(`.env.development.local` is gitignored via `*.local` — your secrets never commit.)_

### Step 2 — Start the mock WP server

```bash
npm run dev:mock
```

Output:
```
╔══════════════════════════════════════════════════════════╗
║  mock-wp: WordPress REST API mock server                 ║
║  Listening on http://localhost:8787                      ║
╚══════════════════════════════════════════════════════════╝

  Point the dev server at this mock by setting:
    WORDPRESS_URL=http://localhost:8787

  Mocked pages: home, about, contact, pricing
  Gallery photos: 12 items (Weddings, Portraits, Events)
```

### Step 3 — Start the dev server

In a second terminal:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**What you'll see with the mock server running:**

| URL | Rendered from | Block types demonstrated |
|-----|---------------|--------------------------|
| `/` | `PAGE_HOME` fixture | `hero`, `services_grid`, `text_block` |
| `/about` | `PAGE_ABOUT` fixture | `biography`, `pillar_grid` |
| `/contact` | `PAGE_CONTACT` fixture | ACF contact-details fields |
| `/gallery` | `GALLERY_PHOTOS` fixture | Gallery CPT (12 real photos) |
| `/pricing` | `PAGE_PRICING` fixture | `image_text`, `pillar_grid` (dynamic `:slug` route) |

The `/pricing` route is the clearest demonstration: Michael creates it in WordPress, and it appears on the site with no code change — powered by the `app/routes/$slug.tsx` catch-all.

### Mock server fixture data

All fixture data lives in `mock-wp/server.mjs` (inline, no separate files). Edit the fixtures to try different block combinations, then reload the browser — changes are picked up instantly.

---

## 5. WordPress production setup

### Plugins required

| Plugin | Why |
|--------|-----|
| [Advanced Custom Fields Pro](https://www.advancedcustomfields.com/pro/) | Page builder UI for Michael |
| [ACF to REST API](https://wordpress.org/plugins/acf-to-rest-api/) | Exposes ACF fields in `/wp-json/wp/v2/` (included automatically in ACF Pro 6.1+) |
| [Yoast SEO](https://wordpress.org/plugins/wordpress-seo/) | Optional — adds `yoast_head_json` to API responses for rich meta tags |

### ACF Field Groups

#### "Page Blocks" — Applied to: all Pages

Field: `blocks` (Flexible Content)

| Layout key | Fields |
|-----------|--------|
| `hero` | `background_image` (Image), `title` (Text), `tagline` (Text), `cta_text` (Text), `cta_url` (URL) |
| `text_block` | `heading` (Text), `body` (WYSIWYG), `align` (Select: left/center), `cta_text` (Text), `cta_url` (URL) |
| `image_text` | `image` (Image), `heading` (Text), `body` (WYSIWYG), `image_position` (Select: left/right) |
| `services_grid` | `heading` (Text), `cta_text` (Text), `cta_url` (URL), `services` (Repeater → `title`, `description`, `image`) |
| `biography` | `image` (Image), `name` (Text), `role` (Text), `bio` (WYSIWYG) |
| `pillar_grid` | `heading` (Text), `pillars` (Repeater → `title`, `description`) |

> **Important:** In each field group's settings, enable **Show in REST API**.

#### "Contact Details" — Applied to: Page slug = `contact`

| Field key | Type |
|-----------|------|
| `contact_email` | Email |
| `contact_phone` | Text |
| `contact_address` | Text |
| `contact_hours` | Text |

#### Gallery Custom Post Type (CPT)

Register a CPT with slug `gallery_photo` (e.g. using [Custom Post Type UI](https://wordpress.org/plugins/custom-post-type-ui/) with REST API support enabled).

Field Group "Gallery Photo" — Applied to: Post Type = `gallery_photo`

| Field key | Type |
|-----------|------|
| `category` | Select (choices: Weddings, Portraits, Events) |
| `full_image` | Image (returns: array) |
| `thumbnail_image` | Image (returns: array) |

### Environment variable

In the Fluccs deployment dashboard, add:

```
WORDPRESS_URL=https://cms.studiozanetti.com
```

---

## 6. Block component library

All block components live in `app/components/blocks/`.

| File | Block layout key | What it renders |
|------|-----------------|-----------------|
| `HeroBlock.tsx` | `hero` | Full-viewport hero with image, title, tagline, and CTA link |
| `TextBlock.tsx` | `text_block` | Heading + WYSIWYG body + optional CTA link; supports left/center alignment |
| `ImageTextBlock.tsx` | `image_text` | Side-by-side image and text; image position configurable |
| `ServicesGridBlock.tsx` | `services_grid` | Responsive grid of service cards with image, title, description |
| `BiographyBlock.tsx` | `biography` | Photographer bio with portrait image, name, role |
| `PillarGridBlock.tsx` | `pillar_grid` | Grid of value/approach cards (title + description) |
| `RichText.tsx` | (shared) | Renders trusted WP WYSIWYG HTML safely |
| `BlockRenderer.tsx` | (dispatcher) | Reads `acf_fc_layout` and renders the correct component; unknown layouts are silently skipped |

---

## 7. Adding a new block

1. **In WordPress** — add a new Flexible Content layout to the "Page Blocks" field group.
2. **Add the TypeScript type** in `app/types/wordpress.ts`:
   ```ts
   export interface MyNewBlock {
     acf_fc_layout: 'my_new_block'
     heading: string
     body: string
   }
   ```
   Add it to the `ContentBlock` union.
3. **Create the React component** in `app/components/blocks/MyNewBlock.tsx`.
4. **Register it** in `BlockRenderer.tsx`:
   ```tsx
   case 'my_new_block':
     return <MyNewBlock key={key} block={block} />
   ```
5. **Add fixture data** to `mock-wp/server.mjs` to test it locally.
6. **Write a test** in `app/components/blocks/__tests__/BlockRenderer.test.tsx`.

Unknown block layouts are silently skipped by `BlockRenderer` — so Michael can add a new layout in WordPress before the React component is built, and the site won't break.

---

## 8. Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORDPRESS_URL` | No | — | Base URL of WordPress (no trailing slash). If unset, all routes fall back to hardcoded data. |
| `WORDPRESS_CACHE_TTL_SECONDS` | No | `60` | How long to cache WP REST API responses in the SSR process. Set to `0` to disable. |

Copy `.env.example` to `.env.development.local` for local development.  
Set variables in the Fluccs dashboard for staging/production.

---

## 9. Deployment

```bash
npm run build   # builds SSR server + pre-renders /, /about, /contact
npm run start   # runs the SSR server
```

`react-router.config.ts` pre-renders static pages at build time. If `WORDPRESS_URL` is set at build time, it also pre-renders any extra pages Michael has created in WordPress (discovered via `GET /wp-json/wp/v2/pages`).

