import type { WPPost } from '~/types/wordpress'

export interface PostCardProps {
  post: WPPost
  cardStyle?: 'elevated' | 'outline' | 'minimal'
  showExcerpt?: boolean
  showFeaturedImage?: boolean
  showDate?: boolean
  showReadingTime?: boolean
  layout?: 'grid' | 'list'
}
