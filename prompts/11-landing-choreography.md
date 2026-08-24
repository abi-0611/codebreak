# PHASE 11 — The landing page as one continuous move

**Read first:** `CLAUDE.md` in full, then `REFERENCE-TEARDOWN.md` §6 (easings),
§7 (section inventory), §8.2 (sticky header), §8.7 (the two-cell panel), §9 (GL).
**Then read:** the four "do not undo" blocks in `CLAUDE.md` for phases 2, 3, 4 and 5.
Nothing below is permitted to contradict them.

**Invoke:** `gsap-scrolltrigger` and `scroll-animations` for every trigger,
`gsap-frameworks` for the Vue lifecycle and scoping, `threejs` and
`threejs-fundamentals` for the three scenes, `nuxt` for the SSR/hydration
boundaries, `tailwind-css-coding` for utilities, `playwright-cli` for the
harness in §11.9, `full-output-enforcement` so no task ships as a summary.

**Outcome:** the home page reads as **one continuous move from black to black**
— a backdrop that is alive before the reader touches anything, a hero that
crops rather than shrinks into the section below it, a fixed rail that keeps
the reader located, and eight sections each of which does exactly one thing and
holds it. The page's structure already matches. This phase is the score.

> **One task per prompt.** This is more true here than anywhere else in the
> project. A prompt asking for nine behaviours produces nine behaviours that
> each survive a screenshot and none of which survive a side-by-side at
> 0.25× speed.

---

## 11.0 — What this supersedes, and what it does not

`prompts/10-motion-fidelity.md` was written against **the same 36-second
capture** and its measurements are sound. It was never implemented: there is no
rail component in `app/components/`, and `app/composables/scenes/drift.ts`
carries no screen-space hue ramp. Both verified before this file was written.

The difference between the two documents is shape, not disagreement. Phase 10 is
a **patch list** — "the backdrop is too bright", "the grid is quarters, not
thirds" — which presumes you already know what the page is meant to do. This
phase is the **whole score**, in reading order, so the page can be built and
judged as one move rather than as nine repairs.

| Keep from phase 10 | Why |
|---|---|
| §10.1's exposure table | Real per-pixel measurements. Do not re-derive them. |
| §10.12's harness | The only way to check §11.9 without eyeballing it. |

Everything else in phase 10 is restated here in place. **Where the two differ,
this file wins**; where phase 10 is more specific, follow it. Do not run both as
separate phases — that is how one section gets built twice.

### The source recording, and its three lies

A 36.13s, 1920×1020, 30fps capture of the **reference**, scrolled down and back
up three times, with dwells on the hero at 0.0–1.4s, 8.6–15.7s and 32.3–36.1s.

- **The grey medieval tapestry behind the black panels is not on the reference
  site.** `body` and `html` both compute `background-image: none` on the live
  DOM. It is an artifact of the recording browser, which had "Video-to-Website"
  extension tabs open — they are visible in the capture's own tab strip.
  **Every region where the tapestry appears is black on the real site.** This is
  already in project memory and it is the first thing anyone tries to reproduce
  from these recordings.

- **The content is theirs.** Wordmark, nav labels, partner logos, headlines,
  ticker names, table rows and body copy in that capture belong to a real
  company. Reproduce the *behaviour*, none of the *content*. `CLAUDE.md`'s
  "Do not" list is not relaxed by a recording making infringement convenient.

- **30fps and lossy.** Authoritative about composition, sequence, density and
  hue. Not authoritative to the millisecond. Where a number already exists in
  `REFERENCE-TEARDOWN.md` §6 or in a `motion.ts` comment, **that number wins**.
  The capture is not a re-measurement.

### Substring traps in this phase specifically

`prompts/` is in the audit's `SKIP_DIRS`, so this file's prose is not scanned.
**Your code is.** This phase walks straight into five of them:

| You will want to write | Contains | Write instead |
|---|---|---|
| `fragment` shader, `fragmentShader` | rag | `pixelShader`, `fs` |
| `fragments` — §11.3.2 describes the disc breaking into them **in prose** | rag | `shards`, `pieces` |
| the legacy GLSL output variable | rag | stay on `glslVersion: GLSL3` with an explicit `out vec4` |
| `is-hidden` on the header | hidden | `is-away` — already the shipped name |
| `dragEnd`, `onDrag` on the carousel | rag | `pullEnd`, `onPull` |
| `average` frame time, `storage` helper | rag | `mean`, `store` |

