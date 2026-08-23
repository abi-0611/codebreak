/**
 * Every user-visible string in the application lives in this file.
 * Nothing is written inline in JSX. Sections receive what they render as props.
 *
 * Keeping copy in one typed module is what makes a single-file audit possible.
 */

import { plates } from '@/content/plates'

export type NavLink = {
  label: string
  to: string
}

export type FootColumn = {
  heading: string
  links: NavLink[]
}

/** Key into the generated image manifest. Typed so a stem cannot go stale. */
export type PlateKey = keyof typeof plates

/* --------------------------------------------------------------------------
   Brand
   -------------------------------------------------------------------------- */

export const brand = {
  name: 'NORTHBOUND',
  /** Spoken form, used where the all-caps lockup would shout. */
  wordmark: 'Northbound',
  founded: '2011',
  base: 'Chamonix',
  region: 'Haute-Savoie, France',
  /** What the company does, in one line. Used in meta and in the footer. */
  what: 'High-altitude expedition outfitter. Guided ascents, permits, logistics.',
  tagline: 'The mountain does not negotiate.',
  /** The dateline that sits under the wordmark in the hero. */
  dateline: 'Est. 2011 / Chamonix',
} as const

/**
 * The site's only call to action. A ballot, not a checkout: seats on a rope
 * team are finite and the copy should never imply otherwise.
 *
 * It opens the ballot dialog rather than navigating. `to` remains as the
 * no-JavaScript destination — the permits scene, which is where the process is
 * actually described — so the control is never a link to nowhere.
 */
export const cta = {
  label: 'Request Access',
  to: '/#permits',
} as const

/**
 * The ballot dialog. No backend: the field is validated, the confirmation is
 * shown, and nothing leaves the browser. That is stated plainly rather than
 * implied, because a form that pretends to submit is worse than one that
 * admits it does not.
 */
export const ballot = {
  eyebrow: 'Season 2026',
  title: 'Request access',
  body: 'Places are drawn, not sold. Leave an address and you join the 2026 ballot; we write once, in November, whether or not your name comes out.',
  field: 'Email address',
  action: 'Join the ballot',
  invalid: 'That does not look like an email address.',
  doneTitle: 'You are on the list.',
  doneBody: 'Nothing further to do. We write in November.',
  close: 'Close',
} as const

/* --------------------------------------------------------------------------
   Navigation
   -------------------------------------------------------------------------- */

export const nav: NavLink[] = [
  { label: 'Routes', to: '/#routes' },
  { label: 'Safety', to: '/#safety' },
  { label: 'Permits', to: '/#permits' },
  { label: 'Journal', to: '/#journal' },
]

/* --------------------------------------------------------------------------
   Home — scene 1: the approach
   -------------------------------------------------------------------------- */

export const approach = {
  eyebrow: brand.dateline,
  lines: ['The mountain', 'does not negotiate.'],
  cue: 'Scroll',
} as const

/* --------------------------------------------------------------------------
   Home — scene 2: ethos
   -------------------------------------------------------------------------- */

export const ethos = {
  eyebrow: 'Compass Bearing',
  title: 'We do not sell summits.',
  body: [
    'A summit is an outcome. What we sell is the preparation that makes one possible: the acclimatisation ladder, the weather window, the line already fixed on the crux, and a guide who has been on that face in bad conditions and knows exactly what it does.',
    'In 2019 we turned two teams back from Cache Ridge at 2,600 metres, eleven hours short, on a forecast that never broke. Both teams paid in full. Both came back the following season. That is the arrangement, and we would rather you knew it now than at the col.',
  ],
  caption: 'Cache Ridge, east approach.',
} as const

/* --------------------------------------------------------------------------
   Home — scene 3: the route book
   --------------------------------------------------------------------------
   Five cards, one construction. Each photograph carries its route name on a
   riveted marker plate in the frame; the caption below carries sector,
   altitude, grade and duration. That editorial choice holds for all five —
   see the note beside the gazetteer.

   `ref` is the filing reference. It is also the URL segment, which is why it
   is a neutral code rather than a slugged name: a route name in an address bar
   is a route name published in plain sight, and the naming ban in CLAUDE.md
   covers routes for exactly that reason. All five are formed identically.
   -------------------------------------------------------------------------- */

