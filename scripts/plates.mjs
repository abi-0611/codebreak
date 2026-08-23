#!/usr/bin/env node
/**
 * Raster artwork — phase 5, task 5.4. Technique T-A.
 *
 * Draws every image the site ships, encodes it to WebP at two widths, writes
 * app/content/plates.ts so a component can never disagree with what is on
 * disk, and records the cap height each term lands at on a 375px viewport.
 *
 *   node scripts/plates.mjs              all of them
 *   node scripts/plates.mjs plate-06     one stem, for iterating
 *   node scripts/plates.mjs --sheet      also write the organiser proof crops
 *
 * DETERMINISTIC. Every random number comes from a seeded generator keyed on
 * the stem, there are no timestamps in the output, and nothing is fetched.
 * Running it twice produces an identical diff — which is to say, none.
 *
 * WHY DRAWN RATHER THAN PHOTOGRAPHED
 *
 * Four of the six terms are in these files, and drawing them buys three things
 * a stock photograph cannot:
 *
 *   1. Sets cannot drift apart. Six specimen labels, four board cards, four
 *      step documents, three custody verbs — each is ONE function called N
 *      times, so identical treatment is structural rather than something a
 *      person has to remember. 04-clue-architecture.md §4.3 is the whole
 *      camouflage and it is not a thing you can hold in your head across six
 *      hand-composited layers.
 *   2. The term ends up as pixels. Find-in-page cannot read pixels. The
 *      alternative — live text positioned over an image with CSS — puts all
 *      four terms back into the DOM where Ctrl+F takes them in one keystroke.
 *   3. Nothing is fetched, credited or attributable.
 *
 * SWAPPING IN PHOTOGRAPHY
 *
 * Drop a frame at _private/frames/<stem>.png and this generator grades it and
 * uses it as the base instead of drawing one, keeping every plate, card and
 * stamp it composites on top. Photography can be upgraded later without
 * touching any of the placement work. _private/ is git-ignored, so the
 * COMMITTED WebP stays the reproducible artefact either way.
 *
 * TYPE
 *
 * All lettering is set from the committed font binaries through lib/glyphs.mjs,
 * as paths. Not because find-in-page could reach it — the output is a raster —
 * but because a rasteriser asked to draw <text> has to locate the face on the
 * machine and will quietly fall back to a system font when it cannot. On this
 * site that produces a term set in Arial on a Victorian engraving, which is a
 * typographic anomaly that hands the answer to anyone who notices it. Rule 3.
 *
 * THE WORDS
 *
 * Every string that ends up as pixels lives in _private/plate-jobs.json, which
 * is git-ignored. Never in this file. The repository is private; the discipline
 * is free.
 *
 * LEGIBILITY IS CHECKED BY THE NUMBERS
 *
 * Each job declares `renderPx` — how much of a 375px viewport the artwork
 * occupies. This generator derives the cap height every term lands at from
 * that and the texture's own geometry, prints it, and EXITS NON-ZERO under
 * 7px. Rule 4 is not satisfied by looking at a 27-inch monitor.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, join } from 'node:path'
import sharp from 'sharp'
import { face, line, arc, round } from './lib/glyphs.mjs'
import { outline, counter, BOX as DEVICE_BOX } from './lib/device.mjs'
import { record, grade, FLOOR, VIEWPORT } from './lib/reach.mjs'
import { palette } from '../tokens/palette.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const at = (...p) => resolve(root, ...p)

const OUT = at('public/img')
const JOBS = at('_private/plate-jobs.json')
const BASES = at('_private/frames')
const PROOF = at('_private/proof')
const MODULE = at('app/content/plates.ts')

const argv = process.argv.slice(2)
const wantSheet = argv.includes('--sheet')
const only = argv.filter((a) => !a.startsWith('--'))

/* ==========================================================================
   Colour
   --------------------------------------------------------------------------
   Every tone below is either a palette token or a MIX of two of them. No new
   literals: tokens/palette.mjs is the definition site for colour on this site
   and artwork is not an exemption, it is the place the rule is easiest to
   break and hardest to notice.
   ========================================================================== */

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
const rgb = ([r, g, b]) => `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('')}`

/** Linear blend between two palette tones. `t` 0 is `a`, 1 is `b`. */
function mix(a, b, t) {
  const x = hex(a)
  const y = hex(b)
  return rgb([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t))
}

/** A palette tone at a fraction of its own brightness, toward black. */
const dim = (a, t) => mix(a, palette.black, t)
/** A palette tone lifted toward cream. Never toward white — this house has no white. */
const lift = (a, t) => mix(a, palette.cream, t)

const INK = {
  ground: palette.black,
  paper: palette['brown-deepest'],
  panel: palette['brown-darker'],
  rule: palette['brown-dark'],
  mid: palette.brown,
  warm: palette['brown-lifted'],
  cream: palette.cream,
  gold: palette.gold,
}

/* ==========================================================================
   Numbers
   ========================================================================== */

/** Deterministic. Same seed, same picture, on any machine, forever. */
function rng(seed) {
  let s = (seed >>> 0) || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** A stable seed from a stem, so `node scripts/plates.mjs plate-06` matches a full run. */
const seedOf = (stem) => {
  let h = 2166136261
  for (const ch of stem) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

const between = (rand, lo, hi) => lo + rand() * (hi - lo)
const r1 = (n) => round(n)
const KB = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'

/* ==========================================================================
   Type
   --------------------------------------------------------------------------
   One reader, four faces, and a single entry point that returns SVG markup.
   Nothing in this file may call opentype directly — see the note in
   lib/glyphs.mjs about why every caller goes through one place.
   ========================================================================== */

const FONTS = {
  mono: '_private/fonts/mono-400.ttf',
  monoMid: '_private/fonts/mono-500.ttf',
  text: '_private/fonts/text-400.ttf',
  display: '_private/fonts/display-300.woff',
}

const faces = {}
function f(name) {
  if (!faces[name]) {
    const file = at(FONTS[name])
    if (!existsSync(file)) {
      console.error(`\n  No font at ${FONTS[name]}.`)
      console.error('  See the re-fetch recipe in the header of scripts/lockup.mjs.\n')
      process.exit(1)
    }
    faces[name] = face(file)
  }
  return faces[name]
}

/**
 * One line of type as an SVG <path>.
 *
 * Returns the markup AND the measurement, because every caller that draws a
 * term needs to know where it landed and how tall its caps came out. A
 * function that only returned markup would push that arithmetic back out to
 * five call sites.
 */
function type(name, text, o = {}) {
  const set = line(f(name), text, {
    size: o.size,
    tracking: o.tracking ?? 0,
    x: o.x ?? 0,
    y: o.y ?? 0,
    align: o.align ?? 'left',
  })
  const fill = o.fill ?? INK.cream
  const op = o.opacity == null ? '' : ` opacity="${o.opacity}"`
  const turn = o.rotate ? ` transform="rotate(${r1(o.rotate)} ${r1(o.x ?? 0)} ${r1(o.y ?? 0)})"` : ''
  return {
    svg: `<path d="${set.d}" fill="${fill}"${op}${turn}/>`,
    ...set,
  }
}

/**
 * One line of type around a circle.
 *
 * `anchor` decides what `start` means, and it is a CAMOUFLAGE decision as much
 * as a typographic one, because it is what fixes where each word on a band
 * ends up:
 *
 *   'centre'  the line's middle sits at `start`. A band shorter than a full
 *             revolution puts its GAP at the bottom, which is what a struck
 *             seal does, and every word on it stays upright enough to read.
 *   'start'   the line BEGINS at `start`. For a band that closes a full
 *             revolution there is no gap to place, so the only question left
 *             is where the reader's eye enters — and that is the top.
 *
 * `arc` centres natively, so 'start' is done by laying the line twice: the
 * first pass measures the sweep, the second offsets by half of it. The
 * measurement pass costs nothing.
 *
 * THE SEAL CENTRES AND THE MEDALLION BEGINS, and each is right for what it is.
 * The seal's inner band is three words over 281 degrees; begun at twelve, its
 * middle word runs through six o'clock and comes out upside down, which fails
 * rule 4 on a phone. The medallion's band is a full revolution with no gap;
 * centred, its eleventh character lands at the top, and phase 4 wants it at
 * four o'clock where a clockwise band is still comfortably readable and where
 * nobody starts reading.
 *
 * Neither choice touches how the WORDS within a band relate to each other:
 * both surfaces lay their whole band in one call at one letter height, which
 * is the property 04-clue-architecture.md §4.3 actually depends on.
 *
 * Ring bands only — see the note in lib/glyphs.mjs about why nothing else on
 * this site is set on an arc.
 */
function ring(name, text, o) {
  const anchor = o.anchor ?? 'centre'
  const shift =
    anchor === 'start' ? arc(f(name), text, { ...o, start: 0 }).sweep / 2 : 0
  const set = arc(f(name), text, { ...o, start: shift + (o.start ?? 0) })
  const fill = o.fill ?? INK.cream
  const op = o.opacity == null ? '' : ` opacity="${o.opacity}"`
  return { svg: `<path d="${set.d}" fill="${fill}"${op}/>`, ...set }
}

/** Cap height a face reaches at a given em. Used to solve layouts backwards. */
const capAt = (name, size) => (f(name).cap / f(name).em) * size
/** The em that produces a wanted cap height. The way every clue label is sized. */
const emFor = (name, cap) => (cap * f(name).em) / f(name).cap
/** Advance width of a string at an em, without setting it. */
const widthOf = (name, text, size, tracking = 0) =>
  line(f(name), text, { size, tracking }).width

/* ==========================================================================
   Surfaces
   ========================================================================== */

const doc = (w, h, body, defs = '') =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      (defs ? `<defs>${defs}</defs>` : '') +
      body +
      '</svg>',
  )

/**
 * Film grain, as a raw RGBA buffer.
 *
 * Composited with `overlay`, so mid grey leaves the pixel alone and the noise
 * only ever nudges. Every plate on this site gets some: a perfectly clean
 * gradient reads as a render, and a render beside a photograph is the surface
 * everyone looks at.
 */
function grain(w, h, seed, amount = 16) {
  const rand = rng(seed ^ 0x9e3779b9)
  const px = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i += 1) {
    const v = clamp(128 + (rand() - 0.5) * amount * 2)
    px[i * 4] = v
    px[i * 4 + 1] = v
    px[i * 4 + 2] = v
    px[i * 4 + 3] = 255
  }
  return { input: px, raw: { width: w, height: h, channels: 4 }, blend: 'overlay' }
}

/**
 * A corner falloff, composited with `multiply`.
 *
 * White at the centre is a no-op, so the gradient only ever darkens — which is
 * what stops a plate from being the brightest thing in its section. Rule 4.2
 * of 04-clue-architecture.md is a compositing instruction, not an aspiration.
 */
