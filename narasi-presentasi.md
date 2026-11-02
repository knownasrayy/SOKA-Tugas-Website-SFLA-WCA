# Narasi Presentasi & Antisipasi Tanya Jawab

**SFLA x WCA: Optimasi Penjadwalan Tugas pada Komputasi Awan**
Mata kuliah Strategi Optimasi Komputasi Awan (SOKA), ITS

**Isi:**

1. [Persiapan sebelum tampil](#bagian-1-persiapan-sebelum-tampil)
2. [Narasi per slide](#bagian-2-narasi-per-slide) (16 slide, target 11:15, cadangan 0:45)
3. [Kemungkinan pertanyaan dosen dan jawabannya](#bagian-3-kemungkinan-pertanyaan-dosen-dan-jawabannya)
4. [Contekan angka](#bagian-4-contekan-angka)

---

## Bagian 1: Persiapan sebelum tampil

- Buka <http://localhost:4173/> lalu tekan `F` untuk layar penuh.
- Di slide judul, klik baris "Klik untuk isi nama & NRP" dan isi nama kelompok.
- Panah kanan memajukan animasi di dalam slide dulu, baru pindah slide.
- Jangan ubah Seed atau parameter sebelum tampil. Angka di narasi ini berlaku untuk pengaturan bawaan (seed 42, fungsi Rastrigin, Skenario A).

| Tombol | Fungsi |
| :--- | :--- |
| `→` | Maju |
| `P` | Jalankan / jeda simulasi |
| `S` | Satu langkah |
| `R` | Reset |
| `N` | Catatan presenter |

**Kalau waktu mepet** (lihat penanda menit di tiap slide):

- Terlambat lebih dari 1 menit saat masuk slide 8: lewati penjelasan slide 9 (cukup satu kalimat), dan hentikan simulasi slide 11 lebih awal.
- Slide 15 bisa dilewati dengan satu kalimat saja.

---

## Bagian 2: Narasi per slide

Baris kutipan seperti di bawah ini adalah aksi dan tidak dibaca. Kecepatan bicara dihitung sekitar 120 kata per menit.

> **Aksi:** contoh aksi

| Slide | Judul | Durasi | Menit |
| ---: | :--- | ---: | :--- |
| 1 | Judul | 0:20 | 0:00 - 0:20 |
| 2 | Masalah | 0:45 | 0:20 - 1:05 |
| 3 | Mengapa Metaheuristik | 0:45 | 1:05 - 1:50 |
| 4 | SFLA: Inspirasi | 0:25 | 1:50 - 2:15 |
| 5 | SFLA: Karakteristik | 0:30 | 2:15 - 2:45 |
| 6 | SFLA: Cara Kerja | 1:10 | 2:45 - 3:55 |
| 7 | SFLA: Simulasi | 0:50 | 3:55 - 4:45 |
| 8 | WCA: Inspirasi | 0:25 | 4:45 - 5:10 |
| 9 | WCA: Karakteristik | 0:30 | 5:10 - 5:40 |
| 10 | WCA: Cara Kerja | 1:10 | 5:40 - 6:50 |
| 11 | WCA: Simulasi | 0:45 | 6:50 - 7:35 |
| 12 | Perbandingan SFLA vs WCA | 0:55 | 7:35 - 8:30 |
| 13 | Dari Posisi ke Jadwal | 0:40 | 8:30 - 9:10 |
| 14 | Studi Kasus | 0:55 | 9:10 - 10:05 |
| 15 | Perbandingan Mekanisme | 0:25 | 10:05 - 10:30 |
| 16 | Kesimpulan | 0:45 | 10:30 - 11:15 |

### Slide 1: Judul

*Durasi 0:20 | Menit 0:00 - 0:20*

Selamat pagi, Bapak dan Ibu, serta teman-teman. Kami dari kelompok [nama kelompok]. Hari ini kami membahas dua algoritma metaheuristik yang terinspirasi dari alam, yaitu SFLA dan WCA, lalu menerapkannya untuk menjadwalkan tugas pada komputasi awan.

### Slide 2: Masalah

*Durasi 0:45 | Menit 0:20 - 1:05*

> **Aksi:** tugas beterbangan ke VM selama sekitar 6 detik.

Bayangkan sebuah broker cloud. Ada enam belas tugas yang harus dijalankan di empat VM dengan kecepatan berbeda, dari 85 sampai 175 MIPS. Di layar, tugas dibagi bergilir dengan Round-Robin. Semua tugas baru selesai saat VM paling sibuk selesai. Waktu itulah yang disebut makespan, di sini 15,8 detik, dan itulah yang ingin kita perkecil.

> **Aksi:** tekan `→`

Setiap tugas punya empat pilihan VM, jadi ada 4 pangkat 16, sekitar 4,29 miliar jadwal. Dan itu baru enam belas tugas. Untuk 100 tugas dan 10 VM, jumlahnya 10 pangkat 100, sehingga mencoba semuanya tidak lagi realistis.

### Slide 3: Mengapa Metaheuristik

*Durasi 0:45 | Menit 1:05 - 1:50*

Supaya mudah dibayangkan, anggap setiap jadwal sebagai satu titik di lanskap. Ketinggiannya adalah makespan, jadi kita mencari titik terendah. Gambar ini hanya ilustrasi.

> **Aksi:** tekan `→`

Pencarian greedy hanya mengikuti turunan terdekat, lalu berhenti di lembah pertama. Itu minimum lokal, padahal lembah terdalam ada di tempat lain.

> **Aksi:** tekan `→`

Metaheuristik memakai banyak solusi sekaligus. Awalnya menjelajah luas, ini eksplorasi. Lalu memusatkan pencarian di area yang menjanjikan, ini eksploitasi. Hasilnya tidak dijamin paling optimal, tetapi solusi yang baik didapat dengan cepat.

### Slide 4: SFLA: Inspirasi

*Durasi 0:25 | Menit 1:50 - 2:15*

Algoritma pertama, SFLA, diperkenalkan Eusuff dan Lansey tahun 2003. Idenya dari sekelompok katak yang melompat antar daun teratai untuk mencari makanan.

> **Aksi:** tekan `→`

Yang penting, katak tidak mewariskan gen. Mereka meniru informasi, atau meme, dari katak yang lebih baik, sehingga informasi menyebar cepat.

### Slide 5: SFLA: Karakteristik

*Durasi 0:30 | Menit 2:15 - 2:45*

Ada empat ciri utama. Pertama, populasi dibagi ke beberapa kelompok bernama memeplex. Kedua, di tiap kelompok hanya katak terburuk yang melompat. Ketiga, kelompok dikocok berkala supaya informasi menyebar. Keempat, perbaikan terjadi lewat peniruan, bukan persilangan. Parameternya F, m, N, dan Dmax.

### Slide 6: SFLA: Cara Kerja

*Durasi 1:10 | Menit 2:45 - 3:55*

Cara kerjanya ada empat tahap. Pertama, semua katak dievaluasi lalu diurutkan dari terbaik ke terburuk. Peringkat satu menjadi Xg, terbaik global.

> **Aksi:** tekan `→`

Kedua, katak dibagi bergilir seperti membagi kartu. Peringkat satu ke kelompok satu, peringkat dua ke kelompok dua, dan seterusnya. Jadi tiap memeplex punya katak baik dan buruk secara merata.

> **Aksi:** tekan `→`. Animasi berulang tiap 12 detik, tunggu sampai aturan 3.

Ketiga, inti algoritmanya. Katak terburuk, Xw, mencoba melompat ke arah terbaik kelompoknya, Xb. Kalau posisinya tidak membaik, ia mencoba ke arah Xg. Kalau masih gagal, ia diganti posisi acak baru. Jadi ada tiga aturan berurutan, dan berhenti begitu ada yang berhasil. Aturan ketiga inilah yang mencegah katak terjebak.

> **Aksi:** tekan `→`

Keempat, shuffle. Semua katak digabung, diurutkan ulang, lalu dibagi lagi. Siklus ini diulang sampai iterasi maksimum.

### Slide 7: SFLA: Simulasi

*Durasi 0:50 | Menit 3:55 - 4:45*

Ini bukan video. Algoritmanya benar-benar berjalan di browser, pada fungsi Rastrigin yang punya banyak lembah. Makin terang petanya, makin rendah biayanya, dan bintang adalah optimum global.

> **Aksi:** tekan `S` tiga kali, perlahan (Pengurutan, Partisi, Lompatan).

Warna menunjukkan memeplex. Lingkaran merah adalah katak terburuk, lingkaran putih terbaik kelompok, dan yang bermahkota terbaik global.

> **Aksi:** tekan `P`

Perhatikan grafik di kanan. Nilai terbaik mulai dari 6,229 dan turun bertahap. Grafiknya berbentuk tangga karena nilai terbaik hanya berubah saat ada katak yang menemukan posisi lebih baik. Kalau diteruskan sampai iterasi 40, nilainya mencapai 0,011.

> **Aksi:** tidak perlu menunggu selesai, 40 iterasi butuh sekitar 2 menit. Lanjut slide.

### Slide 8: WCA: Inspirasi

*Durasi 0:25 | Menit 4:45 - 5:10*

Algoritma kedua, WCA, diperkenalkan Eskandar dan rekan tahun 2012, terinspirasi siklus air. Hujan turun di gunung.

> **Aksi:** tekan `→`

Air mengalir menjadi aliran, bergabung ke sungai, lalu bermuara ke laut sebagai titik terendah.

> **Aksi:** tekan `→`

Lalu air menguap dan turun lagi sebagai hujan, sehingga pencarian berlanjut dari posisi baru.

### Slide 9: WCA: Karakteristik

*Durasi 0:30 | Menit 5:10 - 5:40*

Empat cirinya. Pertama, ada hierarki: satu laut, beberapa sungai, sisanya aliran. Kedua, semua aliran dan sungai bergerak tiap iterasi, berbeda dari SFLA. Ketiga, dengan C sama dengan 2, tetesan bisa melewati induknya, sehingga sisi seberang ikut dicari. Keempat, batas penguapan dmax mengecil, dari pencarian luas ke terfokus.

### Slide 10: WCA: Cara Kerja

*Durasi 1:10 | Menit 5:40 - 6:50*

Tahap pertama, hierarki. Tetesan diurutkan. Yang terbaik menjadi laut, berikutnya sungai, sisanya aliran. Induk yang lebih baik mendapat aliran lebih banyak.

> **Aksi:** tekan `→`

Tahap kedua, aliran bergerak menuju induknya dengan rumus di layar: posisi ditambah rand kali C kali jarak ke induk. Tetesan emas adalah yang melewati induknya. Sungai juga bergerak menuju laut.

> **Aksi:** tekan `→`

Tahap ketiga, pertukaran peran. Kalau aliran menemukan titik lebih rendah dari induknya, keduanya bertukar. Di contoh ini aliran bernilai 3,1 mengalahkan sungai bernilai 4,7, jadi aliran naik menjadi sungai.

> **Aksi:** tekan `→`

Tahap keempat, penguapan. Kalau sungai terlalu dekat dengan laut, yaitu masuk radius dmax, ia menguap lalu turun sebagai hujan di tempat baru. Inilah cara WCA menjaga keragaman. Radius dmax mengecil tiap iterasi, sehingga makin lama pencarian makin terfokus.

### Slide 11: WCA: Simulasi

*Durasi 0:45 | Menit 6:50 - 7:35*

> **Aksi:** tekan `P`

Sama seperti tadi, ini mesin WCA yang sedang berjalan pada fungsi dan seed yang sama. Lingkaran bergaris adalah radius dmax di sekitar laut, perhatikan radiusnya mengecil. Belah ketupat adalah sungai, tetesan adalah aliran, dan lingkaran bercincin emas adalah laut. Awan kecil menandai tetesan hujan baru.

Di grafik terlihat penurunan awalnya tajam. Dari 6,229, pada iterasi kelima sudah 2,032. Bandingkan dengan SFLA tadi yang masih 5,518 pada iterasi yang sama. Tapi ingat, ini baru satu seed.

> **Aksi:** tidak perlu menunggu selesai. Lanjut slide.

### Slide 12: Perbandingan SFLA vs WCA

*Durasi 0:55 | Menit 7:35 - 8:30*

Sekarang keduanya kita adu. Posisi awal sama, fungsi sama, dan sama-sama 24 agen.

> **Aksi:** tekan `P`. Selesai sekitar 18 detik.

Tiap langkah di sini satu iterasi penuh. Pada iterasi kelima, SFLA di 4,499 dan WCA sudah di 1,246. Di akhir, SFLA sekitar 1,05, yaitu masih tertahan di lembah dekat pusat, sedangkan WCA hampir nol.

Tapi ini satu seed dan belum tentu mewakili. Kami mengulang pada 10 seed: WCA konsisten lebih cepat di awal pada ketiga fungsi, namun hasil akhirnya berubah. Di Rastrigin, SFLA menang 7 dari 10, di Ackley WCA menang 7 dari 10, di Sphere imbang. Jadi tidak ada yang selalu menang.

### Slide 13: Dari Posisi ke Jadwal

*Durasi 0:40 | Menit 8:30 - 9:10*

Lalu bagaimana memakainya untuk penjadwalan? Kedua algoritma bekerja di ruang kontinu, sedangkan jadwal bersifat diskrit. Jadi satu katak atau satu tetesan adalah vektor 16 angka antara 0 dan 4. Tiap angka mewakili satu tugas. Dengan pembulatan ke bawah, angka itu memilih VM. Misalnya T12 bernilai 2,71, berarti masuk VM ke-3.

> **Aksi:** tekan `→`

Vektor ini menjadi jadwal utuh, dan fitness-nya adalah makespan jadwal tersebut. Jadwal acak ini makespan-nya 26,28 detik, dan itulah yang akan diperbaiki.

### Slide 14: Studi Kasus

*Durasi 0:55 | Menit 9:10 - 10:05*

Ini tiga panel: Round-Robin, SFLA, dan WCA, dengan populasi awal yang sama, 28 agen, 35 iterasi. Round-Robin bernilai tetap 15,8 detik. Terlihat VM-1, yang paling lambat, menjadi penghambat karena dibagi tanpa melihat kecepatannya.

> **Aksi:** tekan `P`. Selesai sekitar 5 detik.

Perhatikan garis merah turun. SFLA berakhir di 13,00 detik, turun 17,7 persen. WCA di 13,38 detik, turun 15,3 persen. Batang VM juga menjadi lebih rata, dan VM-3 serta VM-4 yang lebih cepat menerima lebih banyak tugas, tanpa kami atur secara manual. Algoritma menemukannya sendiri hanya dari nilai makespan.

### Slide 15: Perbandingan Mekanisme

*Durasi 0:25 | Menit 10:05 - 10:30*

Secara ringkas, SFLA menggerakkan sedikit agen, yaitu katak terburuk tiap kelompok, dan mengandalkan shuffle. WCA menggerakkan semua agen dalam hierarki terpusat, dan mengandalkan penguapan. Tujuannya sama: menghindari minimum lokal.

### Slide 16: Kesimpulan

*Durasi 0:45 | Menit 10:30 - 11:15*

Grafik ini dihitung langsung, rata-rata dari 10 beban kerja. Round-Robin 17,39 detik, SFLA 12,20 detik, WCA 12,46 detik. Keduanya memangkas makespan sekitar 30 persen, dengan memeriksa hanya sekitar seribu jadwal dari 4,29 miliar.

Selisih SFLA dan WCA jauh lebih kecil daripada selisih keduanya dengan Round-Robin. Algoritma terbaik bergantung pada masalahnya. Perlu dicatat, ini demo pada skenario kecil, bukan uji statistik atau uji di cloud sungguhan.

Sekian dari kami. Terima kasih, kami persilakan untuk bertanya.

---

## Bagian 3: Kemungkinan pertanyaan dosen dan jawabannya

Kalau tidak tahu jawabannya: katakan belum diuji atau belum dibahas, lalu sebutkan cara mengujinya. Jangan menebak angka.

### A. Konsep dan alasan memakai metaheuristik

**T1. "4,29 miliar itu masih bisa di-brute force komputer. Kenapa slide-nya bilang mustahil?"**

Betul Pak/Bu, untuk 16 tugas dan 4 VM sebenarnya masih bisa dihitung, dan judul slide itu memang berlebihan untuk kasus sekecil ini. Kami sendiri memverifikasi optimum sejatinya dengan branch and bound. Kasus kecil ini dipilih supaya bisa divisualisasikan. Masalahnya ada pada pertumbuhan m pangkat n: 100 tugas dan 10 VM sudah 10 pangkat 100 kombinasi.

**T2. "Apakah hasilnya dijamin optimal? Seberapa jauh dari optimal?"**

Tidak dijamin. Kami cek dengan branch and bound di luar website: rata-rata optimum sejati pada 10 beban kerja adalah 11,78 detik. SFLA 12,20 (selisih 3,6 persen) dan WCA 12,46 (selisih 5,8 persen). Tidak ada yang mencapai optimum pada 10 beban kerja ini.

**T3. "Apa bedanya eksplorasi dan eksploitasi pada dua algoritma ini?"**

SFLA: eksploitasi lewat lompatan ke Xb dan Xg, eksplorasi lewat shuffle dan posisi acak di aturan 3. WCA: eksploitasi lewat aliran menuju induk, eksplorasi lewat penguapan dan hujan, dan keseimbangannya diatur dmax yang mengecil.

**T4. "Kenapa makespan? Bukankah biaya dan energi juga penting?"**

Makespan paling mudah divisualisasikan dan umum dipakai sebagai tujuan tunggal. Di dunia nyata biasanya multi-objektif. Ini bisa dilakukan dengan mengubah fungsi fitness saja, karena kedua algoritma tidak bergantung pada isi fungsi tersebut. Tapi itu belum kami implementasikan.

### B. SFLA

**T5. "Kenapa hanya katak terburuk yang bergerak?"**

Supaya solusi yang sudah baik tidak rusak dan evaluasi fungsi hemat. Kelompok terus diperbaiki dari anggota terlemahnya. Kelemahannya, perbaikan per iterasi lebih lambat, yang terlihat pada penurunan awal SFLA di slide simulasi.

**T6. "Kenapa partisinya bergilir, tidak acak?"**

Supaya tiap memeplex punya campuran katak baik dan buruk. Rumusnya `k = i mod m`. Kalau semua yang baik berkumpul di satu kelompok, kelompok lain tidak punya panutan yang bagus.

**T7. "Apa fungsi Dmax? Berapa nilainya di studi kasus?"**

Dmax membatasi panjang lompatan agar tidak terlalu jauh. Di simulasi 2D nilainya 3,2. Di studi kasus penjadwalan tidak ada Dmax: lompatan memakai faktor pengali 1,6 dan hanya dibatasi rentang 0 sampai 4.

**T8. "Aturan 3 kan bisa membuat posisi lebih buruk. Tidak masalah?"**

Benar, posisi acak diterima tanpa syarat, jadi bisa lebih buruk. Itu sengaja untuk eksplorasi. Solusi terbaik global disimpan terpisah, jadi nilai terbaik tidak akan pernah naik.

**T9. "Apa bedanya SFLA dengan GA dan PSO?"**

GA memakai persilangan dan mutasi antar generasi, SFLA tanpa persilangan, hanya peniruan. PSO menggerakkan semua partikel dengan kecepatan dan memori, sedangkan SFLA hanya menggerakkan yang terburuk, tanpa kecepatan, dan punya kelompok yang dikocok. SFLA sendiri menggabungkan pencarian lokal ala PSO dengan shuffling ala Shuffled Complex Evolution.

### C. WCA

**T10. "Kenapa C = 2?"**

Karena rand ada di 0 sampai 1, dengan C = 2 langkahnya bisa sampai dua kali jarak ke induk. Jadi tetesan bisa melewati induk dan mencari di kedua sisi. Dengan C = 1, tetesan hanya mencari di antara posisinya dan induk.

**T11. "Bagaimana jumlah aliran tiap induk dihitung?"**

`C_n = f(induk ke-n) - f(aliran terbaik pertama)`, lalu `NS_n = round(|C_n / jumlah semua C| x jumlah aliran)`. Laut paling rendah nilainya, jadi selisihnya paling besar dan alirannya paling banyak. Sisa pembulatan disesuaikan supaya totalnya pas.

**T12. "Apa akibatnya kalau dmax terlalu besar atau terlalu kecil?"**

Terlalu besar: sungai terlalu sering menguap, pencarian tidak sempat fokus. Terlalu kecil: jarang menguap, keragaman hilang dan bisa konvergen dini. Di simulasi 2D dmax awal 0,45, berkurang dmax awal dibagi iterasi maksimum tiap iterasi. Di studi kasus nilai awalnya 1,2, dan jaraknya dinormalisasi per dimensi karena vektornya 16 dimensi.

**T13. "Kalau menguap, solusi yang baik hilang dong?"**

Laut tidak pernah menguap dan solusi terbaik disimpan terpisah. Yang dikorbankan hanya sungai atau aliran di dekat laut, yang wilayahnya memang sudah ditempati laut. Kalau hujan baru jatuh lebih rendah dari laut, ia mengambil posisi laut.

**T14. "Apa bedanya WCA dengan PSO, sama-sama bergerak ke yang terbaik?"**

PSO punya kecepatan dan memori per partikel, dan tiap partikel tertarik ke terbaik global. WCA tanpa kecepatan, tiap aliran hanya ke induknya dalam hierarki, dan ada mekanisme penguapan untuk mengacak ulang.

### D. Studi kasus penjadwalan

**T15. "Apa kelemahan pemetaan floor dari kontinu ke diskrit?"**

Dua. Pertama, banyak vektor berbeda menghasilkan jadwal yang sama, sehingga banyak gerakan kecil tidak mengubah fitness. Kedua, nomor VM sebenarnya tidak punya urutan makna, tetapi algoritma memperlakukannya seperti jarak: VM-1 dianggap "dekat" VM-2. Alternatifnya pengkodean berbasis urutan, tapi belum kami coba.

**T16. "Rumus fitness-nya apa? Kenapa ada penalti 0,001?"**

`Fitness = makespan + 0,001 x simpangan baku beban VM`. Karena banyak jadwal punya makespan hampir sama, penalti kecil ini memberi arah ke jadwal yang lebih seimbang. Nilainya kecil agar makespan tetap jadi tujuan utama.

**T17. "Asumsi modelnya apa saja? Realistis?"**

Tugas independen tanpa dependensi, satu tugas di satu VM, waktu = MI / MIPS, dan VM mengerjakan tugasnya berurutan. Belum memodelkan jaringan, RAM, biaya, kegagalan, atau tugas yang datang bertahap. Jadi ini penyederhanaan untuk menunjukkan mekanismenya.

**T18. "Datanya dari mana?"**

Sintetis. Panjang tugas dibangkitkan acak 140 sampai 620 MI, dan empat VM bernilai 85, 115, 145, 175 MIPS. Bukan trace dari cloud sungguhan.

**T19. "Round-Robin itu pembanding yang lemah. Bagaimana dengan greedy?"**

Betul, Round-Robin hanya baseline paling sederhana. Kami sudah coba menghitung terpisah pada 10 beban kerja yang sama: greedy "tugas terbesar dulu ke VM yang paling cepat selesai" menghasilkan rata-rata 12,45 detik, dan versi tanpa pengurutan 13,15. Jadi SFLA (12,20) sedikit lebih baik, WCA (12,46) setara dengan greedy. Artinya, untuk masalah sesederhana ini greedy sudah sangat kompetitif dan jauh lebih murah. Metaheuristik lebih bernilai kalau tujuannya banyak atau kendalanya rumit sehingga greedy sulit dirancang.

**T20. "Kenapa tidak pakai CloudSim?"**

Fokus tugas ini memvisualisasikan mekanisme algoritma secara interaktif di browser. Langkah berikutnya yang wajar adalah menguji di CloudSim atau cloud nyata, karena hasil kami belum memperhitungkan faktor seperti jaringan.

### E. Validitas hasil

**T21. "Jadi mana yang lebih baik, SFLA atau WCA?"**

Tergantung masalahnya. Di studi kasus, SFLA lebih baik pada 8 dari 10 beban kerja. Di fungsi benchmark 2D, WCA lebih cepat di awal, dan hasil akhirnya berubah-ubah per fungsi. Kami tidak menyimpulkan salah satunya selalu unggul.

**T22. "Perbandingan per iterasi itu adil? Jumlah evaluasi fungsinya kan beda."**

Pertanyaan yang tepat, Pak/Bu. Kami menghitungnya. Di benchmark 2D, per iterasi SFLA hanya 12 sampai 20 evaluasi, sedangkan WCA 29 sampai 32. Jadi WCA unggul per iterasi sebagian karena memakai evaluasi lebih banyak, dan perbandingan di slide 12 menguntungkan WCA. Di studi kasus jumlahnya hampir sama, 27,3 berbanding 29,9 per iterasi, jadi di situ lebih adil. Idealnya sumbu grafiknya jumlah evaluasi, bukan iterasi.

**T23. "Selisih 12,20 dan 12,46 itu signifikan secara statistik?"**

Belum kami uji. Datanya 10 beban kerja, dan simpangan baku antar beban kerja sekitar 0,6 sampai 0,7 detik, lebih besar dari selisihnya. SFLA menang 8 dari 10, tapi itu belum cukup untuk klaim. Untuk klaim yang kuat perlu minimal 30 pengulangan dan uji seperti Wilcoxon.

**T24. "Kenapa WCA unggul di benchmark, tapi SFLA unggul di penjadwalan?"**

Bentuk masalahnya berbeda: benchmark 2 dimensi dan mulus, penjadwalan 16 dimensi dan berundak karena floor. Dugaan kami, tapi belum kami uji, pergerakan WCA kurang efektif di dimensi tinggi dan penguapan terlalu sering. Di Skenario A, nilai WCA berhenti di 13,38 sejak sekitar iterasi 10. Selain itu, implementasi versi studi kasus juga tidak identik dengan versi 2D. Ini sejalan dengan No Free Lunch: tidak ada algoritma yang terbaik untuk semua masalah.

**T25. "Parameternya sudah di-tuning?"**

Belum secara sistematis. Parameter dipilih tetap untuk demo, misalnya m = 4, N = 4, Nsr = 4, C = 2 di studi kasus. Jadi hasilnya bisa berubah dengan parameter lain. Tuning seperti grid search adalah pekerjaan lanjutan.

**T26. "Apakah angkanya bisa direproduksi?"**

Bisa. Semua keacakan memakai generator ber-seed (Mulberry32), jadi seed yang sama menghasilkan hasil yang sama persis. Skenario A, B, C memakai seed 42, 108, dan 2026.

### F. Implementasi

**T27. "Simulasinya sungguhan atau cuma animasi?"**

Slide inspirasi, karakteristik, dan cara kerja adalah ilustrasi. Slide simulasi, adu, studi kasus, dan grafik kesimpulan berasal dari mesin algoritma yang benar-benar berjalan di browser. Logikanya terpisah dari tampilan.

**T28. "Apa bedanya implementasi kalian dengan paper aslinya?"**

Ada beberapa penyesuaian:

- SFLA studi kasus memakai faktor 1,6 pada lompatan dan tanpa Dmax.
- Pemilihan submemeplex hanya aktif jika anggota kelompok lebih dari 6. Pada pengaturan bawaan (24 katak, 4 memeplex) tiap kelompok tepat 6, jadi tidak aktif. Di studi kasus memang tidak dipakai.
- WCA memakai peluang penguapan acak 0,08 untuk sungai.
- Hujan lokal di sekitar laut diberi skala tambahan mengikuti lebar domain.
- WCA studi kasus hanya menguapkan sungai, aliran yang langsung ke laut tidak.

**T29. "Berapa kompleksitas waktunya?"**

Satu evaluasi jadwal O(n + v), dengan n tugas dan v VM. SFLA per iterasi paling banyak m x N x 3 evaluasi, ditambah pengurutan. WCA sekitar Npop evaluasi, ditambah hujan dan pengurutan. Di studi kasus totalnya sekitar 1.000 evaluasi untuk masing-masing algoritma.

---

## Bagian 4: Contekan angka

Tanda \* berarti dihitung terpisah dengan kode algoritma yang sama dan **tidak tampil di website**. Optimum dihitung dengan branch and bound.

### Studi kasus

16 tugas, 4 VM (85/115/145/175 MIPS), 28 agen, 35 iterasi. Makespan dalam detik.

| Skenario | Round-Robin | SFLA | WCA | Optimum\* |
| :--- | ---: | ---: | ---: | ---: |
| Skenario A | 15,80 | 13,00 (-17,7%) | 13,38 (-15,3%) | 12,59 |
| Skenario B | 14,02 | 11,05 (-21,2%) | 11,54 (-17,7%) | 10,97 |
| Skenario C | 15,35 | 11,76 (-23,3%) | 11,99 (-21,9%) | 11,23 |
| Rata-rata 10 beban kerja | 17,39 | 12,20 (-29,9%) | 12,46 (-28,3%) | 11,78 |

- Seed 10 beban kerja: 1, 7, 13, 42, 99, 123, 256, 512, 777, 2026
- Greedy pada 10 beban kerja\*: terbesar dulu 12,45; tanpa urutan 13,15
- Evaluasi per iterasi\*: SFLA 27,3; WCA 29,9

### Benchmark 2D, seed 42 (slide 12)

Posisi awal sama, 24 agen.

| Fungsi | Iterasi 5 SFLA | Iterasi 5 WCA | Iterasi 35 SFLA | Iterasi 35 WCA | Evaluasi/iterasi SFLA\* | Evaluasi/iterasi WCA\* |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| Rastrigin | 4,499 | 1,246 | 1,050 | 0,0000343 | 20,2 | 31,9 |
| Ackley | 1,148 | 0,114 | 0,529 | 0,018 | 12,4 | 29,6 |
| Sphere | 0,106 | 0,005 | 0,006 | 0,0000496 | 12,0 | 28,8 |

### Benchmark 2D, 10 seed, 40 iterasi\*

| Fungsi | Rata-rata iterasi 5 SFLA | Rata-rata iterasi 5 WCA | Rata-rata akhir SFLA | Rata-rata akhir WCA | Menang akhir SFLA | Menang akhir WCA |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| Rastrigin | 2,895 | 1,993 | 0,426 | 0,307 | 7 | 3 |
| Ackley | 1,015 | 0,257 | 0,153 | 0,005 | 3 | 7 |
| Sphere | 0,057 | 0,003 | 0,002 | 0,0000096 | 5 | 5 |

**Catatan Rastrigin:** rata-rata WCA lebih rendah, tetapi SFLA menang di lebih banyak seed. Jangan menyebut salah satunya "lebih baik di Rastrigin" tanpa penjelasan ini.