Run `npm run audit:names` before every commit, not at the end of the phase.

---

## 11.1 — What was measured, so you can argue with it

Every number below came out of the capture with `ffmpeg` plus a per-pixel pass.
The method is in §11.9. These are the facts the score is built on.

### The backdrop is alive on its own clock

Sampling the hero region only (below the header, above the estate strip), lit
and coloured pixels only — neutral cream text and browser chrome excluded —
across the 7.1-second dwell where nothing scrolls at all:

```
t=8.8s   mean hue 353°   lit 2.70%      t=12.4s   mean hue 318°   lit 4.73%
t=9.6s            335°       1.96%      t=13.2s            304°       4.99%
t=10.2s           320°       3.93%      t=14.4s            293°       5.82%
t=11.0s           340°       2.88%      t=15.2s            294°       5.43%
t=11.6s           322°       2.11%      t=15.6s            301°       5.32%
```

And across the closing dwell, where it marches instead of wandering:

```
t=32.4s  353°     t=33.6s    2°     t=34.4s   12°     t=35.2s   24°
t=32.8s  351°     t=34.0s    7°     t=34.8s   20°     t=36.0s   30°
```

Three findings, and the third is the one that matters:

1. The field never leaves an arc of roughly **280° → 40°** — violet-magenta,
   magenta, crimson, red, amber. Phase 10 measured 290°–45° by a different
   method. Take the union and treat **285°–45°** as the hard bound.
2. Lit-pixel share **breathes between 2.0% and 5.8%**. The field is not a
   constant-density texture with a hue knob on it.
3. **It moves while the page is still.** Over seven seconds of zero scroll the
   hue travels ~60° and the density more than doubles. A backdrop wired only to
   scroll progress is wrong in a way no screenshot will ever show you — and the
   reference's two long hero dwells exist precisely because that is what the
   person making the recording wanted to demonstrate.

### The persistent chrome

| Behaviour | Measurement |
|---|---|
| Header hides | on scroll **down**, at every scroll-down in the capture without exception |
| Header reveals | on scroll **up**, within 2 frames (~0.07s) of the direction flip |
| Header travel | clears the viewport in 3–4 frames (~0.12s) of visible motion |
| Header ground | never solid; page copy stays legible through it |
| Rail visible | frames 50–155, 195–252, 478–895, 936–960 |
| Rail hidden | frames 0–49, 253–477, 961–1083 — **exactly the three hero dwells** |
| Estate marquee | **70.9 px/s leftward**; 501px over 7.07s at a 1920 viewport |

The 0.12s of visible header travel is **consistent with**, not a correction to,
teardown §8.2's `.75s cubic-bezier(.19, 1, .22, 1)`. A sharp expo-out puts
almost all of its distance in the first fifth of its duration. Keep 0.75s.

Marquee speed is stated as a **speed**, not a duration, because that is the only
form which survives our track being a different width from theirs. Derive
`useTicker`'s seconds from our own track: `seconds = trackWidth / 70.9` at a
1920 viewport, scaled by the rem engine. Today's default of 40s is too slow for
any track narrower than 2836px.

### Section order, confirmed twice

Read forward off the scroll-down passes and backward off the scroll-up passes.
Both agree, and both agree with teardown §7 except for one insertion:

```
hero → CLOSING PANEL + two-cell scene → token → ledger table + tunnel
     → assay seal + auditor strip → pinned reel → governance → dispatches
     → [ faq → tiles → footer : NOT IN THE RECORDING ]
```

**The closing panel is not in teardown §7, and it is not one element.** §7 was
measured before the reference grew it. It is `[data-js="gl-hero-end"]` at
`aspect-[900/450]`, and it *contains* the two-cell panel that §8.7 documents as
a loose component with no home. §8.7 is that panel's specification; this is
where it lives. That is the single largest structural gap on our page.

---

## 11.2 — The spine: five invariants, before any section

