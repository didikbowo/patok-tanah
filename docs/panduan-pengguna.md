# Panduan Pengguna Patok

Panduan ini menjelaskan cara mengukur tanah di lapangan dan memakai Patok untuk menghitung luas serta membagi tanah.

> **Penting:** hasil Patok adalah perkiraan dari ukuran yang Anda masukkan. Untuk sertifikat, jual-beli resmi, atau sengketa, gunakan pengukuran resmi BPN atau juru ukur berlisensi.

---

## 1. Yang perlu disiapkan

- Meteran (pita ukur), sebaiknya yang panjangnya cukup untuk diagonal terpanjang.
- Teman untuk memegang ujung meteran.
- HP dengan Patok yang sudah dibuka minimal sekali (supaya bisa dipakai tanpa sinyal, lihat [bagian 7](#7-memakai-tanpa-sinyal)).

## 2. Memberi nama pojok

1. Pilih satu pojok tanah sebagai **A**.
2. Beri nama pojok berikutnya **B, C, D, …** berurutan mengelilingi tanah. Arahnya bebas (searah atau berlawanan arah jarum jam), yang penting **berurutan**.

```
   D ─────────── C
   │             │
   │             │
   A ─────────── B
```

**Tanah bentuk L atau U?** Jadikan pojok yang **menjorok ke dalam** sebagai pojok A:

```
   C ───── B
   │       │
   │       A ───── F         A = pojok yang menjorok ke dalam
   │               │
   D ───────────── E
```

Dengan cara ini semua diagonal dari A berada di dalam tanah, sehingga mudah diukur dan tombol "balik" tidak diperlukan.

## 3. Mengukur

### Sisi

Ukur setiap sisi berurutan: **AB, BC, CD, …**, sampai sisi terakhir yang kembali ke A.

### Diagonal dari pojok A

Tarik meteran **lurus dari pojok A** ke setiap pojok yang tidak bersebelahan dengan A:

| Jumlah sisi | Diagonal yang diukur |
|---|---|
| 3 (segitiga) | tidak perlu |
| 4 | AC |
| 5 | AC, AD |
| 6 | AC, AD, AE |
| N | N − 3 diagonal |

**Kenapa diagonal wajib?** Empat sisi dengan panjang yang sama bisa membentuk persegi, tapi juga jajar genjang yang "miring", dan luas keduanya berbeda. Diagonal mengunci bentuk tanah sehingga luasnya pasti.

### Tips mengukur

- Tarik meteran **kencang dan lurus**, jangan sampai melengkung atau melendut.
- Ukur dari **titik patok/pagar yang sama** setiap kali.
- Kalau ragu, ukur dua kali lalu ambil rata-ratanya.
- Desimal boleh ditulis dengan koma atau titik (mis. `12,5` atau `12.5`).

## 4. Memasukkan ukuran (tab "Ukuran")

1. Atur **Jumlah sisi** dengan tombol − / +.
2. Isi **Panjang sisi** dan **Diagonal dari pojok A**.
3. Ketuk sebuah kolom: garisnya akan **disorot oranye** di gambar, jadi Anda tahu garis mana yang sedang diisi.
4. Luas (m², tumbak, bata, are, ha) dan keliling langsung muncul di bawah gambar.

### Kalau muncul pesan

| Pesan | Artinya | Yang perlu dicek |
|---|---|---|
| Kolom merah + *"Segitiga ACD tidak mungkin terbentuk"* | Satu ukuran lebih panjang dari jumlah dua ukuran lain di segitiga itu | Ukur ulang ketiga garis yang ditandai |
| Kuning *"hampir segaris"* | Ukuran sedikit tidak konsisten (≤ 0,5%), mungkin salah baca meteran | Hasil tetap dihitung, tapi sebaiknya ukur ulang |
| *"Bentuk menyilang"* | Ada sisi yang saling memotong | Cek tombol balik dan urutan nama pojok |
| *"Semua pojok berada pada satu garis"* | Ukuran membentuk garis lurus, luasnya nol | Cek ulang semua ukuran |

### Tombol "↺ balik"

Setiap pojok punya dua kemungkinan posisi: di kiri atau di kanan garis dari pojok A. Patok memilih posisi yang paling umum. Kalau gambar tidak mirip tanah Anda (biasanya karena ada diagonal yang lewat di luar tanah), ketuk **↺** pada pojok yang posisinya salah.

## 5. Membagi tanah (tab "Bagi")

1. Nyalakan **Bagi bidang**.
2. Pilih **Sisi acuan**, biasanya sisi depan atau sisi yang menghadap jalan. Sisi ini ditebalkan di gambar.
3. Pilih **Arah garis potong**:
   - **Sejajar sisi acuan**: setiap bagian mendapat potongan sisi acuan (mis. depan-belakang). Bagian 1 menempel pada sisi acuan.
   - **Tegak lurus**: setiap bagian mendapat akses ke sisi acuan (mis. berjajar menghadap jalan). Bagian 1 dimulai dari pojok pertama sisi acuan.
4. Pilih **Cara membagi**:
   - **Sama luas**: atur jumlah bagian.
   - **Proporsi**: isi perbandingan, mis. `2 : 1 : 1` (½, ¼, ¼).
   - **Luas tertentu**: isi luas bagian 1, 2, … dalam m², tumbak, atau bata. Bagian terakhir otomatis mendapat **sisa**.

### Membaca hasil

- **Hasil pembagian:** luas, persentase, dan keliling setiap bagian. Warna kartu sama dengan warna di gambar.
- **Posisi patok:** untuk setiap garis potong, misalnya:

  > **Garis potong 1** · panjang 19,40 m
  > ● Sisi BC: **4,15 m dari pojok B**
  > ● Sisi DA: **4,23 m dari pojok A**

  Di lapangan, tarik meteran dari pojok B menyusuri sisi BC sejauh 4,15 m lalu pasang patok. Lakukan hal yang sama di sisi DA. Garis lurus di antara kedua patok adalah batas pembagian.

### Kalau pembagian ditolak

Pada tanah cekung (L/U), garis lurus kadang membelah satu bagian menjadi dua potong yang terpisah. Patok tidak akan menghitungnya dan menampilkan saran untuk mencoba **sisi acuan atau arah lain**.

## 6. Menyimpan dan membagikan

- Data **tersimpan otomatis** di HP Anda. Saat Patok dibuka lagi, ukuran terakhir muncul kembali.
- Tombol **Bagikan** (ikon panah ke atas) mengirim link berisi semua ukuran, misalnya lewat WhatsApp. Penerima yang membuka link akan melihat gambar dan hasil yang sama.
- Kalau penerima sudah punya data sendiri, Patok akan **bertanya dulu** sebelum menggantinya.
- **Pengaturan → Mulai baru** menghapus semua ukuran dan kembali ke contoh awal.

Ukuran tanah hanya tersimpan di HP Anda dan di dalam link yang Anda bagikan sendiri. Tidak ada data yang dikirim ke server.

## 7. Memakai tanpa sinyal

1. Buka Patok sekali saat ada internet. Akan muncul pesan *"Siap dipakai tanpa sinyal"*.
2. Pasang ke layar utama:
   - **Android (Chrome):** menu ⋮ → **Tambahkan ke layar utama** / **Instal aplikasi**.
   - **iPhone (Safari):** tombol Bagikan → **Tambahkan ke Layar Utama**.
3. Di lokasi tanah, buka Patok dari ikon di layar utama. Semua fitur jalan tanpa internet, kecuali mengirim link bagikan.

Kalau muncul *"Versi baru tersedia"*, ketuk **Muat ulang** untuk memperbarui. Data Anda tidak hilang.

## 8. Satuan tumbak dan bata

Nilai 1 tumbak dan 1 bata berbeda antar daerah. Patok memakai **14 m²** sebagai bawaan. Ubah di **Pengaturan → Satuan lokal** kalau di daerah Anda nilainya lain.

## 9. Pertanyaan umum

**Kenapa luas di Patok berbeda dengan sertifikat?**
Sertifikat dibuat dari pengukuran resmi dengan alat yang lebih presisi. Selisih kecil wajar terjadi karena meteran yang melendut, patok yang bergeser, atau pembulatan. Selisih besar biasanya berarti ada ukuran atau urutan pojok yang salah.

**Tanah saya punya sisi melengkung.**
Patok hanya mendukung sisi lurus. Pecah lengkungan menjadi beberapa sisi lurus pendek dengan menambah pojok di sepanjang lengkungan.

**Tanah saya punya lebih dari 10 pojok.**
Bagi tanah menjadi dua bidang, hitung masing-masing, lalu jumlahkan luasnya.
