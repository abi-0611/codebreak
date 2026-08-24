/**
 * `/dispatches` — the house journal, in words. Phase 7, route 1.
 *
 * THE REGISTER LIVES HERE AND THE HOME PAGE TAKES A SLICE OF IT. Section 7 of
 * `/` shows the first six in a carousel; this route lays out all twelve as a
 * grid. Two lists would be two lists to keep in step, and the one that drifts
 * is always the one on the page nobody opens.
 *
 * NO DECOY VOCABULARY ON THIS ROUTE. The ornamental plate that opens the page
 * is the same plate section 7 carries, at a larger rendered size — the same
 * marked surface, twice as legible — so a word a reader can find with Ctrl+F
 * anywhere on this route would hand them the region for free.
 * `_private/decoys.json` records the rule; scripts/register.mjs enforces it.
 *
 * The cards are not links, and that is not an omission. The house prints short
 * notes and prints them whole: the standfirst on the card is the note. A card
 * pointing at a longer form that does not exist would be rule 8, and inventing
 * twelve article routes to justify twelve links would be inventing work.
 */
import { art, type Dispatch } from '~/content/media'

/**
 * The filter groups.
 *
 * Four categories the house actually files under, plus `All`. They are the
 * desks a note comes off — the field, the bench, an estate, the house itself —
 * not topics invented to make a dropdown look full.
 */
export const groups = [
  { value: 'all', label: 'All' },
  { value: 'season', label: 'The season' },
  { value: 'bench', label: 'The bench' },
  { value: 'estate', label: 'The estates' },
  { value: 'house', label: 'The house' },
] as const

export const filings: readonly Dispatch[] = [
  {
    tag: 'Lot 04',
    date: '12 Nov 2025',
    title: 'The season closes early',
    body:
      'Eleven days of flowering and the blocks were finished. What that costs ' +
      'a buyer, and what it does not.',
    kind: 'season',
    plate: art('room-01', 'The stripping room at Consuegra.'),
  },
  {
    tag: 'Lot 09',
    date: '03 Nov 2025',
    title: 'Two benches, one figure',
    body:
      'A second bench read the same samples for a month. The readings differed ' +
      'by 1.4 and the house changed nothing.',
    kind: 'bench',
    plate: art('room-02', 'The assay bench, mid-season.'),
  },
  {
    tag: 'Lot 11',
    date: '28 Oct 2025',
    title: 'Valdehierro is re-set',
    body:
      'Four years on the same beds is the rule. The block came up in June and ' +
      'went back down inside the week.',
    kind: 'estate',
    plate: art('room-03', 'The lifting shed at Valdehierro.'),
  },
  {
    tag: 'Lot 17',
    date: '14 Oct 2025',
    title: 'On weighing a flower',
    body:
      'A hundred and fifty thousand flowers to the kilogram, every one of them ' +
      'weighed wet before it was weighed dry.',
    kind: 'bench',
    plate: art('room-04', 'The weigh room, scales set for intake.'),
  },
  {
    tag: 'Lot 22',
    date: '30 Sep 2025',
    title: 'The die and the seal',
    body:
      'Why the house strikes its own seals, and what happens on the rare ' +
      'occasion one arrives broken.',
    kind: 'house',
    plate: art('room-05', 'The die room at Consuegra.'),
  },
  {
    tag: 'Lot 26',
    date: '18 Sep 2025',
    title: 'A note on curing heat',
    body:
      'Low heat, held long. The bench figure follows the curing more closely ' +
      'than it follows the field.',
    kind: 'bench',
    plate: art('room-06', 'The curing loft above the grading floor.'),
  },
  {
    tag: 'Lot 31',
    date: '02 Sep 2025',
    title: 'Casa Tembleque comes back in',
    body:
      'Struck off the roll in 1988 over a moisture dispute. Readmitted this ' +
      'August, on a vote of thirty-nine to two.',
    kind: 'estate',
    plate: art('room-07', 'The long gallery at Casa Tembleque.'),
  },
  {
    tag: 'Lot 35',
    date: '19 Aug 2025',
    title: 'What the bonded floor costs',
    body:
      'Twelve degrees, unlit, under customs bond, charged by the month and by ' +
      'the tin. The arithmetic, printed in full.',
    kind: 'house',
    plate: art('room-08', 'The bonded floor, mid-summer.'),
  },
  {
    tag: 'Lot 38',
    date: '05 Aug 2025',
    title: 'The 1904 die, photographed',
    body:
      'Cut by a Toledo engraver whose name is on the charter and on nothing ' +
      'else. It has not been recut in a hundred and twenty-one years.',
    kind: 'house',
    plate: art('room-09', 'The house die on its bench block.'),
  },
  {
    tag: 'Lot 42',
    date: '21 Jul 2025',
    title: 'Watering, and the argument against it',
    body:
      'Consuegra takes what falls on it. Two estates asked to irrigate in June ' +
      'and the guild said no for the fourth time.',
    kind: 'estate',
    plate: art('room-10', 'A dry block at Madridejos Alta in July.'),
  },
  {
    tag: 'Lot 47',
    date: '08 Jul 2025',
    title: 'Style length, and who decides it',
    body:
      'The bench reads colour. The sorter reads style. Where the two disagree, ' +
      'the sorter has the last word and always has.',
    kind: 'bench',
    plate: art('room-11', 'The sorting tables, out of season.'),
  },
  {
    tag: 'Lot 51',
    date: '24 Jun 2025',
    title: 'Setting the corms at fifteen',
    body:
      'Fifteen centimetres on a metre bed. Closer lifts the yield for two ' +
      'seasons and costs it back over the next four.',
    kind: 'season',
    plate: art('room-12', 'A metre bed marked out at Valdehierro.'),
  },
]

/** What the home carousel shows. Six of twelve, newest first. */
export const recent = filings.slice(0, 6)

export const dispatchPage = {
  title: 'Crocaria dispatches',
  lede:
    'The house prints what it learns. Season notes, bench readings and the ' +
    'occasional argument about grade, set down as they happen and kept on file ' +
    'at Consuegra. Notes are printed whole — there is no longer form.',
  /** Names the filter field. Roboto Mono uppercase, inside the bordered box. */
  filter: 'Desk',
  /** The count line beside the filter. `n` is substituted at render. */
  count: (n: number) => `${n} note${n === 1 ? '' : 's'} on file`,
  label: 'Dispatches',
  plate: art('plate-06', 'A specimen engraving of the saffron crocus.'),
  meta: {
    title: 'Dispatches',
    describe:
      'Season notes, bench readings and house business from Crocaria at ' +
      'Consuegra. Printed as they happen, kept on file, and never tidied up ' +
      'afterwards.',
    path: '/dispatches',
  },
} as const
