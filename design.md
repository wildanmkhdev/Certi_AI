
# CertiAI — Design Brief (UIN Sumatera Utara)

Dokumen ini adalah instruksi desain untuk membangun ulang landing page **CertiAI**, sistem verifikasi sertifikat mahasiswa berbasis AI untuk UIN Sumatera Utara. Ikuti spesifikasi ini secara ketat — warna, tipografi, struktur, dan copy sudah final dan diambil dari identitas resmi kampus.

## 1. Ringkasan Produk

- **Nama produk:** CertiAI
- **Institusi:** UIN Sumatera Utara Medan
- **Fungsi:** Mahasiswa mengunggah sertifikat kegiatan (PDF/JPG/PNG, maks 10MB) → sistem membaca dan merekomendasikan kategori, durasi, dan bobot penilaian → Dosen meninjau, menyesuaikan bila perlu, lalu menyetujui.
- **Prinsip inti yang harus terasa di seluruh halaman:** *"Sistem merekomendasikan. Manusia memutuskan."* — sistem membantu menghasilkan rekomendasi bobot dan hasil, keputusan akhir selalu di tangan dosen.
- **Aturan penamaan wajib:** JANGAN memakai frasa "dianalisis AI" / "AI menganalisis" / "AI menyarankan" di manapun pada copy. Selalu sebut pelakunya sebagai **"sistem"** (misal: "sistem merekomendasikan bobot", "sistem membaca sertifikat", "rekomendasi sistem"). Kata "AI" hanya boleh muncul sebagai bagian dari nama produk "CertiAI" — bukan sebagai kata kerja/pelaku dalam kalimat.
- **Target pengguna:** dua peran — mahasiswa (unggah) dan dosen (tinjau/setujui). Rentang usia pengguna luas (mahasiswa muda hingga dosen senior), jadi keterbacaan dan kejelasan harus diutamakan di atas tren visual.

## 2. Palet Warna (wajib, jangan diubah)

Warna diambil langsung dari logo resmi UIN Sumatera Utara (sampling piksel, bukan perkiraan). Dominan **putih + hijau**. Emas hanya aksen sangat tipis di satu elemen, bukan warna utama.

| Token           | Hex         | Penggunaan                                                                                                          |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `--white`     | `#FFFFFF` | Background utama                                                                                                    |
| `--bg-soft`   | `#F5F8F4` | Background section lembut, gradient hero                                                                            |
| `--bg-soft-2` | `#E2EEDD` | Divider halus, blob dekoratif                                                                                       |
| `--green-100` | `#F1F6EF` | Background badge/eyebrow, ikon container                                                                            |
| `--green-200` | `#E2EEDD` | Border kartu, badge                                                                                                 |
| `--green-600` | `#3F8523` | Aksen sekunder (jarang dipakai)                                                                                     |
| `--green-700` | `#31681C` | Tombol utama, link, ikon aktif                                                                                      |
| `--green-800` | `#224813` | **Hijau resmi logo UINSU** — hover tombol, teks aksen kuat                                                   |
| `--green-950` | `#17300D` | Warna judul (headline), background section gelap (banner CTA, blok "Cara Kerja")                                    |
| `--gold`      | `#D19200` | Aksen sangat tipis — hanya untuk 1 elemen (border dashed pada "stempel" sertifikat), diambil dari cincin emas logo |
| `--ink`       | `#16210F` | Warna teks body                                                                                                     |
| `--ink-soft`  | `#48543F` | Teks sekunder/deskripsi                                                                                             |
| `--line`      | `#DCE8D6` | Border kartu, pembatas                                                                                              |

**Aturan pemakaian warna:**

- Background section bergantian antara putih polos dan `--bg-soft` untuk membuat ritme visual tanpa warna baru.
- Elemen gelap (banner CTA, blok proses 3 langkah) memakai `--green-950` sebagai background solid dengan teks putih — ini satu-satunya area "kontras tinggi", jangan diulang di lebih dari 2 section agar tetap istimewa.
- Jangan menambahkan warna lain (biru, merah, ungu, dll) di luar tabel ini kecuali untuk ikon status error (jika ada, gunakan merah netral standar aksesibilitas, bukan warna brand).

## 3. Tipografi

