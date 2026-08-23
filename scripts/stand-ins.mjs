#!/usr/bin/env node
/**
 * Stand-in artwork for /specimen — phase 2, task 2.14.
 *
 * The specimen route has to render every component in every state, and three
 * of them (the carousel, the tiles, the ledger chips) are picture components.
 * A picture component with no picture proves nothing: the crop, the fit, the
 * intrinsic-size contract and the label contrast are the parts most likely to
 * be wrong, and none of them are visible against an empty box.
 *
 * So this draws a small set of neutral, low-luminance plates offline.
 *
 * They are NOT the site's artwork. Phase 5 generates that, with its own
 * generator, at real resolutions, with real content. These exist to be
 * measured against.
 *
 * They live in app/assets/ rather than public/ on purpose: assets/ is
 * processed by the bundler and only emitted if something imports it, and the
 * only importer is the specimen fixture set, which is stripped from a
 * production build. public/ is copied wholesale and would ship them.
 *
 * USAGE
 *
 *   node scripts/stand-ins.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const out = fileURLToPath(new URL('../app/assets/plates/', import.meta.url))
mkdirSync(out, { recursive: true })

/**
 * The palette, as bytes. Kept low — every one of these sits behind cream type
 * at `type-h3`, and the tile label has to clear AA at every crop. Contrast is
 * a property of the design here, not a property of the picture.
 */
const INK = [
  [17, 4, 3],
  [47, 14, 9],
  [80, 22, 13],
  [150, 40, 23],
]

/** Deterministic noise, so re-running the generator does not churn the files. */
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * A diagonal field with a soft bloom and film grain. Four seeds, four plates
 * that are recognisably the same material and obviously not the same picture.
 */
function field(w, h, seed) {
  const rand = rng(seed)
  const px = Buffer.alloc(w * h * 3)
  const cx = 0.2 + rand() * 0.6
  const cy = 0.15 + rand() * 0.5
  const tilt = 0.4 + rand() * 1.2

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const u = x / w
      const v = y / h
      const d = Math.hypot(u - cx, (v - cy) * tilt)
      // Bloom falls off fast, so the corners stay near black.
      const glow = Math.max(0, 1 - d * 1.9) ** 2.2
      const band = 0.5 + 0.5 * Math.sin((u * 3.1 + v * 5.7 + seed) * 2.4)
      const t = Math.min(0.999, glow * 0.85 + band * 0.14)

      const slot = t * (INK.length - 1)
      const lo = INK[Math.floor(slot)]
      const hi = INK[Math.min(INK.length - 1, Math.floor(slot) + 1)]
      const f = slot - Math.floor(slot)

      const grain = (rand() - 0.5) * 9
      const at = (y * w + x) * 3
      for (let c = 0; c < 3; c += 1) {
        px[at + c] = Math.max(0, Math.min(255, lo[c] + (hi[c] - lo[c]) * f + grain))
      }
    }
  }

  return sharp(px, { raw: { width: w, height: h, channels: 3 } })
}

/** A concentric ring mark, for the ledger's overlapping chips. */
function ring(size, seed) {
  const rand = rng(seed)
  const px = Buffer.alloc(size * size * 4)
  const rings = 2 + Math.floor(rand() * 2)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const d = Math.hypot(x / size - 0.5, y / size - 0.5) * 2
      const on = d < 0.96 && Math.abs(Math.sin(d * rings * Math.PI)) > 0.55
      const at = (y * size + x) * 4
      px[at] = 236
      px[at + 1] = 231
      px[at + 2] = 224
      px[at + 3] = on ? 235 : 0
    }
  }

  return sharp(px, { raw: { width: size, height: size, channels: 4 } })
}

