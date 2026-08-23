# PHASE 2 — Design system

**Read first:** `REFERENCE-TEARDOWN.md` §4, §5, §6, §8 — this phase is almost entirely
transcription from it.
**Invoke:** `frontend-design`, `high-end-visual-design`, `ui-ux-pro-max`,
`21st-ui-build`.

**Outcome:** every token and every component in the reference exists in our build,
proven side by side at `/specimen`.

> **Use 21st for structure, not for style.** Harvest the *mechanics* of an accordion,
> a marquee, a horizontal carousel, a dropdown — the focus management, the height
> animation, the reduced-motion handling. Then strip every visual decision the
> component came with and re-dress it from the teardown. A 21st component shipped
> with its own styling will read as a different site immediately: it will have a
> border radius we do not use, a shadow we never use, and a grey we do not own.
>
> If the 21st MCP is unauthorised, use the `21st-cli-use` skill instead — it shells
> out through the CLI and needs no MCP connection.

---

## Task 2.1 — Tokens

Already in `tailwind.config.ts` from phase 1. Verify against teardown §4 that all
eight colours are byte-exact. Then add the type ramp to `main.css` as real classes,
transcribed from teardown §5 — all eight, with their `s:` overrides:

`.type-display-xl` `.type-h2` `.type-h3` `.type-body-lg` `.type-body-md`
`.type-body-sm` `.type-body-xs` `.type-caption`

Three hard rules:

- **No `letter-spacing`.** The reference tracks nothing. Adding tracking is the
  fastest way to make the replica read as a lookalike rather than a copy.
- `.type-display-xl` keeps `line-height: .75`. Do not soften it.
- Headings are Funnel Display **300**, not 400. The lightness is the whole character.

Then the `.txt` long-form block, transcribed verbatim from teardown §5.

## Task 2.2 — Layout primitives

From teardown §6, verbatim: `.site-max` with its five padding modifiers, `.stack` /
`.stack.--c`, `.h-full-screen`, and the three easing curves as CSS variables.

`.site-max` is the **only** container. There is no second one, no `max-w-7xl`, no
per-section width. If a section needs a narrower column, it uses `.site-max.--s`.

## Task 2.3 — `<Pill/>` — build this one first and get it exactly right

The turbulence-wipe button is the site's signature interaction. Spec in teardown §8.1.

Props: `to` (internal) or `href` (external), `variant` (`primary` | `ghost` | `gold`),
`icon` (slot).

Implementation notes that are not optional:

1. Generate the filter `id` per instance (`useId()`). Shared ids make every pill on
   the page displace in lockstep, which is instantly visible and instantly wrong.
2. The wipe is GSAP, not CSS: `rect.width` `0 → 150%` while
   `feDisplacementMap.scale` goes `0 → 18 → 0` over the same tween. The scale
   returning to zero at the end is what makes the filled state have a clean edge.
3. Bind on `pointerenter`/`pointerleave` **and** on `touchstart`, or the effect is
   desktop-only — rule 4.
4. Under `prefers-reduced-motion`, skip the tween and cross-fade the fill.
5. `overflow-hidden` on the anchor. The rect is intentionally larger than the button.

Do not move on until a `/specimen` pill wipes identically to the reference's. Open
both side by side and compare at quarter speed with
`gsap.globalTimeline.timeScale(0.25)`.

## Task 2.4 — `<SiteHeader/>`

Teardown §8.2, verbatim structure. Points of care:

- `.site-max.--full` inside, `h-70 s:h-80` on the nav.
- `bg-black/50` + `backdrop-blur-sm` + `border-b border-brown-dark`. Never solid.
- The hide-on-scroll-down / show-on-scroll-up behaviour is a ScrollTrigger
  `onUpdate` reading `self.direction`, toggling one class. Do not animate `top`;
  translate.
- **The wordmark is a `mask-image` with an inline SVG data-URI of outlined paths**,
  and the button carries `aria-label`. Phase 5 generates the paths — stub it with a
  placeholder path now, but build the mask mechanism today, because it is also
  technique **T-B** and phase 4 depends on it existing.

## Task 2.5 — `<SiteMenu/>`

Teardown §8.3. Full-screen black overlay, gold circular close button, primary pill,
mono uppercase rows on hairlines, the stats box, the social tile row.

Trap focus while open, restore on close, close on Escape, and lock Lenis
(`lenis.stop()` / `lenis.start()`). Do not set `overflow: hidden` on `body` — with
the touch scroll container from phase 1 that does nothing.

## Task 2.6 — `<StatBox/>`

