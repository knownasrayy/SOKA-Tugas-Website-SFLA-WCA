/**
 * Tab 3: Laboratorium Simulasi Water Cycle Algorithm (WCA)
 * Menampilkan simulasi live 2D Siklus Hidrologi (Aliran, Sungai, Laut, lingkaran penguapan dmax,
 * pertukaran peran, dan hujan baru) beserta meja kerja interaktif 4 mekanisme internal WCA.
 */

import { getObjective } from '../core/objectives.js';
import { SimulationRunner } from '../core/engine.js';
import { WCAEngine } from '../algorithms/wca.js';
import { WCARenderer } from '../render/wcaRenderer.js';
import { renderConvergenceChart } from '../render/chart.js';
import { syncCanvasSize } from '../render/contourRenderer.js';

export const tabWca = {
  id: 'wca',
  label: 'Simulasi WCA',
  title: 'Water Cycle Algorithm (WCA)',
  notes: `
    <p><strong>Panduan Demonstrasi Tab Simulasi WCA:</strong></p>
    <ul>
      <li>Tekan <strong>Langkah (S)</strong> untuk memperlihatkan urutan deterministik siklus air: <code>INIT &rarr; HIERARCHY &rarr; FLOW &rarr; ROLE_SWAP &rarr; EVAPORATION &rarr; RAIN</code>.</li>
      <li>Amati lingkaran putus-putus <code>dmax</code> di sekeliling <strong>LAUT</strong> yang menyusut secara adaptif setiap iterasi. Saat sungai atau aliran masuk ke dalam radius <code>dmax</code>, air menguap dan turun kembali sebagai hujan baru.</li>
      <li>Gunakan meja kerja di bawah untuk menguji alokasi aliran proporsional <code>NSn</code> dan efek konstanta <code>C = 2</code>.</li>
    </ul>
  `,

  mount(container, { reducedMotion, registerHooks }) {
    container.innerHTML = `
      <header class="tab-lead">
        <div class="tab-lead-main">
          <div class="tab-breadcrumb">
            <span class="tab-breadcrumb-dot"></span>
            <span>Algoritma Siklus Hidrologi · Eskandar et al. (2012)</span>
          </div>
          <h1 class="tab-title">Water Cycle Algorithm (WCA)</h1>
          <p class="tab-desc">
            Memodelkan gravitasi aliran permukaan dari <strong>Aliran</strong> menuju <strong>Sungai</strong> dan bermuara di <strong>Laut</strong> (solusi terbaik global), dipadukan dengan kondisi penguapan adaptif <code>dmax</code> dan presipitasi hujan untuk mencegah konvergensi prematur.
          </p>
        </div>
        <div class="tab-lead-meta">
          <span class="status-chip sky">Urutan: Hierarchy &rarr; Flow &rarr; Role Swap &rarr; Evaporation &rarr; Rain</span>
        </div>
      </header>

      <!-- Laboratorium Utama WCA (7 Kolom Kanvas : 5 Kolom Kontrol & Telemetri) -->
      <div class="grid-12">
        <div class="span-7 panel-flush" data-ui>
          <div class="stage-caption-bar" data-ui>
            <div class="seg-group" data-ui id="wca-obj-group">
              <button type="button" class="seg-btn active" data-obj="rastrigin">Rastrigin</button>
              <button type="button" class="seg-btn" data-obj="ackley">Ackley</button>
              <button type="button" class="seg-btn" data-obj="sphere">Sphere</button>
            </div>
            <div style="display:flex; align-items:center; gap:0.85rem; font-size:0.8rem;">
              <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer;">
                <input type="checkbox" id="wca-chk-trails" checked /> Jaringan Aliran
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer;">
                <input type="checkbox" id="wca-chk-opt" checked /> Target (0, 0)
              </label>
            </div>
          </div>

          <div class="canvas-stage" data-ui>
            <div class="canvas-hud" data-ui>
              <div class="hud-status" data-ui>
                <span class="hud-dot"></span>
                <span id="wca-hud-phase">Inisialisasi Tetesan</span>
              </div>
              <div class="hud-coords" data-ui id="wca-hud-sea">Laut: (0.00, 0.00)</div>
            </div>
            <canvas id="wca-main-canvas"></canvas>
          </div>

          <div class="stage-caption-bar" data-ui>
            <span id="wca-phase-detail">Menyebar populasi tetesan air awal di bentang topografi.</span>
            <div class="legend-inline">
              <span class="legend-item"><span class="swatch-round" style="background:#127bbe; border:2px solid #fdbb16;"></span>Laut (Terbaik)</span>
              <span class="legend-item"><span class="swatch" style="background:#26aee4; transform:rotate(45deg);"></span>Sungai (S1..Sn)</span>
              <span class="legend-item"><span class="swatch-round" style="background:#cee5ff;"></span>Aliran</span>
            </div>
          </div>
        </div>

        <div class="span-5 panel" data-ui>
          <div class="ctrl-toolbar" data-ui>
            <button type="button" class="btn btn-wca" id="wca-btn-play">Mulai (P)</button>
            <button type="button" class="btn btn-gold" id="wca-btn-step">Langkah (S)</button>
            <button type="button" class="btn" id="wca-btn-cycle">+1 Siklus</button>
            <button type="button" class="btn" id="wca-btn-reset">Reset (R)</button>
          </div>

          <div class="kpi-strip" data-ui>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Iterasi Siklus</span>
              <span class="kpi-val" id="wca-kpi-iter">0 / 40</span>
              <span class="kpi-sub" id="wca-kpi-events">0 tukar · 0 hujan</span>
            </div>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Fitness Laut f(Xsea)</span>
              <span class="kpi-val gold" id="wca-kpi-best">0.000</span>
              <span class="kpi-sub">Target minimum: 0</span>
            </div>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Radius dmax</span>
              <span class="kpi-val sky" id="wca-kpi-dmax">0.450</span>
              <span class="kpi-sub" id="wca-kpi-pop">24 tetes · Nsr = 4</span>
            </div>
          </div>

          <div class="chart-box" data-ui>
            <canvas id="wca-chart-canvas"></canvas>
          </div>

          <div class="panel-navy" data-ui>
            <div class="panel-header" style="margin-bottom:0.55rem;">
              <strong style="font-size:0.86rem; color:var(--ink);">Parameter Eksperimen WCA</strong>
              <span style="font-size:0.75rem; color:var(--ink-faint);">Perubahan me-reset siklus</span>
            </div>
            <div class="param-grid">
              <div class="param-item">
                <label for="wca-inp-pop"><span>Populasi Tetesan (Npop)</span><span class="val" id="wca-val-pop">24</span></label>
                <input type="range" id="wca-inp-pop" min="12" max="48" step="4" value="24" />
              </div>
              <div class="param-item">
                <label for="wca-inp-nsr"><span>Sungai + Laut (Nsr)</span><span class="val" id="wca-val-nsr">4</span></label>
                <input type="range" id="wca-inp-nsr" min="2" max="8" step="1" value="4" />
              </div>
              <div class="param-item">
                <label for="wca-inp-dmax"><span>Radius Awal (dmax0)</span><span class="val" id="wca-val-dmax">0.45</span></label>
                <input type="range" id="wca-inp-dmax" min="0.10" max="1.20" step="0.05" value="0.45" />
              </div>
              <div class="param-item">
                <label for="wca-inp-c"><span>Konstanta Aliran (C)</span><span class="val" id="wca-val-c">2.0</span></label>
                <input type="range" id="wca-inp-c" min="1.2" max="2.8" step="0.2" value="2.0" />
              </div>
              <div class="param-item">
                <label for="wca-inp-speed"><span>Kecepatan (langkah/dtk)</span><span class="val" id="wca-val-speed">2.5</span></label>
                <input type="range" id="wca-inp-speed" min="0.5" max="12" step="0.5" value="2.5" />
              </div>
              <div class="param-item">
                <label for="wca-inp-seed"><span>Seed PRNG</span><span class="val">Tetap</span></label>
                <input type="number" class="field-input" id="wca-inp-seed" value="42" min="1" max="99999" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Meja Kerja Interaktif Mekanisme Hidrologi WCA -->
      <section class="panel" data-ui>
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Bedah Mekanisme Hidrologi &amp; Formulasi Matematis WCA</h2>
            <p class="panel-subtitle">Pilih sub-modul untuk mempelajari pembagian debit aliran proporsional NSn, vektor aliran C=2, dan penyusutan radius penguapan dmax.</p>
          </div>
        </div>

        <div class="subtab-bar" data-ui id="wca-subtabs">
          <button type="button" class="subtab-btn active" data-ui data-sub="hierarchy">Hierarki &amp; Intensitas NSn</button>
          <button type="button" class="subtab-btn" data-ui data-sub="flow">Sandbox Aliran C=2 &amp; Tukar Peran</button>
          <button type="button" class="subtab-btn" data-ui data-sub="evap">Penguapan dmax &amp; Hujan Baru</button>
          <button type="button" class="subtab-btn" data-ui data-sub="formulas">Rumus &amp; Tabel 6 Tahap</button>
        </div>

        <!-- Sub-view 1: Hierarki & Intensitas NSn -->
        <div id="wca-sub-hierarchy" class="wca-subview">
          <div class="grid-12" style="margin-top:0.35rem;">
            <div class="span-5 panel-navy" data-ui>
              <strong style="color:var(--ink); font-size:0.92rem;">Alokasi Proporsional Anak Sungai (NSn)</strong>
              <p class="panel-subtitle" style="margin:0.35rem 0 0.75rem;">
                Tetesan terbaik ke-1 diangkat menjadi <strong>Laut</strong>, peringkat 2 hingga <code>Nsr</code> menjadi <strong>Sungai</strong>, dan sisanya <code>N_stream = Npop - Nsr</code> dibagi secara proporsional mengikuti keunggulan fitness masing-masing muara.
              </p>
              <div class="param-grid">
                <div class="param-item">
                  <label for="wca-ns-pop"><span>Contoh Npop</span><span class="val" id="wca-ns-pop-val">24</span></label>
                  <input type="range" id="wca-ns-pop" min="12" max="40" step="2" value="24" />
                </div>
                <div class="param-item">
                  <label for="wca-ns-nsr"><span>Contoh Nsr</span><span class="val" id="wca-ns-nsr-val">4</span></label>
                  <input type="range" id="wca-ns-nsr" min="2" max="6" step="1" value="4" />
                </div>
              </div>
              <div class="formula-block" data-ui style="margin-top:0.75rem;">
                <code>C_n = f(X_n) - f(X_{Nsr+1}) ; NS_n = round(|C_n / sum(C)| * N_stream)</code>
              </div>
            </div>
            <div class="span-7">
              <div id="wca-ns-output" class="mini-card-grid"></div>
            </div>
          </div>
        </div>

        <!-- Sub-view 2: Sandbox Aliran C=2 & Pertukaran Peran -->
        <div id="wca-sub-flow" class="wca-subview hidden">
          <div class="grid-12" style="margin-top:0.35rem;">
            <div class="span-7">
              <div class="canvas-stage-compact" data-ui>
                <canvas id="wca-flow-canvas"></canvas>
              </div>
            </div>
            <div class="span-5 panel-navy" data-ui style="display:flex; flex-direction:column; gap:0.65rem;">
              <strong style="color:var(--ink); font-size:0.92rem;">Mengapa Konstanta Aliran C = 2 Penting?</strong>
              <p class="panel-subtitle" style="margin:0;">
                Dengan <code>X_baru = X + rand(0,1) * C * (X_induk - X)</code> dan <code>C = 2</code>, jarak aliran mencakup rentang <code>[0, 2d]</code>. Artinya tetesan air tidak hanya berhenti di antara dirinya dan sungai, tetapi juga mampu melampaui posisi sungai (<em>overshoot</em>) untuk menemukan cekungan yang lebih rendah di sisi seberang.
              </p>
              <div style="display:flex; flex-direction:column; gap:0.45rem;">
                <button type="button" class="btn btn-wca" data-flow="normal">1. Aliran Normal Menuju Sungai (0 &lt; r*C &lt; 1)</button>
                <button type="button" class="btn btn-gold" data-flow="swap">2. Overshoot (1 &lt; r*C &le; 2) &rarr; Tukar Peran!</button>
              </div>
              <div class="formula-block" data-ui>
                <code id="wca-flow-eq">X_stream(t+1) = X_stream(t) + rand() * 2 * (X_river - X_stream)</code>
              </div>
            </div>
          </div>
        </div>

        <!-- Sub-view 3: Penguapan dmax & Hujan -->
        <div id="wca-sub-evap" class="wca-subview hidden">
          <div class="grid-12" style="margin-top:0.35rem;">
            <div class="span-6 panel-navy" data-ui>
              <strong style="color:var(--ink); font-size:0.92rem;">Simulator Penyusutan Adaptif Radius Penguapan <code>dmax(t)</code></strong>
              <p class="panel-subtitle" style="margin:0.35rem 0 0.75rem;">
                Geser progres iterasi di bawah untuk melihat penyusutan linier <code>dmax</code>. Pada awal pencarian, <code>dmax</code> besar sehingga memicu eksplorasi luas; mendekati akhir iterasi, <code>dmax</code> mengecil untuk memfokuskan eksploitasi presisi di sekitar Laut.
              </p>
              <div class="param-item">
                <label for="wca-evap-iter"><span>Iterasi ke-t (dari 40)</span><span class="val" id="wca-evap-iter-val">10</span></label>
                <input type="range" id="wca-evap-iter" min="0" max="40" step="1" value="10" />
              </div>
              <div class="kpi-strip" data-ui style="margin-top:0.75rem;">
                <div class="kpi-cell" data-ui>
                  <span class="kpi-label">dmax(0) Awal</span>
                  <span class="kpi-val">0.450</span>
                </div>
                <div class="kpi-cell" data-ui>
                  <span class="kpi-label">dmax(t) Saat Ini</span>
                  <span class="kpi-val sky" id="wca-evap-cur">0.338</span>
                </div>
                <div class="kpi-cell" data-ui>
                  <span class="kpi-label">Fokus Fase</span>
                  <span class="kpi-val gold" id="wca-evap-focus">Transisi</span>
                </div>
              </div>
            </div>
            <div class="span-6" style="display:flex; flex-direction:column; gap:0.65rem;">
              <div class="formula-block" data-ui>
                <code>Jika ||X_river - X_sea|| &lt; d_max  atau  rand() &lt; 0.1  &rarr;  Uapkan &amp; Hujan</code>
                <div class="formula-note">Mencegah seluruh sungai menumpuk di titik Laut yang berisiko merupakan minimum lokal.</div>
              </div>
              <div class="formula-block" data-ui>
                <code>Hujan Global: X_baru = X_min + rand() * (X_max - X_min)</code>
                <div class="formula-note">Diterapkan pada sungai yang menguap untuk menjelajahi area baru ruang pencarian.</div>
              </div>
              <div class="formula-block" data-ui>
                <code>Hujan Lokal: X_baru = X_sea + sqrt(mu) * randn(0, 1)</code>
                <div class="formula-note">Diterapkan pada aliran langsung ke Laut untuk memperhalus pencarian di sekitar muara terbaik.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sub-view 4: Rumus & Tabel 6 Tahap -->
        <div id="wca-sub-formulas" class="wca-subview hidden">
          <div class="table-wrap" style="margin-top:0.35rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tahap Hidrologi</th>
                  <th>Operasi Matematis WCA</th>
                  <th>Tujuan Optimasi</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Inisialisasi Hujan</strong></td><td>Bangkitkan <code>Npop</code> tetesan awal seragam dan evaluasi nilai objektif <code>f(X_i)</code>.</td><td>Sampling ruang solusi awal</td></tr>
                <tr><td><strong>Pembentukan Hierarki</strong></td><td>Urutkan tetesan: terbaik #1 jadi <strong>Laut</strong>, peringkat 2..<code>Nsr</code> jadi <strong>Sungai</strong>, sisanya <strong>Aliran</strong>; hitung kuota <code>NS_n</code>.</td><td>Pembagian peran berbasis intensitas fitness</td></tr>
                <tr><td><strong>Aliran Menuju Muara</strong></td><td>Aliran bergerak menuju Sungai/Laut induknya dan Sungai bergerak menuju Laut memakai faktor <code>rand() * C</code>.</td><td>Eksploitasi terarah ke lembah terendah</td></tr>
                <tr><td><strong>Pertukaran Peran</strong></td><td>Jika Aliran lebih baik dari Sungainya (atau Sungai lebih baik dari Laut), tukar posisi dan perannya seketika.</td><td>Elitisme dinamis tanpa menunggu akhir iterasi</td></tr>
                <tr><td><strong>Kondisi Penguapan</strong></td><td>Periksa apakah jarak Euclidean sungai/aliran ke Laut kurang dari <code>d_max</code>.</td><td>Deteksi kerumunan stagnan</td></tr>
                <tr><td><strong>Presipitasi &amp; Update dmax</strong></td><td>Jatuhkan tetesan hujan baru bagi agen yang menguap dan kurangi <code>d_max(t+1) = d_max(t) - d_max(0)/Iter_maks</code>.</td><td>Transisi mulus eksplorasi ke eksploitasi</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;

    // 1. Setup Mesin Utama WCA
    const mainCanvas = container.querySelector('#wca-main-canvas');
    const chartCanvas = container.querySelector('#wca-chart-canvas');
    const chkTrails = container.querySelector('#wca-chk-trails');
    const chkOpt = container.querySelector('#wca-chk-opt');
    const btnPlay = container.querySelector('#wca-btn-play');

    let currentObj = getObjective('rastrigin');
    const renderer = new WCARenderer();

    function readConfig() {
      const pop = Number(container.querySelector('#wca-inp-pop')?.value || 24);
      const nsr = Number(container.querySelector('#wca-inp-nsr')?.value || 4);
      const dmax = Number(container.querySelector('#wca-inp-dmax')?.value || 0.45);
      const flowC = Number(container.querySelector('#wca-inp-c')?.value || 2.0);
      const seed = Number(container.querySelector('#wca-inp-seed')?.value || 42);
      return {
        objective: currentObj,
        populationSize: pop,
        nsr,
        dmax,
        flowConstant: flowC,
        maxIterations: 40,
        seed
      };
    }

    const engine = new WCAEngine(readConfig());

    function updateTelemetry(state) {
      const hudPhase = container.querySelector('#wca-hud-phase');
      const hudSea = container.querySelector('#wca-hud-sea');
      const detailEl = container.querySelector('#wca-phase-detail');
      const kpiIter = container.querySelector('#wca-kpi-iter');
      const kpiEvents = container.querySelector('#wca-kpi-events');
      const kpiBest = container.querySelector('#wca-kpi-best');
      const kpiDmax = container.querySelector('#wca-kpi-dmax');
      const kpiPop = container.querySelector('#wca-kpi-pop');

      if (hudPhase) hudPhase.textContent = state.phaseLabel;
      if (hudSea && state.bestSea) {
        hudSea.textContent = `Laut: (${state.bestSea.x.toFixed(2)}, ${state.bestSea.y.toFixed(2)})`;
      }
      if (detailEl) detailEl.textContent = state.phaseDetail;
      if (kpiIter) kpiIter.textContent = `${state.iteration} / ${state.maxIterations}`;
      if (kpiEvents) {
        kpiEvents.textContent = `${state.swaps.length} tukar · ${state.rainedDrops.length} hujan`;
      }

      const bf = state.bestSea ? state.bestSea.fitness : 0;
      if (kpiBest) kpiBest.textContent = bf < 0.001 && bf > 0 ? bf.toExponential(2) : bf.toFixed(4);
      if (kpiDmax) kpiDmax.textContent = state.dmax.toFixed(3);
      if (kpiPop) kpiPop.textContent = `${engine.populationSize} tetes · Nsr = ${engine.nsr}`;

      renderConvergenceChart(
        chartCanvas,
        [
          {
            label: 'WCA',
            color: '#26aee4',
            fillFlat: 'rgba(38, 174, 228, 0.14)',
            data: state.history
          }
        ],
        {
          title: 'Konvergensi Fitness Laut f(Xsea)',
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
      onRender: (alpha, now) => {
        const st = engine.getState();
        renderer.render(mainCanvas, st, currentObj, {
          alpha,
          timestamp: now,
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
    container.querySelector('#wca-btn-step')?.addEventListener('click', () => runner.stepOnce());
    container.querySelector('#wca-btn-cycle')?.addEventListener('click', () => {
      runner.pause();
      const st = engine.stepFullIteration();
      updateTelemetry(st);
      runner.notifyReset();
    });
    container.querySelector('#wca-btn-reset')?.addEventListener('click', () => {
      engine.reset();
      updateTelemetry(engine.getState());
      runner.notifyReset();
    });

    const objBtns = container.querySelectorAll('#wca-obj-group .seg-btn');
    objBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        objBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentObj = getObjective(btn.dataset.obj);
        reconfigureAndReset();
      });
    });

    const sliderBindings = [
      ['#wca-inp-pop', '#wca-val-pop', true],
      ['#wca-inp-nsr', '#wca-val-nsr', true],
      ['#wca-inp-dmax', '#wca-val-dmax', true],
      ['#wca-inp-c', '#wca-val-c', true],
      ['#wca-inp-speed', '#wca-val-speed', false]
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

    container.querySelector('#wca-inp-seed')?.addEventListener('change', () => reconfigureAndReset());

    // 2. Sub-Workbench WCA
    const subButtons = container.querySelectorAll('#wca-subtabs .subtab-btn');
    const subViews = {
      hierarchy: container.querySelector('#wca-sub-hierarchy'),
      flow: container.querySelector('#wca-sub-flow'),
      evap: container.querySelector('#wca-sub-evap'),
      formulas: container.querySelector('#wca-sub-formulas')
    };

    let activeSub = 'hierarchy';
    subButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSub = btn.dataset.sub || 'hierarchy';
        subButtons.forEach((b) => b.classList.toggle('active', b === btn));
        Object.entries(subViews).forEach(([key, el]) => {
          el?.classList.toggle('hidden', key !== activeSub);
        });
        if (activeSub === 'flow') renderFlowSandbox();
      });
    });

    // Sub-view 1: Kalkulator Alokasi Proporsional NSn
    const nsPopInp = container.querySelector('#wca-ns-pop');
    const nsNsrInp = container.querySelector('#wca-ns-nsr');
    const nsOutput = container.querySelector('#wca-ns-output');

    function renderNsAllocation() {
      const npop = Number(nsPopInp?.value || 24);
      const nsr = Math.min(Math.floor(npop / 2), Number(nsNsrInp?.value || 4));
      const popVal = container.querySelector('#wca-ns-pop-val');
      const nsrVal = container.querySelector('#wca-ns-nsr-val');
      if (popVal) popVal.textContent = String(npop);
      if (nsrVal) nsrVal.textContent = String(nsr);
      if (!nsOutput) return;

      const nStreams = npop - nsr;
      // Contoh profil biaya realistis terurut menaik: Laut terkecil, diikuti Sungai 1..Nsr-1, lalu batas Nsr+1
      const sampleCosts = Array.from({ length: nsr + 1 }, (_, i) => 1.2 + i * i * 2.4);
      const refCost = sampleCosts[nsr];
      const cn = sampleCosts.slice(0, nsr).map((c) => Math.abs(c - refCost));
      const sumCn = cn.reduce((a, b) => a + b, 0) || 1;

      const quotas = cn.map((val) => Math.round((val / sumCn) * nStreams));
      let diff = nStreams - quotas.reduce((a, b) => a + b, 0);
      let idx = 0;
      while (diff !== 0) {
        if (diff > 0) {
          quotas[idx % nsr] += 1;
          diff -= 1;
        } else if (quotas[idx % nsr] > 0) {
          quotas[idx % nsr] -= 1;
          diff += 1;
        }
        idx += 1;
      }

      nsOutput.innerHTML = quotas
        .map((q, i) => {
          const isSea = i === 0;
          const borderCol = isSea ? '#fdbb16' : '#26aee4';
          const title = isSea ? 'LAUT (Peringkat #1)' : `Sungai S${i} (Peringkat #${i + 1})`;
          const pct = Math.round((q / Math.max(1, nStreams)) * 100);
          return `
            <div class="mini-card" data-ui style="border-top: 2px solid ${borderCol};">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--ink); font-size:0.86rem;">${title}</strong>
                <span class="tabular" style="font-size:0.78rem; color:${borderCol}; font-weight:700;">${q} aliran (${pct}%)</span>
              </div>
              <span class="tabular" style="font-size:0.78rem; color:var(--ink-muted);">Contoh biaya f = ${sampleCosts[i].toFixed(1)}</span>
              <div style="height:6px; background:var(--its-navy); border-radius:3px; overflow:hidden;">
                <div style="height:100%; width:${pct}%; background:${borderCol};"></div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    nsPopInp?.addEventListener('input', renderNsAllocation);
    nsNsrInp?.addEventListener('input', renderNsAllocation);

    // Sub-view 2: Sandbox Aliran C=2 & Tukar Peran
    const flowCanvas = container.querySelector('#wca-flow-canvas');
    let flowMode = 'normal';

    function renderFlowSandbox() {
      if (!flowCanvas) return;
      const { ctx, width, height } = syncCanvasSize(flowCanvas);
      ctx.fillStyle = '#041126';
      ctx.fillRect(0, 0, width, height);

      const streamPt = { x: width * 0.16, y: height * 0.62 };
      const riverPt = { x: width * 0.52, y: height * 0.48 };
      const maxReachPt = { x: width * 0.88, y: height * 0.34 };

      // Zona jangkauan [0, 2d]
      ctx.save();
      ctx.strokeStyle = 'rgba(117, 189, 224, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(streamPt.x, streamPt.y);
      ctx.lineTo(maxReachPt.x, maxReachPt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#8a99b2';
      ctx.fillText('Batas jangkauan maksimum 2d (saat rand = 1, C = 2)', riverPt.x - 20, riverPt.y + 42);

      const targetPt =
        flowMode === 'normal'
          ? { x: width * 0.39, y: height * 0.53 }
          : { x: width * 0.74, y: height * 0.39 };

      // Panah aliran
      ctx.beginPath();
      ctx.moveTo(streamPt.x, streamPt.y);
      ctx.lineTo(targetPt.x, targetPt.y);
      ctx.strokeStyle = flowMode === 'swap' ? '#fdbb16' : '#26aee4';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Node Aliran awal
      ctx.beginPath();
      ctx.arc(streamPt.x, streamPt.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#cee5ff';
      ctx.fill();
      ctx.fillStyle = '#ecf3ff';
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Aliran Awal (f = 14.2)', streamPt.x - 10, streamPt.y + 24);

      // Node Sungai
      ctx.beginPath();
      ctx.moveTo(riverPt.x, riverPt.y - 10);
      ctx.lineTo(riverPt.x + 10, riverPt.y);
      ctx.lineTo(riverPt.x, riverPt.y + 10);
      ctx.lineTo(riverPt.x - 10, riverPt.y);
      ctx.closePath();
      ctx.fillStyle = '#26aee4';
      ctx.fill();
      ctx.fillStyle = '#ecf3ff';
      ctx.fillText('Sungai Induk (f = 5.4)', riverPt.x - 36, riverPt.y - 16);

      // Node Posisi Baru
      ctx.beginPath();
      ctx.arc(targetPt.x, targetPt.y, 9.5, 0, Math.PI * 2);
      ctx.fillStyle = flowMode === 'swap' ? '#fdbb16' : '#26aee4';
      ctx.fill();

      const eqEl = container.querySelector('#wca-flow-eq');
      if (flowMode === 'normal') {
        ctx.fillStyle = '#75bde0';
        ctx.fillText('Posisi Baru (f = 8.1 > 5.4, tetap Aliran)', targetPt.x - 45, targetPt.y - 15);
        if (eqEl) eqEl.textContent = 'rand = 0.64 -> bergerak 1.28d mendekati Sungai; peran tetap.';
      } else {
        ctx.fillStyle = '#fdbb16';
        ctx.fillText('Overshoot! (f = 2.1 < 5.4 -> NAIK JADI SUNGAI)', targetPt.x - 75, targetPt.y - 15);
        if (eqEl) eqEl.textContent = 'rand = 0.82 -> bergerak 1.64d melampaui Sungai & menemukan lembah lebih dalam -> TUKAR PERAN!';
      }

      ctx.restore();
    }

    container.querySelectorAll('[data-flow]').forEach((btn) => {
      btn.addEventListener('click', () => {
        flowMode = btn.dataset.flow || 'normal';
        renderFlowSandbox();
      });
    });

    // Sub-view 3: Slider penyusutan dmax
    const evapIterInp = container.querySelector('#wca-evap-iter');
    function updateEvapCalc() {
      const t = Number(evapIterInp?.value || 10);
      const tMax = 40;
      const d0 = 0.45;
      const dCur = Math.max(0.00001, d0 * (1 - t / tMax));

      const tEl = container.querySelector('#wca-evap-iter-val');
      const curEl = container.querySelector('#wca-evap-cur');
      const focEl = container.querySelector('#wca-evap-focus');
      if (tEl) tEl.textContent = String(t);
      if (curEl) curEl.textContent = dCur.toFixed(3);
      if (focEl) {
        focEl.textContent = t < 14 ? 'Eksplorasi Luas' : t < 30 ? 'Transisi' : 'Eksploitasi Halus';
      }
    }
    evapIterInp?.addEventListener('input', updateEvapCalc);

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
      if (activeSub === 'flow') renderFlowSandbox();
    };
    window.addEventListener('resize', onResize);

    renderNsAllocation();
    updateEvapCalc();
    updateTelemetry(engine.getState());
    runner.startLoop();

    return () => {
      window.removeEventListener('resize', onResize);
      runner.destroy();
    };
  }
};

