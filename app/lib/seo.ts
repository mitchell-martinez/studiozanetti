import type {
  ContentBlock,
  WPGeoCoordinates,
  WPImage,
  WPPage,
  WPPostalAddress,
  WPPost,
  WPSiteSettings,
} from '~/types/wordpress'
import { decodeHtmlEntities } from '~/lib/html'

const FALLBACK_SITE_URL = 'https://studiozanetti.com.au'

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getSiteUrlFromEnv(): string {
  const raw = process.env.SITE_URL ?? process.env.PUBLIC_SITE_URL ?? process.env.APP_URL
  if (!raw) return FALLBACK_SITE_URL

  try {
    return normalizeBaseUrl(new URL(raw).toString())
  } catch {
    return FALLBACK_SITE_URL
  }
}

export function toCanonicalUrl(pathname: string): string {
  const base = getSiteUrlFromEnv()
  const safePath = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}`
  return `${base}${safePath === '/' ? '' : safePath}`
}

function plainText(html: string | undefined): string {
  if (!html) return ''

  const withoutTags = html.replace(/<[^>]+>/g, ' ')

  return decodeHtmlEntities(withoutTags)
    .replace(/\s+/g, ' ')
    .trim()
}

function toAbsoluteImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `${getSiteUrlFromEnv()}${url.startsWith('/') ? '' : '/'}${url}`
}

function entityId(fragment: string): string {
  return `${getSiteUrlFromEnv()}/#${fragment}`
}

function pageEntityId(canonicalUrl: string, fragment: string): string {
  return `${canonicalUrl}#${fragment}`
}

