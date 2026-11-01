/**
 * Tab 4: Komparasi Sinkron SFLA vs WCA & Studi Kasus Penjadwalan Tugas Cloud VM
 * Menampilkan arena pengujian head-to-head pada seed dan koordinat awal identik,
 * matriks perbandingan arsitektur, serta simulator minimasi Makespan 16 Cloudlet pada 4 VM heterogen.
 */

import { getObjective } from '../core/objectives.js';
import { createRng } from '../core/rng.js';
import { SimulationRunner } from '../core/engine.js';
import { SFLAEngine } from '../algorithms/sfla.js';
import { WCAEngine } from '../algorithms/wca.js';
import { CloudScheduleOptimizer, generateCloudTasks, DEFAULT_VMS } from '../algorithms/cloudScheduling.js';
import { SFLARenderer } from '../render/sflaRenderer.js';
import { WCARenderer } from '../render/wcaRenderer.js';
import { renderConvergenceChart } from '../render/chart.js';
import { syncCanvasSize } from '../render/contourRenderer.js';

export const tabKomparasi = {
  id: 'komparasi',
  label: 'Komparasi & Cloud VM',
  title: 'Komparasi SFLA vs WCA & Optimasi Penjadwalan Cloud VM',
  notes: `
    <p><strong>Panduan Demonstrasi Tab Komparasi &amp; Cloud VM:</strong></p>
    <ul>
      <li>Pada <strong>Arena Head-to-Head</strong>, kedua algoritma memulai dari titik koordinat awal <code>(x_i, y_i)</code> yang persis sama sehingga perbedaan kurva konvergensi murni berasal dari operator pencarian masing-masing.</li>
      <li>Gulir ke bagian <strong>Studi Kasus Penjadwalan Cloud VM</strong> dan klik <strong>Optimalkan Jadwal</strong> untuk menunjukkan penurunan waktu selesai maksimum (<em>Makespan</em>) dibanding metode statis <em>Round-Robin</em> pada 4 VM dengan kapasitas MIPS berbeda.</li>
    </ul>
  `,

  mount(container, { reducedMotion, registerHooks }) {
    container.innerHTML = `
      <header class="tab-lead">
        <div class="tab-lead-main">
          <div class="tab-breadcrumb">
            <span class="tab-breadcrumb-dot"></span>
            <span>Evaluasi Sinkron &amp; Implementasi Komputasi Awan</span>
          </div>
          <h1 class="tab-title">Komparasi Head-to-Head &amp; Penjadwalan Cloud VM</h1>
          <p class="tab-desc">
            Pengujian langsung <strong>SFLA</strong> dan <strong>WCA</strong> menggunakan koordinat populasi awal yang identik, diikuti penerapan keduanya untuk meminimalkan <em>Makespan</em> pada 16 tugas komputasi awan (<em>cloudlets</em>) di 4 Virtual Machine heterogen.
          </p>
        </div>
      </header>

      <!-- Bagian 1: Arena Komparasi Sinkron 2D (SFLA vs WCA) -->
      <section class="panel" data-ui>
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Arena Head-to-Head SFLA vs WCA (Populasi Awal Identik)</h2>
            <p class="panel-subtitle">Setiap langkah mengeksekusi 1 siklus penuh pada kedua algoritma secara bersamaan.</p>
          </div>
          <div style="display:flex; align-items:center; flex-wrap:wrap; gap:0.55rem;">
            <div class="seg-group" data-ui id="cmp-obj-group">
              <button type="button" class="seg-btn active" data-obj="rastrigin">Rastrigin</button>
              <button type="button" class="seg-btn" data-obj="ackley">Ackley</button>
              <button type="button" class="seg-btn" data-obj="sphere">Sphere</button>
            </div>
            <input type="number" class="field-input" id="cmp-inp-seed" value="42" min="1" max="99999" style="width:88px;" title="Seed Populasi Bersama" aria-label="Seed Populasi Bersama" />
            <button type="button" class="btn btn-primary" id="cmp-btn-play">Mulai Sinkron (P)</button>
            <button type="button" class="btn btn-gold" id="cmp-btn-step">+1 Iterasi (S)</button>
            <button type="button" class="btn" id="cmp-btn-reset">Reset (R)</button>
          </div>
        </div>

        <div class="kpi-strip" data-ui>
          <div class="kpi-cell" data-ui>
            <span class="kpi-label">Iterasi Bersama</span>
            <span class="kpi-val" id="cmp-kpi-iter">0 / 35</span>
            <span class="kpi-sub">24 agen identik di awal</span>
          </div>
          <div class="kpi-cell" data-ui>
            <span class="kpi-label">SFLA Terbaik f(Xg)</span>
            <span class="kpi-val tosca" id="cmp-kpi-sfla">0.000</span>
            <span class="kpi-sub">4 memeplex · N = 3</span>
          </div>
          <div class="kpi-cell" data-ui>
            <span class="kpi-label">WCA Terbaik f(Xsea)</span>
            <span class="kpi-val sky" id="cmp-kpi-wca">0.000</span>
            <span class="kpi-sub">Nsr = 4 · C = 2.0</span>
          </div>
          <div class="kpi-cell" data-ui>
            <span class="kpi-label">Status Keunggulan Saat Ini</span>
            <span class="kpi-val gold" id="cmp-kpi-lead">Seimbang</span>
            <span class="kpi-sub" id="cmp-kpi-delta">Selisih: 0.000</span>
          </div>
        </div>

        <div class="grid-12">
          <div class="span-6">
            <div class="canvas-stage-compact" data-ui style="height:310px;">
              <div class="canvas-hud" data-ui>
                <div class="hud-status" data-ui><span class="hud-dot" style="background:#12b0a2;"></span><span>SFLA (Kolam Memeplex)</span></div>
              </div>
              <canvas id="cmp-canvas-sfla"></canvas>
            </div>
          </div>
          <div class="span-6">
            <div class="canvas-stage-compact" data-ui style="height:310px;">
              <div class="canvas-hud" data-ui>
                <div class="hud-status" data-ui><span class="hud-dot" style="background:#26aee4;"></span><span>WCA (Aliran Siklus Air)</span></div>
              </div>
              <canvas id="cmp-canvas-wca"></canvas>
            </div>
          </div>
          <div class="span-12">
            <div class="chart-box" data-ui style="height:190px;">
              <canvas id="cmp-chart-canvas"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- Bagian 2: Tabel Perbandingan Arsitektural -->
      <section class="panel" data-ui>
        <div>
          <h2 class="panel-title">Matriks Perbandingan Arsitektur SFLA dan WCA</h2>
          <p class="panel-subtitle">Perbedaan mendasar struktur populasi, mekanisme eksploitasi, dan pengendalian keragaman solusi.</p>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dimensi Evaluasi</th>
                <th>Shuffled Frog-Leaping Algorithm (SFLA)</th>
                <th>Water Cycle Algorithm (WCA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sumber Inspirasi</strong></td>
                <td>Evolusi budaya memetik katak yang mencari batu berpakan tertinggi di kolam (Eusuff &amp; Lansey, 2003).</td>
                <td>Siklus hidrologi gravitasi aliran sungai menuju laut serta penguapan atmosfer (Eskandar et al., 2012).</td>
              </tr>
              <tr>
                <td><strong>Struktur Populasi</strong></td>
                <td>Terbagi rata ke dalam <code>m</code> sub-populasi <strong>Memeplex</strong> via pembagian modulo bergilir.</td>
                <td>Hierarki terpusat: 1 <strong>Laut</strong>, <code>Nsr - 1</code> <strong>Sungai</strong>, dan alokasi <strong>Aliran</strong> proporsional <code>NSn</code>.</td>
              </tr>
              <tr>
                <td><strong>Agen yang Diperbarui</strong></td>
                <td>Selektif: hanya katak terburuk <code>Xw</code> per memeplex dalam setiap sub-iterasi lokal <code>N</code>.</td>
                <td>Serentak: seluruh aliran bergerak ke sungai/laut dan seluruh sungai bergerak ke laut tiap iterasi.</td>
              </tr>
              <tr>
                <td><strong>Mekanisme Anti-Stagnasi</strong></td>
                <td>Relokasi acak katak <code>Xw</code> saat lompatan ke <code>Xb</code> maupun <code>Xg</code> tidak memperbaiki fitness.</td>
                <td>Penguapan ketika jarak ke Laut <code>&lt; dmax</code> diikuti presipitasi hujan baru dan penyusutan <code>dmax</code>.</td>
              </tr>
              <tr>
                <td><strong>Difusi Informasi Global</strong></td>
                <td>Periodik melalui tahap <strong>Shuffle</strong> setelah seluruh memeplex menyelesaikan <code>N</code> langkah lokal.</td>
                <td>Kontinu melalui <strong>Pertukaran Peran</strong> seketika saat aliran mengungguli sungai atau laut.</td>
              </tr>
              <tr>
                <td><strong>Karakteristik pada Cloud</strong></td>
                <td>Tangguh menjaga variasi jadwal alternatif pada beban kerja heterogen berdimensi diskrit-kombinatorial.</td>
                <td>Konvergensi awal sangat cepat menuju jadwal ber-Makespan rendah dengan sedikit parameter sensitif.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Bagian 3: Studi Kasus Komputasi Awan (16 Cloudlets -> 4 VM Heterogen) -->
      <section class="panel" data-ui>
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Studi Kasus SOKA: Penjadwalan 16 Cloudlet pada 4 Virtual Machine Heterogen</h2>
            <p class="panel-subtitle">
              Memetakan vektor kontinu <code>X &isin; [0, 4)^16</code> menjadi penugasan VM diskrit <code>vmIdx = floor(X_i)</code> guna meminimalkan waktu selesai klaster (<em>Makespan</em>).
            </p>
          </div>
          <div style="display:flex; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <select class="field-input" id="cloud-sel-seed" aria-label="Pilih skenario beban kerja">
              <option value="42">Beban Kerja Klaster A (Seed 42)</option>
              <option value="108">Beban Kerja Klaster B (Seed 108)</option>
              <option value="2026">Beban Kerja Puncak C (Seed 2026)</option>
            </select>
            <button type="button" class="btn btn-primary" id="cloud-btn-run">Optimalkan Jadwal</button>
            <button type="button" class="btn btn-gold" id="cloud-btn-step">+1 Iterasi</button>
            <button type="button" class="btn" id="cloud-btn-reset">Reset</button>
          </div>
        </div>

        <div class="kpi-strip" data-ui>
          <div class="kpi-cell" data-ui>
            <span class="kpi-label">Baseline Round-Robin</span>
            <span class="kpi-val danger" id="cloud-kpi-rr">0.00 dtk</span>
            <span class="kpi-sub">Tanpa kesadaran kapasitas MIPS</span>
          </div>
          <div class="kpi-cell" data-ui>
            <span class="kpi-label">Makespan Jadwal SFLA</span>
            <span class="kpi-val tosca" id="cloud-kpi-sfla">0.00 dtk</span>
            <span class="kpi-sub" id="cloud-kpi-sfla-gain">Hemat 0.0% vs Round-Robin</span>
          </div>
          <div class="kpi-cell" data-ui>
            <span class="kpi-label">Makespan Jadwal WCA</span>
            <span class="kpi-val sky" id="cloud-kpi-wca">0.00 dtk</span>
            <span class="kpi-sub" id="cloud-kpi-wca-gain">Hemat 0.0% vs Round-Robin</span>
          </div>
          <div class="kpi-cell" data-ui>
            <span class="kpi-label">Progres Optimasi VM</span>
            <span class="kpi-val gold" id="cloud-kpi-iter">0 / 35</span>
            <span class="kpi-sub">16 tugas (140..620 MI)</span>
          </div>
        </div>

        <div class="grid-12">
          <div class="span-7">
            <div class="canvas-stage-compact" data-ui style="height:315px;">
              <canvas id="cloud-bars-canvas"></canvas>
            </div>
          </div>
          <div class="span-5" style="display:flex; flex-direction:column; gap:0.8rem;">
            <div class="chart-box" data-ui style="height:198px;">
              <canvas id="cloud-chart-canvas"></canvas>
            </div>
            <div class="formula-block" data-ui>
              <code>Makespan = max_{j=1..4} ( sum_{i in VM_j} MI_i / MIPS_j )</code>
              <div class="formula-note">
                VM-1 (85 MIPS), VM-2 (115 MIPS), VM-3 (145 MIPS), VM-4 (175 MIPS). Round-Robin membebani VM lambat secara buta, sedangkan SFLA &amp; WCA menyeimbangkan durasi selesai keempat VM.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Bagian 4: Sintesis Akademik & Daftar Pustaka -->
      <div class="grid-12">
        <div class="span-6 panel" data-ui>
          <h2 class="panel-title">Kesimpulan Rekayasa Optimasi Awan</h2>
          <ul style="margin:0; padding-left:1.2rem; color:var(--ink-muted); font-size:0.88rem; display:flex; flex-direction:column; gap:0.5rem;">
            <li><strong>Keunggulan SFLA:</strong> Partisi independen dalam beberapa memeplex menjaga keragaman solusi alternatif lebih lama, efektif saat lanskap penjadwalan memiliki banyak konfigurasi berbiaya hampir setara.</li>
            <li><strong>Keunggulan WCA:</strong> Pembagian debit aliran proporsional <code>NSn</code> dan penyusutan radius penguapan <code>dmax</code> memberikan akselerasi konvergensi awal yang sangat tajam dengan struktur kode ringkas.</li>
            <li><strong>Dampak pada Cloud SLA:</strong> Baik SFLA maupun WCA secara konsisten memangkas <em>Makespan</em> penjadwalan klaster heterogen secara signifikan dibanding heuristik statis <em>Round-Robin</em>.</li>
          </ul>
        </div>

        <div class="span-6 panel" data-ui>
          <h2 class="panel-title">Referensi Ilmiah Utama</h2>
          <div style="display:flex; flex-direction:column; gap:0.65rem; font-size:0.86rem; color:var(--ink-muted);">
            <div class="panel-navy" data-ui>
              <strong style="color:var(--ink);">Eusuff, M. M., &amp; Lansey, K. E. (2003)</strong>
              <div style="margin-top:0.2rem;">
                Optimization of water distribution network design using the shuffled frog leaping algorithm. <em>Journal of Water Resources Planning and Management</em>, 129(3), 210–225.
              </div>
            </div>
            <div class="panel-navy" data-ui>
              <strong style="color:var(--ink);">Eskandar, H., Sadollah, A., Bahreininejad, A., &amp; Hamdi, M. (2012)</strong>
              <div style="margin-top:0.2rem;">
                Water cycle algorithm – A novel metaheuristic optimization method for solving constrained engineering optimization problems. <em>Computers &amp; Structures</em>, 110–111, 151–166.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // =========================================================================
    // 1. Arena Head-to-Head Sinkron SFLA vs WCA
    // =========================================================================
    const cmpCanvasSfla = container.querySelector('#cmp-canvas-sfla');
    const cmpCanvasWca = container.querySelector('#cmp-canvas-wca');
    const cmpChartCanvas = container.querySelector('#cmp-chart-canvas');
    const cmpBtnPlay = container.querySelector('#cmp-btn-play');

    let cmpObj = getObjective('rastrigin');
    const sflaRenderer = new SFLARenderer();
    const wcaRenderer = new WCARenderer();
    const CMP_POP = 24;
    const CMP_MAX_ITER = 35;

    function buildSharedPositions(seed, obj) {
      const rng = createRng(seed);
      return Array.from({ length: CMP_POP }, () => ({
        x: rng.range(obj.min, obj.max),
        y: rng.range(obj.min, obj.max)
      }));
    }

    let cmpSeed = 42;
    let sharedPos = buildSharedPositions(cmpSeed, cmpObj);

    const cmpSfla = new SFLAEngine({
      objective: cmpObj,
      populationSize: CMP_POP,
      memeplexCount: 4,
      localIterations: 3,
      maxStep: 3.2,
      maxIterations: CMP_MAX_ITER,
      seed: cmpSeed,
      initialPositions: sharedPos
    });

    const cmpWca = new WCAEngine({
      objective: cmpObj,
      populationSize: CMP_POP,
      nsr: 4,
      dmax: 0.45,
      flowConstant: 2.0,
      maxIterations: CMP_MAX_ITER,
      seed: cmpSeed,
      initialPositions: sharedPos
    });

    function updateCmpTelemetry() {
      const stS = cmpSfla.getState();
      const stW = cmpWca.getState();

      const iterEl = container.querySelector('#cmp-kpi-iter');
      const sflaEl = container.querySelector('#cmp-kpi-sfla');
      const wcaEl = container.querySelector('#cmp-kpi-wca');
      const leadEl = container.querySelector('#cmp-kpi-lead');
      const deltaEl = container.querySelector('#cmp-kpi-delta');

      const fS = stS.bestFrog ? stS.bestFrog.fitness : 0;
      const fW = stW.bestSea ? stW.bestSea.fitness : 0;
      const diff = Math.abs(fS - fW);

      if (iterEl) iterEl.textContent = `${Math.max(stS.iteration, stW.iteration)} / ${CMP_MAX_ITER}`;
      if (sflaEl) sflaEl.textContent = fS < 0.001 && fS > 0 ? fS.toExponential(2) : fS.toFixed(4);
      if (wcaEl) wcaEl.textContent = fW < 0.001 && fW > 0 ? fW.toExponential(2) : fW.toFixed(4);

      if (leadEl) {
        if (diff < 1e-6) leadEl.textContent = 'Identik';
        else if (fS < fW) leadEl.textContent = 'SFLA Unggul';
        else leadEl.textContent = 'WCA Unggul';
      }
      if (deltaEl) {
        deltaEl.textContent = `Selisih: ${diff < 0.001 && diff > 0 ? diff.toExponential(2) : diff.toFixed(4)}`;
      }

      renderConvergenceChart(
        cmpChartCanvas,
        [
          { label: 'SFLA', color: '#12b0a2', data: stS.history },
          { label: 'WCA', color: '#26aee4', data: stW.history }
        ],
        {
          title: 'Perbandingan Kurva Konvergensi per Iterasi',
          maxIterations: CMP_MAX_ITER
        }
      );
    }

    const cmpRunner = new SimulationRunner({
      stepsPerSecond: 3.0,
      reducedMotion,
      onStep: () => {
        const s1 = cmpSfla.stepFullIteration();
        const s2 = cmpWca.stepFullIteration();
        updateCmpTelemetry();
        return s1.phase === 'DONE' && s2.phase === 'DONE';
      },
      onRender: (alpha, now) => {
        sflaRenderer.render(cmpCanvasSfla, cmpSfla.getState(), cmpObj, {
          alpha,
          compact: true,
          showTrails: true,
          showOptimum: true
        });
        wcaRenderer.render(cmpCanvasWca, cmpWca.getState(), cmpObj, {
          alpha,
          timestamp: now,
          compact: true,
          showTrails: true,
          showOptimum: true
        });
      }
    });

    cmpRunner.onPlayStateChange = (playing) => {
      if (cmpBtnPlay) cmpBtnPlay.textContent = playing ? 'Jeda Sinkron (P)' : 'Mulai Sinkron (P)';
    };

    function resetCmpArena() {
      cmpRunner.pause();
      cmpSeed = Number(container.querySelector('#cmp-inp-seed')?.value || 42);
      sharedPos = buildSharedPositions(cmpSeed, cmpObj);
      cmpSfla.configure({
        objective: cmpObj,
        populationSize: CMP_POP,
        memeplexCount: 4,
        localIterations: 3,
        maxStep: 3.2,
        maxIterations: CMP_MAX_ITER,
        seed: cmpSeed,
        initialPositions: sharedPos
      });
      cmpWca.configure({
        objective: cmpObj,
        populationSize: CMP_POP,
        nsr: 4,
        dmax: 0.45,
        flowConstant: 2.0,
        maxIterations: CMP_MAX_ITER,
        seed: cmpSeed,
        initialPositions: sharedPos
      });
      updateCmpTelemetry();
      cmpRunner.notifyReset();
    }

    cmpBtnPlay?.addEventListener('click', () => cmpRunner.togglePlay());
    container.querySelector('#cmp-btn-step')?.addEventListener('click', () => cmpRunner.stepOnce());
    container.querySelector('#cmp-btn-reset')?.addEventListener('click', () => resetCmpArena());
    container.querySelector('#cmp-inp-seed')?.addEventListener('change', () => resetCmpArena());

    const cmpObjBtns = container.querySelectorAll('#cmp-obj-group .seg-btn');
    cmpObjBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        cmpObjBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        cmpObj = getObjective(btn.dataset.obj);
        resetCmpArena();
      });
    });

    // =========================================================================
    // 2. Studi Kasus Komputasi Awan (Cloud VM Makespan Optimizer)
    // =========================================================================
    const cloudBarsCanvas = container.querySelector('#cloud-bars-canvas');
    const cloudChartCanvas = container.querySelector('#cloud-chart-canvas');
    const cloudBtnRun = container.querySelector('#cloud-btn-run');
    const cloudSelSeed = container.querySelector('#cloud-sel-seed');

    let cloudSeed = 42;
    let cloudOpt = new CloudScheduleOptimizer({
      tasks: generateCloudTasks(16, cloudSeed),
      vms: DEFAULT_VMS,
      populationSize: 28,
      maxIterations: 35,
      seed: cloudSeed
    });
    let cloudTimer = null;

    function renderCloudBars(state) {
      if (!cloudBarsCanvas) return;
      const { ctx, width, height } = syncCanvasSize(cloudBarsCanvas);
      ctx.fillStyle = '#041126';
      ctx.fillRect(0, 0, width, height);

      const rrLoads = state.baselineRR.vmLoads;
      const sflaLoads = state.bestSfla.eval.vmLoads;
      const wcaLoads = state.bestWca.eval.vmLoads;
      const maxLoad = Math.max(10, state.baselineRR.makespan * 1.08);

      const padL = 128;
      const padR = 54;
      const padT = 36;
      const barAreaW = Math.max(40, width - padL - padR);

      ctx.font = '700 12.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#d6e3ff';
      ctx.textAlign = 'left';
      ctx.fillText('Durasi Eksekusi per Virtual Machine (Detik) · Garis Putus = Makespan', 14, 21);

      const groupH = (height - padT - 20) / state.vms.length;

      state.vms.forEach((vm, vIdx) => {
        const gy = padT + vIdx * groupH;

        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ecf3ff';
        ctx.textAlign = 'left';
        ctx.fillText(vm.name, 14, gy + 18);

        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#8a99b2';
        ctx.fillText(`${vm.mips} MIPS`, 14, gy + 32);

        const bars = [
          { label: 'RR', val: rrLoads[vIdx], color: '#e05a5f' },
          { label: 'SFLA', val: sflaLoads[vIdx], color: '#12b0a2' },
          { label: 'WCA', val: wcaLoads[vIdx], color: '#26aee4' }
        ];

        bars.forEach((b, bIdx) => {
          const by = gy + 4 + bIdx * 16;
          const bw = Math.max(2, (b.val / maxLoad) * barAreaW);

          ctx.fillStyle = 'rgba(25, 40, 65, 0.75)';
          ctx.fillRect(padL, by, barAreaW, 12);

          ctx.fillStyle = b.color;
          ctx.fillRect(padL, by, bw, 12);

          ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#b8c5d9';
          ctx.textAlign = 'left';
          ctx.fillText(`${b.val.toFixed(1)}s`, padL + bw + 5, by + 9.5);
        });
      });

      // Garis penanda Makespan terbaik
      const drawMakespanLine = (msVal, color) => {
        const px = padL + (msVal / maxLoad) * barAreaW;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, height - 12);
        ctx.stroke();
        ctx.restore();
      };

      drawMakespanLine(state.baselineRR.makespan, 'rgba(224, 90, 95, 0.65)');
      drawMakespanLine(state.bestSfla.eval.makespan, 'rgba(18, 176, 162, 0.85)');
      drawMakespanLine(state.bestWca.eval.makespan, 'rgba(38, 174, 228, 0.85)');
    }

    function updateCloudUI() {
      const st = cloudOpt.getState();
      const rrMs = st.baselineRR.makespan;
      const sflaMs = st.bestSfla.eval.makespan;
      const wcaMs = st.bestWca.eval.makespan;

      const sflaGain = ((rrMs - sflaMs) / Math.max(1e-6, rrMs)) * 100;
      const wcaGain = ((rrMs - wcaMs) / Math.max(1e-6, rrMs)) * 100;

      const rrEl = container.querySelector('#cloud-kpi-rr');
      const sEl = container.querySelector('#cloud-kpi-sfla');
      const sgEl = container.querySelector('#cloud-kpi-sfla-gain');
      const wEl = container.querySelector('#cloud-kpi-wca');
      const wgEl = container.querySelector('#cloud-kpi-wca-gain');
      const itEl = container.querySelector('#cloud-kpi-iter');

      if (rrEl) rrEl.textContent = `${rrMs.toFixed(2)} dtk`;
      if (sEl) sEl.textContent = `${sflaMs.toFixed(2)} dtk`;
      if (sgEl) sgEl.textContent = `Hemat ${sflaGain.toFixed(1)}% vs Round-Robin`;
      if (wEl) wEl.textContent = `${wcaMs.toFixed(2)} dtk`;
      if (wgEl) wgEl.textContent = `Hemat ${wcaGain.toFixed(1)}% vs Round-Robin`;
      if (itEl) itEl.textContent = `${st.iteration} / ${st.maxIterations}`;

      renderCloudBars(st);
      renderConvergenceChart(
        cloudChartCanvas,
        [
          { label: 'SFLA', color: '#12b0a2', data: st.historySfla },
          { label: 'WCA', color: '#26aee4', data: st.historyWca }
        ],
        {
          title: 'Penurunan Makespan Klaster (Detik)',
          maxIterations: st.maxIterations,
          zeroBaseline: false
        }
      );
    }

    function stopCloudTimer() {
      if (cloudTimer) {
        clearInterval(cloudTimer);
        cloudTimer = null;
      }
      if (cloudBtnRun) cloudBtnRun.textContent = 'Optimalkan Jadwal';
    }

    function resetCloudCase() {
      stopCloudTimer();
      cloudSeed = Number(cloudSelSeed?.value || 42);
      cloudOpt = new CloudScheduleOptimizer({
        tasks: generateCloudTasks(16, cloudSeed),
        vms: DEFAULT_VMS,
        populationSize: 28,
        maxIterations: 35,
        seed: cloudSeed
      });
      updateCloudUI();
    }

    cloudBtnRun?.addEventListener('click', () => {
      if (cloudTimer) {
        stopCloudTimer();
        return;
      }
      if (cloudOpt.getState().done) {
        cloudOpt.reset();
      }
      if (cloudBtnRun) cloudBtnRun.textContent = 'Jeda Optimasi';
      cloudTimer = setInterval(() => {
        const st = cloudOpt.step();
        updateCloudUI();
        if (st.done) {
          stopCloudTimer();
        }
      }, 110);
    });

    container.querySelector('#cloud-btn-step')?.addEventListener('click', () => {
      stopCloudTimer();
      cloudOpt.step();
      updateCloudUI();
    });

    container.querySelector('#cloud-btn-reset')?.addEventListener('click', () => resetCloudCase());
    cloudSelSeed?.addEventListener('change', () => resetCloudCase());

    registerHooks?.({
      togglePlay: () => cmpRunner.togglePlay(),
      step: () => {
        cmpRunner.stepOnce();
        cloudOpt.step();
        updateCloudUI();
      },
      reset: () => {
        resetCmpArena();
        resetCloudCase();
      }
    });

    const onResize = () => {
      updateCmpTelemetry();
      cmpRunner.notifyReset();
      updateCloudUI();
    };
    window.addEventListener('resize', onResize);

    updateCmpTelemetry();
    cmpRunner.startLoop();
    requestAnimationFrame(() => updateCloudUI());

    return () => {
      window.removeEventListener('resize', onResize);
      cmpRunner.destroy();
      stopCloudTimer();
    };
  }
};
