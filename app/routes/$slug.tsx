import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { isRouteErrorResponse, useLoaderData, useRouteError } from 'react-router'
import BlockRenderer from '~/components/blocks/BlockRenderer'
import BlogPostPage from '~/components/BlogPostPage'
import ErrorPage from '~/components/ErrorPage'
import RichText from '~/components/RichText'
import { stripSensitiveFormBlockData } from '~/lib/forms'
import { stripHtml } from '~/lib/html'
import { buildPageSchemas, buildPostSchemas, toCanonicalUrl } from '~/lib/seo'
import
  {
    getPageByPath,
    getPageBySlug,
    getPostBySlug,
    getPostsByCategories,
    getRelatedPosts,
  } from '~/lib/wordpress'
import type { BlogPostsData, WPPage, WPPost } from '~/types/wordpress'
import styles from './$slug.module.scss'
import NotFoundRoute from './404'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PageLoaderData {
  type: 'page'
  page: WPPage
  canonicalUrl: string
  blogPostsData?: BlogPostsData
}

interface PostLoaderData {
  type: 'post'
  post: WPPost
  relatedPosts: WPPost[]
  canonicalUrl: string
}

type LoaderData = PageLoaderData | PostLoaderData

// ─── Loader (SSR — called on every request) ───────────────────────────────────
// This route catches any URL that hasn't matched a specific route above it.
// the admin creates a page in WordPress (e.g. slug: "pricing") and it
// automatically becomes available at /pricing — no code change needed.
// Blog posts are served as a fallback when no page matches the slug.
export async function loader({ params, request }: LoaderFunctionArgs): Promise<LoaderData> {
  const rawPath = params['*'] ?? params.slug ?? ''
  const slug = rawPath.replace(/^\/+|\/+$/g, '')
  const lookupSlug = slug || 'home'

  // Try flat slug first, then hierarchical path (e.g. "gallery/stylish-brides")
  const page =
    (await getPageBySlug(lookupSlug)) ??
    (lookupSlug.includes('/') ? await getPageByPath(lookupSlug) : null)

  if (page && !page.acf?.container_only) {
    const publicPage = stripSensitiveFormBlockData(page)
    const pagePath = lookupSlug === 'home' ? '/' : `/${lookupSlug}`
    const canonicalUrl = toCanonicalUrl(pagePath)

    // If the page has a blog_posts block, pre-fetch posts for SSR
    const blogBlock = publicPage.acf?.blocks?.find((b) => b.acf_fc_layout === 'blog_posts')
    let blogPostsData: BlogPostsData | undefined
    if (blogBlock) {
      const url = new URL(request.url)
      const blogPage = parseInt(url.searchParams.get('_blogPage') ?? '1', 10)
      const perPage =
        'posts_per_page' in blogBlock ? (blogBlock.posts_per_page ?? 6) : 6
      const categoryIds =
        'categories' in blogBlock && Array.isArray(blogBlock.categories)
          ? blogBlock.categories
          : []
      blogPostsData = await getPostsByCategories(categoryIds, blogPage, perPage)
    }

    return { type: 'page', page: publicPage, canonicalUrl, blogPostsData }
  }

  // Fallback: try as a blog post (single-segment slugs only)
  if (!lookupSlug.includes('/')) {
    const post = await getPostBySlug(lookupSlug)
    if (post) {
      const canonicalUrl = toCanonicalUrl(`/${lookupSlug}`)
      const categoryIds = post.categories.map((c) => c.id)
      const relatedPosts = await getRelatedPosts(post.id, categoryIds, 3)
      return { type: 'post', post, relatedPosts, canonicalUrl }
    }
  }

  throw new Response('Not Found', { status: 404 })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: 'Page Not Found | Studio Zanetti' }]

  if (data.type === 'post') {
    const { post, canonicalUrl } = data
    const yoast = post.yoast_head_json
    const title = stripHtml(post.title.rendered)
    const yoastTitle = yoast?.title ? stripHtml(yoast.title) : ''
    const metaDescription =
      (yoast?.description ? stripHtml(yoast.description) : '') ||
      stripHtml(post.excerpt.rendered).slice(0, 160)
    const pathname = (() => {
      try {
        return new URL(canonicalUrl).pathname || '/'
      } catch {
        return '/'
      }
    })()
    const schemas = buildPostSchemas(post, canonicalUrl, pathname)

    return [
      { title: yoastTitle || `${title} | Studio Zanetti` },
      { name: 'description', content: metaDescription },
      { name: 'robots', content: 'index, follow, max-image-preview:large' },
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: yoastTitle || title },
      { property: 'og:description', content: metaDescription },
      { property: 'og:url', content: canonicalUrl },
      ...(post.featured_image?.url
        ? [{ property: 'og:image', content: post.featured_image.url }]
        : yoast?.og_image?.[0]
          ? [{ property: 'og:image', content: yoast.og_image[0].url }]
          : []),
      { name: 'twitter:title', content: yoastTitle || title },
      { name: 'twitter:description', content: metaDescription },
      { name: 'twitter:card', content: 'summary_large_image' },
      { property: 'article:published_time', content: post.date },
      { property: 'article:modified_time', content: post.modified },
      { tagName: 'link', rel: 'canonical', href: canonicalUrl },
      ...schemas.map((schema) => ({
        tagName: 'script',
        type: 'application/ld+json',
        children: JSON.stringify(schema),
      })),
    ]
  }

  const { page, canonicalUrl } = data
  const yoast = page.yoast_head_json
  const pageTitle = stripHtml(page.title.rendered)
  const yoastTitle = yoast?.title ? stripHtml(yoast.title) : ''
  const metaDescription =
    (yoast?.description ? stripHtml(yoast.description) : '') || `${pageTitle} | Studio Zanetti`
  const pathname = (() => {
    try {
      return new URL(canonicalUrl).pathname || '/'
    } catch {
      return '/'
    }
  })()
  const schemas = buildPageSchemas(page, canonicalUrl, pathname)

  return [
    { title: yoastTitle || `${pageTitle} | Studio Zanetti` },
    { name: 'description', content: metaDescription },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: yoastTitle || pageTitle },
    { property: 'og:description', content: metaDescription },
    { property: 'og:url', content: canonicalUrl },
    ...(yoast?.og_image?.[0] ? [{ property: 'og:image', content: yoast.og_image[0].url }] : []),
    { name: 'twitter:title', content: yoastTitle || pageTitle },
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
  const data = useLoaderData<typeof loader>()

  if (data.type === 'post') {
    return (
      <BlogPostPage
        post={data.post}
        relatedPosts={data.relatedPosts}
        canonicalUrl={data.canonicalUrl}
      />
    )
  }

  const { page, blogPostsData } = data
  const blocks = page.acf?.blocks

  // If the page has ACF Flexible Content blocks, render them as structured components.
  // Otherwise fall back to WP's native content.rendered HTML (Gutenberg / Classic editor).
  if (blocks?.length) {
    return (
      <BlockRenderer
        blocks={blocks}
        featuredImage={page.featured_image}
        blogPostsData={blogPostsData}
      />
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{stripHtml(page.title.rendered)}</h1>
      </header>
      <div className={styles.pageContent}>
        <RichText html={page.content.rendered} />
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundRoute />
  }

  if (isOffline) {
    return <ErrorPage variant="offline" />
  }

  if (isRouteErrorResponse(error)) {
    return <ErrorPage variant="server" status={error.status} />
  }

  // Network / fetch failures when still reporting online
  if (
    error instanceof TypeError ||
    (error instanceof Error && /fetch|network|abort/i.test(error.message))
  ) {
    return <ErrorPage variant="server" />
  }

  return <ErrorPage variant="generic" />
}

export default CmsPage
