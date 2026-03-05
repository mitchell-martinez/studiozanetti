import { lazy, Suspense } from 'react'
import type { LinksFunction } from 'react-router'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router'
import Footer from '~/components/Footer'
import Navbar from '~/components/Navbar'
import OfflineBanner from '~/components/OfflineBanner'
import { getNavMenu, getSiteSettings } from '~/lib/wordpress'
import globalStyles from '~/styles/global.scss?url'
import type { WPMenuItem, WPSiteSettings } from '~/types/wordpress'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://picsum.photos' },
  { rel: 'stylesheet', href: globalStyles },
]

// ─── Root loader — fetches nav menu + site settings from WordPress ────────────
interface RootLoaderData {
  navMenu: WPMenuItem[]
  siteSettings: WPSiteSettings
}

export async function loader(): Promise<RootLoaderData> {
  const [navMenu, siteSettings] = await Promise.all([
    getNavMenu('primary'),
    getSiteSettings(),
  ])
  return { navMenu, siteSettings }
}

const PwaRegistrar = lazy(() => import('~/components/PwaRegistrar'))

export default function Root() {
  const { navMenu, siteSettings } = useLoaderData<typeof loader>()

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
          <Navbar items={navMenu} siteName={siteSettings.site_name} />
          <main id="main-content" className="main-content" tabIndex={-1}>
            <Outlet />
          </main>
          <Footer items={navMenu} siteSettings={siteSettings} />
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
