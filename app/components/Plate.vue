<script setup lang="ts">
import { plates, type PlateKey } from '~/content/plates'

/**
 * Every image on the site renders through here. Never a bare `<img>`.
 *
 * Three things this centralises, all of which are easy to forget once and
 * impossible to notice afterwards:
 *
 *   · intrinsic width/height on every image, so nothing reflows as art
 *     arrives. Rule 9 is a performance budget, and layout shift is the part
 *     of it a reader actually feels;
 *   · the load policy. `priority="early"` is not a nice-to-have. Artwork that
 *     carries meaning MUST have it: a plate that has not painted by the time
 *     a fast scroller passes it is a plate that, for that reader, was blank;
 *   · the alt contract. Decorative plates pass `describe=""` deliberately and
 *     visibly, rather than by omission.
 *
 * Nothing that matters may live ONLY in the alt text. Rule 1: if a sighted
 * reader browsing normally cannot see it, it is not on the page — and alt text
 * is also the first thing tooling scrapes. `describe` says what the picture
 * is, the way it would be described to someone who cannot see it, and no
 * more.
 *
 * DIMENSIONS COME FROM THE MANIFEST, NOT FROM THE CALLER.
 *
 * Pass `name` and the source, the srcset and the intrinsic size all arrive
 * from app/content/plates.ts, which scripts/plates.mjs writes from the files
 * it actually encoded. A hand-passed `w`/`h` is a number that was true when
 * somebody typed it: re-encode the plate at a different size and the attribute
 * silently starts lying, the aspect ratio the browser reserves is wrong, and
 * the page shifts under the reader — with nothing anywhere reporting an error.
 *
 * `src`/`w`/`h` are still accepted for artwork the generator does not own.
 */
const props = withDefaults(
  defineProps<{
    /** A stem in app/content/plates.ts. Brings its own size and srcset. */
    name?: PlateKey
    /** An image the generator does not own. Requires `w` and `h`. */
    src?: string
    w?: number
    h?: number
    srcset?: string
    /**
     * The `sizes` attribute. Say how wide the image renders, so the browser
     * can pick from the srcset BEFORE layout — without it a 2x encoding is
     * fetched on a phone and rule 9's budget goes with it.
     */
    sizes?: string
    /** Alt text. Pass '' for genuinely decorative artwork. */
    describe: string
    /**
     * `early` fetches ahead of the scroll. Reserved for artwork that has to be
     * on screen the moment it is reached.
     */
    priority?: 'early' | 'lazy'
    fit?: string
  }>(),
  { priority: 'lazy', fit: 'object-cover', sizes: '100vw' },
)

const art = computed(() => {
  const held = props.name ? plates[props.name] : null
  const src = held?.src ?? props.src
  const w = held?.w ?? props.w
  const h = held?.h ?? props.h

  if (!src || !w || !h) {
    throw new Error(
      'Plate needs either a `name` from app/content/plates.ts, or `src` with `w` and `h`. ' +
        'An image with no intrinsic size reserves no space and shifts the page as it lands.',
    )
  }

  return { src, w, h, srcset: held?.srcset ?? props.srcset }
})
</script>

<template>
  <img
    :src="art.src"
    :srcset="art.srcset"
    :sizes="art.srcset ? sizes : undefined"
    :width="art.w"
    :height="art.h"
    :alt="describe"
    :loading="priority === 'early' ? 'eager' : 'lazy'"
    :fetchpriority="priority === 'early' ? 'high' : 'auto'"
    decoding="async"
    class="block w-full h-full"
    :class="fit"
  >
</template>
