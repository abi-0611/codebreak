#!/usr/bin/env node
/**
 * Naming audit — enforces rule 6 of CLAUDE.md, "no source leaks".
 *
 * No file name, directory name, or file CONTENT anywhere a participant can
 * reach may carry one of the six terms, or one of the words that would tell
 * them a hunt is happening at all. Participants can and do open the network
 * tab; an image called `assay-seal.webp` is a solved section.
 *
 * The ban is a SUBSTRING ban, case-insensitive, which is why ordinary English
 * trips it — see the substring-trap table in CLAUDE.md. `paragraph` contains
 * `rag`. `storage` contains `rag`. `expression` contains `express`.
 *
 * The exit code is the whole point: this gates a commit and a deploy.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

const BANNED = [
  'search', 'ocr', 'react-js', 'reactjs', 'express', 'pinecone', 'rag',
  'clue', 'puzzle', 'hunt', 'easter', 'secret', 'answer',
  // Kept last because it is the one token with a legitimate platform spelling
  // (see SOURCE_ALLOW). The bare word may never be an identifier we chose.
  'hidden',
]

/* ---------------------------------------------------------------------------
   WHAT GETS SCANNED

   Two profiles, because a hand-written component and a minified vendor chunk
   deserve different scepticism.

   `source` is everything we author. Nothing is forgiven except a few platform
   spellings that we did not choose and cannot rename.

   `build` is .output/public, which contains Vue, vue-router and Nitro. Those
   ship words like `storage`, `Fragment` and `location.search` that contain a
   banned substring and reveal precisely nothing. They are masked by name, one
   pattern at a time, each entry naming the dependency that forces it — never
   by relaxing the token list.
--------------------------------------------------------------------------- */

const SOURCE_TARGETS = [
  'app',
  'public',
  'tokens',
  'nuxt.config.ts',
  'tailwind.config.ts',
]

const BUILD_TARGETS = ['.output/public']

/** Never walked: organiser material, deps, dev caches, and this directory. */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.nuxt', '.nitro', '.cache', '.data',
  '_private', '_archive', 'prompts', 'scripts', 'dist',
])

const TEXT = /\.(m?[jt]sx?|vue|css|s?html?|json|svg|md|txt|map|webmanifest|xml)$/i

/**
 * Platform vocabulary we did not choose. Masked before scanning, so the
 * offsets survive but the text does not.
 */
