<script setup lang="ts">
import { broke, lost } from '~/content/legal'
import { footerRows } from '~/content/home'

/**
 * The 404 body — phase 7, route 8.
 *
 * IT IS A COMPONENT BECAUSE IT HAS TWO ENTRY POINTS, and they are not
 * interchangeable:
 *
 *   app/pages/404.vue   a real prerendered route. `nuxt generate` writes the
 *                       host's `404.html` as an empty client-rendered shell,
 *                       so without this the file a static host actually serves
 *                       for a bad URL paints nothing until JavaScript lands and
 *                       carries the HOME page's title while it waits. The hook
 *                       in nuxt.config.ts copies this route's render over it.
 *   app/error.vue       what Nuxt renders for an error raised at runtime,
 *                       including a fault that is not a 404 at all.
 *
 * One body, two doors. Two bodies would be two pages to keep in step, and the
 * one that drifted would be the one nobody visits on purpose.
 *
 * No wit, no illustration, no apology — the house does not perform
 * embarrassment. And no term and no decoy: this page stands in for any URL
 * at all, so anything on it is on every URL.
 */
const props = withDefaults(
  defineProps<{
    /**
     * True for an error that is not a missing page. Telling a reader a page
     * does not exist when it does is worse than saying nothing useful — and
     * on a fault the register may be exactly what failed, so the onward routes
     * are dropped rather than pointing them back at the wall.
     */
    fault?: boolean
  }>(),
  { fault: false },
)

const copy = computed(() => (props.fault ? broke : lost))
</script>

<template>
  <article class="bg-black">
    <PageBand :title="copy.code" />

    <Band>
      <div class="site-max --s">
        <div class="flex flex-col items-start">
          <h2 class="type-h2 text-cream">{{ copy.heading }}</h2>
          <p class="type-body-lg text-cream mt-25">{{ copy.body }}</p>

          <div class="mt-40 flex flex-wrap items-center gap-15">
            <Pill to="/" label="Back to the house">
              <template #icon>
                <Glyph name="left" size="min-w-20 h-20" />
              </template>
            </Pill>

            <template v-if="!fault">
              <Pill
                v-for="action in lost.actions"
                :key="action.label"
                :to="action.to"
                :href="action.href"
                :label="action.label"
                variant="ghost"
              >
                <template #icon>
                  <Glyph :name="action.href ? 'mail' : 'arrow'" size="min-w-20 h-32 stroke-current" />
                </template>
              </Pill>
            </template>
          </div>
        </div>
      </div>
    </Band>

    <SiteFooter :rows="footerRows" />
  </article>
</template>
