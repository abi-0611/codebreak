<script setup lang="ts">
import type { NuxtError } from '#app'
import { broke, lost } from '~/content/legal'

/**
 * The error page — phase 7, route 8.
 *
 * The reference does not define one. This site needs one more than most: it
 * publishes a register of numbered lots, so a reader who mistypes a number
 * will find this page, and what they find has to look like the same house.
 *
 * NUXT RENDERS THIS INSTEAD OF app.vue, not inside it, which is why the shell
 * lives in a layout — see app/layouts/default.vue. Without <NuxtLayout> this
 * page would arrive with no header, no menu overlay and, worse, no
 * `#scroll-view`: on a coarse pointer that container is the scroller, so an
 * error page without it is one a phone cannot scroll.
 *
 * The body is <Lost/>, shared with app/pages/404.vue, which is what a static
 * host actually serves for a bad URL. Two bodies would be two pages to keep in
 * step and the one that drifted would be the one nobody visits on purpose.
 */
const props = defineProps<{ error: NuxtError }>()

const missing = computed(() => props.error?.statusCode === 404)
const copy = computed(() => (missing.value ? lost : broke))

useHead({
  title: `${copy.value.heading} — CROCARIA`,
  meta: [
    { name: 'description', content: lost.body },
    // A 404 a crawler has indexed is a 404 somebody arrives at from outside.
    { name: 'robots', content: 'noindex' },
  ],
})
</script>

<template>
  <NuxtLayout>
    <Lost :fault="!missing" />
  </NuxtLayout>
</template>
