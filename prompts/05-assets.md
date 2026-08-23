# PHASE 5 — Assets

**Read first:** `04-clue-architecture.md` — four of the six clues are produced by the
generators in this phase.
**Invoke:** `brandkit` (the house mark and wordmark), `poster-design` and
`canvas-design` (seals, certificates, ornamental plates), `imagegen-frontend-web`
(photographic frames).

**Outcome:** every image the site ships, drawn offline, deterministic, committed —
plus `app/content/plates.ts` and `app/content/outlines.ts` generated alongside them.

**The governing principle:** everything here is generated **offline and committed**.
No conversion in the browser, no font fetched at runtime, no image built at request
time. The build is reproducible and the artwork is reviewable in a diff.

---

## Task 5.1 — The identity

`scripts/mark.mjs` draws, and commits to `public/img/`:

- **The house mark** — a heraldic crocus device, three stigmas over a stylised
  corm. It must work as: a 24px favicon, a 36px header lockup, an extruded 3D object
  (scene 3), and a relief in the medallion field (scene 2). Draw it as a single
  closed path so the extrusion is clean.
- **The wordmark** — `CROCARIA` in a light serif with the same optical weight as the
  reference's wordmark. Output is **outline path data**, not text, because
  `<SiteHeader/>` consumes it as a `mask-image` data-URI (teardown §8.2).

Use `brandkit` for the concepting pass, then commit the chosen geometry. Do not leave
the mark as a generated-at-build-time artefact.

## Task 5.2 — The glyph library

`scripts/lib/glyphs.mjs` — the shared substrate for T-A and T-B.

It loads committed WOFF/TTF files from `_private/fonts/` via `opentype.js` and returns
**path geometry** for a string at a size. Everything that draws type — the raster
generators, the outline generator, the GL texture baker — goes through it.

The reason is stated in `04-clue-architecture.md` §1 and is worth repeating: a
rasteriser asked to draw `<text>` must locate the face on the machine, and will
quietly fall back to a system font when it cannot. On this site that produces a clue
set in Arial on a Victorian engraving — a typographic anomaly that hands the answer
to anyone who notices it.

## Task 5.3 — Outline geometry (technique T-B)

`scripts/outline.mjs` reads `_private/type-jobs.json` and writes
`app/content/outlines.ts`.

Consumers: the wordmark, display headlines that need it, and **the three service-mark
labels in §6** — one of which is the `Express` clue.

Rules, carried forward from the archived build because they were right:

- **Never emit SVG `<text>`.** Chrome's find-in-page matches it. Emit `<path>` only.
- `<OutlineText/>` carries `role="img"` and an `aria-label` so assistive technology
  announces the line normally.
- The technique is confined to **display type and short labels**. It never touches
  running copy, navigation, captions, or anything a reader has to work through.

### The accessibility trade-off, stated plainly

A line drawn as geometry cannot be selected, copied, translated by the browser, or
reflowed at large text settings. `aria-label` is a genuine mitigation for screen
readers — it is not a fig leaf — but it does not restore selection or browser
translation, and nothing does.

This trade-off is **accepted deliberately** and is confined to display type. The
event requires that six strings resist find-in-page; that requirement cannot be met
and also leave those six strings selectable. Everything that is not one of those six
strings stays real, selectable text.

## Task 5.4 — Raster artwork (technique T-A)

`scripts/plates.mjs` — one generator, deterministic, output committed to
`public/img/`. Strings live in git-ignored `_private/plate-jobs.json`, never in the
script (the script is in the repo; the repo is private but the discipline is free).

Pieces to draw:

| Output | Carries | Notes |
|---|---|---|
| The assay seal | **`search`**, decoy `QUERY` | oval, ring lettering, heraldic engraving. Inner band `WEIGHED · SEARCHED · SEALED`, outer band carries the decoy |
| The certificate | **`RAG`** | a lot certificate, photographed at an angle in the pinned scene's step 3. Footer band `STRUCK ON RAG PAPER · NO. 0417` |
| The ornamental plate | **`Pinecone`**, decoy `CACHE` | Victorian specimen engraving, six labelled details — one is the clue, five are decoys |
| The crate stencil | decoy `DOCKER` | composited onto a warehouse frame |
| The noticeboard | **`ReactJS`** | four pinned cards on an office wall; three are decoy roles |
| The medallion rim texture | **`OCR`** | consumed by GL scene 2 (task 3.5), and by its static fallback frame |
| Static fallback frames | — | one per GL scene; the medallion's must show `OCR` as legibly as the live scene |

### Rules for anyone editing this generator

- **Sets are one function called N times.** Six specimen labels, four noticeboard
  cards, three custody stamps — one function, N calls. Do not special-case the member
  that carries the clue, and do not give it its own crop, grade or plate geometry.
  Identical-but-for-the-string is the entire defence.
- **A clue-bearing plate must never be the brightest or highest-contrast thing in its
  frame.** If the eye goes straight to it, recomposite until it reads only when
  looked at.
- **Check legibility by the numbers.** The generator prints the cap height each term
  lands at on a 375px viewport, and **exits non-zero under 7px**. Do not eyeball it.
- **Neutral filenames.** `plate-04.webp`, `stamp-02.webp`. Never `assay-seal.webp`,
  never anything describing what it carries. Participants can read the network tab.
- Drop a photograph at `_private/frames/<stem>.png` to use photography instead of a
  drawing; the plates and stamps still composite on top.

## Task 5.5 — `app/content/plates.ts`

Generated alongside the images. Holds every image's intrinsic size and available
widths, so `<Plate/>` reads dimensions from there and a `width`/`height` attribute
can never drift from the file on disk. Never hand-edited; the file header names its
generator.

## Task 5.6 — Photography

The reference uses crocus macro photography for the pinned scene and architectural
interiors for the carousel cards. Source or generate equivalents:

- **Pinned scene, four frames** — crocus macro, dark ground, shallow depth of field.
  Step 3 is the frame the certificate composites onto.
- **Carousel cards** — six architectural interiors, low luminance, warm.
- **`/roles` noticeboard** — one office-wall frame.
- **Link tiles** — four low-luminance loops or stills.

Every one: WebP, `srcset` at 1×/2×, and sized so the total page stays inside rule 9's
2.5 MB. The pinned scene's four frames are the biggest line item — budget 700 KB for
all four together and compress hard. They sit behind a caption card and are never the
subject.

## Task 5.7 — `_private/KEY.md`

Written as a **by-product of the generators**, not by hand, so it cannot drift from
what shipped. Contents are specified in `04-clue-architecture.md` §6.

Include the printed cap-height measurement for each term next to its screenshot. That
number is the evidence that rule 4 holds, and it is the first thing to check if a
playtester reports a clue as unfindable.

---

## Exit criteria

- [ ] `npm run plates`, `npm run outline` and `npm run mark` are deterministic —
      running twice produces an identical diff (i.e. none).
- [ ] Every generated file is committed. Nothing is built at request time.
- [ ] No runtime font fetch. No browser-side conversion.
- [ ] Every clue-bearing image reports cap height ≥ 7px at 375px; the generator fails
      the build otherwise.
- [ ] No image filename contains a banned token or describes its contents.
- [ ] Total image payload under 1.6 MB, leaving headroom inside the 2.5 MB budget.
- [ ] Sets are visibly uniform — put the six specimen labels side by side and confirm
      you cannot tell which one is the clue from its treatment alone.
- [ ] `_private/KEY.md` regenerated, with screenshots and cap heights.
- [ ] `npm run audit:names` passes.
