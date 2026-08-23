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
 */
export type Tile = {
  label: string
  plate: { src: string; describe: string; w: number; h: number }
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
      class="group stack --c --fill relative h-[22rem] s:h-[26rem] overflow-hidden border-b border-brown-dark s:odd:border-r s:odd:border-brown-dark focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
    >
      <Plate
        :src="tile.plate.src"
        :describe="tile.plate.describe"
        :w="tile.plate.w"
        :h="tile.plate.h"
        class="opacity-30 transition-opacity duration-700 ease-expo has-hover:group-hover:opacity-50"
      />
      <span class="relative z-2 type-h3 text-cream text-center px-20">
        {{ tile.label }}
      </span>
    </component>
  </nav>
</template>
