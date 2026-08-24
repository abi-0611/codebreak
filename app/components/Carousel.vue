<script setup lang="ts">
import { useReduced } from '~/composables/motion'
import type { Dispatch } from '~/content/media'

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
 *
 * THE CARD ITSELF IS <Card/>, and phase 7 is why: `/dispatches` lays the same
 * cards out as a grid. One card, two arrangements. The rail states the width
 * here rather than in the card, because the width is a property of the rail.
 */
const props = withDefaults(
  defineProps<{
    cards: readonly Dispatch[]
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
    <div ref="rail" class="pull-x pull-snap flex gap-x-20 pb-20" tabindex="0">
      <Card
        v-for="card in props.cards"
        :key="card.title"
        :card="card"
        class="w-[28rem] s:w-[42rem] shrink-0"
      />
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
