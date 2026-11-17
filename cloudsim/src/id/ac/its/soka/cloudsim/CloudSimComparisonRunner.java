package id.ac.its.soka.cloudsim;

import id.ac.its.soka.cloudsim.model.CloudletSpec;
import id.ac.its.soka.cloudsim.model.ScheduleResult;
import id.ac.its.soka.cloudsim.model.ScheduleResult.CloudletExecution;
import id.ac.its.soka.cloudsim.model.VmSpec;
import id.ac.its.soka.cloudsim.scheduler.ScheduleEvaluator;
import id.ac.its.soka.cloudsim.scheduler.SflaScheduler;
import id.ac.its.soka.cloudsim.scheduler.WcaScheduler;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Random;

/**
 * Simulasi Perbandingan Penjadwalan CloudSim: Round-Robin vs SFLA vs WCA.
 * Menguji beban kerja heterogen Cloudlet (MI) pada Virtual Machine (MIPS)
 * dan mencetak laporan eksekusi autentik CloudSim ke konsol.
 */
public class CloudSimComparisonRunner {

    private static final String SEP = "================================================================================";
    private static final String SUB_SEP = "--------------------------------------------------------------------------------";

    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        long seed = args.length > 0 ? Long.parseLong(args[0]) : 42L;

        System.out.println(SEP);
        System.out.println("  CLOUDSIM METAHEURISTIC BROKER SIMULATION (SOKA ITS)");
        System.out.println("  Shuffled Frog-Leaping Algorithm (SFLA) vs Water Cycle Algorithm (WCA)");
        System.out.println(SEP);

        // Skenario 1: Infrastruktur heterogen SOKA ITS (16 Cloudlets -> 4 VMs)
        runScenario(
                "SKENARIO 1: SOKA ITS Heterogeneous Cluster (16 Cloudlets -> 4 VMs)",
                createDefaultVms(),
                generateCloudlets(16, 140, 620, 2026L),
                28,
                40,
                seed,
                true);

