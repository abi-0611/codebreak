/**
 * The hero backdrop's still frame, drawn offline — phase 11 §11.3.0.
 *
 * `plates['still-01']` is what a reader sees when the GL gate refuses (a
 * four-core phone, Save-Data, no WebGL2) and what EVERY reader on
 * `prefers-reduced-motion` sees. It is not a placeholder and it is not an
 * error path: it is one of the two pictures this site ships, and §11.9 asks
 * that it look like the shader it stands in for.
 *
 * So this is a port of app/composables/scenes/drift.ts's pixel stage to the
 * CPU, reading every constant from `tokens/field.mjs` and every tone from
 * `tokens/palette.mjs`. There is no second copy of a number anywhere in it.
 * Change the shader and re-run the generator, and the fallback follows.
 *
 * WHAT IT IS NOT: a frame-accurate copy of what the GPU would draw at the same
 * instant. `hash()` is deliberately chaotic — it multiplies coordinates
 * together and keeps the fractional part — so evaluating it in float64 here
 * and in `highp float` there diverges after a few operations, and would
 * diverge again between two GPUs. What is reproducible, and what actually
 * matters, is the FIELD: same noise construction, same warp, same ridge
 * exponents, same seam mask, same vertical hue ramp, same exposure. The still
 * is a different sample of the same stone, which is all the live scene is at
 * any two instants anyway.
 *
 * WHY IT IS LANDSCAPE, when the phase 3 still was 900×1200 portrait. <Plate/>
 * renders with `object-cover`, so the hero box crops whichever dimension is
 * relatively larger — and the hue ramp is VERTICAL, which makes cropping the
 * sides free and cropping the top and bottom expensive. A 3:2 frame loses
 * about 5% of its height on a 1440×860 desktop and none of it on a 375×812
 * phone, where it crops horizontally instead. The portrait frame lost 55% of
 * the ramp on a desktop, which is most of the thing this phase added.
 */
import { CLOCK, EXPOSE, FREEZE, OCTAVES, RAMP, SEAM } from '../../tokens/field.mjs'
import { ink, palette } from '../../tokens/palette.mjs'

/* -------------------------------------------------------------------------- */
/* the GLSL builtins this stage uses, and nothing more                        */
/* -------------------------------------------------------------------------- */

const fract = (x) => x - Math.floor(x)
const mix = (a, b, t) => a + (b - a) * t
const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x)

/**
 * GLSL's smoothstep, INCLUDING the case the vignette depends on.
 *
 * `smoothstep(1.75, 0.38, x)` has its edges the wrong way round on purpose —
 * that is how the shader inverts the ramp without a `1.0 -`. The division by
 * `e1 - e0` handles it for free, so this must not be written with a
 * `Math.min/Math.max` guard on the edges. A "helpful" guard here would light
 * the corners of the still and leave the shader's dark.
 */
function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** 1 - |n| on the SIGNED field. The fold that makes a vein a vein. */
const ridge = (n) => 1 - Math.abs(n)
/** Back to 0..1, for the places that want a level rather than a crease. */
const level = (n) => 0.5 + 0.5 * n

/* -------------------------------------------------------------------------- */
/* the field                                                                  */
/* -------------------------------------------------------------------------- */

/** drift.ts's hash(), scalarised — no vec3 allocation on a 960k-pixel loop. */
function hash(x, y, z) {
  let px = fract(x * 0.3183099 + 0.1)
  let py = fract(y * 0.3183099 + 0.1)
  let pz = fract(z * 0.3183099 + 0.1)
  px *= 17
  py *= 17
  pz *= 17
  return fract(px * py * pz * (px + py + pz))
}

function noise(x, y, z) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  let fx = x - ix
  let fy = y - iy
  let fz = z - iz
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  fz = fz * fz * (3 - 2 * fz)

  const c000 = hash(ix, iy, iz)
  const c100 = hash(ix + 1, iy, iz)
  const c010 = hash(ix, iy + 1, iz)
  const c110 = hash(ix + 1, iy + 1, iz)
  const c001 = hash(ix, iy, iz + 1)
  const c101 = hash(ix + 1, iy, iz + 1)
  const c011 = hash(ix, iy + 1, iz + 1)
  const c111 = hash(ix + 1, iy + 1, iz + 1)

  return mix(
    mix(mix(c000, c100, fx), mix(c010, c110, fx), fy),
    mix(mix(c001, c101, fx), mix(c011, c111, fx), fy),
    fz,
  )
}

