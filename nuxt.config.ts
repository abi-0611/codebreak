// CROCARIA — Nuxt 3, static generation.
// Every value here is either required by prompts/01-foundation.md task 1.1 or
// by one of the ten rules in CLAUDE.md. Nothing is here for convenience.

const FONTS =
  'https://fonts.googleapis.com/css2' +
  '?family=Funnel+Display:wght@300..800' +
  '&family=Host+Grotesk:ital,wght@0,300..800;1,300..800' +
  '&family=Roboto+Mono:ital,wght@0,100..700;1,100..700' +
  '&display=swap'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-23',

  // Puts the Vue application under app/ — the layout every phase file assumes
  // (app/assets, app/components, app/composables, app/content, app/pages).
  future: { compatibilityVersion: 4 },

  // Rendered on the server, then frozen by `nuxt generate` into .output/public.
  ssr: true,

  // Rule 6 — no source leaks. Production maps stay off, in every layer.
  sourcemap: { client: false, server: false },
  vite: {
    build: { sourcemap: false },
    css: { devSourcemap: false },
  },

  // Rule 6 again: the devtools client is a whole second application, and it
  // ships a module graph. It never runs here, not even locally.
  devtools: { enabled: false },

  // No analytics module. No third-party script. No CMS. Rule: CLAUDE.md "Do not".
  modules: [
    '@nuxtjs/tailwindcss',

    /**
     * Strips /specimen from anything that is not `nuxt dev`.
     *
     * The design-system page is a build tool, not a page. Removing the ROUTE
     * rather than guarding the component is what matters: with nothing
     * referencing it, the page chunk and everything only it imports — the
     * stand-in artwork, the fixture copy — are never emitted at all. A
     * component guarded by a runtime flag still ships its whole subtree.
     *
     * `nuxt.options.dev` is the authority here, not NODE_ENV, which is also
     * 'production' during a dev-mode preview build.
     */
    (_options, nuxt) => {
      if (nuxt.options.dev) return
      nuxt.hook('pages:extend', (pages) => {
        const at = pages.findIndex((page) => page.path === '/specimen')
        if (at !== -1) pages.splice(at, 1)
      })
    },
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
    exposeConfig: false,
    viewer: false,
  },

  // A loading template would paint a non-brand frame before the first byte of
  // the real page. The site is black from the first paint or it is wrong.
  spaLoadingTemplate: false,

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      title: 'CROCARIA — Grown, graded, sealed.',
      meta: [
        {
          name: 'description',
          content:
            'CROCARIA. A heritage saffron house at Consuegra, est. 1904. ' +
            'Cultivation, grading, assay and provenance for every thread.',
        },
        { name: 'theme-color', content: '#000000' },
        { name: 'color-scheme', content: 'dark' },
      ],
      link: [
        // The house mark, drawn by scripts/mark.mjs. favicon.ico is found by
        // convention; the two PNGs are not, and a phone that cannot find one
        // screenshots the page instead.
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/img/icon-512.png', type: 'image/png', sizes: '512x512' },
        { rel: 'apple-touch-icon', href: '/img/icon-180.png', sizes: '180x180' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: FONTS },
      ],
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: true,
    },
  },
})
