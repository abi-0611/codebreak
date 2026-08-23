import { useRef } from 'react'
import { Section, Eyebrow, Plate } from '@/components/ui'
import { OutlineText } from '@/lib/split'
import { usePinnedScene, useWipe } from '@/lib/motion'
import { sceneTop, sceneLow } from '@/content/outlines'
import { plates } from '@/content/plates'
import { feature, spoken } from '@/content/site'

/* --------------------------------------------------------------------------
   Scene 4 — the pinned feature.

   The site's cinematic centrepiece and the one place the motion budget is
   spent: pinned for 250vh, backdrop scrubbed, everything legible held still.

   The headline is drawn from committed path geometry — see the long note in
   lib/split.tsx. It is set once on enter and then it STAYS. Its opacity is
   never tied to scrub progress, because a headline that only exists between
   two scroll offsets is a headline that gets missed. Only the backdrop and
   the veil move.

   Treat the line as pure art direction. No highlight, no colour shift, no
   lingering hover state, nothing that draws a second look at it.
   -------------------------------------------------------------------------- */

/**
 * Both lines were produced in one run and share a vertical band, so scaling
 * them to a common HEIGHT — not a common width — is what keeps their cap
 * heights identical. The lower line is therefore set to the exact ratio of the
 * two widths, read from the generated data rather than typed, so a regenerated
 * set stays in register without anybody remembering to come back here.
 */
const LOW_WIDTH = `${(sceneLow.ratio / sceneTop.ratio) * 100}%`

/**
 * The headline is set as wide as the shell allows OR as wide as the viewport
 * is tall will permit, whichever is smaller.
 *
 * Two stacked lines drawn at the upper ratio are 2 / 3.671 of their own width
 * high, so a headline set to the full shell on a short laptop screen is taller
 * than the screen and the second line disappears off the bottom of the pin.
 * Capping against `vh` is what keeps the whole line on screen at every window
 * shape — which for the biggest thing on the site is not a detail.
 */
const FIT = 'min(100%, 106vh)'

/**
 * The mote field. Thirty-four, deterministic, CSS-only — no rAF, no canvas, no
 * per-frame JavaScript at all, so the cost is whatever the compositor charges
 * for thirty-four transformed 2px squares, which is nothing.
 *
 * Deterministic rather than random: a field that reshuffles on every render is
 * a field that flickers on every state change elsewhere in the scene.
 */
const MOTES = (() => {
  let seed = 20240914
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  return Array.from({ length: 34 }, () => ({
    left: `${(next() * 100).toFixed(2)}%`,
    top: `${(next() * 100).toFixed(2)}%`,
    size: `${(1 + next() * 1.8).toFixed(2)}px`,
    duration: `${(16 + next() * 20).toFixed(1)}s`,
    delay: `${(-next() * 30).toFixed(1)}s`,
    opacity: 0.14 + next() * 0.3,
  }))
})()

function buildRidge(timeline: gsap.core.Timeline) {
  timeline
    .fromTo('[data-far]', { scale: 1.2 }, { scale: 1, yPercent: -5, ease: 'none' }, 0)
    .to('[data-veil]', { opacity: 0.58, ease: 'none' }, 0)
}

export default function Ridge() {
  const scope = useRef<HTMLDivElement>(null)
  const line = spoken('scene')

  usePinnedScene(scope, { build: buildRidge })
  useWipe(scope, { items: '[data-wipe]', step: 0.14, start: 'top 70%' })

  return (
    <Section
      id="ridge"
      ground="ridge"
      from="camp"
      flush
      shell={false}
      keepClear
      innerClassName="p-0"
    >
      <div ref={scope} className="relative min-h-svh overflow-clip">
        <div
          data-far
          aria-hidden="true"
          className="absolute inset-0 will-change-transform"
          style={{ opacity: 0.65 }}
        >
          <Plate source={plates.ridge} alt="" priority="early" sizes="100vw" />
        </div>

        {/* Holds the brightest thing in the frame — the moon — under the
            contrast floor for --bone type. Deepens across the pin; the value
            here is the worst case, at the top of the scene. */}
        <div
          data-veil
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: 'var(--scene-ridge)', opacity: 0.42 }}
        />

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
          {MOTES.map((mote, i) => (
            <span
              key={i}
              className="mote absolute block rounded-full"
              style={{
                left: mote.left,
                top: mote.top,
                width: mote.size,
                height: mote.size,
                backgroundColor: 'var(--bone)',
                animationDuration: mote.duration,
                animationDelay: mote.delay,
                // The keyframes fade each mote in and out around this value,
                // so it is passed as a property rather than set as `opacity`,
                // which the animation would immediately override.
                ['--mote-peak' as string]: mote.opacity,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="relative flex min-h-svh flex-col justify-center px-[var(--gutter)] py-[11vh]">
          <div className="mx-auto w-full max-w-[var(--shell)]">
            <Eyebrow as="h2">{feature.eyebrow}</Eyebrow>

            {/* One sentence set as two drawings. The wrapper carries the whole
                line as its accessible name and both halves are muted, so it is
                announced once rather than twice in pieces. `label` is passed
                for the reader of this file and is not rendered while muted. */}
            <div role="img" aria-label={line} className="mt-8" style={{ width: FIT }}>
              <span data-wipe className="block">
                <OutlineText paths={sceneTop.paths} viewBox={sceneTop.viewBox} label={line} mute />
              </span>
              <span data-wipe className="block" style={{ width: LOW_WIDTH, marginTop: '-1.5%' }}>
                <OutlineText paths={sceneLow.paths} viewBox={sceneLow.viewBox} label={line} mute />
              </span>
            </div>

            <p
              className="type-small mt-10 max-w-[38ch]"
              style={{ color: 'var(--fore-muted)' }}
            >
              {feature.note}
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
