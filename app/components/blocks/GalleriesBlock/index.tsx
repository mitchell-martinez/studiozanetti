import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '~/components/Button'
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
  const isMobile = useMediaQuery('(max-width: 920px)')

  const desktopColumns = Math.max(2, Math.min(4, block.desktop_columns ?? 3))
  const mobileColumns = Math.max(1, Math.min(desktopColumns, block.mobile_columns ?? 2))

  const activeColumnCount = isMobile ? mobileColumns : desktopColumns
  const distribution = useMemo(
    () => distributeImagesIntoColumns(images, activeColumnCount),
    [images, activeColumnCount],
  )

  useEffect(() => {
    if (activeIndex === null) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
        return
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null ? prev : Math.min(images.length - 1, prev + 1)))
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev === null ? prev : Math.max(0, prev - 1)))
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, images.length])

  useEffect(() => {
    if (activeIndex !== null) return

    if (lastTriggerIndexRef.current !== null) {
      triggerRefs.current.get(lastTriggerIndexRef.current)?.focus()
      lastTriggerIndexRef.current = null
    }
  }, [activeIndex])

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
                    aria-label={`Open image ${sourceIndex + 1} of ${images.length}`}
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
          onClick={() => setActiveIndex(null)}
        >
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <img
              className={styles.modalImage}
              src={currentImage.image.url}
              alt={
                currentImage.image.alt || currentImage.caption || `Gallery image ${activeIndex + 1}`
              }
            />

            <p className={styles.modalCaption}>{currentImage.caption || currentImage.image.alt}</p>

            <div className={styles.modalActions}>
              {activeIndex > 0 && (
                <Button
                  variant="outline"
                  inverted
                  size="sm"
                  onClick={() =>
                    setActiveIndex((prev) => (prev === null ? prev : Math.max(0, prev - 1)))
                  }
                  ariaLabel="Previous image"
                >
                  Prev
                </Button>
              )}
              {activeIndex < images.length - 1 && (
                <Button
                  variant="outline"
                  inverted
                  size="sm"
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === null ? prev : Math.min(images.length - 1, prev + 1),
                    )
                  }
                  ariaLabel="Next image"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default GalleriesBlock
