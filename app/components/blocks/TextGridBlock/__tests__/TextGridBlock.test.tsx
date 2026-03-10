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

  it('applies the correct column class', () => {
    const { container } = renderBlock({ columns: 2 })
    const grid = container.querySelector('[class*="grid"]')!
    expect(grid.className).toMatch(/cols2/)
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
})
