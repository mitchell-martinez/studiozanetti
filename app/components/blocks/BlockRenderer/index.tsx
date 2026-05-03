import BlogPostsBlock from '../BlogPostsBlock'
import ButtonGroupBlock from '../ButtonGroupBlock'
import FaqAccordionBlock from '../FaqAccordionBlock'
import FormBlock from '../FormBlock'
import GalleriesBlock from '../GalleriesBlock'
import GalleryCategoriesBlock from '../GalleryCategoriesBlock'
import HeroBlock from '../HeroBlock'
import ImageBlock from '../ImageBlock'
import ImageTextBlock from '../ImageTextBlock'
import InstagramFeedBlock from '../InstagramFeedBlock'
import PillarGridBlock from '../PillarGridBlock'
import PricingPackagesBlock from '../PricingPackagesBlock'
import ServicesGridBlock from '../ServicesGridBlock'
import TextBlock from '../TextBlock'
import TextGridBlock from '../TextGridBlock'
import type { BlockRendererProps } from './types'

/** Human-readable labels for ACF layout types */
const BLOCK_LABELS: Record<string, string> = {
  hero: 'Hero',
  text_block: 'Text Block',
  image_text: 'Image + Text',
  services_grid: 'Services Grid',
  pillar_grid: 'Pillar Grid',
  faq_accordion: 'FAQ Accordion',
  form_block: 'Form',
  pricing_packages: 'Pricing Packages',
  gallery_categories: 'Gallery Categories',
  galleries: 'Galleries',
  gallery_reference: 'Gallery Reference',
  image_block: 'Image',
  button_group: 'Button Group',
  text_grid: 'Text Grid',
  instagram_feed: 'Instagram Feed',
  blog_posts: 'Blog Posts',
}

/**
 * Notify the parent WordPress editor window to scroll to / highlight
 * a specific ACF Flexible Content row.
 */
function notifyParent(action: string, index: number) {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({ source: 'sz-preview', action, index }, '*')
  }
}

/**
 * Interactive wrapper shown in iframe preview mode.
 * Renders a clickable overlay around each block so the WP admin can
 * click a block to jump to the corresponding ACF field in the editor.
 */
const InteractiveBlockWrapper = ({
  index,
  layoutType,
  children,
}: {
  index: number
  layoutType: string
  children: React.ReactNode
}) => (
  <div
    style={{ position: 'relative', cursor: 'pointer' }}
    data-block-index={index}
    data-block-type={layoutType}
    onClick={() => notifyParent('focus-block', index)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        notifyParent('focus-block', index)
      }
    }}
    onMouseEnter={(e) => {
      const overlay = e.currentTarget.querySelector<HTMLElement>('[data-overlay]')
      if (overlay) overlay.style.opacity = '1'
    }}
    onMouseLeave={(e) => {
      const overlay = e.currentTarget.querySelector<HTMLElement>('[data-overlay]')
      if (overlay) overlay.style.opacity = '0'
    }}
    role="button"
    tabIndex={0}
    aria-label={`Edit ${BLOCK_LABELS[layoutType] || layoutType} block`}
  >
    {children}
    <div
      data-overlay
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 120, 215, 0.08)',
        border: '2px dashed rgba(0, 120, 215, 0.5)',
        borderRadius: '4px',
        opacity: 0,
        transition: 'opacity 0.2s',
        pointerEvents: 'none',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '8px',
      }}
    >
      <span
        style={{
          background: '#0078d7',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '3px',
          letterSpacing: '0.03em',
          pointerEvents: 'auto',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      >
        ✎ {BLOCK_LABELS[layoutType] || layoutType}
      </span>
    </div>
  </div>
)

/**
 * Renders a list of ACF Flexible Content blocks in order.
 * Unknown layout types are silently skipped so new block types added in
 * WordPress never crash the frontend before the corresponding component is built.
 *
 * When `interactive` is true (iframe preview mode), each block is wrapped with
 * a clickable overlay that communicates with the parent WordPress editor via
 * postMessage, allowing click-to-edit navigation.
 */
const BlockRenderer = ({
  blocks,
  interactive = false,
  featuredImage,
  blogPostsData,
}: BlockRendererProps) => (
  <>
    {blocks.map((block, index) => {
      const key = `${block.acf_fc_layout}-${index}`
      let rendered: React.ReactNode = null

      switch (block.acf_fc_layout) {
        case 'hero':
          rendered = <HeroBlock key={key} block={block} featuredImage={featuredImage} />
          break
        case 'text_block':
          rendered = <TextBlock key={key} block={block} />
          break
        case 'image_text':
          rendered = <ImageTextBlock key={key} block={block} />
          break
        case 'services_grid':
          rendered = <ServicesGridBlock key={key} block={block} />
          break
        case 'pillar_grid':
          rendered = <PillarGridBlock key={key} block={block} />
          break
        case 'faq_accordion':
          rendered = <FaqAccordionBlock key={key} block={block} />
          break
        case 'form_block':
          rendered = <FormBlock key={key} block={block} />
          break
        case 'pricing_packages':
          rendered = <PricingPackagesBlock key={key} block={block} />
          break
        case 'gallery_categories':
          rendered = <GalleryCategoriesBlock key={key} block={block} />
          break
        case 'galleries':
        case 'gallery_reference':
          rendered = <GalleriesBlock key={key} block={block} />
          break
        case 'image_block':
          rendered = <ImageBlock key={key} block={block} />
          break
        case 'button_group':
          rendered = <ButtonGroupBlock key={key} block={block} />
          break
        case 'text_grid':
          rendered = <TextGridBlock key={key} block={block} />
          break
        case 'instagram_feed':
          rendered = <InstagramFeedBlock key={key} block={block} />
          break
        case 'blog_posts':
          rendered = blogPostsData ? (
            <BlogPostsBlock key={key} block={block} blogPostsData={blogPostsData} />
          ) : null
          break
        default:
          return null
      }

      if (interactive) {
        return (
          <InteractiveBlockWrapper key={key} index={index} layoutType={block.acf_fc_layout}>
            {rendered}
          </InteractiveBlockWrapper>
        )
      }

      return rendered
    })}
  </>
)

export default BlockRenderer
