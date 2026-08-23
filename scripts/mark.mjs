#!/usr/bin/env node
/**
 * The house mark — phase 5, task 5.1.
 *
 * Takes the heraldic crocus device defined in lib/device.mjs, normalises it
 * onto its own ink, and commits three things:
 *
 *   app/content/device.ts    the geometry, in the same shape lockup.ts uses,
 *                            for <Sigil/>'s mask-image and for the extrusion
 *                            in GL scene 3
 *   public/favicon.ico       16 / 32 / 48, packed
 *   public/img/icon-*.png    the large square marks a browser or a phone asks
 *                            for when it wants something bigger than the .ico
 *
 * plus an organiser-only contact sheet at _private/proof/, which is the actual
 * evidence for the claim in lib/device.mjs's header that the mark survives
 * 24px, 36px and 275px. That claim is worth nothing unmeasured.
 *
 * USAGE
 *
 *   node scripts/mark.mjs
 *
 * DETERMINISTIC. No timestamps, no randomness, no machine-dependent input.
 * Running it twice produces an identical diff — which is to say, none.
 *
 * WHY THE WORDMARK IS NOT HERE
 *
 * Task 5.1 pairs the mark with the wordmark, and the wordmark is already
 * drawn: scripts/lockup.mjs sets CROCARIA in Funnel Display 300 and commits
 * app/content/lockup.ts, which <Wordmark/> consumes as a mask-image. That is
 * the same technique and the same output shape as this file's. Reimplementing
 * it here would give the identity two definition sites, which is the one thing
 * tokens/palette.mjs and lib/device.mjs both exist to avoid. `npm run
 * gen:lockup` remains the wordmark's generator.
 *
 * WHAT THIS FILE CHECKS, AND WHY IT REFUSES RATHER THAN COPES
 *
 * Three assertions run before anything is written, and each one answers a
 * failure that is invisible on inspection and fatal in production:
 *
 *   · only M / L / Q / C / Z. app/composables/scenes/mark.ts accepts exactly
 *     those five and throws on anything else, so a sixth command committed
 *     here is a blank disc in GL scene 3 that nobody notices until the
 *     screenshots come back;
 *   · exactly two runs. The reader takes the first as the face and every run
 *     after it as a void, so a third contour would punch a hole nobody drew;
 *   · opposite winding. Under `fill-rule: nonzero` two same-wound contours are
 *     indistinguishable from one solid — the counter would simply vanish, in
 *     the mask AND in the extrusion, and the mark would still look plausible.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { outline, counter, BOX } from './lib/device.mjs'
import { palette } from '../tokens/palette.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const at = (...parts) => resolve(root, ...parts)

/**
 * The icon's two colours.
 *
 * Cream on black, not gold on black. Gold is the accent and CLAUDE.md reserves
 * it for state; a tab icon is not a state. Cream is what every other mark on
 * this site is inked in, so the favicon and the header lockup are the same
 * object at two sizes rather than two objects that resemble each other.
 */
const INK = palette.cream
const GROUND = palette.black

/** The sizes packed into favicon.ico, and the two standalone PNGs. */
const ICO = [16, 32, 48]
const PNGS = [180, 512]

/** The three sizes lib/device.mjs claims the mark survives. */
const PROOF = [24, 36, 275]

/* ==========================================================================
   Reading the geometry back
   --------------------------------------------------------------------------
   device.mjs hands back a string, so this parses it. That is deliberate
   duplication of scenes/mark.ts's reader: if the two disagree about what the
   committed data means, the disagreement surfaces here, on a workstation,
   rather than in a WebGL context on someone's phone.
   ========================================================================== */

const STEP = /([MLQCZ])([^MLQCZ]*)/gi

/** Every number in a chunk, in order. */
const nums = (chunk) => (chunk.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number)

/**
 * Splits path data into runs of points.
 *
 * Curves are flattened to their control polygon — endpoints plus control
 * points. That is the same approximation glyphs.mjs's `bounds` makes, so the
 * device and the wordmark are boxed by one convention, and it is exact enough
 * for both things it is used for here: a bounding box (conservative by a
 * fraction of a unit) and the sign of an area.
 */
function walk(d) {
  const runs = []
  let run = null
  let hit

  STEP.lastIndex = 0
  while ((hit = STEP.exec(d)) !== null) {
    const cmd = hit[1].toUpperCase()
    const n = nums(hit[2])

    if (cmd === 'M') {
      run = { pts: [{ x: n[0], y: n[1] }] }
      runs.push(run)
    } else if (!run) {
      throw new Error(`path opens with ${cmd}, not M`)
    } else if (cmd === 'L') {
      run.pts.push({ x: n[0], y: n[1] })
    } else if (cmd === 'Q') {
      run.pts.push({ x: n[0], y: n[1] }, { x: n[2], y: n[3] })
    } else if (cmd === 'C') {
      run.pts.push({ x: n[0], y: n[1] }, { x: n[2], y: n[3] }, { x: n[4], y: n[5] })
    } else if (cmd === 'Z') {
      run.closed = true
    } else {
      throw new Error(`unhandled path command: ${cmd}`)
    }
  }

  return runs
}