/**
 * SIGNED octaves, centred on zero — the detail the whole picture depends on.
 *
 * Summing unsigned noise gives a field that hovers near 0.5 with a narrow
 * spread, so a fold taken at its midpoint is close to its maximum almost
 * everywhere and the veins cover the screen instead of cutting across it.
 * Centring each octave first spreads the field over roughly [-1, 1], and the
 * fold then keeps only the neighbourhood of the ZERO SET — which in two
 * dimensions is a curve, not a region.
 */
function turb(x, y, z, turns) {
  let sum = 0
  let amp = 0.5
  let px = x
  let py = y
  let pz = z
  for (let i = 0; i < turns; i += 1) {
    sum += amp * (noise(px, py, pz) * 2 - 1)
    px *= 2.03
    py *= 2.03
    pz *= 2.03
    amp *= 0.5
  }
  return sum
}

/* -------------------------------------------------------------------------- */
/* the clock, frozen                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Where the two time terms sit at a given instant.
 *
 * Exported so the generator can assert that `FREEZE` is still the middle of
 * the clock. A constant that quietly stops being the middle — because somebody
 * retuned `breath` and not `FREEZE` — is exactly the sort of thing that goes
 * unnoticed for two phases and then reads as "the fallback looks wrong".
 */
export function clockAt(time) {
  return {
    breath: 0.5 + 0.5 * Math.sin(time * CLOCK.breath),
    wander:
      0.5 +
      0.25 * Math.sin(time * CLOCK.hue) +
      0.25 * Math.sin(time * CLOCK.sway + CLOCK.phase),
  }
}

/* -------------------------------------------------------------------------- */
/* the pixel stage                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Draws the field at `w × h` and hands back a raw RGB buffer, ready for
 * `sharp(buf, { raw: { width, height, channels: 3 } })`.
 *
 * The output is NOT tone mapped and NOT colour converted, which matches the
 * live scene exactly: a custom ShaderMaterial does not receive three.js's
 * `tonemapping_fragment` or `colorspace_fragment` includes — they are pulled in
 * by the built-in materials and drift.ts is not one — so what the shader writes
 * lands on the canvas unconverted, and `ink()` hands back sRGB floats straight
 * off the palette record. Multiplying by 255 here is the same arithmetic the
 * GPU does.
 *
 * @param {number} w
 * @param {number} h
 * @param {number} [time] instant on the field's clock; defaults to FREEZE
 */
