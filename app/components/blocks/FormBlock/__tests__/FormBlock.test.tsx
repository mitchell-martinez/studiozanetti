import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AnalyticsProvider from '~/components/AnalyticsProvider'
import PricingPackagesBlock from '~/components/blocks/PricingPackagesBlock'
import type { FormBlock as FormBlockType } from '~/types/wordpress'
import formBlockData from '../__mocks__/formBlock.json'
import FormBlock from '../index'

const mockFetch = vi.fn()
const mockSendBeacon = vi.fn<(url: string, data?: BodyInit | null) => boolean>(() => true)
const baseBlock = formBlockData as unknown as FormBlockType
const fallbackEmail = 'info@studiozanetti.com.au'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const renderBlock = (
  overrides: Partial<FormBlockType> = {},
  initialEntries: string[] = ['/get-in-touch'],
) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <FormBlock block={{ ...baseBlock, ...overrides }} />
    </MemoryRouter>,
  )

const renderTrackedBlock = () =>
  render(
    <MemoryRouter initialEntries={['/get-in-touch']}>
      <AnalyticsProvider
        page={{
          pagePath: '/get-in-touch',
          pageId: 12,
          siteGroup: 'weddings',
          hasPricingBlock: false,
          hasFormBlock: true,
          contextToken: 'a'.repeat(64),
        }}
      >
        <FormBlock block={baseBlock} />
      </AnalyticsProvider>
    </MemoryRouter>,
  )

const renderPackageSelection = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PricingPackagesBlock
        block={{
          acf_fc_layout: 'pricing_packages',
          packages: ['wedding', 'family'].map((service) => ({
            name: service,
            cta_text: `Select ${service}`,
            cta_url: `/get-in-touch?form_id=contact-enquiry&service_type=${service}#contact-enquiry`,
          })),
        }}
      />
      <FormBlock block={baseBlock} />
    </MemoryRouter>,
  )