Phases 2, 3 and 5 settled the first four. They are restated because every task
below depends on all of them, and because each is invisible until broken.

1. **One scroll position, one rAF loop.** Lenis drives `gsap.ticker`, the ticker
   drives `ScrollTrigger.update`, and every GL scene draws from that same ticker
   through `useFrame`. Never `renderer.setAnimationLoop` — it opens a loop per
   scene, and three scenes plus Lenis is four clocks interleaving.

2. **Every trigger routes through `scrollRoot()`.** On a coarse pointer the
   document does not scroll — the container in `app.vue` does. A trigger left on
   `window` silently never fires on a phone and looks perfect on your desktop.

3. **`motion.ts` exports purpose-built helpers, never `gsap`.** A new behaviour
   gets a new named helper, never an escape hatch. That is what makes "every
   ScrollTrigger is reverted" true by construction instead of by memory.

4. **Never tween a colour.** `motion.ts` owns geometry and opacity; CSS owns
   every state colour, as a class. A tween needs a literal value, and literal
   values are exactly what "no inline hex" forbids.

One more, which this phase is the first to need:

5. **Scroll-linked and time-linked motion are different systems and never share
   a helper.** The backdrop's evolution, the marquee and the medallion's idle
   drift run on the ticker's *elapsed time*. Everything else runs on scroll
   progress. A helper that quietly accepts either is a helper that will be
   handed the wrong one within a week, and the failure looks like "the animation
   feels slightly off" rather than like a bug.

---

## 11.3 — The score, in reading order

### 11.3.0 The backdrop — `<Scene kind="drift">`

The one surface the reader sees before they do anything. It sits at
`h-full-screen`, translates at **rate 1.0 — no fraction anywhere in the
sequence** — and it is **not** in the hero's dissolve block. It stays at full
strength the whole way down and is *covered* by the section below, which is what
makes the transition read as the page sliding over stone rather than as two
things fading at once.

Four changes, all in the pixel shader, none to the octave counts — the header's
reasoning about the warp being the cheapest octave is still correct:

1. **Narrow the vein core.** Raise the ridge exponent until lit-pixel share
   lands in **2.0–5.8%** and pixels below 10% luma reach **96.6%**. That range
   is the acceptance test. It is not a look.
2. **Cut the halo hard.** Keep the technique — a second, wider power of the same
   ridge summed on top is why there is no post-processing pass — but drop its
   amplitude until the mid band (L 25–128) falls to **~1.5%**. The reference's
   veins sit against pure black within a few pixels of the core.
3. **Add a vertical hue ramp.** Map screen-space `y` across **~70°** of the arc:
   magenta at the top of the viewport, amber at the floor, all in one frame.
   Derive both ends through `ink()` with a turn, as phase 3 requires. Do not
   introduce a literal and do not add a token.
4. **Give the field its own clock.** A slow, bounded, non-monotonic wander
   inside **285°–45°**, driven by elapsed time, plus a density term that
   breathes 2.0% → 5.8% on a different and non-commensurate period, so the two
   never visibly beat together. It must never enter green, cyan or blue — a
   single frame of teal reads as a different site.

**Do not** reach for a bloom pass, an `EffectComposer` or a CSS filter on the
canvas. Teardown §9 is explicit that the reference has no post-processing, and
every number above is a brightness problem, not a missing effect.

**Re-encode the still.** `plates['still-01']` is the reduced-motion and no-GL
fallback for this scene. A shader change that leaves the still behind ships two
different sites. Re-run `npm run gen:plates` — and remember that a full run
sweeps encodings it did not produce, so a partial run leaves an orphan file
committed and still counting against the budget.

### 11.3.1 The hero

Nothing here is scroll-driven except the leaving.

- Display headline, sub, pill CTA, stats box, estate marquee. All static.
- The marquee runs on the ticker at the speed in §11.1, leftward, seamless, and
  **does not pause, reverse or accelerate with scroll**.
- The stats box counts once on enter via `useTally`, and never again.
- On leave, the whole `z-2` block dissolves **together** — one tween on the
  block, not three on three elements, because the three fade together on the
  reference and three tweens is three chances for them not to. Opacity traces
  **(1−t)² over 0.7 of a viewport**: a `power2.out` tween to 0, not `power2.in`.
  This is measured and settled; do not re-derive it.

