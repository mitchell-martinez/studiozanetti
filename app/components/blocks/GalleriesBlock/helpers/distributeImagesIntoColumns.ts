import type { WPGalleriesImageItem } from '~/types/wordpress'

export interface DistributedGalleryItem {
  item: WPGalleriesImageItem
  sourceIndex: number
}

/**
 * Keep a stable image order while distributing items for masonry columns.
 * Column assignment uses modulo so the same image lands in the same column
 * unless the column count changes (desktop 3 -> mobile 2).
 */
export function distributeImagesIntoColumns(images: WPGalleriesImageItem[], columns: number) {
  const safeColumnCount = Math.max(1, columns)
  const distributed = Array.from({ length: safeColumnCount }, () => [] as DistributedGalleryItem[])

  images.forEach((item, index) => {
    distributed[index % safeColumnCount].push({ item, sourceIndex: index })
  })

  return distributed
}