function vignette(w, h, strength = 0.5, cx = 0.5, cy = 0.5) {
  const stop = rgb([255, 255, 255].map((n) => n * (1 - strength)))
  return {
    input: doc(
      w,
      h,
      `<rect width="${w}" height="${h}" fill="url(#v)"/>`,
      `<radialGradient id="v" cx="${cx}" cy="${cy}" r="0.78">` +
        `<stop offset="0.3" stop-color="#ffffff"/>` +
        `<stop offset="1" stop-color="${stop}"/>` +
        '</radialGradient>',
    ),
    blend: 'multiply',
  }
}

/* ==========================================================================
   Grounds — the drawn photography of task 5.6
   ========================================================================== */

/**
 * Crocus macro. Dark ground, warm threads, shallow depth of field.
 *
 * The depth of field is real rather than painted: the bed is rendered, blurred
 * by sharp, and the near threads are composited on top unblurred. A painted
 * blur reads as a filter; a blurred layer reads as a lens.
 */
async function macro(w, h, seed) {
  const rand = rng(seed)

  // The bed: a warm pool of light with bokeh behind it.
  const blobs = []
  for (let i = 0; i < 42; i += 1) {
    const r = between(rand, w * 0.02, w * 0.12)
    blobs.push(
      `<circle cx="${r1(between(rand, -0.1, 1.1) * w)}" cy="${r1(between(rand, -0.1, 1.1) * h)}" r="${r1(r)}" ` +
        `fill="${mix(INK.panel, INK.warm, between(rand, 0.05, 0.5))}" opacity="${r1(between(rand, 0.1, 0.34))}"/>`,
    )
  }

  const glowX = between(rand, 0.34, 0.66)
  const glowY = between(rand, 0.3, 0.6)

  const bed = await sharp(
    doc(
      w,
      h,
      `<rect width="${w}" height="${h}" fill="url(#bed)"/>${blobs.join('')}` +
        thread(rand, w, h, 34, { far: true }),
      `<radialGradient id="bed" cx="${r1(glowX)}" cy="${r1(glowY)}" r="0.72">` +
        `<stop offset="0" stop-color="${mix(INK.paper, INK.warm, 0.34)}"/>` +
        `<stop offset="0.55" stop-color="${INK.panel}"/>` +
        `<stop offset="1" stop-color="${INK.ground}"/>` +
        '</radialGradient>',
    ),
  )
    .blur(Math.max(2, w * 0.012))
    .toBuffer()

  // The near threads: in focus, and the only sharp thing in the picture.
  const near = doc(w, h, thread(rand, w, h, 16, { far: false }))

  return sharp(bed)
    .composite([
      { input: near },
      vignette(w, h, 0.55, glowX, glowY),
      grain(w, h, seed, 14),
    ])
    .toBuffer()
}

/**
 * N saffron threads, drawn by one loop.
 *
 * A stigma is a fine tapered filament that opens at the tip, so each is a
 * closed shape swept along a quadratic spine rather than a stroked line — a
 * stroke has one width and reads as wire.
 *
 * They arrive in CLUSTERS, at wide angles, and short. Threads scattered evenly
 * across the frame at one length and one lean read as a pattern; a handful lie
 * where a handful of them were dropped on a bench, which is what the picture is
 * meant to be of.
 */
function thread(rand, w, h, n, { far }) {
  const out = []
  const heaps = 2 + Math.floor(rand() * 2)
  const centres = []
  for (let i = 0; i < heaps; i += 1) {
    centres.push({ x: between(rand, 0.22, 0.78) * w, y: between(rand, 0.3, 0.78) * h })
  }

  for (let i = 0; i < n; i += 1) {
    const heap = centres[i % heaps]
    const spread = (far ? 0.3 : 0.19) * Math.min(w, h)
    const x0 = heap.x + between(rand, -1, 1) * spread
    const y0 = heap.y + between(rand, -1, 1) * spread

    // Wide angular spread. Anything narrower and the heap combs itself.
    const a = between(rand, -Math.PI, Math.PI)
    const len = between(rand, 0.1, 0.24) * h
    const bow = between(rand, -0.5, 0.5)

    const x1 = x0 + Math.cos(a) * len
    const y1 = y0 + Math.sin(a) * len
    // The bend, taken perpendicular to the thread's own run.
    const cx = (x0 + x1) / 2 - Math.sin(a) * len * bow
    const cy = (y0 + y1) / 2 + Math.cos(a) * len * bow

    const wide = len * (far ? 0.05 : 0.062)
    const nx = -Math.sin(a) * wide
    const ny = Math.cos(a) * wide
    const tone = far
      ? mix(INK.mid, INK.panel, between(rand, 0.2, 0.62))
      : mix(INK.warm, INK.gold, between(rand, 0, 0.3))

    // Seat, out along one edge, a round cap at the tip, and back along the
    // other. The tip is where a stigma opens, so it is the widest point.
    out.push(
      `<path d="M${r1(x0 - nx * 0.55)} ${r1(y0 - ny * 0.55)}` +
        `Q${r1(cx - nx * 0.8)} ${r1(cy - ny * 0.8)} ${r1(x1 - nx)} ${r1(y1 - ny)}` +
        `Q${r1(x1 + Math.cos(a) * wide * 1.6)} ${r1(y1 + Math.sin(a) * wide * 1.6)} ${r1(x1 + nx)} ${r1(y1 + ny)}` +
        `Q${r1(cx + nx * 0.8)} ${r1(cy + ny * 0.8)} ${r1(x0 + nx * 0.55)} ${r1(y0 + ny * 0.55)}Z" ` +
        `fill="${tone}" opacity="${r1(far ? between(rand, 0.28, 0.62) : between(rand, 0.7, 0.96))}"/>`,
    )
  }
  return out.join('')
}

/**
 * An architectural interior. Low luminance, warm, one light source.
 *
 * Built as an ARCADE receding to a vanishing point — a nested run of openings,
 * each a fixed fraction of the one in front of it, with the floor and ceiling
 * lines running back to meet them. The first pass drew free-standing piers as
 * axis-aligned rectangles and six of them side by side in the carousel read as
 * a bar chart: a rectangle has no perspective, so nothing about it says
 * "room". Nesting is what makes depth legible at a card's size.
 */
async function interior(w, h, seed) {
  const rand = rng(seed)
  const vx = between(rand, 0.3, 0.7) * w
  const vy = between(rand, 0.38, 0.62) * h
  const bays = 3 + Math.floor(rand() * 4)
  /** How much each opening shrinks behind the one in front of it. */
  const step = between(rand, 0.64, 0.84)

  const parts = [`<rect width="${w}" height="${h}" fill="${INK.ground}"/>`]

  // The mouth of the arcade: the outermost opening, filling the frame.
  // The two extents vary INDEPENDENTLY, so some of these are wide halls and
  // some are narrow stairwells. Six cards cut from one composition read as one
  // picture repeated, which is the carousel looking cheap rather than deep.
  let ow = w * between(rand, 0.55, 1.05)
  let oh = h * between(rand, 0.6, 1.0)

  const mouth = { w: ow, h: oh }
  const bay = []
  for (let i = 0; i < bays; i += 1) {
    bay.push({ w: ow, h: oh })
    ow *= step
    oh *= step
  }

  // Floor and ceiling, so the space between the openings is a surface.
  parts.push(
    `<rect x="0" y="0" width="${w}" height="${r1(vy)}" fill="url(#wall)"/>`,
    `<rect x="0" y="${r1(vy)}" width="${w}" height="${r1(h - vy)}" fill="url(#floor)"/>`,
  )

  // The four lines from the mouth's corners to the vanishing point. They are
  // what the eye reads perspective off; everything else only agrees with them.
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    parts.push(
      `<path d="M${r1(vx + (sx * mouth.w) / 2)} ${r1(vy + (sy * mouth.h) / 2)}L${r1(vx)} ${r1(vy)}" ` +
        `stroke="${INK.rule}" stroke-width="1.8" opacity="0.6"/>`,
    )
  }

  // The bays, drawn back to front so a nearer arch overlaps a further one.
  bay.forEach((b, i) => {
    const t = i / bays
    parts.push(
      `<rect x="${r1(vx - b.w / 2)}" y="${r1(vy - b.h / 2)}" width="${r1(b.w)}" height="${r1(b.h)}" ` +
        `fill="none" stroke="${mix(INK.mid, INK.paper, 0.3 + t * 0.5)}" stroke-width="${r1(6 * (1 - t * 0.6))}" ` +
        `opacity="${r1(0.75 - t * 0.3)}"/>`,
      // The soffit above each opening, catching a little of the light.
      `<rect x="${r1(vx - b.w / 2)}" y="${r1(vy - b.h / 2)}" width="${r1(b.w)}" height="${r1(b.h * 0.045)}" ` +
        `fill="${mix(INK.mid, INK.warm, 0.28)}" opacity="${r1(0.22 - t * 0.12)}"/>`,
    )
  })

  // The opening the light comes through. Sometimes a door on the axis,
  // sometimes a window off to one side and high — which is the difference
  // between six corridors and six rooms.
  const lit = bay[bay.length - 1]
  const doorway = rand() < 0.55
  const lw = lit.w * (doorway ? step : between(rand, 0.3, 0.5))
  const lh = lit.h * (doorway ? step : between(rand, 0.35, 0.6))
  const lx = vx + (doorway ? 0 : between(rand, -0.34, 0.34) * lit.w)
  const ly = vy - (doorway ? 0 : between(rand, 0.05, 0.22) * lit.h)
  parts.push(
    `<rect x="${r1(lx - lw / 2)}" y="${r1(ly - lh / 2)}" width="${r1(lw)}" height="${r1(lh)}" fill="url(#lit)"/>`,
    // What that opening throws onto the floor.
    `<path d="M${r1(lx - lw / 2)} ${r1(ly + lh / 2)}L${r1(lx + lw / 2)} ${r1(ly + lh / 2)}` +
      `L${r1(lx + lw * 1.6)} ${r1(h)}L${r1(lx - lw * 1.6)} ${r1(h)}Z" ` +
      `fill="${mix(INK.mid, INK.warm, 0.4)}" opacity="0.12"/>`,
  )

  const defs =
    // The two grounds MEET at the horizon on the same tone. Different tones
    // either side of it put a hard rule across the middle of all six cards,
    // which is the seam that says "generated" louder than anything else here.
    `<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${INK.ground}"/>` +
    `<stop offset="1" stop-color="${mix(INK.panel, INK.paper, 0.55)}"/></linearGradient>` +
    `<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${mix(INK.panel, INK.paper, 0.55)}"/>` +
    `<stop offset="1" stop-color="${INK.ground}"/></linearGradient>` +
    `<linearGradient id="lit" x1="0" y1="0" x2="0.3" y2="1">` +
    `<stop offset="0" stop-color="${mix(INK.warm, INK.gold, 0.45)}"/>` +
    `<stop offset="1" stop-color="${mix(INK.mid, INK.panel, 0.35)}"/></linearGradient>`

  const base = await sharp(doc(w, h, parts.join(''), defs)).blur(Math.max(1, w * 0.002)).toBuffer()

  return sharp(base)
    .composite([vignette(w, h, 0.56, vx / w, vy / h), grain(w, h, seed, 12)])
    .toBuffer()
}

