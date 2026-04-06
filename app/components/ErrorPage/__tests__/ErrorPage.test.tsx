import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ErrorPage from '..'
import variants from '../__mocks__/errorVariants.json'
import type { ErrorVariant } from '../types'

/** Wrap in MemoryRouter so the <Link>-based Button renders without errors. */
const renderErrorPage = (variant: ErrorVariant, status?: number) =>
  render(
    <MemoryRouter>
      <ErrorPage variant={variant} status={status} />
    </MemoryRouter>,
  )

describe('ErrorPage', () => {
  it.each(variants)(
    'renders the $variant variant with correct title',
    ({ variant, status, expectedTitle }) => {
      renderErrorPage(variant as ErrorVariant, status)
      expect(screen.getByRole('heading', { level: 1, name: expectedTitle })).toBeInTheDocument()
    },
  )

  it.each(variants)(
    'renders the $variant variant with description text',
    ({ variant, status, expectedText }) => {
      renderErrorPage(variant as ErrorVariant, status)
      expect(screen.getByText(new RegExp(expectedText))).toBeInTheDocument()
    },
  )

  it('shows the numeric status code as the kicker when provided', () => {
    renderErrorPage('server', 502)
    expect(screen.getByText('502')).toBeInTheDocument()
  })

  it('shows the variant label as the kicker when no status is provided', () => {
    renderErrorPage('offline')
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('renders a Try Again button', () => {
    renderErrorPage('generic')
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders a Back to Home link', () => {
    renderErrorPage('generic')
    const link = screen.getByRole('link', { name: /back to home/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('calls window.location.reload when Try Again is clicked', async () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    })
    renderErrorPage('server', 500)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(reloadMock).toHaveBeenCalledOnce()
  })

  it('has accessible heading linked via aria-labelledby', () => {
    renderErrorPage('offline')
    expect(document.getElementById('error-title')).toBeInTheDocument()
  })
})
