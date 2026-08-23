/**
 * The house mark — phase 5, task 5.1.
 *
 * A heraldic crocus device: three stigmas over a stylised corm. It is the one
 * piece of geometry in this repository that is DESIGNED rather than derived,
 * and it is defined here, once, because four consumers need it and they must
 * not each carry their own copy:
 *
 *   scripts/mark.mjs   normalises it into app/content/device.ts, and rasterises
 *                      the favicon from it
 *   scripts/plates.mjs the relief in the medallion field, and the seal's field
 *   <Sigil/>           the header lockup, as a mask-image
 *   scenes/mark.ts     the extrusion in GL scene 3
 *
 * Same relationship tokens/palette.mjs has to colour: one definition site, and
 * everything downstream is derived from it or fails.
 *
 * THE REDUCTION
 *
 * Saffron IS the stigma — three per flower, lifted by hand, and the whole
 * trade is those three threads. The corm is what the house actually farms and
 * what it has been lifting from the same fields since 1904. So the mark is
 * three stigmas rising from a corm, and nothing else: no petals, no leaves, no
 * enclosing roundel, no ribbon. A device struck into metal, not a drawing of a
 * flower.
 *
 * ONE CLOSED CONTOUR, PLUS ONE COUNTER
 *
 * The silhouette is a single closed path — the corm and all three stigmas are
 * one continuous edge, never three shapes overlapping a fourth. Two reasons,
 * and both are load-bearing:
 *
 *   · GL scene 3 extrudes it. Overlapping contours extrude into coincident
 *     walls, which z-fight under a metal and read as a crack down the mark;
 *   · <Sigil/> paints it as a mask-image under `fill-rule: nonzero`, where
 *     overlapping same-wound contours are indistinguishable from one solid.
 *     The bar cut through the corm is wound the OTHER way, which is what makes
 *     it a hole in both the mask and the extrusion rather than in neither.
 *
 * SCALE
 *
 * Drawn in a 1000-unit square and checked at three sizes, because it has to
 * survive all three:
 *
 *   24px  favicon. The counter closes up here and the mark reads as a solid
 *         trefoil on a dome. That is a graceful degradation, not a failure —
 *         the silhouette is what carries at this size and it is unmistakable.
 *   36px  header lockup. The counter opens. Stigma stems land at 2.4px.
 *   ~275px the medallion's centre boss, and the GL extrusion.
 */

/** The drawing box. Square, and the centre is half of it. */
export const BOX = 1000

const MID = BOX / 2

/* --------------------------------------------------------------------------
   Construction
   --------------------------------------------------------------------------
   Every number below is a measurement off one system, not a taste decision
   made per element. The three stigmas are ONE function called three times —
   the same discipline the artwork sets are held to (04-clue-architecture.md
   §4.3) — so no stigma can drift into being the odd one out.
   -------------------------------------------------------------------------- */

const CORM = {
  /**
   * The neck: where the corm stops and the threads start.
   *
   * THIS IS THE MOST IMPORTANT MEASUREMENT ON THE MARK. Three tapered blades
   * fanning off a wide flat base is a hand, every time, at every weight and
   * every splay. What makes it a plant instead is a WAIST — a narrow neck the
   * threads rise out of, with the mass of the corm below it. A hand has no
   * waist. Widen this and the whole device turns back into a palm.
   */
  neck: 660,
  neckHalf: 70,
  /** Centre and radius of the bulb itself. Nearly round: a corm is squat. */
  belly: 800,
  reach: 132,
  /** The root plate. A corm stands flat — the roots come out of the bottom. */
  bottom: 950,
  /**
   * Half-width of the flat the corm stands on.
   *
   * Kept SMALL, and the reason is the difference between a bulb and a bag. A
   * wide flat under two straight flanks is a box with rounded corners, and a
   * box with three threads coming out of it is a shaving brush. The corm has
   * to reach its full width AT the belly and turn back in below it, which
   * means the base is a short flat at the bottom of a curve rather than the
   * bottom edge of a rectangle.
   */
  plate: 32,

  /**
   * How far below the neck the flank reaches its full width.
   *
   * Short values put a hard SHOULDER on the corm and it reads as a separate
   * object the threads were stuck into. The flare has to be long enough that
   * the silhouette leaves the neck and arrives at the belly as one move.
   */
  flare: 72,
}

