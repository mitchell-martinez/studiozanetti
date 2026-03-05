import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { WPMenuItem, WPSiteSettings } from '~/types/wordpress'
import Footer from '../index'

const DEFAULT_SETTINGS: WPSiteSettings = {
  site_name: 'Studio Zanetti',
  tagline: 'Capturing moments, creating memories',
  copyright_text: '',
  social_links: [
    { platform: 'Instagram', url: 'https://instagram.com/studiozanetti' },
    { platform: 'Facebook', url: 'https://facebook.com/studiozanetti' },
  ],
}

const renderFooter = (items: WPMenuItem[] = [], siteSettings: WPSiteSettings = DEFAULT_SETTINGS) =>
  render(
    <MemoryRouter>
      <Footer items={items} siteSettings={siteSettings} />
    </MemoryRouter>,
  )

describe('Footer', () => {
  it('renders the brand name', () => {
    renderFooter()
    expect(screen.getByText('Studio Zanetti')).toBeInTheDocument()
  })

  it('renders fallback navigation links when items is empty', () => {
    renderFooter([])
    const nav = screen.getByRole('navigation', { name: /footer navigation/i })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Gallery/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Contact/i })).toBeInTheDocument()
  })

  it('renders WordPress menu items when provided', () => {
    const customItems: WPMenuItem[] = [
      { id: 10, title: 'Portfolio', url: '/portfolio', children: [] },
      { id: 11, title: 'Bookings', url: '/bookings', children: [] },
    ]
    renderFooter(customItems)
    expect(screen.getByRole('link', { name: /Portfolio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bookings/i })).toBeInTheDocument()
  })

  it('renders social media links with correct aria-labels', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: /instagram.*new tab/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /facebook.*new tab/i })).toBeInTheDocument()
  })

  it('renders the current year in auto-generated copyright', () => {
    renderFooter()
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })

  it('renders custom copyright text when provided', () => {
    const custom: WPSiteSettings = {
      ...DEFAULT_SETTINGS,
      copyright_text: 'Custom copyright line',
    }
    renderFooter([], custom)
    expect(screen.getByText('Custom copyright line')).toBeInTheDocument()
  })

  it('renders custom site name and tagline from site settings', () => {
    const custom: WPSiteSettings = {
      ...DEFAULT_SETTINGS,
      site_name: 'My Brand',
      tagline: 'Best photos ever',
    }
    renderFooter([], custom)
    expect(screen.getByText('My Brand')).toBeInTheDocument()
    expect(screen.getByText('Best photos ever')).toBeInTheDocument()
  })

  it('renders custom social links from site settings', () => {
    const custom: WPSiteSettings = {
      ...DEFAULT_SETTINGS,
      social_links: [
        { platform: 'TikTok', url: 'https://tiktok.com/@studio' },
        { platform: 'YouTube', url: 'https://youtube.com/studio' },
      ],
    }
    renderFooter([], custom)
    expect(screen.getByRole('link', { name: /tiktok.*new tab/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /youtube.*new tab/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /instagram/i })).not.toBeInTheDocument()
  })
})
