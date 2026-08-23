import { useRef } from 'react'
import { Section, Eyebrow, Display, Body } from '@/components/ui'
import { useReveal } from '@/lib/motion'
import { legal } from '@/content/site'

/**
 * Terms, privacy and insurance, on one page with three anchored parts.
 *
 * It exists because the footer links to it, and Rule 8 does not have an
 * exception for the boring pages. It is also the page a visitor is most likely
 * to open expecting nothing, which is a reason to write it properly rather
 * than a reason not to write it at all.
 */
export default function Legal() {
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]', start: 'top 95%' })

  return (
    <Section ground="dusk" innerClassName="pt-[calc(var(--scene-pad)+4rem)]">
      <div ref={scope}>
        <div data-rise className="lg:max-w-[42rem]">
          <Eyebrow>{legal.eyebrow}</Eyebrow>
          <Display as="h1" text={legal.title} step="title" className="mt-6" />
          <Body className="mt-6" lead>
            {legal.intro}
          </Body>
        </div>

        <div className="mt-20 space-y-20">
          {legal.parts.map((part) => (
            <section
              key={part.id}
              id={part.id}
              data-rise
              className="grid scroll-mt-28 gap-8 border-t pt-8 lg:grid-cols-12 lg:gap-x-[var(--gutter)]"
              style={{ borderColor: 'var(--rule)' }}
            >
              <h2 className="type-title m-0 lg:col-span-4">{part.title}</h2>
              <div className="space-y-6 lg:col-span-7 lg:col-start-6">
                {part.body.map((line) => (
                  <Body key={line.slice(0, 24)} full className="max-w-[62ch]">
                    {line}
                  </Body>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Section>
  )
}
