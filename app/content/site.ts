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

/**
 * The one address the house publishes.
 *
 * It is declared here rather than written into each call site because it is a
 * real destination that appears in the footer, in the menu and beside two of
 * the home page's copy blocks. A house that prints its own address four ways
 * has three addresses that are wrong.
 */
export const mailbox = 'ledger@crocaria.example'

export const site = {
  name: 'CROCARIA',
  founded: 1904,
  place: 'Consuegra',
  tagline: 'Grown, graded, sealed.',
  home: '/',

  /** The persistent CTA. A register, not a checkout — see CLAUDE.md. */
  cta: 'Open Ledger',

  /**
   * Where that CTA goes.
   *
   * It pointed at `/` while the register was seven rows on the home page.
   * Phase 7 built the full one, and a pill labelled "Open Ledger" that opens
   * the front door instead is the kind of small dishonesty a reader notices
   * without being able to say why. Declared here rather than at the four call
   * sites — the header, the menu, the footer and the hero — because a house
   * whose CTA points four ways has three that are wrong.
   */
  register: '/ledger',

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
  { label: 'Dispatches', to: '/dispatches', live: true },
  { label: 'FAQ', to: '/faq', live: true },
  { label: 'The Ledger', to: '/ledger', live: true },
  { label: 'The House', to: '/house', live: true },
]

/**
 * The menu overlay's rows — teardown §8.3, task 7.9: the header's four, plus
 * Roles.
 *
 * Roles is in the overlay and not in the header for the same reason it is in
 * the footer and not in the header: it is a real page the house publishes and
 * a page nobody arrives looking for. Four rows is what the header measures at;
 * the overlay has the room.
 */
export const menu: Link[] = [...nav, { label: 'Roles', to: '/roles', live: true }]

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
  { label: 'The Ledger', to: '/ledger', live: true },
  { label: 'Dispatches', to: '/dispatches', live: true },
  { label: 'FAQ', to: '/faq', live: true },
  { label: 'The House', to: '/house', live: true },
  { label: 'Roles', to: '/roles', live: true },
]

/**
 * The house channels. Bordered square tiles in the menu, bare glyphs in the
 * footer.
 *
 * These are ours, not the reference's — its partner marks and outbound links
 * are never reproduced. All four are genuinely live and all four go somewhere
 * different: a mailbox, the fields themselves on a public map, the journal and
 * the register. Two tiles pointing at one route is one tile and a decoration.
 */
export const channels: Array<Link & { glyph: 'mail' | 'pin' | 'note' | 'feed' }> = [
  { label: 'Dispatch', glyph: 'mail', href: `mailto:${mailbox}`, live: true },
  {
    label: 'Consuegra',
    glyph: 'pin',
    href: 'https://www.openstreetmap.org/?mlat=39.4614&mlon=-3.6086#map=13/39.4614/-3.6086',
    live: true,
  },
  { label: 'Journal', glyph: 'note', to: '/dispatches', live: true },
  { label: 'Wire', glyph: 'feed', to: '/ledger', live: true },
]

/** Footer legal row. Roboto Mono uppercase, set in the lifted brown. */
export const legal: Link[] = [
  { label: 'Privacy', to: '/privacy', live: true },
  { label: 'Terms', to: '/terms', live: true },
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
  { label: 'Total yield', value: 4180, unit: 'kg' },
  { label: 'Total bonded', value: 612, unit: 'lots' },
  { label: 'Total lots', value: 1284 },
] as const

/** Everything that can be reached right now. */
export const live = <T extends Link>(list: T[]) => list.filter((item) => item.live)
