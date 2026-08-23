import { useCallback, useEffect, useRef, useState } from 'react'
import Section from '@/components/ui/Section'
import Eyebrow from '@/components/ui/Eyebrow'
import Display from '@/components/ui/Display'
import Body from '@/components/ui/Body'
import Figure from '@/components/ui/Figure'
import Pill from '@/components/ui/Pill'
import Seal from '@/components/ui/Seal'
import Carousel from '@/components/ui/Carousel'
import Accordion from '@/components/ui/Accordion'
import Ticker from '@/components/ui/Ticker'
import Mark from '@/components/ui/Mark'
import { useReveal, usePinnedScene, useParallax, LAYER, prefersLessMotion } from '@/lib/motion'
import { OutlineText } from '@/lib/split'
import { accreditations, brand, cta, spoken } from '@/content/site'
import { plates, routeSet } from '@/content/plates'
import {
  sceneTop,
  sceneLow,
  sealOne,
  sealTwo,
  sealThree,
  sealFour,
} from '@/content/outlines'
import {
  swatches,
  pairings,
  steps,
  sample,
  cards,
  panels,
  ticker,
  drawn,
  rings,
} from '@/content/specimen'

/* --------------------------------------------------------------------------
   /style — the design-system specimen.

   Development only; App.tsx registers this route behind import.meta.env.DEV so
   it never reaches a deployed bundle. Every number on this page is measured
   from the live stylesheet rather than transcribed, so the page cannot drift
   away from globals.css.
   -------------------------------------------------------------------------- */

/* --- Colour maths, computed in the browser from the shipped stylesheet ---- */

/** Follow `--ink: var(--color-ink)` chains until a real value comes back. */
function readToken(name: string, styles: CSSStyleDeclaration): string {
  let value = styles.getPropertyValue(name).trim()
  for (let i = 0; i < 4 && value.startsWith('var('); i += 1) {
    const inner = value.slice(4, value.indexOf(')')).trim()
    value = styles.getPropertyValue(inner).trim()
  }
  return value
}

function channel(v: number) {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string) {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  const n = parseInt(full, 16)
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  )
}

function ratio(a: string, b: string) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Ring geometry by the key content/site.ts names it. */
const RINGS = { sealOne, sealTwo, sealThree, sealFour }

/* --- The pinned scene's scrubbed timeline --------------------------------
   Module scope so its identity is stable across renders and the hook's
   effect does not tear down and rebuild the trigger on every pass. */
function buildRidge(timeline: gsap.core.Timeline) {
  timeline
    .to('[data-scene-drift]', { yPercent: -12, ease: 'none' }, 0)
    .to('[data-scene-veil]', { opacity: 0.55, ease: 'none' }, 0)
}

/* ========================================================================== */

export default function Specimen() {
  return (
    <>
      <Cover />
      <Colour />
      <Type />
      <Primitives />
      <Harvest />
      <Motion />
    </>
  )
}

/* --- 1. Cover ------------------------------------------------------------- */

function Cover() {
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]', start: 'top 95%' })

  return (
    <Section ground="approach">
      <div ref={scope} className="pt-16">
        <div data-rise className="flex items-center gap-4">
          <Mark size={26} />
          <Eyebrow strong>{brand.name} — design system</Eyebrow>
        </div>

        <Display
          as="h1"
          lines={['Tokens,', 'type, motion']}
          spread
          className="mt-10"
        />

        <div data-rise className="mt-12 grid gap-10 sm:grid-cols-2">
          <Body lead>{brand.tagline}</Body>
          <div>
            <Body>{brand.what}</Body>
            <Body className="mt-4">
              Understated, technical, a little severe. Short declaratives. Copy that
              respects the reader.
            </Body>
          </div>
        </div>

        <div data-rise className="mt-12 flex flex-wrap items-center gap-4">
          <Pill to={cta.to}>{cta.label}</Pill>
          <Pill to={cta.to} tone="quiet">
            {cta.label}
          </Pill>
          <Eyebrow>{brand.dateline}</Eyebrow>
        </div>
      </div>
    </Section>
  )
}

/* --- 2. Colour ------------------------------------------------------------ */

