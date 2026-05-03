#!/usr/bin/env node

import { JSDOM } from 'jsdom'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export function printHelp() {
  console.log(
    `\nImport a live gallery URL into a GalleriesBlock JSON payload.\n\nUsage:\n  npm run gallery:import-live -- --url <gallery-url> [options]\n\nRequired:\n  --url <value>              Live gallery page URL\n\nOptional:\n  --heading <value>          Heading for the generated block (default: derived from URL slug)\n  --out <file-path>          Output JSON file path (default: prints to stdout)\n  --limit <number>           Limit number of images (default: no limit)\n  --scope <css-selector>     DOM scope selector (default: main, fallback body)\n  --include-external         Include image URLs from other hosts\n  --verbose                  Print detailed progress logs\n  --help                     Show this help\n\nExamples:\n  npm run gallery:import-live -- --url https://studiozanetti.com.au/gallery/stylish-brides/\n  npm run gallery:import-live -- --url https://studiozanetti.com.au/gallery/stylish-brides/ --out app/components/blocks/GalleriesBlock/__mocks__/stylishBrides.json\n  npm run gallery:import-live -- --url https://studiozanetti.com.au/gallery/stylish-brides/ --heading \"Stylish Brides\" --limit 40\n`,
  )
}

export function parseArgs(argv) {
  const normalizedArgv = argv.flatMap((rawToken) => {
    if (typeof rawToken !== 'string') return []

    // Normalise pasted Unicode dashes/spaces from docs/chat apps.
    const normalizedToken = rawToken
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
      .trim()

    if (!normalizedToken) return []

    // If a pasted token collapsed "--key value" into one arg via non-breaking space,
    // recover by splitting only flag-prefixed tokens.
    if (normalizedToken.startsWith('--') && normalizedToken.includes(' ')) {
      return normalizedToken.split(/\s+/).filter(Boolean)
    }

    return [normalizedToken]
  })

  const args = {}
  const booleanFlags = new Set(['help', 'include-external', 'execute', 'verbose'])

  for (let i = 0; i < normalizedArgv.length; i += 1) {
    const token = normalizedArgv[i]

    if (!token.startsWith('--')) continue

    // Support --key=value syntax in addition to --key value.
    const eqIndex = token.indexOf('=')
    if (eqIndex > 2) {
      const rawKey = token.slice(2, eqIndex)
      const rawValue = token.slice(eqIndex + 1)

      if (booleanFlags.has(rawKey)) {
        args[rawKey === 'include-external' ? 'includeExternal' : rawKey] =
          rawValue === '' ? true : rawValue !== 'false'
      } else {
        args[rawKey] = rawValue
      }
      continue
    }

    if (token === '--help') {
      args.help = true
      continue
    }

    if (token === '--include-external') {
      args.includeExternal = true
      continue
    }

    if (token === '--execute') {
      args.execute = true
      continue
    }

    if (token === '--verbose') {
      args.verbose = true
      continue
    }

    const key = token.slice(2)
    const value = normalizedArgv[i + 1]

    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }

    args[key] = value
    i += 1
  }

  return args
}

