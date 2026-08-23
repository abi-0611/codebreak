import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import type { Plate as PlateSource } from '@/content/plates'

/**
 * How hard the browser should work to have this painted before it is looked
 * at. Three settings, and the middle one is the reason this component exists.
 *
 *   'first'  Above the fold. Decoded eagerly at high priority, and the caller
 *            is expected to preload it in index.html. One image on the site.
 *   'early'  Fetched a long way before it scrolls into view. For anything a
 *            visitor must not arrive at to find blank.
 *   'lazy'   Native lazy loading. The default, and right for most things.
 */
export type Priority = 'first' | 'early' | 'lazy'

type PlateProps = {
  /** Entry from content/plates.ts. Never a hand-written path. */
  source: PlateSource
  alt: string
  priority?: Priority
  /**
   * The `sizes` hint. Defaults to `100vw`, which over-serves rather than
   * under-serves — a blurry image is a worse failure than a large one here.
   * Pass something tighter once the layout around it is known.
   */
  sizes?: string
  className?: string
}

/**
 * How far ahead an 'early' plate starts fetching.
 *
 * Native `loading="lazy"` uses a threshold the browser picks, it is tuned for
 * bandwidth rather than for certainty, and it cannot be widened. That is fine
 * for scenery and not fine for the three images that carry something a visitor
 * has to be able to read: a fast scroller reaches them, finds a gap where the
 * picture should be, and moves on. An image that fails to paint may as well
 * not exist.
 *
 * So those get an observer with a margin big enough to cover roughly two
 * screens of fast scrolling, and the decode is kicked off by hand.
 */
const EARLY_MARGIN = '1600px 0px'

const srcFor = (source: PlateSource, w: number) => `/img/${source.stem}-${w}.webp`

export default function Plate({
  source,
  alt,
  priority = 'lazy',
  sizes = '100vw',
  className,
}: PlateProps) {
  const node = useRef<HTMLImageElement>(null)
  // 'early' plates start with no source and get one from the observer below.
  // Everything else is wired up on the first render and never changes.
  const [armed, setArmed] = useState(priority !== 'early')

  useEffect(() => {
    if (armed) return
    const el = node.current
    if (!el) return

    // No IntersectionObserver: load it immediately rather than never. Failing
    // open is the only acceptable direction for these three.
    if (typeof IntersectionObserver === 'undefined') {
      setArmed(true)
      return
    }

    const watch = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        watch.disconnect()
        setArmed(true)
      },
      { rootMargin: EARLY_MARGIN },
    )
    watch.observe(el)
    return () => watch.disconnect()
  }, [armed])

  // Decode off the main thread once a source is attached, so the paint does
  // not land in the middle of a scroll.
  useEffect(() => {
    if (!armed) return
    node.current?.decode?.().catch(() => {
      /* Already decoded, or cancelled by a navigation. Neither is a problem. */
    })
  }, [armed])

  const largest = source.widths[source.widths.length - 1]
  const srcSet = armed
    ? source.widths.map((w) => `${srcFor(source, w)} ${w}w`).join(', ')
    : undefined

  return (
    <img
      ref={node}
      src={armed ? srcFor(source, largest) : undefined}
      srcSet={srcSet}
      sizes={armed ? sizes : undefined}
      alt={alt}
      // Always present, always from the manifest, so the box is reserved
      // before a byte arrives and nothing shifts under a reader mid-sentence.
      width={source.width}
      height={source.height}
      loading={priority === 'lazy' ? 'lazy' : 'eager'}
      fetchPriority={priority === 'first' ? 'high' : 'auto'}
      decoding={priority === 'first' ? 'sync' : 'async'}
      className={cn('h-full w-full object-cover', className)}
    />
  )
}
