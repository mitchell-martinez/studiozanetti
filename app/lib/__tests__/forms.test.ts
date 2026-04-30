import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/wordpress', () => ({
  getPageBySlug: vi.fn(),
  getPageByPath: vi.fn(),
}))

import { getPageByPath, getPageBySlug } from '~/lib/wordpress'
import {
  getTrustedFormSubmissionConfig,
  normalizeFormPagePath,
  stripSensitiveFormBlockData,
} from '../forms'

afterEach(() => {
  vi.clearAllMocks()
})

const mockFormBlock = {
  acf_fc_layout: 'form_block' as const,
  form_id: 'contact-enquiry',
  heading: 'Get in touch',
  email_to: ' hello@studiozanetti.com.au ',
  email_subject: ' New enquiry from website ',
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
  })
})