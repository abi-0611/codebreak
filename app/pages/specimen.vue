<script setup lang="ts">
import { palette } from '~~/tokens/palette.mjs'
import { setTimeScale, useReduced, triggerCount } from '~/composables/motion'
import { site, nav, figures } from '~/content/site'
import {
  ledgerHeads, ledgerRows, questions, tabs, cards, tiles, bodies, footerRows, prose,
  reel, scenes,
} from '~/content/specimen'

/**
 * /specimen — the design system, rendered.
 *
 * Dev only. nuxt.config.ts strips this route from a production build, so the
 * page component and everything only it imports are never emitted.
 *
 * This is what phase 8 diffs against the reference, and building it now is the
 * whole reason that audit is cheap later. It is not a nice-to-have: a token
 * that is wrong by 0.05rem is invisible in a composed page and obvious in a
 * ramp, and a component state nobody has laid eyes on is a component state
 * that is broken.
 *
 * Everything on this page reads its values from the SAME place the site does —
 * tokens/palette.mjs for colour, the compiled stylesheet for type. Nothing
 * here restates a value, because a specimen that restates values can agree
 * with itself while disagreeing with the build.
 */
useHead({ title: `${site.name} — specimen` })

const reduced = useReduced()

/**
 * Phase 3 exit criterion: navigating away from this route and back must leave
 * this number unchanged. Every trigger on the site is built inside a
 * gsap.context() that is reverted on unmount, so it should — but a leak is
 * invisible until somebody counts, and nobody counts without a readout.
 */
const triggers = ref(0)
onMounted(() => {
  // Polled, not sampled once. Two reasons: hydration finishes building child
  // contexts after this component's own onMounted, so a single read lands on
  // zero; and the count is SUPPOSED to fall as the `once` reveals fire and
  // kill themselves. Watching it move is the point.
  const beat = setInterval(() => { triggers.value = triggerCount() }, 500)
  onBeforeUnmount(() => clearInterval(beat))
})

/* -------------------------------------------------------------------------- */
/* colour                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The chip class is written out per token rather than composed, because
 * Tailwind scans source text: a class built at runtime is a class that was
 * never compiled, and the swatch would be transparent.
 */
const SWATCHES = [
  { token: 'black', chip: 'bg-black', role: 'Page ground' },
  { token: 'cream', chip: 'bg-cream', role: 'All body copy and headlines' },
  { token: 'gold', chip: 'bg-gold', role: 'State only — never a heading' },
  { token: 'brown', chip: 'bg-brown', role: 'Mid rules; text use is deviated' },
  { token: 'brown-dark', chip: 'bg-brown-dark', role: 'Every hairline on the site' },
  { token: 'brown-darker', chip: 'bg-brown-darker', role: 'Alternating section ground' },
  { token: 'brown-deepest', chip: 'bg-brown-deepest', role: 'Card and panel fill' },
  { token: 'brown-lifted', chip: 'bg-brown-lifted', role: 'Meta copy — the AA substitute' },
] as const