function nonEmpty(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function placeNames(names: string[] | undefined): Record<string, unknown>[] | undefined {
  const places = (names ?? [])
    .map(nonEmpty)
    .filter((name): name is string => typeof name === 'string')
    .map((name) => ({ '@type': 'Place', name }))

  return places.length > 0 ? places : undefined
}

function buildPostalAddress(
  address: WPPostalAddress | undefined,
): Record<string, unknown> | undefined {
  if (!address) return undefined

  const node = {
    '@type': 'PostalAddress',
    ...(nonEmpty(address.street_address)
      ? { streetAddress: nonEmpty(address.street_address) }
      : {}),
    ...(nonEmpty(address.address_locality)
      ? { addressLocality: nonEmpty(address.address_locality) }
      : {}),
    ...(nonEmpty(address.address_region)
      ? { addressRegion: nonEmpty(address.address_region) }
      : {}),
    ...(nonEmpty(address.postal_code) ? { postalCode: nonEmpty(address.postal_code) } : {}),
    ...(nonEmpty(address.address_country)
      ? { addressCountry: nonEmpty(address.address_country) }
      : {}),
  }

  return Object.keys(node).length > 1 ? node : undefined
}

function buildGeo(
  geo: WPGeoCoordinates | undefined,
): Record<string, unknown> | undefined {
  if (!geo || !Number.isFinite(geo.latitude) || !Number.isFinite(geo.longitude)) {
    return undefined
  }

  return {
    '@type': 'GeoCoordinates',
    latitude: geo.latitude,
    longitude: geo.longitude,
  }
}

function buildImageObject(
  image: WPImage | undefined,
  id?: string,
  defaultCreatorId = entityId('business'),
  hasPrimaryPhotographer = true,
  siteSettings?: WPSiteSettings,
  defaultCreator: WPImage['creator'] = 'primary_photographer',
): Record<string, unknown> | undefined {
  if (!image?.url) return undefined

  const photographerName = nonEmpty(siteSettings?.primary_photographer?.name)
  const requestedCreator = image.creator ?? defaultCreator
  const usesPrimaryPhotographer = Boolean(
    requestedCreator === 'primary_photographer' &&
      hasPrimaryPhotographer &&
      photographerName,
  )
  const creatorId = usesPrimaryPhotographer
    ? entityId('primary-photographer')
    : defaultCreatorId
  const creator = {
    '@type': usesPrimaryPhotographer ? 'Person' : 'Organization',
    '@id': creatorId,
    name: usesPrimaryPhotographer
      ? photographerName
      : siteSettings?.site_name || 'Studio Zanetti',
  }
  const license = nonEmpty(image.license) ?? nonEmpty(siteSettings?.business?.image_license)
  const acquireLicensePage =
    nonEmpty(image.acquire_license_page) ??
    nonEmpty(siteSettings?.business?.image_acquire_license_page)
  const creditText =
    nonEmpty(image.credit_text) ?? nonEmpty(siteSettings?.business?.image_credit_text)
  const copyrightNotice =
    nonEmpty(image.copyright_notice) ??
    nonEmpty(siteSettings?.business?.image_copyright_notice)
  const locationAddress = buildPostalAddress(image.location_created?.address)
  const locationGeo = buildGeo(image.location_created?.geo)

  return {
    '@type': 'ImageObject',
    ...(id ? { '@id': id } : {}),
    contentUrl: toAbsoluteImageUrl(image.url),
    ...(nonEmpty(image.caption) || nonEmpty(image.alt)
      ? { caption: nonEmpty(image.caption) ?? nonEmpty(image.alt) }
      : {}),
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
    creator,
    ...(license ? { license } : {}),
    ...(acquireLicensePage ? { acquireLicensePage } : {}),
    ...(creditText ? { creditText } : {}),
    ...(copyrightNotice ? { copyrightNotice } : {}),
    ...(image.location_created?.name
      ? {
          locationCreated: {
            '@type': 'Place',
            name: image.location_created.name,
            ...(nonEmpty(image.location_created.url)
              ? { url: nonEmpty(image.location_created.url) }
              : {}),
            ...(locationAddress ? { address: locationAddress } : {}),
            ...(locationGeo ? { geo: locationGeo } : {}),
          },
        }
      : {}),
  }
}

export function buildSiteEntitySchemas(siteSettings: WPSiteSettings): Record<string, unknown>[] {
  const siteUrl = getSiteUrlFromEnv()
  const businessId = entityId('business')
  const websiteId = entityId('website')
  const photographerId = entityId('primary-photographer')
  const business = siteSettings.business
  const photographer = siteSettings.primary_photographer
  const hasPrimaryPhotographer = Boolean(
    photographer?.enabled && nonEmpty(photographer.name),
  )
  const services = siteSettings.services ?? []
  const sameAs = [
    ...siteSettings.social_links.map((link) => link.url),
    ...(business?.same_as ?? []),
  ]
    .map(nonEmpty)
    .filter((url): url is string => typeof url === 'string')
    .filter((url, index, values) => values.indexOf(url) === index)
  const address = buildPostalAddress(business?.address)
  const geo = buildGeo(business?.geo)
  const areaServed = placeNames(business?.area_served)
  const logo = buildImageObject(
    business?.logo,
    entityId('logo'),
    businessId,
    hasPrimaryPhotographer,
    siteSettings,
    'business',
  )
  const image = buildImageObject(
    business?.image,
    entityId('business-image'),
    businessId,
    hasPrimaryPhotographer,
    siteSettings,
  )
  const serviceIds = services
    .filter((service) => nonEmpty(service.key) && nonEmpty(service.name))
    .map((service) => entityId(`service-${service.key.trim()}`))

  const businessNode: Record<string, unknown> = {
    '@type': 'LocalBusiness',
    '@id': businessId,
    name: siteSettings.site_name || 'Studio Zanetti',
    url: siteUrl,
    ...(nonEmpty(business?.description) ? { description: nonEmpty(business?.description) } : {}),
    ...(nonEmpty(business?.email) ? { email: nonEmpty(business?.email) } : {}),
    ...(nonEmpty(business?.telephone) ? { telephone: nonEmpty(business?.telephone) } : {}),
    ...(address ? { address } : {}),
    ...(geo ? { geo } : {}),
    ...(areaServed ? { areaServed } : {}),
    ...(logo ? { logo } : {}),
    ...(image ? { image } : {}),
    ...(nonEmpty(business?.price_range) ? { priceRange: nonEmpty(business?.price_range) } : {}),
    ...(nonEmpty(business?.founding_date)
      ? { foundingDate: nonEmpty(business?.founding_date) }
      : {}),
    ...(business?.awards?.length ? { award: business.awards } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(hasPrimaryPhotographer
      ? photographer?.business_relationship === 'founder'
        ? { founder: { '@id': photographerId } }
        : { employee: { '@id': photographerId } }
      : {}),
    ...(serviceIds.length
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: `${siteSettings.site_name || 'Studio Zanetti'} services`,
            itemListElement: serviceIds.map((id) => ({ '@id': id })),
          },
        }
      : {}),
  }

  const websiteNode: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': websiteId,
    name: siteSettings.site_name || 'Studio Zanetti',
    url: siteUrl,
    publisher: { '@id': businessId },
  }

  const photographerNode =
    photographer && hasPrimaryPhotographer
      ? {
          '@type': 'Person',
          '@id': photographerId,
          name: nonEmpty(photographer.name),
          ...(nonEmpty(photographer.job_title)
            ? { jobTitle: nonEmpty(photographer.job_title) }
            : {}),
          ...(nonEmpty(photographer.description)
            ? { description: nonEmpty(photographer.description) }
            : {}),
          ...(nonEmpty(photographer.url) ? { url: nonEmpty(photographer.url) } : {}),
          ...(buildImageObject(
            photographer.image,
            entityId('primary-photographer-image'),
            businessId,
            hasPrimaryPhotographer,
            siteSettings,
          )
            ? {
                image: buildImageObject(
                  photographer.image,
                  entityId('primary-photographer-image'),
                  businessId,
                  hasPrimaryPhotographer,
                  siteSettings,
                ),
              }
            : {}),
          ...(photographer.same_as?.length ? { sameAs: photographer.same_as } : {}),
          ...(photographer.knows_about?.length ? { knowsAbout: photographer.knows_about } : {}),
          ...(photographer.awards?.length ? { award: photographer.awards } : {}),
          worksFor: { '@id': businessId },
        }
      : null

  const serviceNodes = services
    .filter((service) => nonEmpty(service.key) && nonEmpty(service.name))
    .map((service) => {
      const serviceImage = buildImageObject(
        service.image,
        entityId(`service-${service.key.trim()}-image`),
        businessId,
        hasPrimaryPhotographer,
        siteSettings,
      )

      return {
        '@type': 'Service',
        '@id': entityId(`service-${service.key.trim()}`),
        name: service.name.trim(),
        serviceType: nonEmpty(service.service_type) ?? service.name.trim(),
        provider: { '@id': businessId },
        ...(nonEmpty(service.description) ? { description: nonEmpty(service.description) } : {}),
        ...(nonEmpty(service.url) ? { url: nonEmpty(service.url) } : {}),
        ...(placeNames(service.area_served)
          ? { areaServed: placeNames(service.area_served) }
          : {}),
        ...(serviceImage ? { image: serviceImage } : {}),
      }
    })

  return [businessNode, websiteNode, photographerNode, ...serviceNodes].filter(
    (node): node is Record<string, unknown> => node !== null,
  )
}

