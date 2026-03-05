import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  _cache,
  clearCache,
  getAllPages,
  getGalleryPhotos,
  getNavMenu,
  getPageBySlug,
  getPreviewPage,
  getSiteSettings,
} from '../wordpress'

const WP_URL = 'https://cms.example.com'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubEnv('WORDPRESS_URL', WP_URL)
  vi.stubGlobal('fetch', mockFetch)
  clearCache()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const ok = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  } as Response)

const fail = (status: number) =>
  Promise.resolve({ ok: false, status, statusText: 'Error', json: vi.fn() } as unknown as Response)

const mockPage = {
  id: 1,
  slug: 'home',
  status: 'publish',
  title: { rendered: 'Home' },
  content: { rendered: '<p>Hello</p>' },
  excerpt: { rendered: '' },
}

describe('getPageBySlug', () => {
  it('returns the first page matching the slug', async () => {
    mockFetch.mockReturnValueOnce(ok([mockPage]))
    const result = await getPageBySlug('home')
    expect(result).toEqual(mockPage)
    expect(mockFetch).toHaveBeenCalledWith(
      `${WP_URL}/wp-json/wp/v2/pages?slug=home&status=publish`,
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })

  it('URL-encodes the slug', async () => {
    mockFetch.mockReturnValueOnce(ok([]))
    await getPageBySlug('my page')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('slug=my%20page'),
      expect.any(Object),
    )
  })

  it('returns null when no page matches the slug', async () => {
    mockFetch.mockReturnValueOnce(ok([]))
    expect(await getPageBySlug('nonexistent')).toBeNull()
  })

  it('returns null when WordPress responds with an error status', async () => {
    mockFetch.mockReturnValueOnce(fail(500))
    expect(await getPageBySlug('home')).toBeNull()
  })

  it('returns null when WORDPRESS_URL is not set', async () => {
    vi.stubEnv('WORDPRESS_URL', '')
    clearCache()
    expect(await getPageBySlug('home')).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null when fetch throws a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    expect(await getPageBySlug('home')).toBeNull()
  })
})

describe('getAllPages', () => {
  it('returns all published pages', async () => {
    mockFetch.mockReturnValueOnce(ok([mockPage, { ...mockPage, id: 2, slug: 'about' }]))
    const result = await getAllPages()
    expect(result).toHaveLength(2)
  })

  it('returns an empty array when WordPress is unavailable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'))
    expect(await getAllPages()).toEqual([])
  })
})

describe('getGalleryPhotos', () => {
  it('returns gallery photos', async () => {
    const photo = {
      id: 1,
      title: { rendered: 'Wedding ceremony' },
      acf: {
        category: 'Weddings',
        full_image: { url: 'https://example.com/img.jpg', alt: 'Wedding' },
      },
    }
    mockFetch.mockReturnValueOnce(ok([photo]))
    const result = await getGalleryPhotos()
    expect(result).toHaveLength(1)
    expect(result[0].acf.category).toBe('Weddings')
  })

  it('returns an empty array when WordPress is unavailable', async () => {
    mockFetch.mockReturnValueOnce(fail(503))
    expect(await getGalleryPhotos()).toEqual([])
  })
})

describe('caching', () => {
  it('serves a cached response and does not re-fetch within the TTL', async () => {
    mockFetch.mockReturnValue(ok([mockPage]))
    await getPageBySlug('home')
    await getPageBySlug('home')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('re-fetches after the cache is explicitly cleared', async () => {
    mockFetch.mockReturnValue(ok([mockPage]))
    await getPageBySlug('home')
    clearCache()
    await getPageBySlug('home')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('exposes _cache for test introspection', async () => {
    mockFetch.mockReturnValue(ok([mockPage]))
    await getPageBySlug('home')
    expect(_cache.size).toBeGreaterThan(0)
    clearCache()
    expect(_cache.size).toBe(0)
  })
})

describe('getNavMenu', () => {
  it('fetches the primary navigation menu', async () => {
    const menuItems = [
      { id: 1, title: 'Home', url: '/', children: [] },
      {
        id: 2,
        title: 'Gallery',
        url: '/gallery',
        children: [{ id: 21, title: 'Weddings', url: '/gallery?category=Weddings', children: [] }],
      },
    ]
    mockFetch.mockReturnValueOnce(ok(menuItems))
    const result = await getNavMenu('primary')
    expect(result).toEqual(menuItems)
    expect(mockFetch).toHaveBeenCalledWith(
      `${WP_URL}/wp-json/sz/v1/nav-menu/primary`,
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })

  it('returns an empty array when WordPress is unavailable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'))
    expect(await getNavMenu()).toEqual([])
  })

  it('returns an empty array when the menu location has no items', async () => {
    mockFetch.mockReturnValueOnce(ok([]))
    expect(await getNavMenu('nonexistent')).toEqual([])
  })
})

describe('getPreviewPage', () => {
  it('fetches a page preview with the secret', async () => {
    mockFetch.mockReturnValueOnce(ok(mockPage))
    const result = await getPreviewPage(1, 'test-secret')
    expect(result).toEqual(mockPage)
    expect(mockFetch).toHaveBeenCalledWith(
      `${WP_URL}/wp-json/sz/v1/preview/1?secret=test-secret`,
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })

  it('returns null when the preview is not found', async () => {
    mockFetch.mockReturnValueOnce(fail(404))
    expect(await getPreviewPage(999, 'test-secret')).toBeNull()
  })

  it('returns null when the secret is invalid', async () => {
    mockFetch.mockReturnValueOnce(fail(403))
    expect(await getPreviewPage(1, 'wrong-secret')).toBeNull()
  })
})

describe('getSiteSettings', () => {
  const mockSettings = {
    site_name: 'My Studio',
    tagline: 'Best photos',
    copyright_text: '© 2026 My Studio',
    social_links: [{ platform: 'Instagram', url: 'https://instagram.com/mystudio' }],
  }

  it('fetches site settings from the options endpoint', async () => {
    mockFetch.mockReturnValueOnce(ok(mockSettings))
    const result = await getSiteSettings()
    expect(result).toEqual(mockSettings)
    expect(mockFetch).toHaveBeenCalledWith(
      `${WP_URL}/wp-json/sz/v1/site-settings`,
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })

  it('returns defaults when WordPress is unavailable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'))
    const result = await getSiteSettings()
    expect(result.site_name).toBe('Studio Zanetti')
    expect(result.tagline).toBe('Capturing moments, creating memories')
    expect(result.social_links.length).toBeGreaterThan(0)
  })

  it('fills in defaults for empty fields', async () => {
    mockFetch.mockReturnValueOnce(
      ok({
        site_name: '',
        tagline: '',
        copyright_text: '',
        social_links: [],
      }),
    )
    const result = await getSiteSettings()
    expect(result.site_name).toBe('Studio Zanetti')
    expect(result.tagline).toBe('Capturing moments, creating memories')
    expect(result.social_links.length).toBeGreaterThan(0)
  })
})
