<script setup lang="ts">
/**
 * The icon set. One family, one stroke weight, one cap style.
 *
 * Square caps and mitred joins, not the rounded ones every icon library ships.
 * Rounded caps read as friendly; this house is understated, technical and a
 * little severe, and the difference between the two is entirely in this
 * detail. Mixing the two families in one interface is the fastest way to make
 * a considered design look assembled.
 *
 * Everything is drawn on a 24-unit grid at stroke-width 1.5 and inherits
 * `currentColor`, so a glyph beside a label always matches it — including
 * mid-transition, which a two-colour asset cannot do.
 */
const props = withDefaults(
  defineProps<{
    name: keyof typeof PATHS
    /** Sizing utilities. The pill's trailing arrow measures `min-w-20 h-32`. */
    size?: string
  }>(),
  { size: 'w-20 h-20' },
)

/**
 * Drawn, not imported. Ten marks is far less weight than any icon package, and
 * a package would also bring its own visual language — which is the thing we
 * are specifically trying not to have.
 */
const PATHS = {
  /** The pill's trailing mark. Diagonal, the way an outbound link reads. */
  arrow: 'M7 17 17 7M9 7h8v8',
  right: 'M4 12h16M14 6l6 6-6 6',
  left: 'M20 12H4M10 18l-6-6 6-6',
  /** Closed accordion row. */
  down: 'M12 4v16M6 14l6 6 6-6',
  /** Open accordion row. */
  up: 'M12 20V4M6 10l6-6 6 6',
  /** Dispatches — a bonded lot moves by post. */
  mail: 'M3 6h18v12H3zM3 6l9 7 9-7',
  /** The house journal. */
  note: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h4',
  /** Consuegra. */
  pin: 'M12 21c0 0-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  /** The wire. */
  feed: 'M5 19h.01M5 13a6 6 0 0 1 6 6M5 7a12 12 0 0 1 12 12',
  /** The ledger itself. */
  grid: 'M4 4h16v16H4zM4 10h16M4 15h16M10 4v16',
  /** The only solid mark in the set. A play control is a filled triangle or
   *  it is not a play control — an outlined one reads as "stop". */
  play: 'M9 6l10 6-10 6z',
} as const

const SOLID = new Set<keyof typeof PATHS>(['play'])

const solid = computed(() => SOLID.has(props.name))
</script>

<template>
  <svg
    :class="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="square"
    stroke-linejoin="miter"
    aria-hidden="true"
    focusable="false"
  >
    <path
      :d="PATHS[name]"
      :fill="solid ? 'currentColor' : 'none'"
      :stroke="solid ? 'none' : 'currentColor'"
    />
  </svg>
</template>
