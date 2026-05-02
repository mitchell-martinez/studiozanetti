import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/wordpress', () => ({
  getPageBySlug: vi.fn(),
  getPageByPath: vi.fn(),
}))

import { getPageByPath, getPageBySlug } from '~/lib/wordpress'
import {
  buildVscoLeadSubmissionData,
  buildFormSubmissionEmailText,
  buildSubmitterCopyEmailText,
  getTrustedFormSubmissionConfig,
  normalizeFormPagePath,
  stripSensitiveFormBlockData,
  validateFormConfiguration,
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
      offerSubmitterEmailCopy: false,
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

  it('resolves submitter copy settings from the WordPress form block', async () => {
    vi.mocked(getPageBySlug).mockResolvedValueOnce({
      ...mockPage,
      acf: {
        blocks: [
          {
            acf_fc_layout: 'text_block' as const,
            heading: 'Intro',
            body: '<p>Text</p>',
          },
          {
            ...mockFormBlock,
            offer_submitter_email_copy: true,
            fields: [
              mockFormBlock.fields[0],
              {
                field_id: 'email',
                label: 'Email',
                type: 'email' as const,
                use_for_submitter_copy: true,
              },
            ],
          },
        ],
      },
    } as never)

    const result = await getTrustedFormSubmissionConfig('/get-in-touch/', 'contact-enquiry')

    expect(result).toMatchObject({
      offerSubmitterEmailCopy: true,
      submitterCopyFieldId: 'email',
    })
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
  it('maps canonical reserved Name field values to VSCO keys and applies defaults', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      delivery_target: 'vsco' as const,
      vsco_job_type: 'Wedding',
      vsco_source: 'Website Contact Form',
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: true,
          vsco_field_key: 'FirstName',
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
      name: 'Mitchell',
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
      FirstName: 'Mitchell',
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

  it('throws when the form config is missing the reserved name field', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      delivery_target: 'vsco' as const,
      vsco_job_type: 'Wedding',
      fields: [
        {
          field_id: 'email',
          label: 'Email',
          type: 'email' as const,
          required: true,
          vsco_field_key: 'Email',
        },
      ],
    }

    const validated = validateFormSubmission(form as never, {
      email: 'mitchell@example.com',
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
    ).toThrow(/reserved Name field/i)
  })
})

describe('validateFormConfiguration', () => {
  it('accepts the canonical reserved name field shape', () => {
    expect(validateFormConfiguration(mockFormBlock as never)).toEqual([])
  })

  it('rejects forms without the reserved name field', () => {
    const form = {
      ...mockFormBlock,
      fields: [
        {
          field_id: 'email',
          label: 'Email',
          type: 'email' as const,
          required: true,
          vsco_field_key: 'Email',
        },
      ],
    }

    expect(validateFormConfiguration(form as never)).toContain(
      'The form must include one reserved Name field with Field ID name.',
    )
  })

  it('rejects a reserved name field that is not required', () => {
    const form = {
      ...mockFormBlock,
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: false,
          vsco_field_key: 'FirstName',
        },
      ],
    }

    expect(validateFormConfiguration(form as never)).toContain(
      'The reserved Name field must have Required enabled.',
    )
  })

  it('rejects duplicate reserved name rows', () => {
    const form = {
      ...mockFormBlock,
      fields: [
        ...mockFormBlock.fields,
        {
          field_id: 'name',
          label: 'Full name',
          type: 'text' as const,
          required: true,
          vsco_field_key: 'FirstName',
        },
      ],
    }

    expect(validateFormConfiguration(form as never)).toEqual(
      expect.arrayContaining([
        'Field ID name is duplicated. Field IDs must be unique.',
        'Only one reserved Name field is allowed in a form.',
      ]),
    )
  })

  it('rejects non-name rows that claim the FirstName VSCO mapping', () => {
    const form = {
      ...mockFormBlock,
      fields: [
        mockFormBlock.fields[0],
        {
          field_id: 'first_name_override',
          label: 'First name override',
          type: 'text' as const,
          required: true,
          vsco_field_key: 'FirstName',
        },
      ],
    }

    expect(validateFormConfiguration(form as never)).toEqual(
      expect.arrayContaining([
        'VSCO Field Key FirstName is reserved for the Name field.',
        'The reserved Name field must be the same row that maps to VSCO Field Key FirstName.',
      ]),
    )
  })

  it('rejects multiple rows that explicitly map to FirstName', () => {
    const form = {
      ...mockFormBlock,
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: true,
          vsco_field_key: 'FirstName',
        },
        {
          field_id: 'alternate_name',
          label: 'Alternate name',
          type: 'text' as const,
          required: true,
          vsco_field_key: 'FirstName',
        },
      ],
    }

    expect(validateFormConfiguration(form as never)).toEqual(
      expect.arrayContaining([
        'VSCO Field Key FirstName is reserved for the Name field.',
        'VSCO Field Key FirstName can only be used once in a form.',
      ]),
    )
  })

  it('rejects submitter copy forms without a designated email field', () => {
    const form = {
      ...mockFormBlock,
      offer_submitter_email_copy: true,
      fields: [
        mockFormBlock.fields[0],
        {
          field_id: 'email',
          label: 'Email',
          type: 'email' as const,
        },
      ],
    }

    expect(validateFormConfiguration(form as never)).toContain(
      'Select one Email field to use when submitters request a copy of the form.',
    )
  })

  it('rejects multiple submitter copy email targets', () => {
    const form = {
      ...mockFormBlock,
      fields: [
        mockFormBlock.fields[0],
        {
          field_id: 'email',
          label: 'Email',
          type: 'email' as const,
          use_for_submitter_copy: true,
        },
        {
          field_id: 'alternate_email',
          label: 'Alternate email',
          type: 'email' as const,
          use_for_submitter_copy: true,
        },
      ],
    }

    expect(validateFormConfiguration(form as never)).toContain(
      'Only one Email field can be selected for submitter copy delivery.',
    )
  })
})

