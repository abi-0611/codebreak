# PHASE 4 — Clue architecture

**Read first:** `00-MASTER.md` §4, the ten rules. All ten apply here at once.
**Invoke:** nothing. This phase is judgement, not craft. Read it twice instead.

This is the phase the whole project exists for. Everything before it is scaffolding
and everything after it is finishing. If a decision in a later phase conflicts with
this file, this file wins.

---

## 1. The three sanctioned techniques

A clue must be **visible to a human and invisible to find-in-page**. There are
exactly three ways to achieve that, and this project uses no others.

The reference site already ships all three, for ordinary art-direction reasons. That
is the whole reason it was the right site to replicate: the camouflage is native.

### T-A — Baked into raster artwork

The term is drawn into a PNG/WebP by an offline generator and committed. Seals,
certificates, ornamental plates, stencils, photographed documents.

- Find-in-page cannot read pixels. Absolute protection.
- The reference's audits seal, its ornamental media plate and its botanical
  engravings are all exactly this.
- **The type inside the artwork is drawn from committed font files as paths**
  (`scripts/lib/glyphs.mjs`). A rasteriser asked to draw `<text>` has to locate the
  face on the machine and will quietly fall back to a system font when it cannot —
  which produces a clue set in Arial on a Victorian engraving. That reads as a
  mistake, and a participant who notices a typographic anomaly has been handed the
  answer for free (rule 3).

### T-B — Drawn as outline geometry

Glyphs converted to SVG `<path>` data offline, committed to `app/content/outlines.ts`,
rendered by `<OutlineText/>`.

- The reference does this for its own wordmark, via `mask-image` with an inline SVG
  data-URI. It is a completely ordinary agency technique.
- **Never use SVG `<text>`.** Chrome's find-in-page matches inline SVG `<text>`, which
  would silently undo the entire technique. If a glyph is missing, regenerate the
  geometry.
- **`<Split/>`-style per-character wrapping is not a substitute.** Chrome normalises
  text across inline element boundaries before matching. Splitting a word into
  `<span>`s offers no protection of any kind. It is an animation tool. Do not let
  anyone reintroduce it as a defence.

### T-C — Rendered in WebGL

The term exists as a texture or as geometry inside a three.js scene. It is not in the
DOM at all.

- The reference's medallion has engraved lettering repeated around its rim.
- The texture is **baked offline** (phase 3, task 3.5), never built at runtime.
- The scene's static fallback frame must carry the term just as legibly (task 3.7).

### What is forbidden, and why

| Not allowed | Why |
|---|---|
| Plain DOM text | rule 2 — this is the whole point |
| `<svg><text>` | Chrome's find-in-page matches it |
| Per-character `<span>` splitting | Chrome normalises across inline boundaries |
| CSS `content:` pseudo-elements | not matched by find-in-page, but also not selectable, and Safari's reader mode drops them; unreliable rather than wrong |
| `text-security`, custom ligature fonts | the glyph is still the character; find-in-page still matches |
| Alt text, `title`, `aria-label`, `data-*` | rule 1 — invisible to a sighted reader, and often *findable* by tooling |
| An image of a screenshot of text | works, but looks like an image of a screenshot. Rule 3. |

---

## 2. The six placements

One per section. Each on a different surface type. No section carries two.

| # | Term | Technique | Surface | Where | Native disguise |
|---|---|---|---|---|---|
| 1 | **OCR** | T-C | medallion rim lettering | §2 The House Medallion | `EST 1904 · O.C.R. REGISTERED · CONSUEGRA` — the Office of Crop Registry, the fictional body that registers saffron estates |
| 2 | **search** | T-A | the assay seal, inner ring band | §4 Assay & Certification | `WEIGHED · SEARCHED · SEALED` — the chain-of-custody sequence a bonded warehouse stamps on a lot |
| 3 | **RAG** | T-A | a certificate photographed in the pinned scene | §5 The Season, step 3 | `STRUCK ON RAG PAPER · NO. 0417` in the certificate's footer band — rag paper is what certificates are actually printed on |
| 4 | **Express** | T-B | the three value labels | §6 Held by the Guild | `BONDED · EXPRESS · TRACEABLE` — the house's three service marks, all three drawn as geometry so no member of the set differs |
| 5 | **Pinecone** | T-A | the ornamental dispatches plate | §7 Crocaria Dispatches | a specimen label in the engraving: `PINECONE RESERVE · LOT 04` — an estate block name |
| 6 | **ReactJS** | T-A | a noticeboard photographed in an office frame | `/roles` | a pinned card among several: `ReactJS Engineer — Ledger Team` |

