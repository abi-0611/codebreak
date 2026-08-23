#!/usr/bin/env node
/**
 * Placement register audit — enforces prompts/04-clue-architecture.md.
 *
 * Phase 4 is the phase the project exists for, and it is entirely judgement:
 * six strings, six surfaces, sixteen decoys, and a set of camouflage rules that
 * a person can talk themselves out of one commit at a time. This script is what
 * stops that. It reads the register in _private/, grades it against the rules
 * that CAN be checked by machine, and writes _private/KEY.md from the same data
 * the generators read — so the key cannot drift from what actually shipped.
 *
 *   node scripts/register.mjs             grade, report, write the key
 *   node scripts/register.mjs --sealed    also fail on anything still pending
 *
 * `--sealed` is phase 8's invocation. Until phases 5-7 have run, the measured
 * cap heights are null and most of the copy that carries a decoy has not been
 * written; without the flag those are reported as PENDING and do not fail.
 *
 * THIS FILE CONTAINS NO TERM LITERALS. Every string it grades comes from
 * _private/, which is git-ignored. scripts/ is skipped by audit:names, so the
 * discipline here is a choice rather than something enforced — which is exactly
 * why it is written down.
 *
 * WHAT IT CANNOT CHECK, and who does:
 *
 *   cap height at 375px          phase 5's generators, which print it and exit
 *                                non-zero under 7px
 *   luminance of a plate in its  phase 8, audit D, by eye against a rendered
 *   own frame                    section — there is no number for "reads only
 *                                when looked at"
 *   whether a decoy sounds       a person. `native` is a required field so the
 *   planted                      claim has to be made in words.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const vault = join(root, '_private')
const built = join(root, '.output', 'public')
const sealed = process.argv.includes('--sealed')

/**
 * Words that would tell a participant a hunt is happening at all. They may not
 * appear in a carrier, an accessible name, or a decoy — rule 3. The six terms
 * are NOT listed here; they arrive from the register.
 */
const TELLS = ['clue', 'puzzle', 'hunt', 'easter', 'secret', 'answer', 'hidden']

const findings = []
const pending = []
const notes = []

const fail = (rule, text) => findings.push({ rule, text })
const wait = (rule, text) => pending.push({ rule, text })

/* -------------------------------------------------------------------------- */
/* loading                                                                    */
/* -------------------------------------------------------------------------- */

if (!existsSync(vault)) {
  console.log('Placement register — CROCARIA\n')
  console.log('  _private/ not present — organiser-only audit skipped.')
  console.log('  This is expected on a machine that is not the organiser\'s.')
  process.exit(0)
}

const load = (name) => {
  const at = join(vault, name)
  if (!existsSync(at)) {
    console.error(`Placement register — CROCARIA\n\n  _private/${name} is missing.`)
    process.exit(1)
  }
  try {
    return JSON.parse(readFileSync(at, 'utf8'))
  } catch (err) {
    console.error(`Placement register — CROCARIA\n\n  _private/${name} does not parse: ${err.message}`)
    process.exit(1)
  }
}

const register = load('placements.json')
const decoyBook = load('decoys.json')
const jobs = {
  'plate-jobs.json': load('plate-jobs.json'),
  'type-jobs.json': load('type-jobs.json'),
}

const placements = register.placements ?? []
const decoys = decoyBook.decoys ?? []
const terms = placements.map((p) => p.term)

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Lowercase, strip everything that is not a letter or a digit. */
const flat = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '')

/** What Ctrl+F does: a plain, case-insensitive substring of the rendered text. */
const reads = (haystack, needle) => haystack.toLowerCase().includes(String(needle).toLowerCase())

/** Walk a dotted path into a parsed job file. Returns undefined on a miss. */
function at(root, path) {
  return String(path)
    .split('.')
    .reduce((node, key) => (node == null ? undefined : node[key]), root)
}

/** Every string anywhere inside a parsed job file, for presence checks. */
function strings(node, out = []) {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node)) for (const item of node) strings(item, out)
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      // `_note`, `_set`, `_ring` and friends are prose about the job, not part
      // of it. A carrier that only appears in a comment is not produced.
      if (key.startsWith('_')) continue
      strings(value, out)
    }
  }
  return out
}

