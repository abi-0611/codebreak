/**
 * The motion system. This is the ONLY module in the build that imports GSAP,
 * ScrollTrigger or Lenis — CLAUDE.md, code conventions.
 *
 * That rule is not bookkeeping. It buys three things:
 *
 *   · every ScrollTrigger on the site is created inside a gsap.context() and
 *     reverted on unmount, because there is exactly one place that can create
 *     one and it always does both;
 *   · prefers-reduced-motion is handled once, here, instead of in eleven
 *     components that will each forget it differently;
 *   · components stay presentational. A section receives content as props and
 *     calls a named motion helper; it does not author tweens.
 *
 * So the exports below are purpose-built — `useWipe`, `useReveal`, `usePin` —
 * rather than a thin re-export of `gsap`. If a phase needs a new behaviour, it
 * gets a new named helper here, not an escape hatch.
 *
 * ON THE PHASE 3 NAMES. Task 3.1 specifies the surface as `useReveal`,
 * `usePin`, `useParallax` and `useDirection`. Three of those are below under
 * exactly those names. The fourth already existed: phase 2 shipped the header
 * direction watcher as `useAway`, named for the class it toggles, and
 * <SiteHeader/> consumes it. Renaming a working helper to satisfy a spelling
 * would be churn, so the contract is met and the name is not disturbed.
 *
 * `useFrame` and `useTurn` are the two additions task 3.1 does not name. They
 * exist because the GL layer needs a frame and a scroll attitude, and the
 * alternative — handing a component `gsap` or letting three.js open its own
 * requestAnimationFrame — is the escape hatch this module exists to refuse.
 *
 * WHAT IS NOT HERE: colour. Every state colour change on the site is a class
 * toggle owned by CSS. Never tween a colour — a tween needs a literal value,
 * and literal values are exactly what "no inline hex, anywhere" forbids.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

let ready = false

/** Registers the plugin once, lazily, and never on the server. */
function engine() {
  if (!ready && import.meta.client) {
    gsap.registerPlugin(ScrollTrigger)
    ready = true
  }
  return gsap
}

/* -------------------------------------------------------------------------- */
/* the scroll root                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Which element actually scrolls.
 *
 * app.vue wraps the site in a container that becomes `fixed inset-0
 * overflow-y-auto` on coarse pointers (teardown §3) — so on a phone the
 * document does NOT scroll and a ScrollTrigger left on `window` never fires.
 * Every trigger created here routes through this, which is the whole reason it
 * is centralised: one place to be right, one place for phase 3 to swap when
 * Lenis takes the scroller over.
 */
export function scrollRoot(): Element | Window {
  if (!import.meta.client) return window
  const el = document.getElementById('scroll-view')
  if (el && getComputedStyle(el).position === 'fixed') return el
  return window
}

/* -------------------------------------------------------------------------- */
/* reduced motion                                                             */
/* -------------------------------------------------------------------------- */

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Reactive prefers-reduced-motion.
 *
 * Starts false and is read in onMounted rather than during setup, so the
 * server-rendered markup and the first client render agree. A reader who has
 * the setting on gets one frame of the calm state and then the calm state.
 */
export function useReduced() {
  const on = ref(false)

  onMounted(() => {
    const q = window.matchMedia(QUERY)
    const sync = () => { on.value = q.matches }
    sync()
    q.addEventListener('change', sync)
    onBeforeUnmount(() => q.removeEventListener('change', sync))
  })

  return on
}

/** Non-reactive read, for the inside of a tween factory. */
function calm() {
  return import.meta.client && window.matchMedia(QUERY).matches
}

/* -------------------------------------------------------------------------- */
/* context plumbing                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Resolves a template ref to a DOM element.
 *
 * A `ref` placed on `<component :is="...">` holds the component INSTANCE when
 * the resolved tag is a component and the element when it is a plain tag. The
 * pill is exactly that: `NuxtLink` for an internal route, a bare `<a>` for an
 * external one, a `<button>` for neither. Handing GSAP the instance makes it
 * warn "Invalid scope" and silently drop the scoping, and handing it to
 * ScrollTrigger as a trigger is worse — it fails outright.
 *
 * So every ref this module receives goes through here first.
 */
function asElement(value: unknown): Element | undefined {
  if (!value) return undefined
  if (value instanceof Element) return value
  const host = (value as { $el?: unknown }).$el
  return host instanceof Element ? host : undefined
}

/**
 * Opens a gsap.context() on mount and reverts it on unmount, and hands back an
 * `add` that runs work inside it. Everything below is built on this, which is
 * how "every ScrollTrigger is reverted" stops being a thing to remember.
 */
function useScope(scope?: Ref<unknown>) {
  let ctx: gsap.Context | null = null
  const queue: Array<() => void> = []

  onMounted(() => {
    ctx = engine().context(() => {}, asElement(scope?.value))
    for (const job of queue.splice(0)) ctx.add(job)
  })

  onBeforeUnmount(() => {
    ctx?.revert()
    ctx = null
  })

  return (job: () => void) => {
    if (ctx) ctx.add(job)
    else queue.push(job)
  }
}

/* -------------------------------------------------------------------------- */
/* 1. the pill wipe — teardown §8.1                                           */
/* -------------------------------------------------------------------------- */

/**
 * Measured off the reference by watching the two attributes change under a
 * real pointer. See the table in teardown §8.1.
 *
 * The three numbers people get wrong, in order of how visible the mistake is:
 *
 *   tearHot   the displacement STARTS at 150, not near zero. At 150 the rect
 *             is 3% wide and shredded into specks, which is the ink-bleed.
 *             Starting small gives a clean edge, i.e. no effect at all.
 *   ease      the leave is not the enter reversed. Both directions ease OUT.
 *             A reversed timeline crawls away and reads as a stall.
 *   tearRest  the tear rests at 40 while filled and only relaxes to 0 half a
 *             second into the leave. At rest the torn edge is outside the
 *             pill and clipped, so it costs nothing to leave it there.
 */
const WIPE = {
  span: 1,          // seconds, both directions
  ease: 'power2.out',
  full: '150%',     // the rect is deliberately wider than the button
  tearHot: 150,
  tearRest: 40,
  tearFall: 0.5,    // the tear relaxes over the BACK half of the leave
} as const

export type WipeParts = {
  ink: Ref<SVGRectElement | null>
  tear: Ref<SVGFEDisplacementMapElement | null>
}

/**
 * Returns `enter` / `leave` handlers and a `lit` flag.
 *
 * `lit` exists so the label colour can flip via a CSS class rather than a
 * tween — see the note at the top of this file about never tweening colour.
 */