describe('FormBlock', () => {
  it('offers a concise accessible guide link without inline technical instructions', () => {
    renderBlock()
    expect(screen.getByRole('form', { name: /let's plan your photography/i })).toBeInTheDocument()
    expect(screen.queryByText('Enquiring with an AI assistant?')).not.toBeInTheDocument()
    expect(screen.queryByText(/AI assistants may complete and submit/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AI enquiry link guide' })).toHaveAttribute(
      'href',
      '/enquiry-links.txt',
    )
    expect(screen.getByRole('link', { name: 'AI enquiry link guide' })).toBeVisible()
    expect(
      screen.queryByRole('link', { name: 'prefilled enquiry link guide' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^Name/i })).toBeRequired()
    expect(screen.getByRole('textbox', { name: /^Email/i })).toBeRequired()
    expect(screen.getByRole('textbox', { name: /mobile number/i })).not.toBeRequired()
  })

  it('requires an optional email before submission when a copy is requested', async () => {
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()
    renderBlock({
      fields: baseBlock.fields.map((field) =>
        field.type === 'email' ? { ...field, required: false } : field,
      ),
    })

    const email = screen.getByRole('textbox', { name: /^Email/i })
    expect(email).not.toBeRequired()
    await user.click(screen.getByLabelText(/Receive a copy of this form to my email/i))
    expect(email).toBeRequired()
    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(
      await screen.findByText('Email is required to receive a copy of the form.'),
    ).toBeVisible()
    expect(mockFetch).not.toHaveBeenCalled()
    await user.click(screen.getByLabelText(/Receive a copy of this form to my email/i))
    expect(email).not.toBeRequired()
  })

  it('prefills matching fields from the URL query string for the targeted form', () => {
    renderBlock({}, ['/get-in-touch?form_id=contact-enquiry&service_type=family#contact-enquiry'])

    expect(screen.getByRole('combobox', { name: /service type/i })).toHaveValue('family')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('reapplies a package button at the same URL and preserves entered contact details', async () => {
    const user = userEvent.setup()
    renderPackageSelection(
      '/get-in-touch?form_id=contact-enquiry&service_type=wedding#contact-enquiry',
    )
    const service = screen.getByRole('combobox', { name: /service type/i })
    const name = screen.getByRole('textbox', { name: /^Name/i })
    await user.type(name, 'Alex')
    await user.selectOptions(service, 'family')
    await user.click(screen.getByRole('link', { name: 'Select wedding' }))
    expect(service).toHaveValue('wedding')
    expect(name).toHaveValue('Alex')
    await user.click(screen.getByRole('link', { name: 'Select family' }))
    expect(service).toHaveValue('family')
    expect(name).toHaveValue('Alex')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it.each([
    '/get-in-touch?form_id=contact-enquiry&prefill=1&name=Alex&email=alex%40example.com&service_type=wedding',
    '/get-in-touch#contact-enquiry?name=Alex&email=alex%40example.com&service_type=wedding',
  ])(
    'preserves a personal enquiry draft when a pricing button changes the package: %s',
    async (url) => {
      const user = userEvent.setup()
      renderPackageSelection(url)
      await user.click(screen.getByRole('link', { name: 'Select family' }))
      expect(screen.getByRole('combobox', { name: /service type/i })).toHaveValue('family')
      expect(screen.getByRole('textbox', { name: /^Name/i })).toHaveValue('Alex')
      expect(screen.getByRole('textbox', { name: /^Email/i })).toHaveValue('alex@example.com')
    },
  )

  it.each(['?form_id=contact-enquiry&prefill=1&', '#contact-enquiry?'])(
    'fills personal details without submitting or filling hidden controls: %s',
    async (prefix) => {
      vi.stubGlobal('fetch', mockFetch)
      renderBlock({}, [
        `/get-in-touch${prefix}name=Zo%C3%AB%20%26%20Alex&email=zoe%2Bevents%40example.com&phone=%2B61%20412%20345%20678&comments=Line%201%0ALine%202&service_type=family&submit=true&website=spam&company=spam&requestSubmitterCopy=true`,
      ])

      await waitFor(() =>
        expect(screen.getByRole('textbox', { name: /^Name/i })).toHaveValue('Zoë & Alex'),
      )
      expect(screen.getByRole('textbox', { name: /^Email/i })).toHaveValue('zoe+events@example.com')
      expect(screen.getByRole('textbox', { name: /mobile number/i })).toHaveValue('+61 412 345 678')
      expect(screen.getByRole('textbox', { name: /any other comments/i })).toHaveValue(
        'Line 1\nLine 2',
      )
      expect(screen.getByRole('combobox', { name: /service type/i })).toHaveValue('family')
      expect(screen.getByRole('status')).toHaveTextContent('review and complete the form')
      expect(screen.getByLabelText('Website')).toHaveValue('')
      expect(screen.getByLabelText('Company')).toHaveValue('')
      expect(screen.getByLabelText(/Receive a copy of this form/i)).not.toBeChecked()
      expect(mockFetch).not.toHaveBeenCalled()
    },
  )

  it.each(['?form_id=corporate-enquiry&prefill=1&name=Alex', '#corporate-enquiry?name=Alex'])(
    'targets one block on a page containing multiple forms: %s',
    async (suffix) => {
      render(
        <MemoryRouter initialEntries={[`/get-in-touch${suffix}`]}>
          <FormBlock
            block={{ ...baseBlock, form_id: 'wedding-enquiry', heading: 'Wedding enquiry' }}
          />
          <FormBlock
            block={{ ...baseBlock, form_id: 'corporate-enquiry', heading: 'Corporate enquiry' }}
          />
        </MemoryRouter>,
      )
      const forms = screen.getAllByRole('form')
      await waitFor(() => expect(forms[1].querySelector('[name="name"]')).toHaveValue('Alex'))
      expect(forms[0].querySelector('[name="name"]')).toHaveValue('')
    },
  )

  it.each(['?form_id=contact-enquiry&prefill=1&', '#contact-enquiry?'])(
    'applies a new draft during same-page navigation without overwriting later edits: %s',
    async (prefix) => {
      const user = userEvent.setup()
      const Navigation = () => {
        const navigate = useNavigate()
        return (
          <button onClick={() => navigate(`/get-in-touch${prefix}name=Second`)}>
            Open another enquiry link
          </button>
        )
      }
      render(
        <MemoryRouter
          initialEntries={[`/get-in-touch${prefix}name=First&email=first%40example.com`]}
        >
          <Navigation />
          <FormBlock block={baseBlock} />
        </MemoryRouter>,
      )
      const name = screen.getByRole('textbox', { name: /^Name/i })
      await waitFor(() => expect(name).toHaveValue('First'))
      await user.clear(name)
      await user.type(name, 'Edited')
      expect(name).toHaveValue('Edited')
      await user.click(screen.getByRole('button', { name: /Open another enquiry link/ }))
      await waitFor(() => expect(name).toHaveValue('Second'))
      expect(screen.getByRole('textbox', { name: /^Email/i })).toHaveValue('')
    },
  )

  it('uses form_id as the section anchor id', () => {
    const { container } = renderBlock()

    expect(container.querySelector(`section#${baseBlock.form_id}`)).toBeInTheDocument()
  })

  it('renders the configured semantic heading and form/submit alignment', () => {
    const { container } = renderBlock({
      heading_tag: 'h3',
      form_alignment: 'center',
      submit_alignment: 'center',
    })

    expect(
      screen.getByRole('heading', { name: /let's plan your photography/i, level: 3 }),
    ).toBeInTheDocument()
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
    const genericError = await screen.findByRole('alert')
    expect(genericError).toHaveTextContent('Please correct the highlighted fields and try again.')
    expect(genericError.closest('form')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('disables and greys out submit button while submitting', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch.mockImplementation(() => new Promise(() => {})),
    )
    const user = userEvent.setup()

    renderBlock()

    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.type(screen.getByRole('textbox', { name: /^Email/i }), 'mitchell@example.com')
    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))

    await user.click(screen.getByRole('button', { name: /send message/i }))

    const submittingButton = screen.getByRole('button', { name: /sending/i })
    expect(submittingButton).toBeDisabled()
  })

  it('submits only pagePath, formId, honeypot, and values and hides fields on success', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          emailDelivered: true,
          message: 'Thanks for getting in touch.',
        }),
      }),
    )
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
      requestSubmitterCopy: false,
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
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /^Email/i })).not.toBeInTheDocument()
  })

  it('tracks one form start and a confirmed successful submission', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: mockSendBeacon })
    vi.stubGlobal(
      'fetch',
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, emailDelivered: true }),
      }),
    )
    const user = userEvent.setup()

    renderTrackedBlock()
    await waitFor(() => expect(mockSendBeacon).toHaveBeenCalledTimes(1))

    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.type(screen.getByRole('textbox', { name: /^Email/i }), 'mitchell@example.com')

    const startedEvents = mockSendBeacon.mock.calls
      .map(([, body]) => JSON.parse(body as string))
      .filter((event) => event.eventType === 'form_start')
    expect(startedEvents).toHaveLength(1)

    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      const eventTypes = mockSendBeacon.mock.calls.map(
        ([, body]) => JSON.parse(body as string).eventType,
      )
      expect(eventTypes).toContain('form_submit')
    })
    const submissionBody = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string)
    expect(submissionBody.visitContext).toMatchObject({
      sourceCategory: 'direct',
      landingPage: '/get-in-touch',
      pagesViewed: 1,
    })
    expect(submissionBody.visitContext.siteDurationSeconds).toBeGreaterThanOrEqual(0)
    expect(submissionBody.visitContext.pageDurationSeconds).toBeGreaterThanOrEqual(0)
  })

  it('keeps the enquiry available when an HTTP 200 response does not confirm success', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, message: 'Misleading success message' }),
      }),
    )
    const user = userEvent.setup()
    renderBlock()

    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.type(screen.getByRole('textbox', { name: /^Email/i }), 'mitchell@example.com')
    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not send your message')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('Misleading success message')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^Name/i })).toHaveValue('Mitchell')
    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled()
  })

  it('does not track a submission when the API did not deliver an email', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: mockSendBeacon })
    vi.stubGlobal(
      'fetch',
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, emailDelivered: false }),
      }),
    )
    const user = userEvent.setup()

    renderTrackedBlock()
    await waitFor(() => expect(mockSendBeacon).toHaveBeenCalledTimes(1))

    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.type(screen.getByRole('textbox', { name: /^Email/i }), 'mitchell@example.com')
    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText('Thanks. Your message has been sent.')).toBeInTheDocument()
    const eventTypes = mockSendBeacon.mock.calls.map(
      ([, body]) => JSON.parse(body as string).eventType,
    )
    expect(eventTypes).not.toContain('form_submit')
  })

  it('tracks a new start when a reused block renders a different form', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: mockSendBeacon })
    const user = userEvent.setup()
    const trackedPage = {
      pagePath: '/get-in-touch',
      pageId: 12,
      siteGroup: 'weddings',
      hasPricingBlock: false,
      hasFormBlock: true,
      contextToken: 'a'.repeat(64),
    }
    const { rerender } = render(
      <MemoryRouter initialEntries={['/get-in-touch']}>
        <AnalyticsProvider page={trackedPage}>
          <FormBlock block={baseBlock} />
        </AnalyticsProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/^Name/i), 'First')
    rerender(
      <MemoryRouter initialEntries={['/get-in-touch']}>
        <AnalyticsProvider page={trackedPage}>
          <FormBlock block={{ ...baseBlock, form_id: 'second-enquiry' }} />
        </AnalyticsProvider>
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText(/^Name/i), ' Second')

    const startedEvents = mockSendBeacon.mock.calls
      .map(([, body]) => JSON.parse(body as string))
      .filter((event) => event.eventType === 'form_start')
    expect(startedEvents.map((event) => event.formId)).toEqual([
      baseBlock.form_id,
      'second-enquiry',
    ])
  })

  it('submits requestSubmitterCopy when the generated checkbox is selected', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Thanks for getting in touch.' }),
      }),
    )
    const user = userEvent.setup()

    renderBlock()

    await user.click(screen.getByLabelText(/receive a copy of this form to my email/i))
    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.type(screen.getByRole('textbox', { name: /^Email/i }), 'mitchell@example.com')
    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    const [, init] = mockFetch.mock.calls[0]
    const body = JSON.parse(init.body as string)

    expect(body.requestSubmitterCopy).toBe(true)
  })

  it('shows server-side field errors returned by the submit route', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          error: 'Please correct the highlighted fields and try again.',
          fieldErrors: { email: 'Email must be a valid email address.' },
        }),
      }),
    )
    const user = userEvent.setup()

    renderBlock()

    await user.type(screen.getByLabelText(/^Name/i), 'Mitchell')
    await user.type(screen.getByRole('textbox', { name: /^Email/i }), 'mitchell@example.com')
    await user.click(screen.getByRole('radio', { name: /^Email$/i }))
    await user.click(screen.getByLabelText(/I agree to be contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText('Email must be a valid email address.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: fallbackEmail })).toHaveAttribute(
      'href',
      `mailto:${fallbackEmail}`,
    )
  })

  it('clears and re-shows the generic submit error on repeated invalid submits', async () => {
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()

    renderBlock()

    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please correct the highlighted fields and try again.',
    )

    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please correct the highlighted fields and try again.',
    )
  })

  it('fails closed when the required reserved Name field is missing from the form config', () => {
    renderBlock({
      fields: baseBlock.fields.filter((field) => field.field_id !== 'name'),
    })

    expect(
      screen.getByText('This form is unavailable right now while its settings are fixed.', {
        exact: false,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: fallbackEmail })).toHaveAttribute(
      'href',
      `mailto:${fallbackEmail}`,
    )
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument()
  })

  it('renders number fields with a minimum of zero and keeps selects native', () => {
    renderBlock()

    expect(screen.getByRole('spinbutton', { name: /how many attendees/i })).toHaveAttribute(
      'min',
      '0',
    )
    expect(screen.getByRole('combobox', { name: /service type/i })).toBeInTheDocument()
  })
})
