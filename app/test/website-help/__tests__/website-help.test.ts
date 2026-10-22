import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fixture from '../mocks/conversation.json'
import formatting from '../mocks/formatting.json'
import { renderHelp } from '../helpers/renderHelp'

const script = readFileSync(resolve('wordpress/mu-plugins/assets/website-help.js'), 'utf8')
let handlers: Record<string, () => unknown>
const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
  if (!(init.body instanceof FormData)) throw new Error('Expected form data')
  const action = String(init.body.get('action'))
  const handler = handlers[action]
  if (!handler) throw new Error(`Unexpected action: ${action}`)
  return { json: async () => ({ success: true, data: await handler() }) }
})

function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const result = document.querySelector<T>(selector)
  if (!result) throw new Error(`Missing element: ${selector}`)
  return result
}

async function mount(mode: 'page' | 'drawer' = 'page', wide = false, fragment = '') {
  window.history.replaceState(null, '', '/?page=sz-website-help' + fragment)
  vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({
    media,
    matches: wide,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  document.body.innerHTML = `<main id="editor"><button>Editor control</button></main>${renderHelp(mode)}`
  Reflect.set(window, 'szWebsiteHelp', structuredClone(fixture.config))
  new Function(script)()
  await waitFor(() => expect(element('[data-help-threads]').children).toHaveLength(1))
}

beforeEach(() => {
  handlers = {
    sz_website_help_threads: () => ({ threads: [fixture.thread] }),
    sz_website_help_get_thread: () => ({ thread: fixture.thread }),
    sz_website_help_create_thread: () => ({ thread: { id: 13 } }),
    sz_website_help_ask: () => ({ type: 'final', thread: fixture.thread }),
    sz_website_help_update_thread: () => ({}),
    sz_website_help_delete_thread: () => ({}),
    sz_website_help_delete_all: () => ({}),
    sz_website_help_report_answer: () => ({}),
  }
  fetchMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  document.body.replaceChildren()
  document.body.className = ''
  Reflect.deleteProperty(window, 'szWebsiteHelp')
  window.history.replaceState(null, '', '/')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Website Help admin interface', () => {
  it('uses labelled SVG controls and only one new-chat action', async () => {
    await mount('drawer')
    fireEvent.click(screen.getByRole('button', { name: 'Website Help' }))
    const history = screen.getByRole('button', { name: 'History' })
    expect(history.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    const expand = screen.getByRole('link', { name: 'Open Website Help in full page' })
    expect(expand).toHaveAttribute('href', '?page=sz-website-help')
    expect(expand.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('button', { name: 'New chat' })).toHaveLength(1)
    expect(element('.sz-website-help-header-icon svg')).toHaveAttribute('focusable', 'false')
    expect(element('.sz-website-help-header-icon').textContent).toBe('')
    expect(
      screen.getByRole('button', { name: 'Close Website Help' }).querySelector('svg'),
    ).toHaveAttribute('aria-hidden', 'true')
    expect(document.querySelector('.sz-website-help-drawer .dashicons')).toBeNull()
  })

  it('switches between history and chat without crowding a compact view', async () => {
    await mount()
    const toggle = screen.getByRole('button', { name: 'History' })
    expect(element('.sz-website-help-history')).not.toBeVisible()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('searchbox')).toHaveFocus()
    expect(element('.sz-website-help-conversation')).not.toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Back to chat' }))
    expect(element('.sz-website-help-conversation')).toBeVisible()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps history alongside chat on the wide full-page workspace', async () => {
    await mount('page', true)
    expect(screen.getByRole('button', { name: 'Hide history' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(element('.sz-website-help-history')).toBeVisible()
    expect(element('.sz-website-help-conversation')).toBeVisible()
  })

  it('opens a saved chat, shows its sources, and hides the welcome screen', async () => {
    await mount()
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    fireEvent.click(screen.getByRole('button', { name: fixture.thread.title }))
    await waitFor(() => expect(screen.getByRole('log')).toBeVisible())
    expect(element('[data-help-empty]')).not.toBeVisible()
    expect(screen.getByText(fixture.thread.messages[1].content)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Gallery Library' })).toHaveAttribute(
      'href',
      '?post_type=sz_gallery',
    )
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('renders saved assistant formatting as semantic text without formatting the user message', async () => {
    handlers.sz_website_help_get_thread = () => ({
      thread: {
        ...fixture.thread,
        messages: [
          { role: 'user', content: formatting.userMessage },
          { role: 'assistant', content: formatting.answer },
        ],
      },
    })
    await mount()
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    fireEvent.click(screen.getByRole('button', { name: fixture.thread.title }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'A clearer page' })).toBeVisible(),
    )
    const content = element('.sz-website-help-message--assistant .sz-website-help-message__content')
    expect(content.querySelector('strong')).toHaveTextContent('a clear heading')
    expect(content.querySelector('em')).toHaveTextContent('short paragraphs')
    expect(content.querySelector('code')).toHaveTextContent('page_title')
    expect(content.querySelectorAll('ol > li')).toHaveLength(2)
    expect(content.querySelectorAll('ol > li > ul > li')).toHaveLength(2)
    expect(content.querySelectorAll(':scope > ul > li')).toHaveLength(2)
    expect(content.querySelector('blockquote')).toHaveTextContent('Check the mobile view too.')
    expect(content.querySelector('pre code')?.textContent).toBe('first line\n  second line')
    expect(content.querySelectorAll(':scope > p')).toHaveLength(2)
    const user = element('.sz-website-help-message--user .sz-website-help-message__content')
    expect(user.textContent).toBe(formatting.userMessage)
    expect(user.children).toHaveLength(0)
  })

  it.each([
    ['unsafeAnswer', 'Visible text'],
    ['escapedAnswer', 'bold emphasis'],
    ['unfinishedAnswer', 'A heading'],
  ] as const)(
    'safely renders %s without HTML, embedded images, or executable links',
    async (key, text) => {
      handlers.sz_website_help_ask = () => ({
        type: 'final',
        thread: { ...fixture.thread, messages: [{ role: 'assistant', content: formatting[key] }] },
      })
      await mount()
      fireEvent.change(screen.getByRole('textbox'), { target: { value: fixture.thread.title } })
      fireEvent.submit(element('[data-help-form]'))
      await waitFor(() =>
        expect(element('.sz-website-help-message--assistant')).toHaveTextContent(text),
      )
      const content = element('.sz-website-help-message__content')
      expect(content.querySelector('script, img, iframe, a, [onerror]')).toBeNull()
      if (key === 'escapedAnswer') {
        expect(content.querySelector('strong em')).toHaveTextContent('emphasis')
        expect(content.querySelector('code')?.textContent).toBe('a `backtick` here')
        expect(content.querySelector('ol')).toHaveAttribute('start', '4')
        expect(content.textContent).toContain('*literal*')
      }
      if (key === 'unfinishedAnswer') {
        expect(content.textContent).toContain('**Unfinished emphasis')
        expect(content.querySelector('pre code')?.textContent).toBe('<not-html>\n  unchanged')
      }
    },
  )

  it('keeps secondary conversation actions in an accessible disclosure', async () => {
    await mount()
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    const menu = element<HTMLDetailsElement>('.sz-website-help-thread__options')
    expect(menu.open).toBe(false)
    fireEvent.click(screen.getByText('', { selector: '.sz-website-help-thread__options summary' }))
    expect(menu.open).toBe(true)
    expect(screen.getByRole('button', { name: 'Rename' })).toBeVisible()
    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(menu.open).toBe(false)
    expect(menu.querySelector('summary')).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Back to chat' })).toBeVisible()
  })

  it('fills a starter question without automatically sending it', async () => {
    await mount()
    fireEvent.click(screen.getByRole('button', { name: /Add a gallery/ }))
    expect(screen.getByRole('textbox')).toHaveValue('How do I add a gallery to a page?')
    expect(screen.getByRole('textbox')).toHaveFocus()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(document.querySelector('.sz-website-help-privacy')).toBeNull()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('uses a labelled message input and an icon-only submit button without redundant copy', async () => {
    await mount()
    const question = screen.getByRole('textbox', { name: 'Message' })
    expect(question).toHaveAttribute('placeholder', 'Type a message...')
    expect(question).not.toHaveAttribute('aria-describedby')
    const send = screen.getByRole('button', { name: 'Send message' })
    expect(send).toHaveAttribute('type', 'submit')
    expect(send.textContent).toBe('')
    expect(send.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(element('.sz-website-help-composer__input')).toContainElement(send)
    expect(screen.queryByText('Ask about this website')).not.toBeInTheDocument()
    expect(screen.queryByText('Your privacy & how this works')).not.toBeInTheDocument()
  })

  it('keeps delete-all in history options and supports Escape and cancellation', async () => {
    await mount()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    const menu = element<HTMLDetailsElement>('.sz-website-help-history__options')
    const summary = element('.sz-website-help-history__options summary')
    const remove = element('[data-help-delete-all]')
    expect(summary).toHaveAccessibleName('History options')
    expect(remove).not.toBeVisible()
    fireEvent.click(summary)
    expect(screen.getByRole('button', { name: 'Delete all history' })).toBeVisible()
    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(menu.open).toBe(false)
    expect(summary).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Back to chat' })).toBeVisible()
    fireEvent.click(summary)
    fireEvent.click(remove)
    expect(confirm).toHaveBeenCalledWith(fixture.config.strings.confirmAll)
    expect(menu.open).toBe(false)
    expect(summary).toHaveFocus()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('deletes history only after confirmation and refreshes the visible list', async () => {
    await mount()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    handlers.sz_website_help_threads = () => ({ threads: [] })
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    fireEvent.click(element('.sz-website-help-history__options summary'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete all history' }))
    await waitFor(() => expect(screen.getByText(fixture.config.strings.noHistory)).toBeVisible())
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const request = fetchMock.mock.calls[1][1].body
    expect(request instanceof FormData && request.get('action')).toBe('sz_website_help_delete_all')
    expect(element<HTMLDetailsElement>('.sz-website-help-history__options').open).toBe(false)
  })

  it('shows pending state, prevents duplicate sends, and restores the composer', async () => {
    await mount()
    let complete: ((value: unknown) => void) | undefined
    handlers.sz_website_help_ask = () =>
      new Promise((resolve) => {
        complete = resolve
      })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'How do I add a gallery?' } })
    fireEvent.submit(element('[data-help-form]'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Thinking...' })).toBeDisabled())
    fireEvent.submit(element('[data-help-form]'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    complete?.({ type: 'final', thread: fixture.thread })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled())
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(element('[data-help-status]')).toBeEmptyDOMElement()
    expect(screen.getByRole('log')).toBeVisible()
  })

  it('preserves a follow-up typed while an answer is pending', async () => {
    await mount()
    let complete: ((value: unknown) => void) | undefined
    handlers.sz_website_help_ask = () =>
      new Promise((resolve) => {
        complete = resolve
      })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'First question' } })
    fireEvent.submit(element('[data-help-form]'))
    await waitFor(() => expect(complete).toBeDefined())
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My next question' } })
    complete?.({ type: 'final', thread: fixture.thread })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled())
    expect(screen.getByRole('textbox')).toHaveValue('My next question')
  })

  it('shows request failures and retains the question for retry', async () => {
    await mount()
    handlers.sz_website_help_ask = () => {
      throw new Error('Answer service unavailable')
    }
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Help with my page' } })
    fireEvent.submit(element('[data-help-form]'))
    await waitFor(() =>
      expect(element('[data-help-status]')).toHaveTextContent('Answer service unavailable'),
    )
    expect(screen.getByRole('textbox')).toHaveValue('Help with my page')
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled()
    expect(element('.sz-website-help-app')).not.toHaveClass('is-busy')
  })

  it('surfaces history action failures in the visible history view', async () => {
    await mount()
    handlers.sz_website_help_get_thread = () => {
      throw new Error('Conversation unavailable')
    }
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    fireEvent.click(screen.getByRole('button', { name: fixture.thread.title }))
    await waitFor(() =>
      expect(element('[data-help-history-status]')).toHaveTextContent('Conversation unavailable'),
    )
    expect(element('[data-help-history-status]')).toBeVisible()
  })

  it('keeps answer failures visible across history switches and late history refreshes', async () => {
    await mount()
    let failAnswer: ((error: Error) => void) | undefined
    let finishHistory: ((value: unknown) => void) | undefined
    handlers.sz_website_help_ask = () =>
      new Promise((_resolve, reject) => {
        failAnswer = reject
      })
    handlers.sz_website_help_threads = () =>
      new Promise((resolve) => {
        finishHistory = resolve
      })
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: fixture.thread.messages[0].content },
    })
    fireEvent.submit(element('[data-help-form]'))
    await waitFor(() => expect(failAnswer).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(element('[data-help-history-status]')).toHaveTextContent(fixture.config.strings.loading)
    fireEvent.input(screen.getByRole('searchbox'), { target: { value: fixture.thread.title } })
    await waitFor(() => expect(finishHistory).toBeDefined())
    failAnswer?.(new Error(fixture.config.strings.error))
    await waitFor(() =>
      expect(element('[data-help-history-status]')).toHaveTextContent(fixture.config.strings.error),
    )
    finishHistory?.({ threads: [fixture.thread] })
    await waitFor(() =>
      expect(element('[data-help-threads] button')).toHaveTextContent(fixture.thread.title),
    )
    expect(element('[data-help-history-status]')).toBeVisible()
    expect(element('[data-help-history-status]')).toHaveTextContent(fixture.config.strings.error)
    fireEvent.click(screen.getByRole('button', { name: 'Back to chat' }))
    expect(element('[data-help-status]')).toBeVisible()
    expect(element('[data-help-status]')).toHaveTextContent(fixture.config.strings.error)
    expect(element('[data-help-history-status]')).toBeEmptyDOMElement()
  })

  it.each([fixture.thread.title, fixture.thread.messages[0].content])(
    'preserves text typed while a new chat is being created: %s',
    async (nextQuestion) => {
      await mount()
      let finishNewChat: ((value: unknown) => void) | undefined
      handlers.sz_website_help_create_thread = () =>
        new Promise((resolve) => {
          finishNewChat = resolve
        })
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: fixture.thread.messages[0].content },
      })
      fireEvent.click(screen.getByRole('button', { name: 'New chat' }))
      await waitFor(() => expect(finishNewChat).toBeDefined())
      fireEvent.input(screen.getByRole('textbox'), { target: { value: nextQuestion } })
      finishNewChat?.({ thread: { id: fixture.thread.id } })
      await waitFor(() => expect(window.location.hash).toBe('#thread=' + fixture.thread.id))
      expect(screen.getByRole('textbox')).toHaveValue(nextQuestion)
      expect(screen.getByRole('textbox')).toHaveFocus()
    },
  )

  it('clears only an unchanged old draft when new-chat creation succeeds', async () => {
    await mount()
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: fixture.thread.messages[0].content },
    })
    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))
    await waitFor(() => expect(window.location.hash).toBe('#thread=13'))
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('retains the draft if new-chat creation fails', async () => {
    await mount()
    handlers.sz_website_help_create_thread = () => {
      throw new Error(fixture.config.strings.error)
    }
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: fixture.thread.messages[0].content },
    })
    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))
    await waitFor(() =>
      expect(element('[data-help-status]')).toHaveTextContent(fixture.config.strings.error),
    )
    expect(screen.getByRole('textbox')).toHaveValue(fixture.thread.messages[0].content)
  })

  it('includes the active conversation in the full-page link', async () => {
    await mount('drawer')
    fireEvent.click(screen.getByRole('button', { name: 'Website Help' }))
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    fireEvent.click(screen.getByRole('button', { name: fixture.thread.title }))
    await waitFor(() => expect(screen.getByRole('log')).toBeVisible())
    expect(element<HTMLAnchorElement>('.sz-website-help-expand').hash).toBe(
      '#thread=' + fixture.thread.id,
    )
  })

  it('restores the requested conversation through the existing thread endpoint', async () => {
    await mount('page', true, '#thread=' + fixture.thread.id)
    await waitFor(() => expect(screen.getByText(fixture.thread.messages[1].content)).toBeVisible())
    expect(screen.getByRole('button', { name: 'Hide history' })).toBeVisible()
    const restored = fetchMock.mock.calls.find(
      ([, init]) =>
        init.body instanceof FormData && init.body.get('action') === 'sz_website_help_get_thread',
    )
    expect(restored?.[1].body).toBeInstanceOf(FormData)
    expect(restored?.[1].body instanceof FormData && restored[1].body.get('thread_id')).toBe(
      String(fixture.thread.id),
    )
    expect(window.location.hash).toBe('#thread=' + fixture.thread.id)
  })

  it('shows an explicit error when the requested conversation is unavailable', async () => {
    handlers.sz_website_help_get_thread = () => {
      throw new Error(fixture.config.strings.invalidThread)
    }
    await mount('page', false, '#thread=' + fixture.thread.id)
    await waitFor(() =>
      expect(element('[data-help-status]')).toHaveTextContent(fixture.config.strings.invalidThread),
    )
    expect(element('[data-help-empty]')).toBeVisible()
    expect(element('[data-help-messages]')).not.toBeVisible()
  })

  it.each(['0', '-1', 'invalid', '9007199254740992'])(
    'rejects an invalid conversation fragment: %s',
    async (id) => {
      await mount('page', false, '#thread=' + id)
      expect(element('[data-help-status]')).toHaveTextContent(fixture.config.strings.invalidThread)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    },
  )

  it('ignores a late conversation restore after the user starts a new chat', async () => {
    let finishRestore: ((value: unknown) => void) | undefined
    handlers.sz_website_help_get_thread = () =>
      new Promise((resolve) => {
        finishRestore = resolve
      })
    await mount('page', false, '#thread=' + fixture.thread.id)
    await waitFor(() => expect(finishRestore).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))
    await waitFor(() => expect(window.location.hash).toBe('#thread=13'))
    finishRestore?.({ thread: fixture.thread })
    await waitFor(() => expect(element('[data-help-empty]')).toBeVisible())
    expect(window.location.hash).toBe('#thread=13')
    expect(element('[data-help-messages]')).not.toBeVisible()
  })

  it('starts a fresh conversation and restores the welcome view', async () => {
    await mount()
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    fireEvent.click(screen.getByRole('button', { name: fixture.thread.title }))
    await waitFor(() => expect(screen.getByRole('log')).toBeVisible())
    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))
    await waitFor(() => expect(element('[data-help-empty]')).toBeVisible())
    expect(element('[data-help-messages]')).not.toBeVisible()
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('shows an empty history message rather than an unexplained blank list', async () => {
    handlers.sz_website_help_threads = () => ({ threads: [] })
    await mount()
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByText(fixture.config.strings.noHistory)).toBeVisible()
  })

  it('scrolls to the latest messages instead of displaying a permanent floating button', async () => {
    await mount()
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    fireEvent.click(screen.getByRole('button', { name: fixture.thread.title }))
    await waitFor(() => expect(screen.getByRole('log')).toBeVisible())
    const messages = element('[data-help-messages]')
    Object.defineProperties(messages, {
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 300, configurable: true },
    })
    messages.scrollTop = 200
    fireEvent.scroll(messages)
    fireEvent.click(screen.getByRole('button', { name: 'Latest messages' }))
    expect(messages.scrollTop).toBe(1000)
    expect(element('.sz-website-help-scroll')).not.toBeVisible()
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('still asks for editor context consent without the removed privacy disclosure', async () => {
    await mount()
    const consent = vi.spyOn(window, 'confirm').mockReturnValue(false)
    handlers.sz_website_help_ask = () => ({
      type: 'context_request',
      thread: { id: fixture.thread.id },
      exchange: { token: 'test-scope', request: { scope: 'object_identity' } },
    })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Help with this page' } })
    fireEvent.submit(element('[data-help-form]'))
    await waitFor(() =>
      expect(element('[data-help-status]')).toHaveTextContent('Context was not shared'),
    )
    expect(consent).toHaveBeenCalledOnce()
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByRole('textbox')).toHaveValue('Help with this page')
    expect(document.querySelector('.sz-website-help-privacy')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('cancels a pending answer when the drawer closes and ignores its late result', async () => {
    await mount('drawer')
    fireEvent.click(screen.getByRole('button', { name: 'Website Help' }))
    let complete: ((value: unknown) => void) | undefined
    handlers.sz_website_help_ask = () =>
      new Promise((resolve) => {
        complete = resolve
      })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Help with my page' } })
    fireEvent.submit(element('[data-help-form]'))
    await waitFor(() => expect(complete).toBeDefined())
    const requestSignal = fetchMock.mock.calls[1][1].signal
    fireEvent.click(screen.getByRole('button', { name: 'Close Website Help' }))
    expect(requestSignal?.aborted).toBe(true)
    complete?.({ type: 'final', thread: fixture.thread })
    fireEvent.click(screen.getByRole('button', { name: 'Website Help' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled())
    expect(element('[data-help-empty]')).toBeVisible()
    expect(element('[data-help-status]')).toBeEmptyDOMElement()
    expect(screen.getByRole('textbox')).toHaveValue('Help with my page')
  })

  it('isolates the modal and returns focus to its launcher on Escape', async () => {
    await mount('drawer')
    const launcher = screen.getByRole('button', { name: 'Website Help' })
    launcher.focus()
    fireEvent.click(launcher)
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getByRole('textbox')).toHaveFocus()
    expect(Reflect.get(element('#editor'), 'inert')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getByRole('textbox')).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })
    expect(element('.sz-website-help-drawer')).not.toBeVisible()
    expect(Reflect.get(element('#editor'), 'inert')).not.toBe(true)
    expect(launcher).toHaveFocus()
    expect(launcher).toHaveAttribute('aria-expanded', 'false')
  })
})
