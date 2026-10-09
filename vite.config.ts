/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

// BASE_PATH dipakai saat deploy ke sub-folder, mis. GitHub Pages: BASE_PATH=/patok-tanah/
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Patok — Hitung & Bagi Tanah',
        short_name: 'Patok',
        description: 'Hitung luas tanah dari ukuran meteran dan bagi menjadi beberapa bagian lengkap dengan posisi patok.',
        lang: 'id',
        theme_color: '#2f6b4f',
        background_color: '#f5f4ef',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
