import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { ImageTextBlock as ImageTextBlockType } from '~/types/wordpress'
import baseData from '../__mocks__/imageTextBlock.json'
import ImageTextBlock from '../index'

const base = baseData as unknown as ImageTextBlockType

const renderBlock = (overrides: Partial<ImageTextBlockType> = {}) =>
  render(
    <MemoryRouter>
      <ImageTextBlock block={{ ...base, ...overrides }} />
    </MemoryRouter>,
  )

describe('ImageTextBlock', () => {
  it('renders heading and body', () => {
    renderBlock()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(base.heading!)
    expect(screen.getByText(/simple and enjoyable/i)).toBeInTheDocument()
  })

  it('renders the image', () => {
    renderBlock()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', base.image.url)
    expect(img).toHaveAttribute('alt', base.image.alt)
  })

  it('renders eyebrow when provided', () => {
    renderBlock({ eyebrow: 'Our Approach' })
    expect(screen.getByText('Our Approach')).toBeInTheDocument()
  })

  it('renders CTA link when both text and url are provided', () => {
    renderBlock({ cta_text: 'Learn more', cta_url: '/about' })
    const link = screen.getByRole('link', { name: /learn more/i })
    expect(link).toHaveAttribute('href', '/about')
  })

  it('does not render CTA when cta_text is missing', () => {
    renderBlock({ cta_text: undefined })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  // ─── Image caption ──────────────────────────────────────────────────────────

  it('renders image caption when provided', () => {
    renderBlock({ image_caption: 'Golden hour at the valley' })
    expect(screen.getByText('Golden hour at the valley')).toBeInTheDocument()
  })

  it('does not render image caption when not provided', () => {
    renderBlock({ image_caption: undefined })
    expect(screen.queryByText(base.image_caption!)).not.toBeInTheDocument()
  })

  it('centres the image caption below the image', () => {
    const { container } = renderBlock({ image_caption: 'Test caption' })
    const caption = container.querySelector('[class*="imageCaption"]')!
    expect(caption).toBeInTheDocument()
    expect(caption.textContent).toBe('Test caption')
  })

  // ─── Image position ─────────────────────────────────────────────────────────

  it('applies imageRight class when position is right', () => {
    const { container } = renderBlock({ image_position: 'right' })
    const grid = container.querySelector('[class*="imageText"]')!
    expect(grid.className).toMatch(/imageRight/)
  })

  it('does not apply imageRight class when position is left', () => {
    const { container } = renderBlock({ image_position: 'left' })
    const grid = container.querySelector('[class*="imageText"]')!
    expect(grid.className).not.toMatch(/imageRight/)
  })

  // ─── Image loading ──────────────────────────────────────────────────────────

  it('sets loading="lazy" on the image', () => {
    renderBlock()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('sets decoding="async" on the image', () => {
    renderBlock()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('decoding', 'async')
  })

  // ─── Font size ──────────────────────────────────────────────────────────────

  it('applies small font size class by default', () => {
    const { container } = renderBlock()
    const richText = container.querySelector('[class*="richText"]')!
    expect(richText.className).toMatch(/fontSm/)
  })

  it('applies medium font size class', () => {
    const { container } = renderBlock({ font_size: 'md' })
    const richText = container.querySelector('[class*="richText"]')!
    expect(richText.className).toMatch(/fontMd/)
  })

  it('applies large font size class', () => {
    const { container } = renderBlock({ font_size: 'lg' })
    const richText = container.querySelector('[class*="richText"]')!
    expect(richText.className).toMatch(/fontLg/)
  })
})
