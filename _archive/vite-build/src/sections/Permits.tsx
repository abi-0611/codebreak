import { useRef } from 'react'
import { Section, Eyebrow, Display, Body, Figure } from '@/components/ui'
import Accordion from '@/components/ui/Accordion'
import { useReveal } from '@/lib/motion'
import { plates } from '@/content/plates'
import { legends, permits } from '@/content/site'

/* --------------------------------------------------------------------------
   Scene 7 — permits.

   Four panels, and NONE of them is open on load. Do not default-open the
   first one to "show the pattern": a panel that is already open is a panel
   nobody learns to open, and the other three then never get touched.

   <Accordion> unmounts a collapsed panel outright rather than collapsing it
   to zero height — that is the whole reason the component was rebuilt in
   Phase 2 and it is verified live on /style. A closed panel contributes no
   nodes and no text to the document, and the figure inside panel two is
   therefore not in the document either.

   The figure is the same <Figure> primitive as the logistics and journal
   plates, at the same weight, with the same flat caption.
   -------------------------------------------------------------------------- */

export default function Permits() {
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]' })

  const items = permits.panels.map((panel) => ({
    id: panel.id,
    question: panel.question,
    body: (
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="space-y-5 lg:col-span-6">
          {panel.body.map((line) => (
            <Body key={line.slice(0, 24)} full>
              {line}
            </Body>
          ))}
        </div>

        {panel.id === 'timing' ? (
          <div className="lg:col-span-5 lg:col-start-8">
            <Figure
              source={plates.permit}
              alt={legends.permit()}
              caption={permits.caption}
              meta={permits.meta}
              priority="early"
              sizes="(min-width: 64rem) 38vw, 100vw"
            />
          </div>
        ) : null}
      </div>
    ),
  }))

  return (
    <Section id="permits" ground="dusk" from="camp">
      <div ref={scope}>
        <div data-rise className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow as="h2">{permits.eyebrow}</Eyebrow>
            <Display text={permits.title} step="title" className="mt-6" />
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Body>{permits.body}</Body>
          </div>
        </div>

        <div data-rise data-keep-clear className="mt-16">
          <Accordion items={items} />
        </div>
      </div>
    </Section>
  )
}