/**
 * A link tile still. Abstract, dark, warm — a loop caught mid-frame.
 *
 * THREE MOTIFS, chosen by seed. These sit at low opacity behind a centred
 * label, so each one on its own wants to be quiet — but four quiet variations
 * on one idea read as one picture printed four times, which is worse than any
 * of them being loud. Quiet and DIFFERENT is the target.
 */
async function tile(w, h, seed) {
  const rand = rng(seed)
  const cx = between(rand, 0.3, 0.7) * w
  const cy = between(rand, 0.3, 0.7) * h
  const motif = Math.floor(rand() * 3)
  const marks = []

  if (motif === 0) {
    // Concentric rings — a seal's ghost.
    const n = 5 + Math.floor(rand() * 4)
    for (let i = 0; i < n; i += 1) {
      const r = ((i + 1) / n) * Math.max(w, h) * between(rand, 0.4, 0.62)
      marks.push(
        `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="none" ` +
          `stroke="${mix(INK.mid, INK.warm, i / n)}" stroke-width="${r1(between(rand, 1.4, 3.4))}" ` +
          `opacity="${r1(0.55 - (i / n) * 0.34)}"/>`,
      )
    }
  } else if (motif === 1) {
    // A raked bank of rules — a ledger seen edge-on.
    const n = 9 + Math.floor(rand() * 7)
    const lean = between(rand, -26, 26)
    for (let i = 0; i < n; i += 1) {
      const y = ((i + 0.5) / n) * h
      marks.push(
        `<rect x="${r1(-w * 0.2)}" y="${r1(y)}" width="${r1(w * 1.4)}" height="${r1(between(rand, 2, 9))}" ` +
          `fill="${mix(INK.mid, INK.warm, (i / n) * 0.8)}" opacity="${r1(between(rand, 0.16, 0.5))}" ` +
          `transform="rotate(${r1(lean)} ${r1(w / 2)} ${r1(h / 2)})"/>`,
      )
    }
  } else {
    // A burst of radials — threads leaving a point.
    const n = 14 + Math.floor(rand() * 12)
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + between(rand, -0.1, 0.1)
      const len = Math.max(w, h) * between(rand, 0.32, 0.78)
      marks.push(
        `<path d="M${r1(cx)} ${r1(cy)}L${r1(cx + Math.cos(a) * len)} ${r1(cy + Math.sin(a) * len)}" ` +
          `stroke="${mix(INK.mid, INK.warm, between(rand, 0, 0.9))}" stroke-width="${r1(between(rand, 1.2, 4))}" ` +
          `opacity="${r1(between(rand, 0.12, 0.4))}"/>`,
      )
    }
  }

  const base = await sharp(
    doc(
      w,
      h,
      `<rect width="${w}" height="${h}" fill="url(#t)"/>${marks.join('')}`,
      `<radialGradient id="t" cx="${r1(cx / w)}" cy="${r1(cy / h)}" r="0.8">` +
        `<stop offset="0" stop-color="${mix(INK.paper, INK.warm, 0.22)}"/>` +
        `<stop offset="1" stop-color="${INK.ground}"/></radialGradient>`,
    ),
  )
    .blur(Math.max(1, w * 0.004))
    .toBuffer()

  return sharp(base)
    .composite([vignette(w, h, 0.5, cx / w, cy / h), grain(w, h, seed, 10)])
    .toBuffer()
}

/* ==========================================================================
   The document — one function, four calls
   --------------------------------------------------------------------------
   Same paper, same rake, same grade, same drop shadow. Only the strings
   differ. DO NOT special-case the one that carries something.
   ========================================================================== */

const DOCUMENT = {
  /** Cap heights, in the document's own units. The foot band carries a term. */
  head: 30,
  body: 26,
  foot: 24,
  pad: 44,
  rule: 2,
}

/**
 * One document, drawn at a width, returning its markup and its measurements.
 *
 * The height falls out of the content, which is what a real form does; forcing
 * every document to one height would give the four steps four different
 * type sizes, and a set whose members are set differently is not a set.
 */
function document(job, width) {
  const { pad } = DOCUMENT
  const headEm = emFor('monoMid', DOCUMENT.head)
  const bodyEm = emFor('text', DOCUMENT.body)
  const footEm = emFor('mono', DOCUMENT.foot)

  const parts = []
  let y = pad + DOCUMENT.head

  parts.push(type('monoMid', job.head, { size: headEm, x: pad, y, fill: mix(INK.ground, INK.mid, 0.22) }).svg)
  y += 26
  parts.push(
    `<rect x="${pad}" y="${r1(y)}" width="${r1(width - pad * 2)}" height="${DOCUMENT.rule}" fill="${mix(INK.mid, INK.paper, 0.5)}"/>`,
  )
  y += 40

  for (const row of job.body) {
    y += DOCUMENT.body
    parts.push(type('text', row, { size: bodyEm, x: pad, y, fill: mix(INK.ground, INK.mid, 0.4) }).svg)
    y += 20
  }

  y += 26
  const footTop = y
  const footBase = footTop + DOCUMENT.foot + 22

  // The foot band. A struck credit line across the bottom of the form, which
  // is where a certificate says what it is struck on. Inked DARKER than the
  // sheet rather than lighter: a band that glowed would be the first thing the
  // eye lands on, and one of these four bands carries something.
  parts.push(
    `<rect x="0" y="${r1(footTop)}" width="${width}" height="${r1(footBase - footTop + 26)}" ` +
      `fill="${mix(INK.cream, INK.mid, 0.58)}"/>`,
  )
  const foot = type('mono', job.foot, {
    size: footEm,
    x: width / 2,
    y: footBase,
    align: 'centre',
    fill: mix(INK.ground, INK.mid, 0.16),
  })
  parts.push(foot.svg)

  const height = footBase + 26

  return {
    width,
    height,
    /** Where the foot band's ink sits, for a proof crop and a measurement. */
    footBox: { x: foot.box.x0, y: foot.box.y0, w: foot.box.w, h: foot.box.h },
    footCap: foot.cap,
    svg:
      `<rect width="${width}" height="${r1(height)}" fill="url(#paper)"/>` +
      parts.join('') +
      `<rect width="${width}" height="${r1(height)}" fill="url(#fall)"/>` +
      `<rect width="${width}" height="${r1(height)}" fill="none" stroke="${mix(INK.cream, INK.mid, 0.62)}" stroke-width="2"/>`,
    /**
     * AGED STOCK, NOT WHITE PAPER.
     *
     * The first pass drew this at full cream and the certificate came out as
     * the most luminous object in the pinned scene by a wide margin — a lit
     * rectangle on near-black, which is exactly the thing 04's rule 4.2
     * forbids on a surface that carries a term. Toned to the warm end of the
     * palette it reads as paper lying on a bench in low light, which is what
     * it is meant to be a photograph of.
     */
    defs:
      `<linearGradient id="paper" x1="0" y1="0" x2="0.3" y2="1">` +
      `<stop offset="0" stop-color="${mix(INK.cream, INK.mid, 0.3)}"/>` +
      `<stop offset="1" stop-color="${mix(INK.cream, INK.mid, 0.52)}"/></linearGradient>` +
      // Light falling across the sheet. Without it the paper is evenly lit,
      // which no photographed document ever is.
      `<linearGradient id="fall" x1="0.1" y1="0" x2="0.9" y2="1">` +
      `<stop offset="0" stop-color="${INK.ground}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${INK.ground}" stop-opacity="0.42"/></linearGradient>`,
  }
}

/* ==========================================================================
   The requisition card — one function, four calls
   ========================================================================== */

const CARD = { title: 30, req: 22, pad: 34, lead: 16 }

/**
 * Greedy word wrap to a measure, in the artwork's own pixels.
 *
 * ONE rule for all four cards. The first pass broke each title on its em-dash
 * and nothing else, which overflowed the two longest titles off the edge of
 * their cards — and a set whose members overflow by different amounts is not a
 * set. Breaking on the dash FIRST and then wrapping each part is still one
 * rule: it gives the four cards two, three, three and three lines, which is
 * what four real titles of different lengths do.
 */
function wrap(name, text, size, measure) {
  const out = []
  for (const part of splitOnDash(text).filter(Boolean)) {
    let row = ''
    for (const word of part.split(/\s+/)) {
      const next = row ? `${row} ${word}` : word
      if (row && widthOf(name, next, size) > measure) {
        out.push(row)
        row = word
      } else {
        row = next
      }
    }
    if (row) out.push(row)
  }
  return out
}

/**
 * One pinned card.
 *
 * Same stock, same pin, same rake rule, same wrap rule, same two type sizes.
 * The only thing that differs between the four is what they say — which is the
 * entire defence, and the reason this is a function rather than four blocks.
 */
function notice(job, width, height) {
  const titleEm = emFor('monoMid', CARD.title)
  const reqEm = emFor('mono', CARD.req)
  const measure = width - CARD.pad * 2
  const rows = wrap('monoMid', job.title, titleEm, measure)

  const parts = []
  let y = CARD.pad + CARD.title + 6
  let widest = 0

  for (const row of rows) {
    const set = type('monoMid', row, {
      size: titleEm,
      x: CARD.pad,
      y,
      fill: mix(INK.ground, INK.mid, 0.2),
    })
    parts.push(set.svg)
    widest = Math.max(widest, set.box.w)
    y += CARD.title + CARD.lead
  }

  parts.push(
    `<rect x="${CARD.pad}" y="${r1(y + 8)}" width="${r1(measure)}" height="1.6" ` +
      `fill="${mix(INK.mid, INK.cream, 0.35)}"/>`,
  )
  parts.push(
    type('mono', job.req, {
      size: reqEm,
      x: CARD.pad,
      y: height - CARD.pad,
      fill: mix(INK.ground, INK.mid, 0.42),
    }).svg,
  )

  if (y + 60 > height) {
    console.error(`\n  A requisition card's title needs ${r1(y + 60)}px of a ${height}px card.`)
    console.error('  Every card in the set is the same size, so raise BOARD.card.h — never trim')
    console.error('  one title to fit.\n')
    process.exit(1)
  }

  return {
    svg:
      `<rect width="${width}" height="${height}" rx="3" fill="url(#stock)"/>` +
      parts.join('') +
      // Light falling across the card, then the pin on top of it.
      `<rect width="${width}" height="${height}" rx="3" fill="url(#fall)"/>` +
      `<circle cx="${r1(width / 2)}" cy="${r1(CARD.pad * 0.62)}" r="9" fill="${dim(INK.mid, 0.5)}"/>` +
      `<circle cx="${r1(width / 2 - 2)}" cy="${r1(CARD.pad * 0.62 - 2)}" r="4" fill="${mix(INK.mid, INK.warm, 0.5)}"/>`,
    /** The title block, in card units — every line of it, for the proof crop. */
    titleBox: {
      x: CARD.pad,
      y: CARD.pad,
      w: widest,
      h: y - CARD.pad - CARD.lead + 12,
    },
    titleCap: CARD.title,
  }
}

