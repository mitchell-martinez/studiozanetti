import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { mockFivePackagesBlock, mockPricingPackagesBlock } from '../helpers/mockBlock'
import PricingPackagesBlock from '../index'

describe('PricingPackagesBlock', () => {
  it('renders package card and CTA', () => {
    render(
      <MemoryRouter>
        <PricingPackagesBlock block={mockPricingPackagesBlock} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Packages', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('The Essentials')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Send Enquiry' })).toBeInTheDocument()
  })

  it('renders grid layout for 4 or fewer packages', () => {
    const { container } = render(
      <MemoryRouter>
        <PricingPackagesBlock block={mockPricingPackagesBlock} />
      </MemoryRouter>,
    )

    expect(container.querySelector('[class*="grid"]')).toBeInTheDocument()
    expect(container.querySelector('[class*="stack"]')).not.toBeInTheDocument()
  })

  it('renders nothing when packages are empty', () => {
    const { container } = render(
      <MemoryRouter>
        <PricingPackagesBlock block={{ ...mockPricingPackagesBlock, packages: [] }} />
      </MemoryRouter>,
    )

    expect(container.innerHTML).toBe('')
  })

  describe('comparison table layout (5+ packages)', () => {
    it('renders all 5 packages in a table', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: 'Our Packages', level: 2 })).toBeInTheDocument()
      expect(screen.getByText('Choose a package that fits your day.')).toBeInTheDocument()

      expect(screen.getByText('Ceremony Memories')).toBeInTheDocument()
      expect(screen.getByText('Short & Sweet')).toBeInTheDocument()
      expect(screen.getByText('The Essentials')).toBeInTheDocument()
      expect(screen.getByText('The Exclusive')).toBeInTheDocument()
      expect(screen.getByText('The Ultimate')).toBeInTheDocument()
    })

    it('uses table layout instead of grid', () => {
      const { container } = render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      expect(container.querySelector('table')).toBeInTheDocument()
      expect(container.querySelector('[class*="grid"]')).not.toBeInTheDocument()
    })

    it('renders column headers with package names', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders).toHaveLength(5)
    })

    it('renders description in column header', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      expect(
        screen.getByText('Perfect for couples who want treasured keepsakes'),
      ).toBeInTheDocument()
    })

    it('renders featured badge on featured package', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      expect(screen.getByText('Most Popular')).toBeInTheDocument()
    })

    it('renders CTA links for each package', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      const enquireLinks = screen.getAllByRole('link', { name: 'Enquire' })
      expect(enquireLinks).toHaveLength(5)
    })

    it('renders tagline text for packages', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      expect(screen.getByText('Digital & Album Package')).toBeInTheDocument()
      expect(screen.getByText('Digital, Album & Engagement Package')).toBeInTheDocument()
    })
  })
})