const jobStrings = Object.fromEntries(
  Object.entries(jobs).map(([name, body]) => [name, strings(body)]),
)

const allJobStrings = Object.values(jobStrings).flat()

/** The section list for a route, from the register. */
const sectionsOf = (route) => register.sections?.[route] ?? []

/* -------------------------------------------------------------------------- */
/* R — the register                                                           */
/* -------------------------------------------------------------------------- */

// R1 — six, and no term twice.
if (placements.length !== 6) {
  fail('R1', `${placements.length} placement(s) registered; the event needs exactly six.`)
}
{
  const seen = new Map()
  for (const p of placements) {
    const key = flat(p.term)
    if (seen.has(key)) fail('R1', `two placements carry the same term: ${seen.get(key)} and ${p.id}.`)
    seen.set(key, p.id)
  }
}

// R2 — technique mix is not monotone.
{
  const kinds = new Set()
  for (const p of placements) {
    if (!['A', 'B', 'C'].includes(p.technique)) {
      fail('R2', `${p.id}: technique "${p.technique}" is not one of the three sanctioned techniques.`)
    }
    kinds.add(p.technique)
  }
  for (const kind of ['A', 'B', 'C']) {
    if (!kinds.has(kind)) fail('R2', `no placement uses technique ${kind}; the mix must not be monotone.`)
  }
}

// R3 — one per section, six different surface types.
{
  const seats = new Map()
  const skins = new Map()
  for (const p of placements) {
    const seat = `${p.route}#${p.section ?? '*'}`
    if (seats.has(seat)) fail('R3', `${p.id} and ${seats.get(seat)} both sit at ${seat}; no section carries two.`)
    seats.set(seat, p.id)

    if (skins.has(p.surface)) {
      fail('R3', `${p.id} and ${skins.get(p.surface)} share the surface type "${p.surface}"; all six must differ.`)
    }
    skins.set(p.surface, p.id)
  }
}

// R4 — none in the first viewport, none in the footer.
for (const p of placements) {
  const seat = sectionsOf(p.route).find((s) => s.n === p.section)
  if (seat?.open) fail('R4', `${p.id} sits in the first viewport (${p.route} section ${p.section}).`)
  if (seat?.footer) fail('R4', `${p.id} sits in the footer (${p.route} section ${p.section}).`)
}

// R5 — the carrier actually reads as the term.
//      Flattened, because O.C.R. is punctuated as an initialism and a human
//      reads it as the three letters. This is the ONE place a flattened match
//      is correct: the question is what the eye takes off the surface, not what
//      find-in-page would match.
for (const p of placements) {
  if (!flat(p.carrier).includes(flat(p.term))) {
    fail('R5', `${p.id}: the carrier does not read as its term.`)
  }
  if (p.reads && !flat(p.carrier).includes(flat(p.reads))) {
    fail('R5', `${p.id}: "reads" is not part of the carrier.`)
  }
}

// R6 — the carrier is bound to the job that produces it. This is the join that
//      stops the key and the artwork from drifting apart.
for (const p of placements) {
  const book = jobs[p.job?.file]
  if (!book) {
    fail('R6', `${p.id}: names job file "${p.job?.file}", which is not a register job file.`)
    continue
  }
  const found = at(book, p.job.at)
  if (found === undefined) {
    fail('R6', `${p.id}: ${p.job.file} has nothing at "${p.job.at}".`)
  } else if (found !== p.carrier) {
    fail('R6', `${p.id}: ${p.job.file}:${p.job.at} does not match the registered carrier.`)
  }

  if (p.fallback?.job) {
    const spare = at(jobs[p.fallback.job.file] ?? {}, p.fallback.job.at)
    if (spare === undefined) {
      fail('R6', `${p.id}: the static fallback names ${p.fallback.job.file}:${p.fallback.job.at}, which does not exist.`)
    }
  }
}