        // Skenario 2: Skala klaster lebih besar (40 Cloudlets -> 8 VMs)
        runScenario(
                "SKENARIO 2: Enterprise Cloud Datacenter (40 Cloudlets -> 8 VMs)",
                createEnterpriseVms(),
                generateCloudlets(40, 150, 950, 777L),
                32,
                50,
                seed,
                false);
    }

    private static void runScenario(
            String title,
            List<VmSpec> vms,
            List<CloudletSpec> cloudlets,
            int popSize,
            int maxIter,
            long seed,
            boolean printDetailedCloudletTable) {

        System.out.println();
        System.out.println(SEP);
        System.out.println("  " + title);
        System.out.println(SEP);
        System.out.println("Initialising CloudSim Datacenter_0 & SFLA/WCA DatacenterBroker...");
        System.out.printf("Created %d VMs and %d Cloudlets (Seed = %d, Pop = %d, MaxIter = %d)%n%n",
                vms.size(), cloudlets.size(), seed, popSize, maxIter);

        // Populasi awal identik agar komparasi SFLA & WCA murni adil
        double[][] sharedPop = generateSharedInitialPopulation(popSize, cloudlets.size(), vms.size(), seed);

        // 1. Baseline Round-Robin
        ScheduleResult rrResult = ScheduleEvaluator.evaluateRoundRobin(cloudlets, vms);

        // 2. SFLA (4 memeplexes x 7/8 katak sesuai popSize)
        int memeplexCount = 4;
        int frogsPerMemeplex = Math.max(2, popSize / memeplexCount);
        SflaScheduler sfla = new SflaScheduler(memeplexCount, frogsPerMemeplex, 5, maxIter, 1.6, 2.5, seed);
        ScheduleResult sflaResult = sfla.optimize(cloudlets, vms, sharedPop);

        // 3. WCA (1 Laut + 3 Sungai)
        WcaScheduler wca = new WcaScheduler(popSize, 4, maxIter, 2.0, 1.2, seed);
        ScheduleResult wcaResult = wca.optimize(cloudlets, vms, sharedPop);

        // Cetak ringkasan komparasi utama
        printComparisonSummary(rrResult, sflaResult, wcaResult);

        // Cetak kurva konvergensi per iterasi kunci
        printConvergenceTrajectory(sflaResult, wcaResult, maxIter);

        // Cetak distribusi beban per VM
        printVmLoadTable(vms, rrResult, sflaResult, wcaResult);

        // Cetak tabel output standar CloudSim Cloudlet log untuk Skenario 1
        if (printDetailedCloudletTable) {
            printCloudSimExecutionTable("SFLA (Optimal Schedule)", sflaResult);
            printCloudSimExecutionTable("WCA (Optimal Schedule)", wcaResult);
        }
    }

    public static List<VmSpec> createDefaultVms() {
        return Arrays.asList(
                new VmSpec(0, "VM-0 (Small)", 85.0),
                new VmSpec(1, "VM-1 (Medium)", 115.0),
                new VmSpec(2, "VM-2 (Large)", 145.0),
                new VmSpec(3, "VM-3 (X-Large)", 175.0));
    }

    public static List<VmSpec> createEnterpriseVms() {
        return Arrays.asList(
                new VmSpec(0, "VM-0 (Edge-S)", 90.0),
                new VmSpec(1, "VM-1 (Edge-S)", 110.0),
                new VmSpec(2, "VM-2 (Compute-M)", 140.0),
                new VmSpec(3, "VM-3 (Compute-M)", 160.0),
                new VmSpec(4, "VM-4 (Compute-L)", 200.0),
                new VmSpec(5, "VM-5 (Compute-L)", 220.0),
                new VmSpec(6, "VM-6 (HighCPU-XL)", 260.0),
                new VmSpec(7, "VM-7 (HighCPU-XL)", 300.0));
    }

    public static List<CloudletSpec> generateCloudlets(int count, int minMi, int maxMi, long seed) {
        Random rng = new Random(seed);
        List<CloudletSpec> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            long mi = minMi + rng.nextInt(maxMi - minMi + 1);
            list.add(new CloudletSpec(i, "Cloudlet-" + i, mi));
        }
        return list;
    }

    public static double[][] generateSharedInitialPopulation(int popSize, int dim, int vmCount, long seed) {
        Random rng = new Random(seed);
        double[][] pop = new double[popSize][dim];
        double upper = vmCount - 1e-6;
        for (int i = 0; i < popSize; i++) {
            for (int d = 0; d < dim; d++) {
                pop[i][d] = rng.nextDouble() * upper;
            }
        }
        return pop;
    }

    private static void printComparisonSummary(ScheduleResult rr, ScheduleResult sfla, ScheduleResult wca) {
        double sflaGain = ((rr.getMakespan() - sfla.getMakespan()) / rr.getMakespan()) * 100.0;
        double wcaGain = ((rr.getMakespan() - wca.getMakespan()) / rr.getMakespan()) * 100.0;

        System.out.println("[RINGKASAN PERBANDINGAN METRIK CLOUDSIM]");
        System.out.println(SUB_SEP);
        System.out.printf("%-26s | %10s | %9s | %7s | %10s | %9s%n",
                "Algoritma Penjadwal", "Makespan", "Reduksi", "DI", "Avg Turn.", "Util (%)");
        System.out.println(SUB_SEP);
        System.out.printf("%-26s | %8.3f s | %8s | %7.3f | %8.3f s | %7.2f %%%n",
                "Round-Robin (Baseline)", rr.getMakespan(), "0.00 %", rr.getDegreeOfImbalance(),
                rr.getAvgTurnaroundTime(), rr.getAvgUtilization());
        System.out.printf("%-26s | %8.3f s | %+7.2f %% | %7.3f | %8.3f s | %7.2f %%%n",
                "SFLA (Eusuff & Lansey)", sfla.getMakespan(), sflaGain, sfla.getDegreeOfImbalance(),
                sfla.getAvgTurnaroundTime(), sfla.getAvgUtilization());
        System.out.printf("%-26s | %8.3f s | %+7.2f %% | %7.3f | %8.3f s | %7.2f %%%n",
                "WCA (Eskandar dkk.)", wca.getMakespan(), wcaGain, wca.getDegreeOfImbalance(),
                wca.getAvgTurnaroundTime(), wca.getAvgUtilization());
        System.out.println(SUB_SEP);
        System.out.printf("Waktu komputasi optimizer  : SFLA = %.2f ms | WCA = %.2f ms%n%n",
                sfla.getExecutionTimeMicros() / 1000.0,
                wca.getExecutionTimeMicros() / 1000.0);
    }

    private static void printConvergenceTrajectory(ScheduleResult sfla, ScheduleResult wca, int maxIter) {
        double[] histSfla = sfla.getConvergenceHistory();
        double[] histWca = wca.getConvergenceHistory();
        int[] checkpoints = { 0, 1, 5, 10, 20, Math.min(30, maxIter), maxIter };

        System.out.println("[TRAJEKTORI KONVERGENSI MAKESPAN PER ITERASI]");
        System.out.print("Iterasi : ");
        for (int cp : checkpoints) {
            if (cp <= maxIter) {
                System.out.printf("%9d", cp);
            }
        }
        System.out.println();

        System.out.print("SFLA (s): ");
        for (int cp : checkpoints) {
            if (cp < histSfla.length) {
                System.out.printf("%9.3f", histSfla[cp]);
            }
        }
        System.out.println();

        System.out.print("WCA  (s): ");
        for (int cp : checkpoints) {
            if (cp < histWca.length) {
                System.out.printf("%9.3f", histWca[cp]);
            }
        }
        System.out.println("\n");
    }

    private static void printVmLoadTable(
            List<VmSpec> vms,
            ScheduleResult rr,
            ScheduleResult sfla,
            ScheduleResult wca) {

        double[] rrLoads = rr.getVmLoads();
        double[] sflaLoads = sfla.getVmLoads();
        double[] wcaLoads = wca.getVmLoads();
        int[] rrCounts = rr.getVmTaskCounts();
        int[] sflaCounts = sfla.getVmTaskCounts();
        int[] wcaCounts = wca.getVmTaskCounts();

        System.out.println("[DISTRIBUSI BEBAN WAKTU EKSEKUSI & JUMLAH CLOUDLET PER VM]");
        System.out.println(SUB_SEP);
        System.out.printf("%-18s | %7s | %-15s | %-15s | %-15s%n",
                "VM", "MIPS", "Round-Robin", "SFLA", "WCA");
        System.out.println(SUB_SEP);
        for (int j = 0; j < vms.size(); j++) {
            VmSpec vm = vms.get(j);
            System.out.printf("%-18s | %7.0f | %6.2fs (%2d tgs) | %6.2fs (%2d tgs) | %6.2fs (%2d tgs)%n",
                    vm.getName(), vm.getTotalMips(),
                    rrLoads[j], rrCounts[j],
                    sflaLoads[j], sflaCounts[j],
                    wcaLoads[j], wcaCounts[j]);
        }
        System.out.println(SUB_SEP + "\n");
    }

    private static void printCloudSimExecutionTable(String label, ScheduleResult result) {
        System.out.println("========== CLOUDSIM OUTPUT LOG: " + label + " ==========");
        System.out.printf("%-11s %-9s %-14s %-7s %-10s %-11s %-11s%n",
                "Cloudlet ID", "STATUS", "Data center ID", "VM ID", "Time", "Start Time", "Finish Time");
        for (CloudletExecution exec : result.getExecutions()) {
            System.out.printf("%-11d %-9s %-14d %-7d %-10.3f %-11.3f %-11.3f%n",
                    exec.getCloudletId(),
                    "SUCCESS",
                    exec.getDatacenterId(),
                    exec.getVmId(),
                    exec.getExecTimeSec(),
                    exec.getStartTimeSec(),
                    exec.getFinishTimeSec());
        }
        System.out.println();
    }
}

