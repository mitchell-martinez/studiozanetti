import type { CSSProperties } from 'react'
import styles from './ImageBlock.module.scss'
import type { ImageBlockProps } from './types'

const clampOpacity = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(1, Math.max(0, value))
}

/**
 * Full-width image block with an optional parallax scroll effect.
 *
 * By default the image renders as a static full-width banner.
 * When `parallax_scroll` is enabled, the image is rendered as a CSS
 * `background-image` with `background-attachment: fixed`, which keeps
 * the image stationary while the section scrolls over it.
 *
 * Gracefully degrades to a static image on devices that prefer reduced
 * motion, and on iOS Safari where `background-attachment: fixed` is
 * not supported.
 */
const ImageBlock = ({ block }: ImageBlockProps) => {
  const isParallax = block.parallax_scroll === true

  const heightClass =
    block.height === 'full'
      ? styles.heightFull
      : block.height === 'md'
        ? styles.heightMd
        : styles.heightLg

  const overlayClass =
    block.overlay_strength === 'light'
      ? styles.overlayLight
      : block.overlay_strength === 'strong'
        ? styles.overlayStrong
        : block.overlay_strength === 'medium'
          ? styles.overlayMedium
          : ''

  const alignClass =
    block.text_align === 'left'
      ? styles.alignLeft
      : block.text_align === 'right'
        ? styles.alignRight
        : styles.alignCenter

  const textMaxWidthClass =
    block.text_max_width === 'narrow'
      ? styles.textNarrow
      : block.text_max_width === 'semi-narrow'
        ? styles.textSemiNarrow
        : block.text_max_width === 'wide'
          ? styles.textWide
          : block.text_max_width === 'full'
            ? styles.textFull
            : styles.textNormal

  const HeadingTag = block.heading_tag ?? 'h2'

  const image = block.image
  const headingOpacity = clampOpacity(block.heading_opacity, 1)
  const imageShadowStrength = clampOpacity(block.image_shadow_strength, 0)

  return (
    <section
      className={`${styles.imageBlock} ${heightClass}`}
      aria-label={block.aria_label || (isParallax ? 'Parallax image' : 'Full-width image banner')}
    >
      {image?.url &&
        (isParallax ? (
          <div
            role="img"
            aria-label={image.alt || ''}
            className={styles.parallaxBg}
            style={{ backgroundImage: `url(${image.url})` }}
          />
        ) : (
          <img
            src={image.url}
            alt={image.alt || ''}
            className={styles.staticImage}
            loading="lazy"
            decoding="async"
            width={image.width ?? 1600}
            height={image.height ?? 900}
          />
        ))}

      {overlayClass && <div className={`${styles.overlay} ${overlayClass}`} />}

      {imageShadowStrength > 0 && (
        <div
          className={styles.imageShadow}
          style={{ '--image-shadow-opacity': imageShadowStrength } as CSSProperties}
          aria-hidden="true"
        />
      )}

      {(block.title || block.subtitle || block.overlay_text) && (
        <div
          className={`${styles.content} ${alignClass} ${textMaxWidthClass}`}
          style={{ '--heading-opacity': headingOpacity } as CSSProperties}
        >
          {block.title && (
            <HeadingTag className={`${styles.title} ${block.title_pop_out ? styles.popOut : ''}`}>
              {block.title}
            </HeadingTag>
          )}
          {block.subtitle && (
            <p className={`${styles.subtitle} ${block.subtitle_pop_out ? styles.popOut : ''}`}>
              {block.subtitle}
            </p>
          )}
          {block.overlay_text && <p className={styles.overlayText}>{block.overlay_text}</p>}
        </div>
      )}
    </section>
  )
}

export default ImageBlock
