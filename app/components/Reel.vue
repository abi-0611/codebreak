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
  plate: { src: string; w: number; h: number; describe: string }
}

const props = defineProps<{
  stages: readonly Stage[]
  /** Names the region. The section is a landmark; it needs saying what it is. */
  label: string
}>()

const root = ref(null)
const bar = ref<HTMLElement | null>(null)

const { step, live } = usePin(root, { count: props.stages.length, bar })
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
          <Plate
            :src="stage.plate.src"
            :w="stage.plate.w"
            :h="stage.plate.h"
            :describe="stage.plate.describe"
            priority="early"
          />

          <!--
            The scrim. Cream copy over a photograph is a contrast promise the
            picture cannot keep on its own, and the caption card sits on the
            part of the frame that is least predictable.
          -->
          <div
            class="bg-gradient-to-t from-black via-black/40 to-transparent"
            aria-hidden="true"
          />

          <div class="relative h-full flex items-end">
            <div class="site-max --m w-full pb-70 s:pb-90">
              <div class="max-w-[56rem] border border-brown-dark bg-black/70 p-25 s:p-30">
                <p class="type-caption uppercase text-gold">{{ stage.tag }}</p>
                <h3 class="type-h2 text-cream mt-10">{{ stage.title }}</h3>
                <p class="type-body-md text-cream mt-15">{{ stage.body }}</p>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!--
        The progress bar. Chrome, not content: it reports the crossing, it does
        not carry any of it. motion.ts writes its scaleX with a quickSetter
        every frame, which is why it is the one continuous thing in a section
        that is otherwise entirely discrete.
      -->
      <div
        class="reel__rail absolute bottom-0 inset-x-0 h-[2px] bg-brown-dark"
        aria-hidden="true"
      >
        <div ref="bar" class="reel__bar block h-full w-full origin-left scale-x-0 bg-gold" />
      </div>
    </div>
  </Band>
</template>
