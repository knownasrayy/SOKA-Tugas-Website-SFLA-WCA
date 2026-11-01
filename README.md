# Website Presentasi Interaktif Algoritma Metaheuristik: SFLA & WCA

Media presentasi interaktif satu halaman (*Single-Page Presentation App*) untuk mata kuliah **Strategi Optimasi Komputasi Awan**. Menjelaskan cara kerja **Shuffled Frog-Leaping Algorithm (SFLA)** dan **Water Cycle Algorithm (WCA)** secara visual melalui metafora alam, simulasi langsung 60 FPS di browser, perbandingan berdampingan, dan studi kasus penjadwalan tugas ke *Virtual Machine* (VM).

Seluruh aset (termasuk tipografi *Plus Jakarta Sans* dan *Ubuntu Mono*) dibundel **100% lokal** sehingga aman digunakan di ruang kelas/proyektor **tanpa koneksi internet**.

---

## 1. Cara Menjalankan Presentasi

Tersedia **dua cara** menjalankan website ini:

### Opsi A — Tanpa Server / Offline Langsung dari Folder atau Flashdisk (Paling Praktis)
Cukup klik ganda (*double-click*) berkas **`index.html`** (atau `dist/index.html`) menggunakan **Google Chrome**, **Microsoft Edge**, atau **Firefox**.
> Berkat pemuat ganda (*dual-mode loader*), saat dibuka lewat protokol `file://`, halaman otomatis memuat bundel mandiri `public/app.bundle.js` sehingga tidak terkena blokir CORS ES Modules.

### Opsi B — Menggunakan Server Lokal (Mode Pengembangan ES Modules)
Pastikan Node.js (v18+) terpasang, lalu jalankan:
```bash
npm run dev
```
Kemudian buka alamat `http://127.0.0.1:4173` di browser.

---

## 2. Cara Build & Pengujian Otomatis

- **Menjalankan seluruh unit test (RNG, fungsi objektif, konvergensi SFLA, konvergensi WCA, penjadwalan Cloud VM, dan audit offline):**
  ```bash
  npm test
  ```
- **Membuat ulang bundel offline (`public/app.bundle.js`) dan folder distribusi statis (`dist/`):**
  ```bash
  npm run build
  ```
  Folder `dist/` yang dihasilkan dapat langsung disalin ke flashdisk atau diunggah ke layanan *static hosting* (GitHub Pages, Vercel, Netlify).
- **Menjalankan audit anti-slop UI (`design-taste-frontend`):**
  ```bash
  npm run lint:taste
  ```

---

## 2.5. Integrasi Agent Skills & Sistem Desain (`.agents/skills/` & `.stitch/DESIGN.md`)

Workspace ini dilengkapi 18 *Agent Skills* terkurasi di `.agents/skills/` yang diselaraskan langsung dengan kebutuhan PRD presentasi SFLA & WCA:
1. **`Leonxlnx/taste-skill` (`design-taste-frontend`)**: Menetapkan arah visual *Data Terminal* gelap pada `.taste-skill/direction.json` dan memvalidasi kode lewat `lint.mjs --app` (`0 FAIL, 0 WARN`: bebas gradien dekoratif, bebas ungu AI generik, bebas *glassmorphism*, bebas emoji sebagai ikon UI, serta angka *tabular-nums*).
2. **`DietrichGebert/ponytail` (`ponytail`, `ponytail-audit`, `ponytail-review`)**: Menjaga arsitektur *zero-dependency* murni ES2022 tanpa *framework bloat*, pemisahan tegas mesin algoritma murni (`src/algorithms/`) dari DOM, dan *fallback* responsif layar kecil.
3. **`rmyndharis/antigravity-skills` (`javascript-pro`, `modern-javascript-patterns`, `javascript-testing-patterns`, `ui-ux-designer`, `ui-visual-validator`, `wcag-audit-patterns`)**: Menjamin pola pengujian deterministik 14 *test*, keterbacaan proyektor ($\ge 28\text{px}$ body pada `1920x1080`), kontras WCAG 2.2 AA/AAA, dan penanda bentuk + label selain warna.
4. **`google-labs-code/stitch-skills` (`taste-design`, `extract-design-md`, `design-md`, `manage-design-system`, `generate-design`, `enhance-prompt`, `code-to-design`, `extract-static-html`)**: Menghasilkan dokumen sistem desain lengkap pada `.stitch/DESIGN.md` dengan YAML *frontmatter* terstruktur untuk sinkronisasi ke Stitch MCP.

---

## 3. Daftar Pintasan Keyboard (Shortcut Presentasi)

| Tombol | Fungsi |
|---|---|
| `→` / `PageDown` / `Spasi` | Maju ke slide berikutnya |
| `←` / `PageUp` | Kembali ke slide sebelumnya |
| `Home` / `End` | Loncat ke slide pertama (1) / terakhir (18) |
| `F` | Masuk / keluar mode Layar Penuh (*Fullscreen*) |
| `N` | Buka / tutup panel **Catatan Bicara Presenter** |
| `P` | **Play / Pause** simulasi pada slide aktif |
| `S` | **Step** — maju tepat 1 tahap algoritma pada slide simulasi |
| `R` | **Reset** simulasi ke kondisi awal |
| `?` / `H` | Menampilkan jendela bantuan pintasan keyboard |
| `Esc` | Menutup panel catatan atau dialog modal |

---

## 4. Struktur Kode & Arsitektur

