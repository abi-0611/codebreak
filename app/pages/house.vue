<script setup lang="ts">
import { downloads, housePage, sizeOf } from '~/content/house'
import { kit } from '~/content/kit'
import { footerRows } from '~/content/home'
import { site } from '~/content/site'

/**
 * `/house` — phase 7, route 3, standing in for the reference's `/brand`.
 *
 * <PageBand/>, the charter and the arms, download cards on `brown-deepest`
 * with a pill and a file-size label, then the lockups on alternating grounds.
 *
 * THE DOWNLOADS RESOLVE TO REAL FILES. scripts/kit.mjs writes three archives
 * into public/dl/ and app/content/kit.ts records what each one weighs, so the
 * size label beside each pill is a measurement rather than a number somebody
 * typed. A 404 on a download link is rule 8, and a label that says 41 KB
 * beside a 63 KB file is the kind of small lie a reader catches.
 *
 * The pills carry <Pill/>'s `download` flag, which is what makes a browser
 * save the archive rather than navigate to a binary. It also suppresses the
 * `target="_blank"` an external href would otherwise get: a download opened in
 * a new tab flashes a tab that immediately closes itself, and on a browser
 * that ignores `download` it strands the reader on a blank page in front of a
 * binary. That flag exists for these three links and nothing else.
 */
usePageHead(housePage.meta)

/** The three panels' grounds, mapped to the tokens once rather than per panel. */
const GROUNDS = {
  black: 'bg-black',
  darker: 'bg-brown-darker',
  deepest: 'bg-brown-deepest',
} as const
</script>