describe('submitter copy handling', () => {
  it('prefers the designated email for replyTo and submitter copy delivery', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      offer_submitter_email_copy: true,
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: true,
        },
        {
          field_id: 'billing_email',
          label: 'Billing email',
          type: 'email' as const,
        },
        {
          field_id: 'email',
          label: 'Email',
          type: 'email' as const,
          use_for_submitter_copy: true,
        },
      ],
    }

    const validated = validateFormSubmission(
      form as never,
      {
        name: 'Mitchell',
        billing_email: 'accounts@example.com',
        email: 'mitchell@example.com',
      },
      { requestSubmitterCopy: true },
    )

    expect(validated.replyTo).toBe('mitchell@example.com')
    expect(validated.submitterCopyTo).toBe('mitchell@example.com')
  })

  it('requires the designated email when a submitter copy is requested', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      offer_submitter_email_copy: true,
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: true,
        },
        {
          field_id: 'email',
          label: 'Email',
          type: 'email' as const,
          use_for_submitter_copy: true,
        },
      ],
    }

    const validated = validateFormSubmission(
      form as never,
      {
        name: 'Mitchell',
        email: '',
      },
      { requestSubmitterCopy: true },
    )

    expect(validated.fieldErrors.email).toBe('Email is required to receive a copy of the form.')
  })

  it('builds submitter copy emails without technical metadata', () => {
    const form = {
      acf_fc_layout: 'form_block' as const,
      form_id: 'contact-enquiry',
      heading: 'Get in touch',
      offer_submitter_email_copy: true,
      fields: [
        {
          field_id: 'name',
          label: 'Name',
          type: 'text' as const,
          required: true,
        },
        {
          field_id: 'email',
          label: 'Email',
          type: 'email' as const,
          use_for_submitter_copy: true,
        },
      ],
    }

    const validated = validateFormSubmission(
      form as never,
      {
        name: 'Mitchell',
        email: 'mitchell@example.com',
      },
      { requestSubmitterCopy: true },
    )

    const text = buildSubmitterCopyEmailText(
      {
        page: mockPage as never,
        normalizedPagePath: 'get-in-touch',
        form: form as never,
        emailTo: 'hello@studiozanetti.com.au',
        emailSubject: 'Website enquiry',
        deliveryTarget: 'email',
        offerSubmitterEmailCopy: true,
        submitterCopyFieldId: 'email',
        vscoSendEmailNotification: true,
      },
      validated,
    )

    expect(text).toContain('Here is a copy of the information you sent:')
    expect(text).toContain('- Name: Mitchell')
    expect(text).not.toContain('Page:')
    expect(text).not.toContain('Form ID:')
    expect(text).not.toContain('Page title:')
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