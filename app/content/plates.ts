/**
 * GENERATED — do not edit by hand.
 *
 *   node scripts/plates.mjs
 *
 * Every image the site ships, with the intrinsic size it actually has on disk
 * and the widths it was encoded at. <Plate/> reads dimensions from here, so a
 * width/height attribute can never drift from the file — which is what stops
 * artwork arriving from shifting the layout under a reader mid-scroll.
 *
 * `w` and `h` are the intrinsic pixels of the largest encoding. `src` is that
 * encoding; `srcset` offers the smaller one to a narrow viewport.
 *
 * Stems are NEUTRAL AND NON-DESCRIPTIVE, and that is a requirement rather than
 * a habit: a participant can read every filename in the network tab, and a
 * file that says what it contains is a solved section.
 */
export type Plate = {
  readonly w: number
  readonly h: number
  readonly src: string
  readonly srcset: string
}

export const plates = {
  'dial-02': {
    w: 1024,
    h: 1024,
    src: '/img/dial-02-1024.webp',
    srcset: '/img/dial-02-1024.webp 1024w',
  },
  'frame-11': {
    w: 1200,
    h: 1500,
    src: '/img/frame-11-1200.webp',
    srcset: '/img/frame-11-600.webp 600w, /img/frame-11-1200.webp 1200w',
  },
  'frame-12': {
    w: 1200,
    h: 1500,
    src: '/img/frame-12-1200.webp',
    srcset: '/img/frame-12-600.webp 600w, /img/frame-12-1200.webp 1200w',
  },
  'frame-13': {
    w: 1200,
    h: 1500,
    src: '/img/frame-13-1200.webp',
    srcset: '/img/frame-13-600.webp 600w, /img/frame-13-1200.webp 1200w',
  },
  'frame-14': {
    w: 1200,
    h: 1500,
    src: '/img/frame-14-1200.webp',
    srcset: '/img/frame-14-600.webp 600w, /img/frame-14-1200.webp 1200w',
  },
  'frame-21': {
    w: 1400,
    h: 1150,
    src: '/img/frame-21-1400.webp',
    srcset: '/img/frame-21-700.webp 700w, /img/frame-21-1400.webp 1400w',
  },
  'plate-06': {
    w: 1100,
    h: 1500,
    src: '/img/plate-06-1100.webp',
    srcset: '/img/plate-06-550.webp 550w, /img/plate-06-1100.webp 1100w',
  },
  'room-01': {
    w: 760,
    h: 1010,
    src: '/img/room-01-760.webp',
    srcset: '/img/room-01-380.webp 380w, /img/room-01-760.webp 760w',
  },
  'room-02': {
    w: 760,
    h: 1010,
    src: '/img/room-02-760.webp',
    srcset: '/img/room-02-380.webp 380w, /img/room-02-760.webp 760w',
  },
  'room-03': {
    w: 760,
    h: 1010,
    src: '/img/room-03-760.webp',
    srcset: '/img/room-03-380.webp 380w, /img/room-03-760.webp 760w',
  },
  'room-04': {
    w: 760,
    h: 1010,
    src: '/img/room-04-760.webp',
    srcset: '/img/room-04-380.webp 380w, /img/room-04-760.webp 760w',
  },
  'room-05': {
    w: 760,
    h: 1010,
    src: '/img/room-05-760.webp',
    srcset: '/img/room-05-380.webp 380w, /img/room-05-760.webp 760w',
  },
  'room-06': {
    w: 760,
    h: 1010,
    src: '/img/room-06-760.webp',
    srcset: '/img/room-06-380.webp 380w, /img/room-06-760.webp 760w',
  },
  'stamp-01': {
    w: 512,
    h: 512,
    src: '/img/stamp-01-512.webp',
    srcset: '/img/stamp-01-256.webp 256w, /img/stamp-01-512.webp 512w',
  },
  'stamp-03': {
    w: 1100,
    h: 740,
    src: '/img/stamp-03-1100.webp',
    srcset: '/img/stamp-03-550.webp 550w, /img/stamp-03-1100.webp 1100w',
  },
  'still-01': {
    w: 900,
    h: 1200,
    src: '/img/still-01-900.webp',
    srcset: '/img/still-01-450.webp 450w, /img/still-01-900.webp 900w',
  },
  'still-02': {
    w: 750,
    h: 750,
    src: '/img/still-02-750.webp',
    srcset: '/img/still-02-375.webp 375w, /img/still-02-750.webp 750w',
  },
  'still-03': {
    w: 750,
    h: 750,
    src: '/img/still-03-750.webp',
    srcset: '/img/still-03-375.webp 375w, /img/still-03-750.webp 750w',
  },
  'tile-01': {
    w: 620,
    h: 620,
    src: '/img/tile-01-620.webp',
    srcset: '/img/tile-01-310.webp 310w, /img/tile-01-620.webp 620w',
  },
  'tile-02': {
    w: 620,
    h: 620,
    src: '/img/tile-02-620.webp',
    srcset: '/img/tile-02-310.webp 310w, /img/tile-02-620.webp 620w',
  },
  'tile-03': {
    w: 620,
    h: 620,
    src: '/img/tile-03-620.webp',
    srcset: '/img/tile-03-310.webp 310w, /img/tile-03-620.webp 620w',
  },
  'tile-04': {
    w: 620,
    h: 620,
    src: '/img/tile-04-620.webp',
    srcset: '/img/tile-04-310.webp 310w, /img/tile-04-620.webp 620w',
  },
} as const satisfies Record<string, Plate>

export type PlateKey = keyof typeof plates
