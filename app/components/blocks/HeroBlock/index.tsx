import { useEffect, useMemo, useState } from 'react'
import Button from '~/components/Button'
import type { HeroSlide } from '~/types/wordpress'
import styles from './HeroBlock.module.scss'
import type { HeroBlockProps } from './types'

const HeroBlock = ({ block, featuredImage }: HeroBlockProps) => {
  const slides = useMemo<HeroSlide[]>(() => {
    const configuredSlides = block.slides ?? []
    if (configuredSlides.length > 0) return configuredSlides
    if (block.background_image?.url) return [block.background_image]
    if (block.use_featured_image && featuredImage?.url) return [featuredImage]
    return []
  }, [block.background_image, block.slides, block.use_featured_image, featuredImage])

  const [activeSlide, setActiveSlide] = useState(0)
  const hasMultipleSlides = slides.length > 1
  const rotateSeconds = Math.max(2, block.auto_rotate_seconds ?? 4)
  const slideCount = slides.length

  useEffect(() => {
    if (!hasMultipleSlides) return

    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideCount)
    }, rotateSeconds * 1000)

    return () => window.clearInterval(id)
  }, [hasMultipleSlides, rotateSeconds, slideCount])

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
      {/* Render all slides; only the active one is visible via CSS opacity.
          This prevents flicker caused by the browser loading a new src. */}
      {slides.map((slide, index) => (
        <img
          key={slide.url}
          src={slide.url}
          alt={index === activeSlide ? slide.alt || block.title : ''}
          className={`${styles.heroImage} ${index === activeSlide ? styles.heroImageActive : ''}`}
          fetchPriority={index === 0 ? 'high' : 'low'}
          decoding={index === 0 ? 'sync' : 'async'}
          // All slides use eager loading — lazy+opacity:0 causes Safari to
          // never load non-active slides since it thinks they're offscreen.
          loading="eager"
          width={slide.width ?? 1600}
          height={slide.height ?? 900}
        />
      ))}
      <div className={`${styles.heroOverlay} ${overlayClass} ${alignClass}`}>
        <h1 className={styles.heroTitle}>{block.title}</h1>
        {block.tagline && <p className={styles.heroTagline}>{block.tagline}</p>}

        {(block.cta_text && block.cta_url) ||
        (block.secondary_cta_text && block.secondary_cta_url) ? (
          <div className={styles.heroActions}>
            {block.cta_text && block.cta_url && (
              <Button href={block.cta_url} variant="primary" inverted className={styles.heroCta}>
                {block.cta_text}
              </Button>
            )}
            {block.secondary_cta_text && block.secondary_cta_url && (
              <Button
                href={block.secondary_cta_url}
                variant="secondary"
                inverted
                className={styles.heroCta}
              >
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

        {(currentImage?.tagline || currentImage?.subtitle) && (
          <div className={styles.slideCredit}>
            {currentImage.tagline && <p className={styles.slideTagline}>{currentImage.tagline}</p>}
            {currentImage.subtitle && (
              <p className={styles.slideSubtitle}>{currentImage.subtitle}</p>
            )}
          </div>
        )}

        {(block.description || block.caption) && (
          <div className={styles.heroFooter}>
            {block.description && <p className={styles.heroDescription}>{block.description}</p>}
            {block.caption && <p className={styles.heroCaption}>{block.caption}</p>}
          </div>
        )}
      </div>
    </section>
  )
}

export default HeroBlock
