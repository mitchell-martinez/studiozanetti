import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import Footer from '~/components/Footer'
import GalleryGrid from '~/components/GalleryGrid'
import Navbar from '~/components/Navbar'
import OfflineBanner from '~/components/OfflineBanner'
import { demoGalleryImages, demoMenu, demoSiteSettings } from '~/dev/localLabData'
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

export const FooterDefault: StoryObj<FooterArgs> = {
  args: {
    items: demoMenu,
    siteSettings: demoSiteSettings,
  },
  argTypes: {
    items: { control: 'object', description: 'Footer navigation items (WPMenuItem[])' },
    siteSettings: {
      control: 'object',
      description: 'Site settings (name, tagline, socials, copyright)',
    },
  },
  render: (args) => <Footer items={args.items} siteSettings={args.siteSettings} />,
}

/* ── Gallery Grid ───────────────────────────────────────────────────────────── */

type GalleryArgs = { images: GalleryImage[] }

export const GalleryGridWithLightbox: StoryObj<GalleryArgs> = {
  args: {
    images: demoGalleryImages,
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
