import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import SmoothScroll from '@/components/layout/SmoothScroll'
import { glide } from '@/lib/anchor'
import ScrollProgress from '@/components/layout/ScrollProgress'
import Shell from '@/components/layout/Shell'
import { ScrollTrigger, useLayoutWatch } from '@/lib/motion'
import Home from '@/routes/Home'
import Careers from '@/routes/Careers'
import RouteDetail from '@/routes/RouteDetail'
import JournalEntry from '@/routes/JournalEntry'
import Legal from '@/routes/Legal'
import Ops from '@/routes/Ops'
import NotFound from '@/routes/NotFound'
import Specimen from '@/routes/Specimen'

/**
 * A new page starts at the top. A link carrying a hash moves to that section
 * instead — through Lenis, so an in-page jump travels the same way a scroll
 * does rather than teleporting.
 *
 * `key` is in the dependency list on purpose: it changes on every navigation,
 * including one to the hash the page is already showing, so tapping the same
 * nav item twice moves you there both times.
 *
 * ScrollTrigger is refreshed before the move because two scenes are pinned,
 * and a pin-spacer that has not been measured yet puts every section below it
 * at the wrong offset — which is the difference between landing on a section
 * and landing a viewport short of it.
 */
function Wayfinding() {
  const { pathname, hash, key } = useLocation()

  // Keep every trigger honest as the document grows under them.
  useLayoutWatch()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }

    const target = document.querySelector<HTMLElement>(hash)
    if (!target) return

    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      glide(target)
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, key])

  return null
}

function Chrome() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <Wayfinding />
        <ScrollProgress />
        <Routes>
          <Route element={<Chrome />}>
            <Route path="/" element={<Home />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/routes/:ref" element={<RouteDetail />} />
            <Route path="/journal/:slug" element={<JournalEntry />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/ops" element={<Ops />} />
            {/* Design-system specimen. Development only — it documents the
                whole system in one page, which is not something a public site
                should hand out. Rollup drops it from the production bundle. */}
            {import.meta.env.DEV ? <Route path="/style" element={<Specimen />} /> : null}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SmoothScroll>
    </BrowserRouter>
  )
}
