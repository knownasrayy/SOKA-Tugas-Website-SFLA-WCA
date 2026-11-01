# PRD: Website Presentasi Interaktif Algoritma Metaheuristik (SFLA & WCA)

**Mata Kuliah:** Strategi Optimasi Komputasi Awan
**Versi:** 1.0
**Jenis Produk:** Website presentasi statis (single-page application) dengan animasi interaktif

---

## 1. Ringkasan Produk

Website ini berfungsi sebagai **media presentasi** yang menjelaskan cara kerja dua algoritma metaheuristik, yaitu **Shuffled Frog-Leaping Algorithm (SFLA)** dan **Water Cycle Algorithm (WCA)**, melalui animasi visual berbasis metafora alam. Penonton harus bisa memahami alur algoritma lewat gambar dan gerakan, dengan teks seminimal mungkin.

Website dipakai langsung saat presentasi di kelas (layar proyektor), sehingga navigasinya harus nyaman dengan keyboard/clicker, dan tampilannya terbaca dari jarak jauh.

## 2. Tujuan dan Metrik Keberhasilan

### Tujuan utama

1. Menjelaskan alur kerja SFLA dan WCA secara visual, langkah demi langkah.
2. Menunjukkan bahwa kedua algoritma benar-benar mengoptimasi sebuah masalah (bukan sekadar animasi dekoratif).
3. Menghubungkan teori dengan konteks komputasi awan (penjadwalan tugas ke VM).

### Metrik keberhasilan

- Penonton non-teknis bisa menjelaskan ulang ide dasar tiap algoritma setelah presentasi.
- Seluruh presentasi dapat dibawakan dalam 10–15 menit tanpa membuka aplikasi lain.
- Animasi berjalan lancar (target 60 FPS) di laptop biasa pada resolusi 1920×1080.
- Tidak ada error di console saat demo; tidak butuh koneksi internet saat presentasi.

## 3. Target Pengguna

- **Presenter (mahasiswa):** butuh kontrol penuh: maju/mundur slide, play/pause/step animasi, reset, ubah parameter.
- **Audiens (dosen dan teman sekelas):** butuh visual yang jelas, kontras tinggi, teks besar, dan alur yang mudah diikuti.

## 4. Ruang Lingkup

### Termasuk (In Scope)

- Satu website dengan mode presentasi (slide-based) berisi pengantar, SFLA, WCA, perbandingan, dan penutup.
- Simulasi interaktif yang benar-benar menjalankan algoritma di browser (bukan video).
- Visualisasi kontur fungsi objektif 2D sebagai "peta" tempat agen bergerak.
- Mini studi kasus: penjadwalan tugas komputasi awan.

### Tidak Termasuk (Out of Scope)

- Backend, database, login, atau penyimpanan data pengguna.
- Benchmark ilmiah skala penuh atau perbandingan statistik dengan banyak algoritma lain.
- Dukungan perangkat mobile sebagai prioritas (cukup tidak rusak, fokus desktop/proyektor).

## 5. Rekomendasi Teknologi

| Aspek | Keputusan |
|---|---|
| Bahasa | HTML, CSS, JavaScript (ES Modules) |
| Build | Vite (opsional); alternatif: tanpa build tool, cukup buka `index.html` |
| Framework | Tidak wajib. Vanilla JS lebih ringan dan mudah di-debug. Boleh pakai React jika dianggap perlu |
| Animasi | Canvas 2D untuk simulasi (banyak partikel); SVG/CSS/GSAP untuk elemen dekoratif dan transisi |
| Library | GSAP (opsional) untuk transisi; tidak ada dependensi yang memerlukan internet saat runtime |
| Deployment | Static hosting (GitHub Pages / Vercel / Netlify) dan bisa dijalankan offline dari folder lokal |

**Aturan penting:** semua aset (font, ikon, gambar) harus di-bundle lokal agar presentasi aman tanpa internet.

## 6. Struktur Konten (Alur Slide)

