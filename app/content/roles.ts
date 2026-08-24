/**
 * `/roles` — a real careers page. Phase 7, route 5.
 *
 * IT EXISTS FOR ITS OWN SAKE. Rule 8: real listings, real detail, a real
 * application address that goes somewhere. A page built as a pretext reads as
 * a pretext, and a reader who works that out stops reading and starts
 * inspecting.
 *
 * THE NOTICEBOARD AND THE LISTINGS ARE NOT THE SAME SET, and that is the one
 * rule on this file that cannot be relaxed. The photograph is of the ledger
 * desk with the wall behind it; the wall carries four internal requisition
 * cards, drawn into the raster offline by scripts/plates.mjs from a job file
 * that is not in this repository. The listings below are what the house has
 * actually published. A title that appeared in both sets would let a reader
 * lay the two beside each other and find the one card missing from the
 * listings — which would hand over the difference for free.
 *
 * So: four cards on the wall, four listings under it, and no title in common.
 * A noticeboard in a real office is out of date, which is exactly why this
 * works rather than being a contrivance.
 *
 * NO FINDABLE DECOY VOCABULARY ON THIS ROUTE. `/roles` is a marked route, so a
 * Ctrl+F hit anywhere on it would land a reader in the right region for
 * nothing. `_private/decoys.json` records the rule and scripts/register.mjs
 * enforces it — read the note there before adding a word to this file.
 *
 * The photograph is environmental. It is a picture of an office, not a picture
 * of a noticeboard, and the page's copy never mentions the wall.
 */
import { art } from '~/content/media'
import { mailbox } from '~/content/site'

export type Listing = {
  readonly title: string
  readonly place: string
  readonly desk: string
  readonly basis: string
  readonly body: string
  /** What the house wants to see. Three lines, no more. */
  readonly wants: readonly string[]
  readonly closes: string
}

/**
 * Four published listings.
 *
 * Written as a real house writes them: what the work is, what the hours are,
 * what it pays attention to. No values statement, no "fast-paced environment",
 * no list of perks. A house that has been doing this for a hundred and
 * twenty-one years does not need to sell the job.
 */
export const listings: readonly Listing[] = [
  {
    title: 'Field cutter — the season',
    place: 'Consuegra',
    desk: 'Cultivation',
    basis: 'Seasonal · eleven days',
    body:
      'Picking starts before light and stops when the flower opens, which in ' +
      'a good year is about half past nine. The whole rose is taken and ' +
      'stripped the same morning. Eleven days, once a year, and the house has ' +
      'taken on the same families for four generations — but it takes on new ' +
      'ones every season and always has.',
    wants: [
      'A steady hand and a straight back at five in the morning.',
      'Eleven consecutive days between the last week of October and the first of November.',
      'No experience. You will be shown on the first morning.',
    ],
    closes: 'Open until the season starts',
  },
  {
    title: 'Stripping room hand',
    place: 'Consuegra',
    desk: 'Intake',
    basis: 'Seasonal · six weeks',
    body:
      'Stripping the stigma from the rose, sitting, indoors, within the day it ' +
      'was picked. It is quiet, close work and it is the part of the process ' +
      'that has changed least since 1904. The room runs from the first ' +
      'morning of picking to the last lot cured.',
    wants: [
      'Good near vision, corrected or not.',
      'Six weeks, days, with two evenings a week in the heavy fortnight.',
      'Patience of a kind that is easier to have than to describe.',
    ],
    closes: 'Closes 30 September',
  },
  {
    title: 'Moisture clerk — intake',
    place: 'Consuegra',
    desk: 'Intake',
    basis: 'Permanent · full time',
    body:
      'Taking the reading at intake and again at sealing, entering both against ' +
      'the lot the same day, and refusing anything outside the band. The clerk ' +
      'who takes the reading is the clerk who signs it, and no lot leaves the ' +
      'floor on a figure nobody signed.',
    wants: [
      'A year on a bench, anywhere, doing anything measured.',
      'The nerve to fail a lot an estate family is standing beside.',
      'Spanish and English. The certificates go out in both.',
    ],
    closes: 'Closes 12 January',
  },
  {
    title: 'Die room cutter',
    place: 'Consuegra',
    desk: 'The die room',
    basis: 'Permanent · four days',
    body:
      'Striking lead seals against the register, and keeping the 1904 die. The ' +
      'die has not been recut in a hundred and twenty-one years and the person ' +
      'who holds it is the reason. This is a four-day post and the house has ' +
      'filled it three times since the war.',
    wants: [
      'Bench metalwork, or engraving, or something close enough to argue for.',
      'A tolerance for being audited. Every strike is counted against the register.',
      'Willingness to be trained by the person leaving, over a year.',
    ],
    closes: 'Closes 28 February',
  },
]

export const rolesPage = {
  title: 'Roles',
  lede:
    'The house employs thirty-one people all year and about four hundred for ' +
    'eleven days in October. Both kinds of post are listed here.',
  body:
    'Crocaria hires at Consuegra and nowhere else. There is no head office ' +
    'elsewhere to be moved to, no rotation, and no graduate scheme. What there ' +
    'is instead is a house where the person who takes a reading signs it, and ' +
    'where most of the permanent staff have done at least one season in the ' +
    'stripping room, whatever they do now.',

  /**
   * The environmental frame. Rendered edge to edge on a phone: phase 5 measured
   * the type in this photograph against 375px of render and recorded the
   * contract in `_private/reach.json`. Inside the padded column it would lose
   * forty of those pixels to the gutters, which is rule 4's floor cut fine.
   */
  plate: art('frame-21', 'The ledger desk at Consuegra.'),
  caption: 'The ledger desk, Consuegra. The house has worked this room since 1911.',

  listingsHeading: 'Open now',
  fields: { place: 'Place', desk: 'Desk', basis: 'Basis', closes: 'Closes' },
  wantsLabel: 'What the house is looking for',

  apply: {
    label: 'Apply',
    /** A real address, and the subject line the desk sorts on. */
    href: (title: string) => `mailto:${mailbox}?subject=${encodeURIComponent(title)}`,
    note:
      'One page and a note about which post. The house reads everything and ' +
      'replies to everything, including the ones it turns down.',
  },

  close: {
    heading: 'Nothing here for you?',
    body:
      'Write anyway. Half the permanent posts at Consuegra were filled by ' +
      'someone who wrote in a year before they existed, and the desk keeps ' +
      'those notes.',
    action: { label: 'Write to the desk', href: `mailto:${mailbox}` },
  },

  meta: {
    title: 'Roles',
    describe:
      'Working at Crocaria, Consuegra — seasonal posts in the field and the ' +
      'stripping room, and permanent ones at intake and in the die room.',
    path: '/roles',
  },
} as const
