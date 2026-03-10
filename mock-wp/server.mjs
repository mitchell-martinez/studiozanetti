#!/usr/bin/env node
/**
 * mock-wp/server.mjs
 *
 * Zero-dependency mock of the WordPress REST API used by Studio Zanetti.
 *
 * Run this alongside the React Router dev server to simulate a fully
 * wired-up headless CMS — no real WordPress installation needed.
 *
 * ─── QUICK START ─────────────────────────────────────────────────────────────
 *
 *  Terminal 1 (mock WP API):
 *    npm run dev:mock
 *
 *  Terminal 2 (React Router dev server):
 *    WORDPRESS_URL=http://localhost:8787 npm run dev
 *    # on Windows PowerShell:
 *    #   $env:WORDPRESS_URL="http://localhost:8787"; npm run dev
 *
 *  Or copy .env.example to .env.development.local and set
 *    WORDPRESS_URL=http://localhost:8787
 *  then just run `npm run dev` in terminal 2.
 *
 * ─── WHAT THIS MOCKS ─────────────────────────────────────────────────────────
 *
 *  All endpoints consumed by app/lib/wordpress.ts:
 *
 *   GET /wp-json/wp/v2/pages?slug=home
 *   GET /wp-json/wp/v2/pages?slug=about
 *   GET /wp-json/wp/v2/pages?slug=contact
 *   GET /wp-json/wp/v2/pages?slug=pricing      ← dynamic /:slug demo page
 *   GET /wp-json/wp/v2/pages?per_page=100      ← prerender discovery
 *   GET /wp-json/wp/v2/gallery_photo?per_page=100
 *   GET /wp-json/sz/v1/nav-menu/primary         ← navigation menu (dynamic)
 *   GET /wp-json/sz/v1/preview/:id?secret=...   ← page preview (draft)
 *
 * ─── WHY NO PHP? ─────────────────────────────────────────────────────────────
 *
 *  In traditional WordPress themes, ACF blocks are rendered by PHP templates.
 *  In our headless setup WordPress is purely a data store + admin UI.
 *  ACF stores block content in the database; the REST API exposes it as JSON.
 *  This React app never touches PHP — it only consumes the JSON responses that
 *  this mock server (and the real WordPress) produce.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createServer } from 'node:http'
import { URL } from 'node:url'

const PORT = parseInt(process.env.PORT ?? '8787', 10)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a picsum placeholder image in the WPImage shape our types expect. */
const img = (seed, w, h, altText) => ({
  url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
  alt: altText ?? `Studio Zanetti — ${seed}`,
  width: w,
  height: h,
})

// ─── Page fixtures ────────────────────────────────────────────────────────────
//
// These objects match the WPPage interface defined in app/types/wordpress.ts.
// ACF block layouts match the ContentBlock union type.
//
// the admin would create this content through the WordPress admin UI.
// Our React components receive it as plain JSON — identical to what you see here.

/** Home page — exercises hero, services_grid, and text_block. */
const PAGE_HOME = {
  id: 1,
  slug: 'home',
  status: 'publish',
  title: { rendered: 'Home' },
  content: { rendered: '' },
  excerpt: { rendered: '' },
  yoast_head_json: {
    title: 'Studio Zanetti — Professional Photography',
    description:
      'Studio Zanetti — professional photography studio specialising in weddings, portraits, and events. Capturing moments, creating memories.',
    og_image: [{ url: 'https://picsum.photos/seed/zanetti-hero/1200/630' }],
  },
  acf: {
    blocks: [
      {
        acf_fc_layout: 'hero',
        background_image: img('zanetti-hero', 1600, 900, 'Studio Zanetti studio hero'),
        title: 'Studio Zanetti',
        tagline: 'Capturing moments, creating memories',
        cta_text: 'View Gallery',
        cta_url: '/gallery',
      },
      {
        acf_fc_layout: 'services_grid',
        heading: 'What We Do',
        services: [
          {
            title: 'Weddings',
            description:
              'Timeless imagery of your most special day, from the first look to the last dance.',
            image: img('zanetti-wed', 600, 400, 'Wedding photography example'),
          },
          {
            title: 'Portraits',
            description:
              'Elegant, natural portraits that reveal character and capture genuine emotion.',
            image: img('zanetti-port', 600, 400, 'Portrait photography example'),
          },
          {
            title: 'Events',
            description: 'Dynamic event photography that tells the full story of your occasion.',
            image: img('zanetti-evt', 600, 400, 'Event photography example'),
          },
        ],
        cta_text: 'Browse Our Work',
        cta_url: '/gallery',
      },
      {
        acf_fc_layout: 'text_block',
        heading: 'Welcome to Studio Zanetti',
        body: "<p>We believe every photograph tells a story. Studio Zanetti is a premier photography studio dedicated to capturing the beauty, emotion, and authenticity of life's most precious moments — from intimate weddings to vibrant events and timeless portraits.</p><p>With an eye for detail and a passion for light, our work blends artistry with technical precision to create images that resonate for generations.</p>",
        align: 'center',
        cta_text: 'Learn About Us →',
        cta_url: '/about',
      },
    ],
  },
}

