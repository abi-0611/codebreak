# PHASE 1 — Foundation

**Read first:** `REFERENCE-TEARDOWN.md`, `00-MASTER.md`.
**Invoke:** `full-output-enforcement` — scaffolds are exactly the kind of output that
gets silently truncated, and a half-written Tailwind config wastes the next hour.

**Outcome of this phase:** an empty Nuxt 3 site that already scales like the
reference, already has the safety rails, and renders nothing but a blank black page
at the correct root font size.

---

## Task 1.0 — Clear the ground

The previous React build is archived at `_archive/`. Delete the old application
surface and start clean:

```
rm -rf src index.html vite.config.ts tsconfig.*.json .oxlintrc.json dist
```

Keep: `CLAUDE.md`, `prompts/`, `_private/`, `_archive/`, `.gitignore`, `README.md`,
and `scripts/` (the generator scripts get rewritten in phase 5, but their shape is
worth keeping as reference).

## Task 1.1 — Scaffold

```bash
npx nuxi@latest init . --force --package-manager npm --no-git-init
```

Then:

```bash
npm i -D tailwindcss@3 postcss autoprefixer @nuxtjs/tailwindcss
npm i gsap lenis three
npm i -D sharp opentype.js
```

`nuxt.config.ts`:

- `ssr: true`, and the build target is **static** (`nuxi generate`).
- `sourcemap: { client: false, server: false }` — rule 6.
- `modules: ['@nuxtjs/tailwindcss']`
- `app.head.link` → the Google Fonts stylesheet from the teardown §5, with
  `rel="preconnect"` to `fonts.googleapis.com` and `fonts.gstatic.com`.
- `app.head.htmlAttrs.lang = 'en'`
- No analytics module. No devtools in production.

Delete `app.vue`'s boilerplate; replace with the shell from Task 1.4.

## Task 1.2 — The fluid rem engine

This is the highest-leverage 20 lines in the project. Copy it from
`REFERENCE-TEARDOWN.md` §2 **exactly**, into `app/assets/css/main.css`:

```css
:root {
  --size: 375;
  --clamp: 15px;
  --global-font-size: clamp(5px, calc((100vw / var(--size)) * 10), var(--clamp));
}
@media (min-width: 650px) { :root { --size: 1800; } }

html {
  font-size: var(--global-font-size);
  font-variant-ligatures: common-ligatures;
  -webkit-text-size-adjust: none;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
body {
  background-color: #000;
  color: #ECE7E0;
  font-family: 'Host Grotesk', sans-serif;
  font-optical-sizing: auto;
  font-size: 1.8rem;
  font-weight: 400;
  line-height: 1.4;
  margin: 0;
}
html.lenis, html.lenis body { height: auto; }
```

**Verify before moving on.** Open the page, set the viewport to 1440px, and run:

```js
getComputedStyle(document.documentElement).fontSize
```

It must return exactly `"8px"`. If it returns anything else, the engine is wrong and
every spacing value you write afterwards will be wrong with it. Do not proceed on a
near-miss.

## Task 1.3 — Tailwind config

`tailwind.config.ts`. The spacing remap is the part that makes utility numbers equal
design pixels — see teardown §2.

```ts
export default {
  content: ['./app/**/*.{vue,ts}', './app/content/**/*.ts'],
  theme: {
    screens: { s: '650px' },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#FFFFFF',
      cream: '#ECE7E0',
      gold: '#FFBC09',
      brown: {
        DEFAULT: '#962817',
        dark:    '#47140B',
        darker:  '#150604',
        deepest: '#2F0E09',
      },
    },
    spacing: Object.fromEntries(
      Array.from({ length: 401 }, (_, n) => [n, `${n / 10}rem`])
    ),
    extend: {
      borderRadius: { DEFAULT: '.5rem' },
      zIndex: { 1: '1', 2: '2', 3: '3', 99: '99' },
      transitionTimingFunction: {
        expo:  'cubic-bezier(.23, 1, .32, 1)',
        expo2: 'cubic-bezier(.19, 1, .22, 1)',
      },
    },
  },
  plugins: [/* the has-hover plugin, below */],
}
```

Add a tiny plugin for the capability variants from teardown §3 — the reference leans
on these instead of `hover:`, and rule 4 depends on them:

```ts
plugin(({ addVariant }) => {
  addVariant('has-hover',     '@media (hover: hover) and (pointer: fine)')
  addVariant('has-not-hover', '@media (hover: none) or (pointer: coarse)')
  addVariant('max-s',         '@media (max-width: 649px)')
})
```

