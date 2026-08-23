# CLAUDE.md — project constitution

Read this file in full at the start of every session, before touching any code.
Then read `prompts/REFERENCE-TEARDOWN.md`, which is the source of truth for every
design token in this project.

---

## Project

Marketing site for **CROCARIA**, a fictional heritage saffron house.
It is the Round 1 asset for a symposium technical event: six technical terms are
concealed in the copy and imagery for participants to find visually.

The site is a **fidelity replication of the design at
`https://saffron-griflan.netlify.app/`** — every layout, colour, type size, spacing
value, component, interaction and scroll behaviour. The identity is ours; the design
is theirs. The reference is a real company's site, so its name, wordmark, partner
logos and outbound links are never reproduced.

The website is the puzzle. The website must never *look* like a puzzle.

Phase prompts live in `prompts/`. Run them in order; each assumes the previous
phase's artefacts exist. Start with `prompts/00-MASTER.md`.

The previous React/NORTHBOUND build is archived at `_archive/` and is not live code.

---

## Brand

```
NAME       CROCARIA
FOUNDED    est. 1904, Consuegra
WHAT       A heritage saffron house. Cultivation, grading, assay, provenance
           and bonded warehousing. Sells lots, not sachets.
VOICE      Understated, technical, a little severe. Short declaratives.
           Trade language, not marketing language. Numbers over adjectives.
           A house that has been doing this for 120 years and does not need
           to convince you.
TAGLINE    "Grown, graded, sealed."
HERO       h1 "The Red Harvest"  /  sub "Provenance for every thread."
CTA        "Open Ledger"   (a persistent pill, mirroring the reference's
                            "Launch App" — this is a register, not a checkout)
```

Note the wording: **bonded warehousing, never "bonded storage"** — `storage`
contains `rag`. This is the first substring trap you will hit in copy.

**Anti-brief.** If the output drifts here it is wrong: no purple/blue SaaS
gradients, no rounded-2xl three-column feature cards, no emoji, no stock-photo
smiling teams, no "Trusted by 10,000+", no chatbot bubble, no cookie banner, no
crypto vocabulary.

---

## The ten rules

Every phase must obey these. Re-read them before each phase.

1. **Visual only.** Every clue must be readable by a human looking at the rendered
   page. No `view-source` clues, no HTML comments, no `console.log`, no `data-`
   attributes, no alt-text-only, no `opacity: 0`, no white-on-white, no zero-height
   text. If a sighted user browsing normally cannot see it, it is not a clue.

2. **Find-in-page must fail.** A participant who presses Ctrl+F and types `RAG` must
   find nothing. This is the single most important technical requirement — see
   `prompts/04-clue-architecture.md` for the three sanctioned techniques. A clue
   sitting in plain DOM text is a broken clue.

3. **No puzzle tells.** No "find the clues" copy, no counters, no highlight colours,
   no confetti, no easter-egg styling. A clue must be typographically **identical**
   to the material around it.

4. **Mobile-reachable.** Every clue must be findable on a 375px phone. **No
   hover-only reveals.** Anything gated behind interaction is gated behind a *tap*.

5. **Stable once revealed.** Never tie a clue's visibility to a precise scroll-scrub
   position. Reveal on enter, then stay.

6. **No source leaks.** Private repo. Production source maps **off**. No file,
   component, variable, CSS class, test id, route or image filename may contain any
   of the six terms or the words `clue`, `hidden`, `puzzle`, `hunt`, `easter`,
   `secret`, `answer`.

7. **Decoys are mandatory.** Twelve or more, at least three baked into artwork.

8. **The site must actually work.** Real nav, real footer, real links, real
   responsive behaviour, no dead `href="#"`, no lorem ipsum.

9. **Performance is fairness.** Budget: **< 2.5 MB** total transfer, **LCP < 2.5s**
   on 4G. The three WebGL scenes are the risk; every one has a static fallback.

10. **Cinematic, but not at the cost of legibility.** One pinned scene (300vh) and
    one parallaxed backdrop — the reference's exact budget. Every clue-bearing
    surface is a calm, readable, stable block.

---

## Naming ban

NO file, folder, component, variable, type, CSS class, test id, route or image
filename may contain any of these strings, in any casing:

```
search, ocr, react-js, reactjs, express, pinecone, rag,
clue, hidden, puzzle, hunt, easter, secret, answer
```

Run the audit before every commit:

```
npm run audit:names
```

### Substring traps

The ban is a **substring** ban, so ordinary English words trip it:

| Avoid | Contains | Use instead |
|---|---|---|
| `paragraph` | rag | `copy`, `body`, `line` |
| `storage`, `localStorage` wrapper names | rag | `store`, `vault`, `keep` |
| `drag`, `draggable`, `onDrag` | rag | `pull`, `move`, `pointerMove` |
| `average` | rag | `mean` |
| `expression` | express | `formula`, `rule` |
| `searchParams`, `useSearchParams` | search | `useQuery` alias, or destructure at the boundary |
| `Fragment` | rag | `<template>` / the `<>` shorthand |

