<script setup lang="ts">
import { useHandoff } from '~/composables/motion'

/**
 * The two-cell feature panel — teardown §8.7, phase 11 §11.3.2.
 *
 * "A framed media panel above a two-cell tab bar. Active tab is `bg-gold
 * text-black`, inactive is transparent with cream text; both Roboto Mono
 * uppercase. The copy below the bar swaps with the tab."
 *
 * READ THAT LAST SENTENCE EXACTLY. The COPY swaps. The media panel does not —
 * it is one frame above the bar, not one frame per cell. The first build of
 * this component gave every cell its own media slot, which is a natural
 * misreading and an expensive one: it puts a second WebGL context on the first
 * screen of the page to show the same object twice, and it leaves whoever
 * fills the second slot with nothing sensible to put in it.
 *
 * So the structure is: a shared media frame, the bar, then N `tabpanel`s
 * holding the copy — which is also the correct ARIA, because the tabpanel
 * should contain the thing the tab selects.
 *
 * THE GOLD FILL TRANSLATES; IT DOES NOT CROSS-FADE. §11.3.2 measured this off
 * the capture and it is the whole character of the control: one block of gold
 * slides from one cell to the other. Painting `bg-gold` on the active button
 * and fading it — which is what this component did before phase 11 — puts gold
 * in two places at once at every intermediate moment, and "the inactive cell is
 * never a second gold thing at lower opacity" is exactly what that fails.
 *
 * So the fill is ONE absolutely-placed block behind the buttons, `1/N` of the
 * bar wide, translated by `at * 100%` of its own width. It cannot be in two
 * cells because there is only one of it.
 *
 * WHY A CSS TRANSITION AND NOT A TWEEN. The reasoning the pinned reel records
 * for its cross-fade: a tween would have to be killed and restarted every time
 * somebody presses the other cell mid-travel, and a reader holding the arrow
 * keys down does that continuously. A transition re-targets from wherever it
 * currently is, for nothing. It is also the house precedent — `.site-head`'s
 * hide is a CSS transition on a transform for the same reason.
 *
 * `handoff` IS THE ONE PLACE SCROLL TOUCHES THIS. The closing panel is the end
 * of the reference's opening move: the backdrop crops into the plate, and as it
 * lands the panel below steps off its first cell on its own. `useHandoff`
 * reports which cell the scroll has reached and nothing else — the travel is
 * still the transition above, so there is no property with two owners. Every
 * other panel is a plain control and the prop defaults off.
 *
 * THE FIRST PRESS ENDS IT, for good and in both directions. That is measured
 * off the reference and it is also the only honest reading of a control: once
 * the reader has chosen a cell, the page does not get to choose a different
 * one behind their back. `cede()` therefore runs from `focusin` as well as from
 * `pick` — reaching the bar with the keyboard is arriving at it, and it is what
 * keeps the roving tabindex from sliding off the cell the reader is standing
 * on while the page scrolls under them.
 *
 * THE LABEL FLIP IS THE PILL'S TRICK, and it has to be. A CSS transition reads
 * its timing from the state it is moving TO, so `.cell.--on` carries a delay
 * and the base rule does not: the incoming label goes black just as the gold
 * arrives under it, and the outgoing label is cream again immediately, before
 * the gold has finished sliding off. Flipping both instantly would put black
 * on black for the length of the travel.
 *
 * THE COPY SWAP IS DISCRETE. Not a scrub and not a cross-dissolve — §11.3.2.
 * The panels sit in a `.stack` so the block is sized by the longest of them and
 * a swap cannot make the page jump, and the hidden ones are `inert` rather than
 * merely transparent, so they are out of the tab order and out of the
 * accessibility tree.
 *
 * The bar's mechanics are the WAI-ARIA tabs pattern with a ROVING TABINDEX:
 *
 *   · exactly one tab is in the tab order at a time (`tabindex="0"`), the rest
 *     are at -1. Tab therefore moves INTO the bar and then straight OUT to the
 *     panel — it does not walk through every cell;
 *   · Left/Right move between tabs and wrap, Home/End jump to the ends;
 *   · selection follows focus, which is correct for a small set of cheap
 *     panels and is what makes the arrow keys feel like a control rather than
 *     a preview.
 */
