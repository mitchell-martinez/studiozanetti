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
    `\nWrite-to-WordPress mode:\n  npm run gallery:import-live-to-wp -- --source-url <gallery-url> --wp-url <wp-root> [target] [auth] [options]\n\nTarget (choose one):\n  --page-id <number>         WordPress page ID\n  --page-slug <slug>         WordPress page slug\n\nAuth (required for --execute):\n  --username <value>         WordPress username (Application Password auth)\n  --app-password <value>     WordPress Application Password\n\nOptions:\n  --heading <value>          Gallery title / heading (default from source URL slug)\n  --gallery-slug <value>     Stable reusable gallery slug (default from source URL)\n  --scope <css-selector>     DOM scope selector when scraping source (default: main)\n  --limit <number>           Max images to import\n  --include-external         Include image URLs from other hosts\n  --mode append|replace      append (default): add new block; replace: replace first gallery-like block\n  --storage-mode inline|reference\n                            reference (default): create reusable gallery + insert gallery_reference block\n                            inline: write legacy inline galleries block directly onto the page\n  --execute                  Actually write changes to WordPress\n  --verbose                  Print detailed progress logs and long-request heartbeat\n  --help                     Show this help\n\nWrite order:\n  1) reusable gallery library via sz/v1/gallery-library (reference mode only)\n  2) wp/v2 pages with acf payload\n  3) acf/v3 pages/posts routes\n  4) sz/v1/page-blocks custom endpoint (ACF Pro compatible)\n\nExamples:\n  npm run gallery:import-live-to-wp -- --source-url https://studiozanetti.com.au/gallery/stylish-brides/ --wp-url https://cms.example.com --page-slug gallery --mode append\n\n  npm run gallery:import-live-to-wp -- --source-url https://studiozanetti.com.au/gallery/stylish-brides/ --wp-url https://cms.example.com --page-id 123 --username admin --app-password "xxxx xxxx xxxx xxxx xxxx xxxx" --mode replace --execute\n`,
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

function slugFromUrl(sourceUrl, fallback = 'gallery') {
  try {
    const pathname = new URL(sourceUrl).pathname
    const segments = pathname.split('/').filter(Boolean)
    return segments.at(-1) || fallback
  } catch {
    return fallback
  }
}

async function fetchJson(url, init = {}, { verbose = false, label = 'request' } = {}) {
  const startedAt = Date.now()
  let heartbeat = null

  if (verbose) {
    console.log(`[verbose] ${label} -> ${url}`)
    heartbeat = setInterval(() => {
      const seconds = Math.round((Date.now() - startedAt) / 1000)
      console.log(`[verbose] ${label} still running... ${seconds}s elapsed`)
    }, 5000)
  }

  try {
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

    if (verbose) {
      const durationMs = Date.now() - startedAt
      console.log(`[verbose] ${label} completed in ${durationMs}ms`)
    }

    return data
  } finally {
    if (heartbeat) {
      clearInterval(heartbeat)
    }
  }
}

async function writeBlocksViaWpV2({ base, pageId, pageAcf, blocks, authHeader, verbose = false }) {
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
  }, { verbose, label: 'wp/v2 write' })
}

async function writeBlocksViaAcfV3({ base, pageId, blocks, authHeader, verbose = false }) {
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
      }, { verbose, label: `acf/v3 write (${url.split('/').slice(-2).join('/')})` })
    } catch (error) {
      lastError = error
      const status = Number(error?.status || 0)
      // Only continue probing alternate ACF routes for route-not-found responses.
      if (status !== 404) throw error
    }
  }

  const message =
    'ACF REST write endpoint not found. Expected /wp-json/acf/v3/pages/<id> or /wp-json/acf/v3/posts/<id>. Install/enable ACF to REST API (or ACF REST write support) on the WordPress backend.'

  const error = new Error(lastError ? `${message} Last error: ${lastError.message}` : message)
  error.code = 'acf_rest_route_missing'
  throw error
}

async function writeBlocksViaSzEndpoint({ base, pageId, blocks, authHeader, verbose = false }) {
  return fetchJson(`${base}/wp-json/sz/v1/page-blocks/${pageId}`, {
    method: 'POST',
    headers: {
      authorization: authHeader,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      blocks,
    }),
  }, { verbose, label: 'sz/v1 page-blocks write' })
}

async function writeGalleryLibraryItemViaSzEndpoint({
  base,
  title,
  slug,
  description,
  images,
  authHeader,
  verbose = false,
}) {
  return fetchJson(`${base}/wp-json/sz/v1/gallery-library`, {
    method: 'POST',
    headers: {
      authorization: authHeader,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      title,
      slug,
      description,
      images,
    }),
  }, { verbose, label: 'sz/v1 gallery-library write' })
}

function guessContentTypeFromUrl(url) {
  const lower = String(url || '').toLowerCase()
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.jpeg') || lower.endsWith('.jpg')) return 'image/jpeg'
  return 'application/octet-stream'
}

