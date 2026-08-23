# REFERENCE TEARDOWN — measured ground truth

> Every value in this file was **measured from the live reference**
> (`https://saffron-griflan.netlify.app/`) in a real browser, not estimated.
> When a phase file and this file disagree, **this file wins**.
> When your intuition and this file disagree, this file wins.

Re-measure with the recipe in §11 if you ever need to confirm something.

---

## 1. Stack, as built

| Layer | What the reference actually uses |
|---|---|
| Framework | **Nuxt 3** (Vue 3), SSR/SSG. Root node is `<div id="__nuxt">` |
| CSS | **Tailwind v3** (compiled utilities carry `--tw-*` vars) |
| Smooth scroll | **Lenis** (`html.lenis`, `html.lenis body { height: auto }`) |
| Scroll animation | **GSAP** + **ScrollTrigger** (+ `Observer`) |
| 3D | **three.js r180** (`<canvas data-engine="three.js r180">`) |
| Fonts | Google Fonts, `display=swap` |
| CMS | DatoCMS image CDN. *We do not need a CMS — local content files.* |
| GL mount hooks | `data-js="gl-hero"`, `data-js="gl-hero-bg"` attribute hooks |

There is **no** Locomotive, Barba, Swiper, Splide, Framer Motion or Matter.js.

---

## 2. The fluid rem engine — the single most important thing in the build

This is the reason the site feels like one designed object at every width. Get this
wrong and nothing else lines up.

```css
:root {
  --size: 375;                  /* mobile design width */
  --clamp: 15px;                /* hard ceiling on root size */
  --global-font-size: clamp(5px, calc((100vw / var(--size)) * 10), var(--clamp));
}
@media (min-width: 650px) {
  :root { --size: 1800; }       /* desktop design width */
}
html { font-size: var(--global-font-size); }
```

**What it means:** `1rem = 10 design pixels`. A thing that is 80px wide in the design
file is `8rem`. The whole layout scales linearly with viewport width and freezes at
2700px, where the 15px clamp bites.

**Tailwind spacing is remapped to match**, so utility numbers ARE design pixels:

```js
spacing: n => `${n / 10}rem`   // .p-20 → padding: 2rem → 20 design px
```

Measured proof: `.p-20 { padding: 2rem }`. At a 1440px viewport the root font
computes to exactly **8px**, so `.p-20` paints 16 real px. That is correct and
intended — the site is 1800 design px wide and 1440 is 80% of that.

`html` also carries:

```css
font-variant-ligatures: common-ligatures;
-webkit-text-size-adjust: none;
-webkit-font-smoothing: antialiased;
-webkit-tap-highlight-color: transparent;
```

---

## 3. Breakpoints — there is exactly one

```js
screens: { s: '650px' }
```

Plus `max-s` (`max-width: 649px`) and two capability variants that the reference
uses heavily instead of `hover:`:

```
@media (hover: hover) and (pointer: fine)  →  has-hover:
@media (hover: none) or (pointer: coarse)  →  has-not-hover:
```

`has-not-hover:` is how the reference gives touch devices a different scroll
container (`has-not-hover:fixed has-not-hover:inset-0 has-not-hover:overflow-y-auto`).

**One breakpoint. Not five.** Every "tablet" case is handled by the fluid rem engine.

---

## 4. Colour — measured hex, exact

| Token | Measured | Hex | Where it is used |
|---|---|---|---|
| `black` | `rgb(0 0 0)` | `#000000` | page ground, hero, most sections |
| `cream` | `rgb(236 231 224)` | `#ECE7E0` | **all** body copy and headlines |
| `gold` | `rgb(255 188 9)` | `#FFBC09` | the accent — links, active tab, arrows, button wipe, close btn |
| `brown` | `rgb(150 40 23)` | `#962817` | mid rules, footer meta text |
| `brown-dark` | `rgb(71 20 11)` | `#47140B` | **every hairline on the site**, open-accordion fill |
| `brown-darker` | `rgb(21 6 4)` | `#150604` | alternating section ground |
| `brown-deepest` | `rgb(47 14 9)` | `#2F0E09` | card / panel fill |
| `white` | — | `#FFFFFF` | primary pill fill, with black text |

