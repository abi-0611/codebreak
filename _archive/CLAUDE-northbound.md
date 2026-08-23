# CLAUDE.md — project constitution

Read this file in full at the start of every session, before touching any code.

---

## Project

Marketing site for NORTHBOUND, a fictional high-altitude expedition outfitter.
It is the Round 1 asset for a symposium technical event: six technical terms are
concealed in the copy and imagery for participants to find visually.

The website is the puzzle. The website must never *look* like a puzzle.

Phase prompts live in `prompts/`. Run them in order; each assumes the previous
phase's artefacts exist.

---

## The ten rules

Every phase must obey these. Re-read them before each phase.

1. **Visual only.** Every clue must be readable by a human looking at the rendered page. No `view-source` clues, no HTML comments, no `console.log`, no `data-` attributes, no alt-text-only, no `opacity: 0`, no white-on-white, no zero-height text. If a sighted user browsing normally cannot see it, it is not a clue.

2. **Ctrl+F must fail.** A participant who presses Ctrl+F and types `RAG` must find nothing. This is the single most important technical requirement — see `03-clue-architecture.md` for the three sanctioned techniques. A clue sitting in plain DOM text is a broken clue.

3. **No puzzle tells.** No "find the clues" copy, no counters, no highlight colours, no confetti, no easter-egg styling. A clue must be typographically **identical** to the text around it. If you can spot the clue by squinting at the layout rather than reading it, it is placed wrong.

4. **Mobile-reachable.** Every clue must be findable on a 375px phone. **No hover-only reveals** — hover does not exist on touch. Anything gated behind interaction must be gated behind a *tap*.

5. **Stable once revealed.** Never tie a clue's visibility to a precise scroll-scrub position. A clue that only exists between 41% and 46% of a pinned timeline is unfair and will be missed. Reveal on enter, then stay.

6. **No source leaks.** Deploy from a **private** repo. Production source maps **off**. No file, component, variable, CSS class, or image filename may contain any of the six terms or the word `clue`, `hidden`, `puzzle`, `hunt`, `easter`. Naming convention is in `01-foundation.md`.

7. **Decoys are mandatory.** Plausible-but-wrong technical-sounding words must be seeded through the copy, or the hunt collapses into a five-minute skim. Spec in `03-clue-architecture.md`.

8. **The site must actually work.** Real nav, real footer, real links, real responsive behaviour, no dead `href="#"`, no lorem ipsum. Broken scaffolding is the fastest way for a participant to guess the site is fake and start inspecting rather than reading.

9. **Performance is fairness.** Symposium wifi is bad and half the participants are on mid-range Android. Budget: **< 2.5 MB** total transfer, **LCP < 2.5s** on 4G. A janky site costs teams clues they earned.

10. **Cinematic, but not at the cost of legibility.** Heavy pinned-scroll is for hero and one feature moment only. Every clue-bearing section must be a calm, readable, stable block. Motion serves the disguise; it must never bury the evidence.

---

## Naming ban

NO file, folder, component, variable, type, CSS class, test id, route, or image
filename may contain any of these strings, in any casing:

```
search, ocr, react-js, reactjs, express, pinecone, rag,
clue, hidden, puzzle, hunt, easter, secret, answer
```

`react` alone is unavoidable in a React project — that is fine and expected.
The forbidden token is the *branded* form `ReactJS`.

### Substring traps

The ban is a **substring** ban, so ordinary English words trip it. These are the
ones that come up in practice — do not use them as identifiers:

| Avoid | Contains | Use instead |
|---|---|---|
| `Fragment`, `React.Fragment` | rag | the `<>...</>` shorthand |
| `paragraph` | rag | `copy`, `body`, `line` |
| `storage`, `localStorage` wrapper names | rag | `store`, `vault`, `keep` |
| `drag`, `draggable`, `onDrag` | rag | `pull`, `move`, `pointerMove` |
| `expression` | express | `formula`, `rule` |
| `average` | rag | `mean` |
| `searchParams`, `useSearchParams` | search | `useQuery` alias, or destructure at the boundary |

Run the audit before every commit:

```
npm run audit:names
```

Clue-bearing images get neutral, non-descriptive filenames — `permit-01.webp`,
not `ocr-stamp.webp`. A participant CAN see filenames in the network tab.

---

## Brand

