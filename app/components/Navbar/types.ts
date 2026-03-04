import type { WPMenuItem } from '~/types/wordpress'

export interface NavbarProps {
  /** Navigation menu items from WordPress. Falls back to defaults when empty. */
  items: WPMenuItem[]
}
