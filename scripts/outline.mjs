#!/usr/bin/env node
/**
 * Outline geometry — phase 5, task 5.3. Technique T-B.
 *
 * Reads _private/type-jobs.json, sets each string from a committed font binary
 * through lib/glyphs.mjs, and writes app/content/outlines.ts as SVG <path>
 * data. <OutlineText/> draws it. Nothing here ships as a font, nothing is
 * converted in the browser, and the output is committed and reviewable.
 *
 *   node scripts/outline.mjs
 *   node scripts/outline.mjs --job _private/type-jobs.json
 *
 * DETERMINISTIC. Same font binary in, same file out, byte for byte.
 *
 * NEVER EMIT SVG <text>. Chrome's find-in-page matches inline SVG <text>,
 * which would silently undo the entire technique — the page would look
 * identical and the term would be one Ctrl+F away. If a glyph is missing,
 * regenerate the geometry; do not fall back to characters.
 *
 * Per-character <span> splitting is not a substitute and is not a defence of
 * any kind: Chrome normalises text across inline element boundaries before
 * matching. It is an animation tool.
 *
 * THE ACCESSIBILITY TRADE-OFF, STATED PLAINLY
 *
 * A line drawn as geometry cannot be selected, copied, translated by the
 * browser, or reflowed at large text settings. The <svg> carries role="img"
 * and an aria-label so assistive technology announces it normally — a genuine
 * mitigation, not a fig leaf, but it does not restore selection or browser
 * translation and nothing does.
 *
 * The trade-off is accepted deliberately and confined to display type and
 * short labels. It never touches running copy, navigation, captions, or
 * anything a reader has to work through. The event requires that six strings
 * resist find-in-page; that requirement cannot be met and also leave those six
 * selectable. Everything that is not one of those six stays real text.
 *
 * SETS
 *
 * A set is N strings laid out by ONE call at ONE em, boxed on ONE shared
 * vertical band. Widths differ, which is what real typesetting does; nothing
 * else can. That is not tidiness — 04-clue-architecture.md §4.3 turns on it. A
 * member of a set that differs is the member everyone looks at, and one of
 * these sets has a member worth looking at.
 *
 * DO NOT HAND-TUNE A MEMBER. There is no mechanism here to do it with, which
 * is the point.
 *
 * VEILED ACCESSIBLE NAMES
 *
 * <OutlineText/> needs an aria-label. For a set whose text is a banned token
 * that name cannot ship as a literal: it would fail audit:names against the
 * built output and it would be one Ctrl+U away from being read. So a veiled
 * set's names are emitted through the same per-index XOR scripts/inscribe.mjs
 * uses, and the component decodes them.
 *
 * THE VEIL IS APPLIED TO EVERY MEMBER OF A VEILED SET, not only to the member
 * that is a banned token. Two plain aria-labels beside one numeric array is a
 * pointer straight at the term for anyone reading source — worse than the
 * string would have been.
 *
 * The transform is not cryptography and is not pretending to be. It exists so
 * that a text search of the production JavaScript returns nothing, which is
 * exactly the threat. Anyone willing to sit down and reverse it has left the
 * intended path entirely.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { face, run, toPath, bounds, round } from './lib/glyphs.mjs'
import { record, grade, FLOOR, VIEWPORT } from './lib/reach.mjs'
import { palette } from '../tokens/palette.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const at = (...parts) => resolve(root, ...parts)

const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}

const JOB = flag('job', '_private/type-jobs.json')

/**
 * Must match VEIL in scripts/inscribe.mjs and in the decoder the generated
 * module carries. Changing it invalidates every committed name.
 */
const VEIL = 0x5b

/** Its own inverse. Index-based, so a repeated letter does not repeat a value. */
const turn = (n, i) => n ^ ((VEIL + i) & 0xff)
const veil = (text) => [...text].map((ch, i) => turn(ch.charCodeAt(0), i))
const plain = (codes) => String.fromCharCode(...codes.map(turn))

/**
 * The faces, by the name a job uses.
 *
 * Committed binaries in _private/fonts/, which is git-ignored: a licensed font
 * has no business in this repository. The re-fetch recipe is in the header of
 * scripts/lockup.mjs.
 */
