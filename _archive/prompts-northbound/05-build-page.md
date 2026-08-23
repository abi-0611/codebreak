# PHASE 5 — Build the main page

**Goal:** the homepage — a cinematic scroll narrative that reads as an ordinary brand site and quietly carries four of the six clues.
**Prereq:** Phases 1-4 complete.
**Done when:** `/` scrolls end to end at 60fps, contains clues 1-5 minus ReactJS, and looks like a real company built it.

> **Run this phase ONE TASK PER PROMPT.** This is the single most important process rule in the whole system. Pasting all nine sections at once produces a generic page every time. One section per prompt, review, then the next.

---

## Section order

| # | Section | Ground | Motion | Clue |
|---|---|---|---|---|
| 1 | Hero — Approach | `--scene-approach` | pinned + scrub | — |
| 2 | Ethos | `--scene-ascent` | reveal | decoy: Cache Ridge |
| 3 | Routes carousel | `--scene-camp` | horizontal scroll | **Pinecone** |
| 4 | Ragged Ridge | `--scene-ridge` | pinned + scrub | **RAG** |
| 5 | Safety | `--scene-camp` | reveal | **search** |
| 6 | Logistics | `--scene-camp` | reveal | **Express** |
| 7 | Permits accordion | `--scene-dusk` | reveal | **OCR** |
| 8 | Journal | `--scene-dusk` | reveal | decoy: Index Peak |
| 9 | Footer | `--scene-dusk` | — | link to Careers |

---

## Task 5.1 — Shell

```
Build the persistent layer before any section:

- SmoothScroll provider (Lenis) wrapping the app
- Nav: transparent over the hero, gains a blurred bone background after 80px of scroll.
  Links: Routes / Safety / Permits / Journal — all real anchors to real sections.
- ScrollProgress: a 2px --moss line at the top of the viewport
- AccessPill: persistent bottom-centre "Request Access" pill, appearing after the hero.
  On click, opens a simple modal with an email field and a "join the 2026 ballot" line.
  It does not need a backend — validate, then show a confirmation state.

The pill must never overlap a clue at any breakpoint. Check this again at 375px in
Phase 7 — a fixed-position pill covering the accreditation seals would be a disaster.
```

---

## Task 5.2 — Section 1: Hero

```
Full-bleed hero on --scene-approach. Pinned, 250vh scroll distance, scrub 1.

Layers, back to front, parallax at 0.3 / 0.6 / 1.0:
  1. hero-01.webp, scaling 1.15 -> 1.0 across the pin
  2. a soft fog gradient overlay
  3. the headline

Headline: "The mountain" / "does not negotiate."
  Instrument Serif, clamp(3.5rem, 13vw, 12rem), --ink.
  Split across the viewport — "The mountain" upper-left, "does not negotiate." lower-
  right, deliberately unbalanced. Never centre it as one tidy block.
  Reveal with a clip-path inset wipe from the bottom, staggered per word, using <Split/>.

Bottom-left: eyebrow "EST. 2011 / CHAMONIX".
Bottom-right: a thin scroll cue that fades out after the first 200px.

Kill the ScrollTrigger on unmount via gsap.context().
```

---

## Task 5.3 — Section 2: Ethos

```
--scene-ascent. Standard reveal, no pinning — the page needs to breathe after the hero.

Two-column asymmetric layout:
  left  (5 cols): ethos-01.webp
  right (6 cols, offset down 120px): eyebrow "COMPASS BEARING" [decoy],
                                     headline "We do not sell summits.",
                                     two Body paragraphs

The copy mentions a past expedition to Cache Ridge [decoy]. Write it as genuine brand
copy about risk and preparation — understated, technical, a little severe. If it reads
like marketing, rewrite it.
```

---

## Task 5.4 — Section 3: Routes carousel — CARRIES CLUE 2

```
--scene-camp. Uses the carousel harvested from 21st in Phase 2.

Five cards, all identical in construction:
  route-01  Vector Ridge     3,120M   Technical
  route-02  Col du Nord      2,650M   Alpine
  route-03  Pinecone Pass    2,840M   Alpine      <- CLUE 2, in the image
  route-04  Beacon Traverse  3,410M   Technical
  route-05  Sable Pass       2,300M   Glacier

Each card: image, name, elevation, grade, and a "View route" link to /routes/:slug.

BUILD ORDER MATTERS. Build cards 1, 2, 4, 5 first and get them looking right. Only then
place card 3 into the finished pattern. Building the clue card first leads to
unconsciously giving it more attention, and that shows.

CARD TITLES — this is the detail that decides whether clue 2 survives.

A card title rendered as ordinary DOM text hands "Pinecone Pass" to Ctrl+F instantly.
But removing the names, or giving card 3 a different name from its plate, makes the
carousel look broken and fake — which violates Rule 8 and is worse.

So: render ALL FIVE route names as small outlined-SVG wordmarks via <OutlineText/>,
set below each photograph. Route names as a stylised wordmark is an ordinary editorial
choice for a card like this, it looks deliberate rather than evasive, and it keeps every
one of the five names out of the DOM — so the clue is protected by the same treatment
its four siblings receive, which is exactly what camouflage rule 1 asks for.

Elevation, grade and the "View route" link stay as normal DOM text on all five cards.
Each card carries aria-label with its real route name for screen readers.

Touch requirement: swipeable AND arrow controls, and card 3 must be reachable in at
most two swipes from rest at 375px.
```

