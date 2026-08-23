import { cn } from '@/lib/cn'
import { Split } from '@/lib/split'

type Level = 'h1' | 'h2' | 'h3' | 'div'

type DisplayProps = {
  /** A single-line headline. Use `lines` instead for stacked headlines. */
  text?: string
  /** A stacked headline, one entry per rendered line. */
  lines?: string[]
  as?: Level
  /**
   * Render each line through <Split/> so GSAP can stagger the units.
   *
   * PURELY DECORATIVE. <Split/> is an animation tool and offers no protection
   * of any kind against find-in-page — see the note in lib/split.tsx.
   */
  split?: boolean
  /**
   * Push alternate lines to opposite edges so the headline crosses the
   * viewport instead of sitting in one tidy centred block.
   */
  spread?: boolean
  /**
   * Which step of the display ramp to set on.
   *
   * `display` is the full-viewport voice — a scene that is nothing but its
   * headline. `title` is the same face and the same colour one step down, for
   * a headline that has to share a column with running copy. There is no third
   * option and no arbitrary size: both come straight from globals.css.
   */
  step?: 'display' | 'title'
  className?: string
  lineClassName?: string
  unitClassName?: string
}

/**
 * The display headline. Instrument Serif, 0.85 line-height, -0.03em tracking,
 * clamped from 3.5rem to 12rem — the one place on the site where type is
 * allowed to be loud.
 */
export default function Display({
  text,
  lines,
  as: Tag = 'h2',
  split = false,
  spread = false,
  step = 'display',
  className,
  lineClassName,
  unitClassName,
}: DisplayProps) {
  const rows = lines ?? (text ? [text] : [])
  if (rows.length === 0) return null

  return (
    <Tag
      className={cn(step === 'display' ? 'type-display' : 'type-title', className)}
      style={{ color: 'var(--fore)' }}
    >
      {rows.map((row, i) => (
        <span
          key={`${row}-${i}`}
          className={cn(
            'block',
            spread && (i % 2 === 1 ? 'text-right' : 'text-left'),
            lineClassName,
          )}
        >
          {split ? (
            <Split text={row} as="span" unitClassName={unitClassName} />
          ) : (
            row
          )}
        </span>
      ))}
    </Tag>
  )
}
