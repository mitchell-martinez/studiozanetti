import { useState } from 'react'
import { getSectionStyle } from '../helpers/styleOptions'
import RichText from '../RichText'
import styles from './FaqAccordionBlock.module.scss'
import type { FaqAccordionBlockProps } from './types'

const FaqAccordionBlock = ({ block }: FaqAccordionBlockProps) => {
  const [openIndex, setOpenIndex] = useState(block.open_first_item ? 0 : -1)

  if (!block.faq_items?.length) return null

  return (
    <section className={styles.section} style={getSectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.intro && <p className={styles.intro}>{block.intro}</p>}

        <div className={styles.items}>
          {block.faq_items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <article key={`${item.question}-${index}`} className={styles.item}>
                <button
                  type="button"
                  className={styles.question}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>⌄</span>
                </button>
                {isOpen && (
                  <div className={styles.answer}>
                    <RichText html={item.answer} />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FaqAccordionBlock
