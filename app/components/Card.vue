<script setup lang="ts">
import { site } from '~/content/site'
import type { Dispatch } from '~/content/media'

/**
 * One dispatch card — teardown §8.8, the unit the carousel scrolls.
 *
 * Extracted from <Carousel/> in phase 7 because `/dispatches` lays the same
 * cards out as a grid, and phase 7 asks for the SAME card component. Two
 * implementations of one card is two sets of measurements to keep in step, and
 * the one that drifts is always the one on the page nobody opens.
 *
 * SIZE BELONGS TO THE CALLER. The root carries no width: the carousel gives it
 * a fixed rail width and the grid gives it a cell. A card that stated its own
 * width would have an opinion about a layout it cannot see, and the grid would
 * have to fight it.
 *
 * The play mark is decorative, and deliberately not a button. The whole card
 * is the control; a second real control inside a link is a keyboard trap in
 * miniature.
 */
withDefaults(
  defineProps<{
    card: Dispatch
    /**
     * How wide the card actually paints, so the browser can pick an encoding
     * before layout. Left at a default a phone fetches the widest file for a
     * picture it paints at a third of it — rule 9 is a budget and this is
     * where most of it is spent.
     */
    sizes?: string
  }>(),
  { sizes: '(min-width: 650px) 42rem, 28rem' },
)
</script>

<template>
  <component
    :is="card.to ? 'NuxtLink' : 'article'"
    :to="card.to"
    class="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
  >
    <!--
      `.stack --fill` rather than `absolute inset-0`: the frame's height comes
      from its aspect, and `--fill` makes that row definite so the plate
      resolves `h-full` against the frame instead of against its own intrinsic
      height.
    -->
    <div
      class="stack --fill aspect-[3/4] rounded-[.5rem] overflow-hidden border border-brown-dark bg-brown-deepest"
    >
      <Plate v-bind="card.plate" :sizes="sizes" />

      <div class="relative z-2 flex flex-col justify-between p-20">
        <Wordmark name="short" size="h-20 s:h-24" :describe="site.name" class="text-cream" />

        <div
          class="flex items-center justify-between gap-x-15 h-40 pl-20 pr-5 rounded-full bg-cream text-black"
        >
          <span class="type-caption uppercase">{{ card.tag }}</span>
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
    <p v-if="card.body" class="mt-10 type-body-md text-cream">{{ card.body }}</p>
  </component>
</template>
