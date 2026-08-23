<script setup lang="ts">
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
 * Phase 5 generates app/content/plates.ts and this grows a `srcset` built from
 * it. The shape of the props is already the shape that will take.
 */
withDefaults(
  defineProps<{
    src: string
    /** Intrinsic pixel size of `src`. Not the display size. */
    w: number
    h: number
    /** Alt text. Pass '' for genuinely decorative artwork. */
    describe: string
    srcset?: string
    sizes?: string
    /**
     * `early` fetches ahead of the scroll. Reserved for artwork that has to be
     * on screen the moment it is reached.
     */
    priority?: 'early' | 'lazy'
    fit?: string
  }>(),
  { priority: 'lazy', fit: 'object-cover' },
)
</script>

<template>
  <img
    :src="src"
    :srcset="srcset"
    :sizes="sizes"
    :width="w"
    :height="h"
    :alt="describe"
    :loading="priority === 'early' ? 'eager' : 'lazy'"
    :fetchpriority="priority === 'early' ? 'high' : 'auto'"
    decoding="async"
    class="block w-full h-full"
    :class="fit"
  >
</template>
