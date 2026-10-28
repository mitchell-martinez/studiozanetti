import { afterEach, expect, it, vi } from 'vitest'
import type { FormBlock, WPPage } from '~/types/wordpress'
import formFixture from '~/components/blocks/FormBlock/__mocks__/formBlock.json'

vi.mock('~/lib/wordpress', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/lib/wordpress')>()),
  getAllPages: vi.fn(),
}))

import { getAllPages } from '~/lib/wordpress'
import { loader } from '../enquiry-links.txt'

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

it('publishes current field maps as plain text without exposing private routing or unavailable forms', async () => {
  vi.stubEnv('SITE_URL', 'https://test.example.com')
  const form = formFixture as FormBlock
  const page: WPPage = {
    id: 1,
    parent: 0,
    slug: 'weddings',
    status: 'publish',
    title: { rendered: 'Weddings' },
    content: { rendered: '' },
    excerpt: { rendered: '' },
    acf: {
      blocks: [form, { ...form, form_id: 'broken', heading: 'Unavailable form', fields: [] }],
    },
  }
  vi.mocked(getAllPages).mockResolvedValueOnce([
    page,
    {
      ...page,
      id: 2,
      slug: 'hidden',
      acf: { container_only: true, blocks: [{ ...form, heading: 'Hidden form' }] },
    },
  ])
  const response = await loader()
  const body = await response.text()
  expect(response.headers.get('Content-Type')).toContain('text/plain')
  expect(body).toContain(
    'URL format: https://test.example.com/weddings?form_id=contact-enquiry&prefill=1&FIELD_ID=',
  )
  expect(body).toContain('No URL fragment is needed')
  expect(body).not.toContain('#contact-enquiry?')
  expect(body).toContain('"email" (email, required)')
  expect(body).toContain('"value":"wedding","label":"Wedding"')
  expect(body).toContain('"value":"consent_contact"')
  expect(body).toContain('It does not submit it')
  expect(body).not.toContain(form.email_to)
  expect(body).not.toContain(form.email_subject)
  expect(body).not.toContain('Unavailable form')
  expect(body).not.toContain('Hidden form')
})
