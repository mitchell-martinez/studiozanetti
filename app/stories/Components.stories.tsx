import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import Footer from '~/components/Footer'
import demoSiteSettings from '~/components/Footer/__mocks__/demoSiteSettings.json'
import GalleryGrid from '~/components/GalleryGrid'
import demoGalleryImages from '~/components/GalleryGrid/__mocks__/demoGalleryImages.json'
import Navbar from '~/components/Navbar'
import demoMenu from '~/components/Navbar/__mocks__/demoMenu.json'
import OfflineBanner from '~/components/OfflineBanner'
import type { GalleryImage } from '~/types/gallery'
import type { WPMenuItem, WPSiteSettings } from '~/types/wordpress'

/* ── Navbar ─────────────────────────────────────────────────────────────────── */

type NavbarArgs = { items: WPMenuItem[]; siteName?: string }

const navMeta: Meta<NavbarArgs> = {
  title: 'Components/Navbar',
  tags: ['autodocs'],
  args: {
    items: demoMenu,
    siteName: demoSiteSettings.site_name,
  },
  argTypes: {
    items: { control: 'object', description: 'Navigation menu items (WPMenuItem[])' },
    siteName: { control: 'text', description: 'Brand name shown in the header' },
  },
  render: (args) => <Navbar items={args.items} siteName={args.siteName} />,
}

export default navMeta
type NavStory = StoryObj<typeof navMeta>

/** Default navbar with full menu. */
export const Navigation: NavStory = {}

/** Navbar with no menu items — shows empty state. */
export const EmptyMenu: NavStory = {
  args: { items: [] },
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */

type FooterArgs = { items: WPMenuItem[]; siteSettings: WPSiteSettings }

const wrappingFooterMenu: WPMenuItem[] = [
  { id: 101, title: 'Home', url: '/', children: [] },
  { id: 102, title: 'About', url: '/about', children: [] },
  { id: 103, title: 'Wedding Galleries', url: '/galleries/weddings', children: [] },
  { id: 104, title: 'Client Reviews', url: '/reviews', children: [] },
  { id: 105, title: 'Photography Prices', url: '/prices', children: [] },
  { id: 106, title: 'Services', url: '/services', children: [] },
  { id: 107, title: 'Contact', url: '/contact', children: [] },
]

export const FooterDefault: StoryObj<FooterArgs> = {
  args: {
    items: demoMenu,
    siteSettings: demoSiteSettings,
  },
  argTypes: {
    items: { control: 'object', description: 'Footer navigation items (WPMenuItem[])' },
    siteSettings: {
      control: 'object',
      description: 'Site settings (name, tagline, copyright)',
    },
  },
  render: (args) => <Footer items={args.items} siteSettings={args.siteSettings} />,
}

/** Footer with enough varied menu labels to exercise responsive link wrapping. */
export const FooterWrappingNavigation: StoryObj<FooterArgs> = {
  ...FooterDefault,
  args: {
    items: wrappingFooterMenu,
    siteSettings: demoSiteSettings,
  },
}

/* ── Gallery Grid ───────────────────────────────────────────────────────────── */

type GalleryArgs = { images: GalleryImage[] }

export const GalleryGridWithLightbox: StoryObj<GalleryArgs> = {
  args: {
    images: demoGalleryImages as GalleryImage[],
  },
  argTypes: {
    images: {
      control: 'object',
      description: 'Gallery images array with src, thumbnail, alt, category',
    },
  },
  render: (args) => <GalleryGrid images={args.images} />,
}

/* ── Offline Banner ─────────────────────────────────────────────────────────── */

const OfflinePreview = () => {
  useEffect(() => {
    window.dispatchEvent(new Event('offline'))
    return () => {
      window.dispatchEvent(new Event('online'))
    }
  }, [])

  return <OfflineBanner />
}

export const OfflineBannerVisible: StoryObj = {
  render: () => <OfflinePreview />,
}
