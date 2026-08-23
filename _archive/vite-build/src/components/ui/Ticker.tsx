import { cn } from '@/lib/cn'

/* --------------------------------------------------------------------------
   Harvested from 21st: "Marquee" (tom_ui, id 10277).
   Kept: the two-copy translateX(-50%) loop, which is the only marquee
   technique that seams cleanly at any content width.
   Rebuilt: the keyframes moved into globals.css instead of a <style> tag
   injected on every render, the second copy is aria-hidden so screen readers
   and find-in-page see the list once, and the whole thing halts under
   prefers-reduced-motion via the media query in globals.css.
   -------------------------------------------------------------------------- */

type TickerProps = {
  items: string[]
  /** Seconds for one full pass. Longer is calmer. */
  duration?: number
  /** Fade the two ends into the ground. */
  fade?: boolean
  className?: string
}

export default function Ticker({
  items,
  duration = 42,
  fade = true,
  className,
}: TickerProps) {
  const row = (mute: boolean) => (
    <ul
      aria-hidden={mute || undefined}
      className="m-0 flex shrink-0 list-none items-center gap-14 p-0 pr-14"
    >
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="type-label whitespace-nowrap">
          {item}
        </li>
      ))}
    </ul>
  )

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      style={{
        color: 'var(--fore-muted)',
        maskImage: fade
          ? 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)'
          : undefined,
        WebkitMaskImage: fade
          ? 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)'
          : undefined,
      }}
    >
      <div className="ticker-track flex w-max" style={{ animationDuration: `${duration}s` }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
