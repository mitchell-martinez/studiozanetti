import { lazy, Suspense } from 'react'
import type { LinksFunction } from 'react-router'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
} from 'react-router'
import ErrorPage from '~/components/ErrorPage'
import Footer from '~/components/Footer'
import Navbar from '~/components/Navbar'
import OfflineBanner from '~/components/OfflineBanner'
import { getSiteUrlFromEnv } from '~/lib/seo'
import { getNavMenu, getPageBySlug, getPostBySlug, getSiteSettings } from '~/lib/wordpress'
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
    const slug = normalizedPath.split('/').pop() || ''
    const page = await getPageBySlug(slug)
    const override = page?.acf?.menu_override?.trim()
    if (override) {
      menuLocation = override
    } else if (!page && !slug.includes('/')) {
      // No page matched — try as a blog post and inherit menu from its
      // primary category (first category with a menu_override wins).
      const post = await getPostBySlug(slug)
      const catOverride = post?.categories
        ?.find((c) => c.menu_override?.trim())
        ?.menu_override?.trim()
      if (catOverride) {
        menuLocation = catOverride
      }
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

/**
 * Layout wraps both the default component and the ErrorBoundary so the HTML
 * shell (head, scripts, etc.) is never duplicated.  When the root loader
 * throws (e.g. WP is down) loader data is unavailable — we render a minimal
 * shell without the Navbar / Footer so the ErrorBoundary still looks clean.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  // useRouteLoaderData returns undefined (instead of throwing) when the
  // loader errored, so it's safe to call inside the shared Layout.
  const data = useRouteLoaderData('root') as RootLoaderData | undefined
  const navMenu = data?.navMenu ?? []
  const siteSettings = data?.siteSettings

  const siteUrl = getSiteUrlFromEnv()
  const organizationSchema = siteSettings
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: siteSettings.site_name || 'Studio Zanetti',
        url: siteUrl,
        sameAs: siteSettings.social_links
          .map((link) => link.url)
          .filter((url) => url.trim().length > 0),
      }
    : null

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {organizationSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
        )}
        <Meta />
        <Links />
      </head>
      <body>
        <OfflineBanner />
        <div className="layout">
          {siteSettings && navMenu.length > 0 && (
            <Navbar items={navMenu} siteName={siteSettings.site_name} />
          )}
          <main id="main-content" className="main-content" tabIndex={-1}>
            {children}
          </main>
          {siteSettings && navMenu.length > 0 && (
            <Footer items={navMenu} siteSettings={siteSettings} />
          )}
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

export default function Root() {
  return <Outlet />
}

/**
 * Determines whether a thrown error looks like a network / fetch failure
 * (as opposed to a coded HTTP error response from the server).
 */
function looksLikeNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (error instanceof Error && /fetch|network|abort/i.test(error.message)) return true
  return false
}

export function ErrorBoundary() {
  const error = useRouteError()
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  // Client-side navigation while offline — show offline page
  if (isOffline) {
    return <ErrorPage variant="offline" />
  }

  // Server returned an HTTP error (e.g. 502, 500)
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      // This only fires if somehow a 404 bubbles past child error boundaries
      return <ErrorPage variant="generic" status={404} />
    }
    return <ErrorPage variant="server" status={error.status} />
  }

  // TypeError / network failure when navigator still reports online
  if (looksLikeNetworkError(error)) {
    return <ErrorPage variant="server" />
  }

  return <ErrorPage variant="generic" />
}
