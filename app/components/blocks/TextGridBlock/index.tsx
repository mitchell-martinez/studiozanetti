import Button from '~/components/Button'
import { getBackgroundImageStyle, getSectionStyle } from '../helpers/styleOptions'
import sharedStyles from '../shared.module.scss'
import styles from './TextGridBlock.module.scss'
import type { TextGridBlockProps } from './types'
import type { ButtonSize, ButtonVariant } from '~/components/Button/types'

const alignClass: Record<string, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
}

const isButtonVariant = (value: unknown): value is ButtonVariant =>
  value === 'primary' ||
  value === 'secondary' ||
  value === 'outline' ||
  value === 'dark' ||
  value === 'text'

const isButtonSize = (value: unknown): value is ButtonSize =>
  value === 'sm' || value === 'md' || value === 'lg'

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
          {block.items.map((item, index) => {
            // ACF select fields can come through as empty strings when set to
            // "Use block default". Treat blank values as unset.
            const rawItemVariant = typeof item.cta_variant === 'string' ? item.cta_variant.trim() : undefined
            const rawBlockVariant = typeof block.cta_variant === 'string' ? block.cta_variant.trim() : undefined
            const rawItemSize = typeof item.cta_size === 'string' ? item.cta_size.trim() : undefined
            const rawBlockSize = typeof block.cta_size === 'string' ? block.cta_size.trim() : undefined

            const ctaVariant: ButtonVariant =
              (isButtonVariant(rawItemVariant) && rawItemVariant) ||
              (isButtonVariant(rawBlockVariant) && rawBlockVariant) ||
              'outline'

            const ctaSize: ButtonSize =
              (isButtonSize(rawItemSize) && rawItemSize) ||
              (isButtonSize(rawBlockSize) && rawBlockSize) ||
              'sm'

            return (
            <article
              key={item.title ?? `item-${index}`}
              className={`${styles.card} ${cardStyleClass} ${textAlignClass} ${fontSizeClass}`.trim()}
            >
              {item.title && <h3 className={styles.cardTitle}>{item.title}</h3>}
              {item.body && <p className={styles.cardBody}>{item.body}</p>}
              {item.cta_text && item.cta_url && (
                <div className={styles.cardCta}>
                  <Button href={item.cta_url} variant={ctaVariant} size={ctaSize}>
                    {item.cta_text}
                  </Button>
                </div>
              )}
            </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TextGridBlock
