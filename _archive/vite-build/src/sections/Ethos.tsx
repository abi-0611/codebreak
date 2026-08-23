import { useRef } from 'react'
import { Section, Eyebrow, Display, Body, Figure } from '@/components/ui'
import { useReveal } from '@/lib/motion'
import { plates } from '@/content/plates'
import { ethos } from '@/content/site'

/* --------------------------------------------------------------------------
   Scene 2 — ethos.

   No pin. The page has just spent 250vh under a scrub and needs to sit still
   for a moment; the whole scene is a single reveal-on-enter and then it stays.

   The asymmetry is the composition: six columns of plate anchored top left,
   four of copy in the last column dropped 160px down the grid, and two columns
   of air on the diagonal between them — the same diagonal the opening headline
   is set on. It is deliberately unbalanced and it must not be tidied up.
   -------------------------------------------------------------------------- */

export default function Ethos() {
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]' })

  return (
    <Section id="ethos" ground="ascent" from="approach">
      <div ref={scope} className="grid gap-14 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div data-rise className="lg:col-span-6">
          <Figure
            source={plates.ethos}
            alt="A broad shouldered ridge under flat cloud, seen from the valley floor."
            caption={ethos.caption}
            meta="Pl. 02"
            sizes="(min-width: 64rem) 46vw, 100vw"
          />
        </div>

        <div className="lg:col-span-4 lg:col-start-9 lg:pt-[160px]">
          <div data-rise>
            <Eyebrow as="h2">{ethos.eyebrow}</Eyebrow>
          </div>
          <div data-rise>
            <Display text={ethos.title} step="title" className="mt-6" />
          </div>
          <div data-rise className="mt-10 space-y-6">
            {ethos.body.map((line) => (
              <Body key={line.slice(0, 24)}>{line}</Body>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
