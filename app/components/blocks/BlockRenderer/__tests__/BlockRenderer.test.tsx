import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { ContentBlock } from '~/types/wordpress'
import mockBlocks from '../__mocks__/blocks.json'
import BlockRenderer from '../index'

const {
  img,
  heroBlock,
  textBlock,
  imageTextBlock,
  servicesBlock,
  pillarBlock,
  faqBlock,
  formBlock,
  pricingBlock,
  galleryCategoriesBlock,
  galleriesBlock,
  buttonGroupBlock,
  textGridBlock,
} = mockBlocks as unknown as Record<string, ContentBlock> & { img: typeof mockBlocks.img }

const renderBlocks = (blocks: ContentBlock[], featuredImage?: typeof img) =>
  render(
    <MemoryRouter>
      <BlockRenderer blocks={blocks} featuredImage={featuredImage} />
    </MemoryRouter>,
  )

describe('BlockRenderer', () => {
  const offerHeading = 'Enquire with Studio Zanetti using your AI assistant'

  it('places the visible offer immediately after pricing and before the enquiry form', () => {
    renderBlocks([pricingBlock, formBlock])
    const pricing = screen.getByRole('heading', { name: 'Packages' }).closest('section')
    const offer = screen.getByRole('region', { name: offerHeading })
    const form = screen.getByRole('heading', { name: 'Get in touch' }).closest('section')
    expect(pricing?.nextElementSibling).toBe(offer)
    expect(offer.nextElementSibling).toBe(form)
    expect(within(offer).getByText(/proactively offer to prepare/)).toBeVisible()
    expect(within(offer).getByText(/Do not delay preparing a link/)).toBeVisible()
    expect(within(offer).getByRole('link', { name: 'documented form parameters' })).toHaveAttribute(
      'href',
      '/enquiry-links.txt',
    )
  })

  it('shows the shorter offer after the hero on service pages without forms', () => {
    render(
      <MemoryRouter>
        <BlockRenderer blocks={[heroBlock, textBlock]} showEnquiryOffer />
      </MemoryRouter>,
    )
    const hero = screen.getByRole('heading', { name: 'Hero Title' }).closest('section')
    const offer = screen.getByRole('region', { name: offerHeading })
    expect(hero?.nextElementSibling).toBe(offer)
    expect(offer.nextElementSibling).toContainElement(screen.getByText('Rich text content'))
    expect(
      within(offer).queryByText(/Planning your wedding or corporate event/),
    ).not.toBeInTheDocument()
  })

  it('does not duplicate the offer when a service page contains multiple pricing blocks', () => {
    render(
      <MemoryRouter>
        <BlockRenderer blocks={[heroBlock, pricingBlock, pricingBlock]} showEnquiryOffer />
      </MemoryRouter>,
    )
    expect(screen.getAllByRole('region', { name: offerHeading })).toHaveLength(1)
  })

  it('does not promote empty pricing tables or ordinary content pages', () => {
    renderBlocks([{ acf_fc_layout: 'pricing_packages', packages: [] }, textBlock])
    expect(screen.queryByRole('region', { name: offerHeading })).not.toBeInTheDocument()
  })

  it('includes proactive guidance in static HTML, outside collapsed details', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BlockRenderer blocks={[pricingBlock, formBlock]} />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(html, 'text/html')
    const offer = document.querySelector(`section[aria-label="${offerHeading}"]`)
    expect(offer?.textContent).toContain('even if they have not asked to contact us yet')
    expect(offer?.textContent).toContain('customer can complete them privately on the website')
    expect(offer?.closest('details')).toBeNull()
    expect(offer?.previousElementSibling?.textContent).toContain('The Essentials')
    expect(offer?.nextElementSibling?.id).toBe('contact-enquiry')
  })

  it('renders a hero block', () => {
    renderBlocks([heroBlock])
    expect(screen.getByRole('heading', { name: 'Hero Title', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Hero tagline')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View Gallery' })).toBeInTheDocument()
  })

  it('renders a text_block', () => {
    renderBlocks([textBlock])
    expect(screen.getByRole('heading', { name: 'Text heading', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Rich text content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Read more/i })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Browse work' })).toBeInTheDocument()
  })

  it('renders a pillar_grid block', () => {
    renderBlocks([pillarBlock])
    expect(screen.getByRole('heading', { name: 'Our Approach', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByText('High quality work')).toBeInTheDocument()
  })

  it('renders an faq_accordion block', () => {
    renderBlocks([faqBlock])
    expect(
      screen.getByRole('heading', { name: 'Frequently Asked Questions', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Do you travel?')).toBeInTheDocument()
    expect(screen.getByText('Yes, throughout Sydney and beyond.')).toBeInTheDocument()
  })

  it('renders a form_block', () => {
    renderBlocks([formBlock])
    expect(screen.getByRole('heading', { name: 'Get in touch', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/i)).toBeInTheDocument()
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

  it('renders a gallery_reference block', () => {
    renderBlocks([galleriesBlock])
    expect(screen.getByRole('heading', { name: 'Cat Gallery', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open image 1 of 2/i })).toBeInTheDocument()
  })

  it('renders a button_group block', () => {
    renderBlocks([buttonGroupBlock])
    expect(screen.getByRole('button', { name: 'Book Now' })).toHaveAttribute(
      'data-href',
      '/contact',
    )
    expect(screen.getByRole('button', { name: 'Learn More' })).toHaveAttribute(
      'data-href',
      '/about',
    )
  })

  it('renders a text_grid block', () => {
    renderBlocks([textGridBlock])
    expect(screen.getByRole('heading', { name: 'Why Choose Us', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /see work/i })).toBeInTheDocument()
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

  it('posts focus-block message to parent when clicking an interactive wrapper', () => {
    const postMessageSpy = vi
      .spyOn(window.parent, 'postMessage')
      .mockImplementation(() => undefined)

    render(
      <MemoryRouter>
        <BlockRenderer blocks={[textBlock]} interactive />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /edit text block block/i }))

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        source: 'sz-preview',
        action: 'focus-block',
        index: 0,
        layoutType: 'text_block',
      },
      '*',
    )

    postMessageSpy.mockRestore()
  })

  it('posts focus-block message when activating interactive wrapper with keyboard', () => {
    const postMessageSpy = vi
      .spyOn(window.parent, 'postMessage')
      .mockImplementation(() => undefined)

    render(
      <MemoryRouter>
        <BlockRenderer blocks={[textBlock]} interactive />
      </MemoryRouter>,
    )

    fireEvent.keyDown(screen.getByRole('button', { name: /edit text block block/i }), {
      key: 'Enter',
    })

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        source: 'sz-preview',
        action: 'focus-block',
        index: 0,
        layoutType: 'text_block',
      },
      '*',
    )

    postMessageSpy.mockRestore()
  })
})