function channel(v: number) {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const swatches = computed(() =>
  SWATCHES.map((s) => {
    const hex = (palette as Record<string, string>)[s.token]!
    const onBlack = ratio(hex, palette.black)
    return { ...s, hex, onBlack, aa: onBlack >= 4.5 }
  }),
)

/* -------------------------------------------------------------------------- */
/* type                                                                       */
/* -------------------------------------------------------------------------- */

const RAMP = [
  { cls: 'type-display-xl', spec: '5.85rem → 10rem · lh .75 · Funnel Display 300' },
  { cls: 'type-h2', spec: '2.8rem → 4.9rem · lh 1 · Funnel Display 300' },
  { cls: 'type-h3', spec: '2rem → 2.5rem · lh 1 · Roboto Mono 400 · uppercase' },
  { cls: 'type-body-lg', spec: '1.8rem → 2.4rem · lh 1.2 · Host Grotesk' },
  { cls: 'type-body-md', spec: '1.6rem → 1.8rem · lh 1.4 · Host Grotesk' },
  { cls: 'type-body-sm', spec: '1.6rem · lh 1.4 · Host Grotesk' },
  { cls: 'type-body-xs', spec: '1.4rem → 1.5rem · lh 1.35 · Host Grotesk' },
  { cls: 'type-caption', spec: '1.3rem → 1.4rem · lh 1.6 · Roboto Mono 500' },
] as const

const samples: Record<string, HTMLElement | null> = {}
const measured = ref<Record<string, string>>({})
const root = ref('')
const width = ref(0)

/**
 * Reads what the browser ACTUALLY computed, live, at the current width.
 *
 * The exit criterion for this phase is "verified by computed style at 375px
 * and 1440px", and this is the instrument for it. A transcription error in the
 * ramp is invisible against a spec written next to it and unmissable against a
 * measurement.
 */
function measure() {
  if (!import.meta.client) return
  root.value = getComputedStyle(document.documentElement).fontSize
  width.value = window.innerWidth
  const next: Record<string, string> = {}
  for (const { cls } of RAMP) {
    const el = samples[cls]
    if (!el) continue
    const cs = getComputedStyle(el)
    const px = Number.parseFloat(cs.fontSize)
    const rem = px / Number.parseFloat(root.value || '1')
    next[cls] =
      `${cs.fontSize} (${rem.toFixed(2)}rem) · lh ${cs.lineHeight} · ` +
      `${cs.fontWeight} · tracking ${cs.letterSpacing}`
  }
  measured.value = next
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure, { passive: true })
  onBeforeUnmount(() => window.removeEventListener('resize', measure))
})

/* -------------------------------------------------------------------------- */
/* motion                                                                     */
/* -------------------------------------------------------------------------- */

const rate = ref(1)
function setRate(n: number) {
  rate.value = n
  setTimeScale(n)
}

const GLYPHS = ['arrow', 'right', 'left', 'down', 'up', 'mail', 'note', 'pin', 'feed', 'grid', 'play'] as const
</script>

