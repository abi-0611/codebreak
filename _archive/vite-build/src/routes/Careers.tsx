import { pages } from '@/content/site'

export default function Careers() {
  return (
    <main className="mx-auto max-w-[var(--measure)] px-[var(--gutter)] py-32">
      <h1 className="font-[family-name:var(--face-display)] text-5xl leading-tight">
        {pages.careers.title}
      </h1>
      <p className="mt-4 text-[color:var(--tone-muted)]">{pages.careers.intro}</p>
    </main>
  )
}
