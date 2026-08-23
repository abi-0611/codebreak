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
 * The partner strip. The track holds the cells twice, so translating it by
 * exactly -50% lands the copy where the original was and the repeat is
 * seamless. `ease: 'none'` — a ticker that eases is a ticker that pulses.
 *
 * Paused when off screen, because a marquee running behind five sections of
 * page is pure battery.
 */
export function useTicker(track: Ref<unknown>, seconds = 40) {
  const run = useScope(track)

  run(() => {
    const node = asElement(track.value)
    if (!node || calm()) return

    const loop = gsap.to(node, {
      xPercent: -50, duration: seconds, ease: 'none', repeat: -1,
    })

    ScrollTrigger.create({
      trigger: node,
      scroller: scrollRoot(),
      start: 'top bottom',
      end: 'bottom top',
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
  opts: { count: number; bar?: Ref<unknown> },
) {
  const step = ref(0)
  /** False until a trigger actually exists — drives `inert`, never layout. */
  const live = ref(false)
  const run = useScope(el)

  run(() => {
    const node = asElement(el.value)
    if (!node || calm()) return

    const track = asElement(opts.bar?.value)
    // GSAP caches a transform origin the first time it touches an element.
    // The class says `origin-left`; saying it again here means the cached value
    // cannot be whatever the computed style happened to be at that instant.
    if (track) gsap.set(track, { transformOrigin: 'left center' })
    const setBar = track ? gsap.quickSetter(track, 'scaleX') : null
    setBar?.(0)

    ScrollTrigger.create({
      trigger: node,
      scroller: scrollRoot(),
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setBar?.(self.progress)

        const at = self.progress * opts.count
        const now = step.value
        if (at >= now + 1 + PIN.guard || at < now - PIN.guard) {
          step.value = Math.min(opts.count - 1, Math.max(0, Math.floor(at)))
        }
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
/* 13. inspection — /specimen only                                            */
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
