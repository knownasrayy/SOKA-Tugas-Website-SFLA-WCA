/**
 * Slide 16–18: Perbandingan SFLA vs WCA Berdampingan, Studi Kasus Cloud VM, dan Kesimpulan
 */

import { getObjective } from '../core/objectives.js';
import { createRng } from '../core/rng.js';
import { SimulationRunner } from '../core/engine.js';
import { SFLAEngine } from '../algorithms/sfla.js';
import { WCAEngine } from '../algorithms/wca.js';
import { CloudScheduleOptimizer, generateCloudTasks } from '../algorithms/cloudScheduling.js';
import { SFLARenderer } from '../render/sflaRenderer.js';
import { WCARenderer } from '../render/wcaRenderer.js';
import { syncCanvasSize } from '../render/contourRenderer.js';
import { renderConvergenceChart } from '../render/chart.js';

export const outroSlides = [
  // =========================================================================
  // SLIDE 16: PERBANDINGAN BERDAMPINGAN SFLA VS WCA (F-11 & Kriteria #8)
  // =========================================================================
  {
    id: 'comparison',
    shortTitle: 'SFLA vs WCA',
    title: 'Perbandingan Langsung: SFLA vs WCA',
    theme: 'compare',
    notes: `
      <ul>
        <li><strong>Eksperimen adil (Apples-to-Apples):</strong> Kedua algoritma dimulai dari <strong>koordinat awal populasi yang 100% identik</strong> (seed sama &amp; fungsi sama).</li>
        <li><strong>Amati perbedaan karakter di layar:</strong>
          <ul>
            <li>Pada <em>Sphere</em>, aliran WCA dengan <code>C = 2</code> sering meluncur cepat ke pusat Laut, sementara SFLA menyapu bertahap per memeplex.</li>
            <li>Pada <em>Rastrigin</em>, pengacakan ulang <em>Shuffle</em> SFLA dan <em>Hujan</em> WCA sama-sama efektif meloloskan diri dari jebakan lokal!</li>
          </ul>
        </li>
      </ul>
    `,
    mount(container, { reducedMotion, registerHooks }) {
      container.innerHTML = `
        <div class="slide-top" style="align-items:center;">
          <div>
            <div class="slide-context">Slide 16 · Arena Perbandingan Berdampingan</div>
            <h1 class="slide-heading" style="font-size:clamp(1.45rem, 2.1vw, 2.45rem);">SFLA vs WCA pada Fungsi &amp; Populasi Identik</h1>
          </div>

          <div class="ctrl-bar">
            <button type="button" class="btn btn-accent" id="cmp-btn-play">▶ Play Serentak</button>
            <button type="button" class="btn btn-step" id="cmp-btn-step" title="Maju 1 siklus iterasi bersama (Tombol S)">⏭ +1 Iterasi</button>
            <button type="button" class="btn" id="cmp-btn-reset" title="Reset bersama (Tombol R)">↺ Reset</button>

            <label class="ctrl-field">
              <span>Fungsi:</span>
              <select class="ctrl-select" id="cmp-select-obj">
                <option value="sphere">Sphere</option>
                <option value="rastrigin" selected>Rastrigin</option>
                <option value="ackley">Ackley</option>
              </select>
            </label>

            <label class="ctrl-field">
              <span>Seed:</span>
              <input type="number" class="ctrl-input" id="cmp-seed" value="42" style="width:76px;" />
            </label>

            <button type="button" class="btn" id="cmp-rand-seed" title="Coba seed acak baru">Acak Seed</button>
          </div>
        </div>

        <div style="flex:1; min-height:0; display:grid; grid-template-rows:1.25fr 0.75fr; gap:0.85rem;">
          <div class="split-grid-equal">
            <!-- Panel SFLA -->
            <div class="card-panel canvas-card" style="border-color:#1f9d7a;">
              <div class="stage-hud-overlay">
                <div class="stage-badge" style="border-color:#1f9d7a;">
                  <span class="stage-badge-code" style="color:#43bf9c;">SFLA</span>
                  <span id="cmp-sfla-best" class="tabular">f = 0.0000</span>
                </div>
                <div class="hud-pill" id="cmp-sfla-iter">Iterasi 0</div>
              </div>
              <canvas id="cmp-sfla-canvas"></canvas>
            </div>

            <!-- Panel WCA -->
            <div class="card-panel canvas-card" style="border-color:#2298c7;">
              <div class="stage-hud-overlay">
                <div class="stage-badge" style="border-color:#2298c7;">
                  <span class="stage-badge-code" style="color:#53bce3;">WCA</span>
                  <span id="cmp-wca-best" class="tabular">f = 0.0000</span>
                </div>
                <div class="hud-pill" id="cmp-wca-iter">Iterasi 0</div>
              </div>
              <canvas id="cmp-wca-canvas"></canvas>
            </div>
          </div>

          <div class="card-panel canvas-card">
            <canvas id="cmp-chart-canvas"></canvas>
          </div>
        </div>
      `;

      const sflaCanvas = container.querySelector('#cmp-sfla-canvas');
      const wcaCanvas = container.querySelector('#cmp-wca-canvas');
      const chartCanvas = container.querySelector('#cmp-chart-canvas');
      const btnPlay = container.querySelector('#cmp-btn-play');
      const btnStep = container.querySelector('#cmp-btn-step');
      const btnReset = container.querySelector('#cmp-btn-reset');
      const selObj = container.querySelector('#cmp-select-obj');
      const inpSeed = container.querySelector('#cmp-seed');
      const btnRandSeed = container.querySelector('#cmp-rand-seed');

      const sflaBestEl = container.querySelector('#cmp-sfla-best');
      const wcaBestEl = container.querySelector('#cmp-wca-best');
      const sflaIterEl = container.querySelector('#cmp-sfla-iter');
      const wcaIterEl = container.querySelector('#cmp-wca-iter');

      const sflaRenderer = new SFLARenderer();
      const wcaRenderer = new WCARenderer();

      let currentObj = getObjective(selObj.value);
      let sflaEngine = null;
      let wcaEngine = null;

      function createSharedEngines() {
        currentObj = getObjective(selObj.value);
        const seedVal = Number(inpSeed.value) || 42;
        const posRng = createRng(seedVal);
        const popSize = 24;
        const sharedPositions = Array.from({ length: popSize }, () => ({
          x: posRng.range(currentObj.min, currentObj.max),
          y: posRng.range(currentObj.min, currentObj.max)
        }));

        sflaEngine = new SFLAEngine({
          objective: currentObj,
          populationSize: popSize,
          memeplexCount: 4,
          localIterations: 3,
          maxStep: 3.2,
          maxIterations: 40,
          seed: seedVal,
          initialPositions: sharedPositions
        });

        wcaEngine = new WCAEngine({
          objective: currentObj,
          populationSize: popSize,
          nsr: 4,
          dmax: 0.45,
          flowConstant: 2.0,
          maxIterations: 40,
          seed: seedVal,
          initialPositions: sharedPositions
        });
      }

      createSharedEngines();

      function updateUI() {
        const sSt = sflaEngine.getState();
        const wSt = wcaEngine.getState();

        const sf = sSt.bestFrog.fitness;
        const wf = wSt.bestSea.fitness;
        sflaBestEl.textContent = `f = ${sf < 0.0001 ? sf.toExponential(2) : sf.toFixed(4)}`;
        wcaBestEl.textContent = `f = ${wf < 0.0001 ? wf.toExponential(2) : wf.toFixed(4)}`;
        sflaIterEl.textContent = `Siklus ${sSt.iteration}/${sSt.maxIterations}`;
        wcaIterEl.textContent = `Iterasi ${wSt.iteration}/${wSt.maxIterations}`;

        renderConvergenceChart(
          chartCanvas,
          [
            { label: 'SFLA', color: '#34d399', data: sSt.history },
            { label: 'WCA', color: '#38bdf8', data: wSt.history }
          ],
          {
            maxIterations: 40,
            title: `Kurva Konvergensi pada Fungsi ${currentObj.name} (Populasi = 24, Seed = ${inpSeed.value})`
          }
        );
      }

      const runner = new SimulationRunner({
        stepsPerSecond: 3.0,
        reducedMotion,
        onStep: () => {
          const sSt = sflaEngine.stepFullIteration();
          const wSt = wcaEngine.stepFullIteration();
          updateUI();
          return sSt.phase === 'DONE' && wSt.phase === 'DONE';
        },
        onRender: (alpha, ts) => {
          sflaRenderer.render(sflaCanvas, sflaEngine.getState(), currentObj, {
            alpha,
            showOptimum: true,
            showTrails: true,
            compact: true
          });
          wcaRenderer.render(wcaCanvas, wcaEngine.getState(), currentObj, {
            alpha,
            timestamp: ts,
            showOptimum: true,
            showTrails: true,
            compact: true
          });
        }
      });

      runner.onPlayStateChange = (playing) => {
        btnPlay.textContent = playing ? '⏸ Pause' : '▶ Play Serentak';
      };

      function resetBoth() {
        createSharedEngines();
        runner.notifyReset();
        updateUI();
      }

      btnPlay.addEventListener('click', () => {
        if (sflaEngine.getState().phase === 'DONE') resetBoth();
        runner.togglePlay();
      });
      btnStep.addEventListener('click', () => runner.stepOnce());
      btnReset.addEventListener('click', () => resetBoth());
      selObj.addEventListener('change', () => resetBoth());
      inpSeed.addEventListener('change', () => resetBoth());
      btnRandSeed.addEventListener('click', () => {
        inpSeed.value = String(Math.floor(Math.random() * 900) + 100);
        resetBoth();
      });

      const onResize = () => updateUI();
      window.addEventListener('resize', onResize);

      registerHooks({
        togglePlay: () => btnPlay.click(),
        step: () => btnStep.click(),
        reset: () => btnReset.click()
      });

      updateUI();
      runner.startLoop();

      return () => {
        window.removeEventListener('resize', onResize);
        runner.destroy();
      };
    }
  },

  // =========================================================================
  // SLIDE 17: STUDI KASUS KOMPUTASI AWAN — PENJADWALAN TUGAS KE VM (Bagian 9)
  // =========================================================================
  {
    id: 'cloud-case',
    shortTitle: 'Cloud VM Scheduling',
    title: 'Konteks Komputasi Awan: Penjadwalan Tugas ke VM',
    theme: 'cloud',
    notes: `
      <ul>
        <li><strong>Relevansi langsung dengan mata kuliah:</strong> Menjadwalkan 16 tugas (<em>cloudlets</em>) ke 4 Mesin Virtual (VM) yang kapasitas MIPS-nya berbeda-beda adalah masalah NP-Hard!</li>
        <li><strong>Pemetaan kontinu → diskrit:</strong> Setiap katak/tetesan adalah array sepanjang 16 angka kontinu <code>[0, 4)</code>. Nilai kontinu dibulatkan ke bawah <code>floor(x_i)</code> menjadi indeks VM tujuan (0, 1, 2, atau 3).</li>
        <li>Klik tombol <strong>▶ Jalankan Optimasi</strong>: tunjukkan bagaimana beban VM yang tadinya timpang pada Round-Robin menjadi rata seimbang dan waktu selesai terakhir (<em>Makespan</em>) turun tajam!</li>
      </ul>
    `,
    mount(container, { reducedMotion, registerHooks }) {
      container.innerHTML = `
        <div class="slide-top" style="align-items:center;">
          <div>
            <div class="slide-context">Slide 17 · Studi Kasus Komputasi Awan</div>
            <h1 class="slide-heading" style="font-size:clamp(1.45rem, 2.15vw, 2.5rem);">Penjadwalan 16 Tugas ke 4 VM (Minimasi Makespan)</h1>
            <p class="slide-keyline" style="font-size:var(--fs-ui);">
              Pemetaan kontinu ke diskrit: <code>VM_tugas[i] = ⌊X[i]⌋ ∈ {0, 1, 2, 3}</code> &nbsp;·&nbsp; Satu agen = satu jadwal lengkap.
            </p>
          </div>

          <div class="ctrl-bar">
            <button type="button" class="btn btn-accent" id="cloud-btn-run">▶ Jalankan</button>
            <button type="button" class="btn btn-step" id="cloud-btn-step">⏭ Step</button>
            <button type="button" class="btn" id="cloud-btn-reset">↺ Beban Baru</button>
          </div>
        </div>

        <div class="split-grid">
          <!-- Visual Bar Beban per VM -->
          <div class="card-panel" style="padding:1rem 1.2rem; gap:0.65rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <strong style="font-size:var(--fs-ui); color:var(--theme-primary);">Distribusi Beban Kerja Tiap VM (Detik)</strong>
              <div style="display:flex; gap:0.45rem;" id="cloud-view-tabs">
                <button type="button" class="btn" data-algo="rr" style="padding:0.3rem 0.7rem; font-size:var(--fs-small);">Round-Robin</button>
                <button type="button" class="btn btn-accent" data-algo="sfla" style="padding:0.3rem 0.7rem; font-size:var(--fs-small);">Jadwal SFLA</button>
                <button type="button" class="btn" data-algo="wca" style="padding:0.3rem 0.7rem; font-size:var(--fs-small);">Jadwal WCA</button>
              </div>
            </div>

            <div class="canvas-card" style="flex:1; border-radius:10px; border:1px solid var(--border-subtle);">
              <canvas id="cloud-bars-canvas"></canvas>
            </div>
          </div>

          <!-- Metrik Makespan & Grafik Konvergensi -->
          <div style="display:flex; flex-direction:column; gap:0.85rem; min-height:0;">
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.65rem;">
              <div class="card-panel" style="padding:0.75rem 0.9rem;">
                <div style="font-size:var(--fs-small); color:var(--text-muted); font-weight:700;">Round-Robin</div>
                <div id="cloud-val-rr" class="tabular" style="font-size:var(--fs-h2); font-weight:800; color:#d95b5b;">0.0s</div>
              </div>
              <div class="card-panel" style="padding:0.75rem 0.9rem; border-color:#1f9d7a;">
                <div style="font-size:var(--fs-small); color:#43bf9c; font-weight:700;">SFLA Terbaik</div>
                <div id="cloud-val-sfla" class="tabular" style="font-size:var(--fs-h2); font-weight:800; color:#43bf9c;">0.0s</div>
              </div>
              <div class="card-panel" style="padding:0.75rem 0.9rem; border-color:#2298c7;">
                <div style="font-size:var(--fs-small); color:#53bce3; font-weight:700;">WCA Terbaik</div>
                <div id="cloud-val-wca" class="tabular" style="font-size:var(--fs-h2); font-weight:800; color:#53bce3;">0.0s</div>
              </div>
            </div>

            <div class="card-panel canvas-card" style="flex:1; min-height:175px;">
              <canvas id="cloud-chart-canvas"></canvas>
            </div>

            <div class="formula-box" id="cloud-summary-box" style="font-size:var(--fs-small);">
              Tekan <strong>Jalankan</strong> untuk menyeimbangkan penugasan 16 cloudlet sesuai kecepatan MIPS tiap VM.
            </div>
          </div>
        </div>
      `;

      const barsCanvas = container.querySelector('#cloud-bars-canvas');
      const chartCanvas = container.querySelector('#cloud-chart-canvas');
      const btnRun = container.querySelector('#cloud-btn-run');
      const btnStep = container.querySelector('#cloud-btn-step');
      const btnReset = container.querySelector('#cloud-btn-reset');

      const valRR = container.querySelector('#cloud-val-rr');
      const valSfla = container.querySelector('#cloud-val-sfla');
      const valWca = container.querySelector('#cloud-val-wca');
      const summaryBox = container.querySelector('#cloud-summary-box');

      let seedCounter = 2026;
      let activeView = 'sfla';
      let optimizer = new CloudScheduleOptimizer({
        tasks: generateCloudTasks(16, seedCounter),
        maxIterations: 35,
        seed: seedCounter
      });

      const TASK_PALETTE = [
        '#53bce3', '#43bf9c', '#d8a33a', '#e07a9a',
        '#48b8d0', '#e08544', '#27a89a', '#9ccf4e'
      ];

      function drawVMBars() {
        const { ctx, width, height } = syncCanvasSize(barsCanvas);
        ctx.clearRect(0, 0, width, height);

        const st = optimizer.getState();
        const sched =
          activeView === 'rr'
            ? st.baselineRR
            : activeView === 'wca'
            ? st.bestWca.eval
            : st.bestSfla.eval;

        const maxScaleSec = Math.max(st.baselineRR.makespan * 1.15, 16);
        const padLeft = 52;
        const padRight = 24;
        const padTop = 34;
        const padBottom = 56;
        const plotW = Math.max(40, width - padLeft - padRight);
        const plotH = Math.max(40, height - padTop - padBottom);

        // Grid sumbu waktu (detik)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
        ctx.lineWidth = 1;
        ctx.font = '700 12px "Ubuntu Mono", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';

        for (let g = 0; g <= 4; g++) {
          const sec = (g / 4) * maxScaleSec;
          const py = padTop + plotH - (g / 4) * plotH;
          ctx.beginPath();
          ctx.moveTo(padLeft, py);
          ctx.lineTo(padLeft + plotW, py);
          ctx.stroke();
          ctx.fillText(`${sec.toFixed(0)}s`, padLeft - 8, py + 4);
        }

        // Gambar kolom per VM beserta tumpukan blok tugas di dalamnya
        const vmCount = st.vms.length;
        const slotW = plotW / vmCount;
        const barW = Math.min(92, slotW * 0.56);

        st.vms.forEach((vm, idx) => {
          const bx = padLeft + idx * slotW + (slotW - barW) / 2;
          let curBottom = padTop + plotH;

          for (const t of sched.vmTasks[idx]) {
            const blockH = (t.execSec / maxScaleSec) * plotH;
            const by = curBottom - blockH;

            ctx.fillStyle = TASK_PALETTE[(t.id - 1) % TASK_PALETTE.length];
            ctx.strokeStyle = '#071320';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.roundRect(bx, by, barW, Math.max(2, blockH - 1), 4);
            ctx.fill();
            ctx.stroke();

            if (blockH >= 15) {
              ctx.font = '700 11px "Ubuntu Mono", monospace';
              ctx.fillStyle = '#04111d';
              ctx.textAlign = 'center';
              ctx.fillText(t.name, bx + barW / 2, by + blockH / 2 + 4);
            }
            curBottom = by;
          }

          // Label total waktu VM di atas bar
          ctx.font = '800 13px "Ubuntu Mono", monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(`${sched.vmLoads[idx].toFixed(1)}s`, bx + barW / 2, curBottom - 7);

          // Nama VM & kecepatan MIPS di bawah sumbu
          ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(`VM-${idx + 1}`, bx + barW / 2, padTop + plotH + 20);
          ctx.font = '400 11px "Ubuntu Mono", monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`${vm.mips} MIPS`, bx + barW / 2, padTop + plotH + 37);
        });

        // Garis horizontal penanda Makespan saat ini
        const mkY = padTop + plotH - (sched.makespan / maxScaleSec) * plotH;
        ctx.save();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(padLeft, mkY);
        ctx.lineTo(padLeft + plotW, mkY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '800 12px "Ubuntu Mono", monospace';
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'right';
        ctx.fillText(`Makespan = ${sched.makespan.toFixed(2)}s`, padLeft + plotW - 4, Math.max(18, mkY - 7));
        ctx.restore();
      }

      function refreshAll() {
        const st = optimizer.getState();
        valRR.textContent = `${st.baselineRR.makespan.toFixed(2)}s`;
        valSfla.textContent = `${st.bestSfla.eval.makespan.toFixed(2)}s`;
        valWca.textContent = `${st.bestWca.eval.makespan.toFixed(2)}s`;

        const bestOverall = Math.min(st.bestSfla.eval.makespan, st.bestWca.eval.makespan);
        const savedPct = ((st.baselineRR.makespan - bestOverall) / st.baselineRR.makespan) * 100;
        summaryBox.innerHTML =
          st.iteration === 0
            ? `Iterasi 0/${st.maxIterations}: Klik <strong>▶ Jalankan</strong> untuk melihat beban VM diseimbangkan secara otomatis.`
            : `Iterasi <strong>${st.iteration}/${st.maxIterations}</strong>: Penghematan waktu selesai terakhir dibanding Round-Robin sebesar <strong style="color:#43bf9c;">−${Math.max(0, savedPct).toFixed(1)}%</strong>.`;

        drawVMBars();
        renderConvergenceChart(
          chartCanvas,
          [
            { label: 'SFLA', color: '#34d399', data: st.historySfla },
            { label: 'WCA', color: '#38bdf8', data: st.historyWca }
          ],
          {
            maxIterations: st.maxIterations,
            zeroBaseline: false,
            title: 'Penurunan Makespan (Detik) Seiring Iterasi'
          }
        );
      }

      const runner = new SimulationRunner({
        stepsPerSecond: 4.5,
        reducedMotion,
        onStep: () => {
          const st = optimizer.step();
          refreshAll();
          return st.done;
        },
        onRender: () => {}
      });

      runner.onPlayStateChange = (playing) => {
        btnRun.textContent = playing ? '⏸ Pause' : '▶ Jalankan';
      };

      container.querySelectorAll('#cloud-view-tabs .btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeView = btn.dataset.algo;
          container.querySelectorAll('#cloud-view-tabs .btn').forEach((b) => {
            b.classList.toggle('btn-accent', b === btn);
          });
          drawVMBars();
        });
      });

      btnRun.addEventListener('click', () => {
        if (optimizer.getState().done) {
          optimizer.reset();
        }
        runner.togglePlay();
      });

      btnStep.addEventListener('click', () => runner.stepOnce());

      btnReset.addEventListener('click', () => {
        runner.pause();
        seedCounter += 7;
        optimizer = new CloudScheduleOptimizer({
          tasks: generateCloudTasks(16, seedCounter),
          maxIterations: 35,
          seed: seedCounter
        });
        refreshAll();
      });

      const onResize = () => refreshAll();
      window.addEventListener('resize', onResize);

      registerHooks({
        togglePlay: () => btnRun.click(),
        step: () => btnStep.click(),
        reset: () => btnReset.click()
      });

      refreshAll();
      runner.startLoop();

      return () => {
        window.removeEventListener('resize', onResize);
        runner.destroy();
      };
    }
  },

  // =========================================================================
  // SLIDE 18: KESIMPULAN & REFERENSI
  // =========================================================================
  {
    id: 'conclusion',
    shortTitle: 'Kesimpulan',
    title: 'Kesimpulan, Perbandingan Kunci & Referensi',
    theme: 'intro',
    notes: `
      <ul>
        <li><strong>Ringkasan penutup (1 menit):</strong>
          <ul>
            <li><strong>SFLA</strong> unggul dalam pertukaran budaya terstruktur lewat komunitas <em>memeplex</em> dan <em>shuffle</em> global.</li>
            <li><strong>WCA</strong> unggul dalam hierarki intensitas aliran proporsional dan kontrol radius penguapan <code>dmax</code> yang adaptif dari eksplorasi menuju eksploitasi.</li>
            <li>Keduanya mampu menekan <em>makespan</em> penjadwalan komputasi awan secara signifikan tanpa harus menguji seluruh kombinasi eksponensial.</li>
          </ul>
        </li>
        <li>Gunakan tombol pintas di bagian bawah layar apabila dosen atau audiens meminta demo ulang pada salah satu modul saat sesi tanya jawab!</li>
      </ul>
    `,
    mount(container, { deck }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 18 · Penutup &amp; Sintesis</div>
            <h1 class="slide-heading">Kesimpulan: SFLA vs WCA untuk Optimasi Awan</h1>
          </div>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:0.95rem; min-height:0;">
          <div class="split-grid-equal" style="flex:1;">
            <!-- Kartu Ringkasan SFLA -->
            <div class="card-panel" style="border-color:#1f9d7a; justify-content:space-between;">
              <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <strong style="font-size:var(--fs-h2); color:#43bf9c;">SFLA (Kolam Teratai)</strong>
                  <span class="tabular" style="font-size:var(--fs-small); font-weight:700; color:#9cead1;">Eusuff &amp; Lansey (2003)</span>
                </div>
                <div style="font-size:var(--fs-ui); color:var(--text-secondary);">
                  <strong>Eksploitasi:</strong> Lompatan terarah katak terburuk ke <code>Xb</code> lalu <code>Xg</code> di tiap submemeplex.<br/>
                  <strong>Eksplorasi:</strong> Pengacakan ulang (<em>Shuffle</em>) seluruh memeplex + katak sensor acak.
                </div>
                <div style="padding:0.65rem 0.9rem; border-radius:8px; background:#0d2922; border-left:3px solid #1f9d7a; font-size:var(--fs-small); color:#d1fae5;">
                  <strong>+ Kelebihan:</strong> Pencarian multi-kelompok mencegah dominasi tunggal terlalu dini.<br/>
                  <strong>− Catatan:</strong> Lebih banyak parameter komunitas (<code>m</code>, <code>N</code>, <code>Dmax</code>) yang perlu disetel.
                </div>
              </div>
              <button type="button" class="btn" id="jump-back-sfla">Buka Kembali Simulasi SFLA →</button>
            </div>

            <!-- Kartu Ringkasan WCA -->
            <div class="card-panel" style="border-color:#2298c7; justify-content:space-between;">
              <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <strong style="font-size:var(--fs-h2); color:#53bce3;">WCA (Siklus Air)</strong>
                  <span class="tabular" style="font-size:var(--fs-small); font-weight:700; color:#baeaff;">Eskandar dkk. (2012)</span>
                </div>
                <div style="font-size:var(--fs-ui); color:var(--text-secondary);">
                  <strong>Eksploitasi:</strong> Aliran proporsional menuju Sungai &amp; Laut + pertukaran peran instan.<br/>
                  <strong>Eksplorasi:</strong> Penguapan saat jarak <code>&lt; dmax</code> diikuti proses turun hujan baru.
                </div>
                <div style="padding:0.65rem 0.9rem; border-radius:8px; background:#0d2436; border-left:3px solid #2298c7; font-size:var(--fs-small); color:#e0f2fe;">
                  <strong>+ Kelebihan:</strong> Konvergensi cepat &amp; transisi otomatis lewat penyusutan <code>dmax</code>.<br/>
                  <strong>− Catatan:</strong> Sensitif terhadap pemilihan <code>Nsr</code> dan nilai awal <code>dmax</code>.
                </div>
              </div>
              <button type="button" class="btn" id="jump-back-wca">Buka Kembali Simulasi WCA →</button>
            </div>
          </div>

          <!-- Kotak Referensi & Navigasi Cepat Tanya-Jawab -->
          <div class="card-panel" style="padding:0.85rem 1.25rem; flex-direction:row; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div style="font-size:var(--fs-small); color:var(--text-secondary); max-width:74ch;">
              <strong style="color:var(--gold-crown);">Referensi Utama:</strong><br/>
              1. Eusuff, M. M., &amp; Lansey, K. E. (2003). <em>Optimization of water distribution network design using the shuffled frog leaping algorithm.</em> J. Water Resour. Plan. Manag.<br/>
              2. Eskandar, H., Sadollah, A., Bahreininejad, A., &amp; Hamdi, M. (2012). <em>Water cycle algorithm: A novel metaheuristic optimization method...</em> Computers &amp; Structures.
            </div>

            <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
              <button type="button" class="btn" id="jump-back-cmp">Arena SFLA vs WCA</button>
              <button type="button" class="btn" id="jump-back-cloud">Demo Cloud VM</button>
              <button type="button" class="btn btn-accent" id="jump-back-home">↺ Ke Slide 1</button>
            </div>
          </div>
        </div>
      `;

      container.querySelector('#jump-back-sfla').addEventListener('click', () => deck.goTo(8));
      container.querySelector('#jump-back-wca').addEventListener('click', () => deck.goTo(14));
      container.querySelector('#jump-back-cmp').addEventListener('click', () => deck.goTo(15));
      container.querySelector('#jump-back-cloud').addEventListener('click', () => deck.goTo(16));
      container.querySelector('#jump-back-home').addEventListener('click', () => deck.goTo(0));
    }
  }
];