/** `Role — Team` → ['Role', '— Team']. The em-dash stays with the tail. */
function splitOnDash(title) {
  const i = title.indexOf('—')
  if (i < 0) return [title, '']
  return [title.slice(0, i).trim(), title.slice(i).trim()]
}

/* ==========================================================================
   The assay seal
   ========================================================================== */

const SEAL = {
  /**
   * Band geometry, as fractions of the seal's own radius.
   *
   * `r` is the BASELINE radius and caps grow OUTWARD from it, so a band's ink
   * runs from r to r + cap. The two bands and the four bounding rules are laid
   * out against each other below and the generator refuses if any of them
   * touch: a ring band that collides with a hairline is illegible at exactly
   * the size a phone renders it, and looks fine on a workstation.
   */
  outer: { r: 0.8, cap: 22 },
  inner: { r: 0.58, cap: 30 },
  /** Where the four hairlines sit. Outside both bands, between them, and under. */
  rules: [0.99, 0.925, 0.755, 0.53],
  /** The device's diameter, as a fraction of the field inside the inner band. */
  field: 0.62,
  /**
   * Ring tracking, in em. The one place on this site where tracking is not
   * `normal` — see lib/glyphs.mjs. On a tight radius the outer corners of
   * adjacent caps touch without it.
   */
  tracking: 0.06,
}

function sealArt(job, size) {
  const R = size / 2
  const mid = size / 2

  /**
   * THE SEAL IS DARK ON PURPOSE.
   *
   * 04-clue-architecture.md §4.2: a clue-bearing plate may never be the
   * brightest or highest-contrast thing in its frame. A struck seal wants to
   * be bright — that is what struck metal does — and this one carries a term
   * in its inner band, so it is graded down until it reads only when looked
   * at. The gradient runs across oxidised bronze, not across gold.
   */
  const parts = [`<circle cx="${mid}" cy="${mid}" r="${r1(R * 0.985)}" fill="url(#metal)"/>`]

  for (const t of SEAL.rules) {
    parts.push(
      `<circle cx="${mid}" cy="${mid}" r="${r1(R * t)}" fill="none" ` +
        `stroke="${dim(INK.mid, 0.62)}" stroke-width="${t > 0.95 ? 3 : 1.8}" opacity="0.9"/>`,
    )
  }

  const bands = []
  for (const [name, plan, text] of [
    ['outer', SEAL.outer, job.outer],
    ['inner', SEAL.inner, job.inner],
  ]) {
    const em = emFor('monoMid', plan.cap)
    const set = ring('monoMid', text, {
      size: em,
      radius: R * plan.r,
      tracking: SEAL.tracking,
      cx: mid,
      cy: mid,
      // Centred on twelve, so the band's gap falls at the bottom and no word
      // on it runs through six o'clock upside down. See `ring` above.
      anchor: 'centre',
      start: 0,
      // Struck into the metal, so the lettering is the DARKEST thing on the
      // seal rather than the lightest. An engraver cuts; it does not paint.
      fill: dim(INK.mid, 0.74),
    })

    if (set.sweep > Math.PI * 2) {
      console.error(`
  The seal's ${name} band runs ${r1((set.sweep / Math.PI) * 180)} degrees and overlaps itself.
`)
      process.exit(1)
    }
    parts.push(set.svg)
    bands.push({ name, plan, set })
  }

  // No band may run through six o'clock. A word that crosses the bottom of a
  // ring comes out upside down, which is a legibility failure the cap-height
  // measurement cannot see — it measures how TALL a letter is, not whether a
  // reader can tell which way up it is.
  for (const b of bands) {
    const half = b.set.sweep / 2
    if (half > Math.PI * 0.94) {
      console.error(`\n  The seal's ${b.name} band reaches six o'clock and inverts there.`)
      console.error('  Shorten it, or open the band radius so the same string sweeps less.\n')
      process.exit(1)
    }
  }

  // The bands must not touch each other or a rule. Checked rather than
  // eyeballed, because the failure is invisible until a phone renders it.
  const spans = bands.map((b) => ({ name: b.name, lo: b.set.near, hi: b.set.far }))
  for (let i = 0; i < spans.length; i += 1) {
    for (let j = i + 1; j < spans.length; j += 1) {
      if (spans[i].lo < spans[j].hi && spans[j].lo < spans[i].hi) {
        console.error(`
  The seal's ${spans[i].name} and ${spans[j].name} bands overlap radially.
`)
        process.exit(1)
      }
    }
    for (const t of SEAL.rules) {
      const at = R * t
      if (at > spans[i].lo && at < spans[i].hi) {
        console.error(`
  A hairline at ${r1(t)}R runs through the seal's ${spans[i].name} band.
`)
        process.exit(1)
      }
    }
  }

  // The field: the house device, struck small and centred, cut into the metal.
  const fieldR = R * SEAL.rules[SEAL.rules.length - 1]
  const scale = (fieldR * 2 * SEAL.field) / DEVICE_BOX
  parts.push(
    `<g transform="translate(${r1(mid - (DEVICE_BOX * scale) / 2)} ${r1(mid - (DEVICE_BOX * scale) / 2)}) scale(${r1(scale)})" ` +
      `fill="${dim(INK.mid, 0.68)}" fill-rule="nonzero">` +
      `<path d="${outline()}${counter()}"/></g>`,
  )

  return {
    svg: parts.join(''),
    defs:
      `<radialGradient id="metal" cx="0.36" cy="0.28" r="0.85">` +
      `<stop offset="0" stop-color="${mix(INK.mid, INK.warm, 0.2)}"/>` +
      `<stop offset="0.55" stop-color="${dim(INK.mid, 0.3)}"/>` +
      `<stop offset="1" stop-color="${dim(INK.mid, 0.68)}"/></radialGradient>`,
    bands,
    radius: R,
  }
}

/* ==========================================================================
   The medallion face
   --------------------------------------------------------------------------
   Greyscale, because GL scene 2 uses ONE image as both the colour map and the
   bump map. Mid grey is the resting surface: darker sinks, lighter stands
   proud. A coloured map would tint the metal, and on a metal `color` is a
   filter — see the phase 3 note in CLAUDE.md.
   ========================================================================== */

const DIAL = {
  band: { inner: 0.62, outer: 0.88 },
  /**
   * Letter height and ring tracking, solved together against the band.
   *
   * 39 characters have to close one revolution without meeting themselves, and
   * the generator refuses rather than overlapping if they do not — an overlap
   * would put two letters on top of each other somewhere on the band, and
   * where that lands depends on the string, which is the one thing that must
   * not change the artwork.
   */
  cap: 55,
  tracking: 0.085,
  grey: { ground: 150, cut: 58, proud: 214 },
}

function dialArt(job, size) {
  const R = size / 2
  const mid = size / 2
  const g = (v) => rgb([v, v, v])

  const parts = [`<rect width="${size}" height="${size}" fill="${g(DIAL.grey.ground)}"/>`]

  // The field: a low botanical relief under fine contour lines. It reads as
  // engraving from a metre away and as nothing in particular from closer,
  // which is what a coin field does.
  const inner = R * DIAL.band.inner
  for (let i = 0; i < 30; i += 1) {
    const t = i / 30
    parts.push(
      `<circle cx="${mid}" cy="${mid}" r="${r1(inner * 0.94 * (1 - t))}" fill="none" ` +
        `stroke="${g(DIAL.grey.ground + (i % 2 ? 12 : -12))}" stroke-width="2.2" opacity="0.5"/>`,
    )
  }

  // The house device, in relief, centred on the field.
  const scale = (inner * 0.96) / DEVICE_BOX
  parts.push(
    `<g transform="translate(${r1(mid - (DEVICE_BOX * scale) / 2)} ${r1(mid - (DEVICE_BOX * scale) / 2)}) scale(${r1(scale)})" ` +
      `fill-rule="nonzero">` +
      // Struck slightly proud of the field, with a cut edge under it. On a
      // greyscale bump map that pair is what makes the relief catch a light
      // rather than sit on the surface as a decal.
      `<path d="${outline()}${counter()}" fill="${g(DIAL.grey.cut + 30)}" transform="translate(6 8)"/>` +
      `<path d="${outline()}${counter()}" fill="${g(DIAL.grey.proud)}"/></g>`,
  )

  // The band, and the two hairlines that bound it.
  parts.push(
    `<circle cx="${mid}" cy="${mid}" r="${r1((R * (DIAL.band.inner + DIAL.band.outer)) / 2)}" fill="none" ` +
      `stroke="${g(DIAL.grey.ground + 10)}" stroke-width="${r1(R * (DIAL.band.outer - DIAL.band.inner))}"/>`,
  )
  for (const t of [DIAL.band.inner, DIAL.band.outer]) {
    parts.push(
      `<circle cx="${mid}" cy="${mid}" r="${r1(R * t)}" fill="none" stroke="${g(DIAL.grey.cut)}" stroke-width="3"/>`,
    )
  }

  /**
   * The ring band, laid clockwise from twelve o'clock in ONE call.
   *
   * One call is what puts `O.C.R.` at roughly four o'clock — comfortably
   * readable on a clockwise band, never inverted at six — without anybody
   * placing it there. Three separately positioned segments would let the one
   * that carries something end up at its own letter height.
   */
  const em = emFor('monoMid', DIAL.cap)
  const plan = {
    size: em,
    radius: R * ((DIAL.band.inner + DIAL.band.outer) / 2) - DIAL.cap * 0.5,
    tracking: DIAL.tracking,
    cx: mid,
    cy: mid,
    invert: false,
  }

  // This is what puts `O.C.R.` at roughly four o'clock without anyone placing
  // it there: it is the eleventh character of thirty-nine on a band that
  // starts at twelve and runs clockwise, and that is simply where the eleventh
  // character lands. A hand-positioned segment is a segment that can be
  // hand-positioned differently from its two siblings.
  const laid = ring('monoMid', job.ring, {
    ...plan,
    anchor: 'start',
    start: ((job.ringStartDeg ?? -90) + 90) * (Math.PI / 180),
    fill: g(DIAL.grey.cut),
  })

  if (laid.sweep > Math.PI * 2) {
    console.error(`\n  The medallion ring runs ${r1((laid.sweep / Math.PI) * 180)} degrees and overlaps itself.\n`)
    console.error('  Reduce DIAL.cap or DIAL.tracking in scripts/plates.mjs.\n')
    process.exit(1)
  }

  parts.push(laid.svg)

  // The beaded edge, and the rim standing proud of everything.
  for (let i = 0; i < 120; i += 1) {
    const a = (i / 120) * Math.PI * 2
    const rr = R * 0.935
    parts.push(
      `<circle cx="${r1(mid + Math.cos(a) * rr)}" cy="${r1(mid + Math.sin(a) * rr)}" r="${r1(R * 0.014)}" fill="${g(DIAL.grey.proud)}"/>`,
    )
  }
  parts.push(
    `<circle cx="${mid}" cy="${mid}" r="${r1(R * 0.975)}" fill="none" stroke="${g(DIAL.grey.proud)}" stroke-width="${r1(R * 0.05)}"/>`,
  )

  return { svg: parts.join(''), laid, radius: R }
}

