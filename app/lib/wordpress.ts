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
 *  3. Environment variable (set in Fluccs deployment dashboard):
 *       WORDPRESS_URL=https://cms.studiozanetti.com   ← no trailing slash
 *
 * ─── CONTENT FLOW ───────────────────────────────────────────────────────────
 *
 *  Michael logs into WordPress → edits pages using Flexible Content blocks
 *  → publishes → the React Router SSR loader calls getPageBySlug() on every
 *  request and returns fresh content.
 *
 *  For statically pre-rendered pages (/, /about, /contact) a new Fluccs build
 *  is needed to pick up content changes. Trigger one by:
 *    a) Pushing a git commit, OR
 *    b) Using the Fluccs "manual deploy" button.
 *
 * ─── ACF FIELD GROUPS REQUIRED ──────────────────────────────────────────────
 *  See app/types/wordpress.ts for the full field schema.
 */

import type { WPGalleryPhoto, WPMenuItem, WPPage, WPSiteSettings } from '~/types/wordpress'

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
  const pages = await wpFetch<WPPage[]>(
    `/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=publish`,
  )
  return pages?.[0] ?? null
}

/** Fetch all published pages. Used by react-router.config.ts for dynamic prerendering. */
export async function getAllPages(): Promise<WPPage[]> {
  return (await wpFetch<WPPage[]>('/wp/v2/pages?per_page=100&status=publish')) ?? []
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
    social_links: data.social_links?.length ? data.social_links : DEFAULT_SITE_SETTINGS.social_links,
  }
}