/** About page — exercises pillar_grid. */
const PAGE_ABOUT = {
  id: 2,
  slug: 'about',
  status: 'publish',
  title: { rendered: 'About Us' },
  content: { rendered: '' },
  excerpt: { rendered: '' },
  yoast_head_json: {
    title: 'About | Studio Zanetti',
    description:
      'Meet the team behind Studio Zanetti — passionate photographers dedicated to crafting beautiful, lasting images.',
  },
  acf: {
    blocks: [
      {
        acf_fc_layout: 'pillar_grid',
        heading: 'Our Approach',
        pillars: [
          {
            title: 'Natural Light',
            description:
              'We seek the magic in available light — golden hours, dappled shade, and soft interiors.',
          },
          {
            title: 'Authentic Moments',
            description:
              'Posed or candid, every image reflects genuine emotion and authentic connection.',
          },
          {
            title: 'Timeless Editing',
            description:
              'Our post-processing is subtle and elegant — enhancing, never overpowering.',
          },
          {
            title: 'Bespoke Service',
            description:
              'Every client is unique. We listen, collaborate, and tailor every session to your vision.',
          },
        ],
      },
    ],
  },
}

/** Contact page — exercises ACF contact-details fields (no blocks). */
const PAGE_CONTACT = {
  id: 3,
  slug: 'contact',
  status: 'publish',
  title: { rendered: 'Contact' },
  content: { rendered: '' },
  excerpt: { rendered: '' },
  yoast_head_json: {
    title: 'Contact | Studio Zanetti',
    description:
      "Get in touch with Studio Zanetti to book a session, discuss a project, or ask a question. We'd love to hear from you.",
  },
  acf: {
    contact_email: 'hello@example.com',
    contact_phone: '+39 055 123 4567',
    contact_address: 'Via della Vigna Nuova 18, Florence, Italy',
    contact_hours: 'Mon–Sat, 9:00am – 6:00pm',
  },
}

/**
 * Pricing page — demonstrates the dynamic /:slug catch-all route.
 * the admin can create any page in WordPress and it automatically
 * becomes available at its slug — no code change required.
 * This one uses image_text + pillar_grid blocks.
 */
const PAGE_PRICING = {
  id: 4,
  slug: 'pricing',
  status: 'publish',
  title: { rendered: 'Pricing' },
  content: { rendered: '' },
  excerpt: { rendered: '' },
  yoast_head_json: {
    title: 'Pricing | Studio Zanetti',
    description: 'Simple, transparent photography packages for every occasion.',
  },
  acf: {
    blocks: [
      {
        acf_fc_layout: 'image_text',
        image: img('zanetti-pricing', 800, 600, 'Studio Zanetti photographer at work'),
        heading: 'Simple, Transparent Pricing',
        body: '<p>Every package is tailored to your needs — no hidden fees, no surprises. Browse the options below and <a href="/contact">get in touch</a> to discuss the perfect package for you.</p>',
        image_position: 'right',
      },
      {
        acf_fc_layout: 'pillar_grid',
        heading: 'Our Packages',
        pillars: [
          {
            title: 'Classic — €890',
            description:
              'Up to 3 hours on location. 80 edited digital images delivered within 2 weeks. Perfect for engagement shoots and intimate portraits.',
          },
          {
            title: 'Signature — €1,650',
            description:
              'Full day coverage (up to 8 hours). 250 edited images, private online gallery, and one printed 30×40 cm fine-art print.',
          },
          {
            title: 'Prestige — €2,900',
            description:
              'Multi-day coverage. Unlimited editing rounds, premium leather album, and a 60-minute cinematic highlight reel.',
          },
        ],
      },
    ],
  },
}

/** All pages list — used by react-router.config.ts to discover slugs for prerendering. */
const ALL_PAGES = [PAGE_HOME, PAGE_ABOUT, PAGE_CONTACT, PAGE_PRICING]

// ─── Gallery photo fixtures ───────────────────────────────────────────────────
//
// These match the WPGalleryPhoto interface in app/types/wordpress.ts.
// the admin would upload each photo as a gallery_photo custom post in WP admin.

const makePhoto = (id, category, altText, seed) => ({
  id,
  title: { rendered: altText },
  acf: {
    category,
    full_image: img(seed, 1200, 900, altText),
    thumbnail_image: img(seed, 800, 600, altText),
  },
})