export type RouteCard = {
  /** Filing reference. Lowercased, it is the URL segment. */
  ref: string
  plate: PlateKey
  sector: string
  altitude: string
  grade: string
  duration: string
  /**
   * Accessible name for the card. Matches the marker plate in the photograph,
   * which is the only place the name is set.
   */
  name: string
}

export const routebook = {
  eyebrow: 'The route book',
  title: 'Five ways up.',
  body: 'Every brief in the book has been walked by the guide who wrote it, in the season it describes. Grades are ours and they are conservative.',
  cardsLabel: 'Route briefs',
  cardAction: 'Route brief',
  grades: {
    eyebrow: 'Grades',
    title: 'What the three words mean.',
    items: [
      {
        term: 'Alpine',
        copy: 'Sustained walking on mixed ground with short roped sections. Fitness decides the day.',
      },
      {
        term: 'Technical',
        copy: 'Placed protection, exposed movement, a crux you cannot walk around. Prior lead experience is required.',
      },
      {
        term: 'Glacier',
        copy: 'Crevassed terrain throughout. Rope work and crevasse drills are done before departure, not on the ice.',
      },
    ],
  },
  departures: {
    eyebrow: 'Departures',
    title: 'Confirmed for 2026.',
    columns: ['Route', 'Window', 'Grade', 'Places'],
    rows: [
      ['Vector Ridge', '14 — 16 Jun', 'Technical', '4'],
      ['Col du Nord', '2 — 3 Jul', 'Alpine', '6'],
      ['Beacon Traverse', '21 — 23 Jul', 'Technical', '2'],
      ['Sable Pass', '9 — 10 Sep', 'Glacier', '8'],
    ],
    note: 'A fifth sector is closed for the season and carries no departures.',
  },
} as const

export const routes: RouteCard[] = [
  {
    ref: 'HS-114',
    plate: 'routeOne',
    sector: 'N Face',
    altitude: '2,410 m',
    grade: 'Technical',
    duration: '2 days',
    name: 'Vector Ridge',
  },
  {
    ref: 'HS-231',
    plate: 'routeTwo',
    sector: 'E Col',
    altitude: '2,655 m',
    grade: 'Alpine',
    duration: '1 day',
    name: 'Col du Nord',
  },
  {
    ref: 'HS-308',
    plate: 'routeThree',
    sector: 'S Ridge',
    altitude: '2,840 m',
    grade: 'Alpine',
    duration: '3 days',
    // Set from `inscriptions` for the reason given above that block. The
    // visible name is on the marker plate in the photograph; this is the
    // accessible equivalent of it. See the assignment below.
    name: '',
  },
  {
    ref: 'HS-412',
    plate: 'routeFour',
    sector: 'W Arête',
    altitude: '2,290 m',
    grade: 'Technical',
    duration: '2 days',
    name: 'Beacon Traverse',
  },
  {
    ref: 'HS-505',
    plate: 'routeFive',
    sector: 'S Col',
    altitude: '2,120 m',
    grade: 'Glacier',
    duration: '1 day',
    name: 'Sable Pass',
  },
]

/* --------------------------------------------------------------------------
   Route briefs
   --------------------------------------------------------------------------
   One page per route, reached from the card. Keyed by filing reference, so no
   route name is ever needed to address one.

   The brief renders the route's name the same way its card does — from the
   marker plate in the photograph, enlarged — and never as live text. All five
   are built by the same component from the same shape of data.
   -------------------------------------------------------------------------- */

export type Waypoint = {
  name: string
  altitude: string
}

export type Brief = {
  copy: string[]
  waypoints: Waypoint[]
  season: string
}

