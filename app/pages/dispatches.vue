<script setup lang="ts">
import { dispatchPage, filings, groups } from '~/content/dispatches'
import { footerRows } from '~/content/home'

/**
 * `/dispatches` — the house journal. Phase 7, route 1.
 *
 * THIS ROUTE LEADS WITH THE PLATE, NOT WITH A BAND. Teardown §10 measures the
 * reference's equivalent page opening on its ornamental plate with the display
 * title beneath it, and that is not an inconsistency to tidy away: it is the
 * one page whose subject is a picture, so the picture opens it. Every other
 * secondary route gets <PageBand/>.
 *
 * The plate is the SAME plate the home page carries in section 7, rendered
 * wider. Phase 5 measured the type on it against 343px of render and recorded
 * the width at which it stops being legible; here it is given the full column
 * on a phone and 56rem from `s:` up, so it is more readable on this route
 * rather than less. The register records that as an echo of one placement,
 * not as a second one.
 */
usePageHead(dispatchPage.meta)

/**
 * The filter.
 *
 * `all` on the server and on the first paint, so the prerendered html carries
 * every card and a reader with no JavaScript gets the whole register rather
 * than an empty grid. The control narrows it; it is not what fills it.
 */
const desk = ref<string>('all')

const shown = computed(() =>
  desk.value === 'all' ? filings : filings.filter((item) => item.kind === desk.value),
)
</script>

<template>
  <article class="bg-black">
    <!-- ================================================================== -->
    <!-- 1 · THE PLATE, THE TITLE AND THE STANDFIRST                        -->
    <!-- ================================================================== -->
    <section class="relative z-2 bg-black pt-70 s:pt-80">
      <div class="site-max pt-50 s:pt-80 pb-50 s:pb-70">
        <div class="flex flex-col items-center text-center">
          <!--
            `priority="early"` is not decoration on this one. Artwork that
            carries meaning has to have painted by the time a fast scroller
            reaches it, and this plate is the first thing on the page.
          -->
          <div class="w-full max-w-[56rem]">
            <Plate
              v-bind="dispatchPage.plate"
              sizes="(min-width: 650px) 56rem, 100vw"
              fit="object-contain"
              priority="early"
            />
          </div>

          <h1 class="type-display-xl text-cream mt-40 s:mt-50">{{ dispatchPage.title }}</h1>
          <p class="type-body-lg text-cream mt-25 max-w-[64rem]">{{ dispatchPage.lede }}</p>
        </div>
      </div>
    </section>

    <!-- ================================================================== -->
    <!-- 2 · THE FILTER ROW                                                 -->
    <!-- ================================================================== -->
    <Band ground="darker" pad="py-30 s:py-40">
      <div class="site-max">
        <div class="flex flex-col s:flex-row s:items-center gap-y-20 s:gap-x-30">
          <Picker v-model="desk" :label="dispatchPage.filter" :options="groups" />
          <!--
            aria-live, because the count is the only feedback a screen-reader
            user gets that the select did anything. Without it the control
            announces its own new value and the grid silently changes size
            somewhere below.
          -->
          <p class="type-caption uppercase text-brown-lifted" aria-live="polite">
            {{ dispatchPage.count(shown.length) }}
          </p>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 3 · THE GRID — the same <Card/> the home carousel scrolls          -->
    <!-- ================================================================== -->
    <Band>
      <div class="site-max">
        <ul
          class="m-0 p-0 list-none grid grid-cols-1 s:grid-cols-3 gap-x-20 gap-y-50 s:gap-y-70"
          :aria-label="dispatchPage.label"
        >
          <li v-for="item in shown" :key="item.title">
            <Card :card="item" sizes="(min-width: 650px) 40rem, 100vw" />
          </li>
        </ul>
      </div>
    </Band>

    <SiteFooter :rows="footerRows" />
  </article>
</template>
