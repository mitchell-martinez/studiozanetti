import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { mockPricingPackagesBlock } from '../helpers/mockBlock'
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
})