/**
 * Twice the signed area of a run. The SIGN is what matters, not the value.
 *
 * SVG's y axis runs down, so a clockwise walk comes out positive here where a
 * textbook y-up shoelace would call it negative. The check below only ever
 * compares two signs to each other, so the convention cancels.
 */
function twiceArea(pts) {
  let sum = 0
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    sum += a.x * b.y - b.x * a.y
  }
  return sum
}

/* ==========================================================================
   The device
   ========================================================================== */

const face = outline()
const hole = counter()
const raw = face + hole

for (const [name, part] of [['outline', face], ['counter', hole]]) {
  if (/NaN|Infinity|undefined/.test(part)) {
    console.error(`\n  lib/device.mjs: ${name}() emitted a non-finite coordinate.\n`)
    process.exit(1)
  }
}

const runs = walk(raw)

if (runs.length !== 2) {
  console.error(`\n  The device is ${runs.length} run(s). scenes/mark.ts reads the first as the face and the rest as voids; it must be exactly two.\n`)
  process.exit(1)
}
for (const [i, run] of runs.entries()) {
  if (!run.closed) {
    console.error(`\n  Run ${i} is not closed. An open contour extrudes into a torn wall.\n`)
    process.exit(1)
  }
}

const winding = runs.map((run) => Math.sign(twiceArea(run.pts)))
if (winding[0] === winding[1]) {
  console.error('\n  The counter is wound the same way as the outline, so it is not a hole.')
  console.error('  Under fill-rule: nonzero it would simply disappear, in the mask and in the extrusion.\n')
  process.exit(1)
}

/* --------------------------------------------------------------------------
   Normalising onto the ink

   Same reasoning as lockup.mjs: a mark boxed on its drawing square carries the
   square's slack as invisible padding, so a `h-36` lockup paints at some
   fraction of 36px and every alignment against it is off by an amount nobody
   can find. The box is tightened onto what actually inks.
   -------------------------------------------------------------------------- */

const all = runs.flatMap((run) => run.pts)
const box = {
  x0: Math.min(...all.map((p) => p.x)),
  y0: Math.min(...all.map((p) => p.y)),
  x1: Math.max(...all.map((p) => p.x)),
  y1: Math.max(...all.map((p) => p.y)),
}

const r1 = (n) => {
  const v = Math.round(n * 10) / 10
  return Object.is(v, -0) ? 0 : v
}

/** Shifts the whole device so its ink starts at the origin. */
const shifted = raw.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (() => {
  let axis = 0
  return (n) => {
    // Coordinates alternate x, y from the start of every command's payload,
    // and every command device.mjs emits takes an even number of them, so a
    // running parity is enough — no per-command bookkeeping needed.
    const v = Number(n) - (axis % 2 === 0 ? box.x0 : box.y0)
    axis += 1
    return String(r1(v))
  }
})())

const device = {
  box: [r1(box.x1 - box.x0), r1(box.y1 - box.y0)],
  d: shifted,
}

/* ==========================================================================
   Emitting
   ========================================================================== */

const module = `/**
 * GENERATED — do not edit by hand.
 *
 *   node scripts/mark.mjs
 *
 * The house mark: a heraldic crocus device, three stigmas over a stylised
 * corm, drawn in scripts/lib/device.mjs and normalised onto its own ink here.
 *
 * \`box\` is [width, height] in user units. \`d\` is TWO closed contours wound
 * against each other — the silhouette first, the counter second. That order is
 * a contract: app/composables/scenes/mark.ts takes the first run as the face
 * and every run after it as a void, so reversing them would extrude a bar
 * floating in space.
 *
 * <Sigil/> paints it as a mask-image under fill-rule: nonzero, where the
 * opposed winding is what makes the counter a hole rather than more metal.
 */
export const device = {
  box: [${device.box[0]}, ${device.box[1]}],
  d: '${device.d}',
} as const
`

writeFileSync(at('app/content/device.ts'), module, 'utf8')

/* --------------------------------------------------------------------------
   Rasterising
   -------------------------------------------------------------------------- */

/**
 * The device on a square ground, inset.
 *
 * The inset is not decoration. A mark that touches the edge of a favicon reads
 * as cropped in every browser that rounds the corner of a tab icon, and the
 * corm's root plate is a flat edge, which is exactly the shape that looks cut
 * off rather than contained.
 */
