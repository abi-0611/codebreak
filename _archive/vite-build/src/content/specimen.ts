/**
 * Copy for the /style specimen. Kept out of site.ts because none of it is
 * public — the specimen route is registered only in development.
 */

export const swatches = {
  base: [
    { token: '--ink', label: 'Ink', use: 'All body copy on light grounds.' },
    { token: '--bone', label: 'Bone', use: 'The default page ground.' },
    { token: '--moss', label: 'Moss', use: 'Primary brand. Fills and the CTA.' },
    { token: '--lichen', label: 'Lichen', use: 'Muted accent. Dark grounds only.' },
    { token: '--stone', label: 'Stone', use: 'Secondary copy on light grounds.' },
    { token: '--haze', label: 'Haze', use: 'Secondary copy on dark grounds.' },
    { token: '--ember', label: 'Ember', use: 'One scene, site-wide. Nowhere else.' },
  ],
  scenes: [
    { token: '--scene-approach', label: 'Approach', use: 'Pale sage. Hero.' },
    { token: '--scene-ascent', label: 'Ascent', use: 'Cold sky. Ethos.' },
    { token: '--scene-ridge', label: 'Ridge', use: 'Near-black. The pinned scene.' },
    { token: '--scene-camp', label: 'Camp', use: 'Bone. Routes, safety, logistics.' },
    { token: '--scene-dusk', label: 'Dusk', use: 'Warm dark. Permits and footer.' },
  ],
} as const

/** Every pairing that ships, and the bar it has to clear. */
export const pairings: { fg: string; bg: string; min: number; note: string }[] = [
  { fg: '--ink', bg: '--bone', min: 4.5, note: 'body / bone' },
  { fg: '--ink', bg: '--scene-approach', min: 4.5, note: 'body / hero' },
  { fg: '--ink', bg: '--scene-ascent', min: 4.5, note: 'body / ethos' },
  { fg: '--ink', bg: '--scene-camp', min: 4.5, note: 'body / camp' },
  { fg: '--stone', bg: '--bone', min: 4.5, note: 'secondary / bone' },
  { fg: '--stone', bg: '--scene-approach', min: 4.5, note: 'secondary / hero' },
  { fg: '--stone', bg: '--scene-ascent', min: 4.5, note: 'secondary / ethos' },
  { fg: '--stone', bg: '--scene-camp', min: 4.5, note: 'secondary / camp' },
  { fg: '--bone', bg: '--scene-ridge', min: 4.5, note: 'body / ridge' },
  { fg: '--bone', bg: '--scene-dusk', min: 4.5, note: 'body / dusk' },
  { fg: '--bone', bg: '--moss', min: 4.5, note: 'body / moss fill' },
  { fg: '--haze', bg: '--scene-ridge', min: 4.5, note: 'secondary / ridge' },
  { fg: '--haze', bg: '--scene-dusk', min: 4.5, note: 'secondary / dusk' },
  { fg: '--haze', bg: '--moss', min: 4.5, note: 'secondary / moss fill' },
  { fg: '--lichen', bg: '--scene-ridge', min: 4.5, note: 'accent / ridge' },
  { fg: '--lichen', bg: '--scene-dusk', min: 4.5, note: 'accent / dusk' },
  { fg: '--ember', bg: '--bone', min: 4.5, note: 'ember / bone' },
  { fg: '--ember', bg: '--scene-camp', min: 4.5, note: 'ember / camp' },
  { fg: '--moss', bg: '--bone', min: 4.5, note: 'moss type / bone' },
  { fg: '--moss', bg: '--scene-approach', min: 4.5, note: 'moss type / hero' },
  { fg: '--moss', bg: '--scene-ascent', min: 4.5, note: 'moss type / ethos' },
  { fg: '--ink', bg: '--lichen', min: 4.5, note: 'ink type / lichen fill' },
  { fg: '--bone', bg: '--ember', min: 4.5, note: 'bone type / ember fill' },
]

