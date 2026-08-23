#!/usr/bin/env node
/**
 * Contrast audit — WCAG 2.1 relative luminance for every pairing the build
 * actually ships.
 *
 * Two jobs.
 *
 * 1. Cross-check. tokens/palette.mjs is the definition site; the :root block
 *    in app/assets/css/main.css re-declares the same values so the stylesheet
 *    is self-documenting. Two records of one fact drift, so this script fails
 *    if they ever disagree.
 *
 * 2. Gate. Every pairing that carries text has to clear its bar, and one of
 *    them — the reference's own footer meta colour — does not. That finding is
 *    reported every run, with the substitution that answers it, so the
 *    deviation stays visible instead of quietly becoming a habit.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { palette } from '../tokens/palette.mjs'

const cssPath = fileURLToPath(new URL('../app/assets/css/main.css', import.meta.url))
const css = readFileSync(cssPath, 'utf8')

/* -------------------------------------------------------------------------- */
/* colour maths                                                               */
/* -------------------------------------------------------------------------- */

function channel(v) {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  )
}

function ratio(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/* -------------------------------------------------------------------------- */
/* 1. cross-check the two records of the palette                              */
/* -------------------------------------------------------------------------- */

const declared = new Map()
for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  declared.set(m[1], m[2].toUpperCase())
}

const drift = []
for (const [name, hex] of Object.entries(palette)) {
  const inCss = declared.get(name)
  if (!inCss) drift.push(`--color-${name} is missing from main.css`)
  else if (inCss !== hex.toUpperCase()) {
    drift.push(`--color-${name} is ${inCss} in main.css but ${hex} in tokens/palette.mjs`)
  }
}
for (const name of declared.keys()) {
  if (!(name in palette)) drift.push(`--color-${name} is in main.css but not in tokens/palette.mjs`)
}

/* -------------------------------------------------------------------------- */
/* 2. the pairings                                                            */
/* -------------------------------------------------------------------------- */

const hex = (name) => {
  const v = palette[name]
  if (!v) throw new Error(`Unknown token: ${name}`)
  return v
}

/**
 * `bar`  4.5  body copy, labels, captions, nav — anything read as text
 *        3.0  display type at 24px+, and non-text UI edges
 *        0    decorative: recorded, never gated
 *
 * `gate` false marks a pairing that is reported but does not fail the run:
 *        the recorded deviation, and the boundary case that documents where
 *        the substitute stops being approved.
 */
const PAIRS = [
  // Body copy on every ground it lands on. Teardown §4: body copy is always
  // cream. There is no grey in this palette.
  { fg: 'cream', bg: 'black', bar: 4.5, gate: true, note: 'body copy / page ground' },
  { fg: 'cream', bg: 'brown-darker', bar: 4.5, gate: true, note: 'body copy / alternating section' },
  { fg: 'cream', bg: 'brown-deepest', bar: 4.5, gate: true, note: 'body copy / card fill' },
  { fg: 'cream', bg: 'brown-dark', bar: 4.5, gate: true, note: 'body copy / open accordion panel' },
  { fg: 'cream', bg: 'brown', bar: 4.5, gate: true, note: 'body copy / mid rule fill' },

  // Gold is state, never a heading colour: active tab, open row, arrows, links.
  { fg: 'gold', bg: 'black', bar: 4.5, gate: true, note: 'accent / page ground' },
  { fg: 'gold', bg: 'brown-darker', bar: 4.5, gate: true, note: 'accent / alternating section' },
  { fg: 'gold', bg: 'brown-dark', bar: 4.5, gate: true, note: 'open accordion question / panel' },

  // Accents used as a fill with text on top.
  { fg: 'black', bg: 'white', bar: 4.5, gate: true, note: 'primary pill label / white fill' },
  { fg: 'black', bg: 'gold', bar: 4.5, gate: true, note: 'active tab + close button / gold fill' },

  // THE RECORDED DEVIATION. The reference sets its footer meta copy here.
  {
    fg: 'brown', bg: 'black', bar: 4.5, gate: false,
    note: 'REFERENCE footer meta as TEXT — fails AA, do not ship as copy',
  },
  // What we ship instead.
  { fg: 'brown-lifted', bg: 'black', bar: 4.5, gate: true, note: 'footer meta, substituted' },
  { fg: 'brown-lifted', bg: 'brown-darker', bar: 4.5, gate: true, note: 'meta copy / alternating section' },
  {
    fg: 'brown-lifted', bg: 'brown-deepest', bar: 4.5, gate: false,
    note: 'BOUNDARY — substitute not approved on card fill, use cream',
  },

  // Non-text edges. Recorded so a later phase cannot quietly promote one of
  // them to running text without this file noticing.
  { fg: 'brown-dark', bg: 'black', bar: 0, gate: false, note: 'hairline / page ground' },
  { fg: 'brown-dark', bg: 'brown-darker', bar: 0, gate: false, note: 'hairline / alternating section' },
  { fg: 'brown', bg: 'black', bar: 0, gate: false, note: 'mid rule / page ground' },
]

const rows = PAIRS.map((p) => {
  const value = ratio(hex(p.fg), hex(p.bg))
  return { ...p, value, pass: p.bar === 0 ? true : value >= p.bar }
})

/* -------------------------------------------------------------------------- */
/* report                                                                     */
/* -------------------------------------------------------------------------- */

console.log('Contrast audit — WCAG 2.1 · CROCARIA\n')

if (drift.length) {
  console.error('Palette records disagree:\n')
  for (const d of drift) console.error(`  ${d}`)
  console.error('\ntokens/palette.mjs and the :root block in app/assets/css/main.css')
  console.error('must carry the same values. Fix, then re-run.')
  process.exit(1)
}
console.log('  Palette cross-check: tokens/palette.mjs and main.css agree ' +
  `(${declared.size} tokens).\n`)

const width = Math.max(...rows.map((r) => `${r.fg} on ${r.bg}`.length))
for (const r of rows) {
  const label = r.bar === 0 ? 'NOTE' : r.pass ? 'PASS' : 'FAIL'
  const pair = `${r.fg} on ${r.bg}`.padEnd(width)
  const val = r.value.toFixed(2).padStart(5)
  const bar = r.bar === 0 ? 'decorative' : `needs ${r.bar.toFixed(1)}`
  console.log(`  ${label}  ${pair}  ${val}:1  (${bar})  ${r.note}`)
}

const gated = rows.filter((r) => r.gate)
const broken = gated.filter((r) => !r.pass)
console.log(`\n${gated.length - broken.length}/${gated.length} gated pairings clear their bar.`)

const deviation = rows.find((r) => r.fg === 'brown' && r.bg === 'black' && r.bar === 4.5)
console.log(
  '\nRecorded deviation (phase 1, task 1.6)\n' +
  `  brown ${palette.brown} on black measures ${deviation.value.toFixed(2)}:1 and fails AA\n` +
  '  for text. The reference uses it for footer meta copy. We keep it exactly\n' +
  '  as measured for rules, hairlines and other non-text edges, and lift any\n' +
  `  running text to brown-lifted ${palette['brown-lifted']}.\n` +
  '  Approved on black and on brown-darker. Not approved on brown-deepest.\n' +
  '  Carried into the sign-off in prompts/08-qa-and-audit.md.',
)

if (broken.length) {
  console.error('\nGated pairings below their bar:')
  for (const r of broken) console.error(`  ${r.fg} on ${r.bg} — ${r.value.toFixed(2)}:1`)
  process.exit(1)
}