Also in use: `bg-white/10` (chips), `bg-black/50` (header), `text-white/60`,
`bg-brown-darker/80` (`#150604CC`).

`body { background-color: #000; color: #ECE7E0; }`

**Rules the reference obeys, and so must we:**

- Body copy is `#ECE7E0`. Never a grey. There is no grey in this palette.
- Every 1px rule on the site is `#47140B`. No exceptions.
- Gold is for *state* — active, open, hover, focus — and for meta text. It is never
  a heading colour.

---

## 5. Type — three families, eight classes, no more

Loaded from Google Fonts:

```
Funnel Display  300..800            → display + headings
Host Grotesk    300..800 + italic   → body
Roboto Mono     100..700 + italic   → labels, data, nav, captions
```

Measured class definitions (mobile → `s:` desktop):

| Class | Family | Weight | Size | Line-height | Other |
|---|---|---|---|---|---|
| `.type-display-xl` | Funnel Display | 300 | `5.85rem` → `10rem` | `.75` | — |
| `.type-h2` | Funnel Display | 300 | `2.8rem` → `4.9rem` | `1` | — |
| `.type-h3` | Roboto Mono | 400 | `2rem` → `2.5rem` | `1` | `uppercase` |
| `.type-body-lg` | Host Grotesk | 400 | `1.8rem` → `2.4rem` | `1.2` | — |
| `.type-body-md` | Host Grotesk | 400 | `1.6rem` → `1.8rem` | `1.4` | — |
| `.type-body-sm` | Host Grotesk | 400 | `1.6rem` | `1.4` | — |
| `.type-body-xs` | Host Grotesk | 400 | `1.4rem` → `1.5rem` | `1.35` | — |
| `.type-caption` | Roboto Mono | 500 | `1.3rem` → `1.4rem` | `1.6` | used uppercase |

`body` default: Host Grotesk 400 / `1.8rem` / `1.4`, `font-optical-sizing: auto`.

**Letter-spacing is `normal` everywhere.** The reference does not track its type.
Do not add tracking "to make it look designed" — it will read as wrong immediately.

`.type-display-xl` at line-height `.75` is what makes the hero headline stack tight.
That number is doing a lot of work. Do not soften it.

### Long-form prose: the `.txt` block

```css
.txt > :not(:last-child)                { margin-bottom: 2.5rem }
.txt h2, .txt h3, .txt h4,
.txt h5, .txt h6                        { → .type-h3, Roboto Mono, uppercase }
.txt h6:not(:first-child)               { margin-top: 8rem }
.txt h6:not(:last-child)                { margin-bottom: 2rem !important }
.txt ul                                 { display: flex; flex-direction: column; list-style: none }
.txt ul:not(:first-child)               { padding-top: 1rem }
.txt ul:not(:last-child)                { padding-bottom: 2rem }
.txt ul li                              { border-top: 1px solid #47140B;
                                          padding: 1rem 0 1rem 1.5em; position: relative }
.txt ul li:last-child                   { border-bottom: 1px solid #47140B }
.txt ul li::before                      { content: ""; position: absolute; left: .5em; top: 1.1em;
                                          width: .3em; height: .3em; border-radius: 99px;
                                          background: currentColor }
.txt-media                              { margin-top: 3rem !important }
.txt-media:not(:last-child)             { margin-bottom: 3rem }
.txt-quote (as :not(:last-child))       { margin-top: 4.5rem → 10.5rem }
```

---

## 6. Layout primitives

### `.site-max` — the only container

```css
.site-max {
  width: 100%;
  max-width: 180rem;          /* 1800 design px */
  margin-inline: auto;
  padding-inline: var(--padding);
  --padding: 2rem;            /* mobile: 20 design px */
}
.site-max .site-max { padding-inline: 0 }   /* nesting is safe */

@media (min-width: 650px) {
  .site-max        { --padding: 22rem }
  .site-max.--s    { --padding: 26.5rem }
  .site-max.--m    { --padding: 20rem }
  .site-max.--l    { --padding: 15rem }
  .site-max.--full { --padding: 0rem }
}
```

