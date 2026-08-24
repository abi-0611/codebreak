<script setup lang="ts">
import { useTicker } from '~/composables/motion'

/**
 * The partner strip — task 2.11.
 *
 * An endless horizontal ticker of cells divided by `brown-dark` verticals.
 *
 * The track holds the cells TWICE and translates by exactly -50%, which lands
 * the second copy precisely where the first started. That is what makes the
 * repeat seamless; a track translated by its pixel width has to be re-measured
 * on every resize and is off by a sub-pixel most of the time, which reads as a
 * stutter once a cycle.
 *
 * Paused off screen and disabled entirely under reduced motion, in which case
 * the cells simply sit there — still legible, still the whole set, just not
 * moving.
 *
 * These are OUR trade bodies, not the reference's partner marks. Those are a
 * real company's and are never reproduced.
 */
/**
 * THERE IS NO `seconds` PROP — phase 11 §11.4.
 *
 * The reference was re-measured as a SPEED: 70.9 px/s leftward. A duration
 * is the wrong thing to hold constant, because adding a seventh estate would
 * lengthen the track and silently slow the strip down while the number in the
 * call site went on looking correct. `useTicker` measures the track and
 * derives the seconds, so the speed is what survives an edit to the list
 * above it — which §11.6 names as the change most likely to be undone by
 * accident.
 */
defineProps<{
  cells: readonly string[]
  /** Names the strip for assistive technology. */
  label: string
}>()

const track = ref<HTMLElement | null>(null)
useTicker(track)
</script>

<template>
  <div
    class="relative w-full overflow-hidden border-y border-brown-dark"
    role="group"
    :aria-label="label"
  >
    <div ref="track" class="flex w-max will-change-transform">
      <!--
        Two passes over the same list. The second is aria-hidden: it is the
        same words again, and a screen reader reading the roster twice is a
        bug, not a marquee.
      -->
      <div
        v-for="pass in 2"
        :key="pass"
        class="flex shrink-0"
        :aria-hidden="pass === 2 ? 'true' : undefined"
      >
        <span
          v-for="cell in cells"
          :key="cell"
          class="flex items-center justify-center shrink-0 h-70 s:h-90 w-[24rem] s:w-[30rem] border-l border-brown-dark type-caption uppercase text-cream"
        >
          {{ cell }}
        </span>
      </div>
    </div>
  </div>
</template>
