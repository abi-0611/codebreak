# PHASE 6 — Secondary pages

**Goal:** the routes that make the site feel like a real company rather than a one-page template — and that carry clue 6.
**Prereq:** Phase 5 complete.
**Done when:** every link in the nav and footer resolves to a real page, and `/careers` holds clue 6.

> A one-page site with a footer full of links that go nowhere is the loudest possible signal that something is off. Participants who sense a fake site stop *reading* and start *inspecting* — which is exactly the behaviour this whole design is built to avoid. These pages are camouflage infrastructure, and they matter.

---

## Task 6.1 — `/careers` — CARRIES CLUE 6

```
Build the careers page in the established design language. Do not invent a new layout
for it — it should look like the same designer made it on the same afternoon.

Header: eyebrow "WORK WITH US", headline "We hire slowly.", one paragraph.

Then five job listings, each an accordion row (reuse the Phase 2 accordion):

  1. Mountain Guide (IFMGA)          Chamonix        Full-time
  2. Logistics Coordinator           Chamonix        Full-time
  3. Frontend Engineer               Chamonix / Remote   Full-time   <- CLUE 6
  4. Expedition Medic                Seasonal        Contract
  5. Equipment Technician            Chamonix        Part-time

Collapsed row shows ONLY: title, location, contract type.
Note that listing 3's collapsed title is "Frontend Engineer" — the term ReactJS does
NOT appear until the panel is opened. This is deliberate.

Listing 3's expanded body:

  "We maintain the route planner, the permit portal and the offline field app used by
   our guides.

   Requirements
   - 4+ years ReactJS
   - Experience with mapping libraries and vector tiles
   - Offline-first PWA architecture
   - Comfortable shipping to users who have no signal

   Apply: careers@northbound.example"

Write genuine, specific bodies for the other four listings too. A page where four
listings are one thin line and the fifth is fully detailed points straight at the fifth.
Every listing gets comparable depth.

HARD REQUIREMENT: panel bodies conditionally rendered, absent from the DOM when
collapsed. Verify with all rows closed.
```

---

## Task 6.2 — `/routes/:slug`

```
A route detail page, reachable from the carousel cards. Build ONE real page and have
all five slugs render it with data from src/content/site.ts.

Layout: hero image, elevation and grade stats row, a short description, a waypoint list,
and a "Request Access" CTA.

The waypoint list on the Pinecone Pass route includes Node Camp [decoy] as a stage name.

IMPORTANT: the route detail page for pinecone-pass must NOT render "Pinecone Pass" as
live DOM text in its heading — that would hand over clue 2 to anyone who opens the page
and hits Ctrl+F. Render the route name on every detail page with <OutlineText/>, using
the same outlined-path treatment for all five so the construction is uniform.

If producing five outlined name headlines is too much asset work, the acceptable
alternative is to render the route name as the same baked plate image used on the card,
enlarged. Do not fall back to live text for this one page.
```

---

## Task 6.3 — `/journal/:slug`

```
One journal entry, in a clean editorial reading layout: title, date, author, body,
one inline image, and prev/next links.

Reference Index Peak [decoy] naturally in the body. Keep the writing good — this is
the page most likely to be read carefully by a participant hunting for hidden words,
so it needs to reward reading without containing anything.

That is a deliberate dead end, and dead ends are part of a fair hunt. Make it a
genuinely pleasant one.
```

---

## Task 6.4 — `/404`

```
A real 404 in the brand voice. "Off route." plus a link home.

Participants WILL type speculative URLs — /admin, /secret, /clues, /flag, /answers.
Every one of them must land on this ordinary, unremarkable 404. Do not add an easter
egg. Do not add a hint. Do not react to those paths in any way.
```

---

## Task 6.5 — `/ops-7f2a91` — organizer answer key

```
An UNLISTED route for organizers and judges during the event.

Contents:
- All six terms with their exact rendered text, route, section and technique
- A thumbnail of each clue-bearing asset with the clue circled
- A "reveal on page" deep link per clue: /?reveal=<n> which scrolls to that clue's
  section and outlines it with a temporary --ember ring

Protection:
- Not linked from anywhere. Not in the sitemap. <meta name="robots" content="noindex">
- Gate it behind a query token: /ops-7f2a91?k=<token> and render the 404 page for any
  request without the correct token. Read the token from an env var, do not hardcode it.
- The ?reveal=<n> handler must be a NO-OP unless the same token is present in
  sessionStorage, set by the ops page. Otherwise a participant who guesses ?reveal=1
  gets a free answer.

This page reads from src/content/site.ts, which already holds the clue data — that is
fine, since a participant would need the token to render it. It must NOT import
_private/CLUE-KEY.md, which stays out of the bundle entirely.

Decide with me before building: if you would rather this page not exist in the deployed
bundle at all, the safer alternative is a local-only route excluded from the production
build via an env flag, and organizers run it on a laptop. Tell me which you want.
```

---

## Task 6.6 — SEO and social

```
Real metadata, because a site with none looks abandoned:
- Per-route <title> and meta description in the brand voice
- Open Graph image using a crop of hero-01 with NO clue visible in it
- robots.txt allowing everything EXCEPT /ops-7f2a91
- sitemap.xml listing the public routes only

Caution on robots.txt: listing /ops-7f2a91 as disallowed publishes its existence to
anyone who opens robots.txt — and curious participants absolutely will. Better: omit it
from robots.txt entirely and rely on the token gate plus noindex. Do that.
```

---

## Phase 6 exit check

```
Confirm:
- Every nav and footer link resolves; zero href="#" anywhere in the app
- /careers listing 3 shows no ReactJS until opened; DOM verified while collapsed
- /routes/pinecone-pass does not contain the term as live text
- Speculative paths (/admin, /clues, /flag, /answers) all render the ordinary 404
- /ops-7f2a91 without a token renders the 404
- robots.txt does not mention the ops route
```