export const briefs: Record<string, Brief> = {
  'HS-114': {
    copy: [
      'A north-facing line that holds its condition later than anything else in the book, and pays for it with cold. The crux is a short corner at two-thirds height that takes gear well and goes at a grade most parties find easier than it looks from below.',
      'Two days, one night at the refuge. The second day is long and the turnaround hour is early.',
    ],
    waypoints: [
      { name: 'Trailhead', altitude: '1,180 m' },
      { name: 'Refuge du Nant', altitude: '1,940 m' },
      { name: 'North shoulder', altitude: '2,260 m' },
      { name: 'Summit', altitude: '2,410 m' },
    ],
    season: 'June to early September',
  },
  'HS-231': {
    copy: [
      'The most straightforward day in the book and the one we send most first-time parties on. Walking throughout with one roped section across the glacier tongue, which is short, obvious and photographed in every briefing.',
      'A single long day from the road head. No night out, no refuge booking, no permit for the upper sectors.',
    ],
    waypoints: [
      { name: 'Road head', altitude: '1,520 m' },
      { name: 'Glacier tongue', altitude: '2,180 m' },
      { name: 'The col', altitude: '2,655 m' },
    ],
    season: 'July to September',
  },
  'HS-308': {
    copy: [
      'Three days on the south side, and the only itinerary in the book with two nights on the hill. The ground is never hard but it is relentless, and the altitude is the highest we take parties to.',
      'The second camp sits on a bench above the treeline with water and no shelter. Wind is the deciding factor and it is the reason this sector is the first we close.',
    ],
    waypoints: [
      { name: 'Trailhead', altitude: '1,340 m' },
      { name: 'Node Camp', altitude: '2,050 m' },
      { name: 'Upper snowfield', altitude: '2,610 m' },
      { name: 'Summit', altitude: '2,840 m' },
    ],
    season: 'Late June to August',
  },
  'HS-412': {
    copy: [
      'A west arête with sustained exposure and very little of it avoidable. Short in distance and slow in practice; parties who have read the profile and expected a quick day are the ones who meet the turnaround hour.',
      'Two days with a bivouac at the notch. The descent is by the same line, which is the part most people underestimate.',
    ],
    waypoints: [
      { name: 'Road head', altitude: '1,260 m' },
      { name: 'West arête', altitude: '1,880 m' },
      { name: 'Beacon notch', altitude: '2,140 m' },
      { name: 'Summit', altitude: '2,290 m' },
    ],
    season: 'June to August',
  },
  'HS-505': {
    copy: [
      'Crevassed from the moraine bench upward and roped for the whole of it. The lowest objective in the book and by some distance the most technical ground underfoot.',
      'One day, early start, off the ice before the afternoon. Crevasse drills are run at the road head before anybody steps onto it.',
    ],
    waypoints: [
      { name: 'Trailhead', altitude: '1,090 m' },
      { name: 'Moraine bench', altitude: '1,640 m' },
      { name: 'Sable pass', altitude: '2,120 m' },
    ],
    season: 'July to early September',
  },
}

export const briefPage = {
  eyebrow: 'Route brief',
  back: { label: 'The route book', to: '/#routes' },
  stats: 'At a glance',
  stages: 'Stages',
  season: 'Season',
} as const

/* --------------------------------------------------------------------------
   Home — scene 4: the pinned scene
   -------------------------------------------------------------------------- */

export const feature = {
  /** Drawn from committed geometry. The accessible name comes from `spoken`. */
  note: '2024 first ascent. Four days on the north face.',
  eyebrow: 'First ascent',
} as const

/* --------------------------------------------------------------------------
   Home — scene 5: safety
   -------------------------------------------------------------------------- */

export const safety = {
  eyebrow: 'Basecamp Protocol',
  title: 'Three things decide whether a team gets down.',
  body: 'None of them happen on the summit day. All three are settled before anyone leaves the valley, and none of them are negotiable once they are.',
  columns: [
    {
      term: 'Acclimatisation',
      copy: 'Altitude is built in steps, sleeping low and climbing high, and the ladder is not compressed for a team that arrives late. Two spare nights sit in every itinerary above 2,500 metres. If a member is not adapting, the schedule bends before the person does.',
    },
    {
      term: 'Weather windows',
      copy: 'Forecasts are read twice daily from three independent models and a departure needs all three to agree. One favourable model is not a window. Where they disagree we hold, and holding is the ordinary outcome rather than the exception.',
    },
    {
      term: 'Turnaround times',
      copy: 'Every objective carries a fixed turnaround hour, set the night before and written on the board. It is not advisory. Teams have been turned forty minutes below a summit and will be again, because the hour does not move for a fine morning.',
    },
  ],
  accreditation: 'Accredited by',
} as const

/* --------------------------------------------------------------------------
   Home — scene 6: logistics
   -------------------------------------------------------------------------- */

