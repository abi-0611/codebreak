import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Mark from '@/components/ui/Mark'
import Pill from '@/components/ui/Pill'
import { cn } from '@/lib/cn'
import { useScrollPast } from '@/lib/motion'
import type { NavLink } from '@/content/site'

/* --------------------------------------------------------------------------
   Harvested from 21st: "Navbar 1" (preetsuthar17, id 2046).
   Kept: its shape — wordmark left, links centre, CTA right, and a full-screen
   overlay menu below the breakpoint.
   Rebuilt: the scroll state (transparent over the hero, blurred bone ground
   past 80px), our tokens, and no motion/lucide dependencies.
   Rejected: "Truncating Navbar" (id 2570), which ships a site-wide find field
   — an input with that label would be a false positive that costs a visitor
   real time, and CLAUDE.md rules it out explicitly.

   The scroll state reads ScrollTrigger rather than a private scroll listener,
   so the header changes on the same smoothed position everything else on the
   page animates against, and the site keeps one scroll observer rather than
   one per component.
   -------------------------------------------------------------------------- */

const THRESHOLD = 80

type NavProps = {
  wordmark: string
  links: NavLink[]
  cta: { label: string; to: string }
  onRequest: () => void
}

export default function Nav({ wordmark, links, cta, onRequest }: NavProps) {
  const settled = useScrollPast(THRESHOLD)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, hash } = useLocation()

  // A body that scrolls behind an open full-screen menu is disorienting.
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'clip'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  const here = `${pathname}${hash}`
  const link = 'type-label transition-opacity duration-200 hover:opacity-60'

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
          settled && 'backdrop-blur-md',
        )}
        style={{
          backgroundColor: settled ? 'color-mix(in oklab, var(--bone) 82%, transparent)' : 'transparent',
          color: settled ? 'var(--ink)' : 'var(--fore, var(--ink))',
          borderBottom: settled ? '1px solid color-mix(in oklab, var(--ink) 12%, transparent)' : '1px solid transparent',
        }}
      >
        <div className="mx-auto flex h-[4.5rem] w-full max-w-[var(--shell)] items-center justify-between gap-8 px-[var(--gutter)]">
          <Link to="/" className="flex items-center gap-3" aria-label={`${wordmark} — home`}>
            <Mark size={20} />
            <span className="type-label" style={{ letterSpacing: '0.22em' }}>
              {wordmark}
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-10 md:flex">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(link, here === item.to && 'opacity-60')}
                aria-current={here === item.to ? 'true' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Pill to={cta.to} onActivate={onRequest}>
              {cta.label}
            </Pill>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="primary-menu"
            className="type-label md:hidden"
          >
            Menu
          </button>
        </div>
      </header>

      {/* Conditionally rendered, not toggled with a class: a menu that is not
          open contributes nothing to the document. */}
      {menuOpen ? (
        <div
          id="primary-menu"
          className="fixed inset-0 z-[60] flex flex-col md:hidden"
          style={{ backgroundColor: 'var(--bone)', color: 'var(--ink)' }}
        >
          <div className="flex h-[4.5rem] items-center justify-between px-[var(--gutter)]">
            <span className="type-label" style={{ letterSpacing: '0.22em' }}>
              {wordmark}
            </span>
            <button type="button" onClick={() => setMenuOpen(false)} className="type-label">
              Close
            </button>
          </div>

          <nav
            aria-label="Primary"
            className="flex flex-1 flex-col justify-center gap-2 px-[var(--gutter)]"
          >
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="type-title border-b py-4"
                style={{ borderColor: 'color-mix(in oklab, var(--ink) 12%, transparent)' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="px-[var(--gutter)] pb-12">
            <Pill
              to={cta.to}
              onActivate={() => {
                setMenuOpen(false)
                onRequest()
              }}
              className="w-full"
            >
              {cta.label}
            </Pill>
          </div>
        </div>
      ) : null}
    </>
  )
}
