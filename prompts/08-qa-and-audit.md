# PHASE 8 — QA, fidelity audit, and the clue audit

**Invoke:** `web-design-guidelines`, `21st-ui-review`, `playwright-cli`, and
`/code-review high` on the finished diff.

Four audits, in this order. Each one gates the next. Do not run the clue audit on a
build that has not passed the fidelity audit — you will be verifying camouflage
against the wrong background.

---

## Audit A — Fidelity against the reference

The question: **is this the same designed object?**

### A.1 Token diff, by machine

Run against both sites and diff the output. Not by eye.

```js
// paste into both, diff the results
const out = {}
out.root = getComputedStyle(document.documentElement).fontSize
out.type = ['display-xl','h2','h3','body-lg','body-md','body-sm','body-xs','caption']
  .map(n => {
    const p = document.createElement('p'); p.className = 'type-' + n
    document.body.append(p); const c = getComputedStyle(p)
    const v = [n, c.fontFamily.split(',')[0], c.fontSize, c.fontWeight, c.lineHeight, c.letterSpacing]
    p.remove(); return v
  })
out.container = (() => {
  const d = document.createElement('div'); d.className = 'site-max'
  document.body.append(d); const c = getComputedStyle(d)
  const v = [c.maxWidth, c.paddingLeft]; d.remove(); return v
})()
JSON.stringify(out, null, 1)
```

Run at **375px and at 1440px**. Every value must match. `letterSpacing` must be
`normal` on all eight — this is the single most common drift.

### A.2 Section diff

For each of the eleven home sections, compare: ground colour, `border-top-color`,
`z-index`, vertical padding, and rendered height. Heights within ~10%; everything
else exact.

### A.3 Interaction diff

Record both with `playwright-cli` at 0.25× and compare frame by frame:

- The pill's turbulence wipe, in and out.
- The accordion opening and closing.
- The header hiding on scroll-down and returning on scroll-up.
- The pinned scene's four step transitions, forwards and backwards.
- The tab bar switching.

### A.4 Deliberate deviations — the list

There are exactly two, and both are recorded here so a reviewer can tell a decision
from a defect:

1. **Footer meta colour.** The reference sets running footer text in `#962817` on
   black, roughly 3.0:1, which fails WCAG AA. We keep the raw value for hairlines and
   decorative rules, and lift running text to the nearest tone clearing 4.5:1.
   (Phase 1, task 1.6.)
2. **Six strings are not selectable text.** Techniques T-A/T-B/T-C are required by
   the event and are incompatible with selectable text. Confined to display type and
   artwork; every one carries an accessible name. (Phase 5, task 5.3.)

Any *other* difference from the reference is a defect until proven otherwise.

---

## Audit B — Accessibility

The site is dark, low-contrast by design, and carries drawn type. All three need
checking properly rather than assumed.

- `npm run audit:contrast` clean.
- Every interactive element reachable by keyboard, in a sane order, with a **visible**
  focus ring. The reference's focus styling is minimal; ours must at least be visible
  against black.
- Accordion: `aria-expanded`, `aria-controls`, arrow-key support.
- Tabs: `role="tablist"`, roving tabindex.
- Menu: focus trapped, Escape closes, focus restored to the trigger.
- Every `<OutlineText/>` carries `role="img"` + `aria-label`.
- Every decorative canvas and image is `aria-hidden` or has empty `alt`.
- Screen-reader pass on the home page: the reading order makes sense, and the
  wordmark announces as "Crocaria", not as nothing.
- `prefers-reduced-motion`: no Lenis, no pin, no parallax, no GL, and **all six clues
  still visible**.

## Audit C — Performance

Rule 9. Measure on throttled 4G with 4× CPU throttle, at 375px.

- [ ] Total transfer **< 2.5 MB**
- [ ] LCP **< 2.5s**
- [ ] CLS < 0.1 — the fluid rem engine plus `<Plate/>`'s committed dimensions should
      make this trivially true; if it is not, an image is missing its size
- [ ] 30fps held through the pinned scene
- [ ] GL assets under 900 KB combined
- [ ] No layout thrash: one rAF loop, verified

If the budget misses, cut in this order: GL scene 3 to a permanent static frame
(it carries nothing), then the pinned scene's frames to lower quality, then the
carousel images to lazy. **Never** cut a clue-bearing asset's quality or its
`priority="early"` load policy.

---

## Audit D — The clue audit

This is the one that decides whether the event works.

### D.1 Find-in-page must fail

For each of the six terms, on **every route**, in **Chrome and Safari**, on **desktop
and mobile**:

1. Ctrl+F / ⌘F the term. Expect **zero** matches.
2. Select-all, copy, paste into a text editor, search again. Expect zero.
3. `document.body.innerText.toLowerCase().includes(term)` → `false`.
4. Reader mode / Safari Reader — expect zero.
5. Browser translate the page to another language, then search again — this is where
   a `<text>` node that survived would surface.

Script steps 3 across all routes so it runs in CI:

```js
// terms are read from _private/ at audit time, never committed to the script
routes.flatMap(r => terms.map(t => [r, t, pageText[r].includes(t)]))
      .filter(([,,hit]) => hit)
```

Any hit is a hard failure. Do not ship past it.

### D.2 Visibility

For each term, at 375px and 1440px:

- Screenshot with the term circled → into `_private/KEY.md`.
- Confirm the generator's printed cap height is ≥ 7px.
- Confirm it is visible **without** hover, and without a precise scroll position.
- Confirm it survives `prefers-reduced-motion`.
- Confirm it survives the GL static-fallback path (for `OCR`).

### D.3 Camouflage

For each clue, answer honestly:

- Is it typographically identical to the material beside it?
- Is its container the brightest or highest-contrast thing in the frame? (If yes, fix.)
- Is it a member of a set where every other member is drawn identically?
- Does the region around it have any tell — extra whitespace, a calmer rhythm, an
  element that resists the page's motion?
- Does its filename describe it?

### D.4 Decoys

- Twelve or more present.
- Three or more baked into artwork.
- None contains a real term as a substring — **verify by script**, not by reading.
- None adjacent to a clue-bearing section.
- Find-in-page **does** find them. That is intended.

### D.5 Playtest

Two people who have not seen the site, 25 minutes, a phone each.

Record: which clues were found, in what order, at what minute, and what they tried
that did not work. Target is four of six in 25 minutes.

If a clue is unfindable: **move it to a surface participants are already looking at.**
Do not make it bigger, brighter, or higher-contrast — that violates rule 3 and it is
visible to every team, including the ones who would have found it.

If a clue is found instantly by both testers, it is probably breaking rule 3 somewhere
— check its treatment against its neighbours before deciding it is fine.

---

## Audit E — Leak check

- [ ] `npm run audit:names` clean on `app/`, `public/`, `app/content/` and `.output/public/`.
- [ ] No `.map` file in the build output.
- [ ] `_private/` absent from the build output — grep the output tree for it.
- [ ] No application import from `_private/`.
- [ ] No analytics, no third-party script, no cookie banner.
- [ ] Repo is private.
- [ ] `grep -ri` the built output for each of the six terms → zero hits, including
      inside JS chunks, JSON, and inline styles.

---

## Sign-off

Phase 8 is complete when `00-MASTER.md` §9's "definition of done" checklist is fully
ticked, with evidence — not assertions — recorded in `_private/KEY.md`.
