import type { WPMenuItem } from '~/types/wordpress'

export interface NavbarProps {
  /** Navigation menu items from WordPress. Falls back to defaults when empty. */
  items: WPMenuItem[]
  /** Brand name from Site Settings. Falls back to 'Studio Zanetti'. */
  siteName?: string
}
