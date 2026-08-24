/**
 * The lot register — the house's own table, and the source of both views of it.
 *
 * `/` section 3 shows the first seven rows. `/ledger` shows all twenty-one,
 * with a filter row over them and a block of per-lot detail under them. One
 * register, two views: a second list of the same lots would drift, and the
 * page that drifted would be the one a buyer checked a number against.
 *
 * `/ledger` CARRIES NOTHING, and that is exactly why it is written the way it
 * is. It is the page a team scours word by word, so it holds a concentration
 * of the vocabulary a reader can find with Ctrl+F — the crocin index, the port
 * of entry, the stack lot, the kernel and lambda and cluster grades, the
 * shipping lane. Every one of them is a real term of the trade doing a real
 * job in a real column, and every one of them leads nowhere.
 *
 * Numbers are internally consistent and are meant to survive being read
 * closely: reserve never exceeds net, the index falls as the season runs on,
 * and the moisture readings sit inside the 10 to 12 per cent band the house
 * says on `/faq` that it seals within. A ledger that does not survive
 * arithmetic is a ledger that tells a reader the site is a prop.
 */
import { art } from '~/content/media'

export type Lot = {
  /** The register number. Sequential, with gaps — lots are struck, not issued. */
  readonly no: string
  /** Appended to the number in the table. `Stack lot` is the only one in use. */
  readonly note?: string
  readonly estate: string
  /** The block the material was cut from — smaller than the estate. */
  readonly block: string
  readonly grade: string
  /** Crocin index: the pigment-strength reading taken at intake. */
  readonly index: number
  /** Port of entry, or the lane it moves on. */
  readonly port: string
  /** Cutting week. */
  readonly cut: string
  /** Struck at sealing, per cent. */
  readonly moisture: string
  readonly sealed: string
  /** Lead seal number. */
  readonly seal: string
  /** Net weight of the lot. */
  readonly net: string
  /** Held back against a customs query. */
  readonly reserve: string
}

/**
 * The two overlapping marks every row carries — the estate's, then the assay
 * bench's. Both are committed house artwork and neither carries anything.
 */
const estateMark = { src: '/img/icon-512.png', describe: 'Estate mark' }
const benchMark = { src: '/img/still-03-375.webp', describe: 'Assay bench mark' }
export const marks = [estateMark, benchMark] as const

export const heads = ['Lot', 'Origin', 'Grade', 'Crocin index', 'Port', 'Reserve'] as const

