/**
 * `/faq` — what the trade asks, grouped by desk. Phase 7, route 2.
 *
 * Twenty-five questions across four groups, and every one of them has real
 * material under it. That is a deliberate use of a participant's time: a team
 * reading FAQ copy looking for something is a team spending their minutes
 * exactly where the site wants them, on ordinary trade writing that rewards
 * being read.
 *
 * THIS IS WHERE THE DECOY VOCABULARY EARNS ITS KEEP. Four of the words a
 * reader can find with Ctrl+F sit in these replies, and every one is doing an
 * honest job — a saffron stigma really is sold as a thread, the crocin index
 * really is the pigment-strength measure, a bonded house really does hold
 * buffer stock, and the warehouse at Consuegra really is called Node House.
 * `_private/decoys.json` records which word lands on which route; this file is
 * checked against it by `npm run audit:register` on the BUILT html.
 *
 * `/faq` carries nothing itself, which is what makes it a safe place for
 * findable vocabulary: a hit here leads a reader to a page of grading notes.
 *
 * VOICE. Short declaratives, numbers over adjectives, no hedging and no
 * apology. Where the house says no, it says no in the first sentence.
 */
import { mailbox } from '~/content/site'

export type Group = {
  /** Roboto Mono uppercase, over the accordion. */
  readonly key: string
  readonly label: string
  readonly rows: readonly { readonly question: string; readonly body: string }[]
}

