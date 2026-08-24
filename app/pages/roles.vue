<script setup lang="ts">
import { listings, rolesPage } from '~/content/roles'
import { footerRows } from '~/content/home'

/**
 * `/roles` — phase 7, route 5.
 *
 * <PageBand/>, a short block about the house, the photograph, then the open
 * posts as real listings with real detail and a real application address.
 *
 * THE PHOTOGRAPH RENDERS EDGE TO EDGE ON A PHONE, and that is a measurement
 * rather than a composition preference. Phase 5 measured the type inside this
 * frame against 375px of render and recorded in `_private/reach.json` the
 * width below which it stops clearing rule 4's floor. Inside `.site-max` a
 * 375px viewport gives it 335px — above the floor, but with the margin cut
 * fine for no reason. Outside the container it gets the width the measurement
 * assumed. From `s:` up the column is wide enough that the question does not
 * arise, so the frame is capped there instead.
 *
 * `priority="early"` for the same reason: a frame that has not painted by the
 * time a fast scroller passes it is, for that reader, a frame that was blank.
 *
 * The copy on this page never mentions the wall behind the desk. It is a
 * photograph of an office.
 */
usePageHead(rolesPage.meta)
</script>

<template>
  <article class="bg-black">
    <PageBand :title="rolesPage.title" />

    <!-- ================================================================== -->
    <!-- 1 · WHO THE HOUSE IS                                               -->
    <!-- ================================================================== -->
    <Band>
      <div class="site-max">
        <div class="flex flex-col s:flex-row s:items-start s:gap-x-100">
          <p class="type-body-lg text-cream s:w-[46%] shrink-0">{{ rolesPage.lede }}</p>
          <p class="type-body-md text-cream mt-25 s:mt-0">{{ rolesPage.body }}</p>
        </div>
      </div>

      <!-- Outside the container on a phone. See the note above. -->
      <figure class="m-0 mt-50 s:mt-70 flex flex-col items-center">
        <!--
          Capped at 90rem from `s:` up. The floor is a MOBILE floor: the
          measurement in `_private/reach.json` is taken at 375px, and a phone
          gets the full width because this frame sits outside the container.
          Nothing requires the desktop render to be as large as it will go, and
          left uncapped the notices on the wall become the largest objects on
          the page — which is camouflage rule 2 the wrong way round.
        -->
        <div class="w-full max-w-[90rem]">
          <Plate
            v-bind="rolesPage.plate"
            sizes="(min-width: 650px) 90rem, 100vw"
            priority="early"
          />
        </div>
        <figcaption class="site-max mt-15 type-body-xs text-brown-lifted">
          {{ rolesPage.caption }}
        </figcaption>
      </figure>
    </Band>

    <!-- ================================================================== -->
    <!-- 2 · THE OPEN POSTS                                                 -->
    <!-- ================================================================== -->
    <Band ground="darker">
      <div class="site-max">
        <h2 class="type-h2 text-cream">{{ rolesPage.listingsHeading }}</h2>

        <ul class="mt-40 s:mt-50 m-0 p-0 list-none border-t border-brown-dark">
          <li
            v-for="post in listings"
            :key="post.title"
            class="border-b border-brown-dark py-40 s:py-50"
          >
            <div class="flex flex-col s:flex-row s:items-start s:gap-x-100">
              <div class="s:w-[38%] shrink-0">
                <h3 class="type-h3 text-cream">{{ post.title }}</h3>

                <!--
                  Three facts, adjacent rather than justified apart — the same
                  rule the stats box follows. A label at one edge and a value
                  at the other is a dashboard.
                -->
                <dl class="m-0 mt-20 flex flex-col gap-y-8">
                  <div
                    v-for="fact in [
                      { label: rolesPage.fields.place, value: post.place },
                      { label: rolesPage.fields.desk, value: post.desk },
                      { label: rolesPage.fields.basis, value: post.basis },
                      { label: rolesPage.fields.closes, value: post.closes },
                    ]"
                    :key="fact.label"
                    class="flex items-baseline gap-x-10 type-caption uppercase"
                  >
                    <dt class="text-brown-lifted">{{ fact.label }}</dt>
                    <dd class="m-0 text-cream">{{ fact.value }}</dd>
                  </div>
                </dl>
              </div>

              <div class="mt-25 s:mt-0 flex flex-col items-start">
                <p class="type-body-md text-cream">{{ post.body }}</p>

                <h4 class="type-caption uppercase text-brown-lifted mt-30">
                  {{ rolesPage.wantsLabel }}
                </h4>
                <ul class="m-0 mt-15 p-0 list-none flex flex-col w-full">
                  <li
                    v-for="want in post.wants"
                    :key="want"
                    class="relative border-t border-brown-dark py-12 pl-25 type-body-md text-cream last:border-b last:border-brown-dark"
                  >
                    <!-- The `.txt` list's bullet, drawn as a span rather than
                         a pseudo-element so this list does not need the whole
                         long-form block wrapped around it. -->
                    <span
                      class="absolute left-8 top-[1.5em] size-[.3em] rounded-full bg-current"
                      aria-hidden="true"
                    />
                    {{ want }}
                  </li>
                </ul>

                <!--
                  The visible label is one word and the accessible name
                  carries the post. Four pills all reading "Apply" is four
                  identical links to a screen reader listing them out of
                  context; the full title on the face of the button wraps to
                  two lines and reads as a sentence. The visible text is a
                  prefix of the accessible name, which is what WCAG 2.5.3 asks
                  for.
                -->
                <Pill
                  :href="rolesPage.apply.href(post.title)"
                  :label="rolesPage.apply.label"
                  :describe="`${rolesPage.apply.label} — ${post.title}`"
                  variant="ghost"
                  class="mt-30"
                >
                  <template #icon>
                    <Glyph name="mail" size="min-w-20 h-32" />
                  </template>
                </Pill>
              </div>
            </div>
          </li>
        </ul>

        <p class="mt-30 type-body-md text-cream max-w-[64rem]">{{ rolesPage.apply.note }}</p>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 3 · THE CLOSE                                                      -->
    <!-- ================================================================== -->
    <Band>
      <div class="site-max">
        <div class="flex flex-col items-center text-center">
          <h2 class="type-h2 text-cream">{{ rolesPage.close.heading }}</h2>
          <p class="type-body-md text-cream mt-20 max-w-[56rem]">{{ rolesPage.close.body }}</p>

          <Pill
            :href="rolesPage.close.action.href"
            :label="rolesPage.close.action.label"
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
