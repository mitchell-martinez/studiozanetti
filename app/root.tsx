import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { LinksFunction } from 'react-router'
import { lazy, Suspense } from 'react'
import Navbar from '~/components/Navbar'
import Footer from '~/components/Footer'
import OfflineBanner from '~/components/OfflineBanner'
import globalStyles from '~/styles/global.scss?url'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://picsum.photos' },
  { rel: 'stylesheet', href: globalStyles },
]

const PwaRegistrar = lazy(() => import('~/components/PwaRegistrar'))

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        <OfflineBanner />
        <div className="layout">
          <Navbar />
          <main id="main-content" className="main-content" tabIndex={-1}>
            <Outlet />
          </main>
          <Footer />
        </div>
        <Suspense>
          <PwaRegistrar />
        </Suspense>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
