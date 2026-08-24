<script setup lang="ts">
import { footerRows } from '~/content/home'
import type { Notice } from '~/content/legal'

/**
 * A long-form legal document — teardown §5, the `.txt` block.
 *
 * `/privacy` and `/terms` are structurally the same page: a band, a
 * standfirst, an amendment date, and a run of clauses each with a Roboto Mono
 * uppercase heading, some copy and sometimes a list. Two pages carrying two
 * copies of that template is two places for the `.txt` rhythm to drift, and
 * legal pages are exactly where nobody would notice it had.
 *
 * `.txt` does all the vertical rhythm from the stylesheet: the 25 design-px
 * gap between blocks, the 80px above a heading, the hairline-ruled list rows
 * and their bullets. Nothing here sets a margin.
 *
 * NEITHER ROUTE CARRIES A TERM OR A DECOY. A reader who works through a
 * privacy notice looking for something deserves not to be punished for it,
 * and one who finds a plant here learns the whole site is planted.
 */
defineProps<{ doc: Notice }>()
</script>

<template>
  <article class="bg-black">
    <PageBand :title="doc.title" />

    <Band>
      <div class="site-max --s">
        <p class="type-body-lg text-cream">{{ doc.lede }}</p>
        <p class="mt-20 type-caption uppercase text-brown-lifted">{{ doc.updated }}</p>

        <div class="txt mt-50 s:mt-70 type-body-md text-cream">
          <template v-for="clause in doc.clauses" :key="clause.heading">
            <!--
              h6 rather than h2, and that is the stylesheet's contract rather
              than a semantic choice made lightly: teardown §5 gives `.txt h6`
              the 80px of space above it that separates one clause from the
              next, and every heading level inside `.txt` resolves to the same
              mono treatment. The document has one h1, in the band.
            -->
            <h6>{{ clause.heading }}</h6>
            <p v-for="line in clause.body" :key="line">{{ line }}</p>
            <ul v-if="clause.list">
              <li v-for="item in clause.list" :key="item">{{ item }}</li>
            </ul>
          </template>
        </div>
      </div>
    </Band>

    <SiteFooter :rows="footerRows" />
  </article>
</template>
