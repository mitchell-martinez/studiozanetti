import { lazy, Suspense } from 'react'
import type { LinksFunction } from 'react-router'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router'
import Footer from '~/components/Footer'
import Navbar from '~/components/Navbar'
import OfflineBanner from '~/components/OfflineBanner'
import { getSiteUrlFromEnv } from '~/lib/seo'
import { getNavMenu, getPageByPath, getSiteSettings } from '~/lib/wordpress'
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

export async function loader({ request }: { request: Request }): Promise<RootLoaderData> {
  const pathname = new URL(request.url).pathname
  const normalizedPath = pathname.replace(/^\/+|\/+$/g, '')

  let menuLocation = 'primary'

  // For normal CMS pages, derive slug and read optional ACF menu override.
  // Preview/admin utility routes keep the primary menu.
  if (normalizedPath && normalizedPath !== 'preview') {
    const page = await getPageByPath(normalizedPath, { requireExactPath: true })
    const override = page?.acf?.menu_override?.trim()
    if (override) {
      menuLocation = override
    }
  }

  const [menuFromLocation, siteSettings] = await Promise.all([
    getNavMenu(menuLocation),
    getSiteSettings(),
  ])

  // Always fallback to primary if override menu does not exist or is empty.
  const navMenu =
    menuFromLocation.length > 0 || menuLocation === 'primary'
      ? menuFromLocation
      : await getNavMenu('primary')

  return { navMenu, siteSettings }
}

const PwaRegistrar = lazy(() => import('~/components/PwaRegistrar'))

export default function Root() {
  const { navMenu, siteSettings } = useLoaderData<typeof loader>()
  const siteUrl = getSiteUrlFromEnv()
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: siteSettings.site_name || 'Studio Zanetti',
    url: siteUrl,
    sameAs: siteSettings.social_links
      .map((link) => link.url)
      .filter((url) => url.trim().length > 0),
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
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
