import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { test, expect } from '@playwright/test'
import { renderHelp } from '../app/test/website-help/helpers/renderHelp'
import type conversation from '../app/test/website-help/mocks/conversation.json'
import type formattedConversation from '../app/test/website-help/mocks/formatting.json'

const fixture: typeof conversation = createRequire(import.meta.url)(
  '../app/test/website-help/mocks/conversation.json',
)
const formatting: typeof formattedConversation = createRequire(import.meta.url)(
  '../app/test/website-help/mocks/formatting.json',
)
const css = readFileSync(resolve('wordpress/mu-plugins/assets/website-help.css'), 'utf8')
const script = readFileSync(resolve('wordpress/mu-plugins/assets/website-help.js'), 'utf8')
const previewPath = '/__website-help-preview'

test.beforeEach(async ({ page }) => {
  await page.route('**/admin-ajax.php', async (route) => {
    const action = route
      .request()
      .postData()
      ?.match(/name="action"\r\n\r\n([^\r]+)/)?.[1]
    if (action === 'sz_website_help_threads') {
      await route.fulfill({ json: { success: true, data: { threads: [fixture.thread] } } })
    } else if (action === 'sz_website_help_get_thread') {
      const thread = page.url().includes('formatted=1')
        ? { ...fixture.thread, messages: [{ role: 'assistant', content: formatting.answer }] }
        : fixture.thread
      await route.fulfill({ json: { success: true, data: { thread } } })
    } else if (action === 'sz_website_help_ask') {
      await route.fulfill({
        json: { success: true, data: { type: 'final', thread: fixture.thread } },
      })
    } else {
      await route.fulfill({
        status: 400,
        json: { success: false, data: { message: fixture.config.strings.error } },
      })
    }
  })
  await page.route('**/__website-help-preview*', async (route) => {
    const previewUrl = new URL(route.request().url())
    const mode = previewUrl.searchParams.get('page') === 'sz-website-help' ? 'page' : 'drawer'
    await route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Website Help test fixture</title>
        <style>body{margin:0;font:14px/1.6 system-ui}p{font-size:13px;line-height:1.5}button,input,textarea,select{font:inherit}${css}</style>
        </head><body><main><button id="editor-control">Editor control</button></main>
        ${renderHelp(mode)}
        <script>window.szWebsiteHelp=${JSON.stringify({ ...fixture.config, liveContextAvailable: mode === 'drawer' && previewUrl.searchParams.get('editor') !== 'off' })}</script>
        <script>${script}</script></body></html>`,
    })
  })
})

test('the composer stays stable on first input and grows upward without moving the send button', async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 640, mode: 'drawer' },
    { width: 375, height: 740, mode: 'drawer' },
    { width: 640, height: 480, mode: 'drawer' },
    { width: 1280, height: 900, mode: 'page' },
  ]) {
    await test.step(`${viewport.mode} at ${viewport.width} by ${viewport.height}`, async () => {
      await page.setViewportSize(viewport)
      await page.goto(
        previewPath + (viewport.mode === 'page' ? '?page=sz-website-help' : '?editor=off'),
      )
      if (viewport.mode === 'drawer') {
        await page.getByRole('button', { name: 'Website Help', exact: true }).click()
      }
      const input = page.getByRole('textbox', { name: 'Message' })
      const geometry = () =>
        input.evaluate((textarea: HTMLTextAreaElement) => {
          const send = textarea.parentElement?.querySelector<HTMLButtonElement>('[type="submit"]')
          const icon = send?.querySelector('svg')
          if (!send || !icon) throw new Error('Missing send button')
          const field = textarea.getBoundingClientRect()
          const button = send.getBoundingClientRect()
          const glyph = icon.getBoundingClientRect()
          return {
            height: field.height,
            top: field.top,
            bottom: field.bottom,
            buttonX: button.x,
            buttonY: button.y,
            rightInset: field.right - button.right,
            bottomInset: field.bottom - button.bottom,
            centerDifference: (field.top + field.bottom - button.top - button.bottom) / 2,
            iconXDifference: (glyph.left + glyph.right - button.left - button.right) / 2,
            iconYDifference: (glyph.top + glyph.bottom - button.top - button.bottom) / 2,
            overflow: getComputedStyle(textarea).overflowY,
            maxHeight: parseFloat(getComputedStyle(textarea).maxHeight),
            hasScrollbar: textarea.scrollHeight > textarea.clientHeight,
          }
        })
      const empty = await geometry()
      expect(empty.height).toBe(64)
      expect(empty.centerDifference).toBe(0)
      expect(empty.rightInset).toBe(10)
      expect(empty.bottomInset).toBe(10)
      expect(empty.iconXDifference).toBe(0)
      expect(empty.iconYDifference).toBe(0)
      await input.pressSequentially('abc')
      const short = await geometry()
      expect(short.height).toBe(empty.height)
      expect(short.buttonY).toBe(empty.buttonY)
      await input.fill(formatting.composerLines.split('\n').slice(0, 2).join('\n'))
      const twoLines = await geometry()
      expect(twoLines.height).toBe(88)
      expect(twoLines.top).toBe(empty.top - 24)
      expect(twoLines.bottom).toBe(empty.bottom)
      expect(twoLines.buttonX).toBe(empty.buttonX)
      expect(twoLines.buttonY).toBe(empty.buttonY)
      await input.fill(formatting.composerLines)
      const full = await geometry()
      expect(full.height).toBe(full.maxHeight)
      expect(full.buttonY).toBe(empty.buttonY)
      expect(full.overflow).toBe('auto')
      expect(full.hasScrollbar).toBe(true)
      await input.fill('')
      const cleared = await geometry()
      expect(cleared.height).toBe(empty.height)
      expect(cleared.buttonY).toBe(empty.buttonY)
      expect(cleared.overflow).toBe('hidden')
      await input.fill(formatting.wrappingMessage)
      const wrapped = await geometry()
      expect(wrapped.height).toBeGreaterThanOrEqual(empty.height)
      expect(wrapped.height).toBeLessThanOrEqual(wrapped.maxHeight)
      expect(wrapped.buttonY).toBe(empty.buttonY)
      await page.screenshot({
        path: test.info().outputPath(`composer-${viewport.width}.png`),
        scale: 'css',
      })
      if (viewport.mode === 'page') {
        await input.fill(formatting.wrappingMessage.repeat(2))
        const narrow = await geometry()
        await page.getByRole('button', { name: 'Hide history', exact: true }).click()
        await expect.poll(async () => (await geometry()).height).toBeLessThan(narrow.height)
        expect((await geometry()).buttonY).toBe(empty.buttonY)
        await page.getByRole('button', { name: 'History', exact: true }).click()
        await expect.poll(async () => (await geometry()).height).toBe(narrow.height)
      } else if (viewport.width === 375) {
        await page.getByRole('button', { name: 'History', exact: true }).click()
        await page.setViewportSize({ width: 640, height: viewport.height })
        await page.getByRole('button', { name: 'Back to chat', exact: true }).click()
        await expect.poll(async () => (await geometry()).height).toBeLessThan(wrapped.height)
      }
      await input.fill(formatting.composerLines)
      await page.getByRole('button', { name: 'Send message' }).click()
      await expect(input).toHaveValue('')
      await expect.poll(async () => (await geometry()).height).toBe(empty.height)
    })
  }
})

test('saved replies show readable paragraphs, emphasis, lists, and code after reopening', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(previewPath + '?page=sz-website-help&formatted=1#thread=' + fixture.thread.id)
  for (let visit = 0; visit < 2; visit++) {
    if (visit) await page.reload()
    await expect(page.getByRole('heading', { name: 'A clearer page' })).toBeVisible()
    const answer = page.locator('.sz-website-help-message__content')
    await expect(answer.locator('strong').first()).toHaveText('a clear heading')
    await expect(answer.locator('ol > li')).toHaveCount(2)
    await expect(answer.locator('ol > li > ul > li')).toHaveCount(2)
    await expect(answer.locator('pre code')).toHaveText('first line\n  second line')
    await expect(answer.locator('script, img, a')).toHaveCount(0)
    await expect(answer.locator('ul').first()).toHaveCSS('list-style-type', 'disc')
    await expect(answer.locator('ol')).toHaveCSS('list-style-type', 'decimal')
    await expect(answer.locator('p').first()).toHaveCSS('font-size', '16px')
    await expect(answer.locator('p').first()).toHaveCSS('line-height', '28.8px')
    await expect(answer.locator('pre')).toHaveCSS('white-space', 'pre-wrap')
  }
  await page.screenshot({ path: test.info().outputPath('formatted-answer.png'), scale: 'css' })
})

test('mobile welcome options fit without hiding the composer', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 640 },
    { width: 375, height: 740 },
    { width: 640, height: 480 },
  ]) {
    await test.step(`${viewport.width} by ${viewport.height}`, async () => {
      await page.setViewportSize(viewport)
      await page.goto(previewPath)
      await page.getByRole('button', { name: 'Website Help', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'How can I help?' })).toBeVisible()
      const layout = await page.evaluate(() => {
        const welcome = document.querySelector<HTMLElement>('[data-help-empty]')
        const send = document.querySelector<HTMLButtonElement>('[type="submit"]')
        const input = document.querySelector<HTMLTextAreaElement>('[data-help-question]')
        if (!welcome || !send || !input) throw new Error('Missing help layout')
        const sendBounds = send.getBoundingClientRect()
        const inputBounds = input.getBoundingClientRect()
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          welcomeFits: welcome.scrollHeight <= welcome.clientHeight + 1,
          sendFits: sendBounds.top >= 0 && sendBounds.bottom <= innerHeight,
          sendInsideInput:
            sendBounds.left >= inputBounds.left &&
            sendBounds.right <= inputBounds.right &&
            sendBounds.top >= inputBounds.top &&
            sendBounds.bottom <= inputBounds.bottom,
          textClearsButton:
            inputBounds.right - parseFloat(getComputedStyle(input).paddingRight) <=
            sendBounds.left - 8,
          targetSize: Math.min(sendBounds.width, sendBounds.height),
        }
      })
      expect(layout.overflow).toBe(false)
      expect(layout.sendFits).toBe(true)
      expect(layout.sendInsideInput).toBe(true)
      expect(layout.textClearsButton).toBe(true)
      expect(layout.targetSize).toBeGreaterThanOrEqual(44)
      if (viewport.height >= 640) expect(layout.welcomeFits).toBe(true)
      await expect(page.getByRole('textbox')).toHaveCSS('font-size', '16px')
    })
  }
  const input = page.getByRole('textbox', { name: 'Message' })
  await expect(input).toHaveAttribute('placeholder', 'Type a message...')
  await input.fill(fixture.thread.messages[0].content)
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText(fixture.thread.messages[1].content)).toBeVisible()
  await expect(input).toHaveValue('')
  await expect(page.locator('.sz-website-help-message__content').last()).toHaveCSS(
    'font-size',
    '16px',
  )
  await expect(page.locator('.sz-website-help-message__content').last()).toHaveCSS(
    'line-height',
    '28.8px',
  )
  await page.screenshot({ path: test.info().outputPath('compact-conversation.png'), scale: 'css' })
})

test('history actions fit at the top of compact and full-page workspaces', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 640, mode: 'drawer' },
    { width: 1000, height: 740, mode: 'page' },
    { width: 1280, height: 900, mode: 'page' },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(previewPath + (viewport.mode === 'page' ? '?page=sz-website-help' : ''))
    if (viewport.mode === 'drawer') {
      await page.getByRole('button', { name: 'Website Help', exact: true }).click()
      await page.getByRole('button', { name: 'History', exact: true }).click()
    }
    const remove = page.locator('[data-help-delete-all]')
    await expect(remove).toHaveCount(1)
    await expect(remove).toBeHidden()
    const options = page.getByLabel('History options', { exact: true })
    await options.click()
    await expect(remove).toBeVisible()
    const bounds = await page.evaluate(() => {
      const history = document.querySelector<HTMLElement>('.sz-website-help-history')
      const remove = document.querySelector<HTMLElement>('[data-help-delete-all]')
      const threads = document.querySelector<HTMLElement>('[data-help-threads]')
      if (!history || !remove || !threads) throw new Error('Missing history controls')
      const pane = history.getBoundingClientRect()
      const button = remove.getBoundingClientRect()
      return {
        fits:
          button.left >= pane.left &&
          button.right <= pane.right &&
          button.top >= pane.top &&
          button.bottom <= pane.bottom,
        atTop: button.top < threads.getBoundingClientRect().top,
        textFits: remove.scrollWidth <= remove.clientWidth,
        overflow: history.scrollWidth > history.clientWidth,
      }
    })
    expect(bounds).toEqual({ fits: true, atTop: true, textFits: true, overflow: false })
    if (viewport.width === 1280) {
      await page.screenshot({ path: test.info().outputPath('history-options.png'), scale: 'css' })
    }
    await page.keyboard.press('Escape')
    await expect(remove).toBeHidden()
    await expect(options).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Your conversations' })).toBeVisible()
    const threadOptions = page.getByLabel(
      fixture.config.strings.options + ': ' + fixture.thread.title,
    )
    await threadOptions.click()
    await expect(page.getByRole('button', { name: 'Rename', exact: true })).toBeVisible()
    await options.click()
    await expect(page.getByRole('button', { name: 'Rename', exact: true })).toBeHidden()
    page.once('dialog', (dialog) => dialog.dismiss())
    await remove.click()
    await expect(options).toBeFocused()
    await expect(remove).toBeHidden()
  }
  await page.getByRole('button', { name: fixture.thread.title, exact: true }).click()
  await expect(page.getByText(fixture.thread.messages[1].content)).toBeVisible()
  await page.getByRole('button', { name: 'History', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your conversations' })).toBeVisible()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await page.screenshot({
    path: test.info().outputPath('full-page-conversation.png'),
    scale: 'css',
  })
})

test('full-page expansion continues the saved conversation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(previewPath)
  await page.getByRole('button', { name: 'Website Help', exact: true }).click()
  await page.getByRole('button', { name: 'History', exact: true }).click()
  await page.getByRole('button', { name: fixture.thread.title, exact: true }).click()
  await expect(page.getByText(fixture.thread.messages[1].content)).toBeVisible()
  const expand = page.getByRole('link', { name: 'Open Website Help in full page' })
  await expect(expand).toHaveAttribute('href', new RegExp('#thread=' + fixture.thread.id + '$'))
  await expand.click()
  await expect(page).toHaveURL(new RegExp('#thread=' + fixture.thread.id + '$'))
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(fixture.thread.messages[1].content)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hide history' })).toBeVisible()
})

test('the drawer traps visible keyboard controls and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 })
  for (const editor of [true, false]) {
    await page.goto(previewPath + (editor ? '' : '?editor=off'))
    const launcher = page.getByRole('button', { name: 'Website Help', exact: true })
    await launcher.click()
    await expect(page.getByRole('textbox')).toBeFocused()
    const expand = page.getByRole('link', { name: 'Open Website Help in full page' })
    const lastControl = editor
      ? page.getByRole('checkbox', { name: 'Use my current unsaved edits when needed' })
      : page.getByRole('button', { name: 'Send message' })
    await lastControl.focus()
    await page.keyboard.press('Tab')
    await expect(expand).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(lastControl).toBeFocused()
    await expect(page.locator('main')).toHaveAttribute('inert', '')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(launcher).toBeFocused()
    await expect(page.locator('main')).not.toHaveAttribute('inert')
  }
})
