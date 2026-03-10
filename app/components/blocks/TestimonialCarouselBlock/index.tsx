import { useEffect, useMemo, useState } from 'react'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './TestimonialCarouselBlock.module.scss'
import type { TestimonialCarouselBlockProps } from './types'

const TestimonialCarouselBlock = ({ block }: TestimonialCarouselBlockProps) => {
  const testimonials = useMemo(() => block.testimonials ?? [], [block.testimonials])
  const hasTestimonials = testimonials.length > 0

  const [activeIndex, setActiveIndex] = useState(0)
  const rotateSeconds = Math.max(3, block.auto_rotate_seconds ?? 6)

  useEffect(() => {
    if (testimonials.length < 2) return

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, rotateSeconds * 1000)

    return () => window.clearInterval(id)
  }, [rotateSeconds, testimonials.length])

  if (!hasTestimonials) {
    return null
  }

  const active = testimonials[activeIndex]

  return (
    <section className={styles.section} style={getSectionStyle(block, 'rose')}>
      <div className={styles.inner}>
        {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
        {block.subheading && <p className={styles.subheading}>{block.subheading}</p>}

        <article className={styles.card}>
          <blockquote className={styles.quote}>“{active.quote}”</blockquote>
          <p className={styles.name}>{active.name}</p>
          {active.context && <p className={styles.context}>{active.context}</p>}
        </article>

        {testimonials.length > 1 && (
          <div className={styles.dots} aria-label="Testimonial selector">
            {testimonials.map((item, index) => (
              <button
                key={`${item.name}-${index}`}
                type="button"
                className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default TestimonialCarouselBlock
