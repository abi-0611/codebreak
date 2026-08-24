<script setup lang="ts">
/**
 * The link tiles — teardown §8.10.
 *
 * 2x2 on desktop, a 1x4 stack on a phone, divided by `brown-dark` hairlines
 * rather than by gaps. The hairline grid is the point: the tiles read as one
 * ruled plate with four cells, not as four floating cards.
 *
 * Each tile carries its own low-luminance backdrop behind a centred Roboto
 * Mono label. Low-luminance is doing real work — the label is cream at
 * `type-h3`, and it has to clear AA against whatever the art happens to be
 * under it, at every crop, on every viewport. The plate is held well below the
 * label's ground so that contrast is a property of the design rather than a
 * property of the photograph.
 *
 * Phase 3 swaps the still for a looping clip where the codec probe says it can
 * play one. The static frame is not a fallback bolted on afterwards; it is
 * what ships, and the clip is the enhancement.
 *
 * The `s:` cell height is 34rem because two rows of it measure the 544px the
 * teardown records for this section at 1440. It was 26rem — chosen by eye
 * before there was a page to measure against — and a grid a fifth too short
 * reads as a strip of buttons rather than as the last plate on the page.
 */
export type Tile = {
  label: string
  /** From `art()` in app/content/media.ts, so the size cannot drift. */
  plate: { src: string; describe: string; w: number; h: number; srcset?: string }
  /** Absent until the destination exists. Rule 8. */
  to?: string
}

withDefaults(
  defineProps<{
    tiles: readonly Tile[]
    label: string
  }>(),
  {},
)
</script>

<template>
  <nav
    :aria-label="label"
    class="grid grid-cols-1 s:grid-cols-2 border-t border-brown-dark"
  >
    <component
      :is="tile.to ? 'NuxtLink' : 'div'"
      v-for="tile in tiles"
      :key="tile.label"
      :to="tile.to"
      class="group stack --c --fill relative h-[22rem] s:h-[34rem] overflow-hidden border-b border-brown-dark s:odd:border-r s:odd:border-brown-dark focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
    >
      <!-- One cell of a 2x2 grid on a desktop, the full column on a phone. -->
      <Plate
        v-bind="tile.plate"
        sizes="(min-width: 650px) 50vw, 100vw"
        class="opacity-30 transition-opacity duration-700 ease-expo has-hover:group-hover:opacity-50"
      />
      <span class="relative z-2 type-h3 text-cream text-center px-20">
        {{ tile.label }}
      </span>
    </component>
  </nav>
</template>
