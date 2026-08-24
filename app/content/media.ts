/**
 * Committed artwork, addressed by stem.
 *
 * `app/content/plates.ts` is GENERATED — scripts/plates.mjs writes it from the
 * files it actually encoded. This module is the hand-written half of that
 * pair: it turns a stem into the object a section hands to <Plate/>, so no
 * section ever restates a path, a width or a height.
 *
 * Why it is worth a module. A hand-written `w`/`h` is true on the day somebody
 * types it and a lie the moment the image is re-encoded at another size: the
 * aspect the browser reserves is then wrong, the page shifts under the reader
 * mid-scroll, and nothing anywhere reports an error. Reading the manifest
 * makes that class of fault impossible rather than unlikely.
 *
 * It carries the `srcset` through as well, which is the difference between a
 * phone fetching the 1200px encoding of a picture it paints at 335 and
 * fetching the 600px one. Rule 9 is a budget, and this is where most of it is
 * either kept or spent.
 */
import { plates, type PlateKey } from '~/content/plates'

export type Art = {
  readonly src: string
  readonly srcset: string
  readonly w: number
  readonly h: number
  /** Alt text. '' for genuinely decorative artwork — deliberately, not by omission. */
  readonly describe: string
}

/**
 * One committed image, ready to `v-bind` on to <Plate/>.
 *
 * `describe` says what the picture is, the way it would be described to
 * someone who cannot see it, and no more. Nothing that matters may live only
 * in an alt attribute — rule 1.
 */
export const art = (name: PlateKey, describe: string): Art => ({ ...plates[name], describe })

/**
 * A dispatch card, as <Card/> renders it.
 *
 * The shape lives here rather than in the component because two content
 * modules produce it — the home page's carousel and the full grid on
 * `/dispatches` — and a type owned by one of its two consumers is a type the
 * other one imports across the site's own grain.
 *
 * `to` is deliberately optional. Rule 8 is no dead links, so a card with
 * nowhere to go is not a link at all; it is an <article>. Nothing renders an
 * href that resolves to nothing.
 */
export type Dispatch = {
  /** Index label in the light pill, e.g. "LOT 04". */
  readonly tag: string
  readonly date: string
  readonly title: string
  /** The standfirst under the title. One or two lines, never a summary. */
  readonly body?: string
  readonly plate: Art
  readonly to?: string
  /** Which filter group the card belongs to. Keys are declared per route. */
  readonly kind?: string
}