export const lots: readonly Lot[] = [
  { no: 'CRC-0411', estate: 'Valdehierro', block: 'Block 04', grade: 'Coupé', index: 241, port: 'Vector Lane', cut: 'Wk 43', moisture: '11.0%', sealed: '02 Nov 2025', seal: 'LS 41-0411', net: '248 kg', reserve: '96 kg' },
  { no: 'CRC-0417', estate: 'La Sierpe', block: 'Block 11', grade: 'Kernel', index: 236, port: 'Cartagena', cut: 'Wk 43', moisture: '11.2%', sealed: '03 Nov 2025', seal: 'LS 41-0417', net: '310 kg', reserve: '120 kg' },
  { no: 'CRC-0422', estate: 'El Romeral', block: 'Block 02', grade: 'Mancha', index: 228, port: 'Vector Lane', cut: 'Wk 44', moisture: '10.8%', sealed: '06 Nov 2025', seal: 'LS 41-0422', net: '166 kg', reserve: '64 kg' },
  { no: 'CRC-0428', estate: 'Consuegra', block: 'Block 19', grade: 'Lambda', index: 219, port: 'Alicante', cut: 'Wk 44', moisture: '11.6%', sealed: '08 Nov 2025', seal: 'LS 41-0428', net: '388 kg', reserve: '150 kg' },
  { no: 'CRC-0431', note: 'Stack lot', estate: 'Madridejos Alta', block: 'Blocks 06–08', grade: 'Cluster', index: 212, port: 'Cartagena', cut: 'Wk 44', moisture: '11.4%', sealed: '09 Nov 2025', seal: 'LS 41-0431', net: '540 kg', reserve: '208 kg' },
  { no: 'CRC-0435', estate: 'Cerro Calderico', block: 'Block 01', grade: 'Coupé', index: 205, port: 'Valencia', cut: 'Wk 45', moisture: '10.5%', sealed: '11 Nov 2025', seal: 'LS 41-0435', net: '186 kg', reserve: '72 kg' },
  { no: 'CRC-0440', estate: 'Casa Tembleque', block: 'Block 07', grade: 'Río', index: 198, port: 'Vector Lane', cut: 'Wk 45', moisture: '11.9%', sealed: '12 Nov 2025', seal: 'LS 41-0440', net: '124 kg', reserve: '48 kg' },

  { no: 'CRC-0444', estate: 'Valdehierro', block: 'Block 09', grade: 'Mancha', index: 234, port: 'Cartagena', cut: 'Wk 45', moisture: '10.9%', sealed: '13 Nov 2025', seal: 'LS 41-0444', net: '204 kg', reserve: '80 kg' },
  { no: 'CRC-0449', estate: 'La Sierpe', block: 'Block 03', grade: 'Coupé', index: 247, port: 'Valencia', cut: 'Wk 45', moisture: '10.6%', sealed: '14 Nov 2025', seal: 'LS 41-0449', net: '92 kg', reserve: '36 kg' },
  { no: 'CRC-0453', estate: 'El Romeral', block: 'Block 14', grade: 'Kernel', index: 226, port: 'Alicante', cut: 'Wk 46', moisture: '11.1%', sealed: '17 Nov 2025', seal: 'LS 41-0453', net: '270 kg', reserve: '104 kg' },
  { no: 'CRC-0458', estate: 'Consuegra', block: 'Block 22', grade: 'Cluster', index: 214, port: 'Vector Lane', cut: 'Wk 46', moisture: '11.5%', sealed: '18 Nov 2025', seal: 'LS 41-0458', net: '432 kg', reserve: '168 kg' },
  { no: 'CRC-0462', estate: 'Madridejos Alta', block: 'Block 05', grade: 'Lambda', index: 208, port: 'Cartagena', cut: 'Wk 46', moisture: '11.8%', sealed: '19 Nov 2025', seal: 'LS 41-0462', net: '318 kg', reserve: '124 kg' },
  { no: 'CRC-0466', estate: 'Cerro Calderico', block: 'Block 12', grade: 'Mancha', index: 221, port: 'Valencia', cut: 'Wk 46', moisture: '10.7%', sealed: '20 Nov 2025', seal: 'LS 41-0466', net: '158 kg', reserve: '60 kg' },
  { no: 'CRC-0470', note: 'Stack lot', estate: 'Casa Tembleque', block: 'Blocks 02–04', grade: 'Standard', index: 191, port: 'Alicante', cut: 'Wk 47', moisture: '11.7%', sealed: '24 Nov 2025', seal: 'LS 41-0470', net: '604 kg', reserve: '232 kg' },
  { no: 'CRC-0474', estate: 'Valdehierro', block: 'Block 16', grade: 'Coupé', index: 239, port: 'Vector Lane', cut: 'Wk 47', moisture: '10.4%', sealed: '25 Nov 2025', seal: 'LS 41-0474', net: '116 kg', reserve: '44 kg' },
  { no: 'CRC-0479', estate: 'La Sierpe', block: 'Block 08', grade: 'Cluster', index: 217, port: 'Cartagena', cut: 'Wk 47', moisture: '11.3%', sealed: '26 Nov 2025', seal: 'LS 41-0479', net: '366 kg', reserve: '142 kg' },
  { no: 'CRC-0483', estate: 'El Romeral', block: 'Block 21', grade: 'Río', index: 203, port: 'Valencia', cut: 'Wk 47', moisture: '11.0%', sealed: '27 Nov 2025', seal: 'LS 41-0483', net: '142 kg', reserve: '54 kg' },
  { no: 'CRC-0487', estate: 'Consuegra', block: 'Block 27', grade: 'Kernel', index: 231, port: 'Alicante', cut: 'Wk 48', moisture: '10.8%', sealed: '01 Dec 2025', seal: 'LS 41-0487', net: '288 kg', reserve: '112 kg' },
  { no: 'CRC-0491', estate: 'Madridejos Alta', block: 'Block 13', grade: 'Standard', index: 187, port: 'Vector Lane', cut: 'Wk 48', moisture: '11.9%', sealed: '02 Dec 2025', seal: 'LS 41-0491', net: '410 kg', reserve: '160 kg' },
  { no: 'CRC-0495', estate: 'Cerro Calderico', block: 'Block 18', grade: 'Lambda', index: 210, port: 'Cartagena', cut: 'Wk 48', moisture: '11.2%', sealed: '03 Dec 2025', seal: 'LS 41-0495', net: '236 kg', reserve: '92 kg' },
  { no: 'CRC-0498', estate: 'Casa Tembleque', block: 'Block 10', grade: 'Mancha', index: 224, port: 'Valencia', cut: 'Wk 48', moisture: '10.6%', sealed: '04 Dec 2025', seal: 'LS 41-0498', net: '178 kg', reserve: '68 kg' },
]