### Notes on each

**1 · OCR.** The medallion must rest face-on (task 3.5). Rim lettering runs
clockwise from the top; `O.C.R.` sits at roughly 4 o'clock where it is comfortably
readable, not upside-down at 6. Punctuated as an initialism because that is how a
registry body would strike it — and because the periods make it read as *less* like a
planted keyword, not more.

**2 · search.** Three past-participle verbs in a row is exactly how a custody stamp
reads. `SEARCHED` is the middle one, which is the least conspicuous position. The
seal renders at 128px minimum (phase 2 conventions) or the ring band is illegible.

**3 · RAG.** This is the hardest placement, because it lives in the pinned scene, and
rule 5 is about pinned scenes. Step 3 of four. The certificate is fully opaque for its
entire step, and under reduced motion it is one of four stacked static blocks. Verify
both states explicitly.

**4 · Express.** T-B rather than T-A, deliberately: five raster clues would make
"is it a picture? then it's a clue" the entire solve. All three labels are drawn
identically. **Do not hand-tune one of them.** A member of a set that differs is the
member everyone looks at.

**5 · Pinecone.** Botanically plausible — the plate is a Victorian-style specimen
engraving and specimen plates carry labelled details. It is one of six labels on the
plate; the other five are decoys (§3).

**6 · ReactJS.** The one clue off the home page. `/roles` must be a real careers page
with real listings, reachable from the footer, and it must exist for its own sake —
rule 8. The noticeboard is an environmental photograph of an office wall, and the card
is one of four pinned to it. The other three are decoy roles.

### Reachability

Every one of the six must be findable on a 375px phone (rule 4). The medallion and
the plate are the risks — both shrink. Phase 5's generators print the cap height each
term lands at on a 375px viewport and **fail the build under 7px**. Do not eyeball
this. A clue you can read on your 27-inch monitor is not evidence about anything.

---

## 3. Decoys

Without decoys the hunt collapses into a five-minute skim: a participant learns that
technical-sounding words are the answer and greps the rendered page visually for
anything that looks like a stack component.

**Minimum twelve.** **At least three baked into artwork**, or the presence of baked
artwork becomes the tell.

The saffron trade is unusually generous here, because its real vocabulary overlaps
with computing vocabulary by accident:

| Decoy | Native meaning in the trade | Surface |
|---|---|---|
| `THREAD` | saffron stigmas are sold as threads | DOM copy, repeatedly — the strongest decoy on the list |
| `DOCKER` | a dock worker; `DOCKER'S MARK No. 7` | **T-A**, stencilled on a crate |
| `INDEX` | the crocin index, the real pigment-strength measure | DOM copy + a ledger column header |
| `BUFFER` | buffer stock, a real inventory term | DOM copy |
| `PORT` | port of entry | ledger column |
| `QUERY` | a customs query | **T-A**, on the assay seal's outer band |
| `STACK` | a stack lot | ledger row |
| `HASH` | a hash mark | DOM copy |
| `KERNEL` | grade nomenclature | ledger row |
| `LAMBDA` | Greek letter grades | ledger row |
| `VECTOR` | `VECTOR LANE`, a shipping route | ledger column |
| `NODE` | `NODE HOUSE`, a bonded warehouse | DOM copy |
| `CACHE` | `CACHE VAULT No. 3` | **T-A**, on the ornamental plate |
| `CLUSTER` | cluster grade | ledger row |
| `TOKEN` | a token seal | DOM copy |
| `AZURE` | a colour in the heraldry | DOM copy |

