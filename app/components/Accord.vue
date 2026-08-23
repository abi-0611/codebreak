<script setup lang="ts">
import { useLift } from '~/composables/motion'

/**
 * The accordion — teardown §8.6.
 *
 * Hairline rows. No card, no radius, no shadow. Closed: cream question, gold
 * down arrow. Open: the question turns gold, the arrow flips, and the body
 * appears in a filled `bg-brown-dark` panel.
 *
 * ACCESSIBILITY, which the reference does not do and we do:
 *
 *   · a real `<button aria-expanded>` per row, inside a heading, with
 *     `aria-controls` wired to the panel's id;
 *   · the WAI-ARIA accordion keyboard pattern — Up/Down between headers, Home
 *     and End to the ends. Tab still walks out of the widget, as it should;
 *   · `inert` on every closed panel. Without it a keyboard reader tabs into
 *     copy nobody can see, and a screen reader announces all of it. Height
 *     alone does not remove content from the tab order.
 *
 * Under reduced motion the panel snaps. It still opens; it just does not
 * travel.
 */
const props = withDefaults(
  defineProps<{
    rows: readonly { question: string; body: string }[]
    /** Open one row from the start. -1 opens none. */
    start?: number
    /** The footer's MENU accordion reuses this at a smaller scale. */
    compact?: boolean
  }>(),
  { start: -1, compact: false },
)

const uid = useId()
const open = ref(props.start)

// One ref and one lift per row, created once. The row count never changes
// after setup, so this stays a stable, deterministic set of composables.
const panels = props.rows.map(() => ref<HTMLElement | null>(null))
const lifts = panels.map((panel) => useLift(panel))

// Function refs rather than a shared string ref: how a string `ref` inside a
// v-for collects into an array has changed across Vue minors, and a template
// ref that silently stops being an array takes the keyboard nav with it.
const heads: (HTMLButtonElement | null)[] = props.rows.map(() => null)

function toggle(i: number) {
  const was = open.value
  if (was === i) {
    open.value = -1
    lifts[i]!.shut()
    return
  }
  if (was >= 0) lifts[was]!.shut()
  open.value = i
  lifts[i]!.open()
}

onMounted(() => {
  if (props.start >= 0) lifts[props.start]!.open()
})

/** WAI-ARIA accordion keyboard pattern. */
function onKey(e: KeyboardEvent, i: number) {
  const last = props.rows.length - 1
  const go = (n: number) => {
    e.preventDefault()
    heads[n]?.focus()
  }
  if (e.key === 'ArrowDown') go(i === last ? 0 : i + 1)
  else if (e.key === 'ArrowUp') go(i === 0 ? last : i - 1)
  else if (e.key === 'Home') go(0)
  else if (e.key === 'End') go(last)
}
</script>

<template>
  <div class="w-full border-t border-brown-dark">
    <div v-for="(row, i) in rows" :key="row.question" class="border-b border-brown-dark">
      <!--
        The heading level is h3 because every accordion on this site sits under
        a section h2. A button on its own is operable but gives a screen reader
        no way to skim the questions.
      -->
      <h3 class="m-0">
        <button
          :id="`${uid}-h${i}`"
          :ref="(el) => { heads[i] = el as HTMLButtonElement | null }"
          type="button"
          class="w-full flex items-center justify-between gap-x-20 text-left transition-colors duration-500 ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
          :class="[
            compact ? 'py-15 type-body-md' : 'py-25 type-body-lg',
            open === i ? 'text-gold' : 'text-cream has-hover:hover:text-gold',
          ]"
          :aria-expanded="open === i"
          :aria-controls="`${uid}-p${i}`"
          @click="toggle(i)"
          @keydown="onKey($event, i)"
        >
          <span>{{ row.question }}</span>
          <!-- The arrow is gold in both states — it is the affordance, not the
               state. What changes is which way it points. -->
          <Glyph :name="open === i ? 'up' : 'down'" size="w-20 h-20 shrink-0 text-gold" />
        </button>
      </h3>

      <div
        :id="`${uid}-p${i}`"
        :ref="(el) => { panels[i]!.value = el as HTMLElement | null }"
        role="region"
        :aria-labelledby="`${uid}-h${i}`"
        :inert="open === i ? undefined : true"
        class="overflow-hidden h-0"
      >
        <div
          class="bg-brown-dark text-cream type-body-md"
          :class="compact ? 'p-15 mb-15' : 'p-25 mb-25'"
        >
          {{ row.body }}
        </div>
      </div>
    </div>
  </div>
</template>
