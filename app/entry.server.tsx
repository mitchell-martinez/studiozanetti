import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import { PassThrough } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

const ABORT_DELAY = 5_000

/**
 * Allow the /preview route to be embedded in an iframe from the WordPress admin
 * domain so the live‑preview metabox in the page editor works correctly.
 * All other routes keep the default SAMEORIGIN restriction.
 */
function applyFrameHeaders(request: Request, headers: Headers) {
  const url = new URL(request.url)
  if (url.pathname === '/preview') {
    // Use explicit public admin origin when provided. If WORDPRESS_URL is an
    // internal Docker host (e.g. http://wordpress), fall back to current origin.
    const explicitAdminOrigin = process.env.WORDPRESS_ADMIN_ORIGIN?.trim()
    const wpUrl = process.env.WORDPRESS_URL?.trim()

    let adminOrigin = explicitAdminOrigin || ''
    if (!adminOrigin && wpUrl) {
      try {
        const parsed = new URL(wpUrl)
        const hostname = parsed.hostname.toLowerCase()
        const internalHosts = new Set(['wordpress', 'localhost', '127.0.0.1'])
        if (!internalHosts.has(hostname) && !hostname.endsWith('.internal')) {
          adminOrigin = parsed.origin
        }
      } catch {
        // Ignore invalid URL and fall back below.
      }
    }

    const requestOrigin = `${url.protocol}//${url.host}`
    const frameAncestor = adminOrigin || requestOrigin
    headers.set('Content-Security-Policy', `frame-ancestors 'self' ${frameAncestor}`)
    headers.delete('X-Frame-Options')
  }
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const isBot = isbot(request.headers.get('user-agent') ?? '')
  applyFrameHeaders(request, responseHeaders)

  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)
          responseHeaders.set('Content-Type', 'text/html')
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )
          if (!isBot) pipe(body)
        },
        onAllReady() {
          if (isBot) {
            const body = new PassThrough()
            const stream = createReadableStreamFromReadable(body)
            responseHeaders.set('Content-Type', 'text/html')
            if (!shellRendered) {
              resolve(
                new Response(stream, {
                  headers: responseHeaders,
                  status: responseStatusCode,
                }),
              )
            }
            pipe(body)
          }
        },
        onShellError(error: unknown) {
          reject(error instanceof Error ? error : new Error(String(error)))
        },
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) {
            console.error(error)
          }
        },
      },
    )

    setTimeout(abort, ABORT_DELAY)
  })
}
