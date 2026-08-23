import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Section, Eyebrow, Display, Body, Plate } from '@/components/ui'
import Carousel from '@/components/ui/Carousel'
import { useReveal } from '@/lib/motion'
import { plates } from '@/content/plates'
import { routebook, routes, legends, type RouteCard } from '@/content/site'

/* --------------------------------------------------------------------------
   Scene 3 — the route book.

   ┌──────────────────────────────────────────────────────────────────────┐
   │ THE FIVE CARDS ARE ONE FUNCTION CALLED FIVE TIMES.                   │
   │                                                                      │
   │ There is no per-card branch anywhere in this file and none may be    │
   │ added: no card gets its own crop, its own grade line, its own load   │
   │ policy or its own link shape. `Card` receives an entry from          │
   │ content/site.ts and nothing else. Identical-but-for-the-data is the  │
   │ whole construction — a card that differs in any respect is the card  │
   │ every visitor looks at hardest, which is exactly backwards.          │
   └──────────────────────────────────────────────────────────────────────┘

   Each photograph carries its route's name on a riveted marker plate in the
   frame. The block below the picture carries sector, altitude, grade and
   duration — never the name. That holds for all five. The four names that
   also exist as ordinary text get it from the departures table further down,
   which is a real timetable and reads as one.

   Every plate loads on the same policy — `early`, well ahead of being scrolled
   to — because four of the five sit off-screen in a scroller nobody has
   advanced yet, and a card a visitor swipes to and finds blank is a card that
   may as well not be there.

   Card width at the small breakpoint is 80vw and is a measured value, not a
   taste one: it puts the photograph at 300px on a 375px phone, which is the
   width the lettering inside these plates was checked against when they were
   drawn. Narrower and the type in the frame goes under the legibility floor.
   -------------------------------------------------------------------------- */

/** The card. One construction, five identical calls. */
function Card({ route }: { route: RouteCard }) {
  const stats: [string, string][] = [
    ['Sector', route.sector],
    ['Altitude', route.altitude],
    ['Grade', route.grade],
    ['Duration', route.duration],
  ]

  return (
    <div className="flex h-full flex-col">
      <div
        className="w-full overflow-hidden border"
        style={{ aspectRatio: '4 / 5', borderColor: 'var(--rule)' }}
      >
        <Plate
          source={plates[route.plate]}
          alt={legends.route(route.name)}
          priority="early"
          sizes="(min-width: 64rem) 32rem, (min-width: 40rem) 46vw, 80vw"
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
        {stats.map(([term, value]) => (
          <div key={term}>
            <dt className="type-label" style={{ color: 'var(--fore-muted)' }}>
              {term}
            </dt>
            <dd className="type-small m-0 mt-1" style={{ color: 'var(--fore)' }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div
        className="mt-6 border-t pt-4"
        style={{ borderColor: 'var(--rule)' }}
      >
        <Link
          to={`/routes/${route.ref.toLowerCase()}`}
          className="type-label inline-flex items-center gap-2 transition-opacity duration-200 hover:opacity-60"
          style={{ color: 'var(--fore)' }}
        >
          {routebook.cardAction}
          <span aria-hidden="true">{route.ref}</span>
        </Link>
      </div>
    </div>
  )
}

export default function Routebook() {
  const scope = useRef<HTMLDivElement>(null)
  const tail = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]' })
  useReveal(tail, { items: '[data-rise]' })

  const { departures, grades } = routebook

  return (
    <Section id="routes" ground="camp" from="ascent">
      <div ref={scope}>
        <div data-rise className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow as="h2">{routebook.eyebrow}</Eyebrow>
            <Display text={routebook.title} className="mt-6" />
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Body>{routebook.body}</Body>
          </div>
        </div>

        <div data-rise className="mt-16" data-keep-clear>
          <Carousel
            label={routebook.cardsLabel}
            cardClassName="w-[80vw] sm:w-[46vw] lg:w-[32rem]"
            items={routes.map((route) => ({
              id: route.ref,
              label: route.name,
              content: <Card route={route} />,
            }))}
          />
        </div>
      </div>

      <div ref={tail} className="mt-28">
        <div data-rise className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow as="h2">{departures.eyebrow}</Eyebrow>
            <Display text={departures.title} step="title" className="mt-4" />
          </div>
        </div>

        <div data-rise data-keep-clear className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                {departures.columns.map((head) => (
                  <th
                    key={head}
                    scope="col"
                    className="type-label pb-4 font-medium"
                    style={{ color: 'var(--fore-muted)' }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departures.rows.map((row) => (
                <tr key={row[0]} style={{ borderBottom: '1px solid var(--rule)' }}>
                  {row.map((cell, i) => (
                    <td
                      key={`${row[0]}-${i}`}
                      className="type-small py-5 pr-6"
                      style={{ color: i === 0 ? 'var(--fore)' : 'var(--fore-muted)' }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div data-rise>
          <Body className="mt-6">{departures.note}</Body>
        </div>

        <div id="grades" data-rise className="mt-24 scroll-mt-28">
          <Eyebrow as="h2">{grades.eyebrow}</Eyebrow>
          <Display text={grades.title} step="title" className="mt-4" />
          <dl className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-x-[var(--gutter)]">
            {grades.items.map((item) => (
              <div key={item.term} className="border-t pt-5" style={{ borderColor: 'var(--rule)' }}>
                <dt className="type-label" style={{ color: 'var(--fore)' }}>
                  {item.term}
                </dt>
                <dd className="type-small m-0 mt-3" style={{ color: 'var(--fore-muted)' }}>
                  {item.copy}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  )
}
