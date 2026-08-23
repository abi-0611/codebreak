<script setup lang="ts">
/**
 * The tabbed feature panel — teardown §8.7.
 *
 * A framed media panel above a tab bar. Active cell is `bg-gold text-black`,
 * inactive is transparent with cream text; both Roboto Mono uppercase. The
 * copy below the bar swaps with the tab.
 *
 * The mechanics are the WAI-ARIA tabs pattern with a ROVING TABINDEX, which is
 * the part worth being precise about:
 *
 *   · exactly one tab is in the tab order at a time (`tabindex="0"`), the rest
 *     are at -1. Tab therefore moves INTO the bar and then straight OUT to the
 *     panel — it does not walk through every cell;
 *   · Left/Right move between tabs and wrap, Home/End jump to the ends;
 *   · selection follows focus, which is correct for a small set of cheap
 *     panels and is what makes the arrow keys feel like a control rather than
 *     a preview.
 *
 * The media frame is a `.stack`, so the panel is sized by its tallest slot and
 * swapping tabs cannot make the page jump.
 */
const props = withDefaults(
  defineProps<{
    tabs: readonly { label: string; body: string }[]
    /** Names the tab bar for assistive technology. Required — a bare
     *  `role="tablist"` announces as an unnamed group. */
    label: string
    start?: number
  }>(),
  { start: 0 },
)

const uid = useId()
const at = ref(props.start)
const cells: (HTMLButtonElement | null)[] = props.tabs.map(() => null)

function pick(i: number) {
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
</script>

<template>
  <div class="w-full">
    <!-- The frame. One border, one radius, no shadow — this is a plate in a
         mount, not a card. -->
    <div class="stack --fill w-full aspect-[16/10] border border-brown-dark rounded-[.5rem] overflow-hidden bg-brown-deepest">
      <div
        v-for="(tab, i) in tabs"
        :key="tab.label"
        :id="`${uid}-p${i}`"
        role="tabpanel"
        :aria-labelledby="`${uid}-t${i}`"
        :inert="at === i ? undefined : true"
        class="w-full h-full transition-opacity duration-500 ease-expo"
        :class="at === i ? 'opacity-100' : 'opacity-0'"
      >
        <slot :name="`media-${i}`" :tab="tab" />
      </div>
    </div>

    <div
      :id="`${uid}-bar`"
      role="tablist"
      :aria-label="label"
      class="mt-20 grid border border-brown-dark rounded-[.5rem] overflow-hidden divide-x divide-brown-dark"
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
        class="py-15 px-20 type-caption uppercase text-center transition-colors duration-500 ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
        :class="at === i ? 'bg-gold text-black' : 'bg-transparent text-cream has-hover:hover:text-gold'"
        @click="pick(i)"
        @keydown="onKey($event, i)"
      >
        {{ tab.label }}
      </button>
    </div>

    <p class="mt-20 type-body-md text-cream">
      {{ tabs[at]?.body }}
    </p>
  </div>
</template>
