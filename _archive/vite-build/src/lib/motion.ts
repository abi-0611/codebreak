import { useLayoutEffect, useState, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* ==========================================================================
   NORTHBOUND — motion system
   --------------------------------------------------------------------------
   The single source of truth for movement. Sections never call gsap directly;
   they call a hook from this file. That is what keeps the motion vocabulary
   small enough to stay coherent, and what guarantees every trigger is built
   inside a gsap.context() and reverted on unmount.

   Two hooks, and they are not interchangeable:

     useReveal        the default for ALL content. Fade + rise, once, on enter,
                      and then it stays put forever.
     useWipe          the same contract as useReveal — once, on enter, stays —
                      but the entrance is a clip-path inset rising from the
                      bottom edge. Display type only.
     usePinnedScene   pin + scrub. The hero and the ridge scene ONLY. Nothing
                      that has to be read carefully goes inside one.

   Under prefers-reduced-motion there is no pinning, no scrub and no parallax.
   Every element is simply set to its final state, so the whole page remains
   reachable by ordinary scrolling.
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger)

/** Shared vocabulary. Anything that moves uses these, or it does not ship. */
export const EASE = 'power2.out'
export const SCRUB = 1
export const PIN_DISTANCE = '250%'

export const DURATION = {
  fast: 0.35,
  base: 0.7,
  slow: 1.2,
} as const

/**
 * Parallax rates. Foreground is fastest; the far layer trails the scroll.
 * Only these three values are allowed — a fourth rate reads as a mistake.
 */
export const LAYER = {
  far: 0.3,
  mid: 0.6,
  near: 1,
} as const

export type LayerRate = (typeof LAYER)[keyof typeof LAYER]

/** True when the visitor has asked the OS to limit motion. */
export function prefersLessMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type RevealOptions = {
  /** Seconds to wait after the trigger fires. */
  delay?: number
  /**
   * CSS selector, scoped to the ref, for the elements to animate. When set,
   * they rise in sequence. When omitted the ref element itself rises.
   */
  items?: string
  /** Gap between staggered items, in seconds. */
  step?: number
  /** Viewport position that fires the reveal. */
  start?: string
}

/**
 * The default entrance for every block on the site: fade up 24px, once.
 *
 * `once: true` is load-bearing, not a preference. Content revealed this way is
 * never taken back on scroll-out, so anything a visitor has seen once stays on
 * the page for the rest of the visit.
 */
export function useReveal(
  scope: RefObject<HTMLElement | null>,
  { delay = 0, items, step = 0.08, start = 'top 85%' }: RevealOptions = {},
) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return

    let guard: number | undefined

    const ctx = gsap.context(() => {
      const targets = items ? gsap.utils.toArray<HTMLElement>(items) : [root]
      if (targets.length === 0) return

      if (prefersLessMotion()) {
        gsap.set(targets, { opacity: 1, y: 0 })
        return
      }

      const tween = gsap.from(targets, {
        opacity: 0,
        y: 24,
        duration: DURATION.base,
        delay,
        ease: EASE,
        stagger: items ? step : 0,
        scrollTrigger: {
          trigger: root,
          start,
          once: true,
        },
      })

      // Safety net. `gsap.from` writes opacity 0 the moment it is created, so
      // a trigger that never fires leaves the content permanently invisible.
      // That is a real failure on mobile, where a dynamic viewport can leave
      // ScrollTrigger with stale measurements. Rule 1 says content a visitor
      // cannot see does not exist, and Rule 9 says a janky site costs people
      // things they earned — so if a block is sitting in the viewport and
      // still has not played, show it.
      guard = window.setTimeout(() => {
        if (tween.progress() > 0) return
        const box = root.getBoundingClientRect()
        const inView = box.top < window.innerHeight && box.bottom > 0
        if (inView) tween.progress(1)
      }, 2500)
    }, root)

    return () => {
      if (guard) window.clearTimeout(guard)
      ctx.revert()
    }
  }, [scope, delay, items, step, start])
}