Record every decoy in `_private/decoys.json` so phase 8's audit can verify coverage
and, critically, verify that **no decoy accidentally contains a real term as a
substring**. Check this by machine, not by reading the list.

### Decoy discipline

- Decoys must be **native**, exactly like the clues. A decoy that reads as planted
  teaches participants what planted looks like, which makes the real clues easier.
- Decoys must be findable by find-in-page. That is a feature: a team that discovers
  Ctrl+F works on `THREAD` will burn real time before realising the actual clues do
  not respond to it. That realisation is the intended difficulty curve.
- Do not put a decoy *adjacent* to a clue. Proximity draws the eye to the region.

---

## 4. Camouflage rules

The clues are not hidden by being small or dim. They are hidden by being **ordinary**.

1. **Typographically identical to their surroundings.** Same face, same size, same
   weight, same colour as the material next to them. If `SEARCHED` is set differently
   from `WEIGHED` and `SEALED`, it is not hidden.
2. **Never the brightest or highest-contrast thing in its frame.** A clue-bearing
   plate that is the most luminous object in its section pulls the eye straight to it.
   Composite it so it reads only when looked at.
3. **Sets stay sets.** Five ledger rows, three service marks, six specimen labels,
   four noticeboard cards — every member drawn by one function called N times. No
   special-casing, no unique crop, no unique grade for the member carrying the clue.
4. **No neighbourhood tells.** No extra whitespace around a clue, no section that is
   conspicuously calmer, no lone element that resists the page's motion.
5. **Filenames are neutral.** `plate-04.webp`, not `specimen-label.webp`. A
   participant *can* see filenames in the network tab.
6. **No clue in the first viewport and none in the footer.** Both get disproportionate
   attention.

---

## 5. Difficulty calibration

Target for a competent team: **four of six within 25 minutes**, six of six inside the
window with effort.

The intended progression is:

1. Team reads the site, tries Ctrl+F, gets hits on `THREAD` and `INDEX`, submits, is
   wrong.
2. Team realises find-in-page is not the instrument. Starts actually looking.
3. The seal and the plate go first — they are the most obviously *documentary*
   surfaces, and a reader who has started looking at pictures finds them.
4. The medallion needs someone to scroll to it and stop. Slower.
5. `Express` among the three service marks is the sneakiest on the home page,
   because it is set as ordinary UI type.
6. `/roles` is last, because it requires deciding the footer is worth reading.

If playtesting says a clue is unfindable, **do not make it bigger or brighter** —
that violates rule 3 and it is visible to everyone. Move it to a surface participants
are already looking at.

---

## 6. The answer key

Phase 5's generator writes `_private/KEY.md` as a by-product of drawing the artwork,
so the key cannot drift from what actually shipped. For each term:

- the term
- the technique (T-A / T-B / T-C)
- the route and section
- the exact rendered string it sits inside
- the source file that produces it
- a screenshot at 375px and at 1440px, with the term circled

Plus a decoy list and a one-page organiser crib for the judging table.

`_private/` is git-ignored, never imported by application code, and never deployed.
Phase 9 verifies its absence from the built output.

---

## Exit criteria

- [ ] All six terms placed, one per section, on six different surface types.
- [ ] Technique mix is not monotone: at least one each of T-A, T-B, T-C.
- [ ] Find-in-page for each of the six returns **zero** hits on every route, in
      Chrome and in Safari, desktop and mobile.
- [ ] Each term legible at 375px, cap height ≥ 7px, verified by the generator's
      printed measurement — not by eye.
- [ ] Twelve or more decoys, three or more baked into artwork, all recorded in
      `_private/decoys.json`.
- [ ] No decoy contains a real term as a substring — verified by script.
- [ ] No clue in the first viewport; none in the footer; none adjacent to a decoy.
- [ ] Every clue survives `prefers-reduced-motion` and appears in the reduced-motion
      layout of the pinned scene.
- [ ] `_private/KEY.md` written, with screenshots, and git-ignored.
