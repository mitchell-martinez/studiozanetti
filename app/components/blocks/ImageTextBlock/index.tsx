import { Link } from 'react-router'
import { getSectionStyle } from '../helpers/styleOptions'
import RichText from '../RichText'
import styles from './ImageTextBlock.module.scss'
import type { ImageTextBlockProps } from './types'

const ImageTextBlock = ({ block }: ImageTextBlockProps) => (
  <section className={styles.section} style={getSectionStyle(block)}>
    <div
      className={`${styles.imageText} ${block.image_position === 'right' ? styles.imageRight : ''} ${
        block.image_ratio === 'portrait'
          ? styles.imagePortrait
          : block.image_ratio === 'square'
            ? styles.imageSquare
            : styles.imageLandscape
      } ${
        block.image_style === 'framed'
          ? styles.imageFramed
          : block.image_style === 'plain'
            ? styles.imagePlain
            : styles.imageSoft
      }`}
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
          />
        </picture>
      </div>
      <div className={styles.imageTextBody}>
        {block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}
        {block.heading && <h2 className={styles.imageTextHeading}>{block.heading}</h2>}
        <RichText html={block.body} />
        {block.cta_text && block.cta_url && (
          <Link to={block.cta_url} className={styles.blockCta}>
            {block.cta_text}
          </Link>
        )}
      </div>
    </div>
  </section>
)

export default ImageTextBlock
