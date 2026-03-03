import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home page loads and displays hero', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Studio Zanetti/)
    await expect(page.getByRole('heading', { name: 'Studio Zanetti', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /View Gallery/i })).toBeVisible()
  })

  test('navbar links navigate to correct pages', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /Gallery/i }).first().click()
    await expect(page).toHaveURL('/gallery')
    await expect(page.getByRole('heading', { name: 'Gallery', level: 1 })).toBeVisible()

    await page.getByRole('link', { name: /About/i }).first().click()
    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About Us', level: 1 })).toBeVisible()

    await page.getByRole('link', { name: /Contact/i }).first().click()
    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { name: 'Contact', level: 1 })).toBeVisible()
  })

  test('skip to main content link is focusable', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /Skip to main content/i })
    await expect(skipLink).toBeFocused()
  })
})

test.describe('Gallery', () => {
  test('category filters work', async ({ page }) => {
    await page.goto('/gallery')
    const weddingsBtn = page.getByRole('button', { name: 'Weddings' })
    await weddingsBtn.click()
    await expect(weddingsBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Contact form', () => {
  test('shows validation errors when submitted empty', async ({ page }) => {
    await page.goto('/contact')
    await page.getByRole('button', { name: /Send Message/i }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  test('succeeds with valid input', async ({ page }) => {
    await page.goto('/contact')
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email Address').fill('test@example.com')
    await page.getByLabel('Message').fill('This is a test message.')
    await page.getByRole('button', { name: /Send Message/i }).click()
    await expect(page.getByRole('status').filter({ hasText: /Message Sent/i })).toBeVisible()
  })
})
