/**
 * Mirror of WordPress's `wpautop()` for the front-end.
 *
 * Why this exists:
 * The TinyMCE WYSIWYG in WP admin produces `<p>` and `<br>` tags as you type,
 * but the value reaching the React front-end can arrive as a mix of block-level
 * HTML (`<h1>`, `<h2>`, …) and "loose" text separated by blank lines, with no
 * `<p>` wrapping around the loose text. `dangerouslySetInnerHTML` then
 * collapses the newlines into spaces, producing one continuous sentence even
 * though the editor showed proper paragraphs.
 *
 * Behaviour matches WordPress:
 *   - Two or more consecutive newlines  → paragraph break
 *   - A single newline inside a chunk   → <br />
 *   - Chunks that already start with a block-level tag are emitted as-is
 *     (so `<h2>…</h2>`, `<p>…</p>`, lists, blockquotes etc. are never
 *     wrapped in an extra `<p>`).
 */

// Tags that should never be wrapped in an enclosing <p>. Mirrors the list
// WordPress uses inside wpautop().
const BLOCK_LEVEL_TAGS = [
  'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 'dl',
  'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'iframe', 'li', 'main', 'nav',
  'noscript', 'ol', 'output', 'p', 'pre', 'section', 'table', 'tbody', 'td',
  'tfoot', 'th', 'thead', 'tr', 'ul', 'video',
]

const BLOCK_TAG_GROUP = BLOCK_LEVEL_TAGS.join('|')

/**
 * Matches any opening or closing block-level tag at the start of a chunk
 * (allowing leading whitespace). Used to decide whether a blank-line-separated
 * chunk should be wrapped in `<p>…</p>`.
 */
const STARTS_WITH_BLOCK_TAG = new RegExp(`^\\s*<\\s*\\/?\\s*(?:${BLOCK_TAG_GROUP})\\b`, 'i')

/**
 * Apply WordPress-compatible auto-paragraph rules to the given string.
 *
 * - Loose text between blank lines is wrapped in `<p>`.
 * - Single newlines inside a wrapped chunk become `<br />`.
 * - Chunks starting with a block-level element are passed through untouched.
 * - Idempotent for content that is already fully wrapped in block elements.
 */
export const autoParagraph = (input: string): string => {
  if (!input) return ''

  // Normalise line endings so \r\n and \r behave like \n.
  const normalised = input
    .replace(/\r\n?/g, '\n')
    // Treat &nbsp; on its own line as an empty separator (the classic editor
    // produces these when the user presses Enter on an empty line).
    .replace(/^\s*&nbsp;\s*$/gm, '')

  // Split into chunks on blank lines.
  const chunks = normalised.split(/\n{2,}/)

  const out: string[] = []
  for (const raw of chunks) {
    const chunk = raw.trim()
    if (!chunk) continue

    if (STARTS_WITH_BLOCK_TAG.test(chunk)) {
      // Already a block-level element (or starts with one) — leave alone.
      out.push(chunk)
    } else {
      // Loose text/inline content — wrap in <p> and convert single newlines
      // to <br />.
      const withBreaks = chunk.replace(/\n/g, '<br />')
      out.push(`<p>${withBreaks}</p>`)
    }
  }

  // Remove trailing "empty" paragraphs WordPress editors can emit
  // (e.g. <p>&nbsp;</p> or <p><br></p>) so blocks don't pick up phantom bottom space.
  return out
    .join('\n')
    .replace(/(?:\s*<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+$/gi, '')
}
