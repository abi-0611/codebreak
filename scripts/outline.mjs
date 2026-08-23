#!/usr/bin/env node
/**
 * Offline glyph-to-geometry converter.
 *
 * Turns a line of type set in Instrument Serif into SVG <path> data, so a
 * headline can be drawn as geometry instead of as characters. Geometry is not
 * text: find-in-page walks the text of a document and there is none here.
 * Inline SVG <text> would be matched by the browser and is never used.
 *
 * Runs offline, on a workstation, and its output is committed. Nothing here
 * ships, no font is fetched at runtime, and the browser never sees a glyph
 * table.
 *
 * Reading the font is lib/glyphs.mjs's job — it hands back a glyph's contours
 * as path data and knows nothing about layout. What is left here is the
 * layout: lay a line out, flip it to y-down, and emit one path per glyph. The
 * other caller of that reader is plates.mjs, which sets type into imagery.
 *
 * USAGE
 *
 *   node scripts/outline.mjs _private/type-jobs.json
 *   node scripts/outline.mjs --line sceneTop:ALPHA --line sceneLow:BETA
 *
 * The job file is organizer-only material and lives in _private/, which is
 * git-ignored. That is deliberate: the words themselves must not enter the
 * repository, only the geometry they produce. The exact invocation that made
 * the committed output is recorded in _private/CLUE-KEY.md.
 *
 * JOB FILE SHAPE
 *
 *   {
 *     "out": "src/content/outlines.ts",
 *     "lines": [
 *       { "key": "sceneTop", "text": "..." },
 *       { "key": "sceneLow", "text": "..." }
 *     ],
 *     "rings": [
 *       { "key": "sealOne", "crown": "...", "base": "..." }
 *     ]
 *   }
 *
 * Every line in one run shares a vertical band, so two stacked lines scaled to
 * the same height keep the same cap height. Widths differ, which is what real
 * typesetting does.
 *
 * RINGS
 *
 * A ring is a line set around a circle: `crown` along the top arc reading
 * left to right, `base` along the bottom arc, upright, tops toward the centre.
 * Both arcs occupy the same radial band, so the two read as one band of type
 * interrupted at three and nine o'clock.
 *
 * Every ring in every run is built from the constants in RING below — one
 * diameter, one em, one tracking, one pair of radii. Nothing about a ring is
 * derived from its own text except how far around the circle it reaches, so
 * two rings cannot drift apart no matter what they say. That property is the
 * entire reason the generator sets them rather than a person: a set of seals
 * where one is a hair different in weight or diameter reads as the odd one
 * out on sight, and whatever it says is then the first thing anyone reads.
 *
 * The component draws the two circles and the separator dots from the same
 * constants, exported as `ringPlan`, so the drawn and the generated halves of
 * a seal cannot disagree either.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { load, contours, toPath, bounds, round } from './lib/glyphs.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FACE =
  'node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff'

/** The display ramp's tracking, in em. Matches --tracking-display. */
const TRACKING = -0.03
/** Output em, in path units. Keeps the committed numbers small and readable. */
const EM = 1000

/* ==========================================================================
   Line layout
   ========================================================================== */

function setLine(font, text) {
  const scale = EM / font.m.em
  const step = TRACKING * EM
  const glyphs = []
  let pen = 0

  for (const ch of text) {
    const gid = font.map.get(ch.codePointAt(0)) ?? 0
    const shapes = contours(font.t, font.loca, gid)
    // Font units are y-up; SVG is y-down. The flip happens here, once.
    const at = pen
    const place = (p) => ({ x: at + p.x * scale, y: -p.y * scale, on: p.on })

    if (shapes.length) {
      glyphs.push({ d: toPath(shapes, place), box: bounds(shapes, place) })
    }
    pen += font.adv[gid] * scale + step
  }

  return { glyphs, advance: pen - step }
}

/** Translate a finished path. Cheaper than re-walking the contours. */
function shift(d, dx, dy) {
  let seen = 0
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const even = seen % 2 === 0
    seen += 1
    return String(round(Number(n) + (even ? dx : dy)))
  })
}

