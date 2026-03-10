/**
 * WordPress REST API client for Studio Zanetti.
 *
 * ─── WORDPRESS SETUP REQUIREMENTS ───────────────────────────────────────────
 *
 *  1. WordPress with REST API enabled (default in WP 4.7+).
 *
 *  2. Advanced Custom Fields Pro — OR — ACF free + "ACF to REST API" plugin.
 *     Every ACF field group must have "Show in REST API" enabled.
 *
 *  3. Environment variable:
 *       WORDPRESS_URL=https://cms.example.com   ← no trailing slash
 *
 * ─── CONTENT FLOW ───────────────────────────────────────────────────────────
 *
 *  the admin logs into WordPress → edits pages using Flexible Content blocks
 *  → publishes → the React Router SSR loader calls getPageBySlug() on every
 *  request and returns fresh content.
 *
 *  For statically pre-rendered pages (/, /about, /contact) a new build
 *  is needed to pick up content changes. Trigger one by:
 *    a) Pushing a git commit, OR
 *    b) Using the manual deploy button.
 *
 * ─── ACF FIELD GROUPS REQUIRED ──────────────────────────────────────────────
 *  See app/types/wordpress.ts for the full field schema.
 */

import type {
  ContentBlock,
  WPGalleryPhoto,
  WPImage,
  WPMenuItem,
  WPPage,
  WPSiteSettings,
} from '~/types/wordpress'

interface RawWPEmbeddedMedia {
  source_url?: string
  alt_text?: string
  media_details?: {
    width?: number
    height?: number
  }
}

interface RawWPPage extends WPPage {
  _embedded?: {
    'wp:featuredmedia'?: RawWPEmbeddedMedia[]
  }
}

// ─── Image normalisation ─────────────────────────────────────────────────────
//
// ACF image fields may arrive as a numeric attachment ID, a URL string, a
// full ACF array (with keys like url, alt, width, height, sizes …), or null.
// The server-side sz-headless.php filter resolves IDs → objects, but as a
// safety net we also normalise here so the front-end never crashes.

/**
 * Coerce a raw ACF image value to a WPImage or undefined.
 *
 * Accepted inputs:
 *   - `{ url: '…' }` → returned as WPImage
 *   - `number` / `string` that is purely numeric → **dropped** (cannot resolve client-side)
 *   - `'https://…'` → wrapped in `{ url, alt: '' }`
 *   - anything else → undefined
 */
function safeImage(raw: unknown): WPImage | undefined {
  if (!raw) return undefined

  // Already an object with `url`
  if (typeof raw === 'object' && raw !== null && 'url' in raw) {
    const img = raw as Record<string, unknown>
    if (typeof img.url === 'string' && img.url.length > 0) {
      return {
        url: img.url,
        alt: typeof img.alt === 'string' ? img.alt : '',
        width: typeof img.width === 'number' ? img.width : undefined,
        height: typeof img.height === 'number' ? img.height : undefined,
      }
    }
    return undefined
  }

  // URL string (not a bare numeric ID)
  if (typeof raw === 'string' && raw.startsWith('http')) {
    return { url: raw, alt: '' }
  }

  // Numeric attachment ID — can't resolve client-side, discard
  return undefined
}

/**
 * Walk every block in a page and normalise image fields so components
 * always receive `WPImage | undefined`, never a bare ID or wrong shape.
 */
function normalizeBlockImages(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((block) => {
    switch (block.acf_fc_layout) {
      case 'hero':
        return {
          ...block,
          background_image: safeImage(block.background_image),
          slides: Array.isArray(block.slides)
            ? (block.slides as unknown[])
                .map((s) => {
                  // Handle repeater row { image: …, tagline?: …, subtitle?: … } or flat image
                  if (typeof s === 'object' && s !== null && 'image' in s) {
                    const row = s as Record<string, unknown>
                    const img = safeImage(row.image)
                    if (!img) return undefined
                    return {
                      ...img,
                      tagline: typeof row.tagline === 'string' ? row.tagline : undefined,
                      subtitle: typeof row.subtitle === 'string' ? row.subtitle : undefined,
                    }
                  }
                  return safeImage(s)
                })
                .filter((img): img is WPImage => img !== undefined)
            : undefined,
        }

      case 'image_text':
        return {
          ...block,
          image: safeImage(block.image) ?? { url: '', alt: '' },
          image_mobile: safeImage(block.image_mobile),
        }

      case 'services_grid':
        return {
          ...block,
          services: block.services.map((svc) => ({
            ...svc,
            image: safeImage(svc.image),
          })),
        }

      case 'testimonial_carousel':
        return {
          ...block,
          testimonials: block.testimonials.map((t) => ({
            ...t,
            image: safeImage(t.image),
          })),
        }

      case 'process_timeline':
        return {
          ...block,
          steps: block.steps.map((step) => ({
            ...step,
            image: safeImage(step.image),
          })),
        }

      case 'gallery_categories':
        return {
          ...block,
          categories: block.categories.map((cat) => ({
            ...cat,
            image: safeImage(cat.image),
          })),
        }

      case 'instagram_feed':
        return {
          ...block,
          images: Array.isArray(block.images)
            ? (block.images as unknown[])
                .map((img) => safeImage(img))
                .filter((img): img is WPImage => img !== undefined)
            : [],
        }

      default:
        return block
    }
  })
}