- **Display/Judul:** `Fraunces` (serif, variable optical size). Dipakai untuk semua `h1`, `h2`, `h3`. Beri kesan akademis, hangat, terpercaya — bukan serif dekoratif yang berat.
  - Weight: 400–700, gunakan 500–600 untuk sebagian besar judul.
  - `letter-spacing: -0.01em` pada headline besar.
- **Body/UI:** `Inter` (sans, sangat terbaca lintas usia). Dipakai untuk paragraf, tombol, label, navigasi.
  - Weight minimum untuk teks kecil: 400 (jangan pakai 300, terlalu tipis untuk keterbacaan).
- **Ukuran dasar:** `font-size: 17px`, `line-height: 1.65` pada body — lebih besar dari standar landing page trendy karena target pengguna lintas usia.
- **Skala judul:** hero title `clamp(34px, 4.4vw, 52px)`; section title `clamp(26px, 3vw, 34px)`.
- Import via Google Fonts: `Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700` + `Inter:wght@400;500;600;700`.

## 4. Prinsip Layout & Komponen

- **Radius:** besar (`20px` kartu utama, `14px` kartu kecil, `10px` elemen dalam), sudut membulat lembut — bukan tajam, bukan pill berlebihan di luar tombol.
- **Shadow:** soft, menyebar lebar, opacity rendah (`rgba(11,61,46,0.25–0.35)` dengan blur besar) — bukan shadow tajam/kontras tinggi.
- **Tombol:** minimum tinggi 44px (target tap ramah untuk semua usia), rounded-full (`border-radius:999px`), dua varian: `btn-primary` (isi hijau `--green-700`, teks putih) dan `btn-ghost` (outline tipis, teks hijau).
- **Focus state:** wajib ada, `outline: 3px solid var(--green-700)` + offset — jangan hilangkan untuk aksesibilitas keyboard.
- **Reduced motion:** hormati `prefers-reduced-motion` — matikan animasi jika user memintanya.
- **Numbered steps:** hanya dipakai untuk section "Cara Kerja" karena memang proses berurutan nyata (bukan dekorasi).

## 5. Elemen Signature (wajib ada, ini identitas visual utama halaman)

Ilustrasi **"kartu sertifikat + stempel centang"** di hero — metafora konkret yang langsung dikenali semua kalangan usia, dibuat dengan SVG/CSS custom (bukan foto/ikon generik AI):

- Kartu putih dimiringkan sedikit (`rotate(-4deg)`), berisi badge bulat hijau dengan ikon centang, beberapa garis placeholder teks, lalu kotak "stempel" dengan border dashed emas berisi teks "Sertifikat Terverifikasi".
- Di atasnya, kartu kecil melayang (`rotate(3deg)`, posisi absolute di kanan-bawah kartu utama) menampilkan **contoh hasil analisis AI nyata**: Kategori: Workshop, Durasi: 8 Jam, Bobot: 1, status "✓ Disetujui".
- Motif kartu hasil analisis ini diulang secara konsisten di section "Contoh Hasil Analisis" agar jadi benang merah visual, bukan elemen sekali pakai.

## 6. Struktur Halaman & Copy (urutan wajib)

### a. Nav (sticky, blur background saat scroll)

- Kiri: logo resmi UINSU (file `uinsu-logo.png`) + "CertiAI" (Fraunces) + subteks kecil "UIN Sumatera Utara" (Inter, abu-hijau).
- Kanan: tombol "Masuk" (ghost) + "Daftar Gratis" (primary).

### b. Hero