export function stone(w, h, time = FREEZE) {
  const data = Buffer.alloc(w * h * 3)

  const short = Math.max(1, Math.min(w, h))
  const aspectX = w / short
  const aspectY = h / short

  const crest = ink(palette['brown-lifted'], -83)
  const crestWarm = ink(palette['brown-lifted'], -41)
  const base = ink(palette['brown-lifted'], -5)
  const baseWarm = ink(palette['brown-lifted'], 37)
  const pale = ink(palette.white)

  // The two clock terms are constant across a frame, so they are lifted out of
  // the loop rather than recomputed 960,000 times.
  const { breath, wander } = clockAt(time)
  const gate = mix(SEAM.shut, SEAM.open, breath)

  const toneTopR = mix(crest[0], crestWarm[0], wander)
  const toneTopG = mix(crest[1], crestWarm[1], wander)
  const toneTopB = mix(crest[2], crestWarm[2], wander)
  const toneLowR = mix(base[0], baseWarm[0], wander)
  const toneLowG = mix(base[1], baseWarm[1], wander)
  const toneLowB = mix(base[2], baseWarm[2], wander)

  const t = time * 0.03
  const driftZ = time * 0.02

  let at = 0
  for (let y = 0; y < h; y += 1) {
    // uv.y runs UP the quad, so image row 0 is the top of the viewport.
    const vy = 1 - (y + 0.5) / h
    const uvY = (vy - 0.5) * aspectY
    const pY = uvY * 2.6
    // The ramp is screen space, not the aspect-corrected field: it is a
    // property of the frame the reader is looking at rather than of the stone
    // inside it, so a wider viewport must not stretch it out of the picture.
    const rampAt = smoothstep(RAMP.from, RAMP.to, 1 - vy)

    for (let x = 0; x < w; x += 1) {
      const uvX = ((x + 0.5) / w - 0.5) * aspectX
      const pX = uvX * 2.6

      const warpX = turb(pX, pY, t, OCTAVES.warp)
      const warpY = turb(pX + 5.2, pY + 1.3, t + 2.1, OCTAVES.warp)
      const warpZ = turb(pX + 1.7, pY + 9.2, t + 4.4, OCTAVES.warp)

      // Domain warping is what stops the veins reading as a noise texture. The
      // field is sampled at a position the field itself displaced, so the
      // creases curve, double back and pinch the way a mineral seam does.
      const qX = pX + warpX * 0.85
      const qY = pY + warpY * 0.85
      const qZ = t + warpZ * 0.85

      const wide = ridge(turb(qX, qY, qZ, OCTAVES.vein))
      const hair = ridge(turb(qX * 3.6 + 11, qY * 3.6 + 3, qZ * 3.6, OCTAVES.hair))

      const seam =
        SEAM.floor +
        (1 - SEAM.floor) *
          smoothstep(
            gate,
            gate + SEAM.width,
            level(
              turb(
                pX * 0.34 + warpX * 0.3,
                pY * 0.34 + warpY * 0.3,
                t * 0.34 + warpZ * 0.3,
                OCTAVES.band,
              ),
            ),
          )

      const pulse =
        0.35 +
        0.85 * level(turb(qX * 1.15 + 3, qY * 1.15 + 7, qZ * 1.15, OCTAVES.warp))

      const core = Math.pow(wide, EXPOSE.core) * seam * pulse
      const fine = Math.pow(hair, EXPOSE.hair) * EXPOSE.hairGain * seam
      const halo = Math.pow(wide, EXPOSE.halo) * EXPOSE.haloGain * seam

      const slab = smoothstep(
        0.55,
        0.95,
        level(
          turb(pX * 0.5 + warpX * 0.5, pY * 0.5 + warpY * 0.5, t * 0.5 + warpZ * 0.5, OCTAVES.band),
        ),
      )

      const drift = level(
        turb(pX * 0.42, pY * 0.42, t * 0.42 + driftZ, OCTAVES.band),
      )
      // The jitter is on the ramp COORDINATE and then clamped, never on the
      // hue. That is the whole reason the field cannot leave the arc.
      const fall = clamp(rampAt + (drift - 0.5) * RAMP.jitter, 0, 1)

      const toneR = mix(toneTopR, toneLowR, fall)
      const toneG = mix(toneTopG, toneLowG, fall)
      const toneB = mix(toneTopB, toneLowB, fall)

      const spark = Math.pow(wide, EXPOSE.spark) * seam * pulse
      const lit = core * 1.9 + fine * 1.2 + halo

      let r = (toneR * lit + toneR * slab * EXPOSE.slabGain) * EXPOSE.gain
      let g = (toneG * lit + toneG * slab * EXPOSE.slabGain) * EXPOSE.gain
      let b = (toneB * lit + toneB * slab * EXPOSE.slabGain) * EXPOSE.gain

      r += pale[0] * spark * EXPOSE.sparkGain
      g += pale[1] * spark * EXPOSE.sparkGain
      b += pale[2] * spark * EXPOSE.sparkGain

      // The corners go to black. Not decoration: the headline and the stats box
      // sit over this, and a vein running under cream type at full brightness
      // is the one way a backdrop can cost the page its contrast ratio.
      const vig = smoothstep(1.75, 0.38, Math.hypot(uvX * 0.85, uvY))
      r *= vig
      g *= vig
      b *= vig

      data[at] = clamp(Math.round(r * 255), 0, 255)
      data[at + 1] = clamp(Math.round(g * 255), 0, 255)
      data[at + 2] = clamp(Math.round(b * 255), 0, 255)
      at += 3
    }
  }

  return { data, width: w, height: h, channels: 3 }
}

/* -------------------------------------------------------------------------- */
/* the self-check                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The same three exposure numbers §11.9 measures off the live scene, computed
 * over the raw buffer before it is encoded.
 *
 * The generator prints these next to the shader's own measured bands, which is
 * the only way anybody notices that the fallback and the thing it stands in
 * for have drifted apart. Reduced motion is the one state nobody browses in
 * while they are building, so it is the one state that silently rots.
 *
 * `lit` uses the §11.1 chroma filter — max(r,g,b) ≥ 22 AND saturation ≥ 0.40 —
 * rather than a luminance test, because that is what removes cream text from a
 * screenshot and it has to be the same filter for the two columns to be
 * comparable. There is no cream text in THIS buffer, but a number measured a
 * different way is a number that cannot be put beside the other one.
 */
export function exposure({ data, width, height }) {
  const n = width * height
  let lit = 0
  let dark = 0
  let mid = 0

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if (L < 25.5) dark += 1
    else if (L <= 128) mid += 1

    const hi = Math.max(r, g, b)
    if (hi < 22) continue
    if ((hi - Math.min(r, g, b)) / hi < 0.4) continue
    lit += 1
  }

  return {
    lit: (lit / n) * 100,
    dark: (dark / n) * 100,
    mid: (mid / n) * 100,
  }
}