export function useWipe(root: Ref<unknown>, parts: WipeParts) {
  const run = useScope(root)
  const lit = ref(false)

  const enter = () => {
    if (lit.value) return
    lit.value = true
    run(() => {
      const { ink, tear } = parts
      if (!ink.value || !tear.value) return
      gsap.killTweensOf([ink.value, tear.value])

      // Reduced motion: the fill still arrives, it just does not travel.
      if (calm()) {
        gsap.set(ink.value, { attr: { width: WIPE.full } })
        gsap.set(tear.value, { attr: { scale: 0 } })
        gsap.fromTo(ink.value, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' })
        return
      }

      gsap.set(ink.value, { opacity: 1 })
      // `to`, not `fromTo`: re-entering mid-leave picks the wipe up where it
      // is instead of snapping it back to zero first.
      gsap.to(ink.value, {
        attr: { width: WIPE.full }, duration: WIPE.span, ease: WIPE.ease,
      })
      // `fromTo` here, because the tear is supposed to slam back to hot on
      // every enter — that is what the reference does.
      gsap.fromTo(
        tear.value,
        { attr: { scale: WIPE.tearHot } },
        { attr: { scale: WIPE.tearRest }, duration: WIPE.span, ease: WIPE.ease },
      )
    })
  }

  const leave = () => {
    if (!lit.value) return
    lit.value = false
    run(() => {
      const { ink, tear } = parts
      if (!ink.value || !tear.value) return
      gsap.killTweensOf([ink.value, tear.value])

      if (calm()) {
        gsap.to(ink.value, {
          opacity: 0, duration: 0.2, ease: 'none',
          onComplete: () => gsap.set(ink.value, { attr: { width: 0 }, opacity: 1 }),
        })
        return
      }

      gsap.to(ink.value, { attr: { width: 0 }, duration: WIPE.span, ease: WIPE.ease })
      gsap.to(tear.value, {
        attr: { scale: 0 },
        duration: WIPE.tearFall,
        delay: WIPE.span - WIPE.tearFall,
        ease: WIPE.ease,
      })
    })
  }

  return { enter, leave, lit }
}

/* -------------------------------------------------------------------------- */
/* 2. scroll direction — teardown §8.2                                        */
/* -------------------------------------------------------------------------- */

/**
 * True while the reader is scrolling DOWN and past the fold. The header binds
 * it to a class; the translate itself is a CSS transition, so this never
 * animates anything and there is no property with two owners.
 */
export function useAway(after = 80) {
  const away = ref(false)
  const run = useScope()

  run(() => {
    ScrollTrigger.create({
      scroller: scrollRoot(),
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        away.value = self.direction === 1 && self.scroll() > after
      },
    })
  })

  return away
}

/* -------------------------------------------------------------------------- */
/* 3. reveal on enter — rule 5                                                */
/* -------------------------------------------------------------------------- */

/**
 * Fires once, when the element first reaches the viewport, and never again.
 *
 * `once: true` is rule 5 in one option: a surface reveals on enter and then
 * STAYS. Nothing on this site is tied to a scrub position, because a reveal
 * that un-reveals when you scroll back is a reveal you cannot re-read.
 */
export function useEnter(el: Ref<unknown>, then: () => void, start = 'top 90%') {
  const run = useScope(el)

  run(() => {
    const node = asElement(el.value)
    if (!node) return
    if (calm()) { then(); return }
    ScrollTrigger.create({
      trigger: node, scroller: scrollRoot(), start, once: true, onEnter: then,
    })
  })
}

/* -------------------------------------------------------------------------- */
/* 4. the count-up — teardown §8.4                                            */
/* -------------------------------------------------------------------------- */

/**
 * Counts a whole ROW of figures up together, once the box is on screen, and
 * returns the live numbers.
 *
 * One trigger for the box, not one per figure. Three triggers on three
 * adjacent rows fire on three different scroll positions, so the values start
 * at visibly different moments — which reads as a stagger nobody asked for.
 *
 * `skip` is what keeps the stats box honest. The same box appears in the hero
 * AND inside the menu overlay; the menu one mounts fresh every time it opens,
 * and a value that re-counts on every open is a tell (rule 3). The caller
 * passes a flag that the first run has already set.
 */
export function useTally(el: Ref<unknown>, to: readonly number[], skip: () => boolean) {
  const now = ref(to.map(() => 0))

  if (skip()) {
    now.value = [...to]
    return now
  }

  useEnter(el, () => {
    if (calm()) { now.value = [...to]; return }
    to.forEach((target, i) => {
      // A proxy per figure, because tweening an array element in place does
      // not trip Vue's reactivity — the array identity never changes.
      const box = { n: 0 }
      gsap.to(box, {
        n: target,
        duration: 1.4,
        ease: 'power2.out',
        snap: { n: 1 },
        onUpdate: () => {
          const next = [...now.value]
          next[i] = box.n
          now.value = next
        },
      })
    })
  })

  return now
}

/* -------------------------------------------------------------------------- */
/* 5. panel height — teardown §8.6                                            */
/* -------------------------------------------------------------------------- */

/**
 * Opens and closes a panel by animating its height to and from `auto`.
 *
 * On open the height is PINNED to `auto` once the tween lands, so the panel
 * goes back to sizing itself — a font swap, a viewport change or a re-wrap
 * would otherwise leave it frozen at a height measured for different content.
 *
 * `gsap.set(node, { height: 'auto' })`, deliberately, and NOT
 * `clearProps: 'height'`. The closed state has to be written as a class for
 * the server-rendered markup to be correct — otherwise every panel on the page
 * is open until hydration. Clearing the inline height therefore does not
 * restore `auto`, it restores that class, and the panel snaps shut the instant
 * it finishes opening. An explicit inline `auto` outranks the class and keeps
 * both properties.
 */
export function useLift(el: Ref<HTMLElement | null>) {
  const run = useScope(el)

  const open = () => run(() => {
    const node = el.value
    if (!node) return
    gsap.killTweensOf(node)
    if (calm()) { gsap.set(node, { height: 'auto' }); return }
    gsap.to(node, {
      height: 'auto',
      duration: 0.6,
      ease: 'expo.out',
      onComplete: () => gsap.set(node, { height: 'auto' }),
    })
  })

  const shut = () => run(() => {
    const node = el.value
    if (!node) return
    gsap.killTweensOf(node)
    if (calm()) { gsap.set(node, { height: 0 }); return }
    gsap.to(node, { height: 0, duration: 0.5, ease: 'expo.out' })
  })

  return { open, shut }
}

/* -------------------------------------------------------------------------- */
/* 6. the ticker — task 2.11                                                  */
/* -------------------------------------------------------------------------- */

/**
 * THE MEASURED SPEED — phase 11 §11.1: 70.9 px/s leftward, from 501px of
 * travel over 7.07 seconds at a 1920 viewport.
 *
 * Held as REM PER SECOND rather than as pixels per second, and that conversion
 * is the whole reason this is a constant rather than a number in a call.
 *
 * §11.4 is explicit that the speed has to survive our track being a different
 * width from the reference's, and the rem engine is what makes it survive the
 * VIEWPORT too. At 1920 the root font computes to 10.667px, so 70.9 px/s is
 * 6.647 rem/s — and because every cell on the strip is sized in rem, a track
 * that is 180rem long takes the same 27 seconds at 1920 and at 1440. A
 * pixels-per-second constant would have made the strip visibly faster on a
 * wide monitor for no reason anybody could name.
 */
const TICK = {
  /** 70.9 px/s at a root font of (1920 / 1800) * 10 = 10.667px. */
  remPerSecond: 70.9 / ((1920 / 1800) * 10),
} as const

