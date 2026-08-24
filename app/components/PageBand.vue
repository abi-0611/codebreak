<script setup lang="ts">
import { plates } from '~/content/plates'

/**
 * The page hero band — teardown §10, phase 7.
 *
 * Every secondary route opens with this, and that is the whole reason it is a
 * component rather than a block of markup copied seven times: it is the thing
 * that makes `/faq` read as the same site as `/`, rather than as something
 * bolted on afterwards. A route that drew its own opening would be the route
 * everyone notices.
 *
 * Measured: about 40vh, the WebGL backdrop (or its static frame) behind it,
 * divided into columns by FOUR vertical hairlines in `brown-dark`, a centred
 * `.type-display-xl` title, and `border-b border-brown-dark` closing it.
 *
 * FOUR HAIRLINES MEANS FIVE COLUMNS, and the count is not arbitrary. An even
 * number of rules puts a rule on the centre line, straight through the middle
 * of the title; an odd number puts a column middle there, which is where a
 * centred line wants to sit. The reference draws four for the same reason.
 *
 * THE HEADER IS FIXED, so the band carries its own `pt-70 s:pt-80`. Without it
 * the title centres against the full band and sits behind the nav — which
 * looks correct on a desktop, where the band is tall, and collides on a phone,
 * where 40vh is barely three times the header.
 *
 * The backdrop is wrapped rather than positioned from here. <Scene/> roots
 * itself `relative`, and Tailwind emits `.relative` after `.absolute`, so a
 * `position` utility passed in as a class loses whatever order it is written
 * in — the scene then takes a band of space in normal flow and the section is
 * twice as tall as it should be. Same trap the home hero records.
 */
withDefaults(
  defineProps<{
    /** The display line. One string — these are short by design. */
    title: string
    /**
     * The backdrop's accessible name. It has one on every route because the
     * surface is the same surface; what it is a picture OF does not change
     * because the page it opens does.
     */
    describe?: string
    /** `darker` matches a page whose first section is on the alternating ground. */
    ground?: 'black' | 'darker'
  }>(),
  {
    describe: 'Dark stone cut through with lit saffron veining.',
    ground: 'black',
  },
)

/** Four rules, five columns. Laid by one loop — see the note above. */
const columns = [1, 2, 3, 4]
</script>

<template>
  <section
    class="relative z-2 overflow-hidden border-b border-brown-dark"
    :class="ground === 'darker' ? 'bg-brown-darker' : 'bg-black'"
  >
    <div class="absolute inset-0">
      <Scene
        kind="drift"
        :still="plates['still-01']"
        :describe="describe"
        class="h-full"
      />
    </div>

    <!--
      The scrim, and it is doing two jobs rather than being a mood.

      The backdrop is the HOME HERO's backdrop, drawn at full strength for a
      viewport-tall opening where it is the subject. Behind a 40vh band it is
      a texture, and at full strength it does two things wrong: it makes the
      secondary pages open louder than the front door, and it swallows the
      column rules entirely — `brown-dark` is barely above black, so against a
      lit ember field there is nothing left of them to see.
    -->
    <div class="pointer-events-none absolute inset-0 bg-black/55" aria-hidden="true" />

    <!--
      The column grid. Drawn over the backdrop and under the title, so the
      rules read as ruled INTO the ground rather than laid on top of the type.

      `w-[1px]`, not `w-px`. tailwind.config.ts REPLACES the spacing scale
      rather than extending it — that is what makes every utility number a
      design pixel — and Tailwind's `px` key lives in the default spacing
      scale, so `w-px` resolves to nothing at all and the rules render at zero
      width. They looked absent because they were. <SiteHeader/>'s hamburger
      rules use `h-[1px]` for the same reason.
    -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <span
        v-for="at in columns"
        :key="at"
        class="absolute inset-y-0 w-[1px] bg-brown-dark"
        :style="{ left: `${at * 20}%` }"
      />
    </div>

    <div
      class="relative z-2 min-h-[40vh] pt-70 s:pt-80 flex items-center justify-center px-20 s:px-40"
    >
      <h1 class="type-display-xl text-cream text-center py-50 s:py-70">{{ title }}</h1>
    </div>
  </section>
</template>