### 11.3.2 The closing panel and the two-cell scene — **the missing section**

The largest piece of new work in the phase. Build it in two stages and do not
start the second until the first holds still.

**Stage one — the contraction.** `useLock` + `useContract`. The backdrop
**crops**; it does not scale. The stone inside the closing plate is the same
size it was full-bleed, showing less of itself rather than a shrunken copy of
all of it. The reference gets that picture by re-rendering one shared canvas at
the panel's smaller viewport; our architecture is a canvas per scene, so
`clip-path: inset()` produces the identical result as a compositor operation
with no re-render. Two details, neither obvious, both already paid for once:

- The translate is on the **clipping wrapper**, never on `<Scene/>`'s root. A
  canvas moved a full viewport inside its own `overflow-hidden` box slides out
  of its clip and the hero goes black. `<Scene kind="drift">` therefore takes
  `rate` 0.
- **The clip keeps recomputing after it arrives.** The plate scrolls, the
  backdrop is viewport-locked; stopping at progress 1 parts them within a few
  pixels.

Panel geometry is `aspect-[900/450]`. The section heading sits below the panel
on entry and passes above it as the block scrolls — that is ordinary flow
against a viewport-locked backdrop, not a second animation. Do not add one.

**Stage two — the two-cell scene.** Teardown §8.7 specifies the furniture: a
framed media panel over a two-cell bar, active cell `bg-gold text-black`,
inactive transparent with cream text, both Roboto Mono uppercase, the copy below
the bar swapping with the cell. The capture adds what it *does*:

- The gold fill **translates between the two cells**. It does not cross-fade,
  and the inactive cell is never a second gold thing at lower opacity.
- The copy below **swaps with the cell**, as a discrete change on the same
  boundary — not a scrub, not a cross-dissolve.
- The struck object inside the panel runs a four-beat sequence across the
  section: a single disc tumbling → the disc breaking into fragments → the
  fragments resolving into **two objects side by side** → both rotating in
  place. Both are metal filtered white against a tinted environment; **the
  environment carries the gradient, not the objects.** On a metal, `color` is a
  filter — at `metalness: 1` there is no diffuse term, so tinting the struck
  objects gold multiplies the environment by a blue channel of `0x09` and
  deletes the very gradient the tint was meant to produce.

**Steps are discrete, with a dead-band on the boundary.** `step` is a pure
function of scroll progress, so a reverse crossing cannot desynchronise — there
is no playhead to desynchronise. Never tie the bar or the copy to a raw scrub
value, and never let a fast flick land the fill in one cell and the copy in the
other.

The panel is a **register, not a checkout.** Whatever the two cells are called,
they are two ways the house prices a lot. Nothing in this section acquires
crypto vocabulary on the way in.

### 11.3.3 The token section — a split, not a stack

Two columns divided by **one full-height hairline**, not a stacked block:

- Left: h2, body copy, pill, then two data rows under hairlines.
- Right: the medallion, rotating.
- The rule between them runs the section's full height, in `brown-dark`.

The medallion rotates on scroll **and drifts on the ticker when scroll is
still** — the capture shows it turning through a full magenta → violet → gold
sweep of its environment during a dwell where nothing else moves. It **comes to
rest face-on over its band**, rim lettering legible. It has to: it carries
something. That is also why the house mark in §11.3.7 shares the same rest rule
— giving the mark a continuous tumble would make the medallion the only object
on the page that stops, which is exactly the tell that makes people look at it.

Renders at **128px diameter or larger**, or the ring lettering stops resolving.

### 11.3.4 The ledger table and the tunnel

A data table on hairline-bordered rows over a receding arched colonnade. The
header row is a set of separate bordered cells, not a styled table row. Mono
throughout.

The tunnel is a backdrop, not a subject: it sits behind and below the table and
comes into full view as the table clears. The camera **dollies forward**; it
does not orbit. The copy block, sub and pill sit to the right of the table.

### 11.3.5 The assay section

`brown-darker` ground. A large seal, centred, drawn in a value only just above
its ground — engraved, not printed. It **parallaxes upward** relative to the
section as it passes. It does not scale, spin or brighten.

