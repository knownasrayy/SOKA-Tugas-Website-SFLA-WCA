package id.ac.its.soka.cloudsim.model;

/**
 * Spesifikasi Virtual Machine (VM) untuk simulasi CloudSim SFLA &amp; WCA.
 * Merepresentasikan kapasitas pemrosesan heterogen dalam satuan MIPS dan atribut standar CloudSim.
 */
public class VmSpec {
    private final int id;
    private final String name;
    private final double mips;
    private final int pesNumber;
    private final int ramMb;
    private final long bw;
    private final long sizeMb;
    private final String vmm;

    /**
     * Membuat spesifikasi VM standar (1 PE, RAM 2048 MB, BW 1000, Storage 10000 MB, VMM Xen).
     */
    public VmSpec(int id, String name, double mips) {
        this(id, name, mips, 1, 2048, 1000L, 10000L, "Xen");
    }

    /**
     * Membuat spesifikasi VM lengkap sesuai parameter entitas {@code org.cloudbus.cloudsim.Vm}.
     */
    public VmSpec(int id, String name, double mips, int pesNumber, int ramMb, long bw, long sizeMb, String vmm) {
        this.id = id;
        this.name = name;
        this.mips = mips;
        this.pesNumber = pesNumber;
        this.ramMb = ramMb;
        this.bw = bw;
        this.sizeMb = sizeMb;
        this.vmm = vmm;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public double getMips() {
        return mips;
    }

    public int getPesNumber() {
        return pesNumber;
    }

    public int getRamMb() {
        return ramMb;
    }

    public long getBw() {
        return bw;
    }

    public long getSizeMb() {
        return sizeMb;
    }

    public String getVmm() {
        return vmm;
    }

    /**
     * Total kapasitas komputasi efektif VM (MIPS * jumlah core/PE).
     */
    public double getTotalMips() {
        return mips * pesNumber;
    }

    @Override
    public String toString() {
        return String.format("%s [id=%d, mips=%.1f, pes=%d, ram=%dMB]", name, id, mips, pesNumber, ramMb);
    }
}

