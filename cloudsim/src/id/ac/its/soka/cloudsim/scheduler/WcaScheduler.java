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
 * Implementasi Water Cycle Algorithm (WCA) untuk penjadwalan Cloudlet ke VM pada CloudSim.
 * Referensi utama:
 * Eskandar, H., Sadollah, A., Bahreininejad, A., &amp; Hamdi, M. (2012). Water cycle algorithm - A novel
 * metaheuristic optimization method for solving constrained engineering optimization problems.
 * Computers &amp; Structures, 110-111, 151-166.
 */
public class WcaScheduler {

    private static class Raindrop {
        double[] position;
        ScheduleResult result;

        Raindrop(double[] position, ScheduleResult result) {
            this.position = position;
            this.result = result;
        }
    }

    private final int populationSize;
    private final int nsr; // Total solusi elit: 1 Laut + (nsr - 1) Sungai
    private final int maxIterations;
    private final double cFactor;
    private final double dMax0;
    private final long seed;

    public WcaScheduler() {
        this(28, 4, 40, 2.0, 1.2, 42L);
    }

    public WcaScheduler(
            int populationSize,
            int nsr,
            int maxIterations,
            double cFactor,
            double dMax0,
            long seed) {
        this.populationSize = populationSize;
        this.nsr = Math.max(2, Math.min(nsr, populationSize - 1));
        this.maxIterations = maxIterations;
        this.cFactor = cFactor;
        this.dMax0 = dMax0;
        this.seed = seed;
    }

    /**
     * Menjalankan optimasi WCA menggunakan populasi awal independen.
     */
    public ScheduleResult optimize(List<CloudletSpec> cloudlets, List<VmSpec> vms) {
        return optimize(cloudlets, vms, null);
    }

