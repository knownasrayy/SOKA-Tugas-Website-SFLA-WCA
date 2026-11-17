package id.ac.its.soka.cloudsim.scheduler;

import id.ac.its.soka.cloudsim.model.CloudletSpec;
import id.ac.its.soka.cloudsim.model.ScheduleResult;
import id.ac.its.soka.cloudsim.model.VmSpec;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

/**
 * Implementasi Shuffled Frog-Leaping Algorithm (SFLA) untuk penjadwalan Cloudlet ke VM pada CloudSim.
 * Referensi utama:
 * Eusuff, M. M., &amp; Lansey, K. E. (2003). Optimization of water distribution network design using
 * the shuffled frog leaping algorithm. Journal of Water Resources Planning and Management, 129(3), 210-225.
 */
public class SflaScheduler {

    private static class Frog {
        double[] position;
        ScheduleResult result;

        Frog(double[] position, ScheduleResult result) {
            this.position = position;
            this.result = result;
        }
    }

    private final int memeplexCount;
    private final int frogsPerMemeplex;
    private final int localIterations;
    private final int maxIterations;
    private final double cFactor;
    private final double dMax;
    private final long seed;

    public SflaScheduler() {
        this(4, 7, 5, 40, 1.6, 2.5, 42L);
    }

    public SflaScheduler(
            int memeplexCount,
            int frogsPerMemeplex,
            int localIterations,
            int maxIterations,
            double cFactor,
            double dMax,
            long seed) {
        this.memeplexCount = memeplexCount;
        this.frogsPerMemeplex = frogsPerMemeplex;
        this.localIterations = localIterations;
        this.maxIterations = maxIterations;
        this.cFactor = cFactor;
        this.dMax = dMax;
        this.seed = seed;
    }

    public int getPopulationSize() {
        return memeplexCount * frogsPerMemeplex;
    }

    /**
     * Menjalankan optimasi SFLA menggunakan populasi awal independen.
     */
    public ScheduleResult optimize(List<CloudletSpec> cloudlets, List<VmSpec> vms) {
        return optimize(cloudlets, vms, null);
    }

