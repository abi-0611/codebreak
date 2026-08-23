import type Lenis from 'lenis'

/**
 * In-page navigation.
 *
 * The smooth scroller owns the scroll position while it is running, so an
 * anchor cannot simply call `scrollIntoView` — the host styles pin
 * `scroll-behavior` to `auto` whenever smoothing is on, because two things
 * animating one position fight each other, and the jump that results is the
 * opposite of what a nav link should feel like.
 *
 * So the scroller registers itself here on mount and anchors hand their target
 * to it. When it is not running — which includes every visitor under
 * prefers-reduced-motion — the fallback is an ordinary instant scroll, which is
 * exactly what that visitor asked for.
 */
let active: Lenis | null = null

/** Clearance for the fixed header, so a section does not open underneath it. */
const HEADER = 96

/** Called by the scroll provider on mount, and with null on unmount. */
export function hold(instance: Lenis | null): void {
  active = instance
}

/** Move to an in-page target, clear of the header. */
export function glide(target: HTMLElement): void {
  if (active) {
    active.scrollTo(target, { offset: -HEADER })
    return
  }
  const top = target.getBoundingClientRect().top + window.scrollY - HEADER
  window.scrollTo({ top, behavior: 'auto' })
}