function Colour() {
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const names = [
      ...swatches.base.map((s) => s.token),
      ...swatches.scenes.map((s) => s.token),
    ]
    const next: Record<string, string> = {}
    for (const name of names) next[name] = readToken(name, styles)
    setValues(next)
  }, [])

  const rows = pairings.map((p) => {
    const fg = values[p.fg]
    const bg = values[p.bg]
    const value = fg && bg ? ratio(fg, bg) : 0
    return { ...p, value, pass: value >= p.min }
  })

  const failures = rows.filter((r) => values[r.fg] && !r.pass).length

  return (
    <Section ground="camp" from="approach">
      <Eyebrow as="h2">Colour</Eyebrow>
      <Display text="Ramp" className="mt-4" />
      <Body className="mt-8">
        Each scene owns a ground. The page cools as you descend and warms again at the
        bottom; that temperature shift is the cinematic move, and it costs no animation.
      </Body>

      <ul className="mt-14 m-0 grid list-none gap-px p-0 sm:grid-cols-2 lg:grid-cols-4">
        {swatches.base.map((s) => (
          <li key={s.token}>
            <div
              className="h-28 w-full border"
              style={{ backgroundColor: `var(${s.token})`, borderColor: 'var(--rule)' }}
            />
            <div className="mt-3">
              <Eyebrow strong>{s.label}</Eyebrow>
              <p className="type-small mt-1 font-mono" style={{ color: 'var(--fore-muted)' }}>
                {values[s.token] ?? s.token}
              </p>
              <p className="type-small mt-1 max-w-[28ch]" style={{ color: 'var(--fore-muted)' }}>
                {s.use}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Eyebrow as="h3" className="mt-20">
        Scene grounds
      </Eyebrow>
      <ul className="mt-6 m-0 grid list-none gap-px p-0 sm:grid-cols-3 lg:grid-cols-5">
        {swatches.scenes.map((s) => (
          <li key={s.token}>
            <div
              className="h-24 w-full border"
              style={{ backgroundColor: `var(${s.token})`, borderColor: 'var(--rule)' }}
            />
            <div className="mt-3">
              <Eyebrow strong>{s.label}</Eyebrow>
              <p className="type-small mt-1 font-mono" style={{ color: 'var(--fore-muted)' }}>
                {values[s.token] ?? s.token}
              </p>
              <p className="type-small mt-1" style={{ color: 'var(--fore-muted)' }}>
                {s.use}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Eyebrow as="h3" className="mt-20">
        Contrast — measured from the live stylesheet
      </Eyebrow>
      <p className="type-small mt-3" style={{ color: 'var(--fore-muted)' }}>
        {rows.length} pairings, {rows.length - failures} clearing their bar
        {failures > 0 ? ` — ${failures} FAILING` : ''}.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead>
            <tr style={{ color: 'var(--fore-muted)' }}>
              {['Foreground', 'Ground', 'Ratio', 'Bar', 'Use'].map((h) => (
                <th
                  key={h}
                  className="type-label border-b py-3 pr-6 font-medium"
                  style={{ borderColor: 'var(--rule)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.fg}-${r.bg}`}>
                <td
                  className="type-small border-b py-3 pr-6 font-mono"
                  style={{ borderColor: 'var(--rule)' }}
                >
                  {r.fg}
                </td>
                <td
                  className="type-small border-b py-3 pr-6 font-mono"
                  style={{ borderColor: 'var(--rule)' }}
                >
                  {r.bg}
                </td>
                <td
                  className="type-small border-b py-3 pr-6 font-mono"
                  style={{
                    borderColor: 'var(--rule)',
                    color: r.pass ? 'var(--fore)' : 'var(--ember)',
                  }}
                >
                  {r.value ? `${r.value.toFixed(2)}:1` : '—'}
                </td>
                <td
                  className="type-small border-b py-3 pr-6"
                  style={{ borderColor: 'var(--rule)', color: 'var(--fore-muted)' }}
                >
                  AA {r.min.toFixed(1)}
                </td>
                <td
                  className="type-small border-b py-3"
                  style={{ borderColor: 'var(--rule)', color: 'var(--fore-muted)' }}
                >
                  {r.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

/* --- 3. Type -------------------------------------------------------------- */

function Type() {
  const [sizes, setSizes] = useState<Record<string, string>>({})
  const scope = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const step of steps) {
      const el = scope.current?.querySelector(`[data-step="${step.token}"]`)
      if (el) next[step.token] = getComputedStyle(el).fontSize
    }
    setSizes(next)
  }, [])

  return (
    <Section ground="ascent" from="camp">
      <Eyebrow as="h2">Type</Eyebrow>
      <Display text="Scale" className="mt-4" />
      <Body className="mt-8">
        Two families. Instrument Serif for scene headlines only; Inter at 400 and 500 for
        everything else. Both self-hosted, latin subset, so nothing blocks first paint.
      </Body>

      <div ref={scope} className="mt-16 space-y-14">
        {steps.map((step) => (
          <div key={step.token}>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <Eyebrow strong>{step.label}</Eyebrow>
              <span className="type-small font-mono" style={{ color: 'var(--fore-muted)' }}>
                {step.token} — {sizes[step.token] ?? 'measuring'}
              </span>
              <span className="type-small" style={{ color: 'var(--fore-muted)' }}>
                {step.note}
              </span>
            </div>
            <p
              data-step={step.token}
              className={`${step.cls} mt-3 mb-0`}
              style={{ color: 'var(--fore)' }}
            >
              {step.cls === 'type-body' || step.cls === 'type-small'
                ? sample.copy
                : sample.headline}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-20">
        <Eyebrow as="h3">Headline set across the viewport, split into units</Eyebrow>
        <Display lines={['Ascent', 'is patience']} spread split className="mt-6" />
      </div>

      <DrawnType />
      <Rings />
    </Section>
  )
}

/**
 * <OutlineText/> plus a live count of the characters the block contributes to
 * the document. Geometry is not text, so this reads 0 — measured from the DOM
 * rather than asserted, which is the only way the claim stays honest as the
 * component changes.
 */
function DrawnType() {
  const scope = useRef<HTMLDivElement>(null)
  const [chars, setChars] = useState<number | null>(null)

  // Two stacked lines, each announced on its own — which is what a sighted
  // reader sees too. One label spanning both would read the pair twice.
  const [top, low] = spoken('scene').split(' ')
  const widest = Math.max(sceneTop.ratio, sceneLow.ratio)

  useEffect(() => {
    setChars(scope.current?.textContent?.trim().length ?? 0)
  }, [])

  return (
    <div className="mt-20">
      <Eyebrow as="h3">Headline drawn from path geometry</Eyebrow>
      <Body className="mt-4">{drawn.note}</Body>

      {/* Both lines share one vertical band, so setting each width in
          proportion to its own ratio lands them on an identical cap height.
          Widths differ, which is what stacked display type actually does. */}
      <div ref={scope} className="mt-10 space-y-3">
        {[
          { set: sceneTop, label: top },
          { set: sceneLow, label: low },
        ].map(({ set, label }) => (
          <div key={label} style={{ width: `${(set.ratio / widest) * 100}%` }}>
            <OutlineText {...set} label={label} />
          </div>
        ))}
      </div>

      <p className="type-small mt-6 font-mono" style={{ color: 'var(--fore-muted)' }}>
        characters contributed to the document: {chars ?? 'measuring'}
      </p>
      <Body className="mt-4">{drawn.caveat}</Body>
    </div>
  )
}

/**
 * The four accreditation seals, at the size the safety scene sets them and
 * again at 375px-phone size. Same live character count as the block above,
 * measured rather than asserted: circular type drawn as geometry contributes
 * no text to the document either.
 */
function Rings() {
  const scope = useRef<HTMLDivElement>(null)
  const [chars, setChars] = useState<number | null>(null)

  useEffect(() => {
    setChars(scope.current?.textContent?.trim().length ?? 0)
  }, [])

  return (
    <div className="mt-20">
      <Eyebrow as="h3">Circular type, one construction</Eyebrow>
      <Body className="mt-4">{rings.note}</Body>

      <div ref={scope} className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-8">
        {accreditations.map(({ ring, name, registration }) => (
          <Seal key={ring} ring={RINGS[ring]} label={`${name}, ${registration}`} />
        ))}
      </div>

      <p className="type-small mt-6 font-mono" style={{ color: 'var(--fore-muted)' }}>
        characters contributed to the document: {chars ?? 'measuring'}
      </p>
      <Body className="mt-4">{rings.caveat}</Body>
    </div>
  )
}

/* --- 4. Primitives -------------------------------------------------------- */

function Primitives() {
  return (
    <Section ground="camp" from="ascent">
      <Eyebrow as="h2">Primitives</Eyebrow>
      <Display text="Furniture" className="mt-4" />
      <Body className="mt-8">
        Every figure on this site renders identically — same frame, same caption weight,
        same spacing. No prop exists that would let one of them look more considered than
        its neighbours.
      </Body>

      <ul className="mt-14 m-0 grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {[plates.ethos, plates.journal, plates.logistics].map((source, i) => (
          <li key={source.stem}>
            <Figure
              source={source}
              alt={`Plate ${i + 1}`}
              caption="Valley transfer, included with every permit."
              meta={`Plate ${String(i + 1).padStart(2, '0')}`}
              aspect="4 / 3"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </li>
        ))}
      </ul>

      <div className="mt-20 grid gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow as="h3">Body at the house measure</Eyebrow>
          <Body className="mt-4">{sample.copy}</Body>
        </div>
        <div>
          <Eyebrow as="h3">Lead</Eyebrow>
          <Body lead className="mt-4">
            {sample.short}
          </Body>
        </div>
      </div>
    </Section>
  )
}

/* --- 5. Harvest ----------------------------------------------------------- */

function Harvest() {
  return (
    <Section ground="dusk" from="camp">
      <Eyebrow as="h2">Harvested components</Eyebrow>
      <Display text="Furnishings" className="mt-4" />
      <Body className="mt-8">
        Six components sourced from the 21st catalogue and rebuilt on our tokens. The
        header, footer and progress rule are on this page already.
      </Body>

      <div className="mt-16">
        <Eyebrow as="h3">Ticker</Eyebrow>
        <div className="mt-6 border-y py-6" style={{ borderColor: 'var(--rule)' }}>
          <Ticker items={ticker} />
        </div>
      </div>

      <div className="mt-20">
        <Eyebrow as="h3">Carousel — swipe, arrows, or dots</Eyebrow>
        <Carousel
          label="Specimen cards"
          className="mt-6"
          items={cards.map((card, i) => ({
            id: card.id,
            label: card.name,
            content: (
              <article>
                <Figure
                  source={routeSet[i]}
                  alt={card.name}
                  sizes="(min-width: 640px) 50vw, 80vw"
                  caption={`${card.grade}. Season window June to September.`}
                  meta={card.metric}
                />
                <h4 className="type-title mt-4 mb-0" style={{ color: 'var(--fore)' }}>
                  {card.name}
                </h4>
              </article>
            ),
          }))}
        />
      </div>

      <div className="mt-20">
        <Eyebrow as="h3">Accordion — collapsed panels are not in the document</Eyebrow>
        <PanelProbe />
      </div>
    </Section>
  )
}

/**
 * The accordion plus a live count of the panel regions actually present in the
 * document. Collapsed panels contribute nothing, so this reads 0 until a panel
 * is opened — which is the Task 2.5 requirement, verifiable on the page itself.
 */
function PanelProbe() {
  const scope = useRef<HTMLDivElement>(null)
  const [present, setPresent] = useState(0)

  const measure = useCallback(() => {
    setPresent(scope.current?.querySelectorAll('[role="region"]').length ?? 0)
  }, [])

  useEffect(() => {
    const root = scope.current
    if (!root) return
    measure()
    const observer = new MutationObserver(measure)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [measure])

  return (
    <div ref={scope} className="mt-6">
      <Accordion
        items={panels.map((p) => ({ id: p.id, question: p.question, body: <Body>{p.body}</Body> }))}
      />
      <p className="type-small mt-6 font-mono" style={{ color: 'var(--fore-muted)' }}>
        panel regions in the document: {present} of {panels.length}
      </p>
    </div>
  )
}

/* --- 6. Motion ------------------------------------------------------------ */

function Motion() {
  return (
    <>
      <Ridge />
      <RevealDemo />
    </>
  )
}

function Ridge() {
  const scope = useRef<HTMLDivElement>(null)
  const drift = useRef<HTMLDivElement>(null)
  usePinnedScene(scope, { build: buildRidge })
  useParallax(drift, LAYER.far)

  return (
    <Section ground="ridge" from="dusk" flush innerClassName="p-0" className="overflow-hidden">
      <div ref={scope} className="relative grid min-h-svh place-items-center px-[var(--gutter)]">
        <div
          ref={drift}
          data-scene-drift
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url("/img/${plates.ridge.stem}-${plates.ridge.widths[1]}.webp")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.18,
          }}
        />
        <div
          data-scene-veil
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: 'var(--scene-ridge)', opacity: 0 }}
        />
        <div className="relative mx-auto w-full max-w-[var(--shell)]">
          <Eyebrow>Pinned scene — pin, scrub, 250vh</Eyebrow>
          <Display lines={['North', 'face']} spread className="mt-6" />
          <Body className="mt-8">
            Nothing legible is tied to the scrub. Only the backdrop drifts and the veil
            deepens; the headline is on screen for the whole pin and stays put.
          </Body>
        </div>
      </div>
    </Section>
  )
}

function RevealDemo() {
  const scope = useRef<HTMLDivElement>(null)
  useReveal(scope, { items: '[data-rise]' })
  const [reduced, setReduced] = useState(false)

  useEffect(() => setReduced(prefersLessMotion()), [])

  return (
    <Section ground="camp" from="ridge">
      <div ref={scope}>
        <div data-rise>
          <Eyebrow as="h2">Motion</Eyebrow>
        </div>
        <Display text="Reveal" className="mt-4" />
        <div data-rise>
          <Body className="mt-8">
            The default entrance for all content: fade up 24px, once, on enter. It never
            reverses, so anything seen once stays on the page for the rest of the visit.
          </Body>
        </div>

        <ul className="mt-14 m-0 grid list-none gap-px p-0 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              data-rise
              className="border p-8"
              style={{ borderColor: 'var(--rule)' }}
            >
              <Eyebrow strong>Block {i + 1}</Eyebrow>
              <Body className="mt-3">{sample.short}</Body>
            </li>
          ))}
        </ul>

        <p className="type-small mt-12 font-mono" style={{ color: 'var(--fore-muted)' }}>
          prefers-reduced-motion: {reduced ? 'reduce — pinning, scrub and parallax off' : 'no-preference'}
        </p>
      </div>
    </Section>
  )
}