// R7 — sets stay sets, and the member that carries something is never the first
//      or the last one. A set of two is not a set; it is a pair, and a pair with
//      one odd member is a pointer.
for (const p of placements) {
  const set = p.set
  if (!set) {
    fail('R7', `${p.id}: no set recorded. Every surface here is a member of a set drawn by one function called N times.`)
    continue
  }
  if (set.members < 3) fail('R7', `${p.id}: a set of ${set.members} is not a set.`)
  if (set.index === 0 || set.index === set.members - 1) {
    fail('R7', `${p.id}: sits at ${set.index} of ${set.members} — the first and last members of a set are the two everyone reads.`)
  }

  // The register's index and the job path's index must be the same number.
  const digits = String(p.job?.at ?? '').split('.').filter((s) => /^\d+$/.test(s))
  if (digits.length) {
    const last = Number(digits[digits.length - 1])
    if (last !== set.index) {
      fail('R7', `${p.id}: set.index is ${set.index} but the job path lands at ${last}.`)
    }
  }

  // And the array it lands in must be exactly as long as the set claims.
  const parent = String(p.job?.at ?? '').split('.').slice(0, -1)
  for (let cut = parent.length; cut > 0; cut -= 1) {
    const node = at(jobs[p.job.file] ?? {}, parent.slice(0, cut).join('.'))
    if (Array.isArray(node)) {
      if (node.length !== set.members) {
        fail('R7', `${p.id}: the set claims ${set.members} members; ${p.job.file} holds ${node.length}.`)
      }
      break
    }
  }
}

// R8 — no tell in anything that renders, and no accessible name that hands over
//      a term as a literal.
for (const p of placements) {
  for (const [field, value] of [['carrier', p.carrier], ['alt', p.alt]]) {
    for (const tell of TELLS) {
      if (reads(value ?? '', tell)) fail('R8', `${p.id}: ${field} contains the tell "${tell}".`)
    }
  }

  const nameIsTerm = flat(p.alt ?? '').includes(flat(p.term))
  if (nameIsTerm && !p.altVeiled) {
    fail('R8', `${p.id}: the accessible name carries the term as a literal. Either it is not the term, or the set is veiled and altVeiled says so.`)
  }
  if (p.altVeiled) {
    const set = at(jobs[p.job?.file] ?? {}, String(p.job?.at ?? '').split('.').slice(0, -2).join('.'))
    if (!set?.veil) {
      fail('R8', `${p.id}: altVeiled is set, but its job set does not carry "veil": true.`)
    }
  }
}

// R9 — every route a placement lives on has to be reachable. Rule 8, and phase
//      4 section 2: /roles is the one term off the home page and it is reached
//      from the footer.
{
  const links = existsSync(join(root, 'app', 'content', 'site.ts'))
    ? readFileSync(join(root, 'app', 'content', 'site.ts'), 'utf8')
    : ''
  for (const p of placements) {
    if (p.route === '/') continue
    if (!links.includes(`'${p.route}'`)) {
      fail('R9', `${p.id}: ${p.route} carries a term but is not in app/content/site.ts, so nothing links to it.`)
    }
  }
  for (const p of placements) {
    for (const echo of p.echoes ?? []) {
      if (!links.includes(`'${echo.route}'`)) {
        notes.push(`${p.id} echoes onto ${echo.route}, which app/content/site.ts does not list yet.`)
      }
    }
  }
}

// R10 — the measured cap height. Phase 5 fills these in; until then they are
//       pending, not passing. Rule 4 is not satisfied by a screenshot on a
//       27-inch monitor.
for (const p of placements) {
  if (p.cap375 == null) {
    wait('R10', `${p.id}: no measured cap height at ${register.reach?.viewportPx ?? 375}px yet.`)
  } else if (p.cap375 < (register.reach?.capFloorPx ?? 7)) {
    fail('R10', `${p.id}: ${p.cap375}px cap at 375px, under the ${register.reach.capFloorPx}px floor.`)
  }
}

/* -------------------------------------------------------------------------- */
/* D — the decoys                                                             */
/* -------------------------------------------------------------------------- */

