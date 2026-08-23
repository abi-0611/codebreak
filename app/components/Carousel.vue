<script setup lang="ts">
import { useReduced } from '~/composables/motion'

/**
 * The card carousel — teardown §8.8.
 *
 * Native `overflow-x: auto` with `scroll-snap-type`, and no carousel library.
 * The reference does not use one either, and every library ships its own
 * styling, its own radii and its own idea of a dot indicator — all of which
 * would have to be stripped back off.
 *
 * What native buys, for free and correctly: momentum on touch, a real
 * scrollbar, keyboard scrolling, `scroll-snap` that respects the user's
 * reduced-motion setting, and shift+wheel on a desktop.
 *
 * Arrows are desktop-only (`has-hover:`), because on a phone the gesture IS
 * the control — a pair of arrow buttons there is two more things covering the
 * cards.
 */
export type Card = {
  /** Index label in the light pill, e.g. "LOT 04". */
  tag: string
  date: string
  title: string
  plate: { src: string; describe: string; w: number; h: number }
  /** Omitted while the destination route does not exist yet. Rule 8: no dead
   *  links, so a card with nowhere to go is simply not a link. */
  to?: string
}

const props = withDefaults(
  defineProps<{
    cards: readonly Card[]
    /** Names the region for assistive technology. */
    label: string
    /** Back/forward button labels. */
    prevLabel?: string
    nextLabel?: string
  }>(),
  { prevLabel: 'Previous', nextLabel: 'Next' },
)

const rail = ref<HTMLElement | null>(null)
const reduced = useReduced()

/**
 * Steps by one card plus its gap, measured off the first child rather than
 * hard-coded. The card width is a `s:` responsive value and a hard-coded step
 * would be wrong at one of the two widths — which shows up as a snap point
 * drifting a little further out of alignment on every press.
 */
function step(dir: 1 | -1) {
  const box = rail.value
  const first = box?.firstElementChild as HTMLElement | null
  if (!box || !first) return
  const gap = Number.parseFloat(getComputedStyle(box).columnGap || '0') || 0
  box.scrollBy({
    left: dir * (first.getBoundingClientRect().width + gap),
    behavior: reduced.value ? 'auto' : 'smooth',
  })
}
</script>

<template>
  <section :aria-label="label" class="w-full">
    <div
      ref="rail"
      class="pull-x pull-snap flex gap-x-20 pb-20"
      tabindex="0"
    >
      <component
        :is="card.to ? 'NuxtLink' : 'article'"
        v-for="card in cards"
        :key="card.title"
        :to="card.to"
        class="group block w-[28rem] s:w-[42rem] shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        <!-- The header. `.stack --fill` rather than absolute inset-0: the
             frame's height comes from its aspect, and `--fill` makes that row
             definite so the plate resolves `h-full` against the frame instead
             of against its own intrinsic height. -->
        <div class="stack --fill aspect-[3/4] rounded-[.5rem] overflow-hidden border border-brown-dark bg-brown-deepest">
          <Plate
            :src="card.plate.src"
            :describe="card.plate.describe"
            :w="card.plate.w"
            :h="card.plate.h"
          />

          <div class="relative z-2 flex flex-col justify-between p-20">
            <Wordmark name="short" size="h-20 s:h-24" :describe="label" class="text-cream" />

            <div class="flex items-center justify-between gap-x-15 h-40 pl-20 pr-5 rounded-full bg-cream text-black">
              <span class="type-caption uppercase">{{ card.tag }}</span>
              <!-- Decorative: the whole card is the control. A second real
                   button inside a link is a keyboard trap in miniature. -->
              <span
                class="flex items-center justify-center size-30 rounded-full bg-black text-cream"
                aria-hidden="true"
              >
                <Glyph name="play" size="w-14 h-14" />
              </span>
            </div>
          </div>
        </div>

        <p class="mt-15 type-caption uppercase text-gold">{{ card.date }}</p>
        <h3 class="mt-10 type-h2 text-cream">{{ card.title }}</h3>
      </component>
    </div>

    <!-- Desktop only. Rule 4 is satisfied by the scroll gesture itself. -->
    <div class="hidden has-hover:flex items-center gap-x-10 mt-20">
      <button
        v-for="dir in ([-1, 1] as const)"
        :key="dir"
        type="button"
        class="flex items-center justify-center size-44 rounded-full border border-brown-dark text-cream transition-colors duration-300 ease-expo has-hover:hover:text-gold has-hover:hover:border-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        :aria-label="dir === -1 ? prevLabel : nextLabel"
        @click="step(dir)"
      >
        <Glyph :name="dir === -1 ? 'left' : 'right'" size="w-20 h-20" />
      </button>
    </div>
  </section>
</template>
