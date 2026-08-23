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
 * Google Fonts families, in the weights the teardown measured (§5).
 *
 * Declared as strings, not arrays: @nuxtjs/tailwindcss merges the theme with
 * defu, which CONCATENATES arrays, so an array stack lands in the stylesheet
 * twice ("'Funnel Display', serif, 'Funnel Display', serif"). A string is
 * merged by replacement and survives intact.
 */
export const fontStack = {
  display: "'Funnel Display', serif",
  body: "'Host Grotesk', sans-serif",
  mono: "'Roboto Mono', ui-monospace, monospace",
}