const floors = decoyBook.floors ?? { total: 12, art: 3, dom: 8 }
const channelsOf = (d) => new Set((d.surfaces ?? []).map((s) => s.channel))
const inArt = decoys.filter((d) => channelsOf(d).has('art'))
const inDom = decoys.filter((d) => channelsOf(d).has('dom'))

// D1/D2/D3 — the floors.
if (decoys.length < floors.total) fail('D1', `${decoys.length} decoys; the floor is ${floors.total}.`)
if (inArt.length < floors.art) fail('D2', `${inArt.length} decoys baked into artwork; the floor is ${floors.art}.`)
if (inDom.length < floors.dom) fail('D3', `${inDom.length} decoys in copy; the floor is ${floors.dom}.`)

// D4 — no decoy twice.
{
  const seen = new Set()
  for (const d of decoys) {
    const key = flat(d.word)
    if (seen.has(key)) fail('D4', `${d.word} is registered twice.`)
    seen.add(key)
    if (!d.native) fail('D4', `${d.word}: no native meaning recorded. A decoy that cannot be explained in trade terms reads as planted.`)
  }
}

// D5 — THE CHECK PHASE 4 ASKS FOR BY NAME: no decoy may contain a real term as
//      a substring. Checked over the word AND every rendered string, raw and
//      flattened, because a decoy phrase can form a term across a space.
for (const d of decoys) {
  const bodies = [d.word, ...(d.surfaces ?? []).map((s) => s.string).filter(Boolean)]
  for (const body of bodies) {
    for (const term of terms) {
      if (reads(body, term) || flat(body).includes(flat(term))) {
        fail('D5', `decoy "${body}" carries a real term as a substring.`)
      }
    }
    for (const tell of TELLS) {
      if (reads(body, tell)) fail('D5', `decoy "${body}" contains the tell "${tell}".`)
    }
  }
}

// D6 — adjacency, and the distinction phase 4 turns on.
//
//      A `dom` decoy in a term's section is a find-in-page hit that lands a team
//      in the right region for free. An `art` decoy in the same artwork cannot
//      produce a hit at all, so it leads nowhere — what it does is stop the
//      surface type from being the tell. Only the first is a defect.
{
  const takenSections = new Set()
  const takenRoutes = new Set()
  for (const p of placements) {
    if (p.section == null) takenRoutes.add(p.route)
    else takenSections.add(`${p.route}#${p.section}`)
    for (const echo of p.echoes ?? []) takenRoutes.add(echo.route)
  }

  for (const d of decoys) {
    for (const s of d.surfaces ?? []) {
      if (s.channel !== 'dom') continue
      if (takenRoutes.has(s.route)) {
        fail('D6', `${d.word} is copy on ${s.route}, which carries a term. A Ctrl+F hit there is the region for free.`)
      }
      if (s.section != null && takenSections.has(`${s.route}#${s.section}`)) {
        fail('D6', `${d.word} is copy in ${s.route} section ${s.section}, which carries a term.`)
      }
    }
  }
}

// D7 — every baked decoy is bound to a job, exactly like a carrier is.
for (const d of decoys) {
  for (const s of d.surfaces ?? []) {
    if (s.channel !== 'art') continue
    if (!s.string) {
      fail('D7', `${d.word}: an art surface with no rendered string. Nothing binds it to a generator.`)
      continue
    }
    if (!allJobStrings.includes(s.string)) {
      fail('D7', `${d.word}: "${s.string}" is in no job file, so no generator draws it.`)
    }
  }
}

/* -------------------------------------------------------------------------- */
/* B — the build                                                              */
/* -------------------------------------------------------------------------- */

/**
 * What Chrome's find-in-page walks: the text of the document. Script and style
 * bodies are not text, the head is not on the page, and attributes are not
 * matched — stripping tags drops all of them.
 *
 * SVG <text> is deliberately NOT stripped. Chrome matches it, which is exactly
 * why the outline generator emits <path> only.
 */
function rendered(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
}

function pages(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const entry = join(dir, name)
    if (statSync(entry).isDirectory()) pages(entry, out)
    else if (name.endsWith('.html')) out.push(entry)
  }
  return out
}

const route = (file) => {
  const rel = relative(built, file).split(sep).join('/')
  const path = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '')
  return path === '/' ? '/' : path.replace(/\/$/, '')
}

