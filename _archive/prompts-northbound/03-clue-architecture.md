# PHASE 3 — Clue architecture

**Goal:** decide exactly what is hidden, where, how it resists Ctrl+F, and how it stays invisible as a puzzle.
**Prereq:** Phase 2 complete.
**Done when:** the clue spec is committed to `src/content/site.ts`, the `<Split/>` and `<OutlineText/>` utilities exist, and `_private/CLUE-KEY.md` is written.

> Read this file completely before writing any code. The placements are load-bearing.

---

## Task 3.1 — Understand the Ctrl+F threat

This is the phase's whole reason for existing.

The moment a participant presses **Ctrl+F** and types `RAG`, an unprotected site is solved. Not in ten minutes — instantly. Six terms, six searches, done. Round 1 evaporates.

### What does NOT work

| Technique | Verdict |
|---|---|
| Splitting text into per-character spans | FAILS. Chrome's find-in-page normalises text *across inline element boundaries*. Three spans holding R, A, G are still matched. GSAP SplitText does not protect you. |
| `opacity: 0` / `font-size: 0` / off-screen text | Fails, and violates Rule 1 (must be visually readable) |
| `visibility: hidden` / `display: none` | Not found by Ctrl+F, but also not visible — violates Rule 1 |
| CSS `order` to visually reorder letters | Works, but breaks copy-paste and screen readers for no real gain |
| Blocking Ctrl+F with a keydown handler | Hostile, bypassed via the browser menu in one click, and a loud tell |

### What DOES work — the three sanctioned techniques

**A. Raster-baked text.** The term is part of a `.webp` image — a stamp, a printed label, a ticket. Find-in-page cannot read pixels. Fully immune.

**B. Outlined SVG text.** The term is drawn as SVG `<path>` geometry, not `<text>`. Inline SVG `<text>` **is** matched by Chrome, so the glyphs must be converted to paths. Fully immune, and stays crisp at display sizes.

**C. Not in the DOM.** The term lives inside a collapsed accordion panel or a different route, and is conditionally rendered — not merely hidden with CSS. Immune until the participant opens it, which is the discovery act itself.

Every one of the six clues uses A, B, or C. Several use two.

### The elegant part

**Decoys are deliberately left as plain DOM text.** So the participant who reaches for Ctrl+F gets a fistful of `Vector`, `Index`, `Node`, `Beacon` — and not one real answer. The lazy path returns confident nonsense. That is the trap, and it is the best thing in this design.

---

## Task 3.2 — Build the two text utilities

```
Create src/lib/split.tsx exporting TWO components. Their roles are different and must
not be confused.

1. <Split text="..." />
   Per-character spans for staggered GSAP reveals.
   PURELY DECORATIVE — this is an ANIMATION tool, NOT a Ctrl+F defence.
   Add a code comment saying exactly that, so nobody later assumes it protects anything.
   Accessibility: aria-label on the wrapper, aria-hidden on the character spans.
   Never use this to render a clue.

2. <OutlineText />
   Renders pre-outlined SVG paths as a headline.
   Props: paths (string[]), viewBox, className, label (for aria-label).
   Markup: an svg with role="img" and aria-label, containing only path elements.
   NO text element anywhere — SVG text is Ctrl+F-searchable and defeats the point.
   The aria-label gives screen readers the words without exposing them to find-in-page.
   This is the accessibility mitigation for an intentionally non-selectable headline;
   record the trade-off in CLAUDE.md.

To produce outlined paths, use an offline tool and commit the resulting path data as
constants in src/content/. Do not fetch a font at runtime and convert in the browser.
```

---

## Task 3.3 — The clue placement spec

Commit this table into `src/content/site.ts` as typed content, and mirror it into `_private/CLUE-KEY.md`.

### Clue 1 — `search`

| | |
|---|---|
| **Reads as** | SEARCH & RESCUE |
| **Where** | Safety section, accreditation badge strip |
| **Presented as** | One of four circular accreditation seals: UIAGM CERTIFIED / SEARCH & RESCUE / ALPINE TRUST / IFMGA |
| **Technique** | **B** — outlined SVG, curved around the seal ring like real certification marks |
| **Difficulty** | Easy |
| **Why it works** | Every real outfitter has a badge row. Nobody reads badge rows. It is on-screen the whole time and still gets missed. |

### Clue 2 — `Pinecone`

| | |
|---|---|
| **Reads as** | PINECONE PASS |
| **Where** | Routes carousel, card 3 of 5 |
| **Presented as** | A metal name-plate riveted to a trail-marker post inside the card photograph, reading PINECONE PASS / 2,840M |
| **Technique** | **A** — baked into the image, plus **C** — card 3 is off-screen until the carousel is advanced |
| **Difficulty** | Medium |
| **Neighbours** | Cards 1, 2, 4, 5 are Vector Ridge, Col du Nord, Beacon Traverse, Sable Pass — set in the identical plate style |

### Clue 3 — `Express`

| | |
|---|---|
| **Reads as** | ALPINE EXPRESS |
| **Where** | Logistics section |
| **Presented as** | A shuttle ticket lying at a slight angle on a desk. ALPINE EXPRESS runs across the header in a transit-style face, with seat and coach numbers and a punch hole |
| **Technique** | **A** — baked into the image |
| **Difficulty** | Medium |
| **Caption** | "Valley transfer, included with every permit." — flat, informational, no nudge |

