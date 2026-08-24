/**
 * GL scene 5 — the ledger's colonnade. Phase 11 §11.3.4.
 *
 * "A data table on hairline-bordered rows over a receding arched colonnade.
 * The tunnel is a backdrop, not a subject: it sits behind and below the table
 * and comes into full view as the table clears. The camera DOLLIES FORWARD; it
 * does not orbit."
 *
 * Every clause there is a constraint, and the last one is the load-bearing
 * one. An orbit is what a scene does when it wants to be looked at — it shows
 * you the object from a new side and asks you to follow. A dolly does not
 * change the subject, it changes your distance from it, which is the only
 * camera move that can sit under a table of numbers without competing with
 * them. So there is exactly one animated quantity in this file: `camera.z`.
 *
 * A BACKDROP, WHICH MEANS THE EXPOSURE IS THE SPECIFICATION. The single light
 * is at the FAR end of the corridor, so the bays nearest the reader — the ones
 * directly behind the table and behind the copy — are almost unlit, and the
 * only bright thing is a small opening a long way off. That is not a mood; it
 * is what keeps cream body copy legible over a moving picture (rule 10), and
 * it is why the light is not where a lighting artist would put it.
 *
 * ON THE GEOMETRY. A box rendered from the inside is the corridor; fifteen
 * ribs stand in it, each one wall with an arched opening cut out of it. What
 * the reader sees through the first opening is the second, and so on to the
 * lit end. That nesting is what makes depth legible — scripts/plates.mjs makes
 * the same point about the room plates and arrives at it from the other
 * direction: its first pass drew free-standing piers and six of them side by
 * side read as a bar chart, because a rectangle has no perspective.
 *
 * See the note on TUBE for why the box is not optional.
 */
import { EMBERS, type Build } from '~/composables/gl'
import { ink, palette } from '~~/tokens/palette.mjs'

/**
 * The bay, in world units. The opening is small against the wall for the
 * reason in the header: the wall has to overrun the frame at every viewport,
 * including a 375px phone held in portrait where the box is tall and narrow.
 */
const BAY = {
  /** Half-width and top of the rib, which is the tube's own cross-section. */
  wall: 4.8,
  ceiling: 4.2,
  floor: -2.4,
  /** Half-width of the opening, and the height its arch springs from. */
  open: 1.5,
  spring: 0.5,
  /** How thick the rib is, which is what makes the soffit visible up close. */
  depth: 0.42,
} as const

/**
 * THE CORRIDOR ITSELF, AND WHY IT HAS TO EXIST.
 *
 * The first build of this scene was fifteen ribs and a lamp at the far end,
 * and it rendered as one glowing doorway floating in pure black — not a dark
 * colonnade, no colonnade at all. The reason is geometry rather than exposure:
 * every rib is a slab facing the camera, the lamp is behind all of them, so
 * `N · L` is negative on every surface the reader can see and the diffuse term
 * is exactly zero. Turning the light up produces a brighter nothing.
 *
 * What a real corridor gives a light at its end is SURFACES RUNNING TOWARD IT
 * — floor, ceiling, two side walls — whose normals are perpendicular to the
 * axis and which therefore catch it. So the ribs now sit inside a box rendered
 * from the inside (`BackSide`, one draw call), and what the reader sees is the
 * lit far end of that box with the ribs SILHOUETTED against it, darker as they
 * come forward. Which is what a bonded floor actually looks like, and what the
 * still frame was already drawing.
 */
const TUBE = { from: 8, to: -42 } as const

const RUN = {
  bays: 15,
  /** Distance between bays. */
  gap: 2.3,
  /** Where the first bay sits. */
  near: 3,
} as const

/**
 * The dolly, in world units, and where it starts.
 *
 * Eleven units at a 2.3 spacing passes the reader through not quite five bays
 * across the section's whole crossing — slow enough that no single scroll
 * gesture produces a lurch, far enough that arriving at the bottom of the
 * section is visibly somewhere else from arriving at the top.
 */
const DOLLY = { from: 5, travel: 11 } as const

