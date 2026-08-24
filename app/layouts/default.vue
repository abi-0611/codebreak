<script setup lang="ts">
import { useSmooth } from '~/composables/motion'

/**
 * The site shell — moved out of app.vue in phase 7.
 *
 * WHY IT MOVED. Nuxt renders `error.vue` INSTEAD of `app.vue`, not inside it,
 * so an error page built while the shell lived in app.vue would have arrived
 * with no header, no menu, no codec probe and — the part that actually breaks
 * things — no `#scroll-view`. Every ScrollTrigger on the site asks
 * `scrollRoot()` which element is scrolling, and on a coarse pointer that
 * container is the one. Without it a phone gets a 404 it cannot scroll.
 *
 * A layout is the one place both app.vue and error.vue can reach, so the shell
 * is declared once here and both wrap themselves in it. Nothing about the DOM
 * changed in the move; the scroll container, the header, the overlay and the
 * probe are the same elements in the same order.
 *
 * `useSmooth` lives here for the same reason. A layout persists across route
 * changes, so Lenis is still built exactly once for the life of the session —
 * and it is now built for the error page too.
 */
useSmooth()
</script>

<template>
  <!--
    The touch scroll container. Teardown §3: the reference gives coarse
    pointers their own fixed, scrollable box rather than letting the document
    scroll, which is what keeps Lenis and the pinned scene stable on iOS.
    Retrofitting it later breaks the pin, so it has existed from the first
    commit.

    The id is how motion.ts finds the real scroller. Left on `window`, no
    trigger on the site would ever fire on a phone.
  -->
  <div
    id="scroll-view"
    class="has-not-hover:fixed has-not-hover:inset-0 has-not-hover:overflow-y-auto"
  >
    <NuxtRouteAnnouncer />
    <SiteHeader />
    <slot />
    <SiteMenu />
    <MediaProbe />
  </div>
</template>
