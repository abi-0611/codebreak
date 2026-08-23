<script setup lang="ts">
import { useGL, type Build } from '~/composables/gl'
import { useParallax, useTurn } from '~/composables/motion'
import { drift } from '~/composables/scenes/drift'
import { disc } from '~/composables/scenes/disc'
import { mark } from '~/composables/scenes/mark'

/**
 * The one wrapper every GL scene mounts through — task 3.7.
 *
 * It exists so the decision in `capable()` is made once, the same way, for
 * every scene. Three separate mounts with three separate guards is three
 * chances for the one that carries something to be the exception.
 *
 * The still frame is what the SERVER renders, and it stays until a live frame
 * has actually been drawn (`live` flips inside the first draw, not when the
 * renderer is constructed). So the fallback is the default state of this
 * component rather than an error path, which is the only way a fallback ever
 * gets tested.
 *
 * SIZING BELONGS TO THE CALLER. The root is `relative overflow-hidden` and
 * nothing else; a section says `class="h-full-screen"` or `class="aspect-square"`
 * and the canvas fills whatever that turns out to be. A scene that carries its
 * own height is a scene that has an opinion about a layout it cannot see.
 */
const props = withDefaults(
  defineProps<{
    kind: 'drift' | 'disc' | 'mark'
    /**
     * The accessible name for the whole surface — live or fallen back. It is a
     * description of the object, never the material drawn on it: rule 1 means
     * nothing that matters may live only in a label.
     */
    describe: string
    /**
     * The committed static frame, generated in phase 5 from this same scene.
     * Absent until then, in which case the fallback is simply the section's own
     * ground.
     */
    still?: { src: string; w: number; h: number }
    /** Baked face texture for the medallion. Phase 5, task 5.4. */
    face?: string
    /** Committed outline data for the house mark. Phase 5, task 5.1. */
    outline?: string
    /** Parallax rate. Non-zero on the hero backdrop only — teardown §7 row 0. */
    rate?: number
    /**
     * Forces the static frame with no gate and no GL context. /specimen uses it
     * to put the live scene and its fallback side by side, which is the only
     * practical way to check task 3.7's requirement that the medallion's frame
     * carries its material as legibly as the live one.
     */
    flat?: boolean
  }>(),
  { rate: 0, flat: false },
)

const wrap = ref<HTMLElement | null>(null)
const glass = ref<HTMLCanvasElement | null>(null)

/**
 * The backdrop is parallaxed and never rotated; the two struck objects are
 * rotated and never parallaxed. `kind` is an authoring constant — no instance
 * of this component ever changes it — so branching on it during setup is safe,
 * and it keeps the hero from carrying a second ScrollTrigger whose only effect
 * would be to measure an element the first one is translating.
 */
const spin = props.kind === 'drift' ? { value: 0 } : useTurn(wrap)
useParallax(wrap, props.rate)

const build: Build =
  props.kind === 'disc'
    ? disc({ face: props.face, turn: spin })
    : props.kind === 'mark'
      ? mark({ d: props.outline, turn: spin })
      : drift

const { live } = useGL(wrap, glass, build, { flat: () => props.flat })
</script>

<template>
  <div
    ref="wrap"
    class="relative overflow-hidden"
    role="img"
    :aria-label="describe"
  >
    <!--
      `describe=""` deliberately: the wrapper above already carries the name,
      and announcing it twice is worse than announcing it once.
    -->
    <Plate
      v-if="still && !live"
      :src="still.src"
      :w="still.w"
      :h="still.h"
      describe=""
      priority="early"
      class="absolute inset-0"
    />
    <canvas ref="glass" class="absolute inset-0 block" aria-hidden="true" />
  </div>
</template>
