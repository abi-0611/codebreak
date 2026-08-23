# PHASE 6 — The home page

**Read first:** `REFERENCE-TEARDOWN.md` §7 (the section inventory, with measured
heights) and §8 (component behaviour).
**Invoke:** `image-to-code`, `frontend-design`, `full-output-enforcement`.

**Run this phase one section at a time.** One section per prompt. This is the
difference between a replica and an approximation, and it is not negotiable — a
single prompt asking for eleven sections produces eleven summaries of sections.

---

## The fidelity loop

Use it on **every** section. This is the method; the section tasks below are just the
list of things to point it at.

1. Open the reference in one browser tab, our build in another.
2. Scroll both to the same section.
3. Measure the same element in both:

```js
const el = document.querySelector(SELECTOR)
const c  = getComputedStyle(el)
;[c.fontFamily, c.fontSize, c.lineHeight, c.fontWeight, c.color,
  c.paddingTop, c.paddingBottom, c.marginTop, c.borderTopColor,
  el.getBoundingClientRect().height]
```

4. Close the gap. Repeat until the arrays match.
5. Only then screenshot both and compare visually.

**Screenshots come last, not first.** An 8px spacing drift is invisible in a
screenshot and obvious in a computed style. Teams that compare screenshots first
spend the phase chasing the wrong differences.

Measured heights in teardown §7 are at 1440×860. Ours will not match to the pixel —
our copy is different lengths — but they should land within about 10%. A section
that is 40% off has a structural error, not a copy-length difference.

---

## Section 0 — WebGL hero backdrop

`div.absolute.top-0.inset-x-0.h-full-screen.overflow-hidden`, GL scene 1 from phase 3,
parallaxed with `translate3d`. Sits behind everything; the hero content is `z-2`.

## Section 1 — Hero

Reference height 1067. Structure, measured:

```
div[data-js="gl-hero"]
  div.absolute.inset-0.s:pt-100.s:px-20
    p.type-body-md.s:max-w-[35rem].hidden.s:block   ← the sub, desktop position
  div.flex.flex-col.items-center.gap-y-15.s:gap-y-30.relative.z-2.text-center
     .pt-150.pb-100.s:py-0.px-20.s:px-0
    h1.type-display-xl                              ← "The Red Harvest"
    p.type-body-md.s:max-w-[35rem].block.s:hidden   ← the sub, mobile position
    Pill                                            ← "Open Ledger"
  StatBox   (s:absolute s:bottom-110 s:right-20, bg-black, z-3)
Marquee     (partner strip)
```

Note the sub-headline is rendered **twice** and toggled by breakpoint — top-left on
desktop, under the h1 on mobile. That is what the measured markup does; do not
"clean it up" into one node with responsive positioning, because the two positions
are in different stacking contexts.

Copy: h1 `The Red Harvest`, sub `Provenance for every thread.`, pill `Open Ledger`.
Stats: `TOTAL YIELD`, `TOTAL BONDED`, `TOTAL LOTS`.

The marquee cells hold **estate partner** wordmarks — fictional estates, drawn in
phase 5, divided by `brown-dark` verticals.

## Section 2 — The House Medallion  ·  carries clue 1 (`OCR`, T-C)

Reference height 813. `section.relative.z-2`, black.

GL scene 2 above, then `type-h2` heading, then a copy block, then two stat rows
(`REGISTERED ESTATES` / `LOTS IN CIRCULATION`) in the mono-uppercase treatment.

**Clue constraints, from `04-clue-architecture.md`:** the medallion rests face-on with
the rim legible; `O.C.R.` sits at ~4 o'clock; the static fallback frame carries it
identically. Verify at 375px before calling this section done.

Heading: `The House Medallion`. Body: the registry, the mint year, the 120-year
provenance chain — trade language, no adjectives.

## Section 3 — The Lot Ledger

Reference height 966. `section.border-t.border-brown-dark.pb-65.s:pb-180.overflow-hidden`.

`<Ledger/>` from phase 2, then a copy block with a `type-h2`, a `type-body-lg` lede,
a body, and a pill.

Columns: `LOT` · `ORIGIN` · `GRADE` · `CROCIN INDEX` · `RESERVE`.
Seven rows, paired origin chips. Decoys live here: `INDEX`, `PORT`, `VECTOR`,
`STACK`, `KERNEL`, `LAMBDA`, `CLUSTER` — distributed across column headers and row
values, none adjacent to a clue-bearing section.

Heading: `Every lot, traced to its furrow`.

## Section 4 — Assay & Certification  ·  carries clue 2 (`search`, T-A)

Reference height 721. `section.border-t.border-brown-dark.bg-brown-darker` — this is
the first ground change on the page.

