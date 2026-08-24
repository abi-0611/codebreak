// CROCARIA — Nuxt 3, static generation.
// Every value here is either required by prompts/01-foundation.md task 1.1 or
// by one of the ten rules in CLAUDE.md. Nothing is here for convenience.
import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

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

  /**
   * Where the site will live — read by `usePageHead` for canonical and Open
   * Graph URLs, which have to be absolute to be worth anything.
   *
   * Nothing is hard-coded, because phase 9 picks the host and this file is
   * written in phase 1. The two hosts phase 9 names both publish the deploy
   * URL to the build as an environment variable, so on either of them this
   * resolves with no configuration at all; NUXT_PUBLIC_ORIGIN overrides both,
   * which is what a custom domain needs.
   *
   * Left empty — every local run — `usePageHead` emits a root-relative share
   * card and omits `og:url` rather than baking `http://localhost` into the
   * prerendered head. See the note there.
   */
  runtimeConfig: {
    public: {
      origin:
        process.env.NUXT_PUBLIC_ORIGIN ||
        process.env.URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : ''),
    },
  },

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

    /**
     * Gives the host a 404 that is actually rendered.
     *
     * `nuxt generate` writes `404.html` for us, and writes it as an empty
     * client-rendered shell: `/404.html` is one of three paths the Nuxt
     * renderer hard-codes as no-SSR while prerendering, so no route and no
     * page can change what lands in that file. What a static host serves for
     * every mistyped lot number is therefore a black screen until JavaScript
     * arrives, under the HOME page's title.
     *
     * So `/404` is prerendered as an ordinary page — app/pages/404.vue, body
     * shared with app/error.vue — and its output is copied over the shell once
     * prerendering has finished. `prerender:done` is the hook that fires after
     * every route has been written, which is the only point at which both
     * files exist.
     *
     * It THROWS rather than skipping if the render is missing. A silent skip
     * here leaves the shell in place and looks exactly like success.
     */
    (_options, nuxt) => {
      if (nuxt.options.dev) return
      nuxt.hook('nitro:init', (nitro) => {
        nitro.hooks.hook('prerender:done', () => {
          const out = nitro.options.output.publicDir
          const from = join(out, '404', 'index.html')
          const to = join(out, '404.html')

          if (!existsSync(from)) {
            throw new Error(
              'No prerendered /404 to copy over 404.html. It is listed in ' +
                'nitro.prerender.routes and rendered by app/pages/404.vue — ' +
                'if either has gone, the host would serve an empty shell.',
            )
          }
          copyFileSync(from, to)
        })
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
      /**
       * `/` is the entry the crawler walks out from; every other route on the
       * site is reached from the header, the footer or the tiles, which is
       * rule 8 checked by construction — a route nothing links to is a route
       * that never gets built.
       *
       * `/404` is the exception and has to be listed, because nothing links to
       * an error page. See the module above for what happens to its output.
       */
      routes: ['/', '/404'],
      failOnError: true,
    },
  },
})
