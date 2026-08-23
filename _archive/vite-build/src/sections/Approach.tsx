import { useRef } from 'react'
import { Section, Eyebrow, Display, Plate } from '@/components/ui'
import { usePinnedScene, useScrollPast, useWipe } from '@/lib/motion'
import { plates } from '@/content/plates'
import { approach } from '@/content/site'

/* --------------------------------------------------------------------------
   Scene 1 — the approach.

   Pinned for 250vh with three layers moving at the house parallax rates: the
   plate trails furthest behind, the fog sits between, the headline tracks the
   scroll almost exactly. Nothing here has to be read to get anywhere, which is
   the only reason a scrub is allowed to touch it at all.
   -------------------------------------------------------------------------- */

/**
 * The fog.
 *
 * Not decoration — it is what makes --ink legible over a plate whose lower
 * half is near-black conifer. Two soft pools sit on the diagonal the headline
 * occupies, upper-left and lower-right, and a vertical wash lifts the top and
 * bottom edges. The band across the middle is left almost clear, so the
 * photograph reads at full strength exactly where no type is set.
 */
const FOG = [
  'radial-gradient(76% 56% at 15% 27%, var(--scene-approach) 0%, color-mix(in oklab, var(--scene-approach) 74%, transparent) 45%, transparent 78%)',
  'radial-gradient(76% 56% at 85% 73%, var(--scene-approach) 0%, color-mix(in oklab, var(--scene-approach) 74%, transparent) 45%, transparent 78%)',
  'linear-gradient(to bottom, color-mix(in oklab, var(--scene-approach) 46%, transparent) 0%, color-mix(in oklab, var(--scene-approach) 16%, transparent) 42%, color-mix(in oklab, var(--scene-approach) 26%, transparent) 62%, color-mix(in oklab, var(--scene-approach) 74%, transparent) 100%)',
].join(', ')

/**
 * The scrubbed timeline. Module-level so its identity is stable across
 * renders — usePinnedScene keeps it in a dependency list.
 *
 * Travel is proportional to the house parallax rates (0.3 / 0.6 / 1.0), so the
 * three layers separate by the same ratios used everywhere else on the site.
 */
function buildApproach(timeline: gsap.core.Timeline) {
  timeline
    .fromTo('[data-far]', { scale: 1.15 }, { scale: 1, yPercent: -6, ease: 'none' }, 0)
    .to('[data-mid]', { yPercent: -12, ease: 'none' }, 0)
    .to('[data-near]', { yPercent: -20, ease: 'none' }, 0)
}

export default function Approach() {
  const scope = useRef<HTMLDivElement>(null)

  usePinnedScene(scope, { build: buildApproach })
  useWipe(scope, { items: '[data-near] span[aria-hidden="true"]', delay: 0.2, step: 0.07 })

  // The cue is a hint to start scrolling. Once you have, it has done its job.
  const moved = useScrollPast(200)

  return (
    <Section ground="approach" flush shell={false} innerClassName="p-0">
      <div ref={scope} className="relative min-h-svh overflow-clip">
        <div data-far aria-hidden="true" className="absolute inset-0 will-change-transform">
          <Plate source={plates.hero} alt="" priority="first" sizes="100vw" />
        </div>

        <div
          data-mid
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 will-change-transform"
          style={{ backgroundImage: FOG }}
        />

        <div className="relative flex min-h-svh flex-col justify-center px-[var(--gutter)] py-[18vh]">
          <div data-near className="mx-auto w-full max-w-[var(--shell)] will-change-transform">
            <Display
              as="h1"
              lines={[...approach.lines]}
              spread
              split
              className="[&>span:nth-child(2)]:mt-[13vh]"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-[var(--gutter)] pb-8">
          <div className="mx-auto flex w-full max-w-[var(--shell)] items-end justify-between gap-8">
            <Eyebrow>{approach.eyebrow}</Eyebrow>
            <div
              className="flex items-center gap-3 transition-opacity duration-500"
              style={{ opacity: moved ? 0 : 1 }}
            >
              <Eyebrow>{approach.cue}</Eyebrow>
              <Rule />
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

/** A hairline that drops and repeats. The only decorative motion in the scene. */
function Rule() {
  return (
    <span
      aria-hidden="true"
      className="block h-8 w-px overflow-hidden"
      style={{ backgroundColor: 'color-mix(in oklab, var(--fore) 22%, transparent)' }}
    >
      <span
        className="cue-fall block h-3 w-px"
        style={{ backgroundColor: 'var(--fore)' }}
      />
    </span>
  )
}
