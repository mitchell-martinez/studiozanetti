import type { ContentBlock } from '~/types/wordpress'
import HeroBlock from './HeroBlock'
import TextBlock from './TextBlock'
import ImageTextBlock from './ImageTextBlock'
import ServicesGridBlock from './ServicesGridBlock'
import BiographyBlock from './BiographyBlock'
import PillarGridBlock from './PillarGridBlock'

interface BlockRendererProps {
  blocks: ContentBlock[]
}

/**
 * Renders a list of ACF Flexible Content blocks in order.
 * Unknown layout types are silently skipped so new block types added in
 * WordPress never crash the frontend before the corresponding component is built.
 */
const BlockRenderer = ({ blocks }: BlockRendererProps) => (
  <>
    {blocks.map((block, index) => {
      // Use type+index as key — ACF blocks have no stable ID.
      // This is better than bare index: same-type blocks at stable positions
      // keep their component instances when other types are added/removed.
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
          // Silently skip: a block type exists in WP but has no React component yet.
          return null
      }
    })}
  </>
)

export default BlockRenderer