const props = withDefaults(
  defineProps<{
    tabs: readonly { label: string; body: string }[]
    /** Names the cell bar for assistive technology. Required — a bare
     *  `role="tablist"` announces as an unnamed group. */
    label: string
    start?: number
    /** The media frame's aspect. §8.7's own panel is 16/10. */
    ratio?: string
    /**
     * Let scroll advance the cells until the reader presses one. Off by
     * default — see the note above; only the closing panel asks for it.
     */
    handoff?: boolean
  }>(),
  { start: 0, ratio: 'aspect-[16/10]', handoff: false },
)

const uid = useId()
const at = ref(props.start)
const cells: (HTMLButtonElement | null)[] = props.tabs.map(() => null)

/**
 * The scroll drive, and the reader's veto over it.
 *
 * `at` stays the single source of truth for everything rendered below — the
 * step is watched INTO it rather than read alongside it, so there is never a
 * moment where the fill and `aria-selected` take their state from two owners.
 * `useHandoff` stops reporting once ceded, so the watch simply never fires
 * again; there is no second flag to keep in step with the first.
 *
 * The step is offset by `start`, because the panel opens on whichever cell the
 * caller named and the handoff advances FROM there. It cannot run off the end.
 */
const bar = ref<HTMLElement | null>(null)
const { step, cede } = useHandoff(bar, { count: props.handoff ? props.tabs.length - props.start : 0 })

watch(step, (n) => { at.value = Math.min(props.tabs.length - 1, props.start + n) })

function pick(i: number) {
  cede()
  at.value = i
  cells[i]?.focus()
}

function onKey(e: KeyboardEvent, i: number) {
  const last = props.tabs.length - 1
  const go = (n: number) => {
    e.preventDefault()
    pick(n)
  }
  if (e.key === 'ArrowRight') go(i === last ? 0 : i + 1)
  else if (e.key === 'ArrowLeft') go(i === 0 ? last : i - 1)
  else if (e.key === 'Home') go(0)
  else if (e.key === 'End') go(last)
}

/**
 * The fill's geometry, as a fraction of the BAR rather than of itself, so
 * neither number has to know how many cells there are twice.
 */
const fill = computed(() => ({
  width: `${100 / props.tabs.length}%`,
  transform: `translateX(${at.value * 100}%)`,
}))
</script>

<template>
  <div class="w-full">
    <!-- The frame. One border, one radius, no shadow — this is a plate in a
         mount, not a card. -->
    <div
      class="w-full border border-brown-dark rounded-[.5rem] overflow-hidden bg-brown-deepest"
      :class="ratio"
    >
      <slot name="media" />
    </div>

    <div
      ref="bar"
      role="tablist"
      :aria-label="label"
      class="relative mt-20 border border-brown-dark rounded-[.5rem] overflow-hidden"
      @focusin="cede"
    >
      <!--
        The travelling fill. One block, behind everything, moved by transform
        only so it stays on the compositor and never triggers layout.

        `aria-hidden` because it carries no information a screen reader is not
        already given by `aria-selected` on the button in front of it.
      -->
      <div
        class="cell__fill absolute inset-y-0 left-0 bg-gold"
        :style="fill"
        aria-hidden="true"
      />

      <div
        class="relative grid divide-x divide-brown-dark"
        :style="{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }"
      >
        <button
          v-for="(tab, i) in tabs"
          :key="tab.label"
          :id="`${uid}-t${i}`"
          :ref="(el) => { cells[i] = el as HTMLButtonElement | null }"
          type="button"
          role="tab"
          :aria-selected="at === i"
          :aria-controls="`${uid}-p${i}`"
          :tabindex="at === i ? 0 : -1"
          class="cell py-15 px-20 type-caption uppercase text-center bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
          :class="at === i ? '--on text-black' : 'text-cream has-hover:hover:text-gold'"
          @click="pick(i)"
          @keydown="onKey($event, i)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="stack mt-20">
      <div
        v-for="(tab, i) in tabs"
        :key="tab.label"
        :id="`${uid}-p${i}`"
        role="tabpanel"
        :aria-labelledby="`${uid}-t${i}`"
        :inert="at === i ? undefined : true"
        :class="at === i ? 'opacity-100' : 'opacity-0'"
      >
        <p class="type-body-md text-cream">{{ tab.body }}</p>
      </div>
    </div>
  </div>
</template>
