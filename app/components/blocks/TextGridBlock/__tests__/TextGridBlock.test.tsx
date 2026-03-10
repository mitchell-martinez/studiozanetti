import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { TextGridBlock as TextGridBlockType } from '~/types/wordpress'
import mockData from '../__mocks__/textGridBlock.json'
import TextGridBlock from '../index'

const base = mockData as unknown as TextGridBlockType

const renderBlock = (overrides: Partial<TextGridBlockType> = {}) =>
  render(
    <MemoryRouter>
      <TextGridBlock block={{ ...base, ...overrides }} />
    </MemoryRouter>,
  )

describe('TextGridBlock', () => {
  it('renders heading and subheading', () => {
    renderBlock()
    expect(screen.getByRole('heading', { level: 2, name: /why choose us/i })).toBeInTheDocument()
    expect(screen.getByText(/a few things that set us apart/i)).toBeInTheDocument()
  })

  it('renders all items', () => {
    renderBlock()
    expect(screen.getByText('Timeless Style')).toBeInTheDocument()
    expect(screen.getByText('Personal Touch')).toBeInTheDocument()
    expect(screen.getByText('Fast Turnaround')).toBeInTheDocument()
  })

  it('renders CTA links when both text and url are provided', () => {
    renderBlock()
    expect(screen.getByRole('link', { name: /learn more/i })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: /our process/i })).toHaveAttribute('href', '/process')
  })

  it('does not render CTA for items without cta_url', () => {
    renderBlock()
    // "Fast Turnaround" has no cta — there should be exactly 2 links
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
  })

  it('renders nothing when items array is empty', () => {
    const { container } = renderBlock({ items: [] })
    expect(container.firstChild).toBeNull()
  })

  it('sets --max-cols CSS variable when max_columns is set', () => {
    const { container } = renderBlock({ max_columns: 2 })
    const grid = container.querySelector('[class*="grid"]')! as HTMLElement
    expect(grid.style.getPropertyValue('--max-cols')).toBe('2')
  })

  it('does not set --max-cols when max_columns is not set', () => {
    const { container } = renderBlock({ max_columns: undefined })
    const grid = container.querySelector('[class*="grid"]')! as HTMLElement
    expect(grid.style.getPropertyValue('--max-cols')).toBe('')
  })

  // ─── Optional title/body ──────────────────────────────────────────────────

  it('renders items without a title', () => {
    renderBlock({
      items: [{ body: 'body only' }],
    })
    expect(screen.getByText('body only')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('renders items without a body', () => {
    renderBlock({
      items: [{ title: 'title only' }],
    })
    expect(screen.getByText('title only')).toBeInTheDocument()
  })

  it('applies elevated card style by default', () => {
    const { container } = renderBlock()
    const card = container.querySelector('article')!
    expect(card.className).toMatch(/cardElevated/)
  })

  it('applies outline card style', () => {
    const { container } = renderBlock({ card_style: 'outline' })
    const card = container.querySelector('article')!
    expect(card.className).toMatch(/cardOutline/)
  })

  it('applies minimal card style', () => {
    const { container } = renderBlock({ card_style: 'minimal' })
    const card = container.querySelector('article')!
    expect(card.className).toMatch(/cardMinimal/)
  })

  it('applies text alignment class', () => {
    const { container } = renderBlock({ text_align: 'center' })
    const card = container.querySelector('article')!
    expect(card.className).toMatch(/alignCenter/)
  })

  // ─── Font size ─────────────────────────────────────────────────────────────────

  it('does not apply font-size class by default (sm)', () => {
    const { container } = renderBlock()
    const card = container.querySelector('article')!
    expect(card.className).not.toMatch(/fontMd/)
    expect(card.className).not.toMatch(/fontLg/)
  })

  it('applies fontMd class when font_size is md', () => {
    const { container } = renderBlock({ font_size: 'md' })
    const card = container.querySelector('article')!
    expect(card.className).toMatch(/fontMd/)
  })

  it('applies fontLg class when font_size is lg', () => {
    const { container } = renderBlock({ font_size: 'lg' })
    const card = container.querySelector('article')!
    expect(card.className).toMatch(/fontLg/)
  })
})
