import type { MetaFunction } from 'react-router'
import { isRouteErrorResponse, useLoaderData, useRouteError } from 'react-router'
import BlockRenderer from '~/components/blocks/BlockRenderer'
import RichText from '~/components/blocks/RichText'
import { getPageBySlug } from '~/lib/wordpress'
import type { WPPage } from '~/types/wordpress'
import styles from './$slug.module.scss'
import NotFoundRoute from './404'

interface LoaderData {
  page: WPPage
}

export async function loader(): Promise<LoaderData> {
  const page = await getPageBySlug('home')
  if (!page) throw new Response('Not Found', { status: 404 })
  return { page }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: 'Home | Studio Zanetti' }]

  const { page } = data
  const yoast = page.yoast_head_json
  const metaDescription = yoast?.description ?? `${page.title.rendered} | Studio Zanetti`

  return [
    { title: yoast?.title ?? `${page.title.rendered} | Studio Zanetti` },
    { name: 'description', content: metaDescription },
    { property: 'og:title', content: yoast?.title ?? page.title.rendered },
    ...(yoast?.og_image?.[0] ? [{ property: 'og:image', content: yoast.og_image[0].url }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
}

const HomePage = () => {
  const { page } = useLoaderData<typeof loader>()
  const blocks = page.acf?.blocks

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

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundRoute />
  }

  throw error
}

export default HomePage
