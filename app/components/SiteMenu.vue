<script setup lang="ts">
import { pauseScroll, resumeScroll } from '~/composables/motion'
import { site, nav as allNav, channels, figures, live } from '~/content/site'

/**
 * The menu overlay — teardown §8.3.
 *
 * Full-screen black. Gold circular close button top right. Then, top to
 * bottom: the primary pill, the nav rows as Roboto Mono uppercase separated by
 * `brown-dark` hairlines, a large gap, the stats box, and a row of channel
 * tiles.
 *
 * THE FOUR THINGS AN OVERLAY HAS TO GET RIGHT, and what each costs if skipped:
 *
 *   focus in      a keyboard reader is otherwise left tabbing through a page
 *                 they can no longer see;
 *   focus kept    Tab must cycle inside the panel, not walk out behind it;
 *   focus back    on close, focus returns to the button that opened it —
 *                 skipped, and the reader is dumped at the top of the
 *                 document with no idea where they are;
 *   Escape        every dismissible layer must respond to it. No exceptions.
 *
 * All four live in useFocusKeep. The scroll lock lives in motion.ts and does
 * NOT set `overflow: hidden` on body: with the touch scroll container from
 * phase 1 the body is not the scroller, so that is a no-op that appears to
 * work on a desktop and fails on every phone.
 *
 * The stats box is passed the same `name` as the hero's, so the figures do not
 * re-count every time the menu opens. A number that animates on the second
 * open is a tell (rule 3).
 */
const open = useMenuState()
const panel = ref<HTMLElement | null>(null)

useFocusKeep(panel, open, () => { open.value = false })

watch(open, (now) => (now ? pauseScroll() : resumeScroll()))
onBeforeUnmount(() => resumeScroll())

const rows = live(allNav)
const tiles = live(channels)
</script>

<template>
  <!--
    The panel element itself stays in the DOM and is toggled, so the focus
    cycle always has a stable node to bind to and the overlay can cross-fade.
    `inert` when shut is what actually removes it from the tab order and from
    the accessibility tree — `opacity: 0` alone does neither.
  -->
  <div
    id="site-menu"
    ref="panel"
    class="fixed inset-0 z-99 bg-black overflow-y-auto transition-opacity duration-500 ease-expo2"
    :class="open ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    :inert="open ? undefined : true"
    role="dialog"
    aria-modal="true"
    :aria-label="`${site.name} menu`"
    tabindex="-1"
  >
    <div class="site-max --full min-h-full flex flex-col">
      <div class="flex items-center justify-end h-70 s:h-80 px-20 shrink-0">
        <Pill variant="gold" describe="Close menu" class="!size-44 !px-0" @click="open = false">
          <template #icon>
            <Glyph name="up" size="w-20 h-20 rotate-45" />
          </template>
        </Pill>
      </div>

      <div class="flex-1 flex flex-col px-20 pb-40">
        <Pill :to="site.home" :label="site.cta" class="self-start" @click="open = false">
          <template #icon>
            <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
          </template>
        </Pill>

        <nav :aria-label="site.name" class="mt-40 border-t border-brown-dark">
          <NuxtLink
            v-for="item in rows"
            :key="item.label"
            :to="item.to"
            class="block border-b border-brown-dark py-20 type-h3 text-cream transition-colors duration-500 ease-expo has-hover:hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
            active-class="text-gold"
            @click="open = false"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- The large gap is the reference's, and it is load-bearing: it is
             what stops the figures reading as a fifth nav row. -->
        <div class="mt-auto pt-60 flex flex-col gap-y-25">
          <!--
            Mounted on open, not kept alive behind the closed overlay. A
            StatBox that exists while the menu is shut is inside the viewport
            the whole time, so its reveal trigger fires on page load and claims
            the one-and-only count — leaving the hero's box to render its final
            values with no animation at all.

            Mounted this way it counts on the first open if the hero has not
            already done it, and never again either way.
          -->
          <StatBox v-if="open" :rows="figures" name="house" />

          <ul class="flex items-center gap-x-15 m-0 p-0 list-none">
            <li v-for="tile in tiles" :key="tile.label">
              <component
                :is="tile.to ? 'NuxtLink' : 'a'"
                :to="tile.to"
                :href="tile.href"
                :target="tile.href ? '_blank' : undefined"
                :rel="tile.href ? 'noopener noreferrer' : undefined"
                class="flex items-center justify-center size-44 rounded-[.5rem] border border-brown-dark text-cream transition-colors duration-500 ease-expo has-hover:hover:text-gold has-hover:hover:border-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                :aria-label="tile.label"
              >
                <Glyph :name="tile.glyph" size="w-20 h-20" />
              </component>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