/* ==========================================================================
   The specimen plate
   --------------------------------------------------------------------------
   A Victorian specimen engraving with a six-row key. The key rows are ONE
   function called six times.

   THE KEY IS HALF THE PLATE'S WIDTH, AND THAT IS ARITHMETIC RATHER THAN
   TASTE. A 25-character label needs a cap of 0.02 x the plate's width to
   clear 7px when the plate renders at 343px, and 25 mono characters at that
   cap are 43% of the plate. Rule 4 sets the size of the key; nothing else
   was free to.
   ========================================================================== */

const PLATE = { rowCap: 27, indexCap: 22, rule: 1.6 }

function specimen(job, w, h) {
  const rand = rng(seedOf(job.stem))
  const parts = [`<rect width="${w}" height="${h}" fill="url(#plate)"/>`]

  // The plate's own border: a double rule, which is what a printed plate has.
  const m = w * 0.05
  parts.push(
    `<rect x="${r1(m)}" y="${r1(m)}" width="${r1(w - m * 2)}" height="${r1(h - m * 2)}" fill="none" stroke="${INK.rule}" stroke-width="3"/>`,
    `<rect x="${r1(m + 9)}" y="${r1(m + 9)}" width="${r1(w - m * 2 - 18)}" height="${r1(h - m * 2 - 18)}" fill="none" stroke="${INK.rule}" stroke-width="1.4"/>`,
  )

  const artBottom = h * 0.6
  parts.push(drawSpecimen(rand, w, m, artBottom))

  // The key. Six rows, one function, six calls.
  const keyTop = artBottom + h * 0.035
  const rowH = (h - m * 1.4 - keyTop) / job.labels.length
  const rowEm = emFor('mono', PLATE.rowCap)
  const idxEm = emFor('mono', PLATE.indexCap)
  const rows = []

  job.labels.forEach((text, i) => {
    const y = keyTop + rowH * (i + 0.72)
    const numeral = String(i + 1).padStart(2, '0')

    parts.push(
      type('mono', numeral, { size: idxEm, x: m + 22, y: r1(y), fill: INK.mid }).svg,
    )

    const label = type('mono', text, {
      size: rowEm,
      x: w - m - 22,
      y: r1(y),
      align: 'right',
      fill: mix(INK.cream, INK.mid, 0.22),
    })
    parts.push(label.svg)

    // The leader: a hairline from the numeral to the label, which is what
    // makes six rows read as a key rather than as a list.
    const from = m + 22 + widthOf('mono', numeral, idxEm) + 18
    const to = label.box.x0 - 18
    parts.push(
      `<path d="M${r1(from)} ${r1(y - PLATE.rowCap * 0.32)}L${r1(to)} ${r1(y - PLATE.rowCap * 0.32)}" ` +
        `stroke="${INK.rule}" stroke-width="${PLATE.rule}" stroke-dasharray="3 6"/>`,
    )

    rows.push({ index: i, box: label.box, cap: label.cap })
  })

  return {
    svg: parts.join(''),
    defs:
      `<linearGradient id="plate" x1="0" y1="0" x2="0.2" y2="1">` +
      `<stop offset="0" stop-color="${mix(INK.paper, INK.panel, 0.25)}"/>` +
      `<stop offset="1" stop-color="${INK.panel}"/></linearGradient>`,
    rows,
  }
}

/**
 * The crocus itself, engraved.
 *
 * LINE WORK ONLY, HATCHED — no filled mass above the corm. A solid silhouette
 * here would be the most luminous object on the plate, the plate would become
 * the most luminous object in section 7, and 04-clue-architecture.md §4.2
 * forbids exactly that on a surface carrying a term. An engraving is the right
 * idiom AND the right luminance, which is the reason the plate is one.
 *
 * The six index marks are placed on ANCHORS — real features of the drawing —
 * and each carries a short leader tick to the feature it names. Six numerals
 * floating in the white would read as decoration, and a key whose numbers
 * point at nothing is a key nobody reads down to.
 */
function drawSpecimen(rand, w, top, bottom) {
  const cx = w / 2
  const span = bottom - top
  const ink = mix(INK.cream, INK.mid, 0.52)
  const parts = []
  const anchors = []

  const stroke = (d, width = 2, opacity = 0.85) =>
    `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width}" opacity="${opacity}"/>`

  const cormY = top + span * 0.82
  const cormR = span * 0.095
  const neckY = cormY - cormR * 0.9
  const flowerY = top + span * 0.2

  /* -- the corm: a squat bulb under contour hatching --------------------- */

  parts.push(
    stroke(
      `M${r1(cx - cormR)} ${r1(cormY)}` +
        `C${r1(cx - cormR)} ${r1(cormY - cormR * 1.15)} ${r1(cx - cormR * 0.55)} ${r1(neckY)} ${r1(cx)} ${r1(neckY)}` +
        `C${r1(cx + cormR * 0.55)} ${r1(neckY)} ${r1(cx + cormR)} ${r1(cormY - cormR * 1.15)} ${r1(cx + cormR)} ${r1(cormY)}` +
        `C${r1(cx + cormR)} ${r1(cormY + cormR * 0.95)} ${r1(cx + cormR * 0.4)} ${r1(cormY + cormR * 1.1)} ${r1(cx)} ${r1(cormY + cormR * 1.1)}` +
        `C${r1(cx - cormR * 0.4)} ${r1(cormY + cormR * 1.1)} ${r1(cx - cormR)} ${r1(cormY + cormR * 0.95)} ${r1(cx - cormR)} ${r1(cormY)}Z`,
      2.4,
    ),
  )
  for (let i = 1; i < 8; i += 1) {
    const t = i / 8
    const wide = cormR * Math.sin(t * Math.PI) * 0.94
    const y = neckY + (cormY + cormR * 1.1 - neckY) * t
    parts.push(stroke(`M${r1(cx - wide)} ${r1(y)}Q${r1(cx)} ${r1(y + cormR * 0.16)} ${r1(cx + wide)} ${r1(y)}`, 1.1, 0.45))
  }
  anchors.push({ x: cx - cormR * 1.5, y: cormY, to: { x: cx - cormR * 0.72, y: cormY } })

  // The tunic — the papery skin a lifted corm still wears.
  parts.push(
    stroke(`M${r1(cx - cormR * 1.14)} ${r1(cormY - cormR * 0.2)}Q${r1(cx)} ${r1(cormY + cormR * 1.5)} ${r1(cx + cormR * 1.14)} ${r1(cormY - cormR * 0.2)}`, 1.3, 0.5),
  )
  anchors.push({ x: cx + cormR * 1.9, y: cormY + cormR * 0.9, to: { x: cx + cormR * 0.9, y: cormY + cormR * 0.7 } })

  // Roots, from the base plate.
  for (let i = -3; i <= 3; i += 1) {
    if (!i) continue
    parts.push(
      stroke(
        `M${r1(cx + i * cormR * 0.2)} ${r1(cormY + cormR * 1.0)}` +
          `Q${r1(cx + i * cormR * 0.55)} ${r1(cormY + cormR * 1.7)} ${r1(cx + i * cormR * 0.78 + between(rand, -6, 6))} ${r1(cormY + cormR * 2.3)}`,
        1.2,
        0.55,
      ),
    )
  }
  anchors.push({ x: cx - cormR * 1.7, y: cormY + cormR * 2.2, to: { x: cx - cormR * 0.6, y: cormY + cormR * 1.9 } })

  /* -- leaves: narrow blades, sheathed at the neck ------------------------ */

  const leaves = [-0.34, -0.15, 0.15, 0.34]
  leaves.forEach((lean, i) => {
    const tipX = cx + lean * w * 0.34
    const tipY = neckY - span * (0.3 + (i % 2) * 0.08)
    const wide = span * 0.012
    parts.push(
      stroke(
        `M${r1(cx + lean * 12)} ${r1(neckY)}` +
          `Q${r1(cx + lean * w * 0.3 - wide)} ${r1((neckY + tipY) / 2)} ${r1(tipX)} ${r1(tipY)}` +
          `Q${r1(cx + lean * w * 0.22 + wide)} ${r1((neckY + tipY) / 2)} ${r1(cx + lean * 12)} ${r1(neckY)}Z`,
        1.6,
        0.8,
      ),
    )
    // The pale midrib every crocus leaf carries.
    parts.push(stroke(`M${r1(cx + lean * 12)} ${r1(neckY)}Q${r1(cx + lean * w * 0.26)} ${r1((neckY + tipY) / 2)} ${r1(tipX)} ${r1(tipY)}`, 0.9, 0.4))
  })
  anchors.push({ x: cx + w * 0.26, y: neckY - span * 0.26, to: { x: cx + w * 0.19, y: neckY - span * 0.2 } })

  /* -- the stem and the perianth tube ------------------------------------- */

  const tubeTop = flowerY + span * 0.07
  parts.push(stroke(`M${r1(cx - 6)} ${r1(neckY)}L${r1(cx - 5)} ${r1(tubeTop)}L${r1(cx + 5)} ${r1(tubeTop)}L${r1(cx + 6)} ${r1(neckY)}`, 1.8, 0.8))

  /* -- the flower: six tepals in a cup, drawn by one loop ----------------- */

  for (let i = 0; i < 6; i += 1) {
    // Three back, three front, opening upward and outward — a goblet, not a fan.
    const back = i < 3
    const a = -Math.PI / 2 + ((i % 3) - 1) * (back ? 0.62 : 0.38)
    const len = span * (back ? 0.15 : 0.13)
    const tipX = cx + Math.cos(a) * len
    const tipY = tubeTop + Math.sin(a) * len
    const wide = span * (back ? 0.03 : 0.026)

    parts.push(
      stroke(
        `M${r1(cx)} ${r1(tubeTop)}` +
          `C${r1(cx + Math.cos(a) * len * 0.35 - wide)} ${r1(tubeTop + Math.sin(a) * len * 0.5)} ` +
          `${r1(tipX - wide * 0.7)} ${r1(tipY + span * 0.02)} ${r1(tipX)} ${r1(tipY)}` +
          `C${r1(tipX + wide * 0.7)} ${r1(tipY + span * 0.02)} ` +
          `${r1(cx + Math.cos(a) * len * 0.35 + wide)} ${r1(tubeTop + Math.sin(a) * len * 0.5)} ${r1(cx)} ${r1(tubeTop)}Z`,
        1.6,
        back ? 0.6 : 0.88,
      ),
    )
  }
  anchors.push({ x: cx - w * 0.2, y: tubeTop - span * 0.06, to: { x: cx - w * 0.09, y: tubeTop - span * 0.06 } })

  /* -- three stigmas, rising out of the cup ------------------------------- */

  for (const lean of [-0.28, 0, 0.28]) {
    parts.push(
      `<path d="M${r1(cx)} ${r1(tubeTop - span * 0.01)}` +
        `Q${r1(cx + lean * span * 0.16)} ${r1(tubeTop - span * 0.1)} ${r1(cx + lean * span * 0.3)} ${r1(tubeTop - span * 0.17)}" ` +
        `fill="none" stroke="${mix(INK.warm, INK.mid, 0.3)}" stroke-width="4" stroke-linecap="round" opacity="0.95"/>`,
    )
  }
  anchors.push({ x: cx + w * 0.16, y: tubeTop - span * 0.2, to: { x: cx + span * 0.09, y: tubeTop - span * 0.16 } })

  /* -- the six index marks ------------------------------------------------ */

  const idxEm = emFor('mono', PLATE.indexCap * 0.9)
  const ringR = PLATE.indexCap * 0.86

  anchors.forEach((spot, i) => {
    const dx = spot.to.x - spot.x
    const dy = spot.to.y - spot.y
    const d = Math.hypot(dx, dy) || 1
    parts.push(
      // The tick runs from the edge of the numeral's ring to the feature, so
      // it reads as pointing rather than as a stray rule.
      `<path d="M${r1(spot.x + (dx / d) * ringR)} ${r1(spot.y + (dy / d) * ringR)}L${r1(spot.to.x)} ${r1(spot.to.y)}" ` +
        `stroke="${INK.rule}" stroke-width="1.4"/>`,
      `<circle cx="${r1(spot.x)}" cy="${r1(spot.y)}" r="${r1(ringR)}" fill="none" stroke="${INK.rule}" stroke-width="1.4"/>`,
      type('mono', String(i + 1).padStart(2, '0'), {
        size: idxEm,
        x: r1(spot.x),
        y: r1(spot.y + PLATE.indexCap * 0.45),
        align: 'centre',
        fill: mix(INK.cream, INK.mid, 0.5),
        opacity: 0.85,
      }).svg,
    )
  })

  return parts.join('')
}

