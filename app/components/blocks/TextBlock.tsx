import { Link } from 'react-router'
import type { TextBlock as TextBlockType } from '~/types/wordpress'
import RichText from './RichText'
import styles from './blocks.module.scss'

interface TextBlockProps {
  block: TextBlockType
  /** Optional background override — defaults to white */
  dark?: boolean
}

const TextBlock = ({ block, dark }: TextBlockProps) => (
  <section
    className={styles.blockSection}
    style={{ background: dark ? 'var(--color-light-gray)' : 'var(--color-white)' }}
  >
    <div
      className={`${styles.textContent} ${block.align === 'center' ? styles.textCenter : ''}`}
    >
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