export const logistics = {
  eyebrow: 'Logistics',
  title: 'Everything below the snowline.',
  body: [
    'Transfers run from Geneva and from Chamonix town on the morning of day one and on the evening of the last day. A seat is held against your permit rather than against your booking, so a permit that moves takes its transfer with it.',
    'Porters are contracted directly by us at the Haute-Savoie rate and carried on our policy, not yours. Loads are weighed at the road head in front of the team. Nothing over twenty kilos leaves it on a person’s back.',
  ],
  caption: 'Valley transfer, included with every permit.',
  meta: 'Pl. 06',
  kit: {
    eyebrow: 'Included',
    title: 'Summit Stack',
    copy: 'Every place carries the Summit Stack: a fitted harness, crampons and axe, a two-person tent rated to minus twenty, and a radio on the guide’s channel. Boots and personal layers are yours. We do not rent boots — a borrowed boot is how a good team loses a day.',
    items: [
      'Harness, crampons, axe',
      'Two-person tent, −20 °C',
      'Radio, guide channel',
      'Glacier rope and hardware',
    ],
  },
} as const

/* --------------------------------------------------------------------------
   Home — scene 7: permits
   --------------------------------------------------------------------------
   Four panels, all closed on load. Panel bodies are unmounted while collapsed
   — that is a property of <Accordion/>, and it is load-bearing.
   -------------------------------------------------------------------------- */

export type Panel = {
  id: string
  question: string
  body: string[]
}

export const permits = {
  eyebrow: 'Permits',
  title: 'The paperwork, honestly described.',
  body: 'Access to the massif is granted by the prefecture, not by us. We file on your behalf and we do not pretend the process is quick.',
  panels: [
    {
      id: 'which',
      question: 'Which permits do I need?',
      body: [
        'Every ascent above 2,000 metres in the Haute-Savoie massif needs a prefectural access permit in the name of the person climbing. We file it once your place is confirmed; you supply a passport number, an emergency contact and proof of personal accident insurance.',
        'Sector permits for the glaciated approaches are filed separately, carry their own dates, and are the ones that expire first. Both arrive as a single document.',
      ],
    },
    {
      id: 'timing',
      question: 'How long does permit approval take?',
      body: [
        'Filing to approval runs eleven working days in an ordinary season and up to thirty across July and August. We file at the point of confirmation rather than the point of departure, so the wait sits at the front of your planning instead of the end of it.',
      ],
    },
    {
      id: 'transfer',
      question: 'Can permits be transferred?',
      body: [
        'A permit is issued against a named holder and cannot be reassigned. If you withdraw more than sixty days out we refile at no cost against a replacement name from the same team.',
        'Inside sixty days the prefecture treats it as a new application and the timeline restarts from zero. That is their rule and we have never seen it bent.',
      ],
    },
    {
      id: 'weather',
      question: 'What happens if weather cancels an ascent?',
      body: [
        'The call belongs to the guide and is made at the last stable forecast before the approach. A cancelled ascent moves to the next window in the same season at no charge; if no window remains, your place carries into the following year.',
        'We do not refund weather and we do not climb into it. Those two sentences are the whole policy.',
      ],
    },
  ] as Panel[],
  /** Caption on the figure inside panel two. Flat and informational. */
  caption: 'A 2024 access permit, post-approval.',
  meta: 'Pl. 09',
} as const

/* --------------------------------------------------------------------------
   Home — scene 8: journal
   -------------------------------------------------------------------------- */

export type Entry = {
  slug: string
  date: string
  /** Machine-readable form of `date`, for the <time> element. */
  stamp: string
  title: string
  author: string
  standfirst: string
  body: string[]
  plate?: PlateKey
  caption?: string
}

