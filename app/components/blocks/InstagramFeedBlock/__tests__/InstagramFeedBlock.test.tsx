import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { InstagramFeedBlock as InstagramFeedBlockType } from '~/types/wordpress'
import baseData from '../__mocks__/instagramFeedBlock.json'
import InstagramFeedBlock from '../index'

const base = baseData as unknown as InstagramFeedBlockType

const renderBlock = (overrides: Partial<InstagramFeedBlockType> = {}) =>
  render(
    <MemoryRouter>
      <InstagramFeedBlock block={{ ...base, ...overrides }} />
    </MemoryRouter>,
  )

describe('InstagramFeedBlock', () => {
  it('renders heading when provided', () => {
    renderBlock()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Follow Along')
  })

  it('renders subheading when provided', () => {
    renderBlock()
    expect(screen.getByText('See our latest work on Instagram')).toBeInTheDocument()
  })

  it('does not render heading when omitted', () => {
    renderBlock({ heading: undefined })
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders all images', () => {
    renderBlock()
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(6)
  })

  it('renders images with correct alt text', () => {
    renderBlock()
    expect(screen.getByAltText('Wedding ceremony')).toBeInTheDocument()
    expect(screen.getByAltText('Portrait session')).toBeInTheDocument()
  })

  it('renders images with lazy loading', () => {
    renderBlock()
    const img = screen.getAllByRole('img')[0]
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
  })

  it('links images to the profile URL', () => {
    renderBlock()
    const links = screen.getAllByRole('link').filter((l) => l.className.includes('imageItem'))
    expect(links).toHaveLength(6)
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://www.instagram.com/studiozanetti')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders the follow CTA button', () => {
    renderBlock()
    const button = screen.getByRole('link', { name: /follow @studiozanetti on instagram/i })
    expect(button).toBeInTheDocument()
  })

  it('uses custom cta_text when provided', () => {
    renderBlock()
    expect(screen.getByText(/follow on instagram/i)).toBeInTheDocument()
  })

  it('falls back to default cta text when cta_text is not provided', () => {
    renderBlock({ cta_text: undefined })
    expect(screen.getByText(/follow @studiozanetti/i)).toBeInTheDocument()
  })

  it('sets --cols CSS variable from columns prop', () => {
    const { container } = renderBlock({ columns: 4 })
    const grid = container.querySelector('[class*="grid"]')! as HTMLElement
    expect(grid.style.getPropertyValue('--cols')).toBe('4')
  })

  it('returns null when images array is empty', () => {
    const { container } = renderBlock({ images: [] })
    expect(container.firstChild).toBeNull()
  })

  it('renders the Instagram SVG icon', () => {
    const { container } = renderBlock()
    const svg = container.querySelector('[class*="instagramIcon"]')
    expect(svg).toBeInTheDocument()
  })
})
