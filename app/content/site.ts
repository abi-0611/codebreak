/**
 * House constants and every site-level string.
 *
 * Every user-visible word on the site starts life in app/content/ and arrives
 * at a component as a prop — never inline in a template. Sections are
 * presentational; this file is where the house actually speaks.
 *
 * Voice: understated, technical, a little severe. Short declaratives. Trade
 * language, not marketing language. Numbers over adjectives. A house that has
 * been doing this for 120 years and does not need to convince you.
 */

/**
 * `live` marks a destination that exists in the build TODAY.
 *
 * Rule 8: the site must actually work — no dead links, no href="#". Nitro
 * prerenders with `crawlLinks: true` and `failOnError: true`, so a header
 * linking to a route that phase 7 has not built yet does not merely look
 * broken, it fails the build. Phases 6 and 7 flip these to true as they land
 * each route; nothing else has to change.
 */
export type Link = {
  label: string
  to?: string
  href?: string
  live: boolean
}

export const site = {
  name: 'CROCARIA',
  founded: 1904,
  place: 'Consuegra',
  tagline: 'Grown, graded, sealed.',
  home: '/',

  /** The persistent CTA. A register, not a checkout — see CLAUDE.md. */
  cta: 'Open Ledger',

  /** Footer and menu description. */
  blurb:
    'A heritage saffron house at Consuegra, working the same fields since 1904. ' +
    'Cultivation, grading, assay, provenance and bonded warehousing. ' +
    'We sell lots, not sachets.',
} as const

/**
 * Primary navigation. Roboto Mono 500, uppercase, in the header and again as
 * hairline-divided rows in the menu overlay.
 */
export const nav: Link[] = [
  { label: 'Ledger', to: '/', live: true },
  { label: 'Media', to: '/media', live: false },
  { label: 'Provenance', to: '/brand', live: false },
  { label: 'FAQ', to: '/faq', live: false },
]

/**
 * The house directory — every route the house publishes, as the footer's MENU
 * disclosure lists them. A superset of `nav`: the header carries four, the
 * footer carries the lot.
 *
 * `Roles` is here because it has to be. It is a real careers page and it is the
 * one route off the home page that a reader has to decide is worth opening, so
 * a house that does not list it in its own footer has no careers page at all —
 * rule 8. Phase 7 builds it and flips the flag.
 */
export const directory: Link[] = [
  { label: 'Ledger', to: '/', live: true },
  { label: 'Media', to: '/media', live: false },
  { label: 'Provenance', to: '/brand', live: false },
  { label: 'FAQ', to: '/faq', live: false },
  { label: 'Roles', to: '/roles', live: false },
]

/**
 * The house channels. Bordered square tiles in the menu, bare glyphs in the
 * footer.
 *
 * These are ours, not the reference's — its partner marks and outbound links
 * are never reproduced. The two that are live are genuinely live: a mailbox
 * and the fields themselves on a public map.
 */
export const channels: Array<Link & { glyph: 'mail' | 'pin' | 'note' | 'feed' }> = [
  { label: 'Dispatch', glyph: 'mail', href: 'mailto:ledger@crocaria.example', live: true },
  {
    label: 'Consuegra',
    glyph: 'pin',
    href: 'https://www.openstreetmap.org/?mlat=39.4614&mlon=-3.6086#map=13/39.4614/-3.6086',
    live: true,
  },
  { label: 'Journal', glyph: 'note', to: '/media', live: false },
  { label: 'Wire', glyph: 'feed', to: '/media', live: false },
]

/** Footer legal row. Roboto Mono uppercase, set in the lifted brown. */
export const legal: Link[] = [
  { label: 'Privacy', to: '/privacy', live: false },
  { label: 'Terms', to: '/terms', live: false },
]

export const credits = {
  copyright: `© ${site.founded}–2026 Crocaria S.L.`,
  house: 'Consuegra, Toledo · Registered lot house no. 0417',
} as const

/**
 * The house figures. They count up once, on enter, and never again.
 *
 * Every one is a whole number that means something to a buyer. A figure that
 * has to be explained is an adjective wearing a number's clothes.
 */
export const figures = [
  { label: 'Lots sealed', value: 1284 },
  { label: 'Estates bonded', value: 19 },
  { label: 'Seasons on record', value: 121 },
] as const

/** Everything that can be reached right now. */
export const live = <T extends Link>(list: T[]) => list.filter((item) => item.live)
