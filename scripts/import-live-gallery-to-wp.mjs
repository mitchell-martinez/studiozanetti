#!/usr/bin/env node

import {
  fetchLiveGalleryBlock,
  parseArgs,
  printHelp,
  titleFromSlug,
} from './import-live-gallery.mjs'

function printWpHelp() {
  printHelp()
  console.log(
    `\nWrite-to-WordPress mode:\n  npm run gallery:import-live-to-wp -- --source-url <gallery-url> --wp-url <wp-root> [target] [auth] [options]\n\nTarget (choose one):\n  --page-id <number>         WordPress page ID\n  --page-slug <slug>         WordPress page slug\n\nAuth (required for --execute):\n  --username <value>         WordPress username (Application Password auth)\n  --app-password <value>     WordPress Application Password\n\nOptions:\n  --heading <value>          Heading for block (default from source URL slug)\n  --scope <css-selector>     DOM scope selector when scraping source (default: main)\n  --limit <number>           Max images to import\n  --include-external         Include image URLs from other hosts\n  --mode append|replace      append (default): add new block; replace: replace first galleries block\n  --execute                  Actually write changes to WordPress\n  --help                     Show this help\n\nWrite order:\n  1) wp/v2 pages with acf payload\n  2) acf/v3 pages/posts routes\n  3) sz/v1/page-blocks custom endpoint (ACF Pro compatible)\n\nExamples:\n  npm run gallery:import-live-to-wp -- --source-url https://studiozanetti.com.au/gallery/stylish-brides/ --wp-url https://cms.example.com --page-slug gallery --mode append\n\n  npm run gallery:import-live-to-wp -- --source-url https://studiozanetti.com.au/gallery/stylish-brides/ --wp-url https://cms.example.com --page-id 123 --username admin --app-password \"xxxx xxxx xxxx xxxx xxxx xxxx\" --mode replace --execute\n`,
  )
}

function getArg(args, key, fallback = null) {
  return args[key] ?? fallback
}

function buildAuthHeader(username, appPassword) {
  if (!username || !appPassword) return null
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64')
  return `Basic ${token}`
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, init)
  const raw = await response.text()

  let data = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = { raw }
  }

  if (!response.ok) {
    const message = data?.message || response.statusText || 'Request failed'
    const error = new Error(`${response.status} ${message}`)
    error.status = response.status
    error.code = data?.code
    error.payload = data
    throw error
  }

  return data
}

async function writeBlocksViaWpV2({ base, pageId, pageAcf, blocks, authHeader }) {
  return fetchJson(`${base}/wp-json/wp/v2/pages/${pageId}`, {
    method: 'POST',
    headers: {
      authorization: authHeader,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      acf: {
        ...(pageAcf || {}),
        blocks,
      },
    }),
  })
}

async function writeBlocksViaAcfV3({ base, pageId, blocks, authHeader }) {
  const payload = JSON.stringify({
    fields: {
      blocks,
    },
  })

  const headers = {
    authorization: authHeader,
    'content-type': 'application/json',
  }

  const candidates = [
    `${base}/wp-json/acf/v3/pages/${pageId}`,
    `${base}/wp-json/acf/v3/posts/${pageId}`,
  ]

  let lastError = null
  for (const url of candidates) {
    try {
      return await fetchJson(url, {
        method: 'POST',
        headers,
        body: payload,
      })
    } catch (error) {
      lastError = error
      const status = Number(error?.status || 0)
      // Only continue probing alternate ACF routes for route-not-found responses.
      if (status !== 404) throw error
    }
  }

  const message =
    'ACF REST write endpoint not found. Expected /wp-json/acf/v3/pages/<id> or /wp-json/acf/v3/posts/<id>. Install/enable ACF to REST API (or ACF REST write support) on the WordPress backend.'

  const error = new Error(
    lastError ? `${message} Last error: ${lastError.message}` : message,
  )
  error.code = 'acf_rest_route_missing'
  throw error
}

async function writeBlocksViaSzEndpoint({ base, pageId, blocks, authHeader }) {
  return fetchJson(`${base}/wp-json/sz/v1/page-blocks/${pageId}`, {
    method: 'POST',
    headers: {
      authorization: authHeader,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      blocks,
    }),
  })
}

