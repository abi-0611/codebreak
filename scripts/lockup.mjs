#!/usr/bin/env node
/**
 * Wordmark geometry generator — phase 2, task 2.4.
 *
 * Sets the house name in Funnel Display 300 and emits it as SVG <path> data,
 * so the header and footer lockups are DRAWN rather than typed. That is the
 * technique the reference itself ships for its own wordmark: a CSS
 * `mask-image` fed an inline SVG data-URI of outlined glyphs.
 *
 * Runs offline, on a workstation. Its output is committed. No font is fetched
 * at runtime and the browser never sees a glyph table.
 *
 * Reading the font is lib/glyphs.mjs's job — the same reader phase 5 uses for
 * plate and ring lettering. What is left here is layout: lay one line out on
 * the advance widths, flip it to y-down, normalise it into a viewBox.
 *
 * USAGE
 *
 *   node scripts/lockup.mjs
 *   node scripts/lockup.mjs --font _private/fonts/display-300.woff
 *
 * The font file lives in _private/, which is git-ignored, because a licensed
 * binary has no business in this repository. Re-fetch it with:
 *
 *   URL=$(curl -s -A "Mozilla/4.0" \
 *     "https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300" \
 *     | grep -o 'https://fonts.gstatic.com[^)]*')
 *   curl -s -o _private/fonts/display-300.woff "$URL"
 *
 * NEVER emit an SVG <text> element from here. Chrome's find-in-page matches
 * inline <text>, which would undo the entire technique.
 */
import { writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { face, run, toPath, bounds, round } from './lib/glyphs.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}

const FONT = flag('font', '_private/fonts/display-300.woff')
const OUT = 'app/content/lockup.ts'

/**
 * What gets drawn.
 *
 * `mark` is the full house name for the header and footer lockups. `short` is
 * the compact form the carousel overlays on a card header, where the full name
 * would be wider than the card.
 */
const LINES = [
  { key: 'mark', text: 'CROCARIA' },
  { key: 'short', text: 'CRC' },
]

/* -------------------------------------------------------------------------- */

const fontPath = new URL(FONT, `file://${root.replace(/\\/g, '/')}`)
if (!existsSync(fileURLToPath(fontPath))) {
  console.error(`\nNo font at ${FONT}.\n`)
  console.error('See the re-fetch recipe in the header of this file.\n')
  process.exit(1)
}

const display = face(fileURLToPath(fontPath))

/**
 * Turns a line into a viewBox and one path.
 *
 * Kerning is deliberately not applied — `run` sets on plain advance widths.
 * The reference tracks nothing and kerns nothing; a lockup that kerned would
 * be subtly narrower than everything else set in the same face on the page.
 *
 * The box is tightened onto the INK, not onto the em square. A wordmark boxed
 * on the em carries the font's descender space as invisible padding, so a
 * lockup set to `h-36` would paint at roughly three quarters of that and every
 * alignment against it would be off by an amount nobody can find.
 */
function draw(text) {
  const { commands } = run(display, text, { size: display.em })
  const box = bounds(commands)

  // The ink's top-left becomes the origin. `run` already hands back y-down.
  const place = (p) => ({ x: p.x - box.x0, y: p.y - box.y0 })

  return {
    box: [round(box.w), round(box.h)],
    d: toPath(commands, place),
  }
}

const drawn = LINES.map(({ key, text }) => {
  const out = draw(text)
  console.log(`  ${key.padEnd(6)} ${text.padEnd(10)} viewBox 0 0 ${out.box[0]} ${out.box[1]}  ${out.d.length} chars of path`)
  return [key, out]
})

const body = drawn
  .map(([key, { box, d }]) => `  ${key}: {\n    box: [${box[0]}, ${box[1]}],\n    d: '${d}',\n  },`)
  .join('\n')

const file = `/**
 * GENERATED — do not edit by hand.
 *
 *   node scripts/lockup.mjs
 *
 * The house wordmark, set in Funnel Display 300 and converted to SVG path
 * geometry offline. <Wordmark/> renders it as a CSS mask-image, which is the
 * technique the reference uses for its own lockup.
 *
 * \`box\` is [width, height] in user units, tightened onto the ink. \`d\` is one
 * path containing every contour of every glyph in the line.
 */
export const lockup = {
${body}
} as const

export type LockupKey = keyof typeof lockup
`

writeFileSync(new URL(OUT, `file://${root.replace(/\\/g, '/')}`), file)
console.log(`\nWrote ${OUT}\n`)
