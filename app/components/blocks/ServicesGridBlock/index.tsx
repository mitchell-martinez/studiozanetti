import { Link } from 'react-router'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './ServicesGridBlock.module.scss'
import type { ServicesGridBlockProps } from './types'

const ServicesGridBlock = ({ block }: ServicesGridBlockProps) => (
  <section className={styles.section} style={getSectionStyle(block, 'champagne')}>
    <div className={styles.inner}>
      {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
      {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}
      <div
        className={`${styles.servicesGrid} ${
          block.columns === 2 ? styles.cols2 : block.columns === 4 ? styles.cols4 : styles.cols3
        }`}
      >
        {block.services.map((service) => (
          <article
            key={service.title}
            className={`${styles.serviceCard} ${
              block.card_style === 'outline'
                ? styles.cardOutline
                : block.card_style === 'minimal'
                  ? styles.cardMinimal
                  : styles.cardElevated
            }`}
          >
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
          </article>
        ))}
      </div>
      {block.cta_text && block.cta_url && (
        <div className={styles.servicesCta}>
          <Link to={block.cta_url} className={styles.ctaBtn}>
            {block.cta_text}
          </Link>
        </div>
      )}
    </div>
  </section>
)

export default ServicesGridBlock
