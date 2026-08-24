/**
 * The home page, in words — phase 6.
 *
 * Every user-visible string on `/` starts here and arrives at a component as a
 * prop. Sections are presentational; this file is where the house speaks.
 *
 * Voice: understated, technical, a little severe. Short declaratives. Trade
 * language, not marketing language. Numbers over adjectives. A house that has
 * been doing this for a hundred and twenty years and does not need to convince
 * anybody.
 *
 * TWO CONSTRAINTS GOVERN THE WORDING, and both are invisible until they are
 * broken:
 *
 * 1. The trade vocabulary that overlaps with computing vocabulary — the words
 *    a reader can find with Ctrl+F and burn real time on — belongs to sections
 *    1, 3 and 8 and to no others. `_private/decoys.json` is the register of
 *    which word sits in which section, and the rule it enforces is that none
 *    of them may share a section with a marked surface. A hit that lands a
 *    reader in the right region hands them the region for free.
 *
 * 2. Nothing here may spell a marked string as ordinary text. That is checked
 *    by machine against the BUILT html: `npm run audit:register` strips the
 *    tags and matches plain lowercase substrings over what is left, which is
 *    what find-in-page actually does. Ordinary English is where it bites: the
 *    everyday word for a warehouse and the everyday word for a block of prose
 *    each carry a marked string inside them, which is why the house says
 *    `bonded warehousing` and `copy block` instead. This comment cannot spell
 *    either of them out — the source audit reads comments too, and would trip
 *    on the example. CLAUDE.md's substring-trap table lists them; read it
 *    before editing a line of this file.
 */
import { art } from '~/content/media'
import { recent } from '~/content/dispatches'
import { heads, lots, row } from '~/content/lots'
import { mailbox, site, type Link } from '~/content/site'

/* -------------------------------------------------------------------------- */
/* 0 — the rail — phase 11 §11.4                                              */
/* -------------------------------------------------------------------------- */

/**
 * The fixed left rail's eight stops.
 *
 * IT LIVES HERE AND NOT IN site.ts, which is what §11.4 suggests, for the
 * reason site.ts states about itself: it holds "house constants and every
 * site-level string". These eight are the HOME page's sections and appear on
 * no other route, so filing them as site-level would make that description a
 * lie and would invite the next phase to reach for them from a page that has
 * none of these sections. The instruction that matters — check every label
 * against the naming ban before writing it, not after — is honoured either
 * way, and `npm run audit:names` keeps honouring it.
 *
 * `id` IS THE ANCHOR AND THE LABEL IS THE LABEL, in one record, because the
 * rail is navigation (rule 8) and navigation that points at an anchor nobody
 * put on a section is a dead link that renders perfectly. <Rail/> resolves
 * every id at mount and refuses to render an item it cannot find, so a section
 * renamed without its stop renamed fails loudly in development instead of
 * quietly doing nothing in production.
 *
 * EIGHT, and which eight is a decision rather than an accident. §11.3 walks
 * the page as hero → closing panel → token → ledger → assay → reel →
 * governance → dispatches, and adds questions/tiles/footer as sections the
 * capture never reaches. The hero itself is not a stop: §11.1 measures the
 * rail as absent for every hero dwell without exception, so an item for it
 * could never be the current one and would be a permanently dead row. The
 * closing panel takes its place as stop one, which is exactly where the rail
 * arrives.
 *
 * The link tiles are not a stop either. They are a way OUT of the page rather
 * than a part of it, and a rail that offers to scroll you to a set of links
 * is furniture pointing at furniture.
 */
export const spine = [
  { id: 'register', label: 'The Register' },
  { id: 'medallion', label: 'The Medallion' },
  { id: 'ledger', label: 'The Ledger' },
  { id: 'assay', label: 'Assay' },
  { id: 'season', label: 'The Season' },
  { id: 'guild', label: 'The Guild' },
  { id: 'dispatches', label: 'Dispatches' },
  { id: 'questions', label: 'Questions' },
] as const

/** Names the rail for assistive technology. It is a second nav on the page —
 *  the header is the first — so it has to say which one it is. */
export const spineLabel = 'Sections of this page'

/* -------------------------------------------------------------------------- */
/* 1 — the hero                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The sub-headline is rendered TWICE and toggled by breakpoint — top-left on a
 * desktop, under the h1 on a phone. That is what the measured markup does, and
 * it is not an oversight to tidy away: the two positions sit in different
 * stacking contexts, so one node cannot occupy both.
 */