/**
 * The estate strip. The track holds the cells twice, so translating it by
 * exactly -50% lands the copy where the original was and the repeat is
 * seamless. `ease: 'none'` — a ticker that eases is a ticker that pulses.
 *
 * THE DURATION IS DERIVED, NOT PASSED — §11.4. Phase 2 shipped a 40-second
 * default, which is too slow for any track under 2836px and was therefore
 * wrong for every track we actually have. Worse, it was a knob: a later phase
 * adding a seventh estate would lengthen the track and silently slow the strip
 * down, because the duration is the thing being held constant instead of the
 * speed.
 *
 * So the caller no longer gets to say. The travel is measured off the track —
 * half of it, since it carries two passes and one pass is one cycle — divided
 * by the root font to get rem, divided by the measured speed to get seconds.
 * Add a cell and the strip stays at 70.9 px/s; it simply takes longer to come
 * round, which is what a real ticker does.
 *
 * Re-derived on refresh, because crossing the 650px breakpoint changes the
 * cell width class and therefore the length of the track in rem. `duration()`
 * on a running tween keeps its playhead's PROPORTION, so the strip changes
 * pace without jumping.
 *
 * Paused when off screen, because a marquee running behind five sections of
 * page is pure battery.
 */
export function useTicker(track: Ref<unknown>) {
  const run = useScope(track)

  run(() => {
    const node = asElement(track.value)
    if (!node || calm()) return

    const pace = () => {
      // One pass. `scrollWidth` rather than a rect, because the track is
      // `w-max` inside an `overflow-hidden` band and the rect would report the
      // band's width once the translate has begun.
      const travel = node.scrollWidth / 2
      const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 10
      return Math.max(1, travel / root / TICK.remPerSecond)
    }

    const loop = gsap.to(node, {
      xPercent: -50, duration: pace(), ease: 'none', repeat: -1,
    })

    ScrollTrigger.create({
      trigger: node,
      scroller: scrollRoot(),
      start: 'top bottom',
      end: 'bottom top',
      onRefresh: () => loop.duration(pace()),
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
    })
  })
}

/* -------------------------------------------------------------------------- */
/* 7. smooth scroll — one scroll position, one rAF loop (task 3.1)            */
/* -------------------------------------------------------------------------- */

/**
 * The single most common way a build like this goes wrong is two systems each
 * believing they own scroll position. So there is exactly one chain, and it is
 * built here, once, by app.vue:
 *
 *   Lenis  →  drives gsap.ticker  →  drives ScrollTrigger.update()
 *
 * Nothing else in the build holds the instance, and nothing else opens a
 * requestAnimationFrame loop — the GL layer renders off the SAME ticker, via
 * `useFrame` below. That is what makes "one rAF loop" a fact rather than a
 * hope.
 *
 * WHERE LENIS IS NOT BUILT AT ALL:
 *
 *   · prefers-reduced-motion. Task 3.1 is explicit — do not instantiate it,
 *     do not add the ticker. Native scroll, no pin, no scrub, no parallax.
 *   · coarse pointers. On a phone the document does not scroll; the fixed
 *     container in app.vue does (teardown §3). Lenis leaves touch on the
 *     native scroller regardless, so building it there would cost a rAF loop
 *     that smooths nothing, on the hardware with the least frame budget to
 *     spare. ScrollTrigger is unaffected: every trigger routes through
 *     `scrollRoot()`, which returns that container.
 */
let smooth: Lenis | null = null