Below it, the auditor strip: a row of partner marks in a single hairline-ruled
band. This is live-only on the reference and absent from teardown §7's 721px
measurement — so expect our section to be taller than the teardown says, and do
not "fix" it back down.

The seal is a **marked surface**, so 04 §4.2 applies: graded down — aged stock
and oxidised bronze, never full cream, because drawn at full cream it becomes
the brightest object in its frame. It renders at 128px or larger, its bands are
**centred with the gap at the bottom** so no word inverts, and its render width
is a contract recorded in `_private/reach.json`. That number is not to be tidied
down because a layout would sit more comfortably.

### 11.3.6 The pinned reel

`h-[300vh]`, four steps, **pinned by `position: sticky`, not by GSAP**. Teardown
§7 measures 300vh on the section *itself*; a GSAP pin would have produced a
viewport-tall section with a 300vh spacer beside it. `motion.ts` only reports
which step we are in.

Per step: one full-bleed photograph, cut out on pure black, and one caption card
— a `brown-deepest` panel on a hairline carrying two lines of body copy.

**The caption card carries a gold progress hairline on its bottom edge, anchored
left, filling left→right across the step's scroll range.** Measured across
eleven frames of one step: the fill's right end travels monotonically while its
left end never moves. This is the one place on the site where gold is a moving
quantity, and it is why teardown §7 calls the section's furniture a progress bar
rather than a rule.

Each step holds **fully opaque for the whole step**. Reveal on enter, then stay
— never tie a marked surface to a precise scrub position (rule 5).

The reduced-motion layout is the **same DOM under different CSS**, not a second
template. No hydration seam, no second markup path, and it is still correct if
the JavaScript never arrives. `inert` is gated on the pin actually being live,
so all four steps stay in the accessibility tree there.

### 11.3.7 Governance

Two columns on a full-height hairline. Left: the house mark extruded in 3D, same
material as the medallion, botanical relief on its faces, rotating slowly and
**coming to rest face-on over the same band** the medallion does. Right: h2,
body, two pills, then three labelled blocks — mono uppercase label, body copy,
hairline between. An open list. **Not an accordion**; there is nothing to open.

### 11.3.8 Dispatches

`brown-darker`, `z-3` — its cards overflow the column and must pass *over* the
section below rather than under it. Ornamental plate, h2, copy, then the
horizontal card carousel.

The carousel is where `drag` sneaks in. **Name it `pull`** — `pullEnd`,
`onPull`, `pullable`. This is the single most likely naming-ban failure in the
phase, and it will pass a code review by eye every single time.

### 11.3.9 FAQ, tiles, footer — not in the recording

The capture never reaches them; its deepest point is dispatches. **The absence
of evidence is not evidence of stillness.** Build these to teardown §7, §8.6 and
§8.9 exactly as specified, add no motion this phase does not name, and do not
invent a reveal for them merely because the sections above got one.

---

## 11.4 — The persistent chrome

### The header

Direction-aware, per teardown §8.2. `is-away` toggled by a ScrollTrigger
direction watcher; `transform: translate3d(0, -100%, 0)`; `.75s
cubic-bezier(.19, 1, .22, 1)`; transform only. Translucent black plus
`backdrop-blur-sm` plus a bottom hairline — **never solid**. Page copy must stay
legible through it, which the capture confirms at every scroll position.

The hide is a **class toggle**, not a tween. Do not "improve" it into a tween: a
tween needs an interruption policy for a reader who reverses mid-flight, and the
class does not.

### The rail

`fixed`, left edge, full height, above the sections. Eight items, mono
uppercase, one per section. **This component does not exist yet — build it.**

| Property | Value |
|---|---|
| Visible | only past the hero — absent for every hero dwell in the capture, without exception |
| Inactive item | `brown-lifted` (running text: `brown` fails AA at 2.61:1) |
| Active item | `cream`, heavier weight |
| Active marker | **the house mark glyph, which travels to the active item** |
| List ends | fade out at top and bottom |

The travelling mark is the detail that makes the rail read as a made object
rather than as a nav. It moves on the same discrete step boundaries the sections
do — it never scrubs between two items.

