<script setup lang="ts">
import { site, channels, legal, credits, directory, live } from '~/content/site'

/**
 * The footer — teardown §8.9, measured shell:
 *
 *   <footer class="relative bg-black text-cream border-t border-brown-dark
 *                  overflow-hidden z-2">
 *     <div class="site-max --l">
 *       <div class="py-65 s:py-100 flex flex-col s:flex-row s:items-start
 *                   s:gap-x-100">
 *
 * Note `--l`, not the default padding, and the description is `type-body-sm`.
 *
 * The MENU accordion reuses <Accord/> rather than repeating a disclosure.
 * A second implementation of the same control is a second set of keyboard bugs.
 *
 * THE ONE RECORDED DEVIATION lives in the bottom row. The reference sets its
 * legal and credit line in `brown` #962817, which measures 2.61:1 on black and
 * fails WCAG AA for text. We keep #962817 exactly as measured for the rules and
 * hairlines around it, and lift the running text to `brown-lifted` #DC3F27 at
 * 4.78:1. `npm run audit:contrast` prints the finding on every run so it stays
 * a decision rather than a habit.
 */
const props = withDefaults(
  defineProps<{
    /** The collapsed nav, mirroring the reference's MENU disclosure. */
    rows?: readonly { question: string; body: string }[]
  }>(),
  { rows: () => [] },
)

const glyphs = live(channels)
const terms = live(legal)

/**
 * The MENU disclosure's contents — teardown §8.9.
 *
 * Filtered by `live`, so it lists what the build actually serves. A directory
 * that offers a route rendering a 404 is rule 8, and Nitro prerenders with
 * `failOnError`, so it would not reach a reader anyway: it would stop the
 * build.
 *
 * TASK 7.9 ASKS FOR EVERY ROUTE INCLUDING LEGAL, so the two notices are
 * appended here rather than being added to `directory` itself. They are not
 * house sections — they do not belong in the menu overlay or anywhere else
 * `directory` is read — and the bottom row of this footer still carries them
 * separately, which is where a reader looking for them actually goes.
 */
const routes = [...live(directory), ...live(legal)]

/**
 * Which disclosure is the MENU one, if any.
 *
 * The directory is rendered into that row's panel through a DYNAMIC slot name
 * rather than into `body-0`. A caller that passes its own disclosures — the
 * design-system route does — keeps every one of its bodies, and a caller with
 * no MENU row resolves to a slot nothing matches, which renders the row's own
 * body exactly as before.
 */
const menuSlot = computed(
  () => `body-${props.rows.findIndex((row) => row.question.toLowerCase() === 'menu')}`,
)
</script>

<template>
  <footer class="relative bg-black text-cream border-t border-brown-dark overflow-hidden z-2">
    <div class="site-max --l">
      <div class="py-65 s:py-100 flex flex-col s:flex-row s:items-start s:gap-x-100">
        <div class="flex flex-col items-start w-full max-w-[37.5rem] shrink-0">
          <Wordmark :describe="site.name" size="h-40" class="text-cream" />

          <p class="type-body-sm mt-20 mb-25">{{ site.blurb }}</p>

          <Pill :to="site.register" :label="site.cta">
            <template #icon>
              <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
            </template>
          </Pill>

          <ul class="flex items-center gap-x-30 mt-30 s:mt-50 m-0 p-0 list-none">
            <li v-for="item in glyphs" :key="item.label">
              <component
                :is="item.to ? 'NuxtLink' : 'a'"
                :to="item.to"
                :href="item.href"
                :target="item.href ? '_blank' : undefined"
                :rel="item.href ? 'noopener noreferrer' : undefined"
                class="block text-cream transition-colors duration-500 ease-expo has-hover:hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                :aria-label="item.label"
              >
                <Glyph :name="item.glyph" size="w-24 h-24" />
              </component>
            </li>
          </ul>
        </div>

        <div v-if="rows.length" class="w-full mt-50 s:mt-0">
          <Accord :rows="rows" compact>
            <template #[menuSlot]>
              <ul class="m-0 p-0 list-none flex flex-col">
                <li v-for="item in routes" :key="item.label">
                  <NuxtLink
                    :to="item.to"
                    class="uline type-caption uppercase text-cream transition-colors duration-500 ease-expo has-hover:hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                    active-class="text-gold"
                  >
                    {{ item.label }}
                  </NuxtLink>
                </li>
              </ul>
            </template>
          </Accord>
        </div>
      </div>
    </div>

    <div class="border-t border-brown-dark">
      <div class="site-max --l">
        <div class="py-25 flex flex-col s:flex-row s:items-center gap-y-10 s:gap-x-30 type-caption uppercase text-brown-lifted">
          <span>{{ credits.copyright }}</span>

          <ul class="flex items-center gap-x-20 m-0 p-0 list-none">
            <li v-for="item in terms" :key="item.label">
              <NuxtLink
                :to="item.to"
                class="uline transition-colors duration-500 ease-expo has-hover:hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>

          <span class="s:ml-auto">{{ credits.house }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>