function upsertGalleriesBlock(existingBlocks, nextBlock, mode) {
  const blocks = Array.isArray(existingBlocks) ? [...existingBlocks] : []

  if (mode === 'replace') {
    const index = blocks.findIndex((block) => block?.acf_fc_layout === 'galleries')
    if (index >= 0) {
      blocks[index] = nextBlock
      return { blocks, action: 'replaced-existing-galleries' }
    }
  }

  blocks.push(nextBlock)
  return { blocks, action: 'appended-new-galleries' }
}

async function resolvePage({ wpUrl, pageId, pageSlug }) {
  const base = wpUrl.replace(/\/$/, '')

  if (pageId) {
    const page = await fetchJson(`${base}/wp-json/wp/v2/pages/${pageId}`)
    return page
  }

  const slugQuery = new URLSearchParams({ slug: pageSlug, _fields: 'id,slug,title,acf' }).toString()
  const pages = await fetchJson(`${base}/wp-json/wp/v2/pages?${slugQuery}`)

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`No WordPress page found for slug "${pageSlug}"`)
  }

  return pages[0]
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printWpHelp()
    return
  }

  const sourceUrl = getArg(args, 'source-url', args.url)
  const wpUrl = getArg(args, 'wp-url')
  const pageId = getArg(args, 'page-id')
  const pageSlug = getArg(args, 'page-slug')
  const heading = getArg(args, 'heading', sourceUrl ? titleFromSlug(sourceUrl) : null)
  const scopeSelector = getArg(args, 'scope', 'main')
  const limit = args.limit ? Number.parseInt(args.limit, 10) : null
  const mode = getArg(args, 'mode', 'append')
  const execute = Boolean(args.execute)

  if (!sourceUrl) throw new Error('Missing required argument: --source-url')
  if (!wpUrl) throw new Error('Missing required argument: --wp-url')
  if (!pageId && !pageSlug) {
    throw new Error('Provide either --page-id or --page-slug')
  }

  if (!['append', 'replace'].includes(mode)) {
    throw new Error('--mode must be either append or replace')
  }

  const galleryBlock = await fetchLiveGalleryBlock({
    url: sourceUrl,
    heading,
    scopeSelector,
    limit,
    includeExternal: Boolean(args.includeExternal),
  })

  const page = await resolvePage({ wpUrl, pageId, pageSlug })
  const currentBlocks = page?.acf?.blocks ?? []

  const { blocks, action } = upsertGalleriesBlock(currentBlocks, galleryBlock, mode)

  console.log(`Prepared galleries block with ${galleryBlock.images.length} images`)
  console.log(`Target page: id=${page.id} slug=${page.slug}`)
  console.log(`Action: ${action}`)
  console.log(`Existing blocks: ${Array.isArray(currentBlocks) ? currentBlocks.length : 0}`)
  console.log(`Updated blocks: ${blocks.length}`)

  if (!execute) {
    console.log('\nDry run only. No changes written. Add --execute to update WordPress.')
    return
  }

  const authHeader = buildAuthHeader(args.username, args['app-password'])
  if (!authHeader) {
    throw new Error('--execute requires --username and --app-password')
  }

  const base = wpUrl.replace(/\/$/, '')
  try {
    await writeBlocksViaWpV2({
      base,
      pageId: page.id,
      pageAcf: page.acf,
      blocks,
      authHeader,
    })
  } catch (error) {
    const msg = String(error?.message || '')
    const shouldFallbackToAcfV3 =
      msg.includes('Invalid parameter(s): acf') ||
      msg.includes('rest_invalid_param') ||
      msg.includes('rest_unknown_parameter')

    if (!shouldFallbackToAcfV3) throw error

    console.log('wp/v2 rejected `acf` writes, retrying through ACF REST routes...')
    try {
      await writeBlocksViaAcfV3({
        base,
        pageId: page.id,
        blocks,
        authHeader,
      })
    } catch (acfError) {
      const isAcfRouteMissing = acfError?.code === 'acf_rest_route_missing'
      if (!isAcfRouteMissing) throw acfError

      console.log('ACF REST routes unavailable, retrying through /sz/v1/page-blocks/<id>...')
      await writeBlocksViaSzEndpoint({
        base,
        pageId: page.id,
        blocks,
        authHeader,
      })
    }
  }

  console.log(`\nSuccess: Updated page ${page.id} (${page.slug}) with imported gallery block.`)
}

main().catch((error) => {
  console.error(`Gallery import-to-WP failed: ${error.message}`)
  process.exitCode = 1
})
