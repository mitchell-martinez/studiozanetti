import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HeroBlock as HeroBlockType } from '~/types/wordpress'
import HeroBlock from '../index'

const baseSlides = [
  {
    url: 'https://picsum.photos/seed/hero-1/1600/900',
    alt: 'Hero slide one',
    width: 1600,
    height: 900,
  },
  {
    url: 'https://picsum.photos/seed/hero-2/1600/900',
    alt: 'Hero slide two',
    width: 1600,
    height: 900,
  },
  {
    url: 'https://picsum.photos/seed/hero-3/1600/900',
    alt: 'Hero slide three',
    width: 1600,
    height: 900,
  },
]

const buildBlock = (overrides: Partial<HeroBlockType> = {}): HeroBlockType => ({
  acf_fc_layout: 'hero',
  title: 'Hero title',
  overlay_strength: 'medium',
  slides: baseSlides,
  auto_rotate_seconds: 2,
  show_slide_dots: true,
  ...overrides,
})

afterEach(() => {
  vi.useRealTimers()
})

describe('HeroBlock', () => {
  it('renders absolute Studio Zanetti CTA URLs as same-tab internal button targets', () => {
    vi.stubEnv('SITE_URL', 'https://studiozanetti.com.au')

    render(
      <MemoryRouter>
        <HeroBlock
          block={buildBlock({
            cta_text: 'Enquire now',
            cta_url: 'https://studiozanetti.mitchellmartinez.tech/contact?src=hero#form',
          })}
        />
      </MemoryRouter>,
    )

    const button = screen.getByRole('button', { name: /enquire now/i })
    expect(button).toHaveAttribute('data-href', '/contact?src=hero#form')
    expect(button).not.toHaveAttribute('target', '_blank')
  })

  it('renders one visible active slide by default', () => {
    const { container } = render(<HeroBlock block={buildBlock()} />)

    const images = Array.from(container.querySelectorAll('img'))
    expect(images).toHaveLength(3)
    expect(images.filter((img) => img.className.includes('heroImageActive'))).toHaveLength(1)
  })

  it('keeps a visible active slide when slide count shrinks after navigation', () => {
    vi.useFakeTimers()

    const { container, rerender } = render(<HeroBlock block={buildBlock()} />)

    // Advance to a non-zero slide first, then simulate navigation to a hero
    // with fewer slides.
    act(() => {
      vi.advanceTimersByTime(4_100)
    })

    rerender(
      <HeroBlock
        block={buildBlock({
          slides: [baseSlides[0]],
        })}
      />,
    )

    const images = Array.from(container.querySelectorAll('img'))
    expect(images).toHaveLength(1)
    expect(images[0].className).toContain('heroImageActive')
  })
})