const STIGMA = {
  /** Length of the centre thread, from the seat. */
  tall: 566,
  /** Length of the two flanking threads. */
  flank: 486,
  /**
   * Splay of the flanking threads from vertical, in radians.
   *
   * Held under thirty degrees deliberately. Past that the three threads stop
   * reading as a plant and start reading as a crown, which is a mark this
   * house has no business wearing.
   */
  splay: (13 * Math.PI) / 180,
  /**
   * How far the tip of a flanking thread bows away from its own spine.
   *
   * Splay alone gives three straight threads fanning off a base, which is a
   * hand. A stigma is lifted from the flower already curved and it dries that
   * way, so the lean has to ARRIVE along the thread rather than be set at the
   * seat. Most of the lean here is bow; the splay is what is left.
   */
  bow: 62,
  /** Half-widths along the blade: seat, waist, flare, and the tip's flat. */
  seat: 42,
  waist: 27,
  flare: 47,
  tip: 16,
  /** Where the waist and the flare fall along the blade. */
  atWaist: 0.44,
  atFlare: 0.9,
}

/** The counter cut through the corm — a fess, in heraldic terms. */
const FESS = {
  reach: 84,
  half: 24,
  at: 0.5,
}

/* --------------------------------------------------------------------------
   The blade
   -------------------------------------------------------------------------- */

/**
 * One stigma, in its own frame: seated at the origin, pointing up the -y axis.
 *
 * Returned as two edges rather than a closed shape, because a stigma is never
 * closed on this mark — it is a stretch of the silhouette's edge, and the
 * silhouette walks up one side of it and back down the other.
 */
function blade(length, bow = 0) {
  const { seat, waist, flare, tip, atWaist, atFlare } = STIGMA
  const w = -length * atWaist
  const f = -length * atFlare

  /**
   * The spine. Displacement across the blade, as a function of how far along
   * it we are — quadratic, so the seat leaves the corm square and the bend
   * accumulates toward the tip. A linear bow is just more splay.
   */
  const at = (y) => bow * (-y / length) ** 2

  // A saffron stigma is a fine thread that opens into a trumpet at the tip.
  // So the blade narrows from the seat to a waist, opens to the flare, and
  // ends on a short FLAT cap rather than a point. The cap is what stops three
  // of these reading as talons — a pointed thread is a claw, and the whole
  // mark turns into a raptor's foot at small sizes.
  const on = (x, y) => ({ x: x + at(y), y })
  const via = (cx, cy, x, y) => ({ c: on(cx, cy), ...on(x, y) })

  const left = [
    on(-seat, 0),
    via(-waist - 6, -length * 0.18, -waist, w),
    via(-flare + 2, -length * 0.79, -flare, f),
    via(-flare + 6, -length * 0.99, -tip, -length),
  ]

  // The cap, then the right edge back down to the seat: the mirror of the
  // above, reversed.
  const right = [
    via(0, -length - 5, tip, -length),
    via(flare - 6, -length * 0.99, flare, f),
    via(flare - 2, -length * 0.79, waist, w),
    via(waist + 6, -length * 0.18, seat, 0),
  ]

  return { left, right }
}

/** Rotate about the origin, then translate. Rigid, so the blade never shears. */
function seat(points, angle, ox, oy) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const turn = (p) => ({ x: ox + p.x * cos - p.y * sin, y: oy + p.x * sin + p.y * cos })
  return points.map((p) => (p.c ? { c: turn(p.c), ...turn(p) } : turn(p)))
}

/* --------------------------------------------------------------------------
   The silhouette
   -------------------------------------------------------------------------- */

/**
 * The mark, as path data in a 1000-unit box.
 *
 * Wound clockwise. `counter` below is wound the other way, which is what makes
 * it a hole under `fill-rule: nonzero` and under three's ExtrudeGeometry.
 *
 * The walk is the outline of the object as a pen would trace it: up the left
 * of the corm, up and over each thread in turn, dipping into the two valleys
 * between them, down the right of the corm, and across the root plate.
 */
