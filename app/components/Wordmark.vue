<script setup lang="ts">
import { lockup, type LockupKey } from '~/content/lockup'

/**
 * The house lockup — teardown §8.2, and technique T-B.
 *
 * The wordmark is NOT text. It is a CSS `mask-image` fed an inline SVG
 * data-URI of outlined glyph paths, generated offline by scripts/lockup.mjs.
 * The reference ships exactly this, for ordinary art-direction reasons: a
 * lockup that never reflows, never waits on a webfont, and never swaps.
 *
 * Two consequences, both deliberate:
 *
 *   · it inherits `currentColor` through `bg-current`, so a hover or an active
 *     route recolours it with no second asset and no filter;
 *   · find-in-page cannot match it, because there is no text to match. Phase 4
 *     depends on this component existing — it is one of the three sanctioned
 *     techniques, and the only one that is not a raster.
 *
 * NEVER swap the mask for an SVG <text> element. Chrome's find-in-page matches
 * inline <text>. If a glyph is missing, regenerate the geometry.
 *
 * The accessibility trade-off is real and accepted. `role="img"` plus a
 * required `describe` means assistive technology announces the name normally;
 * it does not restore selection or browser translation, and nothing does. That
 * is why the technique is confined to display type and short labels and never
 * touches running copy.
 */
const props = withDefaults(
  defineProps<{
    /** Which committed line to draw. */
    name?: LockupKey
    /** Height utilities. The width follows from the geometry's aspect. */
    size?: string
    /** Required: what a screen reader should say. */
    describe: string
  }>(),
  { name: 'mark', size: 'h-36 s:h-40' },
)

const art = computed(() => lockup[props.name])

/**
 * `mask-size: 100% 100%` rather than `contain`, paired with an aspect-ratio
 * taken from the same viewBox. The two agree by construction, so the mask
 * lands on the box exactly and there is no sub-pixel letterboxing on either
 * axis at any viewport width.
 */
const uri = computed(() => {
  const { box, d } = art.value
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${box[0]} ${box[1]}'>` +
    `<path d='${d}'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})

const shape = computed(() => ({
  maskImage: uri.value,
  WebkitMaskImage: uri.value,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: '0% 0%',
  WebkitMaskPosition: '0% 0%',
  aspectRatio: `${art.value.box[0]} / ${art.value.box[1]}`,
}))
</script>

<template>
  <span
    class="block w-auto bg-current"
    :class="size"
    :style="shape"
    role="img"
    :aria-label="describe"
  />
</template>