Note the modifiers are **not** a width ramp, they are a padding ramp: `--s` is the
*narrowest* content column, `--full` is edge-to-edge. `--full` is what the sticky
header uses.

### `.stack` — overlay without absolute positioning

```css
.stack     { display: grid }
.stack > * { grid-area: 1 / 1 }
.stack.--c { place-items: center }
```

Used for every hero and image-with-caption overlay on the site. Prefer it over
`absolute inset-0`; it keeps the parent auto-sized to its tallest child.

### `.h-full-screen`

```css
.h-full-screen { height: 100vh; height: 100svh }
```

`svh` second so mobile browser chrome does not cause the jump.

### Easing curves in use

```
cubic-bezier(.4, 0, .6, 1)     /* the pulse keyframe */
cubic-bezier(.23, 1, .32, 1)   /* expo-out — UI state changes */
cubic-bezier(.19, 1, .22, 1)   /* expo-out, sharper — reveals, menu */
```

Only one `@keyframes` exists on the whole site: `pulse`. Everything else is GSAP
or a CSS transition.

---

## 7. Home page — section inventory, in DOM order

Measured heights are at a 1440×860 viewport. `<article>` total: **9331px**.

| # | Element | Ground | Height | What it is |
|---|---|---|---|---|
| 0 | `div.absolute.top-0.inset-x-0.h-full-screen.overflow-hidden` | — | 686 | **WebGL hero backdrop.** three.js canvas, `translate3d` parallax |
| 1 | `div` | black | 1067 | **Hero** — display headline, sub, pill CTA, stats box, partner marquee |
| 2 | `section.relative.z-2` | black | 813 | **Token** — 3D coin, h2, copy, two stat rows |
| 3 | `section.border-t.border-brown-dark.pb-65.s:pb-180.overflow-hidden` | black | 966 | **Ledger table** + copy block + pill |
| 4 | `section.border-t.border-brown-dark.bg-brown-darker` | `#150604` | 721 | **Certification** — seal image, h2, copy, pill |
| 5 | `section.relative.h-[300vh].border-t.border-brown-dark` | black | 2057 | **Pinned history scene** — photo swaps, caption card, gold progress bar |
| 6 | `section.border-t.border-brown-dark` | black | 1017 | **Governance** — 3D sigil, h2, copy, two pills, 3-up value rows |
| 7 | `section.bg-brown-darker.border-t.border-brown-dark.overflow-hidden.z-3` | `#150604` | 918 | **Dispatches** — ornamental plate, h2, copy, horizontal card carousel |
| 8 | `section.border-t.border-brown-dark` | black | 747 | **FAQ accordion** + "View All" pill |
| 9 | `section.relative.pb-20.s:pb-0` | black | 544 | **Link tiles** — 2×2 grid of WebGL-backed tiles |
| 10 | `footer.bg-black.border-t.border-brown-dark.overflow-hidden` | black | 483 | **Footer** |

Every section after the hero: `position: relative`, an explicit `z-2` (the carousel
section is `z-3`), and a `border-t border-brown-dark`. That top hairline between
every section is a signature of the design — it is never absent.

There is also a **full-height vertical hairline** running down the horizontal centre
of several sections (`border-x border-brown-dark` on an inner column), visible
behind the seal and behind the dispatches plate.

---

## 8. Components — measured behaviour

### 8.1 The pill button — the site's signature interaction

Base markup, measured and cleaned:

```html
<a class="relative inline-flex items-center justify-center h-50 px-20 rounded-full
          type-body-sm leading-none bg-white text-black overflow-hidden">
  <svg class="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
    <defs>
      <filter id="btn-filter-UNIQUE" x="-30%" y="-80%" width="200%" height="260%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4"
                      result="noise" seed="5"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0"
                           xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <rect fill="#FFBC09" x="-25%" y="-20%" width="0" height="140%"
          style="filter: url(#btn-filter-UNIQUE)"/>
  </svg>
  <span class="relative z-10 flex items-center gap-x-15">Stake <svg .../></span>
</a>
```

