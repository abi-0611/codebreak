<script setup lang="ts">
import { useAway } from '~/composables/motion'
import { site, nav as allNav, live, type Link } from '~/content/site'

/**
 * The sticky header — teardown §8.2.
 *
 * `.site-max --full` inside, `h-70` on mobile and `h-80` from `s:` up.
 * Translucent black plus `backdrop-blur-sm` plus a bottom hairline — never
 * solid. The blur is what makes the display headline pass UNDER it legibly
 * instead of colliding with it.
 *
 * The hide-on-scroll-down is a class toggle, not a tween: `useAway` watches
 * ScrollTrigger's direction and flips `.is-away`, and `.site-head`'s own CSS
 * transition does the .75s translate on the house curve. transform, never
 * `top` — animating `top` on a fixed element repaints the whole viewport on
 * every frame.
 *
 * The wordmark is a mask-image of outlined paths, and the button around it
 * carries the accessible name. See <Wordmark/> — this is technique T-B, and
 * phase 4 depends on it existing.
 */
const props = withDefaults(
  defineProps<{
    /**
     * Defaults to the destinations that exist today. Rule 8 plus Nitro's
     * `failOnError` prerender: a header link to a route phase 7 has not built
     * yet fails the build rather than merely 404ing.
     */
    nav?: Link[]
  }>(),
  { nav: () => live(allNav) },
)

const open = useMenuState()
const away = useAway()

// The header must never hide while the overlay it opened is on screen.
const gone = computed(() => away.value && !open.value)
</script>

<template>
  <header class="site-head fixed top-0 inset-x-0 z-99" :class="{ 'is-away': gone }">
    <div class="relative bg-black/50 border-b border-brown-dark backdrop-blur-sm">
      <div class="site-max --full">
        <nav
          class="relative flex items-center justify-between h-70 s:h-80 px-20"
          :aria-label="site.name"
        >
          <NuxtLink
            :to="site.home"
            class="shrink-0 text-cream transition-colors duration-500 ease-expo has-hover:hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            <Wordmark :describe="site.name" />
          </NuxtLink>

          <!-- Desktop nav. Hidden on a phone because the menu overlay carries
               the same rows — not because they are unimportant. -->
          <ul class="hidden s:flex items-center gap-x-30 m-0 p-0 list-none">
            <li v-for="item in props.nav" :key="item.label">
              <NuxtLink
                :to="item.to"
                class="uline type-caption uppercase text-cream transition-colors duration-500 ease-expo has-hover:hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                active-class="text-gold"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>

          <div class="flex items-center gap-x-15">
            <Pill :to="site.register" :label="site.cta" class="hidden s:inline-flex">
              <template #icon>
                <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
              </template>
            </Pill>

            <!--
              The hamburger. Three rules that morph into an X, driven by
              `.is-active` on this button — teardown §8.2b. `size-44` is the
              44px touch-target floor at the mobile root size, which is exactly
              why the reference's 40px version is not copied here.
            -->
            <button
              type="button"
              class="lines flex items-center justify-center size-44 rounded-full border border-brown-dark text-cream transition-colors duration-500 ease-expo has-hover:hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              :class="{ 'is-active': open }"
              :aria-expanded="open"
              aria-controls="site-menu"
              :aria-label="open ? 'Close menu' : 'Open menu'"
              @click="open = !open"
            >
              <!--
                The three rules are stacked on ONE centre line and pushed apart
                by their own transforms, because those transforms are also what
                pulls them back together into the X. Spacing them with a flex
                gap instead would add to the offset rather than replace it, and
                the X would close on to the wrong point.
              -->
              <span class="relative block w-20 h-20">
                <span
                  v-for="line in 3"
                  :key="line"
                  class="lines__line absolute left-0 top-1/2 w-20 h-[1px] bg-current"
                />
              </span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>
