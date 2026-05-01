import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/forms', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/forms')>()
  return {
    ...actual,
    getTrustedFormSubmissionConfig: vi.fn(),
  }
})

vi.mock('~/lib/email', () => ({
  sendFormSubmissionEmail: vi.fn(),
}))

vi.mock('~/lib/vsco', () => ({
  sendVscoLead: vi.fn(),
}))

vi.mock('~/lib/rateLimit', () => ({
  consumeRateLimit: vi.fn(() => ({ allowed: true, remaining: 4, retryAfterSeconds: 60 })),
}))

import { sendFormSubmissionEmail } from '~/lib/email'
import { getTrustedFormSubmissionConfig } from '~/lib/forms'
import { consumeRateLimit } from '~/lib/rateLimit'
import { sendVscoLead } from '~/lib/vsco'
import { action } from '../api.forms.submit'

afterEach(() => {
  vi.clearAllMocks()
})

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/forms/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('api.forms.submit action', () => {
  it('ignores frontend-injected recipient and subject fields', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'email',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'email',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
        emailTo: 'attacker@example.com',
        emailSubject: 'Tampered subject',
      }),
      params: {},
      context: {},
    } as never)

    expect(getTrustedFormSubmissionConfig).toHaveBeenCalledWith(
      '/get-in-touch/',
      'contact-enquiry',
    )
    expect(sendFormSubmissionEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'hello@studiozanetti.com.au',
        subject: 'Website enquiry',
      }),
    )
    expect(sendVscoLead).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
  })

  it('returns 400 for malformed payloads', async () => {
    const response = await action({
      request: makeRequest({ formId: 'contact-enquiry', values: {} }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(400)
    expect(getTrustedFormSubmissionConfig).not.toHaveBeenCalled()
  })

  it('returns 404 when the trusted form config is missing', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce(null)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(404)
  })

  it('returns 422 when the trusted form config has incomplete email settings', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'email',
        email_to: '',
        email_subject: '',
        fields: [],
      },
      emailTo: '',
      emailSubject: '',
      deliveryTarget: 'email',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(422)
  })

  it('returns 422 when the payload contains unknown fields', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'email',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'email',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell', injected: 'oops' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(422)
    expect(sendFormSubmissionEmail).not.toHaveBeenCalled()
  })

  it('returns 429 when the caller exceeds the rate limit', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'email',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'email',
      vscoSendEmailNotification: true,
    } as never)
    vi.mocked(consumeRateLimit).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
      resetAt: Date.now() + 42_000,
      limit: 5,
    })

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: {},
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
    expect(sendFormSubmissionEmail).not.toHaveBeenCalled()
  })

  it('returns success immediately for honeypot hits without sending email', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        success_message: 'Thanks for reaching out.',
        delivery_target: 'email',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'email',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        honeypot: 'bot data',
        values: {},
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(200)
    expect(sendFormSubmissionEmail).not.toHaveBeenCalled()
    expect(sendVscoLead).not.toHaveBeenCalled()
    expect(consumeRateLimit).not.toHaveBeenCalled()
  })

  it('sends only to VSCO when delivery target is vsco', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'vsco',
        vsco_job_type: 'Wedding',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: '',
      emailSubject: '',
      deliveryTarget: 'vsco',
      vscoSendEmailNotification: false,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(200)
    expect(sendFormSubmissionEmail).not.toHaveBeenCalled()
    expect(sendVscoLead).toHaveBeenCalledWith(
      expect.objectContaining({
        sendEmailNotification: false,
        fields: expect.objectContaining({
          FirstName: 'Mitchell',
          JobType: 'Wedding',
        }),
      }),
    )
  })

  it('sends to both email and VSCO when delivery target is both', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'both',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        vsco_job_type: 'Wedding',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'both',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(200)
    expect(sendFormSubmissionEmail).toHaveBeenCalledTimes(1)
    expect(sendVscoLead).toHaveBeenCalledTimes(1)
  })

  it('returns success for delivery target both when email fails but VSCO succeeds', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'both',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        vsco_job_type: 'Wedding',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'both',
      vscoSendEmailNotification: true,
    } as never)

    vi.mocked(sendFormSubmissionEmail).mockRejectedValueOnce(new Error('SMTP down'))

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(200)
    expect(sendFormSubmissionEmail).toHaveBeenCalledTimes(1)
    expect(sendVscoLead).toHaveBeenCalledTimes(1)
  })

  it('returns success for delivery target both when VSCO fails but email succeeds', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'both',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        vsco_job_type: 'Wedding',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'both',
      vscoSendEmailNotification: true,
    } as never)

    vi.mocked(sendVscoLead).mockRejectedValueOnce(new Error('VSCO down'))

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(200)
    expect(sendFormSubmissionEmail).toHaveBeenCalledTimes(1)
    expect(sendVscoLead).toHaveBeenCalledTimes(1)
  })

  it('returns success for delivery target both when email is misconfigured but VSCO succeeds', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'both',
        email_to: '',
        email_subject: '',
        vsco_job_type: 'Wedding',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: '',
      emailSubject: '',
      deliveryTarget: 'both',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(200)
    expect(sendFormSubmissionEmail).not.toHaveBeenCalled()
    expect(sendVscoLead).toHaveBeenCalledTimes(1)
  })

  it('returns success for delivery target both when VSCO mapping is invalid but email succeeds', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'both',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'both',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(200)
    expect(sendFormSubmissionEmail).toHaveBeenCalledTimes(1)
    expect(sendVscoLead).not.toHaveBeenCalled()
  })

  it('returns 502 for delivery target both when both channels fail', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'both',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        vsco_job_type: 'Wedding',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'both',
      vscoSendEmailNotification: true,
    } as never)

    vi.mocked(sendFormSubmissionEmail).mockRejectedValueOnce(new Error('SMTP down'))
    vi.mocked(sendVscoLead).mockRejectedValueOnce(new Error('VSCO down'))

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(502)
    expect(sendFormSubmissionEmail).toHaveBeenCalledTimes(1)
    expect(sendVscoLead).toHaveBeenCalledTimes(1)
  })

  it('returns 422 when VSCO mapping misses JobType', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'vsco',
        fields: [
          {
            field_id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            vsco_field_key: 'FirstName',
          },
        ],
      },
      emailTo: '',
      emailSubject: '',
      deliveryTarget: 'vsco',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { name: 'Mitchell' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(422)
    expect(sendFormSubmissionEmail).not.toHaveBeenCalled()
    expect(sendVscoLead).not.toHaveBeenCalled()
  })

  it('returns 422 when the trusted form config is missing the reserved Name field', async () => {
    vi.mocked(getTrustedFormSubmissionConfig).mockResolvedValueOnce({
      page: {
        id: 12,
        slug: 'get-in-touch',
        parent: 0,
        status: 'publish',
        title: { rendered: 'Get in touch' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
      },
      normalizedPagePath: 'get-in-touch',
      form: {
        acf_fc_layout: 'form_block',
        form_id: 'contact-enquiry',
        delivery_target: 'email',
        email_to: 'hello@studiozanetti.com.au',
        email_subject: 'Website enquiry',
        fields: [
          {
            field_id: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            vsco_field_key: 'Email',
          },
        ],
      },
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'Website enquiry',
      deliveryTarget: 'email',
      vscoSendEmailNotification: true,
    } as never)

    const response = await action({
      request: makeRequest({
        pagePath: '/get-in-touch/',
        formId: 'contact-enquiry',
        values: { email: 'mitchell@example.com' },
      }),
      params: {},
      context: {},
    } as never)

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('required Name field'),
    })
    expect(sendFormSubmissionEmail).not.toHaveBeenCalled()
    expect(sendVscoLead).not.toHaveBeenCalled()
  })
})