export function buildStructuredDataGraph(
  siteSettings: WPSiteSettings,
  contentSchemas: Record<string, unknown>[] = [],
): Record<string, unknown> {
  const nodesById = new Map<string, Record<string, unknown>>()
  const anonymousNodes: Record<string, unknown>[] = []

  ;[...buildSiteEntitySchemas(siteSettings), ...contentSchemas].forEach((node) => {
    const { '@context': _context, ...graphNode } = node
    const id = typeof graphNode['@id'] === 'string' ? graphNode['@id'] : undefined
    if (!id) {
      anonymousNodes.push(graphNode)
      return
    }

    nodesById.set(id, { ...nodesById.get(id), ...graphNode })
  })

  return {
    '@context': 'https://schema.org',
    '@graph': [...nodesById.values(), ...anonymousNodes],
  }
}

export function serializeStructuredData(value: Record<string, unknown>): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function resolveServiceId(
  key: string | undefined,
  siteSettings: WPSiteSettings | undefined,
): string | undefined {
  const normalizedKey = nonEmpty(key)
  if (!normalizedKey) return undefined
  if (
    siteSettings &&
    !siteSettings.services?.some(
      (service) => service.key.trim() === normalizedKey && Boolean(nonEmpty(service.name)),
    )
  ) {
    return undefined
  }

  return entityId(`service-${normalizedKey}`)
}

