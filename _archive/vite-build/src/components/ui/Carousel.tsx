import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { prefersLessMotion } from '@/lib/motion'

/* --------------------------------------------------------------------------
   Harvested from 21st: "Linear Carousel" (animbits, id 20150).
   Kept: the native horizontal-overflow scroller with arrow controls, which is
   the only carousel architecture in the catalogue that is genuinely swipeable
   on touch without a pointer-gesture library.
   Rebuilt: scroll snapping per card, per-card stepping instead of jump-to-end,
   dot controls, and our tokens. Autoplay, the infinite duplication of items
   and the motion/lucide dependencies were dropped — a duplicated item list
   would render every card twice, and autoplay moves content out from under a
   reader mid-sentence.

   HARD REQUIREMENT (Task 2.5): reachable on touch.
   Three independent ways to advance, all tap- or gesture-driven, none
   hover-dependent and none mouse-only:
     1. native touch/trackpad swipe on the scroller
     2. the arrow buttons, which are visible at every breakpoint
     3. the dot controls
   Keyboard reaches it too: the scroller is focusable and arrow keys move it.
   -------------------------------------------------------------------------- */

export type CarouselItem = {
  /** Stable key, and the value announced to assistive tech. */
  id: string
  label: string
  content: ReactNode
}

type CarouselProps = {
  items: CarouselItem[]
  /** Accessible name for the whole scroller. */
  label: string
  /** Tailwind width classes for a single card. */
  cardClassName?: string
  className?: string
}

export default function Carousel({
  items,
  label,
  cardClassName = 'w-[78vw] sm:w-[46vw] lg:w-[30rem]',
  className,
}: CarouselProps) {
  const track = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)
  const [scrollable, setScrollable] = useState(false)

  /**
   * Which card is at the left edge right now. Measured from each card's own
   * offset rather than assuming a uniform step, so a card that wraps to a
   * different width at another breakpoint still reports correctly.
   */
  const sync = useCallback(() => {
    const el = track.current
    if (!el) return
    setScrollable(el.scrollWidth > el.clientWidth + 4)

    const cards = [...el.children] as HTMLElement[]
    if (cards.length === 0) return
    const target = el.scrollLeft + el.offsetLeft
    let nearest = 0
    let best = Infinity
    cards.forEach((card, i) => {
      const gap = Math.abs(card.offsetLeft - target)
      if (gap < best) {
        best = gap
        nearest = i
      }
    })
    setActive(nearest)
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync])

  /**
   * `active` is set here as well as in `sync` on purpose. A swipe updates it
   * through the scroll listener, but a tap on an arrow or a dot must move the
   * controls immediately rather than waiting on a smooth-scroll animation to
   * report back — otherwise two quick taps both act on the stale index and the
   * second one goes nowhere.
   */
  const go = useCallback((index: number) => {
    const el = track.current
    if (!el) return
    const card = el.children[index] as HTMLElement | undefined
    if (!card) return
    setActive(index)
    el.scrollTo({
      left: card.offsetLeft - el.offsetLeft,
      behavior: prefersLessMotion() ? 'auto' : 'smooth',
    })
  }, [])

  const atStart = active <= 0
  const atEnd = active >= items.length - 1

  const arrow =
    'grid h-11 w-11 place-items-center rounded-full border transition-colors duration-200 disabled:opacity-35'

  return (
    <div className={cn('relative', className)}>
      <ul
        ref={track}
        tabIndex={0}
        aria-label={label}
        className={cn(
          'flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain',
          'pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'm-0 list-none p-0',
        )}
      >
        {items.map((item) => (
          <li
            key={item.id}
            aria-label={item.label}
            className={cn('shrink-0 snap-start', cardClassName)}
          >
            {item.content}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2" role="tablist" aria-label={`${label} position`}>
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={item.label}
              onClick={() => go(i)}
              className="h-8 px-1"
            >
              <span
                className="block h-px w-7 transition-opacity duration-200"
                style={{
                  backgroundColor: 'var(--fore)',
                  opacity: i === active ? 1 : 0.25,
                }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(Math.max(0, active - 1))}
            disabled={atStart || !scrollable}
            aria-label="Previous"
            className={arrow}
            style={{ borderColor: 'var(--rule)', color: 'var(--fore)' }}
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            onClick={() => go(Math.min(items.length - 1, active + 1))}
            disabled={atEnd || !scrollable}
            aria-label="Next"
            className={arrow}
            style={{ borderColor: 'var(--rule)', color: 'var(--fore)' }}
          >
            <Chevron direction="right" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}
    >
      <path
        d="M4.5 1.5 10 7l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  )
}
