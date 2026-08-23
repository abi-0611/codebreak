# PHASE 3 — Motion and WebGL

**Read first:** `REFERENCE-TEARDOWN.md` §6 (easings), §7 (section 5 is the pinned
scene), §9 (the three GL scenes).
**Invoke:** `scroll-animations` for the GSAP/ScrollTrigger patterns; `playwright-cli`
to capture motion for frame-by-frame comparison against the reference.

**Outcome:** one scroll position, one rAF loop, three GL scenes, one pinned section —
and a hard fallback path for every one of them.

---

## Task 3.1 — One scroll position

`app/composables/motion.ts` is the **only** module that talks to GSAP or Lenis.
Nothing else imports either library. This is what stops the two systems fighting over
scroll position, which is the single most common way a build like this goes wrong.

```
Lenis instance  →  drives gsap.ticker  →  drives ScrollTrigger.update()
```

- Register `ScrollTrigger` once.
- `lenis.on('scroll', ScrollTrigger.update)`
- `gsap.ticker.add(t => lenis.raf(t * 1000))`
- `gsap.ticker.lagSmoothing(0)`
- On `prefers-reduced-motion`: **do not instantiate Lenis at all**, and do not add the
  ticker. Native scroll, no pin, no scrub, no parallax.

Export exactly four things, and keep the surface this small:

| Export | Contract |
|---|---|
| `useReveal(el, opts)` | fade + rise on enter, **once**, never reverses |
| `usePin(el, opts)` | pin + scrub. Used exactly once on the whole site. |
| `useParallax(el, rate)` | `translate3d` only. Used on the hero backdrop. |
| `useDirection(cb)` | scroll direction watcher for the header |

Constants, matching teardown §6: `EASE = 'expo.out'`, `SCRUB = 1`,
`PIN_DISTANCE = '300%'`.

`useReveal` is the default for all content and **the only motion permitted on a
clue-bearing section** (rule 5). It reveals on enter and then stays. It never
reverses, because a participant who scrolls back up to re-read a clue must find it
still there.

## Task 3.2 — Header direction watcher

Teardown §8.2. `useDirection` toggles one class on `<header>`; CSS translates it out
of view. Add a small threshold (~80px) so a jitter at the top of the page does not
flicker the header, and force it visible whenever the menu is open.

## Task 3.3 — The pinned scene

Teardown §7 row 5: `section.relative.h-[300vh].border-t.border-brown-dark`.

Structure: a `h-full-screen` sticky child inside a `300vh` parent. Inside it, a
`.stack` holding the full-bleed image layer and, over it, the caption card and the
gold progress bar.

The timeline has **four steps**. Each step swaps the image and the caption. The gold
bar at the bottom tracks overall progress.

**Rule 5 governs this section absolutely.** A clue lives here (see
`04-clue-architecture.md`). Therefore:

- Step boundaries are **discrete**, not continuous. Cross a threshold, the step
  changes, and it *stays* changed until the next threshold. Do not tie opacity to a
  raw scrub value — that produces a clue that is only fully opaque for 40px of scroll.
- Every step's content is fully opaque for its entire range. Cross-fades between
  steps are 150ms, not scrubbed.
- Scrolling back up returns to the previous step cleanly. Test this deliberately;
  reverse playback is where scrubbed timelines fall apart.
- Under `prefers-reduced-motion`: no pin at all. Render the four steps as four
  stacked static blocks. Every clue must still be visible in that layout — check it.

On a 375px phone, 300vh of pinned scroll is roughly four full swipes. That is the
budget the reference spends and it is enough. Do not extend it.

## Task 3.4 — GL scene 1: the hero backdrop

Teardown §9. A dark, slow, flowing filament field in red, gold and magenta on pure
black — reads as saffron threads suspended in water.

- `h-full-screen`, `absolute top-0 inset-x-0 overflow-hidden`, mounted via a
  `data-js` hook exactly as the reference does.
- Canvas sized by CSS, backing store scaled by `devicePixelRatio` **capped at 2**.
- Parallaxed on scroll with `translate3d(0, Y, 0)` on the wrapper — not by moving the
  camera. Cheaper and it matches the measured behaviour.
- Additive blending on a point/line system, slow curl-noise advection. No
  post-processing chain — it is not needed and it costs the frame budget.

## Task 3.5 — GL scene 2: the House Medallion

Teardown §9. A 3D minted disc: engraved lettering repeated around the rim, a
botanical relief in the field, the house mark centred. Metallic gradient
gold → magenta → red under a `PMREMGenerator` environment map. Rotates on scroll.

**This object carries a clue** (`04-clue-architecture.md`, T-C). Two consequences:

- The rim lettering must be legible when the disc faces the viewer. Constrain the
  scroll-driven rotation so the disc passes through a face-on attitude and **rests
  there**, rather than tumbling continuously. Rule 5.
- Generate the rim lettering as a **texture baked offline in phase 5**, not as
  `TextGeometry` built at runtime from a font file. Runtime text geometry means
  shipping a font JSON that contains the string, and it means a failure mode where
  the glyph is missing and the clue silently disappears.

## Task 3.6 — GL scene 3: the house mark

Teardown §9. The mark extruded, same material, rotating on scroll. No clue on this
one — it is the decoy-by-symmetry that makes the medallion not look special.

## Task 3.7 — Fallbacks, and why they are not optional

Rule 9. Three GL scenes on mid-range Android is the main performance risk in the
whole build, and one of them carries a clue.

Implement a single `<Scene/>` wrapper that decides, once, at mount:

| Condition | Behaviour |
|---|---|
| `prefers-reduced-motion` | static frame, no GL context created |
| No WebGL2 context | static frame |
| `navigator.hardwareConcurrency <= 4` | static frame |
| `navigator.connection.saveData` | static frame |
| Canvas fails or context is lost | swap to static frame, do not retry |

The static frame is a committed WebP rendered from the same scene, generated offline
in phase 5. **For the medallion, the static frame must show the clue exactly as
legibly as the live scene does** — that is the entire point. Generate it at the
face-on attitude.

Budget: hero + medallion + mark together under **900 KB** of GL assets, and the page
must hold 30fps on a 4×-throttled CPU. Measure it in phase 8; if it misses, cut the
mark scene to a static frame permanently. It carries nothing.

## Task 3.8 — Reveal defaults

Wire `useReveal` into `<Band/>` so every section reveals consistently: fade plus a
24px rise, 600ms, expo-out, `start: 'top 85%'`, `once: true`.

That is the whole reveal vocabulary. Do not add a per-section variation, do not
stagger words, do not add a mask-wipe on one heading because it looked good. The
reference's restraint here is what makes the two heavy moments — the hero and the
pinned scene — land.

---

## Exit criteria

- [ ] Exactly one rAF loop and one scroll position. Verified: `gsap.ticker` has one
      Lenis subscriber, and `ScrollTrigger.update` is called from it only.
- [ ] The pinned scene's four steps are discrete, stable, and reverse cleanly.
- [ ] Under `prefers-reduced-motion`: no Lenis, no pin, no parallax, no GL — and the
      pinned scene's four steps are all visible as stacked blocks.
- [ ] The medallion rests face-on, with rim lettering legible, at a stable scroll
      position — not mid-tumble.
- [ ] Every GL scene falls back to its static frame under all five conditions in 3.7.
- [ ] No ScrollTrigger leaks: navigating between routes and back leaves
      `ScrollTrigger.getAll().length` unchanged.
- [ ] 30fps held on 4× CPU throttle at 375px.
