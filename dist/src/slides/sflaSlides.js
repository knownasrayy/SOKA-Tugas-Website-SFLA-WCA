/**
 * Modul Slide SFLA (Slide 4–9) — Metafora Katak di Kolam Teratai (PRD Bagian 7)
 */

import { getObjective } from '../core/objectives.js';
import { SimulationRunner } from '../core/engine.js';
import { SFLAEngine } from '../algorithms/sfla.js';
import { SFLARenderer, MEMEPLEX_COLORS } from '../render/sflaRenderer.js';
import { syncCanvasSize } from '../render/contourRenderer.js';
import { renderConvergenceChart } from '../render/chart.js';

export const sflaSlides = [
  // =========================================================================
  // SLIDE 4: PENGANTAR & METAFORA SFLA
  // =========================================================================
  {
    id: 'sfla-intro',
    shortTitle: 'SFLA: Metafora Kolam',
    title: 'Shuffled Frog-Leaping Algorithm (SFLA)',
    theme: 'sfla',
    notes: `
      <ul>
        <li><strong>Asal-usul:</strong> Diperkenalkan oleh Eusuff &amp; Lansey (2003), menggabungkan pencarian lokal ala <em>PSO</em> (evolusi memetik dalam kelompok) dan pertukaran informasi global ala <em>Shuffled Complex Evolution</em>.</li>
        <li><strong>Klik 4 kartu di kanan</strong> untuk menyorot arti tiap elemen visual di kolam:
          <ul>
            <li>1 ekor katak = 1 kandidat solusi koordinat <code>(x, y)</code>.</li>
            <li>Dasar kolam (daun teratai pusat) = nilai biaya/fitness terendah.</li>
            <li>Warna kelompok = <em>Memeplex</em> (kelompok diskusi lokal).</li>
            <li>Katak bermahkota emas = solusi terbaik global <code>Xg</code>.</li>
          </ul>
        </li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 4 · Modul SFLA (1/6): Konsep &amp; Metafora</div>
            <h1 class="slide-heading">Metafora Katak di Kolam Teratai</h1>
            <p class="slide-keyline">Setiap katak adalah kandidat solusi yang belajar di kelompok lokal (<em>memeplex</em>) lalu bertukar kabar secara global.</p>
          </div>
        </div>

        <div class="split-grid">
          <div class="card-panel canvas-card">
            <canvas id="sfla-meta-canvas"></canvas>
          </div>

          <div class="card-panel" style="justify-content:space-between; gap:0.75rem;">
            <div style="font-size:var(--fs-small); color:var(--theme-primary); font-weight:700;">
              Klik Elemen untuk Menyorot Pemetaan Visual
            </div>

            <button type="button" class="btn btn-accent meta-pick" data-focus="frog" style="justify-content:space-between; padding:0.75rem 1rem; text-align:left;">
              <span style="display:inline-flex; align-items:center; gap:0.65rem;"><span class="role-chip">Xi</span> <span><strong>Seekor Katak</strong> → Kandidat Solusi <code>(x, y)</code></span></span>
              <span style="font-size:0.85em; color:var(--text-secondary);">Posisi</span>
            </button>

            <button type="button" class="btn meta-pick" data-focus="memeplex" style="justify-content:space-between; padding:0.75rem 1rem; text-align:left;">
              <span style="display:inline-flex; align-items:center; gap:0.65rem;"><span class="role-chip">Mm</span> <span><strong>Warna Kelompok</strong> → Memeplex (M1, M2, M3)</span></span>
              <span style="font-size:0.85em; color:var(--text-secondary);">Lokal</span>
            </button>

            <button type="button" class="btn meta-pick" data-focus="fitness" style="justify-content:space-between; padding:0.75rem 1rem; text-align:left;">
              <span style="display:inline-flex; align-items:center; gap:0.65rem;"><span class="role-chip">f(x)</span> <span><strong>Kedalaman Kolam</strong> → Nilai Fitness <code>f(x, y)</code></span></span>
              <span style="font-size:0.85em; color:var(--text-secondary);">Kualitas</span>
            </button>

            <button type="button" class="btn meta-pick" data-focus="xg" style="justify-content:space-between; padding:0.75rem 1rem; text-align:left;">
              <span style="display:inline-flex; align-items:center; gap:0.65rem;"><span class="role-chip" style="color:#fae0a5; border-color:#d8a33a;">Xg</span> <span><strong>Katak Emas</strong> → Terbaik Global (<code>Xg</code>)</span></span>
              <span style="font-size:0.85em; color:var(--text-secondary);">Target</span>
            </button>

            <div class="formula-box" id="sfla-meta-caption">
              Koordinat pijakan katak di permukaan kolam langsung merepresentasikan nilai variabel keputusan yang sedang diuji.
            </div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#sfla-meta-canvas');
      const captionEl = container.querySelector('#sfla-meta-caption');
      const renderer = new SFLARenderer();
      const obj = getObjective('sphere');

      const demoState = {
        phase: 'PARTITION',
        frogs: [
          { id: 1, x: 0.25, y: -0.2, prevX: 0.25, prevY: -0.2, fitness: 0.1, memeplex: 0, role: 'global_best', trail: [] },
          { id: 2, x: -1.6, y: 1.3, prevX: -1.6, prevY: 1.3, fitness: 4.25, memeplex: 0, role: 'member', trail: [] },
          { id: 3, x: -3.1, y: 2.5, prevX: -3.1, prevY: 2.5, fitness: 15.8, memeplex: 0, role: 'memeplex_worst', trail: [] },
          { id: 4, x: 1.4, y: 1.5, prevX: 1.4, prevY: 1.5, fitness: 4.21, memeplex: 1, role: 'memeplex_best', trail: [] },
          { id: 5, x: 3.0, y: 2.3, prevX: 3.0, prevY: 2.3, fitness: 14.2, memeplex: 1, role: 'memeplex_worst', trail: [] },
          { id: 6, x: -1.5, y: -2.1, prevX: -1.5, prevY: -2.1, fitness: 6.6, memeplex: 2, role: 'memeplex_best', trail: [] },
          { id: 7, x: 2.5, y: -2.9, prevX: 2.5, prevY: -2.9, fitness: 14.6, memeplex: 2, role: 'memeplex_worst', trail: [] }
        ],
        jumps: [],
        bestFrog: { id: 1, x: 0.25, y: -0.2, fitness: 0.1 }
      };

      const captions = {
        frog: 'Koordinat pijakan katak di permukaan kolam merepresentasikan kandidat solusi (x, y) yang sedang dievaluasi.',
        memeplex: 'Memeplex adalah sub-komunitas katak (M1 hijau, M2 kuning, M3 biru) yang saling meniru secara lokal.',
        fitness: 'Makin dekat ke cekungan terdalam kolam, makin kecil nilai fungsi biaya (fitness makin unggul).',
        xg: 'Katak dengan posisi paling rendah di seluruh kolam diberi mahkota emas (Xg) sebagai panutan global.'
      };

      let focus = 'frog';
      let rafId = null;

      container.querySelectorAll('.meta-pick').forEach((btn) => {
        btn.addEventListener('click', () => {
          focus = btn.dataset.focus;
          captionEl.textContent = captions[focus];
          container.querySelectorAll('.meta-pick').forEach((b) => {
            b.classList.toggle('btn-accent', b === btn);
          });
        });
      });

      function draw(ts) {
        renderer.render(canvas, demoState, obj, { alpha: 1, showOptimum: true, showTrails: false });
        const { ctx, width, height } = syncCanvasSize(canvas);
        const pulse = reducedMotion ? 0 : Math.sin(ts * 0.004) * 5;
        const scale = (Math.min(width, height) * 0.86) / (obj.max - obj.min);
        const toScreen = (wx, wy) => ({
          x: width / 2 + wx * scale,
          y: height / 2 - wy * scale
        });

        ctx.save();
        if (focus === 'frog') {
          const p = toScreen(-1.6, 1.3);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 22 + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#ecfdf5';
          ctx.fillText('Katak = Solusi (-1.6, 1.3)', p.x + 28, p.y + 5);
        } else if (focus === 'memeplex') {
          [
            { x: -1.6, y: 1.3, c: MEMEPLEX_COLORS[0], lbl: 'Memeplex M1' },
            { x: 1.4, y: 1.5, c: MEMEPLEX_COLORS[1], lbl: 'Memeplex M2' },
            { x: -1.5, y: -2.1, c: MEMEPLEX_COLORS[2], lbl: 'Memeplex M3' }
          ].forEach((g) => {
            const p = toScreen(g.x, g.y);
            ctx.strokeStyle = g.c;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 28 + pulse * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = g.c;
            ctx.fillText(g.lbl, p.x + 32, p.y + 4);
          });
        } else if (focus === 'fitness') {
          const center = toScreen(0, 0);
          for (const r of [45, 95, 150]) {
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(center.x, center.y, r + pulse * 0.4, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (focus === 'xg') {
          const p = toScreen(0.25, -0.2);
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 26 + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#fde047';
          ctx.fillText('Xg: Terbaik Global', p.x + 30, p.y - 8);
        }
        ctx.restore();

        if (!reducedMotion) {
          rafId = requestAnimationFrame(draw);
        }
      }

      rafId = requestAnimationFrame(draw);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  },

  // =========================================================================
  // SLIDE 5: SFLA TAHAP 1-3 (INISIALISASI, URUTKAN, PARTISI BERGILIR)
  // =========================================================================
  {
    id: 'sfla-partition',
    shortTitle: 'SFLA: Partisi Memeplex',
    title: 'Tahap 1–3: Urutkan & Partisi Bergilir ke Memeplex',
    theme: 'sfla',
    notes: `
      <ul>
        <li><strong>Mengapa dibagi bergilir (round-robin), bukan dipotong blok langsung?</strong></li>
        <li>Jika katak #1–#4 semuanya masuk M1 dan #9–#12 masuk M3, maka M3 hanya berisi katak buruk dan tidak punya guru yang pintar!</li>
        <li>Dengan pembagian bergilir (<code>#1→M1, #2→M2, #3→M3, #4→M1...</code>), <strong>setiap memeplex memiliki campuran katak kuat dan katak lemah yang seimbang</strong>.</li>
        <li>Klik tombol tahap 1 → 2 → 3 di bawah untuk memperlihatkan animasinya secara langsung!</li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 5 · Modul SFLA (2/6): Tahap 1 s.d. 3</div>
            <h1 class="slide-heading">Urutkan Fitness &amp; Partisi Bergilir (Round-Robin)</h1>
            <p class="slide-keyline">Katak diurutkan dari terbaik ke terburuk, lalu dibagi bergilir agar setiap memeplex seimbang kekuatannya.</p>
          </div>
        </div>

        <div class="card-panel" style="flex:1; display:flex; flex-direction:column; gap:0.9rem;">
          <div class="ctrl-bar" style="justify-content:space-between;">
            <div style="display:flex; gap:0.55rem; flex-wrap:wrap;" id="part-steps">
              <button type="button" class="btn btn-accent" data-stage="0">1. Inisialisasi Acak (F = 12)</button>
              <button type="button" class="btn" data-stage="1">2. Evaluasi &amp; Urutkan (#1..#12)</button>
              <button type="button" class="btn" data-stage="2">3. Partisi Bergilir ke 3 Memeplex</button>
            </div>
            <div id="part-hint" style="font-size:var(--fs-ui); font-weight:700; color:var(--theme-primary);">
              Tahap 1: 12 katak tersebar acak dengan nilai fitness beragam
            </div>
          </div>

          <div class="canvas-card" style="flex:1; border-radius:14px; border:1px solid var(--border-subtle);">
            <canvas id="partition-anim-canvas"></canvas>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#partition-anim-canvas');
      const hintEl = container.querySelector('#part-hint');

      // 12 katak dengan fitness terdefinisi jelas untuk demo visual
      const baseFrogs = [
        { rank: 0, fit: 0.4, rx: 0.48, ry: 0.52 },
        { rank: 1, fit: 1.1, rx: 0.34, ry: 0.38 },
        { rank: 2, fit: 1.9, rx: 0.62, ry: 0.42 },
        { rank: 3, fit: 3.2, rx: 0.24, ry: 0.66 },
        { rank: 4, fit: 4.5, rx: 0.72, ry: 0.64 },
        { rank: 5, fit: 5.8, rx: 0.55, ry: 0.25 },
        { rank: 6, fit: 7.4, rx: 0.18, ry: 0.31 },
        { rank: 7, fit: 9.1, rx: 0.81, ry: 0.35 },
        { rank: 8, fit: 11.3, rx: 0.41, ry: 0.78 },
        { rank: 9, fit: 13.8, rx: 0.85, ry: 0.73 },
        { rank: 10, fit: 16.2, rx: 0.14, ry: 0.76 },
        { rank: 11, fit: 19.5, rx: 0.68, ry: 0.19 }
      ].map((f) => ({ ...f, cx: f.rx, cy: f.ry, tx: f.rx, ty: f.ry }));

      let stage = 0;
      let rafId = null;

      function updateTargets(newStage) {
        stage = newStage;
        container.querySelectorAll('#part-steps .btn').forEach((b) => {
          b.classList.toggle('btn-accent', Number(b.dataset.stage) === stage);
        });

        if (stage === 0) {
          hintEl.textContent = 'Tahap 1: 12 katak tersebar acak di kolam';
          baseFrogs.forEach((f) => {
            f.tx = f.rx;
            f.ty = f.ry;
          });
        } else if (stage === 1) {
          hintEl.textContent = 'Tahap 2: Diurutkan dari fitness terkecil (#1 terbaik) ke terbesar (#12 terburuk)';
          baseFrogs.forEach((f, idx) => {
            f.tx = 0.08 + (idx / 11) * 0.84;
            f.ty = 0.5;
          });
        } else {
          hintEl.textContent = 'Tahap 3: Katak ke-i masuk Memeplex (i mod 3) → tiap kelompok seimbang!';
          baseFrogs.forEach((f, idx) => {
            const col = idx % 3; // M1, M2, M3
            const row = Math.floor(idx / 3); // 0..3
            f.tx = 0.22 + col * 0.28;
            f.ty = 0.27 + row * 0.175;
          });
        }
      }

      container.querySelectorAll('#part-steps .btn').forEach((btn) => {
        btn.addEventListener('click', () => updateTargets(Number(btn.dataset.stage)));
      });

      function tick() {
        const { ctx, width, height } = syncCanvasSize(canvas);
        ctx.clearRect(0, 0, width, height);

        // Gambar kotak kolom Memeplex saat stage === 2
        if (stage === 2) {
          for (let col = 0; col < 3; col++) {
            const boxX = width * (0.22 + col * 0.28) - width * 0.11;
            const boxY = height * 0.11;
            const boxW = width * 0.22;
            const boxH = height * 0.81;
            const c = MEMEPLEX_COLORS[col];

            ctx.save();
            ctx.fillStyle = 'rgba(10, 35, 32, 0.72)';
            ctx.strokeStyle = c;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 16);
            ctx.fill();
            ctx.stroke();

            ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = c;
            ctx.textAlign = 'center';
            ctx.fillText(`Memeplex M${col + 1}`, boxX + boxW / 2, boxY + 30);
            ctx.restore();
          }
        } else if (stage === 1) {
          ctx.save();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(width * 0.06, height * 0.5);
          ctx.lineTo(width * 0.94, height * 0.5);
          ctx.stroke();

          ctx.font = '700 15px "Ubuntu Mono", monospace';
          ctx.fillStyle = '#fde047';
          ctx.fillText('← TERBAIK (Xg)', width * 0.06, height * 0.34);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#fb7185';
          ctx.fillText('TERBURUK →', width * 0.94, height * 0.34);
          ctx.restore();
        }

        // Interpolasi posisi katak
        for (const f of baseFrogs) {
          const speed = reducedMotion ? 1 : 0.11;
          f.cx += (f.tx - f.cx) * speed;
          f.cy += (f.ty - f.cy) * speed;

          const px = f.cx * width;
          const py = f.cy * height;
          const mIdx = f.rank % 3;
          const color = stage === 2 ? MEMEPLEX_COLORS[mIdx] : stage === 1 && f.rank === 0 ? '#fbbf24' : '#34d399';

          ctx.save();
          ctx.translate(px, py);

          ctx.beginPath();
          ctx.arc(0, 0, 21, 0, Math.PI * 2);
          ctx.fillStyle = f.rank === 0 && stage >= 1 ? '#fbbf24' : color;
          ctx.strokeStyle = '#041311';
          ctx.lineWidth = 2.5;
          ctx.fill();
          ctx.stroke();

          ctx.font = '800 14px "Ubuntu Mono", monospace';
          ctx.fillStyle = '#021310';
          ctx.textAlign = 'center';
          ctx.fillText(`#${f.rank + 1}`, 0, 5);

          ctx.font = '700 13px "Ubuntu Mono", monospace';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(`f=${f.fit.toFixed(1)}`, 0, 36);

          // Tandai Xb dan Xw di tiap memeplex pada stage 2
          if (stage === 2 && f.rank < 3) {
            ctx.fillStyle = '#fde047';
            ctx.fillText(f.rank === 0 ? 'Xg / Xb' : 'Xb', 0, -28);
          } else if (stage === 2 && f.rank >= 9) {
            ctx.fillStyle = '#fda4af';
            ctx.fillText('Xw', 0, -28);
          }

          ctx.restore();
        }

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  },

  // =========================================================================
  // SLIDE 6: SFLA TAHAP 4 (EVOLUSI LOKAL & ATURAN LOMPATAN)
  // =========================================================================
  {
    id: 'sfla-leap',
    shortTitle: 'SFLA: Lompatan Lokal',
    title: 'Tahap 4: Evolusi Lokal & 3 Skenario Lompatan',
    theme: 'sfla',
    notes: `
      <ul>
        <li><strong>Hanya katak terburuk (<code>Xw</code>) yang melompat</strong> pada tiap langkah lokal di submemeplex.</li>
        <li><strong>Urutan 3 percobaan berjenjang:</strong>
          <ol>
            <li>Lompat ke arah pemimpin kelompok <code>Xb</code>. Jika posisinya lebih rendah (fitness membaik) → selesai!</li>
            <li>Jika gagal membaik, coba lompat ke arah pemimpin seluruh kolam <code>Xg</code>.</li>
            <li>Jika masih gagal membaik, ganti <code>Xw</code> dengan katak acak baru (mencegah kebuntuan lokal).</li>
          </ol>
        </li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 6 · Modul SFLA (3/6): Tahap 4</div>
            <h1 class="slide-heading">Tiga Percobaan Lompatan Katak Terburuk (Xw)</h1>
            <p class="slide-keyline">Katak terburuk melompat menuju terbaik kelompok (<code>Xb</code>); bila gagal membaik, ia meniru <code>Xg</code> atau diganti katak acak.</p>
          </div>
        </div>

        <div class="split-grid">
          <div class="card-panel canvas-card">
            <div class="stage-hud-overlay">
              <div class="stage-badge">
                <span class="stage-badge-code" id="leap-badge-code">SKENARIO 1</span>
                <span id="leap-badge-text">Lompatan ke arah Xb berhasil memperbaiki fitness!</span>
              </div>
            </div>
            <canvas id="leap-sandbox-canvas"></canvas>
          </div>

          <div class="card-panel" style="justify-content:space-between; gap:0.85rem;">
            <div style="display:flex; flex-direction:column; gap:0.6rem;" id="leap-case-btns">
              <div style="font-size:var(--fs-small); color:var(--theme-primary); font-weight:700;">
                Uji Ketiga Cabang Aturan Lompatan
              </div>
              <button type="button" class="btn btn-accent" data-case="xb" style="justify-content:flex-start; text-align:left; padding:0.75rem 1rem;">
                <span class="role-chip">1</span>
                <span><strong>Ke arah Xb Berhasil:</strong> <code>f(Xbaru) &lt; f(Xw)</code></span>
              </button>
              <button type="button" class="btn" data-case="xg" style="justify-content:flex-start; text-align:left; padding:0.75rem 1rem;">
                <span class="role-chip">2</span>
                <span><strong>Gagal di Xb → Ke Xg:</strong> Meniru terbaik global</span>
              </button>
              <button type="button" class="btn" data-case="rand" style="justify-content:flex-start; text-align:left; padding:0.75rem 1rem;">
                <span class="role-chip">3</span>
                <span><strong>Keduanya Gagal → Acak Baru:</strong> Sensor eksplorasi ↺</span>
              </button>
            </div>

            <div class="formula-box" id="leap-formula">
              <code>X_baru = Xw + r · (Xb − Xw), &nbsp; r ∈ [0, 1], &nbsp; ‖ΔX‖ ≤ Dmax</code>
            </div>

            <p id="leap-explain" style="margin:0; font-size:var(--fs-ui); color:var(--text-secondary);">
              Faktor acak <code>r</code> membuat katak mendarat di antara posisinya saat ini dan sang pemimpin kelompok, dibatasi langkah maksimum <code>Dmax</code>.
            </p>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#leap-sandbox-canvas');
      const badgeCode = container.querySelector('#leap-badge-code');
      const badgeText = container.querySelector('#leap-badge-text');
      const formulaEl = container.querySelector('#leap-formula');
      const explainEl = container.querySelector('#leap-explain');
      const renderer = new SFLARenderer();
      const obj = getObjective('rastrigin');

      let activeCase = 'xb';
      let animStart = performance.now();
      let rafId = null;

      function setScenario(c) {
        activeCase = c;
        animStart = performance.now();
        container.querySelectorAll('#leap-case-btns .btn').forEach((b) => {
          b.classList.toggle('btn-accent', b.dataset.case === c);
        });
        if (c === 'xb') {
          badgeCode.textContent = 'PERCOBAAN 1 [OK]';
          badgeText.textContent = 'Xw melompat ke arah Xb dan mendarat di cekungan lebih rendah!';
          formulaEl.innerHTML = '<code>X_baru = Xw + r · (Xb − Xw), &nbsp; f(X_baru) &lt; f(Xw)</code>';
          explainEl.textContent = 'Mayoritas langkah lokal berhasil pada percobaan pertama menuju pemimpin memeplex (Xb).';
        } else if (c === 'xg') {
          badgeCode.textContent = 'PERCOBAAN 2 [OK]';
          badgeText.textContent = 'Lompatan ke Xb terhalang bukit → beralih melompat ke Xg!';
          formulaEl.innerHTML = '<code>X_baru = Xw + r · (Xg − Xw) &nbsp; [setelah arah Xb gagal]</code>';
          explainEl.textContent = 'Garis merah putus-putus menunjukkan percobaan ke Xb mendarat di punggung bukit, lalu Xw berhasil menuju Xg.';
        } else {
          badgeCode.textContent = 'PERCOBAAN 3 ↺';
          badgeText.textContent = 'Terjebak punggung bukit → diganti katak baru di posisi acak!';
          formulaEl.innerHTML = '<code>X_baru = LB + rand · (UB − LB) &nbsp; [Sensor Eksplorasi]</code>';
          explainEl.textContent = 'Jika arah Xb maupun Xg sama-sama memburuk, katak baru muncul acak agar populasi tidak buntu.';
        }
      }

      container.querySelectorAll('#leap-case-btns .btn').forEach((b) => {
        b.addEventListener('click', () => setScenario(b.dataset.case));
      });

      function tick(now) {
        const elapsed = ((now - animStart) % 2400) / 2400;
        const alpha = reducedMotion ? 1 : Math.min(1, elapsed * 1.45);

        const xwStart = { x: -3.4, y: -2.6 };
        const xbPos = { x: -1.95, y: 1.95 };
        const xgPos = { x: 0.0, y: 0.0 };

        let toPos = { x: -2.02, y: 0.98 };
        let jumpType = 'XB_SUCCESS';
        if (activeCase === 'xg') {
          toPos = { x: -1.0, y: -0.95 };
          jumpType = 'XG_SUCCESS';
        } else if (activeCase === 'rand') {
          toPos = { x: 2.95, y: -1.98 };
          jumpType = 'RANDOM_RESET';
        }

        const state = {
          phase: 'LOCAL_JUMP',
          frogs: [
            { id: 1, x: xgPos.x, y: xgPos.y, prevX: xgPos.x, prevY: xgPos.y, fitness: 0, memeplex: 1, role: 'global_best', trail: [] },
            { id: 2, x: xbPos.x, y: xbPos.y, prevX: xbPos.x, prevY: xbPos.y, fitness: 7.8, memeplex: 0, role: 'memeplex_best', trail: [] },
            { id: 3, x: toPos.x, y: toPos.y, prevX: xwStart.x, prevY: xwStart.y, fitness: 9.0, memeplex: 0, role: 'memeplex_worst', trail: [] }
          ],
          jumps: [
            {
              frogId: 3,
              memeplex: 0,
              fromX: xwStart.x,
              fromY: xwStart.y,
              toX: toPos.x,
              toY: toPos.y,
              failedXbX: xbPos.x,
              failedXbY: xbPos.y,
              type: jumpType,
              improved: activeCase !== 'rand',
              triedXbFailed: activeCase !== 'xb'
            }
          ],
          bestFrog: { id: 1, x: 0, y: 0, fitness: 0 }
        };

        renderer.render(canvas, state, obj, { alpha, showOptimum: true, showTrails: false });
        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  },

  // =========================================================================
  // SLIDE 7: SFLA TAHAP 5 (SHUFFLE GLOBAL)
  // =========================================================================
  {
    id: 'sfla-shuffle',
    shortTitle: 'SFLA: Shuffle Global',
    title: 'Tahap 5: Pengacakan Ulang (Shuffle) Antar-Memeplex',
    theme: 'sfla',
    notes: `
      <ul>
        <li><strong>Mengapa disebut "Shuffled" Frog-Leaping?</strong> Inilah jantung pertukaran informasi globalnya!</li>
        <li>Setelah tiap memeplex berevolusi sendiri-sendiri sebanyak <code>N</code> langkah, mereka bisa punya "budaya lokal" yang sempit.</li>
        <li>Dengan <strong>Shuffle</strong>, semua katak dilebur kembali ke satu kolam besar, diurutkan ulang, lalu dibagi ke memeplex baru sehingga pengetahuan dari M1 menular ke M2 dan M3!</li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 7 · Modul SFLA (4/6): Tahap 5</div>
            <h1 class="slide-heading">Shuffle: Menyatukan Temuan dari Seluruh Kelompok</h1>
            <p class="slide-keyline">Seluruh katak dikumpulkan kembali, diurutkan ulang, dan dibagi ke memeplex baru agar informasi terbaik menyebar global.</p>
          </div>
        </div>

        <div class="card-panel" style="flex:1; display:flex; flex-direction:column; gap:0.9rem;">
          <div class="ctrl-bar" style="justify-content:space-between;">
            <div style="display:flex; gap:0.55rem; flex-wrap:wrap;" id="shuf-btns">
              <button type="button" class="btn btn-accent" data-step="0">Sebelum Shuffle (Terpisah Lokal)</button>
              <button type="button" class="btn" data-step="1">Lebur &amp; Urutkan Ulang Global</button>
              <button type="button" class="btn" data-step="2">Memeplex Baru (Lintas Kelompok!)</button>
            </div>
            <span id="shuf-caption" style="font-size:var(--fs-ui); font-weight:700; color:var(--theme-primary);">
              Tiap kelompok selesai melakukan pencarian lokal di area masing-masing
            </span>
          </div>

          <div class="canvas-card" style="flex:1; border-radius:14px; border:1px solid var(--border-subtle);">
            <canvas id="shuffle-demo-canvas"></canvas>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#shuffle-demo-canvas');
      const capEl = container.querySelector('#shuf-caption');

      // 9 katak awalnya di 3 memeplex lama (oldM), setelah evolusi lokal fitness-nya berubah sehingga memeplex baru (newM) berbeda!
      const nodes = [
        { id: 'A', oldM: 0, newRank: 0, newM: 0 },
        { id: 'B', oldM: 2, newRank: 1, newM: 1 },
        { id: 'C', oldM: 0, newRank: 2, newM: 2 },
        { id: 'D', oldM: 1, newRank: 3, newM: 0 },
        { id: 'E', oldM: 2, newRank: 4, newM: 1 },
        { id: 'F', oldM: 1, newRank: 5, newM: 2 },
        { id: 'G', oldM: 0, newRank: 6, newM: 0 },
        { id: 'H', oldM: 1, newRank: 7, newM: 1 },
        { id: 'I', oldM: 2, newRank: 8, newM: 2 }
      ].map((n, i) => ({ ...n, cx: 0.5, cy: 0.5, tx: 0.5, ty: 0.5, slotOld: Math.floor(i / 3) }));

      let stepMode = 0;
      let rafId = null;

      function applyStep(s) {
        stepMode = s;
        container.querySelectorAll('#shuf-btns .btn').forEach((b) => {
          b.classList.toggle('btn-accent', Number(b.dataset.step) === s);
        });

        if (s === 0) {
          capEl.textContent = '3 memeplex lama terpisah setelah evolusi lokal selesai';
          const counts = [0, 0, 0];
          nodes.forEach((n) => {
            const idxInM = counts[n.oldM]++;
            const cx = 0.2 + n.oldM * 0.3;
            const angle = (idxInM / 3) * Math.PI * 2 - Math.PI / 2;
            n.tx = cx + Math.cos(angle) * 0.065;
            n.ty = 0.52 + Math.sin(angle) * 0.14;
          });
        } else if (s === 1) {
          capEl.textContent = 'Semua katak digabung ke kolam pusat dan diurutkan ulang menurut fitness terbaru';
          nodes.forEach((n) => {
            n.tx = 0.12 + (n.newRank / 8) * 0.76;
            n.ty = 0.52;
          });
        } else {
          capEl.textContent = 'Partisi ulang! Perhatikan katak bertukar warna kelompok & membawa informasi baru';
          const counts = [0, 0, 0];
          nodes.forEach((n) => {
            const idxInM = counts[n.newM]++;
            const cx = 0.2 + n.newM * 0.3;
            const angle = (idxInM / 3) * Math.PI * 2 - Math.PI / 2;
            n.tx = cx + Math.cos(angle) * 0.065;
            n.ty = 0.52 + Math.sin(angle) * 0.14;
          });
        }
      }

      applyStep(0);
      nodes.forEach((n) => {
        n.cx = n.tx;
        n.cy = n.ty;
      });

      container.querySelectorAll('#shuf-btns .btn').forEach((b) => {
        b.addEventListener('click', () => applyStep(Number(b.dataset.step)));
      });

      function tick() {
        const { ctx, width, height } = syncCanvasSize(canvas);
        ctx.clearRect(0, 0, width, height);

        if (stepMode === 0 || stepMode === 2) {
          for (let m = 0; m < 3; m++) {
            const cx = width * (0.2 + m * 0.3);
            const cy = height * 0.52;
            const r = Math.min(width, height) * 0.23;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
            ctx.strokeStyle = MEMEPLEX_COLORS[m];
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = MEMEPLEX_COLORS[m];
            ctx.textAlign = 'center';
            ctx.fillText(
              stepMode === 0 ? `Memeplex Lama M${m + 1}` : `Memeplex Baru M${m + 1}`,
              cx,
              cy - r - 14
            );
            ctx.restore();
          }
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(width * 0.07, height * 0.32, width * 0.86, height * 0.4, 24);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.09)';
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
          ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#ecfdf5';
          ctx.textAlign = 'center';
          ctx.fillText('KOLAM GABUNGAN GLOBAL (TERURUT TERBAIK → TERBURUK)', width * 0.5, height * 0.25);
          ctx.restore();
        }

        for (const n of nodes) {
          const sp = reducedMotion ? 1 : 0.1;
          n.cx += (n.tx - n.cx) * sp;
          n.cy += (n.ty - n.cy) * sp;

          const px = n.cx * width;
          const py = n.cy * height;
          const activeColor = stepMode === 2 ? MEMEPLEX_COLORS[n.newM] : MEMEPLEX_COLORS[n.oldM];

          ctx.save();
          ctx.translate(px, py);

          // Cincin luar menunjukkan warna kelompok asal saat sudah berpindah ke kelompok baru!
          if (stepMode === 2 && n.oldM !== n.newM) {
            ctx.beginPath();
            ctx.arc(0, 0, 27, 0, Math.PI * 2);
            ctx.strokeStyle = MEMEPLEX_COLORS[n.oldM];
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(0, 0, 21, 0, Math.PI * 2);
          ctx.fillStyle = activeColor;
          ctx.strokeStyle = '#041311';
          ctx.lineWidth = 2.5;
          ctx.fill();
          ctx.stroke();

          ctx.font = '800 15px "Ubuntu Mono", monospace';
          ctx.fillStyle = '#021310';
          ctx.textAlign = 'center';
          ctx.fillText(n.id, 0, 5);

          if (stepMode === 2 && n.oldM !== n.newM) {
            ctx.font = '700 11px "Ubuntu Mono", monospace';
            ctx.fillStyle = '#fde047';
            ctx.fillText(`dari M${n.oldM + 1}`, 0, 38);
          }

          ctx.restore();
        }

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  },

  // =========================================================================
  // SLIDE 8: RINGKASAN SIKLUS LENGKAP SFLA
  // =========================================================================
  {
    id: 'sfla-cycle',
    shortTitle: 'SFLA: Alur Lengkap',
    title: 'Alur Lengkap Algoritma SFLA',
    theme: 'sfla',
    notes: `
      <ul>
        <li>Gunakan slide ini sebagai peta besar sebelum kita menyalakan simulasi SFLA penuh di slide berikutnya.</li>
        <li>Klik tahap mana pun pada kartu 1–6 untuk melihat rumus dan perannya terhadap eksplorasi/eksploitasi.</li>
      </ul>
    `,
    mount(container) {
      const stages = [
        {
          num: 'Tahap 1',
          name: 'Inisialisasi Populasi',
          role: 'Eksplorasi Awal',
          formula: 'Xi = LB + rand · (UB − LB),  i = 1..F',
          desc: 'Sebar F ekor katak secara acak merata di seluruh ruang pencarian kolam.'
        },
        {
          num: 'Tahap 2',
          name: 'Evaluasi & Urutkan',
          role: 'Seleksi Pemimpin',
          formula: 'Urutkan f(X1) ≤ f(X2) ≤ ... ≤ f(XF);  Xg = X1',
          desc: 'Hitung nilai fitness tiap katak dan tandai katak terbaik global dengan mahkota emas (Xg).'
        },
        {
          num: 'Tahap 3',
          name: 'Partisi ke Memeplex',
          role: 'Pembentukan Komunitas',
          formula: 'Katak peringkat ke-k → Memeplex (k mod m)',
          desc: 'Bagi katak secara bergilir ke m kelompok agar tiap kelompok memiliki katak unggul dan lemah.'
        },
        {
          num: 'Tahap 4',
          name: 'Evolusi Lokal (× N)',
          role: 'Eksploitasi Terarah + Sensor',
          formula: 'Xbaru = Xw + r·(Xb − Xw)  →  Xg  →  Acak',
          desc: 'Di tiap submemeplex, katak terburuk melompat ke Xb, atau Xg, atau diganti acak sebanyak N kali.'
        },
        {
          num: 'Tahap 5',
          name: 'Shuffle Global',
          role: 'Pertukaran Informasi Global',
          formula: 'Gabung seluruh m memeplex → Urutkan ulang F katak',
          desc: 'Satukan kembali semua kelompok sehingga temuan lokal menyebar ke seluruh populasi.'
        },
        {
          num: 'Tahap 6',
          name: 'Cek Terminasi',
          role: 'Kriteria Berhenti',
          formula: 'Ulangi Tahap 3–5 hingga iterasi = Iterasi_Maks',
          desc: 'Jika belum selesai, bagi ulang ke memeplex baru; jika selesai, keluarkan Xg sebagai solusi optimal.'
        }
      ];

      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 8 · Modul SFLA (5/6): Diagram Siklus</div>
            <h1 class="slide-heading">Enam Tahap Siklus SFLA</h1>
            <p class="slide-keyline">Perpaduan lompatan lokal di dalam memeplex dan <em>shuffle</em> global menciptakan konvergensi yang tangguh.</p>
          </div>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:1rem;">
          <div id="sfla-flow-cards" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.9rem; flex:1;">
            ${stages
              .map(
                (s, i) => `
              <button type="button" class="card-panel flow-step-card" data-idx="${i}" style="text-align:left; cursor:pointer; justify-content:space-between; border-color:${i === 3 ? 'var(--theme-primary)' : 'var(--border-subtle)'}; background:${i === 3 ? 'var(--theme-tint)' : 'var(--bg-card)'};">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                    <span class="tabular" style="font-size:var(--fs-ui); font-weight:800; color:var(--theme-primary);">${s.num}</span>
                    <span style="font-size:var(--fs-small); font-weight:600; padding:0.18rem 0.55rem; border-radius:999px; background:var(--bg-elevated); color:var(--theme-secondary);">${s.role}</span>
                  </div>
                  <div style="font-size:var(--fs-h2); font-weight:800; margin-bottom:0.35rem;">${s.name}</div>
                  <div style="font-size:var(--fs-ui); color:var(--text-secondary);">${s.desc}</div>
                </div>
              </button>
            `
              )
              .join('')}
          </div>

          <div class="formula-box" id="sfla-cycle-detail" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
            <span><strong>Tahap 4 (Evolusi Lokal):</strong> <code>Xbaru = Xw + r·(Xb − Xw) → Xg → Acak</code></span>
            <span style="color:var(--theme-primary); font-size:var(--fs-small);">Klik kartu tahap di atas untuk melihat rumus detail</span>
          </div>
        </div>
      `;

      const detailBox = container.querySelector('#sfla-cycle-detail');
      const cards = container.querySelectorAll('.flow-step-card');

      cards.forEach((card) => {
        card.addEventListener('click', () => {
          const idx = Number(card.dataset.idx);
          const st = stages[idx];
          cards.forEach((c) => {
            const active = c === card;
            c.style.borderColor = active ? 'var(--theme-primary)' : 'var(--border-subtle)';
            c.style.background = active ? 'var(--theme-tint)' : 'var(--bg-card)';
          });
          detailBox.innerHTML = `
            <span><strong>${st.num} (${st.name}):</strong> <code>${st.formula}</code></span>
            <span style="color:var(--theme-secondary); font-size:var(--fs-small);">${st.role}</span>
          `;
        });
      });
    }
  },

  // =========================================================================
  // SLIDE 9: SIMULASI INTERAKTIF SFLA PENUH (F-03, F-05..F-10, F-13)
  // =========================================================================
  {
    id: 'sfla-sim',
    shortTitle: 'Simulasi SFLA',
    title: 'Laboratorium Simulasi Interaktif SFLA',
    theme: 'sfla',
    notes: `
      <ul>
        <li><strong>Urutan demo yang disarankan di depan dosen:</strong>
          <ol>
            <li>Mulai pada fungsi <em>Sphere</em>, klik tombol kuning <strong>Step (S)</strong> 5–6 kali sambil tunjukkan lencana tahap di kiri atas: <code>Inisialisasi → Evaluasi &amp; Urutkan → Partisi Memeplex → Lompatan Lokal → Shuffle Global</code>.</li>
            <li>Klik <strong>Play (P)</strong> dan tunjukkan kurva konvergensi turun mulus mendekati <code>0.000</code>.</li>
            <li>Ganti fungsi ke <strong>Rastrigin</strong> (banyak jebakan lokal!) dan jalankan lagi: tunjukkan bagaimana lompatan ke <code>Xg</code> &amp; katak acak menyelamatkan populasi dari lembah lokal!</li>
            <li>Buka tombol <strong>Parameter</strong> bila ada pertanyaan tentang pengaruh jumlah katak <code>F</code>, memeplex <code>m</code>, atau seed tetap.</li>
          </ol>
        </li>
      </ul>
    `,
    mount(container, { reducedMotion, registerHooks }) {
      container.innerHTML = `
        <div class="slide-top" style="align-items:center;">
          <div>
            <div class="slide-context">Slide 9 · Modul SFLA (6/6): Simulasi Langsung</div>
            <h1 class="slide-heading" style="font-size:clamp(1.5rem, 2.2vw, 2.6rem);">Simulasi SFLA di Kolam Teratai</h1>
          </div>

          <div class="ctrl-bar">
            <button type="button" class="btn btn-accent" id="sfla-btn-play">▶ Play</button>
            <button type="button" class="btn btn-step" id="sfla-btn-step" title="Maju 1 tahap algoritma (Tombol S)">⏭ Step</button>
            <button type="button" class="btn" id="sfla-btn-reset" title="Ulangi dari awal (Tombol R)">↺ Reset</button>

            <label class="ctrl-field">
              <span>Fungsi:</span>
              <select class="ctrl-select" id="sfla-select-obj">
                <option value="sphere" selected>Sphere (1 Lembah)</option>
                <option value="rastrigin">Rastrigin (Banyak Lembah)</option>
                <option value="ackley">Ackley (Corong Pusat)</option>
              </select>
            </label>

            <label class="ctrl-field">
              <span>Kecepatan:</span>
              <input type="range" class="ctrl-range" id="sfla-speed" min="0.6" max="12" step="0.3" value="2.8" />
            </label>

            <button type="button" class="btn" id="sfla-btn-params" aria-expanded="false">Parameter</button>
          </div>
        </div>

        <div class="sim-layout">
          <div class="card-panel canvas-card">
            <div class="stage-hud-overlay">
              <div class="stage-badge">
                <span class="stage-badge-code" id="sfla-hud-code">INIT</span>
                <span id="sfla-hud-label">Inisialisasi Kolam</span>
              </div>
              <div class="hud-metrics">
                <div class="hud-pill">Siklus: <strong id="sfla-hud-iter">0 / 40</strong></div>
                <div class="hud-pill">Terbaik Xg: <strong id="sfla-hud-best">0.0000</strong></div>
              </div>
            </div>
            <canvas id="sfla-sim-canvas"></canvas>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.85rem; min-height:0;">
            <div class="card-panel" style="padding:0.9rem 1.1rem; gap:0.45rem;">
              <div style="font-size:var(--fs-small); color:var(--theme-primary); font-weight:700;">Status Tahap Saat Ini</div>
              <div id="sfla-stage-desc" style="font-size:var(--fs-ui); font-weight:600; color:var(--text-primary); min-height:2.8em;"></div>
              <div style="display:flex; gap:0.9rem; flex-wrap:wrap; font-size:var(--fs-small); color:var(--text-muted); padding-top:0.35rem; border-top:1px solid var(--border-subtle);">
                <span style="color:#fae0a5;">● Emas = <strong>Xg</strong></span>
                <span style="color:#43bf9c;">━━ Lompat Xb</span>
                <span style="color:#d8a33a;">━━ Lompat Xg</span>
                <span style="color:#d95b5b;">╌╌ Acak Baru</span>
              </div>
            </div>

            <div class="card-panel canvas-card" style="flex:1; min-height:170px;">
              <canvas id="sfla-chart-canvas"></canvas>
            </div>

            <div class="card-panel" style="padding:0.75rem 1rem; flex-direction:row; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:var(--fs-small); font-weight:700; cursor:pointer;">
                <input type="checkbox" id="sfla-chk-opt" checked style="width:17px; height:17px; accent-color:var(--gold-crown);" />
                <span>Target Optimum (0, 0)</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:var(--fs-small); font-weight:700; cursor:pointer;">
                <input type="checkbox" id="sfla-chk-trail" checked style="width:17px; height:17px; accent-color:var(--theme-primary);" />
                <span>Jejak Katak</span>
              </label>
              <span class="tabular" style="font-size:var(--fs-small); font-weight:700; color:var(--text-muted);" id="sfla-coord-readout">(0.00, 0.00)</span>
            </div>
          </div>

          <!-- Collapsible Parameter Panel (F-06) -->
          <div class="param-drawer hidden" id="sfla-param-drawer">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:var(--fs-ui); color:var(--theme-primary);">Parameter Algoritma SFLA</strong>
              <button type="button" class="close-btn" id="sfla-close-params" aria-label="Tutup Parameter">&times;</button>
            </div>

            <div class="param-row">
              <label>Jumlah Katak (F) <span class="val" id="val-sfla-f">24</span></label>
              <input type="range" class="ctrl-range" style="width:100%;" id="inp-sfla-f" min="8" max="72" step="4" value="24" />
            </div>

            <div class="param-row">
              <label>Jumlah Memeplex (m) <span class="val" id="val-sfla-m">4</span></label>
              <input type="range" class="ctrl-range" style="width:100%;" id="inp-sfla-m" min="2" max="6" step="1" value="4" />
            </div>

            <div class="param-row">
              <label>Iterasi Lokal (N) <span class="val" id="val-sfla-n">3</span></label>
              <input type="range" class="ctrl-range" style="width:100%;" id="inp-sfla-n" min="1" max="10" step="1" value="3" />
            </div>

            <div class="param-row">
              <label>Langkah Maksimum (Dmax) <span class="val" id="val-sfla-dmax">3.2</span></label>
              <input type="range" class="ctrl-range" style="width:100%;" id="inp-sfla-dmax" min="0.8" max="6.0" step="0.2" value="3.2" />
            </div>

            <div class="param-row">
              <label for="inp-sfla-seed">Seed Acak (Reprodusibel)</label>
              <input type="number" class="ctrl-input" id="inp-sfla-seed" value="42" />
            </div>

            <button type="button" class="btn btn-accent" id="sfla-apply-params" style="margin-top:0.4rem;">
              Terapkan &amp; Reset Simulasi
            </button>
          </div>
        </div>
      `;

      const simCanvas = container.querySelector('#sfla-sim-canvas');
      const chartCanvas = container.querySelector('#sfla-chart-canvas');
      const btnPlay = container.querySelector('#sfla-btn-play');
      const btnStep = container.querySelector('#sfla-btn-step');
      const btnReset = container.querySelector('#sfla-btn-reset');
      const selObj = container.querySelector('#sfla-select-obj');
      const speedInput = container.querySelector('#sfla-speed');
      const chkOpt = container.querySelector('#sfla-chk-opt');
      const chkTrail = container.querySelector('#sfla-chk-trail');

      const hudCode = container.querySelector('#sfla-hud-code');
      const hudLabel = container.querySelector('#sfla-hud-label');
      const hudIter = container.querySelector('#sfla-hud-iter');
      const hudBest = container.querySelector('#sfla-hud-best');
      const stageDesc = container.querySelector('#sfla-stage-desc');
      const coordReadout = container.querySelector('#sfla-coord-readout');

      const drawer = container.querySelector('#sfla-param-drawer');
      const btnParams = container.querySelector('#sfla-btn-params');
      const inpF = container.querySelector('#inp-sfla-f');
      const inpM = container.querySelector('#inp-sfla-m');
      const inpN = container.querySelector('#inp-sfla-n');
      const inpDmax = container.querySelector('#inp-sfla-dmax');
      const inpSeed = container.querySelector('#inp-sfla-seed');

      let currentObj = getObjective(selObj.value);
      const renderer = new SFLARenderer();
      const engine = new SFLAEngine({
        objective: currentObj,
        populationSize: Number(inpF.value),
        memeplexCount: Number(inpM.value),
        localIterations: Number(inpN.value),
        maxStep: Number(inpDmax.value),
        maxIterations: 40,
        seed: Number(inpSeed.value)
      });

      function updateHudAndChart() {
        const st = engine.getState();
        hudCode.textContent = st.phase;
        hudLabel.textContent = st.phaseLabel;
        hudIter.textContent = `${st.iteration} / ${st.maxIterations}`;
        const bf = st.bestFrog.fitness;
        hudBest.textContent = bf < 0.0001 ? bf.toExponential(2) : bf.toFixed(4);
        stageDesc.textContent = st.phaseDetail;
        coordReadout.textContent = `Xg: (${st.bestFrog.x.toFixed(2)}, ${st.bestFrog.y.toFixed(2)})`;

        renderConvergenceChart(
          chartCanvas,
          [
            {
              label: 'SFLA',
              color: '#34d399',
              fillTop: 'rgba(52, 211, 153, 0.28)',
              data: st.history
            }
          ],
          { maxIterations: st.maxIterations, title: 'Konvergensi Fitness Terbaik (SFLA)' }
        );
      }

      const runner = new SimulationRunner({
        stepsPerSecond: Number(speedInput.value),
        reducedMotion,
        onStep: () => {
          const st = engine.step();
          updateHudAndChart();
          return st.phase === 'DONE';
        },
        onRender: (alpha) => {
          renderer.render(simCanvas, engine.getState(), currentObj, {
            alpha,
            showOptimum: chkOpt.checked,
            showTrails: chkTrail.checked
          });
        }
      });

      runner.onPlayStateChange = (isPlaying) => {
        btnPlay.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
      };

      function rebuildSimulation() {
        currentObj = getObjective(selObj.value);
        engine.configure({
          objective: currentObj,
          populationSize: Number(inpF.value),
          memeplexCount: Number(inpM.value),
          localIterations: Number(inpN.value),
          maxStep: Number(inpDmax.value),
          maxIterations: 40,
          seed: Number(inpSeed.value)
        });
        runner.notifyReset();
        updateHudAndChart();
      }

      btnPlay.addEventListener('click', () => {
        if (engine.getState().phase === 'DONE') rebuildSimulation();
        runner.togglePlay();
      });
      btnStep.addEventListener('click', () => runner.stepOnce());
      btnReset.addEventListener('click', () => rebuildSimulation());
      selObj.addEventListener('change', () => rebuildSimulation());
      speedInput.addEventListener('input', () => runner.setSpeed(Number(speedInput.value)));

      btnParams.addEventListener('click', () => {
        const hidden = drawer.classList.toggle('hidden');
        btnParams.setAttribute('aria-expanded', String(!hidden));
      });
      container.querySelector('#sfla-close-params').addEventListener('click', () => {
        drawer.classList.add('hidden');
        btnParams.setAttribute('aria-expanded', 'false');
      });

      [
        [inpF, '#val-sfla-f'],
        [inpM, '#val-sfla-m'],
        [inpN, '#val-sfla-n'],
        [inpDmax, '#val-sfla-dmax']
      ].forEach(([inp, sel]) => {
        inp.addEventListener('input', () => {
          container.querySelector(sel).textContent = inp.value;
        });
      });

      container.querySelector('#sfla-apply-params').addEventListener('click', () => {
        drawer.classList.add('hidden');
        rebuildSimulation();
      });

      const onResize = () => updateHudAndChart();
      window.addEventListener('resize', onResize);

      registerHooks({
        togglePlay: () => btnPlay.click(),
        step: () => btnStep.click(),
        reset: () => btnReset.click()
      });

      updateHudAndChart();
      runner.startLoop();

      return () => {
        window.removeEventListener('resize', onResize);
        runner.destroy();
      };
    }
  }
];
