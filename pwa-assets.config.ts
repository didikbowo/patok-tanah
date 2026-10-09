import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Membuat ikon PNG (PWA, maskable, apple-touch) dari public/logo.svg: `npm run icons`
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#2f6b4f' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#2f6b4f' } },
  },
  images: ['public/logo.svg'],
})
