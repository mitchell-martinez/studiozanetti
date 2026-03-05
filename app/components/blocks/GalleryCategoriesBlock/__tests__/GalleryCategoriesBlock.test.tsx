import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { mockGalleryCategoriesBlock } from '../helpers/mockBlock'
import GalleryCategoriesBlock from '../index'

describe('GalleryCategoriesBlock', () => {
  it('renders category tile with link', () => {
    render(
      <MemoryRouter>
        <GalleryCategoriesBlock block={mockGalleryCategoriesBlock} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Explore Galleries', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('The Brides')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /the brides/i })).toBeInTheDocument()
  })
})
