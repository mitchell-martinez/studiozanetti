import type { BlogPostsData, ContentBlock, WPImage } from '~/types/wordpress'

export interface BlockRendererProps {
  blocks: ContentBlock[]
  /** When true, wraps each block in an interactive overlay for the WP editor preview */
  interactive?: boolean
  /** Optional page featured image for hero fallback/slider use */
  featuredImage?: WPImage
  /** Pre-fetched blog posts data, threaded to BlogPostsBlock */
  blogPostsData?: BlogPostsData
  /** Show the enquiry offer near the top of a service page, even without a form. */
  showEnquiryOffer?: boolean
}
