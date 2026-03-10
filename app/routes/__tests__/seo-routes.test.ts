import { describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/wordpress', () => ({
  getAllPages: vi.fn(),
}))

import { getAllPages } from '~/lib/wordpress'
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
    vi.mocked(getAllPages).mockResolvedValueOnce([
      {
        id: 1,
        slug: 'home',
        status: 'publish',
        title: { rendered: 'Home' },
        content: { rendered: '<p>Home</p>' },
        excerpt: { rendered: '' },
      },
      {
        id: 2,
        slug: 'pricing',
        status: 'publish',
        title: { rendered: 'Pricing' },
        content: { rendered: '<p>Pricing</p>' },
        excerpt: { rendered: '' },
      },
    ] as never)

    const response = await sitemapLoader()
    const xml = await response.text()

    expect(response.headers.get('Content-Type')).toContain('application/xml')
    expect(xml).toContain('<loc>https://test.example.com</loc>')
    expect(xml).toContain('<loc>https://test.example.com/pricing</loc>')
    expect(xml).toContain('<changefreq>weekly</changefreq>')
  })
})