/* ==========================================================================
   The office wall, and the bonded floor
   ========================================================================== */

/**
 * The board's grid.
 *
 * The card width is not a taste decision. A 22-character title has to clear
 * 7px of cap on a 375px viewport, which fixes the cap height relative to the
 * frame, which fixes how many characters fit on a line, which fixes the card.
 * Rule 4 sized this; nothing else was free to.
 */
const BOARD = { cols: 2, rows: 2, card: { w: 560, h: 340 }, gap: 54 }

async function wall(job, w, h) {
  const rand = rng(seedOf(job.stem))

  // The room: a wall with a lamp falling across it and a desk edge below.
  // The room. A photograph of an OFFICE that happens to contain a board, not a
  // photograph of a board — so the wall carries a lamp falling across it, a
  // dado rail, a desk, and two things standing on the desk. Without the room
  // the four cards read as a diagram, and a diagram on a careers page is the
  // one picture on the site that looks made rather than taken.
  const deskY = h * 0.78
  const props = []
  for (const [px, pw, ph] of [
    [w * 0.08, w * 0.05, h * 0.11],
    [w * 0.145, w * 0.032, h * 0.07],
    [w * 0.86, w * 0.09, h * 0.05],
  ]) {
    props.push(
      `<rect x="${r1(px)}" y="${r1(deskY - ph)}" width="${r1(pw)}" height="${r1(ph)}" ` +
        `fill="${dim(INK.paper, 0.45)}"/>`,
    )
  }

  const base = await sharp(
    doc(
      w,
      h,
      `<rect width="${w}" height="${h}" fill="url(#room)"/>` +
        // The lamp's throw across the wall.
        `<path d="M0 0L${r1(w * 0.52)} 0L${r1(w * 0.2)} ${r1(deskY)}L0 ${r1(deskY)}Z" fill="${mix(INK.mid, INK.warm, 0.25)}" opacity="0.12"/>` +
        // Dado rail, then the desk below it.
        `<rect x="0" y="${r1(deskY - 6)}" width="${w}" height="4" fill="${INK.rule}"/>` +
        props.join('') +
        `<rect x="0" y="${r1(deskY)}" width="${w}" height="${r1(h - deskY)}" fill="url(#desk)"/>` +
        `<rect x="0" y="${r1(deskY)}" width="${w}" height="3" fill="${mix(INK.mid, INK.warm, 0.3)}" opacity="0.45"/>`,
      `<radialGradient id="room" cx="0.22" cy="0.12" r="1">` +
        `<stop offset="0" stop-color="${mix(INK.paper, INK.warm, 0.24)}"/>` +
        `<stop offset="0.5" stop-color="${INK.paper}"/>` +
        `<stop offset="1" stop-color="${dim(INK.panel, 0.45)}"/></radialGradient>` +
        `<linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="${mix(INK.panel, INK.mid, 0.22)}"/>` +
        `<stop offset="1" stop-color="${INK.ground}"/></linearGradient>`,
    ),
  )
    .blur(Math.max(1, w * 0.0016))
    .toBuffer()

  // The four cards. One function, four calls, one grid, one rake.
  const gridW = BOARD.cols * BOARD.card.w + (BOARD.cols - 1) * BOARD.gap
  const gridH = BOARD.rows * BOARD.card.h + (BOARD.rows - 1) * BOARD.gap
  const x0 = (w - gridW) / 2
  // High on the wall, so the desk and what stands on it are in the picture.
  const y0 = h * 0.06

  const marks = []
  const layers = []

  job.cards.forEach((card, i) => {
    const col = i % BOARD.cols
    const row = Math.floor(i / BOARD.cols)
    const x = x0 + col * (BOARD.card.w + BOARD.gap)
    const y = y0 + row * (BOARD.card.h + BOARD.gap)
    // The rake comes from the index, not from the random stream, so every card
    // gets a lean from the same rule and none of them is the straight one.
    const tilt = ((i % 2 ? 1 : -1) * (1.1 + (i % 3) * 0.35)).toFixed(2)

    const art = notice(card, BOARD.card.w, BOARD.card.h)
    layers.push(
      `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${tilt} ${BOARD.card.w / 2} ${BOARD.card.h / 2})">` +
        `<rect x="6" y="8" width="${BOARD.card.w}" height="${BOARD.card.h}" rx="3" fill="${INK.ground}" opacity="0.4"/>` +
        art.svg +
        '</g>',
    )

    marks.push({
      index: i,
      box: { x: x + art.titleBox.x, y: y + art.titleBox.y, w: art.titleBox.w, h: art.titleBox.h },
      cap: art.titleCap,
    })
  })

  const front = doc(
    w,
    h,
    layers.join(''),
    // Manila, not white. Four lit rectangles on a dim wall would make the
    // board the brightest object on the route, and one of them carries a term.
    `<linearGradient id="stock" x1="0" y1="0" x2="0.4" y2="1">` +
      `<stop offset="0" stop-color="${mix(INK.cream, INK.mid, 0.3)}"/>` +
      `<stop offset="1" stop-color="${mix(INK.cream, INK.mid, 0.54)}"/></linearGradient>` +
      `<linearGradient id="fall" x1="0.1" y1="0" x2="0.9" y2="1">` +
      `<stop offset="0" stop-color="${INK.ground}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${INK.ground}" stop-opacity="0.38"/></linearGradient>`,
  )

  const image = await sharp(base)
    .composite([{ input: front }, vignette(w, h, 0.5, 0.3, 0.3), grain(w, h, seedOf(job.stem), 13)])
    .toBuffer()

  return { image, marks }
}

/** A bonded floor with a stencilled crate. The stencil is a decoy, not a term. */
async function bondedFloor(job, w, h) {
  const rand = rng(seedOf(job.stem))
  const crate = { w: w * 0.52, h: h * 0.46 }
  const cx = (w - crate.w) / 2
  const cy = h * 0.42

  const markCap = 34
  const secondCap = 22
  const markEm = emFor('monoMid', markCap)
  const secondEm = emFor('mono', secondCap)

  // The crate's planking, its corner battens and its lit top edge. A flat
  // rectangle with a stencil on it is a sign; a crate needs the edges that say
  // which way the light is coming from.
  const boards = []
  for (let i = 1; i < 5; i += 1) {
    const y = cy + (crate.h / 5) * i
    boards.push(
      `<rect x="${r1(cx)}" y="${r1(y)}" width="${r1(crate.w)}" height="2.4" fill="${INK.ground}" opacity="0.45"/>`,
      `<rect x="${r1(cx)}" y="${r1(y + 2.4)}" width="${r1(crate.w)}" height="1.6" fill="${mix(INK.mid, INK.warm, 0.3)}" opacity="0.22"/>`,
    )
  }
  for (const bx of [cx + 10, cx + crate.w - 34]) {
    boards.push(
      `<rect x="${r1(bx)}" y="${r1(cy + 8)}" width="24" height="${r1(crate.h - 16)}" fill="${mix(INK.paper, INK.mid, 0.42)}" opacity="0.75"/>`,
    )
  }
  boards.push(
    // Top edge, catching the light; foot, in its own shadow.
    `<rect x="${r1(cx)}" y="${r1(cy)}" width="${r1(crate.w)}" height="5" fill="${mix(INK.mid, INK.warm, 0.45)}" opacity="0.6"/>`,
    `<rect x="${r1(cx)}" y="${r1(cy + crate.h - 4)}" width="${r1(crate.w)}" height="4" fill="${INK.ground}" opacity="0.6"/>`,
    // The shadow it casts on the bonded floor.
    `<ellipse cx="${r1(cx + crate.w / 2)}" cy="${r1(cy + crate.h + 12)}" rx="${r1(crate.w * 0.56)}" ry="${r1(h * 0.05)}" fill="${INK.ground}" opacity="0.55"/>`,
  )

  const base = await sharp(
    doc(
      w,
      h,
      `<rect width="${w}" height="${h}" fill="url(#floor2)"/>` +
        `<rect x="0" y="${r1(h * 0.62)}" width="${w}" height="${r1(h * 0.38)}" fill="${dim(INK.panel, 0.4)}"/>`,
      `<radialGradient id="floor2" cx="0.5" cy="0.24" r="0.9">` +
        `<stop offset="0" stop-color="${mix(INK.paper, INK.warm, 0.16)}"/>` +
        `<stop offset="1" stop-color="${INK.ground}"/></radialGradient>`,
    ),
  )
    .blur(Math.max(1, w * 0.003))
    .toBuffer()

  const front = doc(
    w,
    h,
    `<rect x="${r1(cx)}" y="${r1(cy)}" width="${r1(crate.w)}" height="${r1(crate.h)}" fill="url(#wood)"/>` +
      boards.join('') +
      type('monoMid', job.mark, {
        size: markEm,
        x: cx + crate.w / 2,
        y: cy + crate.h * 0.44,
        align: 'centre',
        fill: mix(INK.cream, INK.paper, 0.4),
        opacity: 0.82,
      }).svg +
      type('mono', job.second, {
        size: secondEm,
        x: cx + crate.w / 2,
        y: cy + crate.h * 0.66,
        align: 'centre',
        fill: mix(INK.cream, INK.paper, 0.5),
        opacity: 0.62,
      }).svg,
    `<linearGradient id="wood" x1="0" y1="0" x2="0.2" y2="1">` +
      `<stop offset="0" stop-color="${mix(INK.paper, INK.mid, 0.55)}"/>` +
      `<stop offset="1" stop-color="${mix(INK.paper, INK.ground, 0.3)}"/></linearGradient>`,
  )

  return sharp(base)
    .composite([{ input: front }, vignette(w, h, 0.55, 0.5, 0.34), grain(w, h, seedOf(job.stem), 12)])
    .toBuffer()
}

