import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BodyProps = {
  children: ReactNode
  as?: ElementType
  /** Step up to lead size for the one opening statement of a scene. */
  lead?: boolean
  /** Render in the ground's full foreground instead of the muted tone. */
  strong?: boolean
  /** Drop the 38ch measure when the copy sits in a narrow column already. */
  full?: boolean
  className?: string
}

/**
 * Running copy at the house measure. 38ch is deliberately tight: it keeps
 * every block scannable at 375px without a single reflow rule.
 */
export default function Body({
  children,
  as: Tag = 'p',
  lead = false,
  strong = false,
  full = false,
  className,
}: BodyProps) {
  return (
    <Tag
      className={cn(lead ? 'type-lead' : 'type-body', !full && 'max-w-[var(--measure)]', className)}
      style={{ color: strong || lead ? 'var(--fore)' : 'var(--fore-muted)' }}
    >
      {children}
    </Tag>
  )
}
