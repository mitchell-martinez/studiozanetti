import { memo, useEffect, useRef } from 'react'
import styles from '../GalleryGrid.module.scss'
import type { LightboxProps } from '../types'

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
      <div className={styles.lightbox} onClick={(e) => e.stopPropagation()}>
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

        <img src={image.src} alt={image.alt} className={styles.lightboxImage} />

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

export default Lightbox