function buildFaqSchema(
  blocks: ContentBlock[],
  canonicalUrl: string,
): Record<string, unknown> | null {
  const questions = blocks
    .filter((block) => block.acf_fc_layout === 'faq_accordion')
    .flatMap((block) => block.faq_items)
    .filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0)
    .map((item, index) => ({
      '@type': 'Question',
      '@id': pageEntityId(canonicalUrl, `faq-question-${index + 1}`),
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: plainText(item.answer),
      },
    }))

  if (!questions.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': pageEntityId(canonicalUrl, 'faq'),
    isPartOf: { '@id': pageEntityId(canonicalUrl, 'webpage') },
    mainEntity: questions,
  }
}

function parsePriceAmount(label: string | undefined): number | null {
  if (!label) return null
  // Strip currency symbols and thousands separators, keep the first number found.
  const match = label.replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  if (!match) return null
  const value = Number.parseFloat(match[0])
  return Number.isFinite(value) ? value : null
}

function buildPricingSchemas(
  blocks: ContentBlock[],
  canonicalUrl: string,
  siteSettings: WPSiteSettings | undefined,
): Record<string, unknown>[] {
  return blocks.flatMap((block, blockIndex) => {
    if (block.acf_fc_layout !== 'pricing_packages') return []

    const packages = (block.packages ?? []).filter(
      (item) => (item.name ?? '').trim().length > 0,
    )
    if (!packages.length) return []

    const offers = packages.map((item) => {
      const price = parsePriceAmount(item.price_label)
      const description =
        plainText(item.summary) || plainText(item.description) || plainText(item.inclusions)

      return {
        '@type': 'Offer',
        name: item.name,
        ...(description ? { description } : {}),
        ...(price !== null ? { price, priceCurrency: 'AUD' } : {}),
      }
    })
    const prices = offers
      .map((offer) => ('price' in offer ? (offer.price as number) : null))
      .filter((value): value is number => typeof value === 'number')
    const globalServiceId = resolveServiceId(block.service_reference, siteSettings)

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id':
          globalServiceId ?? pageEntityId(canonicalUrl, `pricing-service-${blockIndex + 1}`),
        ...(!globalServiceId ? { serviceType: 'Photography' } : {}),
        provider: { '@id': entityId('business') },
        subjectOf: { '@id': pageEntityId(canonicalUrl, 'webpage') },
        offers: prices.length
          ? {
              '@type': 'AggregateOffer',
              priceCurrency: 'AUD',
              offerCount: offers.length,
              lowPrice: Math.min(...prices),
              highPrice: Math.max(...prices),
              offers,
            }
          : {
              '@type': 'OfferCatalog',
              itemListElement: offers,
            },
      },
    ]
  })
}

