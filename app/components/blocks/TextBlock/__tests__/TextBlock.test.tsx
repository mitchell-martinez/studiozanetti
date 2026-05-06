import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { TextBlock as TextBlockType } from '~/types/wordpress'
import baseTextBlock from '../__mocks__/baseTextBlock.json'
import TextBlock from '../index'

const base = baseTextBlock as TextBlockType

const renderBlock = (overrides: Partial<TextBlockType> = {}) =>
  render(
    <MemoryRouter>
      <TextBlock block={{ ...base, ...overrides }} />
    </MemoryRouter>,
  )

describe('TextBlock', () => {
  it('renders heading and body', () => {
    renderBlock()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Heading')
    expect(screen.getByText('Test body content')).toBeInTheDocument()
  })

  it('renders eyebrow when provided', () => {
    renderBlock({ eyebrow: 'Label' })
    expect(screen.getByText('Label')).toBeInTheDocument()
  })

  it('renders CTA link when both text and url are provided', () => {
    renderBlock({ cta_text: 'Learn more', cta_url: '/about' })
    const link = screen.getByRole('link', { name: /learn more/i })
    expect(link).toHaveAttribute('href', '/about')
  })

  it('does not render CTA when cta_text is missing', () => {
    renderBlock({ cta_url: '/about' })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  // ─── Text alignment ─────────────────────────────────────────────────────────

  it('applies center text alignment class by default', () => {
    const { container } = renderBlock()
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/textCenter/)
  })

  it('applies explicit center text alignment class', () => {
    const { container } = renderBlock({ align: 'center' })
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/textCenter/)
  })

  it('applies right text alignment class', () => {
    const { container } = renderBlock({ align: 'right' })
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/textRight/)
  })

  it('applies justify text alignment class', () => {
    const { container } = renderBlock({ align: 'justify' })
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/textJustify/)
  })

  // ─── Block alignment ────────────────────────────────────────────────────────

  it('applies center block alignment class by default', () => {
    const { container } = renderBlock()
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/blockCenter/)
  })

  it('applies explicit center block alignment class', () => {
    const { container } = renderBlock({ block_align: 'center' })
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/blockCenter/)
  })

  it('applies right block alignment class', () => {
    const { container } = renderBlock({ block_align: 'right' })
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/blockRight/)
  })

  // ─── Max width ──────────────────────────────────────────────────────────────

  it('applies narrow max-width class', () => {
    const { container } = renderBlock({ max_width: 'narrow' })
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/maxNarrow/)
  })

  it('applies wide max-width class', () => {
    const { container } = renderBlock({ max_width: 'wide' })
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/maxWide/)
  })

  // ─── Combined ───────────────────────────────────────────────────────────────

  it('can combine text-right with block-center', () => {
    const { container } = renderBlock({ align: 'right', block_align: 'center' })
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/textRight/)
    expect(inner.className).toMatch(/blockCenter/)
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

  // ─── Corporate theme ────────────────────────────────────────────────────────

  it('applies corporate CSS variables via section style when section_theme is corporate', () => {
    const { container } = renderBlock({ section_theme: 'corporate' })
    const section = container.querySelector('section') as HTMLElement
    expect(section.style.getPropertyValue('--color-accent')).toBe('#333333')
    expect(section.style.getPropertyValue('--color-accent-strong')).toBe('#1a1a1a')
  })

  it('renders section background image layer when configured', () => {
    const { container } = renderBlock({
      background_image: {
        url: 'https://example.com/bg.jpg',
        alt: 'Background',
      },
      background_image_opacity: 0.4,
      background_image_shadow_strength: 0.5,
    })

    const backgroundLayer = container.querySelector('section > div[aria-hidden="true"]') as HTMLElement
    expect(backgroundLayer).toBeInTheDocument()
    expect(backgroundLayer.style.backgroundImage).toContain('bg.jpg')
  })
})
