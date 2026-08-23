# PHASE 1 — Foundation

**Goal:** a running, correctly-configured, leak-proof project skeleton.
**Prereq:** `00-MASTER.md` read. Node 22+, npm 11+.
**Done when:** `npm run dev` serves a styled placeholder page, `npm run build` emits **no** source maps, and `CLAUDE.md` exists.

---

## Task 1.1 — Preflight

```
Verify my toolchain before we scaffold:
1. Print node and npm versions (need node >= 22).
2. Run `npx --yes @21st-dev/cli@latest whoami`. If it reports I am not signed in,
   STOP and tell me to run `npx @21st-dev/cli login` in my own terminal — it opens a
   browser and you cannot complete OAuth for me.
3. Run `npx --yes @21st-dev/cli@latest usage` and tell me my remaining quota, so we
   know how many 21st generations we can afford in Phase 2.
Report all three results and wait for my go-ahead.
```

> **Note on the 21st MCP:** the MCP server (`plugin:21st:21st`) needs a one-time browser authorization. If MCP tools are unavailable, the `21st` **CLI** used above is a complete substitute — every phase here is written against the CLI for that reason.

---

## Task 1.2 — Scaffold

```
In D:\codebreak, scaffold the project. Do not create a subfolder — the repo root is the app.

- Vite + React + TypeScript
- Tailwind v4 via @tailwindcss/vite (NOT the postcss route)
- Dependencies: react-router-dom, lenis, gsap, clsx
- Dev dependencies: @types/node

Then:
- Set up the `@/` path alias to `./src` in both vite.config.ts and tsconfig.json
- Replace the boilerplate App with a single centred word "NORTHBOUND" in a serif face
- Delete every unused Vite boilerplate asset (react.svg, App.css, the default index.css content)
- Run the dev server and confirm it renders

Show me the final vite.config.ts and package.json.
```

---

## Task 1.3 — Leak-proofing (do not skip)

This is the phase where the competition is won or lost. A participant who finds the GitHub repo or a source map has the full answer key in thirty seconds.

```
Harden the project against source disclosure:

1. In vite.config.ts set `build: { sourcemap: false }`. Confirm by running a build and
   verifying no .map files exist in dist/.

2. Create .gitignore including: node_modules, dist, .env*, .vercel, and `_private/`.

3. Create `_private/README.md` stating that this folder is organizer-only, git-ignored,
   and must never be imported by application code.

4. Add a naming-convention block to CLAUDE.md (next task) and enforce it from now on:
   NO file, folder, component, variable, type, CSS class, test id, route, or image
   filename may contain any of these strings, in any casing:
     search, ocr, react-js, reactjs, express, pinecone, rag,
     clue, hidden, puzzle, hunt, easter, secret, answer
   ("react" alone is unavoidable in a React project — that is fine and expected.
    The forbidden token is the *branded* form "ReactJS".)

5. Clue-bearing images get neutral, non-descriptive filenames — `permit-01.webp`,
   not `ocr-stamp.webp`. A participant CAN see filenames in the network tab.

Confirm each of the five items.
```

---

## Task 1.4 — Architecture

```
Create this structure with empty placeholder files:

src/
  main.tsx
  App.tsx                    # router
  routes/
    Home.tsx
    Careers.tsx
    RouteDetail.tsx          # /routes/:slug
    Ops.tsx                  # unlisted organizer page
    NotFound.tsx
  sections/                  # one file per scroll section of Home
  components/
    layout/                  # Nav, Footer, SmoothScroll, ScrollProgress, AccessPill
    ui/                      # primitives + anything pulled from 21st
  lib/
    motion.ts                # GSAP + ScrollTrigger registration and shared config
    split.tsx                # the <Split/> text component
    cn.ts                    # clsx helper
  content/
    site.ts                  # ALL copy lives here as typed data
  styles/
    globals.css

Rules:
- Every string shown to a user lives in src/content/site.ts. No copy inline in JSX.
  This is what lets us audit and re-tune the clues in one file in Phase 7.
- Sections are dumb presentational components that receive content as props.

Wire up the router with all five routes and confirm each renders its placeholder.
```

---

## Task 1.5 — CLAUDE.md

```
Create CLAUDE.md at the repo root. This is the project constitution — you will read it
on every future session. Include:

## Project
Marketing site for NORTHBOUND, a fictional high-altitude expedition outfitter.
It is the Round 1 asset for a symposium technical event: six technical terms are
concealed in the copy and imagery for participants to find visually.

## The ten rules
(copy section 4 of prompts/00-MASTER.md verbatim)

## Naming ban
(copy the forbidden-token list from Task 1.3)

## Code conventions
- All user-visible copy lives in src/content/site.ts, never inline in JSX.
- Sections are presentational; content arrives via props.
- Every GSAP ScrollTrigger must be created inside a gsap.context() and reverted on unmount.
- Never mix Framer Motion and ScrollTrigger on the same CSS property.
- Respect prefers-reduced-motion: swap scrub animations for simple opacity fades.
- Tailwind v4: design tokens are CSS custom properties in styles/globals.css,
  consumed via arbitrary values. No tailwind.config.js theme bloat.

## Do not
- Do not add analytics, cookie banners, or third-party scripts.
- Do not add a real search feature to the site. (An input labelled "search" would be a
  false positive that wastes participants' time and undermines the actual clue.)
- Do not "helpfully" make any clue more discoverable. Placement is specified in
  prompts/03-clue-architecture.md and is deliberate.
```

---

## Phase 1 exit check

```
Verify and report:
- npm run dev serves the placeholder
- npm run build succeeds and dist/ contains zero .map files
- All five routes resolve
- CLAUDE.md, .gitignore, _private/ exist
- grep the whole src/ tree for the forbidden tokens and confirm zero hits
```
