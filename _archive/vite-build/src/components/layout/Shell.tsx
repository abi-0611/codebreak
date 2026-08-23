import { useCallback, useState, type ReactNode } from 'react'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import AccessPill from '@/components/layout/AccessPill'
import Ballot from '@/components/layout/Ballot'
import { brand, nav, foot, cta } from '@/content/site'

/**
 * The page chrome every route sits inside: header, footer, persistent CTA, and
 * the one dialog the site has. Routes render only their own content and
 * inherit the rest, so the chrome cannot drift between pages.
 *
 * The ballot state lives here rather than in either control, so the header
 * pill and the floating pill open the same dialog instead of each keeping a
 * copy of it.
 */
export default function Shell({ children }: { children: ReactNode }) {
  const [asking, setAsking] = useState(false)
  const open = useCallback(() => setAsking(true), [])
  const close = useCallback(() => setAsking(false), [])

  return (
    <>
      <Nav wordmark={brand.name} links={nav} cta={cta} onRequest={open} />
      <main id="top">{children}</main>
      <Footer
        wordmark={brand.name}
        columns={foot.columns}
        contact={foot.contact}
        legal={foot.legal}
        note={foot.note}
      />
      <AccessPill label={cta.label} to={cta.to} onActivate={open} />
      <Ballot open={asking} onClose={close} />
    </>
  )
}
