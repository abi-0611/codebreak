import { Link } from 'react-router-dom'
import Mark from '@/components/ui/Mark'
import Section from '@/components/ui/Section'
import Eyebrow from '@/components/ui/Eyebrow'
import type { ContactLine, FootColumn } from '@/content/site'

/* --------------------------------------------------------------------------
   Harvested from 21st: "Large Name Footer" (arihantcodes, id 872).
   Kept: the editorial arrangement — an oversized wordmark anchoring the left,
   a column grid of real sitemap links to its right, legal on a rule beneath.
   Rebuilt: next/link swapped for react-router, the shadcn Button and Icons
   imports dropped, and the whole thing set on --scene-dusk in our type scale.
   Rejected: "Agency Footer" (id 21474) and "Footer 2" (id 609), both of which
   lead with a newsletter capture — a form we have no server for would be the
   kind of broken scaffolding Rule 8 exists to prevent.

   Every link here resolves. The columns are ordered the way a real sitemap is
   ordered — what you can book, who we are, the small print, how to reach us —
   and no row is weighted, reordered or given an interaction its neighbours do
   not have.

   The bottom bar carries the mark and the copyright line and nothing else. In
   particular there is no "built with" credit: a visitor looking for the shape
   of the stack would look there first, and finding nothing is the point.
   -------------------------------------------------------------------------- */

type FooterProps = {
  wordmark: string
  columns: FootColumn[]
  contact: { heading: string; lines: ContactLine[] }
  legal: string
  /** One flat line of company detail. Address, registration, that register. */
  note: string
}

const ITEM = 'type-small transition-opacity duration-200 hover:opacity-60'

export default function Footer({ wordmark, columns, contact, legal, note }: FooterProps) {
  return (
    <Section as="footer" ground="dusk" innerClassName="pt-[var(--scene-pad)] pb-14">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <div className="flex items-center gap-4" style={{ color: 'var(--fore)' }}>
            <Mark size={30} />
            <span
              className="type-title"
              style={{ fontFamily: 'var(--font-text)', letterSpacing: '0.16em', fontSize: 'var(--step-lead)' }}
            >
              {wordmark}
            </span>
          </div>
          <p className="type-small mt-6 max-w-[34ch]" style={{ color: 'var(--fore-muted)' }}>
            {note}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">
          {columns.map((column) => (
            <div key={column.heading}>
              <Eyebrow as="h2">{column.heading}</Eyebrow>
              <ul className="m-0 mt-5 list-none space-y-3 p-0">
                {column.links.map((item) => (
                  <li key={`${column.heading}-${item.label}`}>
                    <Link to={item.to} className={ITEM} style={{ color: 'var(--fore)' }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div id="contact" className="scroll-mt-28">
            <Eyebrow as="h2">{contact.heading}</Eyebrow>
            <ul className="m-0 mt-5 list-none space-y-3 p-0">
              {contact.lines.map((line) => (
                <li key={line.label}>
                  {line.to ? (
                    <a href={line.to} className={ITEM} style={{ color: 'var(--fore)' }}>
                      {line.value}
                    </a>
                  ) : (
                    <span className="type-small" style={{ color: 'var(--fore-muted)' }}>
                      {line.value}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div
        className="mt-20 flex items-center gap-4 border-t pt-8"
        style={{ borderColor: 'var(--rule)' }}
      >
        <Mark size={18} />
        <Eyebrow>{legal}</Eyebrow>
      </div>
    </Section>
  )
}
