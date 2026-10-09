# Patok — Dokumen Desain

Status: **Disetujui & diimplementasikan (v1.0.0)** · Tanggal: 2026-10-09

Web app statis (PWA) untuk menghitung luas & keliling sebidang tanah dari ukuran meteran, lalu membaginya menjadi beberapa bagian dengan target luas tertentu — dioptimalkan untuk HP.

---

## 1. Ringkasan Pemahaman

- **Apa:** web app statis untuk menghitung luas dan keliling bidang tanah dari ukuran meteran, serta membaginya menjadi beberapa bagian berdasarkan target luas.
- **Mengapa:** orang awam bisa menghitung sendiri dan tahu di mana memasang patok pembagi (warisan, jual sebagian) tanpa alat ukur sudut.
- **Untuk siapa:** masyarakat umum, dipakai di HP, sering di lokasi tanpa sinyal.
- **Input bentuk:** jumlah sisi bisa diatur (3–10); pengguna mengisi panjang tiap sisi dan diagonal dari satu pojok acuan A (N−3 diagonal). Tiap pojok C.. punya opsi "balik" untuk kasus diagonal yang melintas di luar bidang.
- **Split:** satu arah, N bagian (sama luas / proporsi / luas tertentu), garis sejajar atau tegak lurus terhadap sisi acuan yang dipilih.
- **Output:** gambar 2D, luas (m², are, ha, tumbak, bata), keliling; per bagian: luas, keliling, persentase; per garis potong: panjang garis & jarak patok dari pojok terdekat.
- **Platform:** PWA statis, offline, simpan otomatis di browser, bagikan via link; tanpa server & login.

## 2. Asumsi

1. Satuan input **meter**, 2 desimal; koma dan titik diterima sebagai desimal.
2. Luas ditampilkan dalam m², are, ha, **tumbak** dan **bata**. Default 1 tumbak = 1 bata = **14 m²**, dapat diubah di pengaturan (nilai berbeda antar daerah).
3. Jumlah sisi 3–10.
4. Antarmuka Bahasa Indonesia saja.
5. Ukuran tidak konsisten → peringatan/error yang jelas, aplikasi tidak menebak.
6. Garis potong yang memecah bidang cekung menjadi >2 potong → peringatan, hasil split tidak ditampilkan.
7. Perhitungan ulang terasa instan (<100 ms); satu bidang per sesi kerja.
8. Data tidak meninggalkan perangkat kecuali pengguna menekan "Bagikan".
9. Ada disclaimer: hasil adalah **perkiraan**, bukan pengganti pengukuran resmi BPN.

## 3. Non-goals

GPS/peta/koordinat geografis · sisi melengkung · split bertingkat atau grid kavling · ekspor PDF/gambar · akun/database/server · banyak bidang sekaligus · dokumen berkekuatan hukum.

## 4. Kebutuhan Non-fungsional

| Aspek | Target |
|---|---|
| Performa | Hitung ulang < 100 ms; bundle JS ±31 KB gzip (runtime Svelte 5); nyaman di HP kelas bawah |
| Skala | Pengguna individu; tanpa backend sehingga tidak ada beban server |
| Privasi | Semua data di perangkat; data share di hash URL (tidak terkirim ke server) |
| Ketersediaan | Offline penuh setelah kunjungan pertama (PWA) |
| Aksesibilitas | Target sentuh ≥ 44 px, kontras WCAG AA, label eksplisit, dark mode |
| Perawatan | Inti geometri terisolasi & teruji; hosting statis apa saja |

---

## 5. Desain

### 5.1 Stack

Svelte + TypeScript + Vite, `vite-plugin-pwa`, Vitest (+ fast-check), Playwright. Rendering gambar dengan SVG.

### 5.2 Struktur modul

```
src/
  geometry/          ← inti murni, tanpa UI, diuji Vitest
    build.ts         sisi+diagonal+flip → koordinat titik
    measure.ts       luas (shoelace), keliling, konversi satuan, validasi
    split.ts         cari garis potong untuk target luas
    clip.ts          potong poligon dengan setengah-bidang
  state/
    model.ts         model data, ubah jumlah sisi, compute(), sanitize()
    app.svelte.ts    state reaktif bersama (Svelte 5 runes) + toast
    persist.ts       simpan/muat localStorage
    share.ts         encode/decode data ↔ link
  ui/
    PlotCanvas.svelte    gambar SVG (bidang, label, garis split, patok)
    SideInputs.svelte    jumlah sisi, sisi, diagonal, toggle balik
    SplitPanel.svelte    sisi acuan, arah, mode & bagian
    Summary.svelte       luas & keliling di bawah gambar
    SplitResults.svelte  kartu bagian & kartu patok
    NumberField.svelte   kolom angka (koma/titik desimal)
    Settings.svelte      konversi tumbak/bata, mulai baru, tentang
    Help.svelte          cara pakai di dalam aplikasi
    Modal.svelte         dialog
  App.svelte
```