const FACES = {
  'display-300': '_private/fonts/display-300.woff',
  'mono-400': '_private/fonts/mono-400.ttf',
  'mono-500': '_private/fonts/mono-500.ttf',
  'text-400': '_private/fonts/text-400.ttf',
  'text-600': '_private/fonts/text-600.ttf',
}

/**
 * The layout em, in path units.
 *
 * Everything is set at this size and the emitted numbers are these units, so
 * the committed geometry is readable in a diff and independent of whatever
 * design-pixel size a section eventually renders it at. `capPx` on the job is
 * what carries the rendered size; this is only the resolution the curves are
 * recorded at.
 */
const EM = 1000

/* ==========================================================================
   Loading
   ========================================================================== */

if (!existsSync(at(JOB))) {
  console.error(`\n  No job file at ${JOB}.\n`)
  console.error('  It is organiser-only material and lives in _private/, which is git-ignored:')
  console.error('  the strings themselves must not enter the repository, only the geometry they')
  console.error('  produce. See _private/README.md.\n')
  process.exit(1)
}

const spec = JSON.parse(readFileSync(at(JOB), 'utf8'))
const OUT = spec.out ?? 'app/content/outlines.ts'

if ((spec.rings ?? []).length) {
  console.error('\n  This job asks for a ring. Ring lettering on this site is RASTER — the seal and')
  console.error('  the medallion are drawn by scripts/plates.mjs, technique T-A. A drawn SVG ring')
  console.error('  would put the band back into the DOM as geometry the browser can reflow.\n')
  process.exit(1)
}

function faceFor(name) {
  const file = FACES[name]
  if (!file) {
    console.error(`\n  Unknown face "${name}". Known: ${Object.keys(FACES).join(', ')}.\n`)
    process.exit(1)
  }
  if (!existsSync(at(file))) {
    console.error(`\n  No font at ${file}.\n`)
    console.error('  See the re-fetch recipe in the header of scripts/lockup.mjs.\n')
    process.exit(1)
  }
  return face(at(file))
}

/* ==========================================================================
   Layout
   ========================================================================== */

/**
 * Lays out N strings in one call and boxes them on ONE shared band.
 *
 * The shared band is the union of every member's ink. Boxing each member onto
 * its own ink would ALMOST work here — these are all caps, so they all reach
 * the same two lines — but "almost" is doing the wrong kind of work. A member
 * whose string happened to be all-round letters would carry a hair of overshoot
 * the others do not, render a hair taller at the same CSS height, and become
 * the one that looks different. The union makes that impossible instead of
 * unlikely.
 */
function lay(f, members, em) {
  const set = members.map((text) => run(f, text, { size: em }))
  const boxes = set.map((s) => bounds(s.commands))

  const band = {
    y0: Math.min(...boxes.map((b) => b.y0)),
    y1: Math.max(...boxes.map((b) => b.y1)),
  }

  const drawn = set.map((s, i) => {
    const b = boxes[i]
    // Origin at the member's own left edge and the SET's top line.
    const place = (p) => ({ x: p.x - b.x0, y: p.y - band.y0 })
    return {
      box: [round(b.w), round(band.y1 - band.y0)],
      d: toPath(s.commands, place),
    }
  })

  return { drawn, cap: set[0].cap, height: band.y1 - band.y0 }
}

/* ==========================================================================
   The run
   ========================================================================== */

const report = []
const measured = []
let short = false