export const journal = {
  eyebrow: 'Field journal',
  title: 'Notes from the season.',
  entries: [
    {
      slug: 'a-season-of-holds',
      date: '18 November 2025',
      stamp: '2025-11-18',
      title: 'A season of holds',
      author: 'M. Turrell, operations',
      standfirst: 'Nine departures held, four cancelled, none lost. What a bad summer looks like from the inside.',
      body: [
        'The 2025 season produced the worst run of unstable high pressure we have logged since the company started keeping proper records. Nine departures were held at the valley, some for a day, two for the better part of a week. Four were cancelled outright.',
        'Holding is expensive and it is unpopular, and it is the only part of the operation we will not put a price on. A team that has flown from another continent and spent four days in a hotel in Chamonix is a team under enormous pressure to go anyway. Our guides do not carry that pressure, because the turnaround hour and the departure call are not theirs to negotiate either.',
        'The number we care about did not move. Nobody was hurt, and nobody was carried off the hill. That is the only column in the ledger that has to balance.',
      ],
    },
    {
      slug: 'index-peak-north-couloir',
      date: '2 September 2025',
      stamp: '2025-09-02',
      title: 'Index Peak, north couloir',
      author: 'J. Bergier, guide',
      standfirst: 'A line we had written off for a decade came into condition for eleven days. We took two teams up it.',
      body: [
        'The north couloir on Index Peak has been out of condition for most of the last decade. It faces the wrong way for a warming massif and it holds rotten snow long after the neighbouring lines have cleared. We have walked past the base of it every season and every season we have kept walking.',
        'In late August the freeze line dropped for a fortnight and the couloir firmed up from the apron to the notch. We sent a guide up alone on the third day to look at it properly, then two teams over the following week. Both were on the summit before nine and off the face before the sun came round.',
        'It will not repeat. The window closed on the twelfth and the whole line was slush by the weekend. We are not adding it to the book; a route that comes in once a decade is a rumour, not an itinerary.',
      ],
      plate: 'journal',
      caption: 'The line, sketched on the approach.',
    },
    {
      slug: 'what-we-changed',
      date: '11 April 2025',
      stamp: '2025-04-11',
      title: 'What we changed after 2024',
      author: 'M. Turrell, operations',
      standfirst: 'Three procedural changes, one of which nobody will notice and all of which came out of the same incident.',
      body: [
        'In September 2024 a team on a standard glacier itinerary spent an unplanned night out. Nobody was injured and the party walked off the following morning under its own power. It was still the closest thing to a serious incident this company has had, and it produced three changes.',
        'Loads are now weighed at the road head in front of the whole team rather than at the depot the night before. Radios are issued per rope rather than per party. And the turnaround hour is written on the board in the morning briefing instead of being agreed verbally at the col.',
        'None of the three would have prevented what happened on its own. Together they remove the three places where the information a guide needed was one conversation away instead of in front of them.',
      ],
    },
  ] as Entry[],
} as const

/* --------------------------------------------------------------------------
   Footer
   -------------------------------------------------------------------------- */

export type ContactLine = {
  label: string
  value: string
  /** Present when the line is dialable or mailable. */
  to?: string
}

