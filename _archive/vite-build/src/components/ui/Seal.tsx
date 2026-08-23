import { cn } from '@/lib/cn'
import { ringPlan, type OutlineRing } from '@/content/outlines'

type SealProps = {
  /** Ring geometry from src/content/outlines.ts. Generated, never hand-set. */
  ring: OutlineRing
  /** What the seal says. Becomes the accessible name for the whole drawing. */
  label: string
  /** Rendered diameter in px. */
  size?: number
  className?: string
}

const MID = ringPlan.box / 2

/**
 * The summit device at the centre: a peak with a horizon rule cutting across
 * it. Hand-set once, here, rather than generated — it is the same drawing on
 * all four seals, so there is nothing about it that could vary.
 *
 * Sits a hair above the true centre. A shape with all its mass along the
 * bottom edge reads as low when it is centred by measurement, so it is
 * centred by eye instead, which is what a punch-cutter would have done.
 *
 * The rule sits below the peak rather than across it. Crossing it at mid
 * height put a bar exactly where the crossbar of a capital A goes, and the
 * whole device stopped reading as a mountain.
 */
const DEVICE = ['M384 556 500 386 616 556', 'M356 604 644 604']
const DEVICE_WEIGHT = 12

/**
 * An accreditation seal: two concentric circles, a name set around the top
 * arc, a registration number around the bottom, a summit device in the middle.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ EVERY SEAL ON THIS SITE IS DRAWN BY THIS COMPONENT FROM ringPlan.    │
 * │ There is no prop for diameter-of-ring, stroke weight, letter spacing │
 * │ or band depth, and none may be added. A set of badges where one is a │
 * │ hair different in weight or diameter reads as the odd one out on     │
 * │ sight, and whatever that one says is then the first thing a visitor  │
 * │ reads. `size` scales the whole drawing and changes no proportion.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * The type is committed path geometry, not characters, for the same reason
 * <OutlineText/> is — see the long note in lib/split.tsx. The same two rules
 * apply here and are not negotiable: never SVG <text>, and never <Split/>.
 * Both are matched by find-in-page and either one would quietly undo this.
 *
 * The same accessibility trade-off applies and is accepted on the same terms:
 * `aria-label` carries the full line, so assistive technology announces the
 * seal normally, and the drawing scales with its container rather than being a
 * fixed-size raster. It is display lettering — never running copy.
 *
 * Strokes are `currentColor`, so a seal inherits its scene's --fore exactly
 * like every other mark on the page and can never read as a special case.
 *
 * MINIMUM DIAMETER 128px, measured rather than guessed. Ring type is set at
 * one twelfth of the diameter, so a seal below about 128px puts the lettering
 * under a 7px cap height and it stops being readable. On a 375px phone that
 * means the row wraps to two seals across — four across lands at roughly 71px
 * and the lettering is gone. `size` defaults above the floor; if a caller
 * needs smaller, the layout is wrong, not the floor.
 */
export default function Seal({ ring, label, size = 132, className }: SealProps) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${ringPlan.box} ${ringPlan.box}`}
      width={size}
      height={size}
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <g fill="none" stroke="currentColor">
        <circle cx={MID} cy={MID} r={ringPlan.outer} strokeWidth={ringPlan.outerWeight} />
        <circle cx={MID} cy={MID} r={ringPlan.inner} strokeWidth={ringPlan.innerWeight} />
      </g>

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={DEVICE_WEIGHT}
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        {DEVICE.map((d, i) => (
          <path key={`d${i}`} d={d} />
        ))}
      </g>

      {/* The two arcs. Geometry only — no text node anywhere in this subtree. */}
      <g fill="currentColor">
        {ring.crown.map((d, i) => (
          <path key={`c${i}`} d={d} />
        ))}
        {ring.base.map((d, i) => (
          <path key={`b${i}`} d={d} />
        ))}
      </g>

      {/* Separator dots at three and nine o'clock, where the two arcs meet. */}
      <g fill="currentColor">
        <circle cx={MID + ringPlan.dotAt} cy={MID} r={ringPlan.dot} />
        <circle cx={MID - ringPlan.dotAt} cy={MID} r={ringPlan.dot} />
      </g>
    </svg>
  )
}
