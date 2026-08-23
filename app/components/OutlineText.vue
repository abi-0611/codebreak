<script setup lang="ts">
import { outlines, nameOf, type OutlineKey } from '~/content/outlines'

/**
 * A line of type drawn as geometry — technique T-B.
 *
 * The paths come from app/content/outlines.ts, generated offline by
 * scripts/outline.mjs from committed font binaries. There is no text here, so
 * find-in-page has nothing to match, and no font is fetched to render it.
 *
 * NEVER swap the path for an SVG <text> element. Chrome's find-in-page matches
 * inline <text>, which would silently undo the technique — the page would look
 * identical and the line would be one Ctrl+F away. If a glyph is missing,
 * re-run the generator.
 *
 * THE ACCESSIBILITY TRADE-OFF IS REAL AND ACCEPTED. A drawn line cannot be
 * selected, copied, translated by the browser, or reflowed at large text
 * settings. `role="img"` plus an `aria-label` means assistive technology
 * announces it normally, which is a genuine mitigation and not a fig leaf —
 * but it does not restore selection or translation and nothing does. That is
 * why this is confined to display type and short labels and never touches
 * running copy, navigation or captions.
 *
 * SIZING. The generator records `cap` in the geometry's own units and `capPx`
 * in design pixels, so the height here is derived rather than chosen: the
 * drawn label lands on exactly the cap line of the live type beside it. A
 * label whose cap height is merely close is a label that reads as different,
 * which is the one thing a member of a set may never be.
 */
const props = withDefaults(
  defineProps<{
    /** Which committed set to draw from. */
    name: OutlineKey
    /** Which member of it. Members are drawn by one call and differ only in width. */
    index?: number
    /**
     * Cap height in design pixels, overriding the generator's. Use it to place
     * a set at a size a section actually needs — never to make ONE member
     * differ from its siblings.
     */
    cap?: number
  }>(),
  { index: 0, cap: 0 },
)

const set = computed(() => outlines[props.name])
const art = computed(() => set.value.members[props.index])

/** Design pixels → rem. The engine puts 1rem at 10 design px at every width. */
const rem = (px: number) => `${px / 10}rem`

const size = computed(() => {
  const glyphs = art.value
  if (!glyphs) return {}

  const capPx = props.cap || set.value.capPx
  const scale = capPx / set.value.cap
  return {
    height: rem(glyphs.box[1] * scale),
    width: rem(glyphs.box[0] * scale),
  }
})

const label = computed(() => nameOf(props.name, props.index))
</script>

<template>
  <svg
    v-if="art"
    :viewBox="`0 0 ${art.box[0]} ${art.box[1]}`"
    :style="size"
    class="block"
    role="img"
    :aria-label="label"
    preserveAspectRatio="xMinYMid meet"
  >
    <path :d="art.d" fill="currentColor" fill-rule="nonzero" />
  </svg>
</template>
