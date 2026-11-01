# Laboratorium Interaktif Algoritma Metaheuristik: SFLA & WCA (SOKA ITS)

Aplikasi web laboratorium interaktif berbasis **4 Tab Modul** untuk mata kuliah **Strategi Optimasi Komputasi Awan (SOKA) – Institut Teknologi Sepuluh Nopember (ITS)**. Menggantikan format slide statis dengan ruang kerja rekayasa (*engineering workbench*) yang memvisualisasikan cara kerja **Shuffled Frog-Leaping Algorithm (SFLA)** dan **Water Cycle Algorithm (WCA)** pada `60 FPS`, lengkap dengan perbandingan sinkron dan studi kasus penjadwalan tugas pada *Virtual Machine* (VM) heterogen.

Seluruh aset (termasuk tipografi lokal *Plus Jakarta Sans* dan *Ubuntu Mono*) dibundel **100% offline** sehingga berjalan mulus baik melalui server lokal maupun klik ganda berkas `index.html` tanpa koneksi internet.

---

## 1. Struktur 4 Tab Modul Utama

1. **Konsep & Lanskap (`#konsep`)**
   - Bar identitas mata kuliah SOKA ITS dan nama/NRP tim penyaji yang dapat disunting langsung (*tersimpan di `localStorage`*).
   - **Eksplorasi Interaktif Peta Kontur 2D** (`Rastrigin`, `Ackley`, `Sphere`): klik titik mana pun pada peta untuk mengevaluasi nilai biaya $f(x, y)$ dan jarak Euclidean ke optimum global $(0, 0)$.
   - **Simulator Dinamika Populasi**: membandingkan *Eksplorasi Acak*, *Eksploitasi Sempit* (terjebak di minimum lokal), dan *Metaheuristik Seimbang*.
2. **Simulasi SFLA (`#sfla`)**
   - **Laboratorium Live Kolam Teratai SFLA**: kanvas kontur 2D interaktif dengan partisi *Memeplex* (`M1..Mm`), vektor lompatan `Xw`, riak air, kontrol hiperparameter langsung (`F`, `m`, `N`, `Dmax`, `Kecepatan`, `Seed`), dan kurva konvergensi *real-time*.
   - **Meja Kerja Mekanisme Internal SFLA**: simulator pembagian bergilir (*Round-Robin*), sandbox 3 skenario lompatan $X_w \to X_b \to X_g \to \text{Acak}$, pemetaan metafora, dan tabel formal 6 tahap SFLA.
3. **Simulasi WCA (`#wca`)**
   - **Laboratorium Live Siklus Air WCA**: kanvas kontur 2D interaktif dengan hierarki **Laut**, **Sungai (`S1..Sn`)**, dan **Aliran**, radius penguapan adaptif `dmax`, kilatan *Role Swap*, efek uap dan hujan, kontrol hiperparameter (`Npop`, `Nsr`, `dmax0`, `C`, `Kecepatan`, `Seed`), serta kurva konvergensi.
   - **Meja Kerja Hidrologi WCA**: kalkulator alokasi aliran proporsional $NS_n$, sandbox aliran $C = 2$ (*overshoot* & pertukaran peran), simulator penyusutan `dmax(t)`, dan tabel formal 6 tahap WCA.
4. **Komparasi & Cloud VM (`#komparasi`)**
   - **Arena Head-to-Head SFLA vs WCA**: pengujian berdampingan menggunakan populasi awal dan *seed* PRNG yang identik.
   - **Matriks Perbandingan Arsitektural**: tabel komparasi struktur populasi, operator eksploitasi, anti-stagnasi, dan karakteristik beban kerja awan.
   - **Studi Kasus Penjadwalan Cloud VM**: optimasi penugasan 16 *cloudlets* (`140–620 MI`) ke 4 VM heterogen (`85–175 MIPS`) untuk meminimalkan *Makespan* dibanding *Round-Robin*.

---

## 2. Identitas Visual ITS & Integrasi Stitch + Agent Skills

Sistem desain mengacu langsung pada **Panduan Identitas Resmi ITS** dan proyek **Google Stitch (`projects/11288588710972324877`, Design System `assets/66814ab3c1ab4a94ab1c9fd0737ecce8` – `ITS Metaheuristic Cloud Computing Interface`)**, diselaraskan dengan standar anti-slop dari `.agents/skills/`:

- **Palet Warna Resmi ITS:**
  - *ITS Dark Ground & SIMT Navy*: `#03132B`, `#0B1B34`, `#102038`, `#192841`
  - *Biru Tua Lambang & Biru Cover ITS*: `#127BBE`, `#233F7C`, `#243F81`, `#75BDE0`
  - *Kuning Tua Logo ITS*: `#FDBB16` (indikator tab aktif, *Global Optimum* `Xg` / `Laut`, dan cincin fokus keyboard)
  - *FKK Medical Tosca*: `#12B0A2` (aksen algoritma SFLA)
  - *FTK Summer Sky*: `#26AEE4` (aksen algoritma WCA)
- **Validasi Skill Terpasang (`.agents/skills/`):**
  - `design-taste-frontend` (`Leonxlnx/taste-skill`): lulus penuh `npm run lint:taste` (`0 FAIL, 0 WARN`) serta inspeksi render browser nyata (`inspect.mjs --app`).
  - `ponytail` (`DietrichGebert/ponytail`): nol dependensi runtime eksternal, mesin algoritma murni di `src/algorithms/` terpisah penuh dari DOM.
  - `stitch-skills` (`taste-design`, `design-md`, `manage-design-system`): terdokumentasi pada `.stitch/DESIGN.md` dan `.stitch/metadata.json`.

---

## 3. Cara Menjalankan, Menguji & Membangun

### Opsi A – Offline Langsung (Tanpa Server)
Klik ganda berkas **`index.html`** (atau `dist/index.html`) di browser modern. Pemuat ganda otomatis menjalankan `public/app.bundle.js` saat dibuka melalui protokol `file://`.

### Opsi B – Server Pengembangan Lokal
```bash
npm run dev
```
Buka `http://127.0.0.1:4173` di browser.

### Pengujian & Build
```bash
npm test          # Menjalankan 15 pengujian otomatis (algoritma, determinisme, offline, 4 tab UI)
npm run lint:taste # Menjalankan audit anti-slop taste-skill (target: 0 FAIL, 0 WARN)
npm run build     # Memperbarui public/app.bundle.js dan folder dist/
```

---

## 4. Pintasan Keyboard Laboratorium

| Tombol | Fungsi |
|---|---|
| `1` `2` `3` `4` | Berpindah langsung ke Tab 1–4 |
| `P` | Mulai / Jeda simulasi pada tab aktif |
| `S` | Maju 1 langkah diskrit algoritma (*Step*) |
| `R` | Reset simulasi ke populasi awal |
| `N` | Buka / tutup panel **Panduan Pemaparan Materi** |
| `F` | Masuk / keluar mode Layar Penuh (*Fullscreen*) |
| `?` / `H` | Buka dialog daftar pintasan keyboard |
| `Esc` | Tutup panel catatan atau dialog pintasan |

---

## 5. Referensi Ilmiah

- Eusuff, M. M., & Lansey, K. E. (2003). *Optimization of water distribution network design using the shuffled frog leaping algorithm.* Journal of Water Resources Planning and Management, 129(3), 210–225.
- Eskandar, H., Sadollah, A., Bahreininejad, A., & Hamdi, M. (2012). *Water cycle algorithm – A novel metaheuristic optimization method for solving constrained engineering optimization problems.* Computers & Structures, 110–111, 151–166.
