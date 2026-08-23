import plugin from 'tailwindcss/plugin'
import type { Config } from 'tailwindcss'
import { palette, fontStack } from './tokens/palette.mjs'

/**
 * The spacing remap is the whole point of this file.
 *
 * The fluid rem engine in app/assets/css/main.css makes 1rem = 10 design px,
 * so remapping spacing to `n / 10 rem` makes every utility number a design
 * pixel: `.p-20` -> `padding: 2rem` -> 20 design px. Teardown §2.
 *
 * 0..400 covers the whole reference: the widest measured value is the
 * `--padding: 22rem` on `.site-max` at desktop, and the tallest is `pb-180`.
 */
const spacing = Object.fromEntries(
  Array.from({ length: 401 }, (_, n) => [n, `${n / 10}rem`]),
) as Record<string, string>

export default {
  content: [
    './app/**/*.{vue,ts,js}',
    './app/content/**/*.ts',
    './nuxt.config.ts',
  ],

  // Nothing on this site responds to the OS theme. It is black, always.
  darkMode: 'class',

  theme: {
    // One breakpoint. Teardown §3. Every "tablet" case is the rem engine's job.
    screens: { s: '650px' },

    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: palette.black,
      white: palette.white,
      cream: palette.cream,
      gold: palette.gold,
      brown: {
        DEFAULT: palette.brown,
        dark: palette['brown-dark'],
        darker: palette['brown-darker'],
        deepest: palette['brown-deepest'],
        // The recorded AA deviation. See tokens/palette.mjs.
        lifted: palette['brown-lifted'],
      },
    },

    spacing,

    extend: {
      fontFamily: {
        display: fontStack.display,
        body: fontStack.body,
        mono: fontStack.mono,
      },
      borderRadius: { DEFAULT: '.5rem' },
      zIndex: { 1: '1', 2: '2', 3: '3', 99: '99' },
      transitionTimingFunction: {
        // Teardown §6. These three are the only curves on the site.
        pulse: 'cubic-bezier(.4, 0, .6, 1)',
        expo: 'cubic-bezier(.23, 1, .32, 1)',
        expo2: 'cubic-bezier(.19, 1, .22, 1)',
      },
    },
  },

  plugins: [
    plugin(({ addVariant }) => {
      // The reference uses capability queries, not `hover:`. Rule 4 depends on
      // it: anything gated behind hover is unreachable on a phone.
      addVariant('has-hover', '@media (hover: hover) and (pointer: fine)')
      addVariant('has-not-hover', '@media (hover: none) or (pointer: coarse)')

      // `max-s` is deliberately NOT declared here. Tailwind's core `max-{screen}`
      // variant already derives it from `screens` above and takes precedence over
      // a plugin variant of the same name, so a declaration here would be dead
      // code that reads as if it were doing something. What core emits is
      // `@media not all and (min-width: 650px)` rather than the teardown's
      // `max-width: 649px` — the same rule with no dead zone between the two.
    }),
  ],
} satisfies Config