let text = null

if (existsSync(built)) {
  text = new Map()
  for (const file of pages(built)) text.set(route(file), rendered(readFileSync(file, 'utf8')))

  // B1 — the requirement the whole event rests on. Find-in-page for each of the
  //      six must return nothing, on every route.
  for (const [path, body] of text) {
    for (const term of terms) {
      if (reads(body, term)) {
        fail('B1', `${path}: find-in-page would match a term in the rendered text.`)
      }
    }
  }

  // B2 — decoys are supposed to be findable. That is the difficulty curve: a
  //      team that gets a hit on a decoy burns real time before working out the
  //      six do not respond to Ctrl+F.
  for (const d of decoys) {
    for (const s of d.surfaces ?? []) {
      if (s.channel !== 'dom') continue
      const body = text.get(s.route)
      if (body === undefined) {
        wait('B2', `${d.word}: ${s.route} is not built yet.`)
      } else if (!reads(body, d.word)) {
        wait('B2', `${d.word}: ${s.route} is built but does not carry it — ${s.where}.`)
      }
    }
  }
} else {
  wait('B', 'no build present — run `npm run generate` before signing off a phase.')
}

/* -------------------------------------------------------------------------- */
/* the key                                                                    */
/* -------------------------------------------------------------------------- */

const T = { A: 'T-A — baked into raster artwork', B: 'T-B — drawn as outline geometry', C: 'T-C — rendered in WebGL' }

