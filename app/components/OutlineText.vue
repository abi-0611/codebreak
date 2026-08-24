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
    /**
     * Size against the INHERITED font size instead of against a fixed cap.
     *
     * The geometry is laid on a 1000-unit em (scripts/outline.mjs, `EM`), so
     * one em of box is one em of type: the drawn line then lands on the cap
     * line of whatever it is nested inside, at every breakpoint, with no
     * second value to keep in step. A `.type-h3` wrapper is 2rem on a phone
     * and 2.5rem from `s:` up, and a drawn label sized in rem would match one
     * of those two and be visibly wrong at the other.
     *
     * It applies to the whole set, exactly like `cap` does. Nothing here may
     * ever be used on one member.
     */
    fluid?: boolean
  }>(),
  { index: 0, cap: 0, fluid: false },
)

/** The em the generator laid the set on. Must match `EM` in outline.mjs. */
const EM = 1000

const set = computed(() => outlines[props.name])
const art = computed(() => set.value.members[props.index])

/** Design pixels → rem. The engine puts 1rem at 10 design px at every width. */
const rem = (px: number) => `${px / 10}rem`

const size = computed(() => {
  const glyphs = art.value
  if (!glyphs) return {}

  if (props.fluid) {
    return {
      height: `${glyphs.box[1] / EM}em`,
      width: `${glyphs.box[0] / EM}em`,
    }
  }

  const capPx = props.cap || set.value.capPx
  const scale = capPx / set.value.cap
  return {
    height: rem(glyphs.box[1] * scale),
    width: rem(glyphs.box[0] * scale),
  }
})

/**
 * The accessible name, applied AFTER hydration and never rendered on the
 * server.
 *
 * `nameOf` decodes a veiled set's name from the committed character codes, and
 * the whole point of those codes is that the line does not appear as a literal
 * in anything a reader can open. Server-rendering the decoded name puts it
 * straight back into the prerendered html — one Ctrl+U from being read, and a
 * finding in `npm run audit:names`, which scans the built output as well as
 * the source.
 *
 * So the markup ships without a name and the name is attached on mount. What
 * that costs is precise and worth stating: a reader with assistive technology
 * and no JavaScript gets an image role with no name here. Rule 1 is what keeps
 * that from mattering — nothing on this site may live only in a label — and
 * every one of these lines is a short label beside copy that says the same
 * thing in ordinary type.
 */
const label = ref('')
onMounted(() => {
  label.value = nameOf(props.name, props.index)
})
</script>

<template>
  <svg
    v-if="art"
    :viewBox="`0 0 ${art.box[0]} ${art.box[1]}`"
    :style="size"
    class="block"
    role="img"
    :aria-label="label || undefined"
    preserveAspectRatio="xMinYMid meet"
  >
    <path :d="art.d" fill="currentColor" fill-rule="nonzero" />
  </svg>
</template>
