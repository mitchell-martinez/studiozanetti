import styles from './PillarGridBlock.module.scss'
import type { PillarGridBlockProps } from './types'

const PillarGridBlock = ({ block }: PillarGridBlockProps) => (
  <section className={styles.section} style={{ background: 'var(--color-light-gray)' }}>
    <div className={styles.inner}>
      {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
      <div className={styles.pillars}>
        {block.pillars.map((pillar) => (
          <article key={pillar.title} className={styles.pillar}>
            <h3 className={styles.pillarTitle}>{pillar.title}</h3>
            <p className={styles.pillarDesc}>{pillar.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
)

export default PillarGridBlock
