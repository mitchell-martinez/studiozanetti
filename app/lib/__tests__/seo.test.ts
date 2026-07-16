import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import mockPageData from '../__mocks__/mockPage.json'
import {
  buildPageSchemas,
  buildStructuredDataGraph,
  getSiteUrlFromEnv,
  serializeStructuredData,
  toCanonicalUrl,
} from '../seo'

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

  it('builds a connected business, website, photographer, and service graph', () => {
    const graph = buildStructuredDataGraph({
      site_name: 'Example Studio',
      tagline: 'Example tagline',
      copyright_text: '',
      social_links: [{ platform: 'Social', url: 'https://social.example/studio' }],
      business: {
        description: 'A public business description.',
        telephone: '+61000000000',
        address: {
          street_address: '1 Example Street',
          address_locality: 'Example City',
          address_region: 'NSW',
          postal_code: '2000',
          address_country: 'AU',
        },
        geo: { latitude: -33.86, longitude: 151.2 },
        area_served: ['Example City'],
        awards: ['Example industry recognition'],
      },
      primary_photographer: {
        enabled: true,
        name: 'Example Photographer',
        job_title: 'Wedding Photographer',
        knows_about: ['Wedding photography'],
      },
      services: [
        {
          key: 'weddings',
          name: 'Wedding Photography',
          url: 'https://test.example.com/weddings',
          area_served: ['Example City'],
        },
      ],
    })

    const nodes = graph['@graph'] as Array<Record<string, unknown>>
    const business = nodes.find((node) => node['@id'] === 'https://test.example.com/#business')
    const website = nodes.find((node) => node['@id'] === 'https://test.example.com/#website')
    const photographer = nodes.find(
      (node) => node['@id'] === 'https://test.example.com/#primary-photographer',
    )
    const service = nodes.find(
      (node) => node['@id'] === 'https://test.example.com/#service-weddings',
    )

    expect(graph['@context']).toBe('https://schema.org')
    expect(business).toMatchObject({
      '@type': 'LocalBusiness',
      name: 'Example Studio',
      telephone: '+61000000000',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Example City',
        addressCountry: 'AU',
      },
      employee: { '@id': 'https://test.example.com/#primary-photographer' },
    })
    expect(website).toMatchObject({
      '@type': 'WebSite',
      publisher: { '@id': 'https://test.example.com/#business' },
    })
    expect(photographer).toMatchObject({
      '@type': 'Person',
      worksFor: { '@id': 'https://test.example.com/#business' },
    })
    expect(service).toMatchObject({
      '@type': 'Service',
      provider: { '@id': 'https://test.example.com/#business' },
    })
    expect(JSON.stringify(graph)).not.toContain('ProfessionalService')
    expect(JSON.stringify(graph)).not.toContain('"Photographer"')
  })

  it('safely serializes editor-controlled structured data inside a script element', () => {
    const serialized = serializeStructuredData({ description: '</script><script>alert(1)</script>' })

    expect(serialized).not.toContain('</script>')
    expect(JSON.parse(serialized)).toEqual({
      description: '</script><script>alert(1)</script>',
    })
  })

  it('builds stable linked WebPage, FAQPage, service list, and fallback Service schemas', () => {
    const schemas = buildPageSchemas(mockPage, 'https://test.example.com/pricing', '/pricing')

    expect(schemas.length).toBe(5)

    const types = schemas.map((schema) => schema['@type'])
    expect(types).toContain('WebPage')
    expect(types).toContain('FAQPage')
    expect(types).toContain('ItemList')
    expect(types).toContain('BreadcrumbList')

    const webpage = schemas.find((schema) => schema['@type'] === 'WebPage')
    const faq = schemas.find((schema) => schema['@type'] === 'FAQPage')
    const services = schemas.find((schema) => schema['@type'] === 'ItemList')
    const fallbackService = schemas.find(
      (schema) => schema['@id'] === 'https://test.example.com/pricing#service-grid-2-1',
    )
    expect(webpage).toMatchObject({
      hasPart: { '@id': 'https://test.example.com/pricing#faq' },
      mentions: [{ '@id': 'https://test.example.com/pricing#service-list' }],
    })
    expect(faq).toMatchObject({
      '@id': 'https://test.example.com/pricing#faq',
      isPartOf: { '@id': 'https://test.example.com/pricing#webpage' },
    })
    expect(services).toMatchObject({
      '@id': 'https://test.example.com/pricing#service-list',
      itemListElement: [
        {
          item: { '@id': 'https://test.example.com/pricing#service-grid-2-1' },
        },
      ],
    })
    expect(fallbackService).toMatchObject({
      '@type': 'Service',
      image: { '@id': 'https://test.example.com/pricing#service-grid-2-1-image' },
      provider: { '@id': 'https://test.example.com/#business' },
    })

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

  it('builds an AggregateOffer Service schema from pricing packages', () => {
    const pricingPage = {
      ...mockPageData,
      title: { rendered: 'Wedding Prices' },
      excerpt: { rendered: '<p>Prices</p>' },
      content: { rendered: '<p>Prices</p>' },
      acf: {
        blocks: [
          {
            acf_fc_layout: 'pricing_packages' as const,
            heading: 'Packages',
            packages: [
              {
                name: 'The Essentials',
                price_qualifier: 'From',
                price_label: '$1,980',
                summary: 'Entry-level coverage of the key moments.',
              },
              {
                name: 'The Ultimate',
                price_qualifier: 'From',
                price_label: '$2,900',
                summary: 'Our most complete package with a second photographer and album.',
              },
            ],
          },
        ],
      },
    }

    const schemas = buildPageSchemas(
      pricingPage,
      'https://test.example.com/prices',
      '/prices',
    )
    const service = schemas.find((schema) => schema['@type'] === 'Service') as
      | Record<string, unknown>
      | undefined

    expect(service).toBeDefined()
    expect(service?.['@id']).toBe('https://test.example.com/prices#pricing-service-1')

    const offers = service?.offers as {
      '@type': string
      lowPrice: number
      highPrice: number
      offerCount: number
      offers: Array<{ name: string; price?: number; description?: string }>
    }

    expect(offers['@type']).toBe('AggregateOffer')
    expect(offers.lowPrice).toBe(1980)
    expect(offers.highPrice).toBe(2900)
    expect(offers.offerCount).toBe(2)
    expect(offers.offers[1]).toMatchObject({
      name: 'The Ultimate',
      price: 2900,
      priceCurrency: 'AUD',
    })
    expect(offers.offers[1].description).toContain('most complete package')
  })

  it('links configured service and pricing blocks to global service IDs', () => {
    const siteSettings = {
      site_name: 'Example Studio',
      tagline: '',
      copyright_text: '',
      social_links: [],
      services: [{ key: 'weddings', name: 'Wedding Photography' }],
    }
    const schemas = buildPageSchemas(
      {
        ...mockPage,
        acf: {
          blocks: [
            {
              acf_fc_layout: 'services_grid' as const,
              services: [
                {
                  title: 'Visible wedding service',
                  description: 'Visible service description',
                  service_reference: 'weddings',
                },
              ],
            },
            {
              acf_fc_layout: 'pricing_packages' as const,
              service_reference: 'weddings',
              packages: [{ name: 'Coverage', price_label: '$2,000' }],
            },
          ],
        },
      },
      'https://test.example.com/services',
      '/services',
      siteSettings,
    )
    const serviceList = schemas.find((schema) => schema['@type'] === 'ItemList')
    const pricing = schemas.find(
      (schema) => schema['@type'] === 'Service' && 'offers' in schema,
    )

    expect(serviceList).toMatchObject({
      itemListElement: [
        { item: { '@id': 'https://test.example.com/#service-weddings' } },
      ],
    })
    expect(pricing).toMatchObject({
      '@id': 'https://test.example.com/#service-weddings',
      subjectOf: { '@id': 'https://test.example.com/services#webpage' },
    })
    expect(schemas).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          '@id': expect.stringContaining('#service-grid-'),
        }),
      ]),
    )

    const graph = buildStructuredDataGraph(siteSettings, schemas)
    const graphNodes = graph['@graph'] as Array<Record<string, unknown>>
    const globalServiceNodes = graphNodes.filter(
      (node) => node['@id'] === 'https://test.example.com/#service-weddings',
    )
    expect(globalServiceNodes).toHaveLength(1)
    expect(globalServiceNodes[0]).toMatchObject({
      name: 'Wedding Photography',
      provider: { '@id': 'https://test.example.com/#business' },
      offers: { '@type': 'AggregateOffer' },
    })
  })

  it('decodes HTML entities in schema and breadcrumb titles', () => {
    const pageWithEntities = {
      ...mockPage,
      title: { rendered: 'Events &#038; Awards' },
    }

    const schemas = buildPageSchemas(
      pageWithEntities,
      'https://test.example.com/events-and-awards',
      '/events-and-awards',
    )

    const webpage = schemas.find((schema) => schema['@type'] === 'WebPage') as {
      name: string
    }
    const breadcrumb = schemas.find((schema) => schema['@type'] === 'BreadcrumbList') as {
      itemListElement: Array<{ name: string }>
    }

    expect(webpage.name).toBe('Events & Awards')
    expect(breadcrumb.itemListElement[1]?.name).toBe('Events & Awards')
  })

  it('links page and selected image metadata into the shared entity graph', () => {
    const pageWithImageMetadata = {
      ...mockPage,
      featured_image: {
        url: '/images/primary.jpg',
        alt: 'Couple portrait',
        caption: 'Couple portrait at an example venue',
        creator: 'primary_photographer' as const,
        width: 1600,
        height: 900,
        location_created: {
          name: 'Example Venue',
          geo: { latitude: -33.86, longitude: 151.2 },
        },
      },
    }

    const schemas = buildPageSchemas(
      pageWithImageMetadata,
      'https://test.example.com/example-page',
      '/example-page',
    )
    const webpage = schemas.find((schema) => schema['@type'] === 'WebPage') as {
      '@id': string
      isPartOf: { '@id': string }
      provider: { '@id': string }
      primaryImageOfPage: Record<string, unknown>
    }

    expect(webpage).toMatchObject({
      '@id': 'https://test.example.com/example-page#webpage',
      isPartOf: { '@id': 'https://test.example.com/#website' },
      provider: { '@id': 'https://test.example.com/#business' },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        '@id': 'https://test.example.com/example-page#primary-image',
        contentUrl: 'https://test.example.com/images/primary.jpg',
        caption: 'Couple portrait at an example venue',
        creator: { '@id': 'https://test.example.com/#primary-photographer' },
        locationCreated: {
          '@type': 'Place',
          name: 'Example Venue',
        },
      },
    })
  })

  it('falls back to the business when an image references an unpublished photographer', () => {
    const schemas = buildPageSchemas(
      {
        ...mockPage,
        featured_image: {
          url: '/images/primary.jpg',
          alt: 'Couple portrait',
          creator: 'primary_photographer' as const,
        },
      },
      'https://test.example.com/example-page',
      '/example-page',
      {
        site_name: 'Example Studio',
        tagline: '',
        copyright_text: '',
        social_links: [],
        primary_photographer: {
          enabled: false,
          name: 'Unpublished Photographer',
        },
      },
    )
    const webpage = schemas.find((schema) => schema['@type'] === 'WebPage')

    expect(webpage).toMatchObject({
      primaryImageOfPage: {
        creator: { '@id': 'https://test.example.com/#business' },
      },
    })
  })

  it('omits a stale page service reference from the connected graph', () => {
    const schemas = buildPageSchemas(
      {
        ...mockPage,
        acf: { ...mockPage.acf, service_reference: 'retired-service' },
      },
      'https://test.example.com/example-page',
      '/example-page',
      {
        site_name: 'Example Studio',
        tagline: '',
        copyright_text: '',
        social_links: [],
        services: [{ key: 'weddings', name: 'Wedding Photography' }],
      },
    )
    const webpage = schemas.find((schema) => schema['@type'] === 'WebPage')

    expect(webpage).not.toHaveProperty('mainEntity')
  })

  it('links an explicit venue page to stable Place and service entities', () => {
    const venuePage = {
      ...mockPage,
      acf: {
        ...mockPage.acf,
        service_reference: 'weddings',
        is_venue_page: true,
        venue: {
          name: 'Example Venue',
          url: 'https://venue.example/',
          description: 'A public venue description.',
          address: {
            address_locality: 'Example City',
            address_region: 'NSW',
            address_country: 'AU',
          },
          geo: { latitude: -33.86, longitude: 151.2 },
          image: { url: '/images/venue.jpg', alt: 'Example venue exterior' },
        },
      },
    }

    const schemas = buildPageSchemas(
      venuePage,
      'https://test.example.com/venues/example',
      '/venues/example',
    )
    const webpage = schemas.find((schema) => schema['@type'] === 'WebPage')
    const venue = schemas.find((schema) => schema['@type'] === 'Place')
    const breadcrumb = schemas.find((schema) => schema['@type'] === 'BreadcrumbList')

    expect(webpage).toMatchObject({
      about: [
        { '@id': 'https://test.example.com/#business' },
        { '@id': 'https://test.example.com/venues/example#venue' },
      ],
      mainEntity: { '@id': 'https://test.example.com/#service-weddings' },
    })
    expect(venue).toMatchObject({
      '@id': 'https://test.example.com/venues/example#venue',
      name: 'Example Venue',
      address: { '@type': 'PostalAddress', addressLocality: 'Example City' },
      geo: { '@type': 'GeoCoordinates', latitude: -33.86, longitude: 151.2 },
      image: {
        '@id': 'https://test.example.com/venues/example#venue-image',
        creator: { '@id': 'https://test.example.com/#business' },
      },
    })
    expect(breadcrumb?.['@id']).toBe(
      'https://test.example.com/venues/example#breadcrumb',
    )
  })
})