- Eyebrow badge: "Sistem Rekomendasi Bobot Sertifikat"
- Headline (2 baris): **"Bobot sertifikat direkomendasikan sistem, keputusan tetap di tangan dosen."** — kata "dosen" diberi warna aksen hijau.
- Subheadline: "Unggah sertifikat kegiatan, sistem akan membaca dan merekomendasikan bobotnya. Dosen tinggal meninjau dan menyetujui — lebih ringkas dari proses manual selama ini."
- Dua CTA: "Daftar Sekarang — Gratis" (primary) + "Lihat Cara Kerja" (ghost, scroll ke #cara-kerja)
- Baris chip fakta (bukan klaim persentase yang tidak bisa dibuktikan): "🗂️ 3 Langkah Sederhana" / "📄 PDF & Gambar, maks 10MB" / "✅ Keputusan Akhir oleh Dosen"
- Kanan: elemen signature (lihat bagian 5) — label pada kartu hasil melayang: **"Rekomendasi Bobot & Hasil"**, bukan "Hasil Analisis AI".

> **Catatan penting:** JANGAN pakai klaim angka seperti "99% akurasi" atau "hemat waktu 90%" tanpa data nyata untuk mendukungnya — ganti selalu dengan fakta struktural yang bisa dipertanggungjawabkan (jumlah langkah, format file, siapa yang memutuskan).

### c. Untuk Siapa (2 kartu berdampingan)

- Kartu "Untuk Mahasiswa": ikon topi wisuda, deskripsi singkat, 3 poin bullet (unggah dari HP/laptop, lihat status langsung, riwayat tersimpan rapi).
- Kartu "Untuk Dosen": ikon orang/review, deskripsi singkat, 3 poin bullet (ringkasan AI siap ditinjau, bobot bisa diubah, tercatat sebagai jejak audit).

### d. Cara Kerja (background hijau tua `--green-950`, teks putih, dalam container rounded besar)

3 langkah bernomor (garis penghubung horizontal tipis di desktop):

1. **Unggah Sertifikat** — drag & drop, PDF/JPG/PNG maks 10MB.
2. **Sistem Membaca & Merekomendasikan** — mengenali kategori & durasi, merekomendasikan bobot. Tag: "Teknologi pembacaan otomatis".
3. **Dosen Meninjau & Menyetujui** — dosen memeriksa rekomendasi sistem, menyesuaikan, memberi keputusan akhir. Tag: "Keputusan manusia".

### e. Kenapa CertiAI (grid 4 kartu)

- Cepat — rekomendasi keluar dalam hitungan detik.
- Aman — penyimpanan privat, akses terbatas.
- Manusia yang Memutuskan — sistem hanya merekomendasikan, dosen menentukan.
- Tercatat Rapi — jejak audit setiap tinjauan.

### f. Contoh Hasil Rekomendasi (2 kolom: copy kiri, kartu hasil rekomendasi kanan — background `--bg-soft` dalam container rounded besar)

- Judul section: "Seperti apa hasil rekomendasinya?"
- Kartu hasil berjudul **"Rekomendasi Bobot & Hasil"**, menampilkan contoh nyata: nama file sertifikat, Kategori, Durasi, Rekomendasi Bobot, status "Disetujui oleh Dosen Pembimbing".

### g. FAQ (accordion native `<details>/<summary>`, tanpa JS custom)

Minimal 4 pertanyaan: format file yang didukung, apakah bobot dari sistem langsung final, di mana data disimpan, apakah berbayar.

### h. CTA Banner penutup (background `--green-950`, rounded besar, terpusat)

- Judul ajakan + 1 kalimat pendukung + 2 tombol (Daftar / Masuk).

### i. Footer

- Logo + "CertiAI" kiri, copyright kanan.
- Tagline kecil dalam badge: "Sistem merekomendasikan. Manusia memutuskan."

## 7. Nada Bahasa (Tone of Voice)

- Bahasa Indonesia, aktif, langsung, tanpa jargon teknis berlebihan.
- Setiap tombol memakai kata kerja aktif dan konsisten dengan hasil aksinya (misal "Daftar Gratis" → mengarah ke halaman daftar yang sama).
- Jangan menjual berlebihan ("terdepan", "tercanggih se-Indonesia") — fokus pada apa yang produk benar-benar lakukan.
- Selalu tegaskan ulang di titik-titik kunci (hero, fitur, footer) bahwa **keputusan akhir ada di dosen**, karena ini poin kepercayaan paling penting untuk institusi pendidikan.

## 8. Checklist Aksesibilitas (wajib dipenuhi ulang saat rebuild)

- Kontras teks-terhadap-background minimum WCAG AA (terutama teks hijau di atas putih).
- Semua tombol ≥ 44px tinggi.
- Focus state terlihat jelas di semua elemen interaktif (bukan `outline:none`).
- Font body tidak lebih kecil dari 14.5px di manapun.
- Responsif penuh hingga lebar mobile ~360px; hero art pindah ke atas (`order:-1`) di layar sempit; grid 4 kolom fitur turun ke 1 kolom di mobile kecil.
- FAQ harus bisa dioperasikan dengan keyboard (gunakan elemen native `<details>`, bukan div custom tanpa ARIA).

## 9. Aset

- Logo resmi: `uinsu-logo.png` (transparent PNG) — dipakai di navbar (~38px) dan footer (~26px), jangan diberi background/border tambahan, biarkan tampil natural di atas putih.
