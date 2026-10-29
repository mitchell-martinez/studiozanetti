import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect } from '@playwright/test'

const css = readFileSync(resolve('wordpress/mu-plugins/assets/analytics.css'), 'utf8')
const script = readFileSync(resolve('wordpress/mu-plugins/assets/analytics.js'), 'utf8')
const render = (view: string, query: string) =>
  execFileSync(
    process.env.PHP_BINARY || 'php',
    [resolve('wordpress/tests/fixtures/analytics-dashboard.php'), view, query],
    { encoding: 'utf8' },
  )

test.beforeEach(async ({ page }) => {
  await page.route('**/wp-admin/admin.php*', async (route) => {
    const url = new URL(route.request().url())
    const markup = render(url.searchParams.get('analytics_view') || 'overview', url.search.slice(1))
    await route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body{margin:0;padding:20px;background:#f0f0f1;font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:#2271b1}p{font-size:13px}table{border-spacing:0;text-align:left}.dashicons{display:inline-block;font-size:20px;width:20px;height:20px;line-height:1}button,input{font:inherit}${css}</style>
        </head><body>${markup}${url.searchParams.has('nojs') ? '' : `<script>${script}</script>`}</body></html>`,
    })
  })
})

test('report tabs support links, keyboard navigation, browser history and date changes', async ({
  page,
}) => {
  await page.goto('/wp-admin/admin.php?page=sz-analytics#forms')
  await expect(page.getByRole('tab', { name: 'Forms', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('tab', { name: 'Forms', exact: true })).toBeInViewport()
  await expect(page.getByRole('tabpanel')).toHaveCount(1)
  await page.getByRole('tab', { name: 'Sources', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Traffic sources', exact: true })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Form progress', exact: true })).toBeVisible()

  const forms = page.getByRole('tab', { name: 'Forms', exact: true })
  await forms.focus()
  await forms.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Pricing depth' })).toBeFocused()
  await expect(page.getByRole('cell', { name: '75%', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Pricing depth' }).press('Home')
  await expect(page.getByRole('tab', { name: 'Sources', exact: true })).toBeFocused()
  await page.getByRole('tab', { name: 'Sources', exact: true }).press('ArrowLeft')
  await expect(page.getByRole('tab', { name: 'Archive', exact: true })).toBeFocused()
  await page.getByRole('tab', { name: 'Forms', exact: true }).click()
  await page.getByRole('link', { name: '7 days', exact: true }).click()
  await expect(page).toHaveURL(/start=.*#forms$/)
  await expect(page.getByRole('heading', { name: 'Form progress', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(page).toHaveURL(/#forms$/)
  await expect(page.getByRole('heading', { name: 'Form progress', exact: true })).toBeVisible()
})

test('cards, empty reports and sessions retain their navigation', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=sz-analytics#invalid')
  await expect(page.getByRole('tab', { name: 'Sources', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.getByRole('link', { name: /Form submits/ }).click()
  await expect(page.getByRole('heading', { name: 'Form progress', exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Sessions.*635/ }).click()
  await expect(page.getByRole('heading', { name: 'Sessions', exact: true })).toBeVisible()
  await page.locator('.sz-session-row').click()
  await expect(page.getByRole('heading', { name: 'Session journey', exact: true })).toBeVisible()
  await page.goto('/wp-admin/admin.php?page=sz-analytics&analytics_view=empty')
  await expect(page.getByText('No activity yet', { exact: true }).first()).toBeVisible()
  await expect(page.locator('.sz-analytics-card strong').first()).toHaveText('0')
})

test('reports stay readable without JavaScript and wide tables stay inside the page', async ({
  page,
}) => {
  await page.goto('/wp-admin/admin.php?page=sz-analytics&nojs=1')
  await expect(
    page.getByRole('heading', { name: 'Traffic sources', exact: true }).first(),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Landing pages', exact: true }).first(),
  ).toBeVisible()
  await expect(page.locator('.sz-analytics-panel[hidden]')).toHaveCount(0)

  for (const width of [320, 390, 768, 1280, 1700]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/wp-admin/admin.php?page=sz-analytics#landing-pages')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const wrap = page.locator('#landing-pages .sz-analytics-table-wrap')
    expect(await wrap.evaluate((element) => element.scrollWidth >= element.clientWidth)).toBe(true)
  }
})