### 5.3 Alur data (searah)

```
input → store plot → build() → titik (x,y) → measure() + split() → hasil
      → PlotCanvas + Summary + SplitResults
      → persist (debounce 500 ms) → localStorage
```

Yang disimpan hanya input mentah; semua turunan dihitung ulang.

```ts
{
  v: 1,                       // versi skema
  sides: number[],            // AB, BC, CD, ... (m)
  diagonals: number[],        // AC, AD, ... (N−3) (m)
  flip: boolean[],            // per pojok C.. : pilih titik di sisi seberang diagonal
  split: {
    on: boolean,              // pembagian aktif
    ref: number,              // indeks sisi acuan
    dir: 'parallel' | 'perpendicular',
    mode: 'equal' | 'ratio' | 'area',
    count: number,            // mode equal: jumlah bagian
    ratios: number[],         // mode ratio: bobot
    areas: number[],          // mode area: luas bagian 1..N−1 (bagian terakhir = sisa)
    areaUnit: 'm2' | 'tumbak' | 'bata'
  },          // tiap mode punya kolom sendiri supaya isian tidak hilang saat berpindah mode
  units: { tumbak: 14, bata: 14 }
}
```

### 5.4 Geometri: membangun bentuk

- Pojok A, B, C, … berurutan mengelilingi bidang. Bidang dipecah menjadi segitiga kipas dari A: ABC, ACD, ADE, …
- A = (0,0), B = (AB, 0). Untuk tiap segitiga A–Pₖ–Pₖ₊₁, ketiga sisinya diketahui; Pₖ₊₁ = perpotongan dua lingkaran. Default dipilih solusi berlawanan arah jarum jam (kiri dari A→Pₖ); `flip` memilih solusi seberang.
- N sisi + (N−3) diagonal = 2N−3 ukuran, tepat yang dibutuhkan untuk mengunci bentuk.
- Bentuk cekung (L/U) terbentuk otomatis dari ukuran jika **pojok A ditaruh di pojok yang menjorok ke dalam** (semua diagonal berada di dalam bidang). Tips ini ditampilkan di UI. `flip` hanya dibutuhkan bila sebuah diagonal melintas di luar bidang.

### 5.5 Geometri: ukur & validasi

- Luas = |shoelace| koordinat (benar untuk cekung). Keliling = Σ sisi.
- Validasi:

| Kondisi | Perilaku |
|---|---|
| Kosong / ≤ 0 | Kolom merah, tidak dihitung |
| Pertidaksamaan segitiga gagal, selisih ≤ 0,5% | Peringatan kuning "hampir segaris"; titik ditempatkan segaris; hasil tetap tampil |
| Gagal, selisih > 0,5% | 3 kolom terkait merah + pesan menyebut segitiga (mis. "ACD") |
| Sisi bidang saling bersilangan | Error "bentuk menyilang — cek tombol balik atau urutan pojok" |

### 5.6 Split

- Sisi acuan Pᵢ→Pᵢ₊₁ dengan arah satuan `u` dan normal ke dalam `n`. Keluarga garis potong `{p : p·w = t}`, dengan `w = n` (sejajar) atau `w = u` (tegak lurus). `t` berkisar antara proyeksi minimum dan maksimum titik-titik bidang pada `w`.
- `L(t)` = luas bagian `p·w < t` (clip setengah-bidang), monoton naik. Untuk tiap target luas kumulatif, cari `t` dengan **bisection** hingga galat < 0,0001 m² (±50 iterasi).
- Urutan bagian: sejajar → mulai dari yang terdekat ke sisi acuan; tegak lurus → mulai dari ujung Pᵢ ke Pᵢ₊₁.
- Mode:
  - **Sama luas**: N bagian.
  - **Proporsi**: bobot (mis. 2:1:1), dinormalisasi otomatis.
  - **Luas tertentu**: m² (atau tumbak/bata) per bagian, terakhir = sisa; total > luas bidang → error dengan selisihnya.
