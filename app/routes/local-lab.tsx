import { useLoaderData } from 'react-router'
import BlockRenderer from '~/components/blocks/BlockRenderer'
import GalleryGrid from '~/components/GalleryGrid'
import { demoGalleryImages, fullPageBlocksA, fullPageBlocksB, heroBlock } from '~/dev/localLabData'

interface LocalLabLoaderData {
  allowed: true
}

const isLocalHost = (host: string) => {
  const normalized = host.toLowerCase()
  return (
    normalized.startsWith('localhost') ||
    normalized.startsWith('127.0.0.1') ||
    normalized.startsWith('[::1]')
  )
}

export async function loader({ request }: { request: Request }): Promise<LocalLabLoaderData> {
  const host = new URL(request.url).host
  if (!isLocalHost(host)) {
    throw new Response('Not Found', { status: 404 })
  }

  return { allowed: true }
}

const LocalLabRoute = () => {
  useLoaderData<typeof loader>()

  return (
    <div>
      <BlockRenderer blocks={fullPageBlocksA} featuredImage={heroBlock.slides?.[0]} />
      <GalleryGrid images={demoGalleryImages} />
      <BlockRenderer blocks={fullPageBlocksB} featuredImage={heroBlock.slides?.[1]} />
    </div>
  )
}

export default LocalLabRoute
