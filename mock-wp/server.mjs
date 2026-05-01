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
 *   GET /wp-json/wp/v2/pages?slug=get-in-touch
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

/** Get in touch page — exercises the new form_block layout. */
const PAGE_GET_IN_TOUCH = {
  id: 6,
  slug: 'get-in-touch',
  status: 'publish',
  title: { rendered: 'Get in Touch' },
  content: { rendered: '' },
  excerpt: { rendered: '' },
  yoast_head_json: {
    title: 'Get in Touch | Studio Zanetti',
    description:
      'Tell us what you are planning and Studio Zanetti will get back to you promptly.',
  },
  acf: {
    blocks: [
      {
        acf_fc_layout: 'text_block',
        heading: 'Tell us what you need',
        body: '<p>Please fill out the form below and include anything relevant to your plans. If you would rather speak directly, you can still email or call us using the details above.</p>',
        align: 'left',
        block_align: 'left',
        max_width: 'narrow',
      },
      {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        heading: 'Get in touch',
        heading_tag: 'h2',
        heading_align: 'left',
        intro: '<p>Please fill in what is relevant to your needs and we will get back to you promptly.</p>',
        submit_text: 'Send message',
        submit_alignment: 'center',
        success_message: 'Thanks for reaching out. We will reply as soon as possible.',
        email_subject: 'New enquiry from Studio Zanetti',
        email_to: 'hello@example.com',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Your full name',
            autocomplete: 'name',
            required: true,
          },
          {
            field_id: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'you@example.com',
            autocomplete: 'email',
            required: true,
          },
          {
            field_id: 'mobile_number',
            label: 'Mobile number',
            type: 'tel',
            placeholder: '+61',
            autocomplete: 'tel',
          },
          {
            field_id: 'company',
            label: 'Company',
            type: 'text',
          },
          {
            field_id: 'date_required',
            label: 'Date photography required',
            type: 'date',
          },
          {
            field_id: 'location',
            label: 'Location of event',
            type: 'text',
          },
          {
            field_id: 'attendees',
            label: 'How many attendees',
            type: 'number',
            min: 0,
            step: 1,
          },
          {
            field_id: 'preferred_contact',
            label: 'Preferred contact method',
            type: 'radio',
            required: true,
            options: [
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'phone' },
            ],
          },
          {
            field_id: 'message',
            label: 'Message or questions',
            type: 'textarea',
            rows: 6,
            placeholder: 'Tell us a little about your plans',
          },
          {
            field_id: 'privacy_consent',
            label: 'Privacy consent',
            type: 'checkbox',
            required: true,
            options: [
              {
                label: 'I agree to be contacted about my enquiry.',
                value: 'consent_contact',
              },
              {
                label: 'I agree to receive occasional updates.',
                value: 'consent_updates',
              },
            ],
          },
        ],
      },
    ],
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
const ALL_PAGES = [PAGE_HOME, PAGE_ABOUT, PAGE_CONTACT, PAGE_GET_IN_TOUCH, PAGE_PRICING]

// ─── Blog post fixtures ───────────────────────────────────────────────────────

const makePost = (id, slug, title, excerpt, content, date, categoryIds, seeds) => ({
  id,
  slug,
  title: { rendered: title },
  content: { rendered: content },
  excerpt: { rendered: `<p>${excerpt}</p>` },
  date,
  modified: date,
  featured_image: seeds ? img(seeds, 800, 500, title) : undefined,
  categories: categoryIds.map((cid) => ({ id: cid, name: `Category ${cid}`, slug: `cat-${cid}` })),
  reading_time: Math.ceil(content.split(' ').length / 200) || 3,
})

const MOCK_POSTS = [
  makePost(
    201, 'golden-hour-wedding-shoot', 'Golden Hour Wedding Shoot',
    'Tips for capturing stunning golden hour portraits on a wedding day.',
    '<p>Golden hour — that magical window just before sunset — is the holy grail of wedding photography. The warm, diffused light flatters every skin tone and wraps the couple in a warm, romantic glow.</p><p>In this post, we share our favourite techniques for making the most of those precious 30 minutes: choosing the right aperture, managing lens flare creatively, and posing naturally in fading light.</p><p>We also discuss how to communicate timing with wedding coordinators so you never miss the window, and how to use reflectors when the light drops lower than expected.</p>',
    '2025-01-15T10:00:00', [1], 'post-golden',
  ),
  makePost(
    202, 'behind-the-scenes-studio-portraits', 'Behind the Scenes: Studio Portraits',
    'A look at how we set up studio portrait sessions for natural, relaxed results.',
    '<p>Studio portraits can feel intimidating for clients, but the environment is one we can control completely. In this behind-the-scenes tour, we walk through our lighting setup, backdrop choices, and the warm-up routine we use to help subjects relax in front of the camera.</p><p>From continuous lights to strobes, we discuss the trade-offs and explain why we lean towards a two-light setup with a large softbox key and a subtle rim accent.</p>',
    '2025-02-10T09:30:00', [2], 'post-studio',
  ),
  makePost(
    203, 'event-photography-checklist', 'Event Photography Checklist',
    'Essential gear and planning tips for corporate and social event photography.',
    '<p>Events move fast. There are no second chances for the keynote speaker moment or the surprise toast. This checklist covers everything from dual-body setups to backup memory cards, plus a pre-event questionnaire template you can send to clients.</p><p>We also share our post-event workflow for culling, colour-grading, and delivering a polished gallery within 48 hours.</p>',
    '2025-03-05T14:00:00', [1, 2], 'post-event',
  ),
  makePost(
    204, 'choosing-your-wedding-photographer', 'How to Choose Your Wedding Photographer',
    'A guide for couples navigating the process of selecting the right photographer.',
    '<p>Choosing a wedding photographer is one of the most personal decisions you will make during the planning process. Unlike flowers or décor, your photos are the lasting record of the day.</p><p>In this guide, we break down what to look for in a portfolio, questions to ask during the consultation, red flags to watch for in contracts, and how to judge whether a photographer\'s style truly matches your vision.</p>',
    '2025-04-01T08:00:00', [1], 'post-choose',
  ),
  makePost(
    205, 'spring-mini-sessions', 'Spring Mini Sessions Now Open',
    'Book your 30-minute spring portrait session before spots fill up.',
    '<p>Spring is here, and with it comes fresh blooms, soft light, and the perfect backdrop for family and couple portraits. Our annual spring mini sessions are live — each one is a focused 30-minute session at a hand-picked outdoor location.</p><p>You\'ll receive 15 edited digital images and a printable favourite within one week. Sessions book out fast, so we recommend reserving your slot early.</p>',
    '2025-04-20T11:00:00', [2], 'post-spring',
  ),
  makePost(
    206, 'editing-workflow-lightroom', 'Our Editing Workflow in Lightroom',
    'A peek into the post-processing pipeline we use to achieve our signature look.',
    '<p>Post-processing is where a good photo becomes a great one. In this post, we open up our Lightroom Classic workflow — from RAW import and star-rating culling to our custom preset stack and final export settings.</p><p>We cover colour theory basics, how to maintain skin-tone consistency, and the subtle split-toning technique that gives our images their warm, filmic quality.</p>',
    '2025-05-12T16:00:00', [1, 2], 'post-editing',
  ),
]

