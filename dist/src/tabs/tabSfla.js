/**
 * Tab 2: Laboratorium Simulasi Shuffled Frog-Leaping Algorithm (SFLA)
 * Menggabungkan kanvas simulasi live 2D Kolam Teratai, kontrol hiperparameter real-time,
 * kurva konvergensi, dan meja kerja interaktif 4 tahap mekanisme internal SFLA.
 */

import { getObjective } from '../core/objectives.js';
import { SimulationRunner } from '../core/engine.js';
import { SFLAEngine } from '../algorithms/sfla.js';
import { SFLARenderer, MEMEPLEX_COLORS } from '../render/sflaRenderer.js';
import { renderConvergenceChart } from '../render/chart.js';
import { syncCanvasSize } from '../render/contourRenderer.js';

export const tabSfla = {
  id: 'sfla',
  label: 'Simulasi SFLA',
  title: 'Shuffled Frog-Leaping Algorithm (SFLA)',
  notes: `
    <p><strong>Panduan Demonstrasi Tab Simulasi SFLA:</strong></p>
    <ul>
      <li>Gunakan tombol <strong>Langkah (S)</strong> pada kanvas utama untuk memperlihatkan urutan deterministik mesin SFLA: <code>INIT &rarr; SORT &rarr; PARTITION &rarr; LOCAL_JUMP &rarr; SHUFFLE</code>.</li>
      <li>Tunjukkan warna serta label <code>M1..Mm</code> pada tubuh katak untuk membuktikan bagaimana pembagian bergilir menyebarkan katak berkualitas tinggi secara adil ke tiap memeplex.</li>
      <li>Gunakan panel <strong>Meja Kerja Mekanisme Internal SFLA</strong> di bagian bawah untuk mendemonstrasikan 3 skenario lompatan katak terburuk <code>Xw</code> (menuju <code>Xb</code>, menuju <code>Xg</code>, atau reset acak).</li>
    </ul>
  `,

  mount(container, { reducedMotion, registerHooks }) {
    container.innerHTML = `
      <header class="tab-lead">
        <div class="tab-lead-main">
          <div class="tab-breadcrumb">
            <span class="tab-breadcrumb-dot"></span>
            <span>Algoritma Memetik · Eusuff &amp; Lansey (2003)</span>
          </div>
          <h1 class="tab-title">Shuffled Frog-Leaping Algorithm (SFLA)</h1>
          <p class="tab-desc">
            Memadukan evolusi memetik lokal di dalam sub-kelompok <strong>Memeplex</strong> (katak terburuk <code>Xw</code> melompat meniru katak terbaik lokal <code>Xb</code> atau global <code>Xg</code>) dengan penyatuan ulang <strong>Shuffle</strong> lintas kelompok secara periodik.
          </p>
        </div>
        <div class="tab-lead-meta">
          <span class="status-chip tosca">Urutan: Sort &rarr; Partition &rarr; Local Jump &rarr; Shuffle</span>
        </div>
      </header>

      <!-- Laboratorium Utama SFLA (7 Kolom Kanvas : 5 Kolom Kontrol & Telemetri) -->
      <div class="grid-12">
        <div class="span-7 panel-flush" data-ui>
          <div class="stage-caption-bar" data-ui>
            <div class="seg-group" data-ui id="sfla-obj-group">
              <button type="button" class="seg-btn active" data-obj="rastrigin">Rastrigin</button>
              <button type="button" class="seg-btn" data-obj="ackley">Ackley</button>
              <button type="button" class="seg-btn" data-obj="sphere">Sphere</button>
            </div>
            <div style="display:flex; align-items:center; gap:0.85rem; font-size:0.8rem;">
              <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer;">
                <input type="checkbox" id="sfla-chk-trails" checked /> Jejak Lompatan
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer;">
                <input type="checkbox" id="sfla-chk-opt" checked /> Target (0, 0)
              </label>
            </div>
          </div>

          <div class="canvas-stage" data-ui>
            <div class="canvas-hud" data-ui>
              <div class="hud-status" data-ui>
                <span class="hud-dot"></span>
                <span id="sfla-hud-phase">Inisialisasi Kolam</span>
              </div>
              <div class="hud-coords" data-ui id="sfla-hud-best">Xg: (0.00, 0.00)</div>
            </div>
            <canvas id="sfla-main-canvas"></canvas>
          </div>

          <div class="stage-caption-bar" data-ui>
            <span id="sfla-phase-detail">Menyebar populasi katak awal di permukaan kolam.</span>
            <div class="legend-inline">
              <span class="legend-item"><span class="swatch-round" style="background:#fdbb16;"></span>Katak Terbaik Global (Xg)</span>
              <span class="legend-item"><span class="swatch-round" style="background:#12b0a2;"></span>M1</span>
              <span class="legend-item"><span class="swatch-round" style="background:#26aee4;"></span>M3</span>
              <span class="legend-item"><span class="swatch-round" style="background:#f47d52;"></span>M4</span>
            </div>
          </div>
        </div>

        <div class="span-5 panel" data-ui>
          <div class="ctrl-toolbar" data-ui>
            <button type="button" class="btn btn-sfla" id="sfla-btn-play">Mulai (P)</button>
            <button type="button" class="btn btn-gold" id="sfla-btn-step">Langkah (S)</button>
            <button type="button" class="btn" id="sfla-btn-cycle">+1 Siklus</button>
            <button type="button" class="btn" id="sfla-btn-reset">Reset (R)</button>
          </div>

          <div class="kpi-strip" data-ui>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Siklus Global</span>
              <span class="kpi-val" id="sfla-kpi-iter">0 / 40</span>
              <span class="kpi-sub" id="sfla-kpi-local">Lokal: 0 / 3</span>
            </div>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Terbaik Global f(Xg)</span>
              <span class="kpi-val gold" id="sfla-kpi-best">0.000</span>
              <span class="kpi-sub">Target minimum: 0</span>
            </div>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Rata-rata Kolam</span>
              <span class="kpi-val tosca" id="sfla-kpi-mean">0.000</span>
              <span class="kpi-sub" id="sfla-kpi-pop">24 katak · 4 memeplex</span>
            </div>
          </div>

          <div class="chart-box" data-ui>
            <canvas id="sfla-chart-canvas"></canvas>
          </div>

          <div class="panel-navy" data-ui>
            <div class="panel-header" style="margin-bottom:0.55rem;">
              <strong style="font-size:0.86rem; color:var(--ink);">Parameter Eksperimen SFLA</strong>
              <span style="font-size:0.75rem; color:var(--ink-faint);">Perubahan me-reset kolam</span>
            </div>
            <div class="param-grid">
              <div class="param-item">
                <label for="sfla-inp-pop"><span>Populasi Katak (F)</span><span class="val" id="sfla-val-pop">24</span></label>
                <input type="range" id="sfla-inp-pop" min="12" max="48" step="4" value="24" />
              </div>
              <div class="param-item">
                <label for="sfla-inp-mem"><span>Jumlah Memeplex (m)</span><span class="val" id="sfla-val-mem">4</span></label>
                <input type="range" id="sfla-inp-mem" min="2" max="6" step="1" value="4" />
              </div>
              <div class="param-item">
                <label for="sfla-inp-loc"><span>Iterasi Lokal (N)</span><span class="val" id="sfla-val-loc">3</span></label>
                <input type="range" id="sfla-inp-loc" min="1" max="8" step="1" value="3" />
              </div>
              <div class="param-item">
                <label for="sfla-inp-step"><span>Langkah Maks (Dmax)</span><span class="val" id="sfla-val-step">3.2</span></label>
                <input type="range" id="sfla-inp-step" min="0.8" max="5.0" step="0.2" value="3.2" />
              </div>
              <div class="param-item">
                <label for="sfla-inp-speed"><span>Kecepatan (langkah/dtk)</span><span class="val" id="sfla-val-speed">2.5</span></label>
                <input type="range" id="sfla-inp-speed" min="0.5" max="12" step="0.5" value="2.5" />
              </div>
              <div class="param-item">
                <label for="sfla-inp-seed"><span>Seed PRNG</span><span class="val">Tetap</span></label>
                <input type="number" class="field-input" id="sfla-inp-seed" value="42" min="1" max="99999" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Meja Kerja Interaktif Mekanisme Internal SFLA -->
      <section class="panel" data-ui>
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Bedah Mekanisme Internal &amp; Formulasi Matematis SFLA</h2>
            <p class="panel-subtitle">Pilih sub-modul di bawah untuk menguji cara kerja partisi memeplex, 3 aturan lompatan Xw, dan rumus lengkap SFLA.</p>
          </div>
        </div>

        <div class="subtab-bar" data-ui id="sfla-subtabs">
          <button type="button" class="subtab-btn active" data-ui data-sub="partition">Partisi Bergilir (Round-Robin)</button>
          <button type="button" class="subtab-btn" data-ui data-sub="leap">Sandbox 3 Skenario Lompatan Xw</button>
          <button type="button" class="subtab-btn" data-ui data-sub="metaphor">Pemetaan Metafora &amp; Shuffle</button>
          <button type="button" class="subtab-btn" data-ui data-sub="formulas">Rumus &amp; Tabel 6 Tahap</button>
        </div>

        <!-- Sub-view 1: Partisi Round-Robin -->
        <div id="sfla-sub-partition" class="sfla-subview">
          <div class="grid-12" style="margin-top:0.35rem;">
            <div class="span-5 panel-navy" data-ui>
              <strong style="color:var(--ink); font-size:0.92rem;">Aturan Pembagian Modulo <code>k = idx mod m</code></strong>
              <p class="panel-subtitle" style="margin:0.35rem 0 0.75rem;">
                Setelah seluruh <code>F</code> katak diurutkan dari fitness terbaik (peringkat 1) ke terburuk (peringkat F), katak dibagikan secara bergilir seperti membagikan kartu: peringkat 1 masuk M1, peringkat 2 masuk M2, dan seterusnya hingga berputar kembali ke M1.
              </p>
              <div class="param-grid">
                <div class="param-item">
                  <label for="sfla-rr-f"><span>Contoh Populasi (F)</span><span class="val" id="sfla-rr-f-val">12</span></label>
                  <input type="range" id="sfla-rr-f" min="6" max="20" step="2" value="12" />
                </div>
                <div class="param-item">
                  <label for="sfla-rr-m"><span>Jumlah Memeplex (m)</span><span class="val" id="sfla-rr-m-val">3</span></label>
                  <input type="range" id="sfla-rr-m" min="2" max="5" step="1" value="3" />
                </div>
              </div>
              <div class="formula-block" data-ui style="margin-top:0.75rem;">
                <code>Memeplex(peringkat i) = ((i - 1) mod m) + 1</code>
              </div>
            </div>
            <div class="span-7">
              <div id="sfla-rr-output" class="mini-card-grid"></div>
            </div>
          </div>
        </div>

        <!-- Sub-view 2: Sandbox 3 Skenario Lompatan Xw -->
        <div id="sfla-sub-leap" class="sfla-subview hidden">
          <div class="grid-12" style="margin-top:0.35rem;">
            <div class="span-7">
              <div class="canvas-stage-compact" data-ui>
                <canvas id="sfla-leap-canvas"></canvas>
              </div>
            </div>
            <div class="span-5 panel-navy" data-ui style="display:flex; flex-direction:column; gap:0.65rem;">
              <strong style="color:var(--ink); font-size:0.92rem;">Uji Ketiga Aturan Lompatan Katak Terburuk (Xw)</strong>
              <div style="display:flex; flex-direction:column; gap:0.45rem;">
                <button type="button" class="btn btn-sfla" data-leap="xb">1. Lompat Menuju Xb (Berhasil Membaik)</button>
                <button type="button" class="btn btn-gold" data-leap="xg">2. Gagal di Xb &rarr; Lompat Menuju Xg</button>
                <button type="button" class="btn" data-leap="rand">3. Gagal Keduanya &rarr; Posisi Acak Baru</button>
              </div>
              <div class="formula-block" data-ui>
                <code id="sfla-leap-eq">D = rand() * (Xb - Xw) ; Xw_baru = Xw + D</code>
                <div class="formula-note" id="sfla-leap-explain">
                  Katak terburuk mencoba melompat mendekati katak terbaik di dalam memeplex-nya terlebih dahulu.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sub-view 3: Metafora & Shuffle -->
        <div id="sfla-sub-metaphor" class="sfla-subview hidden">
          <div class="table-wrap" style="margin-top:0.35rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Elemen Kolam Teratai</th>
                  <th>Representasi Matematis Optimasi</th>
                  <th>Peran dalam Pencarian Solusi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Seekor Katak</strong></td>
                  <td>Vektor kandidat solusi <code>X_i = (x_1, x_2, ..., x_d)</code></td>
                  <td>Menyimpan satu konfigurasi penugasan variabel beserta nilai objektif <code>f(X_i)</code>.</td>
                </tr>
                <tr>
                  <td><strong>Meme (Gagasan Budaya)</strong></td>
                  <td>Vektor arah dan informasi posisi lompatan</td>
                  <td>Berbeda dari gen biologis, meme ditularkan secara langsung dalam satu generasi melalui peniruan sosial.</td>
                </tr>
                <tr>
                  <td><strong>Memeplex (M1..Mm)</strong></td>
                  <td>Sub-populasi hasil partisi bergilir</td>
                  <td>Menjaga eksploitasi lokal independen pada beberapa lembah fungsi secara paralel.</td>
                </tr>
                <tr>
                  <td><strong>Katak Terbaik Lokal &amp; Global</strong></td>
                  <td><code>X_b</code> (terbaik memeplex) dan <code>X_g</code> (terbaik kolam)</td>
                  <td>Menjadi jangkar penarik arah lompatan bagi katak terburuk <code>X_w</code> di setiap memeplex.</td>
                </tr>
                <tr>
                  <td><strong>Shuffle Lintas Kelompok</strong></td>
                  <td>Penggabungan dan pengurutan ulang seluruh <code>F</code> katak</td>
                  <td>Menyebarkan temuan lembah terdalam dari satu memeplex ke seluruh populasi pada siklus berikutnya.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sub-view 4: Rumus & Tabel 6 Tahap -->
        <div id="sfla-sub-formulas" class="sfla-subview hidden">
          <div class="grid-12" style="margin-top:0.35rem;">
            <div class="span-5" style="display:flex; flex-direction:column; gap:0.65rem;">
              <div class="formula-block" data-ui>
                <code>D_i = clamp(rand() * (X_b - X_w), -D_max, D_max)</code>
                <div class="formula-note">Langkah pertama: lompatan terarah menuju pemimpin lokal memeplex.</div>
              </div>
              <div class="formula-block" data-ui>
                <code>D_i = clamp(rand() * (X_g - X_w), -D_max, D_max)</code>
                <div class="formula-note">Langkah cadangan bila posisi menuju <code>X_b</code> tidak menurunkan nilai <code>f(X)</code>.</div>
              </div>
              <div class="formula-block" data-ui>
                <code>X_w_baru = X_min + rand() * (X_max - X_min)</code>
                <div class="formula-note">Injeksi keragaman acak murni bila kedua lompatan terarah masih gagal membaik.</div>
              </div>
            </div>
            <div class="span-7 table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tahap Mesin</th>
                    <th>Operasi Algoritmik</th>
                    <th>Kompleksitas / Efek</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><strong>Inisialisasi</strong></td><td>Bangkitkan <code>F</code> katak seragam di domain <code>[min, max]^d</code> dan hitung <code>f(X)</code>.</td><td>Sampling awal merata</td></tr>
                  <tr><td><strong>Pengurutan</strong></td><td>Urutkan populasi menaik berdasarkan nilai biaya <code>f(X_1) &le; ... &le; f(X_F)</code>; tetapkan <code>X_g = X_1</code>.</td><td><code>O(F log F)</code></td></tr>
                  <tr><td><strong>Partisi Memeplex</strong></td><td>Distribusikan katak ke <code>m</code> memeplex menggunakan indeks modulo <code>(i - 1) mod m</code>.</td><td>Kualitas tiap grup seimbang</td></tr>
                  <tr><td><strong>Evolusi Lokal</strong></td><td>Ulangi <code>N</code> kali per memeplex: perbarui hanya katak terburuk <code>X_w</code> via <code>X_b &rarr; X_g &rarr; Acak</code>.</td><td>Hemat evaluasi fungsi</td></tr>
                  <tr><td><strong>Shuffle Global</strong></td><td>Satukan kembali seluruh memeplex dan urutkan ulang populasi gabungan.</td><td>Difusi informasi global</td></tr>
                  <tr><td><strong>Terminasi</strong></td><td>Hentikan saat siklus mencapai <code>Iter_maks</code> atau toleransi konvergensi terpenuhi.</td><td>Menghasilkan <code>X_g</code></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    `;

    // 1. Setup Mesin Utama SFLA
    const mainCanvas = container.querySelector('#sfla-main-canvas');
    const chartCanvas = container.querySelector('#sfla-chart-canvas');
    const chkTrails = container.querySelector('#sfla-chk-trails');
    const chkOpt = container.querySelector('#sfla-chk-opt');
    const btnPlay = container.querySelector('#sfla-btn-play');

    let currentObj = getObjective('rastrigin');
    const renderer = new SFLARenderer();

    function readConfig() {
      const pop = Number(container.querySelector('#sfla-inp-pop')?.value || 24);
      const mem = Number(container.querySelector('#sfla-inp-mem')?.value || 4);
      const loc = Number(container.querySelector('#sfla-inp-loc')?.value || 3);
      const step = Number(container.querySelector('#sfla-inp-step')?.value || 3.2);
      const seed = Number(container.querySelector('#sfla-inp-seed')?.value || 42);
      return {
        objective: currentObj,
        populationSize: pop,
        memeplexCount: mem,
        localIterations: loc,
        maxStep: step,
        maxIterations: 40,
        seed
      };
    }

    const engine = new SFLAEngine(readConfig());

    function updateTelemetry(state) {
      const hudPhase = container.querySelector('#sfla-hud-phase');
      const hudBest = container.querySelector('#sfla-hud-best');
      const detailEl = container.querySelector('#sfla-phase-detail');
      const kpiIter = container.querySelector('#sfla-kpi-iter');
      const kpiLocal = container.querySelector('#sfla-kpi-local');
      const kpiBest = container.querySelector('#sfla-kpi-best');
      const kpiMean = container.querySelector('#sfla-kpi-mean');
      const kpiPop = container.querySelector('#sfla-kpi-pop');

      if (hudPhase) hudPhase.textContent = state.phaseLabel;
      if (hudBest && state.bestFrog) {
        hudBest.textContent = `Xg: (${state.bestFrog.x.toFixed(2)}, ${state.bestFrog.y.toFixed(2)})`;
      }
      if (detailEl) detailEl.textContent = state.phaseDetail;
      if (kpiIter) kpiIter.textContent = `${state.iteration} / ${state.maxIterations}`;
      if (kpiLocal) kpiLocal.textContent = `Langkah lokal: ${state.localStep} / ${state.localIterations}`;

      const bf = state.bestFrog ? state.bestFrog.fitness : 0;
      if (kpiBest) kpiBest.textContent = bf < 0.001 && bf > 0 ? bf.toExponential(2) : bf.toFixed(4);

      const lastHist = state.history[state.history.length - 1];
      const mf = lastHist ? lastHist.meanFitness : bf;
      if (kpiMean) kpiMean.textContent = mf < 0.01 && mf > 0 ? mf.toExponential(2) : mf.toFixed(3);
      if (kpiPop) kpiPop.textContent = `${engine.populationSize} katak · ${engine.memeplexCount} memeplex`;

      renderConvergenceChart(
        chartCanvas,
        [
          {
            label: 'SFLA',
            color: '#12b0a2',
            fillFlat: 'rgba(18, 176, 162, 0.14)',
            data: state.history
          }
        ],
        {
          title: 'Konvergensi Fitness Terbaik f(Xg)',
          maxIterations: state.maxIterations
        }
      );
    }

    const runner = new SimulationRunner({
      stepsPerSecond: 2.5,
      reducedMotion,
      onStep: () => {
        const st = engine.step();
        updateTelemetry(st);
        return st.phase === 'DONE';
      },
      onRender: (alpha) => {
        const st = engine.getState();
        renderer.render(mainCanvas, st, currentObj, {
          alpha,
          showTrails: chkTrails ? chkTrails.checked : true,
          showOptimum: chkOpt ? chkOpt.checked : true
        });
      }
    });

    runner.onPlayStateChange = (playing) => {
      if (btnPlay) btnPlay.textContent = playing ? 'Jeda (P)' : 'Mulai (P)';
    };

    function reconfigureAndReset() {
      runner.pause();
      engine.configure(readConfig());
      updateTelemetry(engine.getState());
      runner.notifyReset();
    }

    btnPlay?.addEventListener('click', () => runner.togglePlay());
    container.querySelector('#sfla-btn-step')?.addEventListener('click', () => runner.stepOnce());
    container.querySelector('#sfla-btn-cycle')?.addEventListener('click', () => {
      runner.pause();
      const st = engine.stepFullIteration();
      updateTelemetry(st);
      runner.notifyReset();
    });
    container.querySelector('#sfla-btn-reset')?.addEventListener('click', () => {
      engine.reset();
      updateTelemetry(engine.getState());
      runner.notifyReset();
    });

    const objBtns = container.querySelectorAll('#sfla-obj-group .seg-btn');
    objBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        objBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentObj = getObjective(btn.dataset.obj);
        reconfigureAndReset();
      });
    });

    const sliderBindings = [
      ['#sfla-inp-pop', '#sfla-val-pop', true],
      ['#sfla-inp-mem', '#sfla-val-mem', true],
      ['#sfla-inp-loc', '#sfla-val-loc', true],
      ['#sfla-inp-step', '#sfla-val-step', true],
      ['#sfla-inp-speed', '#sfla-val-speed', false]
    ];

    for (const [inpSel, valSel, shouldReset] of sliderBindings) {
      const inp = container.querySelector(inpSel);
      const valEl = container.querySelector(valSel);
      inp?.addEventListener('input', () => {
        if (valEl) valEl.textContent = inp.value;
        if (shouldReset) reconfigureAndReset();
        else runner.setSpeed(Number(inp.value));
      });
    }

    container.querySelector('#sfla-inp-seed')?.addEventListener('change', () => reconfigureAndReset());

    // 2. Sub-Workbench Interaktif
    const subButtons = container.querySelectorAll('#sfla-subtabs .subtab-btn');
    const subViews = {
      partition: container.querySelector('#sfla-sub-partition'),
      leap: container.querySelector('#sfla-sub-leap'),
      metaphor: container.querySelector('#sfla-sub-metaphor'),
      formulas: container.querySelector('#sfla-sub-formulas')
    };

    let activeSub = 'partition';
    subButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSub = btn.dataset.sub || 'partition';
        subButtons.forEach((b) => b.classList.toggle('active', b === btn));
        Object.entries(subViews).forEach(([key, el]) => {
          el?.classList.toggle('hidden', key !== activeSub);
        });
        if (activeSub === 'leap') renderLeapSandbox();
      });
    });

    // Sub-view 1: Partisi Round-Robin interaktif
    const rrFInput = container.querySelector('#sfla-rr-f');
    const rrMInput = container.querySelector('#sfla-rr-m');
    const rrOutput = container.querySelector('#sfla-rr-output');

    function renderRoundRobin() {
      const F = Number(rrFInput?.value || 12);
      const m = Number(rrMInput?.value || 3);
      const fVal = container.querySelector('#sfla-rr-f-val');
      const mVal = container.querySelector('#sfla-rr-m-val');
      if (fVal) fVal.textContent = String(F);
      if (mVal) mVal.textContent = String(m);
      if (!rrOutput) return;

      const groups = Array.from({ length: m }, () => []);
      for (let rank = 1; rank <= F; rank++) {
        const gIdx = (rank - 1) % m;
        groups[gIdx].push(rank);
      }

      rrOutput.innerHTML = groups
        .map((ranks, gIdx) => {
          const col = MEMEPLEX_COLORS[gIdx % MEMEPLEX_COLORS.length];
          const tokens = ranks
            .map((r, i) => {
              const roleTag = i === 0 ? (r === 1 ? ' (Xg, Xb)' : ' (Xb)') : i === ranks.length - 1 ? ' (Xw)' : '';
              return `<span class="frog-token">#${r}${roleTag}</span>`;
            })
            .join('');
          return `
            <div class="mini-card" data-ui style="border-top: 2px solid ${col};">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--ink); font-size:0.86rem;">Memeplex M${gIdx + 1}</strong>
                <span class="tabular" style="font-size:0.75rem; color:var(--ink-faint);">${ranks.length} katak</span>
              </div>
              <div class="frog-token-list">${tokens}</div>
            </div>
          `;
        })
        .join('');
    }

    rrFInput?.addEventListener('input', renderRoundRobin);
    rrMInput?.addEventListener('input', renderRoundRobin);

    // Sub-view 2: Sandbox 3 Skenario Lompatan Xw
    const leapCanvas = container.querySelector('#sfla-leap-canvas');
    let leapScenario = 'xb';

    function renderLeapSandbox() {
      if (!leapCanvas) return;
      const { ctx, width, height } = syncCanvasSize(leapCanvas);
      ctx.fillStyle = '#041126';
      ctx.fillRect(0, 0, width, height);

      // Grid koordinat halus
      ctx.strokeStyle = 'rgba(36, 63, 129, 0.36)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < width; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 36; gy < height; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      const ptXw = { x: width * 0.16, y: height * 0.76 };
      const ptXb = { x: width * 0.56, y: height * 0.42 };
      const ptXg = { x: width * 0.82, y: height * 0.24 };
      const ptFailXb = { x: width * 0.42, y: height * 0.56 };
      const ptSuccXb = { x: width * 0.46, y: height * 0.48 };
      const ptSuccXg = { x: width * 0.64, y: height * 0.38 };
      const ptRand = { x: width * 0.28, y: height * 0.26 };

      const drawNode = (pt, r, fill, label, sub) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.strokeStyle = '#03132b';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ecf3ff';
        ctx.fillText(label, pt.x + r + 7, pt.y - 2);
        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#8a99b2';
        ctx.fillText(sub, pt.x + r + 7, pt.y + 12);
        ctx.restore();
      };

      const drawArc = (from, to, color, dashed, label) => {
        ctx.save();
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 28;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx, my, to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.3;
        if (dashed) ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, mx - 24, my - 6);
        ctx.restore();
      };

      drawNode(ptXw, 9, '#8a99b2', 'Xw Awal', 'f = 18.4');
      drawNode(ptXb, 10, '#12b0a2', 'Xb (Terbaik Memeplex)', 'f = 4.2');
      drawNode(ptXg, 11, '#fdbb16', 'Xg (Terbaik Global)', 'f = 0.3');

      const eqEl = container.querySelector('#sfla-leap-eq');
      const expEl = container.querySelector('#sfla-leap-explain');

      if (leapScenario === 'xb') {
        drawArc(ptXw, ptSuccXb, '#12b0a2', false, 'Lompat ke Xb [Diterima]');
        drawNode(ptSuccXb, 9.5, '#12b0a2', 'Xw Baru', 'f = 6.1 < 18.4');
        if (eqEl) eqEl.textContent = 'D = rand() * (Xb - Xw) ; f(Xw_baru) < f(Xw)';
        if (expEl) expEl.textContent = 'Skenario 1: Lompatan pertama menuju pemimpin memeplex Xb menghasilkan fitness lebih rendah sehingga langsung diterima.';
      } else if (leapScenario === 'xg') {
        drawArc(ptXw, ptFailXb, 'rgba(224, 90, 95, 0.72)', true, 'Uji Xb Gagal (f = 21.0)');
        drawArc(ptXw, ptSuccXg, '#fdbb16', false, 'Koreksi ke Xg [Diterima]');
        drawNode(ptSuccXg, 9.5, '#fdbb16', 'Xw Baru', 'f = 3.8 < 18.4');
        if (eqEl) eqEl.textContent = 'Gagal Xb -> D = rand() * (Xg - Xw) ; f(Xw_baru) < f(Xw)';
        if (expEl) expEl.textContent = 'Skenario 2: Titik antara Xw dan Xb kebetulan berada di punggung bukit lokal, maka Xw melompat menuju pemimpin global Xg.';
      } else {
        drawArc(ptXw, ptFailXb, 'rgba(224, 90, 95, 0.55)', true, 'Gagal Xb & Xg');
        drawArc(ptXw, ptRand, '#26aee4', true, 'Relokasi Acak Domain');
        drawNode(ptRand, 9.5, '#26aee4', 'Katak Acak Baru', 'Eksplorasi segar');
        if (eqEl) eqEl.textContent = 'Xw_baru = X_min + rand() * (X_max - X_min)';
        if (expEl) expEl.textContent = 'Skenario 3: Jika kedua lompatan terarah tetap gagal memperbaiki fitness, katak ditempatkan ulang secara acak untuk menjaga keragaman.';
      }
    }

    container.querySelectorAll('[data-leap]').forEach((btn) => {
      btn.addEventListener('click', () => {
        leapScenario = btn.dataset.leap || 'xb';
        renderLeapSandbox();
      });
    });

    registerHooks?.({
      togglePlay: () => runner.togglePlay(),
      step: () => runner.stepOnce(),
      reset: () => {
        engine.reset();
        updateTelemetry(engine.getState());
        runner.notifyReset();
      }
    });

    const onResize = () => {
      updateTelemetry(engine.getState());
      runner.notifyReset();
      if (activeSub === 'leap') renderLeapSandbox();
    };
    window.addEventListener('resize', onResize);

    renderRoundRobin();
    updateTelemetry(engine.getState());
    runner.startLoop();

    return () => {
      window.removeEventListener('resize', onResize);
      runner.destroy();
    };
  }
};

