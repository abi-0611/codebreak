# PHASE 10 — Motion fidelity: the landing page as it moves

**Read first:** `CLAUDE.md` in full, then `REFERENCE-TEARDOWN.md` §6 (easings),
§7 (section inventory), §8 (component behaviour), §9 (the three GL scenes).
**Then read:** the three "do not undo" blocks in `CLAUDE.md` for phases 2, 3 and 5.
Most of what follows is a refinement of decisions those blocks already settled.

**Invoke:** `gsap-scrolltrigger` and `scroll-animations` for the trigger work,
`threejs` and `threejs-fundamentals` for the shader and the two struck objects,
`nuxt` for the SSR/hydration boundaries, `tailwind-css-coding` for the utility
work, `playwright-cli` for the measurement harness in §10.12,
`full-output-enforcement` so no task below ships as a summary of itself.

**Outcome:** the home page's *motion* matches the reference frame for frame —
the backdrop's density and colour, the hero's contraction, a fixed section rail,
a re-composed pinned scene, and a split token section. The page's *structure*
already matches; this phase is about what it does while you scroll it.

> **Run one task per prompt.** Phase 6 says this about sections and it is more
> true here: motion tasks fail quietly. A prompt asking for eleven behaviours
> produces eleven behaviours that each look approximately right in a screenshot
> and none of which survive a side-by-side at 0.25× speed.

---

## 10.0 — What the source recording is, and what it is not

This phase was specified against a 36-second 1920×1020 screen capture of the
**reference**, scrolled down and back up twice, with two long dwells on the hero.
Every number in §10.1 was measured out of that capture with `ffmpeg` and a
canvas histogram, and every number about our build was measured out of a live
Playwright session at 1440×860.

Three warnings before anything is built from it.

- **The grey medieval tapestry filling the frame behind the black panels is not
  on the reference site.** It is an artifact of the recording browser. `body` and
  `html` both compute `background-image: none` on the live site. Do not build a
  page-wide decorative image. This is already recorded in project memory and it
  is the first thing anyone tries to reproduce from these recordings.

- **The capture is of the reference, not of us.** Its wordmark, nav labels,
  partner logos, headlines, ticker names and body copy are theirs. Reproduce the
  *behaviour* and none of the *content* — `CLAUDE.md`'s "Do not" list is not
  relaxed by the fact that a recording makes it convenient.

- **The recording is 30fps and lossy.** It is authoritative about composition,
  density, hue and sequence. It is not authoritative to the millisecond. Where a
  timing already exists in `REFERENCE-TEARDOWN.md` §6 or in a `motion.ts`
  comment, that number wins; the capture is not a re-measurement.

### Already correct — do not "fix" these

Verified live at 1440×860 before this phase was written. Touching them is a
regression, not an improvement.

| Behaviour | Evidence |
|---|---|
| Root font resolves to exactly `8px` at 1440 | measured |
| Article height 11341px vs the live reference's 11638px | within 3% |
| Hero clip registers exactly on the plate | at the rest position the clip is `inset(130px 120px)` and the plate rect is `[120,130,1320,730]` in a 1440×860 frame — all four edges agree to the pixel |
| The closing plate is `aspect-[900/450]`, 1200×600 | matches the reference hook |
| Header hides on scroll down, returns on scroll up | `useAway` → `.is-away`, `translateY(-65px)`, restores on reverse |
| The contraction is a crop, not a scale | settled; see the phase-2/3 blocks and project memory |

---

## 10.1 — The backdrop is too bright, too pink, and too uniform

**This is the largest gap on the page and the only one visible in a thumbnail.**
Everything else in this phase is a refinement. This one changes what the site
looks like.

`app/composables/scenes/drift.ts` draws the right *kind* of picture — a ridged,
domain-warped vein field, branching for free, exactly as its header argues. The
argument is sound and the primitive is right. What is wrong is the exposure.

Measured over the hero backdrop region only (below the header, above the estate
strip), sampling every fourth pixel:

| | reference | ours | |
|---|---|---|---|
| Share of pixels below L=25.6 (10% luma) | **96.6%** | 90.4 – 94.0% | |
| Mean RGB across the field | **8, 5, 6** | 14–22, 8–9, 10–18 | 2–3× too bright |
| Mean saturation | **0.31** | 0.54 – 0.66 | ~2× too saturated |
| Pixels in the mid band (L 25–128) | **1.5%** | 4.2 – 7.4% | 3–5× too much haze |
| Lit-pixel share (30 < L < 200) | **0.5 – 2.5%** | 5.9 – 9.5% | 4–7× too much |

