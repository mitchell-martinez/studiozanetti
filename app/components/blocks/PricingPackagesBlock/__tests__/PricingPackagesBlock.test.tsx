import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PricingPackagesBlock as PricingPackagesBlockType } from '~/types/wordpress'
import testFivePackagesBlock from '../__mocks__/testFivePackagesBlock.json'
import testPricingPackagesBlock from '../__mocks__/testPricingPackagesBlock.json'
import PricingPackagesBlock from '../index'

const mockPricingPackagesBlock = testPricingPackagesBlock as PricingPackagesBlockType
const mockFivePackagesBlock = testFivePackagesBlock as PricingPackagesBlockType

/** Helper: set matchMedia to report mobile or desktop */
const mockMatchMedia = (mobile: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: mobile,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

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

  describe('comparison table layout (5+ packages, desktop)', () => {
    beforeEach(() => mockMatchMedia(false))

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

      const headers = screen.getAllByRole('columnheader')
      const descInHeader = headers.some((th) =>
        th.textContent?.includes('Perfect for couples on a budget.'),
      )
      expect(descInHeader).toBe(true)
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

  describe('accordion layout (5+ packages, mobile)', () => {
    beforeEach(() => mockMatchMedia(true))
    afterEach(() => mockMatchMedia(false))

    it('renders accordion instead of table', () => {
      const { container } = render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      expect(container.querySelector('[class*="accordion"]')).toBeInTheDocument()
      expect(container.querySelector('table')).not.toBeInTheDocument()
    })

    it('renders all 5 packages as accordion panels', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
    })

    it('opens first package by default', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveAttribute('aria-expanded', 'true')
      expect(buttons[1]).toHaveAttribute('aria-expanded', 'false')
    })

    it('renders CTA links for each package', () => {
      render(
        <MemoryRouter>
          <PricingPackagesBlock block={mockFivePackagesBlock} />
        </MemoryRouter>,
      )

      // Only the open panel (first) should render its CTA
      const enquireLinks = screen.getAllByRole('link', { name: 'Enquire' })
      expect(enquireLinks.length).toBeGreaterThanOrEqual(1)
    })
  })
})
