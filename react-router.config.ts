import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
  async prerender() {
    // Always pre-render the core pages.
    const base = ['/', '/about', '/contact']

    // If WordPress is configured at build time, also pre-render any extra pages
    // Michael has created there (e.g. /pricing, /services).
    const wpUrl = process.env.WORDPRESS_URL
    if (!wpUrl) return base

    try {
      const res = await fetch(`${wpUrl}/wp-json/wp/v2/pages?per_page=100&status=publish`, {
        signal: AbortSignal.timeout(5_000),
      })
      if (!res.ok) return base
      const pages = (await res.json()) as Array<{ slug: string }>
      const extra = pages
        .map((p) => (p.slug === 'home' ? '/' : `/${p.slug}`))
        // gallery is always SSR — exclude it from static pre-rendering
        .filter((s) => !base.includes(s) && s !== '/gallery')
      return [...new Set([...base, ...extra])]
    } catch {
      return base
    }
  },
} satisfies Config