export function tunnel(opts: { turn: { value: number } }): Build {
  return ({ THREE, renderer, width, height }) => {
    const FOV = 42

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 90)
    // A little above the floor and a little off the axis. Not an orbit — it
    // never changes — but enough that the arch soffits catch the light as a
    // bay passes, which is what stops the run reading as flat cards.
    camera.position.set(0.35, 0.25, DOLLY.from)

    /*
      TWO TONES, AND THE DARKER ONE IS THE RIBS.

      The first build gave both the same `brown-deepest`, which is 47,14,9 —
      dark enough that no amount of light makes it read, because a diffuse
      surface can only return the light it is given TIMES its own colour. The
      corridor came out black with one lit arch in it.

      So the shell takes `brown` — a mid tone the palette reserves for rules
      and edges, which is exactly right for a masonry surface and is never
      text here — and the ribs keep `brown-deepest`. What that buys is the
      picture the still already draws: dark arches silhouetted against a lit
      wall, rather than dark arches against a dark wall.
    */
    const dark = new THREE.Color().setRGB(...ink(palette['brown-deepest']), THREE.SRGBColorSpace)
    const lit = new THREE.Color().setRGB(...ink(palette.brown), THREE.SRGBColorSpace)

    const stone = new THREE.MeshStandardMaterial({ color: dark, roughness: 0.94, metalness: 0 })

    /* ---- the corridor, rendered from the inside ------------------------ */

    /**
     * `BackSide` is what turns a box into a room. One geometry, one draw call,
     * and the four surfaces the lamp needs — see the note on TUBE.
     */
    const shell = new THREE.MeshStandardMaterial({
      color: lit,
      roughness: 0.96,
      metalness: 0,
      side: THREE.BackSide,
    })

    const long = TUBE.from - TUBE.to
    const tall = BAY.ceiling - BAY.floor
    const room = new THREE.BoxGeometry(BAY.wall * 2, tall, long)
    const tube = new THREE.Mesh(room, shell)
    tube.position.set(0, BAY.floor + tall / 2, TUBE.to + long / 2)
    scene.add(tube)

    /* ---- one bay, shared by all fifteen ------------------------------- */

    const shape = new THREE.Shape()
    shape.moveTo(-BAY.wall, BAY.floor)
    shape.lineTo(-BAY.wall, BAY.ceiling)
    shape.lineTo(BAY.wall, BAY.ceiling)
    shape.lineTo(BAY.wall, BAY.floor)
    shape.closePath()

    /*
      The opening. `absarc` runs from π to 0 CLOCKWISE, which is the half that
      goes over the top — counter-clockwise from π takes the long way round
      underneath and produces a keyhole with the arch at the bottom, which
      looks like a bug in the geometry rather than in the angle.
    */
    const cut = new THREE.Path()
    cut.moveTo(-BAY.open, BAY.floor)
    cut.lineTo(-BAY.open, BAY.spring)
    cut.absarc(0, BAY.spring, BAY.open, Math.PI, 0, true)
    cut.lineTo(BAY.open, BAY.floor)
    cut.closePath()
    shape.holes.push(cut)

    const wall = new THREE.ExtrudeGeometry(shape, {
      depth: BAY.depth,
      bevelEnabled: false,
      curveSegments: 16,
    })

    /**
     * ONE InstancedMesh, not fifteen meshes.
     *
     * Fifteen bays is fifteen draw calls for one geometry and one material,
     * on a page that is already running four other scenes. Instancing makes it
     * one. Nothing about the bays differs except their z, which is exactly the
     * case instancing exists for.
     */
    const run = new THREE.InstancedMesh(wall, stone, RUN.bays)
    run.frustumCulled = false
    const seat = new THREE.Object3D()
    for (let i = 0; i < RUN.bays; i += 1) {
      seat.position.set(0, 0, -(RUN.near + i * RUN.gap))
      seat.updateMatrix()
      run.setMatrixAt(i, seat.matrix)
    }
    run.instanceMatrix.needsUpdate = true
    scene.add(run)


    /* ---- the opening at the end ---------------------------------------- */

    /**
     * Unlit, and graded DOWN.
     *
     * A `MeshBasicMaterial` in full gold would be the brightest object in the
     * section by a distance, and the section's subject is a table of lot
     * numbers. Multiplying the token rather than reaching for a dimmer literal
     * keeps the hue on the palette record and puts the level where a backdrop
     * belongs — see phase 5's note about marked surfaces being graded
     * down, which is the same instinct applied to something that carries
     * nothing.
     */
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(BAY.open * 1.9, 3.1),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color()
          .setRGB(...EMBERS.gold(), THREE.SRGBColorSpace)
          .multiplyScalar(0.44),
      }),
    )
    glow.position.set(0, BAY.spring - 0.05, TUBE.to + 0.4)
    scene.add(glow)

    /**
     * THREE LAMPS, BRIGHTENING WITH DEPTH — and the ramp is the whole point.
     *
     * One light at the far end is what a diagram of this idea looks like, and
     * it is what the first build shipped: at `decay: 2` the near half of the
     * corridor received about three ten-thousandths of it, so the reader got a
     * lit doorway in a void. A bonded floor has lamps down it, and putting
     * them there is both more honest and the only way to get a RAMP rather
     * than a spot.
     *
     * Nearest is dimmest. The bays behind the table stay almost unlit and the
     * far end is bright, which is the exposure §11.3.4 asks for and, before
     * that, what keeps cream copy legible over a moving picture (rule 10).
     */
    const gold = new THREE.Color().setRGB(...EMBERS.gold(), THREE.SRGBColorSpace)
    const lamps = [
      { z: -11, watt: 26 },
      { z: -24, watt: 52 },
      { z: TUBE.to + 5, watt: 105 },
    ].map(({ z, watt }) => {
      const lamp = new THREE.PointLight(gold, watt, 22, 2)
      lamp.position.set(0, BAY.ceiling - 0.5, z)
      scene.add(lamp)
      return lamp
    })

    // Just enough to keep the nearest bay from being a black rectangle. In the
    // rotated red, so the unlit stone reads as stone rather than as fog.
    const fill = new THREE.AmbientLight(
      new THREE.Color().setRGB(...ink(palette['brown-lifted'], -20), THREE.SRGBColorSpace),
      0.5,
    )
    scene.add(fill)

    /* ---- framing ------------------------------------------------------- */

    /**
     * The corridor is framed by its HEIGHT on a wide box and by its WIDTH on a
     * narrow one, which is the same rule the medallion follows: on a phone the
     * section is tall and narrow, and a camera that only ever fits by height
     * would push the arch off both sides of the frame.
     */
    function frame(w: number, h: number) {
      camera.aspect = w / h
      camera.fov = camera.aspect < 1 ? FOV / Math.max(0.55, camera.aspect) : FOV
      camera.updateProjectionMatrix()
    }

    frame(width, height)

    return {
      draw: () => {
        // The ONE animated quantity. Scroll, not time — the dolly is the
        // reader's own progress through the section, and §11.2 invariant 5
        // keeps the two clocks apart.
        camera.position.z = DOLLY.from - opts.turn.value * DOLLY.travel
        renderer.render(scene, camera)
      },
      size: frame,
      drop: () => {
        wall.dispose()
        room.dispose()
        glow.geometry.dispose()
        ;(glow.material as { dispose: () => void }).dispose()
        stone.dispose()
        shell.dispose()
      },
    }
  }
}
