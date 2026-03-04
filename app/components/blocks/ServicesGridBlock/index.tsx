import { Link } from 'react-router'
import styles from './ServicesGridBlock.module.scss'
import type { ServicesGridBlockProps } from './types'

const ServicesGridBlock = ({ block }: ServicesGridBlockProps) => (
  <section className={styles.section} style={{ background: 'var(--color-light-gray)' }}>
    <div className={styles.inner}>
      {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
      <div className={styles.servicesGrid}>
        {block.services.map((service) => (
          <article key={service.title} className={styles.serviceCard}>
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