Three constraints that are easy to miss:

- The rail is **navigation**: a real list, real links, correct `aria-current`,
  reachable by keyboard, and it must not become a decorative overlay that traps
  focus. Rule 8.
- On a 375px viewport it does not fit beside the content. Decide deliberately
  what it becomes there. It may not become a hover-only anything (rule 4).
- Its labels are section names. Check every one against the naming ban *before*
  writing them into `app/content/site.ts`, not after.

---

## 11.5 — Motion constants

Nothing in this phase invents a curve. Everything comes from teardown §6.

```
cubic-bezier(.4,  0, .6, 1)     the pulse keyframe — the only @keyframes on the site
cubic-bezier(.23, 1, .32, 1)    expo-out — UI state changes
cubic-bezier(.19, 1, .22, 1)    expo-out, sharper — reveals, menu, header hide
```

| Constant | Value | Source |
|---|---|---|
| Header hide / show | 0.75s, expo2, transform only | teardown §8.2 |
| Hero dissolve | (1−t)² over 0.7vh, `power2.out` to 0 | measured, settled |
| Backdrop parallax rate | **1.0**, no fraction | measured, settled |
| Marquee | 70.9 px/s leftward @1920 | measured this phase |
| Backdrop hue arc | 285° → 45°, never outside | phases 10 + 11 |
| Backdrop lit share | 2.0% – 5.8% | measured this phase |
| Pinned reel | 300vh, 4 discrete steps, dead-band | teardown §7, phase 3 |
| Seal / medallion floor | ≥128px; `reach.json` governs | phase 5 |

---

## 11.6 — Order of work

Strictly in this order. Each step is independently verifiable, and each one
makes the next one measurable.

1. **The backdrop** (§11.3.0). The largest visible gap, and the only change in
   the phase visible in a thumbnail. Do it first so every later screenshot is
   taken against the right ground.
2. **The rail** (§11.4). New component. Everything below is easier to navigate
   and to film once it exists.
3. **The closing panel, stage one** — the contraction alone (§11.3.2).
4. **The closing panel, stage two** — the two-cell scene (§11.3.2).
5. **The token split** (§11.3.3), then **governance** (§11.3.7). They share the
   material and the rest rule; built together they cost one decision instead of
   two.
6. **The reel's progress hairline** (§11.3.6).
7. **The assay parallax and the auditor strip** (§11.3.5).
8. **The marquee re-timing** (§11.4). Trivial, and last, because it is the change
   most likely to be undone accidentally by a track-width edit above it.

---

## 11.7 — Do not

- Do not build the tapestry. It is not on the reference site (§11.0).
- Do not reproduce the reference's name, wordmark, partner logos, headlines,
  table rows or outbound links.
- Do not add a post-processing pass, an `EffectComposer`, or a CSS filter on a
  canvas in order to fix a brightness measurement.
- Do not add a scroll-progress indicator, a section counter, a scroll-hint arrow
  or a "scroll to explore" line. None is on the reference, and every one is a
  step toward the page announcing itself.
- Do not make any marked surface more discoverable. Placement is specified in
  `prompts/04-clue-architecture.md` and is deliberate.
- Do not re-enable production source maps.
- Do not tween a colour, anywhere, for any reason.
- Do not let `three` load before `capable()` has decided. The gate runs BEFORE
  the import, and a reader who fails it never downloads the 600 KB.

### The skills that will fight this brief

Several skills were nominated for this work. Two carry house styles that
**contradict `CLAUDE.md`'s anti-brief**, and the anti-brief wins:

- `video-to-website` assumes the video is *product footage* to be scrubbed on a
  canvas, and mandates 12vw marquees, count-up statistics, circle-wipe reveals
  and an 800vh scroll container. Our video is a *screen recording of the target
  site*. Take its measurement discipline — frame extraction, per-frame analysis
  — and discard its template entirely.
- `high-end-visual-design`, `stitch-design-taste` and `ui-ux-pro-max` will reach
  for tracking on display type, gradient grounds and card shadows.
  Letter-spacing is `normal` everywhere on this site, and adding tracking is the
  fastest single way to make the replica read as a lookalike.