And the hue, sampled as five horizontal bands over one frame, lit pixels only:

```
reference, t=1s    band0 hue 299   band1 304   band2 324   band3 5    band4 11
reference, t=33s   band0 hue 343   band1 343   band2  21   band3 22   band4 28
ours               band0 hue 310   band1 319   band2 322   band3 322  band4 328
```

The reference sweeps **~70–75° of hue from the top of the frame to the bottom**
— magenta overhead, crimson through the middle, amber at the floor, all in one
frame. Ours is flat magenta across the whole field: an 18° spread.

Over the two long hero dwells in the capture the whole field also wanders slowly
and non-monotonically inside a **fixed arc of roughly 290° → 45°** — magenta,
crimson, red, amber — and never once leaves it. That arc is exactly the palette
convention phase 3 established: `brown-lifted` and its documented hue rotations,
plus `gold`. No new token, no literal.

### What to change

Four edits to the fragment shader in `drift.ts`. Nothing else in the file moves,
and in particular the octave counts stay as they are — the header's reasoning
about the warp being the cheapest octave is still correct.

1. **Narrow the vein core.** The ridge is being taken to too low a power before
   it is clamped. Raise the exponent until the *lit-pixel share lands in
   1.0–2.5%*. That number is the acceptance test, not a look.

2. **Cut the halo.** The header describes the glow as "a second, wider power of
   the same ridge summed on top". Keep the technique — it is right, and it is
   why there is no post-processing pass — but drop the halo's amplitude hard.
   The halo is what is putting 4–7% of the frame into the mid band. The
   reference's veins sit against **pure black within a few pixels of the core**.

3. **Add a vertical hue ramp.** Map screen-space `y` across ~70° of the arc:
   magenta at the top of the viewport, amber at the bottom. Derive both ends
   through `ink()` with a turn, as phase 3 requires. Do not introduce a literal
   and do not add a token.

4. **Slow and bound the global drift.** The temporal wander stays inside
   290°–45°. It must never enter green, cyan or blue — a single frame of teal
   would read as a different site.

**Do not** reach for a bloom pass, an `EffectComposer`, or a CSS filter on the
canvas. Teardown §9 is explicit that the reference has no post-processing, and
the measurements above are a brightness problem, not a missing effect.

**Keep** `glslVersion: GLSL3` and the explicit `out vec4`. That is not a style
choice — at GLSL3 three stops defining `gl_FragColor`, and `gl_FragColor`
carries a banned substring. This is how the naming ban holds in our own shader
source with no exemption.

**Re-encode the still.** `plates['still-01']` is the reduced-motion and
no-GL fallback for this scene. A shader change that leaves the still behind
ships two different sites. Re-run `npm run gen:plates` and check the manifest —
and remember that a full run sweeps encodings it did not produce, so a changed
size leaves an orphan committed file behind if you run a partial one.

---

## 10.2 — The section rail

**New component. The single most legible piece of furniture in the recording
that we do not have at all.**

From the moment the hero's first pixel leaves the top of the viewport until the
footer, the reference shows a fixed list at the left edge naming every section
of the page. It is present in every frame of the capture below the hero. It is
live-only — it is not in `REFERENCE-TEARDOWN.md`, because the reference gained
it after the teardown was measured. Project memory records it as
`nav.quick-menu.fixed.left-25.inset-y-0.z-50`.

### Measured behaviour

- **Fixed, left edge**, roughly `left: 25` design px, spanning the viewport
  height, above the sections and below the menu overlay.
- One row per section, **mono, uppercase, ~10px, ~27px row pitch**.
- The **active row is `gold`**; every other row is `brown`. Rows further from
  the active one fade out toward both ends of the list.
- A small house glyph sits to the left of the active row.
- **The glyph never moves.** It stays at the vertical centre of the viewport in
  every frame of the capture. The *list translates behind it* so that whichever
  section is current lands on the marker. Measured: between two frames the
  active row changed from the second entry to the fourth, and the list's first
  row moved up by exactly two row pitches while the marker stayed at the same
  y. Build it that way round — a marker that chases the active row is a
  different, worse animation.
- It is absent over the hero and fades in as the hero leaves.

### How to build it

- `app/components/Rail.vue`, presentational. Rows arrive as a prop from
  `app/content/home.ts`. No copy inline — that is a standing convention.
- A new named helper in `motion.ts`. Call it `useCourse`. It takes the array of
  section elements and returns a reactive index. It does **not** return `gsap`;
  `motion.ts` exports purpose-built helpers and never an escape hatch, which is
  what makes "every ScrollTrigger is reverted" true by construction.