export const hero = {
  title: 'The Red Harvest',
  sub: 'Provenance for every thread.',
  cta: site.cta,
  /** The GL backdrop's accessible name, and its static frame's. */
  describe: 'Dark stone cut through with lit saffron veining.',
  /**
   * The plate the hero closes on.
   *
   * It is part of the HERO, not a twelfth section — which is also what the
   * reference does: its equivalent panel sits inside the hero block rather
   * than after it, and teardown §7's inventory is unchanged by it. The
   * backdrop contracts into this frame as the reader arrives at it, so the
   * line below is read on the same stone the headline was read on.
   */
  close: {
    heading: 'One harvest, one register',
    body: 'Every thread the house sells is cut from a block, weighed on a bench and entered against a lot number the same day. Nothing leaves Consuegra unrecorded.',
  },
} as const

/**
 * The two-cell panel that closes the hero — teardown §8.7, phase 11 §11.3.2.
 *
 * TWO WAYS THE HOUSE PRICES A LOT, and nothing else. §11.3.2 is explicit that
 * this is a register rather than a checkout: there is no cart, no plan, no
 * tier, and none of the vocabulary a two-cell bar on a finance site would be
 * carrying. A buyer either takes the bench figure struck at intake or waits and
 * takes the settled rate on the day they call the lot forward. That is a real
 * choice a real trade makes, and it is the only thing these two cells are.
 *
 * WHICH SIDE CARRIES THE SEASON is the line that makes the pair mean something.
 * At the bench the buyer does; at the call the house does. Two sentences that
 * are the same shape and opposite, which is how a trade states a term.
 *
 * ON THE WORDS. This is section 1, which carries no term and carries THREAD as
 * a copy decoy. Two constraints therefore bind every line below and both are
 * invisible until broken:
 *
 *   · nothing here may spell one of the six as ordinary text — checked by
 *     machine against the BUILT html by `npm run audit:register`;
 *   · nothing here may accidentally be a decoy. The register in
 *     `_private/decoys.json` says which trade word sits in which section, and
 *     an unlisted occurrence of one is a hit that leads somewhere nobody
 *     decided it should. So: no index, port, stack, hash, kernel, lambda,
 *     vector, node, cache, cluster, buffer, query — and emphatically no token,
 *     which is the obvious word for a struck disc and is spoken for.
 */
export const priced = {
  label: 'How a lot is priced',
  heading: 'Two ways to take a lot',
  describe: 'A struck blank coming apart into two sealed discs.',
  cells: [
    {
      label: 'At the bench',
      body:
        'The lot is priced the day it is struck, against the colour-strength ' +
        'reading taken at intake. The figure is printed on the certificate and ' +
        'it does not move afterwards. A buyer who takes a lot at the bench ' +
        'carries the season.',
    },
    {
      label: 'At the call',
      body:
        'The lot stays under bond and is priced on the day the buyer calls it ' +
        'forward, against the settled rate for its grade. Warehousing is ' +
        'charged by the month until then. A buyer who waits leaves the season ' +
        'with the house.',
    },
  ],
} as const

/**
 * The partner strip. Our estates, not the reference's partner marks — those
 * belong to a real company and are never reproduced.
 *
 * Six cells, divided by vertical hairlines, running as an endless ticker. They
 * are set in the mono face rather than drawn as geometry, because six drawn
 * lockups is tens of kilobytes to say what six labels already say.
 */
export const estates = [
  'Valdehierro',
  'La Sierpe',
  'El Romeral',
  'Casa Tembleque',
  'Madridejos Alta',
  'Cerro Calderico',
] as const

export const estatesLabel = 'Estates bonded to the house'

/* -------------------------------------------------------------------------- */
/* 2 — the house medallion                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The struck disc, resting face-on over the middle of the section's crossing.
 * The rim is legible at rest, and that is a requirement rather than a
 * flourish: the band is the reason this section is built the way it is.
 *
 * No word from the decoy register appears in this copy. Section 2 is a marked
 * section.
 */
