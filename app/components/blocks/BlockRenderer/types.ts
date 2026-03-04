import type { ContentBlock } from '~/types/wordpress'

export interface BlockRendererProps {
  blocks: ContentBlock[]
  /** When true, wraps each block in an interactive overlay for the WP editor preview */
  interactive?: boolean
}
