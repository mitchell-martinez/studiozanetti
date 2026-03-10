import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { ServicesGridBlock as ServicesGridBlockType } from '~/types/wordpress'
import baseData from '../__mocks__/servicesGridBlock.json'
import ServicesGridBlock from '../index'

const base = baseData as unknown as ServicesGridBlockType

const renderBlock = (overrides: Partial<ServicesGridBlockType> = {}) =>
  render(
    <MemoryRouter>
      <ServicesGridBlock block={{ ...base, ...overrides }} />
    </MemoryRouter>,
  )

describe('ServicesGridBlock', () => {
  // ─── Basic rendering ────────────────────────────────────────────────────────

  it('renders heading when provided', () => {
    renderBlock()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Photography Services')
  })

  it('renders subheading when provided', () => {
    renderBlock()
    expect(screen.getByText('Flexible options tailored to your event.')).toBeInTheDocument()
  })

  it('renders all service titles', () => {
    renderBlock()
    expect(screen.getByText('Weddings')).toBeInTheDocument()
    expect(screen.getByText('Engagements')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
  })

  it('renders service descriptions', () => {
    renderBlock()
    expect(screen.getByText('Full-day coverage with two photographers.')).toBeInTheDocument()
  })

  it('renders service images with correct alt text', () => {
    renderBlock()
    const img = screen.getByAltText('Wedding')
    expect(img).toHaveAttribute('src', 'https://picsum.photos/seed/zanetti-5/1600/1000')
  })

  it('renders CTA link when both text and url are provided', () => {
    renderBlock()
    const link = screen.getByRole('link', { name: /enquire now/i })
    expect(link).toHaveAttribute('href', '/contact')
  })

  it('does not render CTA when cta_text is missing', () => {
    renderBlock({ cta_text: undefined, cta_url: '/contact' })
    expect(screen.queryByRole('link', { name: /enquire now/i })).not.toBeInTheDocument()
  })

  it('does not render heading when omitted', () => {
    renderBlock({ heading: undefined })
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  // ─── Text alignment ────────────────────────────────────────────────────────

  it('applies left text alignment by default', () => {
    const { container } = renderBlock()
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).toMatch(/alignLeft/)
  })

  it('applies center text alignment', () => {
    const { container } = renderBlock({ text_align: 'center' })
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).toMatch(/alignCenter/)
  })

  it('applies right text alignment', () => {
    const { container } = renderBlock({ text_align: 'right' })
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).toMatch(/alignRight/)
  })

  // ─── Clickable cards ───────────────────────────────────────────────────────

  it('renders a card as a link when url is provided', () => {
    renderBlock({
      services: [{ title: 'Linked', description: 'Has a URL', url: '/weddings' }],
    })
    const link = screen.getByRole('link', { name: /linked/i })
    expect(link).toHaveAttribute('href', '/weddings')
    expect(link.className).toMatch(/serviceCardLink/)
  })

  it('renders a card as an article when no url is provided', () => {
    renderBlock({
      services: [{ title: 'Static', description: 'No URL' }],
    })
    expect(screen.getByRole('article')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /static/i })).not.toBeInTheDocument()
  })

  it('mixes linked and static cards correctly', () => {
    renderBlock({
      services: [
        { title: 'Linked', description: 'Has URL', url: '/foo' },
        { title: 'Static', description: 'No URL' },
      ],
    })
    expect(screen.getByRole('link', { name: /linked/i }).getAttribute('href')).toBe('/foo')
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  // ─── Card styles ───────────────────────────────────────────────────────────

  it('applies elevated card style by default', () => {
    const { container } = renderBlock()
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).toMatch(/cardElevated/)
  })

  it('applies outline card style', () => {
    const { container } = renderBlock({ card_style: 'outline' })
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).toMatch(/cardOutline/)
  })

  it('applies minimal card style', () => {
    const { container } = renderBlock({ card_style: 'minimal' })
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).toMatch(/cardMinimal/)
  })

  // ─── Column variants ──────────────────────────────────────────────────────

  it('sets --max-cols CSS variable when max_columns is set', () => {
    const { container } = renderBlock({ max_columns: 2 })
    const grid = container.querySelector('[class*="servicesGrid"]')! as HTMLElement
    expect(grid.style.getPropertyValue('--max-cols')).toBe('2')
  })

  it('does not set --max-cols when max_columns is not set', () => {
    const { container } = renderBlock({ max_columns: undefined })
    const grid = container.querySelector('[class*="servicesGrid"]')! as HTMLElement
    expect(grid.style.getPropertyValue('--max-cols')).toBe('')
  })

  // ─── Font size ─────────────────────────────────────────────────────────────────

  it('does not apply font-size class by default (sm)', () => {
    const { container } = renderBlock()
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).not.toMatch(/fontMd/)
    expect(card.className).not.toMatch(/fontLg/)
  })

  it('applies fontMd class when font_size is md', () => {
    const { container } = renderBlock({ font_size: 'md' })
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).toMatch(/fontMd/)
  })

  it('applies fontLg class when font_size is lg', () => {
    const { container } = renderBlock({ font_size: 'lg' })
    const card = container.querySelector('[class*="serviceCard"]')!
    expect(card.className).toMatch(/fontLg/)
  })
})