export function useSmooth() {
  let drive: ((time: number) => void) | null = null

  onMounted(() => {
    if (calm()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    engine()
    const instance = new Lenis({ autoRaf: false })
    smooth = instance

    instance.on('scroll', ScrollTrigger.update)

    drive = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(drive)

    // Lenis integrates real elapsed time. Lag smoothing hands a callback a
    // CLAMPED delta after a stall, so the two disagree about how much time
    // passed and the page lurches on the first frame back.
    gsap.ticker.lagSmoothing(0)
  })

  onBeforeUnmount(() => {
    if (drive) gsap.ticker.remove(drive)
    drive = null
    gsap.ticker.lagSmoothing(500, 33)
    smooth?.destroy()
    smooth = null
  })
}

/**
 * Locks and releases the page behind an overlay.
 *
 * Note what this does NOT do: set `overflow: hidden` on `body`. With the touch
 * scroll container from phase 1 the body is not the scroller, so that would be
 * a no-op that looks like it works on a desktop and fails on every phone.
 */
export function pauseScroll() {
  smooth?.stop()
  const el = scrollRoot()
  if (el !== window) (el as HTMLElement).style.overflowY = 'clip'
}

export function resumeScroll() {
  smooth?.start()
  const el = scrollRoot()
  if (el !== window) (el as HTMLElement).style.removeProperty('overflow-y')
}

/* -------------------------------------------------------------------------- */
/* 8. the frame tap — task 3.1, and the whole GL layer                        */
/* -------------------------------------------------------------------------- */

/**
 * Subscribes a draw callback to the site's ONE ticker.
 *
 * three.js offers `renderer.setAnimationLoop`, and it is the ordinary way to
 * do this. It is not the way here: it opens a second requestAnimationFrame
 * loop per scene, so three scenes plus Lenis would be four loops interleaving
 * with each other and with ScrollTrigger. Riding gsap.ticker instead means
 * scroll position, every tween and every canvas advance on the same frame,
 * from the same clock.
 *
 * It also inherits two behaviours for free: GSAP sleeps its ticker when the
 * tab goes to the back, and `lagSmoothing(0)` above keeps the delta honest.
 *
 * `hold`/`run` exist so a scene can stop drawing when it is off screen. A
 * canvas advancing behind five sections of page is pure battery.
 */
export function useFrame(draw: (time: number, delta: number) => void) {
  let on = true
  const tick = (time: number, delta: number) => {
    if (on) draw(time, delta)
  }

  onMounted(() => {
    engine()
    gsap.ticker.add(tick)
  })

  onBeforeUnmount(() => {
    on = false
    gsap.ticker.remove(tick)
  })

  return {
    run: () => { on = true },
    hold: () => { on = false },
  }
}

/* -------------------------------------------------------------------------- */
/* 9. the reveal — task 3.8, and the whole reveal vocabulary                   */
/* -------------------------------------------------------------------------- */

/**
 * Fade plus a rise, once, on enter. Wired into <Band/>, so every section on
 * the site reveals identically.
 *
 * That uniformity is the point of task 3.8. No per-section variation, no word
 * stagger, no mask wipe on the one heading it would have looked good on — the
 * restraint here is what lets the two heavy moments, the hero and the pinned
 * scene, actually land.
 *
 * Three details are load-bearing:
 *
 *   start state in JS   The `opacity: 0` is set at mount, never in CSS. A
 *                       reader whose JS fails, or who arrives before
 *                       hydration, gets the whole page at full opacity rather
 *                       than a blank column. Rule 1 in its strictest reading.
 *   once                Rule 5. It reveals and it STAYS. A participant who
 *                       scrolls back up to re-read a surface must find it
 *                       still there.
 *   clearProps          The tween ends by removing the transform entirely,
 *                       not by parking it at translate(0,0). A lingering
 *                       transform makes the section a containing block, which
 *                       silently changes what `position: fixed` means for
 *                       anything inside it.
 */
const REVEAL = {
  /** 24 design px. `rem`, not `px`, so the rise scales with the rem engine. */
  rise: '2.4rem',
  span: 0.6,
  ease: 'expo.out',
  start: 'top 85%',
} as const

export function useReveal(el: Ref<unknown>) {
  const run = useScope(el)

  run(() => {
    const node = asElement(el.value)
    if (!node || calm()) return

    gsap.set(node, { opacity: 0, y: REVEAL.rise })

    ScrollTrigger.create({
      trigger: node,
      scroller: scrollRoot(),
      start: REVEAL.start,
      once: true,
      onEnter: () => {
        gsap.to(node, {
          opacity: 1,
          y: 0,
          duration: REVEAL.span,
          ease: REVEAL.ease,
          clearProps: 'opacity,transform',
        })
      },
    })
  })
}

/* -------------------------------------------------------------------------- */
/* 10. the pinned scene — task 3.3                                            */
/* -------------------------------------------------------------------------- */

/**
 * Reports which of N steps a 300vh section is currently in, and drives the
 * progress bar.
 *
 * WHAT THIS DOES NOT DO IS PIN. The pin is `position: sticky` in CSS and the
 * 300vh is authored on the section — which is also what the reference does.
 * Teardown §7 row 5 measures `h-[300vh]` on the section ITSELF; a GSAP pin
 * would have produced a viewport-tall section with a 300vh spacer beside it.
 * Sticky is native, correct inside the touch container, and survives a resize
 * without a refresh. GSAP is left doing the one thing it is better at:
 * reporting where we are.
 *
 * DISCRETE, NOT SCRUBBED. Rule 5 governs this section absolutely, because one
 * of the six terms lives in it. `step` is a pure function of progress, so:
 *
 *   · every step is fully opaque for its entire range — nothing is legible
 *     for only 40px of scroll;
 *   · reverse playback cannot desynchronise, because there is no playhead to
 *     desynchronise. Scrolling up recomputes the same function.
 *
 * `guard` is a dead-band on the boundary. Without it a pointer resting a pixel
 * either side of a threshold flickers between two steps at 60fps.
 *
 * The bar is written with a quickSetter rather than through a reactive ref: it
 * changes every frame, and a ref would put a Vue re-render on every one of
 * them to move one element by one percent.
 */
const PIN = { guard: 0.04 } as const

export function usePin(
  el: Ref<unknown>,
  opts: { count: number; bars?: Ref<HTMLElement[]> },
) {
  const step = ref(0)
  /** False until a trigger actually exists — drives `inert`, never layout. */
  const live = ref(false)
  const run = useScope(el)

  run(() => {
    const node = asElement(el.value)
    if (!node || calm()) return

    /*
      ONE HAIRLINE PER CARD, ALL WRITTEN TOGETHER — phase 11 §11.3.6.

      Phase 3 put a single bar across the bottom of the STAGE and filled it with
      the whole section's progress. §11.3.6 re-measured it off the capture: the
      hairline is on the caption CARD's bottom edge, and it fills across the
      STEP's range rather than the section's — four fills, one per card, which
      is what makes it a progress bar for the thing you are reading rather than
      a scroll indicator for the page (which §11.7 forbids outright).

      The four cards occupy the same box, so all four bars are written the same
      value and only the visible one is seen. Writing four quickSetters a frame
      is cheaper than reasoning about which card is current inside the update,
      and it means the bar is correct the instant a step becomes visible rather
      than one frame later.
    */
    const tracks = opts.bars?.value ?? []
    // GSAP caches a transform origin the first time it touches an element.
    // The class says `origin-left`; saying it again here means the cached value
    // cannot be whatever the computed style happened to be at that instant.
    if (tracks.length) gsap.set(tracks, { transformOrigin: 'left center' })
    const setBar = tracks.map((track) => gsap.quickSetter(track, 'scaleX'))
    for (const set of setBar) set(0)

    ScrollTrigger.create({
      trigger: node,
      scroller: scrollRoot(),
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const at = self.progress * opts.count
        const now = step.value
        if (at >= now + 1 + PIN.guard || at < now - PIN.guard) {
          step.value = Math.min(opts.count - 1, Math.max(0, Math.floor(at)))
        }

        /*
          The fill is measured against the CURRENT step, not against `at`'s own
          whole part. Those differ by exactly the dead-band: on the boundary,
          `step` deliberately lags `at` by up to `guard`, so `at - Math.floor(at)`
          would snap the bar back to zero a few pixels before the card it belongs
          to has changed. Clamped, because inside the dead-band the difference
          runs a little past 1 and a little below 0.
        */
        const fill = Math.min(1, Math.max(0, at - step.value))
        for (const set of setBar) set(fill)
      },
    })

    live.value = true
  })

  return { step, live }
}

/* -------------------------------------------------------------------------- */
/* 11. parallax — task 3.4                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Moves a backdrop slower than the page. `translate3d` on the wrapper, and
 * nothing else — the GL camera never moves. It is cheaper, and it is what the
 * reference measures as doing.
 *
 * The travel distance is cached on refresh instead of measured per frame. A
 * `getBoundingClientRect()` inside `onUpdate` is a forced layout on every
 * frame of every scroll, which is the classic way a parallax that looks fine
 * on a desktop drops a phone to 20fps.
 */
export function useParallax(el: Ref<unknown>, rate = 0.35) {
  const run = useScope(el)

  run(() => {
    const node = asElement(el.value)
    // A rate of zero is off, not zero travel: <Scene/> passes it for every
    // scene that is not the hero backdrop, and a trigger that exists to
    // multiply by nothing still measures, still updates and still counts.
    if (!node || !rate || calm()) return

    // force3D so the write is translate3d and the layer stays on the compositor.
    gsap.set(node, { y: 0, force3D: true })
    const move = gsap.quickSetter(node, 'y', 'px')
    let span = 0

    ScrollTrigger.create({
      trigger: node,
      scroller: scrollRoot(),
      start: 'top top',
      end: 'bottom top',
      onRefresh: (self) => { span = (self.end - self.start) * rate },
      onUpdate: (self) => move(self.progress * span),
    })
  })
}

/* -------------------------------------------------------------------------- */
/* 11b. the seal's rise — phase 11 §11.3.5                                    */
/* -------------------------------------------------------------------------- */

/**
 * Drifts an element UPWARD relative to its section, across the whole of that
 * section's crossing.
 *
 * IT IS NOT `useParallax` WITH A NEGATIVE RATE, and the difference is the
 * trigger rather than the sign. `useParallax` is written for a viewport-tall
 * backdrop: it measures against the element itself from `top top`, so the
 * travel does not begin until the element's top has reached the top of the
 * screen. For a seal sitting in the middle of a section that is most of the
 * way through its visit, and the drift would start just as the reader stops
 * looking at it.
 *
 * So the range is the HOST's crossing — the section, entering at the fold and
 * leaving at the top — and the element rides it. §11.3.5: the seal parallaxes
 * upward relative to the section as it passes, and it does not scale, spin or
 * brighten. Those three absences are the specification as much as the drift is:
 * this is a marked surface, and a surface that changes size or value while it
 * crosses is a surface a reader cannot settle on.
 *
 * The travel is centred on zero, so the seal sits where the layout puts it at
 * the middle of the crossing rather than starting there and leaving. Otherwise
 * the section would have to be padded for a displacement that only exists at
 * one end.
 */
