<script setup lang="ts">
import { useSmooth } from '~/composables/motion'

/**
 * The site's one scroll position, built once, here — task 3.1.
 *
 * Lenis drives gsap.ticker, gsap.ticker drives ScrollTrigger.update, and
 * the GL layer draws off the same ticker. Nothing else in the build opens a
 * requestAnimationFrame loop or holds the instance; motion.ts is the only
 * module that can, and this is the only call site.
 *
 * Under prefers-reduced-motion, and on coarse pointers, this builds nothing
 * at all. See the note in motion.ts §7.
 */
useSmooth()
</script>

<template>
  <!--
    The touch scroll container. Teardown §3: the reference gives coarse
    pointers their own fixed, scrollable box rather than letting the document
    scroll, which is what keeps Lenis and the pinned scene stable on iOS.
    Retrofitting it later breaks the pin, so it exists from the first commit.

    The id is how motion.ts finds the real scroller. Every ScrollTrigger on the
    site asks `scrollRoot()` which element is actually scrolling; left on
    `window`, none of them would ever fire on a phone.
  -->
  <div
    id="scroll-view"
    class="has-not-hover:fixed has-not-hover:inset-0 has-not-hover:overflow-y-auto"
  >
    <NuxtRouteAnnouncer />
    <SiteHeader />
    <NuxtPage />
    <SiteMenu />
    <MediaProbe />
  </div>
</template>
