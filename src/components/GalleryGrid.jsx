import { useState } from 'react'
import styles from './GalleryGrid.module.css'

function GalleryGrid({ images }) {
  const [lightbox, setLightbox] = useState(null)

  const openLightbox = (image) => setLightbox(image)
  const closeLightbox = () => setLightbox(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowRight') {
      const idx = images.indexOf(lightbox)
      if (idx < images.length - 1) setLightbox(images[idx + 1])
    }
    if (e.key === 'ArrowLeft') {
      const idx = images.indexOf(lightbox)
      if (idx > 0) setLightbox(images[idx - 1])
    }
  }

  return (
    <>
      <div className={styles.grid} role="list">
        {images.map((image, index) => (
          <article
            key={image.id}
            className={styles.item}
            role="listitem"
            onClick={() => openLightbox(image)}
            onKeyDown={(e) => e.key === 'Enter' && openLightbox(image)}
            tabIndex={0}
            aria-label={`View ${image.alt}`}
          >
            <img
              src={image.thumbnail}
              alt={image.alt}
              className={styles.thumbnail}
              loading="lazy"
            />
            <div className={styles.overlay}>
              <span className={styles.overlayText}>{image.alt}</span>
            </div>
          </article>
        ))}
      </div>

      {lightbox && (
        <div
          className={styles.lightboxBackdrop}
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          tabIndex={-1}
        >
          <div className={styles.lightbox} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeLightbox} aria-label="Close lightbox">
              ×
            </button>
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className={styles.lightboxImage}
            />
            <p className={styles.lightboxCaption}>{lightbox.alt}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default GalleryGrid
