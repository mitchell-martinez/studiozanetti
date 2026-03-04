import BiographyBlock from '../BiographyBlock'
import HeroBlock from '../HeroBlock'
import ImageTextBlock from '../ImageTextBlock'
import PillarGridBlock from '../PillarGridBlock'
import ServicesGridBlock from '../ServicesGridBlock'
import TextBlock from '../TextBlock'
import type { BlockRendererProps } from './types'

/**
 * Renders a list of ACF Flexible Content blocks in order.
 * Unknown layout types are silently skipped so new block types added in
 * WordPress never crash the frontend before the corresponding component is built.
 */
const BlockRenderer = ({ blocks }: BlockRendererProps) => (
  <>
    {blocks.map((block, index) => {
      const key = `${block.acf_fc_layout}-${index}`
      switch (block.acf_fc_layout) {
        case 'hero':
          return <HeroBlock key={key} block={block} />
        case 'text_block':
          return <TextBlock key={key} block={block} />
        case 'image_text':
          return <ImageTextBlock key={key} block={block} />
        case 'services_grid':
          return <ServicesGridBlock key={key} block={block} />
        case 'biography':
          return <BiographyBlock key={key} block={block} />
        case 'pillar_grid':
          return <PillarGridBlock key={key} block={block} />
        default:
          return null
      }
    })}
  </>
)

export default BlockRenderer
