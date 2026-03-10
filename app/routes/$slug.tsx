import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { isRouteErrorResponse, useLoaderData, useRouteError } from 'react-router'
import BlockRenderer from '~/components/blocks/BlockRenderer'
import RichText from '~/components/RichText'
import { buildPageSchemas, toCanonicalUrl } from '~/lib/seo'
import { getPageByPath } from '~/lib/wordpress'
import type { WPPage } from '~/types/wordpress'
import styles from './$slug.module.scss'
import NotFoundRoute from './404'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LoaderData {
  page: WPPage
  canonicalUrl: string
}

// ─── Loader (SSR — called on every request) ───────────────────────────────────
// This route catches any URL that hasn't matched a specific route above it.
// the admin creates a page in WordPress (e.g. slug: "pricing") and it
// automatically becomes available at /pricing — no code change needed.
export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  const rawPath = params['*'] ?? params.slug ?? ''
  const lookupPath = rawPath.replace(/^\/+|\/+$/g, '') || 'home'
  const page = await getPageByPath(lookupPath, { requireExactPath: true })
  if (!page) throw new Response('Not Found', { status: 404 })

  const pagePath = lookupPath === 'home' ? '/' : `/${lookupPath}`
  const canonicalUrl = toCanonicalUrl(pagePath)

  return { page, canonicalUrl }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: 'Page Not Found | Studio Zanetti' }]
  const { page, canonicalUrl } = data
  const yoast = page.yoast_head_json
  const metaDescription = yoast?.description ?? `${page.title.rendered} | Studio Zanetti`
  const pathname = (() => {
    try {
      return new URL(canonicalUrl).pathname || '/'
    } catch {
      return '/'
    }
  })()
  const schemas = buildPageSchemas(page, canonicalUrl, pathname)

  return [
    { title: yoast?.title ?? `${page.title.rendered} | Studio Zanetti` },
    { name: 'description', content: metaDescription },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: yoast?.title ?? page.title.rendered },
    { property: 'og:description', content: metaDescription },
    { property: 'og:url', content: canonicalUrl },
    ...(yoast?.og_image?.[0] ? [{ property: 'og:image', content: yoast.og_image[0].url }] : []),
    { name: 'twitter:title', content: yoast?.title ?? page.title.rendered },
    { name: 'twitter:description', content: metaDescription },
    { name: 'twitter:card', content: 'summary_large_image' },
    { tagName: 'link', rel: 'canonical', href: canonicalUrl },
    ...schemas.map((schema) => ({
      tagName: 'script',
      type: 'application/ld+json',
      children: JSON.stringify(schema),
    })),
  ]
}

// ─── Route component ──────────────────────────────────────────────────────────
const CmsPage = () => {
  const { page } = useLoaderData<typeof loader>()
  const blocks = page.acf?.blocks

  // If the page has ACF Flexible Content blocks, render them as structured components.
  // Otherwise fall back to WP's native content.rendered HTML (Gutenberg / Classic editor).
  if (blocks?.length) {
    return <BlockRenderer blocks={blocks} featuredImage={page.featured_image} />
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1
          className={styles.pageTitle}
          dangerouslySetInnerHTML={{ __html: page.title.rendered }}
        />
      </header>
      <div className={styles.pageContent}>
        <RichText html={page.content.rendered} />
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundRoute />
  }

  throw error
}

export default CmsPage