**Sanity check:** `.p-20` must compile to `padding: 2rem`. Confirm in the built CSS.

## Task 1.4 — App shell

`app.vue` reproduces the reference's outer structure (teardown §7 row 0 and the
`header` markup in §8.2):

```
<div id="__nuxt">
  <div class="has-not-hover:fixed has-not-hover:inset-0 has-not-hover:overflow-y-auto">
    <SiteHeader />          <!-- fixed, z-99 -->
    <NuxtPage />            <!-- renders <article> -->
    <SiteMenu />            <!-- full-screen overlay, closed -->
  </div>
</div>
```

Header, menu and footer are stubs for now — phase 2 builds them properly. What
matters here is that the touch scroll container and the `z` order exist from the
start, because retrofitting them later breaks the pinned scene.

Also add the **codec probe** from teardown §9: a `<video id="probe" class="fixed invisible">`
carrying a tiny inline base64 MP4, checked once at boot, result kept in a composable.
Phase 5 uses it to decide video vs. static frame.

## Task 1.5 — Naming safety

Create `scripts/audit-names.mjs`. It walks `app/`, `public/`, `app/content/` and, when
present, `.output/public/`, and fails the build on any **file name, directory name, or
file content** match of:

```
search  ocr  react-js  reactjs  express  pinecone  rag
clue  hidden  puzzle  hunt  easter  secret  answer
```

Case-insensitive, substring match.

**Exclusions that must be hardcoded, or the audit is unusable:**

- `prompts/`, `_private/`, `_archive/`, `node_modules/`, `.git/` — not shipped.
- The literal token `react` on its own is fine and unavoidable in a Vue project's
  lockfile; the banned form is the branded `ReactJS`.

### Substring traps

The ban is a **substring** ban, so ordinary English trips it. Do not use these as
identifiers:

| Avoid | Contains | Use instead |
|---|---|---|
| `paragraph` | rag | `copy`, `body`, `line` |
| `storage`, `localStorage` wrapper names | rag | `store`, `vault`, `keep` |
| `drag`, `draggable`, `onDrag` | rag | `pull`, `move`, `pointerMove` |
| `average` | rag | `mean` |
| `expression` | express | `formula`, `rule` |
| `searchParams`, `useSearchParams` | search | `useQuery` alias, destructure at the boundary |
| `Fragment` | rag | the `<>` shorthand / `<template>` |

Note that a horizontally-scrolling carousel is the classic place `drag` sneaks in.
Name it `pull` from the first commit.

Wire it up:

```json
"audit:names": "node scripts/audit-names.mjs",
"verify": "npm run audit:names && npm run audit:contrast && npm run generate"
```

## Task 1.6 — Contrast audit

`scripts/contrast.mjs` recomputes WCAG AA for every shipped pairing in the palette
and exits non-zero on a failure. The reference's own palette is mostly safe because
body copy is always `#ECE7E0` on near-black — but check and record:

- `#ECE7E0` on `#000000`, on `#150604`, on `#2F0E09`, on `#47140B`
- `#FFBC09` on `#000000` and on `#150604`
- `#962817` on `#000000` — **this one is the risk.** The reference sets its footer
  meta copy in `#962817` on black, which measures roughly 3.0:1 and fails AA for
  body text.

**Deviation, recorded deliberately:** we keep `#962817` for *decorative rules and
hairlines* exactly as measured, but any `#962817` used as **running text** is lifted
to the nearest tone that clears 4.5:1 on black. Record the substituted value in
`app/assets/css/main.css` with a comment, and note the deviation in
`08-qa-and-audit.md`'s sign-off. This is the one place we knowingly diverge from the
reference, and the reason is rule 9's sibling: a clue nobody can read is a clue that
does not exist.

## Task 1.7 — Rewrite `CLAUDE.md`

The project constitution at the repo root still describes the archived React build.
Rewrite it against this phase system. It must state, at minimum: the ten rules, the
naming ban and its substring traps, the brand block, a pointer to
`REFERENCE-TEARDOWN.md` as the source of truth for every token, and the code
conventions in `02-design-system.md` §9.

---

## Exit criteria

- [ ] `getComputedStyle(document.documentElement).fontSize` is `"8px"` at 1440px and
      scales linearly below 650px.
- [ ] `.p-20` compiles to `padding: 2rem`.
- [ ] The three font families load and render.
- [ ] `npm run audit:names` runs clean on the empty scaffold.
- [ ] `npm run audit:contrast` runs and reports the `#962817` finding.
- [ ] `nuxi generate` produces `.output/public/` with **no** `.map` files.
- [ ] `CLAUDE.md` describes this build, not the archived one.
