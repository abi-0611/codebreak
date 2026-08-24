/**
 * GL scene 2 — the House Medallion. Task 3.5, teardown §9.
 *
 * A struck disc: engraved lettering repeated around a ring band, a botanical
 * relief in the field, the house mark centred. Metal, under the PMREM
 * environment built in gl.ts, rotating on scroll.
 *
 * THIS OBJECT CARRIES ONE OF THE SIX TERMS (phase 4, technique T-C), and that governs
 * two decisions that would otherwise go the other way:
 *
 * 1. IT RESTS FACE-ON. The scroll-driven rotation runs through `plateau()`, so
 *    the disc turns into a face-on attitude, holds it across a quarter of the
 *    section's crossing, and only then turns away. A continuously tumbling
 *    coin is prettier and it is also a term that is legible for about eighty
 *    pixels of scroll. Rule 5.
 *
 * 2. THE FACE IS A TEXTURE BAKED OFFLINE, never `TextGeometry` assembled at
 *    runtime. Runtime text geometry means shipping a font file that contains
 *    the string — which hands the term straight to anyone reading the network
 *    tab, undoing the whole technique — and it means a failure mode where a
 *    glyph is missing and the term silently is not there at all.
 *
 * The face is a flat CircleGeometry rather than the cylinder's own cap. The
 * cap's generated UVs depend on which way the cylinder was rotated into place,
 * and a face texture that is quietly mirrored is a term that reads backwards.
 * A circle in the XY plane maps an image the way an image is meant to be
 * mapped, and there is nothing to reason about.
 */
import type * as GL from 'three'
import { EMBERS, forge, plateau, type Build } from '~/composables/gl'

const RADIUS = 1
const THICK = 0.14
/** Face curvature, as a fraction of the radius. See the note by `flat`. */
const DOME = 0.075

/**
 * The rest band, as a fraction of the section's crossing, and the swing either
 * side of it. `mark.ts` imports the same numbers — the two struck objects turn
 * identically, so the one that carries something is not the one that behaves
 * differently.
 */
export const TURN = {
  from: 0.36,
  to: 0.64,
  /** Radians at full swing. Beyond about 1.1 the face edges on and goes dark. */
  swing: 0.95,
  lean: 0.16,
  /**
   * THE IDLE DRIFT — phase 11 §11.3.3, and §11.2 invariant 5.
   *
   * The capture shows the medallion turning through a full magenta ->
   * violet -> gold sweep of its environment during a dwell where nothing
   * else moves. Phase 3 shipped an idle of 0.014 radians, which is under a
   * degree: enough to say the object is not a photograph, nowhere near
   * enough to move the reflection anywhere.
   *
   * A tenth of a radian is 5.7 degrees, and on a domed face that is a long
   * way around the environment — the reflected ray turns by twice the
   * surface turn, and the dome is already sweeping the ramp across the
   * face. It is also small enough that the rim band stays readable at rest
   * (cos 5.7 degrees is 0.995), which is the constraint that matters,
   * because the disc carries one of the six.
   *
   * TIME, NOT SCROLL. `plateau()` owns the scroll attitude and this owns
   * the drift, and they are summed rather than blended: the rest band is
   * still a rest band, it just is not a freeze frame.
   */
  drift: 0.1,
  /** Radians per second. Slow — this is a struck object on a bench. */
  sway: 0.17,
} as const

