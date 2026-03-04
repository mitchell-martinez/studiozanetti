import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { WPMenuItem } from '~/types/wordpress'
import Footer from '../index'

const renderFooter = (items: WPMenuItem[] = []) =>
  render(
    <MemoryRouter>
      <Footer items={items} />
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

  it('renders the current year in copyright', () => {
    renderFooter()
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })
})
