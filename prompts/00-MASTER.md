# MASTER BRIEF — "CROCARIA" / Symposium Round 1

> **Read this file and `REFERENCE-TEARDOWN.md` in full before executing any phase.**
> Everything in `prompts/` is written to be pasted into Claude Code, in order.

---

## 1. What we are building

A **public marketing website for a fictional heritage saffron house called CROCARIA**,
built as a **fidelity replication of the design at
`https://saffron-griflan.netlify.app/`**.

Every layout, colour, type size, spacing value, component, interaction, scroll
behaviour and WebGL scene in the reference is reproduced. What changes is the
identity: the name, the wordmark, the copy, the imagery, the outbound links.

Hidden inside it, in plain sight, are **six technical terms**. Competition
participants are given the URL and must visually hunt them down.

The website is the puzzle. The website must never *look* like a puzzle.

### Why the identity changes and the design does not

The reference is the live marketing site of a real DeFi protocol. Shipping a public
page carrying that name, that wordmark, its investors' and auditors' logos, and links
to its real application would impersonate a real financial company — which is also
the exact shape of a phishing site, and would leave participants believing your event
site is a real financial product.

So: **the design is replicated exactly; the identity is ours.** Nothing visual is
lost. Section for section, component for component, curve for curve, the two sites
are the same object. Only the words and the logo differ.

### Why a saffron house, specifically

The reference's entire art direction *is* the saffron crocus — botanical engravings,
heraldic seals, crocus macro photography in the pinned scene, an oxblood-and-gold
palette, a token literally named "Spice". A heritage saffron house maps onto every
single section with nothing invented and nothing dropped:

| Reference section | Ours |
|---|---|
| WebGL hero — filaments in fluid | identical; the filaments read as saffron threads |
| "Grow Your Yield" + stats + investors | "The Red Harvest" + stats + estate partners |
| Uniswap Vaults tabbed panel | Grading tabs — WHOLE / POWDER |
| $SFI token, 3D coin | The House Medallion, 3D minted disc |
| Vault ledger table | The Lot Ledger |
| Audits seal + $4M security | Assay & Certification seal |
| 300vh pinned crocus history | The Season — the harvest, pinned |
| Governance + 3D sigil | Held by the Guild + 3D house mark |
| Saffron Media carousel | Crocaria Dispatches |
| FAQ accordion | identical |
| Link tiles, footer | identical |

---

## 2. The event context

- Symposium technical event, **Round 1**.
- Participants receive only the deployed URL.
- They hunt the terms **visually**, by browsing and looking.
- The six terms together describe a document-QA / retrieval application stack —
  that is the intended "aha", and likely the brief for Round 2.

### The six terms

| # | Term |
|---|---|
| 1 | search |
| 2 | OCR |
| 3 | ReactJS |
| 4 | Express |
| 5 | Pinecone |
| 6 | RAG |

Exact placements and camouflage are specified in `04-clue-architecture.md`.
The organiser answer key is generated into `_private/` and never ships.

---

## 3. Brand

```
NAME       CROCARIA
FOUNDED    est. 1904, Consuegra
WHAT       A heritage saffron house. Cultivation, grading, assay, provenance
           and bonded storage. Sells lots, not sachets.
VOICE      Understated, technical, a little severe. Short declaratives.
           Trade language, not marketing language. Numbers over adjectives.
           A house that has been doing this for 120 years and does not need
           to convince you.
TAGLINE    "Grown, graded, sealed."
HERO       h1 "The Red Harvest"  /  sub "Provenance for every thread."
CTA        "Open Ledger"   (a persistent pill, mirroring the reference's
                            "Launch App" — this is a register, not a checkout)
```

**Anti-brief.** If the output drifts here it is wrong: no purple/blue SaaS gradients,
no rounded-2xl three-column feature cards, no emoji, no stock-photo smiling teams,
no "Trusted by 10,000+", no chatbot bubble, no cookie banner, no crypto vocabulary.

**Every design token, type size, spacing value and component spec lives in
`REFERENCE-TEARDOWN.md`.** It is measured, not invented. Do not restate values here
and do not let a phase file override it.

---

## 4. The ten non-negotiable rules

Every phase must obey these. Re-read them before each phase.

