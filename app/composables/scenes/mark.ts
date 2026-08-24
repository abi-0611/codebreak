/**
 * GL scene 3 — the house mark, extruded. Task 3.6, teardown §9.
 *
 * Same metal, same environment, same rotation rule as the medallion. It
 * carries nothing.
 *
 * That is the whole job. Task 3.6 calls it "the decoy-by-symmetry that makes
 * the medallion not look special", and the way a decoy-by-symmetry fails is by
 * being almost the same. So this scene imports the medallion's `TURN` constants
 * rather than restating them: both objects come to rest face-on over the same
 * band, lean by the same angle, and breathe at the same rate. Give this one a
 * continuous tumble — the obvious choice, since it has nothing to protect —
 * and the medallion becomes the one object on the page that stops, which is
 * precisely the tell the symmetry exists to prevent.
 *
 * ON THE GEOMETRY. `d` is committed outline data in the same shape as
 * app/content/lockup.ts — phase 5's scripts/mark.mjs emits it. Turning that
 * into an extrusion at mount is not the "conversion in the browser" phase 5
 * forbids: no font is fetched, nothing is measured, and the geometry in the
 * repo is the geometry on screen. It is the same act as the browser
 * rasterising the committed mask-image in <Wordmark/>.
 *
 * The reader below handles exactly the five commands the generators emit and
 * refuses anything else. A silent fallback here would mean a house mark that
 * quietly became a blank disc on production, and nobody would notice until the
 * screenshots came back.
 */
import type * as GL from 'three'
import { EMBERS, forge, plateau, type Build, type Three } from '~/composables/gl'
import { TURN } from '~/composables/scenes/disc'

const DEPTH = 0.22
/**
 * Face curvature, as a fraction of the normalised half-width. The medallion
 * uses 0.075 of its radius for the same job; this is a shade shallower because
 * the mark is a thin device rather than a filled field, and a crown that deep
 * on a three-millimetre stigma reads as a swelling.
 */
const DOME = 0.055

/** Commands opentype.js emits, and no others. */
const STEP = /([MLCQZ])([^MLCQZ]*)/gi

function numbers(chunk: string): number[] {
  const found = chunk.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
  return found ? found.map(Number) : []
}

/**
 * Committed path data to three.js shapes.
 *
 * SVG's y axis runs down and a Shape's runs up, so every y is negated on the
 * way in. The result is then centred and scaled to a unit box by the caller,
 * because the generator's user units are the font's em box and mean nothing
 * here.
 */
function trace(THREE: Three, d: string): GL.Shape[] {
  const runs: GL.Shape[] = []
  let live: GL.Shape | null = null
  let x = 0
  let y = 0

  STEP.lastIndex = 0
  let hit: RegExpExecArray | null
  while ((hit = STEP.exec(d)) !== null) {
    const cmd = hit[1]!.toUpperCase()
    const n = numbers(hit[2] ?? '')

    if (cmd === 'M') {
      live = new THREE.Shape()
      x = n[0]!
      y = -n[1]!
      live.moveTo(x, y)
      runs.push(live)
    } else if (cmd === 'L' && live) {
      for (let i = 0; i + 1 < n.length; i += 2) {
        x = n[i]!
        y = -n[i + 1]!
        live.lineTo(x, y)
      }
    } else if (cmd === 'Q' && live) {
      for (let i = 0; i + 3 < n.length; i += 4) {
        const cx = n[i]!
        const cy = -n[i + 1]!
        x = n[i + 2]!
        y = -n[i + 3]!
        live.quadraticCurveTo(cx, cy, x, y)
      }
    } else if (cmd === 'C' && live) {
      for (let i = 0; i + 5 < n.length; i += 6) {
        const ax = n[i]!
        const ay = -n[i + 1]!
        const bx = n[i + 2]!
        const by = -n[i + 3]!
        x = n[i + 4]!
        y = -n[i + 5]!
        live.bezierCurveTo(ax, ay, bx, by, x, y)
      }
    } else if (cmd === 'Z' && live) {
      live.closePath()
    } else {
      throw new Error(`outline command not handled: ${cmd}`)
    }
  }

  return runs
}

/**
 * The stand-in, for every phase before the identity exists.
 *
 * A struck hexagonal blank — the thing a die is pressed into. It is
 * deliberately not an attempt at the house mark: a placeholder that looks like
 * a logo is a placeholder that ships.
 */
function blank(THREE: Three): GL.Shape {
  const shape = new THREE.Shape()
  const R = 1
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6
    const px = Math.cos(a) * R
    const py = Math.sin(a) * R
    if (i === 0) shape.moveTo(px, py)
    else shape.lineTo(px, py)
  }
  shape.closePath()
  return shape
}