function sanitizeFileName(value, fallback = 'image') {
  const cleaned = String(value || '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || fallback
}

function fileNameFromImageUrl(url, index) {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname || ''
    const base = pathname.split('/').filter(Boolean).at(-1)
    return sanitizeFileName(base, `gallery-image-${index + 1}.jpg`)
  } catch {
    return `gallery-image-${index + 1}.jpg`
  }
}

async function uploadMediaFromUrlToWordPress({ base, authHeader, imageUrl, fileName, verbose = false }) {
  const sourceResponse = await fetch(imageUrl)
  if (!sourceResponse.ok) {
    throw new Error(`Failed to download source image (${sourceResponse.status}) ${imageUrl}`)
  }

  const sourceContentType = sourceResponse.headers.get('content-type') || ''
  const contentType = sourceContentType || guessContentTypeFromUrl(imageUrl)
  const binary = Buffer.from(await sourceResponse.arrayBuffer())

  return fetchJson(`${base}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      authorization: authHeader,
      'content-type': contentType,
      'content-disposition': `attachment; filename="${fileName}"`,
    },
    body: binary,
  }, { verbose, label: 'wp/v2 media upload' })
}

async function resolveExistingMediaIdBySourceUrl({ base, authHeader, imageUrl, verbose = false }) {
  const url = `${base}/wp-json/sz/v1/resolve-media?${new URLSearchParams({ source_url: imageUrl }).toString()}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: authHeader,
    },
  })

  if (response.status === 404) return null
  const raw = await response.text()
  let payload = null
  try {
    payload = raw ? JSON.parse(raw) : null
  } catch {
    payload = { raw }
  }

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'Failed to resolve media'
    throw new Error(`${response.status} ${message}`)
  }

  const id = Number(payload?.id)
  if (!Number.isFinite(id) || id <= 0) return null

  if (verbose) {
    console.log(`[verbose] media resolve hit -> ${imageUrl} (id=${id})`)
  }

  return id
}

async function buildWpMediaBackedGalleryRows({ base, authHeader, rows, verbose = false }) {
  const uploadedRows = []
  const mediaIdCache = new Map()

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const imageUrl = row?.image?.url
    if (!imageUrl) continue

    let mediaId = mediaIdCache.get(imageUrl) ?? null

    if (!mediaId) {
      mediaId = await resolveExistingMediaIdBySourceUrl({
        base,
        authHeader,
        imageUrl,
        verbose,
      })
    }

    if (!mediaId) {
      const media = await uploadMediaFromUrlToWordPress({
        base,
        authHeader,
        imageUrl,
        fileName: fileNameFromImageUrl(imageUrl, i),
        verbose,
      })

      const uploadedId = Number(media?.id)
      if (!Number.isFinite(uploadedId) || uploadedId <= 0) {
        throw new Error(`Media upload did not return a valid ID for ${imageUrl}`)
      }

      mediaId = uploadedId
      if (verbose) {
        console.log(`[verbose] media upload created -> ${imageUrl} (id=${mediaId})`)
      }
    }

    mediaIdCache.set(imageUrl, mediaId)

    uploadedRows.push({
      image: mediaId,
      caption: row?.caption || '',
    })
  }

  return uploadedRows
}

function upsertGalleriesBlock(existingBlocks, nextBlock, mode) {
  const blocks = Array.isArray(existingBlocks) ? [...existingBlocks] : []

  if (mode === 'replace') {
    const index = blocks.findIndex((block) =>
      ['galleries', 'gallery_reference'].includes(block?.acf_fc_layout),
    )
    if (index >= 0) {
      blocks[index] = nextBlock
      return { blocks, action: 'replaced-existing-gallery-block' }
    }
  }

  blocks.push(nextBlock)
  return { blocks, action: 'appended-new-gallery-block' }
}