1. **Visual only.** Every clue must be readable by a human looking at the rendered
   page. No `view-source` clues, no HTML comments, no `console.log`, no `data-`
   attributes, no alt-text-only, no `opacity: 0`, no white-on-white, no zero-height
   text. If a sighted user browsing normally cannot see it, it is not a clue.

2. **Find-in-page must fail.** A participant who presses Ctrl+F and types `RAG` must
   find nothing. This is the single most important technical requirement — see
   `04-clue-architecture.md` for the three sanctioned techniques. A clue sitting in
   plain DOM text is a broken clue.

3. **No puzzle tells.** No "find the clues" copy, no counters, no highlight colours,
   no confetti, no easter-egg styling. A clue must be typographically **identical**
   to the material around it. If you can spot the clue by squinting at the layout
   rather than reading it, it is placed wrong.

4. **Mobile-reachable.** Every clue must be findable on a 375px phone. **No
   hover-only reveals** — hover does not exist on touch. Anything gated behind
   interaction must be gated behind a *tap*. The reference's own
   `has-hover:` / `has-not-hover:` variants are how you enforce this.

5. **Stable once revealed.** Never tie a clue's visibility to a precise scroll-scrub
   position. A clue that only exists between 41% and 46% of the pinned timeline is
   unfair and will be missed. Reveal on enter, then stay.

6. **No source leaks.** Deploy from a **private** repo. Production source maps
   **off**. No file, component, variable, CSS class, test id, route or image filename
   may contain any of the six terms or the words `clue`, `hidden`, `puzzle`, `hunt`,
   `easter`, `secret`, `answer`. Naming convention is in `01-foundation.md`.

7. **Decoys are mandatory.** Plausible-but-wrong technical-sounding words must be
   seeded through the copy, *and at least three of them must be baked into artwork*,
   or "it's in an image, therefore it's a clue" becomes the whole solve. Spec in
   `04-clue-architecture.md`.

8. **The site must actually work.** Real nav, real footer, real links, real
   responsive behaviour, no dead `href="#"`, no lorem ipsum. Broken scaffolding is
   the fastest way for a participant to guess the site is fake and start inspecting
   rather than reading.

9. **Performance is fairness.** Symposium wifi is bad and half the participants are
   on mid-range Android. Budget: **< 2.5 MB** total transfer, **LCP < 2.5s** on 4G.
   The three WebGL scenes are the risk — `05-assets.md` and `08-qa-and-audit.md`
   specify the fallbacks. A janky site costs teams clues they earned.

10. **Cinematic, but not at the cost of legibility.** The reference pins exactly one
    scene (300vh) and parallaxes one backdrop. Match that budget — no more. Every
    clue-bearing surface must be a calm, readable, stable block. Motion serves the
    disguise; it must never bury the evidence.

---

## 5. Stack

Matching the reference's own stack, so its measured class names, CSS rules and DOM
structure transfer without a translation layer.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Nuxt 3** (Vue 3), SSG | what the reference is; `nuxt generate` → static host |
| Styling | **Tailwind v3** | what the reference is; the spacing remap in `01` needs v3's `theme.spacing` fn |
| Smooth scroll | **Lenis** | the "expensive feel"; drives the GSAP ticker |
| Scroll animation | **GSAP + ScrollTrigger** | pinning, scrub, header direction watcher |
| 3D | **three.js** | hero backdrop, medallion, sigil |
| Glyph outlining | `opentype.js`, offline | wordmark + drawn headlines (technique T-B) |
| Raster artwork | `sharp` + `canvas`, offline | seals, plates, certificates (technique T-A) |
| Host | Netlify or Vercel, **private repo** | either; `08` covers both |

**Not used, deliberately:** Framer Motion, Locomotive, Swiper, Barba, any CMS, any
analytics, any third-party script.

---

## 6. Phase index

Run these in order. Do not skip ahead — later phases assume earlier artefacts exist.

