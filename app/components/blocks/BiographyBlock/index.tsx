import RichText from '../RichText'
import styles from './BiographyBlock.module.scss'
import type { BiographyBlockProps } from './types'

const BiographyBlock = ({ block }: BiographyBlockProps) => (
  <section className={styles.section}>
    <div className={styles.bioInner}>
      {block.image && (
        <div className={styles.bioImage}>
          <img
            src={block.image.url}
            alt={block.image.alt || block.name}
            loading="lazy"
            decoding="async"
            width={block.image.width ?? 600}
            height={block.image.height ?? 700}
          />
        </div>
      )}
      <div className={styles.bioBody}>
        <h2 className={styles.bioName}>{block.name}</h2>
        {block.role && <p className={styles.bioRole}>{block.role}</p>}
        <RichText html={block.bio} />
      </div>
    </div>
  </section>
)

export default BiographyBlock