function buildServiceSchemas(
  blocks: ContentBlock[],
  canonicalUrl: string,
  siteSettings: WPSiteSettings | undefined,
  hasPrimaryPhotographer: boolean,
): Record<string, unknown>[] {
  const fallbackServices: Record<string, unknown>[] = []
  const listItems: Record<string, unknown>[] = []

  blocks.forEach((block, blockIndex) => {
    if (block.acf_fc_layout !== 'services_grid') return

    block.services
      .filter((service) => service.title.trim().length > 0)
      .forEach((service, serviceIndex) => {
        const globalServiceId = resolveServiceId(service.service_reference, siteSettings)
        const serviceId =
          globalServiceId ??
          pageEntityId(canonicalUrl, `service-grid-${blockIndex + 1}-${serviceIndex + 1}`)

        if (!globalServiceId) {
          const image = buildImageObject(
            service.image,
            pageEntityId(
              canonicalUrl,
              `service-grid-${blockIndex + 1}-${serviceIndex + 1}-image`,
            ),
            entityId('business'),
            hasPrimaryPhotographer,
            siteSettings,
          )
          fallbackServices.push({
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': serviceId,
            name: service.title,
            description: plainText(service.description),
            ...(image ? { image } : {}),
            ...(service.url ? { url: service.url } : {}),
            provider: { '@id': entityId('business') },
            subjectOf: { '@id': pageEntityId(canonicalUrl, 'webpage') },
          })
        }

        listItems.push({
          '@type': 'ListItem',
          position: listItems.length + 1,
          item: { '@id': serviceId },
        })
      })
  })

  if (!listItems.length) return []

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': pageEntityId(canonicalUrl, 'service-list'),
      subjectOf: { '@id': pageEntityId(canonicalUrl, 'webpage') },
      itemListElement: listItems,
    },
    ...fallbackServices,
  ]
}

function toHumanLabel(segment: string): string {
  const words = segment.replace(/[-_]+/g, ' ').trim()
  if (!words) return 'Page'
  return words
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildBreadcrumbSchema(
  pathname: string,
  pageTitle: string,
  canonicalUrl = toCanonicalUrl(pathname || '/'),
): Record<string, unknown> {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '')
  const segments = cleanPath ? cleanPath.split('/') : []

  const items = [{ name: 'Home', item: toCanonicalUrl('/') }]

  if (!segments.length) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': pageEntityId(canonicalUrl, 'breadcrumb'),
      itemListElement: items.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: entry.name,
        item: entry.item,
      })),
    }
  }

  const parents = segments.slice(0, -1)
  parents.forEach((segment, index) => {
    const parentPath = `/${segments.slice(0, index + 1).join('/')}`
    items.push({
      name: toHumanLabel(segment),
      item: toCanonicalUrl(parentPath),
    })
  })

  items.push({
    name: pageTitle || toHumanLabel(segments[segments.length - 1]),
    item: toCanonicalUrl(pathname || '/'),
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': pageEntityId(canonicalUrl, 'breadcrumb'),
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  }
}

