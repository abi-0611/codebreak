<script setup lang="ts">
import { lost } from '~/content/legal'

/**
 * `/404` — the route that becomes the host's `404.html`.
 *
 * `nuxt generate` writes `404.html` itself, as an empty client-rendered shell
 * carrying the home page's title: `/404.html` is one of three paths the Nuxt
 * renderer hard-codes as no-SSR while prerendering, so no amount of routing
 * makes that file render. This page is prerendered normally and the hook in
 * nuxt.config.ts copies its output over the shell afterwards.
 *
 * What that buys is not cosmetic. It is the file a static host serves for
 * every mistyped lot number on the site: without it the reader gets a black
 * screen until JavaScript lands, and a share of it carrying the wrong title.
 *
 * The body is <Lost/>, shared with app/error.vue. See the note there.
 */
useHead({
  title: `${lost.heading} — CROCARIA`,
  meta: [
    { name: 'description', content: lost.body },
    // A 404 a crawler has indexed is a 404 somebody arrives at from outside.
    { name: 'robots', content: 'noindex' },
  ],
})
</script>

<template>
  <Lost />
</template>
