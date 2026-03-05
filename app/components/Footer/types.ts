import type { WPMenuItem, WPSiteSettings } from '~/types/wordpress'

export interface FooterProps {
  /** Navigation menu items from WordPress (same source as Navbar). */
  items: WPMenuItem[]
  /** Global site settings from ACF Options Page. */
  siteSettings: WPSiteSettings
}
