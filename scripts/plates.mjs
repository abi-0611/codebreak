#!/usr/bin/env node
/**
 * Offline imagery generator.
 *
 * Draws every photographic plate the site ships, encodes it to WebP at two
 * widths, and writes a manifest module so the components can never disagree
 * with what is actually on disk. Same shape as outline.mjs and inscribe.mjs:
 * runs on a workstation, output is committed, nothing generates in a browser.
 *
 * USAGE
 *
 *   node scripts/plates.mjs                 all of them
 *   node scripts/plates.mjs route-03        one stem, for iterating
 *
 * WHY DRAWN RATHER THAN PHOTOGRAPHED
 *
 * Three of these carry a term, and drawing them buys properties a stock photo
 * cannot give:
 *
 *   1. The five route cards cannot drift apart. They are one function called
 *      five times, so a single colour grade is structural rather than
 *      something a person has to remember. The whole camouflage for the plate
 *      depends on all five being identical but for the name struck into them.
 *   2. The clue text ends up as pixels. This is genuine technique A. The
 *      documented fallback — a CSS composition with live text over an image —
 *      would put all three terms back into the DOM where find-in-page takes
 *      them.
 *   3. Nothing is fetched, credited or attributable.
 *
 * SWAPPING IN PHOTOGRAPHY
 *
 * Drop a frame at _private/plates/<stem>.png and this generator grades it and
 * uses it as the base instead of drawing one, keeping the plate, ticket and
 * stamps it composites on top. The photography can be upgraded later without
 * touching any of the clue work.
 *
 * TYPE
 *
 * All lettering is set from the committed WOFFs through lib/glyphs.mjs, as
 * paths. Not because find-in-page could reach it — the output is a raster and
 * nothing here reaches the DOM — but because a rasteriser asked to draw <text>
 * has to find the face on the machine, and will quietly fall back to a system
 * font when it cannot. Setting from the WOFF makes the imagery render the same
 * everywhere.
 *
 * THE WORDS
 *
 * The strings struck into the three clue-bearing plates are NOT in this file.
 * They live in _private/plate-jobs.json, which is git-ignored, for the same
 * reason type-jobs.json does: the words must not enter the repository, only
 * what they produce. Recorded in _private/CLUE-KEY.md section 6.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { load, contours, toPath } from './lib/glyphs.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = resolve(ROOT, 'public/img')
const JOBS = resolve(ROOT, '_private/plate-jobs.json')
const BASES = resolve(ROOT, '_private/plates')
const MODULE = resolve(ROOT, 'src/content/plates.ts')

const FACES = {
  serif: '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff',
  text: '@fontsource/inter/files/inter-latin-400-normal.woff',
  strong: '@fontsource/inter/files/inter-latin-600-normal.woff',
}

/* --------------------------------------------------------------------------
   Palette
   --------------------------------------------------------------------------
   The scene grounds from styles/globals.css, plus the few tones that only
   exist inside a photograph — paper, timber, oxidised metal, stamp ink.

   --ember is deliberately absent. It is the one hot accent and it is spent
   exactly once in the whole site, which is what makes it read as art direction
   rather than decoration. The permit stamp wants red ink, so it gets oxblood:
   unmistakably a rubber stamp, and far enough from ember that the two could
   never be mistaken for the same gesture.
   -------------------------------------------------------------------------- */

const C = {
  ink: '#0B0F0E',
  bone: '#F4F1EA',
  moss: '#1F3A2E',
  lichen: '#8A9A5B',
  stone: '#575B57',
  haze: '#A8A29A',
  approach: '#E8EDE7',
  ascent: '#C9D6DD',
  ridge: '#0B0F0E',
  dusk: '#2A1A12',
  paper: '#EDE8DC',
  paperLit: '#F7F3E9',
  timber: '#6B5136',
  timberDark: '#3E2E1E',
  metal: '#B9BCB6',
  metalDark: '#7E837C',
  oxide: '#8A8F7E',
  stamp: '#7A2E22',
  graphite: '#3A3A38',
}

/* --------------------------------------------------------------------------
   Determinism
   -------------------------------------------------------------------------- */

/** mulberry32. Same seed, same picture, every run and every machine. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (n) => Math.round(n * 10) / 10
const between = (rand, lo, hi) => lo + rand() * (hi - lo)

/* --------------------------------------------------------------------------
   Type
   -------------------------------------------------------------------------- */

const faces = {}
for (const [key, file] of Object.entries(FACES)) {
  faces[key] = load(resolve(ROOT, 'node_modules', file))
}

/**
 * Sets a line as path data, baseline at y=0, starting at x=0.
 *
 * `squeeze` scales horizontally only. It is how a condensed transit face is
 * faked from Inter — crude typographically, invisible at the size a ticket
 * header renders inside a photograph, and it beats adding a whole font to the
 * dependency tree to draw fourteen characters.
 */
function setType(font, text, size, tracking = 0, squeeze = 1) {
  const scale = size / font.m.em
  const step = tracking * size
  const parts = []
  let pen = 0
  for (const ch of text) {
    const gid = font.map.get(ch.codePointAt(0)) ?? 0
    const at = pen
    const place = (p) => ({ x: (at + p.x * scale) * squeeze, y: -p.y * scale, on: p.on })
    const shapes = contours(font.t, font.loca, gid)
    if (shapes.length) parts.push(toPath(shapes, place))
    pen += font.adv[gid] * scale + step
  }
  return { d: parts.join(''), width: (pen - step) * squeeze }
}

const widthOf = (face, text, size, tracking = 0, squeeze = 1) =>
  setType(faces[face], text, size, tracking, squeeze).width

