import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type PillProps = {
  /** Where it goes. Required — nothing on this site links to nowhere. */
  to: string
  children: string
  /**
   * `solid` carries its own colours and can sit over any ground, which is what
   * the persistent floating CTA needs. `quiet` inherits the ground's
   * foreground and is for the pill used inline inside a scene.
   */
  tone?: 'solid' | 'quiet'
  /**
   * Handle the activation in the page instead of following the link.
   *
   * The CTA opens the ballot dialog, which is a better experience than a
   * navigation — but it stays an anchor with a real `to`, so it still works
   * with JavaScript off, still shows a destination in the status bar, and is
   * still openable in a new tab. The handler only pre-empts a plain left
   * click; modified clicks fall through to the browser.
   */
  onActivate?: () => void
  className?: string
}

const BASE =
  'type-label inline-flex items-center justify-center rounded-full border px-5 py-2.5 whitespace-nowrap transition-colors duration-200'

/** A plain left click, with no modifier that means "open this somewhere else". */
function isPlainClick(event: React.MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}

/**
 * "Request Access" — the site's only call to action, and a ballot rather than
 * a checkout. Deliberately understated: a hairline pill, label type, no icon,
 * no shadow, no gradient.
 */
export default function Pill({ to, children, tone = 'solid', onActivate, className }: PillProps) {
  const style =
    tone === 'solid'
      ? {
          backgroundColor: 'var(--moss)',
          borderColor: 'var(--moss)',
          color: 'var(--bone)',
        }
      : {
          backgroundColor: 'transparent',
          borderColor: 'var(--rule)',
          color: 'var(--fore)',
        }

  const classes = cn(
    BASE,
    tone === 'solid' ? 'hover:opacity-90' : 'hover:border-current',
    className,
  )

  const onClick = onActivate
    ? (event: React.MouseEvent) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        onActivate()
      }
    : undefined

  // Same-page anchors are real anchors; everything else is a router link.
  if (to.startsWith('#')) {
    return (
      <a href={to} className={classes} style={style} onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <Link to={to} className={classes} style={style} onClick={onClick}>
      {children}
    </Link>
  )
}
