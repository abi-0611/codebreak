<script setup lang="ts">
import { useWipe } from '~/composables/motion'

/**
 * The pill button — teardown §8.1. The site's signature interaction.
 *
 * A gold rect is wiped across the button while a turbulence displacement map
 * tears its leading edge, so the fill bleeds in like ink instead of sliding in
 * as a straight line. The timings live in motion.ts; the geometry lives here.
 *
 * Four implementation notes that are not optional:
 *
 * 1. The filter id is generated PER INSTANCE. A shared id makes every pill on
 *    the page share one displacement map, so they all tear in lockstep — which
 *    is instantly visible and instantly wrong.
 * 2. `overflow-hidden` on the root is what clips the rect. The rect is
 *    deliberately larger than the button (x -25%, width 150%, height 140%):
 *    the torn edge has to be able to leave the frame.
 * 3. Bound on pointer AND touch AND focus. Rule 4 — an effect that only exists
 *    for a mouse does not exist for most of the people who will see this.
 * 4. The label colour flip is a CSS class, not a tween. motion.ts never touches
 *    colour; see the note at the top of that file.
 */
const props = withDefaults(
  defineProps<{
    /** Internal route. Renders a NuxtLink. */
    to?: string
    /** External URL. Renders an anchor with the safe rel. */
    href?: string
    /**
     * Marks `href` as a file to save rather than a place to go.
     *
     * It suppresses `target="_blank"`, which is the whole reason it exists: a
     * download opened in a new tab flashes a tab that immediately closes
     * itself, and on the browsers that do not honour `download` at all it
     * strands the reader on a blank page in front of a binary. `/house`'s
     * archives are the only callers.
     */
    download?: boolean
    /** Neither `to` nor `href` renders a button — the menu close, for one. */
    variant?: 'primary' | 'ghost' | 'gold'
    /** Visible text. Arrives from app/content/, never written inline.
     *  Omitted for an icon-only pill, which then REQUIRES `describe`. */
    label?: string
    /** Set when the visible label is not enough on its own. */
    describe?: string
  }>(),
  { variant: 'primary' },
)

// Deliberately loose: `ref` on `<component :is>` holds the component INSTANCE
// for NuxtLink and the element for a bare `<a>` or `<button>`. motion.ts
// normalises both — see `asElement` there.
const root = ref<unknown>(null)
const ink = ref<SVGRectElement | null>(null)
const tear = ref<SVGFEDisplacementMapElement | null>(null)

// Per instance. See note 1.
const fid = `wipe-${useId()}`

const { enter, leave, lit } = useWipe(root, { ink, tear })

const tag = computed(() => (props.to ? resolveComponent('NuxtLink') : props.href ? 'a' : 'button'))

const bind = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href && props.download) return { href: props.href, download: true }
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
  return { type: 'button' as const }
})

/**
 * The ground and the ink invert each other in every variant, so the resting
 * filled state always clears WCAG AA:
 *
 *   primary  cream ground, black label, gold ink   → black on gold, 12.45:1
 *   ghost    no ground, cream label, gold ink      → black on gold, 12.45:1
 *   gold     gold ground, black label, cream ink   → black on cream, 17.07:1
 *
 * The ghost is the one that has to move: cream sitting on gold is 1.37:1, so
 * its label flips to black. That flip is timed to land mid-wipe rather than at
 * either end, which is the least conspicuous moment for it.
 */
const skin = computed(() => ({
  primary: 'bg-cream text-black',
  ghost: 'border border-brown-dark text-cream',
  gold: 'bg-gold text-black',
}[props.variant]))

const inkFill = computed(() => (props.variant === 'gold' ? 'fill-cream' : 'fill-gold'))
</script>

<template>
  <component
    :is="tag"
    ref="root"
    v-bind="bind"
    class="pill relative inline-flex items-center justify-center h-50 px-20 rounded-full type-body-sm leading-none overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    :class="[skin, `--${variant}`, { '--lit': lit }]"
    :aria-label="describe"
    @pointerenter="enter"
    @pointerleave="leave"
    @touchstart.passive="enter"
    @touchend.passive="leave"
    @touchcancel.passive="leave"
    @focus="enter"
    @blur="leave"
  >
    <svg class="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <defs>
        <!--
          The region is much larger than the element so the displaced pixels
          have somewhere to go. Clamp it to the element and the tear is sliced
          off square, which reads as a rendering bug rather than an effect.
        -->
        <filter :id="fid" x="-30%" y="-80%" width="200%" height="260%">
          <feTurbulence
            type="fractalNoise"
            base-frequency="0.035"
            num-octaves="4"
            result="noise"
            seed="5"
          />
          <feDisplacementMap
            ref="tear"
            in="SourceGraphic"
            in2="noise"
            scale="0"
            x-channel-selector="R"
            y-channel-selector="G"
          />
        </filter>
      </defs>
      <rect
        ref="ink"
        :class="inkFill"
        x="-25%"
        y="-20%"
        width="0"
        height="140%"
        :style="{ filter: `url(#${fid})` }"
      />
    </svg>

    <span class="pill__label relative z-10 flex items-center gap-x-15">
      <!-- Conditional, not an empty text node: an icon-only pill must have
           exactly one flex child or the gap pushes its glyph off centre. -->
      <span v-if="label">{{ label }}</span>
      <slot name="icon" />
    </span>
  </component>
</template>
