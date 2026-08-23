import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type EyebrowProps = {
  children: ReactNode
  as?: ElementType
  /** Render in the ground's full foreground rather than the muted tone. */
  strong?: boolean
  className?: string
}

/**
 * The small uppercase label above a headline, beside a figure, or heading a
 * data column. 0.7rem, 0.18em tracking, 500 weight — one treatment, used
 * everywhere, so no label anywhere on the site can read as special.
 */
export default function Eyebrow({
  children,
  as: Tag = 'p',
  strong = false,
  className,
}: EyebrowProps) {
  return (
    <Tag
      className={cn('type-label', className)}
      style={{ color: strong ? 'var(--fore)' : 'var(--fore-muted)' }}
    >
      {children}
    </Tag>
  )
}