**The effect:** on hover or tap, GSAP wipes a gold `<rect>` across the pill while a
turbulence displacement map tears its leading edge, so the fill bleeds in like ink
rather than sliding in as a straight line. On leave it wipes back out.

**Re-measured 2026-08-23** by observing the two animated attributes directly
(`MutationObserver` on the `<rect>` and the `<feDisplacementMap>`, driven by a real
pointer). An earlier reading of this section recorded the displacement as
`0 -> 18 -> 0`; that was wrong, and the timings below replace it.

| | attribute | from | to | duration | ease | delay |
|---|---|---|---|---|---|---|
| **enter** | `rect` `width` | `0%` | `150%` | `1.0s` | `power2.out` | — |
| | `feDisplacementMap` `scale` | `150` | `40` | `1.0s` | `power2.out` | — |
| **leave** | `rect` `width` | `150%` | `0` | `1.0s` | `power2.out` | — |
| | `feDisplacementMap` `scale` | `40` | `0` | `0.5s` | `power2.out` | `0.5s` |

Three things fall out of that table and all three are load-bearing:

- **Both directions ease *out*.** The leave is not the enter reversed (that would be
  `power2.in`); it is its own tween with the same curve. Reversing the timeline is
  the obvious implementation and it is visibly wrong — the wipe crawls away.
- **Displacement starts enormous.** At `scale: 150` the rect is barely 3% wide and is
  shredded into scattered specks; the tear calms to `40` as the edge sweeps past. A
  displacement that starts small produces a clean edge, which is the whole effect
  missing.
- **Displacement holds at `40` while filled, and only relaxes to `0` half a second
  into the leave.** At rest the torn edge is outside the pill (`width: 150%`) and
  `overflow-hidden` clips it, so the residual displacement costs nothing visually.

`bg-white` on the reference resolves to `rgb(236 231 224)` — **cream, not `#FFFFFF`**.
The reference redefines Tailwind's `white`. There is no true white anywhere on the
site, so `bg-white`, `text-white` and `bg-white/10` in this document all mean cream.
Our build paints those surfaces with the `cream` token and keeps `white` at `#FFFFFF`
as an unused reserve rather than redefining a token to be a lie.

Notes that matter:

- `h-50` = 50 design px tall, `px-20`, fully `rounded-full`.
- The filter `id` **must be unique per instance**, or every pill on the page shares
  one displacement map and they visibly sync.
- `overflow-hidden` on the anchor is what clips the oversized rect.
- Label sits in `relative z-10` above the SVG.
- Trailing glyph is an outlined SVG icon at `min-w-20 h-32`, `stroke-current`.

Variants seen: white fill / black text (primary), transparent with
`border border-brown-dark` (secondary), and `bg-gold text-black` (menu close).

### 8.2 Sticky header

```html
<header class="fixed top-0 inset-x-0 z-99 [is-hidden when scrolled down]">
  <div class="relative bg-black/50 border-b border-brown-dark backdrop-blur-sm">
    <div class="site-max --full">
      <nav class="relative flex items-center justify-between h-70 s:h-80 s:px-20">
```

- `h-70` mobile / `h-80` desktop.
- Translucent black + `backdrop-blur-sm` + bottom hairline. Never solid.
- An `is-hidden` class is toggled on scroll-down and removed on scroll-up
  (a ScrollTrigger direction watcher). It translates the header out of view.
- **The wordmark is a CSS `mask-image` fed an inline SVG data-URI of outlined glyph
  paths** — not live text, not an `<img>`. The `<button>` carries `aria-label`.
  Take note: this is already a find-in-page-proof technique, shipped by a real
  agency, for ordinary art-direction reasons.
- Desktop nav links: Roboto Mono 500, `1.4rem`, uppercase, `#ECE7E0`,
  `has-hover:hover:text-gold`, active route gets `text-gold`.
- Right side: primary pill plus a circular hamburger button.

**Measured 2026-08-23.** The header carries its own transition, and the hide is a
class toggle rather than a tween:

```css
.sh          { transition: transform .75s cubic-bezier(.19, 1, .22, 1) }
.sh.is-hidden { transform: translate3d(0, -100%, 0) }
```

