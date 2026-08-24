/**
 * GL scene 4 — the closing panel's struck sequence. Phase 11 §11.3.2.
 *
 * Four beats across the section's crossing:
 *
 *   0  a single disc, tumbling
 *   1  the disc breaking into pieces
 *   2  the pieces resolving into TWO objects, side by side
 *   3  both rotating in place
 *
 * ONE SET OF PIECES, THREE ARRANGEMENTS, AND NOTHING ELSE. The whole sequence
 * is a pair of interpolations between three cached attitudes per piece —
 * `whole`, `burst`, `pair` — so there is no timeline, no morph target, and
 * nothing that can be left half-played by a reader who reverses. Position and
 * rotation are pure functions of one scalar, exactly as `usePin`'s step is.
 *
 * WHY THE DISC IS TWO LAMINATED LAYERS. The beat that is easy to get wrong is
 * the third: pieces that flew off a single disc cannot reassemble into two
 * complete discs, because there is not enough of them — six sixty-degree
 * wedges make one disc, not two. Every way around that is a cheat: fading in
 * two solid coins, scaling wedges until the gaps close, or leaving two
 * gap-toothed rosettes and hoping nobody looks.
 *
 * So the single disc is built as TWO complete six-wedge discs stacked face to
 * face, each half the finished thickness. It reads as one struck blank because
 * it is one silhouette at one radius; it comes apart into exactly the two
 * objects the fourth beat needs because that is what it was; and every piece
 * travels the whole way rather than appearing or disappearing. A laminated
 * blank that delaminates is also, as it happens, a real thing a die does.
 *
 * ON THE METAL. Filtered white against a tinted environment — `forge()` in
 * gl.ts carries the whole gradient. At `metalness: 1` there is no diffuse
 * term, so `color` is a FILTER over the reflection: tinting these gold would
 * multiply the environment by a blue channel of 0x09 and delete the gradient
 * the tint was meant to produce. This is the same trap disc.ts and mark.ts
 * document, and it is worth restating because it looks like a colour and
 * behaves like a mask.
 *
 * ON THE ROTATION, AND PHASE 5's REST RULE. The medallion and the house mark
 * both come to rest face-on, and that rule exists so the object that carries
 * something is not the only object on the page that stops. These two coins
 * turn continuously instead, and that does not weaken it: the rule binds the
 * SET of lone struck objects each sitting in its own section, and both members
 * of that set still rest. These are a four-beat sequence inside a media frame,
 * they carry nothing, and §11.3.2 asks for them to be "rotating in place".
 *
 * Their turn is TIME-driven, not scroll-driven — §11.2 invariant 5. Scroll
 * owns the assembly; the ticker owns the spin. A single scalar doing both is a
 * scalar somebody will hand the wrong clock within a week.
 */
import type * as GL from 'three'
import { EMBERS, forge, type Build, type Kit } from '~/composables/gl'

/** Six wedges to a disc, two discs laminated. Twelve pieces in all. */
const WEDGES = 6
const RADIUS = 1
/** The finished blank. Each layer is half of it. */
const THICK = 0.26
/**
 * Face curvature, as a fraction of the radius — disc.ts's `DOME`, for disc.ts's
 * reason, and it is not decoration.
 *
 * A FLAT metal reflects ONE point of the environment, so it comes out one flat
 * colour however it is turned, and teardown §9's gradient never appears. The
 * first build of this scene used `CylinderGeometry` wedges and produced exactly
 * that: a solid gold circle at the first beat and flat gold shards at the
 * second. Curving each face by a fifteenth of its radius sweeps the reflected
 * direction across the ramp, which is what makes a struck coin look struck.
 *
 * Negative in effect — the field is RECESSED and the rim stands proud, which is
 * what a die does to a blank.
 */
const DOME = 0.065

/**
 * Where each beat hands over to the next, as a fraction of the crossing.
 *
 * The first quarter is deliberately dead — the panel is still arriving at the
 * bottom of the viewport there, and a sequence that has already broken apart
 * by the time it is looked at reads as a loop rather than as an event.
 */
const BEAT = { hold: 0.26, apart: 0.5, joined: 0.74 } as const

