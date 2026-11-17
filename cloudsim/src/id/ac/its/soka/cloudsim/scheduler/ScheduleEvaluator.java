package id.ac.its.soka.cloudsim.scheduler;

import id.ac.its.soka.cloudsim.model.CloudletSpec;
import id.ac.its.soka.cloudsim.model.ScheduleResult;
import id.ac.its.soka.cloudsim.model.ScheduleResult.CloudletExecution;
import id.ac.its.soka.cloudsim.model.VmSpec;

import java.util.ArrayList;
import java.util.List;

/**
 * Evaluator jadwal CloudSim menggunakan model antrean Space-Shared per-VM.
 * Memetakan vektor posisi kontinu X in [0, M)^n menjadi indeks VM diskrit floor(X[i]).
 */
public final class ScheduleEvaluator {

    private static final int DEFAULT_DATACENTER_ID = 2;

    private ScheduleEvaluator() {
    }

    /**
     * Memastikan koordinat kontinu berada dalam batas valid [0, vmCount - 1e-6].
     */
    public static double clampCoordinate(double val, int vmCount) {
        double upper = vmCount - 1e-6;
        if (val < 0.0) {
            return 0.0;
        }
        if (val > upper) {
            return upper;
        }
        return val;
    }

    /**
     * Memetakan vektor kontinu menjadi penugasan indeks VM diskrit [0 .. vmCount - 1].
     */
    public static int[] decodeContinuousPosition(double[] position, int vmCount) {
        int[] assignment = new int[position.length];
        int maxIdx = vmCount - 1;
        for (int i = 0; i < position.length; i++) {
            int idx = (int) Math.floor(position[i]);
            if (idx < 0) {
                idx = 0;
            } else if (idx > maxIdx) {
                idx = maxIdx;
            }
            assignment[i] = idx;
        }
        return assignment;
    }

    /**
     * Mengevaluasi kandidat solusi berupa vektor posisi kontinu.
     */
    public static ScheduleResult evaluate(
            String algorithmName,
            double[] position,
            List<CloudletSpec> cloudlets,
            List<VmSpec> vms) {
        int[] assignment = decodeContinuousPosition(position, vms.size());
        return evaluateDiscrete(algorithmName, assignment, cloudlets, vms);
    }

    /**
     * Mengevaluasi jadwal diskrit (pemetaan Cloudlet -> VM) dan menghitung metrik CloudSim.
     */
    public static ScheduleResult evaluateDiscrete(
            String algorithmName,
            int[] assignment,
            List<CloudletSpec> cloudlets,
            List<VmSpec> vms) {
        int vmCount = vms.size();
        int cloudletCount = cloudlets.size();

        double[] vmLoads = new double[vmCount];
        int[] vmTaskCounts = new int[vmCount];
        List<CloudletExecution> executions = new ArrayList<>(cloudletCount);
        double totalFinishTime = 0.0;

        for (int i = 0; i < cloudletCount; i++) {
            int vmIdx = assignment[i];
            CloudletSpec cloudlet = cloudlets.get(i);
            VmSpec vm = vms.get(vmIdx);

            double startTime = vmLoads[vmIdx];
            double execTime = cloudlet.getLengthMi() / vm.getTotalMips();
            double finishTime = startTime + execTime;

            vmLoads[vmIdx] = finishTime;
            vmTaskCounts[vmIdx]++;
            totalFinishTime += finishTime;

            executions.add(new CloudletExecution(
                    cloudlet.getId(),
                    cloudlet.getName(),
                    cloudlet.getLengthMi(),
                    DEFAULT_DATACENTER_ID,
                    vm.getId(),
                    vm.getName(),
                    execTime,
                    startTime,
                    finishTime));
        }

        double makespan = 0.0;
        double minVmLoad = Double.POSITIVE_INFINITY;
        double sumLoad = 0.0;

        for (double load : vmLoads) {
            if (load > makespan) {
                makespan = load;
            }
            if (load < minVmLoad) {
                minVmLoad = load;
            }
            sumLoad += load;
        }

        if (vmCount == 0) {
            minVmLoad = 0.0;
        }

        double avgVmLoad = vmCount > 0 ? sumLoad / vmCount : 0.0;
        double variance = 0.0;
        for (double load : vmLoads) {
            double diff = load - avgVmLoad;
            variance += diff * diff;
        }
        double stdVmLoad = vmCount > 0 ? Math.sqrt(variance / vmCount) : 0.0;
        double degreeOfImbalance = avgVmLoad > 0.0 ? (makespan - minVmLoad) / avgVmLoad : 0.0;
        double avgTurnaroundTime = cloudletCount > 0 ? totalFinishTime / cloudletCount : 0.0;
        double avgUtilization = makespan > 0.0 ? (avgVmLoad / makespan) * 100.0 : 0.0;

        // Fitness utama = Makespan + penalti keseimbangan mikro (1e-3) untuk memandu gradien plato
        double fitness = makespan + 0.001 * stdVmLoad;

        return new ScheduleResult(
                algorithmName,
                assignment,
                vmLoads,
                vmTaskCounts,
                executions,
                makespan,
                minVmLoad,
                avgVmLoad,
                stdVmLoad,
                degreeOfImbalance,
                avgTurnaroundTime,
                avgUtilization,
                fitness);
    }

    /**
     * Menghitung jadwal baseline statis Round-Robin (Cloudlet i -> VM (i mod M)).
     */
    public static ScheduleResult evaluateRoundRobin(List<CloudletSpec> cloudlets, List<VmSpec> vms) {
        int[] assignment = new int[cloudlets.size()];
        int vmCount = vms.size();
        for (int i = 0; i < cloudlets.size(); i++) {
            assignment[i] = i % vmCount;
        }
        ScheduleResult result = evaluateDiscrete("Round-Robin (Baseline)", assignment, cloudlets, vms);
        result.setExecutionTimeMicros(1L);
        return result;
    }
}

