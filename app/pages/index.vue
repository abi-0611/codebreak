<script setup lang="ts">
import { useContract, useDissolve, useLock, useRise } from '~/composables/motion'
import { device } from '~/content/device'
import { plates } from '~/content/plates'
import { figures, live, site } from '~/content/site'
import {
  assay,
  dispatches,
  estates,
  estatesLabel,
  footerRows,
  guild,
  hero,
  ledger,
  ledgerHeads,
  ledgerRows,
  homeMeta,
  medallion,
  priced,
  questions,
  season,
  spine,
  spineLabel,
  tiles,
  tilesLabel,
} from '~/content/home'

/**
 * The home page — teardown §7, eleven sections in DOM order.
 *
 * Every section below the hero is a <Band/>, which is what makes the top
 * hairline unmissable rather than remembered: `border-t border-brown-dark`,
 * `position: relative` and an explicit stacking level arrive with the wrapper,
 * so a section cannot be added without them. The carousel's band is the one
 * that sits at `z-3`, because its cards overflow the column and have to pass
 * over the section below rather than under it.
 *
 * THREE SECTIONS CARRY SOMETHING and are built around it rather than around
 * the copy: the medallion rests face-on with its rim legible, the seal renders
 * at a width phase 5 measured rather than a width that looked right, and the
 * pinned scene holds each of its four steps fully opaque for the whole step.
 * The sizes those three ask for are contracts recorded in `_private/reach.json`
 * by the generators that drew them. They are not to be tidied down because a
 * layout would sit more comfortably.
 *
 * The sub-headline is rendered twice and toggled at `s:`. That is the measured
 * markup: the two positions live in different stacking contexts, so one node
 * cannot be moved between them by a media query.
 */
usePageHead(homeMeta)

/**
 * A section carries a pill only where the pill has somewhere to go. Phase 7
 * built the remaining routes, so all of these are live now; the filter stays
 * because the rule it enforces — no dead href, rule 8 — is not a phase.
 */
const guildActions = live(guild.actions)

/**
 * A tile links only where there is somewhere to link to. Rule 8 — and with
 * `crawlLinks` and `failOnError` on the prerender, a route that does not exist
 * yet does not merely 404, it stops the build.
 */
const tileLinks = tiles.map((tile) =>
  tile.live ? { label: tile.label, plate: tile.plate, to: tile.to } : { label: tile.label, plate: tile.plate },
)

/**
 * The hero content dissolves as the reader leaves it — measured off the
 * reference, see `useDissolve`. It is applied to the whole z-2 block rather
 * than to the h1, the sub and the pill separately, because the three fade
 * TOGETHER on the reference and three tweens on three elements is three
 * chances for them not to.
 *
 * The backdrop is deliberately NOT in this block. It stays at full strength
 * the whole way down and is simply covered by section 2, which is what makes
 * the transition read as the page sliding over the stone rather than as two
 * things fading at once.
 */
const opening = ref(null)
useDissolve(opening)

/**
 * The hero's stone, and the plate it shrinks into.
 *
 * `stone` is the aperture, `field` is the box inside it that carries the
 * canvas, `frame` is the whole hero block and `plate` is the bordered box the
 * stone ends up inside. Four refs and two triggers, created here rather than
 * inside <Scene/>, because the behaviour belongs to the HERO's composition —
 * the scene itself has no opinion about what frames it, and every other scene
 * on the page is framed by its section.
 *
 * THE STONE MINIMISES; IT DOES NOT CROP. The whole field ends up inside the
 * plate, drawn smaller, rather than the plate showing a window on to a field
 * that stayed full size. `useContract` carries the measurements and the
 * correction — an earlier build of this page got it the other way round.
 */
const stone = ref(null)
const field = ref(null)
const frame = ref(null)
const plate = ref(null)
useLock(stone, frame)
useContract(stone, field, { into: plate, host: frame })

