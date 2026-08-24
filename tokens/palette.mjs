/**
 * CROCARIA palette — the single definition site for every colour in the build.
 *
 * Measured from the reference and recorded in prompts/REFERENCE-TEARDOWN.md §4.
 * Two consumers read this file and nothing else:
 *
 *   tailwind.config.ts   turns it into utilities (the only way app code may
 *                        touch a colour — see CLAUDE.md, "no inline hex")
 *   scripts/contrast.mjs recomputes WCAG AA for every shipped pairing
 *
 * app/assets/css/main.css re-declares the same values as :root custom
 * properties so the stylesheet is self-documenting. contrast.mjs cross-checks
 * the two and fails if they ever drift apart.
 */

/** @type {Record<string, string>} */
export const palette = {
  black: '#000000',
  white: '#FFFFFF',
  cream: '#ECE7E0',
  gold: '#FFBC09',

  /** Mid rules and footer meta. Decorative use only — see `brown-lifted`. */
  brown: '#962817',
  /** Every hairline on the site, and the open-accordion fill. */
  'brown-dark': '#47140B',
  /** Alternating section ground. */
  'brown-darker': '#150604',
  /** Card / panel fill. */
  'brown-deepest': '#2F0E09',

  /**
   * RECORDED DEVIATION FROM THE REFERENCE (phase 1, task 1.6).
   *
   * The reference sets its footer meta copy in `brown` (#962817) on black,
   * which measures 2.61:1 and fails WCAG AA for text. We keep #962817 exactly
   * as measured for rules, hairlines and non-text edges, and lift any #962817
   * used as RUNNING TEXT to this tone, which is the nearest hue-preserving
   * value that clears 4.5:1 on both #000000 (4.78:1) and #150604 (4.51:1).
   *
   * Not approved on #2F0E09 (4.03:1) or #47140B — use cream there.
   */
  'brown-lifted': '#DC3F27',
}

/**
 * A palette token as sRGB floats, with an optional hue rotation in degrees.
 *
 * "No inline hex, anywhere" is a CLAUDE.md rule and a shader is not an
 * exemption from it. Every colour the GL layer emits starts at the record
 * above and is transformed by this function, so the scenes stay on the same
 * record as the stylesheet and there is no second place a colour can change.
 *
 * The rotation exists for one reason: teardown §9 describes the scenes as red,
 * gold AND magenta, and the site has no magenta token — it is not a colour any
 * text or edge is ever set in, so putting it in the palette would be inventing
 * a token to satisfy one shader. Rotating the red is the honest way to say
 * "this hue, moved".
 *
 * IT LIVES HERE, AND NOT IN THE GL LAYER, BECAUSE TWO CONSUMERS NEED IT.
 * app/composables/gl.ts derives the live scenes' tints from it and re-exports
 * it under the name every scene already reaches for; scripts/lib/stone.mjs,
 * which draws the hero backdrop's still frame offline, derives the same four
 * tints for the same field and cannot import TypeScript. A second
 * implementation of an HSL round trip would agree with this one right up until
 * it rounded differently, and the symptom would be a fallback that is a
 * slightly different colour from the shader it stands in for — visible only to
 * someone toggling reduced motion, which is nobody, for a phase.
 *
 * @param {string} hex   one of the values above
 * @param {number} turn  degrees, signed
 * @returns {[number, number, number]}
 */
export function ink(hex, turn = 0) {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  if (!turn) return [r, g, b]

  const hi = Math.max(r, g, b)
  const lo = Math.min(r, g, b)
  const l = (hi + lo) / 2
  const span = hi - lo
  if (!span) return [r, g, b]

  const s = l > 0.5 ? span / (2 - hi - lo) : span / (hi + lo)
  let h = 0
  if (hi === r) h = ((g - b) / span + (g < b ? 6 : 0)) / 6
  else if (hi === g) h = ((b - r) / span + 2) / 6
  else h = ((r - g) / span + 4) / 6

  h = (h + turn / 360 + 1) % 1

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const lane = (t) => {
    const u = (t + 1) % 1
    if (u < 1 / 6) return p + (q - p) * 6 * u
    if (u < 1 / 2) return q
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6
    return p
  }

  return [lane(h + 1 / 3), lane(h), lane(h - 1 / 3)]
}

/**
 * Google Fonts families, in the weights the teardown measured (§5).
 *
 * Declared as strings, not arrays: @nuxtjs/tailwindcss merges the theme with
 * defu, which CONCATENATES arrays, so an array stack lands in the stylesheet
 * twice ("'Funnel Display', serif, 'Funnel Display', serif"). A string is
 * merged by replacement and survives intact.
 */
export const fontStack = {
  // The fallback is sans-serif, not serif: measured off the reference, whose
  // compiled rule is `font-family: Funnel Display, sans-serif`. It only shows
  // during the swap, and a serif fallback makes the headline visibly reflow
  // from the wrong skeleton.
  display: "'Funnel Display', sans-serif",
  body: "'Host Grotesk', sans-serif",
  mono: "'Roboto Mono', ui-monospace, monospace",
}
