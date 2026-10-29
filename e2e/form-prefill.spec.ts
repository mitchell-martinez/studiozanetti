import { expect, test } from '@playwright/test'

test('a personal enquiry link fills the form after hydration and sends only on submit', async ({
  page,
}) => {
  const details = {
    name: 'Zoë & Alex',
    email: 'zoe+events@example.com',
    phone: '+61 412 345 678',
    event_date: '2027-11-14',
    service_type: 'wedding',
    preferred_contact: 'email',
    comments: 'Wedding enquiry: café & flowers\nPlease send a quote.',
    privacy_consent: 'consent_contact',
  }
  const submissions: Record<string, unknown>[] = []
  const hydrationErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydration|hydrating|didn't match/i.test(message.text())) {
      hydrationErrors.push(message.text())
    }
  })
  await page.route('**/api/forms/submit', async (route) => {
    submissions.push(route.request().postDataJSON())
    await route.fulfill({
      json: { success: true, emailDelivered: true, message: 'Test enquiry received.' },
    })
  })

  const response = await page.goto(
    `/local-lab?form_id=contact-enquiry&prefill=1&${new URLSearchParams(details)}`,
    {
      waitUntil: 'domcontentloaded',
    },
  )
  expect(new URL(response!.request().url()).searchParams.get('name')).toBe(details.name)
  expect(new URL(page.url()).hash).toBe('')
  await expect(page.getByRole('link', { name: 'AI enquiry link guide' })).toBeVisible()
  await expect(page.getByText(/using your AI assistant/i)).toHaveCount(0)
  await expect(page.getByText('Enquiring with an AI assistant?', { exact: true })).toHaveCount(0)
  await expect(page.locator('head link[rel="describedby"][href="/enquiry-links.txt"]')).toHaveCount(
    1,
  )
  expect(response!.headers().link).toContain('</enquiry-links.txt>; rel="describedby"')
  const form = page.getByRole('form', { name: /let's plan your photography/i })
  await expect(form.getByRole('textbox', { name: /^Name/i })).toHaveValue(details.name)
  await expect(form.getByRole('textbox', { name: /^Email/i })).toHaveValue(details.email)
  await expect(form.getByRole('textbox', { name: /mobile number/i })).toHaveValue(details.phone)
  await expect(form.getByRole('textbox', { name: /any other comments/i })).toHaveValue(
    details.comments,
  )
  await expect(form.getByRole('combobox', { name: /service type/i })).toHaveValue('wedding')
  await expect(form.getByRole('checkbox', { name: /I agree to be contacted/i })).toBeChecked()
  await expect(form.getByRole('checkbox', { name: /occasional updates/i })).not.toBeChecked()
  await expect(page.getByText(/details provided in your link/)).toBeVisible()
  expect(submissions).toHaveLength(0)
  expect(hydrationErrors).toEqual([])

  await form.getByRole('button', { name: /send message/i }).click()
  await expect(page.getByText('Test enquiry received.')).toBeVisible()
  expect(submissions).toHaveLength(1)
  expect(submissions[0]).toMatchObject({
    pagePath: '/local-lab',
    formId: 'contact-enquiry',
    honeypot: '',
    honeypotSecondary: '',
    requestSubmitterCopy: false,
    values: { ...details, privacy_consent: ['consent_contact'] },
  })
})
