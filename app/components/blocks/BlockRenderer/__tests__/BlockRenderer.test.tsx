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

const testimonialBlock: ContentBlock = {
  acf_fc_layout: 'testimonial_carousel',
  heading: 'Kind Words',
  testimonials: [
    {
      quote: 'Michael made us feel so comfortable and captured every moment.',
      name: 'Alix & Richard',
      context: 'Wedding',
    },
  ],
}

const faqBlock: ContentBlock = {
  acf_fc_layout: 'faq_accordion',
  heading: 'Frequently Asked Questions',
  open_first_item: true,
  faq_items: [
    {
      question: 'Do you travel?',
      answer: '<p>Yes, throughout Sydney and beyond.</p>',
    },
  ],
}

const processBlock: ContentBlock = {
  acf_fc_layout: 'process_timeline',
  heading: 'Our Process',
  steps: [
    { title: 'Get in touch', description: 'Reach out and let us know your date.' },
    { title: 'Wedding day', description: 'We capture your day naturally and candidly.' },
  ],
}

const pricingBlock: ContentBlock = {
  acf_fc_layout: 'pricing_packages',
  heading: 'Packages',
  packages: [
    {
      name: 'The Essentials',
      price_label: '$1,980',
      description: 'Digital only package',
      inclusions: '<ul><li>High-res edited images</li></ul>',
      cta_text: 'Send Enquiry',
      cta_url: '/contact',
    },
  ],
}

const galleryCategoriesBlock: ContentBlock = {
  acf_fc_layout: 'gallery_categories',
  heading: 'Explore Galleries',
  categories: [
    {
      title: 'The Brides',
      subtitle: 'Beautiful dresses & inspiration',
      image: img,
      url: '/gallery/stylish-brides',
    },
  ],
}

const renderBlocks = (blocks: ContentBlock[], featuredImage?: typeof img) =>
  render(
    <MemoryRouter>
      <BlockRenderer blocks={blocks} featuredImage={featuredImage} />
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

  it('renders a testimonial_carousel block', () => {
    renderBlocks([testimonialBlock])
    expect(screen.getByRole('heading', { name: 'Kind Words', level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/captured every moment/i)).toBeInTheDocument()
    expect(screen.getByText('Alix & Richard')).toBeInTheDocument()
  })

  it('renders an faq_accordion block', () => {
    renderBlocks([faqBlock])
    expect(
      screen.getByRole('heading', { name: 'Frequently Asked Questions', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Do you travel?')).toBeInTheDocument()
    expect(screen.getByText('Yes, throughout Sydney and beyond.')).toBeInTheDocument()
  })

  it('renders a process_timeline block', () => {
    renderBlocks([processBlock])
    expect(screen.getByRole('heading', { name: 'Our Process', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Get in touch')).toBeInTheDocument()
    expect(screen.getByText('Wedding day')).toBeInTheDocument()
  })

  it('renders a pricing_packages block', () => {
    renderBlocks([pricingBlock])
    expect(screen.getByRole('heading', { name: 'Packages', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('The Essentials')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Send Enquiry' })).toBeInTheDocument()
  })

  it('renders a gallery_categories block', () => {
    renderBlocks([galleryCategoriesBlock])
    expect(screen.getByRole('heading', { name: 'Explore Galleries', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('The Brides')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /The Brides/i })).toBeInTheDocument()
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

  it('uses page featured image when hero is configured with use_featured_image', () => {
    const featuredOnlyHero: ContentBlock = {
      acf_fc_layout: 'hero',
      title: 'Featured Hero',
      use_featured_image: true,
    }

    const featured = {
      url: 'https://example.com/featured.jpg',
      alt: 'Featured image',
      width: 1600,
      height: 900,
    }

    renderBlocks([featuredOnlyHero], featured)
    expect(screen.getByAltText('Featured image')).toBeInTheDocument()
  })
})
