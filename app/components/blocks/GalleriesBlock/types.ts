import type {
  GalleriesBlock as GalleriesBlockType,
  GalleryReferenceBlock,
} from '~/types/wordpress'

export interface GalleriesBlockProps {
  block: GalleriesBlockType | GalleryReferenceBlock
}
