# PHASE 2 — Design system & 21st harvest

**Goal:** lock the brand so that every later section is a build task, not a taste debate.
**Prereq:** Phase 1 complete.
**Done when:** `/style` renders a specimen page proving tokens, type, motion and harvested components all work.

---

## Task 2.1 — Brand identity

```
Write the brand bible into CLAUDE.md under "## Brand", and the copy constants into
src/content/site.ts.

NAME       NORTHBOUND
FOUNDED    est. 2011, Chamonix
WHAT       High-altitude expedition outfitter. Guided ascents, permits, logistics.
VOICE      Understated, technical, a little severe. Short declaratives.
           Copy that respects the reader. Never markety, never exclamatory.
           Think Arc'teryx and Patagonia field notes, not a startup landing page.
TAGLINE    "The mountain does not negotiate."
CTA        "Request Access"  (a persistent pill — this is a ballot, not a checkout)

Anti-brief — if the output drifts here, it is wrong:
  no purple/blue SaaS gradients, no rounded-2xl three-column feature cards,
  no emoji, no stock-photo smiling teams, no "Trusted by 10,000+ climbers",
  no chatbot bubble, no cookie banner.
```

---

## Task 2.2 — Colour

Each scroll scene owns a palette. The page shifts temperature as you descend — that is what sells "cinematic" without any extra animation.

```
Define these as CSS custom properties in src/styles/globals.css under :root,
then expose them to Tailwind v4 via @theme.

Base
  --ink        #0B0F0E   near-black, all body text on light
  --bone       #F4F1EA   warm off-white, the default page ground
  --moss       #1F3A2E   deep forest green, primary brand
  --lichen     #8A9A5B   muted accent, use sparingly
  --stone      #6B6F6B   secondary text
  --ember      #C2410C   single hot accent, for one scene only

Scene grounds (full-bleed section backgrounds)
  --scene-approach  #E8EDE7   pale sage      (hero)
  --scene-ascent    #C9D6DD   cold sky       (ethos)
  --scene-ridge     #0B0F0E   near-black     (the pinned feature scene)
  --scene-camp      #F4F1EA   bone           (routes, safety, logistics)
  --scene-dusk      #2A1A12   warm dark      (permits, footer)

Rules
- Body text is --ink on light grounds, --bone on dark. Nothing in between.
- --ember appears exactly ONCE in the whole site. Scarcity is what makes it read as art
  direction rather than decoration.
- Every pairing must clear WCAG AA (4.5:1). Verify and print the contrast ratios.
```

---

## Task 2.3 — Type

```
Two families, no more.

DISPLAY   Instrument Serif (Google Fonts) — high-contrast, editorial
          Only for scene headlines. Sizes clamp(3.5rem, 13vw, 12rem).
          line-height 0.85, letter-spacing -0.03em.
          Headlines split across the viewport, never centred in one tidy block.

TEXT      Inter (Google Fonts) — 400 and 500 only
          Body: max-w-[38ch], 0.95rem, line-height 1.7, color --stone.
          Labels/eyebrows: 0.7rem, uppercase, letter-spacing 0.18em, --stone.

Self-host via @fontsource so there is no render-blocking Google Fonts request —
we have a 2.5s LCP budget.

Build a type scale as CSS custom properties and a /style specimen route that renders
every step. I want to see the specimen before we build any section.
```

---

## Task 2.4 — Motion system

```
Create src/lib/motion.ts as the single source of truth for movement.

1. Lenis provider component (components/layout/SmoothScroll.tsx):
   lerp 0.08, wheelMultiplier 1, and drive gsap.ticker from Lenis' raf so the two
   never fight. Disable entirely under prefers-reduced-motion.

2. Register ScrollTrigger once. Export shared constants:
   EASE = 'power2.out'
   SCRUB = 1
   PIN_DISTANCE = '250%'    // pinned scenes are 250vh of scroll

3. Export two helpers:
   - useReveal(ref)  — fade + 24px rise on enter, plays ONCE, never reverses.
                       This is the default for all content. Clue-bearing sections
                       use this and nothing else (Rule 5: stable once revealed).
   - usePinnedScene(ref) — pin + scrub, for the hero and the ridge scene ONLY.

4. Every trigger is created inside gsap.context() and reverted on unmount.

5. Parallax layers move at 0.3 / 0.6 / 1.0 of scroll rate, foreground fastest.

Reduced-motion behaviour: no pinning, no scrub, no parallax — plain opacity fades,
and all content still reachable by normal scrolling. Verify this by toggling the OS
setting; a participant with reduced motion enabled must still be able to find all six.
```

---

## Task 2.5 — 21st harvest

We buy the furniture and spend our own time on the art direction.

```
Use the 21st CLI. For each item: search, inspect two or three candidates, pick one,
install it, then restyle it to our tokens from Task 2.2/2.3.

  npx @21st-dev/cli search "minimal transparent navbar scroll blur" --type c --limit 8
  npx @21st-dev/cli search "horizontal scroll card carousel gsap" --type c --limit 8
  npx @21st-dev/cli search "editorial accordion faq" --type c --limit 8
  npx @21st-dev/cli search "infinite marquee ticker" --type c --limit 8
  npx @21st-dev/cli search "large editorial footer sitemap" --type c --limit 8
  npx @21st-dev/cli search "scroll progress indicator" --type c --limit 6

  npx @21st-dev/cli get <id>            # read the code before choosing
  npx @21st-dev/cli add <user>/<slug>   # install the winner

For each one, tell me which you picked and why in one line.

CRITICAL — two components carry clues and have hard requirements:

  • The CAROUSEL holds the route cards, one of which is "Pinecone Pass".
    It MUST be reachable on touch: swipeable, plus visible arrow controls.
    If the card is only reachable by a mouse drag, mobile participants lose that clue.

  • The ACCORDION holds the permit panel with the OCR stamp.
    It MUST mount its panel content only when open — that unmounting is our Ctrl+F
    defence. If the component you install renders panel content while collapsed
    (display:none or height:0), either patch it to conditionally render, or pick
    a different one. Verify by inspecting the DOM while collapsed.

Also pull a brand mark:
  npx @21st-dev/cli logo "mountain"      # free, no login needed
Pick something austere and monoline. Do not generate a logo with AI — it will look
like an AI logo and that is the fastest tell that this site is not real.
```

---

## Task 2.6 — Primitives

```
Build in src/components/ui/, all consuming the tokens:

  <Section>      full-bleed wrapper, takes a `ground` prop (the scene palette),
                 handles vertical rhythm and the colour transition between scenes
  <Eyebrow>      uppercase label
  <Display>      display-serif headline, accepts a `split` boolean (see Phase 3)
  <Body>         38ch measure
  <Figure>       image + caption, with the caption in the same style everywhere
                 (used by clue-bearing images — the caption must be unremarkable)
  <Pill>         the persistent "Request Access" CTA

Absolute rule for <Figure>: every figure on this site renders identically, whether or
not it carries a clue. Same caption weight, same border, same spacing. If clue-bearing
figures look even slightly different, participants will learn the pattern and sweep the
site in two minutes.
```

---

## Phase 2 exit check

```
Show me the /style specimen page with: full colour ramp + contrast ratios, every type
step, all six harvested 21st components restyled to our tokens, and a scroll demo
proving Lenis + useReveal + usePinnedScene work.

Then confirm: accordion panels are absent from the DOM when collapsed, and the
carousel is swipeable at 375px width.
```
