import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
  async prerender() {
    // All public pages are now WordPress-driven via the catch-all route.
    // Only prerender paths that actually exist in WordPress at build time.
    const wpUrl = process.env.WORDPRESS_URL
    if (!wpUrl) return []

    try {
      const res = await fetch(`${wpUrl}/wp-json/wp/v2/pages?per_page=100&status=publish`, {
        signal: AbortSignal.timeout(5_000),
      })
      if (!res.ok) return []
      const pages = (await res.json()) as Array<{ slug: string }>
      return pages
        .map((p) => (p.slug === 'home' ? '/' : `/${p.slug}`))
        .filter((s) => s !== '/preview')
        .filter((s) => s.trim().length > 0)
        .filter((value, index, arr) => arr.indexOf(value) === index)
    } catch {
      return []
    }
  },
} satisfies Config
