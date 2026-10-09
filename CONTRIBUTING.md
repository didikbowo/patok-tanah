# Kontribusi

Terima kasih sudah ingin membantu Patok.

## Melaporkan bug

Buka issue dan sertakan:

- langkah untuk mereproduksi bug,
- **link bagikan** dari aplikasi (tombol ⤴), karena link itu berisi semua ukuran yang dibutuhkan,
- hasil yang diharapkan dan hasil yang muncul,
- HP/browser yang dipakai.

## Menyiapkan lingkungan

```bash
npm install
npx playwright install chromium   # sekali saja, untuk uji E2E
npm run dev
```

## Sebelum membuat pull request

```bash
npm run check      # type-check
npm test           # unit + property test
npm run test:e2e   # uji end-to-end
```

Semua harus lulus. CI di GitHub menjalankan perintah yang sama.

## Pedoman

- **Logika geometri** ditaruh di `src/geometry/`. Modul ini harus tetap murni (tanpa DOM/Svelte) dan setiap perubahan wajib disertai tes. Hasil yang salah tapi terlihat meyakinkan adalah risiko terbesar aplikasi ini.
- **Perubahan model data** (`src/state/model.ts`) yang tidak kompatibel wajib menaikkan `SCHEMA_VERSION` dan menambahkan migrasi, supaya data tersimpan dan link lama tetap terbaca.
- **Teks antarmuka** memakai Bahasa Indonesia yang sederhana. Setiap pesan error harus menjelaskan apa yang perlu dicek pengguna.
- **Mobile first.** Cek perubahan UI di lebar 390 px, target sentuh minimal 44 px, dan pastikan mode terang maupun gelap tetap terbaca.
- **Tanpa layanan pihak ketiga** (analitik, font, CDN). Aplikasi harus tetap berjalan offline dan data tidak boleh keluar dari perangkat.
- Keputusan desain besar dicatat di [docs/design.md](docs/design.md) bagian *Decision Log*.