function key() {
  const seat = (p) => {
    const name = sectionsOf(p.route).find((s) => s.n === p.section)?.name
    return p.section == null ? p.route : `${p.route} section ${p.section} — ${name}`
  }

  const one = (p, i) => [
    `### ${i + 1}. \`${p.term}\``,
    '',
    '| | |',
    '|---|---|',
    `| **Rendered string** | \`${p.carrier}\` |`,
    `| **Reads as** | \`${p.reads}\` |`,
    `| **Technique** | ${T[p.technique] ?? p.technique} |`,
    `| **Where** | ${seat(p)} |`,
    `| **Surface** | ${p.surface} |`,
    `| **Produced by** | \`_private/${p.job.file}\` → \`${p.job.at}\` |`,
    `| **Set** | member ${p.set.index + 1} of ${p.set.members} — ${p.set.of} |`,
    `| **Accessible name** | ${p.altVeiled ? `\`${p.alt}\`, veiled` : `\`${p.alt}\``} |`,
    `| **Cap height at ${register.reach?.viewportPx ?? 375}px** | ${p.cap375 == null ? '_pending — phase 5 measures it_' : `${p.cap375}px`} |`,
    `| **Screenshot 375px** | ${p.shot375 ? `\`${p.shot375}\`` : '_pending_'} |`,
    `| **Screenshot 1440px** | ${p.shot1440 ? `\`${p.shot1440}\`` : '_pending_'} |`,
    '',
    `**Why it is native.** ${p.native}`,
    '',
    '**Camouflage.**',
    '',
    ...p.camouflage.map((line) => `- ${line}`),
    '',
    ...(p.fallback ? [`**Static fallback.** ${p.fallback.surface} — must ${p.fallback.must}`, ''] : []),
    ...(p.echoes?.length
      ? [`**Echoes.** ${p.echoes.map((e) => `${e.route} (${e.note})`).join('; ')} — the same placement, not a seventh.`, '']
      : []),
    `**How a team gets here.** ${p.reach}`,
    '',
  ]

  const crib = [
    '| # | Term | Technique | Where | Reads |',
    '|---|---|---|---|---|',
    ...placements.map((p, i) => `| ${i + 1} | \`${p.term}\` | T-${p.technique} | ${seat(p)} | \`${p.reads}\` |`),
  ]

  const book = [
    '| Decoy | Native meaning | Channels | Where |',
    '|---|---|---|---|',
    ...decoys.map((d) => {
      const where = (d.surfaces ?? [])
        .map((s) => `${s.route}${s.section != null ? ` §${s.section}` : ''} ${s.where}`)
        .join('; ')
      return `| \`${d.word}\` | ${d.native} | ${[...channelsOf(d)].join(', ')} | ${where} |`
    }),
  ]

  return [
    '# KEY — ORGANISER ONLY — GIT-IGNORED — NEVER DEPLOYED',
    '',
    '> Generated by `scripts/register.mjs` from `_private/placements.json`,',
    '> `_private/plate-jobs.json`, `_private/type-jobs.json` and `_private/decoys.json`.',
    '> **Do not edit this file.** Edit the register and run `npm run audit:register`.',
    '> The generators read the same job files, which is what stops this key from',
    '> drifting away from what actually shipped.',
    '',
    `> Written ${new Date().toISOString().slice(0, 10)}.`,
    '',
    '`_private/` is listed in `.gitignore`, is never imported by application code, and',
    'never reaches the built output — phase 9 verifies its absence. If it is ever',
    'committed it lives in the history permanently: start a fresh repository rather',
    'than trying to rewrite history.',
    '',
    '---',
    '',
    '## 1. The crib — one page for the judging table',
    '',
    ...crib,
    '',
    '---',
    '',
    '## 2. The six, in full',
    '',
    ...placements.flatMap(one),
    '---',
    '',
    `## 3. Decoys — ${decoys.length} registered, ${inArt.length} baked into artwork`,
    '',
    'Decoys in copy are **meant** to be found by Ctrl+F. A team that gets a hit on',
    '`THREAD` and submits it is wrong, and the time they spend working out that the',
    'real six do not respond to find-in-page is the intended difficulty curve.',
    '',
    'Decoys in artwork exist so that "it is in a picture, therefore it is a term" is',
    'not the whole solve.',
    '',
    ...book,
    '',
    '---',
    '',
    '## 4. Difficulty, as designed',
    '',
    'Target for a competent team: **four of six within 25 minutes**, six of six inside',
    'the window with effort. The intended progression:',
    '',
    '1. The team reads the site, tries Ctrl+F, gets hits on `THREAD` and `INDEX`, submits, is wrong.',
    '2. The team works out that find-in-page is not the instrument, and starts looking.',
    '3. The seal and the specimen plate go first — the most obviously documentary surfaces.',
    '4. The medallion needs someone to scroll to it and stop. Slower.',
    '5. The service mark is the sneakiest on the home page: it is set as ordinary UI type.',
    '6. `/roles` is last, because it requires deciding the footer is worth reading.',
    '',
    'If playtesting says one is unfindable, **do not make it bigger or brighter** —',
    'that is visible to everyone and it violates rule 3. Move it to a surface',
    'participants are already looking at.',
    '',
  ].join('\n')
}

writeFileSync(join(vault, 'KEY.md'), key() + '\n', 'utf8')

/* -------------------------------------------------------------------------- */
/* report                                                                     */
/* -------------------------------------------------------------------------- */

console.log('Placement register — CROCARIA\n')
console.log(`  ${placements.length} placement(s) · techniques ${[...new Set(placements.map((p) => 'T-' + p.technique))].sort().join(' ')}`)
console.log(`  ${decoys.length} decoy(s) · ${inArt.length} baked into artwork · ${inDom.length} in copy`)
console.log(`  build  ${text ? `${text.size} route(s) read as rendered text` : 'not present'}`)
console.log('  key    _private/KEY.md written')

if (notes.length) {
  console.log('\n  notes:')
  for (const line of notes) console.log(`    · ${line}`)
}

if (pending.length) {
  console.log(`\n  ${pending.length} pending — later phases close these:`)
  for (const { rule, text: line } of pending) console.log(`    [${rule}] ${line}`)
}

if (findings.length) {
  console.error(`\n  ${findings.length} finding(s):`)
  for (const { rule, text: line } of findings) console.error(`    [${rule}] ${line}`)
  console.error('\nSee prompts/04-clue-architecture.md.')
  process.exit(1)
}

if (sealed && pending.length) {
  console.error(`\n  --sealed: ${pending.length} item(s) still pending. The register is not signed off.`)
  process.exit(1)
}

console.log('\nClean.')
