/**
 * The WebGL layer's gate, lifecycle and shared material — task 3.7.
 *
 * Three scenes on mid-range Android is the largest performance risk in the
 * build (rule 9), and one of them carries one of the six terms. So whether
 * to run GL at all is made ONCE, here, before three.js is even fetched — and
 * it is made for every scene by the same five tests, so no scene can quietly
 * be the exception.
 *
 * THE IMPORT IS DYNAMIC ON PURPOSE. three.js is roughly 600 KB minified. A
 * reader who fails the gate never downloads a byte of it, which is the only
 * honest reading of "a scene that cannot play is a scene that must not be
 * downloaded" (see app/composables/media.ts). Doing the gate first and the
 * import second is the whole design.
 *
 * WHAT IS NOT HERE: a requestAnimationFrame loop. Every scene draws from
 * `useFrame`, which is gsap.ticker, which is the same clock Lenis and
 * ScrollTrigger run on. See motion.ts §8.
 */
import type * as GL from 'three'
import { palette } from '~~/tokens/palette.mjs'
import { useFrame, scrollRoot } from '~/composables/motion'

export type Three = typeof GL

export type Kit = {
  THREE: Three
  renderer: GL.WebGLRenderer
  width: number
  height: number
}

export type Parts = {
  /** Called once per frame, from the site's single ticker. */
  draw: (time: number, delta: number) => void
  /** Called on mount and on every resize, with the CSS box in px. */
  size?: (width: number, height: number) => void
  /** Release geometries, materials and textures. Called exactly once. */
  drop: () => void
}

export type Build = (kit: Kit) => Parts

/**
 * Backing-store ceiling. A 3× phone painting a full-screen filament field at
 * native density is drawing nine times the pixels of a 1× one for a difference
 * nobody can see through additive blending. Teardown §9 measures the reference
 * doing exactly this.
 */
const DPR_CAP = 2

/* -------------------------------------------------------------------------- */
/* the gate — task 3.7                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The five conditions, in the order they are cheapest to test.
 *
 * `hardwareConcurrency <= 4` is deliberately blunt and will refuse GL to some
 * machines that could have managed it. That is the correct direction to be
 * wrong in: the cost of refusing is a static frame that carries the same
 * information, and the cost of accepting is a marked scene at 8fps.
 *
 * The WebGL2 test runs on a throwaway canvas and hands the context straight
 * back, so probing never costs the page one of the browser's limited live
 * contexts.
 */
export function capable(): boolean {
  if (!import.meta.client) return false

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  const net = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (net?.saveData) return false

  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores <= 4) return false

  const probe = document.createElement('canvas')
  const ctx = probe.getContext('webgl2')
  if (!ctx) return false
  ctx.getExtension('WEBGL_lose_context')?.loseContext()

  return true
}

/* -------------------------------------------------------------------------- */
/* colour, derived — never a literal                                          */
/* -------------------------------------------------------------------------- */

/**
 * A palette token as linear-ish RGB floats, with an optional hue rotation.
 *
 * "No inline hex, anywhere" is a CLAUDE.md rule and a shader is not an
 * exemption from it. Every colour the GL layer emits starts at
 * tokens/palette.mjs and is transformed here, so the scenes stay on the same
 * record as the stylesheet and there is no second place a colour can be
 * changed.
 *
 * The rotation exists for one reason: teardown §9 describes the scenes as red,
 * gold AND magenta, and the site has no magenta token — it is not a colour any
 * text or edge is ever set in, so putting it in the palette would be inventing
 * a token to satisfy one shader. Rotating the red is the honest way to say
 * "this hue, moved".
 */
export function ink(hex: string, turn = 0): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  if (!turn) return [r, g, b]

  const hi = Math.max(r, g, b)
  const lo = Math.min(r, g, b)
  const l = (hi + lo) / 2
  const span = hi - lo
  if (!span) return [r, g, b]

  const s = l > 0.5 ? span / (2 - hi - lo) : span / (hi + lo)
  let h = 0
  if (hi === r) h = ((g - b) / span + (g < b ? 6 : 0)) / 6
  else if (hi === g) h = ((b - r) / span + 2) / 6
  else h = ((r - g) / span + 4) / 6

  h = (h + turn / 360 + 1) % 1

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const lane = (t: number) => {
    const u = (t + 1) % 1
    if (u < 1 / 6) return p + (q - p) * 6 * u
    if (u < 1 / 2) return q
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6
    return p
  }

  return [lane(h + 1 / 3), lane(h), lane(h - 1 / 3)]
}