export const medallion = {
  heading: 'The House Medallion',
  body: [
    'Every estate that sells under the house mark is struck a medallion at the ' +
      'registry. The die was cut in 1904 and has not been recut since.',
    'A lot leaves Consuegra with its estate medallion number on the certificate. ' +
      'The number is what a buyer checks; the label is decoration. One hundred ' +
      'and twenty years of that chain is on file at the house, unbroken, and ' +
      'any link in it can be pulled on the day it is asked for.',
  ],
  /** Two rows, mono uppercase, hairline-divided. Not the hero's counting box. */
  figures: [
    { label: 'Registered estates', value: '19' },
    { label: 'Lots in circulation', value: '612' },
  ],
  /**
   * The split's pill — §11.3.3 puts one under the copy in the left column.
   *
   * It points at the register rather than at the house, because the sentence
   * above it says what a buyer actually does with a medallion number: "The
   * number is what a buyer checks." A pill that repeats the guild's two links
   * to /house would be a third way to say the same thing on one page.
   */
  action: { label: 'Check a number', to: '/ledger', live: true } as Link,
  describe: 'A struck house medallion, resting face-on.',
} as const

/* -------------------------------------------------------------------------- */
/* 3 — the lot ledger                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Seven open lots. The trade vocabulary a reader can find with Ctrl+F is
 * concentrated here and in section 8, and every one of these words is doing an
 * honest job: the crocin index is the real pigment-strength measure a lot is
 * graded on, a port of entry is a real column on a real manifest, and kernel,
 * lambda and cluster are the house's own grade nomenclature.
 */
export const ledgerHeads = heads

/**
 * Seven of the twenty-one on the register. The lots themselves live in
 * app/content/lots.ts, because `/ledger` lays out all of them and a buyer who
 * checked a number against two lists would eventually find them disagreeing.
 *
 * `row` is the same function on both routes, so the seven here and the
 * twenty-one there cannot be laid out differently.
 */
export const ledgerRows = lots.slice(0, 7).map(row)

export const ledger = {
  label: 'Open lots, current season',
  heading: 'Every lot, traced to its furrow',
  lede: 'Seven of the twenty-one lots open this week. The rest are on the ledger.',
  body:
    'A lot enters the ledger when the bench figure is struck and leaves it when ' +
    'a buyer calls it forward. Origin is the estate; the block it was cut from ' +
    'is on the certificate and on the full register. The crocin index is the ' +
    'bench reading taken at intake, printed on the certificate and never ' +
    'rounded up. Reserve is what the house holds back against a customs query.',
  /**
   * Seven rows here; the whole register is /ledger, which phase 7 built. The
   * pill was a mailto to the ledger desk while that route did not exist, and
   * it stops being one the moment it does — a house that asks you to write in
   * for a table it publishes is a house that has not read its own site.
   */
  action: { label: 'The full ledger', to: '/ledger', live: true } as Link,
  /**
   * The colonnade behind the table — §11.3.4's backdrop, and GL scene 5.
   *
   * It names the PLACE, not the effect. The bonded floor at Consuegra is where
   * the lots in this table physically are, so the picture under them is the
   * building they sit in rather than a texture chosen to look deep.
   */
  describe: 'A vaulted bonded floor receding to a lit doorway.',
} as const

/* -------------------------------------------------------------------------- */
/* 4 — assay and certification                                                */
/* -------------------------------------------------------------------------- */

/**
 * The first ground change on the page, and the seal is the object it is built
 * around. It renders at 26rem — 260 design px, which is 260 real pixels at a
 * 375px viewport, because the rem engine puts one design pixel on one CSS
 * pixel exactly there. Phase 5 measured the band against that width; below it
 * the ring stops being readable and rule 4 fails. The number is a contract,
 * not taste.
 */
export const assay = {
  heading: 'Assay and certification',
  lede: 'A hundred and twenty years of assay, on one bench, to one standard.',
  body:
    'Every lot is read for colour strength, crocin and safranal before it is ' +
    'sealed. The bench figure binds: it is printed on the certificate, struck ' +
    'on the tin, and entered against the lot the same day. Custody is unbroken ' +
    'from the intake scale to the bonded floor, and every hand a lot passes ' +
    'through leaves its mark on the seal.',
  action: { label: 'Request a certificate', href: `mailto:${mailbox}`, live: true } as Link,
  describe: 'The house assay seal.',

  /**
   * The auditor strip — §11.3.5.
   *
   * A row of marks in one hairline-ruled band, under the seal. It is live-only
   * on the reference and absent from teardown §7's 721px measurement of this
   * section, so this section is now TALLER than §7 says and that is correct.
   * Do not trim it back to the number.
   *
   * THESE ARE OURS. The reference's partner logos belong to a real company and
   * are never reproduced — CLAUDE.md's "Do not" list. Four bodies a bonded
   * saffron house would actually be audited by, set as mono labels rather than
   * drawn as marks, because four drawn lockups is tens of kilobytes to say what
   * four labels already say.
   *
   * SECTION 4 CARRIES A TERM, so no word here may be one of the decoys in
   * `_private/decoys.json` — a find-in-page hit that lands a team in this
   * section would hand them the region for free. Checked, one word at a time,
   * before these were written.
   */
  auditLabel: 'Bodies the house is audited by',
  auditors: [
    'Toledo Customs',
    'Guild Assay Board',
    'Chamber of Consuegra',
    'Bonded Floor No. 3',
  ],
} as const

