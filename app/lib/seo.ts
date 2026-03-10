import type { ContentBlock, WPPage } from '~/types/wordpress'

const FALLBACK_SITE_URL = 'https://www.studiozanetti.com.au'

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
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toAbsoluteImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `${getSiteUrlFromEnv()}${url.startsWith('/') ? '' : '/'}${url}`
}

function buildFaqSchema(blocks: ContentBlock[]): Record<string, unknown> | null {
  const questions = blocks
    .filter((block) => block.acf_fc_layout === 'faq_accordion')
    .flatMap((block) => block.faq_items)
    .filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0)
    .map((item) => ({
      '@type': 'Question',
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
    mainEntity: questions,
  }
}

function buildServiceSchema(blocks: ContentBlock[]): Record<string, unknown> | null {
  const services = blocks
    .filter((block) => block.acf_fc_layout === 'services_grid')
    .flatMap((block) => block.services)
    .filter((service) => service.title.trim().length > 0)

  if (!services.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((service, index) => ({
      '@type': 'Service',
      position: index + 1,
      name: service.title,
      description: plainText(service.description),
      ...(service.image?.url
        ? {
            image: toAbsoluteImageUrl(service.image.url),
          }
        : {}),
      ...(service.url
        ? {
            url: service.url,
          }
        : {}),
      provider: {
        '@type': 'ProfessionalService',
        name: 'Studio Zanetti',
        url: getSiteUrlFromEnv(),
      },
    })),
  }
}

function toHumanLabel(segment: string): string {
  const words = segment.replace(/[-_]+/g, ' ').trim()
  if (!words) return 'Page'
  return words
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildBreadcrumbSchema(pathname: string, pageTitle: string): Record<string, unknown> {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '')
  const segments = cleanPath ? cleanPath.split('/') : []

  const items = [{ name: 'Home', item: toCanonicalUrl('/') }]

  if (!segments.length) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
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
): Record<string, unknown>[] {
  const description =
    page.yoast_head_json?.description ??
    plainText(page.excerpt.rendered) ??
    plainText(page.content.rendered)
  const pageTitle = plainText(page.title.rendered)

  const webpageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    url: canonicalUrl,
    ...(description
      ? {
          description,
        }
      : {}),
    ...(page.featured_image?.url
      ? {
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: toAbsoluteImageUrl(page.featured_image.url),
            ...(page.featured_image.alt
              ? {
                  caption: page.featured_image.alt,
                }
              : {}),
          },
        }
      : {}),
  }

  const blocks = page.acf?.blocks ?? []
  const faqSchema = buildFaqSchema(blocks)
  const serviceSchema = buildServiceSchema(blocks)
  const breadcrumbSchema = buildBreadcrumbSchema(pathname, pageTitle)

  return [webpageSchema, faqSchema, serviceSchema, breadcrumbSchema].filter(
    (schema): schema is Record<string, unknown> => schema !== null,
  )
}