/**
 * The tints every scene is drawn from. Gold, the red, the magenta — and a
 * white that exists for one specific reason.
 *
 * On a MeshStandardMaterial at `metalness: 1` there is no diffuse term, so
 * `color` is not a colour: it is a filter over the reflection. Tinting the
 * struck objects gold therefore multiplies the environment by a value whose
 * blue channel is 0x09, which annihilates the magenta and leaves a disc that
 * is red all over — the gradient teardown §9 describes, deleted by the thing
 * that was supposed to produce it. So the metal is filtered by white and the
 * environment carries the whole gradient.
 */
export const EMBERS = {
  gold: () => ink(palette.gold),
  red: () => ink(palette['brown-lifted']),
  far: () => ink(palette['brown-lifted'], -50),
  pale: () => ink(palette.white),
} as const

/* -------------------------------------------------------------------------- */
/* the metal — teardown §9                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The environment map both struck-metal scenes reflect.
 *
 * Teardown §9 finds three.js's PMREM `SphericalGaussianBlur` shader in the
 * reference's bundle, which is the tell that a real `PMREMGenerator` is doing
 * the metal. This is that, fed a 64×32 gradient built in memory rather than an
 * HDR file: gold overhead, magenta through the middle, the red beneath, plus
 * one soft key so the surface has something to catch as it turns.
 *
 * It costs no network bytes and no decode. An .hdr would cost both, to look
 * very slightly better on a surface that is 220px wide.
 */
export function forge(THREE: Three, renderer: GL.WebGLRenderer): GL.Texture {
  const W = 64
  const H = 32
  const data = new Uint8Array(W * H * 4)

  /**
   * The ramp, as stops down the sphere.
   *
   * GOLD SITS ON THE EQUATOR, and that is not an aesthetic preference. A disc
   * facing the viewer reflects the part of the environment BEHIND the viewer,
   * which on an equirectangular map is the middle band. Whatever colour is
   * parked there is the colour the medallion reads as; magenta at the equator
   * produced a coin that was magenta from edge to edge. The shallow dome on
   * the face then sweeps the reflected direction a little either side of the
   * equator, which is what turns three stops into teardown §9's gradient:
   * magenta toward the top edge, gold through the field, red at the base.
   */
  const stops: Array<[number, readonly [number, number, number]]> = [
    [0, EMBERS.far()],
    [0.38, EMBERS.gold()],
    [0.6, EMBERS.gold()],
    [1, EMBERS.red()],
  ]

  const along = (v: number) => {
    let i = 0
    while (i < stops.length - 2 && v > stops[i + 1]![0]) i += 1
    const [av, a] = stops[i]!
    const [bv, b] = stops[i + 1]!
    const t = bv === av ? 0 : Math.min(1, Math.max(0, (v - av) / (bv - av)))
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as const
  }

  for (let y = 0; y < H; y += 1) {
    const v = y / (H - 1)
    const [r, g, b] = along(v)

    for (let x = 0; x < W; x += 1) {
      const u = x / (W - 1)
      // One soft key light, up and to the left of the viewer.
      const key = Math.exp(-(((u - 0.3) ** 2) / 0.012 + ((v - 0.26) ** 2) / 0.006))
      const gain = 0.8 + key * 2.4

      const at = (y * W + x) * 4
      data[at] = Math.min(255, r * 255 * gain)
      data[at + 1] = Math.min(255, g * 255 * gain)
      data[at + 2] = Math.min(255, b * 255 * gain)
      data[at + 3] = 255
    }
  }

  const ramp = new THREE.DataTexture(data, W, H, THREE.RGBAFormat)
  ramp.colorSpace = THREE.SRGBColorSpace
  ramp.mapping = THREE.EquirectangularReflectionMapping
  ramp.needsUpdate = true

  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromEquirectangular(ramp).texture
  pmrem.dispose()
  ramp.dispose()

  return env
}

/* -------------------------------------------------------------------------- */
/* the rest attitude — task 3.5                                               */
/* -------------------------------------------------------------------------- */