/** A positioned line of type, as an SVG group. */
function type(face, text, o) {
  const { size, tracking = 0, squeeze = 1, x = 0, y = 0, anchor = 'start' } = o
  const { d, width } = setType(faces[face], text, size, tracking, squeeze)
  if (!d) return ''
  const dx = anchor === 'middle' ? -width / 2 : anchor === 'end' ? -width : 0
  const attrs = [
    `fill="${o.fill ?? C.ink}"`,
    o.opacity != null ? `opacity="${o.opacity}"` : '',
    o.filter ? `filter="${o.filter}"` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const spin = o.rotate ? ` rotate(${r1(o.rotate)})` : ''
  return `<g transform="translate(${r1(x + dx)},${r1(y)})${spin}"><path d="${d}" ${attrs}/></g>`
}

/** Cap height of a face at a size. Used to place type by its cap, not its em. */
function capOf(face, size) {
  const font = faces[face]
  const gid = font.map.get(0x48) ?? 0
  const scale = size / font.m.em
  let top = 0
  for (const shape of contours(font.t, font.loca, gid)) {
    for (const p of shape) if (-p.y * scale < top) top = -p.y * scale
  }
  return -top
}

/* --------------------------------------------------------------------------
   Terrain
   -------------------------------------------------------------------------- */

/**
 * Midpoint displacement. Gives a silhouette that breaks at every scale the way
 * a real skyline does, instead of the even sawtooth a per-step random walk
 * produces.
 */
function ridgeline(rand, x0, y0, x1, y1, rough, depth = 7) {
  let pts = [
    [x0, y0],
    [x1, y1],
  ]
  let amp = rough
  for (let d = 0; d < depth; d += 1) {
    const next = [pts[0]]
    for (let i = 1; i < pts.length; i += 1) {
      const [ax, ay] = pts[i - 1]
      const [bx, by] = pts[i]
      next.push([(ax + bx) / 2, (ay + by) / 2 + (rand() - 0.5) * amp])
      next.push(pts[i])
    }
    pts = next
    amp *= 0.55
  }
  return pts
}

const shape = (pts, floor, left, right) =>
  `M${r1(left)} ${r1(floor)} ` +
  pts.map(([x, y]) => `L${r1(x)} ${r1(y)}`).join(' ') +
  ` L${r1(right)} ${r1(floor)} Z`

/**
 * A conifer silhouette: tiered branches over a short trunk.
 *
 * `rand` jitters every tier independently on each side. Without it the tiers
 * step out in a perfect arithmetic series and both flanks mirror exactly,
 * which is the difference between a tree and a Christmas-card triangle.
 */
function fir(cx, footY, h, w, tiers, rand) {
  const step = h / tiers
  const right = []
  const left = []
  const jitter = () => (rand ? between(rand, 0.84, 1.16) : 1)
  for (let i = 1; i <= tiers; i += 1) {
    const y = footY - h + step * i
    const out = (w / 2) * (i / tiers)
    const ro = out * jitter()
    const lo = out * jitter()
    const droop = rand ? between(rand, 0.44, 0.68) : 0.55
    right.push(`L${r1(cx + ro)} ${r1(y)}`, `L${r1(cx + ro * droop)} ${r1(y)}`)
    left.unshift(`L${r1(cx - lo * droop)} ${r1(y)}`, `L${r1(cx - lo)} ${r1(y)}`)
  }
  const trunk = w * 0.05
  return (
    `M${r1(cx)} ${r1(footY - h)} ` +
    right.join(' ') +
    ` L${r1(cx + trunk)} ${r1(footY)} L${r1(cx - trunk)} ${r1(footY)} ` +
    left.join(' ') +
    ' Z'
  )
}

/* --------------------------------------------------------------------------
   Shared SVG furniture
   -------------------------------------------------------------------------- */

/** Blur filters. One per radius used, declared once per document. */
const blurs = (radii) =>
  radii
    .map(
      (n) =>
        `<filter id="b${n}" x="-25%" y="-25%" width="150%" height="150%">` +
        `<feGaussianBlur stdDeviation="${n}"/></filter>`,
    )
    .join('')

/**
 * Vignette. Corners fall away, centre untouched.
 *
 * Every plate gets one, at the same strength, for the same reason the route
 * cards share a grade: consistency across a set is what stops any single frame
 * reading as special.
 */
function vignette(w, h, strength = 0.42) {
  return (
    `<defs><radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">` +
    `<stop offset="0.35" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="${strength}"/>` +
    `</radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#vig)"/>`
  )
}

/* ==========================================================================
   Scenes
   ========================================================================== */

/** Dense conifer forest at first light, fog between the trunks. */
function hero(w, h) {
  const rand = rng(0x4e1b)
  const planes = []

  // Four depth planes. Atmospheric perspective does the work: distance is
  // lighter, hazier and blurrier, never just smaller.
  // Depth is carried by atmosphere and by focus, not by size alone. The third
  // plane is the one in focus; everything in front of and behind it is soft,
  // which is what the shallow depth of field of a fast lens actually does and
  // is most of what separates a photograph from a stack of cut-outs.
  const grades = [
    { tone: '#A6B7AB', y: 0.60, blur: 'b12', n: 30, hi: 0.50, alpha: 0.7, posts: 14 },
    { tone: '#75897C', y: 0.71, blur: 'b6', n: 22, hi: 0.64, alpha: 0.85, posts: 9 },
    { tone: '#3D5348', y: 0.86, blur: null, n: 14, hi: 0.82, alpha: 0.95, posts: 0 },
    { tone: '#16241D', y: 1.12, blur: 'b5', n: 8, hi: 1.25, alpha: 1, posts: 0 },
  ]

  for (const g of grades) {
    // Trunks run from the top edge down to the plane's foot line, so both ends
    // are anchored. Stubs floating in a gap between canopies was the previous
    // version's tell, and no amount of fog hid it.
    const trunks = []
    for (let i = 0; i < g.posts; i += 1) {
      const x = between(rand, 0, 1) * w
      const tw = between(rand, 0.004, 0.012) * w
      trunks.push(
        `<rect x="${r1(x)}" y="0" width="${r1(tw)}" height="${r1(g.y * h)}"/>`,
      )
    }

    const trees = []
    for (let i = 0; i < g.n; i += 1) {
      const cx = between(rand, -0.1, 1.1) * w
      const height = between(rand, 0.45, 1.05) * g.hi * h
      // Tier count varies with the tree, so no two silhouettes step the same
      // way. A stand of firs cut to one template is the tell that this was
      // drawn rather than photographed.
      const tiers = 7 + Math.floor(rand() * 6)
      // And the foot line wanders, so they are not all standing on one shelf.
      const foot = (g.y + between(rand, -0.04, 0.04)) * h
      trees.push(fir(cx, foot, height, height * between(rand, 0.22, 0.38), tiers, rand))
    }

    planes.push(
      `<g fill="${g.tone}" opacity="${g.alpha}"${g.blur ? ` filter="url(#${g.blur})"` : ''}>` +
        trunks.join('') +
        trees.map((d) => `<path d="${d}"/>`).join('') +
        `</g>`,
    )
  }

  // Light shafts, raking down from the upper left.
  const shafts = []
  for (let i = 0; i < 5; i += 1) {
    const x = between(rand, 0.05, 0.75) * w
    const sw = between(rand, 0.03, 0.08) * w
    shafts.push(
      `<polygon points="${r1(x)},0 ${r1(x + sw)},0 ${r1(x + sw * 3.2)},${h} ${r1(x + sw * 1.6)},${h}"/>`,
    )
  }

  // One bank of fog per gap between planes. Interleaving them is what makes
  // the stand recede; a single sheet over the top just greys the picture.
  const bank = (lo, hi, strength) => {
    const parts = []
    for (let i = 0; i < 5; i += 1) {
      parts.push(
        `<ellipse cx="${r1(between(rand, 0, 1) * w)}" cy="${r1(between(rand, lo, hi) * h)}" ` +
          `rx="${r1(between(rand, 0.3, 0.6) * w)}" ry="${r1(between(rand, 0.05, 0.13) * h)}" ` +
          `opacity="${r1(between(rand, strength * 0.6, strength))}"/>`,
      )
    }
    return `<g fill="#DFE7E0" filter="url(#b40)">${parts.join('')}</g>`
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs>${blurs([5, 6, 12, 40])}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#DCE4DC"/><stop offset="0.45" stop-color="#B6C4B9"/>
  <stop offset="1" stop-color="#26362C"/>
</linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
${planes[0]}
${bank(0.4, 0.62, 0.8)}
${planes[1]}
<g fill="#EDF1EA" opacity="0.2" filter="url(#b40)">${shafts.join('')}</g>
${bank(0.55, 0.74, 0.62)}
${planes[2]}
${bank(0.68, 0.88, 0.44)}
${planes[3]}
${vignette(w, h, 0.5)}
</svg>`
}

/** A knife-edge ridge coming out of cloud. Upper third left empty for a headline. */
function ethos(w, h) {
  const rand = rng(0x2c07)
  const far = ridgeline(rand, -0.05 * w, 0.62 * h, 1.05 * w, 0.5 * h, 0.22 * h)
  const near = ridgeline(rand, -0.05 * w, 0.95 * h, 1.05 * w, 0.58 * h, 0.16 * h)

  const cloud = []
  for (let i = 0; i < 7; i += 1) {
    cloud.push(
      `<ellipse cx="${r1(between(rand, 0, 1) * w)}" cy="${r1(between(rand, 0.55, 0.9) * h)}" ` +
        `rx="${r1(between(rand, 0.22, 0.46) * w)}" ry="${r1(between(rand, 0.05, 0.12) * h)}" ` +
        `opacity="${r1(between(rand, 0.4, 0.75))}"/>`,
    )
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs>${blurs([3, 34])}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#E4EDF1"/><stop offset="0.55" stop-color="#C9D6DD"/>
  <stop offset="1" stop-color="#9FB3BD"/>
</linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
<path d="${shape(far, h, -0.05 * w, 1.05 * w)}" fill="#8FA4AF" opacity="0.72" filter="url(#b3)"/>
<g fill="#EAF1F4" filter="url(#b34)">${cloud.join('')}</g>
<path d="${shape(near, h, -0.05 * w, 1.05 * w)}" fill="#4E6570" opacity="0.94"/>
<g fill="#DEE9ED" opacity="0.5" filter="url(#b34)">
  <ellipse cx="${r1(0.45 * w)}" cy="${r1(0.78 * h)}" rx="${r1(0.5 * w)}" ry="${r1(0.07 * h)}"/>
</g>
${vignette(w, h, 0.34)}
</svg>`
}

/** Near-black granite at night. A faint starfield and one distant head-torch. */
function ridge(w, h) {
  const rand = rng(0x7f31)
  const crest = ridgeline(rand, -0.05 * w, 0.72 * h, 1.05 * w, 0.34 * h, 0.2 * h)

  const stars = []
  for (let i = 0; i < 320; i += 1) {
    const x = between(rand, 0, 1) * w
    const y = between(rand, 0, 0.66) * h
    // Brightness falls off toward the horizon, the way haze actually thins a
    // starfield. A field of evenly bright dots reads as dust on the lens.
    const fade = 1 - (y / h) * 0.9
    stars.push(
      `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(between(rand, 0.7, 2.4))}" ` +
        `opacity="${r1(between(rand, 0.3, 1) * fade)}"/>`,
    )
  }

  // The head-torch. Sits on the crest, small, and warm rather than hot — the
  // one saturated accent in this palette is spent elsewhere.
  const tx = 0.68 * w
  const ty = 0.42 * h

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs>${blurs([4, 18, 46])}
<linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1B272B"/><stop offset="0.55" stop-color="#121B1E"/>
  <stop offset="1" stop-color="#0A0F11"/>
</linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#F2E4C4" stop-opacity="0.75"/>
  <stop offset="1" stop-color="#F2E4C4" stop-opacity="0"/>
</radialGradient></defs>
<rect width="${w}" height="${h}" fill="url(#night)"/>
<g fill="#DDE7EA">${stars.join('')}</g>
<ellipse cx="${r1(0.5 * w)}" cy="${r1(0.52 * h)}" rx="${r1(0.62 * w)}" ry="${r1(0.2 * h)}"
  fill="#2B3A40" opacity="0.62" filter="url(#b46)"/>
<path d="${shape(crest, h, -0.05 * w, 1.05 * w)}" fill="#070B0C"/>
<circle cx="${r1(tx)}" cy="${r1(ty)}" r="${r1(0.019 * w)}" fill="url(#glow)"/>
<circle cx="${r1(tx)}" cy="${r1(ty)}" r="3.4" fill="#FBF4E2"/>
${vignette(w, h, 0.5)}
</svg>`
}

/* --------------------------------------------------------------------------
   The route cards
   --------------------------------------------------------------------------
   One function, five seeds. Everything that reads as art direction — the flat
   overcast grade, the slope stack, the trail, the post, the plate and where it
   sits in the frame — is shared code, so the five cannot drift apart. Only the
   terrain jitter and the name struck into the plate differ.

   That is camouflage rule 2 and it is the entire defence for the plate. A
   plate on one card alone ends the hunt the moment anyone lays the five side
   by side.
   -------------------------------------------------------------------------- */

/** Type sizes for the plate, solved once so all five are struck identically. */
function plateType(names) {
  const INNER = 452 // plate width less its margins
  let size = 64
  while (size > 20 && Math.max(...names.map((n) => widthOf('strong', n, size, 0.04))) > INNER) {
    size -= 0.5
  }
  return { name: size, alt: Math.round(size * 0.62) }
}

function trail(w, h, seed, job, sizes) {
  const rand = rng(seed)
  const slopes = [
    { tone: '#B7C0BE', y: 0.4, rough: 0.1, blur: 'b6' },
    { tone: '#93A09B', y: 0.5, rough: 0.13, blur: 'b3' },
    { tone: '#6C7A73', y: 0.62, rough: 0.1, blur: null },
  ].map((s) => {
    const pts = ridgeline(rand, -0.05 * w, s.y * h, 1.05 * w, (s.y - 0.06) * h, s.rough * h)
    return (
      `<path d="${shape(pts, h, -0.05 * w, 1.05 * w)}" fill="${s.tone}"` +
      (s.blur ? ` filter="url(#${s.blur})"` : '') +
      `/>`
    )
  })

  // The trail: a band running from the bottom edge up into the mid-ground.
  const trailBand =
    `M${r1(0.28 * w)} ${h} C${r1(0.36 * w)} ${r1(0.84 * h)} ${r1(0.44 * w)} ${r1(0.78 * h)} ` +
    `${r1(0.53 * w)} ${r1(0.7 * h)} L${r1(0.62 * w)} ${r1(0.7 * h)} ` +
    `C${r1(0.56 * w)} ${r1(0.79 * h)} ${r1(0.6 * w)} ${r1(0.87 * h)} ${r1(0.72 * w)} ${h} Z`

  const scree = []
  for (let i = 0; i < 140; i += 1) {
    const y = between(rand, 0.66, 1) * h
    const spread = (y / h - 0.6) * 1.8
    scree.push(
      `<ellipse cx="${r1(between(rand, 0.5 - spread, 0.5 + spread) * w)}" cy="${r1(y)}" ` +
        `rx="${r1(between(rand, 1.5, 7))}" ry="${r1(between(rand, 1, 4))}" ` +
        `opacity="${r1(between(rand, 0.12, 0.4))}"/>`,
    )
  }

  /* ---- The post and its plate ------------------------------------------
     Fixed geometry, identical on all five. The plate is 10% of the frame
     height and sits off the optical centre — present, readable, and not what
     the eye lands on first. */
  // Placed so the plate lands just left of the optical centre. Centring the
  // post instead puts the plate dead centre, which is the one place a viewer
  // is guaranteed to look.
  const postX = 0.38 * w
  const postW = 0.075 * w
  const postTop = 0.36 * h
  const postFoot = 0.88 * h

  const plateW = 524
  const plateH = 150
  const plateX = postX - plateW / 2 + postW / 2
  const plateY = 0.44 * h
  const capName = capOf('strong', sizes.name)

  const rivets = [
    [plateX + 20, plateY + 20],
    [plateX + plateW - 20, plateY + 20],
    [plateX + 20, plateY + plateH - 20],
    [plateX + plateW - 20, plateY + plateH - 20],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${r1(x)}" cy="${r1(y)}" r="7" fill="${C.metalDark}"/>` +
        `<circle cx="${r1(x - 1.6)}" cy="${r1(y - 1.6)}" r="4.4" fill="#D6D9D3"/>`,
    )
    .join('')

  // Oxidation. Deterministic blotches, so all five weather the same way.
  const ox = rng(0x1234)
  const patina = Array.from({ length: 14 }, () => {
    const x = plateX + ox() * plateW
    const y = plateY + ox() * plateH
    return (
      `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(between(ox, 6, 30))}" ` +
      `ry="${r1(between(ox, 4, 16))}" opacity="${r1(between(ox, 0.05, 0.16))}"/>`
    )
  }).join('')

  const grainLines = Array.from({ length: 9 }, (_, i) => {
    const x = postX + ((i + 0.5) / 9) * postW
    return `<line x1="${r1(x)}" y1="${r1(postTop)}" x2="${r1(x + between(rand, -3, 3))}" y2="${r1(postFoot)}"/>`
  }).join('')

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs>${blurs([3, 6, 22])}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#D8DEDC"/><stop offset="1" stop-color="#BFC8C4"/>
</linearGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#6C7A73"/><stop offset="1" stop-color="#4A544E"/>
</linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#C8CBC5"/><stop offset="0.5" stop-color="${C.metal}"/>
  <stop offset="1" stop-color="#9DA29B"/>
</linearGradient>
<linearGradient id="post" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${C.timberDark}"/><stop offset="0.35" stop-color="${C.timber}"/>
  <stop offset="1" stop-color="#2F2417"/>
</linearGradient></defs>

<rect width="${w}" height="${h}" fill="url(#sky)"/>
${slopes.join('')}
<rect y="${r1(0.6 * h)}" width="${w}" height="${r1(0.4 * h)}" fill="url(#ground)"/>
<path d="${trailBand}" fill="#8C948B" opacity="0.8"/>
<g fill="#2E362F">${scree.join('')}</g>

<rect x="${r1(postX)}" y="${r1(postTop)}" width="${r1(postW)}" height="${r1(postFoot - postTop)}" fill="url(#post)"/>
<g stroke="#241A10" stroke-width="1.4" opacity="0.35">${grainLines}</g>
<ellipse cx="${r1(postX + postW / 2)}" cy="${r1(postFoot)}" rx="${r1(postW * 0.9)}" ry="7" fill="#20261F" opacity="0.5"/>

<g filter="url(#b22)"><rect x="${r1(plateX + 6)}" y="${r1(plateY + 10)}" width="${plateW}" height="${plateH}" rx="5" fill="#12160F" opacity="0.5"/></g>
<rect x="${r1(plateX)}" y="${r1(plateY)}" width="${plateW}" height="${plateH}" rx="5" fill="url(#metal)"/>
<rect x="${r1(plateX)}" y="${r1(plateY)}" width="${plateW}" height="${plateH}" rx="5" fill="none" stroke="${C.metalDark}" stroke-width="2"/>
<g fill="${C.oxide}">${patina}</g>
${type('strong', job.name, {
  size: sizes.name,
  tracking: 0.04,
  x: plateX + plateW / 2,
  y: plateY + 62 + capName,
  anchor: 'middle',
  fill: '#20241F',
})}
${type('text', job.altitude, {
  size: sizes.alt,
  tracking: 0.12,
  x: plateX + plateW / 2,
  y: plateY + plateH - 26,
  anchor: 'middle',
  fill: '#3C413A',
})}
${rivets}
${vignette(w, h, 0.38)}
</svg>`
}

/* --------------------------------------------------------------------------
   logistics-01 — the desk
   --------------------------------------------------------------------------
   Overhead, warm lamplight from the upper left. The ticket is not centred and
   is not the brightest thing in the frame; the map is. The clutter is the
   disguise. An isolated ticket on a clean ground is a spotlight pointed at it.
   -------------------------------------------------------------------------- */

function desk(w, h, job) {
  const rand = rng(0x5a21)

  const planks = Array.from({ length: 7 }, (_, i) => {
    const y = (i / 7) * h
    return `<rect y="${r1(y)}" width="${w}" height="${r1(h / 7)}" fill="#000" opacity="${r1(between(rand, 0.02, 0.07))}"/>`
  }).join('')

  const woodGrain = Array.from({ length: 90 }, () => {
    const y = rand() * h
    return `<path d="M0 ${r1(y)} Q${r1(w / 2)} ${r1(y + between(rand, -9, 9))} ${w} ${r1(y + between(rand, -6, 6))}" opacity="${r1(between(rand, 0.03, 0.12))}"/>`
  }).join('')

  // The map. Large, pale, and the brightest object in the frame by design.
  // Contours are nested closed loops with a couple of harmonics on the radius,
  // which is what makes them read as land rather than as decoration.
  const contourLines = Array.from({ length: 15 }, (_, i) => {
    const k = 1 - i * 0.058
    const pts = []
    for (let a = 0; a <= 64; a += 1) {
      const th = (a / 64) * Math.PI * 2
      const rr =
        250 * k * (1 + 0.26 * Math.sin(3 * th + 0.7) + 0.12 * Math.sin(5 * th + 2.1))
      pts.push(`${r1(400 + rr * Math.cos(th))} ${r1(390 + rr * 0.78 * Math.sin(th))}`)
    }
    return `<path d="M${pts.join(' L')} Z" opacity="${r1(0.3 + i * 0.03)}"/>`
  }).join('')

  /* ---- The ticket ------------------------------------------------------
     Angled 8°, cream rather than white, with a punch hole and a perforated
     stub edge.

     The header is a muted band with dark type on it, NOT light type on a
     near-black band. That version was tried and was wrong: it made the
     operator name the highest-contrast thing in the whole frame, the eye went
     straight to it, and a clue meant to cost a careful look cost nothing.
     04-assets.md puts it plainly — the ticket must not be the brightest
     object in the frame. The map is, and it should stay that way. */
  const tw = 560
  const th = 232
  const tx = 690
  const ty = 660
  const capOp = capOf('strong', 52)

  const perfs = Array.from({ length: 13 }, (_, i) => {
    const y = 16 + i * ((th - 32) / 12)
    return `<circle cx="${r1(tw - 118)}" cy="${r1(y)}" r="3.4" fill="${C.timberDark}" opacity="0.5"/>`
  }).join('')

  const ticket = `<g transform="translate(${tx},${ty}) rotate(8)">
  <g filter="url(#b14)"><rect x="8" y="12" width="${tw}" height="${th}" rx="3" fill="#241A10" opacity="0.45"/></g>
  <rect width="${tw}" height="${th}" rx="3" fill="#E4DCC6"/>
  <rect width="${tw}" height="${th}" rx="3" fill="url(#tint)"/>
  <rect x="0" y="0" width="${tw}" height="76" fill="#C4BA9E" opacity="0.8"/>
  <line x1="0" y1="76" x2="${tw}" y2="76" stroke="#8A8069" stroke-width="2.4"/>
  ${type('strong', job.operator, { size: 52, tracking: 0.02, squeeze: 0.78, x: 26, y: 24 + capOp, fill: '#39352A' })}
  ${type('text', job.route, { size: 25, tracking: 0.08, squeeze: 0.85, x: 26, y: 118, fill: '#4A4438' })}
  ${type('strong', job.coach, { size: 30, tracking: 0.05, x: 26, y: 168, fill: '#2B2A24' })}
  ${type('strong', job.seat, { size: 30, tracking: 0.05, x: 190, y: 168, fill: '#2B2A24' })}
  ${type('text', job.service, { size: 22, tracking: 0.14, x: 26, y: 208, fill: '#6A6252' })}
  ${type('text', job.serial, { size: 22, tracking: 0.1, x: tw - 142, y: 208, anchor: 'end', fill: '#6A6252' })}
  ${perfs}
  <circle cx="${r1(tw - 58)}" cy="${r1(th / 2)}" r="17" fill="${C.timberDark}"/>
  <circle cx="${r1(tw - 58)}" cy="${r1(th / 2)}" r="17" fill="none" stroke="#B9AF95" stroke-width="2"/>
</g>`

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs>${blurs([6, 14, 26, 90])}
<linearGradient id="desk" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#6E5334"/><stop offset="0.55" stop-color="#54402A"/>
  <stop offset="1" stop-color="#33261A"/>
</linearGradient>
<radialGradient id="lamp" cx="0.28" cy="0.2" r="0.85">
  <stop offset="0" stop-color="#FFE9BC" stop-opacity="0.5"/>
  <stop offset="0.6" stop-color="#FFD79A" stop-opacity="0.12"/>
  <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
</radialGradient>
<linearGradient id="tint" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/>
  <stop offset="1" stop-color="#6B5A3C" stop-opacity="0.16"/>
</linearGradient></defs>

<rect width="${w}" height="${h}" fill="url(#desk)"/>
${planks}
<g stroke="#20170E" fill="none" stroke-width="2">${woodGrain}</g>

<g transform="rotate(-5 400 420)">
  <g filter="url(#b26)"><rect x="112" y="152" width="600" height="500" fill="#1B1208" opacity="0.45"/></g>
  <rect x="100" y="140" width="600" height="500" fill="#F3EEDF"/>
  <g stroke="#8FA08D" fill="none" stroke-width="1.6">${contourLines}</g>
  <g stroke="#C9C1AB" stroke-width="2.4" opacity="0.9">
    <line x1="300" y1="140" x2="300" y2="640"/><line x1="500" y1="140" x2="500" y2="640"/>
    <line x1="100" y1="390" x2="700" y2="390"/>
  </g>
</g>

${ticket}

<g transform="translate(1180,300) rotate(24)">
  <g filter="url(#b6)"><rect x="4" y="6" width="26" height="420" rx="10" fill="#1B1208" opacity="0.5"/></g>
  <rect width="26" height="420" rx="4" fill="#C8A44E"/>
  <rect x="8" width="6" height="420" fill="#000" opacity="0.12"/>
  <polygon points="0,420 26,420 13,462" fill="#E4D2A8"/>
  <polygon points="7,447 19,447 13,462" fill="#2B2A24"/>
  <rect y="0" width="26" height="40" rx="4" fill="#8A8F7E"/>
</g>

<g transform="translate(1210,880) rotate(-14)">
  <circle cx="0" cy="0" r="46" fill="none" stroke="#9BA0A4" stroke-width="9"/>
  <g fill="#8D9296">
    <rect x="40" y="-9" width="132" height="18" rx="4"/>
    <rect x="150" y="-9" width="11" height="30"/><rect x="128" y="-9" width="9" height="24"/>
  </g>
  <g fill="#7C8185" transform="rotate(28)">
    <rect x="40" y="-8" width="118" height="16" rx="4"/>
    <rect x="138" y="-8" width="10" height="26"/>
  </g>
</g>

<g fill="none" stroke="#3B2412" opacity="0.5">
  <circle cx="330" cy="880" r="88" stroke-width="13"/>
  <circle cx="330" cy="880" r="88" stroke-width="4" opacity="0.5"/>
</g>

<rect width="${w}" height="${h}" fill="url(#lamp)"/>
${vignette(w, h, 0.52)}
</svg>`
}

/* --------------------------------------------------------------------------
   permit-01 — the document
   --------------------------------------------------------------------------
   Three marks, and the term is only one of them. A document bearing exactly
   one stamp draws the eye straight to that stamp. A document bearing three
   reads as bureaucracy.
   -------------------------------------------------------------------------- */

const STAMP = { size: 42, tracking: 0.07, sub: 28, padX: 38, padY: 54, rule: 4.5 }

function permit(w, h, job) {
  const rand = rng(0x3d90)
  const pw = w * 0.82
  const ph = h * 0.84
  const px = (w - pw) / 2
  const py = (h - ph) / 2

  const rows = job.fields
    .map((label, i) => {
      const y = 470 + i * 128
      return (
        type('text', label, { size: 26, tracking: 0.16, x: 74, y, fill: '#7C7566' }) +
        type('text', job.values[i], { size: 40, x: 74, y: y + 56, fill: '#26251F' }) +
        `<line x1="74" y1="${y + 76}" x2="${r1(pw - 74)}" y2="${y + 76}" stroke="#BDB6A4" stroke-width="1.6"/>`
      )
    })
    .join('')

  /* ---- The marks -------------------------------------------------------
     Struck twice with a 3px offset in two inks, which is what a worn rubber
     stamp does on a hand press. Rotated off square, and the clue stamp runs
     over the paper edge. */
  const strike = (inner, angle, x, y) =>
    `<g transform="translate(${r1(x)},${r1(y)}) rotate(${angle})">
      <g fill="${C.ink}" opacity="0.34" transform="translate(3.5,2.5)">${inner}</g>
      <g fill="${C.stamp}" opacity="0.82">${inner}</g>
    </g>`

  /* One stamp construction, used twice. Same em, same tracking, same padding,
     same rule weight — the only difference between the two is what they say
     and how far off square they were pressed.

     This is the same argument as the four accreditation seals. A document
     where the clue stamp is bolder or bigger than its neighbour has not
     hidden anything: the eye finds the heaviest mark on a page before it
     reads a single word, and that mark then reads as the point of the
     picture. Bureaucracy is what three evenly weighted marks look like. */
  function stampOf(text, sub) {
    const tw = widthOf('strong', text, STAMP.size, STAMP.tracking)
    const sw = sub ? widthOf('text', sub, STAMP.sub, 0.1) : 0
    const boxW = Math.max(tw, sw) + STAMP.padX * 2
    const boxH = sub ? STAMP.padY * 2 + 34 : STAMP.padY * 2 - 24
    return (
      `<rect x="${r1(-boxW / 2)}" y="${r1(-boxH / 2)}" width="${r1(boxW)}" height="${r1(boxH)}" ` +
      `rx="3" fill="none" stroke="${C.stamp}" stroke-width="${STAMP.rule}"/>` +
      setPath('strong', text, STAMP.size, STAMP.tracking, -tw / 2, sub ? -8 : 15) +
      (sub ? setPath('text', sub, STAMP.sub, 0.1, -sw / 2, 40) : '')
    )
  }

  const markInner = stampOf(job.mark, job.markDate)
  const secondInner = stampOf(job.second, null)

  // Fine print. Set small enough to be texture rather than reading matter,
  // which is what fills the dead band under the fields without giving anyone
  // a second wall of text to search.
  const clauses = Array.from({ length: 7 }, (_, i) => {
    const y = 1086 + i * 30
    const wRatio = i === 6 ? 0.42 : between(rand, 0.86, 1)
    return (
      `<rect x="74" y="${r1(y)}" width="${r1((pw - 148) * wRatio)}" height="7" ` +
      `rx="3.5" fill="#3B382F" opacity="${r1(between(rand, 0.16, 0.24))}"/>`
    )
  }).join('')

  // A signature: one continuous scrawl, deterministic.
  let sig = `M0 0`
  for (let i = 1; i <= 9; i += 1) {
    sig += ` Q${r1(i * 34 - 17)} ${r1(between(rand, -46, 30))} ${r1(i * 34)} ${r1(between(rand, -14, 12))}`
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs>${blurs([3, 20])}
<linearGradient id="curl" x1="0" y1="0" x2="1" y2="0.2">
  <stop offset="0" stop-color="#000000" stop-opacity="0.1"/>
  <stop offset="0.12" stop-color="#FFFFFF" stop-opacity="0.5"/>
  <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
  <stop offset="0.92" stop-color="#FFFFFF" stop-opacity="0.34"/>
  <stop offset="1" stop-color="#000000" stop-opacity="0.12"/>
</linearGradient>
<clipPath id="sheet"><rect x="${r1(px)}" y="${r1(py)}" width="${r1(pw)}" height="${r1(ph)}"/></clipPath>
<radialGradient id="lamp" cx="0.32" cy="0.22" r="0.9">
  <stop offset="0" stop-color="#FFF0CE" stop-opacity="0.3"/>
  <stop offset="1" stop-color="#000000" stop-opacity="0.22"/>
</radialGradient></defs>

<rect width="${w}" height="${h}" fill="${C.dusk}"/>
<rect width="${w}" height="${h}" fill="#120C08" opacity="0.35"/>

<g transform="rotate(3 ${r1(w / 2)} ${r1(h / 2)})">
  <g filter="url(#b20)"><rect x="${r1(px + 10)}" y="${r1(py + 16)}" width="${r1(pw)}" height="${r1(ph)}" fill="#000" opacity="0.55"/></g>
  <g transform="translate(${r1(px)},${r1(py)})">
    <rect width="${r1(pw)}" height="${r1(ph)}" fill="${C.paperLit}"/>
    <rect width="${r1(pw)}" height="${r1(ph)}" fill="url(#curl)"/>

    ${type('serif', job.header, { size: 66, x: 74, y: 120, fill: '#1C1B16' })}
    ${type('text', job.subhead, { size: 31, tracking: 0.19, x: 76, y: 172, fill: '#4C483E' })}
    <line x1="74" y1="212" x2="${r1(pw - 74)}" y2="212" stroke="#2A2921" stroke-width="3"/>
    ${type('text', job.reference, { size: 27, tracking: 0.1, x: 74, y: 268, fill: '#6E6759' })}
    ${type('text', 'PRÉFECTURE DE LA HAUTE-SAVOIE', { size: 22, tracking: 0.12, x: r1(pw - 74), y: 268, anchor: 'end', fill: '#8A8374' })}
    <line x1="74" y1="300" x2="${r1(pw - 74)}" y2="300" stroke="#BDB6A4" stroke-width="1.4"/>
    ${rows}

    ${type('text', 'CONDITIONS OF ACCESS', { size: 22, tracking: 0.16, x: 74, y: 1046, fill: '#7C7566' })}
    ${clauses}

    <g transform="translate(96,${r1(ph - 150)})" fill="none" stroke="#2A3A5E" stroke-width="5" stroke-linecap="round" opacity="0.75">
      <path d="${sig}"/>
    </g>
    <line x1="74" y1="${r1(ph - 108)}" x2="480" y2="${r1(ph - 108)}" stroke="#BDB6A4" stroke-width="1.6"/>
    ${type('text', 'SIGNATURE, DELEGATED OFFICER', { size: 21, tracking: 0.14, x: 74, y: r1(ph - 74), fill: '#8A8374' })}

    ${strike(secondInner, -7, pw * 0.66, 372)}
  </g>

  <!-- Pressed off the right edge: the frame runs past the paper and is cut,
       the lettering stays on it. Placed by measurement, not by eye — see the
       cap-height check the generator prints. -->
  <g clip-path="url(#sheet)">${strike(markInner, 5.5, px + pw * 0.82, py + ph - 116)}</g>
</g>

<rect width="${w}" height="${h}" fill="url(#lamp)"/>
${vignette(w, h, 0.5)}
</svg>`
}

/** Path data for a line, positioned. Used where a <g> wrapper is in the way. */
function setPath(face, text, size, tracking, x, y) {
  const { d } = setType(faces[face], text, size, tracking)
  return `<path d="${d}" transform="translate(${r1(x)},${r1(y)})"/>`
}

/* --------------------------------------------------------------------------
   journal-01
   --------------------------------------------------------------------------
   Carries no legible text, deliberately. The decoy that belongs to this
   section is a route name in the caption beneath it, and decoys have to stay
   cheap and findable in the DOM — baking one into a photograph would make it
   as hard as a real clue and waste the time it is supposed to cost.
   -------------------------------------------------------------------------- */

function journal(w, h) {
  const rand = rng(0x6b12)

  const lines = []
  for (let i = 0; i < 13; i += 1) {
    const y = 150 + i * 46
    if (rand() < 0.12) continue
    const len = between(rand, 0.35, 0.92)
    let d = `M${r1(w * 0.56)} ${r1(y)}`
    const steps = Math.round(len * 26)
    for (let s = 1; s <= steps; s += 1) {
      d += ` q${r1(between(rand, 4, 9))} ${r1(between(rand, -11, 4))} ${r1(between(rand, 9, 15))} ${r1(between(rand, -3, 3))}`
    }
    lines.push(`<path d="${d}"/>`)
  }

  const rules = Array.from({ length: 14 }, (_, i) => {
    const y = 158 + i * 46
    return `<line x1="${r1(w * 0.53)}" y1="${r1(y)}" x2="${r1(w - 60)}" y2="${r1(y)}"/>`
  }).join('')

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs>${blurs([5, 18])}
<linearGradient id="desk" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#5E4830"/><stop offset="1" stop-color="#2E2317"/>
</linearGradient>
<linearGradient id="gutter" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#000" stop-opacity="0.34"/>
  <stop offset="0.5" stop-color="#000" stop-opacity="0.02"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.14"/>
</linearGradient>
<radialGradient id="lamp" cx="0.6" cy="0.2" r="0.85">
  <stop offset="0" stop-color="#FFEFC9" stop-opacity="0.34"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.2"/>
</radialGradient></defs>

<rect width="${w}" height="${h}" fill="url(#desk)"/>
<g transform="rotate(-1.5 ${r1(w / 2)} ${r1(h / 2)})">
  <g filter="url(#b18)"><rect x="46" y="34" width="${r1(w - 60)}" height="${r1(h - 40)}" fill="#000" opacity="0.5"/></g>
  <rect x="30" y="20" width="${r1(w - 60)}" height="${r1(h - 40)}" fill="${C.paper}"/>
  <rect x="${r1(w * 0.5 - 26)}" y="20" width="52" height="${r1(h - 40)}" fill="url(#gutter)"/>
  <g stroke="#C3BBA6" stroke-width="1.4">${rules}</g>
  <g fill="none" stroke="#33323C" stroke-width="2.6" stroke-linecap="round" opacity="0.72">${lines.join('')}</g>
  <g fill="none" stroke="#5E6B58" stroke-width="2.2" opacity="0.55">
    <path d="M${r1(w * 0.08)} 400 L${r1(w * 0.16)} 250 L${r1(w * 0.24)} 330 L${r1(w * 0.33)} 190 L${r1(w * 0.42)} 400 Z"/>
  </g>
</g>
<g transform="translate(${r1(w * 0.06)},${r1(h * 0.78)}) rotate(-9)">
  <g filter="url(#b5)"><rect x="4" y="5" width="18" height="300" rx="8" fill="#000" opacity="0.45"/></g>
  <rect width="18" height="300" rx="3" fill="#C8A44E"/>
  <polygon points="0,300 18,300 9,330" fill="#E4D2A8"/>
  <polygon points="4,320 14,320 9,330" fill="#2B2A24"/>
</g>
<rect width="${w}" height="${h}" fill="url(#lamp)"/>
${vignette(w, h, 0.44)}
</svg>`
}

/* ==========================================================================
   Pipeline
   ========================================================================== */

/**
 * Film grain, as a tile composited in overlay.
 *
 * Done here rather than as an SVG filter because sharp is exact and
 * reproducible, and because one 256px tile costs nothing next to running a
 * turbulence filter across a 2400px canvas. Mid grey is the identity for
 * overlay, so the tile only ever nudges a pixel either side of what it was.
 */
function grainTile(seed, sigma) {
  const N = 256
  const buf = Buffer.alloc(N * N * 4)
  const rand = rng(seed)
  for (let i = 0; i < N * N; i += 1) {
    // Two uniforms averaged: cheap, and closer to film than a flat uniform.
    const n = (rand() + rand() - 1) * sigma
    const v = Math.max(0, Math.min(255, Math.round(128 + n)))
    buf[i * 4] = v
    buf[i * 4 + 1] = v
    buf[i * 4 + 2] = v
    buf[i * 4 + 3] = 255
  }
  return sharp(buf, { raw: { width: N, height: N, channels: 4 } }).png().toBuffer()
}

const KB = (n) => (n / 1024).toFixed(1) + ' KB'

async function emit(stem, svg, width, height, grain, report) {
  // A photograph, if one has been supplied, otherwise the drawing.
  const supplied = resolve(BASES, stem + '.png')
  const source = existsSync(supplied)
    ? sharp(supplied).resize(width, height, { fit: 'cover' })
    : sharp(Buffer.from(svg))

  const graded = await source
    .composite([{ input: grain, tile: true, blend: 'overlay' }])
    .toColourspace('srgb')
    .png()
    .toBuffer()

  const widths = [Math.round(width / 2), width]
  const sizes = []
  for (const w of widths) {
    const file = resolve(OUT, `${stem}-${w}.webp`)
    const info = await sharp(graded)
      .resize(w, Math.round((height / width) * w), { kernel: 'lanczos3' })
      .webp({ quality: 82, effort: 6 })
      .toFile(file)
    sizes.push(info.size)
  }

  report.push({ stem, width, height, widths, sizes, drawn: !existsSync(supplied) })
}

/* --------------------------------------------------------------------------
   The manifest module
   -------------------------------------------------------------------------- */

const MODULE_HEAD = `/**
 * GENERATED — do not edit by hand.
 *
 * Produced by scripts/plates.mjs alongside the files in public/img. Every
 * image the site ships is described here: its stem, its intrinsic size and the
 * widths that actually exist on disk.
 *
 * It is generated rather than typed so that the two cannot drift. An intrinsic
 * height transcribed by hand and then quietly wrong is a layout shift under a
 * reader mid-sentence, and a srcset naming a width nobody emitted is a broken
 * image that only shows up on somebody else's screen density.
 */

export type Plate = {
  /** Path stem under /img. A width and .webp are appended. */
  stem: string
  /** Intrinsic size of the largest variant, for width/height attributes. */
  width: number
  height: number
  /** Widths on disk, ascending. Feeds the srcset. */
  widths: number[]
}
`

const KEYS = {
  'hero-01': 'hero',
  'ethos-01': 'ethos',
  'route-01': 'routeOne',
  'route-02': 'routeTwo',
  'route-03': 'routeThree',
  'route-04': 'routeFour',
  'route-05': 'routeFive',
  'ridge-01': 'ridge',
  'logistics-01': 'logistics',
  'permit-01': 'permit',
  'journal-01': 'journal',
}

function moduleText(report) {
  const entries = report
    .map((p) => {
      const key = KEYS[p.stem]
      return (
        `  ${key}: { stem: '${p.stem}', width: ${p.width}, height: ${p.height}, ` +
        `widths: [${p.widths.join(', ')}] },`
      )
    })
    .join('\n')

  const routes = report
    .filter((p) => p.stem.startsWith('route-'))
    .map((p) => `plates.${KEYS[p.stem]}`)
    .join(', ')

  return (
    MODULE_HEAD +
    '\nexport const plates = {\n' +
    entries +
    '\n} as const satisfies Record<string, Plate>\n' +
    '\n/** The five route cards, in the order they are set. */\n' +
    `export const routeSet: Plate[] = [${routes}]\n`
  )
}

/* --------------------------------------------------------------------------
   Entry
   -------------------------------------------------------------------------- */

async function main() {
  if (!existsSync(JOBS)) {
    console.error(
      'Missing ' +
        JOBS +
        '\n\nThe strings struck into three of these plates are organizer-only and are' +
        '\nnot kept in the repository. See _private/ASSET-MANIFEST.md.',
    )
    process.exit(2)
  }
  const job = JSON.parse(readFileSync(JOBS, 'utf8'))
  mkdirSync(OUT, { recursive: true })

  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const wanted = (stem) => only.length === 0 || only.includes(stem)

  const sizes = plateType(job.routes.map((r) => r.name))
  const grain = await grainTile(0x9e37, 11)
  const report = []

  const work = [
    ['hero-01', () => hero(2400, 1600), 2400, 1600],
    ['ethos-01', () => ethos(1800, 1200), 1800, 1200],
    ...job.routes.map((r, i) => [
      r.stem,
      () => trail(1200, 1500, 0xa100 + i * 0x77, r, sizes),
      1200,
      1500,
    ]),
    ['ridge-01', () => ridge(2400, 1600), 2400, 1600],
    ['logistics-01', () => desk(1600, 1200, job.ticket), 1600, 1200],
    ['permit-01', () => permit(1400, 1800, job.permit), 1400, 1800],
    ['journal-01', () => journal(1200, 800), 1200, 800],
  ]

  for (const [stem, build, w, h] of work) {
    if (!wanted(stem)) continue
    await emit(stem, build(), w, h, grain, report)
    process.stdout.write('.')
  }
  process.stdout.write('\n\n')

  if (only.length === 0) writeFileSync(MODULE, moduleText(report), 'utf8')

  /* ---- Report ----------------------------------------------------------
     Two totals, because they answer different questions. Disk is what the
     repository carries. Transfer is what one visitor actually downloads, and
     that is what the 1.8 MB ceiling in 04-assets.md is about: srcset serves
     one width per image, not both. */
  let disk = 0
  let small = 0
  let large = 0
  for (const p of report) {
    disk += p.sizes[0] + p.sizes[1]
    small += p.sizes[0]
    large += p.sizes[1]
    console.log(
      '  ' +
        p.stem.padEnd(14) +
        String(p.width).padStart(5) +
        '×' +
        String(p.height).padEnd(6) +
        p.widths.map((w, i) => `${w}w ${KB(p.sizes[i])}`).join('   ').padEnd(34) +
        (p.drawn ? '' : 'from supplied frame'),
    )
  }

  const CEILING = 1.8 * 1024 * 1024
  console.log('\n  on disk, both widths     ' + KB(disk))
  console.log('  transfer, 1× displays    ' + KB(small))
  console.log(
    '  transfer, 2× displays    ' + KB(large) + (large > CEILING ? '   OVER 1.8 MB' : '   under 1.8 MB'),
  )

  /* ---- Legibility ------------------------------------------------------
     Rule 4: every term has to be readable on a 375px phone. These are the
     display widths those three plates get there, and the check is the cap
     height the lettering lands at once the image is scaled down to fit. */
  const PHONE = [
    ['route-03', 300, 'strong', sizes.name],
    ['logistics-01', 335, 'strong', 52],
    ['permit-01', 335, 'strong', STAMP.size],
  ]
  console.log('\n  at 375px, cap height of the lettering:')
  for (const [stem, shown, face, size] of PHONE) {
    const p = report.find((x) => x.stem === stem)
    if (!p) continue
    const px = capOf(face, size) * (shown / p.width)
    console.log(
      '  ' + stem.padEnd(14) + 'shown ' + shown + 'px  cap ' + px.toFixed(1) + 'px' +
        (px < 7 ? '   TOO SMALL' : ''),
    )
  }
}

main()
