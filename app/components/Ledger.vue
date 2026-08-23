<script setup lang="ts">
/**
 * The data table — teardown §8.5.
 *
 * A real `<table>`, not a grid of divs. Column headers that announce as column
 * headers are the whole reason a screen reader can read row four without
 * having memorised the header row, and no amount of `role` patching on a grid
 * gets there as cleanly.
 *
 * Scrolls sideways inside itself with a VISIBLE track (`.pull-x`), because a
 * table that can scroll and does not say so is a table with columns nobody
 * finds. `overscroll-behavior-x: contain` keeps the gesture off the page, so
 * reaching the last column does not trigger a browser back-swipe.
 *
 * The pointer handler is named `pull`. CLAUDE.md's substring trap table names
 * the alternative it replaces; a horizontally-scrolling region is exactly
 * where that word gets in.
 */
export type Lot = {
  /** Two overlapping marks: the estate, then the assay house. */
  marks: readonly { src: string; describe: string }[]
  name: string
  /** Muted middle columns. */
  cells: readonly string[]
  value: string
}

withDefaults(
  defineProps<{
    heads: readonly string[]
    rows: readonly Lot[]
    /** Names the table for assistive technology and prints above it. */
    label: string
    /** Set false to keep the caption for screen readers only. */
    showLabel?: boolean
  }>(),
  { showLabel: false },
)

const box = ref<HTMLElement | null>(null)

/**
 * Click-and-pull sideways, for a mouse.
 *
 * Three details keep it from being an annoyance:
 *   · mouse only. Touch already has momentum scrolling and hijacking it is
 *     strictly worse than the native behaviour;
 *   · a movement threshold, so a click that drifts two pixels is still a
 *     click and text selection still works;
 *   · pointer capture, so leaving the table mid-pull does not strand it.
 */
const THRESHOLD = 6
let from = 0
let at = 0
let live = false
const pulling = ref(false)

function pullStart(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !box.value) return
  live = true
  from = e.clientX
  at = box.value.scrollLeft
}

function pull(e: PointerEvent) {
  if (!live || !box.value) return
  const moved = e.clientX - from
  if (!pulling.value) {
    if (Math.abs(moved) < THRESHOLD) return
    pulling.value = true
    box.value.setPointerCapture(e.pointerId)
  }
  box.value.scrollLeft = at - moved
}

function pullEnd(e: PointerEvent) {
  if (pulling.value && box.value?.hasPointerCapture(e.pointerId)) {
    box.value.releasePointerCapture(e.pointerId)
  }
  live = false
  pulling.value = false
}
</script>

<template>
  <div
    ref="box"
    class="pull-x w-full"
    :class="pulling ? 'cursor-grabbing select-none' : 'has-hover:cursor-grab'"
    @pointerdown="pullStart"
    @pointermove="pull"
    @pointerup="pullEnd"
    @pointercancel="pullEnd"
  >
    <table class="w-full min-w-[72rem] border-collapse text-left">
      <caption
        class="type-caption uppercase text-brown-lifted text-left pb-15"
        :class="{ 'sr-only': !showLabel }"
      >
        {{ label }}
      </caption>

      <thead>
        <tr>
          <th
            v-for="(head, i) in heads"
            :key="head"
            scope="col"
            class="border border-brown-dark px-15 py-12 type-caption uppercase text-cream whitespace-nowrap"
            :class="i === heads.length - 1 ? 'text-right' : ''"
          >
            {{ head }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in rows"
          :key="row.name"
          class="border-b border-brown-dark transition-colors duration-300 ease-expo has-hover:hover:bg-brown-darker"
        >
          <th scope="row" class="px-15 py-12 font-normal">
            <span class="flex items-center gap-x-15">
              <!-- Overlapping marks. The ring is the page ground, so the discs
                   read as stacked rather than merged. -->
              <span class="flex items-center shrink-0">
                <Plate
                  v-for="(mark, m) in row.marks"
                  :key="mark.src"
                  :src="mark.src"
                  :describe="mark.describe"
                  :w="56"
                  :h="56"
                  fit="object-contain"
                  class="size-20 s:size-28 rounded-full bg-cream/10 ring-2 ring-black"
                  :class="m > 0 ? '-ml-10' : ''"
                />
              </span>
              <span class="type-body-sm text-cream whitespace-nowrap">{{ row.name }}</span>
            </span>
          </th>

          <td
            v-for="(cell, c) in row.cells"
            :key="c"
            class="px-15 py-12 type-body-xs text-brown-lifted whitespace-nowrap"
          >
            {{ cell }}
          </td>

          <td class="px-15 py-12 type-body-sm text-cream text-right tabular-nums whitespace-nowrap">
            {{ row.value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
