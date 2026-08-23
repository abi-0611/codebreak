# PHASE 9 — Deploy and event-day operations

**Invoke:** `security-review` on the finished build; the Vercel MCP
(`deploy_to_vercel`, `get_deployment_build_logs`, `get_runtime_errors`) if deploying
to Vercel.

---

## Task 9.1 — Pre-flight

Nothing deploys until all of these hold:

- [ ] Phase 8 signed off, with evidence in `_private/KEY.md`.
- [ ] **Repo is private.** Check it, do not assume it. This is rule 6 and it is the
      one mistake that ends the event before it starts.
- [ ] `sourcemap: { client: false, server: false }` in `nuxt.config.ts`.
- [ ] `.gitignore` covers `_private/`, `.output/`, `.nuxt/`, `node_modules/`.
- [ ] `git ls-files | grep _private` returns nothing.
- [ ] `npm run verify` passes clean from a fresh clone.

## Task 9.2 — Build and inspect the output

```bash
npm run generate
```

Then inspect `.output/public/` **before** uploading it anywhere:

```bash
# no source maps
find .output/public -name '*.map'

# no banned token anywhere in the shipped bytes
grep -ril -E 'search|ocr|reactjs|react-js|express|pinecone|rag' .output/public

# no private artefacts
grep -ril '_private' .output/public
```

The second grep will produce false positives on ordinary English (`coverage`,
`storage`, `expression`) — that is exactly why phase 1's substring-trap table exists.
Read every hit. A hit inside a JS chunk is the dangerous kind: it usually means a
string that was supposed to be baked into artwork ended up in a content file.

## Task 9.3 — Deploy

Either host works; the site is static.

**Vercel** — via the MCP, or `vercel --prod`. Framework preset: Nuxt. Build command
`npm run generate`, output directory `.output/public`.

**Netlify** — build `npm run generate`, publish `.output/public`.

Add these headers either way:

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

No CSP is required — the site loads Google Fonts and nothing else — but if you add
one, allow `fonts.googleapis.com` and `fonts.gstatic.com` or the whole type system
falls back to system fonts and the replica dies.

Long-cache `/img/*` and the hashed `_nuxt/*` assets. Do not cache HTML.

## Task 9.4 — Post-deploy verification, on the real URL

Re-run the parts of phase 8 that can only be true in production:

- [ ] Find-in-page audit (D.1) **on the deployed URL**, all six terms, all routes,
      Chrome and Safari, desktop and a real phone. Not localhost. The production
      bundle is a different artefact from the dev one.
- [ ] Lighthouse mobile: LCP < 2.5s, CLS < 0.1, total transfer < 2.5 MB.
- [ ] View source on the deployed page and read it. Actually read it.
- [ ] Open DevTools → Network and read every filename. None describes its contents.
- [ ] Every route resolves; no 404 from the nav, the footer or the tiles.
- [ ] Test on a real mid-range Android on real conference-grade wifi if you can get
      one. The GL fallbacks are the thing you are testing.

## Task 9.5 — Freeze

Once verified: tag the commit, and **stop changing the site**.

```bash
git tag -a round-1 -m "Round 1 as shipped"
```

A change on the morning of the event is how a clue disappears. If something must
change, re-run audits D.1 and D.2 in full before re-deploying. There is no such thing
as a cosmetic change to a site whose entire purpose is camouflage.

---

## Event-day runbook

### Before

- Bring `_private/KEY.md` printed. Not on a laptop that might sleep, and not on the
  same wifi you are asking participants to use.
- Have the URL as a QR code as well as text.
- Load the site once on the venue wifi and time it. If LCP is over 4s there, say so
  at the briefing and extend the window — rule 9 is about fairness, and a slow venue
  is not the teams' fault.

### The briefing

Tell participants:

- There are **six** terms hidden in the site.
- They are all **visible** — everything can be found by looking at the rendered page.
- Nothing requires viewing source, DevTools, or the network tab.
- Nothing requires an account, a login, or a form submission.

Do **not** tell them find-in-page will not work. Discovering that is the first real
step of the puzzle, and it is the step that separates teams.

### During

- Watch where teams get stuck. If nobody has found a given clue at the halfway mark,
  the scripted hint for it is in `_private/KEY.md`. Give hints by **surface**
  ("look at the documents"), never by term.
- If a team reports the site is broken, get the device and the browser. A GL fallback
  failing is the likely cause and it does not affect any clue except `OCR` — whose
  static frame is designed to carry it. Confirm that path works before the event.

### Judging

- The key lists the exact rendered string each term sits inside. Accept the term;
  do not require the surrounding string.
- `OCR` may be submitted as `O.C.R.` — accept both. Same for `ReactJS` / `React JS`.
- Decoys are listed in the key. A team submitting `THREAD` or `INDEX` has been caught
  by the intended trap; that is a wrong answer, not a partial one.

### After

- Take the site down, or leave it up but rotate the URL, if Round 2 reuses it.
- Keep `_private/` out of anything you share with participants afterwards — including
  the repo, if you open it up.