/**
 * The seal drifts upward relative to its section as it passes — §11.3.5.
 *
 * The trigger is the SECTION, not the seal, so the travel is spread across
 * the whole visit rather than starting once the stamp has already reached the
 * top of the screen. See `useRise` for why that is a different helper from
 * `useParallax` rather than the same one with a minus sign.
 */
const seal = ref(null)
const assayFrame = ref(null)
useRise(seal, assayFrame)
</script>

<template>
  <article class="bg-black">
    <!--
      The section rail — §11.4. Fixed, left edge, above the sections, and
      absent until the hero copy has left the viewport.

      It is declared FIRST so it lands in the tab order straight after the
      header, where page navigation belongs. That costs nothing over the
      hero, where it is `inert` and therefore skipped entirely.

      It lives on the page rather than in the layout because its eight stops
      are this page's sections. A rail in the shell would be a rail every
      route has to supply anchors for, and /privacy has no medallion.
    -->
    <Rail :stops="spine" :label="spineLabel" gate="opening" />

    <!-- ================================================================== -->
    <!-- 1 · HERO — teardown §7 row 1, with the GL backdrop of row 0 inside -->
    <!-- ================================================================== -->
    <div ref="frame" class="relative bg-black">
      <!--
        0 · The WebGL backdrop — teardown §7 row 0, which measures this exact
        wrapper. Viewport-tall, absolutely placed, clipping; the scene inside
        is what the parallax translates, and it is translated within this box
        rather than moving it, so nothing it does can change the page height.

        The wrapper is not optional and it is not decoration. <Scene/> roots
        itself `relative` — a `position` utility passed in from here loses to
        it whatever order the classes are written in, because Tailwind emits
        `.relative` after `.absolute`. Left to that, the backdrop takes a
        viewport of space in normal flow and the hero is twice as tall as it
        should be, which is exactly what the first measurement of this section
        reported.
      -->
      <div ref="stone" class="absolute top-0 inset-x-0 h-full-screen overflow-hidden">
        <!--
          TWO BOXES, NOT ONE, and they are not interchangeable. The wrapper
          above holds the APERTURE as a clip; this one holds the SCALE. A clip
          is resolved in its own element's transformed space, so an element
          carrying both would clip a shrunken copy through a shrunken window —
          see `useContract`, which writes to exactly one property on each.

          `origin-top-left` is what lets the transform be written in the
          wrapper's own coordinates with no compensating term, and it has to be
          in the markup rather than in the tween: GSAP caches a transform origin
          the first time it touches an element, and the first touch here is a
          direct style write.
        -->
        <div ref="field" class="absolute inset-0 origin-top-left will-change-transform">
          <!--
            Rate ZERO here, deliberately. The travel belongs to the WRAPPER —
            see `useLock` — because the wrapper is what clips, and a canvas
            translated a full viewport inside its own viewport-tall clip slides
            out of it and the hero goes black. The reference translates its
            clipping box for exactly this reason.
          -->
          <Scene
            kind="drift"
            :still="plates['still-01']"
            :describe="hero.describe"
            class="h-full"
          />
        </div>
      </div>

      <div id="opening" ref="opening" class="relative z-2 s:h-full-screen flex flex-col">
        <div class="relative flex-1 flex flex-col">
          <div class="relative flex-1 flex items-center justify-center">
            <!--
              The sub, desktop position. Its own layer, top-left, and
              pointer-events-none so a full-width transparent box does not
              swallow a press meant for the backdrop.
            -->
            <div class="absolute inset-0 s:pt-100 s:px-20 pointer-events-none">
              <p class="type-body-md text-cream s:max-w-[35rem] hidden s:block">{{ hero.sub }}</p>
            </div>

            <div
              class="relative z-2 flex flex-col items-center gap-y-15 s:gap-y-30 text-center pt-150 pb-100 s:py-0 px-20 s:px-0"
            >
              <h1 class="type-display-xl text-cream">{{ hero.title }}</h1>

              <!-- The same line again, mobile position. See the note above. -->
              <p class="type-body-md text-cream s:max-w-[35rem] block s:hidden">{{ hero.sub }}</p>

              <Pill :to="site.register" :label="hero.cta">
                <template #icon>
                  <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
                </template>
              </Pill>
            </div>
          </div>

          <!--
            The house figures. Bottom-right and absolute on a desktop, in flow
            above the strip on a phone — teardown §8.4. `bg-black` is what
            keeps it readable where it overlaps the backdrop.
          -->
          <div
            class="relative s:absolute s:bottom-110 s:right-20 whitespace-nowrap bg-black mx-20 s:mx-0 mb-20 s:mb-0 z-3"
          >
            <StatBox :rows="figures" name="house" />
          </div>
        </div>
      </div>

      <!--
        The estate strip, below the viewport-tall block rather than inside it —
        which is what the measured markup does, and what makes the hero one
        screen plus a strip instead of one screen with a strip eaten out of it.

        Its bottom hairline is suppressed deliberately: the rule under it is
        section 2's own `border-t`, and two 1px rules landing on one seam paint
        a 2px line on a site where every rule is 1px.
      -->
      <Marquee :cells="estates" :label="estatesLabel" class="relative z-2 border-b-0" />

      <!--
        The plate the hero closes on — the reference's own structure, where the
        equivalent panel sits INSIDE the hero block rather than after it. The
        stone contracts into this box as it rises, so the section that follows
        arrives over a framed object rather than over a full screen of texture.

        `site-max --l` is the widest of the padded columns and the 900/450 ratio
        is the reference's measured aspect. No background: the stone showing
        through the frame IS the background, and painting one here would hide
        the thing the contraction exists to reveal.

        `s:max-w-[90rem]` IS LOAD-BEARING, not tidying. The reference caps this
        box at 90rem — 900 design px, which is the numerator of its own aspect,
        so at `s:` the plate is drawn at exactly its design size. Measured off
        the live wrapper: `relative w-full s:max-w-[90rem] s:mx-auto`. Without
        the cap the padded column gives 1185px at a 1440 viewport, the plate is
        83% of the screen wide, and the backdrop shrinking into it travels a
        factor of 0.83 across instead of 0.50. The move still runs; it just
        stops being visible, which is exactly how it was reported.
      -->
      <div id="register" class="relative z-2 site-max --l pt-50 s:pt-90 pb-65 s:pb-110">
        <div
          ref="plate"
          class="relative w-full s:max-w-[90rem] s:mx-auto aspect-[600/400] s:aspect-[900/450] border border-brown-dark flex items-center justify-center text-center px-25 s:px-40"
        >
          <div class="relative z-2 flex flex-col items-center gap-y-15 s:gap-y-20">
            <h2 class="type-h2 text-cream">{{ hero.close.heading }}</h2>
            <p class="type-body-md text-cream max-w-[56rem]">{{ hero.close.body }}</p>
          </div>
        </div>

        <!--
          The two-cell panel — teardown §8.7, which specified this furniture in
          phase 1 and gave it nowhere to live. §11.1 found the home: it belongs
          to the closing block, under the plate the stone contracts into, and
          the two together are what §11.3.2 calls the closing panel.

          It sits INSIDE `#register` rather than after it, so the rail's first
          stop covers the whole closing block rather than the aperture alone —
          a stop that ends halfway through the thing it names is a stop that
          hands the reader back to the hero.

          The media is the four-beat struck sequence. It gets `rate` nothing and
          a `turn` from <Scene/> for free, because every kind except the
          backdrop is rotated rather than parallaxed.

          `handoff` is the tail of the opening move. The stone finishes cropping
          into the plate above, and as the cell bar settles into the screen the
          gold crosses from the first cell to the second on its own — and back,
          on the way up. It is the ONE panel on the site that does this, because
          it is the one the reference's opening hands the reader over to; the
          first press ends it for good. See `useHandoff`.
        -->
        <div class="mt-50 s:mt-90 mx-auto max-w-[92rem]">
          <h3 class="type-h3 text-cream text-center">{{ priced.heading }}</h3>

          <div class="mt-25 s:mt-40">
            <TabPanel :tabs="priced.cells" :label="priced.label" handoff>
              <template #media>
                <Scene
                  kind="strike"
                  :still="plates['still-04']"
                  :describe="priced.describe"
                  class="w-full h-full"
                />
              </template>
            </TabPanel>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================== -->
    <!-- 2 · THE HOUSE MEDALLION — teardown §7 row 2                        -->
    <!-- ================================================================== -->
    <!--
      A SPLIT, NOT A STACK — §11.3.3. Copy on the left, the struck disc on the
      right, one full-height hairline between them. The rule belongs to <Band/>
      (`split`) rather than to this markup, because the section that follows it
      is built the same way and a spine drawn twice by hand is a spine that ends
      up at two different widths.

      The two columns are MIRRORED against the guild's: object right here,
      object left there. They are a pair, and a pair that faces the same way
      twice reads as one layout used twice.
    -->
    <Band id="medallion" split>
      <div class="site-max">
        <div class="s:grid s:grid-cols-2 s:items-center">
          <div class="s:pr-60 flex flex-col items-start">
            <h2 class="type-h2 text-cream">{{ medallion.heading }}</h2>

            <div class="mt-25 flex flex-col gap-y-20">
              <p v-for="line in medallion.body" :key="line" class="type-body-md text-cream">
                {{ line }}
              </p>
            </div>

            <Pill
              v-if="medallion.action.live"
              :to="medallion.action.to"
              :label="medallion.action.label"
              variant="ghost"
              class="mt-30"
            >
              <template #icon>
                <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
              </template>
            </Pill>

            <!--
              Two rows in the mono treatment. Adjacent, not justified apart: the
              same rule the stats box follows, for the same reason — a label
              pushed to one edge and a figure to the other is a dashboard, and
              this is a stamped plate.
            -->
            <dl class="mt-40 w-full m-0 border-t border-brown-dark">
              <div
                v-for="row in medallion.figures"
                :key="row.label"
                class="flex items-center gap-x-10 border-b border-brown-dark py-15 type-caption uppercase text-cream"
              >
                <dt>{{ row.label }}</dt>
                <dd class="m-0 tabular-nums">{{ row.value }}</dd>
              </div>
            </dl>
          </div>

          <!--
            THE DISC BREAKS THE COLUMN ON A PHONE, and that is a measurement
            rather than a flourish. It occupies 82% of its canvas and phase 5
            recorded its ring band against the width it lands at on a 375px
            viewport — `_private/reach.json`, `renderPx: 300`. Inside the padded
            column it would lose 40px of that to the gutters. `-mx-20` cancels
            `.site-max`'s own 2rem exactly, so the artwork is the same width it
            was measured at; from `s:` up the negative margin is dropped and the
            disc sits in its half of the split.
          -->
          <div class="mt-50 s:mt-0 s:pl-60 flex justify-center">
            <Scene
              kind="disc"
              :face="plates['dial-02'].src"
              :still="plates['still-02']"
              :describe="medallion.describe"
              class="w-full max-w-[46rem] aspect-square -mx-20 s:mx-0"
            />
          </div>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 3 · THE LOT LEDGER — teardown §7 row 3                             -->
    <!-- ================================================================== -->
    <Band id="ledger" pad="pt-65 s:pt-100 pb-65 s:pb-180" class="overflow-hidden">
      <!--
        THE COLONNADE — §11.3.4. "A data table on hairline-bordered rows over a
        receding arched colonnade... The tunnel is a backdrop, not a subject: it
        sits behind and below the table and comes into full view as the table
        clears."

        So it spans the whole section rather than sitting in a frame: the table
        is over its near bays, and the band between the table and the copy is
        where it is seen whole. `<Band/>` is already `relative` and this section
        is already `overflow-hidden`, which is what keeps a bay sweeping past
        the camera inside the section rather than over the one below it.

        `z-0` and nothing else. The column below is `z-2`, which is <Band/>'s
        own level — the backdrop does not need a stacking level of its own, it
        needs to be under the one everything else already has.

        THE TABLE IS STILL FULL WIDTH. §11.3.4 puts the copy block to the right
        of the table, and the copy IS to the right — of the heading, in the
        block under it. What is deliberately NOT done is setting the table and
        the copy side by side: the table needs 576px before it starts scrolling
        sideways, and half of a padded column is under that at every viewport
        below about 1050px. A lot table that scrolls on a laptop to make room
        for a run of copy is rule 8 traded for a composition.
      -->
      <div class="absolute inset-0 z-0">
        <Scene
          kind="tunnel"
          :still="plates['still-05']"
          :describe="ledger.describe"
          class="w-full h-full"
        />
      </div>

      <div class="site-max relative z-2">
        <Ledger :heads="ledgerHeads" :rows="ledgerRows" :label="ledger.label" />

        <div class="mt-50 s:mt-140 flex flex-col s:flex-row s:items-start s:gap-x-100">
          <h2 class="type-h2 text-cream s:w-[46%] shrink-0">{{ ledger.heading }}</h2>

          <div class="mt-25 s:mt-0 flex flex-col items-start gap-y-20">
            <p class="type-body-lg text-cream">{{ ledger.lede }}</p>
            <p class="type-body-md text-cream">{{ ledger.body }}</p>

            <!-- Phase 7 built /ledger, so this pill points at the register
                 rather than asking a reader to write in for a table the house
                 publishes. -->
            <Pill v-if="ledger.action.live" :to="ledger.action.to" :label="ledger.action.label">
              <template #icon>
                <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
              </template>
            </Pill>
          </div>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 4 · ASSAY AND CERTIFICATION — teardown §7 row 4, first ground change -->
    <!-- ================================================================== -->
    <Band ref="assayFrame" id="assay" ground="darker" rule>
      <div class="site-max">
        <div class="flex flex-col items-center text-center">
          <!--
            26rem is 260 design px, and at a 375px viewport a design pixel and
            a CSS pixel are the same thing — which is the only reason a
            generator can measure a page it cannot see. Phase 5 read the inner
            band at that width. Phase 2 floors the seal at 128px; this is twice
            that, and it is not a number to trim.
          -->
          <!--
            `mix-blend-lighten` is compositing, not a filter. The seal is
            struck on the generator's own ground, which is pure black, and this
            section's ground is not — so a plain image paints a black square on
            a brown one and the stamp reads as something pasted on. Lightening
            it against the section keeps every pixel of the seal (all of it is
            brighter than this ground) and drops the surround, which also puts
            the centre hairline back where the teardown has it: running behind
            the seal rather than stopping at its edge.
          -->
          <!--
            THE DRIFT — §11.3.5. It parallaxes UPWARD relative to the section as
            it passes, and it does not scale, spin or brighten. Those three
            absences are as much the specification as the drift is: this is a
            marked surface, and a surface that changes size or value while it
            crosses is a surface a reader cannot settle on.

            The wrapper moves, never the <Plate/>. A transform on the image
            would be a transform on the same element `mix-blend-lighten`
            composites, and a blended element with its own transform gets its
            own stacking context — which changes what it blends against.
          -->
          <div ref="seal" class="w-[26rem] s:w-[34rem] will-change-transform">
            <Plate
              name="stamp-01"
              :describe="assay.describe"
              fit="object-contain"
              sizes="26rem"
              priority="early"
              class="mix-blend-lighten"
            />
          </div>

          <h2 class="type-h2 text-cream mt-40 s:mt-50">{{ assay.heading }}</h2>
          <p class="type-body-lg text-cream mt-20 max-w-[64rem]">{{ assay.lede }}</p>

          <Pill
            v-if="assay.action.live"
            :href="assay.action.href"
            :label="assay.action.label"
            class="mt-30"
          >
            <template #icon>
              <Glyph name="mail" size="min-w-20 h-32" />
            </template>
          </Pill>

          <p class="type-body-md text-cream mt-40 max-w-[64rem]">{{ assay.body }}</p>
        </div>
      </div>

      <!--
        THE AUDITOR STRIP — §11.3.5. A row of marks in one hairline-ruled band.

        Edge to edge rather than inside the column, which is the same treatment
        the estate strip gets, because it is the same species of furniture: a
        band the section sits on rather than a block inside it.

        It makes this section TALLER than teardown §7's 721px, and that is
        right — §7 was measured before the reference grew this strip, and
        §11.3.5 says so explicitly. Do not trim it back to the number.

        FOUR CELLS ON A DESKTOP AND TWO ROWS OF TWO ON A PHONE. The estate strip
        can hold one row at 375px because it scrolls; this one is static, so it
        has to wrap or set its labels at a size nobody can read. The borders are
        drawn as `top + left` on the list and `bottom + right` on each cell,
        which is the one way to rule a wrapping grid without a stray edge at the
        start of the second row.
      -->
      <div class="site-max --full mt-60 s:mt-90">
        <ul
          class="m-0 p-0 list-none grid grid-cols-2 s:grid-cols-4 border-t border-l border-brown-dark"
          :aria-label="assay.auditLabel"
        >
          <li
            v-for="name in assay.auditors"
            :key="name"
            class="flex items-center justify-center h-70 s:h-90 px-15 text-center border-b border-r border-brown-dark type-caption uppercase text-cream"
          >
            {{ name }}
          </li>
        </ul>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 5 · THE SEASON — teardown §7 row 5. 300vh, sticky, four steps.     -->
    <!-- ================================================================== -->
    <Reel id="season" :stages="season.stages" :label="season.label" />

    <!-- ================================================================== -->
    <!-- 6 · HELD BY THE GUILD — teardown §7 row 6                          -->
    <!-- ================================================================== -->
    <!--
      GOVERNANCE — §11.3.7. Two columns on the same full-height hairline the
      medallion's section uses, mirrored: the struck object is on the LEFT here
      and the copy on the right.

      The three blocks under the copy are an OPEN LIST, deliberately, and not an
      accordion — there is nothing to open. The site has exactly one disclosure
      pattern and it is the FAQ's; a second one that hides three sentences would
      teach a reader that things on this page open, which is a lesson this page
      cannot afford to teach.
    -->
    <Band id="guild" split>
      <div class="site-max">
        <div class="s:grid s:grid-cols-2 s:items-center">
          <!--
            Mirrored against the medallion, and out of the padding on a phone
            for the same measured reason — see the note there. `s:order-first`
            is not needed: it is already first in the DOM, which is also the
            order a screen reader should meet it in, because the copy beside it
            names it.
          -->
          <div class="s:pr-60 flex justify-center">
            <Scene
              kind="mark"
              :outline="device.d"
              :still="plates['still-03']"
              :describe="guild.describe"
              class="w-full max-w-[46rem] aspect-square -mx-20 s:mx-0"
            />
          </div>

          <div class="mt-50 s:mt-0 s:pl-60 flex flex-col items-start">
            <h2 class="type-h2 text-cream">{{ guild.heading }}</h2>
            <p class="type-body-md text-cream mt-25">{{ guild.body }}</p>

            <div v-if="guildActions.length" class="mt-30 flex flex-wrap items-center gap-15">
              <Pill
                v-for="(action, i) in guildActions"
                :key="action.label"
                :to="action.to"
                :label="action.label"
                :variant="i === 0 ? 'primary' : 'ghost'"
              >
                <template #icon>
                  <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
                </template>
              </Pill>
            </div>

            <!--
              The three service marks, now stacked in the right column with a
              hairline between rather than laid across three cells.

              §11.3.7 calls for "mono uppercase label, body copy, hairline
              between". OURS ARE DRAWN GEOMETRY, not mono characters, and that
              is not a liberty taken with the spec — it is phase 4's technique
              T-B, and one of these three labels is a term. Setting them as text
              would put it in the DOM and one Ctrl+F away. The `.type-h3`
              wrapper and `fluid` are what keeps the drawn line on the cap height
              phase 5 recorded: `fluid` sizes against the INHERITED font size, so
              moving the set from a third of the page into half of it changes
              nothing about how tall it draws.

              One generator run, one band, one cap height. Nothing here may be
              adjusted for one of them.
            -->
            <ul class="mt-50 s:mt-60 w-full m-0 p-0 list-none border-t border-brown-dark">
              <li
                v-for="(note, i) in guild.notes"
                :key="note"
                class="border-b border-brown-dark py-25 s:py-30"
              >
                <span class="type-h3 text-cream block">
                  <OutlineText name="marks" :index="i" fluid />
                </span>
                <p class="type-body-md text-cream mt-15">{{ note }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 7 · CROCARIA DISPATCHES — teardown §7 row 7, the one z-3 section   -->
    <!-- ================================================================== -->
    <Band id="dispatches" ground="darker" lift rule class="overflow-hidden">
      <div class="site-max">
        <div class="flex flex-col items-center text-center">
          <div class="w-full max-w-[44rem]">
            <Plate
              v-bind="dispatches.plate"
              sizes="(min-width: 650px) 44rem, 100vw"
              fit="object-contain"
              priority="early"
            />
          </div>

          <h2 class="type-h2 text-cream mt-40 s:mt-50">{{ dispatches.heading }}</h2>
          <p class="type-body-md text-cream mt-25 max-w-[64rem]">{{ dispatches.body }}</p>

          <!-- The rail carries six of the twelve on file. Phase 7 built the
               route the other six are on, so the rail now ends somewhere. -->
          <Pill
            v-if="dispatches.action.live"
            :to="dispatches.action.to"
            :label="dispatches.action.label"
            variant="ghost"
            class="mt-30"
          >
            <template #icon>
              <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
            </template>
          </Pill>
        </div>
      </div>

      <!-- Edge to edge from `s:` up: the rail is meant to run out of the
           column, which is why this section stands above its neighbours. -->
      <div class="site-max --full mt-50 s:mt-60 px-20">
        <Carousel :cards="dispatches.cards" :label="dispatches.label" />
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 8 · QUESTIONS — teardown §7 row 8                                  -->
    <!-- ================================================================== -->
    <Band id="questions">
      <div class="site-max">
        <!--
          Three lines, centred, in the display face at line-height .75. The
          heading is an array for exactly that reason: the break is the design,
          not the consequence of a column width.
        -->
        <h2 class="type-display-xl text-cream text-center">
          <span v-for="line in questions.heading" :key="line" class="block">{{ line }}</span>
        </h2>

        <div class="mt-50 s:mt-80">
          <!-- The first row opens by default, exactly as the reference does.
               It is what teaches the control without a word of instruction. -->
          <Accord :rows="questions.rows" :start="0" />
        </div>

        <div v-if="questions.action.live" class="mt-40 flex justify-center">
          <Pill :to="questions.action.to" :label="questions.action.label" variant="ghost">
            <template #icon>
              <Glyph name="arrow" size="min-w-20 h-32 stroke-current" />
            </template>
          </Pill>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 9 · LINK TILES — teardown §7 row 9                                 -->
    <!-- ================================================================== -->
    <Band pad="pb-20 s:pb-0">
      <!-- The grid's own top rule is dropped: the hairline on this seam is the
           section's, and one rule is one rule. -->
      <Tiles :tiles="tileLinks" :label="tilesLabel" class="border-t-0" />
    </Band>

    <!-- ================================================================== -->
    <!-- 10 · FOOTER — teardown §8.9                                        -->
    <!-- ================================================================== -->
    <SiteFooter :rows="footerRows" />
  </article>
</template>
