import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'
import { prefersLessMotion } from '@/lib/motion'

/* --------------------------------------------------------------------------
   Harvested from 21st: "Accordion" (ddoemonn, id 23530).
   Kept: its interaction contract — single-open with roving arrow-key
   navigation, Home/End, aria-expanded/aria-controls wiring.
   Rebuilt: the disclosure mechanism, for the reason below.

   HARD REQUIREMENT (Task 2.5): panel content must be ABSENT from the DOM
   while the panel is collapsed.

   Every accordion in the catalogue fails this. The measured-height ones
   (id 23530) keep the panel mounted at height 0; the base-ui and radix ones
   (24876, 8190) keep it mounted behind a CSS animation. Both were rejected
   and the disclosure was rewritten: `mounted` gates rendering entirely, so a
   collapsed panel contributes no nodes and no text to the document.

   Opening still animates. The panel mounts first and expands on the next
   frame via a 0fr -> 1fr grid row, which needs no height measurement; closing
   runs in reverse and unmounts on transitionend, with a timeout backstop in
   case the transition is pre-empted.

   Also rejected from 8190: scroll-driven opening with clicks disabled. It
   breaks Rule 4 (no touch affordance) and Rule 5 (content tied to a scrub
   position).
   -------------------------------------------------------------------------- */

const DURATION_MS = 320

export type AccordionItem = {
  id: string
  question: string
  body: ReactNode
}

type AccordionProps = {
  items: AccordionItem[]
  /** Panel to open on first render. Omit to start with all of them closed. */
  initial?: string
  className?: string
}

export default function Accordion({ items, initial, className }: AccordionProps) {
  const [open, setOpen] = useState<string | null>(initial ?? null)
  const triggers = useRef(new Map<string, HTMLButtonElement>())
  const group = useId()

  const focusAt = useCallback(
    (index: number) => {
      const next = items[(index + items.length) % items.length]
      triggers.current.get(next.id)?.focus()
    },
    [items],
  )

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const keys: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: items.length - 1,
    }
    const target = keys[event.key]
    if (target === undefined) return
    event.preventDefault()
    focusAt(target)
  }

  return (
    <div className={cn('w-full', className)}>
      {items.map((item, index) => {
        const isOpen = open === item.id
        const headId = `${group}-h-${item.id}`
        const panelId = `${group}-p-${item.id}`

        return (
          <div key={item.id} className="border-t" style={{ borderColor: 'var(--rule)' }}>
            <h3 className="m-0">
              <button
                type="button"
                id={headId}
                ref={(node) => {
                  if (node) triggers.current.set(item.id, node)
                  else triggers.current.delete(item.id)
                }}
                onClick={() => setOpen(isOpen ? null : item.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-start justify-between gap-8 py-6 text-left"
                style={{ color: 'var(--fore)' }}
              >
                <span className="type-lead max-w-[34ch]">{item.question}</span>
                <Sign open={isOpen} />
              </button>
            </h3>

            <Panel id={panelId} labelledBy={headId} open={isOpen}>
              {item.body}
            </Panel>
          </div>
        )
      })}
      <div className="border-t" style={{ borderColor: 'var(--rule)' }} />
    </div>
  )
}

type PanelProps = {
  id: string
  labelledBy: string
  open: boolean
  children: ReactNode
}

/**
 * Mounts its children only while open.
 *
 * The sequence matters. Opening: mount at 0fr, then flip to 1fr on the next
 * frame so the browser has a start value to interpolate from. Closing: flip to
 * 0fr, then unmount once the transition reports done.
 */
function Panel({ id, labelledBy, open, children }: PanelProps) {
  const [mounted, setMounted] = useState(open)
  const [expanded, setExpanded] = useState(open)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    if (open) {
      setMounted(true)
      if (prefersLessMotion()) {
        setExpanded(true)
        return
      }
      const frame = requestAnimationFrame(() => setExpanded(true))
      return () => cancelAnimationFrame(frame)
    }

    setExpanded(false)
    if (prefersLessMotion()) {
      setMounted(false)
      return
    }
    // Backstop: if the transition never lands (tab backgrounded, motion
    // pre-empted) the panel must still leave the DOM.
    timer.current = setTimeout(() => setMounted(false), DURATION_MS + 60)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [open])

  if (!mounted) return null

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      onTransitionEnd={(event) => {
        if (event.propertyName === 'grid-template-rows' && !open) setMounted(false)
      }}
      className="grid"
      style={{
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition: prefersLessMotion()
          ? 'none'
          : `grid-template-rows ${DURATION_MS}ms var(--ease-out-soft)`,
      }}
    >
      <div className="overflow-hidden">
        <div className="pb-8">{children}</div>
      </div>
    </div>
  )
}

/** A plus that becomes a minus. No icon library, two rules of SVG. */
function Sign({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="mt-2 shrink-0">
      <path d="M0 7h14" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M7 0v14"
        stroke="currentColor"
        strokeWidth="1.25"
        style={{
          transformOrigin: 'center',
          transform: open ? 'scaleY(0)' : 'scaleY(1)',
          transition: 'transform 220ms var(--ease-out-soft)',
        }}
      />
    </svg>
  )
}