function normalizePage(page: RawWPPage): WPPage {
  const featuredMedia = page._embedded?.['wp:featuredmedia']?.[0]
  const featured_image = featuredMedia?.source_url
    ? {
        url: featuredMedia.source_url,
        alt: featuredMedia.alt_text || page.title.rendered,
        width: featuredMedia.media_details?.width,
        height: featuredMedia.media_details?.height,
      }
    : undefined

  const acf = page.acf
    ? {
        ...page.acf,
        blocks: page.acf.blocks ? normalizeBlockImages(page.acf.blocks) : undefined,
      }
    : undefined

  return {
    ...page,
    featured_image,
    acf,
  }
}

const getWpUrl = (): string | null => process.env.WORDPRESS_URL || null

// In-process cache — avoids hammering WordPress on every SSR request.
// Cleared automatically on each new deployment (process restart).
const CACHE_TTL_MS = parseInt(process.env.WORDPRESS_CACHE_TTL_SECONDS || '60', 10) * 1_000

// Exported for testing only — do not call in application code.
export const _cache = new Map<string, { data: unknown; ts: number }>()

/** Clear the in-process cache. Useful for revalidation webhooks. */
export function clearCache(): void {
  _cache.clear()
}

/** Low-level typed fetch with in-process cache and error isolation. */
async function wpFetch<T>(path: string): Promise<T | null> {
  const baseUrl = getWpUrl()
  if (!baseUrl) return null

  const url = `${baseUrl}/wp-json${path}`

  const cached = _cache.get(url)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data as T
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) {
      console.error(`[WP] ${res.status} ${res.statusText} — ${url}`)
      return null
    }
    const data = (await res.json()) as T
    _cache.set(url, { data, ts: Date.now() })
    return data
  } catch (err) {
    console.error(`[WP] fetch failed — ${url}:`, err)
    return null
  }
}

/** Fetch a single published page by its slug. Returns null when not found or WP is unavailable. */
export async function getPageBySlug(slug: string): Promise<WPPage | null> {
  const pages = await wpFetch<RawWPPage[]>(
    `/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=publish&_embed=1`,
  )
  return pages?.[0] ? normalizePage(pages[0]) : null
}

/** Fetch all published pages. Used by react-router.config.ts for dynamic prerendering. */
export async function getAllPages(): Promise<WPPage[]> {
  const pages = await wpFetch<RawWPPage[]>('/wp/v2/pages?per_page=100&status=publish&_embed=1')
  return (pages ?? []).map(normalizePage)
}

/** Fetch all gallery photos (CPT: gallery_photo). Returns empty array when WP is unavailable. */
export async function getGalleryPhotos(): Promise<WPGalleryPhoto[]> {
  return (await wpFetch<WPGalleryPhoto[]>('/wp/v2/gallery_photo?per_page=100&status=publish')) ?? []
}

/**
 * Fetch a navigation menu by its registered theme location.
 * Returns a nested tree structure suitable for rendering with dropdown support.
 * Falls back to an empty array when WordPress is unavailable.
 */
export async function getNavMenu(location: string = 'primary'): Promise<WPMenuItem[]> {
  return (await wpFetch<WPMenuItem[]>(`/sz/v1/nav-menu/${encodeURIComponent(location)}`)) ?? []
}

/**
 * Fetch a page preview by post ID and a shared secret.
 * Used by the /preview route to render draft content from WordPress.
 */
export async function getPreviewPage(id: number, secret: string): Promise<WPPage | null> {
  return await wpFetch<WPPage>(`/sz/v1/preview/${id}?secret=${encodeURIComponent(secret)}`)
}

/** Default site settings used when WP is unavailable or options page not yet configured. */
const DEFAULT_SITE_SETTINGS: WPSiteSettings = {
  site_name: 'Studio Zanetti',
  tagline: 'Capturing moments, creating memories',
  copyright_text: '',
  social_links: [
    { platform: 'Instagram', url: 'https://instagram.com/example-studio' },
    { platform: 'Facebook', url: 'https://facebook.com/example-studio' },
  ],
}

/**
 * Fetch global site settings from the ACF Options Page.
 * These control header branding, footer text, and social links site-wide.
 * Falls back to sensible defaults when WordPress is unavailable.
 */
export async function getSiteSettings(): Promise<WPSiteSettings> {
  const data = await wpFetch<WPSiteSettings>('/sz/v1/site-settings')
  if (!data) return DEFAULT_SITE_SETTINGS
  return {
    site_name: data.site_name || DEFAULT_SITE_SETTINGS.site_name,
    tagline: data.tagline || DEFAULT_SITE_SETTINGS.tagline,
    copyright_text: data.copyright_text || DEFAULT_SITE_SETTINGS.copyright_text,
    social_links: data.social_links?.length
      ? data.social_links
      : DEFAULT_SITE_SETTINGS.social_links,
  }
}
