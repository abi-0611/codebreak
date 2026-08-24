<script setup lang="ts">
import { useTally } from '~/composables/motion'

/**
 * The house figures — teardown §8.4.
 *
 * Measured row, exactly: `px-15 flex items-center gap-x-10 py-12`, mono
 * uppercase, label and value both cream.
 *
 * Note it is `gap-x-10`, NOT `justify-between`. Label and value sit adjacent
 * and left-aligned, and the box is sized by its widest row. Pushing the value
 * to the right edge is the intuitive reading and it is wrong — it turns a
 * stamped plate into a dashboard.
 */
const props = withDefaults(
  defineProps<{
    /**
     * `unit` is the reference's `$` — part of the value, not a second column.
     * A figure a buyer has to be told the unit of is a figure they will
     * mistrust, and the row is too short to carry a header.
     */
    rows: readonly { label: string; value: number; unit?: string }[]
    /**
     * Identity, not a label. This box appears in the hero AND in the menu
     * overlay; the menu one is mounted fresh on every open, and a value that
     * re-counts each time is a tell (rule 3). Two boxes showing the same
     * figures share a name and therefore share the "already counted" flag.
     */
    name: string
  }>(),
  {},
)

const box = ref<HTMLElement | null>(null)

/**
 * Survives unmount, which is the entire point — `useState` is per-request on
 * the server and persistent for the session on the client.
 */
const done = useState<string[]>('figures-run', () => [])

const values = props.rows.map((r) => r.value)
const now = useTally(box, values, () => done.value.includes(props.name))

watch(
  now,
  (list) => {
    if (list.every((n, i) => n === values[i]) && !done.value.includes(props.name)) {
      done.value = [...done.value, props.name]
    }
  },
  { deep: true },
)

/**
 * Grouped thousands. A four-figure lot count set without a separator reads as
 * a part number.
 */
const show = (n: number) => n.toLocaleString('en-GB')
</script>

<template>
  <ul
    ref="box"
    class="relative w-full divide-y divide-brown-dark border border-brown-dark rounded-[.5rem] s:min-w-[27.5rem]"
  >
    <li
      v-for="(row, i) in rows"
      :key="row.label"
      class="px-15 flex items-center gap-x-10 py-12 type-caption uppercase text-cream"
    >
      <span>{{ row.label }}</span>
      <!--
        Tabular figures: without them the digits change width as they count and
        the whole row jitters sideways for a second and a half.
      -->
      <span class="tabular-nums">{{ show(now[i] ?? 0) }}{{ row.unit ? ` ${row.unit}` : '' }}</span>
    </li>
  </ul>
</template>