type WipeOptions = {
  /** CSS selector, scoped to the ref, for the units to wipe in. */
  items: string
  /** Gap between units, in seconds. */
  step?: number
  /** Viewport position that fires the wipe. */
  start?: string
  /** Seconds to wait after the trigger fires. */
  delay?: number
}

/**
 * A clip-path inset rising from the bottom edge, staggered across the units.
 * For display type: a headline unmasks upward as if it were being set.
 *
 * Same contract as useReveal and for the same reason — `once: true`, never
 * reversed, never tied to a scrub position. Rule 5 applies to anything a
 * visitor has to be able to read, and a headline is not an exception.
 *
 * The insets overshoot by 6% on three sides so the mask never shaves an
 * antialiased edge off a descender or an overhanging serif.
 */
export function useWipe(
  scope: RefObject<HTMLElement | null>,
  { items, step = 0.09, start = 'top 85%', delay = 0 }: WipeOptions,
) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return

    let guard: number | undefined

    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>(items)
      if (targets.length === 0) return

      if (prefersLessMotion()) {
        gsap.set(targets, { clipPath: 'none', opacity: 1, yPercent: 0 })
        return
      }

      const tween = gsap.fromTo(
        targets,
        { clipPath: 'inset(106% -6% -6% -6%)', yPercent: 14 },
        {
          clipPath: 'inset(-6% -6% -6% -6%)',
          yPercent: 0,
          duration: DURATION.slow,
          delay,
          ease: EASE,
          stagger: step,
          scrollTrigger: { trigger: root, start, once: true },
        },
      )

      // Same safety net as useReveal, and load-bearing for the same reason:
      // `fromTo` writes the masked state immediately, so a trigger that never
      // fires would leave a headline permanently clipped to nothing.
      guard = window.setTimeout(() => {
        if (tween.progress() > 0) return
        const box = root.getBoundingClientRect()
        const inView = box.top < window.innerHeight && box.bottom > 0
        if (inView) tween.progress(1)
      }, 2500)
    }, root)

    return () => {
      if (guard) window.clearTimeout(guard)
      ctx.revert()
    }
  }, [scope, items, step, start, delay])
}

/**
 * True once the document has scrolled past `threshold` pixels.
 *
 * Deliberately a ScrollTrigger rather than a scroll listener. Lenis feeds
 * ScrollTrigger the smoothed position, so a component reading this agrees with
 * every animation on the page; a private listener would read the raw position
 * and disagree by a frame or two the whole way down. It also keeps the site to
 * one scroll observer rather than one per component, which is the difference
 * between a fixed cost and a growing one.
 */
export function useScrollPast(mark: number | string): boolean {
  const [past, setPast] = useState(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const read = (self: ScrollTrigger) => setPast(self.isActive)
      ScrollTrigger.create({
        // A number is a scroll offset in pixels. A string is a selector, and
        // the switch happens when that element's top edge reaches the bottom
        // of the viewport — which survives a resize, where a pixel offset
        // measured against the old viewport height does not.
        ...(typeof mark === 'number'
          ? { start: mark }
          : { trigger: mark, start: 'top bottom' }),
        end: 'max',
        onToggle: read,
        onRefresh: read,
      })
    })
    return () => ctx.revert()
  }, [mark])

  return past
}

/**
 * Re-measure every trigger when the document changes height.
 *
 * ScrollTrigger measures once and on window resize. It does not watch the
 * document, so anything that grows the page after the first pass leaves every
 * trigger below it reading a stale offset — and this site grows the page in
 * two ordinary ways: a permits panel mounts its body when it is opened, and
 * plates arrive and reserve their boxes.
 *
 * The visible symptom is small and confusing rather than dramatic: a reveal
 * that fires a screen early, or the floating CTA failing to stand down over a
 * block it was told to stay off. Watching the body closes it.
 *
 * Two guards. The refresh is debounced past the accordion's own transition, so
 * one panel opening costs one re-measure rather than twenty; and a change of
 * under two pixels is ignored, because `refresh` resizes pin spacers and would
 * otherwise wake itself up forever.
 */
