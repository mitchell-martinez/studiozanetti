import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import mockGalleryPhotoData from '../__mocks__/mockGalleryPhoto.json'
import mockNavMenuItemsData from '../__mocks__/mockNavMenuItems.json'
import mockPageData from '../__mocks__/mockPage.json'
import mockSettingsData from '../__mocks__/mockSettings.json'
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

const mockPage = { ...mockPageData }

describe('getPageBySlug', () => {
  it('returns the first page matching the slug', async () => {
    mockFetch.mockReturnValueOnce(ok([mockPage]))
    const result = await getPageBySlug('home')
    expect(result).toEqual(mockPage)
    expect(mockFetch).toHaveBeenCalledWith(
      `${WP_URL}/wp-json/wp/v2/pages?slug=home&status=publish&_embed=1`,
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })

  it('maps featured image from embedded media when present', async () => {
    mockFetch.mockReturnValueOnce(
      ok([
        {
          ...mockPage,
          _embedded: {
            'wp:featuredmedia': [
              {
                source_url: 'https://example.com/featured.jpg',
                alt_text: 'Featured alt',
                media_details: { width: 1600, height: 900 },
              },
            ],
          },
        },
      ]),
    )

    const result = await getPageBySlug('home')
    expect(result?.featured_image).toEqual({
      url: 'https://example.com/featured.jpg',
      alt: 'Featured alt',
      width: 1600,
      height: 900,
    })
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
    const photo = { ...mockGalleryPhotoData }
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
    const menuItems = mockNavMenuItemsData
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
  const mockSettings = { ...mockSettingsData }

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

// ─── Image normalisation ─────────────────────────────────────────────────────

describe('image normalisation in normalizePage', () => {
  const pageWithBlocks = (blocks: unknown[]) => ({
    ...mockPage,
    acf: { blocks },
  })

  it('passes through valid WPImage objects untouched', async () => {
    const img = { url: 'https://example.com/photo.jpg', alt: 'Photo', width: 800, height: 600 }
    mockFetch.mockReturnValueOnce(
      ok([pageWithBlocks([{ acf_fc_layout: 'image_text', image: img, body: '<p>Text</p>' }])]),
    )
    const page = await getPageBySlug('home')
    const block = page?.acf?.blocks?.[0]
    expect(block).toBeDefined()
    if (block?.acf_fc_layout === 'image_text') {
      expect(block.image).toEqual(img)
    }
  })

  it('drops numeric attachment IDs (cannot resolve client-side)', async () => {
    mockFetch.mockReturnValueOnce(
      ok([pageWithBlocks([{ acf_fc_layout: 'image_text', image: 12345, body: '<p>Text</p>' }])]),
    )
    const page = await getPageBySlug('home')
    const block = page?.acf?.blocks?.[0]
    if (block?.acf_fc_layout === 'image_text') {
      // Falls back to { url: '', alt: '' } for image_text since image is required
      expect(block.image).toEqual({ url: '', alt: '' })
    }
  })

  it('wraps a plain URL string into a WPImage', async () => {
    mockFetch.mockReturnValueOnce(
      ok([
        pageWithBlocks([
          {
            acf_fc_layout: 'image_text',
            image: 'https://example.com/photo.jpg',
            body: '<p>Text</p>',
          },
        ]),
      ]),
    )
    const page = await getPageBySlug('home')
    const block = page?.acf?.blocks?.[0]
    if (block?.acf_fc_layout === 'image_text') {
      expect(block.image).toEqual({ url: 'https://example.com/photo.jpg', alt: '' })
    }
  })

  it('normalises hero slides from repeater rows { image: … } to flat WPImage[]', async () => {
    const imgObj = { url: 'https://example.com/slide.jpg', alt: 'Slide', width: 1920, height: 1080 }
    mockFetch.mockReturnValueOnce(
      ok([
        pageWithBlocks([
          {
            acf_fc_layout: 'hero',
            title: 'Test',
            slides: [{ image: imgObj }, { image: 99999 }],
          },
        ]),
      ]),
    )
    const page = await getPageBySlug('home')
    const block = page?.acf?.blocks?.[0]
    if (block?.acf_fc_layout === 'hero') {
      // Numeric-only slide should be filtered out
      expect(block.slides).toEqual([imgObj])
    }
  })

  it('preserves tagline and subtitle on hero slides', async () => {
    const imgObj = { url: 'https://example.com/slide.jpg', alt: 'Slide', width: 1920, height: 1080 }
    mockFetch.mockReturnValueOnce(
      ok([
        pageWithBlocks([
          {
            acf_fc_layout: 'hero',
            title: 'Test',
            slides: [
              { image: imgObj, tagline: 'My Tagline', subtitle: 'My Subtitle' },
              { image: imgObj },
            ],
          },
        ]),
      ]),
    )
    const page = await getPageBySlug('home')
    const block = page?.acf?.blocks?.[0]
    if (block?.acf_fc_layout === 'hero') {
      expect(block.slides?.[0]).toEqual({
        ...imgObj,
        tagline: 'My Tagline',
        subtitle: 'My Subtitle',
      })
      expect(block.slides?.[1]).toEqual(imgObj)
    }
  })

  it('normalises service images within the services repeater', async () => {
    mockFetch.mockReturnValueOnce(
      ok([
        pageWithBlocks([
          {
            acf_fc_layout: 'services_grid',
            services: [
              {
                title: 'A',
                description: 'Desc',
                image: { url: 'https://example.com/a.jpg', alt: 'A' },
              },
              { title: 'B', description: 'Desc', image: 999 },
              { title: 'C', description: 'Desc', image: '' },
            ],
          },
        ]),
      ]),
    )
    const page = await getPageBySlug('home')
    const block = page?.acf?.blocks?.[0]
    if (block?.acf_fc_layout === 'services_grid') {
      expect(block.services[0].image).toEqual({ url: 'https://example.com/a.jpg', alt: 'A' })
      expect(block.services[1].image).toBeUndefined()
      expect(block.services[2].image).toBeUndefined()
    }
  })

  it('normalises image_text block image fields', async () => {
    mockFetch.mockReturnValueOnce(
      ok([
        pageWithBlocks([
          {
            acf_fc_layout: 'image_text',
            image: { url: 'https://example.com/img.jpg', alt: 'Main', width: 600, height: 400 },
            image_mobile: 5678,
            body: '<p>Text</p>',
          },
        ]),
      ]),
    )
    const page = await getPageBySlug('home')
    const block = page?.acf?.blocks?.[0]
    if (block?.acf_fc_layout === 'image_text') {
      expect(block.image.url).toBe('https://example.com/img.jpg')
      expect(block.image_mobile).toBeUndefined()
    }
  })

  it('handles pages with no acf blocks gracefully', async () => {
    mockFetch.mockReturnValueOnce(ok([{ ...mockPage, acf: {} }]))
    const page = await getPageBySlug('home')
    expect(page?.acf?.blocks).toBeUndefined()
  })

  it('handles pages with no acf at all', async () => {
    mockFetch.mockReturnValueOnce(ok([mockPage]))
    const page = await getPageBySlug('home')
    expect(page).toBeDefined()
  })
})
