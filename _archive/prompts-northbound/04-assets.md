# PHASE 4 — Asset production

**Goal:** every image the site needs, including the three that physically carry clues.
**Prereq:** Phase 3 complete.
**Done when:** `/public/img/` is populated, total image weight is under 1.8 MB, and the three clue-bearing assets pass a legibility test at 375px.

> This phase is where the site stops looking like a template. Claude Code writes excellent scroll code, but it cannot source photography — that part is on you. Budget real time here.

---

## Task 4.1 — Asset manifest

```
Write _private/ASSET-MANIFEST.md listing every image with: neutral filename, purpose,
target dimensions, format, max file size, and whether it carries a clue.

  hero-01.webp        hero, forest approach       2400x1600  <300KB
  ethos-01.webp       ridge silhouette in cloud   1800x1200  <180KB
  route-01.webp       Vector Ridge card            1200x1500  <140KB
  route-02.webp       Col du Nord card             1200x1500  <140KB
  route-03.webp       CLUE 2 — Pinecone Pass       1200x1500  <160KB
  route-04.webp       Beacon Traverse card         1200x1500  <140KB
  route-05.webp       Sable Pass card              1200x1500  <140KB
  ridge-01.webp       dark ridge, feature scene    2400x1600  <320KB
  logistics-01.webp   CLUE 3 — desk with ticket    1600x1200  <200KB
  permit-01.webp      CLUE 4 — stamped permit      1400x1800  <200KB
  journal-01.webp     journal entry photo          1200x800   <120KB

Reminder from Phase 1: filenames must stay neutral. Never ocr-stamp.webp or
pinecone-card.webp — a participant can read filenames in the network tab.
```

---

## Task 4.2 — Scene imagery

Generate these outside Claude Code (Midjourney, Flux, Nano Banana, Seedream — or licensed stock). Base prompts:

```
hero-01
  Dense alpine conifer forest at first light, low fog between trunks, cold desaturated
  green, soft volumetric shafts, shot on medium format, shallow depth of field,
  no people, no text. 3:2

ethos-01
  A knife-edge mountain ridge emerging from cloud, pale cold blue, high altitude haze,
  minimal, vast negative space in the upper third for a headline. 3:2

ridge-01
  A near-black granite ridge at night, faint starfield, a single distant head-torch,
  extremely low key, deep shadow across the lower two thirds. 3:2

route-01..05
  Vertical trail photographs, overcast flat light, consistent colour grade across all
  five, each featuring a weathered wooden trail-marker post in the mid-ground. 4:5
```

**Consistency is the whole game.** Five route cards that were clearly generated in five different sessions read as fake instantly. Generate them in one batch with one seed, and colour-grade them together afterwards.

---

## Task 4.3 — The three clue-bearing assets

These are the highest-value assets in the project. The clue must be **legible but unremarkable** — a participant who looks directly at it reads it; a participant skimming does not notice it.

### `route-03.webp` — PINECONE PASS

```
Same vertical trail photograph as the other four cards, same grade. In the mid-ground,
a weathered wooden post carries a small riveted aluminium plate, slightly oxidised,
reading:

    PINECONE PASS
    2,840 M

Constraints:
- The plate occupies roughly 8-10% of the frame height. Readable at 375px, but not
  the visual centre of the image.
- Cards 01, 02, 04, 05 must carry IDENTICAL plates with their own names. This is
  camouflage rule 2 — if only card 3 has a plate, the puzzle is over.
- Slight motion blur or shallow focus on the plate is fine and adds realism. Do not
  blur it past readability — test at 375px before accepting.
```

### `logistics-01.webp` — ALPINE EXPRESS

```
Flat-lay, overhead, on a scuffed wooden desk under warm lamplight:
  - a shuttle ticket, angled ~8 degrees, with ALPINE EXPRESS in a condensed transit
    face across the header, plus COACH 4 / SEAT 12 / VALLEY TRANSFER and a punch hole
  - beside it: a folded paper map, a pencil, a set of keys, a coffee ring
The ticket must not be centred and must not be the brightest object in the frame.
The clutter is the disguise — an isolated ticket on a clean background is a spotlight.
```

### `permit-01.webp` — OCR VERIFIED

```
An overhead photograph of an official-looking permit document, rotated about 3 degrees
on a desk surface, with a slight page curl and a soft shadow.

The document carries several marks, and the clue is only one of them:
  - a printed header: HAUTE-SAVOIE ALPINE ACCESS PERMIT
  - a reference number and a date field, filled in by hand
  - a rubber-stamp impression in the lower right: OCR VERIFIED / 14 MAR,
    in slightly misaligned red-black ink, partially over the paper edge
  - a second, unrelated stamp elsewhere (APPROVED) and a signature scrawl

The second stamp is essential. A document bearing exactly one stamp draws the eye to
that stamp. A document bearing three reads as bureaucracy.
```

---

## Task 4.4 — The outlined SVG headlines

```
Two headlines are rendered as outlined SVG paths (technique B):

  1. RAGGED RIDGE      the pinned feature scene, Instrument Serif, stacked two lines
  2. SEARCH & RESCUE   curved around an accreditation seal ring

Produce them by converting Instrument Serif glyphs to paths in a vector editor or with
an offline tool, then commit the path data as constants in src/content/outlines.ts.

Also produce the three sibling seals — UIAGM CERTIFIED, ALPINE TRUST, IFMGA — using the
EXACT same construction. All four seals must be visually identical in weight, ring
thickness, letter spacing and diameter. If the SEARCH & RESCUE seal is even slightly
different, it reads as the odd one out and the clue is free.

Verify: open the built page, press Ctrl+F, search for "RESCUE" and for "RAGGED".
Both must return zero matches. If either is found, you used SVG <text> instead of
<path> — fix it before continuing.
```

---

## Task 4.5 — Optimisation

```
- Convert everything to WebP, quality 82. Compare against the manifest budgets.
- Generate 2 widths per image (1x and 2x) and wire up srcset.
- Every image gets explicit width and height attributes to prevent layout shift.
- Lazy-load everything except hero-01, which gets fetchpriority="high" and a preload.

Clue-bearing images have one extra rule: they must NOT be lazy-loaded so aggressively
that a fast scroller never triggers them. Give route-03, logistics-01 and permit-01 a
generous rootMargin so they are decoded well before entering the viewport. A clue that
fails to paint is a clue that does not exist.

Report the total transfer weight. Hard ceiling: 1.8 MB of images.
```

---

## Task 4.6 — If you cannot generate imagery

```
Fallback if image generation is unavailable — this is a legitimate path, not a downgrade:

- Use Unsplash/Pexels alpine photography for the scene backgrounds (check licences).
- Build the three clue-bearing assets as CSS/SVG compositions instead of photographs:
    the ticket as a styled div with a dashed perforation edge and a punch hole
    the permit as a styled document card with a rotated, semi-transparent stamp
    the trail plate as a small bevelled rectangle overlaid on the photo
- CRITICAL: if built in CSS, the clue text is back in the DOM and Ctrl+F-findable.
  You MUST render the clue text itself as an outlined SVG path inside the composition.
  The frame can be CSS; the words cannot be live text.

Ask me before taking this path so I know what the site will look like.
```

---

## Phase 4 exit check

```
Confirm:
- Every manifest asset exists and is within budget; report total weight
- The five route cards share one colour grade and all carry identical plate styling
- Ctrl+F for RESCUE and RAGGED returns zero matches on the built page
- All three clue-bearing images are legible at 375px width — screenshot each one at
  that size and show me
```
