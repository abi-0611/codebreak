<script setup lang="ts">
import { useReveal } from '~/composables/motion'

/**
 * Section chrome — teardown §7, task 2.13.
 *
 * Every section on the home page below the hero is wrapped in this, because
 * the reference is absolutely consistent about it: `position: relative`, an
 * explicit stacking level, and a top hairline. Not one section is missing the
 * hairline, and the eye finds the gap immediately — a section that starts
 * without a rule reads as the previous one running long.
 *
 * That is the whole reason this exists as a component rather than a habit. A
 * habit gets forgotten on section nine.
 */
withDefaults(
  defineProps<{
    /** `darker` is the alternating ground, teardown §7. */
    ground?: 'black' | 'darker'
    /** Vertical rhythm. The reference's common pair is the default. */
    pad?: string
    /**
     * The full-height vertical hairline down the centre column. Teardown §7:
     * it sits behind the seal and behind the dispatches plate, never on a
     * section carrying running copy.
     */
    rule?: boolean
    /**
     * The carousel section is the one exception to `z-2` — it sits at `z-3` so
     * its overflowing cards pass over the section below rather than under it.
     */
    lift?: boolean
    tag?: string
  }>(),
  { ground: 'black', pad: 'py-65 s:py-100', rule: false, lift: false, tag: 'section' },
)

/**
 * The whole reveal vocabulary, task 3.8. Fade plus a 24 design-px rise,
 * 600ms, expo-out, once, at `top 85%` — and no per-section variation, ever.
 * Putting it HERE rather than in each section is what guarantees that: a
 * section cannot opt out, and it cannot opt into something else.
 *
 * The start state is written by motion.ts at mount, never in CSS, so a
 * reader who never gets the JavaScript gets the page at full opacity rather
 * than a column of empty sections.
 */
const root = ref(null)
useReveal(root)
</script>

<template>
  <component
    :is="tag"
    ref="root"
    class="relative border-t border-brown-dark"
    :class="[ground === 'darker' ? 'bg-brown-darker' : 'bg-black', pad, lift ? 'z-3' : 'z-2']"
  >
    <!--
      Drawn from `s:` up only. At 375px the column is the viewport, so the two
      edges would land on the screen edges and read as a stray frame rather
      than as a spine.
    -->
    <div
      v-if="rule"
      class="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[44rem] border-x border-brown-dark hidden s:block"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
