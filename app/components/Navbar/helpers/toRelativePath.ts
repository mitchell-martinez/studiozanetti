/** Convert a WordPress absolute URL to a relative path for react-router. */
const normalizePathname = (pathname: string): string => pathname.replace(/\/+$/, '') || '/'

export function toRelativePath(url: string): string {
  try {
    const parsed = new URL(url, 'https://studiozanetti.local')
    return `${normalizePathname(parsed.pathname)}${parsed.search}${parsed.hash}` || '/'
  } catch {
    return normalizePathname(url)
  }
}
