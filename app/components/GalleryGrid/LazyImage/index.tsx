import { memo, useState } from 'react'
import useIntersectionObserver from '~/hooks/useIntersectionObserver'
import styles from '../GalleryGrid.module.scss'
import type { LazyImageProps } from '../types'

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

export default LazyImage