/** The table's own name for a lot: the number, and its note where it has one. */
export const nameOf = (lot: Lot) => (lot.note ? `${lot.no} · ${lot.note}` : lot.no)

/**
 * One register record as one `<Ledger/>` row. Called once per lot on both
 * routes, so the seven on the home page and the twenty-one here cannot be laid
 * out differently.
 */
export const row = (lot: Lot) => ({
  marks,
  name: nameOf(lot),
  cells: [lot.estate, lot.grade, String(lot.index), lot.port],
  value: lot.reserve,
})

/* -------------------------------------------------------------------------- */
/* the route                                                                  */
/* -------------------------------------------------------------------------- */

/** Grades in the order the house lists them, strongest cut first. */
export const grades = ['Coupé', 'Mancha', 'Kernel', 'Lambda', 'Cluster', 'Río', 'Standard'] as const

/**
 * The index bands the filter offers.
 *
 * Bands rather than a slider, because a buyer asks for "230 and up", never for
 * "233 and up". `holds` is the test, so the option and the filtering are one
 * declaration and cannot disagree.
 */
export const bands = [
  { value: 'all', label: 'Any index', holds: () => true },
  { value: 'high', label: '230 and above', holds: (n: number) => n >= 230 },
  { value: 'mid', label: '210 to 229', holds: (n: number) => n >= 210 && n < 230 },
  { value: 'low', label: 'Under 210', holds: (n: number) => n < 210 },
] as const

export const ledgerPage = {
  title: 'The Ledger',
  lede:
    'Every lot the house has open this season, current to the week. A lot ' +
    'enters the register when the bench figure is struck and leaves it when a ' +
    'buyer calls it forward.',
  body:
    'Origin is the estate; the block under it is the ground the material was ' +
    'actually cut from. The crocin index is the bench reading taken at intake, ' +
    'printed on the certificate and never rounded up. Reserve is what the ' +
    'house holds back against a customs query, and it is part of the net, not ' +
    'additional to it.',

  /** The crate stencil, which is where a lot goes once it is called forward. */
  plate: art('stamp-03', 'A sealed crate on the bonded floor at Consuegra.'),
  plateNote:
    'Every crate off the bonded floor is stencilled before it moves. The mark ' +
    'is the floor’s, not the lot’s — it says who handled it, which is the one ' +
    'thing the certificate cannot.',

  filters: {
    grade: 'Grade',
    index: 'Crocin index',
    /** The live count beside the two fields. */
    count: (shown: number, all: number) =>
      shown === all ? `${all} lots open` : `${shown} of ${all} lots open`,
    empty: 'No open lot matches both. Widen one of the two fields.',
    clear: 'Show all lots',
  },

  detail: {
    heading: 'Per lot, in full',
    body:
      'What the table leaves out. Every figure below is on the certificate the ' +
      'lot travels with, and the ledger desk will read any of it back against ' +
      'a number over the telephone.',
    /** The mono labels on a detail row, in the order they are laid. */
    fields: ['Block', 'Cut', 'Moisture at sealing', 'Sealed', 'Lead seal', 'Net'] as const,
  },

  meta: {
    title: 'The Ledger',
    describe:
      'Every lot Crocaria has open this season — estate, block, grade, crocin ' +
      'index, port and reserve, current to the week and traced to the furrow.',
    path: '/ledger',
  },
} as const