export const groups: readonly Group[] = [
  {
    key: 'general',
    label: 'General',
    rows: [
      {
        question: 'What does the house actually sell?',
        body:
          'Lots. A lot is a sealed quantity of graded saffron, cut from one ' +
          'block in one season, weighed on one bench and entered against one ' +
          'number. The smallest on the register is four kilograms net and it is ' +
          'sold whole. The house does not sell sachets, tins to the public, or ' +
          'anything it has not graded itself.',
      },
      {
        question: 'Where is Crocaria?',
        body:
          'Consuegra, in Toledo, on the plain under the Cerro Calderico ridge. ' +
          'The house has worked the same nineteen estates since 1904 and holds ' +
          'its bonded floor in the town. Everything — field, bench, die room, ' +
          'floor — is within four kilometres of the register.',
      },
      {
        question: 'Who owns the house?',
        body:
          'Nobody. It is held by forty-one estate families, one vote each and no ' +
          'second vote. A grade renamed, a bench figure revised, an estate ' +
          'admitted or struck off — each carries only on a vote of the guild. ' +
          'The roll is open at Consuegra and has been amended eleven times.',
      },
      {
        question: 'Do you sell to the public?',
        body:
          'Not directly. The house sells to the trade: kitchens, blenders, ' +
          'confectioners, the pharmaceutical bench, and two dozen merchants who ' +
          'break lots down themselves. If you have found this page as a cook, ' +
          'the merchants who carry the house mark will sell you ten grams.',
      },
      {
        question: 'Is any of this certified?',
        body:
          'The house holds the protected designation for the plain and files ' +
          'with the Consuegra assay office. Every lot carries its bench figure ' +
          'on the certificate. The designation says where it came from; the ' +
          'bench figure says what it is. The second one is the useful number.',
      },
      {
        question: 'How do I get in touch?',
        body:
          `Write to ${mailbox}. The ledger desk is staffed from October to ` +
          'March and reads everything in the week it arrives. Outside the ' +
          'season it is one person and a slower week, and she will say so.',
      },
    ],
  },

  {
    key: 'grading',
    label: 'Grading & assay',
    rows: [
      {
        question: 'How is a grade decided?',
        body:
          'By hand, then by instrument. Threads are sorted for style length and ' +
          'for the ratio of red to yellow, and the sorter scores a hash mark on ' +
          'the tray for every one put back. A sample then goes to the bench for ' +
          'colour strength, crocin and safranal. The bench figure is what is ' +
          'printed on the certificate; the sorter has the last word on style.',
      },
      {
        question: 'What is the crocin index?',
        body:
          'The pigment-strength reading, taken on a sample dissolved and read ' +
          'at 440 nanometres against a standard. It runs from about 150 at the ' +
          'bottom of what the house will seal to 260 at the top of a good year. ' +
          'The index is the single most useful number on a certificate and it ' +
          'is never rounded up.',
      },
      {
        question: 'What do the grade names mean?',
        body:
          'Coupé is stigma only, cut at the style. Mancha carries a short ' +
          'length of style. Río and Standard carry more. Kernel and Lambda are ' +
          'the house’s own names for two intermediate cuts the trade in ' +
          'Toledo has used since before the charter. They are cuts, not ' +
          'qualities: a Mancha lot can read higher than a Coupé one.',
      },
      {
        question: 'How many threads are in a kilogram?',
        body:
          'Roughly a hundred and fifty thousand flowers, three threads to the ' +
          'flower, so somewhere near four hundred and fifty thousand. Nobody ' +
          'counts them. The figure matters only because it is the reason a ' +
          'kilogram of this costs what it costs.',
      },
      {
        question: 'Is the moisture reading on the certificate?',
        body:
          'Yes, taken at intake and again at sealing. The house seals between ' +
          '10 and 12 per cent. Below ten the threads break in handling and the ' +
          'lot loses grade in transit; above twelve it will not hold thirty ' +
          'months and the bench will not certify it.',
      },
      {
        question: 'Can I have a lot read by my own bench?',
        body:
          'Yes, and the house would rather you did. A sample of any open lot ' +
          'goes out on request, sealed, with the house reading enclosed in a ' +
          'closed envelope so your bench is not reading toward a number. Where ' +
          'the two disagree by more than four points the house re-reads.',
      },
      {
        question: 'What happens to what fails?',
        body:
          'It is not sold under the mark. Under-grade material goes back to the ' +
          'estate that sent it, at the estate’s cost, and the block is read ' +
          'again the following season. The house has struck two estates off the ' +
          'roll in a hundred and twenty-one years and readmitted one of them.',
      },
    ],
  },

  {
    key: 'ordering',
    label: 'Ordering',
    rows: [
      {
        question: 'What is the smallest lot?',
        body:
          'Four kilograms net, and it is sold whole. The house does not split a ' +
          'sealed lot: breaking the seal means the material is graded again ' +
          'before it moves, which costs more than the split saves.',
      },
      {
        question: 'How long does a lot take to reach me?',
        body:
          'Out of bond in a day, on the road the same week. Cartagena, Valencia ' +
          'and Alicante are the three ports the house ships through; anything ' +
          'inside Spain and France goes by road under the house seal at the ' +
          'house’s own risk. Anything further is quoted before it is booked.',
      },
      {
        question: 'Do you hold stock outside the season?',
        body:
          'Yes. The house keeps a buffer of about a hundred and eighty lots ' +
          'against a late flowering, a customs query, or a buyer who calls a ' +
          'lot forward at short notice. Buffer stock is graded and sealed like ' +
          'anything else and is drawn oldest first, never by price.',
      },
      {
        question: 'What does warehousing cost?',
        body:
          'Charged by the month and by the tin, from the day the lot is sealed. ' +
          'A buyer who calls a lot forward inside sixty days pays nothing. ' +
          'Everything after that is on the schedule the ledger desk will send ' +
          'you, and the schedule has not changed since 2019.',
      },
      {
        question: 'Can I reserve against next season?',
        body:
          'Against a block, not against a figure. The house will hold a block’s ' +
          'output for a named buyer and will not name a bench figure before the ' +
          'bench has read it. A house that sells you a number in June is selling ' +
          'you a number it does not have.',
      },
      {
        question: 'How do you price?',
        body:
          'By grade, by the index, and by what the season did. There is no list. ' +
          'The ledger desk quotes against a lot number, the quote holds for ' +
          'fourteen days, and the house does not discount for volume — a ' +
          'twenty-lot buyer and a one-lot buyer pay the same for the same lot.',
      },
    ],
  },

  {
    key: 'provenance',
    label: 'Provenance',
    rows: [
      {
        question: 'What travels with a sealed lot?',
        body:
          'One seal covers four documents: the estate note, the assay sheet, ' +
          'the moisture reading taken at intake, and the bonded warehousing ' +
          'record. Break the seal and the lot is graded again before it moves.',
      },
      {
        question: 'Can I trace a lot back to a field?',
        body:
          'To a block, which is smaller than a field. Every certificate carries ' +
          'the estate, the block, the cutting week and the bench that read it. ' +
          'Give the ledger desk a lot number and it will tell you who cut it and ' +
          'on which mornings, back to 1904 for anything the fire did not take.',
      },
      {
        question: 'Where is a lot held between seasons?',
        body:
          'On the bonded floor at Consuegra — Node House No. 3, twelve degrees, ' +
          'unlit, under customs bond. The house does not hold a lot it has not ' +
          'graded and does not hold anyone else’s material at all.',
      },
      {
        question: 'How long does a lot hold?',
        body:
          'Sealed, unlit, at a steady twelve degrees, a lot holds its colour ' +
          'strength for thirty months. The intake date is struck on every tin, ' +
          'so a buyer is never estimating. After thirty months the house will ' +
          're-read a lot on request and re-certify it at whatever it now is.',
      },
      {
        question: 'What if a seal arrives broken?',
        body:
          'Photograph it before you open anything, and write the same day. A ' +
          'broken seal travels with a token seal and a note from whoever broke ' +
          'it, and if it does not, the lot is treated as unverified and replaced ' +
          'from the buffer. The house has done this nine times in forty years.',
      },
      {
        question: 'Do you publish the register?',
        body:
          'The open lots, yes — the ledger is on this site and current to the ' +
          'week. Sealed lots under a named buyer are not published, because the ' +
          'lot number and the buyer together are that buyer’s business. ' +
          'Anyone can ask the desk whether a particular number exists.',
      },
    ],
  },
]

export const faqPage = {
  title: 'Questions',
  lede:
    'What the trade asks, grouped by the desk that deals with it. If what you ' +
    'need is not here, the ledger desk reads everything.',
  /** Names the filter field. Roboto Mono uppercase, inside the bordered box. */
  filter: 'Desk',
  /** `All` first, then the four groups, built from the register above. */
  options: [{ value: 'all', label: 'All questions' }, ...groups.map((g) => ({ value: g.key, label: g.label }))],
  close: {
    heading: 'Still asking?',
    body:
      'The ledger desk at Consuegra reads everything in the week it arrives, ' +
      'and would rather be asked than guessed at.',
    action: { label: 'Write to the desk', href: `mailto:${mailbox}` },
  },
  meta: {
    title: 'Questions',
    describe:
      'Grading, assay, ordering and provenance at Crocaria — twenty-five ' +
      'questions the trade asks, replied to plainly by the house at Consuegra.',
    path: '/faq',
  },
} as const