- One `ScrollTrigger` per section, `onToggle` only — **not** a scrub. The active
  section is a discrete fact. Route every one of them through `scrollRoot()`,
  or the rail is dead on every phone and perfect on your desktop.
- **The colour change is a class, never a tween.** Phase 2 settled this: a tween
  needs a literal value and literal values are what "no inline hex" forbids.
  `motion.ts` owns the translate; CSS owns `gold` vs `brown`.
- Translate the list with a short `power2.out` tween, not a scrub. The list
  should settle after the section changes, not smear with the scroll.
- **Accessibility.** It is a `<nav>` with an accessible name, and each row is a
  real in-page anchor to a real section id — rule 8, no dead `href`. Mark the
  active row with `aria-current="true"`.
- **Hidden below `s:`.** A 375px viewport has no room for it and rule 4 is about
  clues, not furniture. Nothing in the rail is a clue and nothing may become one.
- **Reduced motion:** render it, drop the translate, let the list sit still and
  only the active colour change. It stays useful and stops moving.

---

## 10.3 — The pinned scene, re-composed

Ours and the reference's differ **structurally**, not in degree.

**The reference**, measured off four frames of the capture:

```
   ┌─ headline           (display, centred, ABOVE the panel, stays put)
   ├─ sub                (one line, centred, under the headline)
   ├─ ┌───────────────┐  a BOUNDED black panel, ~50% of viewport height,
   │  │      ◆   ◆    │  ~70% of viewport width, holding the struck objects
   │  └───────────────┘  small and centred inside it
   ├─ ┌───────┬───────┐  a two-cell gauge, flush to the panel's width
   │  │ LEFT  │ RIGHT │  left cell: transparent, hairline, cream label
   │  └───────┴───────┘  right cell: SOLID GOLD, black label
   └─ caption            two lines, centred, mono-adjacent, under the gauge
```

**Ours** is a full-bleed docket image with a caption card pinned bottom-left and
a gold rule at the very bottom of the viewport. It is a good-looking section. It
is not this one.

### What to build

- Re-compose section 5 to the diagram above. The panel is a bounded box with its
  own ground, not a full-bleed image.
- The **objects render small inside the panel** — in the capture they occupy
  roughly a fifth of the panel's width each — and they **tumble continuously**.
  Two frames 0.8s apart at the same scroll position show the same pair of
  objects at different rotations, so the rotation is on the ticker, not on the
  scroll. Drive it from `useFrame`, which is the one rAF loop.
- **The step still swaps the object set**, and `step` stays a pure function of
  scroll progress with a dead-band on the boundary. Do not introduce a playhead.
  Reverse crossing cannot desynchronise something that has no state.
- The **gauge is a new component**, `app/components/Gauge.vue`. Two cells, both
  labelled, the right one gold-filled with black text. Its cell widths are ~50/50
  in every frame measured; if a later measurement shows them animating, animate
  `flex-basis`, never `width` on a text-bearing box.
- The caption changes per step. It comes from `home.ts`.

### Constraints this section already carries

Section 5 is a marked surface and phase 5 recorded contracts on it. Re-read the
phase-5 block before moving anything:

- The pin is `position: sticky` on a `h-[300vh]` section. **Not** a GSAP pin.
  `motion.ts` only reports which step we are in. A GSAP pin here produces a
  viewport-tall section with a 300vh spacer beside it, which is not what the
  teardown measures.
- Every step holds **fully opaque for the whole step**. Rule 5.
- The render sizes in `_private/reach.json` are contracts. **Shrinking the panel
  shrinks what is drawn in it.** If the re-composition puts a marked surface
  below its recorded `renderPx`, the layout is wrong, not the contract — 04 §4.2
  and the phase-5 block are explicit that rule 4 sizes the artwork and taste does
  not get a vote. Re-run the generator, read the printed cap height, and let it
  fail the run if it drops under 7px.
- `inert` stays gated on the pin actually being live, so all four steps remain in
  the accessibility tree under reduced motion.
- The reduced-motion layout is the same DOM under different CSS. No second
  template, no hydration seam.

---

## 10.4 — The token section is a split, not a stack

**The reference:** a 50/50 two-column split with a **full-height hairline down
the exact centre of the section**. Copy left — h2, a lead line, two short bodies,
a pill — then a rule, then two data rows in mono. The struck disc sits alone in
the right column, vertically centred.

**Ours:** the disc centred above centred copy, with the data rows below. A stack.

Rebuild it as the split. The centre hairline is `brown-dark` like every other
hairline on the site — there are no exceptions to that, and this one is easy to
get wrong because it reads as a layout device rather than as a rule.

