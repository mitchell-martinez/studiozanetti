import Button from '~/components/Button'
import { getBackgroundImageStyle, getSectionStyle } from '../helpers/styleOptions'
import sharedStyles from '../shared.module.scss'
import styles from './TextGridBlock.module.scss'
import type { TextGridBlockProps } from './types'

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

  const fontSizeClass =
    block.font_size === 'md' ? styles.fontMd : block.font_size === 'lg' ? styles.fontLg : ''

  const bgImageStyle = getBackgroundImageStyle(block)

  return (
    <section className={styles.section} style={getSectionStyle(block)}>
      {bgImageStyle && (
        <div className={sharedStyles.backgroundImage} style={bgImageStyle} aria-hidden="true" />
      )}
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}
        <div
          className={styles.grid}
          style={
            block.max_columns
              ? ({ '--max-cols': block.max_columns } as React.CSSProperties)
              : undefined
          }
        >
          {block.items.map((item, index) => (
            <article
              key={item.title ?? `item-${index}`}
              className={`${styles.card} ${cardStyleClass} ${textAlignClass} ${fontSizeClass}`.trim()}
            >
              {item.title && <h3 className={styles.cardTitle}>{item.title}</h3>}
              {item.body && <p className={styles.cardBody}>{item.body}</p>}
              {item.cta_text && item.cta_url && (
                <div className={styles.cardCta}>
                  <Button
                    href={item.cta_url}
                    variant={block.cta_variant ?? 'outline'}
                    size={block.cta_size ?? 'sm'}
                  >
                    {item.cta_text}
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
