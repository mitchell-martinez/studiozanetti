import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ImageBlock as ImageBlockType } from '~/types/wordpress'
import baseData from '../__mocks__/imageBlock.json'
import ImageBlock from '../index'

const base = baseData as unknown as ImageBlockType

const renderBlock = (overrides: Partial<ImageBlockType> = {}) =>
  render(<ImageBlock block={{ ...base, ...overrides }} />)

describe('ImageBlock', () => {
  it('renders the image with correct src and alt', () => {
    renderBlock()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', base.image.url)
    expect(img).toHaveAttribute('alt', base.image.alt)
  })

  it('renders the section with aria-label', () => {
    renderBlock({ aria_label: 'Custom label' })
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument()
  })

  it('falls back to static default aria-label when none provided', () => {
    renderBlock({ aria_label: undefined })
    expect(screen.getByLabelText('Full-width image banner')).toBeInTheDocument()
  })

  it('renders overlay text when provided', () => {
    renderBlock({ overlay_text: 'Hello World' })
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('does not render overlay text when not provided', () => {
    renderBlock({ overlay_text: undefined })
    expect(screen.queryByText(base.overlay_text!)).not.toBeInTheDocument()
  })

  // ─── Title & subtitle ───────────────────────────────────────────────────────

  it('renders title when provided', () => {
    renderBlock({ title: 'Our Story' })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Our Story')
  })

  it('does not render title heading when not provided', () => {
    renderBlock({ title: undefined })
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    renderBlock({ subtitle: 'A decade of love' })
    expect(screen.getByText('A decade of love')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    renderBlock({ subtitle: undefined })
    expect(screen.queryByText(base.subtitle!)).not.toBeInTheDocument()
  })

  // ─── Height classes ──────────────────────────────────────────────────────────

  it('applies md height class', () => {
    const { container } = renderBlock({ height: 'md' })
    const section = container.querySelector('section')!
    expect(section.className).toMatch(/heightMd/)
  })

  it('applies lg height class by default', () => {
    const { container } = renderBlock({ height: 'lg' })
    const section = container.querySelector('section')!
    expect(section.className).toMatch(/heightLg/)
  })

  it('applies full height class', () => {
    const { container } = renderBlock({ height: 'full' })
    const section = container.querySelector('section')!
    expect(section.className).toMatch(/heightFull/)
  })

  // ─── Overlay strength ────────────────────────────────────────────────────────

  it('applies light overlay class', () => {
    const { container } = renderBlock({ overlay_strength: 'light' })
    const overlay = container.querySelector('[class*="overlay"]')!
    expect(overlay.className).toMatch(/overlayLight/)
  })

  it('applies medium overlay class', () => {
    const { container } = renderBlock({ overlay_strength: 'medium' })
    const overlay = container.querySelector('section > div[class*="overlay"]')!
    expect(overlay.className).toMatch(/overlayMedium/)
  })

  it('applies strong overlay class', () => {
    const { container } = renderBlock({ overlay_strength: 'strong' })
    const overlay = container.querySelector('section > div[class*="overlay"]')!
    expect(overlay.className).toMatch(/overlayStrong/)
  })

  it('does not render overlay div when strength is not set', () => {
    const { container } = renderBlock({ overlay_strength: undefined, overlay_text: undefined })
    const overlayDivs = container.querySelectorAll('section > div[class*="overlay"]')
    expect(overlayDivs).toHaveLength(0)
  })

  // ─── Text alignment ─────────────────────────────────────────────────────────

  it('applies center alignment by default', () => {
    const { container } = renderBlock()
    const content = container.querySelector('[class*="content"]')!
    expect(content.className).toMatch(/alignCenter/)
  })

  it('applies left alignment when configured', () => {
    const { container } = renderBlock({ text_align: 'left' })
    const content = container.querySelector('[class*="content"]')!
    expect(content.className).toMatch(/alignLeft/)
  })

  it('applies right alignment when configured', () => {
    const { container } = renderBlock({ text_align: 'right' })
    const content = container.querySelector('[class*="content"]')!
    expect(content.className).toMatch(/alignRight/)
  })

  // ─── Image loading (static mode) ────────────────────────────────────────────

  it('sets loading="lazy" on the static image', () => {
    renderBlock()
    const img = screen.getByRole('img')
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('sets decoding="async" on the static image', () => {
    renderBlock()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('decoding', 'async')
  })

  // ─── Static mode ────────────────────────────────────────────────────────────

  it('applies staticImage class by default (parallax off)', () => {
    renderBlock()
    const img = screen.getByRole('img')
    expect(img.tagName).toBe('IMG')
    expect(img.className).toMatch(/staticImage/)
  })

  it('defaults to static mode when parallax_scroll is undefined', () => {
    renderBlock({ parallax_scroll: undefined })
    const img = screen.getByRole('img')
    expect(img.tagName).toBe('IMG')
    expect(img.className).toMatch(/staticImage/)
  })

  // ─── Parallax mode (CSS background-attachment: fixed) ───────────────────────

  it('renders a div with role="img" and parallaxBg class when parallax is on', () => {
    const { container } = renderBlock({ parallax_scroll: true })
    const bg = container.querySelector('[class*="parallaxBg"]')!
    expect(bg).toBeInTheDocument()
    expect(bg.getAttribute('role')).toBe('img')
    expect(bg.getAttribute('aria-label')).toBe(base.image.alt)
  })

  it('sets background-image inline style in parallax mode', () => {
    const { container } = renderBlock({ parallax_scroll: true })
    const bg = container.querySelector('[class*="parallaxBg"]') as HTMLElement
    expect(bg.style.backgroundImage).toContain(base.image.url)
  })

  it('does not render an <img> tag in parallax mode', () => {
    const { container } = renderBlock({ parallax_scroll: true })
    expect(container.querySelector('img')).toBeNull()
  })

  // ─── Aria-label defaults ────────────────────────────────────────────────────

  it('uses "Parallax image" as default aria-label in parallax mode', () => {
    renderBlock({ aria_label: undefined, parallax_scroll: true })
    expect(screen.getByLabelText('Parallax image')).toBeInTheDocument()
  })

  it('uses "Full-width image banner" as default aria-label in static mode', () => {
    renderBlock({ aria_label: undefined, parallax_scroll: false })
    expect(screen.getByLabelText('Full-width image banner')).toBeInTheDocument()
  })

  // ─── Heading tag ─────────────────────────────────────────────────────────────

  it('renders title as h2 by default', () => {
    renderBlock({ title: 'Heading Test' })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Heading Test')
  })

  it('renders title with a custom heading tag', () => {
    renderBlock({ title: 'Custom Tag', heading_tag: 'h3' })
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Custom Tag')
  })

  it('renders title as h1 when configured', () => {
    renderBlock({ title: 'Big Heading', heading_tag: 'h1' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Big Heading')
  })

  // ─── Pop-out effect ──────────────────────────────────────────────────────────

  it('applies popOut class to title when title_pop_out is true', () => {
    const { container } = renderBlock({ title: 'Pop', title_pop_out: true })
    const heading = container.querySelector('[class*="title"]')!
    expect(heading.className).toMatch(/popOut/)
  })

  it('does not apply popOut class to title when title_pop_out is false', () => {
    const { container } = renderBlock({ title: 'No Pop', title_pop_out: false })
    const heading = container.querySelector('[class*="title"]')!
    expect(heading.className).not.toMatch(/popOut/)
  })

  it('applies popOut class to subtitle when subtitle_pop_out is true', () => {
    const { container } = renderBlock({ subtitle: 'Pop Sub', subtitle_pop_out: true })
    const sub = container.querySelector('[class*="subtitle"]')!
    expect(sub.className).toMatch(/popOut/)
  })

  // ─── Text max width ─────────────────────────────────────────────────────────

  it('applies textNarrow class for narrow text width', () => {
    const { container } = renderBlock({ title: 'T', text_max_width: 'narrow' })
    const content = container.querySelector('[class*="content"]')!
    expect(content.className).toMatch(/textNarrow/)
  })

  it('applies textSemiNarrow class for semi-narrow text width', () => {
    const { container } = renderBlock({ title: 'T', text_max_width: 'semi-narrow' })
    const content = container.querySelector('[class*="content"]')!
    expect(content.className).toMatch(/textSemiNarrow/)
  })

  it('applies textWide class for wide text width', () => {
    const { container } = renderBlock({ title: 'T', text_max_width: 'wide' })
    const content = container.querySelector('[class*="content"]')!
    expect(content.className).toMatch(/textWide/)
  })

  it('applies textFull class for full text width', () => {
    const { container } = renderBlock({ title: 'T', text_max_width: 'full' })
    const content = container.querySelector('[class*="content"]')!
    expect(content.className).toMatch(/textFull/)
  })

  it('applies textNormal class by default', () => {
    const { container } = renderBlock({ title: 'T' })
    const content = container.querySelector('[class*="content"]')!
    expect(content.className).toMatch(/textNormal/)
  })

  // ─── Heading opacity + image shadow ───────────────────────────────────────

  it('sets --heading-opacity CSS variable from heading_opacity', () => {
    const { container } = renderBlock({ title: 'Opacity test', heading_opacity: 0.55 })
    const content = container.querySelector('[class*="content"]') as HTMLElement
    expect(content.style.getPropertyValue('--heading-opacity')).toBe('0.55')
  })

  it('clamps heading_opacity to 1 when value is above range', () => {
    const { container } = renderBlock({ title: 'Opacity clamp', heading_opacity: 1.5 })
    const content = container.querySelector('[class*="content"]') as HTMLElement
    expect(content.style.getPropertyValue('--heading-opacity')).toBe('1')
  })

  it('renders image shadow layer and sets its strength variable', () => {
    const { container } = renderBlock({ image_shadow_strength: 0.3 })
    const shadow = container.querySelector('[class*="imageShadow"]') as HTMLElement
    expect(shadow).toBeInTheDocument()
    expect(shadow.style.getPropertyValue('--image-shadow-opacity')).toBe('0.3')
  })

  it('does not render image shadow layer when strength is zero', () => {
    const { container } = renderBlock({ image_shadow_strength: 0 })
    expect(container.querySelector('[class*="imageShadow"]')).toBeNull()
  })

  // ─── Corporate colour theme ─────────────────────────────────────────────────

  it('applies corporate class when color_theme is corporate', () => {
    const { container } = renderBlock({ color_theme: 'corporate' })
    const section = container.querySelector('section')!
    expect(section.className).toMatch(/corporate/)
  })

  it('does not apply corporate class when color_theme is default', () => {
    const { container } = renderBlock({ color_theme: 'default' })
    const section = container.querySelector('section')!
    expect(section.className).not.toMatch(/corporate/)
  })

  it('does not apply corporate class when color_theme is undefined', () => {
    const { container } = renderBlock({ color_theme: undefined })
    const section = container.querySelector('section')!
    expect(section.className).not.toMatch(/corporate/)
  })
})
