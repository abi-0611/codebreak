import { useLocation } from 'react-router-dom'
import Pill from '@/components/ui/Pill'
import { useBandBlocked, useScrollPast } from '@/lib/motion'

/**
 * The persistent "Request Access" CTA: a pill anchored to the bottom of the
 * viewport, centred, present at every breakpoint once the opening scene has
 * been scrolled past. It opens the ballot rather than navigating.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ IT MUST NEVER SIT ON TOP OF ANYTHING A VISITOR HAS TO READ.          │
 * │                                                                      │
 * │ On a 375px phone the bottom band of the viewport is where the        │
 * │ accreditation row and the route cards land, and a fixed pill parked  │
 * │ over one of them costs the reader whatever it covered — permanently, │
 * │ because a fixed element does not scroll out of the way. So the pill  │
 * │ stands down while anything marked `data-keep-clear` is in its band   │
 * │ and comes back when it is not. Mark the block; do not pad around it. │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default function AccessPill({
  label,
  to,
  onActivate,
}: {
  label: string
  to: string
  onActivate: () => void
}) {
  const { pathname } = useLocation()

  // "After the hero" measured against the scene that follows it rather than a
  // pixel offset. The hero is pinned, so its height in scroll is 250vh, and a
  // number measured against one viewport is wrong on the next one.
  const past = useScrollPast('#ethos')
  const blocked = useBandBlocked('[data-keep-clear]', 132, pathname)

  const shown = past && !blocked

  return (
    <div
      // `inert` is what makes standing down real rather than cosmetic: it takes
      // the control out of the tab order, out of the accessibility tree and out
      // of pointer targeting in one attribute, so a faded-out pill cannot be
      // focused or clicked through.
      inert={!shown}
      className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-[var(--gutter)] transition-all duration-500 ease-[var(--ease-out-soft)]"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translate3d(0,0,0)' : 'translate3d(0, 1.25rem, 0)',
      }}
    >
      <Pill to={to} onActivate={onActivate} className="pointer-events-auto shadow-none">
        {label}
      </Pill>
    </div>
  )
}
