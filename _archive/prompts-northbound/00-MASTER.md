# MASTER BRIEF — "NORTHBOUND" / Symposium Round 1

> **Read this file first, in full, before executing any phase file.**
> Everything in `prompts/` is written to be pasted into Claude Code, in order.

---

## 1. What we are building

A **public marketing website for a fictional high-altitude expedition outfitter called NORTHBOUND**.

It must read as a real, well-funded brand site — cinematic, editorial, scroll-driven. A visitor who lands on it with no context should conclude: *"this is a nice website for an adventure travel company."* Nothing more.

Hidden inside it, in plain sight, are **six technical terms**. Competition participants are given the URL and must visually hunt them down.

The website is the puzzle. The website must never *look* like a puzzle.

---

## 2. The event context

- Symposium technical event, **Round 1**.
- Participants receive only the deployed Vercel URL.
- They hunt for the hidden terms **visually**, by browsing and looking.
- The six terms together describe a document-QA / RAG application stack — that is the intended "aha", and likely the brief for Round 2.

### The six terms

| # | Term       |
|---|------------|
| 1 | search     |
| 2 | OCR        |
| 3 | ReactJS    |
| 4 | Express    |
| 5 | Pinecone   |
| 6 | RAG        |

> ⚠️ **Discrepancy flagged:** the brief says "5 technical terms" but lists **6**. This system is built for all **6**. To drop one, delete its row from `03-clue-architecture.md` and its section from `05-build-page.md` — everything else still works.

---

## 3. Why an expedition outfitter?

The cover story was chosen because **all six terms hide inside its native vocabulary without a single forced word**:

| Term     | Native disguise      | Reads as |
|----------|----------------------|----------|
| search   | **Search** & Rescue  | standard mountain-safety language |
| Pinecone | **Pinecone** Pass    | an ordinary trail name |
| Express  | Alpine **Express**   | a shuttle service |
| RAG      | **Rag**ged Ridge     | an ordinary summit name |
| OCR      | **OCR** VERIFIED     | a permit-processing stamp |
| ReactJS  | **ReactJS** Engineer | a job listing on the careers page |

Not one of these is a wink at the participant. Each is copy a real outfitter would write. That is the entire design goal.

**Swapping the theme:** the cover story is isolated to `02-design-system.md` (identity) and `03-clue-architecture.md` (placements). If you want a coffee roastery or a design studio instead, rewrite only those two files. Do not scatter brand decisions anywhere else.

---

## 4. The ten non-negotiable rules

Every phase must obey these. Re-read them before each phase.

1. **Visual only.** Every clue must be readable by a human looking at the rendered page. No `view-source` clues, no HTML comments, no `console.log`, no `data-` attributes, no alt-text-only, no `opacity: 0`, no white-on-white, no zero-height text. If a sighted user browsing normally cannot see it, it is not a clue.

2. **Ctrl+F must fail.** A participant who presses Ctrl+F and types `RAG` must find nothing. This is the single most important technical requirement — see `03-clue-architecture.md` for the three sanctioned techniques. A clue sitting in plain DOM text is a broken clue.

3. **No puzzle tells.** No "find the clues" copy, no counters, no highlight colours, no confetti, no easter-egg styling. A clue must be typographically **identical** to the text around it. If you can spot the clue by squinting at the layout rather than reading it, it is placed wrong.

4. **Mobile-reachable.** Every clue must be findable on a 375px phone. **No hover-only reveals** — hover does not exist on touch. Anything gated behind interaction must be gated behind a *tap*.

5. **Stable once revealed.** Never tie a clue's visibility to a precise scroll-scrub position. A clue that only exists between 41% and 46% of a pinned timeline is unfair and will be missed. Reveal on enter, then stay.

6. **No source leaks.** Deploy from a **private** repo. Production source maps **off**. No file, component, variable, CSS class, or image filename may contain any of the six terms or the word `clue`, `hidden`, `puzzle`, `hunt`, `easter`. Naming convention is in `01-foundation.md`.

7. **Decoys are mandatory.** Plausible-but-wrong technical-sounding words must be seeded through the copy, or the hunt collapses into a five-minute skim. Spec in `03-clue-architecture.md`.

8. **The site must actually work.** Real nav, real footer, real links, real responsive behaviour, no dead `href="#"`, no lorem ipsum. Broken scaffolding is the fastest way for a participant to guess the site is fake and start inspecting rather than reading.

9. **Performance is fairness.** Symposium wifi is bad and half the participants are on mid-range Android. Budget: **< 2.5 MB** total transfer, **LCP < 2.5s** on 4G. A janky site costs teams clues they earned.

10. **Cinematic, but not at the cost of legibility.** Heavy pinned-scroll is for hero and one feature moment only. Every clue-bearing section must be a calm, readable, stable block. Motion serves the disguise; it must never bury the evidence.

---

## 5. Stack

| Layer | Choice | Why |
|---|---|---|
| Build | Vite + React 19 + TypeScript | fastest path, trivial Vercel deploy |
| Routing | React Router v7 | need `/careers`, `/routes/:slug`, ops page |
| Styling | Tailwind v4 | via `@tailwindcss/vite` |
| Smooth scroll | Lenis | the "expensive feel" |
| Scroll animation | GSAP + ScrollTrigger | pinning + scrub |
| Text splitting | custom `<Split/>` util | doubles as Ctrl+F defence |
| Components | **21st.dev** | nav, footer, accordion, carousel, marquee |
| Host | Vercel | as specified |

---

## 6. Phase index

Run these in order. Do not skip ahead — later phases assume earlier artefacts exist.

| Phase | File | Produces |
|---|---|---|
| 0 | `00-MASTER.md` | this brief |
| 1 | `01-foundation.md` | scaffolded repo, `CLAUDE.md`, safety config |
| 2 | `02-design-system.md` | brand, tokens, motion system, 21st harvest |
| 3 | `03-clue-architecture.md` | **exact clue spec + camouflage + decoys** |
| 4 | `04-assets.md` | imagery, incl. the 3 clue-bearing graphics |
| 5 | `05-build-page.md` | the main scroll page, section by section |
| 6 | `06-secondary-pages.md` | careers, route detail, unlisted answer key |
| 7 | `07-qa-and-audit.md` | responsive / a11y / perf / **clue audit** |
| 8 | `08-deploy-and-ops.md` | Vercel deploy + event-day runbook |

---

## 7. How to run this

Open Claude Code in `D:\codebreak`, then for each phase:

```
Read prompts/00-MASTER.md and prompts/01-foundation.md, then execute Phase 1 task by task. Stop after each task and show me what changed.
```

Then repeat with `02-`, `03-`, and so on.

**Do not paste all nine files at once.** One phase per session keeps Claude's attention on the current tasks and keeps the diffs reviewable. Phase 5 in particular should be run one *task* at a time — one section per prompt is the difference between a designed page and a generic one.

---

## 8. Private artefacts

`_private/CLUE-KEY.md` holds the answer key for organizers and judges. It is git-ignored and must **never** be imported by application code or deployed.
