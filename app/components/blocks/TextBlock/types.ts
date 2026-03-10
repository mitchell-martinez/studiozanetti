import type { TextBlock as TextBlockType } from '~/types/wordpress'

export interface TextBlockProps {
  block: TextBlockType
  /** Optional background override — defaults to white */
  dark?: boolean
}
