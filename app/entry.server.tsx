import { PassThrough } from 'node:stream'
import { createReadableStreamFromReadable } from '@react-router/node'
import { ServerRouter } from 'react-router'
import { renderToPipeableStream } from 'react-dom/server'
import { isbot } from 'isbot'
import type { EntryContext } from 'react-router'

const ABORT_DELAY = 5_000

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const isBot = isbot(request.headers.get('user-agent') ?? '')

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
