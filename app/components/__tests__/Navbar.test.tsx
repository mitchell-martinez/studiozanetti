import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { WPMenuItem } from '~/types/wordpress'
import Navbar from '../Navbar'

const MOCK_ITEMS: WPMenuItem[] = [
  { id: 1, title: 'Home', url: '/', children: [] },
  {
    id: 2,
    title: 'Gallery',
    url: '/gallery',
    children: [
      { id: 21, title: 'Weddings', url: '/gallery?category=Weddings', children: [] },
      { id: 22, title: 'Portraits', url: '/gallery?category=Portraits', children: [] },
    ],
  },
  { id: 3, title: 'About', url: '/about', children: [] },
  { id: 4, title: 'Contact', url: '/contact', children: [] },
]

const renderNavbar = (items: WPMenuItem[] = []) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Navbar items={items} />
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
})
