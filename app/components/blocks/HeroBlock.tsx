import { Link } from 'react-router'
import type { HeroBlock as HeroBlockType } from '~/types/wordpress'
import styles from './blocks.module.scss'

interface HeroBlockProps {
  block: HeroBlockType
}

const HeroBlock = ({ block }: HeroBlockProps) => (
  <section className={styles.hero} aria-label="Hero">
    <img
      src={block.background_image.url}
      alt={block.background_image.alt || ''}
      className={styles.heroImage}
      fetchPriority="high"
      decoding="sync"
      width={block.background_image.width ?? 1600}
      height={block.background_image.height ?? 900}
    />
    <div className={styles.heroOverlay}>
      <h1 className={styles.heroTitle}>{block.title}</h1>
      {block.tagline && <p className={styles.heroTagline}>{block.tagline}</p>}
      {block.cta_text && block.cta_url && (
        <Link to={block.cta_url} className={styles.heroBtn}>
          {block.cta_text}
        </Link>
      )}
    </div>
  </section>
)

export default HeroBlock
