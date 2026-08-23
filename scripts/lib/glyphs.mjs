/**
 * Glyphs to geometry. A small, dependency-free TrueType reader.
 *
 * Given a WOFF and a codepoint, hands back the glyph's contours as SVG path
 * data. It knows nothing about layout: where a glyph goes, how big it is and
 * what it sits on are the caller's business. Two callers build on it —
 *
 *   scripts/outline.mjs   sets display headlines and seal rings, and commits
 *                         the geometry to src/content/outlines.ts
 *   scripts/plates.mjs    sets type inside the rendered imagery, where the
 *                         output is pixels
 *
 * Zero dependencies on purpose. WOFF1 is a table directory plus zlib, and node
 * has zlib, so the parser below is short enough to read in one sitting:
 *
 *   WOFF header/directory -> inflate tables -> cmap (codepoint -> glyph id)
 *   -> loca/glyf (glyph id -> quadratic contours) -> hmtx (advances)
 *
 * Nothing here ships. No font is fetched at runtime and the browser never sees
 * a glyph table.
 *
 * Why both callers set type as paths rather than handing strings to something
 * that draws text:
 *
 *   - In outline.mjs the output is a document. Geometry is not text, so
 *     find-in-page has nothing to walk. Inline SVG <text> IS matched by
 *     Chrome and is never used.
 *   - In plates.mjs the output is a raster, where <text> would be safe from
 *     find-in-page but would need the face installed where the rasteriser can
 *     find it. Setting from the committed WOFF means the imagery renders the
 *     same on any machine and cannot silently fall back to a system face.
 */
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

/* ==========================================================================
   WOFF container
   ========================================================================== */

function tables(buf) {
  if (buf.toString('ascii', 0, 4) !== 'wOFF') throw new Error('not a WOFF file')
  const count = buf.readUInt16BE(12)
  const out = new Map()
  for (let i = 0; i < count; i += 1) {
    const entry = 44 + i * 20
    const tag = buf.toString('ascii', entry, entry + 4)
    const at = buf.readUInt32BE(entry + 4)
    const packed = buf.readUInt32BE(entry + 8)
    const plain = buf.readUInt32BE(entry + 12)
    const slice = buf.subarray(at, at + packed)
    out.set(tag, packed < plain ? inflateSync(slice) : slice)
  }
  return out
}

/* ==========================================================================
   Tables
   ========================================================================== */

function metrics(t) {
  const head = t.get('head')
  const maxp = t.get('maxp')
  const hhea = t.get('hhea')
  return {
    em: head.readUInt16BE(18),
    longLoca: head.readInt16BE(50) === 1,
    glyphs: maxp.readUInt16BE(4),
    metricCount: hhea.readUInt16BE(34),
  }
}

function offsets(t, m) {
  const loca = t.get('loca')
  const out = new Array(m.glyphs + 1)
  for (let i = 0; i <= m.glyphs; i += 1) {
    out[i] = m.longLoca ? loca.readUInt32BE(i * 4) : loca.readUInt16BE(i * 2) * 2
  }
  return out
}

function advances(t, m) {
  const hmtx = t.get('hmtx')
  const out = new Array(m.glyphs)
  let last = 0
  for (let i = 0; i < m.glyphs; i += 1) {
    if (i < m.metricCount) last = hmtx.readUInt16BE(i * 4)
    out[i] = last
  }
  return out
}

