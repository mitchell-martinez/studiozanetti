const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&hellip;': '…',
}

/**
 * Decode HTML entities (named + numeric) that WordPress commonly produces.
 * Works on both server (Node/SSR) and client without DOM dependency.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&[a-zA-Z0-9#]+;/g, (entity) => ENTITIES[entity] ?? entity)
}

/**
 * Strip HTML tags and decode entities from WordPress rendered strings.
 * Use for rendering WP title/excerpt fields as plain text in React.
 */
export function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, '')).trim()
}
