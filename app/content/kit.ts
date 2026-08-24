/**
 * GENERATED — do not edit by hand.
 *
 *   node scripts/kit.mjs
 *
 * The archives `/house` offers, with the size each one actually is on disk.
 *
 * The byte count is here rather than in the page's copy for the same reason
 * <Plate/> reads its dimensions from a manifest: a file size written by hand is
 * true on the day it is typed and a lie the next time the archive is rebuilt,
 * and nothing anywhere reports it. A label that says 41 KB beside a 63 KB file
 * is a small lie, but it is the kind a reader catches.
 *
 * `holds` is what is inside, in the order the archive lists it.
 */
export type Bundle = {
  readonly file: string
  readonly bytes: number
  readonly holds: readonly string[]
}

export const kit = {
  mark: {
    file: '/dl/crocaria-mark.zip',
    bytes: 91606,
    holds: ['mark.svg', 'mark-512.png', 'mark-1024.png', 'mark-on-black-1024.png', 'NOTICE.txt'],
  },
  wordmark: {
    file: '/dl/crocaria-wordmark.zip',
    bytes: 47900,
    holds: ['wordmark.svg', 'wordmark-2400.png', 'wordmark-short.svg', 'NOTICE.txt'],
  },
  house: {
    file: '/dl/crocaria-house.zip',
    bytes: 139225,
    holds: ['mark.svg', 'mark-512.png', 'mark-1024.png', 'mark-on-black-1024.png', 'wordmark.svg', 'wordmark-2400.png', 'wordmark-short.svg', 'PALETTE.txt', 'NOTICE.txt'],
  },
} as const satisfies Record<string, Bundle>

export type BundleKey = keyof typeof kit

/**
 * A byte count as the house would print it.
 *
 * One decimal below a megabyte and one above, which is what a file manager
 * shows — a label that reads "43,214 bytes" is accurate and tells a buyer
 * nothing they were asking.
 */
export const weigh = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