`.75s` on `expo2`, transform only. (We cannot use the class name `is-hidden` — it
trips the naming ban. Ours is `is-away`; the mechanism is identical.)

### 8.2a The underline — `.uline`

Every nav link and most inline links carry it. It wipes in from the left on hover
and out to the right on leave, which is why the two `transform-origin` values differ:

```css
.uline         { display: inline-flex; position: relative; white-space: nowrap;
                 --bottom: .05em }
.uline::before { content: ""; position: absolute; left: 0; right: 0;
                 bottom: var(--bottom);
                 height: .035em; min-height: 1px;
                 background-color: currentColor;
                 transform: scaleX(0); transform-origin: right;
                 transition: transform .75s cubic-bezier(.19, 1, .22, 1) }
.uline:hover::before,
.uline.router-link-exact-active::before { transform: scaleX(1);
                                          transform-origin: left }
.uline-double  { --bottom: .15em }   /* ::before and ::after, height .025em */
```

Note `height: .035em` with a `1px` floor: the rule scales with the type until it
would fall below a device pixel, then stops. `min-height` is doing real work here.

### 8.2b The hamburger — `.lines`

Three rules that morph into an X. Same `.75s` / `expo2` as everything else in the
header:

```css
.lines__line                          { transition: transform .75s cubic-bezier(.19,1,.22,1) }
.lines__line:first-child              { transform: translateY(-.6rem) rotate(0) }
.lines__line:nth-child(2)             { transform: scaleX(1); transform-origin: left }
.lines__line:nth-child(3)             { transform: translateY(.6rem) rotate(0) }
.is-active .lines__line:first-child   { transform: translateY(0) rotate(45deg) }
.is-active .lines__line:nth-child(2)  { transform: scaleX(0) }
.is-active .lines__line:nth-child(3)  { transform: translateY(0) rotate(-45deg) }
```

The middle rule collapses on `scaleX` from its left origin rather than fading — it
retracts into the corner of the X instead of dissolving under it.

### 8.3 Menu overlay

Full-screen black. Circular **gold** close button top-right. Contents top to bottom:
primary pill, nav rows (Roboto Mono uppercase, separated by `brown-dark` hairlines),
a large gap, the stats box, then a row of social icons in bordered square tiles.

### 8.4 Stats box

```html
<ul class="relative w-full divide-y divide-brown-dark border border-brown-dark
           rounded-[.5rem] s:min-w-[27.5rem]">
```

Desktop: `s:absolute s:bottom-110 s:right-20` inside the hero, `bg-black`, `z-3`.
Mobile: static, `mx-20 mb-20`. Values count up on enter.

Measured row, exactly:

```html
<li class="px-15 flex items-center gap-x-10 py-12 type-caption uppercase">
  <span>Total Earnings</span><span>$49,566</span>
</li>
```

**The row is `gap-x-10`, not `justify-between`.** Label and value sit adjacent and
left-aligned, and the box is sized by its widest row. Pushing the value to the right
edge is the intuitive reading and it is wrong — it turns a stamped plate into a
dashboard.

### 8.5 Data table (the ledger)

- Horizontally scrollable on mobile, with a visible scrollbar track.
- Header row: Roboto Mono uppercase, cells boxed with `border-brown-dark`.
- Body rows: two overlapping circular chips
  (`size-20 s:size-28 rounded-full bg-white/10 ring-2 ring-black object-contain`,
  the second one `-ml-10`), then a name, then muted columns, then a value.
- Row hover: `has-hover:hover:bg-brown-darker`.

### 8.6 Accordion (FAQ)

- Rows divided by `brown-dark` hairlines. No card, no radius.
- Closed: question in `#ECE7E0`, a gold `↓` arrow, right-aligned.
- Open: question turns **gold**, arrow becomes `↑`, and the answer appears in a
  filled `bg-brown-dark` panel with `#ECE7E0` copy and generous padding.
- Height animates, the arrow rotates, expo-out easing.

### 8.7 Tabbed feature panel