const SOURCE_ALLOW = [
  { name: 'aria-hidden', rule: /aria-hidden/gi },
  { name: 'overflow-hidden utility', rule: /overflow-(?:[xy]-)?hidden/gi },
  { name: 'overflow:hidden', rule: /overflow(?:-[xy])?\s*:\s*["']?hidden["']?/gi },
  // Tailwind's display utility, with or without a variant prefix, and only as
  // a class token: `hidden`, `s:hidden`, `has-hover:hidden`.
  { name: 'hidden display utility', rule: /(?<=[\s"'`])(?:[a-z0-9:[\]/.-]+:)?hidden(?=[\s"'`])/gi },
]

/**
 * Additional masks for built output only.
 *
 * Every entry below was added after reading the hit it answers, and names the
 * dependency that forces it. Deciding one at a time, with a reason, is the
 * whole safety mechanism — a term we chose still fails, because none of these
 * patterns match a bare word.
 */
const BUILD_ALLOW = [
  ...SOURCE_ALLOW,

  // "rag"
  { name: 'navigator.userAgent (nuxt reload guard)', rule: /userAgent/g },
  { name: 'Web Storage API (unctx, nuxt reload guard)', rule: /(?:Async)?(?:local|session|Local|Session)?[Ss]torage/g },
  { name: 'Fragment vnode type (vue)', rule: /fragment/gi },
  { name: 'pointer drag events (vue runtime-dom attr table)', rule: /drag[a-z]*/gi },

  // "search" — every occurrence is URL parsing in ufo / vue-router.
  { name: 'URL query string API', rule: /(?:URLSearchParams|searchParams|\.search\b)/g },
  { name: 'URL parts object key (ufo)', rule: /\bsearch\s*:/g },
  { name: 'input[type=search] reset (tailwind preflight)', rule: /\[type=["']?search["']?\]|::?-webkit-search-[a-z-]+/gi },

  // "hidden"
  { name: 'Suspense hiddenContainer (vue)', rule: /hiddenContainer/g },
  { name: '.invisible utility definition', rule: /visibility\s*:\s*hidden/gi },
  { name: '[hidden] attribute reset (tailwind preflight)', rule: /\[hidden(?:=[a-z-]+)?\]/gi },
  { name: 'string literal in an attribute table', rule: /["',]hidden["',]/gi },
]

/**
 * Rule 1 techniques. A clue a sighted visitor cannot read is not a clue, and
 * these are the ways it usually happens by accident. Source only: the compiled
 * Tailwind sheet necessarily defines `.invisible`.
 *
 * Deliberately NOT here: `opacity: 0`. Every GSAP reveal in phase 3 starts
 * there and ends at 1, so flagging it would produce nothing but noise. Reveal
 * start states are audited visually in phase 8, which is the only place that
 * question can actually be answered.
 */
const DENY = [
  { name: 'visibility:hidden', rule: /visibility\s*:\s*hidden/gi },
  { name: 'font-size:0', rule: /font-size\s*:\s*0(?![.\d])/gi },
  { name: 'text-indent:-n', rule: /text-indent\s*:\s*-\s*\d/gi },
  { name: 'off-screen text', rule: /-9999(px|rem|em)/gi },
]

/** Blank out allowed spans so their offsets survive but their text does not. */
function mask(text, allow) {
  let out = text
  for (const { rule } of allow) {
    rule.lastIndex = 0
    out = out.replace(rule, (m) => ' '.repeat(m.length))
  }
  return out
}

/**
 * base64 payloads are opaque bytes, not names, and their alphabet throws false
 * positives constantly — the codec probe's MP4 happens to contain `rag`. So we
 * decode every payload and scan what is actually inside it, then blank the
 * encoded form. A term smuggled into a data URI is still caught; the alphabet
 * noise is not.
 */
const B64 = /base64,\s*([A-Za-z0-9+/=]{16,})/g

function scanB64(text, where, line, hits) {
  B64.lastIndex = 0
  let m
  while ((m = B64.exec(text)) !== null) {
    let decoded = ''
    try {
      decoded = Buffer.from(m[1], 'base64').toString('latin1').toLowerCase()
    } catch {
      continue
    }
    for (const token of BANNED) {
      if (decoded.includes(token)) {
        hits.push({
          where, line, token,
          kind: 'base64',
          text: 'inside a decoded base64 payload',
        })
      }
    }
  }
  return text.replace(B64, (whole, payload) => 'base64,' + ' '.repeat(payload.length))
}

/** Quote a match with 44 characters of context either side. */
function excerpt(raw, at, length) {
  const pad = 44
  const from = Math.max(0, at - pad)
  const to = Math.min(raw.length, at + length + pad)
  return (
    (from > 0 ? '…' : '') +
    raw.slice(from, to).replace(/\s+/g, ' ') +
    (to < raw.length ? '…' : '')
  )
}

function walk(entry, out = []) {
  let info
  try {
    info = statSync(entry)
  } catch {
    return out
  }
  if (info.isDirectory()) {
    for (const name of readdirSync(entry)) {
      if (SKIP_DIRS.has(name)) continue
      walk(join(entry, name), out)
    }
  } else {
    out.push(entry)
  }
  return out
}

function scan(targets, { allow, deny, profile }) {
  const hits = []
  let count = 0

  for (const target of targets) {
    const abs = join(root, target)
    if (!existsSync(abs)) continue

    for (const file of walk(abs)) {
      count++
      const rel = relative(root, file).split(sep).join('/')

      // 1. The path itself: every directory name, every file name. Never
      //    masked — we chose every one of these strings.
      const low = rel.toLowerCase()
      for (const token of BANNED) {
        if (low.includes(token)) {
          hits.push({ where: rel, line: 0, token, kind: 'path', text: rel })
        }
      }

      if (!TEXT.test(rel)) continue

      // 2. File contents, line by line.
      //    Copy files are scanned raw: nothing in app/content/ has any business
      //    containing a Tailwind class, so no mask applies there and a bare
      //    `hidden` in a sentence is a finding, not a false positive.
      const isCopy = rel.startsWith('app/content/')
      const activeAllow = isCopy ? [] : allow

      const lines = readFileSync(file, 'utf8').split(/\r?\n/)
      lines.forEach((raw, i) => {
        const line = i + 1

        if (deny) {
          for (const { rule, name } of deny) {
            rule.lastIndex = 0
            if (rule.test(raw)) {
              hits.push({ where: rel, line, token: name, kind: 'rule-1', text: raw.trim() })
            }
          }
        }

        const stripped = scanB64(raw, rel, line, hits)
        const body = mask(stripped, activeAllow).toLowerCase()
        for (const token of BANNED) {
          const at = body.indexOf(token)
          if (at === -1) continue
          // Masking preserves offsets, so `at` indexes straight into the raw
          // line. Built files are one long line; quoting the match with a
          // little context either side is the only readable way to report it.
          hits.push({ where: rel, line, token, kind: 'content', text: excerpt(raw, at, token.length) })
        }
      })
    }
  }

  return { hits, count, profile }
}

function render({ hits, count, profile }) {
  if (!hits.length) {
    console.log(`  ${profile.padEnd(6)} clean — ${count} file(s) scanned.`)
    return 0
  }
  console.error(`  ${profile.padEnd(6)} ${hits.length} hit(s) across ${count} file(s):`)
  for (const h of hits) {
    const at = h.line ? `${h.where}:${h.line}` : h.where
    console.error(`    [${h.token}] ${h.kind.padEnd(7)} ${at}`)
    if (h.kind === 'content' || h.kind === 'rule-1') {
      console.error(`              ${h.text.slice(0, 110)}`)
    }
  }
  return hits.length
}

console.log('Naming audit — CROCARIA\n')

let failures = 0
failures += render(scan(SOURCE_TARGETS, { allow: SOURCE_ALLOW, deny: DENY, profile: 'source' }))

if (BUILD_TARGETS.some((t) => existsSync(join(root, t)))) {
  failures += render(scan(BUILD_TARGETS, { allow: BUILD_ALLOW, deny: null, profile: 'build' }))
} else {
  console.log('  build  not present — run `npm run generate` before signing off a phase.')
}

if (failures) {
  console.error('\nSee the "Naming ban" section of CLAUDE.md.')
  process.exit(1)
}
console.log('\nClean.')