/* ==========================================================================
   Emitting
   ========================================================================== */

const manifest = []
const measured = []
const proofs = []
let short = false

/**
 * Writes one plate at every width it ships at, and records it.
 *
 * The largest width is the intrinsic size app/content/plates.ts reports, so a
 * `width`/`height` attribute can never drift from the file on disk. That is
 * the whole reason the manifest is generated rather than typed.
 */
async function emit(stem, image, widths, { quality = 68, kind = 'webp' } = {}) {
  const meta = await sharp(image).metadata()
  const sizes = []

  for (const width of widths) {
    const name = `${stem}-${width}.${kind}`
    const height = Math.round((meta.height / meta.width) * width)
    const pipe = sharp(image).resize(width, height, { fit: 'fill' })
    const data =
      kind === 'webp'
        ? await pipe.webp({ quality, effort: 6 }).toBuffer()
        : await pipe.png({ compressionLevel: 9 }).toBuffer()
    writeFileSync(join(OUT, name), data)
    sizes.push({ width, height, bytes: data.length, name })
  }

  manifest.push({
    stem,
    w: sizes[0].width,
    h: sizes[0].height,
    kind,
    sizes: sizes.sort((a, b) => a.width - b.width),
  })
  return sizes
}

/**
 * Records a term's cap height at 375px, and its proof crop.
 *
 * `box` is in the artwork's own pixels; `render` is how wide the artwork is on
 * a 375px viewport. Everything else is arithmetic — see lib/reach.mjs for why
 * a design pixel and a CSS pixel are the same thing at that width.
 */
function reached(id, { cap, box, art, render, stem, note }) {
  const scale = render / art
  const cap375 = cap * scale
  const { ok, line: text } = grade(cap375)
  if (!ok) short = true

  measured.push({
    id,
    cap375: Number(cap375.toFixed(1)),
    from: 'scripts/plates.mjs',
    surface: `${stem} — ${note}`,
    renderPx: render,
    /** The render width at which the cap first clears the floor. Phase 6 reads this. */
    floorAtPx: Math.ceil((FLOOR * art) / cap),
  })

  proofs.push({ id, stem, box, scale })
  return { ok, text, cap375, floorAt: Math.ceil((FLOOR * art) / cap) }
}

/* ==========================================================================
   The run
   ========================================================================== */

if (!existsSync(JOBS)) {
  console.error(`\n  No job file at _private/plate-jobs.json.\n`)
  console.error('  Every string that ends up as pixels lives there and nowhere else. It is')
  console.error('  organiser-only and git-ignored, which is why it is not in the repository.\n')
  process.exit(1)
}

const job = JSON.parse(readFileSync(JOBS, 'utf8'))
mkdirSync(OUT, { recursive: true })

const wanted = (stem) => only.length === 0 || only.includes(stem)

/** A photograph dropped at _private/frames/<stem>.png wins over a drawn ground. */
async function baseFor(stem, w, h, draw) {
  const file = join(BASES, `${stem}.png`)
  if (!existsSync(file)) return draw()
  return sharp(file)
    .resize(w, h, { fit: 'cover' })
    .modulate({ brightness: 0.82, saturation: 0.9 })
    .composite([vignette(w, h, 0.5), grain(w, h, seedOf(stem), 12)])
    .toBuffer()
}

const notes = []

/* -- the medallion face, and its static frame ------------------------------ */

