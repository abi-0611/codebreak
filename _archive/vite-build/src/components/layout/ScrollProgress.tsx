import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/motion'

/* --------------------------------------------------------------------------
   Harvested from 21st: "Scroll Progress" (skyleen77, id 2920).
   Kept: the idea — a hairline bar pinned to the top edge, scaled from the
   left as the document advances.
   Rebuilt: on ScrollTrigger rather than motion/react's useScroll + useSpring,
   so the bar reads the same smoothed scroll position as every other trigger
   on the page. Two competing scroll observers would visibly disagree once
   Lenis is interpolating.

   Deliberately NOT gated on prefers-reduced-motion: the bar is a position
   readout, not an animation. It reports where you are; suppressing it would
   remove information rather than remove movement.
   -------------------------------------------------------------------------- */

export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = bar.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.set(el, { scaleX: 0, transformOrigin: 'left center' })
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => gsap.set(el, { scaleX: self.progress }),
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]"
      style={{ backgroundColor: 'transparent' }}
    >
      <div ref={bar} className="h-full w-full" style={{ backgroundColor: 'var(--moss)' }} />
    </div>
  )
}
