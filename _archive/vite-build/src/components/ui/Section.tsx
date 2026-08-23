import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * The five scroll scenes. Each owns a ground and, with it, the foreground
 * colours every descendant inherits. Body copy is --ink on light grounds and
 * --bone on dark; there is no third option.
 */
export type Ground = 'approach' | 'ascent' | 'ridge' | 'camp' | 'dusk'

type Tone = {
  ground: string
  fore: string
  muted: string
}

const TONE: Record<Ground, Tone> = {
  approach: { ground: 'var(--scene-approach)', fore: 'var(--ink)', muted: 'var(--stone)' },
  ascent: { ground: 'var(--scene-ascent)', fore: 'var(--ink)', muted: 'var(--stone)' },
  ridge: { ground: 'var(--scene-ridge)', fore: 'var(--bone)', muted: 'var(--haze)' },
  camp: { ground: 'var(--scene-camp)', fore: 'var(--ink)', muted: 'var(--stone)' },
  dusk: { ground: 'var(--scene-dusk)', fore: 'var(--bone)', muted: 'var(--haze)' },
}

type SectionProps = {
  ground: Ground
  /**
   * The ground of the scene immediately above. When given, the section opens
   * with a short gradient band so the two temperatures melt into each other
   * instead of meeting at a hard line.
   */
  from?: Ground
  /** Drop the default vertical rhythm — for scenes that manage their own. */
  flush?: boolean
  /** Constrain the inner column to the page shell. On by default. */
  shell?: boolean
  /**
   * Mark the whole scene as one the floating CTA must stand down over.
   *
   * For a scene the pill cannot simply be nudged away from — a pinned,
   * full-viewport one, where there is no part of it the pill would not be
   * sitting on top of something. See AccessPill.
   */
  keepClear?: boolean
  as?: 'section' | 'div' | 'header' | 'footer'
  id?: string
  className?: string
  innerClassName?: string
  children: ReactNode
}

/**
 * Full-bleed scene wrapper. Paints the ground, publishes the foreground
 * colours to its subtree as custom properties, and owns vertical rhythm.
 *
 * Children never name a colour: they read `var(--fore)` and
 * `var(--fore-muted)`, which means the same component drops into a pale hero
 * or the near-black ridge without a single conditional.
 */
export default function Section({
  ground,
  from,
  flush = false,
  shell = true,
  keepClear = false,
  as: Tag = 'section',
  id,
  className,
  innerClassName,
  children,
}: SectionProps) {
  const tone = TONE[ground]

  return (
    <Tag
      id={id}
      data-keep-clear={keepClear || undefined}
      className={cn('relative w-full', className)}
      style={
        {
          '--ground': tone.ground,
          '--fore': tone.fore,
          '--fore-muted': tone.muted,
          backgroundColor: tone.ground,
          color: tone.fore,
        } as React.CSSProperties
      }
    >
      {from ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[14vh]"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${TONE[from].ground}, ${tone.ground})`,
          }}
        />
      ) : null}

      <div
        className={cn(
          'relative w-full',
          shell && 'mx-auto max-w-[var(--shell)] px-[var(--gutter)]',
          !flush && 'py-[var(--scene-pad)]',
          innerClassName,
        )}
      >
        {children}
      </div>
    </Tag>
  )
}