---

## Task 5.5 — Section 4: Ragged Ridge — CARRIES CLUE 5

```
--scene-ridge (near-black). This is the site's cinematic centrepiece and the one place
we spend the motion budget. Pinned, 250vh, scrub 1.

Layers:
  1. ridge-01.webp, slow 1.2 -> 1.0 scale, very low key
  2. a drifting particle field — sparse, slow, no more than 40 particles, CSS only.
     If it costs more than 2ms per frame, delete it.
  3. The headline, as <OutlineText/> from Phase 4:

        RAGGED
        RIDGE

     Enormous — 12vw or larger, --bone, stacked, tight leading. It fills the viewport.
     Revealed with a mask wipe, then it STAYS (Rule 5). Do not tie its opacity to
     continued scrub progress.

  4. Below it, small: "2024 first ascent. Four days on the north face."

This is the best-hidden clue on the site precisely because it is the biggest thing on
the site. Do not add anything that draws attention to it. No highlight, no colour
shift, no lingering hover state. Treat it as pure art direction.

Verify Ctrl+F "RAGGED" returns nothing.
```

---

## Task 5.6 — Section 5: Safety — CARRIES CLUE 1

```
--scene-camp. Reveal only.

Real content first: a heading "Basecamp Protocol" [decoy], three short columns on
acclimatisation, weather windows, and turnaround times. Write it so it genuinely
informs — this section must survive the deletion of its clue.

Then, beneath it, the accreditation strip: four circular seals in a row, rendered from
the outlined SVG paths built in Phase 4.

    UIAGM CERTIFIED    SEARCH & RESCUE    ALPINE TRUST    IFMGA

All four identical in diameter, ring weight, letter spacing and opacity. Muted --stone,
sitting quietly under the columns the way real accreditation rows do.

Do NOT add a hover state to the seals. Do NOT link them. Do NOT add a tooltip. They are
decoration that happens to be readable, which is exactly what real ones are.

At 375px the four seals wrap to a 2x2 grid. All four must remain legible at that size —
they are the single most likely thing to become an unreadable smudge on mobile. Test it.
```

---

## Task 5.7 — Section 6: Logistics — CARRIES CLUE 3

```
--scene-camp. Reveal only.

Left: two Body paragraphs on how transfers, permits and porters are handled.
Right: <Figure> with logistics-01.webp and the caption
       "Valley transfer, included with every permit."

The figure renders through the exact same <Figure> primitive as the journal photo in
section 8. Same border, same caption style, same spacing. Verify by placing them
side by side in a scratch view and confirming they are indistinguishable.

The image is a flat-lay containing a ticket among other desk objects. The participant
must actually look at the photograph to find ALPINE EXPRESS. Do not enlarge the figure
beyond its siblings to "help" — that is a tell.
```

---

## Task 5.8 — Section 7: Permits accordion — CARRIES CLUE 4

```
--scene-dusk. Uses the accordion harvested from 21st in Phase 2.

Four panels, genuinely useful content in each:
  1. "Which permits do I need?"
  2. "How long does permit approval take?"        <- CLUE 4 lives here
  3. "Can permits be transferred?"
  4. "What happens if weather cancels an ascent?"

Panel 2 body: two sentences on the approval timeline, followed by a <Figure> holding
permit-01.webp with the caption "A 2024 access permit, post-approval."

HARD REQUIREMENT: panel bodies must be conditionally rendered — absent from the DOM
when collapsed, not merely display:none. Verify by inspecting the DOM with all panels
closed and confirming no panel body markup exists. This is technique C and it is the
reason this clue is rated Hard.

Panel 1 should be closed on load like the rest. Do not default-open any panel.
```

---

## Task 5.9 — Section 8: Journal, and Section 9: Footer

```
JOURNAL (--scene-dusk)
Three entries, dates and titles, one with journal-01.webp. One entry references
Index Peak [decoy]. Titles link to /journal/:slug — build one real detail page and
have the other two link to it, or write all three. No dead links (Rule 8).

FOOTER (--scene-dusk)
Large editorial footer from 21st, restyled. Four columns:
  Expeditions: Routes / Grades / Summit Stack [decoy] / Equipment
  Company:     About / Careers / Permits / Contact
  Legal:       Terms / Privacy / Insurance
  Contact:     a Chamonix address, a phone number, one email

The Careers link is clue 6's entire discovery path. Keep it completely ordinary —
second item in the Company column, same weight as its neighbours. Do not order the
columns to make it prominent. Do not make it the only link that does anything
interesting on hover.

Bottom bar: the brand mark, "© 2026 NORTHBOUND", and nothing else.
No "built with" credit — that is where a participant would expect a tech term, and
finding nothing there is a useful dead end.
```

---

## Phase 5 exit check

```
Run through and report:
- Full-page scroll at 60fps; no layout shift between scene colour transitions
- Ctrl+F on the homepage for: search, rescue, ragged, pinecone, express, ocr, reactjs
  -> ALL SEVEN must return zero matches
- Ctrl+F for: vector, beacon, index, cache, compass -> these SHOULD match (decoys)
- All panels closed on load, and no panel body markup in the DOM
- prefers-reduced-motion: all content still reachable, all four homepage clues visible
- Screenshot the full page at 1440px and at 375px and show me both
```