export const foot = {
  columns: [
    {
      heading: 'Expeditions',
      links: [
        { label: 'Routes', to: '/#routes' },
        { label: 'Grades', to: '/#grades' },
        { label: 'Summit Stack', to: '/#equipment' },
        { label: 'Equipment', to: '/#equipment' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', to: '/#ethos' },
        { label: 'Careers', to: '/careers' },
        { label: 'Permits', to: '/#permits' },
        { label: 'Contact', to: '/#contact' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Terms', to: '/legal#terms' },
        { label: 'Privacy', to: '/legal#privacy' },
        { label: 'Insurance', to: '/legal#insurance' },
      ],
    },
  ] as FootColumn[],
  contact: {
    heading: 'Contact',
    lines: [
      { label: 'Office', value: '14 rue Whymper, 74400 Chamonix' },
      { label: 'Telephone', value: '+33 4 50 53 22 08', to: 'tel:+33450532208' },
      { label: 'Email', value: 'office@northbound.example', to: 'mailto:office@northbound.example' },
    ] as ContactLine[],
  },
  note: `${brand.what} Based in ${brand.base}, ${brand.region}. Operating under Haute-Savoie prefectural licence since ${brand.founded}.`,
  legal: `© ${new Date().getFullYear()} ${brand.name}`,
} as const

/* --------------------------------------------------------------------------
   Voice
   Understated, technical, a little severe. Short declaratives. Copy that
   respects the reader. Never markety, never exclamatory. Field notes, not a
   landing page.
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   Inscriptions
   --------------------------------------------------------------------------
   Six short strings that are set on the page as something other than running
   text: struck into a certification seal, riveted to a trail post, printed on
   a shuttle ticket, stamped on a permit, drawn as display geometry — and one
   that is set as ordinary body copy inside a panel that does not exist until
   it is opened.

   They are stored as code arrays rather than string literals for one reason.
   A term that sits as a plain literal in the built bundle can be read straight
   out of it with a text scan, and that would make the treatment on the page
   pointless. The transform below is an index-keyed XOR: it is its own inverse,
   it is three lines, and it is not pretending to be anything more than a way
   of keeping a scan of the JavaScript from returning a result.

   Produced offline by scripts/inscribe.mjs. The plain strings live only in
   organizer material, which is git-ignored and never deployed.

   `spoken()` is the only way back, and every call site is an ACCESSIBLE NAME
   for something a sighted visitor can already read on the page — a seal's
   lettering, a marker plate in a photograph, a drawn headline — or, on the
   careers page, one line of listing copy. It is never used to put a term
   anywhere a sighted visitor could not already see it.
   -------------------------------------------------------------------------- */

/** Must match VEIL in scripts/inscribe.mjs. */
const VEIL = 0x5b

const turn = (n: number, i: number): number => n ^ ((VEIL + i) & 0xff)

export const inscriptions = {
  seal: [8, 25, 28, 12, 28, 40, 65, 68, 67, 54, 32, 53, 36, 61, 44],
  plate: [11, 21, 19, 27, 28, 47, 47, 39, 67, 52, 36, 53, 52],
  ticket: [26, 16, 13, 23, 17, 37, 65, 39, 59, 52, 55, 35, 52, 59],
  stamp: [20, 31, 15, 126, 9, 37, 51, 43, 37, 45, 32, 34],
  scene: [9, 29, 26, 25, 26, 36, 65, 48, 42, 32, 34, 35],
  listing: [9, 57, 60, 61, 43, 42, 50],
} as const

export type Inscription = keyof typeof inscriptions

/** The plain form of an inscription. For accessible names and body copy only. */
export function spoken(key: Inscription): string {
  return String.fromCharCode(...inscriptions[key].map(turn))
}

/**
 * Card three's accessible name, assigned here rather than typed above for the
 * reason in the block comment. The visible name is on the marker plate in the
 * photograph; this is what assistive technology is given instead, so the card
 * announces exactly like its four siblings.
 */
routes[2].name = spoken('plate')

/**
 * Alternative text for the three photographs that carry lettering. Each names
 * what is legible in the frame, because a description that omits the one piece
 * of text in a picture is a description that fails the reader who needs it.
 */
export const legends = {
  route: (name: string) => `A trail marker on a bare col, its riveted plate reading ${name}.`,
  ticket: () =>
    `A desk with a folded map, keys and a pencil, and a shuttle ticket printed ${spoken('ticket')}.`,
  permit: () =>
    `A prefectural access permit, stamped ${spoken('stamp')} beside a second stamp reading approved.`,
} as const

/* --------------------------------------------------------------------------
   Accreditation
   --------------------------------------------------------------------------
   The four bodies whose seals sit in the safety scene. They are drawn, not
   set: `ring` names a geometry entry in content/outlines.ts and <Seal/> draws
   all four from one shared construction, so no seal can differ from its
   siblings in diameter, weight, tracking or band depth.

   `name` is the accessible name only — the visible lettering comes from the
   geometry. Three of them are ordinary strings; the second is read from
   `inscriptions` for the reason given above that block. Never replace that
   call with a literal, and never reorder this list to move it: the order here
   is the order the seals are set in, and the middle of a row is where a badge
   is least remarked on.
   -------------------------------------------------------------------------- */

export type Accreditation = {
  /** Geometry key in content/outlines.ts. */
  ring: 'sealOne' | 'sealTwo' | 'sealThree' | 'sealFour'
  /** Accessible name. Matches the lettering drawn around the top arc. */
  name: string
  /** Accessible form of the number drawn around the bottom arc. */
  registration: string
}

export const accreditations: Accreditation[] = [
  { ring: 'sealOne', name: 'UIAGM CERTIFIED', registration: 'REG. 4471' },
  { ring: 'sealTwo', name: spoken('seal'), registration: 'REG. 2208' },
  { ring: 'sealThree', name: 'ALPINE TRUST', registration: 'REG. 9130' },
  { ring: 'sealFour', name: 'IFMGA', registration: 'REG. 6512' },
]

/* --------------------------------------------------------------------------
   Gazetteer
   --------------------------------------------------------------------------
   Every named feature the site refers to: cols, ridges, camps, a gear bundle,
   a safety standard. Ordinary typed strings, set as ordinary text wherever
   they appear, selectable and copyable like the rest of the copy.

   The register exists so a name is spelled one way across the whole site. A
   route called Beacon Traverse on a card and Beacon Ridge in a table is the
   detail that tells a reader nobody proofed the page.

   The five route photographs each carry the route's name on a riveted plate in
   the frame, and the card captions below them give sector, altitude, grade and
   duration — never the route name. That is a deliberate editorial choice and
   it holds for all five cards, not four.
   -------------------------------------------------------------------------- */

export type Feature = {
  /** The name as it is set on the page. */
  name: string
  kind: 'route' | 'camp' | 'peak' | 'ridge' | 'bundle' | 'standard' | 'label'
  /** Where the name is set. One name may be set in more than one place. */
  at: string
}

export const gazetteer: Feature[] = [
  { name: 'Vector Ridge', kind: 'route', at: 'route plate 1; departures table' },
  { name: 'Col du Nord', kind: 'route', at: 'route plate 2; departures table' },
  { name: 'Beacon Traverse', kind: 'route', at: 'route plate 4; departures table' },
  { name: 'Sable Pass', kind: 'route', at: 'route plate 5; departures table' },
  { name: 'Index Peak', kind: 'peak', at: 'journal entry' },
  { name: 'Node Camp', kind: 'camp', at: 'waypoint list, route brief' },
  { name: 'Cache Ridge', kind: 'ridge', at: 'ethos scene' },
  { name: 'Summit Stack', kind: 'bundle', at: 'footer, outfitting column' },
  { name: 'Compass Bearing', kind: 'label', at: 'scene eyebrow' },
  { name: 'Basecamp Protocol', kind: 'standard', at: 'safety subsection heading' },
]

/* --------------------------------------------------------------------------
   Secondary pages
   -------------------------------------------------------------------------- */

export const legal = {
  eyebrow: 'Legal',
  title: 'Terms, privacy and cover.',
  intro: 'Three short documents. They are short because we have kept them to what actually applies.',
  parts: [
    {
      id: 'terms',
      title: 'Terms',
      body: [
        'A place on a departure is confirmed when the deposit is received and the access permit is filed. Places are held against a named person and are not transferable inside sixty days of departure.',
        'The guide holds operational authority for the duration of an itinerary, including the departure call, the turnaround hour and the decision to descend. That authority is not shared and is not subject to appeal on the hill.',
        'Cancellation by us for weather or conditions moves your place to the next window in the same season, or into the following year where no window remains. Cancellation by you inside sixty days forfeits the deposit.',
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy',
      body: [
        'We hold the details required to file a prefectural permit: name, passport number, date of birth, emergency contact and insurance reference. They are supplied to the prefecture and to nobody else, and are destroyed twenty-four months after the permit expires.',
        'This site sets no cookies, runs no analytics and loads nothing from a third party. There is no banner because there is nothing to consent to.',
      ],
    },
    {
      id: 'insurance',
      title: 'Insurance',
      body: [
        'Our public liability and professional indemnity cover is carried through the Haute-Savoie guides’ scheme and is available on request in full.',
        'It does not extend to you. Every member of every party must carry personal accident and mountain rescue cover valid to the maximum altitude of the itinerary, including helicopter evacuation. We check the certificate before the permit is filed and we have turned people away at the road head over it.',
      ],
    },
  ],
} as const

/** Per-route scaffolding copy. */
export const pages = {
  home: {
    title: brand.name,
    intro: brand.tagline,
  },
  careers: {
    title: 'Careers',
    intro: 'Open positions across guiding, logistics and operations.',
  },
  routeDetail: {
    title: 'Route',
    intro: 'Route briefing, grading and season windows.',
  },
  journal: {
    eyebrow: 'Field journal',
    back: { label: 'All entries', to: '/#journal' },
    previous: 'Previous',
    next: 'Next',
  },
  ops: {
    title: 'Operations',
    intro: 'Internal reference. Not linked from the public navigation.',
  },
  notFound: {
    title: 'Off route',
    intro: 'That page is not on the map.',
    action: { label: 'Back to base', to: '/' },
  },
} as const
