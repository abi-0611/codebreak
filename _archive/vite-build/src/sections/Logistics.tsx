import { useRef } from 'react'
import { Section, Eyebrow, Display, Body, Figure } from '@/components/ui'
import { useReveal } from '@/lib/motion'
import { plates } from '@/content/plates'
import { legends, logistics } from '@/content/site'

/* --------------------------------------------------------------------------
   Scene 6 — logistics.

   The figure renders through the same <Figure> primitive as the ethos plate
   above it and the journal plate below: same frame, same caption weight, same
   rule, same spacing, same nothing-happens-on-hover. There is no prop that
   would let it be treated differently and none may be added.

   Its caption is fixed and deliberately flat. No wit, no nudge, no "look
   closer" — a sentence with any personality in it beside a photograph is a
   sentence that tells a reader the photograph matters.
   -------------------------------------------------------------------------- */

export default function Logistics() {
  const scope = useRef<HTMLDivElement>(null)
  const kit = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]' })
  useReveal(kit, { items: '[data-rise]' })

  return (
    <Section id="logistics" ground="camp">
      <div ref={scope} className="grid gap-14 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="lg:col-span-5">
          <div data-rise>
            <Eyebrow as="h2">{logistics.eyebrow}</Eyebrow>
            <Display text={logistics.title} step="title" className="mt-6" />
          </div>
          <div data-rise className="mt-10 space-y-6">
            {logistics.body.map((line) => (
              <Body key={line.slice(0, 24)}>{line}</Body>
            ))}
          </div>
        </div>

        <div data-rise data-keep-clear className="lg:col-span-6 lg:col-start-7">
          <Figure
            source={plates.logistics}
            alt={legends.ticket()}
            caption={logistics.caption}
            meta={logistics.meta}
            priority="early"
            sizes="(min-width: 64rem) 46vw, 100vw"
          />
        </div>
      </div>

      <div id="equipment" ref={kit} className="mt-28 scroll-mt-28">
        <div data-rise className="grid gap-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <div className="lg:col-span-5">
            <Eyebrow as="h2">{logistics.kit.eyebrow}</Eyebrow>
            <Display text={logistics.kit.title} step="title" className="mt-4" />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Body full>{logistics.kit.copy}</Body>
            <ul className="m-0 mt-8 grid list-none gap-x-8 gap-y-3 p-0 sm:grid-cols-2">
              {logistics.kit.items.map((item) => (
                <li
                  key={item}
                  className="type-small border-t pt-3"
                  style={{ borderColor: 'var(--rule)', color: 'var(--fore-muted)' }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  )
}
