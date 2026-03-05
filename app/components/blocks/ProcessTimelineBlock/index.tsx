import { getSectionStyle } from '../helpers/styleOptions'
import styles from './ProcessTimelineBlock.module.scss'
import type { ProcessTimelineBlockProps } from './types'

const ProcessTimelineBlock = ({ block }: ProcessTimelineBlockProps) => {
  if (!block.steps?.length) return null

  return (
    <section className={styles.section} style={getSectionStyle(block, 'rose')}>
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.intro && <p className={styles.intro}>{block.intro}</p>}

        <ol className={styles.timeline}>
          {block.steps.map((step, index) => (
            <li key={`${step.title}-${index}`} className={styles.step}>
              <span className={styles.badge}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.content}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default ProcessTimelineBlock
