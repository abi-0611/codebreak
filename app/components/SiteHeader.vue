<script setup lang="ts">
import { site } from '~/content/site'

/**
 * Structural stub. Phase 2 replaces the wordmark with the mask-image lockup
 * and adds the nav rows and the pill; what has to exist now is the geometry,
 * the ground, the hairline and the z-order, because the pinned scene in phase
 * 3 is measured against a header that is already 70/80 design px tall.
 */
const open = useMenuState()
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-99">
    <div class="relative bg-black/50 border-b border-brown-dark backdrop-blur-sm">
      <div class="site-max --full">
        <nav class="relative flex items-center justify-between h-70 s:h-80 s:px-20 max-s:px-20">
          <!-- Phase 5 swaps this for the outlined-glyph mask lockup. -->
          <NuxtLink
            :to="site.home"
            class="font-display font-light text-[2.2rem] leading-none text-cream"
          >
            {{ site.name }}
          </NuxtLink>

          <button
            type="button"
            class="font-mono uppercase text-[1.4rem] leading-none text-cream transition-colors duration-300 ease-expo has-hover:hover:text-gold"
            :aria-expanded="open"
            aria-controls="site-menu"
            @click="open = !open"
          >
            Menu
          </button>
        </nav>
      </div>
    </div>
  </header>
</template>
