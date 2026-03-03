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
6. [Deploy to Mammoth Cloud VPS](#6-deploy-to-mammoth-cloud-vps)
7. [Branching strategy](#7-branching-strategy)
8. [WordPress production setup](#8-wordpress-production-setup)
9. [Block component library](#9-block-component-library)
10. [Adding a new block](#10-adding-a-new-block)
11. [Environment variables reference](#11-environment-variables-reference)
12. [GitHub Secrets reference](#12-github-secrets-reference)

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
│  Each route loader calls app/lib/wordpress.ts which     │
│  fetches JSON from WordPress and passes it to React.    │
│                                                         │
│  BlockRenderer dispatches by acf_fc_layout field:       │
│    "hero"          → HeroBlock.tsx                      │
│    "services_grid" → ServicesGridBlock.tsx              │
│    "biography"     → BiographyBlock.tsx   … etc.        │
└─────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     Staging VPS (port 3001)   Production VPS (port 3000)
     Caddy → Docker container  Caddy → Docker container
```

**Content flow:**

1. Michael opens WordPress admin → opens a page → arranges blocks → fills in text and images → clicks **Publish**.
2. On the next page request the React Router SSR loader fetches the page from WordPress.
3. `BlockRenderer` maps each `acf_fc_layout` string to a React component and renders it.

No code changes or rebuilds needed for Michael to update content, reorder blocks, or create new pages.

---

## 2. Do I need to write PHP? (No)

> "ACF blocks are apparently PHP — is it true that they require PHP or can I build everything with React?"

**Short answer: the React developer writes zero PHP.** Here is the full separation:

| Who | Tool | Language |
|-----|------|----------|
| **Michael** | WordPress admin → ACF block builder | Clicks through a PHP-powered web UI — no coding |
| **React developer** | `app/components/blocks/*.tsx` | TypeScript + React only |

**Why no PHP on the React side?**

Traditional WordPress themes use PHP _templates_ to render ACF blocks server-side into HTML.  
In our **headless** setup WordPress is purely a **data store and admin interface**.  
The ACF Flexible Content field group stores Michael's content in the WordPress database.  
The REST API exposes that content as **plain JSON** — the same format the mock server (`mock-wp/server.mjs`) returns for local development.

The React developer sees only this JSON and writes a React component to render it:

```json
{
  "acf_fc_layout": "services_grid",
  "heading": "What We Do",
  "services": [
    { "title": "Weddings", "description": "…", "image": { "url": "…", "alt": "…" } }
  ]
}
```

`BlockRenderer.tsx` switches on `acf_fc_layout` → calls the right component → **done**.  
**That's the entire integration — pure TypeScript, zero PHP.**

---

## 3. Local quick start (no CMS needed)

```bash
git clone https://github.com/mitchell-martinez/studiozanetti
cd studiozanetti
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

All pages render using **hardcoded fallback data** built into each route.  
These fallbacks are identical to what Michael will see once WordPress is configured.  
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

| URL | Renders from | Block types exercised |
|-----|--------------|----------------------|
| `/` | `PAGE_HOME` fixture | `hero`, `services_grid`, `text_block` |
| `/about` | `PAGE_ABOUT` fixture | `biography`, `pillar_grid` |
| `/contact` | `PAGE_CONTACT` fixture | ACF contact-details fields |
| `/gallery` | 12 mock gallery photos | Gallery CPT |
| `/pricing` | `PAGE_PRICING` fixture | `image_text`, `pillar_grid` (dynamic `:slug` route) |

The `/pricing` page is the clearest demo of the headless CMS: Michael creates it in WordPress and it appears at `/pricing` with no code change.

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
WORDPRESS_URL=https://cms.studiozanetti.com
# or your staging WP instance:
# WORDPRESS_URL=https://staging-cms.studiozanetti.com
```

> The WordPress site must have the REST API enabled (default in WP 4.7+) and ACF fields configured to show in REST API. See [§ 8 WordPress production setup](#8-wordpress-production-setup).

### Step 3 — Start the dev server

```bash
npm run dev
```

The SSR loaders will now fetch live content from WordPress on every request.  
Hot-reload still works for code changes; browser refresh picks up WordPress content changes.

### Tip — disable the SSR cache during development

Add to `.env.development.local`:

```
WORDPRESS_CACHE_TTL_SECONDS=0
```

This forces a fresh WordPress fetch on every request so you see content changes instantly without restarting the server.

---

## 6. Deploy to Mammoth Cloud VPS

Your VPS already has Docker and Caddy set up. The deployment uses:

- **ghcr.io** (GitHub Container Registry) to store Docker images
- **two Docker containers** on the same VPS — one for staging (port 3001), one for production (port 3000)
- **Caddy** reverse-proxies external HTTPS traffic to each container

### Architecture on the VPS

```
Internet (HTTPS)
  │
  ├── staging.studiozanetti.mitchellmartinez.tech  ──→  Caddy ──→ localhost:3001
  │                                                              (zanetti-staging)
  └── studiozanetti.mitchellmartinez.tech          ──→  Caddy ──→ localhost:3000
                                                              (zanetti-prod)
```

---

### One-time VPS setup

SSH into the VPS and run these commands once:

```bash
# 1. Create the deployment directory
mkdir -p /opt/zanetti

# 2. Create a deploy user (optional but recommended)
#    If you prefer to use root, skip this and use root for VPS_USER
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy

# 3. Generate an ED25519 SSH key pair for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions@studiozanetti" -f /tmp/gh_deploy_key -N ""
# Add the PUBLIC key to the VPS:
cat /tmp/gh_deploy_key.pub >> /home/deploy/.ssh/authorized_keys
# (or ~/.ssh/authorized_keys if using root)
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Print the PRIVATE key — paste this into GitHub Secret VPS_SSH_KEY (see § 12)
cat /tmp/gh_deploy_key
rm /tmp/gh_deploy_key /tmp/gh_deploy_key.pub
```

---

### Add DNS records

In your domain registrar / DNS panel for `mitchellmartinez.tech`:

| Type | Name | Value |
|------|------|-------|
| A | `studiozanetti` | `<your VPS IP>` |
| A | `staging.studiozanetti` | `<your VPS IP>` |

Propagation can take up to 24 hours but is usually a few minutes.

---

### Update your Caddyfile

Add these two blocks to your existing Caddyfile (usually `/etc/caddy/Caddyfile` or managed via Docker):

```caddy
staging.studiozanetti.mitchellmartinez.tech {
    reverse_proxy localhost:3001
}

studiozanetti.mitchellmartinez.tech {
    reverse_proxy localhost:3000
}
```

Reload Caddy:

```bash
# If running as a system service:
systemctl reload caddy

# If running in Docker:
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Caddy automatically obtains and renews Let's Encrypt TLS certificates for both subdomains.

---

### Add GitHub Secrets

Go to **GitHub → Settings → Secrets and variables → Actions → New repository secret** and add each of the following (full reference in [§ 12](#12-github-secrets-reference)):

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Your Mammoth Cloud VPS IP address |
| `VPS_USER` | `deploy` (or `root` if you skipped deploy user) |
| `VPS_SSH_KEY` | The private key printed in the VPS setup step above |
| `GHCR_TOKEN` | GitHub PAT with `read:packages` scope (create at github.com → Settings → Developer settings → PATs) |
| `WORDPRESS_URL_STAGING` | `https://cms.studiozanetti.com` (or leave blank to use hardcoded fallback on staging) |
| `WORDPRESS_URL_PROD` | `https://cms.studiozanetti.com` |

---

### First deployment

Push to `main`:

```bash
git push origin main
```

GitHub Actions will:
1. Lint, typecheck, and run all unit tests
2. Build the Docker image and push it to `ghcr.io/mitchell-martinez/studiozanetti:main`
3. SSH into your VPS, pull the image, and start the `zanetti-staging` container

Visit **https://staging.studiozanetti.mitchellmartinez.tech** — the site is live.

---

### Promote staging to production

When you're happy with what's on staging:

```bash
git push origin main:production
```

GitHub Actions builds `ghcr.io/mitchell-martinez/studiozanetti:production`, deploys it, and the live site at **https://studiozanetti.mitchellmartinez.tech** is updated.

---

### Routine workflow

```
Feature branch → PR → merge to main → staging auto-deploys → review → git push origin main:production
```

---

### Check container status on the VPS

```bash
ssh deploy@<VPS_IP>
docker ps                              # see both containers running
docker logs zanetti-staging --tail 50  # staging logs
docker logs zanetti-prod    --tail 50  # production logs
```

---

## 7. Branching strategy

| Branch | Deploys to | Trigger |
|--------|-----------|---------|
| `main` | Staging | Auto on every push |
| `production` | Production | Auto on every push |
| Any PR targeting `main` | Nowhere | CI only (lint, test, typecheck) |

To release to production: `git push origin main:production`

---

## 8. WordPress production setup

### Plugins required

| Plugin | Why |
|--------|-----|
| [Advanced Custom Fields Pro](https://www.advancedcustomfields.com/pro/) | Page builder UI for Michael |
| [ACF to REST API](https://wordpress.org/plugins/acf-to-rest-api/) | Exposes ACF fields in the REST API (built-in since ACF Pro 6.1+) |
| [Yoast SEO](https://wordpress.org/plugins/wordpress-seo/) | Optional — adds `yoast_head_json` for rich meta tags |

### ACF Field Groups

#### "Page Blocks" — Applied to: all Pages

Enable **Show in REST API** in each field group's settings.

Field: `blocks` (Flexible Content)

| Layout key | Fields |
|-----------|--------|
| `hero` | `background_image` (Image), `title` (Text), `tagline` (Text), `cta_text` (Text), `cta_url` (URL) |
| `text_block` | `heading` (Text), `body` (WYSIWYG), `align` (Select: left/center), `cta_text` (Text), `cta_url` (URL) |
| `image_text` | `image` (Image), `heading` (Text), `body` (WYSIWYG), `image_position` (Select: left/right) |
| `services_grid` | `heading` (Text), `cta_text` (Text), `cta_url` (URL), `services` (Repeater → `title`, `description`, `image`) |
| `biography` | `image` (Image), `name` (Text), `role` (Text), `bio` (WYSIWYG) |
| `pillar_grid` | `heading` (Text), `pillars` (Repeater → `title`, `description`) |

#### "Contact Details" — Applied to: Page slug = `contact`

| Field key | Type |
|-----------|------|
| `contact_email` | Email |
| `contact_phone` | Text |
| `contact_address` | Text |
| `contact_hours` | Text |

#### Gallery Custom Post Type

Register CPT slug `gallery_photo` with REST API support enabled (e.g. via [Custom Post Type UI](https://wordpress.org/plugins/custom-post-type-ui/)).

Field Group "Gallery Photo" — Applied to: Post Type = `gallery_photo`

| Field key | Type |
|-----------|------|
| `category` | Select (Weddings / Portraits / Events) |
| `full_image` | Image (returns: array) |
| `thumbnail_image` | Image (returns: array) |

---

## 9. Block component library

All block components live in `app/components/blocks/`.

| File | Block layout key | What it renders |
|------|-----------------|-----------------|
| `HeroBlock.tsx` | `hero` | Full-viewport hero with background image, title, tagline, CTA |
| `TextBlock.tsx` | `text_block` | Heading + WYSIWYG body + optional CTA; left or center aligned |
| `ImageTextBlock.tsx` | `image_text` | Side-by-side image and text; image position configurable |
| `ServicesGridBlock.tsx` | `services_grid` | Responsive grid of service cards with image, title, description |
| `BiographyBlock.tsx` | `biography` | Photographer portrait, name, role, WYSIWYG bio |
| `PillarGridBlock.tsx` | `pillar_grid` | Grid of value/approach cards |
| `RichText.tsx` | _(shared)_ | Renders trusted WP WYSIWYG HTML |
| `BlockRenderer.tsx` | _(dispatcher)_ | Reads `acf_fc_layout` → calls the correct component; unknown layouts silently skipped |

---

## 10. Adding a new block

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

6. **Write a test** in `app/components/blocks/__tests__/BlockRenderer.test.tsx`.

Unknown layouts are silently skipped — so Michael can add a layout in WordPress before the React component exists and the site won't break.

---

## 11. Environment variables reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORDPRESS_URL` | No | — | WordPress base URL (no trailing slash). If unset, all routes use hardcoded fallback content. |
| `WORDPRESS_CACHE_TTL_SECONDS` | No | `60` | SSR cache TTL in seconds. Set to `0` to disable (useful in development). |
| `PORT` | No | `3000` | Port the SSR server listens on. |

**For local development:** copy `.env.example` to `.env.development.local` (gitignored).  
**For VPS deployment:** env vars are written to `.env.staging` / `.env.prod` by the deploy workflow using values from GitHub Secrets.  
**Never commit a `.env` file with real values.**

---

## 12. GitHub Secrets reference

Configure at: **GitHub → Settings → Secrets and variables → Actions**

| Secret | Where to get it |
|--------|----------------|
| `VPS_HOST` | IP address of your Mammoth Cloud VPS |
| `VPS_USER` | SSH username (`deploy` or `root`) |
| `VPS_SSH_KEY` | Private key generated during [VPS setup](#one-time-vps-setup) |
| `GHCR_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens → Fine-grained token → `read:packages` on this repo |
| `WORDPRESS_URL_STAGING` | Full URL of the staging WordPress instance (may be the same as prod during early development) |
| `WORDPRESS_URL_PROD` | Full URL of the production WordPress instance |