/* -------------------------------------------------------------------------- */
/* 5 — the season                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Four steps of one season, pinned. Every step is the bench with that day's
 * paperwork lying on it, and the paperwork is drawn into the photograph by one
 * function called four times — same stock, same rake, same fall of light. A
 * step with paperwork is native; a step that ALONE had paperwork would be a
 * neighbourhood tell.
 *
 * Rule 5 is the whole risk here. The step index is discrete, with a dead-band
 * on each boundary, so a step is fully opaque for its entire range and
 * scrolling back up returns to it cleanly. Under reduced motion there is no
 * pin at all and the four become four stacked blocks — same DOM, different
 * rules, every step legible.
 */
export const season = {
  label: 'The season, in four steps',
  stages: [
    {
      tag: 'One · June',
      title: 'The corms go in',
      body:
        'Valdehierro is turned, limed and left to settle. Corms are set at ' +
        'fifteen centimetres on a metre bed, and the block is not walked again ' +
        'until the first flowers show.',
      plate: art('frame-11', 'Turned ground at Valdehierro, early summer.'),
    },
    {
      tag: 'Two · Late October',
      title: 'Eleven days of flowering',
      body:
        'Picking starts before light and stops when the flower opens. The whole ' +
        'rose is taken and stripped the same morning, sitting, indoors, within ' +
        'the day.',
      plate: art('frame-12', 'A field walked before dawn at the end of October.'),
    },
    {
      tag: 'Three · The same week',
      title: 'The lot is struck',
      body:
        'Cured over low heat, weighed, and read at the bench. A number, a grade ' +
        'and a date go on one certificate, and the certificate is sealed and ' +
        'entered in the register the same hour.',
      plate: art('frame-13', 'Cured stigmas on the grading bench, the day’s certificate beside them.'),
    },
    {
      tag: 'Four · November',
      title: 'Under bond',
      body:
        'The lot goes to the bonded floor at Consuegra and does not move again ' +
        'until a buyer calls it forward. Warehousing is charged by the month ' +
        'and by the tin.',
      plate: art('frame-14', 'The bonded floor at Consuegra, a sealed tin on its docket.'),
    },
  ],
} as const

/* -------------------------------------------------------------------------- */
/* 6 — held by the guild                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The three service marks are drawn as geometry, all three by one generator
 * run, at one cap height, on one shared band. Widths differ; nothing else
 * does. DO NOT HAND-TUNE ONE OF THEM — a member of a set that differs is the
 * member everybody looks at.
 *
 * The notes beneath them are ordinary type, and none of them names the mark it
 * sits under. That is what leaves the drawn line carrying the whole label.
 */
export const guild = {
  heading: 'Held by the Guild',
  body:
    'The house is not owned. It is held by forty-one estate families, one vote ' +
    'each and no second vote. Charter decisions — a grade renamed, a bench ' +
    'figure revised, an estate admitted or struck off — carry only on a vote ' +
    'of the guild. The roll of families is open at Consuegra and has been ' +
    'amended eleven times since 1904.',
  actions: [
    { label: 'The Guild', to: '/house', live: true },
    { label: 'Charter', to: '/house', live: true },
  ] as Link[],
  /** One note per drawn mark, in the order the generator laid them. */
  notes: [
    'Held under customs bond at Consuegra until the buyer calls the lot forward.',
    'Moved under the house seal, at the house’s own risk, inside seventy-two hours.',
    'Every lot is read back against a block, a bench and a date.',
  ],
  describe: 'The house mark, struck and extruded.',
} as const

/* -------------------------------------------------------------------------- */
/* 7 — crocaria dispatches                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The ornamental plate is a specimen engraving with six labelled details, laid
 * by one function called six times: one rule weight, one letter height, one
 * leader angle family.
 *
 * It must not be the most luminous object in its frame. Phase 5 grades it down
 * for exactly that reason, and phase 8 checks it by eye — there is no number
 * for "reads only when looked at".
 */
