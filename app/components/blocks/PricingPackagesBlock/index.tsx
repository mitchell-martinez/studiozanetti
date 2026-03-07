import { Link } from 'react-router'
import { getSectionStyle } from '../helpers/styleOptions'
import RichText from '../RichText'
import styles from './PricingPackagesBlock.module.scss'
import type { PricingPackagesBlockProps } from './types'

const HORIZONTAL_THRESHOLD = 5

const PricingPackagesBlock = ({ block }: PricingPackagesBlockProps) => {
  if (!block.packages?.length) return null

  const isTable = block.packages.length >= HORIZONTAL_THRESHOLD

  return (
    <section className={styles.section} style={getSectionStyle(block)}>
      <div className={isTable ? styles.innerWide : styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}

        {isTable ? (
          <div className={styles.tableWrap}>
            <table className={styles.table} role="table">
              <thead>
                <tr>
                  {block.packages.map((item) => (
                    <th
                      key={item.name}
                      className={`${styles.th} ${item.is_featured ? styles.thFeatured : ''}`}
                      scope="col"
                    >
                      {item.is_featured && <span className={styles.badge}>Most Popular</span>}
                      <span className={styles.thName}>{item.name}</span>
                      {item.price_label && (
                        <span className={styles.thPrice}>{item.price_label}</span>
                      )}
                      {item.description && (
                        <span className={styles.thDesc}>{item.description}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {block.packages.map((item) => (
                    <td
                      key={`pricing-${item.name}`}
                      className={`${styles.td} ${item.is_featured ? styles.tdFeatured : ''}`}
                    >
                      {item.pricing ? (
                        <RichText html={item.pricing} />
                      ) : (
                        <span className={styles.empty}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  {block.packages.map((item) => (
                    <td
                      key={`inclusions-${item.name}`}
                      className={`${styles.td} ${item.is_featured ? styles.tdFeatured : ''}`}
                    >
                      {item.inclusions ? (
                        <RichText html={item.inclusions} />
                      ) : (
                        <span className={styles.empty}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
                {block.packages.some((p) => p.tagline) && (
                  <tr>
                    {block.packages.map((item) => (
                      <td
                        key={`tagline-${item.name}`}
                        className={`${styles.td} ${styles.tdTagline} ${item.is_featured ? styles.tdFeatured : ''}`}
                      >
                        {item.tagline && <em>{item.tagline}</em>}
                      </td>
                    ))}
                  </tr>
                )}
                <tr>
                  {block.packages.map((item) => (
                    <td
                      key={`cta-${item.name}`}
                      className={`${styles.td} ${styles.tdCta} ${item.is_featured ? styles.tdFeatured : ''}`}
                    >
                      {item.cta_text && item.cta_url && (
                        <Link to={item.cta_url} className={styles.ctaStrong}>
                          {item.cta_text}
                        </Link>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.grid}>
            {block.packages.map((item) => (
              <article
                key={item.name}
                className={`${styles.card} ${item.is_featured ? styles.featured : ''}`}
              >
                {item.is_featured && <span className={styles.badge}>Most Popular</span>}
                <h3 className={styles.name}>{item.name}</h3>
                {item.price_label && <p className={styles.price}>{item.price_label}</p>}
                {item.description && <p className={styles.description}>{item.description}</p>}
                {item.pricing && (
                  <div className={styles.inclusions}>
                    <RichText html={item.pricing} />
                  </div>
                )}
                {item.inclusions && (
                  <div className={styles.inclusions}>
                    <RichText html={item.inclusions} />
                  </div>
                )}
                {item.tagline && <p className={styles.tagline}>{item.tagline}</p>}
                {item.cta_text && item.cta_url && (
                  <Link to={item.cta_url} className={styles.cta}>
                    {item.cta_text}
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PricingPackagesBlock
