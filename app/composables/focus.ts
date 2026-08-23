/**
 * Focus containment for the menu overlay — task 2.5.
 *
 * No GSAP, no Lenis, no motion of any kind: this is keyboard plumbing, and it
 * is deliberately not in motion.ts.
 *
 * What "trap focus" actually has to mean, in order:
 *
 *   1. move focus INTO the overlay when it opens, or a keyboard reader is left
 *      tabbing through a page they cannot see;
 *   2. keep Tab and Shift+Tab inside it while it is open;
 *   3. return focus to whatever opened it on close, so the reader lands back
 *      where they were rather than at the top of the document.
 *
 * Step 3 is the one that gets skipped, and it is the one a reader notices.
 */

/**
 * Everything focusable, in DOM order.
 *
 * `:not([tabindex="-1"])` matters: the overlay parks a sentinel on the panel
 * itself so there is something to focus when it opens, and that sentinel must
 * not become a stop on the Tab cycle.
 */
const REACHABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function stops(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(REACHABLE)).filter(
    // offsetParent is null for anything display:none or inside a collapsed
    // panel, which is exactly the set we must not send focus to.
    (el) => el.offsetParent !== null || el === document.activeElement,
  )
}

/**
 * Binds the cycle to `panel` while `open` is true.
 *
 * Returns nothing: the caller owns the open flag, and this owns the keyboard
 * while that flag is set.
 */
export function useFocusKeep(
  panel: Ref<HTMLElement | null>,
  open: Ref<boolean>,
  onEscape: () => void,
) {
  let came: HTMLElement | null = null

  const onKey = (e: KeyboardEvent) => {
    if (!open.value || !panel.value) return

    if (e.key === 'Escape') {
      e.preventDefault()
      onEscape()
      return
    }

    if (e.key !== 'Tab') return

    const list = stops(panel.value)
    if (!list.length) {
      e.preventDefault()
      return
    }

    const first = list[0]!
    const last = list[list.length - 1]!
    const here = document.activeElement as HTMLElement | null

    // Wrap at both ends, and also catch the case where focus has escaped the
    // panel entirely — which happens if the browser restored it elsewhere.
    if (e.shiftKey && (here === first || !panel.value.contains(here))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (here === last || !panel.value.contains(here))) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(open, async (now) => {
    if (now) {
      came = document.activeElement as HTMLElement | null
      await nextTick()
      const list = panel.value ? stops(panel.value) : []
      ;(list[0] ?? panel.value)?.focus()
    } else {
      came?.focus()
      came = null
    }
  })

  onMounted(() => document.addEventListener('keydown', onKey))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
}
