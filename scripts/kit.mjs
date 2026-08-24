#!/usr/bin/env node
/**
 * The house kit — the files `/house` actually hands over.
 *
 *   node scripts/kit.mjs
 *
 * Writes three archives to public/dl/ and the manifest that describes them to
 * app/content/kit.ts, so the page's file-size labels are measurements rather
 * than numbers somebody typed. Phase 7, route 3: "the downloads must actually
 * resolve — a real ZIP of the mark. A 404 on a download link is rule 8."
 *
 * RUNS AFTER mark.mjs AND lockup.mjs, and reads what they committed rather
 * than re-deriving it. That ordering is the point: the geometry a buyer
 * downloads is byte-for-byte the geometry the header paints. Re-deriving it
 * here would give the identity a third definition site, and a third definition
 * site is a third thing to forget to re-run.
 *
 * DETERMINISTIC. No timestamps, no randomness — see lib/bundle.mjs for how the
 * clock is pinned. Running it twice produces an identical diff, which is to
 * say none.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { bundle } from './lib/bundle.mjs'
import { palette } from '../tokens/palette.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const at = (...p) => resolve(root, ...p)

const OUT = at('public/dl')
const MODULE = at('app/content/kit.ts')

/* --------------------------------------------------------------------------
   Reading what the other two generators committed

   A regex over a generated module looks fragile, and it would be over a
   hand-written one. Over these two it is not: mark.mjs and lockup.mjs emit a
   fixed shape they control, both are in this repository, and the alternative —
   importing TypeScript from plain node — needs a compiler in the chain to say
   the same thing. The refusal below is what keeps it honest: if either file
   ever stops matching, this exits rather than shipping an empty archive.
   -------------------------------------------------------------------------- */

/**
 * Pulls one `{ box: [w, h], d: '…' }` record out of a generated module.
 *
 * `key` is matched against either an object property (`mark: {`) or a
 * top-level binding (`device = {`), because the two generators emit different
 * shapes: lockup.ts holds several lines under one export, device.ts holds one.
 */
function geometry(file, key) {
  const src = readFileSync(at(file), 'utf8')
  const found = new RegExp(`\\b${key}\\s*[:=]\\s*\\{([\\s\\S]*?)\\}`).exec(src)?.[1]
  const box = found && /box:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/.exec(found)
  const path = found && /d:\s*'([^']+)'/.exec(found)

  if (!box || !path) {
    console.error(`\n  Could not read ${key ?? 'the geometry'} out of ${file}.`)
    console.error('  Re-run its generator — the file header names it — before running this one.\n')
    process.exit(1)
  }
  return { box: [Number(box[1]), Number(box[2])], d: path[1] }
}

const device = geometry('app/content/device.ts', 'device')
const wordmark = geometry('app/content/lockup.ts', 'mark')
const short = geometry('app/content/lockup.ts', 'short')

/* --------------------------------------------------------------------------
   Drawing
   -------------------------------------------------------------------------- */

const INK = palette.cream
const GROUND = palette.black

/**
 * One piece of geometry as a standalone SVG file.
 *
 * `pad` is stated as a fraction of the ink's own height, so the mark and the
 * wordmark get proportionally the same air rather than the same number of
 * units — the two are drawn on wildly different scales.
 */
function svg({ box, d }, { pad = 0, ground = null, ink = INK } = {}) {
  const air = box[1] * pad
  const w = box[0] + air * 2
  const h = box[1] + air * 2
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round(w)}" height="${round(h)}" ` +
    `viewBox="0 0 ${round(w)} ${round(h)}" fill="none">` +
    (ground ? `<rect width="${round(w)}" height="${round(h)}" fill="${ground}"/>` : '') +
    `<g transform="translate(${round(air)} ${round(air)})">` +
    `<path d="${d}" fill="${ink}" fill-rule="nonzero"/></g></svg>`
  )
}

const round = (n) => Math.round(n * 10) / 10

/**
 * No `density`. librsvg scales an SVG by density/72 and the markup above
 * already states the pixel size it wants, so passing one renders the file
 * several times larger than asked — the same trap mark.mjs records.
 */
const raster = async (markup, width) =>
  sharp(Buffer.from(markup))
    .resize({ width })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()

/* --------------------------------------------------------------------------
   The written matter

   Terms a buyer can act on without writing in. The house voice: short
   declaratives, numbers over adjectives, no marketing.
   -------------------------------------------------------------------------- */

const NL = '\r\n' // ZIP entries are read on Windows as often as anywhere else.

const NOTICE = [
  'CROCARIA',
  'Grown, graded, sealed.',
  '',
  'THE HOUSE MARK AND THE WORDMARK',
  '',
  'The heraldic crocus device and the CROCARIA wordmark are the property',
  'of Crocaria S.L., Consuegra, Toledo.',
  '',
  'Both may be reproduced to identify the house — in the trade press, in a',
  "buyer's own catalogue, on a bonded manifest — provided the geometry is",
  'not redrawn, recoloured, stretched, outlined, set inside another shape,',
  'or locked up with a second mark.',
  '',
  'CLEAR SPACE   One stigma height on every side. Nothing sits inside it.',
  'FLOOR         The device holds down to 24 px. Below that, use the corm',
  '              alone; the stigmas close up and the mark reads as a blot.',
  `INK           ${palette.cream} on ${palette.black}.`,
  `              Never on a ground lighter than ${palette['brown-dark']}.`,
  '',
  'Write to ledger@crocaria.example before doing anything this file does',
  'not cover. The house would rather be asked.',
  '',
  '© 1904–2026 Crocaria S.L. · Consuegra, Toledo',
  'Registered lot house no. 0417',
].join(NL)