The assay seal image centred, the vertical centre hairline running behind it, then
`type-h2`, a `type-body-lg` lede, a pill, then a body block.

**The seal renders at 128px diameter minimum** (phase 2 conventions) or the ring band
carrying `SEARCHED` is illegible and rule 1 fails. On a 375px viewport that means it
occupies most of the column width. Check the rendered diameter, do not assume it.

Heading: `Assay and certification`. Lede: 120 years of assay, the crocin standard,
the bonded chain of custody.

## Section 5 — The Season  ·  carries clue 3 (`RAG`, T-A)

Reference height 2057. `section.relative.h-[300vh].border-t.border-brown-dark`.

The pinned scene from phase 3, task 3.3. Four steps, discrete, stable:

1. The corms go in — October, the planting.
2. The flowering — a two-week window, harvested before dawn.
3. **The certificate** — the lot is struck, sealed and registered. This is where the
   certificate carrying `RAG` is photographed into the frame.
4. The vault — bonded storage, the ledger entry.

Caption card: `bg-black` with a `brown-dark` border, bottom-left, `type-body-md`.
Gold progress bar along the bottom edge tracking overall timeline progress.

**Rule 5 is the whole risk in this section.** Step 3's certificate must be fully
opaque for the entire step, must survive scrolling back up, and must appear in the
reduced-motion stacked layout. Test all three explicitly, at 375px.

## Section 6 — Held by the Guild  ·  carries clue 4 (`Express`, T-B)

Reference height 1017. `section.border-t.border-brown-dark`, black.

GL scene 3 (the extruded house mark), then `type-h2`, a body, two pills
(`The Guild` / `Charter`), then the **three service marks** as a 3-up row:

```
BONDED · EXPRESS · TRACEABLE
```

All three rendered by `<OutlineText/>` from the same generator call, each with a
`type-body-md` description beneath. **Do not hand-tune one.** Put the three side by
side and confirm they are indistinguishable in treatment.

Heading: `Held by the Guild`. Body: the house is held by 41 estate families; charter
decisions require a vote of the guild.

## Section 7 — Crocaria Dispatches  ·  carries clue 5 (`Pinecone`, T-A)

Reference height 918. `section.bg-brown-darker.border-t.border-brown-dark.overflow-hidden.z-3`
— note `z-3`, higher than every other section, because the carousel overflows.

The ornamental plate centred with the vertical hairline behind it, then `type-h2`,
a body, then `<Carousel/>` of six dispatch cards.

The plate carries six specimen labels; one is `PINECONE RESERVE · LOT 04`, five are
decoys. One function, six calls.

Cards: date in gold Roboto Mono, title in `type-h2`, standfirst in `type-body-md`,
architectural interior header with the `CROCARIA DISPATCHES` wordmark overlaid and an
index pill.

## Section 8 — FAQ

Reference height 747. `section.border-t.border-brown-dark`.

Centred `type-display-xl` heading set on three lines (`Frequently / asked /
questions` in the reference — ours matches that rhythm), then `<Accord/>` with five
rows, then a `View All` pill to `/faq`.

First row open by default, exactly as the reference does — it is what teaches the
component's behaviour.

## Section 9 — Link tiles

Reference height 544. `section.relative.pb-20.s:pb-0`.

2×2 grid (1×4 stacked on mobile), `brown-dark` hairlines between, each tile with its
own low-luminance backdrop and a centred Roboto Mono uppercase label:

`THE HOUSE` → `/house` · `DISPATCHES` → `/dispatches` · `THE LEDGER` → `/ledger` ·
`ROLES` → `/roles`

## Section 10 — Footer

Reference height 483. Teardown §8.9, verbatim.

Wordmark → description → primary pill → social glyph row → hairline → `MENU`
accordion (gold label, `↓`) → hairline → copyright, legal links, credit line, all
Roboto Mono uppercase.

Footer meta uses the lifted `#962817` variant from phase 1 task 1.6, not the raw
value — it is running text and the raw value fails AA on black.

**No clue in the footer** (`04-clue-architecture.md` §4.6). It gets disproportionate
attention.

---

## Exit criteria

- [ ] All eleven sections present, in order, matching teardown §7's classes, grounds
      and `z` values.
- [ ] Every section carries `border-t border-brown-dark`. No exceptions — count them.
- [ ] Measured heights within ~10% of the reference at 1440×860.
- [ ] The fidelity loop run on every section, with the computed-style arrays matching.
- [ ] Clues 1–5 placed and verified legible at 375px.
- [ ] Decoys distributed, none adjacent to a clue-bearing section.
- [ ] `npm run audit:names` passes.
