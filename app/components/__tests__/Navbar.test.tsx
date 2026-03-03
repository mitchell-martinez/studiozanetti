import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import Navbar from '../Navbar'

const renderNavbar = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Navbar />
    </MemoryRouter>,
  )

describe('Navbar', () => {
  it('renders the logo link', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: /Studio Zanetti.*home/i })).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    renderNavbar()
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(nav).getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Gallery' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'About' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Contact' })).toBeInTheDocument()
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
})