    /**
     * Menjalankan optimasi WCA, opsional dengan populasi awal bersama agar perbandingan dengan SFLA adil.
     */
    public ScheduleResult optimize(List<CloudletSpec> cloudlets, List<VmSpec> vms, double[][] sharedInitialPop) {
        long startNs = System.nanoTime();

        int dim = cloudlets.size();
        int vmCount = vms.size();
        Random rng = new Random(seed + 202L);

        // 1. INIT: Bangkitkan populasi tetesan air hujan [0, vmCount)^dim
        List<Raindrop> population = new ArrayList<>(populationSize);
        for (int i = 0; i < populationSize; i++) {
            double[] pos;
            if (sharedInitialPop != null && i < sharedInitialPop.length) {
                pos = Arrays.copyOf(sharedInitialPop[i], dim);
            } else {
                pos = randomVector(rng, dim, vmCount);
            }
            ScheduleResult eval = ScheduleEvaluator.evaluate("WCA (Water Cycle Algorithm)", pos, cloudlets, vms);
            population.add(new Raindrop(pos, eval));
        }

        Comparator<Raindrop> byFitness = Comparator.comparingDouble(r -> r.result.getFitness());
        population.sort(byFitness);

        Raindrop globalBest = new Raindrop(
                Arrays.copyOf(population.get(0).position, dim),
                population.get(0).result);

        double[] convergenceHistory = new double[maxIterations + 1];
        convergenceHistory[0] = globalBest.result.getMakespan();

        double dMax = dMax0;

        for (int iter = 1; iter <= maxIterations; iter++) {
            population.sort(byFitness);

            // 2. HIERARCHY: leaders[0] = Laut, leaders[1..nsr-1] = Sungai, sisanya = Aliran
            List<Raindrop> leaders = new ArrayList<>(population.subList(0, nsr));
            List<Raindrop> streams = new ArrayList<>(population.subList(nsr, population.size()));

            // Alokasi jumlah aliran proporsional intensitas fitness (Persamaan 6 & 7 Eskandar dkk., 2012)
            double worstRef = streams.isEmpty()
                    ? leaders.get(nsr - 1).result.getFitness() + 1.0
                    : streams.get(streams.size() - 1).result.getFitness() + 1e-6;

            double[] weights = new double[nsr];
            double totalWeight = 0.0;
            for (int l = 0; l < nsr; l++) {
                weights[l] = Math.abs(leaders.get(l).result.getFitness() - worstRef) + 1e-6;
                totalWeight += weights[l];
            }

            int[] quotas = new int[nsr];
            int assignedStreams = 0;
            for (int l = 0; l < nsr; l++) {
                quotas[l] = (int) Math.round((weights[l] / totalWeight) * streams.size());
                assignedStreams += quotas[l];
            }
            while (assignedStreams < streams.size()) {
                quotas[0]++;
                assignedStreams++;
            }
            while (assignedStreams > streams.size()) {
                for (int l = nsr - 1; l >= 0 && assignedStreams > streams.size(); l--) {
                    if (quotas[l] > 0) {
                        quotas[l]--;
                        assignedStreams--;
                    }
                }
            }

            // 3. FLOW & ROLE_SWAP: Aliran mengalir menuju Sungai atau Laut induknya (Persamaan 8 & 9)
            Raindrop sea = leaders.get(0);
            int streamIdx = 0;
            for (int l = 0; l < nsr; l++) {
                Raindrop parent = leaders.get(l);
                for (int q = 0; q < quotas[l] && streamIdx < streams.size(); q++) {
                    Raindrop st = streams.get(streamIdx++);
                    double[] nextPos = new double[dim];
                    for (int d = 0; d < dim; d++) {
                        nextPos[d] = ScheduleEvaluator.clampCoordinate(
                                st.position[d] + rng.nextDouble() * cFactor * (parent.position[d] - st.position[d]),
                                vmCount);
                    }
                    st.position = nextPos;
                    st.result = ScheduleEvaluator.evaluate("WCA (Water Cycle Algorithm)", nextPos, cloudlets, vms);

                    if (st.result.getFitness() < parent.result.getFitness()) {
                        swapContents(parent, st);
                        if (parent != sea && parent.result.getFitness() < sea.result.getFitness()) {
                            swapContents(sea, parent);
                        }
                    }
                }
            }

            // 4. FLOW & ROLE_SWAP: Sungai mengalir menuju Laut (Persamaan 10)
            for (int r = 1; r < nsr; r++) {
                Raindrop river = leaders.get(r);
                double[] nextPos = new double[dim];
                for (int d = 0; d < dim; d++) {
                    nextPos[d] = ScheduleEvaluator.clampCoordinate(
                            river.position[d] + rng.nextDouble() * cFactor * (sea.position[d] - river.position[d]),
                            vmCount);
                }
                river.position = nextPos;
                river.result = ScheduleEvaluator.evaluate("WCA (Water Cycle Algorithm)", nextPos, cloudlets, vms);

                if (river.result.getFitness() < sea.result.getFitness()) {
                    swapContents(sea, river);
                }

                // 5. EVAPORATION & RAIN: Cek jarak Euclidean ternormalisasi Sungai terhadap Laut (Persamaan 11-14)
                double sqDist = 0.0;
                for (int d = 0; d < dim; d++) {
                    double diff = river.position[d] - sea.position[d];
                    sqDist += diff * diff;
                }
                double normDist = Math.sqrt(sqDist / dim);

                if (normDist < dMax || rng.nextDouble() < 0.08) {
                    double[] rainPos = new double[dim];
                    if (rng.nextBoolean()) {
                        // Eksplorasi global di seluruh ruang VM (Persamaan 12)
                        rainPos = randomVector(rng, dim, vmCount);
                    } else {
                        // Presipitasi hujan Gaussian di sekitar Laut (Persamaan 13, mu = 0.1)
                        double sqrtMu = Math.sqrt(0.1);
                        for (int d = 0; d < dim; d++) {
                            rainPos[d] = ScheduleEvaluator.clampCoordinate(
                                    sea.position[d] + sqrtMu * rng.nextGaussian(),
                                    vmCount);
                        }
                    }
                    river.position = rainPos;
                    river.result = ScheduleEvaluator.evaluate("WCA (Water Cycle Algorithm)", rainPos, cloudlets, vms);

                    if (river.result.getFitness() < sea.result.getFitness()) {
                        swapContents(sea, river);
                    }
                }
            }

            if (sea.result.getFitness() < globalBest.result.getFitness()) {
                globalBest = new Raindrop(Arrays.copyOf(sea.position, dim), sea.result);
            }

            // Penyusutan adaptif ambang penguapan dmax (Persamaan 14)
            dMax = Math.max(0.05, dMax - (dMax0 / maxIterations));

            population.clear();
            population.addAll(leaders);
            population.addAll(streams);
            convergenceHistory[iter] = globalBest.result.getMakespan();
        }

        long elapsedMicros = Math.max(1L, (System.nanoTime() - startNs) / 1000L);
        ScheduleResult finalResult = globalBest.result;
        finalResult.setConvergenceHistory(convergenceHistory);
        finalResult.setExecutionTimeMicros(elapsedMicros);
        return finalResult;
    }

    private static void swapContents(Raindrop a, Raindrop b) {
        double[] tmpPos = a.position;
        ScheduleResult tmpRes = a.result;
        a.position = b.position;
        a.result = b.result;
        b.position = tmpPos;
        b.result = tmpRes;
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