| Phase | File | Produces |
|---|---|---|
| — | `REFERENCE-TEARDOWN.md` | **the measured spec. Read before every phase.** |
| 0 | `00-MASTER.md` | this brief |
| 1 | `01-foundation.md` | Nuxt scaffold, the fluid rem engine, Tailwind remap, safety config, audit scripts |
| 2 | `02-design-system.md` | tokens, type ramp, layout primitives, every component, `/specimen` |
| 3 | `03-motion-and-webgl.md` | Lenis + GSAP wiring, the pinned scene, the three three.js scenes |
| 4 | `04-clue-architecture.md` | **exact clue spec, three techniques, camouflage, decoys** |
| 5 | `05-assets.md` | offline generators: seals, plates, certificates, outlines, photography |
| 6 | `06-build-home.md` | the home page, section by section, against the teardown |
| 7 | `07-secondary-pages.md` | `/dispatches`, `/faq`, `/house`, `/roles`, legal, 404 |
| 8 | `08-qa-and-audit.md` | **side-by-side fidelity diff vs the reference**, a11y, perf, clue audit |
| 9 | `09-deploy-and-ops.md` | deploy + event-day runbook |

---

## 7. How to run this

Open Claude Code in `D:\codebreak`, then for each phase:

```
Read prompts/REFERENCE-TEARDOWN.md, prompts/00-MASTER.md and prompts/0N-<file>.md,
then execute Phase N task by task. Stop after each task and show me what changed.
```

**Do not paste all phases at once.** One phase per session keeps attention on the
current tasks and keeps diffs reviewable. Phase 6 in particular should be run one
*section* at a time — one section per prompt is the difference between a replica and
an approximation.

### Skills and MCP servers to invoke, by phase

Named explicitly so nothing capable sits idle. Invoke with the `Skill` tool.

| Phase | Invoke |
|---|---|
| 1 | `full-output-enforcement` (scaffolds get truncated otherwise) |
| 2 | `frontend-design`, `high-end-visual-design`, `ui-ux-pro-max`, `21st-ui-build` |
| 3 | `scroll-animations` (GSAP/ScrollTrigger patterns), `playwright-cli` (motion capture) |
| 4 | none — this phase is judgement, not craft. Read it twice instead. |
| 5 | `brandkit`, `poster-design`, `imagegen-frontend-web`, `canvas-design` |
| 6 | `image-to-code`, `frontend-design`, `full-output-enforcement` |
| 7 | `frontend-design`, `web-design-guidelines` |
| 8 | `web-design-guidelines`, `21st-ui-review`, `playwright-cli`, `/code-review high` |
| 9 | `security-review`, Vercel MCP (`deploy_to_vercel`, `get_deployment_build_logs`) |

**Browser MCP is the spine of phases 6 and 8.** The fidelity loop is: open the
reference in one tab, our build in another, measure the same element in both with
`javascript_tool`, and close the gap. Screenshots alone will not catch an 8px
spacing drift; computed styles will.

**21st.dev MCP requires OAuth and is currently unauthorised in this environment.**
Authorise it from an interactive `claude` session (`/mcp`) before phase 2, or use the
`21st` CLI skills instead — they shell out and do not need the MCP connection.

---

## 8. Private artefacts

`_private/` is git-ignored and must **never** be imported by application code or
deployed:

| File | Holds |
|---|---|
| `_private/KEY.md` | the organiser answer key — term, surface, section, screenshot |
| `_private/plate-jobs.json` | the strings baked into raster artwork |
| `_private/type-jobs.json` | the strings converted to outline geometry |
| `_private/decoys.json` | the decoy list, so the audit can verify coverage |

Application code reads only the **generated** outputs (`app/content/outlines.ts`,
`app/content/plates.ts`, `public/img/*`), never the job files.

---

## 9. Definition of done

Phase 8 signs off only when all of these hold:

- [ ] Every measured value in `REFERENCE-TEARDOWN.md` §2, §4, §5, §6 matches our
      build exactly, verified by computed style, not by eye.
- [ ] All eleven home sections present, in order, with the `border-t` hairline
      between each and the correct ground colour.
- [ ] The pill's turbulence wipe, the accordion, the tab bar, the ledger table, the
      carousel, the menu overlay and the header hide/show all behave as measured.
- [ ] Three WebGL scenes render, and degrade to a static frame under
      `prefers-reduced-motion` and on WebGL failure.
- [ ] `npm run audit:names` passes on `app/`, `public/` and `.output/`.
- [ ] Find-in-page for all six terms returns **zero** results on every route, in
      Chrome and Safari, desktop and mobile.
- [ ] All six terms are legible on a 375px viewport, verified by screenshot.
- [ ] At least twelve decoys present, at least three of them baked into artwork.
- [ ] Total transfer < 2.5 MB, LCP < 2.5s on throttled 4G.
- [ ] No source maps, no analytics, no third-party script, private repo.