const sets = (spec.sets ?? []).map((job) => {
  const f = faceFor(job.face ?? 'mono-400')
  const members = job.members ?? []

  if (members.length < 3) {
    console.error(`\n  Set "${job.key}" has ${members.length} member(s). A set of two is a pair, and a`)
    console.error('  pair with one odd member is a pointer. The floor is three — 04, §4.3.\n')
    process.exit(1)
  }

  const { drawn, cap, height } = lay(f, members, EM)

  /**
   * The rendered cap, in design pixels at a 375px viewport.
   *
   * `capPx` is what the job asks for and what <OutlineText/> defaults to. The
   * geometry is in EM units, so the component scales the box by capPx/cap —
   * which means the drawn label's cap matches the cap of the live type beside
   * it exactly, rather than approximately. That IS the camouflage: rule 4.1
   * asks for typographically identical, and a cap height that is close is a
   * cap height that is wrong.
   */
  const capPx = job.capPx ?? 14
  const measuredCap = capPx

  const { ok, line } = grade(measuredCap)
  if (!ok) short = true
  report.push({ key: job.key, members: members.length, capPx: measuredCap, line, ok })

  if (job.reach) {
    measured.push({
      id: job.reach,
      cap375: Number(measuredCap.toFixed(1)),
      from: 'scripts/outline.mjs',
      surface: `outline set "${job.key}", ${members.length} members at one em`,
      /**
       * No `renderPx` and no `floorAtPx`, and their absence is the point.
       *
       * A raster plate has a fixed pixel grid, so its term shrinks with the
       * plate and there is a render width below which it stops clearing the
       * floor. Geometry has no grid: <OutlineText/> scales the paths to the
       * cap the set asks for, so the cap IS the render size and there is no
       * width below which it degrades. scripts/register.mjs reads the missing
       * fields and says so rather than inventing a threshold.
       */
      scales: true,
      proof: { key: job.key, members, capPx: measuredCap, geometry: drawn, band: height, cap },
    })
  }

  return {
    key: job.key,
    veiled: Boolean(job.veil),
    cap: round(cap),
    capPx,
    height: round(height),
    members: drawn.map((d, i) => ({
      ...d,
      name: job.veil ? veil(members[i]) : members[i],
    })),
    // Round-trip every veiled name before it is written. A veil that does not
    // decode is a set of labels that announce gibberish to a screen reader,
    // and nothing about the rendered page would reveal it.
    _check: job.veil ? members.map((m, i) => plain(veil(m)) === m) : [],
  }
})

for (const set of sets) {
  if (set._check.some((ok) => !ok)) {
    console.error(`\n  The veil did not round-trip for set "${set.key}".\n`)
    process.exit(1)
  }
  delete set._check
}

const lines = (spec.lines ?? []).map((job) => {
  const f = faceFor(job.face ?? 'display-300')
  const { drawn, cap, height } = lay(f, [job.text], EM)
  report.push({ key: job.key, members: 1, capPx: job.capPx ?? null, line: 'display line', ok: true })
  return {
    key: job.key,
    veiled: Boolean(job.veil),
    cap: round(cap),
    capPx: job.capPx ?? null,
    height: round(height),
    members: [{ ...drawn[0], name: job.veil ? veil(job.text) : job.text }],
  }
})

/* ==========================================================================
   Emitting
   ========================================================================== */

const body = [...sets, ...lines]
  .map((set) => {
    const members = set.members
      .map((m) => {
        const name = Array.isArray(m.name) ? `[${m.name.join(', ')}]` : `'${m.name.replace(/'/g, "\\'")}'`
        return `      { box: [${m.box[0]}, ${m.box[1]}], name: ${name}, d: '${m.d}' },`
      })
      .join('\n')

    return [
      `  ${set.key}: {`,
      `    veiled: ${set.veiled},`,
      `    cap: ${set.cap},`,
      `    capPx: ${set.capPx},`,
      `    members: [`,
      members,
      `    ],`,
      `  },`,
    ].join('\n')
  })
  .join('\n')

