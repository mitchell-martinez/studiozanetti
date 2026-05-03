#!/usr/bin/env node

import { parseArgs } from './import-live-gallery.mjs'

function printHelp() {
  console.log(`
Migrate legacy inline ACF galleries blocks to reusable gallery references.

Usage:
  npm run gallery:migrate-inline-to-references -- --wp-url <wp-root> [target] [auth] [options]

Target:
  --page-id <number>         Migrate a single WordPress page by ID
  --page-slug <slug>         Migrate a single WordPress page by slug
  --all-pages                Scan all published pages and migrate any inline galleries found

Auth (required for --execute):
  --username <value>         WordPress username (Application Password auth)
  --app-password <value>     WordPress Application Password

Options:
  --execute                  Actually write changes to WordPress
  --verbose                  Print detailed progress logs and long-request heartbeat
  --help                     Show this help

Examples:
  npm run gallery:migrate-inline-to-references -- --wp-url https://cms.example.com --page-slug events-and-awards-photography-sydney

  npm run gallery:migrate-inline-to-references -- --wp-url https://cms.example.com --all-pages --username admin --app-password "xxxx xxxx xxxx xxxx xxxx xxxx" --execute
`)
}

function getArg(args, key, fallback = null) {
  return args[key] ?? fallback
}

function buildAuthHeader(username, appPassword) {
  if (!username || !appPassword) return null
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64')
  return `Basic ${token}`
}

function slugify(value, fallback = 'gallery') {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || fallback
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
      console.log(`[verbose] ${label} completed in ${Date.now() - startedAt}ms`)
    }

    return data
  } finally {
    if (heartbeat) clearInterval(heartbeat)
  }
}

async function writeBlocksViaWpV2({ base, pageId, pageAcf, blocks, authHeader, verbose = false }) {
  return fetchJson(
    `${base}/wp-json/wp/v2/pages/${pageId}`,
    {
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
    },
    { verbose, label: 'wp/v2 write' },
  )
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
      return await fetchJson(url, { method: 'POST', headers, body: payload }, {
        verbose,
        label: `acf/v3 write (${url.split('/').slice(-2).join('/')})`,
      })
    } catch (error) {
      lastError = error
      if (Number(error?.status || 0) !== 404) throw error
    }
  }

  const error = new Error(
    lastError
      ? `ACF REST write endpoint not found. Last error: ${lastError.message}`
      : 'ACF REST write endpoint not found.',
  )
  error.code = 'acf_rest_route_missing'
  throw error
}

async function writeBlocksViaSzEndpoint({ base, pageId, blocks, authHeader, verbose = false }) {
  return fetchJson(
    `${base}/wp-json/sz/v1/page-blocks/${pageId}`,
    {
      method: 'POST',
      headers: {
        authorization: authHeader,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ blocks }),
    },
    { verbose, label: 'sz/v1 page-blocks write' },
  )
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
  return fetchJson(
    `${base}/wp-json/sz/v1/gallery-library`,
    {
      method: 'POST',
      headers: {
        authorization: authHeader,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title, slug, description, images }),
    },
    { verbose, label: 'sz/v1 gallery-library write' },
  )
}

async function resolvePage({ wpUrl, pageId, pageSlug, verbose = false }) {
  const base = wpUrl.replace(/\/$/, '')

  if (pageId) {
    return fetchJson(`${base}/wp-json/wp/v2/pages/${pageId}`, {}, {
      verbose,
      label: 'resolve page by ID',
    })
  }

  const slugQuery = new URLSearchParams({ slug: pageSlug, _fields: 'id,slug,title,acf' }).toString()
  const pages = await fetchJson(`${base}/wp-json/wp/v2/pages?${slugQuery}`, {}, {
    verbose,
    label: 'resolve page by slug',
  })

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`No WordPress page found for slug "${pageSlug}"`)
  }

  return pages[0]
}

async function resolveAllPages({ wpUrl, verbose = false }) {
  const base = wpUrl.replace(/\/$/, '')
  const pages = []
  let pageNumber = 1

  while (true) {
    const query = new URLSearchParams({
      per_page: '100',
      page: String(pageNumber),
      _fields: 'id,slug,title,acf',
      status: 'publish',
    }).toString()

    const batch = await fetchJson(`${base}/wp-json/wp/v2/pages?${query}`, {}, {
      verbose,
      label: `list pages batch ${pageNumber}`,
    })

    if (!Array.isArray(batch) || batch.length === 0) break
    pages.push(...batch)

    if (batch.length < 100) break
    pageNumber += 1
  }

  return pages
}

function buildReusableGalleryTitle(page, block, blockIndex) {
  const blockHeading = String(block?.heading || '').trim()
  if (blockHeading) return blockHeading

  const renderedTitle = String(page?.title?.rendered || '').replace(/<[^>]+>/g, '').trim()
  if (renderedTitle) {
    return `${renderedTitle} Gallery ${blockIndex + 1}`
  }

  return `Gallery ${blockIndex + 1}`
}