export function titleFromSlug(url) {
  const parsed = new URL(url)
  const segments = parsed.pathname.split('/').filter(Boolean)
  const slug = segments.at(-1) || 'Gallery'

  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function looksLikeImageUrl(url) {
  return /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(url)
}

export function isWordPressUpload(url) {
  return /\/wp-content\/uploads\//i.test(url)
}

export function pickLargestFromSrcset(srcset) {
  if (!srcset) return null

  const candidates = srcset
    .split(',')
    .map((entry) => entry.trim())
    .map((entry) => {
      const parts = entry.split(/\s+/)
      const src = parts[0]
      const descriptor = parts[1] || '0w'
      const width = descriptor.endsWith('w') ? Number.parseInt(descriptor, 10) || 0 : 0
      return { src, width }
    })
    .filter((entry) => Boolean(entry.src))

  if (!candidates.length) return null

  candidates.sort((a, b) => b.width - a.width)
  return candidates[0].src
}

export function normalizeUrl(rawUrl, pageUrl) {
  if (!rawUrl) return null

  try {
    return new URL(rawUrl, pageUrl).toString()
  } catch {
    return null
  }
}

export function collectCandidates(scope, pageUrl, includeExternal) {
  const pageHost = new URL(pageUrl).hostname
  const map = new Map()

  const pushCandidate = (rawUrl, alt = '') => {
    const normalized = normalizeUrl(rawUrl, pageUrl)
    if (!normalized) return

    const normalizedHost = new URL(normalized).hostname
    if (!includeExternal && normalizedHost !== pageHost) return

    if (!looksLikeImageUrl(normalized) && !isWordPressUpload(normalized)) return

    if (!map.has(normalized)) {
      map.set(normalized, { url: normalized, alt: (alt || '').trim() })
      return
    }

    const existing = map.get(normalized)
    if (!existing.alt && alt) {
      map.set(normalized, { ...existing, alt: alt.trim() })
    }
  }

  scope.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href')
    const nestedImg = anchor.querySelector('img')

    if (href && (looksLikeImageUrl(href) || isWordPressUpload(href))) {
      pushCandidate(href, nestedImg?.getAttribute('alt') || '')
    }
  })

  scope.querySelectorAll('img').forEach((img) => {
    const alt = img.getAttribute('alt') || ''

    pushCandidate(img.getAttribute('data-full'), alt)
    pushCandidate(img.getAttribute('data-large_image'), alt)
    pushCandidate(img.getAttribute('data-src'), alt)
    pushCandidate(img.getAttribute('src'), alt)
    pushCandidate(pickLargestFromSrcset(img.getAttribute('srcset')), alt)
  })

  return [...map.values()]
}

export function buildBlockPayload(images, heading) {
  return {
    acf_fc_layout: 'galleries',
    heading,
    desktop_columns: 3,
    mobile_columns: 2,
    images: images.map((item, index) => {
      const generatedAlt = `${heading} ${String(index + 1).padStart(2, '0')}`
      const alt = item.alt || generatedAlt
      return {
        image: {
          url: item.url,
          alt,
        },
        ...(item.alt ? { caption: item.alt } : {}),
      }
    }),
  }
}

export async function fetchLiveGalleryBlock({
  url,
  heading,
  scopeSelector = 'main',
  limit = null,
  includeExternal = false,
  verbose = false,
}) {
  if (!url) {
    throw new Error('Missing required argument: --url')
  }

  if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) {
    throw new Error('--limit must be a positive integer')
  }

  if (verbose) {
    console.log(`[verbose] Fetching source page: ${url}`)
  }

  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (compatible; StudioZanettiGalleryImporter/1.0; +https://studiozanetti.com.au)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page (${response.status} ${response.statusText})`)
  }

  const html = await response.text()
  const dom = new JSDOM(html, { url })
  const document = dom.window.document

  const matchedScope = document.querySelector(scopeSelector)
  const scope = matchedScope || document.body
  if (verbose) {
    console.log(
      `[verbose] Scope selector \"${scopeSelector}\" ${matchedScope ? 'matched' : 'not found, using <body>'}`,
    )
  }

  let candidates = collectCandidates(scope, url, includeExternal)
  if (verbose) {
    console.log(`[verbose] Found ${candidates.length} candidate images before limit`)
  }

  if (limit !== null) {
    candidates = candidates.slice(0, limit)
    if (verbose) {
      console.log(`[verbose] Applied --limit=${limit}; ${candidates.length} images remain`)
    }
  }

  if (!candidates.length) {
    throw new Error(
      `No images found for ${url}. Try --scope with a narrower selector or --include-external.`,
    )
  }

  return buildBlockPayload(candidates, heading || titleFromSlug(url))
}

export async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const heading = args.heading || titleFromSlug(args.url)
  const limit = args.limit ? Number.parseInt(args.limit, 10) : null
  const payload = await fetchLiveGalleryBlock({
    url: args.url,
    heading,
    scopeSelector: args.scope || 'main',
    limit,
    includeExternal: Boolean(args.includeExternal),
    verbose: Boolean(args.verbose),
  })
  const output = `${JSON.stringify(payload, null, 2)}\n`

  if (args.out) {
    const outPath = path.resolve(process.cwd(), args.out)
    await mkdir(path.dirname(outPath), { recursive: true })
    await writeFile(outPath, output, 'utf8')
    console.log(`Imported ${payload.images.length} images into ${args.out}`)
    return
  }

  console.log(output)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Gallery import failed: ${error.message}`)
    process.exitCode = 1
  })
}
