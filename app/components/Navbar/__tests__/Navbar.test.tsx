import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { WPMenuItem } from '~/types/wordpress'
import testMenuItems from '../__mocks__/testMenuItems.json'
import Navbar from '../index'

const MOCK_ITEMS = testMenuItems as WPMenuItem[]

const renderNavbar = (
  items: WPMenuItem[] = [],
  siteName?: string,
  initialEntries: string[] = ['/'],
) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Navbar items={items} siteName={siteName} />
    </MemoryRouter>,
  )

describe('Navbar', () => {
  it('renders the logo link', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: /Studio Zanetti.*home/i })).toBeInTheDocument()
  })

  it('renders fallback navigation links when items is empty', () => {
    renderNavbar([])
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(nav).getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Gallery' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'About' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Contact' })).toBeInTheDocument()
  })

  it('renders WordPress menu items when provided', () => {
    renderNavbar(MOCK_ITEMS)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(nav).getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Gallery' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'About' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Contact' })).toBeInTheDocument()
  })

  it('renders dropdown toggle for items with children', () => {
    renderNavbar(MOCK_ITEMS)
    const toggle = screen.getByRole('button', { name: /show gallery submenu/i })
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders dropdown child links', () => {
    renderNavbar(MOCK_ITEMS)
    expect(screen.getByRole('link', { name: 'Weddings' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Portraits' })).toBeInTheDocument()
  })

  it('toggles dropdown aria-expanded when clicked', () => {
    renderNavbar(MOCK_ITEMS)
    const toggle = screen.getByRole('button', { name: /show gallery submenu/i })

    // Use fireEvent.click (not userEvent.click) to avoid mouseenter on
    // the parent <li> — which would open the dropdown via the hover handler
    // and interfere with the toggle assertion.
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders skip to main content link', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument()
  })

  it('hamburger menu toggle has correct initial aria-expanded', () => {
    renderNavbar()
    const toggle = screen.getByRole('button', { name: /open navigation menu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not render dropdown toggle for items without children', () => {
    renderNavbar(MOCK_ITEMS)
    // "About" has no children — no submenu toggle should exist for it
    expect(screen.queryByRole('button', { name: /show about submenu/i })).not.toBeInTheDocument()
  })

  it('renders custom site name when provided', () => {
    renderNavbar([], 'My Photography')
    expect(screen.getByRole('link', { name: /My Photography.*home/i })).toBeInTheDocument()
  })

  it('keeps the matching page highlighted when the current URL includes a hash fragment', () => {
    renderNavbar(
      [
        {
          id: 4,
          title: 'Contact',
          url: 'https://studiozanetti.com.au/contact/',
          children: [],
        },
      ],
      undefined,
      ['/contact#contact-enquiry'],
    )

    expect(screen.getByRole('link', { name: 'Contact' }).className).toMatch(/navLinkActive/)
  })
})
