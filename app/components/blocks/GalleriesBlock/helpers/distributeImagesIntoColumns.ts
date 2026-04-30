import type { WPGalleriesImageItem } from '~/types/wordpress'

export interface DistributedGalleryItem {
  item: WPGalleriesImageItem
  sourceIndex: number
}

/**
 * Fallback relative height (height / width) used when an image is missing
 * intrinsic dimensions. Roughly matches a 4:3 landscape photo so the layout
 * stays visually balanced when metadata is incomplete.
 */
const FALLBACK_RELATIVE_HEIGHT = 0.75

const getRelativeHeight = (item: WPGalleriesImageItem): number => {
  const { width, height } = item.image
  if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
    return height / width
  }
  return FALLBACK_RELATIVE_HEIGHT
}

/**
 * Distribute images across masonry columns using greedy bin-packing by
 * relative height (height / width). Each image is placed into the column
 * whose current accumulated height is smallest, with ties resolved toward
 * the left-most column to preserve a natural reading order.
 *
 * This produces visually balanced columns so no single column extends well
 * past the others, while remaining deterministic for SSR.
 */
export function distributeImagesIntoColumns(images: WPGalleriesImageItem[], columns: number) {
  const safeColumnCount = Math.max(1, columns)
  const distributed = Array.from({ length: safeColumnCount }, () => [] as DistributedGalleryItem[])
  const columnHeights = new Array<number>(safeColumnCount).fill(0)

  images.forEach((item, index) => {
    let targetColumn = 0
    for (let i = 1; i < safeColumnCount; i += 1) {
      if (columnHeights[i] < columnHeights[targetColumn]) {
        targetColumn = i
      }
    }
    distributed[targetColumn].push({ item, sourceIndex: index })
    columnHeights[targetColumn] += getRelativeHeight(item)
  })

  return distributed
}