export function disc(opts: { face?: string; turn: { value: number } }): Build {
  return ({ THREE, renderer, width, height }) => {
    const FOV = 30

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 20)

    const env = forge(THREE, renderer)
    scene.environment = env

    const metal = new THREE.Color().setRGB(...EMBERS.pale(), THREE.SRGBColorSpace)

    const body = new THREE.MeshStandardMaterial({
      color: metal,
      metalness: 1,
      roughness: 0.42,
    })

    const pane = new THREE.MeshStandardMaterial({
      color: metal,
      metalness: 1,
      roughness: 0.28,
    })

    let ink: GL.Texture | null = null
    if (opts.face) {
      ink = new THREE.TextureLoader().load(opts.face)
      ink.colorSpace = THREE.SRGBColorSpace
      ink.anisotropy = renderer.capabilities.getMaxAnisotropy()
      // `map` on a metal tints the reflection, so the engraving reads as dark
      // metal rather than as paint; `bumpMap` gives it an edge to catch the
      // key light on. Both from one texture — one fetch, one decode.
      pane.map = ink
      pane.bumpMap = ink
      pane.bumpScale = 1.6
      pane.needsUpdate = true
    }

    // Open-ended: the caps are the two circles below, so the rim is only ever
    // the rim.
    const rim = new THREE.CylinderGeometry(RADIUS, RADIUS, THICK, 128, 1, true)
    rim.rotateX(Math.PI / 2)

    // A SHALLOW DOME, not a flat disc — and the reason is optical, not
    // sculptural. A flat metal facing the viewer reflects one point of the
    // environment, so it comes out one flat colour and teardown §9's
    // gold-to-magenta-to-red gradient never appears. Curving the face by a
    // tenth of its radius sweeps the reflected direction across the ramp, so
    // the gradient runs down the face the way it does on a real struck coin.
    // At this depth it is invisible as a SHAPE, which is the point.
    //
    // RingGeometry rather than CircleGeometry because a circle is a fan: it
    // has a centre and a rim and nothing in between, so there is nothing to
    // displace. Its UVs are identical.
    const flat = new THREE.RingGeometry(0, RADIUS, 128, 20)
    {
      const seat = flat.attributes.position as GL.BufferAttribute
      for (let i = 0; i < seat.count; i += 1) {
        const x = seat.getX(i)
        const y = seat.getY(i)
        const r = Math.hypot(x, y) / RADIUS
        // Negative: the field is RECESSED and the rim stands proud, which is
        // what a die does to a blank, and it also keeps the face from poking
        // through the rim silhouette when the disc turns.
        seat.setZ(i, -DOME * (1 - r * r))
      }
      seat.needsUpdate = true
      flat.computeVertexNormals()
    }

    const coin = new THREE.Group()
    coin.add(new THREE.Mesh(rim, body))

    const front = new THREE.Mesh(flat, pane)
    front.position.z = THICK / 2
    coin.add(front)

    const back = new THREE.Mesh(flat, body)
    back.position.z = -THICK / 2
    back.rotation.y = Math.PI
    coin.add(back)

    scene.add(coin)

    // The environment does the metal. This is only here to put a hard edge on
    // the relief — a bump map with nothing directional to catch reads flat.
    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(-2, 3, 4)
    scene.add(key)

    /* ---- framing ---- */

    function frame(w: number, h: number) {
      camera.aspect = w / h
      // Pull back on a narrow box so the disc fits by its WIDTH there, rather
      // than being cropped left and right. On a 375px phone this is the
      // difference between a legible ring band and a cropped one.
      const fit = RADIUS * 1.22
      camera.position.z = fit / Math.tan((FOV * Math.PI) / 360) / Math.min(1, camera.aspect)
      camera.updateProjectionMatrix()
    }

    frame(width, height)

    return {
      draw: (time) => {
        const away = plateau(opts.turn.value, TURN.from, TURN.to)

        // Scroll attitude PLUS the idle drift — see TURN.drift. The two are
        // summed rather than blended, so the rest band is still a rest band
        // and the object is still alive inside it.
        coin.rotation.y = away * TURN.swing + Math.sin(time * TURN.sway) * TURN.drift
        coin.rotation.x = away * TURN.lean + Math.cos(time * TURN.sway * 0.77) * TURN.drift * 0.55

        // A struck object on a bench is never perfectly still. These two are
        // deliberately under a degree: they are the bench, not the object.
        coin.rotation.z = Math.sin(time * 0.24) * 0.014
        coin.position.y = Math.sin(time * 0.5) * 0.012

        renderer.render(scene, camera)
      },
      size: frame,
      drop: () => {
        rim.dispose()
        flat.dispose()
        body.dispose()
        pane.dispose()
        ink?.dispose()
        env.dispose()
      },
    }
  }
}
