import { PassThrough } from 'node:stream'
import { createReadableStreamFromReadable } from '@react-router/node'
import { ServerRouter } from 'react-router'
import { renderToPipeableStream } from 'react-dom/server'
import { isbot } from 'isbot'
import type { EntryContext } from 'react-router'

const ABORT_DELAY = 5_000

/**
 * Allow the /preview route to be embedded in an iframe from the WordPress admin
 * domain so the live‑preview metabox in the page editor works correctly.
 * All other routes keep the default SAMEORIGIN restriction.
 */
function applyFrameHeaders(request: Request, headers: Headers) {
  const url = new URL(request.url)
  if (url.pathname === '/preview') {
    const wpUrl = process.env.WORDPRESS_URL
    if (wpUrl) {
      // Allow embedding from the WordPress admin domain
      headers.set('Content-Security-Policy', `frame-ancestors 'self' ${wpUrl}`)
    } else {
      // No WP URL configured — allow any parent (development)
      headers.delete('X-Frame-Options')
    }
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