- Output per garis potong: panjang garis; untuk tiap ujung, sisi yang terpotong dan jarak dari **pojok terdekat** ("di sisi BC, 4,25 m dari B").
- Output per bagian: luas (semua satuan), keliling, persentase; catatan pembulatan ±0,01.
- Garis yang menyentuh batas bidang > 2 kali → hasil split tidak ditampilkan; peringatan + saran ganti sisi acuan/arah.

### 5.7 UI (mobile-first)

- **HP (< 768 px):** satu kolom. Header (judul, ⚙, ⤴) → gambar SVG sticky ±45% tinggi layar → ringkasan luas/tumbak/keliling → tab **Ukuran** | **Bagi**.
- **Layar lebar (≥ 768 px):** gambar di kiri, panel di kanan.
- **Tab Ukuran:** stepper sisi 3–10 (menambah sisi menyisipkan pojok sebelum A tanpa menghapus data), kolom per sisi/diagonal (`inputmode="decimal"`), toggle ↺ balik per pojok C.., kolom yang difokuskan menyorot garisnya di gambar, tips bentuk L.
- **Tab Bagi:** chip sisi acuan, toggle Sejajar/Tegak lurus, mode + input bagian, kartu bagian (warna sama dengan arsiran gambar) dan kartu patok.
- **SVG:** auto-fit `viewBox`; label pojok & panjang sisi di luar bidang; diagonal putus-putus; bagian diarsir dengan nomor; patok berupa bulatan. Input tidak valid → bentuk valid terakhir ditampilkan pudar + badge "ukuran belum valid".
- **Aksesibilitas:** sentuh ≥ 44 px, kontras AA, dark mode sistem, label eksplisit.

### 5.8 Simpan, bagikan, offline

- **localStorage:** debounce 500 ms; try/catch di semua akses; storage tidak tersedia → aplikasi tetap jalan + catatan "data tidak tersimpan"; data rusak/versi tak dikenal → mulai dari contoh default + pemberitahuan; tombol "Mulai baru" dengan konfirmasi.
- **Share link:** `#d=<base64url dari array ringkas>` (< ~300 karakter). Web Share API dengan teks "Luas X m² (Y tumbak) — lihat denah: <link>"; fallback salin ke clipboard. Membuka link saat ada data lokal → dialog konfirmasi ganti. Setelah dimuat, hash dibersihkan. Link rusak → "link tidak valid", data lokal tidak disentuh.
- **PWA:** precache semua aset; manifest "Patok — Hitung & Bagi Tanah", ikon, `standalone`; toast "Versi baru tersedia · Muat ulang" (tidak reload paksa).
- **Hosting:** folder `dist/` statis (GitHub Pages / Netlify / Cloudflare Pages / nginx VPS), base path dapat dikonfigurasi.

### 5.9 Prinsip error

Tidak ada error yang membuat aplikasi crash. Setiap masalah ditampilkan di tempatnya (kolom, gambar, atau toast) dengan kalimat yang menjelaskan apa yang harus dicek pengguna.

### 5.10 Strategi pengujian

1. **Unit geometri (Vitest):** persegi 10×10 → 100 m²; persegi panjang 20×15 → 300; segitiga 3-4-5 → 6; trapesium siku; bentuk L (A di pojok dalam) = jumlah 2 persegi panjang; bentuk L dengan diagonal luar + flip = hasil yang sama; 1-1-5 → error menyebut segitiga; selisih 0,3% → peringatan; flip yang menyilang → error.
2. **Unit split:** persegi 10×10 bagi 2 sejajar AB → garis di y = 5, patok 5,00 m; trapesium bagi 3 sama luas (toleransi 0,001 m²); proporsi 2:1:1; "100 m² + sisa"; total berlebih → error; bentuk U terpotong 3 → peringatan.
3. **Property test (fast-check):** poligon cembung acak, N acak → Σ luas bagian = luas total dan tiap bagian sesuai target.
4. **share/persist:** round-trip identik; link rusak/versi tak dikenal ditolak aman; storage yang melempar error tidak membuat aplikasi crash.
5. **E2E (Playwright, viewport 390×844):** isi persegi panjang → luas & tumbak benar; bagi 3 → 3 kartu bagian + 2 kartu patok; bagikan → buka link → data termuat.
6. **Manual pra-rilis:** Chrome Android + Safari iPhone, instal ke layar utama, mode pesawat tetap berfungsi; Lighthouse PWA & Accessibility ≥ 90.

---

## 6. Decision Log

