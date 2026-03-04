import type { WPMenuItem } from '~/types/wordpress'

export interface FooterProps {
  /** Navigation menu items from WordPress (same source as Navbar). */
  items: WPMenuItem[]
}