Use them for technique. Do not let them supply taste.

---

## 11.8 — The rules this phase is most likely to break

Ranked by how likely the failure is to ship unnoticed.

1. **Rule 2 — find-in-page must fail.** The two-cell bar's labels, the rail's
   eight labels and the reel's four captions are all new user-visible strings.
   Every one is a chance to put a banned token into plain DOM text.
2. **Rule 6 — no source leaks.** `fragment`, `drag`, `storage` and `average` all
   carry `rag`. The carousel and the shader are where they enter.
3. **Rule 4 — mobile-reachable.** The rail has no room at 375px, and the
   two-cell scene is the most tempting place on the page to gate something
   behind hover.
4. **Rule 10 — legibility.** The backdrop change makes the field dimmer *and*
   moves its hue under the headline. Re-run `npm run audit:contrast` after the
   shader work, not at the end of the phase.
5. **Rule 9 — performance.** A second time-driven clock in the shader, plus a
   travelling rail marker, plus a four-beat object sequence, is three new things
   drawing every frame. The budget is unchanged: **< 2.5 MB, LCP < 2.5s on 4G.**

---

## 11.9 — Acceptance

The phase is done when every one of these is true, checked in this order.

**Measured, by the harness:**

- [ ] Hero backdrop: pixels below 10% luma ≥ 96.6%; lit-pixel share inside
      2.0–5.8%; mid band (L 25–128) ≤ ~1.5%.
- [ ] Backdrop hue, sampled in five horizontal bands of one frame, spans ≥ 60°.
- [ ] Backdrop hue over 10s of **zero scroll** moves by ≥ 30° and never leaves
      285°–45°.
- [ ] Marquee displacement over 5s equals 70.9 px/s × 5, ±5%, at 1920.
- [ ] Root font computes to exactly `8px` at 1440.
- [ ] Total transfer < 2.5 MB; no `three` entry in `performance.getEntries()`
      when the GL gate fails.

**Observed, at 0.25× speed, side by side with the capture:**

- [ ] The hero backdrop is visibly moving before the reader scrolls at all.
- [ ] The contraction crops. The stone does not get smaller.
- [ ] The header is gone on every scroll-down and back within ~0.1s of every
      scroll-up, at every scroll position on the page.
- [ ] The rail is absent on the hero and present everywhere below it, and its
      mark lands on items rather than sliding between them.
- [ ] The two-cell fill is in exactly one cell at all times and the copy below
      always agrees with it — including after a fast flick and a reversal.
- [ ] The reel's four steps are each fully opaque for their whole step, and the
      gold hairline fills left→right without ever moving its left end.
- [ ] The medallion and the house mark both come to rest face-on.

**Audited:**

- [ ] `npm run audit:names` — clean, source and built output.
- [ ] `npm run audit:contrast` — clean, with the `brown` finding still printed.
- [ ] `npm run audit:register` — clean; `reach.json` regenerated by the run that
      drew the artwork, not edited by hand.
- [ ] `npm run verify` — both audits, then a full static build.

**Reduced motion, checked separately and not last:**

- [ ] No Lenis, no pin, no scrub, no parallax, no GL.
- [ ] The reel's four steps are all present, all readable, all in the
      accessibility tree.
- [ ] The backdrop is `plates['still-01']`, re-encoded this phase, and it looks
      like the shader it stands in for.

### The harness

Re-measure with the same method that produced §11.1, so the numbers are
comparable rather than merely similar:

```bash
ffmpeg -i CAPTURE -vf "select='not(mod(n,N))',crop=1920:916:0:104" -vsync 0 out%04d.png
```

Then, per frame, over the hero region only: discard pixels with `max(r,g,b) < 22`
and pixels with saturation `< 0.40`. That removes cream text and browser chrome,
which otherwise dominate any luminance-weighted mean and will confidently tell
you the backdrop is grey. Bin what remains by hue and take the **circular** mean.
An arithmetic mean of hues either side of 0° returns cyan — which is how a field
that never leaves the warm arc gets reported as teal.

Point the same script at our build through `playwright-cli` at 1440×860 and at
375px, and compare the two columns against each other rather than either one
against a memory of what the reference looked like.