export function buildPageSchemas(
  page: WPPage,
  canonicalUrl: string,
  pathname = '/',
  siteSettings?: WPSiteSettings,
): Record<string, unknown>[] {
  const description =
    plainText(page.yoast_head_json?.description) ||
    plainText(page.excerpt.rendered) ||
    plainText(page.content.rendered)
  const pageTitle = plainText(page.title.rendered)
  const serviceId = resolveServiceId(page.acf?.service_reference, siteSettings)
  const serviceReference = serviceId ? { '@id': serviceId } : undefined
  const venue = page.acf?.is_venue_page ? page.acf.venue : undefined
  const venueId = pageEntityId(canonicalUrl, 'venue')
  const hasPrimaryPhotographer = siteSettings
    ? Boolean(
        siteSettings.primary_photographer?.enabled &&
          nonEmpty(siteSettings.primary_photographer.name),
      )
    : true
  const venueAddress = buildPostalAddress(venue?.address)
  const venueGeo = buildGeo(venue?.geo)
  const venueImage = buildImageObject(
    venue?.image,
    pageEntityId(canonicalUrl, 'venue-image'),
    entityId('business'),
    hasPrimaryPhotographer,
    siteSettings,
  )
  const venueSchema = nonEmpty(venue?.name)
    ? {
        '@context': 'https://schema.org',
        '@type': 'Place',
        '@id': venueId,
        name: nonEmpty(venue?.name),
        ...(nonEmpty(venue?.url) ? { url: nonEmpty(venue?.url) } : {}),
        ...(nonEmpty(venue?.description) ? { description: nonEmpty(venue?.description) } : {}),
        ...(venueAddress ? { address: venueAddress } : {}),
        ...(venueGeo ? { geo: venueGeo } : {}),
        ...(venueImage ? { image: venueImage } : {}),
      }
    : null
  const blocks = page.acf?.blocks ?? []
  const faqSchema = buildFaqSchema(blocks, canonicalUrl)
  const serviceSchemas = buildServiceSchemas(
    blocks,
    canonicalUrl,
    siteSettings,
    hasPrimaryPhotographer,
  )
  const pricingSchemas = buildPricingSchemas(blocks, canonicalUrl, siteSettings)
  const mentionedSchemaIds = [
    serviceSchemas.find((schema) => schema['@type'] === 'ItemList')?.['@id'],
    ...pricingSchemas.map((schema) => schema['@id']),
  ].filter((id): id is string => typeof id === 'string')

  const webpageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageEntityId(canonicalUrl, 'webpage'),
    name: pageTitle,
    url: canonicalUrl,
    isPartOf: { '@id': entityId('website') },
    about: venueSchema
      ? [{ '@id': entityId('business') }, { '@id': venueId }]
      : { '@id': entityId('business') },
    provider: { '@id': entityId('business') },
    ...(serviceReference ? { mainEntity: serviceReference } : {}),
    ...(faqSchema ? { hasPart: { '@id': faqSchema['@id'] } } : {}),
    ...(mentionedSchemaIds.length
      ? { mentions: mentionedSchemaIds.map((id) => ({ '@id': id })) }
      : {}),
    ...(description
      ? {
          description,
        }
      : {}),
    ...(page.featured_image?.url
      ? {
          primaryImageOfPage: {
            ...buildImageObject(
              page.featured_image,
              pageEntityId(canonicalUrl, 'primary-image'),
              entityId('business'),
              hasPrimaryPhotographer,
              siteSettings,
            ),
          },
        }
      : {}),
  }

  const breadcrumbSchema = buildBreadcrumbSchema(pathname, pageTitle, canonicalUrl)

  return [
    webpageSchema,
    venueSchema,
    faqSchema,
    ...serviceSchemas,
    ...pricingSchemas,
    breadcrumbSchema,
  ].filter((schema): schema is Record<string, unknown> => schema !== null)
}

export function buildPostSchemas(
  post: WPPost,
  canonicalUrl: string,
  pathname: string,
  siteSettings?: WPSiteSettings,
): Record<string, unknown>[] {
  const postTitle = plainText(post.title.rendered)
  const description = plainText(post.yoast_head_json?.description) || plainText(post.excerpt.rendered)

  const blogPosting: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': pageEntityId(canonicalUrl, 'article'),
    headline: postTitle,
    url: canonicalUrl,
    datePublished: post.date,
    dateModified: post.modified,
    ...(description ? { description } : {}),
    ...(post.featured_image?.url
      ? { image: toAbsoluteImageUrl(post.featured_image.url) }
      : {}),
    ...(post.reading_time
      ? { timeRequired: `PT${post.reading_time}M` }
      : {}),
    author: {
      '@id':
        siteSettings?.primary_photographer?.enabled &&
        nonEmpty(siteSettings.primary_photographer.name)
          ? entityId('primary-photographer')
          : entityId('business'),
    },
    publisher: {
      '@id': entityId('business'),
    },
    isPartOf: { '@id': entityId('website') },
  }

  const breadcrumbSchema = buildBreadcrumbSchema(pathname, postTitle, canonicalUrl)

  return [blogPosting, breadcrumbSchema]
}
