# Laboratorium Interaktif Algoritma Metaheuristik: SFLA & WCA
### Studi Komparatif & Implementasi Penjadwalan Tugas Komputasi Awan (*Cloud VM Task Scheduling*)
**Mata Kuliah:** Strategi Optimasi Komputasi Awan (SOKA)  
**Institusi:** Institut Teknologi Sepuluh Nopember (ITS) Surabaya  

---

## Daftar Isi
1. [Gambaran Umum Proyek](#1-gambaran-umum-proyek)
2. [Alur Presentasi](#2-alur-presentasi)
3. [Landasan Teori & Formulasi Matematika](#3-landasan-teori--formulasi-matematika)
   - [3.1. Konsep Optimasi & Fungsi Benchmark 2D](#31-konsep-optimasi--fungsi-benchmark-2d)
   - [3.2. Shuffled Frog-Leaping Algorithm (SFLA)](#32-shuffled-frog-leaping-algorithm-sfla)
   - [3.3. Water Cycle Algorithm (WCA)](#33-water-cycle-algorithm-wca)
   - [3.4. Analisis Komparatif SFLA vs WCA](#34-analisis-komparatif-sfla-vs-wca)
   - [3.5. Aplikasi pada Komputasi Awan (Cloud VM Task Scheduling)](#35-aplikasi-pada-komputasi-awan-cloud-vm-task-scheduling)
4. [Identitas Visual ITS & Arsitektur Teknis](#4-identitas-visual-its--arsitektur-teknis)
5. [Struktur Direktori Proyek](#5-struktur-direktori-proyek)
6. [Cara Menjalankan, Menguji & Membangun](#6-cara-menjalankan-menguji--membangun)
7. [Pintasan Keyboard (*Keyboard Shortcuts*)](#7-pintasan-keyboard-keyboard-shortcuts)
8. [Referensi Ilmiah](#8-referensi-ilmiah)

---

## 1. Gambaran Umum Proyek

Repositori ini berisi **aplikasi web laboratorium simulasi interaktif** yang dirancang khusus untuk memvisualisasikan, membedah tahapan internal, dan membandingkan dua algoritma optimasi metaheuristik berbasis populasi:
1. **Shuffled Frog-Leaping Algorithm (SFLA)** — algoritma *memetic* yang terinspirasi dari perilaku pencarian makan kelompok katak di kolam teratai (Eusuff & Lansey, 2003).
2. **Water Cycle Algorithm (WCA)** — algoritma berbasis siklus hidrologi alami yang memodelkan aliran anak sungai menuju sungai dan laut, penguapan, serta presipitasi hujan (Eskandar et al., 2012).

Website ini adalah **deck presentasi layar penuh** dengan teks seminimal mungkin: penjelasan disampaikan lewat animasi, sedangkan detail lisan disimpan di catatan presenter (tombol `N`). Simulasi di dalamnya benar-benar menjalankan algoritma di browser, dan studi kasusnya menerapkan keduanya pada **penjadwalan tugas ke *Virtual Machine* (VM) di komputasi awan untuk meminimalkan *makespan***.

---

## 2. Alur Presentasi

Deck berisi 16 slide dalam 6 bab. Sebagian slide memiliki beberapa *beat*: tombol `→` memajukan animasi di dalam slide terlebih dahulu sebelum berpindah slide.

| Bab | Slide | Isi |
| :--- | :--- | :--- |
| Pembuka | `#judul` | Judul, mata kuliah, dan nama kelompok (klik untuk mengisi, tersimpan di `localStorage`) |
| | `#masalah` | 16 tugas masuk ke 4 VM, *makespan*, dan ledakan kombinasi 4¹⁶ |
| | `#lanskap` | Jadwal sebagai titik di lanskap, minimum lokal, eksplorasi vs eksploitasi |
| SFLA | `#sfla-inspirasi` | Katak mencari makanan dan bertukar informasi (*meme*) |
| | `#sfla-karakter` | Karakteristik dan parameter utama |
| | `#sfla-cara` | Pengurutan → Partisi → Lompatan lokal (3 aturan) → Shuffle |
| | `#sfla-sim` | Simulasi langsung `SFLAEngine` |
| WCA | `#wca-inspirasi` | Hujan, aliran, sungai, laut, penguapan |
| | `#wca-karakter` | Karakteristik dan parameter utama |
| | `#wca-cara` | Hierarki → Aliran → Pertukaran peran → Penguapan & hujan |
| | `#wca-sim` | Simulasi langsung `WCAEngine` |
| Perbandingan | `#adu` | SFLA vs WCA berdampingan dengan posisi awal identik |
| Studi kasus | `#kasus-kode` | Dari vektor posisi ke jadwal VM |
| | `#kasus-run` | Round-Robin vs SFLA vs WCA pada 16 tugas dan 4 VM |
| Penutup | `#ringkas` | Perbandingan mekanisme |
| | `#penutup` | Rata-rata hasil 10 beban kerja (dihitung langsung) dan referensi |

Slide inspirasi, karakteristik, dan cara kerja adalah **ilustrasi**. Angka dan gerakan pada slide `#sfla-sim`, `#wca-sim`, `#adu`, `#kasus-run`, serta grafik `#penutup` berasal langsung dari mesin algoritma. Parameter simulasi (termasuk *seed*) ada di panel yang dibuka dengan tombol **Parameter**.

---

## 3. Landasan Teori & Formulasi Matematika

### 3.1. Konsep Optimasi & Fungsi Benchmark 2D

Secara matematis, masalah optimasi kontinu tanpa kendala (*unconstrained minimization*) dirumuskan sebagai pencarian vektor variabel keputusan $\mathbf{x}^* = (x_1, x_2, \dots, x_D)$ di dalam ruang pencarian terbatas $\Omega \subset \mathbb{R}^D$ yang meminimalkan fungsi objektif (fungsi biaya) $f(\mathbf{x})$:

$$\mathbf{x}^* = \arg\min_{\mathbf{x} \in \Omega} f(\mathbf{x})$$

Tantangan utama dalam optimasi non-linier adalah keberadaan banyak **minimum lokal (*local optima*)**. Algoritma deterministik berbasis gradien (seperti *Gradient Descent* atau *Newton-Raphson*) hanya mengikuti kemiringan lokal sehingga pasti terjebak di cekungan pertama yang ditemuinya. Oleh karena itu, algoritma metaheuristik berbasis populasi menyeimbangkan dua mekanisme utama:
1. **Eksplorasi (*Exploration / Diversification*):** Kemampuan populasi menjelajahi area baru di seluruh ruang pencarian agar tidak terjebak di minimum lokal.
2. **Eksploitasi (*Exploitation / Intensification*):** Kemampuan populasi memusatkan pencarian di sekitar kandidat solusi terbaik yang sudah ditemukan untuk mencapai konvergensi presisi tinggi.

Website ini menguji kedua algoritma pada **3 Fungsi Benchmark Standar 2D** yang seluruhnya memiliki **Global Minimum di $\mathbf{x}^* = (0, 0)$ dengan nilai $f(0, 0) = 0$**:

| Fungsi Benchmark | Rumus Matematika $f(x, y)$ | Domain $[x_{\min}, x_{\max}]$ | Karakteristik Lanskap |
| :--- | :--- | :---: | :--- |
| **Sphere** | $f(x, y) = x^2 + y^2$ | $[-5.12, 5.12]$ | **Unimodal konveks mulus.** Hanya memiliki satu cekungan tunggal; digunakan untuk menguji kecepatan konvergensi dasar (eksploitasi murni). |
| **Rastrigin** | $f(x, y) = 20 + \left(x^2 - 10\cos(2\pi x)\right) + \left(y^2 - 10\cos(2\pi y)\right)$ | $[-5.12, 5.12]$ | **Multimodal ekstrem.** Gelombang kosinus menciptakan puluhan lembah lokal yang teratur di sekitar $(0,0)$; menguji ketahanan terhadap jebakan lokal. |
| **Ackley** | $f(x, y) = -20\exp\left(-0.2\sqrt{0.5(x^2+y^2)}\right) - \exp\left(0.5(\cos 2\pi x + \cos 2\pi y)\right) + e + 20$ | $[-5.00, 5.00]$ | **Multimodal dengan corong pusat curam.** Bagian luar relatif datar dan bergelombang, sedangkan pusat $(0,0)$ berupa lubang sempit yang dalam. |

---

### 3.2. Shuffled Frog-Leaping Algorithm (SFLA)

Diperkenalkan oleh **Muzaffar M. Eusuff dan Kevin E. Lansey (2003)**, **SFLA** adalah algoritma *memetic metaheuristic* yang memadukan pencarian sosial lokal ala *Particle Swarm Optimization* (PSO) dengan pengocokan informasi antar-komunitas ala *Shuffled Complex Evolution* (SCE).

#### A. Metafora Kolam Teratai & Representasi Solusi
- Di sebuah kolam terdapat populasi sejumlah $F$ ekor katak yang duduk di atas daun teratai.
- Setiap posisi katak ke-$i$ merepresentasikan satu kandidat solusi $\mathbf{X}_i = (x_{i,1}, x_{i,2}, \dots, x_{i,D})$ dengan tingkat kebugaran (*fitness*/biaya) $f(\mathbf{X}_i)$.
- Katak-katak tidak bertukar fisik, melainkan **bertukar informasi/ide (*meme*)** melalui lompatan menuju katak yang memiliki posisi daun teratai lebih baik.

#### B. Tahapan Matematis SFLA
1. **Inisialisasi Populasi (`INIT`):**  
   Bangkitkan $F = m \times N$ katak secara acak merata di dalam domain $[x_{\min}, x_{\max}]$, dengan $m$ adalah jumlah kelompok (*memeplex*) dan $N$ adalah jumlah katak di setiap *memeplex*.
2. **Pengurutan Kebugaran (`SORT`):**  
   Evaluasi $f(\mathbf{X}_i)$ untuk seluruh katak, lalu urutkan populasi dari yang terbaik (biaya terkecil) hingga terburuk: $\mathbf{X}_0, \mathbf{X}_1, \dots, \mathbf{X}_{F-1}$. Tetapkan katak peringkat pertama sebagai **Katak Terbaik Global ($\mathbf{X}_g = \mathbf{X}_0$)**.
3. **Partisi Bergilir ke Memeplex (`PARTITION`):**  
   Distribusikan $F$ katak yang telah terurut ke dalam $m$ *memeplex* $\mathcal{M}_0, \mathcal{M}_1, \dots, \mathcal{M}_{m-1}$ secara **Round-Robin**:
   $$\text{Katak ke-}i \in \mathcal{M}_{k}, \quad \text{dengan } k = i \bmod m$$
   *(Contoh untuk $m=3$: $\mathcal{M}_0$ menerima peringkat $0, 3, 6, \dots$; $\mathcal{M}_1$ menerima peringkat $1, 4, 7, \dots$; $\mathcal{M}_2$ menerima peringkat $2, 5, 8, \dots$ sehingga setiap memeplex memiliki kombinasi katak unggul dan katak lemah yang seimbang).*
4. **Pencarian Lokal di Dalam Tiap Memeplex (`LOCAL_JUMP`):**  
   Di dalam setiap *memeplex*, identifikasi **Katak Terbaik Lokal ($\mathbf{X}_b$)** dan **Katak Terburuk Lokal ($\mathbf{X}_w$)**. Hanya $\mathbf{X}_w$ yang diperbarui menggunakan **3 Aturan Lompatan Berurutan**:
   - **Aturan 1 (Lompat menuju Terbaik Lokal $\mathbf{X}_b$):**
     $$\mathbf{D} = \text{rand}() \cdot c \cdot (\mathbf{X}_b - \mathbf{X}_w), \quad \text{dengan } \|\mathbf{D}\| \le D_{\max}$$
     $$\mathbf{X}_w^{\text{baru}} = \mathbf{X}_w + \mathbf{D}$$
     Jika $f(\mathbf{X}_w^{\text{baru}}) < f(\mathbf{X}_w)$, maka $\mathbf{X}_w \leftarrow \mathbf{X}_w^{\text{baru}}$ dan pencarian lokal selesai untuk langkah ini.
   - **Aturan 2 (Lompat menuju Terbaik Global $\mathbf{X}_g$ jika Aturan 1 gagal):**  
     Apabila $\mathbf{X}_w^{\text{baru}}$ dari Aturan 1 tidak lebih baik daripada $\mathbf{X}_w$, hitung ulang langkah lompatan dengan mengganti $\mathbf{X}_b$ menjadi **$\mathbf{X}_g$**:
     $$\mathbf{D} = \text{rand}() \cdot c \cdot (\mathbf{X}_g - \mathbf{X}_w), \quad \mathbf{X}_w^{\text{baru}} = \mathbf{X}_w + \mathbf{D}$$
     Jika $f(\mathbf{X}_w^{\text{baru}}) < f(\mathbf{X}_w)$, maka $\mathbf{X}_w \leftarrow \mathbf{X}_w^{\text{baru}}$.
   - **Aturan 3 (Injeksi Acak / *Censorship* jika Aturan 1 & 2 gagal):**  
     Apabila kedua lompatan terarah masih menghasilkan posisi yang lebih buruk, $\mathbf{X}_w$ dianggap terjebak di cekungan lokal dan langsung digantikan oleh posisi baru secara acak di seluruh ruang domain:
     $$\mathbf{X}_w^{\text{baru}} = \mathbf{x}_{\min} + \text{rand}() \cdot (\mathbf{x}_{\max} - \mathbf{x}_{\min})$$
5. **Shuffle Lintas Memeplex (`SHUFFLE`):**  
   Setelah seluruh *memeplex* menyelesaikan iterasi pencarian lokalnya, gabungkan kembali semua katak dari seluruh *memeplex* menjadi satu populasi utuh, urutkan ulang berdasarkan $f(\mathbf{X}_i)$, perbarui $\mathbf{X}_g$, dan partisi ulang ke *memeplex* baru. Proses ini menyebarkan solusi unggul antar-komunitas hingga kriteria berhenti terpenuhi (`DONE`).

---

### 3.3. Water Cycle Algorithm (WCA)

Diperkenalkan oleh **Hadi Eskandar, Ali Sadollah, Ardeshir Bahreininejad, dan Mohd Hamdi (2012)**, **WCA** memodelkan proses siklus hidrologi di alam: air hujan yang jatuh di pegunungan mengalir membentuk anak sungai (*streams*), bergabung ke sungai besar (*rivers*), dan bermuara ke titik terendah di permukaan bumi yaitu **Laut (*Sea*)**, diikuti penguapan (*evaporation*) dan hujan baru (*precipitation*).

#### A. Hierarki Populasi Tetesan Air (`HIERARCHY`)
Populasi awal berukuran $N_{\text{pop}}$ tetesan air diurutkan dari nilai fungsi biaya terkecil (titik elevasi terendah) hingga terbesar, lalu dibagi menjadi 3 kasta:
1. **1 Laut (*Sea*, $\mathbf{X}_{\text{laut}}$):** Tetesan peringkat ke-1 (solusi terbaik global).
2. **$N_r = N_{sr} - 1$ Sungai (*Rivers*, $\mathbf{X}_{\text{sungai}}$):** Tetesan terbaik berikutnya setelah Laut, dengan $N_{sr} = 1 + N_r$ adalah total solusi elit (Laut + Sungai).
3. **$N_{\text{streams}} = N_{\text{pop}} - N_{sr}$ Aliran (*Streams*, $\mathbf{X}_{\text{aliran}}$):** Sisa tetesan air yang akan mengalir menuju Sungai atau langsung ke Laut.

#### B. Alokasi Aliran Proporsional Berdasarkan Intensitas ($NS_n$)
Semakin baik kualitas (semakin rendah biaya) sebuah Sungai atau Laut, semakin besar gaya tarik gravitasinya sehingga semakin banyak aliran yang bermuara kepadanya. Jumlah aliran $NS_n$ yang ditugaskan ke induk ke-$n$ ($n = 1, 2, \dots, N_{sr}$) dihitung secara proporsional:

$$C_n = f(\text{Induk}_n) - f(\text{Aliran}_{\text{terburuk}})$$

$$NS_n = \text{round}\left( \left| \frac{C_n}{\sum_{i=1}^{N_{sr}} C_i} \right| \times N_{\text{streams}} \right)$$

#### C. Pergerakan Aliran & Sungai (`FLOW`) serta Pertukaran Peran (`ROLE_SWAP`)
Pada setiap iterasi, aliran bergerak mendekati sungai (atau laut) induknya, dan sungai bergerak mendekati Laut menggunakan persamaan vektor:

$$\mathbf{X}_{\text{aliran}}^{\text{baru}} = \mathbf{X}_{\text{aliran}} + \text{rand}() \cdot C \cdot (\mathbf{X}_{\text{sungai}} - \mathbf{X}_{\text{aliran}})$$

$$\mathbf{X}_{\text{sungai}}^{\text{baru}} = \mathbf{X}_{\text{sungai}} + \text{rand}() \cdot C \cdot (\mathbf{X}_{\text{laut}} - \mathbf{X}_{\text{sungai}})$$

di mana $\text{rand}() \in [0, 1]$ dan koefisien aliran standar adalah **$C = 2$** ($1 < C \le 2$). Nilai $C = 2$ sangat krusial karena memungkinkan tetesan air melompat melewati posisi induknya (*overshoot* hingga jarak $2d$), sehingga pencarian berlangsung di kedua sisi induk.

- **Pertukaran Peran (*Role Swap*):**
  - Jika sebuah **Aliran** mencapai titik dengan biaya lebih rendah daripada **Sungai** induknya ($f(\mathbf{X}_{\text{aliran}}) < f(\mathbf{X}_{\text{sungai}})$), keduanya **bertukar peran** (aliran tersebut diangkat menjadi Sungai baru).
  - Jika sebuah **Sungai** (atau Aliran Laut) mencapai titik yang lebih rendah daripada **Laut** ($f(\mathbf{X}_{\text{sungai}}) < f(\mathbf{X}_{\text{laut}})$), sungai tersebut **mengambil alih takhta Laut**.

#### D. Kondisi Penguapan (`EVAPORATION`) & Hujan Baru (`RAIN`)
Agar seluruh sungai dan aliran tidak menumpuk prematur di titik Laut yang sama, WCA memeriksa jarak Euclidean antara setiap Sungai (dan aliran langsung) terhadap Laut:

$$\|\mathbf{X}_{\text{sungai}}^i - \mathbf{X}_{\text{laut}}\|_2 < d_{\max} \quad \text{atau} \quad \text{rand}() < 0.1$$

Jika jaraknya lebih kecil dari ambang radius penguapan $d_{\max}$, air dianggap telah menguap ke atmosfer dan langsung memicu **Hujan Baru (*Rain*)**: aliran-aliran di grup tersebut ditempatkan ulang secara acak di domain atau di sekitar Laut menggunakan distribusi Gaussian untuk menjaga keberagaman genetik:

$$\mathbf{X}_{\text{aliran}}^{\text{baru}} = \mathbf{X}_{\text{laut}} + \sqrt{\mu}\,\mathcal{N}(0, 1)$$

Nilai ambang $d_{\max}$ disusutkan secara adaptif di setiap iterasi ke-$t$ menuju $T_{\max}$ agar transisi dari eksplorasi ke eksploitasi berjalan mulus:

$$d_{\max}(t+1) = d_{\max}(t) - \frac{d_{\max}^0}{T_{\max}}$$

---

### 3.4. Analisis Komparatif SFLA vs WCA

| Dimensi Perbandingan | Shuffled Frog-Leaping Algorithm (SFLA) | Water Cycle Algorithm (WCA) |
| :--- | :--- | :--- |
| **Inspirasi Alam** | Perilaku sosial katak mencari makan di atas daun teratai (*memetic evolution*). | Siklus hidrologi aliran sungai menuju laut, penguapan, dan presipitasi hujan. |
| **Struktur Populasi** | **Multi-komunitas desentralisasi:** dibagi menjadi $m$ kelompok *Memeplex* berukuran sama ($N$ katak per memeplex). | **Hierarki terpusat 3 kasta:** 1 *Laut* + $(N_{sr}-1)$ *Sungai* + $N_{\text{streams}}$ *Aliran* dengan alokasi proporsional $NS_n$. |
| **Subjek Pembaruan per Langkah** | Hanya **katak terburuk ($\mathbf{X}_w$)** di masing-masing *memeplex* yang melompat pada setiap sub-langkah lokal. | **Seluruh aliran dan sungai** bergerak serentak menuju induknya pada setiap iterasi. |
| **Mekanisme Eksploitasi** | Lompatan terarah $\mathbf{X}_w \to \mathbf{X}_b$ (terbaik lokal) lalu $\mathbf{X}_w \to \mathbf{X}_g$ (terbaik global). | Aliran vektoral dengan koefisien $C=2$ (*overshoot*) menuju Sungai/Laut disertai *Role Swap* instan. |
| **Mekanisme Anti-Stagnasi (Eksplorasi)** | ***Shuffling*** seluruh *memeplex* secara periodik + *reset* acak (Aturan 3) jika kedua lompatan gagal. | **Penguapan & Hujan Baru** saat jarak $\|\mathbf{X}_{\text{sungai}} - \mathbf{X}_{\text{laut}}\| < d_{\max}$ dengan radius $d_{\max}$ yang menyusut adaptif. |
| **Karakteristik Konvergensi** | Sangat tangguh mempertahankan keberagaman di lanskap multimodal ekstrem (seperti *Rastrigin*) karena tiap *memeplex* mengeksplorasi lembah berbeda sebelum di-*shuffle*. | Konvergensi awal sangat cepat menuju cekungan pusat (seperti *Sphere* & *Ackley*) karena seluruh aliran ditarik proporsional ke solusi elit $N_{sr}$. |

---

### 3.5. Aplikasi pada Komputasi Awan (*Cloud VM Task Scheduling*)

Dalam infrastruktur *Cloud Computing* (IaaS), *broker* pusat data harus menjadwalkan **$n$ tugas independen (*cloudlets*)** $\mathcal{T} = \{T_1, T_2, \dots, T_n\}$ dengan panjang instruksi $L_i$ (dalam *Million Instructions / MI*) ke **$m$ *Virtual Machine* (VM) heterogen** $\mathcal{V} = \{VM_1, VM_2, \dots, VM_m\}$ yang masing-masing memiliki kecepatan pemrosesan $P_j$ (dalam *Million Instructions Per Second / MIPS*).

#### A. Formulasi Waktu Selesai VM & *Makespan*
Jika himpunan tugas yang dialokasikan ke $VM_j$ dinyatakan dengan indeks penugasan $a_i \in \{1, 2, \dots, m\}$, maka total waktu eksekusi (beban kerja) pada $VM_j$ adalah:

$$\text{Load}(VM_j) = \sum_{i \,:\, a_i = j} \frac{L_i}{P_j} \quad \text{(detik)}$$

Tujuan utama penjadwalan adalah meminimalkan **Makespan** (waktu selesai dari VM paling sibuk / *bottleneck*), sekaligus menjaga keseimbangan beban antar-VM:

$$\text{Makespan} = \max_{j \in \{1, \dots, m\}} \text{Load}(VM_j)$$

$$\text{Fungsi Biaya } f(\mathbf{X}) = \text{Makespan} + \lambda \cdot \sigma_{\text{Load}}$$

di mana $\sigma_{\text{Load}}$ adalah simpangan baku waktu selesai antar-VM sebagai penalti ketidakseimbangan beban.

#### B. Pemetaan Solusi Metaheuristik Kontinu ke Diskrit
Karena SFLA dan WCA beroperasi pada vektor bilangan riil kontinu, setiap kandidat solusi direpresentasikan sebagai vektor berdimensi-$n$: $\mathbf{X} = (x_1, x_2, \dots, x_n)$ dengan $x_i \in [0, m)$. Saat dievaluasi, setiap komponen kontinu dipetakan ke indeks VM diskrit menggunakan fungsi pembulatan bawah (*floor mapping*):

$$a_i = \lfloor x_i \rfloor + 1 \in \{1, 2, \dots, m\}$$

Pada slide **`#kasus-run`**, algoritma statis **Round-Robin** ($a_i = (i \bmod m) + 1$) membagikan tugas secara buta tanpa memedulikan ukuran `MI` tugas maupun kecepatan `MIPS` VM, sehingga VM lambat menerima tugas raksasa dan memicu *Makespan* tinggi. Sebaliknya, **SFLA** dan **WCA** secara cerdas memindahkan *cloudlet* berat ke VM berkecepatan tinggi (`MIPS` besar) dan menyeimbangkan total beban seluruh VM sehingga menghasilkan penurunan *Makespan* yang signifikan.

---

## 4. Identitas Visual ITS & Arsitektur Teknis

- **Panduan Identitas Resmi ITS (Google Stitch Synced):**  
  Seluruh antarmuka dan kanvas 2D dirancang mengikuti palet resmi **Institut Teknologi Sepuluh Nopember (ITS)** dari proyek Google Stitch (`projects/11288588710972324877` — *ITS Metaheuristic Cloud Computing Interface*):
  - *Dark Ground & SIMT Navy*: `#03132B`, `#0B1B34`, `#102038`, `#192841`
  - *Biru Tua Lambang & Biru Cover ITS*: `#127BBE`, `#233F7C`, `#243F81`, `#75BDE0`
  - *Kuning Tua Logo ITS*: `#FDBB16` (indikator tab aktif, *Global Optimum* $X_g$ / *Laut*, dan cincin fokus)
  - *FKK Medical Tosca*: `#12B0A2` (aksen identitas algoritma SFLA)
  - *FTK Summer Sky*: `#26AEE4` (aksen identitas algoritma WCA)
- **Arsitektur Murni & Deterministik:**
  - **PRNG Mulberry32 (`src/core/rng.js`):** Setiap simulasi menggunakan generator angka acak semu berbasis *seed* 32-bit, menjamin eksperimen ilmiah dapat direproduksi 100% identik.
  - **Pemisahan Mesin Algoritma dari DOM (`src/algorithms/`):** Seluruh logika matematika SFLA, WCA, dan Cloud VM Scheduler ditulis sebagai *state machine* murni tanpa referensi `window` atau `document` sehingga dapat diuji secara independen di Node.js.
  - **100% Mandiri Offline:** Tanpa ketergantungan framework eksternal maupun CDN; font *Inter* dan *JetBrains Mono* telah dienkode langsung agar tetap berjalan saat dibuka via protokol `file://`.

---

## 5. Struktur Direktori Proyek

```text
├── index.html                  # Shell deck (panggung 1920x1080, bilah progres, catatan, pintasan)
├── public/
│   └── app.bundle.js           # Bundel produksi mandiri untuk eksekusi langsung via file://
├── src/
│   ├── main.js                 # Titik masuk aplikasi
│   ├── core/
│   │   ├── rng.js              # Generator angka acak deterministik Mulberry32 (Seedable PRNG)
│   │   ├── objectives.js       # Formulasi fungsi benchmark 2D (Sphere, Rastrigin, Ackley)
│   │   └── engine.js           # Loop animasi requestAnimationFrame & kontrol Play/Step
│   ├── algorithms/
│   │   ├── sfla.js             # Mesin status murni Shuffled Frog-Leaping Algorithm (SFLA)
│   │   ├── wca.js              # Mesin status murni Water Cycle Algorithm (WCA)
│   │   └── cloudScheduling.js  # Optimizer penjadwalan cloudlet ke VM heterogen (SFLA/WCA/RR)
│   ├── render/
│   │   ├── stage.js            # Panggung scene berkoordinat 1920x1080 & fungsi easing
│   │   ├── sprites.js          # Gambar vektor: katak, teratai, riak, tetesan, awan, panah, label
│   │   ├── contourRenderer.js  # Peta kontur 2D dengan offscreen caching
│   │   ├── sflaRenderer.js     # Visual simulasi SFLA (memeplex, lompatan, riak)
│   │   ├── wcaRenderer.js      # Visual simulasi WCA (laut, sungai, aliran, dmax, uap, hujan)
│   │   └── chart.js            # Grafik konvergensi
│   ├── slides/
│   │   ├── index.js            # Urutan seluruh slide
│   │   ├── common.js           # Kerangka scene: kanvas + teks per beat
│   │   ├── simulation.js       # Slide simulasi nyata yang dipakai SFLA & WCA
│   │   ├── pembukaSlides.js    # Judul, masalah, metaheuristik
│   │   ├── sflaSlides.js       # Bab SFLA
│   │   ├── wcaSlides.js        # Bab WCA
│   │   └── kasusSlides.js      # Adu, studi kasus cloud, perbandingan, kesimpulan
│   ├── ui/
│   │   └── navigation.js       # DeckController (slide, beat, bilah progres, keyboard)
│   └── styles/
│       ├── fonts.css           # Font lokal terbundel (Inter & JetBrains Mono)
│       └── main.css            # Sistem visual presentasi
├── scripts/
│   ├── build.mjs               # Skrip pemaket ke public/app.bundle.js dan folder dist/
│   ├── dev-server.mjs          # Server HTTP statis lokal untuk pengembangan
│   └── run-tests.mjs           # Runner pengujian otomatis Node.js
├── tests/                      # Suite pengujian unit & integrasi DOM/Canvas (15 pengujian)
├── .stitch/                    # Dokumentasi Design System ITS (DESIGN.md & metadata.json)
└── dist/                       # Salinan distribusi siap rilis statis
```

---

## 6. Cara Menjalankan, Menguji & Membangun

### Opsi A — Buka Langsung Tanpa Server (100% Offline)
Klik ganda berkas **`index.html`** (atau `dist/index.html`) langsung dari File Explorer/Finder. Pemuat otomatis akan mendeteksi protokol `file://` dan memuat `public/app.bundle.js` tanpa memerlukan koneksi internet maupun server lokal.

### Opsi B — Menggunakan Server Pengembangan Lokal
Pastikan **Node.js** (v18+) terpasang, lalu jalankan:
```bash
npm run dev
```
Buka alamat `http://127.0.0.1:4173` pada peramban web Anda.

### Menjalankan Pengujian Otomatis & Build Ulang
```bash
# Menjalankan 15 unit & integration test (determinisme PRNG, konvergensi SFLA/WCA, Cloud VM, & seluruh slide)
npm test

# Menjalankan linter kualitas antarmuka anti-slop (target: 0 FAIL, 0 WARN)
npm run lint:taste

# Memaketkan ulang kode sumber ke public/app.bundle.js dan direktori dist/
npm run build
```

---

## 7. Pintasan Keyboard (*Keyboard Shortcuts*)

| Tombol | Fungsi Navigasi & Kontrol Simulasi |
| :---: | :--- |
| `→` `Spasi` `PageDown` | Beat atau slide berikutnya (kompatibel dengan *clicker*) |
| `←` `PageUp` | Beat atau slide sebelumnya |
| `Home` `End` | Slide pertama atau terakhir |
| `1`–`6` | Lompat ke awal bab |
| `P` | **Play / Pause** simulasi pada slide aktif |
| `S` | **Step** satu langkah simulasi |
| `R` | **Reset** simulasi sesuai *seed* aktif |
| `N` | Buka / tutup **catatan presenter** |
| `F` | Masuk / keluar **layar penuh** |
| `?` / `H` | Buka dialog daftar pintasan |
| `Esc` | Tutup catatan atau dialog |

---

## 8. Referensi Ilmiah

1. **Eusuff, M. M., & Lansey, K. E. (2003).** *Optimization of water distribution network design using the shuffled frog leaping algorithm.* Journal of Water Resources Planning and Management, 129(3), 210–225.
2. **Eusuff, M., Lansey, K., & Pasha, F. (2006).** *Shuffled frog-leaping algorithm: a memetic meta-heuristic for discrete optimization.* Engineering Optimization, 38(2), 129–154.
3. **Eskandar, H., Sadollah, A., Bahreininejad, A., & Hamdi, M. (2012).** *Water cycle algorithm – A novel metaheuristic optimization method for solving constrained engineering optimization problems.* Computers & Structures, 110–111, 151–166.
4. **Sadollah, A., Eskandar, H., Bahreininejad, A., & Kim, J. H. (2015).** *Water cycle algorithm for solving multi-objective optimization problems.* Soft Computing, 19(9), 2587–2603.

5. **Calheiros, R. N., Ranjan, R., Beloglazov, A., De Rose, C. A., & Buyya, R. (2011).** *CloudSim: a toolkit for modeling and simulation of Cloud computing environments.* Software: Practice and Experience, 41(1), 23–50.
6. **Rastrigin, L. A. (1974) & Ackley, D. H. (1987).** *Extremal control systems & connectionist genetic hillclimbing.* Landasan lanskap fungsi benchmark 2D multimodal.
