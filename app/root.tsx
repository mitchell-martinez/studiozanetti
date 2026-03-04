import { lazy, Suspense } from 'react'
import type { LinksFunction } from 'react-router'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router'
import Footer from '~/components/Footer'
import Navbar from '~/components/Navbar'
import OfflineBanner from '~/components/OfflineBanner'
import { getNavMenu } from '~/lib/wordpress'
import globalStyles from '~/styles/global.scss?url'
import type { WPMenuItem } from '~/types/wordpress'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://picsum.photos' },
  { rel: 'stylesheet', href: globalStyles },
]

// ─── Root loader — fetches the primary navigation menu from WordPress ─────────
interface RootLoaderData {
  navMenu: WPMenuItem[]
}

export async function loader(): Promise<RootLoaderData> {
  const navMenu = await getNavMenu('primary')
  return { navMenu }
}

const PwaRegistrar = lazy(() => import('~/components/PwaRegistrar'))

export default function Root() {
  const { navMenu } = useLoaderData<typeof loader>()

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
          <Navbar items={navMenu} />
          <main id="main-content" className="main-content" tabIndex={-1}>
            <Outlet />
          </main>
          <Footer items={navMenu} />
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