export function mark(opts: { d?: string; turn: { value: number } }): Build {
  return ({ THREE, renderer, width, height }) => {
    const FOV = 30

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 20)

    const env = forge(THREE, renderer)
    scene.environment = env

    const filter = new THREE.Color().setRGB(...EMBERS.pale(), THREE.SRGBColorSpace)
    const metal = new THREE.MeshStandardMaterial({
      color: filter,
      metalness: 1,
      roughness: 0.34,
    })

    // A single closed path is what phase 5.1 commits, so the first run is the
    // outline and anything after it is a void in the face.
    const runs = opts.d ? trace(THREE, opts.d) : [blank(THREE)]
    const face = runs[0]!
    if (runs.length > 1) face.holes = runs.slice(1)

    const geo = new THREE.ExtrudeGeometry(face, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 12,
    })

    // The generator's units are an em box. Normalise to the same unit radius
    // the medallion uses so the two objects read as the same size on the page.
    geo.center()
    geo.computeBoundingBox()
    const bounds = geo.boundingBox!
    const reach = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y)
    if (reach > 0) geo.scale(2 / reach, 2 / reach, 1)

    /**
     * THE FACES ARE DOMED — phase 11 §11.3.7, and it is the medallion's `DOME`
     * for the medallion's reason.
     *
     * An extrusion has FLAT caps, and a flat metal reflects ONE point of the
     * environment: it comes out one solid colour however it is turned, so
     * teardown §9's gold-to-magenta-to-red gradient never lands on it. Before
     * this the mark rendered as a gold silhouette, which is exactly what the
     * medallion looked like before phase 3 curved its field — the same trap
     * disc.ts documents, arrived at from the other direction, because nobody
     * expects `ExtrudeGeometry` to have the same problem a `CircleGeometry`
     * does.
     *
     * Only the CAPS move. They are the vertices whose normal is (0, 0, ±1);
     * the bevel and the side wall are left exactly as three.js built them,
     * because the bevel is the edge that has to stay sharp. `ExtrudeGeometry`
     * is non-indexed, so nothing here is shared with a face it should not be.
     *
     * The normal is written rather than recomputed. `computeVertexNormals()`
     * would flat-shade every triangle in the buffer, faceting the dome and
     * destroying the bevel in the same pass; the dome's slope has a closed form
     * and costs two lines.
     */
    {
      const seat = geo.attributes.position as GL.BufferAttribute
      const face3 = geo.attributes.normal as GL.BufferAttribute
      // Measured on the normalised geometry, so it is the same fraction of the
      // object whatever the committed outline turns out to be.
      const span = 1
      for (let i = 0; i < seat.count; i += 1) {
        const nz = face3.getZ(i)
        if (Math.abs(nz) < 0.99) continue
        const side = nz > 0 ? 1 : -1
        const x = seat.getX(i)
        const y = seat.getY(i)
        const r2 = Math.min(1, (x * x + y * y) / (span * span))
        // Proud in the middle, falling away to the edge — a struck relief, not
        // a bowl. `side` puts the crown on whichever face this vertex is on.
        seat.setZ(i, seat.getZ(i) + side * DOME * (1 - r2))
        // z = c - k(x² + y²) has gradient (-2kx, -2ky), so the normal leans
        // outward along the radius by twice the dome's coefficient.
        const gx = (2 * DOME * x) / (span * span)
        const gy = (2 * DOME * y) / (span * span)
        const len = Math.hypot(gx, gy, 1)
        face3.setXYZ(i, (side * gx) / len, (side * gy) / len, side / len)
      }
      seat.needsUpdate = true
      face3.needsUpdate = true
    }

    const sigil = new THREE.Group()
    sigil.add(new THREE.Mesh(geo, metal))
    scene.add(sigil)

    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(-2, 3, 4)
    scene.add(key)

    function frame(w: number, h: number) {
      camera.aspect = w / h
      const fit = 1.22
      camera.position.z = fit / Math.tan((FOV * Math.PI) / 360) / Math.min(1, camera.aspect)
      camera.updateProjectionMatrix()
    }

    frame(width, height)

    return {
      draw: (time) => {
        const away = plateau(opts.turn.value, TURN.from, TURN.to)

        // The SAME rule as the medallion, from the same record, including the
        // idle drift phase 11 added. A set whose members behave differently
        // has one member everybody looks at, and the other one carries a term.
        sigil.rotation.y = away * TURN.swing + Math.sin(time * TURN.sway) * TURN.drift
        sigil.rotation.x = away * TURN.lean + Math.cos(time * TURN.sway * 0.77) * TURN.drift * 0.55
        sigil.rotation.z = Math.sin(time * 0.24) * 0.014
        sigil.position.y = Math.sin(time * 0.5) * 0.012

        renderer.render(scene, camera)
      },
      size: frame,
      drop: () => {
        geo.dispose()
        metal.dispose()
        env.dispose()
      },
    }
  }
}
