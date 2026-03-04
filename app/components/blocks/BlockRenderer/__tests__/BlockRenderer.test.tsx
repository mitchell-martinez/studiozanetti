import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { ContentBlock } from '~/types/wordpress'
import BlockRenderer from '../index'

const img = { url: 'https://example.com/img.jpg', alt: 'Test image', width: 800, height: 600 }

const heroBlock: ContentBlock = {
  acf_fc_layout: 'hero',
  background_image: img,
  title: 'Hero Title',
  tagline: 'Hero tagline',
  cta_text: 'View Gallery',
  cta_url: '/gallery',
}

const textBlock: ContentBlock = {
  acf_fc_layout: 'text_block',
  heading: 'Text heading',
  body: '<p>Rich text content</p>',
  align: 'center',
  cta_text: 'Read more',
  cta_url: '/about',
}

const imageTextBlock: ContentBlock = {
  acf_fc_layout: 'image_text',
  image: img,
  heading: 'Image text heading',
  body: '<p>Image text body</p>',
  image_position: 'right',
}

const servicesBlock: ContentBlock = {
  acf_fc_layout: 'services_grid',
  heading: 'Our Services',
  services: [{ title: 'Weddings', description: 'Wedding photos', image: img }],
  cta_text: 'Browse work',
  cta_url: '/gallery',
}

const biographyBlock: ContentBlock = {
  acf_fc_layout: 'biography',
  image: img,
  name: 'Marco Zanetti',
  role: 'Lead Photographer',
  bio: '<p>Bio text here</p>',
}

const pillarBlock: ContentBlock = {
  acf_fc_layout: 'pillar_grid',
  heading: 'Our Approach',
  pillars: [{ title: 'Quality', description: 'High quality work' }],
}

const renderBlocks = (blocks: ContentBlock[]) =>
  render(
    <MemoryRouter>
      <BlockRenderer blocks={blocks} />
    </MemoryRouter>,
  )

describe('BlockRenderer', () => {
  it('renders a hero block', () => {
    renderBlocks([heroBlock])
    expect(screen.getByRole('heading', { name: 'Hero Title', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Hero tagline')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Gallery' })).toBeInTheDocument()
  })

  it('renders a text_block', () => {
    renderBlocks([textBlock])
    expect(screen.getByRole('heading', { name: 'Text heading', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Rich text content')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Read more/i })).toBeInTheDocument()
  })

  it('renders an image_text block', () => {
    renderBlocks([imageTextBlock])
    expect(
      screen.getByRole('heading', { name: 'Image text heading', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('Test image')).toBeInTheDocument()
  })

  it('renders a services_grid block', () => {
    renderBlocks([servicesBlock])
    expect(screen.getByRole('heading', { name: 'Our Services', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Weddings')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse work' })).toBeInTheDocument()
  })

  it('renders a biography block', () => {
    renderBlocks([biographyBlock])
    expect(screen.getByRole('heading', { name: 'Marco Zanetti', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Lead Photographer')).toBeInTheDocument()
    expect(screen.getByText('Bio text here')).toBeInTheDocument()
  })

  it('renders a pillar_grid block', () => {
    renderBlocks([pillarBlock])
    expect(screen.getByRole('heading', { name: 'Our Approach', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByText('High quality work')).toBeInTheDocument()
  })

  it('renders multiple blocks in order', () => {
    renderBlocks([heroBlock, textBlock, servicesBlock])
    expect(screen.getByText('Hero Title')).toBeInTheDocument()
    expect(screen.getByText('Rich text content')).toBeInTheDocument()
    expect(screen.getByText('Weddings')).toBeInTheDocument()
  })

  it('silently skips unknown block types', () => {
    const unknown = { acf_fc_layout: 'not_a_real_block' } as unknown as ContentBlock
    expect(() => renderBlocks([unknown])).not.toThrow()
  })

  it('renders an empty array without error', () => {
    expect(() => renderBlocks([])).not.toThrow()
  })

  it('renders hero without optional tagline and CTA', () => {
    const minimal: ContentBlock = {
      acf_fc_layout: 'hero',
      background_image: img,
      title: 'Minimal Hero',
    }
    renderBlocks([minimal])
    expect(screen.getByText('Minimal Hero')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders biography without optional image', () => {
    const noPic: ContentBlock = {
      acf_fc_layout: 'biography',
      name: 'Jane Doe',
      bio: '<p>No photo bio</p>',
    }
    renderBlocks([noPic])
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.queryByAltText('Jane Doe')).not.toBeInTheDocument()
  })
})
