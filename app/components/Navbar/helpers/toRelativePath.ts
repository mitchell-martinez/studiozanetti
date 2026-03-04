/** Convert a WordPress absolute URL to a relative path for react-router. */
export function toRelativePath(url: string): string {
  if (url.startsWith('/')) return url
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search + parsed.hash || '/'
  } catch {
    return url
  }
}