| No | Bagian | Isi Utama |
|---|---|---|
| 1 | Judul | Nama topik, nama mata kuliah, nama anggota/penyaji |
| 2 | Masalah | Apa itu optimasi? "Mencari titik terendah di peta berbukit" (visual kontur) |
| 3 | Metaheuristik | Ide umum: populasi solusi, eksplorasi vs eksploitasi (1 diagram sederhana) |
| 4–9 | **SFLA** | Lihat bagian 7 |
| 10–15 | **WCA** | Lihat bagian 8 |
| 16 | Perbandingan | SFLA vs WCA berdampingan (simulasi di fungsi yang sama) |
| 17 | Konteks cloud | Penjadwalan tugas ke VM (opsional demo mini, bagian 9) |
| 18 | Kesimpulan | Poin kunci, kelebihan/kekurangan, referensi |

## 7. Spesifikasi Modul SFLA (Metafora: Katak di Kolam Teratai)

### 7.1 Konsep yang harus dijelaskan

SFLA adalah algoritma berbasis populasi yang menggabungkan pencarian lokal (di dalam kelompok) dan pertukaran informasi global (pengacakan ulang kelompok).

### 7.2 Pemetaan metafora

| Konsep Algoritma | Visual |
|---|---|
| Solusi (kandidat) | Seekor katak |
| Posisi katak | Posisi di kolam (koordinat 2D) |
| Fitness | Kualitas posisi (makin dekat dasar lembah makin baik); bisa ditampilkan lewat warna/ukuran/glow katak |
| Memeplex | Kelompok katak, tiap kelompok punya warna berbeda |
| Katak terbaik global | Katak bermahkota/emas |
| Daun teratai | Titik pijakan visual; kontur fungsi bisa diberi gaya kolam |

### 7.3 Alur algoritma (harus tercermin dalam animasi bertahap)

1. **Inisialisasi:** sebar F katak secara acak di kolam.
2. **Evaluasi dan urutkan:** hitung fitness, urutkan dari terbaik ke terburuk (tampilkan peringkat).
3. **Partisi ke memeplex:** katak ke-i dibagi ke memeplex secara bergilir (katak 1 ke M1, katak 2 ke M2, dst.) sehingga tiap kelompok seimbang. Animasi: katak berwarna sesuai kelompok.
4. **Evolusi lokal di tiap memeplex:** pilih submemeplex, lalu ulangi sebanyak N iterasi lokal:
   - Katak **terburuk** (Xw) melompat ke arah katak **terbaik memeplex** (Xb): `Xbaru = Xw + r · (Xb − Xw)`, dengan `r` acak 0–1 dan langkah dibatasi `Dmax`.
   - Jika tidak membaik, coba lompat ke arah **terbaik global** (Xg).
   - Jika masih tidak membaik, **ganti dengan katak acak baru**.
   - Animasi: panah lompatan, efek percikan air, status "lompatan berhasil/gagal".
5. **Shuffle:** seluruh katak dicampur kembali, diurutkan ulang, dan dibagi ulang ke memeplex baru (animasi katak berpindah warna kelompok).
6. **Cek terminasi:** ulangi sampai iterasi maksimum atau konvergen; katak terbaik ditandai.

### 7.4 Parameter yang bisa diatur lewat UI

Jumlah katak (F), jumlah memeplex (m), iterasi lokal (N), langkah maksimum (Dmax), kecepatan animasi.

## 8. Spesifikasi Modul WCA (Metafora: Siklus Air)

### 8.1 Konsep yang harus dijelaskan

WCA meniru aliran sungai menuju laut: aliran kecil mengalir ke sungai, sungai ke laut (titik terbaik), lalu penguapan dan hujan menjaga keragaman pencarian.

### 8.2 Pemetaan metafora

| Konsep Algoritma | Visual |
|---|---|
| Solusi | Tetesan air / aliran |
| Solusi terbaik (global) | **Laut** |
| Beberapa solusi terbaik berikutnya | **Sungai** |
| Solusi lainnya | **Aliran (stream)** |
| Pergerakan | Aliran menuju sungai, sungai menuju laut |
| Penguapan | Tetesan naik menguap saat sungai sudah dekat laut |
| Hujan | Tetesan baru turun di posisi acak |

### 8.3 Alur algoritma

