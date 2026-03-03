export type GalleryCategory = 'All' | 'Weddings' | 'Portraits' | 'Events'

export interface GalleryImage {
  id: number
  category: Exclude<GalleryCategory, 'All'>
  alt: string
  thumbnail: string
  src: string
}