export const steps = [
  { cls: 'type-display', token: '--step-display', label: 'Display', note: 'Scene headlines only.' },
  { cls: 'type-title', token: '--step-title', label: 'Title', note: 'Sub-headlines, card names.' },
  { cls: 'type-lead', token: '--step-lead', label: 'Lead', note: 'One opening statement per scene.' },
  { cls: 'type-body', token: '--step-body', label: 'Body', note: 'Running copy at a 38ch measure.' },
  { cls: 'type-small', token: '--step-small', label: 'Small', note: 'Captions, table cells, footnotes.' },
  { cls: 'type-label', token: '--step-label', label: 'Label', note: 'Eyebrows, meta, seal text.' },
] as const

export const sample = {
  headline: 'The mountain does not negotiate',
  copy: 'Weather windows on the north side open twice a season and close without warning. We hold two contingency days on every itinerary and we use them. A team that turns around at the col has not failed; it has read the mountain correctly and will be on the summit next season.',
  short: 'We hold two contingency days on every itinerary and we use them.',
}

/** Five cards, so the carousel is exercised at its real length. */
export const cards = [
  { id: 'c1', label: 'Traverse one', name: 'Traverse One', metric: '3,120 m', grade: 'Technical' },
  { id: 'c2', label: 'Traverse two', name: 'Traverse Two', metric: '2,650 m', grade: 'Alpine' },
  { id: 'c3', label: 'Traverse three', name: 'Traverse Three', metric: '2,840 m', grade: 'Alpine' },
  { id: 'c4', label: 'Traverse four', name: 'Traverse Four', metric: '3,410 m', grade: 'Technical' },
  { id: 'c5', label: 'Traverse five', name: 'Traverse Five', metric: '2,300 m', grade: 'Glacier' },
] as const

export const panels = [
  {
    id: 'p1',
    question: 'What is included in an outfitting package?',
    body: 'Permits, valley transfer, hut bookings, technical group equipment and a guide ratio of one to two on technical ground. Personal equipment is yours to bring; a checklist is issued at booking.',
  },
  {
    id: 'p2',
    question: 'How long does approval take?',
    body: 'Between nine and twenty working days, depending on the prefecture and the season. Applications filed after the first of June are processed in the order they arrive and we do not expedite them.',
  },
  {
    id: 'p3',
    question: 'What happens if the weather closes?',
    body: 'Two contingency days are held on every itinerary. If both are spent, the attempt ends. There is no partial refund for weather; the deposit carries to the following season instead.',
  },
  {
    id: 'p4',
    question: 'Do you accept independent parties?',
    body: 'Yes, for logistics and permits only. Independent parties are not guided and are not covered by our insurance on technical ground.',
  },
] as const

/** Copy for the drawn-type block. Kept out of the component, like all copy. */
export const drawn = {
  note: 'Display type can be set from committed path geometry instead of characters. The line below is one <svg role="img"> holding nothing but <path> elements, so the block contributes no text to the document at all — the counter under it is measured live from the DOM, not written here. The accessible name carries the words for screen readers.',
  caveat: 'The cost is real: geometry cannot be selected, copied, or translated by the browser, and it does not reflow at large text settings. That is why it is reserved for display headlines and never used for running copy.',
} as const

/** Copy for the seal block. */
export const rings = {
  note: 'The same technique set around a circle. Each glyph is rotated rigidly about the ring centre rather than bent through it, so the letterforms stay exactly as drawn instead of shearing. All four seals were produced in one run from one set of constants — one diameter, one em, one tracking, one band — and the circles and dots are drawn from those same numbers. Nothing about a seal is derived from its own text except how far around the ring it reaches.',
  caveat: 'That uniformity is the point. A row of badges where one differs by a stroke weight or a hair of diameter reads as the odd one out on sight, whatever it happens to say.',
} as const

export const ticker = [
  'Chamonix',
  'Haute-Savoie',
  'Est. 2011',
  'Guided ascents',
  'Permits',
  'Logistics',
  'Hut bookings',
  'Valley transfer',
]
