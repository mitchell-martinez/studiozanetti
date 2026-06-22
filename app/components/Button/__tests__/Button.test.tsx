import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import Button from '../index'

const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Button', () => {
  // ─── Element selection ────────────────────────────────────────────────────

  it('renders a <button> when no href is provided', () => {
    wrap(<Button>Click</Button>)
    expect(screen.getByRole('button', { name: /click/i })).toBeInTheDocument()
  })

  it('renders a semantic <button> for an internal href', () => {
    wrap(<Button href="/about">About</Button>)
    const button = screen.getByRole('button', { name: /about/i })
    expect(button).toHaveAttribute('data-href', '/about')
  })

  it('renders a semantic <button> for an external href', () => {
    wrap(<Button href="https://example.com">External</Button>)
    const button = screen.getByRole('button', { name: /external/i })
    expect(button).toHaveAttribute('data-href', 'https://example.com')
  })

  it('renders a semantic <button> when openInNewTab is true', () => {
    wrap(<Button href="/internal" openInNewTab>New Tab</Button>)
    expect(screen.getByRole('button', { name: /new tab/i })).toBeInTheDocument()
  })

  // ─── Variant classes ──────────────────────────────────────────────────────

  it('applies primary variant by default', () => {
    wrap(<Button>Primary</Button>)
    expect(screen.getByRole('button').className).toMatch(/primary/)
  })

  it.each(['primary', 'secondary', 'outline', 'dark', 'text'] as const)(
    'applies %s variant class',
    (variant) => {
      wrap(<Button variant={variant}>Label</Button>)
      expect(screen.getByRole('button').className).toMatch(new RegExp(variant))
    },
  )

  // ─── Size classes ─────────────────────────────────────────────────────────

  it('applies md size by default', () => {
    wrap(<Button>Md</Button>)
    expect(screen.getByRole('button').className).toMatch(/sizeMd/)
  })

  it.each(['sm', 'md', 'lg'] as const)('applies %s size class', (size) => {
    const sizeClassMap = { sm: /sizeSm/, md: /sizeMd/, lg: /sizeLg/ }
    wrap(<Button size={size}>Label</Button>)
    expect(screen.getByRole('button').className).toMatch(sizeClassMap[size])
  })

  // ─── Modifiers ────────────────────────────────────────────────────────────

  it('applies inverted class when inverted is true', () => {
    wrap(<Button inverted>Inv</Button>)
    expect(screen.getByRole('button').className).toMatch(/inverted/)
  })

  it('does not apply inverted class by default', () => {
    wrap(<Button>Normal</Button>)
    expect(screen.getByRole('button').className).not.toMatch(/inverted/)
  })

  it('applies fullWidth class when fullWidth is true', () => {
    wrap(<Button fullWidth>Wide</Button>)
    expect(screen.getByRole('button').className).toMatch(/fullWidth/)
  })

  it('passes through a custom className', () => {
    wrap(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })

  // ─── Accessibility ────────────────────────────────────────────────────────

  it('sets aria-label when provided', () => {
    wrap(<Button ariaLabel="Close dialog">×</Button>)
    expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument()
  })

  // ─── onClick ──────────────────────────────────────────────────────────────

  it('fires onClick for a <button>', async () => {
    const fn = vi.fn()
    const { user } = await import('@testing-library/user-event').then((m) => ({
      user: m.default.setup(),
    }))
    wrap(<Button onClick={fn}>Press</Button>)
    await user.click(screen.getByRole('button'))
    expect(fn).toHaveBeenCalledOnce()
  })

  it('stores studiozanetti absolute URLs as same-tab navigation targets', () => {
    wrap(<Button href="https://studiozanetti.com.au/contact">Contact</Button>)
    const button = screen.getByRole('button', { name: /contact/i })
    expect(button).toHaveAttribute('data-href', 'https://studiozanetti.com.au/contact')
  })

  it('stores studiozanetti subdomain absolute URLs as same-tab navigation targets', () => {
    wrap(<Button href="https://blog.studiozanetti.com.au/article">Article</Button>)
    const button = screen.getByRole('button', { name: /article/i })
    expect(button).toHaveAttribute('data-href', 'https://blog.studiozanetti.com.au/article')
  })

  // ─── button type ──────────────────────────────────────────────────────────

  it('sets type="button" by default', () => {
    wrap(<Button>Btn</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('allows overriding button type to submit', () => {
    wrap(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('supports disabled state for native button usage', () => {
    wrap(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled()
  })
})
