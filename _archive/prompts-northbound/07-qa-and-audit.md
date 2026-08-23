# PHASE 7 — QA and clue audit

**Goal:** prove the site works, prove the clues are findable, and prove they are not *too* findable.
**Prereq:** Phase 6 complete.
**Done when:** all four audits pass and a human playtest confirms the difficulty curve.

> This is the phase people skip. It is also the phase that decides whether Round 1 lasts twenty minutes or ninety seconds.

---

## Task 7.1 — The Ctrl+F audit

The single most important test in this project.

```
Build for production, serve the build (not the dev server — dev has extra markup),
and run find-in-page for every one of these on EVERY route:

  MUST RETURN ZERO MATCHES
    search        rescue        ragged        pinecone
    express       ocr           reactjs       react js

  Note: "search" may legitimately appear in browser UI chrome. You are testing page
  content only. Also check that no aria-label, placeholder, button label or title
  attribute leaks a term — some browsers surface those.

  SHOULD MATCH (decoys working as intended)
    vector    beacon    index    cache    compass    node    stack

Then repeat the whole sweep with every accordion panel OPENED. Expected results change:
  - /careers with listing 3 open  -> reactjs SHOULD now match (that is technique C
    working as designed; the participant had to find and open it)
  - homepage with permits panel 2 open -> ocr must STILL return zero (it is baked into
    an image, technique A)

Report a pass/fail table. Any unexpected match is a P0 bug — fix it before anything else.
```

---

## Task 7.2 — The "can it actually be found" audit

Ctrl+F resistance is worthless if a human cannot find the clue either.

```
For each of the six, capture a screenshot of the clue exactly as a participant sees it —
correct viewport, correct scroll position, no zoom, no dev tools — at BOTH 1440px and
375px. Twelve screenshots.

For each, answer honestly:
  1. Is the term legible without zooming? (If no on mobile, the clue is broken.)
  2. Would you notice it while reading normally, or only while hunting?
  3. Does it look different from its siblings in any way?

Any clue that fails #1 gets its asset regenerated at higher contrast or larger scale.
Any clue that fails #3 gets its siblings adjusted to match it — never the reverse,
because changing the clue to match siblings usually means shrinking it below legibility.

Show me all twelve screenshots.
```

---

## Task 7.3 — Responsive and accessibility

```
Test at 375, 768, 1024, 1440, 1920.

At every breakpoint:
- No horizontal overflow anywhere
- The AccessPill never covers a clue — specifically check the accreditation seals at
  375px, where a fixed bottom pill is most likely to sit right on top of them
- The carousel reaches card 3 in at most two swipes
- All accordions open and close on tap with a 44px minimum touch target
- The four seals stay legible in their 2x2 mobile grid

Accessibility:
- Keyboard-navigate the entire site. Every accordion and carousel control reachable
  and operable. Visible focus rings.
- Run axe or Lighthouse a11y. Target 95+.
- Confirm <OutlineText/> instances carry accurate aria-labels, so a screen reader user
  gets "Ragged Ridge" and "Search and Rescue" as text. They are entitled to the same
  information as everyone else — the Ctrl+F defence is aimed at find-in-page, not at
  assistive technology.
- prefers-reduced-motion: no pinning, no scrub, all six clues still reachable.
```

---

## Task 7.4 — Performance

```
Lighthouse on the production build, mobile preset, throttled 4G:
  Performance  > 90
  LCP          < 2.5s
  CLS          < 0.05
  Total transfer < 2.5 MB

If you miss the budget, cut in this order: particle field, then hero image resolution,
then the second pinned scene. Do NOT cut clue-bearing assets or their resolution.

Also test on a real mid-range Android over a phone hotspot if you can. Symposium wifi
will be worse than anything Lighthouse simulates, and a participant who cannot load the
permits accordion cannot find clue 4.
```

---

## Task 7.5 — The playtest

The only audit that really counts.

```
This one is on you, not Claude Code. Before the event:

1. Find 2-3 people who do not know the answers. Give them ONLY the URL and the
   instruction: "there are six technical terms hidden in this site, find them."
2. Time them. Watch where they go. Do not help.
3. Record: time to first clue, time to all six, which clue stalled them longest,
   and whether anyone tried Ctrl+F and what they concluded from it.

Read the results against the target: 12-20 minutes for a competent team.

  Under 8 minutes   -> too easy. Move OCR deeper (panel 3 instead of 2), or reduce the
                       plate size on route-03.
  Over 35 minutes   -> too hard. The usual culprit is OCR or ReactJS. Promote one:
                       default-open permits panel 1 so the accordion pattern is obvious,
                       or add a "We're hiring" line in the footer near the Careers link.
  Nobody finds RAG  -> expected, and the most likely single failure. It is the intended
                       hard-to-recognise clue. If it stays unfound past 30 minutes,
                       consider having the route detail pages echo the naming style so
                       participants learn that place names matter.

Feed the results back and re-tune src/content/site.ts. That is why all the copy lives
in one file.
```

---

## Task 7.6 — Leak audit

```
Final sweep before deploy:

- grep the whole repo for the banned tokens in FILENAMES and IDENTIFIERS (not content):
  search, ocr, reactjs, express, pinecone, rag, clue, hidden, puzzle, hunt, answer
- Confirm dist/ contains zero .map files
- Open the built JS bundles and search for the six terms. src/content/site.ts ships to
  the client, so any clue string stored as plain text there IS in the bundle. Decide
  deliberately: the terms baked into images are safe, but if a clue string is sitting in
  the JS as a plain string, a determined participant reading the bundle will find it.
  Either accept that (bundle-reading is well beyond "visually look for these clues") or
  move those strings out. Tell me which terms appear and let me decide.
- Confirm _private/ is git-ignored and untracked: git status --ignored
- Confirm the ops token comes from an env var and is not in the client bundle
```

---

## Phase 7 exit check

```
Produce a single QA report with:
- The Ctrl+F pass/fail table (both closed and opened states)
- The twelve clue screenshots
- Lighthouse scores for performance and accessibility
- The leak audit results
- Playtest timings, once you have them

Do not proceed to deploy until the Ctrl+F table is clean.
```