### The disc itself

The reference's coin is **lit, thick and alive**:

- It rotates about its vertical axis, continuously, off the ticker.
- Its **rim is visible** through most of the rotation — you can see it is a
  struck object with depth, not a printed circle.
- It **colour-cycles through the same arc as the backdrop** — sampled magenta at
  one moment and violet 1.2s later, with the rim catching amber. It is not a
  fixed gold.
- At 1400px viewport it is ~300px across, ~21% of the width.

Ours renders at 368px on a 1440 viewport — **26%, already larger than the
reference**. Size is not the gap. The gap is that ours reads as a flat gold
sticker: no rim, no travelling highlight, no hue life.

Fix the material and the light, not the size. And keep the phase-3 finding that
made this section work in the first place: **on a metal, `color` is a filter,
not a colour.** At `metalness: 1` there is no diffuse term, so tinting the disc
gold multiplies the environment by a blue channel of `0x09` and deletes the very
gradient the tint was meant to produce. Filter the metal white; let the
environment carry the colour.

**Do not** change the rotation rule. The medallion and the house mark share one
— both come to rest face-on over the same band. The medallion has to, because it
carries something; giving the mark a continuous tumble instead would make the
medallion the one object on the page that stops, which is exactly the tell that
rule 3 forbids.

---

## 10.5 — The assay grid is quarters, not thirds

Small, cheap, and wrong in a way that is invisible until you overlay the two.

The reference's certification section carries **vertical hairlines at 25%, 50%
and 75%** of the viewport width, running the full height of the section behind
the seal. Ours carries two, at 37.7% and 62.3% — thirds.

Move them to quarters. `brown-dark`, like everything else. The seal keeps the
width phase 5 measured for it and recorded in `_private/reach.json`; the grid
changes, the seal does not.

While you are there: the reference draws the same quarter grid in the media
section. Ours draws thirds there too. One rule, both places.

---

## 10.6 — The story carousel's caption card

Close. Two differences, both in the capture:

- The reference's caption card carries a **gold hairline on its bottom edge that
  fills left-to-right as the slide plays**. It is a timing indicator on the card
  itself. Ours puts a gold rule across the full width of the viewport at the very
  bottom of the section, where it reads as a section divider rather than as a
  timer.
- The reference's card is **centred over the image**; ours is bottom-left.

Move the rule onto the card's bottom edge and centre the card. The advance
timing itself already matches.

Name-check before you write this: the horizontally-moving carousel is where
`drag` gets into a codebase. It is `pull`. And **`coverage` contains `rag`** —
if you need to name the lit-pixel share from §10.1 in code, call it `share` or
`fraction`. That one is not yet in the substring-trap table in `CLAUDE.md`;
add it while you are here, next to `average`.

---

## 10.7 — Order of work

Strictly this order. Each step is verifiable on its own, and the first one
changes what every screenshot after it looks like.

1. §10.1 the backdrop — biggest visual delta, and it re-baselines every
   comparison that follows.
2. §10.5 the quarter grids — 20 minutes, closes a real difference.
3. §10.4 the token split — structural, no new mechanism.
4. §10.6 the caption card — small.
5. §10.2 the rail — new component, new helper, new content rows.
6. §10.3 the pinned scene — largest structural change, and the only one that
   touches a marked surface and therefore `reach.json` and `audit:register`.

---

## 10.8 — Motion constants

Nothing here overrides `REFERENCE-TEARDOWN.md` §6. Where the two disagree, §6
wins and this table is the error.

| Behaviour | Value | Source |
|---|---|---|
| Hero content dissolve | `power2.out`, 0.7 viewport | measured; `useDissolve` |
| Backdrop translate | `scrollY` exactly, rate 1.0 | measured; `useLock` |
| Contraction | `top bottom` → `center center`, scrubbed | `useContract` |
| Pinned scene | 300vh sticky, discrete steps, dead-band | phase 3 |
| Rail list translate | `power2.out`, short, not scrubbed | new |
| Rail active colour | CSS class, no tween | phase 2 rule |
| Object rotation | ticker-driven, scroll-independent | measured |
| Header hide/show | `useAway(80)` | already correct |
| Reduced motion | no Lenis, no pin, no scrub, no parallax, no GL | rule, phase 3 |

---

## 10.9 — The rules this phase is most likely to break

Read these as a checklist against your own diff, not as background.

- **Rule 1 and 2.** Nothing in this phase adds copy. If a task tempts you to add
  a visible string, it is the wrong task. The rail's row labels are section
  names and must not collide with anything in `_private/placements.json` —
  `npm run audit:register` decides that, not judgement.
