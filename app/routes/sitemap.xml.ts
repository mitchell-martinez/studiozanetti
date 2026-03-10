import { toCanonicalUrl } from '~/lib/seo'
import { getAllPages } from '~/lib/wordpress'

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function loader() {
  const pages = await getAllPages()
  const now = new Date().toISOString()

  const pageUrls = pages
    .map((page) => (page.slug === 'home' ? '/' : `/${page.slug}`))
    .filter((path, index, all) => all.indexOf(path) === index)

  if (!pageUrls.includes('/')) {
    pageUrls.unshift('/')
  }

  const urlEntries = pageUrls
    .map((path) => {
      const loc = toCanonicalUrl(path)
      return `<url><loc>${xmlEscape(loc)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
