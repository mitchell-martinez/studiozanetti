import type { ImageTextBlock as ImageTextBlockType } from '~/types/wordpress'
import RichText from './RichText'
import styles from './blocks.module.scss'

interface ImageTextBlockProps {
  block: ImageTextBlockType
}

const ImageTextBlock = ({ block }: ImageTextBlockProps) => (
  <section className={styles.blockSection}>
    <div className={`${styles.imageText} ${block.image_position === 'right' ? styles.imageRight : ''}`}>
      <div className={styles.imageTextImage}>
        <img
          src={block.image.url}
          alt={block.image.alt || ''}
          loading="lazy"
          decoding="async"
          width={block.image.width ?? 600}
          height={block.image.height ?? 700}
        />
      </div>
      <div className={styles.imageTextBody}>
        {block.heading && <h2 className={styles.imageTextHeading}>{block.heading}</h2>}
        <RichText html={block.body} />
      </div>
    </div>
  </section>
)

export default ImageTextBlock