Teardown §8.4. Bordered, `divide-y`, `rounded-[.5rem]`, mono uppercase rows.
Values count up on enter, once, and never re-run — this component appears inside the
hero *and* inside the menu, and a value that re-counts every time the menu opens is a
tell.

## Task 2.7 — `<Ledger/>` — the data table

Teardown §8.5. Horizontally scrollable with a visible track on mobile, boxed mono
header, paired overlapping chips, row hover `has-hover:hover:bg-brown-darker`.

Content arrives as props from `app/content/`. **Name the horizontal-scroll handler
`pull`, never `drag`** — phase 1's substring trap table.

## Task 2.8 — `<Accord/>` — the accordion

Teardown §8.6. Hairline rows, no card, no radius. Closed: cream question, gold `↓`.
Open: gold question, gold `↑`, answer in a `bg-brown-dark` panel.

Real `<button aria-expanded>` per row, `id`/`aria-controls` wired, height animated
with GSAP to `auto`, expo easing. Keyboard-operable. Under reduced motion, snap.

## Task 2.9 — `<TabPanel/>`

Teardown §8.7. Framed media panel over a two-cell tab bar. Active `bg-gold text-black`,
inactive transparent cream, both Roboto Mono uppercase. Copy below swaps with the tab.

Use the roving-tabindex pattern (`role="tablist"`, arrow keys). This is exactly the
sort of mechanics worth harvesting from 21st rather than hand-rolling.

## Task 2.10 — `<Carousel/>`

Teardown §8.8. Horizontal scroll row of tall cards, scroll-snap, momentum on touch,
arrow controls on desktop only. Cards: photographic header + overlaid wordmark, a
light pill with an index label and a round play button, then gold mono date and a
`type-h2` title.

Native `overflow-x: auto` with `scroll-snap-type`. Do not reach for a carousel
library — the reference does not use one, and every library ships its own styling.

## Task 2.11 — `<Marquee/>`

The hero's partner strip: an infinite horizontal ticker of logo cells divided by
`brown-dark` verticals. Duplicate the track and translate on a GSAP loop, pause under
reduced motion.

## Task 2.12 — `<Tiles/>` and `<SiteFooter/>`

Teardown §8.10 and §8.9. The footer's `MENU` accordion reuses `<Accord/>`.

## Task 2.13 — Section chrome

One `<Band/>` wrapper that every home section uses, because the reference is
absolutely consistent about this (teardown §7):

```
<section class="relative z-2 border-t border-brown-dark [ground]">
```

Props: `ground` (`black` | `darker`), `pad`, `rule` (whether to draw the vertical
centre hairline). **Every section gets the top hairline.** There is not one exception
on the reference site, and the eye notices a missing one immediately.

## Task 2.14 — `/specimen`

A dev-only route rendering: the eight colours with live contrast ratios, every type
class at both breakpoints, all eleven components in every variant and state, and a
motion demo. Register it **only** under `import.meta.dev` so it cannot ship.

This page is what phase 8 diffs against the reference. It is not optional and it is
not a nice-to-have — building it now is what makes the fidelity audit cheap.

---

## Task 2.15 — Conventions (put these in `CLAUDE.md`)

- All user-visible copy lives in `app/content/`, never inline in a template.
- Sections are presentational; content arrives via props.
- Every ScrollTrigger is created inside a `gsap.context()` and reverted on unmount.
- One motion system. Never mix a CSS transition and a GSAP tween on the same property.
- Respect `prefers-reduced-motion` everywhere: no pin, no scrub, no parallax, no ticker.
- Tokens are Tailwind theme values, consumed as utilities. No inline hex, anywhere.
- Generated files (`app/content/outlines.ts`, `app/content/plates.ts`) are never
  hand-edited. Re-run the generator; the file header names it.
- Images render through `<Plate/>`, never a bare `<img>` — it carries width/height
  from `plates.ts`, the srcset and the load policy.
- Clue-bearing artwork passes `priority="early"` so it is fetched well before it is
  scrolled to. A clue that fails to paint for a fast scroller is a clue that does not
  exist.
- Seals render at 128px diameter or larger. Below that the ring lettering stops being
  readable, which breaks rule 1.

---

## Exit criteria

- [ ] All eight colours and all eight type classes match teardown values exactly,
      verified by computed style at 375px and 1440px.
- [ ] `/specimen` renders every component in every state.
- [ ] The pill wipe is visually indistinguishable from the reference at 0.25× speed.
- [ ] Accordion, tabs and menu are fully keyboard-operable.
- [ ] Every component degrades correctly under `prefers-reduced-motion`.
- [ ] `/specimen` is absent from a production build.
- [ ] `npm run audit:names` passes.
