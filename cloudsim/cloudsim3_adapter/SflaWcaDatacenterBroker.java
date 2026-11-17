package id.ac.its.soka.cloudsim.adapter;

import id.ac.its.soka.cloudsim.model.CloudletSpec;
import id.ac.its.soka.cloudsim.model.ScheduleResult;
import id.ac.its.soka.cloudsim.model.VmSpec;
import id.ac.its.soka.cloudsim.scheduler.SflaScheduler;
import id.ac.its.soka.cloudsim.scheduler.WcaScheduler;
import org.cloudbus.cloudsim.Cloudlet;
import org.cloudbus.cloudsim.DatacenterBroker;
import org.cloudbus.cloudsim.Log;
import org.cloudbus.cloudsim.Vm;

import java.util.ArrayList;
import java.util.List;

/**
 * Adapter Drop-In untuk proyek CloudSim 3.0.3 (memerlukan cloudsim-3.0.3.jar di classpath IDE).
 * Menggantikan penjadwalan bawaan DatacenterBroker menggunakan algoritma SFLA atau WCA
 * sebelum Cloudlet dikirim ke Datacenter untuk dieksekusi.
 *
 * Cara pakai di Main Example CloudSim 3.0.3:
 * <pre>
 *   DatacenterBroker broker = new SflaWcaDatacenterBroker(
 *       "Broker_Metaheuristik",
 *       SflaWcaDatacenterBroker.Algorithm.SFLA,
 *       42L);
 * </pre>
 */
public class SflaWcaDatacenterBroker extends DatacenterBroker {

    public enum Algorithm {
        SFLA,
        WCA
    }

    private final Algorithm algorithm;
    private final long seed;
    private ScheduleResult lastScheduleResult;

    public SflaWcaDatacenterBroker(String name, Algorithm algorithm, long seed) throws Exception {
        super(name);
        this.algorithm = algorithm;
        this.seed = seed;
    }

    public ScheduleResult getLastScheduleResult() {
        return lastScheduleResult;
    }

    @Override
    protected void submitCloudlets() {
        List<Cloudlet> cloudlets = getCloudletList();
        List<Vm> vms = getVmsCreatedList();

        if (!cloudlets.isEmpty() && !vms.isEmpty()) {
            List<CloudletSpec> cloudletSpecs = new ArrayList<>(cloudlets.size());
            for (int i = 0; i < cloudlets.size(); i++) {
                Cloudlet cl = cloudlets.get(i);
                cloudletSpecs.add(new CloudletSpec(
                        cl.getCloudletId(),
                        "Cloudlet-" + cl.getCloudletId(),
                        cl.getCloudletLength(),
                        cl.getNumberOfPes(),
                        cl.getCloudletFileSize(),
                        cl.getCloudletOutputSize()));
            }

            List<VmSpec> vmSpecs = new ArrayList<>(vms.size());
            for (Vm vm : vms) {
                vmSpecs.add(new VmSpec(
                        vm.getId(),
                        "VM-" + vm.getId(),
                        vm.getMips(),
                        vm.getNumberOfPes(),
                        vm.getRam(),
                        vm.getBw(),
                        vm.getSize(),
                        vm.getVmm()));
            }

            if (algorithm == Algorithm.SFLA) {
                SflaScheduler sfla = new SflaScheduler(4, 7, 5, 40, 1.6, 2.5, seed);
                lastScheduleResult = sfla.optimize(cloudletSpecs, vmSpecs);
            } else {
                WcaScheduler wca = new WcaScheduler(28, 4, 40, 2.0, 1.2, seed);
                lastScheduleResult = wca.optimize(cloudletSpecs, vmSpecs);
            }

            int[] assignment = lastScheduleResult.getVmAssignment();
            for (int i = 0; i < cloudlets.size(); i++) {
                Cloudlet cl = cloudlets.get(i);
                Vm targetVm = vms.get(assignment[i]);
                bindCloudletToVm(cl.getCloudletId(), targetVm.getId());
            }

            Log.printLine(String.format(
                    "[%s] Optimasi %s selesai -> Estimasi Makespan = %.3f dtk | DI = %.3f",
                    getName(),
                    algorithm.name(),
                    lastScheduleResult.getMakespan(),
                    lastScheduleResult.getDegreeOfImbalance()));
        }

        // Delegasikan pengiriman aktual Cloudlet yang sudah terikat VM ke DatacenterBroker CloudSim
        super.submitCloudlets();
    }
}

