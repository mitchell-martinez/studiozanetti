import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pluginPath = resolve('wordpress/mu-plugins/sz-website-help.php')

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

// Use the real PHP template without duplicating its markup. This is not a PHP runtime.
export function renderHelp(mode: 'drawer' | 'page') {
  const source = readFileSync(pluginPath, 'utf8')
  const start = source.indexOf('<div class="sz-website-help-app"')
  const end = source.indexOf('\n\t<?php\n}', start)
  if (start < 0 || end < 0) throw new Error('Website Help app template not found')
  const app = source.slice(start, end)
  let markup: string
  if (mode === 'drawer') {
    const drawerStart = source.indexOf('<button type="button" class="sz-website-help-launcher"')
    const drawerEnd = source.indexOf('\n\t<?php\n} );', drawerStart)
    if (drawerStart < 0 || drawerEnd < 0) throw new Error('Website Help drawer template not found')
    markup = source
      .slice(drawerStart, drawerEnd)
      .replace("<?php sz_website_help_render_app( 'drawer' ); ?>", app)
  } else {
    markup = `<div class="sz-website-help-page">${app}</div>`
  }
  markup = markup
    .replaceAll('<?php echo esc_attr( $mode ); ?>', mode)
    .replaceAll(
      "<?php echo esc_url( admin_url( 'admin.php?page=sz-website-help' ) ); ?>",
      '?page=sz-website-help',
    )
    .replace(
      /<\?php (?:esc_html_e|esc_attr_e)\( '([^']*)', 'studio-zanetti' \); \?>/g,
      (_, text: string) => escapeHtml(text),
    )
  if (markup.includes('<?php'))
    throw new Error('Unsupported PHP expression in Website Help test template')
  return markup
}
