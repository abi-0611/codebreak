import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Section, Eyebrow, Body, Plate, Pill } from '@/components/ui'
import { useReveal } from '@/lib/motion'
import { plates } from '@/content/plates'
import { briefPage, briefs, cta, legends, routes } from '@/content/site'
import NotFound from '@/routes/NotFound'

/* --------------------------------------------------------------------------
   One route brief, reached from its card.

   ┌──────────────────────────────────────────────────────────────────────┐
   │ THE ROUTE NAME IS NEVER SET AS TEXT ON THIS PAGE.                    │
   │                                                                      │
   │ It comes from the marker plate in the photograph, exactly as it does │
   │ on the card. The URL is a filing reference rather than a slugged     │
   │ name for the same reason — an address bar is a place a name is       │
   │ published in plain sight. All five pages are this one component with │
   │ different data; there is no per-route branch anywhere in it.         │
   └──────────────────────────────────────────────────────────────────────┘
   -------------------------------------------------------------------------- */

export default function RouteDetail() {
  const params = useParams<{ ref: string }>()
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]', start: 'top 95%' })

  const route = routes.find((one) => one.ref.toLowerCase() === params.ref?.toLowerCase())
  const brief = route ? briefs[route.ref] : undefined
  if (!route || !brief) return <NotFound />

  const stats: [string, string][] = [
    ['Sector', route.sector],
    ['Altitude', route.altitude],
    ['Grade', route.grade],
    ['Duration', route.duration],
  ]

  return (
    <Section ground="camp" innerClassName="pt-[calc(var(--scene-pad)+4rem)]">
      <div ref={scope}>
        <div data-rise className="flex items-baseline justify-between gap-6">
          <Link
            to={briefPage.back.to}
            className="type-label transition-opacity duration-200 hover:opacity-60"
            style={{ color: 'var(--fore-muted)' }}
          >
            {briefPage.back.label}
          </Link>
          <Eyebrow>{route.ref}</Eyebrow>
        </div>

        <div data-rise className="mt-10">
          <Eyebrow as="h1">{briefPage.eyebrow}</Eyebrow>
        </div>

        <div className="mt-6 grid gap-12 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          {/* Shown at its own ratio rather than cropped to a banner. A crop is
              a decision about what to throw away, and what would be thrown
              away here is the middle of the frame. */}
          <div
            data-rise
            className="w-full overflow-hidden border lg:col-span-5"
            style={{
              aspectRatio: `${plates[route.plate].width} / ${plates[route.plate].height}`,
              borderColor: 'var(--rule)',
            }}
          >
            <Plate
              source={plates[route.plate]}
              alt={legends.route(route.name)}
              priority="early"
              sizes="(min-width: 64rem) 38vw, 100vw"
            />
          </div>

          <div data-rise className="space-y-6 lg:col-span-6 lg:col-start-7">
            {brief.copy.map((line) => (
              <Body key={line.slice(0, 24)} full className="max-w-[58ch]">
                {line}
              </Body>
            ))}
          </div>

          <div data-rise className="lg:col-span-6 lg:col-start-7">
            <Eyebrow as="h2">{briefPage.stats}</Eyebrow>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6">
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
              <div className="col-span-2">
                <dt className="type-label" style={{ color: 'var(--fore-muted)' }}>
                  {briefPage.season}
                </dt>
                <dd className="type-small m-0 mt-1" style={{ color: 'var(--fore)' }}>
                  {brief.season}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div data-rise className="mt-24">
          <Eyebrow as="h2">{briefPage.stages}</Eyebrow>
          <ol className="m-0 mt-8 list-none p-0">
            {brief.waypoints.map((point, i) => (
              <li
                key={point.name}
                className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-t py-5"
                style={{ borderColor: 'var(--rule)' }}
              >
                <span className="type-label" style={{ color: 'var(--fore-muted)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="type-body" style={{ color: 'var(--fore)' }}>
                  {point.name}
                </span>
                <span className="type-small" style={{ color: 'var(--fore-muted)' }}>
                  {point.altitude}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div data-rise className="mt-20">
          <Pill to={cta.to} tone="quiet">
            {cta.label}
          </Pill>
        </div>
      </div>
    </Section>
  )
}
