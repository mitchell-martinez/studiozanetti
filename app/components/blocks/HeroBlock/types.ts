import type { HeroBlock as HeroBlockType, WPImage } from '~/types/wordpress'

export interface HeroBlockProps {
  block: HeroBlockType
  featuredImage?: WPImage
}
