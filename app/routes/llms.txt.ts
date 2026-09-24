import { decodeHtmlEntities } from '~/lib/html'
import { toCanonicalUrl } from '~/lib/seo'
import {
  buildPagePaths,
  getAllPages,
  getPostsByCategories,
  getSiteSettings,
} from '~/lib/wordpress'
import type { ContentBlock, WPPage, WPPost, WPSiteSettings } from '~/types/wordpress'

const POSTS_PER_PAGE = 100
const DESCRIPTION_MAX_LENGTH = 280

const PAGE_SECTIONS = [
  'Essential information',
  'Wedding photography',
  'LGBTQ+ and same-sex weddings',
  'Corporate, event and business photography',
  'Photography galleries',
  'Guides, learning and policies',
] as const

type PageSection = (typeof PAGE_SECTIONS)[number]

interface LinkItem {
  title: string
  url: string
  description: string
}

function plainText(value: string | undefined): string {
  if (!value) return ''

  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function markdownLabel(value: string): string {
  return value.replace(/([\\[\]])/g, '\\$1')
}

function conciseText(value: string | undefined): string {
  const text = plainText(value)
    .replace(/\s*\[(?:…|\.\.\.)\]\s*$/, '')
    .trim()
  if (text.length <= DESCRIPTION_MAX_LENGTH) return text

  const excerpt = text.slice(0, DESCRIPTION_MAX_LENGTH + 1)
  const sentenceEnd = Math.max(
    excerpt.lastIndexOf('. '),
    excerpt.lastIndexOf('? '),
    excerpt.lastIndexOf('! '),
  )
  if (sentenceEnd >= 80) return excerpt.slice(0, sentenceEnd + 1)

  const wordEnd = excerpt.lastIndexOf(' ')
  return `${excerpt.slice(0, wordEnd > 0 ? wordEnd : DESCRIPTION_MAX_LENGTH)}...`
}

function blockDescription(block: ContentBlock): string {
  switch (block.acf_fc_layout) {
    case 'hero':
      return block.description ?? block.tagline ?? block.caption ?? ''
    case 'text_block':
    case 'image_text':
      return block.body
    case 'services_grid':
      return block.subheading ?? block.services.find((service) => service.description)?.description ?? ''
    case 'pillar_grid':
      return block.subheading ?? block.pillars.find((pillar) => pillar.description)?.description ?? ''
    case 'faq_accordion':
      return block.intro ?? block.faq_items.find((item) => item.answer)?.answer ?? ''
    case 'pricing_packages':
      return (
        block.subheading ??
        block.packages.find((item) => item.summary || item.description)?.summary ??
        block.packages.find((item) => item.description)?.description ??
        ''
      )
    case 'gallery_categories':
      return block.categories.length > 0
        ? `Photography galleries featuring ${block.categories.map((item) => item.title).join(', ')}.`
        : ''
    case 'gallery_reference':
      return block.description ?? ''
    case 'image_block':
      return block.subtitle ?? block.overlay_text ?? ''
    case 'form_block':
      return block.intro ?? ''
    case 'text_grid':
      return block.subheading ?? block.items.find((item) => item.body)?.body ?? ''
    case 'instagram_feed':
    case 'blog_posts':
      return block.subheading ?? ''
    case 'button_group':
      return ''
  }
}

function contentDescription(page: WPPage): string {
  for (const block of page.acf?.blocks ?? []) {
    const description = conciseText(blockDescription(block))
    if (description && description !== plainText(page.title.rendered)) return description
  }
  return ''
}

function pageDescription(page: WPPage): string {
  const candidates = [
    page.acf?.page_description,
    page.yoast_head_json?.description,
    page.excerpt.rendered,
    contentDescription(page),
  ]
  return candidates.map(conciseText).find(Boolean) ?? ''
}

function postDescription(post: WPPost): string {
  return [post.yoast_head_json?.description, post.excerpt.rendered]
    .map(conciseText)
    .find(Boolean) ?? ''
}

function listItem(item: LinkItem): string {
  const suffix = item.description ? `: ${item.description}` : ''
  return `- [${markdownLabel(plainText(item.title))}](${item.url})${suffix}`
}

function pageSection(page: WPPage, path: string): PageSection {
  const subject = `${path} ${plainText(page.title.rendered)}`.toLowerCase()

  if (!path) return 'Essential information'
  if (path.startsWith('gallery/') || /\bgaller(?:y|ies)\b/.test(subject)) {
    return 'Photography galleries'
  }
  if (/same[- ]sex|lgbt|gay|lesbian/.test(subject)) {
    return 'LGBTQ+ and same-sex weddings'
  }
  if (/corporate|business|conference|headshot|event|expo|lifestyle/.test(subject)) {
    return 'Corporate, event and business photography'
  }
  if (/wedding|engagement|bride|groom|elopement|experience/.test(subject)) {
    return 'Wedding photography'
  }
  if (/mentoring|licen[cs]ing|privacy|blog|guide/.test(subject)) {
    return 'Guides, learning and policies'
  }
  return 'Essential information'
}

function fallbackPageDescription(page: WPPage, path: string): string {
  const title = plainText(page.title.rendered)
  const subject = title.toLowerCase()

  switch (pageSection(page, path)) {
    case 'Photography galleries':
      return `A curated Studio Zanetti photography gallery focused on ${subject}.`
    case 'Wedding photography':
      return `Wedding photography services, guidance and examples focused on ${subject}.`
    case 'LGBTQ+ and same-sex weddings':
      return `Inclusive wedding photography information and examples focused on ${subject}.`
    case 'Corporate, event and business photography':
      return `Professional photography services and examples focused on ${subject}.`
    case 'Guides, learning and policies':
      return `Studio Zanetti guidance and information about ${subject}.`
    case 'Essential information':
      return `Information about ${title} from Studio Zanetti.`
  }
}

function socialProfileTitle(platform: string, url: string): string {
  try {
    const account = new URL(url).pathname.split('/').filter(Boolean).at(-1)
    return `Studio Zanetti on ${platform}${account ? ` (${account})` : ''}`
  } catch {
    return `Studio Zanetti on ${platform}`
  }
}

function siteDetails(siteSettings: WPSiteSettings, pageCount: number, postCount: number): string[] {
  const business = siteSettings.business
  const photographer = siteSettings.primary_photographer
  const address = business?.address
  const location = [address?.address_locality, address?.address_region, address?.address_country]
    .filter(Boolean)
    .join(', ')

  return [
    conciseText(business?.description),
    '',
    'Key facts:',
    ...(business?.founding_date
      ? [`- Established: ${business.founding_date.slice(0, 4)}`]
      : []),
    ...(location ? [`- Based in: ${location}`] : []),
    ...(business?.area_served?.length
      ? [`- Service area: ${business.area_served.join(', ')}`]
      : []),
    ...(business?.price_range ? [`- Published price range: ${business.price_range}`] : []),
    ...(photographer?.enabled && photographer.name
      ? [
          `- Lead photographer: ${photographer.name}${photographer.job_title ? `, ${photographer.job_title}` : ''}`,
        ]
      : []),
    `- Content index: ${pageCount} public pages and ${postCount} published stories`,
    '- Use the linked pricing, contact and licensing pages for current terms and availability.',
  ].filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
}

async function getAllPosts(): Promise<WPPost[]> {
  const firstPage = await getPostsByCategories([], 1, POSTS_PER_PAGE)
  if (firstPage.total_pages <= 1) return firstPage.posts

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.total_pages - 1 }, (_, index) =>
      getPostsByCategories([], index + 2, POSTS_PER_PAGE),
    ),
  )

  return [firstPage, ...remainingPages].flatMap((page) => page.posts)
}

