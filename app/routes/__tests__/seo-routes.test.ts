import { describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/wordpress', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/wordpress')>()
  return {
    ...actual,
    getAllPages: vi.fn(),
    getAllPostSitemapEntries: vi.fn(),
  }
})

import { getAllPages, getAllPostSitemapEntries } from '~/lib/wordpress'
import { loader as robotsLoader } from '../robots.txt'
import { loader as sitemapLoader } from '../sitemap.xml'

describe('SEO route loaders', () => {
  it('returns crawl directives and sitemap hint in robots.txt', async () => {
    vi.stubEnv('SITE_URL', 'https://test.example.com')

    const response = await robotsLoader({
      request: new Request('https://test.example.com/robots.txt'),
      params: {},
      context: {},
    } as never)

    const body = await response.text()

    expect(response.headers.get('Content-Type')).toContain('text/plain')
    expect(body).toContain('User-agent: *')
    expect(body).toContain('Disallow: /preview')
    expect(body).toContain('Sitemap: https://test.example.com/sitemap.xml')
  })

  it('returns sitemap.xml with canonical URLs for published pages', async () => {
    vi.stubEnv('SITE_URL', 'https://test.example.com')
    vi.mocked(getAllPostSitemapEntries).mockResolvedValueOnce([
      { slug: 'recent-story', modified: '2026-08-20T03:04:05+00:00' },
    ])
    vi.mocked(getAllPages).mockResolvedValueOnce([
      {
        id: 1,
        slug: 'home',
        parent: 0,
        status: 'publish',
        modified: '2026-08-18T01:02:03+00:00',
        title: { rendered: 'Home' },
        content: { rendered: '<p>Home</p>' },
        excerpt: { rendered: '' },
      },
      {
        id: 2,
        slug: 'pricing',
        parent: 0,
        status: 'publish',
        modified: '2026-08-19T02:03:04+00:00',
        title: { rendered: 'Pricing' },
        content: { rendered: '<p>Pricing</p>' },
        excerpt: { rendered: '' },
        acf: {
          blocks: [
            {
              acf_fc_layout: 'image_block',
              image: {
                url: 'https://images.example.com/pricing.jpg',
                alt: 'Pricing consultation',
              },
            },
          ],
        },
      },
    ] as never)

    const response = await sitemapLoader()
    const xml = await response.text()

    expect(response.headers.get('Content-Type')).toContain('application/xml')
    expect(xml).toContain('<loc>https://test.example.com</loc>')
    expect(xml).toContain('<loc>https://test.example.com/pricing</loc>')
    expect(xml).toContain('<loc>https://test.example.com/recent-story</loc>')
    expect(xml).toContain('<lastmod>2026-08-18T01:02:03.000Z</lastmod>')
    expect(xml).toContain('<lastmod>2026-08-19T02:03:04.000Z</lastmod>')
    expect(xml).toContain('<lastmod>2026-08-20T03:04:05.000Z</lastmod>')
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
    expect(xml).toContain(
      '<image:image><image:loc>https://images.example.com/pricing.jpg</image:loc></image:image>',
    )
    expect(xml).toContain('<changefreq>weekly</changefreq>')
  })
})
