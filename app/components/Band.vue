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
     * ONE full-height hairline down the middle — phase 11 §11.3.3 and §11.3.7.
     *
     * Not `rule`, which is a PAIR of verticals 44rem apart that the seal and
     * the dispatches plate sit between. This is the spine of a two-column
     * split: the medallion's section and the guild's are both a column of copy
     * against a struck object, divided by a single rule.
     *
     * IT IS DRAWN HERE RATHER THAN INSIDE THE COLUMN because §11.3.3 asks for
     * the section's FULL height. A rule inside the content stops at the padding
     * and reads as a divider between two blocks; a rule that runs edge to edge
     * reads as the section being built on it. `left-1/2` lands on the column
     * boundary exactly, because `.site-max` is symmetric and centred, so its
     * content midpoint is the section's midpoint.
     */
    split?: boolean
    /**
     * The carousel section is the one exception to `z-2` — it sits at `z-3` so
     * its overflowing cards pass over the section below rather than under it.
     */
    lift?: boolean
    tag?: string
  }>(),
  { ground: 'black', pad: 'py-65 s:py-100', rule: false, split: false, lift: false, tag: 'section' },
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

    <!--
      The split's spine. Drawn from `s:` up only, for the same reason the pair
      above is: at 375px the two columns are one column, so a rule down the
      middle of the copy would be a line through the middle of a sentence.
    -->
    <div
      v-if="split"
      class="pointer-events-none absolute inset-y-0 left-1/2 border-l border-brown-dark hidden s:block"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
