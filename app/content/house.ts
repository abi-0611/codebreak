/**
 * `/house` — the identity, the charter and the files that go with them.
 * Phase 7, route 3, standing in for the reference's `/brand`.
 *
 * Three things happen on this page: the house says what it is and who holds
 * it, it shows the mark and the wordmark at a size worth looking at, and it
 * hands both over as real archives. The last of those is rule 8 — a download
 * link that 404s is the fastest way for a reader to decide the site is a prop.
 * scripts/kit.mjs writes the archives and app/content/kit.ts records what each
 * one actually weighs, so the labels here are measurements.
 *
 * Two of the registered decoys live on this route, both native to it: a
 * tincture in the arms, and the small lead seal that travels with a lot whose
 * main seal has been broken. `/house` carries nothing itself, so a reader who
 * finds either of them with Ctrl+F has found a page about heraldry.
 */
import { art } from '~/content/media'
import { kit, weigh, type BundleKey } from '~/content/kit'
import { mailbox, site } from '~/content/site'

export type Download = {
  readonly key: BundleKey
  readonly title: string
  readonly body: string
  readonly action: string
}

/**
 * The three archives, in the order the page lays them out.
 *
 * One set, one card function called three times — the size label, the pill and
 * the file list all come off `kit` rather than being written per card. A card
 * that stated its own weight would be right until the next time the archive
 * was rebuilt.
 */
export const downloads: readonly Download[] = [
  {
    key: 'mark',
    title: 'The house mark',
    body:
      'The heraldic crocus device, as vector geometry and as raster at two ' +
      'sizes, with the terms of use. Cream on black; never on a ground lighter ' +
      'than the darkest brown.',
    action: 'Take the mark',
  },
  {
    key: 'wordmark',
    title: 'The wordmark',
    body:
      'CROCARIA set in the house face and converted to outlines, plus the ' +
      'three-letter form the cards use. No font is needed to set it and none ' +
      'is included.',
    action: 'Take the wordmark',
  },
  {
    key: 'house',
    title: 'The whole kit',
    body:
      'Both marks, every size, the measured palette and the terms of use in ' +
      'one file. This is the one to take if you are setting the house in ' +
      'print and would rather not come back.',
    action: 'Take everything',
  },
]

/** A download card's file-size label — a measurement, never a typed number. */
export const sizeOf = (key: BundleKey) => weigh(kit[key].bytes)

export const housePage = {
  title: 'The House',
  lede:
    'Crocaria is not owned. It is held by forty-one estate families under a ' +
    'charter signed at Consuegra in 1904, and it has been amended eleven times ' +
    'since.',

  /** The long copy under the band. Two blocks, no headings between them. */
  body: [
    'The house was founded to do one thing the estates could not do alone: ' +
    'read a lot to one standard and stand behind the reading. Nineteen estates ' +
    'sell under the mark today. Each holds one vote on the guild, and no ' +
    'family holds two, whatever it grows.',
    'Charter decisions carry only on a vote — a grade renamed, a bench figure ' +
    'revised, an estate admitted or struck off. Two estates have been struck ' +
    'off in a hundred and twenty-one years and one of those has been ' +
    'readmitted. The roll is open at Consuegra to anyone who asks for it.',
  ],

  figures: [
    { label: 'Estate families', value: '41' },
    { label: 'Estates under the mark', value: '19' },
    { label: 'Charter amendments', value: '11' },
  ],

  /**
   * The arms. Written as a blazon because that is how arms are written, and
   * because a house that describes its own arms in marketing language does not
   * have arms, it has a logo.
   */
  arms: {
    heading: 'The arms',
    blazon: 'Azure, a corm or, issuant therefrom three stigmas gules.',
    body:
      'Granted with the charter and unchanged since. Azure for the plain under ' +
      'frost, gold for the corm, red for what is cut off it. The device on this ' +
      'site is the charge alone, lifted off the field and struck in cream — ' +
      'which is how it appears on every tin, every seal and every certificate ' +
      'the house has issued.',
    plate: art('tile-02', ''),
  },

  /**
   * The seals. The section the token seal is native to — a real thing a bonded
   * house keeps a drawer of, and a real reason a buyer would ask.
   */
  seals: {
    heading: 'The seals',
    body: [
      'Every lot leaves Consuegra under a struck lead seal carrying the mark, ' +
      'the lot number and the year. The die was cut by a Toledo engraver in ' +
      '1904 and has not been recut. It is kept in the die room and is drawn ' +
      'against the register.',
      'Where a seal has to be broken in transit — a customs query, a damaged ' +
      'crate — the lot travels on with a token seal and a signed note from ' +
      'whoever broke it. A token seal is not a house seal and does not claim ' +
      'to be one: it says the lot was opened, by whom, and on what day. A lot ' +
      'that arrives with neither is treated as unverified and replaced.',
    ],
  },

  /** The download block's own heading and standfirst. */
  kit: {
    heading: 'Take the mark',
    body:
      'The house would rather be reproduced correctly than not at all. Both ' +
      'marks are below, as vector and as raster, with the terms of use in the ' +
      'file. Nothing here needs a licence and nothing here may be redrawn.',
  },

  /**
   * The lockups, shown at a size worth looking at, on alternating grounds.
   * Three panels, one function called three times — the ground is the only
   * thing that differs, which is the point of showing them at all.
   */
  lockups: {
    heading: 'The lockups',
    body:
      'Cream on black is the house pairing and the only one the mark is drawn ' +
      'for. It holds on the two darker grounds below. It does not hold on ' +
      'anything lighter, and the house will say so if asked.',
    panels: [
      { ground: 'black', label: 'On black', kind: 'wordmark' },
      { ground: 'darker', label: 'On the alternating ground', kind: 'device' },
      { ground: 'deepest', label: 'On panel fill', kind: 'wordmark' },
    ],
  },

  close: {
    heading: 'Anything this does not cover',
    body:
      'Write before doing it. The ledger desk keeps the terms and will say yes ' +
      'more often than the file above suggests.',
    action: { label: 'Write to the desk', href: `mailto:${mailbox}` },
  },

  meta: {
    title: 'The House',
    describe:
      `${site.name} at Consuegra — the charter, the guild, the arms and the ` +
      'seals, with the house mark and wordmark to take away as real files.',
    path: '/house',
  },
} as const