export function useRise(el: Ref<unknown>, host: Ref<unknown>, span = 60) {
  const run = useScope(host)

  run(() => {
    const node = asElement(el.value)
    const frame = asElement(host.value)
    if (!node || !frame || !span || calm()) return

    gsap.set(node, { y: 0, force3D: true })
    const move = gsap.quickSetter(node, 'y', 'px')

    ScrollTrigger.create({
      trigger: frame,
      scroller: scrollRoot(),
      start: 'top bottom',
      end: 'bottom top',
      // 0.5 - progress, so the drift runs +span/2 to -span/2: down as the
      // section arrives, level as it is read, up as it leaves.
      onUpdate: (self) => move((0.5 - self.progress) * span),
    })
  })
}

/* -------------------------------------------------------------------------- */
/* 12. scroll attitude for the GL scenes — tasks 3.5, 3.6                     */
/* -------------------------------------------------------------------------- */

/**
 * 0 while the element is one viewport below the fold, 1 once it is one
 * viewport above it. The medallion and the house mark map it to rotation.
 *
 * Returns a plain box rather than a `Ref`, on purpose. Nothing binds this in a
 * template — a render callback reads it sixty times a second — so reactivity
 * would be pure overhead on the hottest path in the build.
 */
export function useTurn(el: Ref<unknown>) {
  const at = { value: 0 }
  const run = useScope(el)

  run(() => {
    const node = asElement(el.value)
    if (!node || calm()) return

    ScrollTrigger.create({
      trigger: node,
      scroller: scrollRoot(),
      start: 'top bottom',
      end: 'bottom top',
      onRefresh: (self) => { at.value = self.progress },
      onUpdate: (self) => { at.value = self.progress },
    })
  })

  return at
}

/* -------------------------------------------------------------------------- */
/* 13. the hero dissolve                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fades a block out as the reader leaves it, scrubbed against scroll.
 *
 * Re-measured off the reference 2026-08-24 by sampling the inline opacity at
 * 50px intervals down the first viewport. The curve it traces is exactly
 * `(1 - t)²`, which is what a `power2.out` tween from 1 to 0 produces — NOT
 * `power2.in`, which is the intuitive reading and gives `1 - t²`. The
 * difference is the whole character of the effect: `power2.out` dumps most of
 * the opacity in the first third of the travel, so the headline is already
 * ghosting by the time the fold moves, and the last of it lingers. `power2.in`
 * holds the headline solid and then snatches it, which reads as a glitch.
 *
 *   scroll  0    50     100    200    300    400    500    590
 *   opacity 1    .834   .686   .431   .235   .098   .020   0
 *
 * The travel is 0.7 of a viewport, measured, and it is deliberately a fraction
 * of the VIEWPORT rather than of the hero: the hero is a screen plus a partner
 * strip, and ending the fade at the hero's bottom would keep the headline
 * faintly legible underneath the strip.
 *
 * SCRUB, NOT `once`. This is the one place on the site that ties opacity to a
 * scroll position, and rule 5 is not in tension with it, because nothing here
 * is a marked surface — the hero carries the h1, the sub and the pill,
 * all of which are fully opaque at the top of the page where they are read.
 * Scrolling back up restores them, because the tween is a pure function of
 * position exactly as `usePin`'s step is.
 */
const DISSOLVE = { reach: 0.7, ease: 'power2.out' } as const

export function useDissolve(el: Ref<unknown>) {
  const run = useScope(el)

  run(() => {
    const node = asElement(el.value)
    if (!node || calm()) return

    gsap.to(node, {
      opacity: 0,
      ease: DISSOLVE.ease,
      scrollTrigger: {
        trigger: node,
        scroller: scrollRoot(),
        start: 'top top',
        // A function, so a rotated phone re-measures instead of keeping a
        // travel computed for the other orientation.
        end: () => `+=${Math.round(window.innerHeight * DISSOLVE.reach)}`,
        scrub: true,
      },
    })
  })
}

/* -------------------------------------------------------------------------- */
/* 14. the opening — the backdrop's lock, its contraction, and the handoff    */
/* -------------------------------------------------------------------------- */

/**
 * Holds an absolutely-placed backdrop still against the VIEWPORT for as long
 * as `host` is crossing it.
 *
 * This is `useParallax` at a rate of exactly one, with the trigger moved from
 * the backdrop to its host — and both of those are re-measurements off the
 * reference rather than taste. The reference writes `translate3d(0, scrollY, 0)`
 * on its backdrop wrapper, exactly: 251.2 at a scroll of 251, 587.2 at 587,
 * 1172.8 at 1173. There is no fraction anywhere in that sequence. The backdrop
 * does not drift slowly, it does not move at all, and every bit of the parallax
 * the hero reads as belongs to the content sliding over it.
 *
 * WHY THE TRIGGER IS THE HOST. A viewport-tall element used as its own trigger
 * stops tracking after one viewport of scroll, which is fine for a fraction —
 * the element has left by then — and wrong for a lock, because the hero is a
 * screen PLUS a strip plus the closing plate. Tracking against the host keeps
 * the stone still for the whole of it and releases it exactly as the host ends,
 * with no step: at the end of the host the accumulated travel is the host's own
 * height, which is where the wrapper would have been anyway.
 *
 * WHY THE WRAPPER AND NOT THE CANVAS. The wrapper clips. Translating the canvas
 * inside a viewport-tall `overflow-hidden` box by a full viewport slides it out
 * of its own clip and the hero goes black — which is exactly what a fractional
 * rate hides and a rate of one exposes. The reference translates the clipping
 * box itself, and so does this.
 */
export function useLock(el: Ref<unknown>, host: Ref<unknown>) {
  const run = useScope(host)

  run(() => {
    const node = asElement(el.value)
    const frame = asElement(host.value)
    if (!node || !frame || calm()) return

    gsap.set(node, { y: 0, force3D: true })
    const move = gsap.quickSetter(node, 'y', 'px')
    let span = 0

    ScrollTrigger.create({
      trigger: frame,
      scroller: scrollRoot(),
      start: 'top top',
      end: 'bottom top',
      onRefresh: (self) => { span = self.end - self.start },
      onUpdate: (self) => move(self.progress * span),
    })
  })
}

const CONTRACT = {
  /**
   * Where the plate's BOTTOM edge sits, as a fraction of the viewport, at the
   * moment the contraction finishes.
   *
   * MEASURED off the reference's own shader. It hands the field a resolution
   * uniform each frame; that uniform is the aperture, and it interpolates
   * linearly in scroll from the hero block's rect to the plate's rect and then
   * clamps. Solving for where it clamps, at two viewport heights:
   *
   *   1440x860   hero 1425x795  plate 718x359 @ page 1107   clamps at scroll 778
   *    492x694   hero  477x783  plate 423x282 @ page 1203   clamps at scroll 930
   *
   *   778 = 1107 + 359 - 0.8 x 860       930 = 1203 + 282 - 0.8 x 694
   *
   * Exact at both. In ScrollTrigger's own vocabulary this is `end: 'bottom 80%'`
   * on the plate, with the start at the hero's `top top` — which is why the
   * field begins shrinking on the FIRST pixel of scroll rather than waiting for
   * the plate to come into view. That is the half that gets missed, and it is
   * the half that makes the move read as the hero folding itself away.
   *
   * The ramp is LINEAR. Sampled every 100px against the fit, the largest error
   * was 0.04px. There is no ease on it, so do not add one.
   */
  land: 0.8,
} as const

