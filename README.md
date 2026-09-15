# Studio Zanetti — Headless WordPress + React Router

Professional photography site for Studio Zanetti.  
Built with **React Router 7** (SSR) + **WordPress** as a headless CMS.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Do I need to write PHP? (No)](#2-do-i-need-to-write-php-no)
3. [Local quick start (no CMS needed)](#3-local-quick-start-no-cms-needed)
4. [Local dev with the mock WordPress server](#4-local-dev-with-the-mock-wordpress-server)
5. [Local dev with a real WordPress backend](#5-local-dev-with-a-real-wordpress-backend)
6. [Deploy to VPS](#6-deploy-to-vps)
7. [Branching strategy](#7-branching-strategy)
8. [WordPress production setup](#8-wordpress-production-setup)
9. [WordPress mu-plugins](#9-wordpress-mu-plugins)
10. [Block component library](#10-block-component-library)
11. [Adding a new block](#11-adding-a-new-block)
12. [Environment variables reference](#12-environment-variables-reference)
13. [GitHub Secrets reference](#13-github-secrets-reference)

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────┐
│  WordPress Admin (PHP)                                   │
│  the admin logs in here and manages ALL content           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Pages  →  ACF Flexible Content block builder   │    │
│  │  Gallery Library  →  reusable gallery entries    │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                              │
│              WordPress REST API (JSON)                  │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │  GET /wp-json/wp/v2/pages
                           │  GET /wp-json/wp/v2/sz_gallery
                           ▼
┌─────────────────────────────────────────────────────────┐
│  React Router 7 SSR (Node.js — this repo)               │
│                                                         │
│  Each route loader calls app/lib/wordpress.ts which     │
│  fetches JSON from WordPress and passes it to React.    │
│                                                         │
│  BlockRenderer dispatches by acf_fc_layout field:       │
│    "hero"          → HeroBlock.tsx                      │
│    "services_grid" → ServicesGridBlock.tsx              │
│    "pillar_grid"   → PillarGridBlock.tsx  … etc.        │
└─────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     Staging VPS (port 3001)   Production VPS (port 3000)
     Caddy → Docker container  Caddy → Docker container
```

**Content flow:**

1. the admin opens WordPress admin → opens a page → arranges blocks → fills in text and images → clicks **Publish**.
2. On the next page request the React Router SSR loader fetches the page from WordPress.
3. `BlockRenderer` maps each `acf_fc_layout` string to a React component and renders it.

No code changes or rebuilds needed for the admin to update content, reorder blocks, or create new pages.

---

## 2. Do I need to write PHP?

**There is 0 PHP in the components and blocks of this repo.** Here is the full separation:

| Who                 | Tool                                | Language                                        |
| ------------------- | ----------------------------------- | ----------------------------------------------- |
| **the admin**       | WordPress admin → ACF block builder | Clicks through a PHP-powered web UI — no coding |
| **React developer** | `app/components/blocks/*.tsx`       | TypeScript + React only                         |

**Why no PHP on the React side?**

Traditional WordPress themes use PHP _templates_ to render ACF blocks server-side into HTML.  
In our **headless** setup WordPress is purely a **data store and admin interface**.  
The ACF Flexible Content field group stores the admin's content in the WordPress database.  
The REST API exposes that content as **plain JSON** — the same format the mock server (`mock-wp/server.mjs`) returns for local development.

The React developer sees only this JSON and writes a React component to render it:

```json
{
  "acf_fc_layout": "services_grid",
  "heading": "What We Do",
  "services": [{ "title": "Weddings", "description": "…", "image": { "url": "…", "alt": "…" } }]
}
```

`BlockRenderer.tsx` switches on `acf_fc_layout` → calls the right component → **done**.  
**That's the entire integration — pure TypeScript, zero PHP.**

---

## 3. Local quick start (no CMS needed)

```bash
git clone <repo-url>
cd studiozanetti
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

All pages render using **hardcoded fallback data** built into each route.  
These fallbacks are identical to what the admin will see once WordPress is configured.  
Once `WORDPRESS_URL` is set the fallbacks are bypassed automatically — no code changes required.

---

## 4. Local dev with the mock WordPress server

This exercises every dynamic code path (blocks, gallery CPT, dynamic `/pricing` route, Yoast SEO meta) without needing a real WordPress installation.

### Step 1 — Create a local env file

```bash
cp .env.example .env.development.local
```

Edit `.env.development.local` and set:

```
WORDPRESS_URL=http://localhost:8787
```

> `.env.development.local` matches the `*.local` pattern in `.gitignore` — it will never be committed.

### Step 2 — Start the mock WP server

```bash
# Terminal 1
npm run dev:mock
```

```
╔══════════════════════════════════════════════════════════╗
║  mock-wp: WordPress REST API mock server                 ║
║  Listening on http://localhost:8787                      ║
╚══════════════════════════════════════════════════════════╝

  Mocked pages: home, about, contact, pricing
  Gallery photos: 12 items (Weddings, Portraits, Events)
```

### Step 3 — Start the React Router dev server

```bash
# Terminal 2
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**What you'll see:**

| URL        | Renders from           | Block types exercised                               |
| ---------- | ---------------------- | --------------------------------------------------- |
| `/`        | `PAGE_HOME` fixture    | `hero`, `services_grid`, `text_block`               |
| `/about`   | `PAGE_ABOUT` fixture   | `pillar_grid`                                       |
| `/contact` | `PAGE_CONTACT` fixture | ACF contact-details fields                          |
| `/gallery` | 12 mock gallery photos | Gallery CPT                                         |
| `/pricing` | `PAGE_PRICING` fixture | `image_text`, `pillar_grid` (dynamic `:slug` route) |

The `/pricing` page is the clearest demo of the headless CMS: the admin creates it in WordPress and it appears at `/pricing` with no code change.

Edit fixtures in `mock-wp/server.mjs` to test different block combinations.

---

## 5. Local dev with a real WordPress backend

If you have access to the live WordPress instance (or a staging WP install):

### Step 1 — Create a local env file

```bash
cp .env.example .env.development.local
```

### Step 2 — Set the real WordPress URL

Edit `.env.development.local`:

```
WORDPRESS_URL=https://your-wordpress-domain.example.com
# or your staging WP instance:
# WORDPRESS_URL=https://staging-cms.example.com
```

> The WordPress site must have the REST API enabled (default in WP 4.7+) and ACF fields configured to show in REST API. See [§ 8 WordPress production setup](#8-wordpress-production-setup).

### Step 3 — Start the dev server

```bash
npm run dev
```

The SSR loaders will now fetch live content from WordPress on every request.  
Hot-reload still works for code changes; browser refresh picks up WordPress content changes.

### Tip — re-enable the SSR cache only if you need it

Add to `.env.development.local`:

```
WORDPRESS_CACHE_TTL_SECONDS=60
```

By default the SSR WordPress cache is disabled, so content changes show up on the next request. Add a positive TTL only if you want to reduce repeated WordPress fetches during development.

---

## 6. Deploy to VPS

The deployment uses:

- **GitHub Container Registry (ghcr.io)** to store Docker images
- **Two Docker containers** on the same VPS — one for staging, one for production
- **Caddy** reverse-proxies external HTTPS traffic to each container

### Architecture on the VPS

```
Internet (HTTPS)
  │
  ├── staging.your-domain.example.com  ──→  Caddy ──→ localhost:3001
  │                                                  (zanetti-staging)
  └── your-domain.example.com          ──→  Caddy ──→ localhost:3000
                                                  (zanetti-prod)
```

---

### One-time VPS setup

1. Create a deployment directory on the VPS.
2. (Optional) Create a non-root deploy user with Docker group membership.
3. Generate an SSH key pair for GitHub Actions, add the public key to the VPS, and store the private key as a GitHub Secret.
4. Add DNS A records pointing your staging and production subdomains to the VPS IP.
5. Update your Caddyfile with reverse proxy blocks for each subdomain and reload Caddy.

---

### Add GitHub Secrets

Go to **GitHub → Settings → Secrets and variables → Actions → New repository secret** and add each of the following (full reference in [§ 13](#13-github-secrets-reference)):

| Secret                  | Value                                                       |
| ----------------------- | ----------------------------------------------------------- |
| `VPS_HOST`              | VPS IP address                                              |
| `VPS_USER`              | SSH username (e.g. `deploy` or `root`)                      |
| `VPS_SSH_KEY`           | Private SSH key for the deploy user                         |
| `GHCR_TOKEN`            | GitHub PAT with `read:packages` scope                       |
| `WORDPRESS_URL_STAGING` | Full URL of the staging WordPress instance (or leave blank) |
| `WORDPRESS_URL_PROD`    | Full URL of the production WordPress instance               |

---

### First deployment

Push to `main`:

```bash
git push origin main
```

GitHub Actions will:

1. Lint, typecheck, and run all unit tests
2. Build the Docker image and push it to GitHub Container Registry
3. SSH into your VPS, pull the image, and start the staging container

---

### Promote staging to production

When you're happy with what's on staging:

```bash
git push origin main:production
```

GitHub Actions builds the production image, deploys it, and the live site is updated.

---

### Routine workflow

```
Feature branch → PR → merge to main → staging auto-deploys → review → git push origin main:production
```

---

### Check container status on the VPS

```bash
ssh <user>@<VPS_IP>
docker ps                              # see both containers running
docker logs zanetti-staging --tail 50  # staging logs
docker logs zanetti-prod    --tail 50  # production logs
```

---

## 7. Branching strategy

| Branch                  | Deploys to | Trigger                         |
| ----------------------- | ---------- | ------------------------------- |
| `main`                  | Staging    | Auto on every push              |
| `production`            | Production | Auto on every push              |
| Any PR targeting `main` | Nowhere    | CI only (lint, test, typecheck) |

To release to production: `git push origin main:production`

---

## 8. WordPress production setup

> **Note:** The WordPress mu-plugins in this repo (`sz-headless.php` and `sz-acf-schema.php`) automate most of the setup below. See [§ 9 WordPress mu-plugins](#9-wordpress-mu-plugins) for details.

### Plugins required

| Plugin                                                                  | Why                                                              |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [Advanced Custom Fields Pro](https://www.advancedcustomfields.com/pro/) | Page builder UI for the admin                                    |
| [ACF to REST API](https://wordpress.org/plugins/acf-to-rest-api/)       | Exposes ACF fields in the REST API (built-in since ACF Pro 6.1+) |
| [Yoast SEO](https://wordpress.org/plugins/wordpress-seo/)               | Optional — adds `yoast_head_json` for rich meta tags             |

### ACF Field Groups

#### "Page Blocks" — Applied to: all Pages

Enable **Show in REST API** in each field group's settings.

Field: `blocks` (Flexible Content). The code-registered schema currently provides 15 layouts:

`hero`, `text_block`, `image_text`, `services_grid`, `pillar_grid`, `faq_accordion`, `form_block`, `pricing_packages`, `gallery_categories`, `gallery_reference`, `image_block`, `button_group`, `text_grid`, `instagram_feed`, and `blog_posts`.

#### Gallery Library

The `sz_gallery` post type is registered by `sz-headless.php`. Each Gallery Library entry stores a reusable description and ordered image rows. Pages display one of these entries through the `gallery_reference` block. No Custom Post Type UI setup or `gallery_photo` post type is required.

---

## 9. WordPress mu-plugins

Must-use plugins live in `wordpress/mu-plugins/` and should be copied into your WordPress installation at `wp-content/mu-plugins/`. They activate automatically and cannot be deactivated.

### `sz-headless.php` — Headless Configuration

Configures WordPress as a headless CMS for the React Router front-end.

**Features:**

- **Navigation menu endpoint** — `GET /wp-json/sz/v1/nav-menu/<location>` returns a nested JSON tree of menu items (with children for dropdowns). Registers the "Primary Navigation" menu location under Appearance → Menus.
- **Preview endpoint** — `GET /wp-json/sz/v1/preview/<id>?secret=<secret>` returns the latest autosave/revision of a page so the React front-end can render a live preview.
- **Front-end redirects** — Redirects all public page views on the WordPress domain to the React front-end. Also rewrites the "Preview" button and "View Page" permalinks in the admin to point at the React site.
- **Admin cleanup** — Hides Comments, keeps Posts available for the blog, disables Gutenberg for pages and posts, removes dashboard clutter, and redirects the admin landing page to the Pages list.
- **Editor layout CSS** — Adds minimal scoped CSS to keep the classic Page editor clean and predictable.

**Required `wp-config.php` constants:**

| Constant            | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `SZ_FRONTEND_URL`   | The public URL of the React Router app (e.g. `https://your-domain.example.com`) |
| `SZ_PREVIEW_SECRET` | A shared secret string for authenticating preview requests                      |

### `sz-acf-schema.php` — ACF Field Group Registration

Registers all ACF field groups for headless flexible content blocks **via code**, eliminating the need to manually configure field groups in the WordPress admin.

**What it does:**

- Defines the "Page Blocks" flexible content field group with the 15 layout keys listed in the production setup section.
- Each layout includes shared style fields (section theme, top/bottom spacing) for a consistent admin experience.
- Defines reusable gallery fields for the `sz_gallery` Gallery Library post type.
- Defines Page Settings, category settings, form configuration, Site Settings, public entity, and image-search metadata fields.

**Why this matters:**

Whenever a new block component is added or significantly updated on the React side, `sz-acf-schema.php` should be updated to match. This keeps the WordPress admin field configuration in sync with the front-end and avoids manual ACF setup.

---

## 10. Block component library

All block components live in `app/components/blocks/`.

The component folders mirror the 15 ACF layout keys: Hero, Text, Image + Text, Services Grid, Pillar Grid, FAQ Accordion, Form, Pricing Packages, Gallery Categories, Gallery Reference, Image, Button Group, Text Grid, Instagram Feed, and Blog Posts. `BlockRenderer` dispatches `acf_fc_layout` values to these components and silently skips unknown layouts.

---

## 11. Adding a new block

1. **In WordPress** — add a new layout to the "Page Blocks" Flexible Content field group.

2. **Add the TypeScript type** in `app/types/wordpress.ts`:

   ```ts
   export interface MyNewBlock {
     acf_fc_layout: 'my_new_block'
     heading: string
     body: string
   }
   ```

   Add it to the `ContentBlock` union.

3. **Create the React component** `app/components/blocks/MyNewBlock.tsx`.

4. **Register it** in `app/components/blocks/BlockRenderer.tsx`:

   ```tsx
   case 'my_new_block':
     return <MyNewBlock key={key} block={block} />
   ```

5. **Add fixture data** to `mock-wp/server.mjs` to test locally.

6. **Update `sz-acf-schema.php`** — add the new layout and its fields to the flexible content field group in `wordpress/mu-plugins/sz-acf-schema.php` so the WordPress admin can use the block.

7. **Write a test** in `app/components/blocks/__tests__/BlockRenderer.test.tsx`.

Unknown layouts are silently skipped — so the admin can add a layout in WordPress before the React component exists and the site won't break.

---

## 12. Environment variables reference

| Variable                      | Required | Default | Description                                                                                  |
| ----------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------- |
| `WORDPRESS_URL`               | No       | —       | WordPress base URL (no trailing slash). If unset, all routes use hardcoded fallback content. |
| `WORDPRESS_CACHE_TTL_SECONDS` | No       | `0`     | SSR cache TTL in seconds. Leave at `0` for fresh fetches on every request, or raise it to enable SSR caching. |
| `PORT`                        | No       | `3000`  | Port the SSR server listens on.                                                              |

**For local development:** copy `.env.example` to `.env.development.local` (gitignored).  
**For VPS deployment:** env vars are written to `.env.staging` / `.env.prod` by the deploy workflow using values from GitHub Secrets.  
**Never commit a `.env` file with real values.**

---

## 13. GitHub Secrets reference

Configure at: **GitHub → Settings → Secrets and variables → Actions**

| Secret                  | Description                                   |
| ----------------------- | --------------------------------------------- |
| `VPS_HOST`              | IP address of the VPS                         |
| `VPS_USER`              | SSH username for deployment                   |
| `VPS_SSH_KEY`           | Private SSH key for the deploy user           |
| `GHCR_TOKEN`            | GitHub PAT with `read:packages` scope         |
| `WORDPRESS_URL_STAGING` | Full URL of the staging WordPress instance    |
| `WORDPRESS_URL_PROD`    | Full URL of the production WordPress instance |