const TONES = [
  'CROCARIA — the house colours, as measured.',
  '',
  'Eight tones. There is no grey in this palette and there is no white.',
  'Every rule on the house material is one pixel and one colour.',
  '',
  ...Object.entries(palette).map(([name, value]) => `  ${name.padEnd(14)}${value}`),
  '',
  'The accent is a state, never a heading colour. Body copy is cream on',
  'black at every size. Rules and hairlines take the darkest brown.',
].join(NL)

/* --------------------------------------------------------------------------
   The archives
   -------------------------------------------------------------------------- */

const markSvg = svg(device, { pad: 0.14 })
const wordmarkSvg = svg(wordmark, { pad: 0.25 })
const shortSvg = svg(short, { pad: 0.25 })

const files = {
  'mark.svg': markSvg,
  'mark-512.png': await raster(svg(device, { pad: 0.14 }), 512),
  'mark-1024.png': await raster(svg(device, { pad: 0.14 }), 1024),
  'mark-on-black-1024.png': await raster(svg(device, { pad: 0.14, ground: GROUND }), 1024),
  'wordmark.svg': wordmarkSvg,
  'wordmark-2400.png': await raster(wordmarkSvg, 2400),
  'wordmark-short.svg': shortSvg,
  'NOTICE.txt': NOTICE,
  'PALETTE.txt': TONES,
}

const pick = (...names) => names.map((name) => ({ name, data: files[name] }))

/**
 * Three archives, and the order of the entries inside each one is written
 * here rather than taken from the object above — the bundler never sorts, so
 * this list IS the order a reader sees when they open the file.
 */
const BUNDLES = [
  {
    key: 'mark',
    file: 'crocaria-mark.zip',
    entries: pick('mark.svg', 'mark-512.png', 'mark-1024.png', 'mark-on-black-1024.png', 'NOTICE.txt'),
  },
  {
    key: 'wordmark',
    file: 'crocaria-wordmark.zip',
    entries: pick('wordmark.svg', 'wordmark-2400.png', 'wordmark-short.svg', 'NOTICE.txt'),
  },
  {
    key: 'house',
    file: 'crocaria-house.zip',
    entries: pick(
      'mark.svg',
      'mark-512.png',
      'mark-1024.png',
      'mark-on-black-1024.png',
      'wordmark.svg',
      'wordmark-2400.png',
      'wordmark-short.svg',
      'PALETTE.txt',
      'NOTICE.txt',
    ),
  },
]

mkdirSync(OUT, { recursive: true })

const made = []
for (const spec of BUNDLES) {
  const data = bundle(spec.entries)
  writeFileSync(resolve(OUT, spec.file), data)
  made.push({
    key: spec.key,
    file: `/dl/${spec.file}`,
    bytes: data.length,
    holds: spec.entries.map((e) => e.name),
  })
}

/* --------------------------------------------------------------------------
   The manifest
   -------------------------------------------------------------------------- */

const body = made
  .map(
    (b) =>
      `  ${b.key}: {\n` +
      `    file: '${b.file}',\n` +
      `    bytes: ${b.bytes},\n` +
      `    holds: [${b.holds.map((n) => `'${n}'`).join(', ')}],\n` +
      `  },`,
  )
  .join('\n')

const module = `/**
 * GENERATED — do not edit by hand.
 *
 *   node scripts/kit.mjs
 *
 * The archives \`/house\` offers, with the size each one actually is on disk.
 *
 * The byte count is here rather than in the page's copy for the same reason
 * <Plate/> reads its dimensions from a manifest: a file size written by hand is
 * true on the day it is typed and a lie the next time the archive is rebuilt,
 * and nothing anywhere reports it. A label that says 41 KB beside a 63 KB file
 * is a small lie, but it is the kind a reader catches.
 *
 * \`holds\` is what is inside, in the order the archive lists it.
 */
export type Bundle = {
  readonly file: string
  readonly bytes: number
  readonly holds: readonly string[]
}

export const kit = {
${body}
} as const satisfies Record<string, Bundle>

export type BundleKey = keyof typeof kit

/**
 * A byte count as the house would print it.
 *
 * One decimal below a megabyte and one above, which is what a file manager
 * shows — a label that reads "43,214 bytes" is accurate and tells a buyer
 * nothing they were asking.
 */
export const weigh = (bytes: number) =>
  bytes < 1024 * 1024
    ? \`\${Math.round(bytes / 1024)} KB\`
    : \`\${(bytes / 1024 / 1024).toFixed(1)} MB\`
`

writeFileSync(MODULE, module, 'utf8')

const KB = (n) => `${(n / 1024).toFixed(1).padStart(7)} KB`
console.log('\nThe house kit\n')
for (const b of made) {
  console.log(`  ${b.file.padEnd(30)}${KB(b.bytes)}   ${b.holds.length} file(s)`)
}
console.log(`\nWrote app/content/kit.ts\n`)