1. **Inisialisasi populasi:** sebar tetesan acak; hitung fitness; urutkan.
2. **Tentukan hierarki:** terbaik = laut; `Nsr − 1` terbaik berikutnya = sungai; sisanya = aliran. Jumlah aliran per sungai/laut dibagi **proporsional dengan intensitas aliran** (aliran yang lebih baik mendapat lebih banyak anak aliran). Animasi: pewarnaan tiga tingkat (laut/sungai/aliran).
3. **Aliran mengalir ke sungai:** `X_aliran(t+1) = X_aliran + rand · C · (X_sungai − X_aliran)`, dengan `C ≈ 2`.
4. **Sungai mengalir ke laut:** `X_sungai(t+1) = X_sungai + rand · C · (X_laut − X_sungai)`.
5. **Pertukaran peran:** jika aliran/sungai menemukan posisi lebih baik dari atasannya, tukar peran (animasi swap yang jelas, misalnya kilatan cahaya).
6. **Penguapan:** jika jarak sungai ke laut `< dmax`, sungai dianggap menguap (animasi uap naik).
7. **Hujan:** tetesan baru dibangkitkan di posisi acak (atau di sekitar laut untuk eksploitasi) lalu bergabung kembali ke populasi.
8. **Update `dmax`:** `dmax = dmax − dmax / iterasi_maks` (makin lama makin kecil, sehingga pencarian makin fokus).
9. Ulangi sampai terminasi.

### 8.4 Parameter yang bisa diatur lewat UI

Ukuran populasi, jumlah sungai+laut (Nsr), nilai `dmax`, konstanta `C`, kecepatan animasi.

## 9. Studi Kasus Cloud (Mini Demo)

**Tujuan:** menunjukkan relevansi dengan mata kuliah.

**Skenario:** menjadwalkan *n* tugas ke *m* mesin virtual (VM) dengan tujuan meminimalkan **makespan** (waktu selesai terakhir).

- **Representasi solusi:** array panjang *n*, tiap elemen adalah indeks VM tempat tugas dijalankan (katak/tetesan = satu jadwal lengkap).
- **Fitness:** makespan (semakin kecil semakin baik).
- **Visual:** bar beban per VM yang makin seimbang seiring iterasi, plus grafik konvergensi makespan.
- Ringkas saja: cukup satu slide dengan tombol "Jalankan", jangan membuat panel yang rumit.

**Catatan untuk implementator:** karena SFLA/WCA bekerja di ruang kontinu, gunakan **pembulatan/pemetaan** (misalnya nilai kontinu dibulatkan ke indeks VM) dan jelaskan itu secara singkat di slide.

## 10. Fungsi Objektif untuk Simulasi Visual

Gunakan ruang 2D agar mudah divisualisasikan sebagai peta kontur (heatmap/contour):

| Fungsi | Karakter | Kegunaan |
|---|---|---|
| **Sphere** | Satu lembah mulus | Demo awal yang mudah dipahami |
| **Rastrigin** | Banyak lembah lokal | Menunjukkan eksplorasi vs jebakan optimum lokal |
| **Ackley** | Banyak lembah dengan lembah global dalam | Alternatif yang menarik secara visual |

Tampilan: kontur sebagai latar, posisi global optimum ditandai (bisa disembunyikan agar jadi "kejutan"), jejak (trail) pergerakan agen opsional.