<template>
  <article class="pt-70 s:pt-80">
    <!-- ---------------------------------------------------------------- -->
    <Band pad="pt-60 pb-40">
      <div class="site-max">
        <p class="type-caption uppercase text-gold">Phase 2 · design system</p>
        <h1 class="type-display-xl text-cream mt-20">Specimen</h1>
        <p class="type-body-lg text-cream mt-25 max-w-[60rem]">
          Every token and every component in the build, in every state.
          Dev only — this route is stripped from a production build.
        </p>

        <dl class="mt-40 grid grid-cols-2 s:grid-cols-4 gap-20 type-caption uppercase">
          <div v-for="[k, v] in [['Viewport', `${width}px`], ['Root font', root], ['1rem', '10 design px'], ['Reduced motion', reduced ? 'on' : 'off']]" :key="k" class="border border-brown-dark rounded-[.5rem] p-15">
            <dt class="text-brown-lifted">{{ k }}</dt>
            <dd class="text-cream m-0 mt-5 tabular-nums">{{ v }}</dd>
          </div>
        </dl>
      </div>
    </Band>

    <!-- COLOUR ---------------------------------------------------------- -->
    <Band ground="darker">
      <div class="site-max">
        <h2 class="type-h3 text-cream">Colour · teardown §4</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Read from <code class="text-gold">tokens/palette.mjs</code>, the single
          definition site. Ratios are computed here, in the browser, against the
          page ground.
        </p>

        <ul class="mt-30 grid grid-cols-1 s:grid-cols-2 gap-20 m-0 p-0 list-none">
          <li
            v-for="s in swatches"
            :key="s.token"
            class="flex items-stretch gap-x-20 border border-brown-dark rounded-[.5rem] overflow-hidden"
          >
            <span class="w-80 shrink-0 border-r border-brown-dark" :class="s.chip" />
            <span class="flex-1 py-15 pr-15">
              <span class="block type-caption uppercase text-cream">{{ s.token }}</span>
              <span class="block type-body-xs text-brown-lifted mt-5">{{ s.role }}</span>
              <span class="block type-caption text-cream mt-10 tabular-nums">
                {{ s.hex }} · {{ s.onBlack.toFixed(2) }}:1 on black
                <span :class="s.aa ? 'text-gold' : 'text-brown-lifted'">
                  {{ s.aa ? '· AA' : '· below AA for text' }}
                </span>
              </span>
            </span>
          </li>
        </ul>
      </div>
    </Band>

    <!-- TYPE ------------------------------------------------------------ -->
    <Band>
      <div class="site-max">
        <h2 class="type-h3 text-cream">Type · teardown §5</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Eight classes. Letter-spacing is <strong>normal</strong> on every one
          of them — the reading below is the browser's, not the spec's.
        </p>

        <div class="mt-30 border-t border-brown-dark">
          <div v-for="item in RAMP" :key="item.cls" class="border-b border-brown-dark py-25">
            <div class="flex flex-col s:flex-row s:items-baseline s:justify-between gap-y-5 gap-x-20">
              <code class="type-caption uppercase text-gold">.{{ item.cls }}</code>
              <span class="type-body-xs text-brown-lifted">{{ item.spec }}</span>
            </div>
            <p
              :ref="(el) => { samples[item.cls] = el as HTMLElement | null }"
              :class="item.cls"
              class="text-cream mt-15 m-0"
            >
              Grown, graded, sealed.
            </p>
            <p class="type-caption text-brown-lifted mt-10 tabular-nums m-0">
              computed · {{ measured[item.cls] ?? '—' }}
            </p>
          </div>
        </div>
      </div>
    </Band>

    <!-- .txt ------------------------------------------------------------ -->
    <Band ground="darker">
      <div class="site-max --s">
        <h2 class="type-h3 text-cream">Long-form · the <code class="text-gold">.txt</code> block</h2>
        <div class="txt text-cream mt-30 type-body-md">
          <h6>{{ prose.head }}</h6>
          <p>{{ prose.lead }}</p>
          <ul>
            <li v-for="line in prose.list" :key="line">{{ line }}</li>
          </ul>
          <p>{{ prose.tail }}</p>
        </div>
      </div>
    </Band>

    <!-- PILL ------------------------------------------------------------ -->
    <Band>
      <div class="site-max">
        <h2 class="type-h3 text-cream">Pill · teardown §8.1</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          The signature interaction. Hover, tap or focus any of them. Each
          carries its own filter id — if they tear in lockstep, that is the bug.
        </p>

        <div class="mt-30 flex flex-wrap items-center gap-20">
          <Pill :to="site.home" :label="site.cta">
            <template #icon><Glyph name="arrow" size="min-w-20 h-32 stroke-current" /></template>
          </Pill>
          <Pill variant="ghost" :to="site.home" label="View the ledger">
            <template #icon><Glyph name="arrow" size="min-w-20 h-32 stroke-current" /></template>
          </Pill>
          <Pill variant="gold" :to="site.home" label="Request a lot" />
          <Pill href="mailto:ledger@crocaria.example" label="Dispatch" variant="ghost">
            <template #icon><Glyph name="mail" size="min-w-20 h-32" /></template>
          </Pill>
          <Pill variant="gold" describe="Close" class="!size-44 !px-0">
            <template #icon><Glyph name="up" size="w-20 h-20 rotate-45" /></template>
          </Pill>
        </div>

        <div class="mt-30 flex flex-wrap items-center gap-15">
          <span class="type-caption uppercase text-brown-lifted">Global time scale</span>
          <button
            v-for="n in [1, 0.25]"
            :key="n"
            type="button"
            class="type-caption uppercase px-15 py-10 rounded-[.5rem] border border-brown-dark transition-colors duration-300 ease-expo"
            :class="rate === n ? 'bg-gold text-black' : 'text-cream has-hover:hover:text-gold'"
            @click="setRate(n)"
          >
            {{ n }}×
          </button>
          <span class="type-body-xs text-brown-lifted">
            0.25× is the fidelity check — open the reference beside it.
          </span>
        </div>
      </div>
    </Band>

    <!-- WORDMARK + GLYPHS ----------------------------------------------- -->
    <Band ground="darker">
      <div class="site-max">
        <h2 class="type-h3 text-cream">Lockup and glyphs</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          The lockup is a <strong>mask-image</strong> of outlined paths, not
          text — technique T-B. Select across it: there is nothing to select,
          and find-in-page cannot match it. It inherits
          <code class="text-gold">currentColor</code>.
        </p>

        <div class="mt-30 flex flex-wrap items-end gap-x-40 gap-y-25">
          <Wordmark :describe="site.name" size="h-40" class="text-cream" />
          <Wordmark :describe="site.name" size="h-40" class="text-gold" />
          <Wordmark name="short" :describe="site.name" size="h-40" class="text-brown-lifted" />
        </div>

        <ul class="mt-40 flex flex-wrap gap-20 m-0 p-0 list-none">
          <li
            v-for="g in GLYPHS"
            :key="g"
            class="flex flex-col items-center gap-y-10 w-70 py-15 border border-brown-dark rounded-[.5rem] text-cream"
          >
            <Glyph :name="g" size="w-24 h-24" />
            <span class="type-caption text-brown-lifted">{{ g }}</span>
          </li>
        </ul>
      </div>
    </Band>

    <!-- STATS + LEDGER --------------------------------------------------- -->
    <Band>
      <div class="site-max">
        <h2 class="type-h3 text-cream">Stat box · teardown §8.4</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Rows are <code class="text-gold">gap-x-10</code>, not
          <code class="text-gold">justify-between</code>. Values count once and
          never re-run — open the menu afterwards and they will be static.
        </p>
        <div class="mt-30 s:max-w-[40rem]">
          <StatBox :rows="figures" name="house" />
        </div>

        <h2 class="type-h3 text-cream mt-60">Ledger · teardown §8.5</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Scrolls sideways with a visible track. On a desktop you can also pull
          it with the mouse — the handler is named <code class="text-gold">pull</code>.
        </p>
        <div class="mt-30">
          <Ledger
            :heads="ledgerHeads"
            :rows="ledgerRows"
            label="Open lots, current season"
            show-label
          />
        </div>
      </div>
    </Band>

    <!-- ACCORDION + TABS -------------------------------------------------- -->
    <Band ground="darker">
      <div class="site-max">
        <h2 class="type-h3 text-cream">Accordion · teardown §8.6</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Tab to a row, then Up, Down, Home and End. Closed panels are
          <code class="text-gold">inert</code>, so Tab does not walk into copy
          nobody can see.
        </p>
        <div class="mt-30">
          <Accord :rows="questions" />
        </div>

        <h2 class="type-h3 text-cream mt-60">Tabs · teardown §8.7</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Roving tabindex: Tab enters the bar once and leaves once, Left and
          Right move between cells and wrap.
        </p>
        <div class="mt-30 s:max-w-[70rem]">
          <TabPanel :tabs="tabs" label="House process">
            <template #media-0>
              <Plate :src="cards[0].plate.src" describe="" :w="640" :h="854" />
            </template>
            <template #media-1>
              <Plate :src="cards[1].plate.src" describe="" :w="640" :h="854" />
            </template>
          </TabPanel>
        </div>
      </div>
    </Band>

    <!-- CAROUSEL --------------------------------------------------------- -->
    <Band lift rule>
      <div class="site-max">
        <h2 class="type-h3 text-cream">Carousel · teardown §8.8</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Native scroll-snap. Arrows are desktop-only; on touch the gesture is
          the control. This band also has the centre <code class="text-gold">rule</code> on.
        </p>
      </div>
      <div class="site-max --full mt-30 px-20">
        <Carousel :cards="cards" label="Dispatches" />
      </div>
    </Band>

    <!-- MARQUEE + TILES --------------------------------------------------- -->
    <Band ground="darker" pad="pt-60 pb-0">
      <div class="site-max">
        <h2 class="type-h3 text-cream">Marquee · task 2.11</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          The track holds the roster twice and translates -50%. Paused off
          screen, and stopped entirely under reduced motion.
        </p>
      </div>
      <div class="mt-30">
        <Marquee :cells="bodies" label="Trade bodies" />
      </div>

      <div class="site-max mt-60">
        <h2 class="type-h3 text-cream">Tiles · teardown §8.10</h2>
      </div>
      <div class="mt-30">
        <Tiles :tiles="tiles" label="Sections" />
      </div>
    </Band>

    <!-- HEADER + MENU ------------------------------------------------------ -->
    <Band>
      <div class="site-max">
        <h2 class="type-h3 text-cream">Header and menu · teardown §8.2, §8.3</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Both are mounted on every route — scroll down and the header
          translates away, scroll up and it returns. The full nav below is the
          set including routes phases 6 and 7 have yet to build; the live header
          renders only what exists, so the prerender does not fail.
        </p>

        <ul class="mt-30 flex flex-wrap gap-x-30 gap-y-15 m-0 p-0 list-none">
          <li v-for="item in nav" :key="item.label">
            <span
              class="uline type-caption uppercase"
              :class="item.live ? 'text-cream --on' : 'text-brown-lifted'"
            >
              {{ item.label }}
            </span>
            <span class="type-caption text-brown-lifted ml-10">
              {{ item.live ? 'live' : 'phase 7' }}
            </span>
          </li>
        </ul>
      </div>
    </Band>

    <!-- MOTION ------------------------------------------------------------ -->
    <Band ground="darker">
      <div class="site-max">
        <p class="type-caption uppercase text-gold">Phase 3 · motion and WebGL</p>
        <h2 class="type-h3 text-cream mt-15">One scroll position, one frame</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Lenis drives <code class="text-gold">gsap.ticker</code>, the ticker drives
          <code class="text-gold">ScrollTrigger.update</code>, and every WebGL scene on the
          page draws off that same tick rather than opening its own loop. Under
          reduced motion, and on a coarse pointer, Lenis is not built at all —
          scroll stays native and nothing is pinned, scrubbed or parallaxed.
        </p>

        <dl class="mt-30 grid grid-cols-2 s:grid-cols-4 gap-20 type-caption uppercase">
          <div class="border border-brown-dark rounded-[.5rem] p-15">
            <dt class="text-brown-lifted">ScrollTriggers</dt>
            <dd class="text-cream m-0 mt-5 tabular-nums">{{ triggers }}</dd>
          </div>
          <div class="border border-brown-dark rounded-[.5rem] p-15">
            <dt class="text-brown-lifted">Reveal</dt>
            <dd class="text-cream m-0 mt-5">24px · 600ms · expo</dd>
          </div>
          <div class="border border-brown-dark rounded-[.5rem] p-15">
            <dt class="text-brown-lifted">Pin distance</dt>
            <dd class="text-cream m-0 mt-5 tabular-nums">300vh · 4 steps</dd>
          </div>
          <div class="border border-brown-dark rounded-[.5rem] p-15">
            <dt class="text-brown-lifted">Smooth scroll</dt>
            <dd class="text-cream m-0 mt-5">{{ reduced ? 'off — calm' : 'on' }}</dd>
          </div>
        </dl>

        <p class="type-body-xs text-brown-lifted mt-20 max-w-[60rem]">
          Leave this route and come back. The trigger count must be identical:
          every one is built inside a <code class="text-gold">gsap.context()</code> that is
          reverted on unmount.
        </p>
      </div>
    </Band>

    <!-- WEBGL ------------------------------------------------------------- -->
    <Band>
      <div class="site-max">
        <h2 class="type-h3 text-cream">WebGL · teardown §9, tasks 3.4–3.7</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          Each object is shown live and then forced to its static frame. The gate
          runs once at mount — reduced motion, no WebGL2, four cores or fewer,
          Save-Data, or a context that is lost — and three.js is only fetched once
          it passes, so a reader who fails it never downloads it.
        </p>
        <p class="type-body-xs text-brown-lifted mt-15 max-w-[60rem]">
          Both struck objects come to rest face-on across the middle of their
          crossing and turn by the same angle either side of it. That is
          deliberate: the medallion is the one that has to hold still, and an
          object that behaves differently from its neighbour is the object
          everybody looks at.
        </p>

        <div class="mt-30 grid grid-cols-1 s:grid-cols-2 gap-20">
          <figure class="m-0">
            <Scene
              kind="disc"
              describe="The house medallion, struck in gold"
              :face="scenes.face"
              :still="scenes.still"
              class="aspect-square border border-brown-dark bg-brown-darker"
            />
            <figcaption class="type-caption uppercase text-brown-lifted mt-10">
              Medallion · live
            </figcaption>
          </figure>

          <figure class="m-0">
            <Scene
              kind="disc"
              describe="The house medallion, struck in gold"
              :face="scenes.face"
              :still="scenes.still"
              flat
              class="aspect-square border border-brown-dark bg-brown-darker"
            />
            <figcaption class="type-caption uppercase text-brown-lifted mt-10">
              Medallion · static frame
            </figcaption>
          </figure>

          <figure class="m-0">
            <Scene
              kind="mark"
              describe="The house mark, extruded"
              :still="scenes.still"
              class="aspect-square border border-brown-dark bg-brown-darker"
            />
            <figcaption class="type-caption uppercase text-brown-lifted mt-10">
              House mark · live
            </figcaption>
          </figure>

          <figure class="m-0">
            <Scene
              kind="mark"
              describe="The house mark, extruded"
              :still="scenes.still"
              flat
              class="aspect-square border border-brown-dark bg-brown-darker"
            />
            <figcaption class="type-caption uppercase text-brown-lifted mt-10">
              House mark · static frame
            </figcaption>
          </figure>
        </div>
      </div>
    </Band>

    <!-- HERO BACKDROP ----------------------------------------------------- -->
    <Band pad="p-0">
      <div class="relative h-full-screen overflow-hidden">
        <Scene
          kind="drift"
          describe="Saffron threads suspended in dark water"
          :rate="0.35"
          class="absolute top-0 inset-x-0 h-full-screen"
        />
        <div class="relative site-max h-full flex items-end pb-70">
          <div>
            <p class="type-caption uppercase text-gold">Scene 1 · hero backdrop</p>
            <p class="type-body-md text-cream mt-10 max-w-[52rem]">
              Parallaxed at 0.35 by a <code class="text-gold">translate3d</code> on this
              wrapper — the camera never moves. Backing store capped at 2× device
              pixels, additive blending, no post-processing chain.
            </p>
          </div>
        </div>
      </div>
    </Band>

    <!-- PINNED SCENE ------------------------------------------------------ -->
    <Band ground="darker" pad="pt-60 pb-40">
      <div class="site-max">
        <h2 class="type-h3 text-cream">Pinned scene · task 3.3</h2>
        <p class="type-body-md text-cream mt-15 max-w-[60rem]">
          300vh, a sticky viewport-tall stage, four discrete steps and a gold bar
          across the bottom. Steps are quantised with a dead-band, so each one is
          fully opaque for its whole range and scrolling back up returns cleanly
          rather than replaying a timeline backwards. Turn reduced motion on and
          the same markup becomes four stacked blocks with no pin.
        </p>
      </div>
    </Band>

    <Reel :stages="reel" label="The season" />

    <SiteFooter :rows="footerRows" />
  </article>
</template>
