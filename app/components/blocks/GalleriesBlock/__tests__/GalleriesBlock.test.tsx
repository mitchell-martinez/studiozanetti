import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GalleriesBlock as GalleriesBlockType } from '~/types/wordpress'
import testGalleriesBlock from '../__mocks__/testGalleriesBlock.json'
import GalleriesBlock from '../index'

const mockGalleriesBlock = testGalleriesBlock as GalleriesBlockType

describe('GalleriesBlock', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders heading and gallery images', () => {
    render(<GalleriesBlock block={mockGalleriesBlock} />)

    expect(screen.getByRole('heading', { name: 'Cat Gallery', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Three portraits from a recent set.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /open image/i })).toHaveLength(3)
  })

  it('includes image description in gallery button labels', () => {
    render(<GalleriesBlock block={mockGalleriesBlock} />)

    expect(
      screen.getByRole('button', { name: 'Open image 1 of 3: Cat 101' }),
    ).toBeInTheDocument()
  })

  it('opens and closes the image modal', async () => {
    const user = userEvent.setup()

    render(<GalleriesBlock block={mockGalleriesBlock} />)

    await user.click(screen.getAllByRole('button', { name: /open image/i })[0])
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

  it('navigates between images using arrow buttons', async () => {
    const user = userEvent.setup()

    render(<GalleriesBlock block={mockGalleriesBlock} />)

    await user.click(screen.getAllByRole('button', { name: /open image/i })[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Previous image' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next image' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(screen.getByRole('button', { name: 'Previous image' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next image' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(screen.getByRole('button', { name: 'Previous image' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument()
  })

  it('closes modal via the close button', async () => {
    const user = userEvent.setup()

    render(<GalleriesBlock block={mockGalleriesBlock} />)

    await user.click(screen.getAllByRole('button', { name: /open image/i })[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close preview' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('labels the modal image via aria-labelledby pointing to the caption', async () => {
    const user = userEvent.setup()

    render(<GalleriesBlock block={mockGalleriesBlock} />)

    await user.click(screen.getAllByRole('button', { name: /open image/i })[0])
    const modalImage = document.querySelector('img[aria-labelledby="gallery-modal-caption"]')!
    expect(modalImage).toBeInTheDocument()
    expect(modalImage).not.toHaveAttribute('tabindex')

    const caption = document.getElementById('gallery-modal-caption')
    expect(caption).toBeInTheDocument()
    expect(caption).toHaveTextContent(/.+/)
  })

  it('traps focus within the modal when tabbing', async () => {
    const user = userEvent.setup()

    render(<GalleriesBlock block={mockGalleriesBlock} />)

    // Open second image so both prev and next arrows are visible
    await user.click(screen.getAllByRole('button', { name: /open image/i })[1])
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Close preview' })
    const prevBtn = screen.getByRole('button', { name: 'Previous image' })
    const nextBtn = screen.getByRole('button', { name: 'Next image' })

    // Close button should be focused initially
    expect(document.activeElement).toBe(closeBtn)

    // Tab forward through buttons and wrap around
    await user.tab()
    expect(document.activeElement).toBe(prevBtn)

    await user.tab()
    expect(document.activeElement).toBe(nextBtn)

    await user.tab()
    expect(document.activeElement).toBe(closeBtn)

    // Shift+Tab should wrap backwards
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(nextBtn)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(prevBtn)
  })

  it('announces lightbox state changes via aria-live', async () => {
    const user = userEvent.setup()

    render(<GalleriesBlock block={mockGalleriesBlock} />)

    const announcer = document.querySelector('[aria-live="assertive"]')!
    expect(announcer).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /open image/i })[0])
    expect(announcer).toHaveTextContent(/lightbox opened/i)
    expect(announcer).toHaveTextContent(/image 1 of 3/i)

    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(announcer).toHaveTextContent(/image 2 of 3/i)

    await user.click(screen.getByRole('button', { name: 'Close preview' }))
    expect(announcer).toHaveTextContent(/lightbox closed/i)
  })

  it('provides navigation instructions via aria-describedby', async () => {
    const user = userEvent.setup()

    render(<GalleriesBlock block={mockGalleriesBlock} />)

    await user.click(screen.getAllByRole('button', { name: /open image/i })[0])
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-describedby', 'lightbox-instructions')

    const instructions = document.getElementById('lightbox-instructions')!
    expect(instructions).toHaveTextContent(/arrow keys or swipe/i)
    expect(instructions).toHaveTextContent(/escape to close/i)
  })
})
