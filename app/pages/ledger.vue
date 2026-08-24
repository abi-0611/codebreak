<script setup lang="ts">
import { bands, grades, heads, ledgerPage, lots, nameOf, row } from '~/content/lots'
import { footerRows } from '~/content/home'

/**
 * `/ledger` — the whole register. Phase 7, route 4.
 *
 * The home page shows seven rows; this shows all twenty-one, through the SAME
 * <Ledger/> component and the same `row()` function, with a filter over it and
 * a block of per-lot detail under it.
 *
 * IT CARRIES NOTHING, and it holds a concentration of the vocabulary a reader
 * can find with Ctrl+F. That is the point rather than an accident: this is the
 * page a team scours word by word, and every hit on it — the crocin index, the
 * port column, the stack lots, the kernel and lambda and cluster grades, the
 * stencil on the crate — is a real term of the trade leading nowhere.
 *
 * BOTH FILTERS DEFAULT TO EVERYTHING, on the server and on the first paint, so
 * the prerendered html carries all twenty-one rows and the whole detail block.
 * A reader with no JavaScript gets the register; the controls narrow it.
 */
usePageHead(ledgerPage.meta)

const grade = ref<string>('all')
const band = ref<string>('all')

const gradeOptions = [
  { value: 'all', label: 'Every grade' },
  ...grades.map((name) => ({ value: name, label: name })),
]

const bandOptions = bands.map(({ value, label }) => ({ value, label }))

const shown = computed(() => {
  const test = bands.find((b) => b.value === band.value) ?? bands[0]!
  return lots.filter(
    (lot) => (grade.value === 'all' || lot.grade === grade.value) && test.holds(lot.index),
  )
})

const rows = computed(() => shown.value.map(row))

/**
 * One lot's detail row — one function called once per lot, pairing the six
 * fields with their labels in the order `ledgerPage.detail.fields` declares
 * them. Pairing here rather than in the template is what keeps the labels and
 * the figures from being two lists that can fall out of step.
 */
const detailOf = (lot: (typeof lots)[number]) =>
  ledgerPage.detail.fields.map((label, i) => ({
    label,
    value: [lot.block, lot.cut, lot.moisture, lot.sealed, lot.seal, lot.net][i],
  }))

function clear() {
  grade.value = 'all'
  band.value = 'all'
}
</script>

<template>
  <article class="bg-black">
    <PageBand :title="ledgerPage.title" />

    <!-- ================================================================== -->
    <!-- 1 · THE STANDFIRST AND THE CRATE                                   -->
    <!-- ================================================================== -->
    <Band>
      <div class="site-max">
        <div class="flex flex-col s:flex-row s:items-start s:gap-x-100">
          <p class="type-body-lg text-cream s:w-[46%] shrink-0">{{ ledgerPage.lede }}</p>
          <p class="type-body-md text-cream mt-25 s:mt-0">{{ ledgerPage.body }}</p>
        </div>

        <figure class="m-0 mt-50 s:mt-70">
          <div class="overflow-hidden border border-brown-dark rounded-[.5rem]">
            <Plate
              v-bind="ledgerPage.plate"
              sizes="(min-width: 650px) 110rem, 100vw"
            />
          </div>
          <figcaption class="mt-15 type-body-xs text-brown-lifted max-w-[64rem]">
            {{ ledgerPage.plateNote }}
          </figcaption>
        </figure>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 2 · THE FILTER ROW                                                 -->
    <!-- ================================================================== -->
    <Band ground="darker" pad="py-30 s:py-40">
      <div class="site-max">
        <div class="flex flex-col s:flex-row s:items-center gap-y-20 s:gap-x-20">
          <Picker v-model="grade" :label="ledgerPage.filters.grade" :options="gradeOptions" />
          <Picker v-model="band" :label="ledgerPage.filters.index" :options="bandOptions" />

          <p
            class="type-caption uppercase text-brown-lifted s:ml-auto tabular-nums"
            aria-live="polite"
          >
            {{ ledgerPage.filters.count(shown.length, lots.length) }}
          </p>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 3 · THE TABLE                                                      -->
    <!-- ================================================================== -->
    <Band pad="pt-50 s:pt-70 pb-65 s:pb-100" class="overflow-hidden">
      <div class="site-max">
        <template v-if="rows.length">
          <Ledger :heads="heads" :rows="rows" :label="ledgerPage.title" />
        </template>

        <!-- An empty state that says what to do, not one that says "no
             results". The reader set two fields; the useful line names them. -->
        <div v-else class="flex flex-col items-start gap-y-20 py-40 border-t border-brown-dark">
          <p class="type-body-lg text-cream">{{ ledgerPage.filters.empty }}</p>
          <Pill variant="ghost" :label="ledgerPage.filters.clear" @click="clear">
            <template #icon>
              <Glyph name="left" size="min-w-20 h-20" />
            </template>
          </Pill>
        </div>
      </div>
    </Band>

    <!-- ================================================================== -->
    <!-- 4 · PER-LOT DETAIL                                                 -->
    <!-- ================================================================== -->
    <Band v-if="shown.length" ground="darker">
      <div class="site-max">
        <h2 class="type-h2 text-cream">{{ ledgerPage.detail.heading }}</h2>
        <p class="type-body-md text-cream mt-20 max-w-[64rem]">{{ ledgerPage.detail.body }}</p>

        <ul class="mt-40 s:mt-50 m-0 p-0 list-none border-t border-brown-dark">
          <li
            v-for="lot in shown"
            :key="lot.no"
            class="border-b border-brown-dark py-25 s:py-30"
          >
            <div class="flex flex-col s:flex-row s:items-baseline s:gap-x-30">
              <h3 class="type-h3 text-cream s:w-[24rem] shrink-0">{{ nameOf(lot) }}</h3>

              <!--
                One row per lot, laid by one function. The labels are the
                same six in the same order on every lot, because a detail row
                that reordered itself for one member would be the member
                everybody looks at.
              -->
              <dl class="m-0 mt-15 s:mt-0 grid grid-cols-2 s:grid-cols-3 gap-x-20 gap-y-10 flex-1">
                <div
                  v-for="field in detailOf(lot)"
                  :key="field.label"
                  class="flex items-baseline gap-x-10 type-caption uppercase"
                >
                  <dt class="text-brown-lifted">{{ field.label }}</dt>
                  <dd class="m-0 text-cream tabular-nums">{{ field.value }}</dd>
                </div>
              </dl>
            </div>
          </li>
        </ul>
      </div>
    </Band>

    <SiteFooter :rows="footerRows" />
  </article>
</template>