/**
 * Shrinks a full-bleed backdrop down into the box a target element occupies,
 * and then keeps it there.
 *
 * THIS IS A MINIMISE, NOT A CROP, AND THIS FILE USED TO SAY THE OPPOSITE.
 * The earlier note claimed the stone inside the plate was the same size it was
 * full-bleed, showing less of itself, and justified that by saying the
 * reference re-scissors one shared canvas into each hook's screen rect. Both
 * halves are wrong, and this time they were checked rather than remembered:
 *
 *   · the reference's backdrop wrapper computes `clip-path: none` at every
 *     scroll position, and `gl.viewport` and `gl.scissor` are called with the
 *     same arguments on every frame of the whole sequence. Nothing there is
 *     being clipped and nothing is being scissored;
 *   · what changes is a resolution uniform, from 1425x795 down to 718x359. The
 *     field is DRAWN SMALLER. The whole of it ends up inside the plate.
 *
 * The aperture is a straight lerp between the two elements' LIVE viewport
 * rects — both are scrolling, so the box shrinks and rises at the same time.
 * Predicted against a frame at 492x694, scroll 500, t 0.5376: x 14.5..462.5,
 * y 146.7..660.3. Measured off the screenshot: 16..462, 146..660.
 *
 * WE DO IT WITH TWO ELEMENTS RATHER THAN A UNIFORM. `mask` takes the aperture
 * as `clip-path: inset()`; `field` takes a `translate() scale()` that maps its
 * own box onto that same aperture. They have to be two elements — a clip is
 * resolved in the element's own transformed space, so one element carrying
 * both would clip a scaled copy through a scaled window and the two would
 * chase each other. The pair costs one compositor operation and no re-render,
 * and unlike a resolution uniform it works for the still frame as well, which
 * is the same picture at the same size for a reader whose device never gets a
 * GL context.
 *
 * The scale is NON-UNIFORM, deliberately. 1425x795 into 718x359 is 0.504
 * across and 0.452 down. The reference squashes by exactly the same ratio,
 * because a resolution uniform is two numbers and it normalises against both.
 *
 * IT KEEPS TRACKING AFTER IT ARRIVES. The plate scrolls and the backdrop is
 * viewport-locked, so a trigger that stopped calling `onUpdate` at the landing
 * would freeze the box while the plate carried on up the page — measured once
 * at seven hundred pixels adrift. The trigger therefore spans the plate's
 * whole crossing and `t` is clamped inside the update rather than by the
 * trigger's range. Past `t` = 1 the aperture simply is the plate's live rect.
 *
 * Everything in the update is arithmetic on cached page offsets. There is no
 * `getBoundingClientRect` in there — that would be a forced layout on every
 * frame of every scroll, which is how an effect that is fine on a desktop
 * takes a phone to 20fps.
 *
 * @param mask   the clipping wrapper, held to the viewport by `useLock`
 * @param field  the box inside it carrying the canvas and the still
 * @param opts.into  the plate the backdrop ends up inside
 * @param opts.host  the hero block, whose top is where the shrink begins
 */
