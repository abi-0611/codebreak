<script setup lang="ts">
import { usePin } from '~/composables/motion'

/**
 * The pinned scene — task 3.3, teardown §7 row 5.
 *
 * A 300vh section with a viewport-tall sticky stage inside it. Four steps.
 * Each step swaps the photograph and the caption; a gold bar along the bottom
 * tracks the crossing as a whole.
 *
 * RULE 5 GOVERNS THIS COMPONENT ABSOLUTELY, because step 3 carries one of the
 * six terms — phase 4, the certificate. Everything below follows from
 * that one fact:
 *
 *   · the step index is DISCRETE. `usePin` quantises scroll progress with a
 *     dead-band; nothing here is tied to a raw scrub value, so no step is
 *     fully opaque for only a sliver of scroll;
 *   · the cross-fade is a 150ms CSS transition on a class, not a tween. A
 *     tween would have to be killed and restarted every time a fast reader
 *     crossed a boundary, and reverse playback is exactly where that falls
 *     apart. A CSS transition re-targets from wherever it is, for free;
 *   · the pin is `position: sticky`. Not a GSAP pin — see the note in
 *     motion.ts §10;
 *   · under `prefers-reduced-motion` there is NO pin at all. The DOM does not
 *     change; main.css turns the stage static, flattens the deck out of the
 *     stack, and forces every step opaque. So the four steps become four
 *     stacked blocks, all four legible, with no hydration seam and no reliance
 *     on JavaScript having run.
 *
 * `inert` is bound to `live && not current` rather than to `not current`, and
 * that asymmetry is the reason the reduced-motion layout is correct: with no
 * pin there is no "current" step, all four are on screen, and all four belong
 * in the accessibility tree.
 */
type Stage = {
  /** Roboto Mono kicker — a season, a lot, a date. */
  tag: string
  title: string
  body: string
  /** From `art()` in app/content/media.ts, so the size cannot drift. */
  plate: { src: string; w: number; h: number; describe: string; srcset?: string }
}

const props = defineProps<{
  stages: readonly Stage[]
  /** Names the region. The section is a landmark; it needs saying what it is. */
  label: string
}>()

const root = ref(null)

/**
 * One progress hairline per caption card — §11.3.6.
 *
 * A plain array rather than a reactive one: nothing in the template reads
 * it, motion.ts writes to the elements sixty times a second, and a ref would
 * put a Vue re-render on every one of those to move a scale by a percent.
 * The wrapper IS a ref only because `usePin` reads it once, on mount, after
 * the four cards exist.
 */
const bars = ref<HTMLElement[]>([])

const { step, live } = usePin(root, { count: props.stages.length, bars })
</script>

<template>
  <Band ref="root" pad="p-0" class="reel h-[300vh]" :aria-label="label">
    <div class="reel__stage sticky top-0 h-full-screen overflow-hidden">
      <div class="reel__deck stack --fill h-full">
        <article
          v-for="(stage, i) in props.stages"
          :key="stage.tag"
          class="reel__step stack --fill"
          :class="i === step ? 'opacity-100' : 'opacity-0'"
          :inert="live && i !== step"
        >
          <!--
            `priority="early"` on all four, not on the one that matters.
            Artwork that has not painted by the time a fast scroller reaches it
            is artwork that, for that reader, was blank — and a single eager
            step among three lazy ones is a step that behaves differently.

            THE `max-s:` HEIGHT IS RULE 4, MEASURED, NOT TASTE. These frames
            are 4:5. Filling a 375x812 phone screen with one scales it by
            HEIGHT and crops 11% off each side, which cuts the edges off the
            document lying on the bench — and what is left of it sits behind
            the caption card. Held to 62vh the frame is scaled by width
            instead: nothing is cropped, the document sits clear above the
            card, and what it carries lands larger than the width fit phase 5
            measured against. 62vh is the same number the reduced-motion
            layout uses, so the two agree by construction.
          -->
          <Plate
            v-bind="stage.plate"
            sizes="100vw"
            priority="early"
            class="max-s:h-[62vh] max-s:self-start"
          />

          <!--
            The scrim. Cream copy over a photograph is a contrast promise the
            picture cannot keep on its own, and the caption card sits on the
            part of the frame that is least predictable.
          -->
          <div
            class="bg-gradient-to-t from-black via-black/40 to-transparent max-s:h-[62vh] max-s:self-start"
            aria-hidden="true"
          />

          <div class="relative h-full flex items-end">
            <div class="site-max --m w-full pb-70 s:pb-90">
              <!-- Solid black, not a scrim over the photograph: the caption
                   sits on the least predictable part of the frame, and cream
                   on a translucent card is a contrast promise the picture
                   underneath cannot be relied on to keep. -->
              <div class="relative max-w-[56rem] border border-brown-dark bg-black p-25 s:p-30">
                <p class="type-caption uppercase text-gold">{{ stage.tag }}</p>
                <h3 class="type-h2 text-cream mt-10">{{ stage.title }}</h3>
                <p class="type-body-md text-cream mt-15">{{ stage.body }}</p>

                <!--
                  THE PROGRESS HAIRLINE — §11.3.6, measured across eleven frames
                  of one step: the right end travels monotonically and the LEFT
                  END NEVER MOVES. That is `origin-left` plus `scaleX`, and it is
                  why this is a scale rather than a width — a width animation
                  lays out on every frame, and a scale does not.

                  It sits ON the card, not across the stage, and it fills across
                  the STEP rather than the section. Chrome, not content: it
                  reports the crossing of the card it is attached to, and it is
                  the one place on the site where gold is a moving quantity.

                  `-bottom-[1px]` puts it ON the card’s hairline rather than
                  inside it, so the border it fills over is the border that was
                  already there — two rules on one edge would paint 2px on a site
                  where every rule is 1px.
                -->
                <div
                  :ref="(el) => { if (el) bars[i] = el as HTMLElement }"
                  class="reel__bar absolute -bottom-[1px] left-0 h-[1px] w-full origin-left scale-x-0 bg-gold"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </article>
      </div>

    </div>
  </Band>
</template>