A horizontally-scrolling carousel is where `drag` sneaks in. Name it `pull`.

Clue-bearing images get neutral, non-descriptive filenames — `plate-04.webp`, not
`assay-seal.webp`. Participants CAN see filenames in the network tab.

---

## Stack

Nuxt 3 (Vue 3, static) · Tailwind v3 · Lenis · GSAP + ScrollTrigger · three.js.
Offline generators use `sharp` and `opentype.js`.

Not used, deliberately: Framer Motion, Locomotive, Swiper, Barba, any CMS, any
analytics, any third-party script.

`nuxt.config.ts` sets `future.compatibilityVersion: 4`, which is what puts the
Vue application under `app/` on Nuxt 3. `nuxt.config.ts`, `public/`, `server/`
and `tokens/` stay at the repo root; `~` and `@` resolve to `app/`.

---

## Repo layout

```
app/
  app.vue              outer shell: touch scroll container, header, page, menu, probe
  assets/css/main.css  the rem engine, the palette record, the layout primitives
  components/          presentational only
  composables/         motion.ts is the ONLY module that touches GSAP or Lenis
  content/             every user-visible string, plus generated outlines/plates
  pages/               routes
tokens/palette.mjs     the colour definition site
scripts/               offline generators and the two audits — never bundled
public/                static assets, neutral filenames only
_private/              organiser-only. Git-ignored. Never imported, never deployed.
_archive/              the dead React/NORTHBOUND build. Not live code.
prompts/               the phase system. REFERENCE-TEARDOWN.md is the spec.
```

Three commands gate the work:

```
npm run audit:names      rule 6 — names and contents, source and built output
npm run audit:contrast   WCAG AA for every shipped pairing
npm run verify           both audits, then a full static build
```

Two offline generators, run by hand, output committed:

```
npm run gen:lockup       scripts/lockup.mjs     → app/content/lockup.ts
npm run gen:stand-ins    scripts/stand-ins.mjs  → app/assets/plates/ (dev only)
```

Both read licensed font binaries from `_private/fonts/`, which is git-ignored. The
re-fetch recipe is in the header of `scripts/lockup.mjs`.

---

## Design tokens

**`prompts/REFERENCE-TEARDOWN.md` is the source of truth.** Every value in it was
measured from the live reference in a real browser. When intuition and that file
disagree, that file wins. The essentials:

### The fluid rem engine

```css
:root { --size: 375; --clamp: 15px;
        --global-font-size: clamp(5px, calc((100vw / var(--size)) * 10), var(--clamp)); }
@media (min-width: 650px) { :root { --size: 1800 } }
html { font-size: var(--global-font-size) }
```

`1rem = 10 design px`. Tailwind spacing is remapped to match (`n / 10 rem`), so
utility numbers **are** design pixels: `.p-20` → `padding: 2rem` → 20 design px.
At a 1440px viewport the root font must compute to exactly `8px`.

### One breakpoint

`s: 650px`, plus `max-s`, plus the capability variants `has-hover:` /
`has-not-hover:`. There is no tablet breakpoint; the rem engine handles it.

### Colour

| Token | Hex | Role |
|---|---|---|
| `black` | `#000000` | page ground |
| `cream` | `#ECE7E0` | **all** body copy and headlines |
| `gold` | `#FFBC09` | the accent — state only, never a heading colour |
| `brown` | `#962817` | mid rules, footer meta |
| `brown-dark` | `#47140B` | **every hairline on the site** |
| `brown-darker` | `#150604` | alternating section ground |
| `brown-deepest` | `#2F0E09` | card / panel fill |
| `brown-lifted` | `#DC3F27` | **our** value for meta copy — see the deviation below |

Body copy is `#ECE7E0`. There is no grey in this palette. Every 1px rule is
`#47140B`, no exceptions. `npm run audit:contrast` after touching any colour.

**`tokens/palette.mjs` is the definition site.** `tailwind.config.ts` turns it
into utilities and `scripts/contrast.mjs` grades it; the `:root` block in
`app/assets/css/main.css` re-declares the same values as documentation, and the
contrast audit fails if the two records ever drift apart.

### The one recorded deviation

`brown` `#962817` measures **2.61:1 on black** and fails WCAG AA for text. The
reference uses it for footer meta copy anyway. We keep `#962817` exactly as
measured wherever it is a rule, a hairline or another non-text edge, and lift
any **running text** to `brown-lifted` `#DC3F27` — 4.78:1 on black, 4.51:1 on
`brown-darker`. Not approved on `brown-deepest` (4.03:1); that ground takes
cream. `npm run audit:contrast` prints this finding on every run so it stays a
decision rather than a habit.