### Clue 4 — `OCR`

| | |
|---|---|
| **Reads as** | OCR VERIFIED |
| **Where** | Permits accordion, panel 2 of 4 — *"How long does permit approval take?"* |
| **Presented as** | A photographed permit document, rotated about 3 degrees, with a rubber-stamp impression in the corner reading OCR VERIFIED / 14 MAR in slightly misaligned ink |
| **Technique** | **A** — baked into the image, plus **C** — panel content is unmounted until tapped |
| **Difficulty** | Hard |
| **Why it works** | Requires opening the *second* panel specifically. Most people open panel 1, skim, and move on. |

### Clue 5 — `RAG`

| | |
|---|---|
| **Reads as** | RAGGED RIDGE |
| **Where** | The pinned dark feature scene — the site's single most cinematic moment |
| **Presented as** | Enormous display headline, RAGGED stacked over RIDGE, filling the viewport |
| **Technique** | **B** — outlined SVG paths |
| **Difficulty** | Easy to see, hard to *recognise* |
| **Why it works** | The best clue in the set. It is the largest text on the entire website. Participants scroll straight past it because they are hunting for something small and hidden — nobody suspects the headline. The word RAG sits at 12vw and stays invisible for exactly that reason. |

### Clue 6 — `ReactJS`

| | |
|---|---|
| **Reads as** | Frontend Engineer — ReactJS |
| **Where** | `/careers`, third job listing, inside its collapsed detail panel |
| **Presented as** | A normal listing: title, location "Chamonix / Remote", then in the expanded body "Requirements: 4+ years ReactJS, mapping libraries, offline-first PWAs" |
| **Technique** | **C** — separate route AND unmounted panel |
| **Difficulty** | Hard |
| **Discovery path** | Footer to Careers. Keep the footer link ordinary: About / Careers / Permits / Contact |
| **Note** | This is the only clue rendered as ordinary DOM text, and the only one where in-page Ctrl+F would work — but only after the participant has already navigated to `/careers` and opened the right panel, which is the discovery act. Acceptable. |

---

## Task 3.4 — Camouflage rules

```
Enforce these while building every section. Violations are why these hunts fail.

1. IDENTICAL TREATMENT. A clue-bearing figure, card, badge or panel must be visually
   indistinguishable from its non-clue siblings — same size, border, caption weight,
   spacing, shadow, hover state. Build the siblings FIRST, then place the clue into the
   established pattern. Never build the clue element first and pad around it.

2. NEVER ALONE. No clue is ever the only item of its kind. The seal has three sibling
   seals; the ticket shares a desk with other items; the permit stamp sits among other
   stamps and annotations; the route card is one of five. A lone element is a spotlight.

3. NO INTERACTION TELLS. Clue elements get no special cursor, no scale-on-hover the
   siblings lack, no distinct transition timing.

4. DEAD-FLAT COPY. Captions and labels near a clue must be the most boring sentences on
   the site. No wordplay, no emphasis, no "look closer", no italics. Wit is a tell.

5. LOAD-BEARING CONTEXT. Each clue sits in a section that has a real reason to exist.
   The safety section genuinely explains safety. The permits accordion genuinely answers
   permit questions. Delete the clue and the section still makes sense.

6. NO CLUSTERING. The six are spread across five sections and two routes. Finding one
   must give no hint where the next is.
```

---

## Task 3.5 — Decoys

```
Seed these through the copy as ORDINARY DOM TEXT — plain, selectable, Ctrl+F-findable.
That asymmetry is the point: search-engine behaviour surfaces only false positives.

  Vector Ridge        route card 1
  Beacon Traverse     route card 4
  Index Peak          mentioned in the journal entry
  Node Camp           a waypoint on the route detail page
  Cache Ridge         mentioned in the ethos section
  Summit Stack        a gear bundle name in the footer
  Compass Bearing     a section eyebrow
  Basecamp Protocol   a safety subsection heading

Rules:
- Every decoy must be genuinely plausible mountaineering vocabulary. A decoy that reads
  as planted is worse than no decoy.
- Eight is the ceiling. More and the site starts to feel like a word search, which
  breaks Rule 3.
- Decoys are never rendered with technique A or B. They stay cheap and findable.
```

---

## Task 3.6 — Fairness ledger

```
Write _private/CLUE-KEY.md containing, for each of the six:
  term, exact rendered text, route, section, DOM landmark, technique (A/B/C),
  difficulty, and a one-line "how a participant finds this".

Then add a difficulty distribution check and confirm it reads:
  Easy 2 (search, RAG)   Medium 2 (Pinecone, Express)   Hard 2 (OCR, ReactJS)

Target solve time for a competent team: 12-20 minutes for all six.
If your build makes any clue findable in under 60 seconds, or plausibly unfindable in
40 minutes, flag it to me rather than shipping it.

State clearly at the top of the file:
ORGANIZER ONLY — GIT-IGNORED — NEVER DEPLOYED.
```

---

## Phase 3 exit check

```
Confirm before moving on:
- <Split/> and <OutlineText/> exist, and <Split/> carries the comment saying it is not
  a Ctrl+F defence
- src/content/site.ts holds all six clue strings and all eight decoys as typed data
- _private/CLUE-KEY.md is written and git-ignored
- No source file name or identifier contains a banned token (re-run the Phase 1 grep)
```