/** codepoint -> glyph id. Prefers a full-plane format 12 subtable, then 4. */
function charmap(t) {
  const cmap = t.get('cmap')
  const count = cmap.readUInt16BE(2)
  let best = null
  for (let i = 0; i < count; i += 1) {
    const rec = 4 + i * 8
    const platform = cmap.readUInt16BE(rec)
    const encoding = cmap.readUInt16BE(rec + 2)
    const at = cmap.readUInt32BE(rec + 4)
    const format = cmap.readUInt16BE(at)
    const score =
      format === 12 ? 3 : platform === 3 && encoding === 1 ? 2 : format === 4 ? 1 : 0
    if (score > 0 && (!best || score > best.score)) best = { at, format, score }
  }
  if (!best) throw new Error('no usable cmap subtable')

  const map = new Map()

  if (best.format === 12) {
    const groups = cmap.readUInt32BE(best.at + 12)
    for (let g = 0; g < groups; g += 1) {
      const at = best.at + 16 + g * 12
      const from = cmap.readUInt32BE(at)
      const to = cmap.readUInt32BE(at + 4)
      const gid = cmap.readUInt32BE(at + 8)
      for (let c = from; c <= to; c += 1) map.set(c, gid + (c - from))
    }
    return map
  }

  const segs = cmap.readUInt16BE(best.at + 6) / 2
  const endAt = best.at + 14
  const startAt = endAt + segs * 2 + 2
  const deltaAt = startAt + segs * 2
  const rangeAt = deltaAt + segs * 2
  for (let s = 0; s < segs; s += 1) {
    const end = cmap.readUInt16BE(endAt + s * 2)
    const start = cmap.readUInt16BE(startAt + s * 2)
    const delta = cmap.readInt16BE(deltaAt + s * 2)
    const range = cmap.readUInt16BE(rangeAt + s * 2)
    if (start === 0xffff) continue
    for (let c = start; c <= end; c += 1) {
      let gid
      if (range === 0) {
        gid = (c + delta) & 0xffff
      } else {
        const at = rangeAt + s * 2 + range + (c - start) * 2
        if (at + 1 >= cmap.length) continue
        gid = cmap.readUInt16BE(at)
        if (gid !== 0) gid = (gid + delta) & 0xffff
      }
      if (gid !== 0) map.set(c, gid)
    }
  }
  return map
}

/* ==========================================================================
   Glyph outlines
   --------------------------------------------------------------------------
   A TrueType glyph is a set of closed contours of quadratic points, each on or
   off the curve. Two consecutive off-curve points imply an on-curve point at
   their midpoint; that implication is what the reader below reconstructs.
   ========================================================================== */

const ON_CURVE = 0x01
const X_SHORT = 0x02
const Y_SHORT = 0x04
const REPEAT = 0x08
const X_SAME = 0x10
const Y_SAME = 0x20

export function contours(t, loca, gid, depth = 0) {
  if (depth > 5) return []
  const glyf = t.get('glyf')
  const from = loca[gid]
  const to = loca[gid + 1]
  if (to <= from) return [] // blank glyph, e.g. a space

  const g = glyf.subarray(from, to)
  const shapeCount = g.readInt16BE(0)
  return shapeCount >= 0 ? simple(g, shapeCount) : composite(t, loca, g, depth)
}

function simple(g, shapeCount) {
  const ends = []
  for (let i = 0; i < shapeCount; i += 1) ends.push(g.readUInt16BE(10 + i * 2))
  const total = shapeCount === 0 ? 0 : ends[ends.length - 1] + 1

  let at = 10 + shapeCount * 2
  at += 2 + g.readUInt16BE(at) // skip the hinting programme

  const flags = new Uint8Array(total)
  for (let i = 0; i < total; ) {
    const flag = g.readUInt8(at)
    at += 1
    flags[i] = flag
    i += 1
    if (flag & REPEAT) {
      let n = g.readUInt8(at)
      at += 1
      while (n > 0 && i < total) {
        flags[i] = flag
        i += 1
        n -= 1
      }
    }
  }

  const read = (short, same) => {
    const out = new Int16Array(total)
    let value = 0
    for (let i = 0; i < total; i += 1) {
      const flag = flags[i]
      if (flag & short) {
        const delta = g.readUInt8(at)
        at += 1
        value += flag & same ? delta : -delta
      } else if (!(flag & same)) {
        value += g.readInt16BE(at)
        at += 2
      }
      out[i] = value
    }
    return out
  }

  const xs = read(X_SHORT, X_SAME)
  const ys = read(Y_SHORT, Y_SAME)

  const shapes = []
  let cursor = 0
  for (const end of ends) {
    const points = []
    for (let i = cursor; i <= end; i += 1) {
      points.push({ x: xs[i], y: ys[i], on: (flags[i] & ON_CURVE) !== 0 })
    }
    if (points.length) shapes.push(points)
    cursor = end + 1
  }
  return shapes
}

