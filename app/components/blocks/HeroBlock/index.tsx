import { useEffect, useMemo, useState } from 'react'
import Button from '~/components/Button'
import styles from './HeroBlock.module.scss'
import type { HeroBlockProps } from './types'

const HeroBlock = ({ block, featuredImage }: HeroBlockProps) => {
  const slides = useMemo(() => {
    const configuredSlides = block.slides ?? []
    if (configuredSlides.length > 0) return configuredSlides
    if (block.background_image?.url) return [block.background_image]
    if (block.use_featured_image && featuredImage?.url) return [featuredImage]
    return []
  }, [block.background_image, block.slides, block.use_featured_image, featuredImage])

  const [activeSlide, setActiveSlide] = useState(0)
  const hasMultipleSlides = slides.length > 1
  const rotateSeconds = Math.max(2, block.auto_rotate_seconds ?? 4)

  useEffect(() => {
    if (!hasMultipleSlides) return

    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, rotateSeconds * 1000)

    return () => window.clearInterval(id)
  }, [hasMultipleSlides, rotateSeconds, slides.length])

  const overlayClass =
    block.overlay_strength === 'light'
      ? styles.overlayLight
      : block.overlay_strength === 'strong'
        ? styles.overlayStrong
        : styles.overlayMedium

  const alignClass = block.content_align === 'left' ? styles.overlayLeft : styles.overlayCenter

  const heightClass =
    block.height === 'full'
      ? styles.heroFull
      : block.height === 'md'
        ? styles.heroMd
        : styles.heroLg

  const currentImage = slides[activeSlide]

  return (
    <section className={`${styles.hero} ${heightClass}`} aria-label="Hero">
      {currentImage && (
        <img
          src={currentImage.url}
          alt={currentImage.alt || block.title}
          className={styles.heroImage}
          fetchPriority="high"
          decoding="sync"
          width={currentImage.width ?? 1600}
          height={currentImage.height ?? 900}
        />
      )}
      <div className={`${styles.heroOverlay} ${overlayClass} ${alignClass}`}>
        <h1 className={styles.heroTitle}>{block.title}</h1>
        {block.tagline && <p className={styles.heroTagline}>{block.tagline}</p>}

        {(block.cta_text && block.cta_url) ||
        (block.secondary_cta_text && block.secondary_cta_url) ? (
          <div className={styles.heroActions}>
            {block.cta_text && block.cta_url && (
              <Button href={block.cta_url} variant="primary" inverted>
                {block.cta_text}
              </Button>
            )}
            {block.secondary_cta_text && block.secondary_cta_url && (
              <Button href={block.secondary_cta_url} variant="secondary" inverted>
                {block.secondary_cta_text}
              </Button>
            )}
          </div>
        ) : null}

        {hasMultipleSlides && (block.show_slide_dots ?? true) && (
          <div className={styles.dots} aria-label="Hero slides">
            {slides.map((slide, index) => (
              <button
                key={`${slide.url}-${index}`}
                type="button"
                className={`${styles.dot} ${index === activeSlide ? styles.dotActive : ''}`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {block.scroll_hint_text && (
          <span className={styles.scrollHint}>{block.scroll_hint_text}</span>
        )}
      </div>
    </section>
  )
}

export default HeroBlock