A framed media panel (`border-brown-dark`) above a **two-cell tab bar**. Active tab
is `bg-gold text-black`, inactive is transparent with cream text; both Roboto Mono
uppercase. The copy below the bar swaps with the tab.

### 8.8 Card carousel

Horizontally scrolling row of tall cards. Each has a photographic header with an
overlaid wordmark, a light pill showing an index label plus a round play button,
then a date (gold Roboto Mono) and a title (`type-h2`) below.

### 8.9 Footer

Measured shell and brand column:

```html
<footer class="relative bg-black text-white border-t border-brown-dark overflow-hidden z-2">
  <div class="site-max --l">
    <div class="py-65 s:py-100 flex flex-col s:flex-row s:items-start s:gap-x-100">
      <div class="flex flex-col items-start w-full max-w-[37.5rem] shrink-0">
        [wordmark]
        <p class="type-body-sm mt-20 mb-25">…</p>
        [primary pill]
        <div class="flex items-center gap-x-30 mt-30 s:mt-50">[socials]</div>
```

Note it is `site-max --l`, not the default padding, and the description is
`type-body-sm` — the phase list below says `type-body-md`; the measurement wins.

Wordmark → description (`type-body-md`) → primary pill → row of social glyphs →
hairline → a `MENU` accordion labelled in gold with a `↓` → hairline →
copyright, legal links and credit line, all Roboto Mono uppercase in `#962817`.

### 8.10 Link tiles

2×2 grid (1×4 stack on mobile) of tiles, each with its own low-luminance looping
backdrop, a Roboto Mono uppercase centred label, separated by `brown-dark` hairlines.

---

## 9. The WebGL layer

Three scenes, all three.js r180, all mounted via `data-js` hooks into `<canvas>`
elements sized by CSS (`style="width:Xpx;height:Ypx"`) over a DPR-scaled backing
store.

1. **Hero backdrop** — a dark, slow, flowing filament and particle field in red, gold
   and magenta on pure black. Reads as ink or embers in water. Occupies
   `h-full-screen` and is parallaxed with `transform: translate3d(0, Ypx, 0)` on scroll.
2. **The coin** — a 3D minted disc with engraved ring lettering repeated around the
   rim, a botanical relief in the field and the house mark centred. Metallic gradient
   (gold → magenta → red) with an environment map. Rotates on scroll.
3. **The sigil** — the house mark extruded in 3D with the same material, rotating on
   scroll.

The bundle contains three.js's PMREM `SphericalGaussianBlur` shader, i.e. a real
`PMREMGenerator` environment map is in use. That is where the metal look comes from.

There is also a `<video id="test-video" class="fixed invisible">` holding a tiny
base64 MP4. This is a **codec capability probe**, run at boot to decide whether to
serve video or a fallback. Worth replicating.

---

## 10. Routes

| Route | Content |
|---|---|
| `/` | the long scroll home page above |
| `/media` | ornamental plate, display title, filter dropdown, grid of cards |
| `/faq` | short WebGL hero band + display title, category `<select>` in a bordered brown box, accordion grouped under Roboto Mono uppercase category labels |
| `/brand` | WebGL hero band + display title, download cards on `brown-deepest`, logo lockup displays |
| `/privacy`, `/terms` | `.txt` long-form legal |

Page hero bands on secondary routes are short (about `40vh`), carry the WebGL
backdrop, are divided by **four vertical hairlines** into columns, and centre a
`.type-display-xl` title.

---

## 11. How to re-measure

Open the reference in the browser pane, then:

```js
// root scale + spacing proof
getComputedStyle(document.documentElement).fontSize

// every compiled custom colour
[...document.querySelectorAll('style')].map(s => s.textContent).join('')
  .match(/\.(text|bg|border|divide)-[a-z-]+\{[^}]*rgb\([^}]*\}/g)

// the type ramp
[...document.querySelectorAll('style')].map(s => s.textContent).join('')
  .match(/\.type-[a-z0-9-]+(?:,[^{]+)?\{[^}]*\}/g)

// section inventory
[...document.querySelector('article').children].map((el, i) =>
  [i, el.tagName, el.className, Math.round(el.getBoundingClientRect().height)])
```
