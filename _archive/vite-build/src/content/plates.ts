/**
 * GENERATED — do not edit by hand.
 *
 * Produced by scripts/plates.mjs alongside the files in public/img. Every
 * image the site ships is described here: its stem, its intrinsic size and the
 * widths that actually exist on disk.
 *
 * It is generated rather than typed so that the two cannot drift. An intrinsic
 * height transcribed by hand and then quietly wrong is a layout shift under a
 * reader mid-sentence, and a srcset naming a width nobody emitted is a broken
 * image that only shows up on somebody else's screen density.
 */

export type Plate = {
  /** Path stem under /img. A width and .webp are appended. */
  stem: string
  /** Intrinsic size of the largest variant, for width/height attributes. */
  width: number
  height: number
  /** Widths on disk, ascending. Feeds the srcset. */
  widths: number[]
}

export const plates = {
  hero: { stem: 'hero-01', width: 2400, height: 1600, widths: [1200, 2400] },
  ethos: { stem: 'ethos-01', width: 1800, height: 1200, widths: [900, 1800] },
  routeOne: { stem: 'route-01', width: 1200, height: 1500, widths: [600, 1200] },
  routeTwo: { stem: 'route-02', width: 1200, height: 1500, widths: [600, 1200] },
  routeThree: { stem: 'route-03', width: 1200, height: 1500, widths: [600, 1200] },
  routeFour: { stem: 'route-04', width: 1200, height: 1500, widths: [600, 1200] },
  routeFive: { stem: 'route-05', width: 1200, height: 1500, widths: [600, 1200] },
  ridge: { stem: 'ridge-01', width: 2400, height: 1600, widths: [1200, 2400] },
  logistics: { stem: 'logistics-01', width: 1600, height: 1200, widths: [800, 1600] },
  permit: { stem: 'permit-01', width: 1400, height: 1800, widths: [700, 1400] },
  journal: { stem: 'journal-01', width: 1200, height: 800, widths: [600, 1200] },
} as const satisfies Record<string, Plate>

/** The five route cards, in the order they are set. */
export const routeSet: Plate[] = [plates.routeOne, plates.routeTwo, plates.routeThree, plates.routeFour, plates.routeFive]
