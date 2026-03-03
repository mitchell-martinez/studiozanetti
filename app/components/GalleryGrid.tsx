import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { GalleryImage } from '~/types/gallery'
import useIntersectionObserver from '~/hooks/useIntersectionObserver'
import styles from './GalleryGrid.module.scss'

// ─── Lazy image with skeleton ─────────────────────────────────────────────────
interface LazyImageProps {
  src: string
  alt: string
  className: string
}

const LazyImage = memo(({ src, alt, className }: LazyImageProps) => {
  const [imgRef, isVisible] = useIntersectionObserver<HTMLDivElement>({ rootMargin: '200px' })
  const [loaded, setLoaded] = useState(false)

  return (
    <div ref={imgRef} className={styles.imageWrapper}>
      {!loaded && <div className={styles.skeleton} aria-hidden="true" />}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loaded ? styles.imgLoaded : styles.imgHidden}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  )
})
LazyImage.displayName = 'LazyImage'

// ─── Lightbox ─────────────────────────────────────────────────────────────────
interface LightboxProps {
  image: GalleryImage
  onClose: () => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

const Lightbox = memo(({ image, onClose, onPrev, onNext }: LightboxProps) => {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Trap focus and handle keyboard
  useEffect(() => {
    closeRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && onNext) onNext()
      if (e.key === 'ArrowLeft' && onPrev) onPrev()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext])

  return (
    // Backdrop closes on click
    <div
      className={styles.lightboxBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Inner panel stops propagation */}
      <div
        className={styles.lightbox}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close lightbox"
          type="button"
        >
          {/* SVG × icon */}
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        {onPrev && (
          <button
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={onPrev}
            aria-label="Previous image"
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <img
          src={image.src}
          alt={image.alt}
          className={styles.lightboxImage}
        />

        {onNext && (
          <button
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={onNext}
            aria-label="Next image"
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <p className={styles.lightboxCaption}>{image.alt}</p>
      </div>
    </div>
  )
})
Lightbox.displayName = 'Lightbox'

// ─── Gallery Grid ─────────────────────────────────────────────────────────────
interface GalleryGridProps {
  images: GalleryImage[]
}

const GalleryGrid = memo(({ images }: GalleryGridProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  // Ref to the item that opened the lightbox, so we can restore focus on close
  const triggerRefs = useRef<Map<number, HTMLElement>>(new Map())

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), [])

  const closeLightbox = useCallback(() => {
    const prevIndex = lightboxIndex
    setLightboxIndex(null)
    // Restore focus to the item that opened the lightbox
    if (prevIndex !== null) {
      requestAnimationFrame(() => {
        triggerRefs.current.get(prevIndex)?.focus()
      })
    }
  }, [lightboxIndex])

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i))
  }, [images.length])

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <>
      <div className={styles.grid} role="list" aria-label="Photo gallery">
        {images.map((image, index) => (
          <article
            key={image.id}
            className={styles.item}
            role="listitem"
            ref={(el) => {
              if (el) triggerRefs.current.set(index, el)
              else triggerRefs.current.delete(index)
            }}
            onClick={() => openLightbox(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openLightbox(index)
              }
            }}
            tabIndex={0}
            aria-label={`Open ${image.alt} in lightbox`}
          >
            <LazyImage
              src={image.thumbnail}
              alt={image.alt}
              className={styles.thumbnail}
            />
            <div className={styles.overlay} aria-hidden="true">
              <span className={styles.overlayText}>{image.alt}</span>
            </div>
          </article>
        ))}
      </div>

      {currentImage && (
        <Lightbox
          image={currentImage}
          onClose={closeLightbox}
          onPrev={lightboxIndex !== null && lightboxIndex > 0 ? goPrev : null}
          onNext={lightboxIndex !== null && lightboxIndex < images.length - 1 ? goNext : null}
        />
      )}
    </>
  )
})
GalleryGrid.displayName = 'GalleryGrid'

export default GalleryGrid
