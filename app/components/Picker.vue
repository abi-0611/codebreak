<script setup lang="ts">
/**
 * The filter control — teardown §10, used on `/dispatches` and on `/faq`.
 *
 * A REAL, KEYBOARD-OPERABLE NATIVE `<select>` in a bordered box. Not a div
 * pretending, and phase 7 says so in those words. What native gets right and
 * a listbox rebuilt in Vue has to earn back one bug at a time: type-ahead,
 * Home and End, page up and down, the OS picker wheel on a phone, voice
 * control, and a form control that a screen reader already knows the name of.
 *
 * The box is the chrome; the control inside it is the browser's. `appearance:
 * none` strips the platform arrow so the house can draw its own, and nothing
 * else about the element is touched.
 *
 * THE MOBILE TYPE SIZE IS 16px AND THAT IS NOT A STYLE CHOICE. Safari on iOS
 * zooms the viewport when a form control smaller than 16px takes focus, and
 * `.type-caption` is 13px at a 375px viewport. The alternative fix — pinning
 * `maximum-scale` in the viewport meta — disables pinch zoom for everybody,
 * which is a far worse trade than one control being two design pixels larger
 * than the labels around it. The label matches the control so the row still
 * reads as one mono line, and from `s:` up both fall back to the caption size.
 */
const chosen = defineModel<string>({ required: true })

defineProps<{
  /** The field's own name — Roboto Mono uppercase, sitting inside the box. */
  label: string
  /** `All` first, then the categories. `value` is what the page filters on. */
  options: readonly { value: string; label: string }[]
}>()

const id = useId()

/** Caption treatment, lifted to the iOS control floor on a phone. See above. */
const field = 'font-mono font-medium uppercase text-[1.6rem] s:text-[1.4rem] leading-none'
</script>

<template>
  <div
    class="relative inline-flex items-center gap-x-15 h-50 pl-20 pr-45 rounded-[.5rem] border border-brown-dark bg-black focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold"
  >
    <label :for="id" class="shrink-0 text-brown-lifted" :class="field">{{ label }}</label>

    <select
      :id="id"
      v-model="chosen"
      class="appearance-none bg-transparent border-0 text-cream cursor-pointer focus:outline-none"
      :class="field"
    >
      <!--
        The options are painted by the platform, not by this stylesheet — the
        two colours below are the most any browser honours, and several honour
        neither. `color-scheme: dark` on the document is what actually makes
        the list dark; this is the belt to that pair of braces.
      -->
      <option v-for="item in options" :key="item.value" :value="item.value" class="bg-black text-cream">
        {{ item.label }}
      </option>
    </select>

    <!-- The house arrow, in place of the platform's. Gold is the affordance,
         exactly as it is on an accordion row. -->
    <Glyph
      name="down"
      size="w-20 h-20 absolute right-15 top-1/2 -translate-y-1/2 pointer-events-none text-gold"
    />
  </div>
</template>
