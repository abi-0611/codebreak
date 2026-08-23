import { cn } from '@/lib/cn'
import Plate, { type Priority } from './Plate'
import type { Plate as PlateSource } from '@/content/plates'

type FigureProps = {
  /** Entry from content/plates.ts. Never a hand-written path. */
  source: PlateSource
  alt: string
  /** Caption text. Flat and informational. Never a nudge, never wit. */
  caption: string
  /** Small right-aligned index or credit, e.g. a plate number. */
  meta?: string
  /**
   * CSS aspect-ratio for the frame, e.g. '4 / 3'. Defaults to the source's own
   * ratio, which is usually what you want; pass one only to crop deliberately.
   */
  aspect?: string
  /** See Plate. 'early' for anything a visitor must not arrive at blank. */
  priority?: Priority
  /** The `sizes` hint, forwarded. */
  sizes?: string
  className?: string
}

/**
 * Image plus caption.
 *
 * ABSOLUTE RULE: every figure on this site renders identically. Same hairline
 * frame, same caption weight, same spacing, same interaction (none). No prop
 * exists that would let one figure look more considered than its neighbours,
 * and none may be added. A figure that stands out teaches a visitor to sweep
 * the site by shape rather than read it, and that costs the whole design.
 *
 * `aspect` is the only geometry knob and exists because real editorial pages
 * mix portrait and landscape plates. Use the same value across a set.
 *
 * `priority` is not a styling knob and does not change how a figure looks. It
 * decides how far ahead of being scrolled to the image starts loading, which
 * matters for the few figures a visitor has to be able to read rather than
 * merely glance at. See the note in Plate.tsx.
 */
export default function Figure({
  source,
  alt,
  caption,
  meta,
  aspect,
  priority,
  sizes,
  className,
}: FigureProps) {
  return (
    <figure className={cn('m-0', className)}>
      <div
        className="w-full overflow-hidden border"
        style={{
          aspectRatio: aspect ?? `${source.width} / ${source.height}`,
          borderColor: 'var(--rule)',
        }}
      >
        <Plate source={source} alt={alt} priority={priority} sizes={sizes} />
      </div>
      <figcaption
        className="mt-3 flex items-baseline justify-between gap-6 border-t pt-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <span className="type-small max-w-[46ch]" style={{ color: 'var(--fore-muted)' }}>
          {caption}
        </span>
        {meta ? (
          <span className="type-label shrink-0" style={{ color: 'var(--fore-muted)' }}>
            {meta}
          </span>
        ) : null}
      </figcaption>
    </figure>
  )
}
