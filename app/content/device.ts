/**
 * GENERATED — do not edit by hand.
 *
 *   node scripts/mark.mjs
 *
 * The house mark: a heraldic crocus device, three stigmas over a stylised
 * corm, drawn in scripts/lib/device.mjs and normalised onto its own ink here.
 *
 * `box` is [width, height] in user units. `d` is TWO closed contours wound
 * against each other — the silhouette first, the counter second. That order is
 * a contract: app/composables/scenes/mark.ts takes the first run as the face
 * and every run after it as a void, so reversing them would extrude a bar
 * floating in space.
 *
 * <Sigil/> paints it as a mask-image under fill-rule: nonzero, where the
 * opposed winding is what makes the counter a hole rather than more metal.
 */
export const device = {
  box: [518.8, 861],
  d: 'M166.5 580.4Q153.6 493.6 121.3 371.4Q39.5 215.7 14.3 166.7Q0 125.1 22.1 115Q35.3 106.8 53.3 107.8Q79.9 106.6 105.9 145.5Q127.2 195.5 173.9 359.3Q217.9 478.8 248.3 561.6Q232.9 583 217.4 571Q226.4 469.1 232.4 322Q214.4 123.9 212.4 61.6Q218.4 10.7 243.4 5Q259.4 0 275.4 5Q300.4 10.7 306.4 61.6Q304.4 123.9 286.4 322Q292.4 469.1 301.4 571Q285.9 583 270.5 561.6Q300.9 478.8 344.9 359.3Q391.6 195.5 412.9 145.5Q438.9 106.6 465.5 107.8Q483.5 106.8 496.7 115Q518.8 125.1 504.5 166.7Q479.3 215.7 397.5 371.4Q365.2 493.6 352.3 580.4L329.4 571Q391.4 643 391.4 711Q391.4 861 291.4 861L227.4 861Q127.4 861 127.4 711Q127.4 643 189.4 571L166.5 580.4ZM343.4 692L175.4 692Q151.4 716 175.4 740L343.4 740Q367.4 716 343.4 692Z',
} as const
