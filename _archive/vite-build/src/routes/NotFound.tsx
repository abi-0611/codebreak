import { Link } from 'react-router-dom'
import { pages } from '@/content/site'

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-[var(--gutter)] text-center">
      <div>
        <h1 className="font-[family-name:var(--face-display)] text-5xl leading-tight">
          {pages.notFound.title}
        </h1>
        <p className="mt-4 text-[color:var(--tone-muted)]">{pages.notFound.intro}</p>
        <Link
          to={pages.notFound.action.to}
          className="mt-8 inline-block border-b border-[color:var(--tone-accent)] pb-1 text-sm uppercase tracking-[0.18em]"
        >
          {pages.notFound.action.label}
        </Link>
      </div>
    </main>
  )
}