async function resolvePage({ wpUrl, pageId, pageSlug, verbose = false }) {
  const base = wpUrl.replace(/\/$/, '')

  if (pageId) {
    const page = await fetchJson(
      `${base}/wp-json/wp/v2/pages/${pageId}`,
      {},
      { verbose, label: 'resolve page by ID' },
    )
    return page
  }

  const slugQuery = new URLSearchParams({ slug: pageSlug, _fields: 'id,slug,title,acf' }).toString()
  const pages = await fetchJson(
    `${base}/wp-json/wp/v2/pages?${slugQuery}`,
    {},
    { verbose, label: 'resolve page by slug' },
  )

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
  const gallerySlug = getArg(args, 'gallery-slug', sourceUrl ? slugFromUrl(sourceUrl) : 'gallery')
  const scopeSelector = getArg(args, 'scope', 'main')
  const limit = args.limit ? Number.parseInt(args.limit, 10) : null
  const mode = getArg(args, 'mode', 'append')
  const storageMode = getArg(args, 'storage-mode', 'reference')
  const execute = Boolean(args.execute)
  const verbose = Boolean(args.verbose)

  const verboseLog = (...messages) => {
    if (!verbose) return
    console.log('[verbose]', ...messages)
  }

  if (!sourceUrl) throw new Error('Missing required argument: --source-url')
  if (!wpUrl) throw new Error('Missing required argument: --wp-url')
  if (!pageId && !pageSlug) {
    throw new Error('Provide either --page-id or --page-slug')
  }

  if (!['append', 'replace'].includes(mode)) {
    throw new Error('--mode must be either append or replace')
  }

  if (!['inline', 'reference'].includes(storageMode)) {
    throw new Error('--storage-mode must be either inline or reference')
  }

  verboseLog('Starting gallery scrape', { sourceUrl, scopeSelector, limit: limit ?? 'none' })
  const galleryBlock = await fetchLiveGalleryBlock({
    url: sourceUrl,
    heading,
    scopeSelector,
    limit,
    includeExternal: Boolean(args.includeExternal),
    verbose,
  })

  const page = await resolvePage({ wpUrl, pageId, pageSlug, verbose })
  const currentBlocks = page?.acf?.blocks ?? []

  let nextBlock = galleryBlock
  let reusableGallery = null

  if (storageMode === 'reference' && execute) {
    const authHeader = buildAuthHeader(args.username, args['app-password'])
    if (!authHeader) {
      throw new Error('--execute requires --username and --app-password')
    }

    const base = wpUrl.replace(/\/$/, '')
    const attemptedImages = Array.isArray(galleryBlock?.images) ? galleryBlock.images.length : 0

    const writeGallery = async (imagesPayload) =>
      writeGalleryLibraryItemViaSzEndpoint({
        base,
        title: heading,
        slug: gallerySlug,
        description: galleryBlock.description || '',
        images: imagesPayload,
        authHeader,
        verbose,
      })

    try {
      reusableGallery = await writeGallery(galleryBlock.images)
    } catch (error) {
      const isImportFailure = Number(error?.status || 0) === 422
      if (!isImportFailure) throw error

      console.log('WordPress could not sideload source images. Uploading images via wp/v2/media and retrying...')
      const uploadedRows = await buildWpMediaBackedGalleryRows({
        base,
        authHeader,
        rows: galleryBlock.images,
        verbose,
      })
      reusableGallery = await writeGallery(uploadedRows)
    }

    let persistedImages = Array.isArray(reusableGallery?.images) ? reusableGallery.images.length : 0
    if (attemptedImages > 0 && persistedImages === 0) {
      console.log('Reusable gallery persisted 0 images. Retrying via wp/v2/media uploads...')
      const uploadedRows = await buildWpMediaBackedGalleryRows({
        base,
        authHeader,
        rows: galleryBlock.images,
        verbose,
      })
      reusableGallery = await writeGallery(uploadedRows)
      persistedImages = Array.isArray(reusableGallery?.images) ? reusableGallery.images.length : 0
    }

    if (attemptedImages > 0 && persistedImages === 0) {
      throw new Error(`Reusable gallery persisted 0 images after retry (attempted ${attemptedImages}).`)
    }

    nextBlock = {
      acf_fc_layout: 'gallery_reference',
      gallery_reference: reusableGallery.id,
      desktop_columns: galleryBlock.desktop_columns,
      mobile_columns: galleryBlock.mobile_columns,
    }
  } else if (storageMode === 'reference') {
    nextBlock = {
      acf_fc_layout: 'gallery_reference',
      gallery_reference: `(dry-run:${gallerySlug})`,
      desktop_columns: galleryBlock.desktop_columns,
      mobile_columns: galleryBlock.mobile_columns,
    }
  }

  const { blocks, action } = upsertGalleriesBlock(currentBlocks, nextBlock, mode)

  console.log(`Prepared galleries block with ${galleryBlock.images.length} images`)
  console.log(`Target page: id=${page.id} slug=${page.slug}`)
  console.log(`Storage mode: ${storageMode}`)
  console.log(`Action: ${action}`)
  console.log(`Existing blocks: ${Array.isArray(currentBlocks) ? currentBlocks.length : 0}`)
  console.log(`Updated blocks: ${blocks.length}`)
  if (reusableGallery) {
    console.log(`Reusable gallery: id=${reusableGallery.id} slug=${reusableGallery.slug}`)
  }

  if (!execute) {
    console.log('\nDry run only. No changes written. Add --execute to update WordPress.')
    return
  }

  const authHeader = buildAuthHeader(args.username, args['app-password'])
  if (!authHeader) {
    throw new Error('--execute requires --username and --app-password')
  }

  const base = wpUrl.replace(/\/$/, '')
  verboseLog('Write mode enabled. This may take time when WordPress imports media.')
  try {
    await writeBlocksViaWpV2({
      base,
      pageId: page.id,
      pageAcf: page.acf,
      blocks,
      authHeader,
      verbose,
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
        verbose,
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
        verbose,
      })
    }
  }

  console.log(`\nSuccess: Updated page ${page.id} (${page.slug}) with imported gallery block.`)
}

main().catch((error) => {
  console.error(`Gallery import-to-WP failed: ${error.message}`)
  process.exitCode = 1
})
