/**
 * Mirror of WordPress's `wpautop()` for the front-end.
 *
 * Why this exists:
 * The TinyMCE WYSIWYG in WP admin produces `<p>` and `<br>` tags as you type,
 * but the value reaching the React front-end can arrive as plain text with
 * raw newlines (e.g. when an ACF wysiwyg field is exposed via REST without
 * `wpautop` applied, or when content is imported / pasted as plain text).
 *
 * Without this helper, `dangerouslySetInnerHTML` collapses `\n` characters
 * to a single space, so multi-paragraph text renders as one continuous
 * sentence even though it looked correct while editing.
 *
 * Behaviour matches WordPress:
 *   - Two or more consecutive newlines  → new <p>…</p>
 *   - A single newline inside a block   → <br />
 *   - Content already containing block-level HTML is left untouched.
 */

const BLOCK_LEVEL_TAG = /<\/?(?:address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|noscript|ol|output|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul|video)\b/i

/**
 * Returns true when the given HTML already contains at least one block-level
 * element. We treat such content as "already formatted" and skip auto-paragraph
 * processing to avoid double-wrapping.
 */
const hasBlockLevelHtml = (html: string): boolean => BLOCK_LEVEL_TAG.test(html)

/**
 * Apply WordPress-compatible auto-paragraph rules to the given string.
 *
 * - Idempotent on already-wrapped HTML (returns input unchanged).
 * - Trims leading/trailing whitespace from the final result.
 */
export const autoParagraph = (input: string): string => {
  if (!input) return ''

  // Normalise line endings so \r\n and \r behave like \n.
  const normalised = input.replace(/\r\n?/g, '\n')

  // If the content already has any block-level HTML, trust the source.
  if (hasBlockLevelHtml(normalised)) {
    return normalised
  }

  // Split into paragraphs on blank lines, then convert single newlines to <br />.
  const paragraphs = normalised
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter((para) => para.length > 0)
    .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)

  return paragraphs.join('\n')
}