## 11. Kebutuhan Fungsional

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-01 | Navigasi slide dengan tombol panah, spasi, dan klik; indikator progres | Wajib |
| F-02 | Mode layar penuh (tombol dan tombol `F`) | Wajib |
| F-03 | Simulasi SFLA berjalan nyata dengan kontrol Play / Pause / Step / Reset | Wajib |
| F-04 | Simulasi WCA berjalan nyata dengan kontrol Play / Pause / Step / Reset | Wajib |
| F-05 | Mode "Step-by-step" yang menampilkan label tahap saat ini (misalnya "Partisi memeplex", "Hujan") | Wajib |
| F-06 | Panel parameter yang bisa disembunyikan agar layar bersih saat presentasi | Wajib |
| F-07 | Pilihan fungsi objektif (Sphere / Rastrigin / Ackley) | Wajib |
| F-08 | Slider kecepatan animasi | Wajib |
| F-09 | Grafik konvergensi (fitness terbaik per iterasi) | Wajib |
| F-10 | Penampil nilai "terbaik saat ini" dan nomor iterasi | Wajib |
| F-11 | Slide perbandingan SFLA vs WCA berdampingan pada fungsi dan seed yang sama | Sebaiknya ada |
| F-12 | Mini demo penjadwalan tugas cloud | Sebaiknya ada |
| F-13 | Seed acak yang bisa diatur agar demo bisa diulang persis sama | Sebaiknya ada |
| F-14 | Mode narasi/catatan presenter (tekan `N`) berisi poin bicara tiap slide | Opsional |

## 12. Kebutuhan Non-Fungsional

- **Performa:** minimal 60 FPS untuk populasi ≤ 100 agen; gunakan `requestAnimationFrame` dan pisahkan logika algoritma dari rendering.
- **Keterbacaan:** ukuran font isi minimal 28px di resolusi 1920×1080; kontras tinggi; jangan bergantung pada warna saja (tambahkan bentuk/label).
- **Keandalan:** bekerja offline; tidak ada error console; tidak ada dependensi CDN saat runtime.
- **Kompatibilitas:** Chrome dan Edge versi terbaru (utama), Firefox (sekunder).
- **Aksesibilitas dasar:** dukungan `prefers-reduced-motion` (kurangi efek dekoratif), fokus keyboard terlihat.
- **Kode:** modular, bernama jelas, diberi komentar pada rumus penting agar bisa dipertanggungjawabkan saat ditanya dosen.

## 13. Arsitektur dan Struktur Folder

```
project-root/
├── index.html
├── package.json              (jika memakai Vite)
├── src/
│   ├── main.js               # inisialisasi, router slide
│   ├── slides/               # konten per slide
│   ├── core/
│   │   ├── rng.js            # random bersiklus (seedable)
│   │   ├── objectives.js     # Sphere, Rastrigin, Ackley
│   │   └── engine.js         # loop animasi, play/pause/step
│   ├── algorithms/
│   │   ├── sfla.js           # logika SFLA murni (tanpa DOM)
│   │   ├── wca.js            # logika WCA murni (tanpa DOM)
│   │   └── cloudScheduling.js
│   ├── render/
│   │   ├── contourRenderer.js
│   │   ├── sflaRenderer.js   # katak, memeplex, lompatan
│   │   ├── wcaRenderer.js    # aliran, sungai, laut, hujan
│   │   └── chart.js          # grafik konvergensi
│   ├── ui/                   # kontrol, panel parameter, navigasi
│   └── styles/
└── public/                   # aset lokal (font, gambar)
```

**Prinsip arsitektur:** algoritma dibuat sebagai **mesin berbasis langkah (state machine / generator)** yang mengeluarkan "event tahap" (misalnya `PARTITION`, `LOCAL_JUMP`, `SHUFFLE`, `STREAM_FLOW`, `EVAPORATE`, `RAIN`). Renderer hanya membaca state dan event tersebut. Dengan begitu mode Step-by-step dan animasi satu desain.

## 14. Arah Desain Visual

- **Gaya umum:** bersih, modern, minim teks, satu ide per slide.
- **SFLA:** palet hijau-teal kolam, daun teratai, katak bergaya sederhana (SVG/flat), percikan air saat mendarat.
- **WCA:** palet biru-cyan dari pegunungan ke laut, aliran garis lengkung, uap dan hujan sebagai partikel.
- **Tipografi:** satu keluarga font untuk judul dan satu untuk isi; font dibundel lokal.
- **Transisi:** halus, tidak berlebihan; animasi harus **membantu penjelasan**, bukan menghalangi.
- Hindari tampilan template generik; beri identitas visual yang konsisten antara dua modul, namun bedakan warna dominannya.

## 15. Kriteria Penerimaan (Acceptance Criteria)

