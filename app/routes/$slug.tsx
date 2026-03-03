import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router'
import { getPageBySlug } from '~/lib/wordpress'
import type { WPPage } from '~/types/wordpress'
import BlockRenderer from '~/components/blocks/BlockRenderer'
import RichText from '~/components/blocks/RichText'
import styles from './$slug.module.scss'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LoaderData {
  page: WPPage
}

// ─── Loader (SSR — called on every request) ───────────────────────────────────
// This route catches any URL that hasn't matched a specific route above it.
// Michael creates a page in WordPress (e.g. slug: "pricing") and it
// automatically becomes available at /pricing — no code change needed.
export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  const slug = params.slug ?? ''
  const page = await getPageBySlug(slug)
  if (!page) throw new Response('Not Found', { status: 404 })
  return { page }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: 'Page Not Found | Studio Zanetti' }]
  const { page } = data
  const yoast = page.yoast_head_json
  const metaDescription = yoast?.description ?? `${page.title.rendered} | Studio Zanetti`
  return [
    { title: yoast?.title ?? `${page.title.rendered} | Studio Zanetti` },
    { name: 'description', content: metaDescription },
    { property: 'og:title', content: yoast?.title ?? page.title.rendered },
    ...(yoast?.og_image?.[0]
      ? [{ property: 'og:image', content: yoast.og_image[0].url }]
      : []),
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
}

// ─── Route component ──────────────────────────────────────────────────────────
const CmsPage = () => {
  const { page } = useLoaderData<typeof loader>()
  const blocks = page.acf?.blocks

  // If the page has ACF Flexible Content blocks, render them as structured components.
  // Otherwise fall back to WP's native content.rendered HTML (Gutenberg / Classic editor).
  if (blocks?.length) {
    return <BlockRenderer blocks={blocks} />
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

export default CmsPage