| # | Keputusan | Alternatif | Alasan |
|---|---|---|---|
| 1 | Input sisi + diagonal (triangulasi) | sisi + sudut; asumsi siku; gambar titik bebas | Bisa diukur dengan meteran saja; bentuk terkunci tepat |
| 2 | Split berdasarkan target luas | jarak dari tepi; geser manual; keduanya | Sesuai kasus warisan/jual sebagian |
| 3 | Arah sejajar/tegak lurus terhadap sisi acuan | sumbu layar; sejajar saja | Bentuk tidak punya orientasi layar yang bermakna; sesuai praktik |
| 4 | Split 1 arah, N bagian | bertingkat; grid kavling | YAGNI; cukup untuk kasus utama |
| 5 | Output luas + ukuran patok | luas + keliling saja; semua sisi tiap bagian | Jarak patok yang dibutuhkan di lapangan |
| 6 | Cekung didukung; diagonal kipas dari A + toggle `flip` (awalnya "reflex") | cembung saja; diagonal bebas | Bentuk L cukup dengan A di pojok dalam; flip hanya untuk diagonal luar |
| 7 | localStorage + share link | tanpa simpan; ekspor PDF; akun | Tanpa server, mudah dikirim via WhatsApp |
| 8 | PWA statis offline | online saja; satu file HTML; VPS | Lokasi tanah sering tanpa sinyal |
| 9 | Satuan tumbak & bata, default 14 m², dapat diubah | tidak didukung; nilai tetap | Satuan lazim di masyarakat; nilai berbeda antar daerah |
| 10 | Svelte + Vite + TypeScript | vanilla TS; satu file HTML | UI reaktif untuk form dinamis; bundle kecil; inti geometri teruji |
| 11 | Rendering SVG | Canvas | Tajam di semua resolusi; teks label; auto-fit `viewBox` |
| 12 | Posisi garis potong dicari dengan bisection | solusi analitik per segmen | Sederhana, pasti konvergen, cukup cepat |
| 13 | Data share di hash URL | query string; server pendek-link | Tidak terkirim ke server; tanpa backend |
| 14 | Toleransi segitiga 0,5% | ketat 0%; toleransi lebih besar | Menampung salah baca meteran yang wajar, menolak data yang tidak konsisten |

## 7. Risiko yang Diakui

- **Salah urutan pojok/diagonal oleh pengguna** → mitigasi: sorot garis di gambar saat kolom difokuskan, validasi menyilang, tips pojok A.
- **Pembagian bidang cekung tidak terdefinisi** (lebih dari 2 potong) → ditolak dengan saran, bukan dihitung diam-diam.
- **Nilai tumbak/bata berbeda antar daerah** → faktor bisa diubah dan ditampilkan di pengaturan.
- **Disalahartikan sebagai ukuran resmi** → disclaimer jelas di aplikasi.
- **Tidak ada pemeriksaan silang ukuran** (data tepat 2N−3) → kemungkinan pengembangan: diagonal tambahan opsional untuk cek konsistensi (di luar lingkup v1).

## 8. Catatan Implementasi (v1.0.0)

Perbedaan kecil dari desain awal, ditemukan saat implementasi:

| # | Keputusan | Alasan |
|---|---|---|
| 15 | Nama aplikasi **Patok**, repo `patok-tanah` | Singkat, mudah diingat, merujuk ke hasil utama (posisi patok) |
| 16 | Model `split` menyimpan isian tiap mode secara terpisah (`count`, `ratios`, `areas`) + `on` | Berpindah mode tidak menghapus isian pengguna |
| 17 | Menambah pojok: sisi penutup lama (mis. DA) menjadi diagonal baru (AD); mengurangi pojok: sebaliknya | Ukuran yang sudah diukur tidak terbuang |
| 18 | Selain cek "lebih dari 2 perpotongan", garis potong juga ditolak bila tepat menyentuh pojok cekung (titik patok ≠ 2) | Bagian yang hanya tersambung di satu titik bukan bagian yang menyatu |
| 19 | Bukti: bila tiap garis potong memotong batas tepat 2 kali, setiap bagian (termasuk "jalur" di antara dua garis) pasti menyatu | Cukup memeriksa garis potong, tidak perlu memeriksa setiap bagian |
| 20 | Cara pakai juga tersedia di dalam aplikasi (tombol ?), selain [panduan-pengguna.md](panduan-pengguna.md) | Pengguna di lapangan tidak membuka GitHub |
| 21 | Service worker `registerType: 'prompt'` | Sesuai desain: tidak memuat ulang paksa saat pengguna sedang mengisi |

Hasil verifikasi: 62 unit/property test dan 8 uji E2E (viewport 390×844, termasuk offline) lulus.
