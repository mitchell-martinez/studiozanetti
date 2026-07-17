import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { WPMenuItem, WPSiteSettings } from '~/types/wordpress'
import testSiteSettings from '../__mocks__/testSiteSettings.json'
import Footer from '../index'

const DEFAULT_SETTINGS = testSiteSettings as WPSiteSettings

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

  it('renders the four Studio Zanetti social profiles as text links', () => {
    renderFooter()

    const expectedLinks = [
      ['Instagram', 'https://www.instagram.com/studiozanetti'],
      ['LinkedIn', 'https://www.linkedin.com/company/studio-zanetti/'],
      ['TikTok', 'https://www.tiktok.com/@studiozanetti'],
      ['Facebook', 'https://www.facebook.com/studiozanetti'],
    ] as const

    for (const [platform, url] of expectedLinks) {
      expect(
        screen.getByRole('link', {
          name: new RegExp(`Studio Zanetti on ${platform}.*new tab`, 'i'),
        }),
      ).toHaveAttribute('href', url)
    }
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

  it('does not add WordPress identity profiles to the visible footer', () => {
    const custom: WPSiteSettings = {
      ...DEFAULT_SETTINGS,
      social_links: [
        { platform: 'YouTube', url: 'https://youtube.com/example' },
        { platform: 'Instagram', url: 'https://instagram.com/another-profile' },
      ],
    }
    renderFooter([], custom)
    expect(screen.queryByRole('link', { name: /youtube/i })).not.toBeInTheDocument()
    expect(screen.queryByText('@another-profile')).not.toBeInTheDocument()
  })

  it('renders the creator credit with secure portfolio links', () => {
    renderFooter()

    expect(screen.getByText(/looking for help improving your digital presence/i)).toBeInTheDocument()

    const creatorLink = screen.getByRole('link', {
      name: 'Mitchell Martinez (opens in new tab)',
    })
    const contactLink = screen.getByRole('link', {
      name: 'Get in touch with Mitchell today (opens in new tab)',
    })

    expect(creatorLink).toHaveTextContent('Mitchell Martinez')
    expect(contactLink).toHaveTextContent('Get in touch with Mitchell today')
    expect(creatorLink).toHaveAttribute('href', 'https://mitchellmartinez.tech/')
    expect(contactLink).toHaveAttribute('href', 'https://mitchellmartinez.tech/contact')

    for (const link of [creatorLink, contactLink]) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })
})