/* ==========================================================================
   Ring layout
   --------------------------------------------------------------------------
   Circular type, set the way a punch-cutter would: each glyph is placed on the
   arc and rotated RIGIDLY about the ring centre. Nothing is bent.

   That distinction matters. Mapping every control point through the circle
   individually shears the glyph — stems splay, bowls go lopsided, and the line
   looks melted at anything above caption size. A rigid rotation is an affine
   transform, so quadratic control points carry through it untouched and the
   letterform that comes out is exactly the letterform that went in.
   ========================================================================== */

/**
 * The construction shared by every ring, in ring units.
 *
 * These are deliberately not parameters. A ring's text decides how far around
 * the circle it reaches and nothing else; every other measurement is fixed
 * here, so a set of rings is identical by construction rather than by care.
 * `ringPlan` in the generated file re-exports them for the component that
 * draws the circles.
 */
const RING = {
  /** Square drawing box. Centre is half of it. */
  box: 1000,
  /** Heavy outer circle. */
  outer: 476,
  /** Hairline inner circle. */
  inner: 446,
  /** Stroke weights for the two circles. */
  outerWeight: 9,
  innerWeight: 3,
  /** Baseline radius of the crown arc. Caps grow outward from here. */
  crown: 356,
  /** Em size of ring type. */
  size: 76,
  /** Letter spacing, in em. Matches --tracking-label; circular type needs it. */
  tracking: 0.18,
  /** Separator dots at three and nine o'clock. */
  dot: 13,
}

/** Cap height at a given em size, measured off 'H' so every ring shares one. */
function capOf(font, size) {
  const gid = font.map.get(0x48) ?? 0
  const scale = size / font.m.em
  const box = bounds(contours(font.t, font.loca, gid), (p) => ({
    x: p.x * scale,
    y: -p.y * scale,
    on: p.on,
  }))
  return -box.y0
}

/**
 * Sets one line around one arc.
 *
 * `invert` is the bottom arc: the baseline sits at the OUTER edge of the band
 * and the caps grow inward, so the type stays upright and reads normally
 * without turning the page. Both arcs therefore ink the same radial band —
 * crown from `radius` outward, base from `radius` inward — which is what makes
 * the two halves look like one interrupted band rather than two rings.
 */
function setArc(font, text, radius, invert) {
  const scale = RING.size / font.m.em
  const step = RING.tracking * RING.size
  const centre = RING.box / 2

  const run = []
  let total = 0
  for (const ch of text) {
    const gid = font.map.get(ch.codePointAt(0)) ?? 0
    const adv = font.adv[gid] * scale
    run.push({ gid, adv, at: total })
    total += adv + step
  }
  total -= step
  const half = total / 2

  const paths = []
  // Radial extent of the ink, accumulated as it is placed. Reported by main()
  // so type running into a circle is caught here rather than noticed on the
  // page — descenders are the usual culprit, since Instrument Serif sets
  // old-style figures and REG. 4471 drops below its baseline.
  let near = Infinity
  let far = -Infinity

  for (const { gid, adv, at } of run) {
    const shapes = contours(font.t, font.loca, gid)
    if (!shapes.length) continue // a space inks nothing but still advances

    // Arc offset of this glyph's own centre from the centre of the line. The
    // pen position cancels out of `place` below, which is why `u` can be taken
    // straight from the glyph's own coordinates.
    const sweep = (at + adv / 2 - half) / radius
    const angle = invert ? -sweep : sweep
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const place = (p) => {
      const u = p.x * scale - adv / 2 // across the baseline, from glyph centre
      const v = -p.y * scale // font units are y-up; SVG is y-down
      const w = invert ? radius + v : -radius + v // along the radius
      const r = Math.hypot(u, w) // rotation is rigid, so this is the radius
      if (r < near) near = r
      if (r > far) far = r
      return {
        x: centre + u * cos - w * sin,
        y: centre + u * sin + w * cos,
        on: p.on,
      }
    }

    paths.push(toPath(shapes, place))
  }

  return { paths, sweep: total / radius, near, far }
}

/* ==========================================================================
   Emit
   ========================================================================== */

