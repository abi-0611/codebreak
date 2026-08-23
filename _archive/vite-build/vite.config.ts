import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Honour a port handed down by the environment so the dev server and any
    // supervising tooling agree on one address. Falls back to Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  build: {
    // Production source maps are disabled deliberately and must stay disabled.
    sourcemap: false,
  },
})
