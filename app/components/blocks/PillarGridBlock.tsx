import type { PillarGridBlock as PillarGridBlockType } from '~/types/wordpress'
import styles from './blocks.module.scss'

interface PillarGridBlockProps {
  block: PillarGridBlockType
}

const PillarGridBlock = ({ block }: PillarGridBlockProps) => (
  <section className={styles.blockSection} style={{ background: 'var(--color-light-gray)' }}>
    <div className={styles.blockInner}>
      {block.heading && <h2 className={styles.blockHeading}>{block.heading}</h2>}
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
