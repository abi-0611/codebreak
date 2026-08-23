import { useEffect, useId, useRef, useState } from 'react'
import Mark from '@/components/ui/Mark'
import { ballot } from '@/content/site'

/**
 * The ballot dialog behind "Request Access".
 *
 * There is no server, and the copy says so rather than implying otherwise: the
 * address is validated, the confirmation is shown, and nothing leaves the
 * browser. A form that mimes a submission it cannot make is worse than one
 * that is honest about what it is.
 *
 * Validation is deliberately loose — one @, a dot after it, no spaces. Every
 * stricter rule anyone writes rejects a real address belonging to a real
 * person, and the only consequence of accepting a bad one here is nothing.
 */
const PLAUSIBLE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type BallotProps = {
  open: boolean
  onClose: () => void
}

export default function Ballot({ open, onClose }: BallotProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const field = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef<Element | null>(null)
  const group = useId()

  // Escape closes, the background does not scroll behind it, focus moves in on
  // open and returns to whatever opened it on close.
  useEffect(() => {
    if (!open) return

    opener.current = document.activeElement
    const previous = document.body.style.overflow
    document.body.style.overflow = 'clip'

    const frame = requestAnimationFrame(() => field.current?.focus())

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return

      // A short, honest focus loop rather than a library. Three focusables.
      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(frame)
      document.body.style.overflow = previous
      if (opener.current instanceof HTMLElement) opener.current.focus()
    }
  }, [open, onClose])

  // A dialog reopened after a confirmation starts empty rather than showing
  // the previous visitor's address back to them.
  useEffect(() => {
    if (open) return
    const timer = setTimeout(() => {
      setValue('')
      setError(null)
      setDone(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [open])

  if (!open) return null

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!PLAUSIBLE.test(value.trim())) {
      setError(ballot.invalid)
      field.current?.focus()
      return
    }
    setError(null)
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={ballot.close}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ backgroundColor: 'color-mix(in oklab, var(--ink) 62%, transparent)' }}
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${group}-title`}
        className="relative w-full max-w-[30rem] p-8 sm:p-10"
        style={{
          backgroundColor: 'var(--bone)',
          color: 'var(--ink)',
          '--fore': 'var(--ink)',
          '--fore-muted': 'var(--stone)',
          '--rule': 'color-mix(in oklab, var(--ink) 16%, transparent)',
        } as React.CSSProperties}
      >
        <div className="flex items-start justify-between gap-6">
          <Mark size={24} />
          <button
            type="button"
            onClick={onClose}
            className="type-label transition-opacity duration-200 hover:opacity-60"
          >
            {ballot.close}
          </button>
        </div>

        {done ? (
          <div className="mt-10">
            <p className="type-label m-0" style={{ color: 'var(--stone)' }}>
              {ballot.eyebrow}
            </p>
            <h2 id={`${group}-title`} className="type-title mt-4 mb-0">
              {ballot.doneTitle}
            </h2>
            <p className="type-body mt-5 max-w-[34ch]" style={{ color: 'var(--stone)' }}>
              {ballot.doneBody}
            </p>
          </div>
        ) : (
          <form className="mt-10" onSubmit={submit} noValidate>
            <p className="type-label m-0" style={{ color: 'var(--stone)' }}>
              {ballot.eyebrow}
            </p>
            <h2 id={`${group}-title`} className="type-title mt-4 mb-0">
              {ballot.title}
            </h2>
            <p className="type-body mt-5 max-w-[36ch]" style={{ color: 'var(--stone)' }}>
              {ballot.body}
            </p>

            <label htmlFor={`${group}-field`} className="type-label mt-10 block">
              {ballot.field}
            </label>
            <input
              ref={field}
              id={`${group}-field`}
              type="email"
              name="email"
              autoComplete="email"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                if (error) setError(null)
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${group}-error` : undefined}
              className="mt-3 w-full border-0 border-b bg-transparent pb-3 text-[length:var(--step-lead)] outline-none"
              style={{
                borderBottom: `1px solid ${error ? 'var(--ember)' : 'var(--rule)'}`,
                color: 'var(--ink)',
              }}
            />
            {error ? (
              <p id={`${group}-error`} role="alert" className="type-small mt-3" style={{ color: 'var(--ember)' }}>
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="type-label mt-8 w-full rounded-full border px-5 py-3 transition-opacity duration-200 hover:opacity-90"
              style={{
                backgroundColor: 'var(--moss)',
                borderColor: 'var(--moss)',
                color: 'var(--bone)',
              }}
            >
              {ballot.action}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
