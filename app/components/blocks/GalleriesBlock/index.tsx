import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RichText from '~/components/RichText'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { getSectionStyle } from '../helpers/styleOptions'
import styles from './GalleriesBlock.module.scss'
import { distributeImagesIntoColumns } from './helpers/distributeImagesIntoColumns'
import type { GalleriesBlockProps } from './types'

const toBodyHtml = (value?: string) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(trimmed)
  return hasHtmlTags ? trimmed : `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
}

const GalleriesBlock = ({ block }: GalleriesBlockProps) => {
  const images = useMemo(() => block.images ?? [], [block.images])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const triggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const lastTriggerIndexRef = useRef<number | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const announcerRef = useRef<HTMLSpanElement>(null)
  const isMobile = useMediaQuery('(max-width: 920px)')

  const desktopColumns = Math.max(2, Math.min(4, block.desktop_columns ?? 3))
  const mobileColumns = Math.max(1, Math.min(desktopColumns, block.mobile_columns ?? 2))

  const activeColumnCount = isMobile ? mobileColumns : desktopColumns
  const distribution = useMemo(
    () => distributeImagesIntoColumns(images, activeColumnCount),
    [images, activeColumnCount],
  )

  const prevActiveRef = useRef<number | null>(null)

  const announce = useCallback((message: string) => {
    if (announcerRef.current) announcerRef.current.textContent = message
  }, [])

  useEffect(() => {
    if (activeIndex === null) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const img = images[activeIndex]
    const caption = img?.caption || img?.image.alt || `Gallery image ${activeIndex + 1}`

    if (prevActiveRef.current === null) {
      requestAnimationFrame(() => closeRef.current?.focus())
      announce(`Lightbox opened, image ${activeIndex + 1} of ${images.length}: ${caption}`)
    } else {
      announce(`Image ${activeIndex + 1} of ${images.length}: ${caption}`)
    }
    prevActiveRef.current = activeIndex

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
        return
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null ? prev : Math.min(images.length - 1, prev + 1)))
        return
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev === null ? prev : Math.max(0, prev - 1)))
        return
      }

      // Focus trap: cycle Tab through modal buttons
      if (event.key === 'Tab') {
        const modal = modalRef.current
        if (!modal) return
        const focusable = modal.querySelectorAll<HTMLElement>('button')
        if (!focusable.length) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, images, announce])

  useEffect(() => {
    if (activeIndex !== null) return

    if (prevActiveRef.current !== null) {
      announce('Lightbox closed')
      prevActiveRef.current = null
    }

    if (lastTriggerIndexRef.current !== null) {
      triggerRefs.current.get(lastTriggerIndexRef.current)?.focus()
      lastTriggerIndexRef.current = null
    }
  }, [activeIndex, announce])

  const touchStartX = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 50

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      touchStartX.current = null

      if (Math.abs(dx) < SWIPE_THRESHOLD) return
      if (dx < 0) {
        setActiveIndex((prev) => (prev === null ? prev : Math.min(images.length - 1, prev + 1)))
      } else {
        setActiveIndex((prev) => (prev === null ? prev : Math.max(0, prev - 1)))
      }
    },
    [images.length],
  )

  if (!images.length) return null

  const currentImage = activeIndex !== null ? images[activeIndex] : null
  const descriptionHtml = toBodyHtml(block.description)
  const sectionStyle = getSectionStyle(
    {
      ...block,
      top_spacing: 'sm',
      bottom_spacing: 'sm',
    },
    'light',
  )

  return (
    <section className={styles.section} style={sectionStyle}>
      {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
      {descriptionHtml && (
        <div className={styles.description}>
          <RichText html={descriptionHtml} fontSize="sm" />
        </div>
      )}

      <div
        className={styles.masonry}
        style={{ '--column-count': activeColumnCount } as CSSProperties}
        role="list"
        aria-label="Gallery images"
      >
        {distribution.map((column, columnIndex) => (
          <div key={`desktop-column-${columnIndex}`} className={styles.column}>
            {column.map(({ item, sourceIndex }) => {
              return (
                <article key={item.image.url} className={styles.listItem} role="listitem">
                  <button
                    className={styles.imageButton}
                    type="button"
                    style={{ '--item-index': sourceIndex } as CSSProperties}
                    onClick={() => {
                      lastTriggerIndexRef.current = sourceIndex
                      setActiveIndex(sourceIndex)
                    }}
                    ref={(element) => {
                      if (element) triggerRefs.current.set(sourceIndex, element)
                      else triggerRefs.current.delete(sourceIndex)
                    }}
                    aria-label={`Open image ${sourceIndex + 1} of ${images.length}: ${item.image.alt || item.caption || 'Untitled'}`}
                  >
                    <img
                      className={styles.image}
                      src={item.image.url}
                      alt={item.image.alt || item.caption || `Gallery image ${sourceIndex + 1}`}
                      loading="lazy"
                      decoding="async"
                      width={item.image.width}
                      height={item.image.height}
                    />
                  </button>
                </article>
              )
            })}
          </div>
        ))}
      </div>

      {currentImage && activeIndex !== null && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image preview"
          aria-describedby="lightbox-instructions"
          onClick={() => setActiveIndex(null)}
        >
          <span id="lightbox-instructions" className={styles.srOnly}>
            Use arrow keys or swipe to navigate between images. Press Escape to close.
          </span>
          <div
            ref={modalRef}
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              ref={closeRef}
              className={styles.closeBtn}
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Close preview"
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
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>

            {activeIndex > 0 && (
              <button
                className={`${styles.navBtn} ${styles.prevBtn}`}
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev === null ? prev : Math.max(0, prev - 1)))
                }
                aria-label="Previous image"
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
              className={styles.modalImage}
              src={currentImage.image.url}
              alt={currentImage.image.alt || currentImage.caption || `Gallery image ${activeIndex + 1}`}
              aria-labelledby="gallery-modal-caption"
            />

            {activeIndex < images.length - 1 && (
              <button
                className={`${styles.navBtn} ${styles.nextBtn}`}
                type="button"
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev === null ? prev : Math.min(images.length - 1, prev + 1),
                  )
                }
                aria-label="Next image"
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

            <p id="gallery-modal-caption" className={styles.modalCaption} aria-live="polite">
              {currentImage.caption || currentImage.image.alt}
            </p>
          </div>
        </div>
      )}

      <span ref={announcerRef} className={styles.srOnly} aria-live="assertive" aria-atomic="true" />
    </section>
  )
}

export default GalleriesBlock
