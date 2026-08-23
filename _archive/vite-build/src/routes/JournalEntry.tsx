import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Section, Eyebrow, Display, Body, Figure } from '@/components/ui'
import { useReveal } from '@/lib/motion'
import { plates } from '@/content/plates'
import { journal, pages } from '@/content/site'
import NotFound from '@/routes/NotFound'

/**
 * One journal entry, in a plain reading layout: date, title, standfirst, body,
 * the entry's plate where it has one, and links to its neighbours.
 *
 * Every entry in the list resolves here. None of the three is a stub, and the
 * previous/next pair means the page is never a dead end — a reader who has
 * followed a link out of the home page can keep going without the back button.
 */
export default function JournalEntry() {
  const { slug } = useParams<{ slug: string }>()
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]', start: 'top 95%' })

  const index = journal.entries.findIndex((one) => one.slug === slug)
  if (index === -1) return <NotFound />

  const entry = journal.entries[index]
  const previous = journal.entries[index - 1]
  const next = journal.entries[index + 1]

  return (
    <Section ground="dusk" innerClassName="pt-[calc(var(--scene-pad)+4rem)]">
      <div ref={scope}>
        <div data-rise>
          <Link
            to={pages.journal.back.to}
            className="type-label transition-opacity duration-200 hover:opacity-60"
            style={{ color: 'var(--fore-muted)' }}
          >
            {pages.journal.back.label}
          </Link>
        </div>

        <article className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <header data-rise className="lg:col-span-8">
            <Eyebrow>{pages.journal.eyebrow}</Eyebrow>
            <Display as="h1" text={entry.title} step="title" className="mt-6" />
            <Body className="mt-6" lead>
              {entry.standfirst}
            </Body>
            <p className="type-label mt-8" style={{ color: 'var(--fore-muted)' }}>
              <time dateTime={entry.stamp}>{entry.date}</time> — {entry.author}
            </p>
          </header>

          <div data-rise className="lg:col-span-7 lg:col-start-2">
            <div className="space-y-6">
              {entry.body.map((line) => (
                <Body key={line.slice(0, 24)} full className="max-w-[62ch]">
                  {line}
                </Body>
              ))}
            </div>

            {entry.plate ? (
              <div className="mt-14 max-w-[38rem]">
                <Figure
                  source={plates[entry.plate]}
                  alt="An open field notebook: a ridgeline drawn across the left page, notes down the right."
                  caption={entry.caption ?? ''}
                  meta="Pl. 11"
                  sizes="(min-width: 64rem) 38vw, 100vw"
                />
              </div>
            ) : null}
          </div>
        </article>

        <nav
          data-rise
          aria-label="Journal entries"
          className="mt-24 grid gap-8 border-t pt-8 sm:grid-cols-2"
          style={{ borderColor: 'var(--rule)' }}
        >
          <div>
            {previous ? (
              <Link to={`/journal/${previous.slug}`} className="group block">
                <span className="type-label block" style={{ color: 'var(--fore-muted)' }}>
                  {pages.journal.previous}
                </span>
                <span
                  className="type-lead mt-2 block transition-opacity duration-200 group-hover:opacity-60"
                  style={{ color: 'var(--fore)' }}
                >
                  {previous.title}
                </span>
              </Link>
            ) : null}
          </div>
          <div className="sm:text-right">
            {next ? (
              <Link to={`/journal/${next.slug}`} className="group block">
                <span className="type-label block" style={{ color: 'var(--fore-muted)' }}>
                  {pages.journal.next}
                </span>
                <span
                  className="type-lead mt-2 block transition-opacity duration-200 group-hover:opacity-60"
                  style={{ color: 'var(--fore)' }}
                >
                  {next.title}
                </span>
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </Section>
  )
}
