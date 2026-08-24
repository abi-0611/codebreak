<script setup lang="ts">
import { device } from '~/content/device'

/**
 * The house mark, painted as a CSS `mask-image`.
 *
 * The same technique as <Wordmark/> and for the same reasons: the geometry is
 * committed by scripts/mark.mjs, nothing is fetched at runtime, and the mark
 * inherits `currentColor` through `bg-current` so a hover or an active route
 * recolours it with no second asset and no filter.
 *
 * app/content/device.ts has referred to this component since phase 5; `/house`
 * is the first page that needed the mark on its own, at a size worth looking
 * at, rather than as a favicon or as an extrusion in a GL scene.
 *
 * `fill-rule: nonzero` is what makes the counter a hole. The two contours in
 * `device.d` are wound against each other precisely so that it does — see the
 * assertion mark.mjs runs before it commits them.
 *
 * The accessibility trade-off is the wordmark's, stated in the same words:
 * `role="img"` plus a required `describe` means assistive technology announces
 * the mark normally. It does not restore selection, and nothing does. That is
 * why the technique never touches running copy.
 */
withDefaults(
  defineProps<{
    /** Height utilities. The width follows from the geometry's own aspect. */
    size?: string
    /** Required: what a screen reader should say. */
    describe: string
  }>(),
  { size: 'h-64' },
)

/**
 * `mask-size: 100% 100%` paired with an aspect-ratio taken from the same
 * viewBox. The two agree by construction, so the mask lands on the box exactly
 * and there is no sub-pixel letterboxing on either axis at any width.
 */
const uri = computed(() => {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${device.box[0]} ${device.box[1]}'>` +
    `<path d='${device.d}' fill-rule='nonzero'/></svg>`
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
  aspectRatio: `${device.box[0]} / ${device.box[1]}`,
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
