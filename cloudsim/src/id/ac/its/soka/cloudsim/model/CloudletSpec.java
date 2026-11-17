package id.ac.its.soka.cloudsim.model;

/**
 * Spesifikasi tugas komputasi (Cloudlet) pada simulasi CloudSim.
 * Beban kerja dinyatakan dalam Million Instructions (MI).
 */
public class CloudletSpec {
    private final int id;
    private final String name;
    private final long lengthMi;
    private final int pesNumber;
    private final long fileSize;
    private final long outputSize;

    /**
     * Membuat Cloudlet standar dengan 1 PE dan fileSize/outputSize 300 byte.
     */
    public CloudletSpec(int id, String name, long lengthMi) {
        this(id, name, lengthMi, 1, 300L, 300L);
    }

    /**
     * Membuat Cloudlet lengkap sesuai parameter entitas {@code org.cloudbus.cloudsim.Cloudlet}.
     */
    public CloudletSpec(int id, String name, long lengthMi, int pesNumber, long fileSize, long outputSize) {
        this.id = id;
        this.name = name;
        this.lengthMi = lengthMi;
        this.pesNumber = pesNumber;
        this.fileSize = fileSize;
        this.outputSize = outputSize;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public long getLengthMi() {
        return lengthMi;
    }

    public int getPesNumber() {
        return pesNumber;
    }

    public long getFileSize() {
        return fileSize;
    }

    public long getOutputSize() {
        return outputSize;
    }

    @Override
    public String toString() {
        return String.format("%s [id=%d, length=%d MI, pes=%d]", name, id, lengthMi, pesNumber);
    }
}

