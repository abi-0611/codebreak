# PHASE 7 — Secondary pages

**Read first:** `REFERENCE-TEARDOWN.md` §10.
**Invoke:** `frontend-design`, `web-design-guidelines`.

**Outcome:** every route in the nav and the footer resolves to a real page. Rule 8:
a dead link is the fastest way for a participant to conclude the site is a prop and
start inspecting instead of reading.

---

## The page hero band

Every secondary route opens with the same band, measured from the reference:

- About `40vh`, carrying the WebGL backdrop (or its static fallback).
- Divided into columns by **four vertical hairlines** in `brown-dark`.
- A centred `.type-display-xl` title.
- `border-b border-brown-dark` closing it.

Build it once as `<PageBand/>`. It is the thing that makes the secondary pages read
as the same site rather than as afterthoughts.

## Route 1 — `/dispatches`

The reference's `/media`. Structure:

- The ornamental plate, the display title, a `type-body-lg` standfirst — note this
  page leads with the **plate**, not with a hero band.
- A filter dropdown (`All` + categories) in a bordered box.
- A grid of dispatch cards, same card component as the home carousel.

The plate here is the **same plate** as home section 7, at a larger rendered size.
That means `Pinecone` is legible on two routes, which is a gift to participants and
costs nothing — it is not a second clue, it is the same one, and the answer key
records it as such.

## Route 2 — `/faq`

- `<PageBand/>` with the title.
- A category `<select>` in a bordered `brown-dark` box — a real, keyboard-operable
  native select, not a div pretending.
- The accordion grouped under Roboto Mono uppercase category labels:
  `GENERAL` · `GRADING & ASSAY` · `ORDERING` · `PROVENANCE`.

Five to seven questions per group. This is the page where decoy vocabulary earns its
keep — `THREAD`, `INDEX`, `BUFFER` and `NODE` all belong in genuine answers about
grading and stock.

Write real answers. A participant reading FAQ copy looking for clues is a participant
spending time exactly where you want them.

## Route 3 — `/house`

The reference's `/brand`. `<PageBand/>`, then download cards on `brown-deepest` with
a pill and a file-size label, then wordmark and mark lockups on alternating grounds.

The downloads must actually resolve — a real ZIP of the mark, generated in phase 5.
A 404 on a download link is rule 8.

## Route 4 — `/ledger`

The full lot table — the home page shows seven rows, this shows all of them. Same
`<Ledger/>` component, a filter row, and per-lot detail rows.

Carries no clue. It carries a **concentration of decoys**, which is the point: it is
the page most likely to be scoured word by word.

## Route 5 — `/roles`  ·  carries clue 6 (`ReactJS`, T-A)

A real careers page. `<PageBand/>`, a short paragraph about the house, then the
noticeboard photograph, then a list of open roles as real listings with real detail —
location, team, a description, an application mailto.

**The noticeboard is where the clue lives.** Four cards pinned to an office wall; one
reads `ReactJS Engineer — Ledger Team`, three are decoy roles. The photograph is
environmental — it is a picture of an office, not a picture of a noticeboard.

The listings **below** the photograph are ordinary DOM text and must not repeat the
ReactJS role. If they did, find-in-page would find it and the clue would be dead.
List four different roles. The noticeboard and the listing are not the same set — a
noticeboard in a real office is out of date, which is exactly why this works.

Reachable from the footer and from home section 9's tiles.

## Routes 6–7 — `/privacy`, `/terms`

`<PageBand/>` plus the `.txt` long-form block from teardown §5. Real, plausible,
boring legal copy. No clue, no decoy — participants who read these deserve not to be
punished for it.

## Route 8 — 404

The reference does not define one; we need one anyway. `<PageBand/>` with the code,
one line of copy in the house voice, a pill back to `/`. No clue.

---

## Task 7.9 — Wire the navigation

- Header nav (desktop): `DISPATCHES` · `FAQ` · `THE LEDGER` · `THE HOUSE`.
- Header right: the `Open Ledger` pill and the hamburger.
- Menu overlay: the same four, plus `ROLES`.
- Footer `MENU` accordion: every route including legal.
- Active route gets `text-gold` (teardown §8.2).

**Every `href` resolves.** Run a link check before calling the phase done — no `#`,
no route that renders the 404.

## Task 7.10 — Head tags

Per route: a real `<title>`, a real meta description, Open Graph tags and an OG image
drawn in phase 5. None of them contain a banned token — `audit:names` covers the
content directory, so make sure it also covers route meta.

No `robots` block is needed; the site should be indexable-looking. But do add
`<meta name="robots" content="noindex">` if the URL is shared before the event and
you do not want it surfacing early — decide this in phase 9, not here.

---

## Exit criteria

- [ ] Eight routes resolve. No dead `href`. No lorem ipsum.
- [ ] `<PageBand/>` is consistent across all of them, with its four vertical hairlines.
- [ ] `/roles` noticeboard carries `ReactJS`; the listings below it do not.
- [ ] Find-in-page for `ReactJS` on `/roles` returns zero hits.
- [ ] `/house` downloads resolve to real files.
- [ ] Every route has real head tags and an OG image.
- [ ] `npm run audit:names` passes across all routes and the generated output.