/**
 * Maps 0..1 progress to a -1..1 swing that is exactly 0 across a middle band.
 *
 * This is rule 5 written as arithmetic. The medallion carries a term on its
 * face, so it must pass through a face-on attitude and REST there rather than
 * tumbling continuously — and "rest" has to mean a range of scroll positions, a
 * quarter of the section's crossing, not an instant somebody has to stop on.
 *
 * The house mark uses the identical rule with the identical band, even though
 * it carries nothing. A set whose members behave differently has one member
 * everybody looks at.
 */
export function plateau(at: number, from: number, to: number): number {
  if (at < from) return from > 0 ? (at - from) / from : 0
  if (at > to) return to < 1 ? (at - to) / (1 - to) : 0
  return 0
}

/* -------------------------------------------------------------------------- */
/* the lifecycle                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Builds a scene if the gate allows it, draws it from the site's ticker, and
 * tears the whole thing down on unmount or on context loss.
 *
 * `live` is what <Scene/> binds: it is false through the server render and the
 * first client render — so the static frame is what ships in the HTML — and it
 * flips only after the first frame has actually been drawn. Swapping on "the
 * renderer exists" instead would show one black frame between the still going
 * and the scene arriving.
 *
 * On context loss the `preventDefault()` that would invite a restore is
 * deliberately NOT called. Task 3.7: swap to the static frame, and do not
 * retry. A context that was lost once on this hardware will be lost again, and
 * a scene that flickers between live and still is worse than one that does not
 * run.
 */
export function useGL(
  wrap: Ref<HTMLElement | null>,
  glass: Ref<HTMLCanvasElement | null>,
  build: Build,
  opts: { flat?: () => boolean } = {},
) {
  const live = ref(false)

  let renderer: GL.WebGLRenderer | null = null
  let parts: Parts | null = null
  let box: ResizeObserver | null = null
  let seen: IntersectionObserver | null = null
  let gone = false
  let first = true

  const frame = useFrame((time, delta) => {
    if (!parts) return
    parts.draw(time, delta)
    if (first) {
      first = false
      live.value = true
    }
  })
  frame.hold()

  function measure() {
    const host = wrap.value
    if (!host || !renderer) return
    const w = Math.max(1, Math.round(host.clientWidth))
    const h = Math.max(1, Math.round(host.clientHeight))
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP))
    // updateStyle left on: the canvas carries an inline px size, exactly as
    // teardown §9 measures the reference's three canvases doing.
    renderer.setSize(w, h, true)
    parts?.size?.(w, h)
  }

  function stop() {
    if (gone) return
    gone = true
    frame.hold()
    live.value = false

    box?.disconnect()
    box = null
    seen?.disconnect()
    seen = null
    glass.value?.removeEventListener('webglcontextlost', onLost)

    parts?.drop()
    parts = null
    renderer?.dispose()
    renderer?.forceContextLoss()
    renderer = null
  }

  function onLost() {
    stop()
  }

  onMounted(async () => {
    if (opts.flat?.() || !capable()) return

    const host = wrap.value
    const canvas = glass.value
    if (!host || !canvas) return

    const THREE = await import('three')
    // The await is a gap. A fast reader can leave the route inside it.
    if (gone || !wrap.value) return

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.setClearAlpha(0)

    canvas.addEventListener('webglcontextlost', onLost)

    const width = Math.max(1, Math.round(host.clientWidth))
    const height = Math.max(1, Math.round(host.clientHeight))
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP))
    renderer.setSize(width, height, true)

    try {
      parts = build({ THREE, renderer, width, height })
    } catch {
      // A scene that cannot be built is a scene that does not run. The still
      // frame is already on screen and stays there.
      stop()
      return
    }

    box = new ResizeObserver(measure)
    box.observe(host)

    // A canvas advancing behind five sections of page is pure battery. The
    // root is the real scroller, which on a coarse pointer is not the window.
    const root = scrollRoot()
    seen = new IntersectionObserver(
      (rows) => {
        const on = rows.some((row) => row.isIntersecting)
        if (on) frame.run()
        else frame.hold()
      },
      { root: root instanceof Element ? root : null, rootMargin: '20%' },
    )
    seen.observe(host)
  })

  onBeforeUnmount(stop)

  return { live }
}