/**
 * A struck coin face, for GL scene 2 — phase 3, task 3.5.
 *
 * The medallion is the one GL scene that carries something, and until phase 5
 * bakes the real face there is nothing on it to judge: a featureless gold puck
 * proves that the disc rotates and rests, and proves nothing at all about
 * whether a ring band at that radius is READABLE at 375px, which is the only
 * question task 3.5 actually asks.
 *
 * So this draws the coin's structure with no type in it whatsoever — ticks
 * where the lettering will be, at the lettering's radius and cap height. It is
 * a ruler, not a draft of the artwork. Phase 5's generator replaces it with the
 * real bake, and that generator is the one that measures cap height and fails
 * the build under 7px.
 *
 * The same image is used as the colour map AND the bump map, so its mid grey
 * is the resting surface: darker sinks, lighter stands proud.
 */
function dial(size) {
  const px = Buffer.alloc(size * size * 3)

  const GROUND = 150
  const CUT = 58
  const RAISED = 214

  // Where the ring band sits, as a fraction of the radius. Phase 5's bake must
  // use the same two numbers or the stand-in stops being a measurement.
  const BAND = { inner: 0.66, outer: 0.86, ticks: 42 }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x / size - 0.5) * 2
      const dy = (y / size - 0.5) * 2
      const r = Math.hypot(dx, dy)
      const a = Math.atan2(dy, dx)

      let v = GROUND

      // The field: a six-lobed botanical relief under fine contour lines. It
      // reads as engraving from a metre away and as nothing in particular from
      // closer, which is what a coin field does.
      if (r < BAND.inner - 0.03) {
        const lobes = Math.cos(a * 6) * 0.5 + 0.5
        const swell = Math.max(0, 1 - r / (BAND.inner - 0.03))
        const contour = Math.sin(r * 46 + lobes * 3.2) * 0.5 + 0.5
        v = GROUND + (lobes * swell * 34) - contour * 16
      }

      // The ring band. Ticks stand in for the lettering: same radius, same
      // angular pitch, same stroke weight a capital would carry.
      if (r >= BAND.inner && r <= BAND.outer) {
        const pitch = (Math.PI * 2) / BAND.ticks
        const off = ((a + Math.PI) % pitch) / pitch
        const mid = Math.abs(off - 0.5) * 2
        const inset = r > BAND.inner + 0.03 && r < BAND.outer - 0.03
        v = inset && mid < 0.42 ? CUT : GROUND + 10
      }

      // The two hairlines that bound the band, and the beaded edge.
      if (Math.abs(r - BAND.inner) < 0.006 || Math.abs(r - BAND.outer) < 0.006) v = CUT
      if (r > 0.9 && r < 0.975) {
        const bead = Math.cos(a * 96) * 0.5 + 0.5
        v = GROUND + bead * 64 - 20
      }
      if (r >= 0.975) v = RAISED

      // The house mark's seat, centred. A blank boss, not an attempt at a logo.
      if (r < 0.17) v = r < 0.145 ? RAISED : CUT

      const at = (y * size + x) * 3
      px[at] = px[at + 1] = px[at + 2] = Math.max(0, Math.min(255, Math.round(v)))
    }
  }

  return sharp(px, { raw: { width: size, height: size, channels: 3 } })
}

const PLATE = { w: 640, h: 854 }
const DIAL = 1024
const MARK = 56

const made = []

for (let i = 1; i <= 4; i += 1) {
  const name = `plate-0${i}.webp`
  const buf = await field(PLATE.w, PLATE.h, i * 977).webp({ quality: 72 }).toBuffer()
  writeFileSync(out + name, buf)
  made.push([name, buf.length])
}

for (let i = 1; i <= 2; i += 1) {
  const name = `mark-0${i}.png`
  const buf = await ring(MARK, i * 311).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(out + name, buf)
  made.push([name, buf.length])
}

{
  const name = 'dial-01.png'
  const buf = await dial(DIAL).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(out + name, buf)
  made.push([name, buf.length])
}

const total = made.reduce((sum, [, bytes]) => sum + bytes, 0)
for (const [name, bytes] of made) {
  console.log(`  ${name.padEnd(16)} ${(bytes / 1024).toFixed(1).padStart(7)} KB`)
}
console.log(`\n  ${made.length} files, ${(total / 1024).toFixed(1)} KB total.`)
console.log('  Dev-only. Not shipped — nothing in a production build imports them.\n')
