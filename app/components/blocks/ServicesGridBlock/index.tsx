import { Link } from 'react-router'
import Button from '~/components/Button'
import { getBackgroundImageStyle, getSectionStyle } from '../helpers/styleOptions'
import sharedStyles from '../shared.module.scss'
import styles from './ServicesGridBlock.module.scss'
import type { ServicesGridBlockProps } from './types'

const alignClass: Record<string, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
}

const ServicesGridBlock = ({ block }: ServicesGridBlockProps) => {
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
    <section className={styles.section} style={getSectionStyle(block, 'champagne')}>
      {bgImageStyle && (
        <div className={sharedStyles.backgroundImage} style={bgImageStyle} aria-hidden="true" />
      )}
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}
        <div
          className={styles.servicesGrid}
          style={
            block.max_columns
              ? ({ '--max-cols': block.max_columns } as React.CSSProperties)
              : undefined
          }
        >
          {block.services.map((service) => {
            const cardContent = (
              <>
                {service.image && (
                  <img
                    src={service.image.url}
                    alt={service.image.alt || service.title}
                    className={styles.serviceImage}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className={styles.serviceBody}>
                  <h3 className={styles.serviceTitle}>{service.title}</h3>
                  <p className={styles.serviceDesc}>{service.description}</p>
                </div>
              </>
            )

            const className = `${styles.serviceCard} ${cardStyleClass} ${textAlignClass}`.trim()

            const cardClassName = `${className} ${fontSizeClass}`.trim()

            return service.url ? (
              <Link
                key={service.title}
                to={service.url}
                className={`${cardClassName} ${styles.serviceCardLink}`}
              >
                {cardContent}
              </Link>
            ) : (
              <article key={service.title} className={cardClassName}>
                {cardContent}
              </article>
            )
          })}
        </div>
        {block.cta_text && block.cta_url && (
          <div className={styles.servicesCta}>
            <Button href={block.cta_url} variant="dark">
              {block.cta_text}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

export default ServicesGridBlock
