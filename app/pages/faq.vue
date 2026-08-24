<script setup lang="ts">
import { faqPage, groups } from '~/content/faq'
import { footerRows } from '~/content/home'

/**
 * `/faq` — phase 7, route 2.
 *
 * <PageBand/>, a real native `<select>` in a bordered box, then the accordion
 * grouped under Roboto Mono uppercase category labels.
 *
 * ONE <Accord/> PER GROUP, not one for the whole page. Each group is a
 * self-contained widget with its own open row and its own arrow-key cycle,
 * which is what the WAI-ARIA accordion pattern describes and what a reader
 * expects: Down from the last question in a group returns to the first
 * question in THAT group, rather than walking into the next category's
 * material without saying so.
 *
 * `start="-1"` everywhere. The home page opens its first row deliberately — it
 * is what teaches the control — and by the time a reader is here they have
 * already met it. Four groups with four rows pre-opened would be a page that
 * opens two screens tall for no reason.
 */
usePageHead(faqPage.meta)

/** `all` on the server, so the prerendered html carries every question. */
const desk = ref<string>('all')

const shown = computed(() =>
  desk.value === 'all' ? groups : groups.filter((group) => group.key === desk.value),
)

const total = computed(() => shown.value.reduce((n, group) => n + group.rows.length, 0))
</script>

<template>
  <article class="bg-black">
    <PageBand :title="faqPage.title" />

    <!-- ================================================================== -->
    <!-- 1 · THE STANDFIRST AND THE FILTER                                  -->
    <!-- ================================================================== -->
    <Band ground="darker" pad="py-40 s:py-60">
      <div class="site-max">
        <p class="type-body-lg text-cream max-w-[64rem]">{{ faqPage.lede }}</p>

        <div class="mt-30 flex flex-col s:flex-row s:items-center gap-y-20 s:gap-x-30">
          <Picker v-model="desk" :label="faqPage.filter" :options="faqPage.options" />
          <p class="type-caption uppercase text-brown-lifted" aria-live="polite">
            {{ total }} question{{ total === 1 ? '' : 's' }}
          </p>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 2 · THE GROUPS                                                     -->
    <!-- ================================================================== -->
    <Band>
      <div class="site-max">
        <section
          v-for="(group, i) in shown"
          :key="group.key"
          :aria-labelledby="`desk-${group.key}`"
          :class="i > 0 ? 'mt-60 s:mt-100' : ''"
        >
          <h2 :id="`desk-${group.key}`" class="type-h3 text-cream">{{ group.label }}</h2>
          <div class="mt-25 s:mt-30">
            <Accord :rows="group.rows" />
          </div>
        </section>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 3 · THE CLOSE                                                      -->
    <!-- ================================================================== -->
    <Band ground="darker" rule>
      <div class="site-max">
        <div class="flex flex-col items-center text-center">
          <h2 class="type-h2 text-cream">{{ faqPage.close.heading }}</h2>
          <p class="type-body-md text-cream mt-20 max-w-[56rem]">{{ faqPage.close.body }}</p>

          <Pill
            :href="faqPage.close.action.href"
            :label="faqPage.close.action.label"
            class="mt-30"
          >
            <template #icon>
              <Glyph name="mail" size="min-w-20 h-32" />
            </template>
          </Pill>
        </div>
      </div>
    </Band>

    <SiteFooter :rows="footerRows" />
  </article>
</template>
