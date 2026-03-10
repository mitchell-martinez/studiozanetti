import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { GalleriesBlock as GalleriesBlockType } from '~/types/wordpress'
import testGalleriesBlock from '../__mocks__/testGalleriesBlock.json'
import GalleriesBlock from '../index'

const mockGalleriesBlock = testGalleriesBlock as GalleriesBlockType

describe('GalleriesBlock', () => {
  it('renders heading and gallery images', () => {
    render(<GalleriesBlock block={mockGalleriesBlock} />)

    expect(screen.getByRole('heading', { name: 'Cat Gallery', level: 2 })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /open image/i })).toHaveLength(3)
  })

  it('opens and closes the image modal', async () => {
    const user = userEvent.setup()

    render(<GalleriesBlock block={mockGalleriesBlock} />)

    await user.click(screen.getByRole('button', { name: 'Open image 1 of 3' }))
    const dialog = screen.getByRole('dialog', { name: 'Gallery image preview' })
    expect(dialog).toBeInTheDocument()

    await user.click(dialog)
    expect(screen.queryByRole('dialog', { name: 'Gallery image preview' })).not.toBeInTheDocument()
  })

  it('returns null when no images are configured', () => {
    const { container } = render(
      <GalleriesBlock block={{ acf_fc_layout: 'galleries', heading: 'Empty', images: [] }} />,
    )

    expect(container.firstChild).toBeNull()
  })
})