// Map posts to their parent page IDs (mock: all posts belong to a "blog" page with id 5)
const PAGE_BLOG = {
  id: 5,
  slug: 'blog',
  status: 'publish',
  title: { rendered: 'Blog' },
  content: { rendered: '' },
  excerpt: { rendered: '' },
  yoast_head_json: {
    title: 'Blog | Studio Zanetti',
    description: 'Photography tips, behind-the-scenes stories, and studio news from Studio Zanetti.',
  },
  acf: {
    blocks: [
      {
        acf_fc_layout: 'hero',
        title: 'Blog',
        tagline: 'Stories, tips, and inspiration from the studio',
      },
      {
        acf_fc_layout: 'blog_posts',
        heading: 'Latest Posts',
        categories: [],
        posts_per_page: 4,
        show_pagination: true,
        layout: 'grid',
        max_columns: 3,
        card_style: 'elevated',
        show_excerpt: true,
        show_featured_image: true,
        show_date: true,
        show_reading_time: true,
      },
    ],
  },
}

ALL_PAGES.push(PAGE_BLOG)

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
  { id: 14, title: 'Contact', url: '/get-in-touch', children: [] },
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

function handleBlogPosts(searchParams) {
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = parseInt(searchParams.get('per_page') ?? '6', 10)
  const categories = searchParams.get('categories')

  let matchingPosts = [...MOCK_POSTS]
  if (categories) {
    const catIds = categories.split(',').map(Number)
    matchingPosts = matchingPosts.filter((p) =>
      p.categories.some((c) => catIds.includes(c.id)),
    )
  }

  const sorted = matchingPosts.sort((a, b) => new Date(b.date) - new Date(a.date))
  const total = sorted.length
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage
  const posts = sorted.slice(start, start + perPage)
  return { posts, total, total_pages: totalPages, page }
}

function handleAllPosts() {
  return MOCK_POSTS.map((p) => ({ slug: p.slug }))
}

function handleWpPosts(searchParams) {
  const slug = searchParams.get('slug')
  if (slug) {
    const post = MOCK_POSTS.find((p) => p.slug === slug)
    return post ? [post] : []
  }
  const exclude = searchParams.get('exclude')
  const categories = searchParams.get('categories')
  const perPage = parseInt(searchParams.get('per_page') ?? '10', 10)
  let filtered = [...MOCK_POSTS]
  if (exclude) {
    const excludeId = parseInt(exclude, 10)
    filtered = filtered.filter((p) => p.id !== excludeId)
  }
  if (categories) {
    const catIds = categories.split(',').map(Number)
    filtered = filtered.filter((p) => p.categories.some((c) => catIds.includes(c.id)))
  }
  return filtered.slice(0, perPage)
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
  } else if (path === '/wp-json/sz/v1/blog-posts') {
    body = handleBlogPosts(url.searchParams)
    console.log(`[mock-wp] GET blog-posts → ${body.posts.length} post(s)`)
  } else if (path === '/wp-json/sz/v1/all-posts') {
    body = handleAllPosts()
    console.log(`[mock-wp] GET all-posts → ${body.length} slug(s)`)
  } else if (path === '/wp-json/wp/v2/posts') {
    body = handleWpPosts(url.searchParams)
    console.log(`[mock-wp] GET posts slug=${url.searchParams.get('slug') ?? '(query)'} → ${body.length} item(s)`)
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

  Mocked pages: home, about, contact, get-in-touch, pricing, blog
  Gallery photos: ${GALLERY_PHOTOS.length} items (Weddings, Portraits, Events)
  Blog posts: ${MOCK_POSTS.length} items
  Nav menu: primary (${NAV_MENU_PRIMARY.length} top-level items)
  Preview: /wp-json/sz/v1/preview/:id?secret=...

  Press Ctrl+C to stop.
`)
})