function buildReusableGallerySlug(page, block, blockIndex) {
  const pageSlug = slugify(page?.slug || 'page', 'page')
  const blockPart = slugify(block?.heading || `gallery-${blockIndex + 1}`)
  return `${pageSlug}-${blockPart}-${blockIndex + 1}`
}

function planPageMigration(page) {
  const currentBlocks = Array.isArray(page?.acf?.blocks) ? page.acf.blocks : []
  let migratedCount = 0

  const nextBlocks = currentBlocks.map((block, index) => {
    if (block?.acf_fc_layout !== 'galleries' || !Array.isArray(block.images) || block.images.length === 0) {
      return block
    }

    migratedCount += 1

    return {
      acf_fc_layout: 'gallery_reference',
      gallery_reference_meta: {
        title: buildReusableGalleryTitle(page, block, index),
        slug: buildReusableGallerySlug(page, block, index),
        description: block.description || '',
        images: block.images,
      },
      desktop_columns: block.desktop_columns,
      mobile_columns: block.mobile_columns,
    }
  })

  return {
    page,
    currentBlocks,
    nextBlocks,
    migratedCount,
  }
}

async function persistPageMigration({ base, plan, authHeader, verbose = false }) {
  const blocks = []

  for (const block of plan.nextBlocks) {
    if (block?.acf_fc_layout !== 'gallery_reference' || !block.gallery_reference_meta) {
      blocks.push(block)
      continue
    }

    const reusableGallery = await writeGalleryLibraryItemViaSzEndpoint({
      base,
      title: block.gallery_reference_meta.title,
      slug: block.gallery_reference_meta.slug,
      description: block.gallery_reference_meta.description,
      images: block.gallery_reference_meta.images,
      authHeader,
      verbose,
    })

    blocks.push({
      acf_fc_layout: 'gallery_reference',
      gallery_reference: reusableGallery.id,
      desktop_columns: block.desktop_columns,
      mobile_columns: block.mobile_columns,
    })
  }

  try {
    await writeBlocksViaWpV2({
      base,
      pageId: plan.page.id,
      pageAcf: plan.page.acf,
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

    try {
      await writeBlocksViaAcfV3({
        base,
        pageId: plan.page.id,
        blocks,
        authHeader,
        verbose,
      })
    } catch (acfError) {
      if (acfError?.code !== 'acf_rest_route_missing') throw acfError

      await writeBlocksViaSzEndpoint({
        base,
        pageId: plan.page.id,
        blocks,
        authHeader,
        verbose,
      })
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const wpUrl = getArg(args, 'wp-url')
  const pageId = getArg(args, 'page-id')
  const pageSlug = getArg(args, 'page-slug')
  const allPages = Boolean(args['all-pages'])
  const execute = Boolean(args.execute)
  const verbose = Boolean(args.verbose)

  if (!wpUrl) throw new Error('Missing required argument: --wp-url')
  if (!pageId && !pageSlug && !allPages) {
    throw new Error('Provide --page-id, --page-slug, or --all-pages')
  }

  const base = wpUrl.replace(/\/$/, '')
  const pages = allPages
    ? await resolveAllPages({ wpUrl, verbose })
    : [await resolvePage({ wpUrl, pageId, pageSlug, verbose })]

  const plans = pages
    .map((page) => planPageMigration(page))
    .filter((plan) => plan.migratedCount > 0)

  if (plans.length === 0) {
    console.log('No legacy inline galleries blocks found in the selected pages.')
    return
  }

  const migratedBlocks = plans.reduce((sum, plan) => sum + plan.migratedCount, 0)
  console.log(`Found ${migratedBlocks} legacy galleries block(s) across ${plans.length} page(s).`)

  for (const plan of plans) {
    console.log(`- page ${plan.page.id} (${plan.page.slug}): ${plan.migratedCount} block(s) to migrate`)
    for (const block of plan.nextBlocks) {
      if (block?.acf_fc_layout === 'gallery_reference' && block.gallery_reference_meta) {
        console.log(`  -> ${block.gallery_reference_meta.slug}`)
      }
    }
  }

  if (!execute) {
    console.log('\nDry run only. No changes written. Add --execute to migrate these pages.')
    return
  }

  const authHeader = buildAuthHeader(args.username, args['app-password'])
  if (!authHeader) {
    throw new Error('--execute requires --username and --app-password')
  }

  for (const plan of plans) {
    await persistPageMigration({ base, plan, authHeader, verbose })
    console.log(`Migrated page ${plan.page.id} (${plan.page.slug})`) 
  }

  console.log(`\nSuccess: migrated ${migratedBlocks} galleries block(s) across ${plans.length} page(s).`)
}

main().catch((error) => {
  console.error(`Inline galleries migration failed: ${error.message}`)
  process.exitCode = 1
})