const module = `/**
 * GENERATED — do not edit by hand.
 *
 *   node scripts/outline.mjs
 *
 * Display type and short labels, set from committed font binaries offline and
 * converted to SVG <path> geometry. <OutlineText/> draws it. This is technique
 * T-B: there is no text here, so find-in-page has nothing to match.
 *
 * NEVER replace a path with an SVG <text> element. Chrome's find-in-page
 * matches inline <text>. If a glyph is missing, re-run the generator.
 *
 * Every member of a set is laid out by one call at one em and boxed on one
 * shared vertical band, so no member can differ from its siblings by anything
 * except its own advance width. Widths differ; nothing else does.
 *
 * \`cap\` is the cap height in the same user units as every \`box\`. \`capPx\` is
 * the design-pixel cap the set renders at on a ${VIEWPORT}px viewport, where
 * 1rem = 10 design px. <OutlineText/> scales by capPx / cap, so a drawn label
 * sits on exactly the cap line of the live type beside it.
 *
 * \`name\` is the accessible name. On a veiled set it arrives as character codes
 * under a per-index XOR rather than as a literal — see \`nameOf\` below, and the
 * long note in scripts/outline.mjs.
 */
export const outlines = {
${body}
} as const

export type OutlineKey = keyof typeof outlines

/**
 * The veil's key. Its own inverse, and index-based, so a repeated letter does
 * not repeat a value. Matches VEIL in scripts/outline.mjs and
 * scripts/inscribe.mjs; changing it invalidates every committed name.
 */
const VEIL = ${VEIL}

/**
 * The accessible name for one member of one set.
 *
 * Not cryptography, and not pretending to be. It exists so that grepping the
 * production bundle for this string returns nothing, which is the threat it
 * defends against.
 *
 * (This comment ships. It may not name the technique it defeats: the token for
 * "look through text for a match" is itself on the naming ban, so \`npm run
 * audit:names\` fails on the obvious wording. That is the ban working.)
 */
export function nameOf(key: OutlineKey, index: number): string {
  const name = outlines[key].members[index]?.name
  if (name === undefined) return ''
  if (typeof name === 'string') return name
  return String.fromCharCode(...name.map((n, i) => n ^ ((VEIL + i) & 0xff)))
}
`

writeFileSync(at(OUT), module, 'utf8')

/* --------------------------------------------------------------------------
   The proof crop

   Organiser-only, git-ignored. The WHOLE SET is drawn, at the size it renders
   at on a 375px viewport, then enlarged nearest-neighbour — so what the crop
   shows is the pixel grid a phone rasterises. The set rather than the member,
   because the question a reader of the key needs answered is not "can this be
   read" but "does this one look like the other two", and one member alone
   cannot answer it.
   -------------------------------------------------------------------------- */

for (const entry of measured) {
  const { key, capPx, geometry, band, cap } = entry.proof
  delete entry.proof

  const scale = capPx / cap
  const gap = 12
  const pad = 10
  const rowH = band * scale
  const width = Math.ceil(Math.max(...geometry.map((g) => g.box[0])) * scale) + pad * 2
  const height = Math.ceil(rowH * geometry.length + gap * (geometry.length - 1)) + pad * 2

  const body = geometry
    .map(
      (g, i) =>
        // NOT `round` — that is glyphs.mjs's one-decimal rounding for committed
        // path data, and this scale is around 0.02, which it rounds to zero.
        `<g transform="translate(${pad} ${round(pad + i * (rowH + gap))}) scale(${scale.toFixed(6)})">` +
        `<path d="${g.d}" fill="${palette.cream}"/></g>`,
    )
    .join('')

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${palette.black}"/>${body}</svg>`

  mkdirSync(resolve(root, '_private/proof'), { recursive: true })
  const shot = await sharp(Buffer.from(svg))
    .resize(width * 4, height * 4, { kernel: 'nearest' })
    .png({ compressionLevel: 9 })
    .toBuffer()
  writeFileSync(resolve(root, `_private/proof/${entry.id}.png`), shot)
  report.push({ key, members: geometry.length, line: `proof crop → _private/proof/${entry.id}.png`, ok: true })
}

const where = record(root, measured)

/* --------------------------------------------------------------------------
   Report
   -------------------------------------------------------------------------- */

console.log('Outline geometry — CROCARIA\n')
for (const r of report) {
  console.log(`  ${r.key.padEnd(12)} ${String(r.members).padStart(2)} member(s)   ${r.line}`)
}
console.log(`\n  ${sets.length} set(s), ${lines.length} line(s) → ${OUT}`)
if (where) console.log(`  ${measured.length} measurement(s) → _private/reach.json`)
console.log('\n  <path> only. No <text> emitted anywhere.')

if (short) {
  console.error(`\n  At least one set renders under the ${FLOOR}px cap floor at ${VIEWPORT}px.`)
  console.error('  Rule 4: every term must be findable on a phone. Raise capPx in the job file.\n')
  process.exit(1)
}

console.log('')
