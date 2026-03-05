import { Link } from 'react-router'
import { getSectionStyle } from '../helpers/styleOptions'
import RichText from '../RichText'
import styles from './PricingPackagesBlock.module.scss'
import type { PricingPackagesBlockProps } from './types'

const PricingPackagesBlock = ({ block }: PricingPackagesBlockProps) => {
  if (!block.packages?.length) return null

  return (
    <section className={styles.section} style={getSectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}

        <div className={styles.grid}>
          {block.packages.map((item) => (
            <article
              key={item.name}
              className={`${styles.card} ${item.is_featured ? styles.featured : ''}`}
            >
              <h3 className={styles.name}>{item.name}</h3>
              {item.price_label && <p className={styles.price}>{item.price_label}</p>}
              {item.description && <p className={styles.description}>{item.description}</p>}
              {item.inclusions && (
                <div className={styles.inclusions}>
                  <RichText html={item.inclusions} />
                </div>
              )}
              {item.cta_text && item.cta_url && (
                <Link to={item.cta_url} className={styles.cta}>
                  {item.cta_text}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingPackagesBlock
