import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/wordpress', () => ({
  getPageBySlug: vi.fn(),
  getPageByPath: vi.fn(),
}))

import { getPageByPath, getPageBySlug } from '~/lib/wordpress'
import {
  buildVscoLeadSubmissionData,
  buildFormSubmissionEmailText,
  getTrustedFormSubmissionConfig,
  normalizeFormPagePath,
  stripSensitiveFormBlockData,
  validateFormSubmission,
} from '../forms'

afterEach(() => {
  vi.clearAllMocks()
})

const mockFormBlock = {
  acf_fc_layout: 'form_block' as const,
  form_id: 'contact-enquiry',
  heading: 'Get in touch',
  delivery_target: 'both' as const,
  email_to: ' hello@studiozanetti.com.au ',
  email_subject: ' New enquiry from website ',
  vsco_job_type: 'Wedding',
  vsco_source: 'Website Contact Form',
  vsco_send_email_notification: true,
  fields: [
    {
      field_id: 'name',
      label: 'Name',
      type: 'text' as const,
      required: true,
    },
  ],
}

const mockPage = {
  id: 12,
  slug: 'get-in-touch',
  parent: 0,
  status: 'publish',
  title: { rendered: 'Get in touch' },
  content: { rendered: '' },
  excerpt: { rendered: '' },
  acf: {
    blocks: [
      {
        acf_fc_layout: 'text_block' as const,
        heading: 'Intro',
        body: '<p>Text</p>',
      },
      mockFormBlock,
    ],
  },
}

describe('normalizeFormPagePath', () => {
  it('maps root-like inputs to the home slug', () => {
    expect(normalizeFormPagePath('/')).toBe('home')
    expect(normalizeFormPagePath('')).toBe('home')
    expect(normalizeFormPagePath('https://www.studiozanetti.com.au/')).toBe('home')
  })

  it('removes origin, query string, hash, and extra slashes', () => {
    expect(
      normalizeFormPagePath('https://www.studiozanetti.com.au/gallery/pre-wedding-sessions/?a=1#hero'),
    ).toBe('gallery/pre-wedding-sessions')
  })
})

describe('getTrustedFormSubmissionConfig', () => {
  it('resolves recipient and subject from the WordPress form block', async () => {
    vi.mocked(getPageBySlug).mockResolvedValueOnce(mockPage as never)

    const result = await getTrustedFormSubmissionConfig('/get-in-touch/', 'contact-enquiry')

    expect(result).toMatchObject({
      normalizedPagePath: 'get-in-touch',
      emailTo: 'hello@studiozanetti.com.au',
      emailSubject: 'New enquiry from website',
      deliveryTarget: 'both',
      vscoSendEmailNotification: true,
      form: { form_id: 'contact-enquiry' },
    })
    expect(getPageBySlug).toHaveBeenCalledWith('get-in-touch')
    expect(getPageByPath).not.toHaveBeenCalled()
  })

  it('falls back to hierarchical page lookup for nested paths', async () => {
    vi.mocked(getPageBySlug).mockResolvedValueOnce(null)
    vi.mocked(getPageByPath).mockResolvedValueOnce(mockPage as never)

    await getTrustedFormSubmissionConfig('/gallery/pre-wedding-sessions/', 'contact-enquiry')

    expect(getPageBySlug).toHaveBeenCalledWith('gallery/pre-wedding-sessions')
    expect(getPageByPath).toHaveBeenCalledWith('gallery/pre-wedding-sessions')
  })

  it('returns null when the requested form is missing', async () => {
    vi.mocked(getPageBySlug).mockResolvedValueOnce(mockPage as never)

    const result = await getTrustedFormSubmissionConfig('/get-in-touch/', 'pricing-form')

    expect(result).toBeNull()
  })

  it('returns null for blank form ids', async () => {
    const result = await getTrustedFormSubmissionConfig('/get-in-touch/', '   ')

    expect(result).toBeNull()
    expect(getPageBySlug).not.toHaveBeenCalled()
  })
})

describe('stripSensitiveFormBlockData', () => {
  it('removes email delivery settings from public form block data', () => {
    const result = stripSensitiveFormBlockData(mockPage as never)
    const formBlock = result.acf?.blocks?.[1]

    expect(formBlock).toMatchObject({
      acf_fc_layout: 'form_block',
      form_id: 'contact-enquiry',
    })
    expect(formBlock).not.toHaveProperty('email_to')
    expect(formBlock).not.toHaveProperty('email_subject')
    expect(formBlock).not.toHaveProperty('delivery_target')
    expect(formBlock).not.toHaveProperty('vsco_job_type')
    expect(formBlock).not.toHaveProperty('vsco_source')
    expect(formBlock).not.toHaveProperty('vsco_brand')
    expect(formBlock).not.toHaveProperty('vsco_send_email_notification')
  })
})

describe('buildVscoLeadSubmissionData', () => {
  it('maps values to VSCO keys and applies defaults for required VSCO fields', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      delivery_target: 'vsco' as const,
      vsco_job_type: 'Wedding',
      vsco_source: 'Website Contact Form',
      fields: [
        {
          field_id: 'full_name',
          label: 'Full Name',
          type: 'text' as const,
          required: true,
          vsco_field_key: 'Name',
        },
        {
          field_id: 'email',
          label: 'Email',
          type: 'email' as const,
          required: true,
          vsco_field_key: 'Email',
        },
        {
          field_id: 'comments',
          label: 'Comments',
          type: 'textarea' as const,
          vsco_field_key: 'Message',
        },
      ],
    }

    const validated = validateFormSubmission(form as never, {
      full_name: 'Mitchell Martinez',
      email: 'mitchell@example.com',
      comments: 'Would love details for 2027 dates.',
    })

    const data = buildVscoLeadSubmissionData(
      {
        page: mockPage as never,
        normalizedPagePath: 'get-in-touch',
        form: form as never,
        emailTo: '',
        emailSubject: '',
        deliveryTarget: 'vsco',
        vscoSendEmailNotification: true,
      },
      validated,
    )

    expect(data).toMatchObject({
      Name: 'Mitchell Martinez',
      FirstName: 'Mitchell',
      LastName: 'Martinez',
      Email: 'mitchell@example.com',
      JobType: 'Wedding',
      Source: 'Website Contact Form',
      Message: 'Would love details for 2027 dates.',
    })
  })

  it('maps field_id=name to FirstName by default', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      delivery_target: 'vsco' as const,
      fields: [
        {
          field_id: 'name',
          label: 'Your Name',
          type: 'text' as const,
          required: true,
        },
        {
          field_id: 'job_type',
          label: 'Job Type',
          type: 'select' as const,
          required: true,
          vsco_field_key: 'JobType',
          options: [{ label: 'Wedding', value: 'Wedding' }],
        },
      ],
    }

    const validated = validateFormSubmission(form as never, {
      name: 'Mitchell',
      job_type: 'Wedding',
    })

    const data = buildVscoLeadSubmissionData(
      {
        page: mockPage as never,
        normalizedPagePath: 'get-in-touch',
        form: form as never,
        emailTo: '',
        emailSubject: '',
        deliveryTarget: 'vsco',
        vscoSendEmailNotification: true,
      },
      validated,
    )

    expect(data).toMatchObject({
      FirstName: 'Mitchell',
      JobType: 'Wedding',
    })
    expect(data).not.toHaveProperty('name')
  })

  it('throws when JobType cannot be resolved for VSCO', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      delivery_target: 'vsco' as const,
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: true,
          vsco_field_key: 'FirstName',
        },
      ],
    }

    const validated = validateFormSubmission(form as never, {
      name: 'Mitchell',
    })

    expect(() =>
      buildVscoLeadSubmissionData(
        {
          page: mockPage as never,
          normalizedPagePath: 'get-in-touch',
          form: form as never,
          emailTo: '',
          emailSubject: '',
          deliveryTarget: 'vsco',
          vscoSendEmailNotification: true,
        },
        validated,
      ),
    ).toThrow(/JobType/)
  })
})

describe('checkbox group validation and email output', () => {
  it('validates checkbox group options and prints True/False per option in email output', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: true,
        },
        {
          field_id: 'interests',
          label: 'Interests',
          type: 'checkbox' as const,
          required: true,
          options: [
            { label: 'Weddings', value: 'weddings' },
            { label: 'Corporate', value: 'corporate' },
          ],
        },
      ],
      email_to: 'hello@studiozanetti.com.au',
      email_subject: 'Website enquiry',
    }

    const validated = validateFormSubmission(form as never, {
      name: 'Mitchell',
      interests: ['weddings'],
    })

    expect(validated.fieldErrors).toEqual({})
    expect(validated.sanitizedValues.interests).toEqual(['weddings'])

    const text = buildFormSubmissionEmailText(
      {
        page: mockPage as never,
        normalizedPagePath: 'get-in-touch',
        form: form as never,
        emailTo: 'hello@studiozanetti.com.au',
        emailSubject: 'Website enquiry',
        deliveryTarget: 'email',
        vscoSendEmailNotification: true,
      },
      validated,
    )

    expect(text).toContain('- Interests:')
    expect(text).toContain('  - Weddings: True')
    expect(text).toContain('  - Corporate: False')
  })

  it('decodes HTML entities in the page title line of plain-text emails', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: true,
        },
      ],
      email_to: 'hello@studiozanetti.com.au',
      email_subject: 'Website enquiry',
    }

    const validated = validateFormSubmission(form as never, {
      name: 'Mitchell',
    })

    const text = buildFormSubmissionEmailText(
      {
        page: {
          ...mockPage,
          title: { rendered: 'Events &#038; Awards' },
        } as never,
        normalizedPagePath: 'get-in-touch',
        form: form as never,
        emailTo: 'hello@studiozanetti.com.au',
        emailSubject: 'Website enquiry',
        deliveryTarget: 'email',
        vscoSendEmailNotification: true,
      },
      validated,
    )

    expect(text).toContain('Page title: Events & Awards')
  })
})