export const dispatches = {
  heading: 'Crocaria dispatches',
  body:
    'The house prints what it learns. Season notes, bench readings and the ' +
    'occasional argument about grade, set down as they happen and kept on file ' +
    'at Consuegra.',
  plate: art('plate-06', 'A specimen engraving of the saffron crocus.'),
  label: 'Crocaria dispatches',
  /**
   * Six of the twelve on file. The register itself lives in
   * app/content/dispatches.ts, because phase 7's route lays out all of it and
   * two lists of the same notes is two lists to keep in step.
   */
  cards: recent,
  /** Phase 7 built the route; the rail now ends somewhere. */
  action: { label: 'All dispatches', to: '/dispatches', live: true } as Link,
} as const

/* -------------------------------------------------------------------------- */
/* 8 — questions                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Set on three lines, centred, in the display face — the reference's rhythm,
 * and the reason the heading is an array rather than a string.
 *
 * The first row opens by default, exactly as the reference does. It is what
 * teaches the control's behaviour without a word of instruction.
 */
export const questions = {
  heading: ['Questions', 'the trade', 'asks'],
  rows: [
    {
      question: 'What travels with a sealed lot?',
      body:
        'One seal covers four documents: the estate note, the assay sheet, the ' +
        'moisture reading taken at intake, and the bonded warehousing record. ' +
        'Break the seal and the lot is graded again before it moves.',
    },
    {
      question: 'How is a grade decided?',
      body:
        'By hand, then by instrument. Threads are sorted for style length and ' +
        'for the ratio of red to yellow, and the sorter scores a hash mark on ' +
        'the tray for every one put back. A sample then goes to the bench for ' +
        'colour strength, crocin and safranal. The bench figure is the one ' +
        'printed on the certificate; the sorter has the last word on style.',
    },
    {
      question: 'Where is a lot held between seasons?',
      body:
        'On the bonded floor at Consuegra — Node House No. 3, twelve degrees, ' +
        'unlit, under customs bond. Warehousing is charged by the month and by ' +
        'the tin, and the house does not hold a lot it has not graded.',
    },
    {
      question: 'Do you sell below a kilogram?',
      body:
        'No. The house sells lots. The smallest lot on the ledger is four ' +
        'kilograms net and it is sold whole.',
    },
    {
      question: 'How long does a lot hold?',
      body:
        'Sealed, unlit, at a steady twelve degrees, a lot holds its colour ' +
        'strength for thirty months. The intake date is struck on every tin, so ' +
        'a buyer is never estimating.',
    },
  ],
  /** Five here, twenty-five on /faq, grouped by desk. */
  action: { label: 'View all', to: '/faq', live: true } as Link,
} as const

/* -------------------------------------------------------------------------- */
/* 9 — the link tiles                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Four destinations, one ruled plate. A tile with no route renders as a plain
 * cell rather than as a link — rule 8, no dead href — and phase 7 gives each
 * of these somewhere to go by flipping its flag.
 */
export const tilesLabel = 'House sections'

export const tiles = [
  { label: 'The house', to: '/house', live: true, plate: art('tile-01', '') },
  { label: 'Dispatches', to: '/dispatches', live: true, plate: art('tile-02', '') },
  { label: 'The ledger', to: '/ledger', live: true, plate: art('tile-03', '') },
  { label: 'Roles', to: '/roles', live: true, plate: art('tile-04', '') },
] as const

/* -------------------------------------------------------------------------- */
/* 10 — the footer                                                            */
/* -------------------------------------------------------------------------- */

/**
 * One disclosure, labelled MENU, sitting between two hairlines — teardown
 * §8.9. Its panel lists the house directory, and it lists what is actually
 * built: a menu offering a route that renders a 404 is worse than a menu that
 * is short. Phase 7 lands the rest of the routes and the panel fills itself.
 */
export const footerRows = [{ question: 'Menu', body: '' }] as const

/* -------------------------------------------------------------------------- */
/* head                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Route metadata — task 7.10. `usePageHead` special-cases `/` so the title
 * stays the house name and the tagline rather than becoming "Home — CROCARIA".
 */
export const homeMeta = {
  title: site.name,
  describe:
    `${site.name}. A heritage saffron house at Consuegra, est. 1904. ` +
    'Cultivation, grading, assay and provenance for every thread.',
  path: '/',
} as const