export async function loader() {
  const [siteSettings, pages, posts] = await Promise.all([
    getSiteSettings(),
    getAllPages(),
    getAllPosts(),
  ])
  const pagePaths = buildPagePaths(pages)
  const publicPages = pages.filter((page) => !page.acf?.container_only)
  const pagesBySection = new Map<PageSection, LinkItem[]>(
    PAGE_SECTIONS.map((section) => [section, []]),
  )

  for (const page of publicPages) {
    const path = page.slug === 'home' ? '' : (pagePaths.get(page.id) ?? page.slug)
    pagesBySection.get(pageSection(page, path))?.push({
      title: page.title.rendered,
      url: toCanonicalUrl(path ? `/${path}` : '/'),
      description: pageDescription(page) || fallbackPageDescription(page, path),
    })
  }

  for (const items of pagesBySection.values()) {
    items.sort((left, right) => {
      if (left.url === toCanonicalUrl('/')) return -1
      if (right.url === toCanonicalUrl('/')) return 1
      return plainText(left.title).localeCompare(plainText(right.title))
    })
  }

  const postItems = posts.map((post) => ({
    title: post.title.rendered,
    url: toCanonicalUrl(`/${post.slug}`),
    description: postDescription(post),
  }))
  const sections = [
    `# ${plainText(siteSettings.site_name)}`,
    `> ${plainText(siteSettings.tagline)}`,
    '',
    ...siteDetails(siteSettings, publicPages.length, posts.length),
    ...PAGE_SECTIONS.flatMap((section) => {
      const items = pagesBySection.get(section) ?? []
      return items.length > 0 ? ['', `## ${section}`, '', ...items.map(listItem)] : []
    }),
    ...(postItems.length > 0
      ? ['', '## Wedding stories and venue guides', '', ...postItems.map(listItem)]
      : []),
    '',
    '## Site indexes',
    '',
    listItem({
      title: 'XML sitemap',
      url: toCanonicalUrl('/sitemap.xml'),
      description: 'The complete machine-readable index of canonical public URLs.',
    }),
    listItem({
      title: 'Crawler policy',
      url: toCanonicalUrl('/robots.txt'),
      description: 'The robots.txt rules for automated access to this website.',
    }),
    ...(siteSettings.social_links.length > 0
      ? [
          '',
          '## Optional',
          '',
          ...siteSettings.social_links.map((link) =>
            listItem({
              title: socialProfileTitle(link.platform, link.url),
              url: link.url,
              description: `Official ${link.platform} profile.`,
            }),
          ),
        ]
      : []),
  ]

  return new Response(`${sections.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}