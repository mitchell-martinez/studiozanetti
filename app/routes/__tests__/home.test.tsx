import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import Home from '../home'

const renderHome = () => {
  const router = createMemoryRouter([{ path: '/', element: <Home /> }], {
    initialEntries: ['/'],
  })
  render(<RouterProvider router={router} />)
}

describe('Home route', () => {
  it('renders the hero section with correct heading', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: /Studio Zanetti/i, level: 1 })).toBeInTheDocument()
  })

  it('renders the View Gallery CTA link', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /view gallery/i })).toBeInTheDocument()
  })

  it('renders the three service cards', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: 'Weddings', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Portraits', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Events', level: 3 })).toBeInTheDocument()
  })

  it('renders the Learn About Us link', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /learn about us/i })).toBeInTheDocument()
  })
})
