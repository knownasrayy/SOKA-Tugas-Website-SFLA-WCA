# Laboratorium Interaktif Algoritma Metaheuristik: SFLA & WCA
### Studi Komparatif & Implementasi Penjadwalan Tugas Komputasi Awan (*Cloud VM Task Scheduling*)
**Mata Kuliah:** Strategi Optimasi Komputasi Awan (SOKA)  
**Institusi:** Institut Teknologi Sepuluh Nopember (ITS) Surabaya  

---

## Daftar Isi
1. [Gambaran Umum Proyek](#1-gambaran-umum-proyek)
2. [Penjelasan Website & Fitur 4-Tab Workspace](#2-penjelasan-website--fitur-4-tab-workspace)
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

Berbeda dari media presentasi statis, website ini dibangun sebagai **4-Tab Engineering Workspace** tempat pengguna dan audiens dapat berinteraksi langsung dengan lanskap fungsi matematika, menjalankan algoritma langkah demi langkah (*step-by-step*), memodifikasi hiperparameter secara *real-time*, mengamati kurva konvergensi, hingga menguji kedua algoritma untuk menyelesaikan masalah nyata **penyeimbangan beban kerja (*load balancing*) dan minimasi *makespan* pada *Virtual Machine* (VM) di lingkungan Komputasi Awan**.

---

## 2. Penjelasan Website & Fitur 4-Tab Workspace

Antarmuka website dibagi ke dalam **4 Tab Modul Mandiri** pada bilah navigasi atas (*sticky institutional header*) yang dapat digulir secara vertikal dan diakses cepat melalui tombol angka `1`–`4`:

### Tab 1 — Konsep & Lanskap (`#konsep`)
Modul pengantar interaktif untuk memahami mengapa algoritma berbasis gradien gagal pada permukaan multimodal dan bagaimana metaheuristik populasi bekerja:
- **Bar Identitas Penyaji Interaktif:** Menampilkan informasi mata kuliah SOKA ITS serta tombol sunting nama/NRP kelompok yang tersimpan otomatis di `localStorage`.
- **Eksplorasi Peta Topografi 2D (*Interactive Contour Map*):** Pengguna dapat memilih fungsi objektif **Rastrigin**, **Ackley**, atau **Sphere**, lalu **mengklik titik mana pun pada kanvas** untuk melihat koordinat uji $(x, y)$, nilai fungsi biaya $f(x, y)$, dan radius jarak Euclidean menuju *Global Optimum* $(0, 0)$ (ditandai bintang emas). Tersedia pula tombol **Uji Titik Jebakan Lokal** untuk mendemonstrasikan cekungan lokal Rastrigin di $(0.99, 0.99)$.
- **Simulator Dinamika Eksplorasi vs Eksploitasi:** Simulasi langsung 18 agen populasi pada permukaan Rastrigin dengan 3 mode perilaku:
  - *Eksplorasi Acak*: agen melompat acak ke seluruh domain tanpa konvergensi.
  - *Eksploitasi Sempit*: agen langsung tertarik ke cekungan terdekat dan terjebak di *Local Minimum* $(0.99, 0.99)$.
  - *Metaheuristik Seimbang*: kombinasi pertukaran informasi global dan pencarian lokal yang berhasil memusat ke *Global Minimum* $(0, 0)$.

### Tab 2 — Simulasi SFLA (`#sfla`)
Laboratorium lengkap untuk mempelajari dan menguji **Shuffled Frog-Leaping Algorithm**:
- **Kanvas Simulasi Utama Kolam Teratai (60 FPS):**
  - Menampilkan posisi seluruh katak yang diberi warna sesuai kelompok **Memeplex (`M1..Mm`)**, penanda khusus untuk katak terbaik global **$X_g$** (mahkota emas), katak terbaik lokal **$X_b$**, dan katak terburuk lokal **$X_w$**.
  - Memvisualisasikan **panah vektor lompatan** dan **efek riak air** setiap kali katak $X_w$ melompat, lengkap dengan badge status aturan lompatan yang sedang dieksekusi (`Ke Xb`, `Ke Xg`, atau `Reset Acak`).
- **Indikator Tahap Siklus SFLA (*Pipeline Stepper*):** Menyorot tahapan aktif secara sinkron: `INIT` $\to$ `SORT` $\to$ `PARTITION` $\to$ `LOCAL_JUMP` $\to$ `SHUFFLE` $\to$ `DONE`.
- **Panel Telemetri, Grafik Konvergensi, & Hiperparameter:**
  - Strip KPI *real-time*: Iterasi ke-$t$, nilai biaya terbaik $f(X_g)$, koordinat $X_g$, dan jumlah evaluasi fungsi (*Function Evaluations / FE*).
  - Pengaturan hiperparameter interaktif: Fungsi Objektif (`Rastrigin`/`Ackley`/`Sphere`), Jumlah Memeplex $m$, Katak per Memeplex $N$, Langkah Maksimum $D_{\max}$, Kecepatan Simulasi, dan *Seed* PRNG deterministik.
- **2 Sub-Tab Laboratorium Mekanisme Internal SFLA:**
  - *Sub-Tab A — Partisi Memeplex & Kocok Ulang*: Simulator interaktif pembagian bergilir (*round-robin* $k = i \bmod m$) dari 12 katak ke 3 memeplex agar setiap komunitas memperoleh distribusi katak unggul dan lemah secara merata.
  - *Sub-Tab B — 3 Aturan Lompatan Lokal*: Sandbox interaktif yang memperagakan secara visual kapan katak terburuk $X_w$ menggunakan lompatan ke $X_b$ (Langkah 1), kapan beralih ke $X_g$ (Langkah 2), dan kapan harus di-*reset* acak (Langkah 3).

### Tab 3 — Simulasi WCA (`#wca`)
Laboratorium lengkap untuk mempelajari dan menguji **Water Cycle Algorithm**:
- **Kanvas Simulasi Utama Siklus Air (60 FPS):**
  - Memvisualisasikan populasi tetesan hujan dalam 3 kasta hidrologi: **1 Laut (*Sea*)** sebagai solusi terbaik global, **Sungai (*Rivers* `S1..Sn`)** sebagai solusi elit, dan **Aliran (*Streams*)** sebagai tetesan air biasa.
  - Menampilkan **kurva aliran air** menuju induknya, **lingkaran putus-putus radius penguapan $d_{\max}$** di sekeliling Laut, **kilatan *Role Swap*** saat aliran/sungai menemukan posisi yang lebih rendah dari induknya, serta **animasi partikel uap & hujan baru** saat kondisi penguapan terpenuhi.
- **Indikator Tahap Siklus WCA (*Pipeline Stepper*):** Menyorot tahapan aktif: `INIT` $\to$ `HIERARCHY` $\to$ `FLOW` $\to$ `ROLE_SWAP` $\to$ `EVAPORATION` $\to$ `RAIN` $\to$ `DONE`.
- **Panel Telemetri, Grafik Konvergensi, & Hiperparameter:**
  - Strip KPI *real-time*: Iterasi ke-$t$, biaya Laut $f(X_{\text{laut}})$, radius penguapan aktif $d_{\max}$ yang menyusut seiring iterasi, dan total kejadian *Evaporasi & Hujan*.
  - Pengaturan hiperparameter interaktif: Populasi Tetesan $N_{\text{pop}}$, Jumlah Laut + Sungai $N_{sr}$, Batas Awal $d_{\max}^0$, Koefisien Aliran $C$, Kecepatan, dan *Seed* PRNG.
- **2 Sub-Tab Laboratorium Mekanisme Internal WCA:**
  - *Sub-Tab A — Hierarki Intensitas NSR & Role Swap*: Kalkulator visual pembagian jumlah aliran secara proporsional terhadap kebugaran induk ($NS_n$) dan demonstrasi pertukaran peran ketika aliran mengungguli sungai.
  - *Sub-Tab B — Kondisi Penguapan $d_{\max}$ & Hujan*: Simulator peluruhan ambang penguapan $d_{\max}(t)$ dari awal pencarian (eksplorasi luas) hingga akhir pencarian (eksploitasi presisi di sekitar Laut).

### Tab 4 — Komparasi & Cloud VM (`#komparasi`)
Modul evaluasi perbandingan langsung dan penerapan praktis pada infrastruktur Komputasi Awan:
- **Sub-Tab 1 — Arena Head-to-Head SFLA vs WCA:**
  - Menjalankan SFLA dan WCA **secara serentak pada dua kanvas berdampingan** dengan fungsi objektif, ukuran populasi ($N = 24$), dan *seed* PRNG awal yang **100% identik**.
  - Dilengkapi **Grafik Konvergensi Gabungan (2 kurva)** untuk membandingkan kecepatan penurunan biaya di iterasi awal vs kemampuan keluar dari jebakan lokal di iterasi lanjut.
- **Sub-Tab 2 — Studi Kasus Penjadwalan Cloud VM (*Cloud Task Load Balancer*):**
  - Simulasi penjadwalan **$n$ tugas komputasi (*cloudlets*)** dengan beban instruksi beragam (`MI` — *Million Instructions*) ke **$m$ *Virtual Machine* (VM) heterogen** dengan kapasitas pemrosesan berbeda (`MIPS` — *Million Instructions Per Second*).
  - Membandingkan hasil jadwal statis (*Round-Robin*), jadwal hasil optimasi **SFLA**, dan jadwal hasil optimasi **WCA** melalui grafik batang beban waktu eksekusi tiap VM, nilai **Makespan (detik)**, persentase penghematan waktu, serta tingkat keseimbangan beban (*Load Balance Index*).
- **Sub-Tab 3 — Matriks Sintesis & Referensi:**
  - Tabel perbandingan komprehensif arsitektur SFLA vs WCA, panduan pemilihan algoritma berdasarkan karakteristik beban kerja *cloud*, serta daftar pustaka ilmiah.

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
5. **Kocok Ulang Lintas Memeplex (`SHUFFLE`):**  
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
| **Mekanisme Anti-Stagnasi (Eksplorasi)** | **Kocok Ulang (*Shuffling*)** seluruh *memeplex* secara periodik + *reset* acak (Aturan 3) jika kedua lompatan gagal. | **Penguapan & Hujan Baru** saat jarak $\|\mathbf{X}_{\text{sungai}} - \mathbf{X}_{\text{laut}}\| < d_{\max}$ dengan radius $d_{\max}$ yang menyusut adaptif. |
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

Pada simulasi di **Tab 4 (`#komparasi`)**, algoritma statis **Round-Robin** ($a_i = (i \bmod m) + 1$) membagikan tugas secara buta tanpa memedulikan ukuran `MI` tugas maupun kecepatan `MIPS` VM, sehingga VM lambat menerima tugas raksasa dan memicu *Makespan* tinggi. Sebaliknya, **SFLA** dan **WCA** secara cerdas memindahkan *cloudlet* berat ke VM berkecepatan tinggi (`MIPS` besar) dan menyeimbangkan total beban seluruh VM sehingga menghasilkan penurunan *Makespan* yang signifikan.

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
  - **100% Mandiri Offline:** Tanpa ketergantungan framework eksternal maupun CDN; font *Plus Jakarta Sans* dan *Ubuntu Mono* telah dienkode langsung agar tetap berjalan saat dibuka via protokol `file://`.

---

## 5. Struktur Direktori Proyek

```text
├── index.html                  # Shell utama aplikasi (Sticky Header ITS + 4-Tab Workspace Stage)
├── public/
│   └── app.bundle.js           # Bundel produksi mandiri untuk eksekusi langsung via file://
├── src/
│   ├── main.js                 # Titik masuk aplikasi & pengikat WorkspaceController
│   ├── core/
│   │   ├── rng.js              # Generator angka acak deterministik Mulberry32 (Seedable PRNG)
│   │   ├── objectives.js       # Formulasi fungsi benchmark 2D (Sphere, Rastrigin, Ackley)
│   │   └── engine.js           # Pengatur loop animasi requestAnimationFrame & kontrol Play/Step
│   ├── algorithms/
│   │   ├── sfla.js             # Mesin status murni Shuffled Frog-Leaping Algorithm (SFLA)
│   │   ├── wca.js              # Mesin status murni Water Cycle Algorithm (WCA)
│   │   └── cloudScheduling.js  # Optimizer penjadwalan cloudlet ke VM heterogen (SFLA/WCA/RR)
│   ├── render/
│   │   ├── contourRenderer.js  # Renderer peta kontur topografi 2D dengan offscreen caching
│   │   ├── sflaRenderer.js     # Renderer visualisasi Kolam Teratai, Memeplex, & vektor lompatan
│   │   ├── wcaRenderer.js      # Renderer visualisasi Laut, Sungai, Aliran, dmax, uap, & hujan
│   │   └── chart.js            # Renderer grafik konvergensi real-time (1 & 2 seri)
│   ├── tabs/
│   │   ├── index.js            # Registri 4 modul tab utama + catatan pemaparan materi
│   │   ├── tabKonsep.js        # Tab 1: Konsep Optimasi, Eksplorasi Peta Kontur, & Dinamika Agen
│   │   ├── tabSfla.js          # Tab 2: Laboratorium Simulasi SFLA & Meja Kerja Memeplex/Lompatan
│   │   ├── tabWca.js           # Tab 3: Laboratorium Simulasi WCA & Meja Kerja NSR/Evaporasi
│   │   └── tabKomparasi.js     # Tab 4: Arena Head-to-Head, Cloud VM Scheduler, & Matriks Sintesis
│   ├── ui/
│   │   └── navigation.js       # WorkspaceController (router tab, URL hash, pintasan keyboard)
│   └── styles/
│       ├── fonts.css           # Font lokal terbundel (Plus Jakarta Sans & Ubuntu Mono)
│       └── main.css            # Sistem desain ITS Dark Navy & tata letak responsif anti-slop
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
# Menjalankan 15 unit & integration test (determinisme PRNG, konvergensi SFLA/WCA, Cloud VM, & UI 4-Tab)
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
| `1` `2` `3` `4` | Berpindah langsung ke **Tab 1 (`#konsep`)**, **Tab 2 (`#sfla`)**, **Tab 3 (`#wca`)**, atau **Tab 4 (`#komparasi`)** |
| `P` | **Play / Pause** (Mulai atau jeda simulasi utama pada tab yang sedang aktif) |
| `S` | **Step** (Maju tepat 1 langkah diskrit tahapan algoritma) |
| `R` | **Reset** (Kembalikan simulasi ke populasi awal sesuai *seed* aktif) |
| `N` | Buka / tutup laci **Catatan Pemaparan Materi (*Presenter Notes*)** |
| `F` | Masuk / keluar mode **Layar Penuh (*Fullscreen*)** |
| `?` / `H` | Buka dialog daftar pintasan keyboard |
| `Esc` | Tutup laci catatan atau dialog bantuan |

---

## 8. Referensi Ilmiah

1. **Eusuff, M. M., & Lansey, K. E. (2003).** *Optimization of water distribution network design using the shuffled frog leaping algorithm.* Journal of Water Resources Planning and Management, 129(3), 210–225.
2. **Eusuff, M., Lansey, K., & Pasha, F. (2006).** *Shuffled frog-leaping algorithm: a memetic meta-heuristic for discrete optimization.* Engineering Optimization, 38(2), 129–154.
3. **Eskandar, H., Sadollah, A., Bahreininejad, A., & Hamdi, M. (2012).** *Water cycle algorithm – A novel metaheuristic optimization method for solving constrained engineering optimization problems.* Computers & Structures, 110–111, 151–166.
4. **Sadollah, A., Eskandar, H., Bahreininejad, A., & Kim, J. H. (2015).** *Water cycle algorithm for solving multi-objective optimization problems.* Soft Computing, 19(9), 2587–2603.