function sheet(px, { inset = 0.14, ground = GROUND, ink = INK } = {}) {
  const pad = BOX * inset
  const span = Math.max(device.box[0], device.box[1]) + pad * 2
  const ox = (span - device.box[0]) / 2
  const oy = (span - device.box[1]) / 2

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${r1(span)} ${r1(span)}">` +
      (ground ? `<rect width="${r1(span)}" height="${r1(span)}" fill="${ground}"/>` : '') +
      `<g transform="translate(${r1(ox)} ${r1(oy)})"><path d="${device.d}" fill="${ink}" fill-rule="nonzero"/></g>` +
      '</svg>',
  )
}

/**
 * No `density` here. librsvg scales an SVG by density/72, and `sheet` already
 * states the pixel size it wants, so passing one would silently render every
 * icon several times larger than asked.
 */
const png = (size, opts) =>
  sharp(sheet(size, opts)).png({ compressionLevel: 9, palette: false }).toBuffer()

/**
 * Packs PNGs into an ICO container.
 *
 * PNG-in-ICO is read by every browser this site targets and by Windows since
 * Vista, and it is the only form worth writing: the BMP form would need its
 * own encoder, its own upside-down row order and its own AND mask, all to
 * produce a larger file that renders identically.
 */
function ico(images) {
  const head = Buffer.alloc(6)
  head.writeUInt16LE(0, 0) // reserved
  head.writeUInt16LE(1, 2) // 1 = icon
  head.writeUInt16LE(images.length, 4)

  const dir = Buffer.alloc(16 * images.length)
  let offset = head.length + dir.length

  images.forEach(({ size, data }, i) => {
    const e = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, e)
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1)
    dir.writeUInt8(0, e + 2) // palette size — 0 for truecolour
    dir.writeUInt8(0, e + 3) // reserved
    dir.writeUInt16LE(1, e + 4) // colour planes
    dir.writeUInt16LE(32, e + 6) // bits per pixel
    dir.writeUInt32LE(data.length, e + 8)
    dir.writeUInt32LE(offset, e + 12)
    offset += data.length
  })

  return Buffer.concat([head, dir, ...images.map((i) => i.data)])
}

mkdirSync(at('public/img'), { recursive: true })

const packed = []
for (const size of ICO) packed.push({ size, data: await png(size) })
const iconFile = ico(packed)
writeFileSync(at('public/favicon.ico'), iconFile)

const made = [['public/favicon.ico', iconFile.length]]

for (const size of PNGS) {
  const name = `public/img/icon-${size}.png`
  const data = await png(size)
  writeFileSync(at(name), data)
  made.push([name, data.length])
}

/* --------------------------------------------------------------------------
   The proof sheet

   Organiser-only, git-ignored, and never referenced by application code. It
   exists so "the mark survives 24px" is a thing someone looked at rather than
   a thing someone asserted in a comment.
   -------------------------------------------------------------------------- */

mkdirSync(at('_private/proof'), { recursive: true })

{
  const GAP = 28
  const RULE = 320
  const big = await png(RULE, { ground: palette['brown-darker'] })

  // Each small size is drawn AT its real pixel size and then blown up with
  // nearest-neighbour, so what the sheet shows is the actual pixel grid the
  // browser will rasterise — not a clean re-render at a comfortable size,
  // which would prove nothing.
  const strip = []
  let y = 0
  for (const size of PROOF) {
    if (size > 64) continue
    const shot = await sharp(await png(size, { ground: palette['brown-darker'] }))
      .resize(RULE / 2, RULE / 2, { kernel: 'nearest' })
      .png()
      .toBuffer()
    strip.push({ input: shot, left: RULE + GAP, top: y })
    y += RULE / 2 + GAP
  }

  const width = RULE + GAP + RULE / 2
  const sheetPng = await sharp({
    create: {
      width,
      height: Math.max(RULE, y - GAP),
      channels: 3,
      background: palette.black,
    },
  })
    .composite([{ input: big, left: 0, top: 0 }, ...strip])
    .png({ compressionLevel: 9 })
    .toBuffer()

  writeFileSync(at('_private/proof/device.png'), sheetPng)
}

/* --------------------------------------------------------------------------
   Report
   -------------------------------------------------------------------------- */

const KB = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'

console.log('House mark — CROCARIA\n')
console.log(`  geometry   2 closed runs, opposed winding, ${device.d.length} chars`)
console.log(`  box        ${device.box[0]} x ${device.box[1]} of a ${BOX}-unit square`)
console.log(`  ink        ${INK} on ${GROUND}\n`)

console.log('  app/content/device.ts')
for (const [name, bytes] of made) console.log(`  ${name.padEnd(24)} ${KB(bytes)}`)
console.log('  _private/proof/device.png    contact sheet at 24 / 36 / 275px')
console.log('\nDeterministic — re-running produces an identical diff.\n')