const GALLERY_PHOTOS = [
  makePhoto(101, 'Weddings', 'Wedding ceremony', 'zanetti1'),
  makePhoto(102, 'Weddings', 'First dance', 'zanetti2'),
  makePhoto(103, 'Weddings', 'Bridal portrait', 'zanetti3'),
  makePhoto(104, 'Weddings', 'Wedding reception', 'zanetti4'),
  makePhoto(105, 'Portraits', 'Studio portrait', 'zanetti5'),
  makePhoto(106, 'Portraits', 'Outdoor portrait', 'zanetti6'),
  makePhoto(107, 'Portraits', 'Family portrait', 'zanetti7'),
  makePhoto(108, 'Portraits', 'Corporate headshot', 'zanetti8'),
  makePhoto(109, 'Events', 'Corporate event', 'zanetti9'),
  makePhoto(110, 'Events', 'Birthday celebration', 'zanetti10'),
  makePhoto(111, 'Events', 'Conference photography', 'zanetti11'),
  makePhoto(112, 'Events', 'Gala dinner', 'zanetti12'),
]

// ─── Navigation menu fixture ──────────────────────────────────────────────────
//
// This mirrors what the sz-headless mu-plugin returns from WordPress's
// native Appearance → Menus. The admin can create any structure — including
// nested children (dropdown sub-links).
//
// The mock below demonstrates Gallery with sub-categories and a flat structure
// for the remaining items.

const NAV_MENU_PRIMARY = [
  { id: 10, title: 'Home', url: '/', children: [] },
  {
    id: 11,
    title: 'Gallery',
    url: '/gallery',
    children: [
      { id: 111, title: 'Weddings', url: '/gallery?category=Weddings', children: [] },
      { id: 112, title: 'Portraits', url: '/gallery?category=Portraits', children: [] },
      { id: 113, title: 'Events', url: '/gallery?category=Events', children: [] },
    ],
  },
  { id: 12, title: 'About', url: '/about', children: [] },
  { id: 13, title: 'Pricing', url: '/pricing', children: [] },
  { id: 14, title: 'Contact', url: '/contact', children: [] },
]

// ─── Route handlers ───────────────────────────────────────────────────────────

const PAGES_BY_SLUG = Object.fromEntries(ALL_PAGES.map((p) => [p.slug, p]))

function handlePages(searchParams) {
  const slug = searchParams.get('slug')
  if (slug) {
    const page = PAGES_BY_SLUG[slug]
    return page ? [page] : []
  }
  // per_page=100 (or any) request — return everything for prerender discovery
  return ALL_PAGES
}

function handleGalleryPhotos() {
  return GALLERY_PHOTOS
}

function handleNavMenu(location) {
  if (location === 'primary') return NAV_MENU_PRIMARY
  return []
}

function handlePreview(id) {
  // In the mock, just return the matching published page (real WP returns drafts)
  const page = ALL_PAGES.find((p) => p.id === Number(id))
  return page ?? null
}

// ─── HTTP server ──────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
}

const server = createServer((req, res) => {
  // Parse the URL (provide a base so Node can parse relative paths)
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Method not allowed' }))
    return
  }

  let body
  let status = 200

  if (path === '/wp-json/wp/v2/pages') {
    body = handlePages(url.searchParams)
    console.log(
      `[mock-wp] GET pages  slug=${url.searchParams.get('slug') ?? '(all)'}  → ${body.length} item(s)`,
    )
  } else if (path === '/wp-json/wp/v2/gallery_photo') {
    body = handleGalleryPhotos()
    console.log(`[mock-wp] GET gallery_photo → ${body.length} photo(s)`)
  } else if (path.startsWith('/wp-json/sz/v1/nav-menu/')) {
    const location = path.split('/').pop()
    body = handleNavMenu(location)
    console.log(`[mock-wp] GET nav-menu/${location} → ${body.length} item(s)`)
  } else if (path.startsWith('/wp-json/sz/v1/preview/')) {
    const id = path.split('/').pop()
    body = handlePreview(id)
    if (!body) {
      status = 404
      body = { message: 'Preview not found', id }
    }
    console.log(`[mock-wp] GET preview/${id} → ${body ? 'found' : '404'}`)
  } else {
    status = 404
    body = { message: 'Route not found', path }
    console.log(`[mock-wp] 404 ${path}`)
  }

  res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
})

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  mock-wp: WordPress REST API mock server                 ║
║  Listening on http://localhost:${PORT}                      ║
╚══════════════════════════════════════════════════════════╝

  Point the dev server at this mock by setting:
    WORDPRESS_URL=http://localhost:${PORT}

  Mocked pages: home, about, contact, pricing
  Gallery photos: ${GALLERY_PHOTOS.length} items (Weddings, Portraits, Events)
  Nav menu: primary (${NAV_MENU_PRIMARY.length} top-level items)
  Preview: /wp-json/sz/v1/preview/:id?secret=...

  Press Ctrl+C to stop.
`)
})