if (wanted(job.medallion.stem)) {
  const size = job.medallion.size
  const art = dialArt(job.medallion, size)
  const image = await sharp(doc(size, size, art.svg)).png().toBuffer()

  await emit(job.medallion.stem, image, [size], { quality: 88 })

  // The ring's cap, measured off the geometry that was actually laid.
  const seen = reached('rim', {
    cap: art.laid.cap,
    box: { x: 0, y: 0, w: size, h: size },
    art: size,
    render: job.medallion.renderPx,
    stem: job.medallion.stem,
    note: 'ring band, one call, one letter height',
  })
  notes.push([job.medallion.stem, `ring  ${seen.text}   floor met at >= ${seen.floorAt}px rendered`])

  // The static fallback frame. It must carry the band as legibly as the live
  // scene, so it is struck from the SAME texture rather than redrawn — a
  // second drawing is a second chance for the fallback to be the odd one out,
  // and the fallback is the state a reader on a low-end phone actually gets.
  const still = 900

  /**
   * TWO PIPELINES, NOT TWO `.composite()` CALLS.
   *
   * sharp's `composite` SETS the layer list rather than appending to it, so a
   * second call silently discards the first. The first pass here chained the
   * tint and the circular cut and shipped an untinted grey disc — a bug with
   * no error, no warning, and a plausible-looking output, which is the kind
   * this file's checks exist to make loud.
   */
  const tinted = await sharp(image)
    .resize(still, still)
    .composite([
      // The metal. The texture is greyscale — it is a colour AND a bump map
      // for GL scene 2 — so the frame supplies the tone that the environment
      // map supplies in the live scene, which is teardown section 9's ramp.
      {
        input: doc(
          still,
          still,
          `<rect width="${still}" height="${still}" fill="url(#sheen)"/>`,
          `<linearGradient id="sheen" x1="0.2" y1="0" x2="0.8" y2="1">` +
            `<stop offset="0" stop-color="${INK.gold}"/>` +
            `<stop offset="0.52" stop-color="${INK.warm}"/>` +
            `<stop offset="1" stop-color="${dim(INK.mid, 0.3)}"/></linearGradient>`,
        ),
        blend: 'multiply',
      },
    ])
    .png()
    .toBuffer()

  // Cut to the disc. The texture is a SQUARE sheet, and a stroked circle drawn
  // over the top of it leaves the corners of that sheet in the picture.
  const disc = await sharp(tinted)
    .ensureAlpha()
    .composite([
      {
        input: doc(still, still, `<circle cx="${still / 2}" cy="${still / 2}" r="${still / 2 - 2}" fill="#ffffff"/>`),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  const frame = await sharp({
    create: { width: still, height: still, channels: 4, background: INK.ground },
  })
    .composite([
      // The disc's own shadow, so it sits on the ground rather than on top of it.
      {
        input: doc(
          still,
          still,
          `<ellipse cx="${still / 2}" cy="${r1(still * 0.53)}" rx="${r1(still * 0.47)}" ry="${r1(still * 0.47)}" fill="${INK.ground}" opacity="0.7"/>`,
        ),
      },
      { input: disc },
      vignette(still, still, 0.45),
    ])
    .flatten({ background: INK.ground })
    .png()
    .toBuffer()

  await emit('still-02', frame, [750, 375])
}

/* -- the assay seal -------------------------------------------------------- */

if (wanted(job.seal.stem)) {
  const size = job.seal.size
  const art = sealArt(job.seal, size)
  const image = await sharp(
    doc(size, size, `<rect width="${size}" height="${size}" fill="${INK.ground}"/>` + art.svg, art.defs),
  )
    .composite([grain(size, size, seedOf(job.seal.stem), 11)])
    .png()
    .toBuffer()

  await emit(job.seal.stem, image, [size, size / 2], { quality: 78 })

  const inner = art.bands.find((b) => b.name === 'inner')
  const seen = reached('band', {
    cap: inner.set.cap,
    box: { x: 0, y: 0, w: size, h: size },
    art: size,
    render: job.seal.renderPx,
    stem: job.seal.stem,
    note: 'inner custody band, three past participles, one call',
  })
  notes.push([
    job.seal.stem,
    `inner ${seen.text}   floor met at >= ${seen.floorAt}px rendered ` +
      `(phase 2 floors the seal at ${job.seal.minRenderPx}px)`,
  ])
  if (seen.floorAt > job.seal.minRenderPx) {
    console.error(`\n  The seal's band needs ${seen.floorAt}px of render to clear the floor, but phase 2`)
    console.error(`  guarantees only ${job.seal.minRenderPx}px. Raise SEAL.inner.cap in scripts/plates.mjs.\n`)
    short = true
  }
}

/* -- the pinned scene: four frames, four documents ------------------------- */

{
  const F = { w: 1200, h: 1500 }
  const docW = Math.round(F.w * 0.7)

  for (const [i, stem] of job.season.frames.entries()) {
    if (!wanted(stem) && !wanted(job.season.documents[i].stem)) continue

    const paper = document(job.season.documents[i], docW)
    const bed = await baseFor(stem, F.w, F.h, () => macro(F.w, F.h, seedOf(stem)))

    // The document, photographed at a rake. Same rake rule for all four: the
    // index picks it, so no step's paper is the one lying square to the lens.
    const tilt = ((i % 2 ? 1 : -1) * (3.4 + (i % 3) * 1.6)).toFixed(2)
    const dx = (F.w - docW) / 2
    const dy = F.h * 0.52 - paper.height * 0.36

    const laid = doc(
      F.w,
      F.h,
      `<g transform="translate(${r1(dx)} ${r1(dy)}) rotate(${tilt} ${r1(docW / 2)} ${r1(paper.height / 2)})">` +
        `<rect x="10" y="16" width="${docW}" height="${r1(paper.height)}" fill="${INK.ground}" opacity="0.55"/>` +
        paper.svg +
        '</g>',
      paper.defs,
    )

    const image = await sharp(bed)
      .composite([{ input: laid }, vignette(F.w, F.h, 0.42, 0.5, 0.46)])
      .toBuffer()

    await emit(stem, image, [F.w, F.w / 2], { quality: 60 })

    // Only step 3's foot band carries a term, but every step is measured, so
    // the number in the key is the number this run produced.
    if (i === 2) {
      const seen = reached('footer-band', {
        cap: paper.footCap,
        box: {
          x: dx + paper.footBox.x,
          y: dy + paper.footBox.y,
          w: paper.footBox.w,
          h: paper.footBox.h,
        },
        art: F.w,
        render: job.season.renderPx,
        stem,
        note: 'document foot band, one composite function called four times',
      })
      notes.push([stem, `foot  ${seen.text}   floor met at >= ${seen.floorAt}px rendered`])
    }
  }
}

/* -- the specimen plate ---------------------------------------------------- */

if (wanted(job.plate.stem)) {
  const P = { w: 1100, h: 1500 }
  const art = specimen({ ...job.plate, stem: job.plate.stem }, P.w, P.h)
  const image = await sharp(doc(P.w, P.h, art.svg, art.defs))
    .composite([vignette(P.w, P.h, 0.34), grain(P.w, P.h, seedOf(job.plate.stem), 10)])
    .png()
    .toBuffer()

  await emit(job.plate.stem, image, [P.w, P.w / 2], { quality: 72 })

  const row = art.rows[2]
  const seen = reached('specimen', {
    cap: row.cap,
    box: { x: row.box.x0, y: row.box.y0, w: row.box.w, h: row.box.h },
    art: P.w,
    render: job.plate.renderPx,
    stem: job.plate.stem,
    note: 'key row, one function called six times',
  })
  notes.push([job.plate.stem, `key   ${seen.text}   floor met at >= ${seen.floorAt}px rendered`])
}

/* -- the noticeboard ------------------------------------------------------- */

if (wanted(job.board.stem)) {
  const B = { w: 1400, h: 1150 }
  const art = await wall({ ...job.board }, B.w, B.h)
  await emit(job.board.stem, art.image, [B.w, B.w / 2], { quality: 66 })

  const card = art.marks[1]
  const seen = reached('board', {
    cap: card.cap,
    box: card.box,
    art: B.w,
    render: job.board.renderPx,
    stem: job.board.stem,
    note: 'requisition card title, one function called four times',
  })
  notes.push([job.board.stem, `card  ${seen.text}   floor met at >= ${seen.floorAt}px rendered`])
}

/* -- the crate stencil, on a bonded floor ---------------------------------- */

if (wanted(job.stencil.stem)) {
  const S = { w: 1100, h: 740 }
  const image = await bondedFloor({ ...job.stencil }, S.w, S.h)
  await emit(job.stencil.stem, image, [S.w, S.w / 2], { quality: 64 })
}

/* -- the carousel interiors, the link tiles, the two other stills ---------- */

for (let i = 1; i <= 6; i += 1) {
  const stem = `room-0${i}`
  if (!wanted(stem)) continue
  const w = 760
  const h = 1010
  const image = await baseFor(stem, w, h, () => interior(w, h, seedOf(stem)))
  await emit(stem, image, [w, w / 2], { quality: 62 })
}

for (let i = 1; i <= 4; i += 1) {
  const stem = `tile-0${i}`
  if (!wanted(stem)) continue
  const size = 620
  const image = await baseFor(stem, size, size, () => tile(size, size, seedOf(stem)))
  await emit(stem, image, [size, size / 2], { quality: 62 })
}

if (wanted('still-01')) {
  // The hero backdrop's fallback: the same ember field GL scene 1 drifts.
  const w = 900
  const h = 1200
  const image = await macro(w, h, seedOf('still-01'))
  await emit('still-01', image, [w, w / 2], { quality: 58 })
}

if (wanted('still-03')) {
  // GL scene 3's fallback: the house mark, struck.
  const size = 900
  const scale = (size * 0.62) / DEVICE_BOX
  const image = await sharp(
    doc(
      size,
      size,
      `<rect width="${size}" height="${size}" fill="${INK.ground}"/>` +
        `<g transform="translate(${r1(size / 2 - (DEVICE_BOX * scale) / 2)} ${r1(size / 2 - (DEVICE_BOX * scale) / 2)}) scale(${r1(scale)})" fill-rule="nonzero">` +
        `<path d="${outline()}${counter()}" fill="url(#struck)"/></g>`,
      `<linearGradient id="struck" x1="0.1" y1="0" x2="0.9" y2="1">` +
        `<stop offset="0" stop-color="${INK.gold}"/>` +
        `<stop offset="0.55" stop-color="${INK.warm}"/>` +
        `<stop offset="1" stop-color="${INK.mid}"/></linearGradient>`,
    ),
  )
    .composite([vignette(size, size, 0.4), grain(size, size, seedOf('still-03'), 9)])
    .png()
    .toBuffer()
  await emit('still-03', image, [750, 375])
}

/* ==========================================================================
   The manifest
   ========================================================================== */

manifest.sort((a, b) => a.stem.localeCompare(b.stem))

function moduleText(all) {
  const rows = all
    .map(
      (p) =>
        `  '${p.stem}': {\n` +
        `    w: ${p.w},\n` +
        `    h: ${p.h},\n` +
        `    src: '/img/${p.sizes[p.sizes.length - 1].name}',\n` +
        `    srcset: '${p.sizes.map((s) => `/img/${s.name} ${s.width}w`).join(', ')}',\n` +
        `  },`,
    )
    .join('\n')

  return `/**
 * GENERATED — do not edit by hand.
 *
 *   node scripts/plates.mjs
 *
 * Every image the site ships, with the intrinsic size it actually has on disk
 * and the widths it was encoded at. <Plate/> reads dimensions from here, so a
 * width/height attribute can never drift from the file — which is what stops
 * artwork arriving from shifting the layout under a reader mid-scroll.
 *
 * \`w\` and \`h\` are the intrinsic pixels of the largest encoding. \`src\` is that
 * encoding; \`srcset\` offers the smaller one to a narrow viewport.
 *
 * Stems are NEUTRAL AND NON-DESCRIPTIVE, and that is a requirement rather than
 * a habit: a participant can read every filename in the network tab, and a
 * file that says what it contains is a solved section.
 */
export type Plate = {
  readonly w: number
  readonly h: number
  readonly src: string
  readonly srcset: string
}

export const plates = {
${rows}
} as const satisfies Record<string, Plate>

export type PlateKey = keyof typeof plates
`
}

/**
 * Only rewrite the manifest on a full run.
 *
 * `node scripts/plates.mjs plate-06` draws one stem, and a manifest written
 * from that run would drop every other image from the module.
 */
if (only.length === 0) {
  writeFileSync(MODULE, moduleText(manifest), 'utf8')

  /**
   * Sweep encodings this run did not produce.
   *
   * Changing a plate's dimensions changes the width in its filename, so the
   * old encoding stays on disk, stays committed, and stays in the repository's
   * weight — while the manifest no longer mentions it. Nobody notices, because
   * nothing is broken. The pattern matches this generator's own naming only
   * (`<stem>-<index>-<width>`), so scripts/mark.mjs's `icon-<size>` files are
   * not in scope and cannot be swept by it.
   */
  const OURS = /^[a-z]+-\d{2}-\d+\.(?:webp|png)$/
  const kept = new Set(manifest.flatMap((p) => p.sizes.map((s) => s.name)))
  for (const name of readdirSync(OUT)) {
    if (!OURS.test(name) || kept.has(name)) continue
    rmSync(join(OUT, name))
    notes.push(['swept', `${name} — no longer produced by this generator`])
  }
} else if (existsSync(MODULE)) {
  notes.push(['manifest', 'unchanged — partial run, app/content/plates.ts not rewritten'])
}

const where = record(root, measured)

/* ==========================================================================
   The proof crops
   --------------------------------------------------------------------------
   Organiser-only. Each one is the term's own region, resampled to the size it
   occupies on a 375px viewport and then blown up with nearest-neighbour — so
   what the sheet shows is the pixel grid a phone will actually rasterise, not
   a clean re-render at a comfortable size, which would prove nothing.
   ========================================================================== */

if (wantSheet || only.length === 0) {
  mkdirSync(PROOF, { recursive: true })
  for (const p of proofs) {
    const source = manifest.find((m) => m.stem === p.stem)
    if (!source) continue
    const file = join(OUT, source.sizes[source.sizes.length - 1].name)

    const pad = 34
    const box = {
      left: Math.max(0, Math.round(p.box.x - pad)),
      top: Math.max(0, Math.round(p.box.y - pad)),
      width: Math.round(p.box.w + pad * 2),
      height: Math.round(p.box.h + pad * 2),
    }
    box.width = Math.min(box.width, source.w - box.left)
    box.height = Math.min(box.height, source.h - box.top)
    if (box.width < 4 || box.height < 4) continue

    const atPhone = Math.max(8, Math.round(box.width * p.scale))
    const shot = await sharp(file)
      .extract(box)
      .resize(atPhone, null)
      .resize(atPhone * 4, null, { kernel: 'nearest' })
      .png()
      .toBuffer()
    writeFileSync(join(PROOF, `${p.id}.png`), shot)
  }
}

/* ==========================================================================
   Report
   ========================================================================== */

const total = manifest.flatMap((p) => p.sizes).reduce((sum, s) => sum + s.bytes, 0)

console.log('Raster artwork — CROCARIA\n')
for (const p of manifest) {
  const bytes = p.sizes.reduce((s, x) => s + x.bytes, 0)
  console.log(`  ${p.stem.padEnd(12)} ${String(p.w).padStart(5)} x ${String(p.h).padEnd(5)} ${p.sizes.map((s) => s.width).join('/')}  ${KB(bytes)}`)
}

console.log(`\n  ${manifest.length} plate(s), ${manifest.flatMap((p) => p.sizes).length} file(s), ${KB(total)} total`)
if (only.length === 0) console.log(`  app/content/plates.ts written`)
if (where) console.log(`  ${measured.length} measurement(s) → _private/reach.json`)
if (proofs.length) console.log(`  ${proofs.length} proof crop(s) → _private/proof/`)

if (notes.length) {
  console.log(`\n  cap height at ${VIEWPORT}px — rule 4, measured:`)
  for (const [stem, text] of notes) console.log(`    ${stem.padEnd(12)} ${text}`)
}

if (short) {
  console.error(`\n  A term lands under the ${FLOOR}px cap floor at ${VIEWPORT}px.`)
  console.error('  Do NOT fix this by making the term brighter — that is visible to everyone and')
  console.error('  it violates rule 3. Raise its cap height, or raise renderPx and hold phase 6')
  console.error('  to it. See 04-clue-architecture.md §2, "Reachability".\n')
  process.exit(1)
}

console.log('\nDeterministic — re-running produces an identical diff.\n')
