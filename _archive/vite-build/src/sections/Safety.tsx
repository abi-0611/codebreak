import { useRef } from 'react'
import { Section, Eyebrow, Display, Body, Seal } from '@/components/ui'
import { useReveal } from '@/lib/motion'
import { accreditations, safety } from '@/content/site'
import * as rings from '@/content/outlines'

/* --------------------------------------------------------------------------
   Scene 5 — safety.

   The three columns are the section. They exist to inform, and this scene has
   to survive the deletion of everything below them.

   The accreditation row underneath is decoration that happens to be readable,
   which is what real accreditation rows are. Four seals, one construction,
   one generator run — identical diameter, ring weight, tracking and opacity.

   Deliberately absent, and not to be added: a hover state, a link, a tooltip,
   a caption under any seal, a title attribute. Real badge rows have none of
   those, and each one would single out whichever badge it landed on.
   -------------------------------------------------------------------------- */

const RING = {
  sealOne: rings.sealOne,
  sealTwo: rings.sealTwo,
  sealThree: rings.sealThree,
  sealFour: rings.sealFour,
} as const

export default function Safety() {
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]' })

  return (
    <Section id="safety" ground="camp" from="ridge">
      <div ref={scope}>
        <div data-rise className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow as="h2">{safety.eyebrow}</Eyebrow>
            <Display text={safety.title} step="title" className="mt-6" />
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Body>{safety.body}</Body>
          </div>
        </div>

        <div data-rise className="mt-20 grid gap-12 md:grid-cols-3 md:gap-x-[var(--gutter)]">
          {safety.columns.map((column) => (
            <div key={column.term} className="border-t pt-6" style={{ borderColor: 'var(--rule)' }}>
              <h3 className="type-label m-0" style={{ color: 'var(--fore)' }}>
                {column.term}
              </h3>
              <Body className="mt-4" full>
                {column.copy}
              </Body>
            </div>
          ))}
        </div>

        {/* `data-keep-clear` moves the floating CTA out of the way while this
            row is in the lower band of the viewport. A fixed pill parked over
            a badge is a badge nobody on a phone ever reads. */}
        <div data-rise data-keep-clear className="mt-24">
          <Eyebrow className="text-center">{safety.accreditation}</Eyebrow>
          <ul
            className="m-0 mt-10 grid list-none grid-cols-2 justify-items-center gap-x-6 gap-y-12 p-0 sm:grid-cols-4"
            style={{ color: 'var(--stone)' }}
          >
            {accreditations.map((mark) => (
              <li key={mark.ring}>
                <Seal ring={RING[mark.ring]} label={`${mark.name} — ${mark.registration}`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
