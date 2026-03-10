import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { GalleryImage } from '~/types/gallery'
import testGalleryImages from '../__mocks__/testGalleryImages.json'
import GalleryGrid from '../index'

const MOCK_IMAGES = testGalleryImages as GalleryImage[]

describe('GalleryGrid', () => {
  it('renders all images as list items', () => {
    render(<GalleryGrid images={MOCK_IMAGES} />)
    const list = screen.getByRole('list', { name: /photo gallery/i })
    expect(list).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(MOCK_IMAGES.length)
  })

  it('opens lightbox when an item is clicked', async () => {
    const user = userEvent.setup()
    render(<GalleryGrid images={MOCK_IMAGES} />)

    await user.click(screen.getByRole('listitem', { name: /Open Wedding ceremony/i }))
    expect(screen.getByRole('dialog', { name: /image lightbox/i })).toBeInTheDocument()
  })

  it('closes lightbox on Escape key', async () => {
    const user = userEvent.setup()
    render(<GalleryGrid images={MOCK_IMAGES} />)

    await user.click(screen.getByRole('listitem', { name: /Open Wedding ceremony/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows navigation arrows in lightbox when multiple images', async () => {
    const user = userEvent.setup()
    render(<GalleryGrid images={MOCK_IMAGES} />)

    await user.click(screen.getByRole('listitem', { name: /Open Wedding ceremony/i }))
    // First item: no prev, has next
    expect(screen.queryByRole('button', { name: /previous image/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next image/i })).toBeInTheDocument()
  })

  it('navigates to next image with ArrowRight', async () => {
    const user = userEvent.setup()
    render(<GalleryGrid images={MOCK_IMAGES} />)

    await user.click(screen.getByRole('listitem', { name: /Open Wedding ceremony/i }))
    await user.keyboard('{ArrowRight}')
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Studio portrait')).toBeInTheDocument()
  })

  it('renders empty grid without errors', () => {
    render(<GalleryGrid images={[]} />)
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
