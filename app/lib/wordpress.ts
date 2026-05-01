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

import { decodeHtmlEntities } from '~/lib/html'
import type {
  BlogPostsData,
  ContentBlock,
  HeroSlide,
  WPGalleryPhoto,
  WPImage,
  WPMenuItem,
  WPPage,
  WPPost,
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
                  if (typeof s !== 'object' || s === null) return safeImage(s)
                  const row = s as Record<string, unknown>

                  // Handle repeater row { image: …, tagline?: …, subtitle?: … }
                  if ('image' in row) {
                    const img = safeImage(row.image)
                    if (!img) return undefined
                    return {
                      ...img,
                      tagline: typeof row.tagline === 'string' ? row.tagline : undefined,
                      subtitle: typeof row.subtitle === 'string' ? row.subtitle : undefined,
                    }
                  }

                  // Flat image { url, alt, …, tagline?, subtitle? } (from PHP normalisation)
                  const img = safeImage(row)
                  if (!img) return undefined
                  return {
                    ...img,
                    tagline: typeof row.tagline === 'string' ? row.tagline : undefined,
                    subtitle: typeof row.subtitle === 'string' ? row.subtitle : undefined,
                  }
                })
                .filter((img): img is HeroSlide => img !== undefined)
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

      case 'gallery_categories':
        return {
          ...block,
          categories: block.categories.map((cat) => ({
            ...cat,
            image: safeImage(cat.image),
          })),
        }

      case 'galleries':
        return {
          ...block,
          images: Array.isArray(block.images)
            ? block.images
                .map((row) => {
                  const image = safeImage(row?.image)
                  if (!image) return null
                  return {
                    ...row,
                    image,
                  }
                })
                .filter((row): row is NonNullable<typeof row> => row !== null)
            : [],
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
        alt:
          featuredMedia.alt_text ||
          decodeHtmlEntities(page.title.rendered.replace(/<[^>]+>/g, '')).trim(),
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

/**
 * Resolve a hierarchical page path like "gallery/stylish-brides".
 *
 * Walks each segment left to right: finds "gallery" → gets its ID → finds
 * "stylish-brides" with that parent. Returns the deepest page, or null if
 * any segment in the chain doesn't exist.
 */
export async function getPageByPath(path: string): Promise<WPPage | null> {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return null

  // Single segment — just a flat lookup
  if (segments.length === 1) return getPageBySlug(segments[0])

  let parentId = 0
  let page: WPPage | null = null

  for (const segment of segments) {
    const parentParam = parentId ? `&parent=${parentId}` : ''
    const pages = await wpFetch<RawWPPage[]>(
      `/wp/v2/pages?slug=${encodeURIComponent(segment)}&status=publish${parentParam}&_embed=1`,
    )
    page = pages?.[0] ? normalizePage(pages[0]) : null
    if (!page) return null
    parentId = page.id
  }

  return page
}

/** Fetch all published pages. Used by react-router.config.ts for dynamic prerendering. */
export async function getAllPages(): Promise<WPPage[]> {
  const pages = await wpFetch<RawWPPage[]>('/wp/v2/pages?per_page=100&status=publish&_embed=1')
  return (pages ?? []).map(normalizePage)
}

/**
 * Build a slug→full-path map for all pages, respecting parent hierarchy.
 * E.g. a page with slug "stylish-brides" whose parent is "gallery" → "gallery/stylish-brides"
 */
export function buildPagePaths(pages: WPPage[]): Map<number, string> {
  const byId = new Map(pages.map((p) => [p.id, p]))
  const paths = new Map<number, string>()

  function resolve(page: WPPage): string {
    const cached = paths.get(page.id)
    if (cached) return cached
    const parent = page.parent ? byId.get(page.parent) : undefined
    const path = parent ? `${resolve(parent)}/${page.slug}` : page.slug
    paths.set(page.id, path)
    return path
  }

  for (const page of pages) resolve(page)
  return paths
}

/** Fetch all gallery photos (CPT: gallery_photo). Returns empty array when WP is unavailable. */
export async function getGalleryPhotos(): Promise<WPGalleryPhoto[]> {
  return (await wpFetch<WPGalleryPhoto[]>('/wp/v2/gallery_photo?per_page=100&status=publish')) ?? []
}

/**
 * Fetch a navigation menu by its registered theme location.
 * Returns a nested tree structure suitable for rendering with dropdown support.
 * Falls back to an empty array when WordPress is unavailable.
 *
 * Menu item titles are decoded from HTML entities (e.g. `&amp;` → `&`,
 * `&#038;` → `&`) so they render correctly in plain-text contexts like
 * the navigation menu where React would otherwise display the raw entity.
 */
export async function getNavMenu(location: string = 'primary'): Promise<WPMenuItem[]> {
  const items = (await wpFetch<WPMenuItem[]>(`/sz/v1/nav-menu/${encodeURIComponent(location)}`)) ?? []
  return decodeMenuTitles(items)
}

/** Recursively decode HTML entities in menu item titles. */
function decodeMenuTitles(items: WPMenuItem[]): WPMenuItem[] {
  return items.map((item) => ({
    ...item,
    title: typeof item.title === 'string' ? decodeHtmlEntities(item.title) : item.title,
    children: Array.isArray(item.children) ? decodeMenuTitles(item.children) : item.children,
  }))
}

/**
 * Fetch a page preview by post ID and a shared secret.
 * Used by the /preview route to render draft content from WordPress.
 */
export async function getPreviewPage(id: number, secret: string): Promise<WPPage | null> {
  const page = await wpFetch<RawWPPage>(`/sz/v1/preview/${id}?secret=${encodeURIComponent(secret)}`)
  return page ? normalizePage(page) : null
}

/** Default site settings used when WP is unavailable or options page not yet configured. */
const DEFAULT_SITE_SETTINGS: WPSiteSettings = {
  site_name: 'Studio Zanetti',
  tagline: 'Capturing moments, creating memories',
  copyright_text: '',
  social_links: [
    { platform: 'Instagram', url: 'https://instagram.com/studiozanetti' },
    { platform: 'Facebook', url: 'https://facebook.com/studiozanetti' },
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

// ─── Blog post helpers ──────────────────────────────────────────────────────

/**
 * Fetch paginated posts, optionally filtered by category IDs.
 * Uses the custom `sz/v1/blog-posts` endpoint which returns an envelope
 * with `{ posts, total, total_pages, page }`.
 */
export async function getPostsByCategories(
  categoryIds: number[] = [],
  page: number = 1,
  perPage: number = 6,
): Promise<BlogPostsData> {
  const empty: BlogPostsData = { posts: [], total: 0, total_pages: 0, page: 1 }
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })
  if (categoryIds.length > 0) {
    params.set('categories', categoryIds.join(','))
  }
  const data = await wpFetch<BlogPostsData>(`/sz/v1/blog-posts?${params}`)
  if (!data) return empty
  // Safety: ensure we always have the expected envelope shape
  if (Array.isArray(data))
    return {
      posts: data as unknown as WPPost[],
      total: (data as unknown[]).length,
      total_pages: 1,
      page,
    }
  if (!Array.isArray(data.posts)) return empty
  return data
}

/** Fetch a single published post by slug. Returns null when not found. */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>(
    `/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish`,
  )
  return posts?.[0] ?? null
}

/** Fetch related posts (same categories, excluding the current post). */
export async function getRelatedPosts(
  postId: number,
  categoryIds: number[],
  limit: number = 3,
): Promise<WPPost[]> {
  if (categoryIds.length === 0) return []
  const cats = categoryIds.join(',')
  const posts = await wpFetch<WPPost[]>(
    `/wp/v2/posts?categories=${cats}&exclude=${postId}&per_page=${limit}&status=publish`,
  )
  return posts ?? []
}

/**
 * Fetch all post slugs — used for prerendering and sitemap generation.
 * Uses the lightweight custom endpoint that returns only slugs.
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const data = await wpFetch<Array<{ slug: string }>>('/sz/v1/all-posts')
  return (data ?? []).map((p) => p.slug)
}
