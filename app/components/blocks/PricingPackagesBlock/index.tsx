import { useState } from 'react'
import { Link } from 'react-router'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { getSectionStyle } from '../helpers/styleOptions'
import RichText from '~/components/RichText'
import styles from './PricingPackagesBlock.module.scss'
import type { PricingPackagesBlockProps } from './types'

const PricingPackagesBlock = ({ block }: PricingPackagesBlockProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [openIndex, setOpenIndex] = useState(0)

  if (!block.packages?.length) return null

  return (
    <section className={styles.section} style={getSectionStyle(block)}>
      <div className={styles.innerWide}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}

        {!isMobile && (
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
        )}

        {isMobile && (
          <div className={styles.accordion}>
            {block.packages.map((item, i) => {
              const isOpen = openIndex === i
              return (
                <div
                  key={item.name}
                  className={`${styles.panel} ${item.is_featured ? styles.panelFeatured : ''} ${isOpen ? styles.panelOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.panelHeader}
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  >
                    {item.is_featured && <span className={styles.badge}>Most Popular</span>}
                    <span className={styles.panelTitle}>
                      <span className={styles.panelName}>{item.name}</span>
                      {item.price_label && (
                        <span className={styles.panelPrice}>{item.price_label}</span>
                      )}
                      {item.description && (
                        <span className={styles.panelDesc}>{item.description}</span>
                      )}
                    </span>
                    <span className={styles.chevron} aria-hidden="true" />
                  </button>

                  <div className={styles.panelBodyWrap}>
                    <div className={styles.panelBody}>
                      {item.pricing && (
                        <div className={styles.panelContent}>
                          <RichText html={item.pricing} />
                        </div>
                      )}
                      {item.inclusions && (
                        <div className={styles.panelContent}>
                          <RichText html={item.inclusions} />
                        </div>
                      )}
                      {item.tagline && (
                        <p className={styles.panelTagline}>
                          <em>{item.tagline}</em>
                        </p>
                      )}
                      {item.cta_text && item.cta_url && (
                        <div className={styles.panelCta}>
                          <Link to={item.cta_url} className={styles.ctaStrong}>
                            {item.cta_text}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}

export default PricingPackagesBlock
