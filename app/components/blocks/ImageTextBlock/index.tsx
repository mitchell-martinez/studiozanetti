import { createElement } from 'react'
import { Link } from 'react-router'
import Button from '~/components/Button'
import RichText from '~/components/RichText'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './ImageTextBlock.module.scss'
import type { ImageTextBlockProps } from './types'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const ratioClass = (ratio?: string) => {
  switch (ratio) {
    case 'portrait':
      return styles.imagePortrait
    case 'square':
      return styles.imageSquare
    case 'auto':
      return styles.imageAuto
    default:
      return styles.imageLandscape
  }
}

const imageAlignClass = (align?: string) => {
  switch (align) {
    case 'center':
      return styles.imgAlignCenter
    case 'right':
      return styles.imgAlignRight
    default:
      return ''
  }
}

const imageVAlignClass = (align?: string) => {
  switch (align) {
    case 'middle':
      return styles.imgVAlignMiddle
    case 'bottom':
      return styles.imgVAlignBottom
    default:
      return styles.imgVAlignTop
  }
}

const verticalAlignClass = (align?: string) => {
  switch (align) {
    case 'middle':
      return styles.alignMiddle
    case 'bottom':
      return styles.alignBottom
    default:
      return styles.alignTop
  }
}

const horizontalAlignClass = (align?: string) => {
  switch (align) {
    case 'center':
      return styles.textCenter
    case 'right':
      return styles.textRight
    default:
      return ''
  }
}

// Hostnames that belong to this site. Absolute URLs pointing here are treated as
// internal links (same tab) rather than external ones (new tab).
const SITE_HOSTS = ['studiozanetti.com.au', 'www.studiozanetti.com.au']

/**
 * Resolves a clickable URL into either an internal same-tab path or an external URL.
 * Relative URLs and absolute URLs on a site host resolve to an internal path.
 */
const resolveClickableUrl = (
  url: string,
): { internalPath: string } | { externalUrl: string } => {
  const isAbsolute = /^https?:\/\//i.test(url) || url.startsWith('//')

  if (!isAbsolute) return { internalPath: url }

  try {
    const parsed = new URL(url.startsWith('//') ? `https:${url}` : url)
    if (SITE_HOSTS.includes(parsed.hostname.toLowerCase())) {
      return { internalPath: `${parsed.pathname}${parsed.search}${parsed.hash}` || '/' }
    }
  } catch {
    // Fall through and treat as external.
  }

  return { externalUrl: url }
}

const ImageTextBlock = ({ block }: ImageTextBlockProps) => {
  const headingLevel: HeadingLevel = block.heading_level ?? 'h2'
  const imgStyle: React.CSSProperties = {}
  if (block.image_max_width) imgStyle.maxWidth = `${block.image_max_width}px`
  if (block.image_max_height) imgStyle.maxHeight = `${block.image_max_height}px`

  const resolvedUrl = block.url ? resolveClickableUrl(block.url) : null

  const hasHeading = Boolean(block.eyebrow || block.heading)
  const hasBody = Boolean(block.body)

  const content = (
    <div
      className={`${styles.imageText} ${block.image_position === 'right' ? styles.imageRight : ''} ${ratioClass(block.image_ratio)} ${
        block.image_style === 'framed'
          ? styles.imageFramed
          : block.image_style === 'plain'
            ? styles.imagePlain
            : styles.imageSoft
      } ${block.url ? styles.clickable : ''} ${verticalAlignClass(block.text_vertical_align)}`}
    >
      <div className={`${styles.imageTextImage} ${imageAlignClass(block.image_alignment)} ${imageVAlignClass(block.image_vertical_align)}`}>
        <picture>
          {block.image_mobile?.url && (
            <source media="(max-width: 768px)" srcSet={block.image_mobile.url} />
          )}
          <img
            src={block.image.url}
            alt={block.image.alt || ''}
            loading="lazy"
            decoding="async"
            width={block.image.width ?? 600}
            height={block.image.height ?? 700}
            style={imgStyle}
          />
        </picture>
        {block.image_caption && <p className={styles.imageCaption}>{block.image_caption}</p>}
      </div>
      <div
        className={`${styles.imageTextBody} ${horizontalAlignClass(block.text_horizontal_align)} ${
          hasHeading && !hasBody
            ? styles.headingOnly
            : !hasHeading && hasBody
              ? styles.bodyOnly
              : ''
        }`}
      >
        {block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}
        {block.heading && createElement(headingLevel, { className: styles.imageTextHeading }, block.heading)}
        <RichText html={block.body} fontSize={block.font_size} />
        {!block.url && block.cta_text && block.cta_url && (
          <Button href={block.cta_url} variant="text" size="sm">
            {block.cta_text}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <section className={styles.section} style={getSectionStyle(block)}>
      {resolvedUrl ? (
        'externalUrl' in resolvedUrl ? (
          <a
            href={resolvedUrl.externalUrl}
            className={styles.blockLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        ) : (
          <Link to={resolvedUrl.internalPath} className={styles.blockLink}>
            {content}
          </Link>
        )
      ) : (
        content
      )}
    </section>
  )
}

export default ImageTextBlock
