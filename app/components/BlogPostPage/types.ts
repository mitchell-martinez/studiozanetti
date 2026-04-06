import type { WPPost } from '~/types/wordpress'

export interface BlogPostPageProps {
  post: WPPost
  relatedPosts: WPPost[]
  canonicalUrl: string
}