    /**
     * Menjalankan optimasi SFLA, opsional dengan populasi awal bersama agar perbandingan dengan WCA adil.
     */
    public ScheduleResult optimize(List<CloudletSpec> cloudlets, List<VmSpec> vms, double[][] sharedInitialPop) {
        long startNs = System.nanoTime();

        int dim = cloudlets.size();
        int vmCount = vms.size();
        int totalFrogs = getPopulationSize();
        Random rng = new Random(seed + 101L);

        // 1. INIT: Bangkitkan populasi katak pada ruang kontinu [0, vmCount)^dim
        List<Frog> population = new ArrayList<>(totalFrogs);
        for (int i = 0; i < totalFrogs; i++) {
            double[] pos;
            if (sharedInitialPop != null && i < sharedInitialPop.length) {
                pos = Arrays.copyOf(sharedInitialPop[i], dim);
            } else {
                pos = randomVector(rng, dim, vmCount);
            }
            ScheduleResult eval = ScheduleEvaluator.evaluate("SFLA (Shuffled Frog-Leaping)", pos, cloudlets, vms);
            population.add(new Frog(pos, eval));
        }

        // 2. SORT: Urutkan dari fitness terbaik ke terburuk dan catat Xg
        Comparator<Frog> byFitness = Comparator.comparingDouble(f -> f.result.getFitness());
        population.sort(byFitness);

        Frog globalBest = new Frog(
                Arrays.copyOf(population.get(0).position, dim),
                population.get(0).result);

        double[] convergenceHistory = new double[maxIterations + 1];
        convergenceHistory[0] = globalBest.result.getMakespan();

        // Siklus utama evolusi memetik (Partition -> Local Search -> Shuffle)
        for (int iter = 1; iter <= maxIterations; iter++) {
            // 3. PARTITION: Pembagian bergilir (Round-Robin) ke m memeplex
            List<List<Frog>> memeplexes = new ArrayList<>(memeplexCount);
            for (int k = 0; k < memeplexCount; k++) {
                memeplexes.add(new ArrayList<>(frogsPerMemeplex));
            }
            for (int idx = 0; idx < population.size(); idx++) {
                memeplexes.get(idx % memeplexCount).add(population.get(idx));
            }

            // 4. LOCAL_JUMP: Pencarian lokal bertingkat di dalam setiap memeplex
            for (int k = 0; k < memeplexCount; k++) {
                List<Frog> group = memeplexes.get(k);
                if (group.size() < 2) {
                    continue;
                }

                for (int q = 0; q < localIterations; q++) {
                    group.sort(byFitness);
                    Frog xb = group.get(0);
                    Frog xw = group.get(group.size() - 1);

                    // Aturan 1: Lompat menuju katak terbaik lokal (Xb)
                    double[] candXb = new double[dim];
                    for (int d = 0; d < dim; d++) {
                        double step = clampStep(rng.nextDouble() * cFactor * (xb.position[d] - xw.position[d]));
                        candXb[d] = ScheduleEvaluator.clampCoordinate(xw.position[d] + step, vmCount);
                    }
                    ScheduleResult evalXb = ScheduleEvaluator.evaluate(
                            "SFLA (Shuffled Frog-Leaping)", candXb, cloudlets, vms);

                    if (evalXb.getFitness() < xw.result.getFitness()) {
                        xw.position = candXb;
                        xw.result = evalXb;
                    } else {
                        // Aturan 2: Jika tidak membaik, lompat menuju katak terbaik global (Xg)
                        double[] candXg = new double[dim];
                        for (int d = 0; d < dim; d++) {
                            double step = clampStep(
                                    rng.nextDouble() * cFactor * (globalBest.position[d] - xw.position[d]));
                            candXg[d] = ScheduleEvaluator.clampCoordinate(xw.position[d] + step, vmCount);
                        }
                        ScheduleResult evalXg = ScheduleEvaluator.evaluate(
                                "SFLA (Shuffled Frog-Leaping)", candXg, cloudlets, vms);

                        if (evalXg.getFitness() < xw.result.getFitness()) {
                            xw.position = candXg;
                            xw.result = evalXg;
                        } else {
                            // Aturan 3: Censorship / reset posisi acak baru untuk hindari stagnasi lokal
                            double[] randVec = randomVector(rng, dim, vmCount);
                            xw.position = randVec;
                            xw.result = ScheduleEvaluator.evaluate(
                                    "SFLA (Shuffled Frog-Leaping)", randVec, cloudlets, vms);
                        }
                    }

                    if (xw.result.getFitness() < globalBest.result.getFitness()) {
                        globalBest = new Frog(Arrays.copyOf(xw.position, dim), xw.result);
                    }
                }
            }

            // 5. SHUFFLE: Gabungkan semua memeplex kembali menjadi satu populasi dan urutkan ulang
            population.clear();
            for (List<Frog> group : memeplexes) {
                population.addAll(group);
            }
            population.sort(byFitness);

            if (population.get(0).result.getFitness() < globalBest.result.getFitness()) {
                globalBest = new Frog(
                        Arrays.copyOf(population.get(0).position, dim),
                        population.get(0).result);
            }

            convergenceHistory[iter] = globalBest.result.getMakespan();
        }

        long elapsedMicros = Math.max(1L, (System.nanoTime() - startNs) / 1000L);
        ScheduleResult finalResult = globalBest.result;
        finalResult.setConvergenceHistory(convergenceHistory);
        finalResult.setExecutionTimeMicros(elapsedMicros);
        return finalResult;
    }

    private double clampStep(double step) {
        if (step > dMax) {
            return dMax;
        }
        if (step < -dMax) {
            return -dMax;
        }
        return step;
    }

    private static double[] randomVector(Random rng, int dim, int vmCount) {
        double[] vec = new double[dim];
        double upper = vmCount - 1e-6;
        for (int d = 0; d < dim; d++) {
            vec[d] = rng.nextDouble() * upper;
        }
        return vec;
    }
}