const HEADER = `/**
 * GENERATED — do not edit by hand.
 *
 * Produced by scripts/outline.mjs from the committed Instrument Serif WOFF.
 * Each entry is one line of display type, already converted from characters
 * into geometry, ready for <OutlineText/> in lib/split.tsx.
 *
 * Two properties are load-bearing:
 *
 *   1. There is no text in here. A line rendered from this data is drawn from
 *      path outlines, so find-in-page has nothing to match against. Inline SVG
 *      <text> would be matched and is therefore never used.
 *   2. Every set produced in a single run shares one vertical band, so stacked
 *      lines scaled to the same height keep an identical cap height. Widths
 *      differ, as they should.
 *
 * The words are supplied by the organizer-only job file and appear nowhere in
 * src/. Regenerating needs that file; see the note in scripts/outline.mjs.
 */

export type OutlineSet = {
  /** Tight to the ink horizontally, shared band vertically. */
  viewBox: string
  /** Intrinsic width / height, for reserving space before layout. */
  ratio: number
  /** One entry per inked glyph, left to right. */
  paths: string[]
}

/**
 * One line set around the top of a circle and one around the bottom, both
 * drawn in the square box described by \`ringPlan\`.
 *
 * Every ring in this file was produced in a single run from one set of
 * constants, so all of them share a diameter, an em, a tracking and a radial
 * band. The only thing a ring's own text decides is how far around the circle
 * it reaches. Do not hand-tune one of these: a ring that differs from its
 * siblings by so much as a stroke weight reads as the odd one out on sight.
 */
export type OutlineRing = {
  /** Glyphs of the top arc, left to right. */
  crown: string[]
  /** Glyphs of the bottom arc, upright, tops toward the centre. */
  base: string[]
}
`

const PLAN_DOC = `/**
 * The construction every ring in this file was built from, in ring units.
 *
 * The component draws the two circles and the separator dots from these
 * numbers and the generator set the type from the same ones, so the drawn half
 * and the generated half of a seal cannot disagree. Changing a value here by
 * hand only moves the circles; re-run the generator to move the type with it.
 */`

function plan(cap) {
  const rows = [
    ['box', RING.box, 'Square drawing box. Also the viewBox on both axes.'],
    ['outer', RING.outer, 'Heavy outer circle.'],
    ['inner', RING.inner, 'Hairline inner circle.'],
    ['outerWeight', RING.outerWeight, 'Stroke weight of the outer circle.'],
    ['innerWeight', RING.innerWeight, 'Stroke weight of the inner circle.'],
    ['band', round(cap), 'Radial depth of the type band. One cap height.'],
    ['dot', RING.dot, 'Radius of the separator dots at three and nine.'],
    ['dotAt', round(RING.crown + cap / 2), 'Radius the separator dots sit on.'],
  ]
  const body = rows
    .map(([key, value, note]) => '  /** ' + note + ' */\n  ' + key + ': ' + value + ',')
    .join('\n')
  return PLAN_DOC + '\nexport const ringPlan = {\n' + body + '\n} as const\n'
}

function emit(sets, rings, cap) {
  const list = (paths) => paths.map((d) => "    '" + d + "',").join('\n')

  const setBody = sets
    .map((set) =>
      [
        'export const ' + set.key + ': OutlineSet = {',
        "  viewBox: '" + set.viewBox + "',",
        '  ratio: ' + set.ratio + ',',
        '  paths: [',
        list(set.paths),
        '  ],',
        '}',
      ].join('\n'),
    )
    .join('\n\n')

  const ringBody = rings
    .map((ring) =>
      [
        'export const ' + ring.key + ': OutlineRing = {',
        '  crown: [',
        list(ring.crown),
        '  ],',
        '  base: [',
        list(ring.base),
        '  ],',
        '}',
      ].join('\n'),
    )
    .join('\n\n')

  const parts = [HEADER]
  if (setBody) parts.push(setBody)
  if (ringBody) parts.push(plan(cap), ringBody)
  return parts.join('\n') + '\n'
}

/* ==========================================================================
   Entry
   ========================================================================== */

