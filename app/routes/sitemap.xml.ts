import { toCanonicalUrl } from '~/lib/seo'
import { buildPagePaths, getAllPages, getAllPostSitemapEntries } from '~/lib/wordpress'
import type { WPImage, WPPage } from '~/types/wordpress'

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizedLastModified(value: string | undefined): string | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined
}

function collectPageImageUrls(page: WPPage): string[] {
  const urls = new Set<string>()
  const addImage = (image: WPImage | undefined) => {
    if (!image?.url) return
    urls.add(/^https?:\/\//i.test(image.url) ? image.url : toCanonicalUrl(image.url))
  }

  addImage(page.featured_image)
  for (const block of page.acf?.blocks ?? []) {
    switch (block.acf_fc_layout) {
      case 'hero':
        addImage(block.background_image)
        block.slides?.forEach(addImage)
        break
      case 'image_text':
        addImage(block.image)
        addImage(block.image_mobile)
        break
      case 'services_grid':
        block.services.forEach((service) => addImage(service.image))
        break
      case 'gallery_categories':
        block.categories.forEach((category) => addImage(category.image))
        break
      case 'gallery_reference':
        block.images?.forEach((item) => addImage(item.image))
        break
      case 'image_block':
        addImage(block.image)
        break
      case 'instagram_feed':
        block.images.forEach(addImage)
        break
      default:
        break
    }
  }

  return [...urls].slice(0, 1_000)
}

interface SitemapEntry {
  path: string
  modified?: string
  imageUrls?: string[]
}

function renderUrlEntry(entry: SitemapEntry): string {
  const loc = toCanonicalUrl(entry.path)
  const lastModified = normalizedLastModified(entry.modified)
  const images = (entry.imageUrls ?? [])
    .map((url) => `<image:image><image:loc>${xmlEscape(url)}</image:loc></image:image>`)
    .join('')

  return `<url><loc>${xmlEscape(loc)}</loc>${lastModified ? `<lastmod>${lastModified}</lastmod>` : ''}<changefreq>weekly</changefreq>${images}</url>`
}

export async function loader() {
  const [pages, posts] = await Promise.all([getAllPages(), getAllPostSitemapEntries()])
  const pagePaths = buildPagePaths(pages)

  const pageEntries: SitemapEntry[] = pages
    .filter((page) => !page.acf?.container_only)
    .map((page) => {
      const path = page.slug === 'home' ? '/' : `/${pagePaths.get(page.id) ?? page.slug}`
      return {
        path,
        modified: page.modified,
        imageUrls: collectPageImageUrls(page),
      }
    })
    .filter(
      (entry, index, all) => all.findIndex((candidate) => candidate.path === entry.path) === index,
    )

  if (!pageEntries.some((entry) => entry.path === '/')) {
    pageEntries.unshift({ path: '/', imageUrls: [] })
  }

  const postEntries = posts.map((post) => ({
    path: `/${post.slug}`,
    modified: post.modified,
    imageUrls: post.image_urls,
  }))
  const urlEntries = [...pageEntries, ...postEntries].map(renderUrlEntry).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urlEntries}</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