<template>
  <article class="bg-black">
    <PageBand :title="housePage.title" />

    <!-- ================================================================== -->
    <!-- 1 · THE CHARTER                                                    -->
    <!-- ================================================================== -->
    <Band>
      <div class="site-max">
        <div class="flex flex-col s:flex-row s:items-start s:gap-x-100">
          <p class="type-body-lg text-cream s:w-[46%] shrink-0">{{ housePage.lede }}</p>

          <div class="mt-25 s:mt-0 flex flex-col gap-y-20">
            <p v-for="line in housePage.body" :key="line" class="type-body-md text-cream">
              {{ line }}
            </p>
          </div>
        </div>

        <!--
          Three figures, adjacent rather than justified apart — the same rule
          the stats box and the medallion's rows follow. A label pushed to one
          edge and a figure to the other is a dashboard; this is a plate.
        -->
        <dl
          class="mt-50 s:mt-70 m-0 grid grid-cols-1 s:grid-cols-3 border-t border-brown-dark"
        >
          <div
            v-for="row in housePage.figures"
            :key="row.label"
            class="flex items-center gap-x-10 border-b border-brown-dark py-15 s:py-20 s:px-30 s:border-b-0 s:border-r s:last:border-r-0 s:first:pl-0 type-caption uppercase text-cream"
          >
            <dt>{{ row.label }}</dt>
            <dd class="m-0 tabular-nums">{{ row.value }}</dd>
          </div>
        </dl>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 2 · THE ARMS                                                       -->
    <!-- ================================================================== -->
    <Band ground="darker">
      <div class="site-max">
        <div class="flex flex-col s:flex-row s:items-start s:gap-x-100">
          <div class="w-full s:w-[36%] shrink-0">
            <div class="relative aspect-square overflow-hidden border border-brown-dark stack --c --fill">
              <Plate
                v-bind="housePage.arms.plate"
                sizes="(min-width: 650px) 46rem, 100vw"
                class="opacity-40"
              />
              <Sigil :describe="`The ${site.name} device`" size="h-[16rem] s:h-[22rem]" class="relative z-2 text-cream" />
            </div>
          </div>

          <div class="mt-30 s:mt-0 flex flex-col items-start">
            <h2 class="type-h2 text-cream">{{ housePage.arms.heading }}</h2>
            <!--
              The blazon is set as a quotation because it is one: it is the
              wording on the grant, not a description written for this page.
            -->
            <blockquote class="m-0 mt-20 border-l border-brown-dark pl-20">
              <p class="type-body-lg text-cream">{{ housePage.arms.blazon }}</p>
            </blockquote>
            <p class="type-body-md text-cream mt-20">{{ housePage.arms.body }}</p>
          </div>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 3 · THE SEALS                                                      -->
    <!-- ================================================================== -->
    <Band>
      <div class="site-max">
        <h2 class="type-h2 text-cream">{{ housePage.seals.heading }}</h2>
        <div class="mt-25 flex flex-col gap-y-20 max-w-[80rem]">
          <p v-for="line in housePage.seals.body" :key="line" class="type-body-md text-cream">
            {{ line }}
          </p>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 4 · THE DOWNLOADS — cards on brown-deepest                         -->
    <!-- ================================================================== -->
    <!-- No centre rule on this one. Teardown §7 puts the vertical hairline
         behind the seal and behind the dispatches plate and never on a section
         carrying running copy — and here it would run straight through three
         cards, which reads as a mistake rather than as a spine. -->
    <Band ground="darker">
      <div class="site-max">
        <div class="flex flex-col items-center text-center">
          <h2 class="type-h2 text-cream">{{ housePage.kit.heading }}</h2>
          <p class="type-body-md text-cream mt-20 max-w-[64rem]">{{ housePage.kit.body }}</p>
        </div>

        <ul class="mt-50 s:mt-70 m-0 p-0 list-none grid grid-cols-1 s:grid-cols-3 gap-20">
          <li
            v-for="item in downloads"
            :key="item.key"
            class="flex flex-col items-start p-25 s:p-30 rounded-[.5rem] border border-brown-dark bg-brown-deepest"
          >
            <!--
              Cream on `brown-deepest`, never the lifted brown: that pairing
              measures 4.03:1 and is the one ground the deviation is NOT
              approved on. tokens/palette.mjs records it.
            -->
            <h3 class="type-h3 text-cream">{{ item.title }}</h3>
            <p class="type-body-md text-cream mt-15 flex-1">{{ item.body }}</p>

            <!--
              One meta line, not a file listing. The whole kit holds nine
              files and the mark holds five, so listing contents would make
              one card half again as tall as the other two — and a member of a
              set that differs is the member everybody looks at.
            -->
            <p class="mt-20 pt-15 w-full border-t border-brown-dark type-caption uppercase text-cream tabular-nums">
              ZIP · {{ kit[item.key].holds.length }} files · {{ sizeOf(item.key) }}
            </p>

            <Pill :href="kit[item.key].file" download :label="item.action" class="mt-20">
              <template #icon>
                <Glyph name="down" size="min-w-20 h-20" />
              </template>
            </Pill>
          </li>
        </ul>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 5 · THE LOCKUPS, ON ALTERNATING GROUNDS                            -->
    <!-- ================================================================== -->
    <Band>
      <div class="site-max">
        <h2 class="type-h2 text-cream">{{ housePage.lockups.heading }}</h2>
        <p class="type-body-md text-cream mt-20 max-w-[64rem]">{{ housePage.lockups.body }}</p>
      </div>

      <!--
        Outside the container and hairline-divided rather than gapped, so the
        three panels read as one ruled plate with three cells. Same treatment
        as the link tiles on the home page, for the same reason.
      -->
      <ul class="mt-40 s:mt-60 m-0 p-0 list-none grid grid-cols-1 s:grid-cols-3 border-t border-brown-dark">
        <li
          v-for="panel in housePage.lockups.panels"
          :key="panel.label"
          class="flex flex-col items-center justify-center gap-y-25 px-20 py-60 s:py-80 border-b border-brown-dark s:border-b-0 s:border-r s:last:border-r-0"
          :class="GROUNDS[panel.ground]"
        >
          <Wordmark
            v-if="panel.kind === 'wordmark'"
            :describe="site.name"
            size="h-30 s:h-40"
            class="text-cream"
          />
          <Sigil v-else :describe="`The ${site.name} device`" size="h-64 s:h-80" class="text-cream" />

          <!--
            Cream on all three, not the lifted brown. The lifted brown clears
            AA on black and on `brown-darker` but measures 4.03:1 on
            `brown-deepest`, and these three labels are one set — the member
            that had to be recoloured would be the member everybody looks at.
          -->
          <span class="type-caption uppercase text-cream text-center">{{ panel.label }}</span>
        </li>
      </ul>
    </Band>

    <!-- ================================================================== -->
    <!-- 6 · THE CLOSE                                                      -->
    <!-- ================================================================== -->
    <Band ground="darker">
      <div class="site-max">
        <div class="flex flex-col items-center text-center">
          <h2 class="type-h2 text-cream">{{ housePage.close.heading }}</h2>
          <p class="type-body-md text-cream mt-20 max-w-[56rem]">{{ housePage.close.body }}</p>

          <Pill
            :href="housePage.close.action.href"
            :label="housePage.close.action.label"
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
