/**
 * Route metadata — phase 7, task 7.10.
 *
 * One call per route, so every page carries a real title, a real description,
 * a canonical link, Open Graph tags and a share card. Written once here rather
 * than eight times in eight pages, because eight hand-written sets is seven
 * chances to leave a route with the site-wide default title — and the route
 * that gets it is always the one somebody shares.
 *
 * NOTHING HERE MAY CARRY A BANNED TOKEN. `npm run audit:names` scans the built
 * html, head included, so a description that reached for an ordinary English
 * word with a term inside it fails the build rather than shipping. The
 * substring-trap table in CLAUDE.md is the list to read before writing one.
 *
 * The share card is `panel-01`, drawn by scripts/plates.mjs. Its dimensions
 * come from the generated manifest rather than being typed here, for the same
 * reason <Plate/> reads its own: a number somebody typed is true until the
 * image is re-encoded, and then it is wrong with nothing reporting it.
 */
import { plates } from '~/content/plates'
import { site } from '~/content/site'

export type PageMeta = {
  /** The route's own name. The house name is appended, never written in. */
  title: string
  /** One or two sentences. Real, in the house voice, no keyword stuffing. */
  describe: string
  /** The route this describes, leading slash, no trailing one. */
  path: string
}

const CARD = plates['panel-01']

/**
 * The absolute origin, if the build knows one.
 *
 * Open Graph asks for absolute URLs. When nothing has told the build where it
 * will live — which is every local run, and every run before phase 9 picks a
 * host — a root-relative image path is emitted instead and `og:url` is left
 * off entirely. Every scraper worth the name resolves a relative `og:image`
 * against the page it found it on; a confidently absolute `http://localhost`
 * resolves for nobody. Setting NUXT_PUBLIC_ORIGIN upgrades both.
 */
function origin() {
  const value = useRuntimeConfig().public.origin
  return typeof value === 'string' && value ? value.replace(/\/+$/, '') : ''
}

export function usePageHead(page: PageMeta) {
  const at = origin()
  const url = at ? `${at}${page.path === '/' ? '' : page.path}` : ''
  const card = `${at}${CARD.src}`

  const title = page.path === '/' ? `${site.name} — ${site.tagline}` : `${page.title} — ${site.name}`

  useHead({
    title,
    link: url ? [{ rel: 'canonical', href: url }] : [],
    meta: [
      { name: 'description', content: page.describe },

      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: site.name },
      { property: 'og:locale', content: 'en_GB' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: page.describe },
      { property: 'og:image', content: card },
      { property: 'og:image:width', content: String(CARD.w) },
      { property: 'og:image:height', content: String(CARD.h) },
      // The card is the house mark and the house name. It says what it is;
      // nothing on it exists only here.
      { property: 'og:image:alt', content: `${site.name} — ${site.tagline}` },
      ...(url ? [{ property: 'og:url', content: url }] : []),

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: page.describe },
      { name: 'twitter:image', content: card },
    ],
  })
}
