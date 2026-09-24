import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/wordpress', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/wordpress')>()
  return {
    ...actual,
    getAllPages: vi.fn(),
    getPostsByCategories: vi.fn(),
    getSiteSettings: vi.fn(),
  }
})

import { getAllPages, getPostsByCategories, getSiteSettings } from '~/lib/wordpress'
import { loader } from '../llms.txt'

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('llms.txt loader', () => {
  it('lists public WordPress pages and all blog posts with canonical URLs', async () => {
    vi.stubEnv('SITE_URL', 'https://test.example.com')
    vi.mocked(getSiteSettings).mockResolvedValueOnce({
      site_name: 'Studio &amp; Co',
      tagline: 'Portraits &amp; stories',
      copyright_text: '',
      social_links: [{ platform: 'Instagram', url: 'https://social.example.com/studio' }],
      business: {
        description: 'A candid photography studio.',
        founding_date: '2001-01-01',
        area_served: ['Sydney', 'New South Wales'],
      },
    })
    vi.mocked(getAllPages).mockResolvedValueOnce([
      {
        id: 1,
        slug: 'home',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Sydney Wedding and Corporate Photographer' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      {
        id: 2,
        slug: 'galleries',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Galleries' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
        acf: { container_only: true },
      },
      {
        id: 3,
        slug: 'fine-art',
        parent: 2,
        status: 'publish',
        title: { rendered: 'Fine [Art]' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
        acf: {
          blocks: [
            {
              acf_fc_layout: 'gallery_reference',
              description: '<p>Editorial &amp; documentary.</p>',
            },
          ],
        },
      },
    ])
    vi.mocked(getPostsByCategories)
      .mockResolvedValueOnce({
        posts: [
          {
            id: 10,
            slug: 'first-story',
            title: { rendered: 'First Story' },
            content: { rendered: '' },
            excerpt: { rendered: '<p>A recent celebration.</p>' },
            date: '2026-01-01T00:00:00',
            modified: '2026-01-01T00:00:00',
            categories: [],
          },
        ],
        total: 2,
        total_pages: 2,
        page: 1,
      })
      .mockResolvedValueOnce({
        posts: [
          {
            id: 11,
            slug: 'second-story',
            title: { rendered: 'Second Story' },
            content: { rendered: '' },
            excerpt: { rendered: '' },
            date: '2026-01-02T00:00:00',
            modified: '2026-01-02T00:00:00',
            categories: [],
          },
        ],
        total: 2,
        total_pages: 2,
        page: 2,
      })

    const response = await loader()
    const body = await response.text()

    expect(response.headers.get('Content-Type')).toContain('text/plain')
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=3600, s-maxage=3600',
    )
    expect(body).toContain('# Studio & Co\n> Portraits & stories')
    expect(body).toContain('A candid photography studio.')
    expect(body).toContain('- Established: 2001')
    expect(body).toContain('- Content index: 2 public pages and 2 published stories')
    expect(body).toContain('## Essential information')
    expect(body).toContain(
      '- [Sydney Wedding and Corporate Photographer](https://test.example.com)',
    )
    expect(body).toContain('## Photography galleries')
    expect(body).toContain(
      '- [Fine \\[Art\\]](https://test.example.com/galleries/fine-art): Editorial & documentary.',
    )
    expect(body).not.toContain('[Galleries]')
    expect(body).toContain('## Wedding stories and venue guides')
    expect(body).toContain(
      '- [First Story](https://test.example.com/first-story): A recent celebration.',
    )
    expect(body).toContain('- [Second Story](https://test.example.com/second-story)')
    expect(body).toContain(
      '- [XML sitemap](https://test.example.com/sitemap.xml): The complete machine-readable index',
    )
    expect(body).toContain('## Optional')
    expect(body).toContain(
      '- [Studio Zanetti on Instagram (studio)](https://social.example.com/studio): Official Instagram profile.',
    )
    expect(getPostsByCategories).toHaveBeenNthCalledWith(1, [], 1, 100)
    expect(getPostsByCategories).toHaveBeenNthCalledWith(2, [], 2, 100)
  })
})