import { Link } from 'react-router'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './GalleryCategoriesBlock.module.scss'
import type { GalleryCategoriesBlockProps } from './types'

const GalleryCategoriesBlock = ({ block }: GalleryCategoriesBlockProps) => {
  if (!block.categories?.length) return null

  return (
    <section className={styles.section} style={getSectionStyle(block, 'champagne')}>
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}

        <div className={styles.grid}>
          {block.categories.map((category) => (
            <Link key={category.title} to={category.url} className={styles.tile}>
              {category.image?.url && (
                <img
                  src={category.image.url}
                  alt={category.image.alt || category.title}
                  className={styles.image}
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className={styles.content}>
                <h3 className={styles.title}>{category.title}</h3>
                {category.subtitle && <p className={styles.subtitle}>{category.subtitle}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GalleryCategoriesBlock
