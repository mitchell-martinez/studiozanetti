import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import Footer from '../Footer'

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )

describe('Footer', () => {
  it('renders the brand name', () => {
    renderFooter()
    expect(screen.getByText('Studio Zanetti')).toBeInTheDocument()
  })

  it('renders footer navigation links', () => {
    renderFooter()
    const nav = screen.getByRole('navigation', { name: /footer navigation/i })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Gallery/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Contact/i })).toBeInTheDocument()
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