- **Rule 3.** The rail is furniture. It must never highlight, count, or mark a
  section differently because of what that section carries.
- **Rule 4.** Every marked surface stays at or above its recorded `renderPx`.
  The pinned scene's re-composition is the live risk.
- **Rule 6.** New names this phase proposes: `Rail.vue`, `Gauge.vue`,
  `useCourse`. All three are clean. Anything else you invent, run through the
  substring table first — and remember the table is not exhaustive
  (`coverage`, `research`, `beverage` all carry banned substrings).
- **Rule 9.** The shader edits in §10.1 should make the scene *cheaper*, not
  dearer — a narrower core and a smaller halo are fewer lit pixels. If the
  budget moves the wrong way, the change was additive and should be re-read.
  The GL gate still runs **before** the `await import('three')`.
- **Rule 10.** One pinned scene and one parallaxed backdrop. This phase adds
  neither. The rail is fixed furniture, not a third cinematic surface.

---

## 10.10 — Acceptance

The phase is done when all of the following hold. Run them in this order.

```bash
npm run verify
```

That is `audit:names`, `audit:contrast`, `audit:register`, a full static build,
then names and register again over the built output. It is not optional and it
is not last-minute: `audit:register`'s build gate is a find-in-page simulation
over the rendered text, so a re-composed section can break it without a single
source file looking wrong.

Then, the measurements this phase was specified against:

| Check | Target |
|---|---|
| Hero lit-pixel share | 1.0 – 2.5% |
| Hero mean saturation | 0.28 – 0.36 |
| Hero mid-band (L 25–128) | under 2% |
| Hero hue spread, top band to bottom band | 60 – 80° |
| Hero hue at all times | inside 290° – 45° |
| Rail marker y | constant across every section change |
| Assay verticals | 25%, 50%, 75% |
| Token section | centre hairline at exactly 50% |
| Marked-surface cap heights | ≥ 7px at 375px, from `_private/reach.json` |
| Article height | within 10% of 11638px at 1440×860 |

And the two that no script can make for you:

- **Open both at 0.25× and scroll the first two viewports.** `setTimeScale` on
  `/specimen` exists for exactly this. The hero's dissolve, the contraction and
  the rail's fade-in are three things happening across the same 700px and they
  are either choreographed or merely simultaneous.
- **Do the whole page on a real phone**, not a narrow window. The rail is gone
  there and the pinned scene is the only thing between the hero and the token
  section. If that stretch feels empty on a 375px screen, the pinned scene's
  mobile layout is the thing to fix — not the rail's breakpoint.

---

## 10.11 — Do not

- Do not add a page-wide background image on the strength of the recording. See
  §10.0.
- Do not reproduce the reference's wordmark, nav labels, partner logos, ticker
  names, headlines or body copy.
- Do not replace the sticky pin with a GSAP pin.
- Do not add a post-processing pass to fix the backdrop's brightness.
- Do not tween a colour, anywhere, for any reason.
- Do not tie a marked surface to a scrub value.
- Do not import `gsap` or `lenis` outside `motion.ts`.
- Do not hand-edit `app/content/plates.ts`, `outlines.ts`, `lockup.ts` or
  `_private/KEY.md`. Re-run the generator named in each file's header.
- Do not shrink a marked surface to make a layout sit more comfortably.

---

## 10.12 — The measurement harness

Keep this out of the repo — scratch only. It is how every number in §10.1 and
§10.10 was produced, and how you check your own work.

```js
// Lit-pixel share, mean saturation and per-band hue for a captured region.
// Feed it a PNG of the hero backdrop region ONLY — no header, no estate strip,
// or the cream headline lands in the top luminance bin and skews the run.
const px = ctx.getImageData(0, 0, w, h).data
let lit = 0, n = 0, rs = 0, gs = 0, bs = 0
for (let i = 0; i < px.length; i += 16) {          // every 4th pixel
  const R = px[i], G = px[i + 1], B = px[i + 2]
  const L = 0.2126 * R + 0.7152 * G + 0.0722 * B
  if (L > 30 && L < 200) { lit++; rs += R; gs += G; bs += B }
  n++
}
// share = lit / n            → target 0.010 – 0.025
// hue of (rs, gs, bs) / lit  → per band, over five horizontal bands
```

Capture the reference the same way the numbers above were captured:

```bash
ffmpeg -ss <t> -i <recording> -frames:v 1 -vf "crop=1900:700:10:180" -q:v 2 out.png
```

Sample **at least three well-separated timestamps** on each side. The field
moves, and a single frame of either site will happily prove whatever you were
hoping to prove.
