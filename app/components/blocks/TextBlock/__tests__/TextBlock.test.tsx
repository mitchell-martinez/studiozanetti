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

  it('applies left text alignment class by default', () => {
    const { container } = renderBlock()
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/textLeft/)
  })

  it('applies center text alignment class', () => {
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

  it('applies left block alignment class by default', () => {
    const { container } = renderBlock()
    const inner = container.querySelector('section > div')!
    expect(inner.className).toMatch(/blockLeft/)
  })

  it('applies center block alignment class', () => {
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
})
