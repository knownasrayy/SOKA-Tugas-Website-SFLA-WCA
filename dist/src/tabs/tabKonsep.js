/**
 * Tab 1: Konsep & Lanskap Optimasi Metaheuristik
 * Memuat identitas mata kuliah SOKA ITS, eksplorasi interaktif lanskap kontur 2D (klik untuk evaluasi f(x,y)),
 * simulator dinamika Eksplorasi vs Eksploitasi, dan pengantar taksonomi SFLA & WCA.
 */

import { OBJECTIVES, getObjective, clampCoord } from '../core/objectives.js';
import { createRng } from '../core/rng.js';
import { ContourMapCache, syncCanvasSize } from '../render/contourRenderer.js';

const TEAM_STORAGE_KEY = 'soka_its_team_identity_v2';

export const tabKonsep = {
  id: 'konsep',
  label: 'Konsep & Lanskap',
  title: 'Konsep Optimasi Metaheuristik & Lanskap Fungsi Objektif',
  notes: `
    <p><strong>Fokus Pemaparan Tab Konsep &amp; Lanskap:</strong></p>
    <ul>
      <li>Jelaskan mengapa masalah alokasi sumber daya komputasi awan (seperti penjadwalan ribuan tugas ke puluhan VM heterogen) bersifat <em>NP-hard</em> dan penuh jebakan minimum lokal.</li>
      <li>Klik beberapa titik pada <strong>Peta Kontur 2D Rastrigin</strong> untuk menunjukkan bahwa lembah di sekitar <code>(0.99, 0.99)</code> terlihat rendah secara lokal namun masih bernilai <code>f &approx; 1.98</code>, sedangkan global minimum sejati berada di <code>(0, 0)</code> dengan <code>f = 0</code>.</li>
      <li>Gunakan <strong>Simulator Eksplorasi vs Eksploitasi</strong> di bagian bawah untuk mendemonstrasikan kegagalan eksploitasi sempit dibanding pencarian metaheuristik seimbang.</li>
    </ul>
  `,

  mount(container, { workspace, registerHooks }) {
    let savedTeam = 'Kelompok SOKA ITS (Klik untuk isi Nama & NRP)';
    try {
      const fromStore = localStorage.getItem(TEAM_STORAGE_KEY);
      if (fromStore && fromStore.trim()) savedTeam = fromStore.trim();
    } catch (_e) {
      // Ignore storage restrictions
    }

    container.innerHTML = `
      <!-- Bar Identitas Akademik ITS -->
      <div class="identity-bar" data-ui>
        <div class="identity-meta">
          <span><strong>Mata Kuliah:</strong> Strategi Optimasi Komputasi Awan (SOKA)</span>
          <span><strong>Institusi:</strong> Institut Teknologi Sepuluh Nopember</span>
          <div class="identity-edit" data-ui>
            <span><strong>Penyaji:</strong></span>
            <span id="konsep-team-input" class="team-editable" data-ui contenteditable="true" spellcheck="false" role="textbox" aria-label="Nama kelompok dan NRP"></span>
          </div>
        </div>
        <div class="tab-lead-meta">
          <button type="button" class="btn btn-primary" id="konsep-goto-sfla">Buka Lab SFLA</button>
          <button type="button" class="btn" id="konsep-goto-wca">Buka Lab WCA</button>
        </div>
      </div>

      <!-- Judul Modul Utama -->
      <header class="tab-lead">
        <div class="tab-lead-main">
          <div class="tab-breadcrumb">
            <span class="tab-breadcrumb-dot"></span>
            <span>Fondasi Optimasi Numerik &amp; Metaheuristik Populasi</span>
          </div>
          <h1 class="tab-title">Lanskap Fungsi Objektif &amp; Tantangan Minimum Lokal</h1>
          <p class="tab-desc">
            Optimasi bertujuan mencari vektor variabel keputusan <code>X*</code> yang meminimalkan fungsi biaya <code>f(X)</code>. Pada permukaan multimodal seperti Rastrigin dan Ackley, metode berbasis gradien tunggal mudah terjebak di cekungan lokal sehingga diperlukan kolaborasi populasi agen.
          </p>
        </div>
      </header>

      <!-- Bagian 1: Eksplorasi Interaktif Peta Kontur 2D -->
      <div class="grid-12">
        <div class="span-7 panel-flush" data-ui>
          <div class="stage-caption-bar" data-ui>
            <div>
              <strong>Peta Topografi Fungsi Benchmark 2D</strong>
              <span style="margin-left: 0.45rem;">(Klik titik mana pun pada kanvas untuk menguji nilai fitness)</span>
            </div>
            <div class="seg-group" data-ui id="konsep-obj-tabs">
              <button type="button" class="seg-btn active" data-obj="rastrigin">Rastrigin</button>
              <button type="button" class="seg-btn" data-obj="ackley">Ackley</button>
              <button type="button" class="seg-btn" data-obj="sphere">Sphere</button>
            </div>
          </div>

          <div class="canvas-stage" data-ui>
            <div class="canvas-hud" data-ui>
              <div class="hud-status" data-ui>
                <span class="hud-dot"></span>
                <span id="konsep-hud-name">Rastrigin (Multimodal)</span>
              </div>
              <div class="hud-coords" data-ui id="konsep-hud-probe">Titik Uji: (1.85, 1.40)</div>
            </div>
            <canvas id="konsep-landscape-canvas"></canvas>
          </div>

          <div class="stage-caption-bar" data-ui>
            <div class="legend-inline">
              <span class="legend-item"><span class="swatch-round" style="background:#fdbb16;"></span>Global Minimum (0, 0)</span>
              <span class="legend-item"><span class="swatch-round" style="background:#e05a5f;"></span>Contoh Jebakan Lokal</span>
              <span class="legend-item"><span class="swatch-round" style="background:#26aee4;"></span>Titik Uji Klik</span>
            </div>
            <button type="button" class="btn" id="konsep-btn-sample-trap">Uji Titik Jebakan Lokal</button>
          </div>
        </div>

        <div class="span-5 panel" data-ui>
          <div>
            <h2 class="panel-title">Telemetri Evaluasi Titik &amp; Formulasi</h2>
            <p class="panel-subtitle">Perbandingan nilai fungsi objektif pada koordinat pilihan Anda terhadap titik optimum global.</p>
          </div>

          <div class="kpi-strip" data-ui>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Koordinat Uji (x, y)</span>
              <span class="kpi-val sky" id="konsep-kpi-xy">(1.85, 1.40)</span>
              <span class="kpi-sub" id="konsep-kpi-domain">Domain [-5.12, 5.12]</span>
            </div>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Nilai Biaya f(x, y)</span>
              <span class="kpi-val" id="konsep-kpi-fx">0.000</span>
              <span class="kpi-sub">Target minimum: 0.000</span>
            </div>
            <div class="kpi-cell" data-ui>
              <span class="kpi-label">Jarak ke Optimum</span>
              <span class="kpi-val gold" id="konsep-kpi-dist">0.000</span>
              <span class="kpi-sub">Radius Euclidean</span>
            </div>
          </div>

          <div class="formula-block" data-ui>
            <code id="konsep-formula-text">f(x, y) = 20 + (x² - 10 cos 2πx) + (y² - 10 cos 2πy)</code>
            <div class="formula-note" id="konsep-formula-char">Karakteristik: Banyak lembah lokal periodik yang mengelilingi pusat (0, 0).</div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fungsi Benchmark</th>
                  <th>Sifat Lanskap</th>
                  <th class="num">Domain</th>
                  <th class="num">f(0, 0)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Sphere</strong></td>
                  <td>Unimodal konveks mulus (uji kecepatan konvergensi dasar)</td>
                  <td class="num">[-5.12, 5.12]</td>
                  <td class="num">0</td>
                </tr>
                <tr>
                  <td><strong>Rastrigin</strong></td>
                  <td>Multimodal ekstrem dengan puluhan cekungan kosinus lokal</td>
                  <td class="num">[-5.12, 5.12]</td>
                  <td class="num">0</td>
                </tr>
                <tr>
                  <td><strong>Ackley</strong></td>
                  <td>Dataran luar bergelombang dengan corong pusat curam</td>
                  <td class="num">[-5.00, 5.00]</td>
                  <td class="num">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Bagian 2: Simulator Eksplorasi vs Eksploitasi & Ringkasan Dua Algoritma -->
      <div class="grid-12">
        <div class="span-6 panel" data-ui>
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Simulator Dinamika Eksplorasi vs Eksploitasi</h2>
              <p class="panel-subtitle">Amati perbedaan perilaku 18 agen populasi pada permukaan Rastrigin (tekan P atau S).</p>
            </div>
            <div class="seg-group" data-ui id="konsep-dyn-modes">
              <button type="button" class="seg-btn" data-mode="explore">Eksplorasi Acak</button>
              <button type="button" class="seg-btn" data-mode="exploit">Eksploitasi Sempit</button>
              <button type="button" class="seg-btn active" data-mode="balanced">Seimbang</button>
            </div>
          </div>

          <div class="canvas-stage-compact" data-ui>
            <canvas id="konsep-dyn-canvas"></canvas>
          </div>

          <div class="ctrl-toolbar" data-ui>
            <button type="button" class="btn btn-primary" id="konsep-dyn-step">Langkah Populasi (S)</button>
            <button type="button" class="btn" id="konsep-dyn-reset">Acak Ulang (R)</button>
            <span style="margin-left:auto; font-size:0.82rem;" class="tabular" id="konsep-dyn-stat">Langkah: 0 · Terbaik f = 0.000</span>
          </div>

          <p class="panel-subtitle" id="konsep-dyn-desc" style="margin:0;">
            Mode Seimbang memadukan penjelajahan lintas lembah di awal iterasi dengan pemusatan lokal menuju kandidat terbaik hingga mendekati (0, 0).
          </p>
        </div>

        <div class="span-6 panel" data-ui>
          <div>
            <h2 class="panel-title">Dua Paradigma Metaheuristik pada Studi Ini</h2>
            <p class="panel-subtitle">Perbandingan mekanisme inti sebelum masuk ke laboratorium simulasi masing-masing tab.</p>
          </div>

          <div class="mini-card-grid">
            <div class="mini-card" data-ui style="border-left: 3px solid var(--its-tosca);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--ink);">Shuffled Frog-Leaping (SFLA)</strong>
                <span class="status-chip tosca">Eusuff &amp; Lansey, 2003</span>
              </div>
              <p class="panel-subtitle" style="margin:0;">
                Mempartisi populasi katak ke dalam beberapa <strong>Memeplex</strong> independen. Katak terburuk <code>Xw</code> melompat menuju katak terbaik lokal <code>Xb</code> atau global <code>Xg</code>, lalu seluruh kelompok dikocok ulang (<em>Shuffle</em>).
              </p>
              <code>D = rand() * (Xb - Xw)</code>
            </div>

            <div class="mini-card" data-ui style="border-left: 3px solid var(--its-sky);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--ink);">Water Cycle Algorithm (WCA)</strong>
                <span class="status-chip sky">Eskandar et al., 2012</span>
              </div>
              <p class="panel-subtitle" style="margin:0;">
                Menyusun populasi tetesan air ke dalam hierarki <strong>Aliran, Sungai, dan Laut</strong> berdasarkan proporsi intensitas fitness <code>NSn</code>. Saat sungai terlalu dekat ke laut (<code>&lt; dmax</code>), terjadi penguapan dan hujan baru.
              </p>
              <code>X_baru = X + rand() * C * (X_induk - X)</code>
            </div>
          </div>

          <div class="panel-navy" data-ui>
            <strong style="font-size:0.88rem; color:var(--ink);">Relevansi pada Komputasi Awan (Cloud Task Scheduling)</strong>
            <p class="panel-subtitle" style="margin:0.3rem 0 0;">
              Ketika <code>n</code> cloudlet dijadwalkan ke <code>m</code> Virtual Machine heterogen, ruang keputusannya mencapai <code>m^n</code> kombinasi. SFLA unggul melalui pertukaran solusi antar-komunitas memeplex, sedangkan WCA unggul dalam pemusatan cepat menuju titik Laut terbaik dengan penguapan adaptif yang terukur.
            </p>
          </div>
        </div>
      </div>
    `;

    // 1. Inisialisasi input identitas penyaji
    const teamInput = container.querySelector('#konsep-team-input');
    if (teamInput) {
      teamInput.textContent = savedTeam;
      teamInput.addEventListener('input', () => {
        try {
          localStorage.setItem(TEAM_STORAGE_KEY, teamInput.textContent || '');
        } catch (_e) {
          // Ignore storage error
        }
      });
    }

    container.querySelector('#konsep-goto-sfla')?.addEventListener('click', () => {
      workspace?.goToTab?.('sfla');
    });
    container.querySelector('#konsep-goto-wca')?.addEventListener('click', () => {
      workspace?.goToTab?.('wca');
    });

    // 2. Peta Kontur 2D Interaktif (Klik Evaluasi Titik)
    const landscapeCanvas = container.querySelector('#konsep-landscape-canvas');
    const contourCache = new ContourMapCache();
    let currentObj = OBJECTIVES.rastrigin;
    let probePoint = { x: 1.85, y: 1.4 };
    let lastViewport = null;

    const TRAP_POINTS = {
      rastrigin: { x: 0.995, y: 0.995, label: 'Minimum Lokal (0.99, 0.99)' },
      ackley: { x: 1.98, y: 0.98, label: 'Cekungan Lokal (1.98, 0.98)' },
      sphere: { x: -2.4, y: 2.1, label: 'Lereng Konveks (-2.40, 2.10)' }
    };

    function updateProbeTelemetry() {
      const fx = currentObj.evaluate(probePoint.x, probePoint.y);
      const dist = Math.hypot(probePoint.x - currentObj.optimum.x, probePoint.y - currentObj.optimum.y);

      const hudName = container.querySelector('#konsep-hud-name');
      const hudProbe = container.querySelector('#konsep-hud-probe');
      const kpiXy = container.querySelector('#konsep-kpi-xy');
      const kpiDomain = container.querySelector('#konsep-kpi-domain');
      const kpiFx = container.querySelector('#konsep-kpi-fx');
      const kpiDist = container.querySelector('#konsep-kpi-dist');
      const formulaText = container.querySelector('#konsep-formula-text');
      const formulaChar = container.querySelector('#konsep-formula-char');

      if (hudName) hudName.textContent = `${currentObj.name} (${currentObj.character})`;
      if (hudProbe) hudProbe.textContent = `Titik Uji: (${probePoint.x.toFixed(2)}, ${probePoint.y.toFixed(2)}) · f = ${fx.toFixed(3)}`;
      if (kpiXy) kpiXy.textContent = `(${probePoint.x.toFixed(2)}, ${probePoint.y.toFixed(2)})`;
      if (kpiDomain) kpiDomain.textContent = `Domain [${currentObj.min}, ${currentObj.max}]`;
      if (kpiFx) kpiFx.textContent = fx < 0.001 && fx > 0 ? fx.toExponential(2) : fx.toFixed(3);
      if (kpiDist) kpiDist.textContent = dist.toFixed(3);
      if (formulaText) formulaText.textContent = currentObj.formulaText;
      if (formulaChar) formulaChar.textContent = `Karakteristik: ${currentObj.character}. Global minimum di (0, 0) dengan f = 0.`;
    }

    function renderLandscape() {
      if (!landscapeCanvas) return;
      const { ctx, width, height } = syncCanvasSize(landscapeCanvas);
      const vp = contourCache.renderBackground(ctx, width, height, currentObj, 'terrain', {
        showOptimum: true
      });
      if (!vp) return;
      lastViewport = vp;

      // Gambar penanda contoh jebakan lokal
      const trap = TRAP_POINTS[currentObj.id] || TRAP_POINTS.rastrigin;
      const trapPos = vp.worldToScreen(trap.x, trap.y);
      ctx.save();
      ctx.beginPath();
      ctx.arc(trapPos.x, trapPos.y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e05a5f';
      ctx.strokeStyle = '#03132b';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ff8a80';
      ctx.fillText(trap.label, trapPos.x + 10, trapPos.y + 4);

      // Gambar penanda titik uji klik pengguna
      const pScreen = vp.worldToScreen(probePoint.x, probePoint.y);
      ctx.strokeStyle = 'rgba(38, 174, 228, 0.7)';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pScreen.x - 16, pScreen.y);
      ctx.lineTo(pScreen.x + 16, pScreen.y);
      ctx.moveTo(pScreen.x, pScreen.y - 16);
      ctx.lineTo(pScreen.x, pScreen.y + 16);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(pScreen.x, pScreen.y, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#26aee4';
      ctx.strokeStyle = '#ecf3ff';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      updateProbeTelemetry();
    }

    landscapeCanvas?.addEventListener('click', (e) => {
      if (!lastViewport) return;
      const rect = landscapeCanvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const world = lastViewport.screenToWorld(px, py);
      probePoint = {
        x: clampCoord(world.x, currentObj.min, currentObj.max),
        y: clampCoord(world.y, currentObj.min, currentObj.max)
      };
      renderLandscape();
    });

    container.querySelector('#konsep-btn-sample-trap')?.addEventListener('click', () => {
      const trap = TRAP_POINTS[currentObj.id] || TRAP_POINTS.rastrigin;
      probePoint = { x: trap.x, y: trap.y };
      renderLandscape();
    });

    const objButtons = container.querySelectorAll('#konsep-obj-tabs .seg-btn');
    objButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        objButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentObj = getObjective(btn.dataset.obj);
        probePoint = {
          x: clampCoord(probePoint.x, currentObj.min, currentObj.max),
          y: clampCoord(probePoint.y, currentObj.min, currentObj.max)
        };
        renderLandscape();
      });
    });

    // 3. Simulator Eksplorasi vs Eksploitasi
    const dynCanvas = container.querySelector('#konsep-dyn-canvas');
    const dynCache = new ContourMapCache();
    const dynObj = OBJECTIVES.rastrigin;
    let dynMode = 'balanced';
    let dynStepCount = 0;
    let dynRng = createRng(1042);
    let dynAgents = [];
    let dynPlaying = false;
    let dynTimer = null;

    const MODE_DESCRIPTIONS = {
      explore:
        'Eksplorasi Acak Murni: agen terus melompat luas ke seluruh domain tanpa memanfaatkan informasi solusi terbaik, sehingga sulit memusat di (0, 0).',
      exploit:
        'Eksploitasi Sempit: seluruh agen langsung tertarik ke kandidat awal terbaik di cekungan lokal sekitar (1.99, 0.99) dan kehilangan keragaman untuk lolos.',
      balanced:
        'Metaheuristik Seimbang: sebagian agen mengeksplorasi lembah baru sementara agen lain memusat ke kandidat terbaik global hingga mencapai cekungan pusat (0, 0).'
    };

    function resetDynamics() {
      dynStepCount = 0;
      dynRng = createRng(1042);
      if (dynMode === 'exploit') {
        // Mulai di sekitar cekungan lokal (1.98, 0.98) agar efek jebakan lokal tampak jelas
        dynAgents = Array.from({ length: 18 }, () => {
          const x = clampCoord(2.1 + dynRng.range(-0.9, 0.9), dynObj.min, dynObj.max);
          const y = clampCoord(1.1 + dynRng.range(-0.9, 0.9), dynObj.min, dynObj.max);
          return { x, y, fitness: dynObj.evaluate(x, y) };
        });
      } else {
        dynAgents = Array.from({ length: 18 }, () => {
          const x = dynRng.range(dynObj.min * 0.88, dynObj.max * 0.88);
          const y = dynRng.range(dynObj.min * 0.88, dynObj.max * 0.88);
          return { x, y, fitness: dynObj.evaluate(x, y) };
        });
      }
      renderDynamics();
    }

    function stepDynamics() {
      dynStepCount += 1;
      dynAgents.sort((a, b) => a.fitness - b.fitness);
      const leader = dynAgents[0];

      for (let i = 0; i < dynAgents.length; i++) {
        const ag = dynAgents[i];
        let nx = ag.x;
        let ny = ag.y;

        if (dynMode === 'explore') {
          nx = dynRng.range(dynObj.min, dynObj.max);
          ny = dynRng.range(dynObj.min, dynObj.max);
        } else if (dynMode === 'exploit') {
          if (i > 0) {
            nx = ag.x + dynRng.range(0.35, 0.75) * (leader.x - ag.x) + dynRng.range(-0.04, 0.04);
            ny = ag.y + dynRng.range(0.35, 0.75) * (leader.y - ag.y) + dynRng.range(-0.04, 0.04);
          }
        } else {
          // Balanced metaheuristic step
          if (i === 0) {
            const candX = clampCoord(ag.x + dynRng.range(-0.35, 0.35), dynObj.min, dynObj.max);
            const candY = clampCoord(ag.y + dynRng.range(-0.35, 0.35), dynObj.min, dynObj.max);
            if (dynObj.evaluate(candX, candY) < ag.fitness) {
              nx = candX;
              ny = candY;
            }
          } else if (i >= dynAgents.length - 4 && dynStepCount < 14) {
            nx = dynRng.range(-2.2, 2.2);
            ny = dynRng.range(-2.2, 2.2);
          } else {
            const candX = clampCoord(
              ag.x + dynRng.range(0.4, 1.75) * (leader.x - ag.x),
              dynObj.min,
              dynObj.max
            );
            const candY = clampCoord(
              ag.y + dynRng.range(0.4, 1.75) * (leader.y - ag.y),
              dynObj.min,
              dynObj.max
            );
            if (dynObj.evaluate(candX, candY) < ag.fitness) {
              nx = candX;
              ny = candY;
            }
          }
        }

        ag.x = clampCoord(nx, dynObj.min, dynObj.max);
        ag.y = clampCoord(ny, dynObj.min, dynObj.max);
        ag.fitness = dynObj.evaluate(ag.x, ag.y);
      }
      renderDynamics();
    }

    function renderDynamics() {
      if (!dynCanvas) return;
      const { ctx, width, height } = syncCanvasSize(dynCanvas);
      const vp = dynCache.renderBackground(ctx, width, height, dynObj, 'pond', {
        showOptimum: true
      });
      if (!vp) return;

      let best = dynAgents[0] || { x: 0, y: 0, fitness: 0 };
      for (const ag of dynAgents) {
        if (ag.fitness < best.fitness) best = ag;
      }

      for (const ag of dynAgents) {
        const pos = vp.worldToScreen(ag.x, ag.y);
        const isBest = ag === best;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, isBest ? 7.5 : 5.2, 0, Math.PI * 2);
        ctx.fillStyle = isBest
          ? '#fdbb16'
          : dynMode === 'exploit'
            ? '#e05a5f'
            : dynMode === 'explore'
              ? '#75bde0'
              : '#12b0a2';
        ctx.strokeStyle = '#03132b';
        ctx.lineWidth = 1.6;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      const statEl = container.querySelector('#konsep-dyn-stat');
      const descEl = container.querySelector('#konsep-dyn-desc');
      if (statEl) {
        statEl.textContent = `Langkah: ${dynStepCount} · Terbaik f = ${best.fitness.toFixed(3)}`;
      }
      if (descEl) {
        descEl.textContent = MODE_DESCRIPTIONS[dynMode];
      }
    }

    const dynModeButtons = container.querySelectorAll('#konsep-dyn-modes .seg-btn');
    dynModeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        dynModeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        dynMode = btn.dataset.mode || 'balanced';
        resetDynamics();
      });
    });

    container.querySelector('#konsep-dyn-step')?.addEventListener('click', () => stepDynamics());
    container.querySelector('#konsep-dyn-reset')?.addEventListener('click', () => resetDynamics());

    registerHooks?.({
      togglePlay: () => {
        dynPlaying = !dynPlaying;
        if (dynPlaying) {
          dynTimer = setInterval(() => {
            if (dynStepCount >= 30) {
              dynPlaying = false;
              clearInterval(dynTimer);
              dynTimer = null;
              return;
            }
            stepDynamics();
          }, 420);
        } else if (dynTimer) {
          clearInterval(dynTimer);
          dynTimer = null;
        }
      },
      step: () => stepDynamics(),
      reset: () => resetDynamics()
    });

    const onResize = () => {
      renderLandscape();
      renderDynamics();
    };
    window.addEventListener('resize', onResize);

    resetDynamics();
    requestAnimationFrame(() => {
      renderLandscape();
      renderDynamics();
    });

    return () => {
      window.removeEventListener('resize', onResize);
      if (dynTimer) clearInterval(dynTimer);
    };
  }
};
