import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
  async prerender() {
    // All public pages are now WordPress-driven via the catch-all route.
    // Only prerender paths that actually exist in WordPress at build time.
    const wpUrl = process.env.WORDPRESS_URL
    if (!wpUrl) return []

    try {
      const [pagesRes, postsRes] = await Promise.all([
        fetch(`${wpUrl}/wp-json/wp/v2/pages?per_page=100&status=publish`, {
          signal: AbortSignal.timeout(5_000),
        }),
        fetch(`${wpUrl}/wp-json/sz/v1/all-posts`, {
          signal: AbortSignal.timeout(5_000),
        }),
      ])

      const pagePaths: string[] = []
      if (pagesRes.ok) {
        const pages = (await pagesRes.json()) as Array<{ slug: string }>
        pagePaths.push(
          ...pages
            .map((p) => (p.slug === 'home' ? '/' : `/${p.slug}`))
            .filter((s) => s !== '/preview'),
        )
      }

      if (postsRes.ok) {
        const posts = (await postsRes.json()) as Array<{ slug: string }>
        pagePaths.push(...posts.map((p) => `/${p.slug}`))
      }

      return pagePaths
        .filter((s) => s.trim().length > 0)
        .filter((value, index, arr) => arr.indexOf(value) === index)
    } catch {
      return []
    }
  },
} satisfies Config