/** The two finished coins: how far apart, and how much smaller. */
const PAIR = { gap: 0.86, scale: 0.72, lean: 0.17 } as const

/** Idle rotation, in radians per second. Opposed, so the two read as a pair
 *  rather than as one object rendered twice. */
const SPIN = { a: 0.34, b: -0.27 } as const

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/**
 * Deterministic per-piece jitter for the burst.
 *
 * Not `Math.random()`. The burst has to be the same arrangement on every load
 * and on every machine, or the still frame that stands in for this scene is a
 * picture of one particular run — and a reader who reloads mid-sequence would
 * watch the pieces jump to a different explosion.
 */
function jitter(i: number, salt: number) {
  const n = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

/**
 * A SOLID, DOMED WEDGE — six surfaces, built by hand.
 *
 * `CylinderGeometry` with a `thetaLength` looks like the obvious way to cut a
 * slice out of a disc and is not: three.js generates the torso arc and the two
 * cap sectors, and NOTHING for the two radial faces where the slice was cut.
 * The result is an open shell, which is why the first build of this scene read
 * as paper shards — every piece was hollow, and the burst is exactly the beat
 * that shows you the inside of things.
 *
 * So the wedge is authored here: a domed front, a domed back, the arc rim, and
 * the two flat radial walls. That also puts the dome within reach, which a
 * cylinder cap could never have been — its cap is a two-ring fan, and a domed
 * two-ring fan is a cone.
 *
 * NORMALS ARE WRITTEN, NOT COMPUTED. `computeVertexNormals()` on a non-indexed
 * buffer flat-shades everything, which facets the dome; on an indexed one it
 * smooths the normals across the rim edge, rounding off the one edge that has to stay
 * sharp. The dome's normal has a closed form — the surface is `z = k·r²`, so
 * its slope is `2kr` — and the walls' normals are constants. Writing both is
 * shorter than arguing with either default.
 */
function wedge(THREE: Kit['THREE'], span: number, rings = 7, arcs = 14) {
  const half = THICK / 4
  const pos: number[] = []
  const nor: number[] = []

  /** Height of the domed face above its own plane, at radius r. */
  const lift = (r: number) => -DOME * (1 - (r / RADIUS) ** 2)
  /** d(lift)/dr — the slope the face normal is built from. */
  const slope = (r: number) => (2 * DOME * r) / RADIUS ** 2

  const put = (p: number[], n: number[]) => {
    pos.push(p[0]!, p[1]!, p[2]!)
    nor.push(n[0]!, n[1]!, n[2]!)
  }

  const tri = (a: number[], b: number[], c: number[], na: number[], nb: number[], nc: number[]) => {
    put(a, na)
    put(b, nb)
    put(c, nc)
  }

  /** A point on one domed face, and the normal there. */
  const face = (r: number, a: number, side: 1 | -1) => {
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    const z = side * (half + lift(r))
    // The surface rises toward the rim, so the normal leans INWARD along the
    // radius. `side` flips the whole thing for the back face.
    const s = slope(r)
    const len = Math.hypot(s, 1)
    const n = [(-s * Math.cos(a)) / len, (-s * Math.sin(a)) / len, side / len]
    return { p: [x, y, z], n }
  }

  // The two domed faces.
  for (const side of [1, -1] as const) {
    for (let i = 0; i < rings; i += 1) {
      for (let j = 0; j < arcs; j += 1) {
        const r0 = (RADIUS * i) / rings
        const r1 = (RADIUS * (i + 1)) / rings
        const a0 = (span * j) / arcs
        const a1 = (span * (j + 1)) / arcs

        const p00 = face(r0, a0, side)
        const p10 = face(r1, a0, side)
        const p11 = face(r1, a1, side)
        const p01 = face(r0, a1, side)

        // Wound the other way on the back, so both faces point outward.
        if (side === 1) {
          tri(p00.p, p10.p, p11.p, p00.n, p10.n, p11.n)
          tri(p00.p, p11.p, p01.p, p00.n, p11.n, p01.n)
        } else {
          tri(p00.p, p11.p, p10.p, p00.n, p11.n, p10.n)
          tri(p00.p, p01.p, p11.p, p00.n, p01.n, p11.n)
        }
      }
    }
  }

  // The arc rim. Flat radially, so it catches the key light as a hard edge —
  // which is what separates one piece from the next while they are still close
  // together.
  for (let j = 0; j < arcs; j += 1) {
    const a0 = (span * j) / arcs
    const a1 = (span * (j + 1)) / arcs
    const top = half + lift(RADIUS)
    const c0 = [Math.cos(a0) * RADIUS, Math.sin(a0) * RADIUS]
    const c1 = [Math.cos(a1) * RADIUS, Math.sin(a1) * RADIUS]
    const n0 = [Math.cos(a0), Math.sin(a0), 0]
    const n1 = [Math.cos(a1), Math.sin(a1), 0]

    tri([c0[0]!, c0[1]!, top], [c0[0]!, c0[1]!, -top], [c1[0]!, c1[1]!, -top], n0, n0, n1)
    tri([c0[0]!, c0[1]!, top], [c1[0]!, c1[1]!, -top], [c1[0]!, c1[1]!, top], n0, n1, n1)
  }

  // The two radial walls — the cut faces. These are the surfaces a partial
  // cylinder leaves out.
  for (const [a, out] of [[0, -1], [span, 1]] as const) {
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    const n = [-Math.sin(a) * out, Math.cos(a) * out, 0]

    for (let i = 0; i < rings; i += 1) {
      const r0 = (RADIUS * i) / rings
      const r1 = (RADIUS * (i + 1)) / rings
      const z0 = half + lift(r0)
      const z1 = half + lift(r1)
      const q = [
        [dx * r0, dy * r0, z0],
        [dx * r1, dy * r1, z1],
        [dx * r1, dy * r1, -z1],
        [dx * r0, dy * r0, -z0],
      ]
      if (out === 1) {
        tri(q[0]!, q[1]!, q[2]!, n, n, n)
        tri(q[0]!, q[2]!, q[3]!, n, n, n)
      } else {
        tri(q[0]!, q[2]!, q[1]!, n, n, n)
        tri(q[0]!, q[3]!, q[2]!, n, n, n)
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  return geo
}

export function strike(opts: { turn: { value: number } }): Build {
  return ({ THREE, renderer, width, height }) => {
    const FOV = 32

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 30)

    const env = forge(THREE, renderer)
    scene.environment = env

    // White as a FILTER, not as a colour. See the header.
    const metal = new THREE.Color().setRGB(...EMBERS.pale(), THREE.SRGBColorSpace)
    const body = new THREE.MeshStandardMaterial({ color: metal, metalness: 1, roughness: 0.34 })

    /**
     * One wedge, authored once and shared by all twelve pieces.
     *
     * It is already built in the XY plane facing +Z, so `rotation.z` places it
     * around the disc and there is no setup rotation to reason about. See
     * `wedge()` for why this is not a CylinderGeometry.
     */
    const slice = wedge(THREE, (Math.PI * 2) / WEDGES)

    /** The two finished coins. Each owns six wedges and its own attitude. */
    const coins = [new THREE.Group(), new THREE.Group()]

    /** Everything, so the first beat can tumble the blank as one object. */
    const all = new THREE.Group()
    scene.add(all)
    for (const coin of coins) all.add(coin)

    type Spot = { x: number; y: number; z: number; rx: number; ry: number; rz: number }
    type Piece = {
      mesh: GL.Mesh
      /** Attitude inside the single laminated blank. */
      whole: Spot
      /** Attitude at full separation. */
      burst: Spot
      /** Attitude inside its finished coin. */
      pair: Spot
    }

    const pieces: Piece[] = []

    for (let layer = 0; layer < 2; layer += 1) {
      for (let w = 0; w < WEDGES; w += 1) {
        const i = layer * WEDGES + w
        const mesh = new THREE.Mesh(slice, body)
        coins[layer]!.add(mesh)

        const around = (w * Math.PI * 2) / WEDGES

        pieces.push({
          mesh,
          /*
            The blank. Both layers are complete discs at the same radius, one
            seated behind the other — so the silhouette is a single disc of
            THICK and there is no gap for the eye to find. The half-wedge
            offset on the back layer is what stops the two sets of radial seams
            lining up into six full-depth cracks.
          */
          whole: {
            x: 0,
            y: 0,
            z: layer === 0 ? THICK / 4 : -THICK / 4,
            rx: 0,
            ry: 0,
            rz: around + (layer === 1 ? Math.PI / WEDGES : 0),
          },
          /*
            The break. Outward along the wedge's own bearing, so the pieces
            open like a struck blank shearing rather than scattering — plus a
            deterministic tumble so no two arrive at the same attitude.
          */
          burst: {
            x: Math.cos(around) * (1.5 + jitter(i, 1) * 0.5),
            y: Math.sin(around) * (1.5 + jitter(i, 2) * 0.5),
            z: (layer === 0 ? 1 : -1) * (0.7 + jitter(i, 3) * 0.4),
            rx: jitter(i, 4) * 2.4,
            ry: jitter(i, 5) * 2.4,
            rz: around + jitter(i, 6) * 1.6,
          },
          /*
            The finished coin. Same arrangement as the blank, minus the
            lamination offset: each layer closes up on its own centre plane and
            becomes a coin in its own right.
          */
          pair: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: around },
        })
      }
    }

    // The environment does the metal. This is only here to put a hard edge on
    // the wedge seams — without something directional the pieces read as one
    // mass while they are still close together.
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(-2, 3, 4)
    scene.add(key)

    /* ---- framing ------------------------------------------------------- */

    /**
     * Framed on the WIDEST thing the sequence ever is, which is the burst
     * rather than either end state. A camera pulled back to fit two coins is a
     * camera that throws pieces off the sides of the panel halfway through,
     * and the panel has a hairline border — so anything leaving it leaves
     * visibly.
     */
    function frame(w: number, h: number) {
      camera.aspect = w / h
      const reach = 2.2
      camera.position.z =
        reach / Math.tan((FOV * Math.PI) / 360) / Math.min(1, camera.aspect)
      camera.updateProjectionMatrix()
    }

    frame(width, height)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    return {
      draw: (time) => {
        const p = opts.turn.value

        // Two blends, not four states. `open` takes the blank apart and
        // `close` puts it back together as two — and because they are read in
        // that order, the burst is simply where the first has finished and the
        // second has not started.
        const open = smoothstep(BEAT.hold, BEAT.apart, p)
        const close = smoothstep(BEAT.apart, BEAT.joined, p)

        for (const piece of pieces) {
          const { mesh, whole, burst, pair } = piece
          mesh.position.set(
            lerp(lerp(whole.x, burst.x, open), pair.x, close),
            lerp(lerp(whole.y, burst.y, open), pair.y, close),
            lerp(lerp(whole.z, burst.z, open), pair.z, close),
          )
          mesh.rotation.set(
            lerp(lerp(whole.rx, burst.rx, open), pair.rx, close),
            lerp(lerp(whole.ry, burst.ry, open), pair.ry, close),
            lerp(lerp(whole.rz, burst.rz, open), pair.rz, close),
          )
        }

        // The two coins separate and shrink only as they finish assembling, so
        // through the break they are still one cloud rather than two.
        coins.forEach((coin, i) => {
          const side = i === 0 ? -1 : 1
          coin.position.x = PAIR.gap * side * close
          const size = lerp(1, PAIR.scale, close)
          coin.scale.setScalar(size)

          // Beat 4: rotating in place, on the TICKER. Scroll owns the
          // assembly; time owns the spin. A permanent lean keeps a flat metal
          // face from ever presenting dead-on to the camera, which is where a
          // metal reflects one point of the environment and comes out one flat
          // colour — the trap disc.ts solves with a dome instead.
          coin.rotation.y = time * (i === 0 ? SPIN.a : SPIN.b) * close
          coin.rotation.x = PAIR.lean * close
        })

        // Beat 1: the blank turns as one object, and stops turning as it comes
        // apart — the break is what the reader should be watching by then.
        all.rotation.y = Math.sin(time * 0.4) * 0.5 * (1 - open)
        all.rotation.x = Math.sin(time * 0.31) * 0.22 * (1 - open)

        renderer.render(scene, camera)
      },
      size: frame,
      drop: () => {
        slice.dispose()
        body.dispose()
        env.dispose()
      },
    }
  }
}
