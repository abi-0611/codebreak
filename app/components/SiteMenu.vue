<script setup lang="ts">
/**
 * Structural stub for the full-screen overlay. Phase 2 fills it with the pill,
 * the nav rows, the stats box and the social tiles; it exists now so the
 * z-order above the header is established before the pinned scene is built.
 */
const open = useMenuState()
</script>

<template>
  <div
    v-if="open"
    id="site-menu"
    class="fixed inset-0 z-99 bg-black"
    role="dialog"
    aria-modal="true"
    aria-label="Site menu"
  >
    <div class="site-max --full">
      <div class="flex items-center justify-end h-70 s:h-80 s:px-20 max-s:px-20">
        <button
          type="button"
          class="flex items-center justify-center size-44 rounded-full bg-gold text-black font-mono uppercase text-[1.4rem] leading-none"
          aria-label="Close menu"
          @click="open = false"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>
