import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Section, Eyebrow, Display, Body, Figure } from '@/components/ui'
import { useReveal } from '@/lib/motion'
import { plates } from '@/content/plates'
import { journal } from '@/content/site'

/* --------------------------------------------------------------------------
   Scene 8 — the field journal.

   Three entries, each linking to a real page. No entry is a stub and none of
   the three links goes nowhere: a footer or a list full of links that resolve
   to a 404 is the loudest signal a site is a set rather than a company.
   -------------------------------------------------------------------------- */

export default function Journal() {
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]' })

  return (
    <Section id="journal" ground="dusk">
      <div ref={scope}>
        <div data-rise className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow as="h2">{journal.eyebrow}</Eyebrow>
            <Display text={journal.title} step="title" className="mt-6" />
          </div>
        </div>

        <ul className="m-0 mt-16 list-none space-y-0 p-0">
          {journal.entries.map((entry) => (
            <li
              key={entry.slug}
              data-rise
              className="border-t py-12 first:pt-0"
              style={{ borderColor: 'var(--rule)' }}
            >
              <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
                <div className="lg:col-span-2">
                  <time className="type-label block" dateTime={entry.stamp} style={{ color: 'var(--fore-muted)' }}>
                    {entry.date}
                  </time>
                </div>

                <div className={entry.plate ? 'lg:col-span-5' : 'lg:col-span-7'}>
                  <h3 className="type-title m-0">
                    <Link
                      to={`/journal/${entry.slug}`}
                      className="transition-opacity duration-200 hover:opacity-60"
                      style={{ color: 'var(--fore)' }}
                    >
                      {entry.title}
                    </Link>
                  </h3>
                  <Body className="mt-5">{entry.standfirst}</Body>
                  <p className="type-label mt-6" style={{ color: 'var(--fore-muted)' }}>
                    {entry.author}
                  </p>
                </div>

                {entry.plate ? (
                  <div className="lg:col-span-4 lg:col-start-9">
                    <Figure
                      source={plates[entry.plate]}
                      alt="An open field notebook: a ridgeline drawn across the left page, notes down the right."
                      caption={entry.caption ?? ''}
                      meta="Pl. 11"
                      sizes="(min-width: 64rem) 30vw, 100vw"
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