1. Slide dapat dinavigasi penuh dengan keyboard dan klik, dari judul sampai kesimpulan.
2. Di slide SFLA, menekan "Step" berulang menampilkan urutan tahap yang benar: inisialisasi → urut → partisi → lompatan lokal → shuffle.
3. Di slide WCA, menekan "Step" berulang menampilkan: hierarki laut/sungai/aliran → aliran mengalir → pertukaran peran → penguapan → hujan.
4. Nilai fitness terbaik pada grafik konvergensi **menurun/tidak memburuk** seiring iterasi pada Sphere untuk kedua algoritma.
5. Dengan seed yang sama, hasil animasi identik setiap kali dijalankan ulang.
6. Perubahan parameter (jumlah agen, memeplex, dll.) berpengaruh nyata pada simulasi setelah Reset.
7. Website berjalan penuh tanpa internet dan tanpa error console.
8. Slide perbandingan menjalankan kedua algoritma pada fungsi yang sama secara berdampingan.

## 16. Rencana Implementasi Bertahap

| Fase | Kegiatan | Hasil |
|---|---|---|
| 1 | Setup proyek, kerangka slide, navigasi, tema visual | Kerangka presentasi berfungsi |
| 2 | Fungsi objektif, RNG seedable, renderer kontur | Peta kontur tampil |
| 3 | Mesin SFLA + renderer + kontrol | Modul SFLA lengkap |
| 4 | Mesin WCA + renderer + kontrol | Modul WCA lengkap |
| 5 | Grafik konvergensi, panel parameter, mode step | Interaksi lengkap |
| 6 | Slide perbandingan dan mini demo cloud | Konten pelengkap |
| 7 | Polesan: animasi transisi, catatan presenter, optimasi performa, uji layar proyektor | Siap presentasi |

## 17. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Animasi berat dan patah-patah | Canvas untuk agen, batasi jumlah partikel dekoratif, pisahkan logika dari render |
| Animasi menarik tetapi algoritma tidak benar | Tulis logika murni di `algorithms/` dan uji dengan fungsi Sphere sebelum menambah visual |
| Terlalu banyak teks di slide | Maksimal 1 kalimat kunci per tahap; penjelasan detail dibawakan secara lisan |
| Internet mati saat presentasi | Semua aset lokal; siapkan salinan hasil build di flashdisk |
| Demo hasilnya berbeda tiap run | Fitur seed tetap |

## 18. Instruksi Khusus untuk Claude Code

> Salin bagian ini sebagai arahan kerja di awal sesi.

1. Baca seluruh PRD ini terlebih dahulu, lalu buat **rencana kerja singkat per fase** sebelum menulis kode.
2. Kerjakan **per fase** (bagian 16) dan pastikan tiap fase berjalan sebelum lanjut. Jangan membangun semuanya sekaligus.
3. Implementasikan algoritma sebagai logika murni di `src/algorithms/` tanpa akses DOM, dengan keluaran berupa event tahap, sesuai bagian 13.
4. Rumus SFLA dan WCA harus mengikuti bagian 7 dan 8. Jika ada ambiguitas, pilih interpretasi paling standar dari literatur dan tulis asumsinya di komentar.
5. Jalankan dan uji hasilnya (uji konvergensi pada Sphere untuk kedua algoritma) sebelum menyatakan selesai.
6. Pastikan tidak ada dependensi yang butuh internet saat runtime.
7. Di akhir, buat `README.md` berisi cara menjalankan, cara build, daftar shortcut keyboard, dan penjelasan singkat struktur kode.
8. Jika ada keputusan desain yang belum ditentukan di PRD, ambil keputusan yang masuk akal, catat di README, dan jangan berhenti untuk bertanya kecuali benar-benar buntu.

## 19. Referensi Konsep

- Eusuff, M. M., & Lansey, K. E. (2003). *Optimization of water distribution network design using the shuffled frog leaping algorithm.* Journal of Water Resources Planning and Management. (SFLA)
- Eskandar, H., Sadollah, A., Bahreininejad, A., & Hamdi, M. (2012). *Water cycle algorithm: A novel metaheuristic optimization method for solving constrained engineering optimization problems.* Computers & Structures. (WCA)