const ARGS_ARE_WORDS = 0x0001
const ARGS_ARE_XY = 0x0002
const HAS_SCALE = 0x0008
const MORE_PARTS = 0x0020
const HAS_XY_SCALE = 0x0040
const HAS_2X2 = 0x0080

function composite(t, loca, g, depth) {
  const shapes = []
  let at = 10
  let more = true
  while (more) {
    const flag = g.readUInt16BE(at)
    const part = g.readUInt16BE(at + 2)
    at += 4
    more = (flag & MORE_PARTS) !== 0

    let dx = 0
    let dy = 0
    if (flag & ARGS_ARE_WORDS) {
      if (flag & ARGS_ARE_XY) {
        dx = g.readInt16BE(at)
        dy = g.readInt16BE(at + 2)
      }
      at += 4
    } else {
      if (flag & ARGS_ARE_XY) {
        dx = g.readInt8(at)
        dy = g.readInt8(at + 1)
      }
      at += 2
    }

    const f2 = (o) => g.readInt16BE(o) / 16384
    let a = 1
    let b = 0
    let c = 0
    let d = 1
    if (flag & HAS_SCALE) {
      a = f2(at)
      d = a
      at += 2
    } else if (flag & HAS_XY_SCALE) {
      a = f2(at)
      d = f2(at + 2)
      at += 4
    } else if (flag & HAS_2X2) {
      a = f2(at)
      b = f2(at + 2)
      c = f2(at + 4)
      d = f2(at + 6)
      at += 8
    }

    for (const shape of contours(t, loca, part, depth + 1)) {
      shapes.push(
        shape.map((p) => ({
          x: a * p.x + c * p.y + dx,
          y: b * p.x + d * p.y + dy,
          on: p.on,
        })),
      )
    }
  }
  return shapes
}

/* ==========================================================================
   Geometry to path data
   ========================================================================== */

export function round(n) {
  const v = Math.round(n * 10) / 10
  return Object.is(v, -0) ? 0 : v
}

const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true })

function quad(c, p) {
  return 'Q' + round(c.x) + ' ' + round(c.y) + ' ' + round(p.x) + ' ' + round(p.y)
}

/**
 * Walks contours through `place` and emits path data.
 *
 * `place` maps a font-unit point to wherever the caller wants it. Keep it
 * affine — a rotation, a scale, a translation, or any combination. Quadratic
 * control points carry through an affine map untouched, so the letterform that
 * comes out is the letterform that went in. A non-affine map (bending each
 * point through a circle, say) shears the glyph and looks melted.
 */
export function toPath(shapes, place) {
  const out = []
  for (const shape of shapes) {
    const pts = shape.map(place)
    if (pts.length === 0) continue

    // A contour has to start somewhere on the curve. When every point is off
    // it, the implied midpoint between the last and the first is the start.
    const first = pts.findIndex((p) => p.on)
    const ring =
      first === -1
        ? [midpoint(pts[pts.length - 1], pts[0]), ...pts]
        : [...pts.slice(first), ...pts.slice(0, first)]

    const d = ['M' + round(ring[0].x) + ' ' + round(ring[0].y)]
    let control = null
    for (let i = 1; i <= ring.length; i += 1) {
      const p = ring[i % ring.length]
      if (p.on) {
        d.push(control ? quad(control, p) : 'L' + round(p.x) + ' ' + round(p.y))
        control = null
      } else {
        if (control) d.push(quad(control, midpoint(control, p)))
        control = p
      }
    }
    d.push('Z')
    out.push(d.join(''))
  }
  return out.join('')
}

export function bounds(shapes, place) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const shape of shapes) {
    for (const raw of shape) {
      const p = place(raw)
      if (p.x < x0) x0 = p.x
      if (p.y < y0) y0 = p.y
      if (p.x > x1) x1 = p.x
      if (p.y > y1) y1 = p.y
    }
  }
  return { x0, y0, x1, y1 }
}

/* ==========================================================================
   Entry
   ========================================================================== */

/** Reads a WOFF and returns everything the layout callers need from it. */
export function load(file) {
  const buf = readFileSync(file)
  const t = tables(buf)
  const m = metrics(t)
  return { t, m, loca: offsets(t, m), adv: advances(t, m), map: charmap(t) }
}
