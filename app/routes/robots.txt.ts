import type { LoaderFunctionArgs } from 'react-router'
import { getSiteUrlFromEnv } from '~/lib/seo'

export async function loader({ request }: LoaderFunctionArgs) {
  const siteUrl = getSiteUrlFromEnv()
  const host = new URL(request.url).host

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /preview',
    'Disallow: /preview*',
    'Disallow: /wp-admin',
    'Disallow: /wp-login.php',
    '',
    `Host: ${host}`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
