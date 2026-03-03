import type { BiographyBlock as BiographyBlockType } from '~/types/wordpress'
import RichText from './RichText'
import styles from './blocks.module.scss'

interface BiographyBlockProps {
  block: BiographyBlockType
}

const BiographyBlock = ({ block }: BiographyBlockProps) => (
  <section className={styles.blockSection}>
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
