import styles from './ImageBlock.module.scss'
import type { ImageBlockProps } from './types'

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

  const image = block.image

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

      {(block.title || block.subtitle || block.overlay_text) && (
        <div className={`${styles.content} ${alignClass}`}>
          {block.title && <h2 className={styles.title}>{block.title}</h2>}
          {block.subtitle && <p className={styles.subtitle}>{block.subtitle}</p>}
          {block.overlay_text && <p className={styles.overlayText}>{block.overlay_text}</p>}
        </div>
      )}
    </section>
  )
}

export default ImageBlock
