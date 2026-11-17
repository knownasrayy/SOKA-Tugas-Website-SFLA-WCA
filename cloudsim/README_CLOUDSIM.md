# Implementasi Algoritma Metaheuristik SFLA & WCA di CloudSim (Java 17)

Direktori `cloudsim/` ini berisi implementasi Java nyata dari dua algoritma metaheuristik acuan penelitian kita pada simulasi **CloudSim Task Scheduling & Load Balancing**:
1. **Shuffled Frog-Leaping Algorithm (SFLA)** — Eusuff & Lansey (2003), *Journal of Water Resources Planning and Management*, 129(3), 210–225.
2. **Water Cycle Algorithm (WCA)** — Eskandar, Sadollah, Bahreininejad, & Hamdi (2012), *Computers & Structures*, 110–111, 151–166.

Kode disusun agar dapat **langsung dikompilasi dan dijalankan melalui Java 17 (`javac` / `java`) tanpa dependensi JAR tambahan**, sekaligus dilengkapi adapter resmi untuk dihubungkan ke `cloudsim-3.0.3.jar` di NetBeans, IntelliJ IDEA, atau Eclipse.

---

## 1. Pemetaan Matematis ke Entitas CloudSim

| Konsep | SFLA (Kolam Teratai) | WCA (Siklus Hidrologi) | Entitas CloudSim |
| :--- | :--- | :--- | :--- |
| **Kandidat Solusi** | 1 Ekor Katak ($\mathbf{X}_i$) | 1 Tetesan Hujan ($\mathbf{X}_i$) | Peta alokasi seluruh `Cloudlet` ke `Vm` |
| **Dimensi Vektor** | $n$ dimensi ($\mathbf{X}_i \in [0, M)^n$) | $n$ dimensi ($\mathbf{X}_i \in [0, M)^n$) | Jumlah Cloudlet yang dijadwalkan ($n$) |
| **Encoding Diskrit** | $a_j = \lfloor x_{i,j} \rfloor \in \{0, \dots, M-1\}$ | $a_j = \lfloor x_{i,j} \rfloor \in \{0, \dots, M-1\}$ | `bindCloudletToVm(cloudletId, vmId)` |
| **Solusi Elit** | Katak Global ($X_g$) & Lokal ($X_b$) | 1 Laut (*Sea*) & $N_{sr}-1$ Sungai | Jadwal paling seimbang dengan *Makespan* terendah |
| **Fungsi Biaya** | $f(\mathbf{X}) = \text{Makespan} + 10^{-3}\sigma_{\text{Load}}$ | $f(\mathbf{X}) = \text{Makespan} + 10^{-3}\sigma_{\text{Load}}$ | Waktu selesai maksimum dari VM paling sibuk |

### Metrik Kinerja CloudSim yang Dihitung
- **Execution Time Cloudlet:** $ET_{i,j} = \frac{\text{Length}(Cloudlet_i)}{\text{MIPS}(VM_j) \times \text{PE}(VM_j)}$
- **VM Completion Time:** $CT_j = \sum_{i \in VM_j} ET_{i,j}$ (model antrean *Space-Shared*)
- **Makespan:** $\text{Makespan} = \max_{j=0}^{M-1} CT_j$
- **Degree of Imbalance (DI):** $DI = \frac{T_{\max} - T_{\min}}{T_{\text{avg}}}$
- **Average Resource Utilization:** $U_{\text{avg}} = \frac{T_{\text{avg}}}{\text{Makespan}} \times 100\%$

---

## 2. Struktur File `cloudsim/`

```text
cloudsim/
├── README_CLOUDSIM.md
├── src/id/ac/its/soka/cloudsim/
│   ├── CloudSimComparisonRunner.java      # Program utama pembanding Round-Robin vs SFLA vs WCA
│   ├── model/
│   │   ├── VmSpec.java                    # Spesifikasi VM (ID, MIPS, PEs, RAM, BW, Storage)
│   │   ├── CloudletSpec.java              # Spesifikasi Cloudlet (ID, Length MI, PEs, FileSize)
│   │   └── ScheduleResult.java            # Hasil metrik CloudSim & histori konvergensi
│   └── scheduler/
│       ├── ScheduleEvaluator.java         # Decoder kontinu -> diskrit & evaluator Space-Shared VM
│       ├── SflaScheduler.java             # Mesin optimasi SFLA (Partition -> 3 Jump Rules -> Shuffle)
│       └── WcaScheduler.java              # Mesin optimasi WCA (Hierarchy -> NSn -> Flow C=2 -> Evaporate/Rain)
└── cloudsim3_adapter/
    └── SflaWcaDatacenterBroker.java       # Drop-in subclass org.cloudbus.cloudsim.DatacenterBroker
```

---

## 3. Cara Menjalankan Simulasi Langsung (Java 17 CLI)

Pastikan JDK 17+ tersedia, lalu jalankan perintah berikut dari direktori root proyek:

### Windows (PowerShell)
```powershell
javac -encoding UTF-8 -d cloudsim\out `
  cloudsim\src\id\ac\its\soka\cloudsim\model\*.java `
  cloudsim\src\id\ac\its\soka\cloudsim\scheduler\*.java `
  cloudsim\src\id\ac\its\soka\cloudsim\CloudSimComparisonRunner.java

java -cp cloudsim\out id.ac.its.soka.cloudsim.CloudSimComparisonRunner
```

Anda juga dapat memasukkan *seed* acak tertentu sebagai argumen, misalnya `java -cp cloudsim\out id.ac.its.soka.cloudsim.CloudSimComparisonRunner 2026`.

Program akan menjalankan **2 Skenario Pengujian** secara otomatis:
1. **Skenario 1:** 16 *Cloudlets* ($140–620\text{ MI}$) ke 4 *VM* heterogen (`85, 115, 145, 175 MIPS`) lengkap dengan **CloudSim Execution Log Table** (`Cloudlet ID | STATUS | Data center ID | VM ID | Time | Start Time | Finish Time`).
2. **Skenario 2:** Klaster skala menengah 40 *Cloudlets* ($150–950\text{ MI}$) ke 8 *VM* heterogen (`90–300 MIPS`).

---

## 4. Cara Integrasi ke Proyek `cloudsim-3.0.3.jar` (NetBeans / IntelliJ / Eclipse)

Jika Anda sudah memiliki proyek Java berbasis library resmi `cloudsim-3.0.3.jar`:
1. Salin folder `cloudsim/src/id/` dan `cloudsim/cloudsim3_adapter/SflaWcaDatacenterBroker.java` ke folder sumber (`src/`) proyek IDE Anda.
2. Pada kelas contoh CloudSim (`CloudSimExample1` atau sejenisnya), ganti pembuatan broker bawaan:
   ```java
   // Ganti: DatacenterBroker broker = createBroker();
   // Menjadi:
   DatacenterBroker broker = new SflaWcaDatacenterBroker(
       "Broker_SFLA_ITS",
       SflaWcaDatacenterBroker.Algorithm.SFLA, // atau Algorithm.WCA
       42L
   );
   ```
3. Broker secara otomatis memetakan seluruh `Cloudlet` ke `Vm` optimal sebelum memanggil `super.submitCloudlets()`, dan log eksekusi resmi CloudSim akan langsung menampilkan hasil pemetaan SFLA/WCA.

