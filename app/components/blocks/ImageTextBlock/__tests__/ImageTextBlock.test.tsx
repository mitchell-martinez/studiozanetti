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

  // ─── Image alignment ────────────────────────────────────────────────────────

  it('does not apply imgAlignCenter or imgAlignRight class by default (left)', () => {
    const { container } = renderBlock()
    const imgWrap = container.querySelector('[class*="imageTextImage"]')!
    expect(imgWrap.className).not.toMatch(/imgAlignCenter/)
    expect(imgWrap.className).not.toMatch(/imgAlignRight/)
  })

  it('applies imgAlignCenter class when image_alignment is center', () => {
    const { container } = renderBlock({ image_alignment: 'center' })
    const imgWrap = container.querySelector('[class*="imageTextImage"]')!
    expect(imgWrap.className).toMatch(/imgAlignCenter/)
  })

  it('applies imgAlignRight class when image_alignment is right', () => {
    const { container } = renderBlock({ image_alignment: 'right' })
    const imgWrap = container.querySelector('[class*="imageTextImage"]')!
    expect(imgWrap.className).toMatch(/imgAlignRight/)
  })

  // ─── Vertical alignment ─────────────────────────────────────────────────────

  it('applies alignMiddle class by default', () => {
    const { container } = renderBlock()
    const grid = container.querySelector('[class*="imageText"]')!
    expect(grid.className).toMatch(/alignMiddle/)
  })

  it('applies alignTop class when text_vertical_align is top', () => {
    const { container } = renderBlock({ text_vertical_align: 'top' })
    const grid = container.querySelector('[class*="imageText"]')!
    expect(grid.className).toMatch(/alignTop/)
  })

  it('applies alignBottom class when text_vertical_align is bottom', () => {
    const { container } = renderBlock({ text_vertical_align: 'bottom' })
    const grid = container.querySelector('[class*="imageText"]')!
    expect(grid.className).toMatch(/alignBottom/)
  })

  // ─── Horizontal alignment ───────────────────────────────────────────────────

  it('does not apply textCenter or textRight class by default (left)', () => {
    const { container } = renderBlock()
    const body = container.querySelector('[class*="imageTextBody"]')!
    expect(body.className).not.toMatch(/textCenter/)
    expect(body.className).not.toMatch(/textRight/)
  })

  it('applies textCenter class when text_horizontal_align is center', () => {
    const { container } = renderBlock({ text_horizontal_align: 'center' })
    const body = container.querySelector('[class*="imageTextBody"]')!
    expect(body.className).toMatch(/textCenter/)
  })

  it('applies textRight class when text_horizontal_align is right', () => {
    const { container } = renderBlock({ text_horizontal_align: 'right' })
    const body = container.querySelector('[class*="imageTextBody"]')!
    expect(body.className).toMatch(/textRight/)
  })

  // ─── Heading-only / Body-only alignment ─────────────────────────────────────

  it('applies headingOnly class when heading present but no body', () => {
    const { container } = renderBlock({ heading: 'Title', body: '' })
    const body = container.querySelector('[class*="imageTextBody"]')!
    expect(body.className).toMatch(/headingOnly/)
  })

  it('applies bodyOnly class when body present but no heading or eyebrow', () => {
    const { container } = renderBlock({
      heading: undefined,
      eyebrow: undefined,
      body: '<p>Text</p>',
    })
    const body = container.querySelector('[class*="imageTextBody"]')!
    expect(body.className).toMatch(/bodyOnly/)
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

  // ─── Clickable URL wrapping ─────────────────────────────────────────────────

  it('wraps content in a link when url is provided (internal)', () => {
    const { container } = renderBlock({ url: '/about-us' })
    const link = container.querySelector('a[class*="blockLink"]')!
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/about-us')
  })

  it('wraps content in an external link when url is external', () => {
    const { container } = renderBlock({ url: 'https://example.com' })
    const link = container.querySelector('a[class*="blockLink"]')!
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('https://example.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('applies clickable class when url is provided', () => {
    const { container } = renderBlock({ url: '/about-us' })
    const inner = container.querySelector('[class*="imageText"]')!
    expect(inner.className).toMatch(/clickable/)
  })

  it('does not apply clickable class when url is absent', () => {
    const { container } = renderBlock({ url: undefined })
    const inner = container.querySelector('[class*="imageText"]')!
    expect(inner.className).not.toMatch(/clickable/)
  })

  it('suppresses the CTA button when block-level url is set', () => {
    renderBlock({ url: '/about-us', cta_text: 'Learn more', cta_url: '/about' })
    expect(screen.queryByText('Learn more')).not.toBeInTheDocument()
  })
})
