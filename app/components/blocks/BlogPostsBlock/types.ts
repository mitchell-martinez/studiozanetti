import type { BlogPostsBlock as BlogPostsBlockType, BlogPostsData } from '~/types/wordpress'

export interface BlogPostsBlockProps {
  block: BlogPostsBlockType
  blogPostsData: BlogPostsData
}