function jobs(args) {
  const inline = []
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== '--line') continue
    const raw = args[i + 1] ?? ''
    const at = raw.indexOf(':')
    if (at < 1) throw new Error('--line wants key:text, got "' + raw + '"')
    inline.push({ key: raw.slice(0, at), text: raw.slice(at + 1) })
  }
  if (inline.length) return { out: 'src/content/outlines.ts', lines: inline, rings: [] }

  const file = args.find((a) => !a.startsWith('--'))
  if (!file) {
    console.error('Nothing to set. Pass a job file, or one or more --line key:text.')
    process.exit(2)
  }
  const spec = JSON.parse(readFileSync(resolve(ROOT, file), 'utf8'))
  return {
    out: spec.out ?? 'src/content/outlines.ts',
    lines: spec.lines ?? [],
    rings: spec.rings ?? [],
  }
}

function main() {
  const spec = jobs(process.argv.slice(2))
  const font = load(resolve(ROOT, FACE))

  const lines = spec.lines.map((line) => ({ ...line, ...setLine(font, line.text) }))

  // One vertical band for the whole run. Padded by a hair so a steep edge is
  // never clipped at large display sizes.
  let top = Infinity
  let base = -Infinity
  for (const line of lines) {
    for (const g of line.glyphs) {
      if (g.box.y0 < top) top = g.box.y0
      if (g.box.y1 > base) base = g.box.y1
    }
  }
  const pad = EM * 0.01
  top -= pad
  base += pad

  const sets = lines.map((line) => {
    let x0 = Infinity
    let x1 = -Infinity
    for (const g of line.glyphs) {
      if (g.box.x0 < x0) x0 = g.box.x0
      if (g.box.x1 > x1) x1 = g.box.x1
    }
    const w = x1 - x0
    const h = base - top
    // Shift the box to the origin; keeps the numbers small and the viewBox
    // trivially readable.
    return {
      key: line.key,
      viewBox: '0 0 ' + round(w) + ' ' + round(h),
      ratio: Math.round((w / h) * 1000) / 1000,
      paths: line.glyphs.map((g) => shift(g.d, -x0, -top)),
    }
  })

  // Rings. One cap height for the whole run, measured once off 'H', so the
  // crown and the base of every ring ink the same radial band.
  const cap = capOf(font, RING.size)
  const rings = spec.rings.map((ring) => {
    const crown = setArc(font, ring.crown, RING.crown, false)
    const foot = setArc(font, ring.base, RING.crown + cap, true)
    return {
      key: ring.key,
      crown: crown.paths,
      base: foot.paths,
      sweep: crown.sweep,
      near: Math.min(crown.near, foot.near),
      far: Math.max(crown.far, foot.far),
    }
  })

  const text = emit(sets, rings, cap)
  writeFileSync(resolve(ROOT, spec.out), text, 'utf8')

  console.log(
    'Set ' +
      sets.length +
      ' line(s) and ' +
      rings.length +
      ' ring(s) -> ' +
      spec.out +
      ' (' +
      (Buffer.byteLength(text) / 1024).toFixed(1) +
      ' KB)',
  )
  for (const s of sets) {
    console.log('  ' + s.key.padEnd(12) + s.paths.length + ' glyphs  viewBox ' + s.viewBox)
  }

  // Two ways a ring can go wrong, both reported rather than quietly clamped.
  // The fix for either is the wording or the shared construction — never one
  // seal's em or radius, which is exactly the divergence this all exists to
  // prevent.
  //
  //   sweep  a crown running past the separator dots at three and nine
  //   far    ink crossing the inner circle, usually an old-style figure's
  //          descender on the base arc
  const LIMIT = 170
  const CEILING = RING.inner - RING.innerWeight / 2 - 6
  let bad = false

  for (const r of rings) {
    const deg = (r.sweep * 180) / Math.PI
    const over = deg > LIMIT
    const out = r.far > CEILING
    bad = bad || over || out
    console.log(
      '  ' +
        r.key.padEnd(12) +
        String(r.crown.length + r.base.length).padStart(2) +
        ' glyphs  sweep ' +
        deg.toFixed(1).padStart(5) +
        '°' +
        (over ? '!' : ' ') +
        '  ink ' +
        round(r.near) +
        '..' +
        round(r.far) +
        (out ? ' <-- crosses the inner circle at ' + round(CEILING) : ''),
    )
  }

  if (bad) {
    console.error(
      '\nA ring does not fit its construction. Shorten the wording, or change' +
        '\nRING for every ring at once. Never adjust a single seal.',
    )
    process.exit(1)
  }
}

main()
