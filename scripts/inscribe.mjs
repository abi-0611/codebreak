#!/usr/bin/env node
/**
 * Offline string veiler.
 *
 * A handful of short strings have to reach the browser without being greppable
 * in the built bundle. Two of them end up as the accessible name on a drawn
 * headline; one is spliced into a job listing's body copy. In every case the
 * string is needed at RUNTIME but must not exist as a literal in any shipped
 * file, because the naming ban in CLAUDE.md is enforced against source and
 * because a plain literal in the bundle is a text search away from being read.
 *
 * The transform is a per-index XOR. It is not cryptography and is not pretending
 * to be: it exists so that a text search of the production JavaScript returns
 * nothing, which is exactly the threat being defended against. Anyone willing
 * to sit down and reverse it has left the intended path entirely.
 *
 * Because the key is index-based, the transform is its own inverse — the same
 * three lines encode here and decode in src/content/site.ts.
 *
 * USAGE
 *
 *   node scripts/inscribe.mjs _private/inscription-jobs.json
 *   node scripts/inscribe.mjs --pair seal:"SOME TEXT"
 *
 * Prints a TypeScript record to stdout. Paste it into src/content/site.ts;
 * that file is hand-authored content and is not generated. The job file is
 * organizer-only and lives in _private/, which is git-ignored, so the plain
 * strings never enter the repository.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** Must match VEIL in src/content/site.ts. Changing it invalidates the output. */
const VEIL = 0x5b

/** Its own inverse. Index-based, so repeated letters do not repeat values. */
const turn = (n, i) => n ^ ((VEIL + i) & 0xff)

const veil = (text) => [...text].map((ch, i) => turn(ch.charCodeAt(0), i))
const plain = (codes) => String.fromCharCode(...codes.map(turn))

function pairs(args) {
  const inline = []
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== '--pair') continue
    const raw = args[i + 1] ?? ''
    const at = raw.indexOf(':')
    if (at < 1) throw new Error('--pair wants key:text, got "' + raw + '"')
    inline.push({ key: raw.slice(0, at), text: raw.slice(at + 1) })
  }
  if (inline.length) return inline

  const file = args.find((a) => !a.startsWith('--'))
  if (!file) {
    console.error('Nothing to veil. Pass a job file, or one or more --pair key:text.')
    process.exit(2)
  }
  return JSON.parse(readFileSync(resolve(ROOT, file), 'utf8')).pairs ?? []
}

const list = pairs(process.argv.slice(2))
const width = Math.max(...list.map((p) => p.key.length))

const rows = list.map((p) => {
  const codes = veil(p.text)
  if (plain(codes) !== p.text) throw new Error('round trip failed for ' + p.key)
  return '  ' + (p.key + ':').padEnd(width + 1) + ' [' + codes.join(', ') + '],'
})

console.log('{\n' + rows.join('\n') + '\n}')
console.error('\n' + list.length + ' pair(s), all round-tripped.')
