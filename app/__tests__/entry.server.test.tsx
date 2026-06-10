import { afterEach, describe, expect, it, vi } from 'vitest'

const isBotMock = vi.fn<(userAgent: string) => boolean>()
const renderToPipeableStreamMock = vi.fn()
const createReadableStreamFromReadableMock = vi.fn(() => new ReadableStream())

vi.mock('isbot', () => ({
  isbot: (userAgent: string) => isBotMock(userAgent),
}))

vi.mock('react-router', () => ({
  ServerRouter: () => null,
}))

vi.mock('@react-router/node', () => ({
  createReadableStreamFromReadable: (body: unknown) => createReadableStreamFromReadableMock(body),
}))

vi.mock('react-dom/server', () => ({
  renderToPipeableStream: (...args: unknown[]) => renderToPipeableStreamMock(...args),
}))

import handleRequest from '../entry.server'

describe('entry.server handleRequest', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('streams and completes HTML for bot requests on onAllReady', async () => {
    isBotMock.mockReturnValue(true)

    const pipe = vi.fn()

    renderToPipeableStreamMock.mockImplementation((_element, callbacks) => {
      queueMicrotask(() => {
        callbacks.onShellReady()
        callbacks.onAllReady()
      })
      return {
        pipe,
        abort: vi.fn(),
      }
    })

    const response = await handleRequest(
      new Request('https://studiozanetti.com.au/', {
        headers: {
          'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        },
      }),
      200,
      new Headers(),
      {} as never,
    )

    expect(response.status).toBe(200)
    expect(createReadableStreamFromReadableMock).toHaveBeenCalledTimes(1)
    const [responseBody] = createReadableStreamFromReadableMock.mock.calls[0]
    expect(pipe).toHaveBeenCalledTimes(1)
    expect(pipe).toHaveBeenCalledWith(responseBody)
  })

  it('streams HTML for non-bot requests on onShellReady', async () => {
    isBotMock.mockReturnValue(false)

    const pipe = vi.fn()

    renderToPipeableStreamMock.mockImplementation((_element, callbacks) => {
      queueMicrotask(() => {
        callbacks.onShellReady()
        callbacks.onAllReady()
      })
      return {
        pipe,
        abort: vi.fn(),
      }
    })

    const response = await handleRequest(
      new Request('https://studiozanetti.com.au/', {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      }),
      200,
      new Headers(),
      {} as never,
    )

    expect(response.status).toBe(200)
    expect(createReadableStreamFromReadableMock).toHaveBeenCalledTimes(1)
    const [responseBody] = createReadableStreamFromReadableMock.mock.calls[0]
    expect(pipe).toHaveBeenCalledTimes(1)
    expect(pipe).toHaveBeenCalledWith(responseBody)
  })
})