```text
project-root/
├── index.html                    # Kerangka utama presentasi & dual-mode offline loader
├── package.json                  # Skrip dev, build, dan test (tanpa dependensi eksternal)
├── public/
│   ├── fonts/                    # Berkas font lokal (.ttf)
│   └── app.bundle.js             # Bundel JS mandiri untuk eksekusi offline file://
├── scripts/
│   ├── serve.mjs                 # Server HTTP statis lokal
│   ├── build.mjs                 # Bundler ES Modules ke IIFE + pembuat folder dist/
│   ├── generate-fonts-css.mjs    # Generator CSS font lokal bebas CORS
│   └── run-tests.mjs             # Runner pengujian unit
├── src/
│   ├── main.js                   # Titik masuk aplikasi & inisialisasi DeckController
│   ├── core/
│   │   ├── rng.js                # PRNG deterministik bersiklus (Mulberry32)
│   │   ├── objectives.js         # Fungsi Sphere, Rastrigin, dan Ackley 2D
│   │   └── engine.js             # Pemisah loop animasi 60 FPS dari detak algoritma
│   ├── algorithms/               # Logika murni 100% tanpa akses DOM
│   │   ├── sfla.js               # State machine SFLA (INIT -> SORT -> PARTITION -> LOCAL_JUMP -> SHUFFLE)
│   │   ├── wca.js                # State machine WCA (INIT -> HIERARCHY -> FLOW -> ROLE_SWAP -> EVAPORATION -> RAIN)
│   │   └── cloudScheduling.js    # Optimasi penjadwalan n tugas ke m VM (minimasi makespan)
│   ├── render/
│   │   ├── contourRenderer.js    # Peta kontur 2D dengan offscreen bitmap cache
│   │   ├── sflaRenderer.js       # Visualisasi kolam teratai, katak memeplex, mahkota Xg, riak lompatan
│   │   ├── wcaRenderer.js        # Visualisasi laut, sungai, aliran, tukar peran, uap, dan hujan
│   │   └── chart.js              # Grafik konvergensi real-time (1 atau 2 kurva)
│   ├── slides/
│   │   ├── index.js              # Daftar urut 18 slide presentasi
│   │   ├── introSlides.js        # Slide 1–3 (Judul, Masalah Optimasi, Eksplorasi vs Eksploitasi)
│   │   ├── sflaSlides.js         # Slide 4–9 (Modul lengkap SFLA + Simulasi Penuh)
│   │   ├── wcaSlides.js          # Slide 10–15 (Modul lengkap WCA + Simulasi Penuh)
│   │   └── outroSlides.js        # Slide 16–18 (Perbandingan SFLA vs WCA, Cloud VM, Kesimpulan)
│   ├── ui/
│   │   └── navigation.js         # Router slide, indikator progres, fullscreen, & catatan presenter
│   └── styles/
│       ├── fonts.css             # Font terbundel lokal
│       └── main.css              # Sistem tema proyektor kontras tinggi (SFLA hijau-teal, WCA biru-cyan)
└── tests/                        # Pengujian otomatis algoritma & audit arsitektur
```

---

## 5. Catatan Keputusan Desain & Asumsi Literatur

1. **Pemilihan Submemeplex SFLA (Eusuff & Lansey, 2003):**
   Untuk memeplex berukuran besar ($n > 6$), submemeplex dipilih menggunakan distribusi peluang segitiga $p_j = \frac{2(n + 1 - j)}{n(n + 1)}$. Untuk memeplex kecil ($n \le 6$), seluruh anggota memeplex dilibatkan agar katak terburuk di tepi luar kolam selalu aktif melompat memperbaiki posisi.
2. **Pembagian Aliran Proporsional WCA (Eskandar dkk., 2012):**
   Digunakan pergeseran biaya relatif terhadap aliran terbaik pertama $CN_n = f(X_n) - f(X_{N_{sr}+1})$ sehingga rumus intensitas aliran $NS_n = \text{round}\left(\left|\frac{CN_n}{\sum CN_k}\right| \times N_{\text{stream}}\right)$ tetap valid baik untuk fungsi bernilai positif maupun nol.
3. **Nilai Awal Ambang Penguapan `dmax` pada WCA:**
   Dalam simulasi visual sepanjang 40 iterasi pada domain $[-5, 5]^2$, nilai default awal `dmax` disetel ke `0.45` (dapat diubah lewat panel Parameter) dan menyusut linier menuju $10^{-5}$. Nilai ini memungkinkan audiens menyaksikan peristiwa penguapan dan hujan secara jelas pada iterasi awal–menengah sekaligus menjaga ketajaman konvergensi akhir.
4. **Pemetaan Kontinu ke Diskrit pada Studi Kasus Cloud Scheduling:**
   Setiap agen merepresentasikan vektor kontinu $X \in [0, m)^n$. Indeks VM untuk tugas ke-$i$ diperoleh lewat pembulatan bawah $\lfloor X_i \rfloor \in \{0, \dots, m-1\}$ dengan sasaran utama meminimalkan *makespan* ($\max_j \text{Load}(VM_j)$).
5. **Kompatibilitas Offline Ganda (`file://` dan `http://`):**
   Font dibundel langsung di `src/styles/fonts.css` dan modul JS dikompilasi ke `public/app.bundle.js` agar pembukaan langsung berkas `index.html` tanpa internet maupun tanpa server lokal berjalan mulus bebas *error console*.

---

## 6. Referensi

- Eusuff, M. M., & Lansey, K. E. (2003). *Optimization of water distribution network design using the shuffled frog leaping algorithm.* Journal of Water Resources Planning and Management, 129(3), 210–225.
- Eskandar, H., Sadollah, A., Bahreininejad, A., & Hamdi, M. (2012). *Water cycle algorithm – A novel metaheuristic optimization method for solving constrained engineering optimization problems.* Computers & Structures, 110–111, 151–166.

