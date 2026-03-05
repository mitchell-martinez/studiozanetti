import { Link } from 'react-router'
import { getSectionStyle } from '../helpers/styleOptions'
import RichText from '../RichText'
import styles from './TextBlock.module.scss'
import type { TextBlockProps } from './types'

const TextBlock = ({ block, dark }: TextBlockProps) => (
  <section
    className={styles.section}
    style={
      dark
        ? { ...getSectionStyle(block), background: 'var(--color-light-gray)' }
        : getSectionStyle(block)
    }
  >
    <div
      className={`${styles.textContent} ${block.align === 'center' ? styles.textCenter : ''} ${
        block.max_width === 'narrow'
          ? styles.maxNarrow
          : block.max_width === 'wide'
            ? styles.maxWide
            : styles.maxNormal
      }`}
    >
      {block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}
      {block.heading && <h2 className={styles.textHeading}>{block.heading}</h2>}
      <RichText html={block.body} />
      {block.cta_text && block.cta_url && (
        <Link to={block.cta_url} className={styles.blockCta}>
          {block.cta_text} →
        </Link>
      )}
    </div>
  </section>
)

export default TextBlock
