import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import mockPageData from '../__mocks__/mockPage.json'
import { buildPageSchemas, getSiteUrlFromEnv, toCanonicalUrl } from '../seo'

const mockPage = {
  ...mockPageData,
  title: { rendered: 'Pricing' },
  excerpt: { rendered: '<p>Page excerpt</p>' },
  content: { rendered: '<p>Page content</p>' },
  acf: {
    blocks: [
      {
        acf_fc_layout: 'faq_accordion' as const,
        faq_items: [
          {
            question: 'How long does delivery take?',
            answer: '<p>Usually 2-4 weeks.</p>',
          },
        ],
      },
      {
        acf_fc_layout: 'services_grid' as const,
        services: [
          {
            title: 'Wedding Photography',
            description: '<p>Full day coverage</p>',
            image: { url: '/images/service.jpg', alt: 'Service' },
            url: '/services/wedding-photography',
          },
        ],
      },
    ],
  },
}

describe('seo helpers', () => {
  beforeEach(() => {
    vi.stubEnv('SITE_URL', 'https://test.example.com/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('normalizes SITE_URL from env', () => {
    expect(getSiteUrlFromEnv()).toBe('https://test.example.com')
  })

  it('builds canonical URLs for root and slug paths', () => {
    expect(toCanonicalUrl('/')).toBe('https://test.example.com')
    expect(toCanonicalUrl('pricing')).toBe('https://test.example.com/pricing')
  })

  it('builds WebPage, FAQPage, Service list, and BreadcrumbList schemas', () => {
    const schemas = buildPageSchemas(mockPage, 'https://test.example.com/pricing', '/pricing')

    expect(schemas.length).toBe(4)

    const types = schemas.map((schema) => schema['@type'])
    expect(types).toContain('WebPage')
    expect(types).toContain('FAQPage')
    expect(types).toContain('ItemList')
    expect(types).toContain('BreadcrumbList')

    const breadcrumb = schemas.find((schema) => schema['@type'] === 'BreadcrumbList')
    const list = breadcrumb?.itemListElement as Array<{ name: string }>
    expect(list).toHaveLength(2)
    expect(list[0].name).toBe('Home')
    expect(list[1].name).toBe('Pricing')
  })

  it('builds root breadcrumb with Home only', () => {
    const schemas = buildPageSchemas(mockPage, 'https://test.example.com', '/')
    const breadcrumb = schemas.find((schema) => schema['@type'] === 'BreadcrumbList')
    const list = breadcrumb?.itemListElement as Array<{ name: string }>

    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Home')
  })
})