export function useLayoutWatch(): void {
  useLayoutEffect(() => {
    const body = document.body
    let last = body.offsetHeight
    let timer: number | undefined

    const watch = new ResizeObserver(() => {
      const now = body.offsetHeight
      if (Math.abs(now - last) < 2) return
      last = now
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        ScrollTrigger.refresh()
        last = body.offsetHeight
      }, 180)
    })

    watch.observe(body)
    return () => {
      window.clearTimeout(timer)
      watch.disconnect()
    }
  }, [])
}

/**
 * True while anything matching `selector` overlaps the bottom `pad` pixels of
 * the viewport — the band a fixed bottom-anchored control occupies.
 *
 * This is what keeps the floating CTA off the accreditation row and the route
 * cards on a phone. A persistent pill parked over a badge is a badge nobody
 * reads, and the fix has to be a property of the layout rather than a margin
 * somebody remembers to add: mark the block, and the pill gets out of its way.
 *
 * `key` re-runs the query. Pass the current path so a route change re-reads
 * which blocks are on the page.
 */
export function useBandBlocked(selector: string, pad = 132, key: unknown = null): boolean {
  const [blocked, setBlocked] = useState(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const made: ScrollTrigger[] = []
      const recount = () => setBlocked(made.some((one) => one.isActive))

      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        made.push(
          ScrollTrigger.create({
            trigger: el,
            start: 'top bottom',
            end: `bottom bottom-=${pad}`,
            onToggle: recount,
            onRefresh: recount,
          }),
        )
      })

      recount()
    })

    return () => {
      ctx.revert()
      setBlocked(false)
    }
  }, [selector, pad, key])

  return blocked
}

type PinnedSceneOptions = {
  /** Total scroll length of the pin. Defaults to PIN_DISTANCE (250vh). */
  distance?: string
  /**
   * Build the scrubbed timeline. Called once, inside the context, only when
   * motion is allowed. Anything essential to reading the page must NOT live
   * here — a scrubbed property is only true at one scroll position.
   */
  build?: (timeline: gsap.core.Timeline) => void
}

/**
 * Pin a scene and scrub a timeline across it. Hero and ridge only.
 *
 * Rule 5 applies inside this hook: whatever `build` animates must be
 * atmosphere — grain, drift, a slow scale. Never the visibility of anything a
 * visitor is expected to read, because a scrubbed reveal exists at exactly one
 * scroll offset and is trivially scrolled past.
 */
export function usePinnedScene(
  scope: RefObject<HTMLElement | null>,
  { distance = PIN_DISTANCE, build }: PinnedSceneOptions = {},
) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return

    // No pinning under reduced motion. The scene collapses to a normal block
    // and the page scrolls straight through it.
    if (prefersLessMotion()) return

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: `+=${distance}`,
          scrub: SCRUB,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      build?.(timeline)
    }, root)

    return () => ctx.revert()
  }, [scope, distance, build])
}

/**
 * Move a layer at a fraction of the scroll rate. `LAYER.far` trails furthest
 * behind; `LAYER.near` tracks the scroll almost exactly.
 *
 * Purely atmospheric. Nothing legible is ever placed on a parallax layer.
 */
export function useParallax(
  scope: RefObject<HTMLElement | null>,
  rate: LayerRate = LAYER.mid,
  { travel = 18 }: { travel?: number } = {},
) {
  useLayoutEffect(() => {
    const el = scope.current
    if (!el) return
    if (prefersLessMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -(1 - rate) * travel },
        {
          yPercent: (1 - rate) * travel,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB,
            invalidateOnRefresh: true,
          },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [scope, rate, travel])
}

export { gsap, ScrollTrigger }
