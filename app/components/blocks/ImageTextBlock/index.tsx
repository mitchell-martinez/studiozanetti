import { Link } from 'react-router'
import Button from '~/components/Button'
import RichText from '~/components/RichText'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './ImageTextBlock.module.scss'
import type { ImageTextBlockProps } from './types'

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

const ImageTextBlock = ({ block }: ImageTextBlockProps) => {
  const imgStyle: React.CSSProperties = {}
  if (block.image_max_width) imgStyle.maxWidth = `${block.image_max_width}px`
  if (block.image_max_height) imgStyle.maxHeight = `${block.image_max_height}px`

  const isExternal = block.url && /^https?:\/\/|^\/\//.test(block.url)

  const content = (
    <div
      className={`${styles.imageText} ${block.image_position === 'right' ? styles.imageRight : ''} ${ratioClass(block.image_ratio)} ${
        block.image_style === 'framed'
          ? styles.imageFramed
          : block.image_style === 'plain'
            ? styles.imagePlain
            : styles.imageSoft
      } ${block.url ? styles.clickable : ''}`}
    >
      <div className={styles.imageTextImage}>
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
      <div className={styles.imageTextBody}>
        {block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}
        {block.heading && <h2 className={styles.imageTextHeading}>{block.heading}</h2>}
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
      {block.url ? (
        isExternal ? (
          <a
            href={block.url}
            className={styles.blockLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        ) : (
          <Link to={block.url} className={styles.blockLink}>
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