export function outline() {
  const { neck, neckHalf, belly, reach, bottom, plate, flare } = CORM

  // All three threads are seated ON the neck, inside its width, so they rise
  // out of the corm rather than off the top of it. One function, three calls —
  // the same discipline the artwork sets are held to. The centre thread is
  // longer and does not bow; that is the only difference between the three,
  // and it is what a crocus actually does.
  const threads = [
    { at: -52, angle: -STIGMA.splay, length: STIGMA.flank, bow: -STIGMA.bow },
    { at: 0, angle: 0, length: STIGMA.tall, bow: 0 },
    { at: 52, angle: STIGMA.splay, length: STIGMA.flank, bow: STIGMA.bow },
  ]

  const laid = threads.map(({ at, angle, length, bow }) => {
    const shape = blade(length, bow)
    return {
      left: seat(shape.left, angle, MID + at, neck),
      right: seat(shape.right, angle, MID + at, neck),
    }
  })

  const d = []
  const to = (p) => `${r(p.x)} ${r(p.y)}`
  const move = (p) => d.push(`M${to(p)}`)
  const lineTo = (p) => d.push(`L${to(p)}`)
  const curve = (p) => d.push(`Q${to(p.c)} ${to(p)}`)
  const step = (p) => (p.c ? curve(p) : lineTo(p))

  // 1. The corm's left flank, from the left seat down to the root plate.
  const start = laid[0].left[0]
  move(start)

  // 2. Up and over all three threads. The valleys between them are where the
  //    silhouette dips back down to the shoulder — one function, three calls,
  //    so no thread can be hand-tuned into being the interesting one.
  laid.forEach((thread, i) => {
    if (i > 0) {
      // The valley: from the previous thread's seat across to this one's.
      const from = laid[i - 1].right[laid[i - 1].right.length - 1]
      const into = thread.left[0]
      const dip = { x: (from.x + into.x) / 2, y: Math.max(from.y, into.y) + 12 }
      d.push(`Q${to(dip)} ${to(into)}`)
    }
    thread.left.slice(1).forEach(step)
    thread.right.forEach(step)
  })

  // 3. Out to the neck, down and around the bulb, across the root plate, and
  //    back up the far side to where the walk started.
  d.push(`L${to({ x: MID + neckHalf, y: neck })}`)
  d.push(`Q${to({ x: MID + reach, y: neck + flare })} ${to({ x: MID + reach, y: belly })}`)
  d.push(`Q${to({ x: MID + reach, y: bottom })} ${to({ x: MID + plate, y: bottom })}`)
  d.push(`L${to({ x: MID - plate, y: bottom })}`)
  d.push(`Q${to({ x: MID - reach, y: bottom })} ${to({ x: MID - reach, y: belly })}`)
  d.push(`Q${to({ x: MID - reach, y: neck + flare })} ${to({ x: MID - neckHalf, y: neck })}`)
  d.push(`L${to(start)}`)
  d.push('Z')

  return d.join('')
}

/**
 * The counter cut through the corm.
 *
 * Wound anticlockwise — the opposite of `outline` — which is the whole reason
 * it reads as a hole rather than as more metal.
 */
export function counter() {
  // The corm is what sits between the neck and the root plate. The bar is cut
  // halfway down that, which lands it on the belly — the widest part, and the
  // only place a bar this long has metal either side of it.
  const { neck, bottom } = CORM
  const y = neck + (bottom - neck) * FESS.at
  const { reach, half } = FESS
  const to = (x, v) => `${r(x)} ${r(v)}`

  return [
    `M${to(MID + reach, y - half)}`,
    `L${to(MID - reach, y - half)}`,
    `Q${to(MID - reach - half, y)} ${to(MID - reach, y + half)}`,
    `L${to(MID + reach, y + half)}`,
    `Q${to(MID + reach + half, y)} ${to(MID + reach, y - half)}`,
    'Z',
  ].join('')
}

/**
 * The whole device: silhouette first, counter second.
 *
 * That order is a contract. app/composables/scenes/mark.ts takes the first run
 * as the face and every run after it as a void, so reversing these two would
 * extrude a bar floating in space.
 */
export function device() {
  return outline() + counter()
}

function r(n) {
  const v = Math.round(n * 10) / 10
  return Object.is(v, -0) ? 0 : v
}
