import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import Contact, { action } from '../contact'

const renderContact = () => {
  const router = createMemoryRouter(
    [{ path: '/', element: <Contact />, action, loader: () => ({ page: null }) }],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
}

describe('Contact route', () => {
  it('renders the page heading', async () => {
    renderContact()
    expect(
      await screen.findByRole('heading', { name: 'Contact', level: 1 }),
    ).toBeInTheDocument()
  })

  it('renders all form fields', async () => {
    renderContact()
    expect(await screen.findByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('renders contact information', async () => {
    renderContact()
    expect(await screen.findByText('hello@studiozanetti.com')).toBeInTheDocument()
    expect(screen.getByText(/Florence/i)).toBeInTheDocument()
  })

  it('shows validation errors after empty submission', async () => {
    const user = userEvent.setup()
    renderContact()
    await user.click(await screen.findByRole('button', { name: /send message/i }))
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })
  })

  it('clears field error when user starts typing', async () => {
    const user = userEvent.setup()
    renderContact()
    // Submit empty to trigger errors
    await user.click(await screen.findByRole('button', { name: /send message/i }))
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0))
    // Start typing in the name field — its error should disappear
    await user.type(screen.getByLabelText(/full name/i), 'Marco')
    await waitFor(() => expect(screen.queryByText('Name is required.')).not.toBeInTheDocument())
  })

  it('shows success message when form is submitted with valid data', async () => {
    const user = userEvent.setup()
    renderContact()
    await user.type(await screen.findByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
    expect(screen.getByText(/message sent/i)).toBeInTheDocument()
  })
})
