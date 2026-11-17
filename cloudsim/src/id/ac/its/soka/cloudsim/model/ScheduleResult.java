package id.ac.its.soka.cloudsim.model;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Hasil evaluasi jadwal eksekusi Cloudlet pada sekumpulan VM heterogen.
 * Menyimpan metrik kinerja CloudSim: Makespan, Degree of Imbalance (DI),
 * Average Turnaround Time, Resource Utilization, serta histori konvergensi.
 */
public class ScheduleResult {

    /**
     * Rekaman eksekusi per-Cloudlet mengikuti format tabel log CloudSim.
     */
    public static class CloudletExecution {
        private final int cloudletId;
        private final String cloudletName;
        private final long lengthMi;
        private final int datacenterId;
        private final int vmId;
        private final String vmName;
        private final double execTimeSec;
        private final double startTimeSec;
        private final double finishTimeSec;

        public CloudletExecution(
                int cloudletId,
                String cloudletName,
                long lengthMi,
                int datacenterId,
                int vmId,
                String vmName,
                double execTimeSec,
                double startTimeSec,
                double finishTimeSec) {
            this.cloudletId = cloudletId;
            this.cloudletName = cloudletName;
            this.lengthMi = lengthMi;
            this.datacenterId = datacenterId;
            this.vmId = vmId;
            this.vmName = vmName;
            this.execTimeSec = execTimeSec;
            this.startTimeSec = startTimeSec;
            this.finishTimeSec = finishTimeSec;
        }

        public int getCloudletId() {
            return cloudletId;
        }

        public String getCloudletName() {
            return cloudletName;
        }

        public long getLengthMi() {
            return lengthMi;
        }

        public int getDatacenterId() {
            return datacenterId;
        }

        public int getVmId() {
            return vmId;
        }

        public String getVmName() {
            return vmName;
        }

        public double getExecTimeSec() {
            return execTimeSec;
        }

        public double getStartTimeSec() {
            return startTimeSec;
        }

        public double getFinishTimeSec() {
            return finishTimeSec;
        }
    }

    private final String algorithmName;
    private final int[] vmAssignment;
    private final double[] vmLoads;
    private final int[] vmTaskCounts;
    private final List<CloudletExecution> executions;
    private final double makespan;
    private final double minVmLoad;
    private final double avgVmLoad;
    private final double stdVmLoad;
    private final double degreeOfImbalance;
    private final double avgTurnaroundTime;
    private final double avgUtilization;
    private final double fitness;
    private double[] convergenceHistory;
    private long executionTimeMicros;

    public ScheduleResult(
            String algorithmName,
            int[] vmAssignment,
            double[] vmLoads,
            int[] vmTaskCounts,
            List<CloudletExecution> executions,
            double makespan,
            double minVmLoad,
            double avgVmLoad,
            double stdVmLoad,
            double degreeOfImbalance,
            double avgTurnaroundTime,
            double avgUtilization,
            double fitness) {
        this.algorithmName = algorithmName;
        this.vmAssignment = Arrays.copyOf(vmAssignment, vmAssignment.length);
        this.vmLoads = Arrays.copyOf(vmLoads, vmLoads.length);
        this.vmTaskCounts = Arrays.copyOf(vmTaskCounts, vmTaskCounts.length);
        this.executions = Collections.unmodifiableList(executions);
        this.makespan = makespan;
        this.minVmLoad = minVmLoad;
        this.avgVmLoad = avgVmLoad;
        this.stdVmLoad = stdVmLoad;
        this.degreeOfImbalance = degreeOfImbalance;
        this.avgTurnaroundTime = avgTurnaroundTime;
        this.avgUtilization = avgUtilization;
        this.fitness = fitness;
        this.convergenceHistory = new double[] { makespan };
    }

    public String getAlgorithmName() {
        return algorithmName;
    }

    public int[] getVmAssignment() {
        return Arrays.copyOf(vmAssignment, vmAssignment.length);
    }

    public double[] getVmLoads() {
        return Arrays.copyOf(vmLoads, vmLoads.length);
    }

    public int[] getVmTaskCounts() {
        return Arrays.copyOf(vmTaskCounts, vmTaskCounts.length);
    }

    public List<CloudletExecution> getExecutions() {
        return executions;
    }

    public double getMakespan() {
        return makespan;
    }

    public double getMinVmLoad() {
        return minVmLoad;
    }

    public double getAvgVmLoad() {
        return avgVmLoad;
    }

    public double getStdVmLoad() {
        return stdVmLoad;
    }

    public double getDegreeOfImbalance() {
        return degreeOfImbalance;
    }

    public double getAvgTurnaroundTime() {
        return avgTurnaroundTime;
    }

    public double getAvgUtilization() {
        return avgUtilization;
    }

    public double getFitness() {
        return fitness;
    }

    public double[] getConvergenceHistory() {
        return convergenceHistory == null ? new double[0] : Arrays.copyOf(convergenceHistory, convergenceHistory.length);
    }

    public void setConvergenceHistory(double[] convergenceHistory) {
        this.convergenceHistory = Arrays.copyOf(convergenceHistory, convergenceHistory.length);
    }

    public long getExecutionTimeMicros() {
        return executionTimeMicros;
    }

    public void setExecutionTimeMicros(long executionTimeMicros) {
        this.executionTimeMicros = executionTimeMicros;
    }
}

