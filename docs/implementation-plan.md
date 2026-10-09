# Patok — Rencana Implementasi

Mengacu ke [design.md](design.md). Dikerjakan berurutan; setiap tahap ditutup dengan tes yang lulus.

**Status: semua tahap selesai (v1.0.0).**

| # | Tahap | Hasil | Verifikasi |
|---|---|---|---|
| 1 | Scaffold | Vite + Svelte + TS, Vitest, Playwright, vite-plugin-pwa, struktur folder | `npm run build` & `npm test` jalan |
| 2 | Inti geometri | `geometry/build.ts`, `measure.ts`, `clip.ts`, `split.ts` | Unit test + property test (fast-check) |
| 3 | State | `state/model.ts`, `app.svelte.ts`, `persist.ts`, `share.ts` | Unit test round-trip & data rusak |
| 4 | UI | `PlotCanvas`, `SideInputs`, `SplitPanel`, `SplitResults`, `Summary`, `Settings`, `Help`, `App` | Cek manual di viewport HP |
| 5 | PWA | Manifest, ikon, service worker, toast versi baru | Build menghasilkan `sw.js` + manifest |
| 6 | E2E | 8 skenario di viewport 390×844 (hitung, validasi, bagi, simpan, bagikan, konfirmasi link, link rusak, offline) | `npm run test:e2e` |
| 7 | Dokumentasi & CI | README, panduan pengguna, panduan kontribusi, GitHub Actions (tes + deploy Pages) | Review isi, workflow valid |
