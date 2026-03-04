import { Link } from 'react-router'
import RichText from '../RichText'
import styles from './TextBlock.module.scss'
import type { TextBlockProps } from './types'

const TextBlock = ({ block, dark }: TextBlockProps) => (
  <section
    className={styles.section}
    style={{ background: dark ? 'var(--color-light-gray)' : 'var(--color-white)' }}
  >
    <div className={`${styles.textContent} ${block.align === 'center' ? styles.textCenter : ''}`}>
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
