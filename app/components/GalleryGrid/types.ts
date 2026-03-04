import type { GalleryImage } from '~/types/gallery'

export interface GalleryGridProps {
  images: GalleryImage[]
}

export interface LazyImageProps {
  src: string
  alt: string
  className: string
}

export interface LightboxProps {
  image: GalleryImage
  onClose: () => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}
