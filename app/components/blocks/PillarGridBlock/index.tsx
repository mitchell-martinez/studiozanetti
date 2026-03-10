import { getSectionStyle } from '../helpers/styleOptions'
import styles from './PillarGridBlock.module.scss'
import type { PillarGridBlockProps } from './types'

const PillarGridBlock = ({ block }: PillarGridBlockProps) => (
  <section className={styles.section} style={getSectionStyle(block, 'champagne')}>
    <div className={styles.inner}>
      {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
      {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}
      <div
        className={`${styles.pillars} ${
          block.columns === 2 ? styles.cols2 : block.columns === 4 ? styles.cols4 : styles.cols3
        }`}
      >
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