### Type

Funnel Display 300 (display + headings) · Host Grotesk (body) · Roboto Mono
(labels, data, nav, captions). Eight `.type-*` classes, listed with exact sizes in
the teardown §5.

**Letter-spacing is `normal` everywhere.** Adding tracking is the fastest way to make
the replica read as a lookalike. `.type-display-xl` keeps `line-height: .75`.

---

## Code conventions

- All user-visible copy lives in `app/content/`, never inline in a template.
- Sections are presentational; content arrives via props.
- `app/composables/motion.ts` is the only module that talks to GSAP or Lenis.
- Every ScrollTrigger is created inside a `gsap.context()` and reverted on unmount.
- Never mix a CSS transition and a GSAP tween on the same property.
- Respect `prefers-reduced-motion`: no Lenis, no pin, no scrub, no parallax, no GL.
- Tokens are Tailwind theme values consumed as utilities. No inline hex, anywhere.
- `.site-max` is the only container. No second one, no `max-w-*` on a section.
- Generated files (`app/content/outlines.ts`, `app/content/plates.ts`,
  `app/content/lockup.ts`) are never edited by hand. Re-run the generator; the file
  header names it.
- Images render through `<Plate/>`, never a bare `<img>`. Clue-bearing artwork passes
  `priority="early"` — a clue that fails to paint for a fast scroller does not exist.
- Seals render at 128px diameter or larger, or the ring lettering stops being readable.
- Sets are one function called N times. Do not hand-tune one route card, one seal, one
  service mark. A member of a set that differs is the member everyone looks at.

### Established by phase 2 — do not undo

- **Never tween a colour.** `motion.ts` owns geometry and opacity; CSS owns every
  state colour, as a class. A tween needs a literal value, and literal values are
  exactly what "no inline hex" forbids. The pill's label flip is the worked example.
- **motion.ts exports purpose-built helpers, not `gsap`.** `useWipe`, `useAway`,
  `useEnter`, `useTally`, `useLift`, `useTicker`. A new behaviour gets a new named
  helper, never an escape hatch — that is what makes "every ScrollTrigger is reverted"
  true by construction rather than by memory.
- **Every ScrollTrigger routes through `scrollRoot()`.** On a coarse pointer the
  document does not scroll — the container in `app.vue` does. A trigger left on
  `window` silently never fires on a phone, and looks perfect on a desktop.
- **A closed panel gets `inert`,** not just height 0. Height alone leaves the copy in
  the tab order and in the accessibility tree.
- **Links carry a `live` flag** (`app/content/site.ts`). Nitro prerenders with
  `crawlLinks` and `failOnError`, so a link to a route a later phase has not built yet
  does not merely 404 — it fails the build. Flip the flag when the route lands.
- **`/specimen` is removed as a ROUTE, not guarded as a component** (`nuxt.config.ts`).
  With nothing referencing it, the page chunk and everything only it imports — the
  fixture copy, the stand-in artwork — are never emitted. A component behind a runtime
  flag still ships its whole subtree.
- **A panel opened to `auto` is pinned to `auto` inline**, never `clearProps`. The
  closed state has to be a class for server-rendered markup to be right, so clearing
  the inline height restores *that*, and the panel snaps shut as it finishes opening.

### Established by phase 3 — do not undo

- **One scroll position and one rAF loop.** Lenis drives `gsap.ticker`, the ticker
  drives `ScrollTrigger.update`, and the GL layer draws from that same ticker via
  `useFrame`. Never `renderer.setAnimationLoop` — it opens a loop per scene, and
  three scenes plus Lenis is four clocks interleaving.
- **Lenis is not built on a coarse pointer, or under reduced motion.** It leaves
  touch on the native scroller regardless, so building it there costs a rAF loop
  that smooths nothing on the hardware with the least budget. Nothing breaks,
  because every trigger already routes through `scrollRoot()`.
- **The pinned scene is pinned by `position: sticky`, not by GSAP.** Teardown §7
  measures `h-[300vh]` on the section ITSELF; a GSAP pin would have produced a
  viewport-tall section with a 300vh spacer beside it. `motion.ts` only reports
  which step we are in.
- **Steps are discrete, with a dead-band on the boundary.** `step` is a pure
  function of scroll progress, so reverse crossing cannot desynchronise — there
  is no playhead to desynchronise. Never tie a marked surface to a raw scrub
  value.
- **Reduced-motion layouts are CSS, not a second template.** The reel's stacked
  layout is the same DOM under different rules. No hydration seam, no second
  markup path, and it is still correct if the JavaScript never arrives. `inert`
  is gated on the pin actually being live, so all four steps stay in the
  accessibility tree there.
