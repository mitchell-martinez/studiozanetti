import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FormBlock as FormBlockType } from '~/types/wordpress'
import formBlockData from '../__mocks__/formBlock.json'
import FormBlock from '../index'

const mockFetch = vi.fn()
const baseBlock = formBlockData as unknown as FormBlockType

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const renderBlock = (overrides: Partial<FormBlockType> = {}) =>
  render(
    <MemoryRouter initialEntries={['/get-in-touch']}>
      <FormBlock block={{ ...baseBlock, ...overrides }} />
    </MemoryRouter>,
  )

describe('FormBlock', () => {
  it('renders the configured semantic heading and form/submit alignment', () => {
    const { container } = renderBlock({
      heading_tag: 'h3',
      form_alignment: 'center',
      submit_alignment: 'center',
    })

    expect(screen.getByRole('heading', { name: /let's plan your photography/i, level: 3 })).toBeInTheDocument()
    const panel = container.querySelector('section > div > div:last-child') as HTMLElement
    expect(panel.className).toMatch(/formAlignCenter/)
    const submitRow = container.querySelector('form > div:last-child') as HTMLElement
    expect(submitRow.className).toMatch(/submitCenter/)
  })

  it('blocks submission on missing required fields', async () => {
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()

    renderBlock()

    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('submits only pagePath, formId, honeypot, and values', async () => {
    vi.stubGlobal('fetch', mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Thanks for getting in touch.' }),
    }))
    const user = userEvent.setup()

    renderBlock()

    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.type(screen.getByRole('textbox', { name: /^Email/i }), 'mitchell@example.com')
    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    const [, init] = mockFetch.mock.calls[0]
    const body = JSON.parse(init.body as string)

    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(body).toMatchObject({
      pagePath: '/get-in-touch',
      formId: 'contact-enquiry',
      honeypot: '',
      values: expect.objectContaining({
        name: 'Mitchell',
        email: 'mitchell@example.com',
        preferred_contact: 'email',
        privacy_consent: ['consent_contact'],
      }),
    })
    expect(body).not.toHaveProperty('email_to')
    expect(body).not.toHaveProperty('email_subject')
    expect(await screen.findByText('Thanks for getting in touch.')).toBeInTheDocument()
  })

  it('shows server-side field errors returned by the submit route', async () => {
    vi.stubGlobal('fetch', mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: 'Please correct the highlighted fields and try again.',
        fieldErrors: { email: 'Email must be a valid email address.' },
      }),
    }))
    const user = userEvent.setup()

    renderBlock()

    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.type(screen.getByRole('textbox', { name: /^Email/i }), 'mitchell@example.com')
    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText('Email must be a valid email address.')).toBeInTheDocument()
  })
})