```
NAME       NORTHBOUND
FOUNDED    est. 2011, Chamonix
WHAT       High-altitude expedition outfitter. Guided ascents, permits, logistics.
VOICE      Understated, technical, a little severe. Short declaratives.
           Copy that respects the reader. Never markety, never exclamatory.
           Think Arc'teryx and Patagonia field notes, not a startup landing page.
TAGLINE    "The mountain does not negotiate."
CTA        "Request Access"  (a persistent pill - this is a ballot, not a checkout)
```

**Anti-brief.** If the output drifts here, it is wrong: no purple/blue SaaS gradients,
no rounded-2xl three-column feature cards, no emoji, no stock-photo smiling teams, no
"Trusted by 10,000+ climbers", no chatbot bubble, no cookie banner.

### Colour

Defined in `src/styles/globals.css`. Base palette lives in `@theme` as `--color-*`;
`:root` aliases them to the short names below and adds the scene grounds.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0B0F0E` | near-black, all body copy on light grounds |
| `--bone` | `#F4F1EA` | warm off-white, the default page ground |
| `--moss` | `#1F3A2E` | deep forest green, primary brand |
| `--lichen` | `#8A9A5B` | muted accent, dark grounds only |
| `--stone` | `#575B57` | secondary copy on light grounds |
| `--haze` | `#A8A29A` | secondary copy on dark grounds |
| `--ember` | `#C2410C` | the single hot accent |

Scene grounds: `--scene-approach` `#E8EDE7` (hero), `--scene-ascent` `#C9D6DD` (ethos),
`--scene-ridge` `#0B0F0E` (the pinned scene), `--scene-camp` `#F4F1EA` (routes, safety,
logistics), `--scene-dusk` `#2A1A12` (permits, footer).

Rules:

- Body copy is `--ink` on light grounds and `--bone` on dark. Nothing in between.
- `--ember` appears **exactly once** in the whole site. Scarcity is what makes it read
  as art direction rather than decoration.
- Every shipped pairing clears WCAG AA. `npm run audit:contrast` recomputes them from
  the stylesheet and exits non-zero on a failure. Run it after touching any colour.
- `--stone` is `#575B57`, not the `#6B6F6B` in the original brief. `#6B6F6B` measures
  3.44:1 on `--scene-ascent` and 4.31:1 on `--scene-approach`, both under AA. The value
  was darkened to the nearest tone that clears 4.5:1 on every light ground.
- `--haze` is an addition: `--stone` is unreadable on the dark grounds, and the brief
  named no secondary tone for them.

### Type

Two families, self-hosted via `@fontsource` (latin subset only) so nothing blocks first
paint. Every size is on the ramp in `globals.css`; anything off it is a mistake.

- **Instrument Serif 400** - scene headlines only, via `.type-display` / `.type-title`.
  `clamp(3.5rem, 13vw, 12rem)`, line-height `0.85`, tracking `-0.03em`. Headlines are
  set across the viewport (`<Display spread>`), never centred in one tidy block.
- **Inter 400/500** - everything else. Body `0.95rem` / `1.7` at a `38ch` measure in
  `--fore-muted`; labels `0.7rem` uppercase at `0.18em` tracking.

### Drawn type, and its accessibility trade-off

Some display headlines are set from committed path geometry rather than characters.
`scripts/outline.mjs` converts Instrument Serif glyphs to SVG paths offline; the result
is committed to `src/content/outlines.ts` and rendered by `<OutlineText/>`. No font is
fetched at runtime and no conversion happens in the browser.

**The trade-off is real and is accepted deliberately.** A headline drawn as geometry
cannot be selected, copied, translated by the browser, or reflowed at large text
settings. The mitigations:

- The `<svg>` carries `role="img"` and an `aria-label`, so assistive technology
  announces the line normally. That is a genuine mitigation, not a fig leaf — but it
  does not restore selection or browser translation, and nothing does.
- The technique is confined to **display headlines**. It never touches running copy,
  navigation, labels, captions or anything a reader has to work through.
- The drawing scales with its container, so it stays crisp at any size and behaves like
  type rather than like an image.

Two hard rules for anyone editing this:

- **Never use SVG `<text>` here.** Chrome's find-in-page matches inline SVG `<text>`,
  which would silently undo the entire technique. If a character is missing,
  regenerate the geometry.
- **`<Split/>` is not a substitute.** It is an animation tool and offers no protection
  of any kind; Chrome normalises text across inline element boundaries before matching.
  The comment block in `src/lib/split.tsx` says so at length. Leave it there.

### Imagery

Every image in `public/img/` is drawn by `scripts/plates.mjs` and committed —
same shape as the other generators: offline, deterministic, output checked in.

```
npm run plates
```

