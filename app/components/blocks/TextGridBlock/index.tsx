import Button from '~/components/Button'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './TextGridBlock.module.scss'
import type { TextGridBlockProps } from './types'

const colClass: Record<number, string> = {
  2: styles.cols2,
  3: styles.cols3,
  4: styles.cols4,
}

const alignClass: Record<string, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
}

const TextGridBlock = ({ block }: TextGridBlockProps) => {
  if (!block.items?.length) return null

  const cardStyleClass =
    block.card_style === 'outline'
      ? styles.cardOutline
      : block.card_style === 'minimal'
        ? styles.cardMinimal
        : styles.cardElevated

  const textAlignClass = alignClass[block.text_align ?? 'left'] ?? ''

  return (
    <section className={styles.section} style={getSectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}
        <div className={`${styles.grid} ${colClass[block.columns ?? 3] ?? ''}`}>
          {block.items.map((item) => (
            <article
              key={item.title}
              className={`${styles.card} ${cardStyleClass} ${textAlignClass}`.trim()}
            >
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardBody}>{item.body}</p>
              {item.cta_text && item.cta_url && (
                <div className={styles.cardCta}>
                  <Button href={item.cta_url} variant="text" size="sm">
                    {item.cta_text} →
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TextGridBlock
