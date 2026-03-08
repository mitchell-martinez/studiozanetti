import { useLoaderData } from 'react-router'
import BlockRenderer from '~/components/blocks/BlockRenderer'
import GalleryGrid from '~/components/GalleryGrid'
import heroBlock from '~/components/blocks/HeroBlock/__mocks__/heroBlock.json'
import demoGalleryImages from '~/components/GalleryGrid/__mocks__/demoGalleryImages.json'
import { fullPageBlocksA, fullPageBlocksB } from '~/dev/localLabData'
import type { GalleryImage } from '~/types/gallery'
import type { HeroBlock } from '~/types/wordpress'

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
  const hero = heroBlock as unknown as HeroBlock
  const galleryImages = demoGalleryImages as unknown as GalleryImage[]

  return (
    <div>
      <BlockRenderer blocks={fullPageBlocksA} featuredImage={hero.slides?.[0]} />
      <GalleryGrid images={galleryImages} />
      <BlockRenderer blocks={fullPageBlocksB} featuredImage={hero.slides?.[1]} />
    </div>
  )
}

export default LocalLabRoute
