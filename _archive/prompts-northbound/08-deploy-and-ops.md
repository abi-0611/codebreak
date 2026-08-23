# PHASE 8 — Deploy and event-day operations

**Goal:** the site live on Vercel, leak-proof, and a runbook for the day.
**Prereq:** Phase 7 passed, Ctrl+F table clean.

---

## Task 8.1 — Repository hygiene

This is the step that most often loses the competition before it starts.

```
1. The GitHub repository MUST be PRIVATE.
   A public repo hands over the entire answer key — every participant who thinks to
   search GitHub for the site name wins instantly. If it is currently public, make it
   private before deploying.

2. Alternatively, skip GitHub entirely and deploy straight from the CLI:
     npx vercel --prod
   This uploads the build with no repository to discover. For a one-off event site this
   is the simplest safe option, and it is what I recommend.

3. Confirm before pushing anything:
     git status --ignored     -> _private/ listed as ignored, never tracked
     git log --all --oneline -- _private/    -> zero commits
   If CLUE-KEY.md was EVER committed, it is in the history and rewriting is not worth
   the risk. Start a fresh repo with no history instead.

4. Do not name the repo something like "symposium-clue-hunt". Name it "northbound-site".
```

---

## Task 8.2 — Deploy

```
Deploy to Vercel:

  npx vercel            # preview, verify everything
  npx vercel --prod     # production

Configuration:
- Framework preset: Vite
- Add a rewrite so client-side routing works on direct navigation and refresh:
    { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  Without this, a participant who refreshes on /careers gets a 404 and may conclude the
  page is broken rather than real.
- Set the ops token as an environment variable (OPS_TOKEN or similar). Never commit it.
- Confirm production source maps are off — check the deployed bundle in devtools.

Then verify on the live URL, not localhost:
  - all routes resolve on direct navigation AND on refresh
  - the Ctrl+F sweep from Phase 7 still passes against production
  - images load over a phone connection in reasonable time
  - the ops route 404s without the token
```

---

## Task 8.3 — Vanity URL

```
The URL is the first thing participants see, and it should not undermine the disguise.

  Good:  northbound-alpine.vercel.app
  Bad:   symposium-round1-clues.vercel.app

Rename the Vercel project if needed. If your college has a domain you can point at it,
better still — a custom domain removes the last hint that this is a throwaway build.
```

---

## Task 8.4 — Event-day runbook

Write this into `_private/RUNBOOK.md`.

```
BEFORE THE ROUND
  - Load the site on 3 different devices and 2 browsers. Confirm all six clues visible.
  - Open /ops-7f2a91?k=<token> on the judges' laptop and leave it open.
  - Have _private/CLUE-KEY.md printed. Do not display it on a projector-connected screen.
  - Check the venue wifi actually loads the site. If it does not, have a phone hotspot
    ready, or pre-cache the site on a local machine and serve it on the LAN.
  - Decide the answer format in advance: do you accept "search" and "Search & Rescue"
    as the same answer? Write the accepted forms down before anyone asks.

DURING
  - Do not confirm or deny individual finds. Teams submit all six at once.
  - Watch the clock against the 12-20 minute target. If nobody has four clues at the
    30-minute mark, release hint 1 below.

GRADUATED HINTS  (use in order, only if the room is stuck)
  1. "Not everything on a website is text. Look at the pictures."
     -> unlocks the approach for Pinecone, Express and OCR at once
  2. "Two of the six are not on the first page."
     -> points at Careers without naming it
  3. "One of them is the largest thing on the site."
     -> gives away RAG, which is the intended last-to-fall clue

  Never hint at more than three. Past that the round is over and you should just call it.

SCORING SUGGESTION
  6/6 within 20 min   full marks
  6/6 within 35 min   90%
  partial             1 point per term, with a tiebreak on time
  Ctrl+F only         these teams will submit Vector / Index / Node / Beacon. That
                      submission is itself diagnostic and is worth zero.

AFTER
  - Take the site down or leave it up as a keepsake, but rotate the ops token either way.
  - If Round 2 is the build round, the six terms are the stack: an OCR + search +
    Pinecone + RAG pipeline behind an Express API and a ReactJS front end. The reveal
    lands much harder if you show them that connection on a slide.
```

---

## Task 8.5 — Contingency

```
Write these into the runbook too. Every one of them has happened to someone:

  Vercel is down / site will not load
    -> have `npm run build && npx serve dist` ready on a laptop, served on the venue LAN.
       Test this the day before, not on the day.

  A clue turns out to be invisible on the projector or on cheap phone screens
    -> the accreditation seals and the trail plate are the two at risk. Have a
       higher-contrast build ready to redeploy in one command.

  Someone finds the GitHub repo
    -> the round is compromised. This is why Task 8.1 exists. If it happens, switch to
       the hint schedule immediately and score on time-to-submit only.

  A team submits a decoy with total confidence
    -> stay neutral. Do not tell them they are wrong until the round closes.
```

---

## Phase 8 exit check

```
Final confirmation:
- Live production URL, verified on a phone over mobile data
- Repo private (or no repo at all)
- Ctrl+F sweep passes against the production build
- Ops route gated, token in an env var
- _private/RUNBOOK.md and _private/CLUE-KEY.md written, git-ignored, printed
- Playtest completed and difficulty tuned

Hand me the URL and the runbook.
```
