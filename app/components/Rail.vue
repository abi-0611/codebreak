<script setup lang="ts">
import { useStops } from '~/composables/motion'

/**
 * The fixed section rail — phase 11 §11.4.
 *
 * Left edge, full height, above the sections. Eight items in the mono face,
 * uppercase; inactive in `brown-lifted`, active in cream at a heavier weight;
 * the house mark travels down the list to whichever section is being read; the
 * ends of the list fade out.
 *
 * IT IS NAVIGATION, NOT AN INDICATOR. §11.7 forbids the site a scroll-progress
 * bar, a section counter and a scroll hint — every one of those is a step
 * toward the page announcing itself. What keeps this on the right side of that
 * line is that it is a real `<nav>` of real links to real anchors, reachable
 * by keyboard, carrying `aria-current`, which happens to know where you are.
 * Take the links away and it becomes the thing that is forbidden.
 *
 * THREE THINGS THAT ARE EASY TO GET WRONG HERE, all named in §11.4:
 *
 *   the marker LANDS      It moves on the same discrete boundaries the
 *                         sections do — see `useStops`. A marker that scrubs
 *                         between two items is a progress indicator wearing a
 *                         glyph.
 *   it must not trap      `position: fixed` over the content is one careless
 *                         step from an overlay that swallows the page. The
 *                         root is `pointer-events-none` and only the links
 *                         take pointer events back, so every pixel of the
 *                         column that is not a label belongs to the section
 *                         underneath it.
 *   375px                 See below. It may not become a hover-only anything.
 *
 * WHAT IT BECOMES ON A PHONE: nothing, deliberately.
 *
 * At 375px the column IS the viewport. Eight mono labels down the left edge
 * take roughly a third of it and sit over the copy for the whole page — which
 * is not a rail, it is an obstruction. The alternatives were considered and
 * rejected: a horizontal strip is furniture the reference does not have and
 * would need somewhere to live that the header does not already occupy; a
 * label-less marker column is decoration that navigates nowhere. So below `s:`
 * the rail is `display: none`, which also takes it out of the accessibility
 * tree rather than leaving a screen-reader user a second navigation to walk
 * past. A phone's navigation is the menu overlay: a tap, already built, and
 * already listing the house's routes.
 *
 * That is a decision rather than an omission, and it costs nothing rule 4
 * protects — rule 4 is about MARKED surfaces being reachable on a phone, and
 * this rail carries none. Every section it points at is reached by scrolling
 * to it, which is what a reader on a phone does regardless.
 *
 * WHY IT RENDERS NOTHING ON THE SERVER. The stops are resolved from the ids
 * actually present in the document, at mount. So the prerendered HTML carries
 * an empty rail and a reader whose JavaScript never arrives gets no rail at
 * all — which is the right failure. `useReveal` takes the opposite decision
 * for sections (start visible, so a no-JS reader gets the page rather than a
 * blank column) and the difference is the point: a section is the page, and
 * this is chrome whose whole contract is "absent over the hero". Chrome that
 * cannot know where the reader is should not be on screen guessing.
 */
const props = defineProps<{
  /** `{ id, label }` per section — see `spine` in app/content/home.ts. */
  stops: readonly { id: string; label: string }[]
  /** Names this nav. There are two on the page; they cannot both be unnamed. */
  label: string
  /**
   * The id of the block whose departure reveals the rail — the hero's copy.
   * §11.1 measures the rail as absent for every hero dwell in the capture,
   * without exception.
   */
  gate: string
}>()

const list = ref<HTMLElement | null>(null)
const glyph = ref<HTMLElement | null>(null)
const gate = ref<Element | null>(null)

/**
 * The sections themselves, resolved from their ids once the page is mounted.
 *
 * A stop whose anchor is not on the page is dropped rather than rendered as a
 * link to nowhere — rule 8. In development it also says so, because a silently
 * shorter rail is exactly the kind of thing that survives a review: seven
 * items still looks like a rail.
 *
 * THIS onMounted IS REGISTERED BEFORE `useStops` IS CALLED, and that ordering
 * is load-bearing rather than incidental. Vue runs mounted hooks in
 * registration order, and `useStops` builds its triggers inside a hook of its
 * own — so resolving the nodes here first is what guarantees it is handed a
 * populated list rather than an empty one.
 */
const found = ref<{ id: string; label: string; node: Element }[]>([])
const nodes = computed(() => found.value.map((stop) => stop.node))

onMounted(() => {
  gate.value = document.getElementById(props.gate)

  const rows: { id: string; label: string; node: Element }[] = []
  for (const stop of props.stops) {
    const node = document.getElementById(stop.id)
    if (node) rows.push({ ...stop, node })
    else if (import.meta.dev) {
      console.warn(
        `[Rail] no section carries id="${stop.id}". The rail is navigation, so ` +
          'a stop with no anchor is dropped rather than rendered as a dead link. ' +
          'Add the id to the section, or take the stop out of `spine`.',
      )
    }
  }
  found.value = rows
})

const { at, shown, goTo } = useStops(nodes, { gate, mark: glyph, list })

/**
 * Clicking is intercepted so the jump can go through Lenis where Lenis owns
 * the scroll position — see `goTo` in motion.ts. The `href` is left real and
 * untouched, so middle-click, ctrl-click, "copy link address" and a reader
 * with no JavaScript at all still get the ordinary anchor.
 *
 * `replaceState` RATHER THAN THE PUSH A NATIVE ANCHOR WOULD DO, deliberately.
 * The address bar should say where you are, so the link is worth copying — but
 * a reader who walks four stops down the rail and then reaches for Back means
 * "leave this page", not "undo three quarters of a scroll". Native anchor
 * behaviour would give them four presses of almost nothing first.
 */
function press(e: MouseEvent, node: Element) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  goTo(node)
  history.replaceState(history.state, '', `#${node.id}`)
}
</script>

<template>
  <nav
    v-if="found.length"
    class="rail hidden s:flex fixed left-0 top-0 h-full-screen z-3 items-center pl-20 pointer-events-none transition-opacity duration-500 ease-expo2"
    :class="shown ? 'opacity-100' : 'opacity-0'"
    :aria-label="label"
    :inert="!shown || undefined"
  >
    <div class="rail__fade relative max-h-full">
      <!--
        The travelling mark. `aria-hidden` because it says nothing a screen
        reader is not already told by `aria-current` on the link beside it, and
        a glyph announcing "current section" next to a link announcing "current"
        says it twice.

        Absolutely placed and moved by transform only, so it never takes part
        in the list's layout and can never change where an item is. motion.ts
        owns the travel; this file owns only where it starts.
      -->
      <span
        ref="glyph"
        class="absolute left-0 top-0 text-gold will-change-transform"
        aria-hidden="true"
      >
        <Sigil size="h-14" describe="" />
      </span>

      <ul ref="list" class="m-0 p-0 pl-30 list-none">
        <li v-for="(stop, i) in found" :key="stop.id">
          <a
            :href="`#${stop.id}`"
            class="block py-8 type-caption uppercase whitespace-nowrap pointer-events-auto transition-colors duration-500 ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            :class="i === at ? 'text-cream font-semibold' : 'text-brown-lifted has-hover:hover:text-cream'"
            :aria-current="i === at ? 'true' : undefined"
            @click="press($event, stop.node)"
          >
            {{ stop.label }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>