export function useContract(
  mask: Ref<unknown>,
  field: Ref<unknown>,
  opts: { into: Ref<unknown>; host: Ref<unknown> },
) {
  const run = useScope(opts.into)

  run(() => {
    const shell = asElement(mask.value)
    const inner = asElement(field.value)
    const plate = asElement(opts.into.value)
    const host = asElement(opts.host.value)
    if (!shell || !inner || !plate || !host || calm()) return

    /** Page coordinates and sizes, cached on refresh. */
    let restTop = 0
    let restLeft = 0
    let frameW = 0
    let frameH = 0
    let plateTop = 0
    let plateLeft = 0
    let plateW = 0
    let plateH = 0
    /** Scroll distance the shrink runs over. */
    let span = 1

    ScrollTrigger.create({
      trigger: plate,
      scroller: scrollRoot(),
      start: 'top bottom',
      end: 'bottom top',
      onRefresh: (self) => {
        const seat = plate.getBoundingClientRect()
        const skin = shell.getBoundingClientRect()
        const at = self.scroll()

        /*
          Where the backdrop SITS AT REST, which is not where it is now:
          `useLock` is translating it, and a translate is exactly what
          getBoundingClientRect reports back. The host is untransformed and the
          wrapper is `absolute top-0` inside it, so the host's top IS the
          wrapper's resting top. Width and height are safe to read off the live
          rect, because a translate changes neither.
        */
        restTop = host.getBoundingClientRect().top + at
        restLeft = skin.left
        frameW = skin.width
        frameH = skin.height

        plateTop = seat.top + at
        plateLeft = seat.left
        plateW = seat.width
        plateH = seat.height

        // `end: 'bottom 80%'` on the plate, written out. See CONTRACT.land.
        span = Math.max(1, plateTop + plateH - CONTRACT.land * frameH - restTop)
      },
      onUpdate: (self) => {
        if (!frameW || !frameH) return
        const at = self.scroll()
        const t = Math.min(1, Math.max(0, (at - restTop) / span))

        // Both boxes in viewport coordinates, right now, without asking the
        // layout. The resting box scrolls away; the plate rises to meet it.
        const fromTop = restTop - at
        const toTop = plateTop - at

        const ax = restLeft + (plateLeft - restLeft) * t
        const ay = fromTop + (toTop - fromTop) * t
        const aw = frameW + (plateW - frameW) * t
        const ah = frameH + (plateH - frameH) * t

        /*
          The wrapper is held at the top of the viewport by `useLock`, so its
          own box is (restLeft, 0, frameW, frameH) and the insets are just the
          aperture measured against that. Clamped, because once the plate has
          left the top of the screen the aperture is outside the wrapper
          altogether and an over-constrained inset is the correct empty result.
        */
        const x = ax - restLeft
        const top = Math.min(frameH, Math.max(0, ay))
        const left = Math.min(frameW, Math.max(0, x))
        const right = Math.min(frameW, Math.max(0, frameW - (x + aw)))
        const bottom = Math.min(frameH, Math.max(0, frameH - (ay + ah)))
        shell.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`

        // And the field's own box mapped onto that same aperture. The origin is
        // pinned top-left in the markup, so translate-then-scale reads directly
        // in the wrapper's coordinates with no compensating term.
        inner.style.transform =
          `translate3d(${x}px, ${ay}px, 0) scale(${aw / frameW}, ${ah / frameH})`
      },
    })
  })
}

const HANDOFF = {
  /**
   * Where the cell bar's top has to reach, as a fraction of the viewport, for
   * the panel to advance off its opening cell.
   *
   * MEASURED, and the derivation is worth keeping because the number looks
   * arbitrary and is not. On the reference the advance fires at the exact
   * scroll position where the contraction LANDS — the moment the closing plate
   * is centred in the viewport. Checked at two viewport heights against the
   * prediction `plateTop - (viewport - plateHeight) / 2`:
   *
   *   1440x860   plate top 1107, height 359   predicted 857   fired 857
   *   1440x600   plate top  847, height 359   predicted 727   fired 727
   *
   * Nothing else fits: it is neither a constant fraction of the viewport nor a
   * constant offset from its bottom, and both of those were tried first.
   *
   * SO WHY IS THIS A FRACTION OF THE VIEWPORT RATHER THAN THAT ARITHMETIC.
   * Because the reference's plate is the panel's own media frame — its cell bar
   * is the next thing down the page, top edge flush against the plate's bottom.
   * "The plate has centred" and "the bar has just risen into view" are the same
   * event there. They are 700px apart here: teardown §8.7 gives our panel its
   * own framed media above the bar, and §11.3.2 keeps the plate separate above
   * that, so keying this to the plate would advance the gold while the control
   * is a full screen below the fold and no reader would ever see it happen.
   *
   * What is preserved is therefore what the reader sees, which is what a
   * fidelity replication is for: the bar arrives, and as it settles the fill
   * crosses. The number is where the reference's bar sits at the instant it
   * fires, at the viewport the teardown itself was measured at —
   * (860 - 359) / 2 + 359 = 609.5 of 860.
   */
  line: 0.709,
} as const

/**
 * Advances a cell bar through its cells as it settles into the viewport, and
 * gives up the moment the reader touches it.
 *
 * This is the second half of the reference's opening move. The first half is
 * `useLock` plus `useContract` — the backdrop holding still while the page
 * slides over it, then cropping into the plate. This is what happens when that
 * lands: the two-cell panel under it steps from its first cell to its second,
 * one block of gold sliding across, and steps back on the way up.
 *
 * IT REPORTS A STEP; IT ANIMATES NOTHING. Same division of labour as `usePin`,
 * and for the same reason. The fill's travel is a CSS transition on a
 * transform, owned by <TabPanel/>, which re-targets from wherever it currently
 * is when the reader crosses the line twice in a second — a tween would have to
 * be killed and restarted. Reduced motion takes that transition to nothing in
 * main.css, so the advance still happens and simply happens at once. Less
 * movement, not less information; `useAway` and `useStops` are the precedents.
 *
 * THE STEP IS A PURE FUNCTION OF SCROLL against cached bounds, so the reverse
 * crossing the reader sees on the way back up is not a second code path — there
 * is no playhead to run backwards. It is also why a flung trackpad that clears
 * the whole bar in one event lands on the right cell: `onToggle` would have
 * seen nothing, and this arithmetic does not care that it was never called in
 * between. No dead-band, deliberately: the reference has none, and a 700ms
 * transition is already the thing that absorbs a reader parked on the line.
 *
 * `cede` IS NOT AN ESCAPE HATCH, IT IS THE MEASURED BEHAVIOUR. Pressing a cell
 * on the reference stops scroll driving the panel, permanently and in both
 * directions — verified by clicking cell 1 past the line, then scrolling down
 * 200px, down another 200, and back up over the line: it stayed on cell 1
 * throughout. That is the right rule quite apart from fidelity. A control that
 * re-decides itself under a reader who has just made a choice is broken, and
 * the roving tabindex makes it concrete: without this, scrolling would move
 * `tabindex="0"` off the very cell the reader is standing on.
 *
 * @param bar   the tablist element
 * @param opts.count  how many cells
 * @returns `step`, and `cede` to hand the control over for good
 */
export function useHandoff(bar: Ref<unknown>, opts: { count: number }) {
  const step = ref(0)
  let ceded = false
  const run = useScope(bar)

  run(() => {
    const node = asElement(bar.value)
    if (!node || opts.count < 2) return

    /**
     * The scroll positions at which each cell after the first is reached,
     * ascending, cached on refresh.
     *
     * Measured in the SCROLLER's coordinates rather than the window's — on a
     * coarse pointer the document does not scroll, the container in the layout
     * does, and `getBoundingClientRect().top + scrollY` is the wrong sum there.
     * `useStops` carries the same three lines for the same reason.
     *
     * ONLY THE TWO-CELL CASE IS MEASURED. `HANDOFF.line` is one number and the
     * reference's panel has one boundary to cross, so for a longer bar the
     * remaining lines are spaced evenly between it and the top of the viewport.
     * That is an assumption, stated here rather than hidden in the arithmetic;
     * the one panel on the site that asks for this has two cells, where the
     * spacing never applies.
     */
    let marks: number[] = []

    const bounds = () => {
      const root = scrollRoot()
      const box = root instanceof Element ? root.getBoundingClientRect().top : 0
      const view = root instanceof Element ? root.clientHeight : window.innerHeight
      const now = root instanceof Element ? root.scrollTop : window.scrollY
      const top = node.getBoundingClientRect().top - box + now
      const gaps = opts.count - 1

      marks = Array.from({ length: gaps }, (_, i) => top - view * HANDOFF.line * (1 - i / gaps))
    }

    /** The last cell whose line the reader has passed. Pure, and total. */
    const which = (scroll: number) => {
      let i = 0
      while (i < marks.length && scroll >= marks[i]) i += 1
      return i
    }

    ScrollTrigger.create({
      scroller: scrollRoot(),
      start: 0,
      end: 'max',
      // Re-measure AND re-apply, `useStops`' shape: a resize can carry the bar
      // across a line without the reader touching the wheel, and a refresh that
      // only refreshed the cache would leave the panel on the cell it settled
      // on at the old height.
      onRefresh: (self) => { bounds(); if (!ceded) step.value = which(self.scroll()) },
      onUpdate: (self) => { if (!ceded) step.value = which(self.scroll()) },
    })
  })

  return { step, cede: () => { ceded = true } }
}

/* -------------------------------------------------------------------------- */
/* 15. the rail's stops — phase 11 §11.4                                       */
/* -------------------------------------------------------------------------- */

const STOP = {
  /** Where in the viewport a section becomes "the one being read". */
  line: 45,
  /** The mark's travel between items. Teardown §6's sharper expo-out. */
  span: 0.5,
  ease: 'expo.out',
} as const

/**
 * Reports which of N anchored sections the reader is in, moves the rail's
 * marker to it, and hands back a way to jump to one.
 *
 * THE MARKER LANDS ON ITEMS; IT NEVER SLIDES BETWEEN THEM. §11.4 is explicit
 * about this and it is the detail that makes the rail read as a made object
 * rather than as a scroll indicator — which the site is forbidden from having
 * at all (§11.7). So `at` is an INTEGER, computed as a pure function of scroll
 * position against measured section bounds, and the mark is tweened to the new
 * item's centre only when that integer changes. Reverse crossing cannot
 * desynchronise it because there is no playhead to desynchronise — the same
 * reasoning that governs `usePin`'s step.
 *
 * ONE TRIGGER OVER THE PAGE, NOT ONE PER SECTION, and this was built the other
 * way first. A trigger per section with `start: 'top 45%'` / `end: 'bottom
 * 45%'` reads beautifully and has one hole: `onToggle` fires when `isActive`
 * FLIPS, so a reader who jumps from above a section to below it in a single
 * scroll event — an anchor jump, a Home/End press, a flung trackpad — takes
 * that trigger from false to false and it never fires at all. The symptom was
 * the LAST stop being unreachable, because the page bottoms out past its end.
 * Found by measuring, not by reading.
 *
 * The replacement is NOT "divide total scroll into N equal parts", which would
 * be wrong by a whole section by the middle of the page — the pinned reel is
 * 300vh and the closing panel is a fraction of a screen. It is a lookup
 * against each section's real top, cached on refresh: the last section whose
 * top has passed a line 45% down the viewport is the one being read. Correct
 * at every scroll position including both ends, correct after any jump, and it
 * costs a scan of eight numbers.
 *
 * `shown` comes out of the same pass, against the same cached bounds. §11.1
 * measures the rail as absent for every hero dwell in the capture without
 * exception, so the threshold is the hero copy block's own bottom edge — one
 * real element boundary rather than a number somebody picked. It arrives
 * exactly as the hero finishes dissolving, which is the hand-off the reference
 * shows.
 *
 * @param stops   the section elements, in DOM order
 * @param opts.gate  the hero block whose departure reveals the rail
 * @param opts.mark  the travelling glyph
 * @param opts.list  the <ul> the glyph travels down
 */
export function useStops(
  stops: Ref<Element[]>,
  opts: { gate: Ref<unknown>; mark: Ref<HTMLElement | null>; list: Ref<HTMLElement | null> },
) {
  const at = ref(0)
  const shown = ref(false)
  const run = useScope()

  /**
   * Item centres, in the list's own coordinates, cached on refresh.
   *
   * Measured rather than derived from a row height, because the labels wrap at
   * some viewport widths and a rail whose marker is computed from `index *
   * rowHeight` drifts a little further out of alignment on every item below
   * the one that wrapped.
   */
  let centres: number[] = []

  function place(i: number, jump = false) {
    const node = opts.mark.value
    const to = centres[i]
    if (!node || to === undefined) return
    gsap.killTweensOf(node)
    if (jump || calm()) {
      gsap.set(node, { y: to })
      return
    }
    gsap.to(node, { y: to, duration: STOP.span, ease: STOP.ease })
  }

  function measure() {
    const list = opts.list.value
    const node = opts.mark.value
    if (!list || !node) return
    const half = node.offsetHeight / 2
    centres = Array.from(list.children).map((row) => {
      const item = row as HTMLElement
      return item.offsetTop + item.offsetHeight / 2 - half
    })
    place(at.value, true)
  }

  run(() => {
    if (!stops.value.length) return

    /**
     * Geometry in the SCROLLER's coordinates, cached on refresh.
     *
     * Not `getBoundingClientRect().top + scrollY`: on a coarse pointer the
     * document does not scroll, the container in the layout does, so page
     * coordinates and window coordinates are not the same thing. Subtracting
     * the scroller's own rect and adding its scroll offset is right in both
     * cases, which is the whole reason `scrollRoot()` exists.
     */
    let tops: number[] = []
    let line = 0
    let clear = 0

    const bounds = () => {
      const root = scrollRoot()
      const box = root instanceof Element ? root.getBoundingClientRect().top : 0
      const view = root instanceof Element ? root.clientHeight : window.innerHeight
      const now = root instanceof Element ? root.scrollTop : window.scrollY
      const off = (el: Element) => el.getBoundingClientRect().top - box + now

      line = (view * STOP.line) / 100
      tops = stops.value.map(off)

      // Where the hero's copy block has fully left the viewport. §11.1
      // measures the rail as absent for every hero dwell in the capture,
      // without exception, so the threshold is a real element's bottom edge
      // rather than a number somebody picked.
      const gate = asElement(opts.gate.value)
      clear = gate ? off(gate) + gate.getBoundingClientRect().height : 0
    }

    /** The last section whose top has passed the line. Pure, and total. */
    const which = (scroll: number) => {
      const mark = scroll + line
      let i = 0
      while (i + 1 < tops.length && tops[i + 1] <= mark) i += 1
      return i
    }

    const settle = (scroll: number, jump: boolean) => {
      shown.value = scroll >= clear
      const next = which(scroll)
      if (next === at.value && !jump) return
      at.value = next
      place(next, jump)
    }

    /*
      ONE TRIGGER FOR THE WHOLE RAIL, spanning the whole scroll.

      `start: 0, end: 'max'` is `useAway`'s shape, and it is used here for the
      same reason: what the rail needs is not "am I inside some element's
      range" but "where is the reader", resolved at every scroll position
      including both ends. Both `shown` and `at` fall out of one arithmetic
      pass over cached bounds, so they cannot disagree with each other, and a
      jump of any size lands on the right index because that index does not
      depend on having observed the positions in between.

      NOTE THE ABSENT `calm()` GUARD, which almost every other helper in this
      file opens with. Reduced motion means less MOVEMENT, not less
      information — the note on the reduced-motion block in main.css says so,
      and `useAway` is again the precedent: the header still hides on scroll
      down under that setting, it just does it instantly. The argument is
      stronger here, because this is navigation. A rail that reduced motion
      deletes is not a preference being respected, it is a feature withheld
      from the readers most likely to want a way down a long page.

      So the trigger is built either way and the MOTION is what changes:
      `place()` sets the marker instead of tweening it, and main.css takes the
      rail's opacity transition to nothing.
    */
    ScrollTrigger.create({
      scroller: scrollRoot(),
      start: 0,
      end: 'max',
      // Re-measure AND re-apply. A resize can move a section past the line
      // without the reader touching the scroll wheel, and a refresh that only
      // updated the cache would leave the marker parked on the index it settled on last.
      onRefresh: (self) => { bounds(); settle(self.scroll(), true) },
      onUpdate: (self) => settle(self.scroll(), false),
    })

    /*
      ON THE nextTick.

      The rail renders nothing until it has resolved its anchors, and it
      resolves them in a mounted hook — so at the moment this runs, the list
      and the marker are a `v-if` away from existing and both refs are still
      null. Measuring here would cache an empty set of centres and the marker
      would sit at zero for the life of the page, which is exactly what it did
      before this comment was written. One tick later the render has flushed.
    */
    void nextTick(measure)
    ScrollTrigger.addEventListener('refreshInit', measure)
    // `refreshInit` is added to a static list, so it outlives the context that
    // created it. gsap.context() reverts tweens and triggers; it knows nothing
    // about this.
    onBeforeUnmount(() => ScrollTrigger.removeEventListener('refreshInit', measure))
  })

  /**
   * Jump to a section.
   *
   * It goes through Lenis where Lenis exists, because a `scrollIntoView` on a
   * page Lenis is smoothing sets the native scroll position underneath it and
   * the two spend the next second arguing — the page lands, drifts back, and
   * lands again. Where Lenis is not built (a coarse pointer, reduced motion)
   * the native call is exactly right, including its own respect for
   * `prefers-reduced-motion`.
   */
  function goTo(section: Element) {
    if (smooth) {
      smooth.scrollTo(section as HTMLElement, { offset: 0 })
      return
    }
    section.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' })
  }

  return { at, shown, goTo }
}

/* -------------------------------------------------------------------------- */
/* 16. inspection — /specimen only                                            */
/* -------------------------------------------------------------------------- */

/**
 * Global time scale. The fidelity check in phase 2 task 2.3 is "open both at
 * 0.25x and compare", so the specimen route needs a way to say that.
 */
export function setTimeScale(rate: number) {
  engine().globalTimeline.timeScale(rate)
}

/**
 * How many ScrollTriggers exist right now.
 *
 * Phase 3's exit criteria include "navigating between routes and back leaves
 * this number unchanged". Every trigger on the site is created inside a
 * `gsap.context()` that is reverted on unmount, so it should be — but a leak
 * is invisible until it is counted, and this is what counts it.
 */
export function triggerCount() {
  return import.meta.client ? ScrollTrigger.getAll().length : 0
}
