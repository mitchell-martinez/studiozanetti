import { memo, useCallback, useRef, useState } from 'react'
import styles from './GalleryGrid.module.scss'
import LazyImage from './LazyImage'
import Lightbox from './Lightbox'
import type { GalleryGridProps } from './types'

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
            <LazyImage src={image.thumbnail} alt={image.alt} className={styles.thumbnail} />
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