Type inside the imagery is set from the committed WOFFs via
`scripts/lib/glyphs.mjs`, as paths. The output is a raster, so find-in-page is
not the concern there; a rasteriser asked to draw `<text>` has to locate the
face on the machine and will quietly fall back to a system font when it cannot.

Three of these carry a term, baked into the pixels. That is why they are drawn
rather than composed in CSS: a CSS ticket or stamp puts the words back into the
DOM as live text, which is the one thing rule 2 forbids.

The words are **not** in the script. They live in `_private/plate-jobs.json`,
git-ignored, exactly like `type-jobs.json`.

Rules for anyone editing this:

- **The five route cards are one function called five times.** Do not
  special-case card 3, and do not give any card its own grade, crop or plate
  geometry. Identical-but-for-the-name is the whole defence.
- **A clue-bearing plate must never be the brightest or highest-contrast thing
  in its frame.** The first ticket had a black header with light type and the
  eye went straight to it; it now reads only when looked at.
- **Check legibility by the numbers.** The generator prints the cap height each
  term lands at on a 375px phone and fails under 7px. Do not eyeball it.
- Drop a frame at `_private/plates/<stem>.png` to use photography instead of a
  drawing; the plates and stamps still composite on top.

`src/content/plates.ts` is generated alongside the files and holds every
image's intrinsic size and available widths. Components read dimensions from
there so a `width`/`height` attribute can never drift from the file on disk.

### Veiled strings

`inscriptions` in `src/content/site.ts` holds a handful of short strings as index-XOR
code arrays rather than literals, decoded at runtime by `spoken()`. This is not
security and does not pretend to be: it exists so that a text scan of the production
bundle returns nothing, which is the actual threat. Generated offline by
`scripts/inscribe.mjs`; the plain strings live only in git-ignored `_private/`.

Use `spoken()` for accessible names and for copy that must render as real text. Never
type one of those strings into a source file — `npm run audit:names` will reject it,
and correctly so.

### Motion

`src/lib/motion.ts` is the only place that talks to GSAP. `EASE = 'power2.out'`,
`SCRUB = 1`, `PIN_DISTANCE = '250%'`, parallax rates `0.3 / 0.6 / 1.0` (foreground
fastest).

- `useReveal` - fade + 24px rise on enter, **once**, never reverses. The default for all
  content, and the only motion permitted on a clue-bearing section (Rule 5).
- `usePinnedScene` - pin + scrub. Hero and the ridge scene only. Never used to reveal
  anything a visitor has to read.
- Lenis (`SmoothScroll`) drives `gsap.ticker` and `ScrollTrigger.update`, so there is
  exactly one rAF loop and one scroll position.
- Under `prefers-reduced-motion`: no pin, no scrub, no parallax, no ticker.

### Specimen

`/style` renders the whole system - colour ramp with live contrast ratios, every type
step, the harvested components and a motion demo. It is registered **only** under
`import.meta.env.DEV` and is absent from production bundles.

---

## Code conventions

- All user-visible copy lives in `src/content/site.ts`, never inline in JSX.
- Sections are presentational; content arrives via props.
- Every GSAP ScrollTrigger must be created inside a `gsap.context()` and reverted on unmount.
- Never mix Framer Motion and ScrollTrigger on the same CSS property.
- Respect `prefers-reduced-motion`: swap scrub animations for simple opacity fades.
- Tailwind v4: design tokens are CSS custom properties in `styles/globals.css`,
  consumed via arbitrary values. No `tailwind.config.js` theme bloat.
- Generated files (`src/content/outlines.ts`, `src/content/plates.ts`) are never
  edited by hand. Re-run the generator instead; the header of the file names it.
- Images are rendered by `<Plate/>`, never a bare `<img>`. It carries the
  width/height, the srcset and the load policy. The three clue-bearing plates
  pass `priority="early"` so they are fetched well before they are scrolled to —
  a clue that fails to paint for a fast scroller is a clue that does not exist.
- Seals are drawn by `<Seal/>` from `ringPlan`, at 128px diameter or larger.
  Below that the ring lettering stops being readable.

---

## Do not

- Do not add analytics, cookie banners, or third-party scripts.
- Do not add a real site-wide find feature. (An input with that label would be a
  false positive that wastes participants' time and undermines the actual clue.)
- Do not "helpfully" make any clue more discoverable. Placement is specified in
  `prompts/03-clue-architecture.md` and is deliberate.
- Do not import anything from `_private/` in application code.
- Do not re-enable production source maps.
- Do not hand-tune one seal, or one route card. They are sets, and a member of
  a set that differs is the member everyone looks at.