- **The GL gate runs BEFORE the import.** `capable()` decides, then
  `await import('three')`. A reader who fails the gate never downloads the
  600 KB. Verified by the absence of a `three` entry in `performance.getEntries`.
- **Shaders run at `glslVersion: GLSL3` with an explicit `out vec4`.** At GLSL3
  three stops defining `gl_FragColor` for us — and `gl_FragColor` contains `rag`.
  This is how the naming ban holds in our own source with no exemption. The build
  profile of `audit:names` masks three's own GLSL vocabulary; the source profile
  does not, and must not.
- **GL colour comes from `tokens/palette.mjs`.** `ink()` derives it. The magenta
  teardown §9 calls for is a documented hue rotation of `brown-lifted`, not a new
  literal and not a new token — no text or edge is ever set in it.
- **On a metal, `color` is a filter, not a colour.** At `metalness: 1` there is no
  diffuse term, so tinting the struck objects gold multiplies the environment by
  a blue channel of `0x09` and deletes the gradient that tint was meant to
  produce. The metal is filtered white; the environment carries the gradient.
- **The medallion and the house mark share one rotation rule.** Both come to rest
  face-on over the same band. The medallion has to — it carries something — and
  giving the mark a continuous tumble would make the medallion the one object on
  the page that stops.

### Established by phase 4 — do not undo

- **`_private/placements.json` is where the six live, and the only place.** Every
  other statement about a placement — the key, the generator input, this file — is
  derived from it or checked against it. `npm run audit:register` binds each carrier
  string to the generator job that actually produces it, so artwork cannot drift away
  from the key without failing.
- **The key is generated, never written.** `_private/KEY.md` is a by-product of the
  audit. Editing it by hand is how an answer key comes to describe a site that no
  longer exists.
- **A copy decoy may never share a section with a term; an artwork decoy may share
  the artwork.** These are not the same rule wearing two hats. A find-in-page hit
  that lands a team in a term's section hands them the region for free — that is what
  "no decoy adjacent to a clue" protects against. A decoy baked into the same seal or
  the same plate cannot produce a hit at all, so it leads nowhere; what it does is
  stop the surface type from being the tell. The audit enforces exactly this split.
- **The member of a set that carries something is never the first or the last one.**
  Those are the two everyone reads. And a set of two is a pair — a pair with one odd
  member is a pointer, so the floor is three.
- **The whole set is veiled, not just the banned member.** `<OutlineText/>` needs an
  `aria-label`, and for a set whose text is a banned token that name cannot ship as a
  literal. But veiling only the one member leaves two plain labels beside one numeric
  array, which points at the term for anyone reading source — worse than the string.
  So `outline.mjs` veils every member of a veiled set.
- **No board card title may appear in the DOM listings on `/roles`, and no listing
  title on the board.** If the two sets overlap, a reader comparing them finds the one
  card missing from the listings. The board is internal requisitions; the listings are
  what the house has published.
- **`audit:register`'s build gate is a find-in-page simulation, not a source scan.**
  It strips script, style, head and tags and matches plain lowercase substrings over
  what is left — which is what Ctrl+F actually does. It deliberately ignores
  attributes (`audit:names` owns those) and deliberately does **not** strip SVG
  `<text>`, because Chrome matches it.

### Drawn type, and its accessibility trade-off

Some display headlines and short labels are set from committed path geometry rather
than characters (`scripts/outline.mjs` → `app/content/outlines.ts` → `<OutlineText/>`).
No font is fetched at runtime and no conversion happens in the browser.

**The trade-off is real and accepted deliberately.** A line drawn as geometry cannot
be selected, copied, translated by the browser, or reflowed at large text settings.
The mitigations:

- The `<svg>` carries `role="img"` and an `aria-label`, so assistive technology
  announces the line normally. That is a genuine mitigation, not a fig leaf — but it
  does not restore selection or browser translation, and nothing does.
- The technique is confined to display type and short labels. It never touches running
  copy, navigation, captions, or anything a reader has to work through.

Two hard rules for anyone editing this:

- **Never use SVG `<text>`.** Chrome's find-in-page matches inline SVG `<text>`, which
  would silently undo the entire technique. If a glyph is missing, regenerate.
- **Per-character `<span>` splitting is not a substitute.** Chrome normalises text
  across inline element boundaries before matching. It offers no protection of any
  kind. It is an animation tool.

---

## Do not

- Do not add analytics, cookie banners, or third-party scripts.
- Do not add a real site-wide find feature. (An input with that label would be a false
  positive that wastes participants' time and undermines the actual clue.)
- Do not "helpfully" make any clue more discoverable. Placement is specified in
  `prompts/04-clue-architecture.md` and is deliberate.
- Do not import anything from `_private/` in application code.
- Do not re-enable production source maps.
- Do not reproduce the reference's name, wordmark, partner logos or outbound links.
