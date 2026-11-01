/**
 * Modul Slide WCA (Slide 10–15) — Metafora Siklus Air (PRD Bagian 8)
 */

import { getObjective } from '../core/objectives.js';
import { SimulationRunner } from '../core/engine.js';
import { WCAEngine } from '../algorithms/wca.js';
import { WCARenderer } from '../render/wcaRenderer.js';
import { syncCanvasSize } from '../render/contourRenderer.js';
import { renderConvergenceChart } from '../render/chart.js';

export const wcaSlides = [
  // =========================================================================
  // SLIDE 10: PENGANTAR & METAFORA SIKLUS AIR (WCA)
  // =========================================================================
  {
    id: 'wca-intro',
    shortTitle: 'WCA: Metafora Siklus Air',
    title: 'Water Cycle Algorithm (WCA)',
    theme: 'wca',
    notes: `
      <ul>
        <li><strong>Asal-usul:</strong> Diperkenalkan oleh Eskandar dkk. (2012), terinspirasi dari gravitasi air hujan yang selalu mencari titik permukaan bumi paling rendah (Laut).</li>
        <li><strong>Klik 4 elemen di kanan</strong> untuk menyorot hierarki hidrologi pada peta:
          <ul>
            <li><strong>Laut (Sea):</strong> 1 solusi terbaik global saat ini.</li>
            <li><strong>Sungai (River):</strong> <code>Nsr − 1</code> solusi terbaik berikutnya.</li>
            <li><strong>Aliran (Stream):</strong> Tetesan kecil di lereng bukit yang mengalir menuju sungai/laut.</li>
            <li><strong>Penguapan &amp; Hujan:</strong> Daur ulang populasi saat sungai sudah berkumpul di muara laut.</li>
          </ul>
        </li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 10 · Modul WCA (1/6): Konsep &amp; Metafora</div>
            <h1 class="slide-heading">Metafora Siklus Air Menuju Laut</h1>
            <p class="slide-keyline">Aliran kecil mengalir ke sungai, sungai bermuara ke laut (titik terbaik), lalu penguapan dan hujan menjaga keragaman.</p>
          </div>
        </div>

        <div class="split-grid">
          <div class="card-panel canvas-card">
            <canvas id="wca-meta-canvas"></canvas>
          </div>

          <div class="card-panel" style="justify-content:space-between; gap:0.75rem;">
            <div style="font-size:var(--fs-small); color:var(--theme-primary); font-weight:700;">
              Klik Elemen Siklus Air untuk Menyorot Perannya
            </div>

            <button type="button" class="btn btn-accent wca-pick" data-focus="sea" style="justify-content:space-between; padding:0.75rem 1rem; text-align:left;">
              <span style="display:inline-flex; align-items:center; gap:0.65rem;"><span class="role-chip" style="color:#fae0a5; border-color:#d8a33a;">SEA</span> <span><strong>Laut (Sea)</strong> → Solusi Terbaik Global (#1)</span></span>
              <span class="tabular" style="font-size:0.85em; color:var(--text-secondary);">1 Agen</span>
            </button>

            <button type="button" class="btn wca-pick" data-focus="river" style="justify-content:space-between; padding:0.75rem 1rem; text-align:left;">
              <span style="display:inline-flex; align-items:center; gap:0.65rem;"><span class="role-chip">RIV</span> <span><strong>Sungai (River)</strong> → Terbaik Berikutnya</span></span>
              <span class="tabular" style="font-size:0.85em; color:var(--text-secondary);">Nsr − 1</span>
            </button>

            <button type="button" class="btn wca-pick" data-focus="stream" style="justify-content:space-between; padding:0.75rem 1rem; text-align:left;">
              <span style="display:inline-flex; align-items:center; gap:0.65rem;"><span class="role-chip">STR</span> <span><strong>Aliran (Stream)</strong> → Kandidat Lainnya</span></span>
              <span class="tabular" style="font-size:0.85em; color:var(--text-secondary);">Npop − Nsr</span>
            </button>

            <button type="button" class="btn wca-pick" data-focus="evap" style="justify-content:space-between; padding:0.75rem 1rem; text-align:left;">
              <span style="display:inline-flex; align-items:center; gap:0.65rem;"><span class="role-chip">EVP</span> <span><strong>Uap &amp; Hujan</strong> → Eksplorasi Ulang (&lt; dmax)</span></span>
              <span style="font-size:0.85em; color:var(--text-secondary);">Siklus</span>
            </button>

            <div class="formula-box" id="wca-meta-caption">
              Laut berada di titik paling rendah yang pernah ditemukan dan menjadi muara akhir seluruh sungai.
            </div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#wca-meta-canvas');
      const captionEl = container.querySelector('#wca-meta-caption');
      const renderer = new WCARenderer();
      const obj = getObjective('sphere');

      const demoState = {
        phase: 'HIERARCHY',
        dmax: 1.15,
        drops: [
          { id: 1, x: 0.1, y: -0.1, prevX: 0.1, prevY: -0.1, fitness: 0.02, role: 'sea', riverIndex: 0, parentId: null, trail: [] },
          { id: 2, x: -1.8, y: 1.4, prevX: -1.8, prevY: 1.4, fitness: 5.2, role: 'river', riverIndex: 1, parentId: 1, trail: [] },
          { id: 3, x: 2.1, y: -1.5, prevX: 2.1, prevY: -1.5, fitness: 6.6, role: 'river', riverIndex: 2, parentId: 1, trail: [] },
          { id: 4, x: -3.5, y: 2.9, prevX: -3.5, prevY: 2.9, fitness: 20.6, role: 'stream', riverIndex: 1, parentId: 2, trail: [] },
          { id: 5, x: -2.8, y: 0.3, prevX: -2.8, prevY: 0.3, fitness: 7.9, role: 'stream', riverIndex: 1, parentId: 2, trail: [] },
          { id: 6, x: 3.6, y: -2.8, prevX: 3.6, prevY: -2.8, fitness: 20.8, role: 'stream', riverIndex: 2, parentId: 3, trail: [] },
          { id: 7, x: 1.4, y: 2.6, prevX: 1.4, prevY: 2.6, fitness: 8.7, role: 'stream', riverIndex: 0, parentId: 1, trail: [] },
          { id: 8, x: -0.8, y: -2.9, prevX: -0.8, prevY: -2.9, fitness: 9.0, role: 'stream', riverIndex: 0, parentId: 1, trail: [] }
        ],
        swaps: []
      };

      const captions = {
        sea: 'Laut adalah satu-satunya solusi terbaik global (#1). Semua sungai dan sebagian aliran bermuara langsung ke Laut.',
        river: 'Sungai (S1, S2, ...) adalah solusi terbaik berikutnya yang menampung aliran dari bukit sebelum menuju Laut.',
        stream: 'Aliran adalah tetesan air di lereng tinggi yang bergerak menuruni gradien menuju sungai atau laut induknya.',
        evap: 'Lingkaran putus-putus dmax di sekitar Laut menandai zona penguapan: sungai yang terlalu dekat menguap menjadi hujan baru!'
      };

      let focus = 'sea';
      let rafId = null;

      container.querySelectorAll('.wca-pick').forEach((btn) => {
        btn.addEventListener('click', () => {
          focus = btn.dataset.focus;
          captionEl.textContent = captions[focus];
          container.querySelectorAll('.wca-pick').forEach((b) => {
            b.classList.toggle('btn-accent', b === btn);
          });
        });
      });

      function tick(ts) {
        const st = {
          ...demoState,
          phase: focus === 'evap' ? 'EVAPORATION' : 'HIERARCHY',
          drops: demoState.drops.map((d) => ({
            ...d,
            evaporating: focus === 'evap' && d.id === 7
          }))
        };
        renderer.render(canvas, st, obj, {
          alpha: 0.65,
          timestamp: reducedMotion ? 0 : ts,
          showOptimum: true,
          showTrails: true
        });

        const { ctx, width, height } = syncCanvasSize(canvas);
        const pulse = reducedMotion ? 0 : Math.sin(ts * 0.004) * 5;
        const scale = (Math.min(width, height) * 0.86) / (obj.max - obj.min);
        const toScreen = (wx, wy) => ({
          x: width / 2 + wx * scale,
          y: height / 2 - wy * scale
        });

        ctx.save();
        if (focus === 'sea') {
          const p = toScreen(0.1, -0.1);
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 28 + pulse, 0, Math.PI * 2);
          ctx.stroke();
        } else if (focus === 'river') {
          [
            { x: -1.8, y: 1.4 },
            { x: 2.1, y: -1.5 }
          ].forEach((rv) => {
            const p = toScreen(rv.x, rv.y);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 23 + pulse, 0, Math.PI * 2);
            ctx.stroke();
          });
        } else if (focus === 'stream') {
          const p = toScreen(-3.5, 2.9);
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 20 + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#e0f2fe';
          ctx.fillText('Tetesan Aliran', p.x + 24, p.y + 4);
        }
        ctx.restore();

        if (!reducedMotion) {
          rafId = requestAnimationFrame(tick);
        }
      }

      rafId = requestAnimationFrame(tick);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  },

  // =========================================================================
  // SLIDE 11: WCA TAHAP 1-2 (HIERARKI & PEMBAGIAN ALIRAN PROPORSIONAL)
  // =========================================================================
  {
    id: 'wca-hierarchy',
    shortTitle: 'WCA: Hierarki & Intensitas',
    title: 'Tahap 1–2: Hierarki & Pembagian Aliran Proporsional',
    theme: 'wca',
    notes: `
      <ul>
        <li><strong>Berbeda dari SFLA yang membagi sama rata!</strong> Di WCA, pembagian aliran bersifat <em>proporsional terhadap intensitas aliran</em> (kualitas fitness).</li>
        <li><strong>Laut</strong> punya tarikan gravitasi terkuat sehingga menerima anak aliran paling banyak (di contoh ini: <strong>6 aliran</strong>), sedangkan sungai yang lebih lemah hanya menerima <strong>3, 2, dan 1 aliran</strong>.</li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 11 · Modul WCA (2/6): Tahap 1 &amp; 2</div>
            <h1 class="slide-heading">Hierarki &amp; Intensitas Aliran Proporsional (NSn)</h1>
            <p class="slide-keyline">Laut dan sungai yang lebih rendah menarik lebih banyak anak aliran dibanding sungai yang lemah.</p>
          </div>
        </div>

        <div class="card-panel" style="flex:1; display:flex; flex-direction:column; gap:0.9rem;">
          <div class="ctrl-bar" style="justify-content:space-between;">
            <div style="display:flex; gap:0.55rem; flex-wrap:wrap;" id="hier-btns">
              <button type="button" class="btn btn-accent" data-st="0">1. Populasi Awal (16 Tetesan)</button>
              <button type="button" class="btn" data-st="1">2. Pilih 1 Laut &amp; 3 Sungai (Nsr = 4)</button>
              <button type="button" class="btn" data-st="2">3. Hubungkan 12 Aliran Proporsional</button>
            </div>
            <span id="hier-caption" style="font-size:var(--fs-ui); font-weight:700; color:var(--theme-primary);">
              16 tetesan hujan dievaluasi ketinggiannya
            </span>
          </div>

          <div class="canvas-card" style="flex:1; border-radius:14px; border:1px solid var(--border-subtle);">
            <canvas id="wca-hier-canvas"></canvas>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#wca-hier-canvas');
      const capEl = container.querySelector('#hier-caption');

      // 4 pemimpin (Laut mendapat 6 aliran, S1 mendapat 3, S2 mendapat 2, S3 mendapat 1 -> total 12 aliran)
      const leaders = [
        { id: 0, label: 'LAUT', quota: 6, color: '#fde047', fill: '#0284c7', colX: 0.18 },
        { id: 1, label: 'Sungai S1', quota: 3, color: '#22d3ee', fill: '#0891b2', colX: 0.43 },
        { id: 2, label: 'Sungai S2', quota: 2, color: '#38bdf8', fill: '#0284c7', colX: 0.65 },
        { id: 3, label: 'Sungai S3', quota: 1, color: '#7dd3fc', fill: '#0369a1', colX: 0.84 }
      ];

      const allDrops = Array.from({ length: 16 }, (_, i) => {
        const rx = 0.08 + ((i * 37) % 84) / 100;
        const ry = 0.18 + ((i * 53) % 64) / 100;
        return { i, cx: rx, cy: ry, tx: rx, ty: ry, rx, ry, group: -1, isLeader: i < 4 };
      });

      // Petakan 12 stream (indeks 4..15) ke kuota [6, 3, 2, 1]
      let ptr = 4;
      leaders.forEach((ld, gIdx) => {
        allDrops[gIdx].group = gIdx;
        for (let q = 0; q < ld.quota; q++) {
          allDrops[ptr].group = gIdx;
          allDrops[ptr].slotInGroup = q;
          ptr++;
        }
      });

      let stage = 0;
      let rafId = null;

      function setStage(s) {
        stage = s;
        container.querySelectorAll('#hier-btns .btn').forEach((b) => {
          b.classList.toggle('btn-accent', Number(b.dataset.st) === s);
        });

        if (s === 0) {
          capEl.textContent = '16 tetesan air tersebar acak di awal iterasi';
          allDrops.forEach((d) => {
            d.tx = d.rx;
            d.ty = d.ry;
          });
        } else if (s === 1) {
          capEl.textContent = 'Peringkat #1 menjadi Laut, #2–#4 menjadi Sungai, sisanya 12 Aliran';
          allDrops.forEach((d, idx) => {
            if (idx < 4) {
              d.tx = leaders[idx].colX;
              d.ty = 0.25;
            } else {
              d.tx = 0.1 + ((idx - 4) / 11) * 0.8;
              d.ty = 0.74;
            }
          });
        } else {
          capEl.textContent = 'NSn proporsional: Laut menarik 6 aliran, S1 = 3 aliran, S2 = 2 aliran, S3 = 1 aliran!';
          allDrops.forEach((d, idx) => {
            if (idx < 4) {
              d.tx = leaders[idx].colX;
              d.ty = 0.23;
            } else {
              const ld = leaders[d.group];
              const colOffset = (d.slotInGroup % 2 === 0 ? -1 : 1) * (ld.quota > 1 ? 0.038 : 0);
              const row = Math.floor(d.slotInGroup / 2);
              d.tx = ld.colX + colOffset;
              d.ty = 0.5 + row * 0.16;
            }
          });
        }
      }

      container.querySelectorAll('#hier-btns .btn').forEach((b) => {
        b.addEventListener('click', () => setStage(Number(b.dataset.st)));
      });

      function tick() {
        const { ctx, width, height } = syncCanvasSize(canvas);
        ctx.clearRect(0, 0, width, height);

        for (const d of allDrops) {
          const sp = reducedMotion ? 1 : 0.11;
          d.cx += (d.tx - d.cx) * sp;
          d.cy += (d.ty - d.cy) * sp;
        }

        // Gambar garis aliran anak -> induk pada stage 2
        if (stage === 2) {
          ctx.save();
          // Garis Sungai -> Laut
          for (let r = 1; r < 4; r++) {
            const seaD = allDrops[0];
            const rivD = allDrops[r];
            ctx.beginPath();
            ctx.moveTo(rivD.cx * width, rivD.cy * height);
            ctx.quadraticCurveTo(
              ((seaD.cx + rivD.cx) / 2) * width,
              height * 0.08,
              seaD.cx * width,
              seaD.cy * height
            );
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
            ctx.setLineDash([7, 5]);
            ctx.lineWidth = 2.2;
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // Garis Aliran -> Sungai/Laut
          for (let i = 4; i < allDrops.length; i++) {
            const st = allDrops[i];
            const par = allDrops[st.group];
            ctx.beginPath();
            ctx.moveTo(st.cx * width, st.cy * height);
            ctx.lineTo(par.cx * width, par.cy * height);
            ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }
          ctx.restore();
        }

        // Gambar semua node
        for (const d of allDrops) {
          const px = d.cx * width;
          const py = d.cy * height;
          ctx.save();
          ctx.translate(px, py);

          if (stage >= 1 && d.isLeader) {
            const ld = leaders[d.i];
            const r = d.i === 0 ? 25 : 20;
            ctx.beginPath();
            if (d.i === 0) {
              ctx.arc(0, 0, r, 0, Math.PI * 2);
            } else {
              ctx.moveTo(0, -r);
              ctx.lineTo(r, 0);
              ctx.lineTo(0, r);
              ctx.lineTo(-r, 0);
              ctx.closePath();
            }
            ctx.fillStyle = ld.fill;
            ctx.strokeStyle = ld.color;
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();

            ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = ld.color;
            ctx.textAlign = 'center';
            ctx.fillText(ld.label, 0, -r - 10);

            if (stage === 2) {
              ctx.font = '700 13px "Ubuntu Mono", monospace';
              ctx.fillStyle = '#e2e8f0';
              ctx.fillText(`NS = ${ld.quota} aliran`, 0, r + 20);
            }
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#bae6fd';
            ctx.strokeStyle = '#0c4a6e';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
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
  // SLIDE 12: WCA TAHAP 3-5 (ALIRAN MENGALIR & PERTUKARAN PERAN)
  // =========================================================================
  {
    id: 'wca-flow',
    shortTitle: 'WCA: Aliran & Tukar Peran',
    title: 'Tahap 3–5: Aliran Mengalir (C ≈ 2) & Pertukaran Peran',
    theme: 'wca',
    notes: `
      <ul>
        <li><strong>Mengapa konstanta <code>C = 2</code> penting?</strong> Karena <code>rand · C</code> bernilai antara <code>0</code> sampai <code>2</code>!</li>
        <li>Jika nilainya <code>&lt; 1</code>, aliran mendarat <em>sebelum</em> sungai; jika <code>&gt; 1</code>, aliran <em>melampaui</em> sungai untuk mengecek lereng di seberangnya!</li>
        <li>Saat sebuah aliran kebetulan mendarat di cekungan lebih dalam dari sungainya, terjadi <strong>Pertukaran Peran (Role Swap)</strong> seketika!</li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 12 · Modul WCA (3/6): Tahap 3 s.d. 5</div>
            <h1 class="slide-heading">Aliran Mengalir &amp; Pertukaran Peran (Role Swap)</h1>
            <p class="slide-keyline">Dengan konstanta <code>C ≈ 2</code>, aliran dapat melampaui sungai dan langsung bertukar peran bila menemukan titik lebih rendah.</p>
          </div>
        </div>

        <div class="split-grid">
          <div class="card-panel canvas-card">
            <div class="stage-hud-overlay">
              <div class="stage-badge">
                <span class="stage-badge-code" id="flow-demo-code">ALIRAN C = 2</span>
                <span id="flow-demo-text">Jangkauan 0..2× jarak memungkinkan eksplorasi seberang sungai</span>
              </div>
            </div>
            <canvas id="wca-flow-canvas"></canvas>
          </div>

          <div class="card-panel" style="justify-content:space-between; gap:0.85rem;">
            <div style="display:flex; flex-direction:column; gap:0.65rem;" id="flow-demo-btns">
              <div style="font-size:var(--fs-small); color:var(--theme-primary); font-weight:700;">
                Pilih Skenario Pergerakan Air
              </div>
              <button type="button" class="btn btn-accent" data-mode="normal" style="justify-content:flex-start; text-align:left; padding:0.75rem 1rem;">
                <span class="role-chip">FLW</span>
                <span><strong>Aliran Menuju Sungai:</strong> Mendekat pada rentang <code>C · d</code></span>
              </button>
              <button type="button" class="btn" data-mode="swap" style="justify-content:flex-start; text-align:left; padding:0.75rem 1rem;">
                <span class="role-chip" style="color:#fae0a5; border-color:#d8a33a;">SWP</span>
                <span><strong>Pertukaran Peran:</strong> Aliran melampaui sungai &amp; jadi pemimpin baru</span>
              </button>
            </div>

            <div class="formula-box">
              <code>X_aliran(t+1) = X_aliran + rand · C · (X_sungai − X_aliran)</code><br/>
              <code>X_sungai(t+1) = X_sungai + rand · C · (X_laut − X_sungai)</code>
            </div>

            <p style="margin:0; font-size:var(--fs-ui); color:var(--text-secondary);">
              Lingkaran kuning terang menandai pertukaran peran: ketika <code>f(X_aliran) &lt; f(X_sungai)</code>, sang aliran naik pangkat menjadi Sungai baru.
            </p>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#wca-flow-canvas');
      const codeEl = container.querySelector('#flow-demo-code');
      const textEl = container.querySelector('#flow-demo-text');
      const renderer = new WCARenderer();
      const obj = getObjective('sphere');

      let mode = 'normal';
      let startTs = performance.now();
      let rafId = null;

      container.querySelectorAll('#flow-demo-btns .btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          mode = btn.dataset.mode;
          startTs = performance.now();
          container.querySelectorAll('#flow-demo-btns .btn').forEach((b) => {
            b.classList.toggle('btn-accent', b === btn);
          });
          if (mode === 'normal') {
            codeEl.textContent = 'ALIRAN NORMAL';
            textEl.textContent = 'Aliran bergerak menuju Sungai S1, dan S1 mengalir menuju Laut';
          } else {
            codeEl.textContent = 'ROLE SWAP';
            textEl.textContent = 'Aliran melampaui S1 ke lembah lebih rendah → langsung tukar peran!';
          }
        });
      });

      function tick(now) {
        const cycle = ((now - startTs) % 2600) / 2600;
        const alpha = reducedMotion ? 1 : Math.min(1, cycle * 1.5);
        const swapped = mode === 'swap' && cycle > 0.58;

        const streamFrom = { x: -3.6, y: 2.6 };
        const streamTo = mode === 'normal' ? { x: -2.2, y: 1.7 } : { x: -0.9, y: 0.55 };
        const riverPos = { x: -1.9, y: 1.35 };

        const st = {
          phase: swapped ? 'ROLE_SWAP' : 'FLOW',
          dmax: 0.55,
          drops: [
            { id: 1, x: 0.1, y: -0.1, prevX: 0.1, prevY: -0.1, fitness: 0.02, role: 'sea', riverIndex: 0, parentId: null, trail: [] },
            {
              id: 2,
              x: swapped ? streamTo.x : riverPos.x,
              y: swapped ? streamTo.y : riverPos.y,
              prevX: riverPos.x,
              prevY: riverPos.y,
              fitness: swapped ? 1.1 : 5.4,
              role: 'river',
              riverIndex: 1,
              parentId: 1,
              trail: []
            },
            {
              id: 3,
              x: swapped ? riverPos.x : streamTo.x,
              y: swapped ? riverPos.y : streamTo.y,
              prevX: streamFrom.x,
              prevY: streamFrom.y,
              fitness: swapped ? 5.4 : 8.0,
              role: 'stream',
              riverIndex: 1,
              parentId: 2,
              trail: []
            }
          ],
          swaps: swapped
            ? [{ fromX: streamTo.x, fromY: streamTo.y, toX: riverPos.x, toY: riverPos.y, kind: 'STREAM_TO_RIVER' }]
            : []
        };

        renderer.render(canvas, st, obj, {
          alpha: swapped ? (cycle - 0.58) / 0.42 : alpha,
          timestamp: now,
          showOptimum: true,
          showTrails: true
        });

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  },

  // =========================================================================
  // SLIDE 13: WCA TAHAP 6-8 (PENGUAPAN, HUJAN & PENYUSUTAN DMAX)
  // =========================================================================
  {
    id: 'wca-evap',
    shortTitle: 'WCA: Penguapan & Hujan',
    title: 'Tahap 6–8: Penguapan (< dmax), Hujan & Penyusutan dmax',
    theme: 'wca',
    notes: `
      <ul>
        <li><strong>Apa yang terjadi jika semua sungai berkumpul di Laut terlalu cepat?</strong> Populasi kehilangan keragaman dan bisa terjebak di lembah palsu!</li>
        <li><strong>Solusi WCA:</strong> Lingkaran <code>dmax</code> di sekitar Laut. Sungai yang masuk ke dalam jarak <code>&lt; dmax</code> dianggap <strong>menguap</strong> ke awan lalu turun kembali sebagai <strong>hujan baru</strong>!</li>
        <li>Geser slider iterasi di kanan untuk menunjukkan bagaimana <code>dmax</code> makin mengecil mendekati akhir iterasi agar pencarian makin tajam!</li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 13 · Modul WCA (4/6): Tahap 6 s.d. 8</div>
            <h1 class="slide-heading">Penguapan, Hujan &amp; Penyempitan Radius dmax</h1>
            <p class="slide-keyline">Sungai yang berjarak <code>&lt; dmax</code> dari Laut menguap menjadi hujan baru, sementara <code>dmax</code> menyusut tiap iterasi.</p>
          </div>
        </div>

        <div class="split-grid">
          <div class="card-panel canvas-card">
            <canvas id="wca-evap-canvas"></canvas>
          </div>

          <div class="card-panel" style="justify-content:space-between; gap:0.85rem;">
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
              <div style="font-size:var(--fs-small); color:var(--theme-primary); font-weight:700;">
                Lihat Siklus Uap → Hujan &amp; Penyusutan dmax
              </div>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;" id="evap-phase-btns">
                <button type="button" class="btn btn-accent" data-ph="EVAPORATION">1. Menguap (&lt; dmax)</button>
                <button type="button" class="btn" data-ph="RAIN">2. Turun Hujan Baru</button>
              </div>

              <div class="param-row" style="margin-top:0.5rem;">
                <label>Progres Iterasi (Penyusutan dmax) <span class="val" id="evap-iter-lbl">Iterasi 5 / 40 (dmax = 1.40)</span></label>
                <input type="range" class="ctrl-range" style="width:100%;" id="evap-iter-slider" min="1" max="38" value="5" />
              </div>
            </div>

            <div class="formula-box">
              <code>Jika ‖X_laut − X_sungai‖ &lt; dmax &nbsp;⇒&nbsp; Menguap &amp; Hujan</code><br/>
              <code>dmax(t+1) = dmax(t) − dmax(0) / Iterasi_Maks</code>
            </div>

            <p style="margin:0; font-size:var(--fs-ui); color:var(--text-secondary);">
              Di awal iterasi, <code>dmax</code> lebar untuk mendorong <strong>eksplorasi</strong>. Di akhir iterasi, <code>dmax</code> menyempit agar air fokus <strong>mengeksploitasi</strong> sekitar Laut.
            </p>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#wca-evap-canvas');
      const slider = container.querySelector('#evap-iter-slider');
      const lbl = container.querySelector('#evap-iter-lbl');
      const renderer = new WCARenderer();
      const obj = getObjective('rastrigin');

      let demoPhase = 'EVAPORATION';
      let animTs = performance.now();
      let rafId = null;

      container.querySelectorAll('#evap-phase-btns .btn').forEach((b) => {
        b.addEventListener('click', () => {
          demoPhase = b.dataset.ph;
          animTs = performance.now();
          container.querySelectorAll('#evap-phase-btns .btn').forEach((x) => {
            x.classList.toggle('btn-accent', x === b);
          });
        });
      });

      function tick(now) {
        const iter = Number(slider.value);
        const dmaxVal = Math.max(0.12, 1.6 * (1 - iter / 40));
        lbl.textContent = `Iterasi ${iter} / 40 (dmax = ${dmaxVal.toFixed(2)})`;

        const alpha = reducedMotion ? 0.7 : (((now - animTs) % 2000) / 2000);

        const state = {
          phase: demoPhase,
          dmax: dmaxVal,
          drops: [
            { id: 1, x: 0, y: 0, prevX: 0, prevY: 0, fitness: 0, role: 'sea', riverIndex: 0, parentId: null, trail: [] },
            {
              id: 2,
              x: demoPhase === 'RAIN' ? -3.1 : 0.45,
              y: demoPhase === 'RAIN' ? 2.8 : 0.35,
              prevX: demoPhase === 'RAIN' ? -3.1 : 0.45,
              prevY: demoPhase === 'RAIN' ? 2.8 : 0.35,
              fitness: 2,
              role: 'river',
              riverIndex: 1,
              parentId: 1,
              evaporating: demoPhase === 'EVAPORATION',
              justRained: demoPhase === 'RAIN',
              trail: []
            },
            {
              id: 3,
              x: demoPhase === 'RAIN' ? 2.9 : -0.35,
              y: demoPhase === 'RAIN' ? -2.4 : -0.42,
              prevX: demoPhase === 'RAIN' ? 2.9 : -0.35,
              prevY: demoPhase === 'RAIN' ? -2.4 : -0.42,
              fitness: 3,
              role: 'stream',
              riverIndex: 0,
              parentId: 1,
              evaporating: demoPhase === 'EVAPORATION',
              justRained: demoPhase === 'RAIN',
              trail: []
            },
            { id: 4, x: 2.2, y: 2.1, prevX: 2.2, prevY: 2.1, fitness: 8, role: 'river', riverIndex: 2, parentId: 1, trail: [] }
          ],
          swaps: []
        };

        renderer.render(canvas, state, obj, {
          alpha,
          timestamp: now,
          showOptimum: true,
          showTrails: true
        });

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  },

  // =========================================================================
  // SLIDE 14: RINGKASAN SIKLUS LENGKAP WCA
  // =========================================================================
  {
    id: 'wca-cycle',
    shortTitle: 'WCA: Alur Lengkap',
    title: 'Alur Lengkap Algoritma WCA',
    theme: 'wca',
    notes: `
      <ul>
        <li>Ringkasan 6 tahap WCA sebelum kita menjalankan simulasi WCA penuh di slide berikutnya.</li>
        <li>Klik tahap mana pun untuk menyorot persamaan matematisnya.</li>
      </ul>
    `,
    mount(container) {
      const stages = [
        {
          num: 'Tahap 1',
          name: 'Inisialisasi Hujan Awal',
          role: 'Eksplorasi Awal',
          formula: 'Xi = LB + rand · (UB − LB),  i = 1..Npop',
          desc: 'Sebar populasi tetesan air secara acak lalu hitung ketinggian (fitness) tiap titik.'
        },
        {
          num: 'Tahap 2',
          name: 'Hierarki Laut & Sungai',
          role: 'Intensitas Proporsional',
          formula: '1 Laut + (Nsr−1) Sungai;  NSn ∝ |f(Xn) − f(X_Nsr+1)|',
          desc: 'Titik terendah jadi Laut, berikutnya jadi Sungai, sisanya jadi Aliran secara proporsional.'
        },
        {
          num: 'Tahap 3',
          name: 'Aliran & Sungai Mengalir',
          role: 'Eksploitasi Terarah',
          formula: 'X(t+1) = X(t) + rand · C · (X_induk − X(t)),  C ≈ 2',
          desc: 'Aliran bergerak menuju Sungai/Laut, dan Sungai bergerak bermuara menuju Laut.'
        },
        {
          num: 'Tahap 4',
          name: 'Pertukaran Peran',
          role: 'Pembaruan Pemimpin',
          formula: 'Jika f(X_aliran) < f(X_induk)  ⇒  Tukar Peran',
          desc: 'Aliran yang menemukan posisi lebih rendah naik pangkat menjadi Sungai atau Laut baru.'
        },
        {
          num: 'Tahap 5',
          name: 'Penguapan (< dmax)',
          role: 'Deteksi Stagnasi',
          formula: 'Jika ‖X_laut − X_sungai‖ < dmax  ⇒  Menguap',
          desc: 'Sungai/aliran yang sudah terlalu dekat dengan Laut menguap agar tidak menumpuk sia-sia.'
        },
        {
          num: 'Tahap 6',
          name: 'Hujan Baru & Update dmax',
          role: 'Eksplorasi + Fokus Akhir',
          formula: 'Hujan acak / sekitar Laut;  dmax ← dmax − dmax0 / Tmax',
          desc: 'Tetesan baru lahir menggantikan uap, sementara radius dmax diperkecil tiap iterasi.'
        }
      ];

      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 14 · Modul WCA (5/6): Diagram Siklus</div>
            <h1 class="slide-heading">Enam Tahap Siklus Hidrologi WCA</h1>
            <p class="slide-keyline">Siklus mengalir, bertukar peran, menguap, dan hujan menyatukan gravitasi menuju Laut dengan regenerasi alami.</p>
          </div>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:1rem;">
          <div id="wca-flow-cards" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.9rem; flex:1;">
            ${stages
              .map(
                (s, i) => `
              <button type="button" class="card-panel wca-step-card" data-idx="${i}" style="text-align:left; cursor:pointer; justify-content:space-between; border-color:${i === 2 ? 'var(--theme-primary)' : 'var(--border-subtle)'}; background:${i === 2 ? 'var(--theme-tint)' : 'var(--bg-card)'};">
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

          <div class="formula-box" id="wca-cycle-detail" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
            <span><strong>Tahap 3 (Aliran &amp; Sungai Mengalir):</strong> <code>X(t+1) = X(t) + rand · C · (X_induk − X(t)), C ≈ 2</code></span>
            <span style="color:var(--theme-primary); font-size:var(--fs-small);">Klik kartu tahap di atas untuk melihat rumus detail</span>
          </div>
        </div>
      `;

      const detailBox = container.querySelector('#wca-cycle-detail');
      const cards = container.querySelectorAll('.wca-step-card');

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
  // SLIDE 15: SIMULASI INTERAKTIF WCA PENUH (F-04, F-05..F-10, F-13)
  // =========================================================================
  {
    id: 'wca-sim',
    shortTitle: 'Simulasi WCA',
    title: 'Laboratorium Simulasi Interaktif WCA',
    theme: 'wca',
    notes: `
      <ul>
        <li><strong>Urutan demo yang disarankan:</strong>
          <ol>
            <li>Klik tombol <strong>Step (S)</strong> 5 kali dari awal untuk memperlihatkan urutan tahap persis sesuai teori: <code>Hierarki Laut &amp; Sungai → Aliran Mengalir → Pertukaran Peran → Penguapan Air → Hujan &amp; Update dmax</code>.</li>
            <li>Klik <strong>Play (P)</strong> dan amati garis aliran melengkung bermuara ke Laut, kilatan kuning saat pertukaran peran, serta uap &amp; hujan saat sungai masuk ke lingkaran <code>dmax</code>!</li>
            <li>Uji pada <strong>Ackley</strong> atau <strong>Rastrigin</strong> untuk melihat ketangguhan mekanisme hujan melepaskan diri dari lembah lokal.</li>
          </ol>
        </li>
      </ul>
    `,
    mount(container, { reducedMotion, registerHooks }) {
      container.innerHTML = `
        <div class="slide-top" style="align-items:center;">
          <div>
            <div class="slide-context">Slide 15 · Modul WCA (6/6): Simulasi Langsung</div>
            <h1 class="slide-heading" style="font-size:clamp(1.5rem, 2.2vw, 2.6rem);">Simulasi WCA: Aliran Sungai ke Laut</h1>
          </div>

          <div class="ctrl-bar">
            <button type="button" class="btn btn-accent" id="wca-btn-play">▶ Play</button>
            <button type="button" class="btn btn-step" id="wca-btn-step" title="Maju 1 tahap algoritma (Tombol S)">⏭ Step</button>
            <button type="button" class="btn" id="wca-btn-reset" title="Ulangi dari awal (Tombol R)">↺ Reset</button>

            <label class="ctrl-field">
              <span>Fungsi:</span>
              <select class="ctrl-select" id="wca-select-obj">
                <option value="sphere" selected>Sphere (1 Lembah)</option>
                <option value="rastrigin">Rastrigin (Banyak Lembah)</option>
                <option value="ackley">Ackley (Corong Pusat)</option>
              </select>
            </label>

            <label class="ctrl-field">
              <span>Kecepatan:</span>
              <input type="range" class="ctrl-range" id="wca-speed" min="0.6" max="12" step="0.3" value="2.8" />
            </label>

            <button type="button" class="btn" id="wca-btn-params" aria-expanded="false">Parameter</button>
          </div>
        </div>

        <div class="sim-layout">
          <div class="card-panel canvas-card">
            <div class="stage-hud-overlay">
              <div class="stage-badge">
                <span class="stage-badge-code" id="wca-hud-code">INIT</span>
                <span id="wca-hud-label">Inisialisasi Tetesan</span>
              </div>
              <div class="hud-metrics">
                <div class="hud-pill">Iterasi: <strong id="wca-hud-iter">0 / 40</strong></div>
                <div class="hud-pill">dmax: <strong id="wca-hud-dmax">0.450</strong></div>
                <div class="hud-pill">Laut: <strong id="wca-hud-best">0.0000</strong></div>
              </div>
            </div>
            <canvas id="wca-sim-canvas"></canvas>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.85rem; min-height:0;">
            <div class="card-panel" style="padding:0.9rem 1.1rem; gap:0.45rem;">
              <div style="font-size:var(--fs-small); color:var(--theme-primary); font-weight:700;">Status Tahap Saat Ini</div>
              <div id="wca-stage-desc" style="font-size:var(--fs-ui); font-weight:600; color:var(--text-primary); min-height:2.8em;"></div>
              <div style="display:flex; gap:0.85rem; flex-wrap:wrap; font-size:var(--fs-small); color:var(--text-muted); padding-top:0.35rem; border-top:1px solid var(--border-subtle);">
                <span style="color:#fae0a5;">● Lingkar Emas = <strong>Laut</strong></span>
                <span style="color:#53bce3;">◆ Ketupat = <strong>Sungai</strong></span>
                <span style="color:#baeaff;">▲ Tetes = <strong>Aliran</strong></span>
              </div>
            </div>

            <div class="card-panel canvas-card" style="flex:1; min-height:170px;">
              <canvas id="wca-chart-canvas"></canvas>
            </div>

            <div class="card-panel" style="padding:0.75rem 1rem; flex-direction:row; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:var(--fs-small); font-weight:700; cursor:pointer;">
                <input type="checkbox" id="wca-chk-opt" checked style="width:17px; height:17px; accent-color:var(--gold-crown);" />
                <span>Target Optimum (0, 0)</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:var(--fs-small); font-weight:700; cursor:pointer;">
                <input type="checkbox" id="wca-chk-trail" checked style="width:17px; height:17px; accent-color:var(--theme-primary);" />
                <span>Garis Aliran</span>
              </label>
              <span class="tabular" style="font-size:var(--fs-small); font-weight:700; color:var(--text-muted);" id="wca-coord-readout">(0.00, 0.00)</span>
            </div>
          </div>

          <!-- Collapsible Parameter Panel (F-06) -->
          <div class="param-drawer hidden" id="wca-param-drawer">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:var(--fs-ui); color:var(--theme-primary);">Parameter Algoritma WCA</strong>
              <button type="button" class="close-btn" id="wca-close-params" aria-label="Tutup Parameter">&times;</button>
            </div>

            <div class="param-row">
              <label>Ukuran Populasi (Npop) <span class="val" id="val-wca-pop">24</span></label>
              <input type="range" class="ctrl-range" style="width:100%;" id="inp-wca-pop" min="10" max="72" step="2" value="24" />
            </div>

            <div class="param-row">
              <label>Jumlah Sungai + Laut (Nsr) <span class="val" id="val-wca-nsr">4</span></label>
              <input type="range" class="ctrl-range" style="width:100%;" id="inp-wca-nsr" min="2" max="8" step="1" value="4" />
            </div>

            <div class="param-row">
              <label>Ambang Penguapan Awal (dmax) <span class="val" id="val-wca-dmax">0.45</span></label>
              <input type="range" class="ctrl-range" style="width:100%;" id="inp-wca-dmax" min="0.05" max="1.5" step="0.05" value="0.45" />
            </div>

            <div class="param-row">
              <label>Konstanta Aliran (C) <span class="val" id="val-wca-c">2.0</span></label>
              <input type="range" class="ctrl-range" style="width:100%;" id="inp-wca-c" min="1.2" max="2.6" step="0.1" value="2.0" />
            </div>

            <div class="param-row">
              <label for="inp-wca-seed">Seed Acak (Reprodusibel)</label>
              <input type="number" class="ctrl-input" id="inp-wca-seed" value="42" />
            </div>

            <button type="button" class="btn btn-accent" id="wca-apply-params" style="margin-top:0.4rem;">
              Terapkan &amp; Reset Simulasi
            </button>
          </div>
        </div>
      `;

      const simCanvas = container.querySelector('#wca-sim-canvas');
      const chartCanvas = container.querySelector('#wca-chart-canvas');
      const btnPlay = container.querySelector('#wca-btn-play');
      const btnStep = container.querySelector('#wca-btn-step');
      const btnReset = container.querySelector('#wca-btn-reset');
      const selObj = container.querySelector('#wca-select-obj');
      const speedInput = container.querySelector('#wca-speed');
      const chkOpt = container.querySelector('#wca-chk-opt');
      const chkTrail = container.querySelector('#wca-chk-trail');

      const hudCode = container.querySelector('#wca-hud-code');
      const hudLabel = container.querySelector('#wca-hud-label');
      const hudIter = container.querySelector('#wca-hud-iter');
      const hudDmax = container.querySelector('#wca-hud-dmax');
      const hudBest = container.querySelector('#wca-hud-best');
      const stageDesc = container.querySelector('#wca-stage-desc');
      const coordReadout = container.querySelector('#wca-coord-readout');

      const drawer = container.querySelector('#wca-param-drawer');
      const btnParams = container.querySelector('#wca-btn-params');
      const inpPop = container.querySelector('#inp-wca-pop');
      const inpNsr = container.querySelector('#inp-wca-nsr');
      const inpDmax = container.querySelector('#inp-wca-dmax');
      const inpC = container.querySelector('#inp-wca-c');
      const inpSeed = container.querySelector('#inp-wca-seed');

      let currentObj = getObjective(selObj.value);
      const renderer = new WCARenderer();
      const engine = new WCAEngine({
        objective: currentObj,
        populationSize: Number(inpPop.value),
        nsr: Number(inpNsr.value),
        dmax: Number(inpDmax.value),
        flowConstant: Number(inpC.value),
        maxIterations: 40,
        seed: Number(inpSeed.value)
      });

      function updateHudAndChart() {
        const st = engine.getState();
        hudCode.textContent = st.phase;
        hudLabel.textContent = st.phaseLabel;
        hudIter.textContent = `${st.iteration} / ${st.maxIterations}`;
        hudDmax.textContent = st.dmax.toFixed(3);
        const bf = st.bestSea.fitness;
        hudBest.textContent = bf < 0.0001 ? bf.toExponential(2) : bf.toFixed(4);
        stageDesc.textContent = st.phaseDetail;
        coordReadout.textContent = `Laut: (${st.bestSea.x.toFixed(2)}, ${st.bestSea.y.toFixed(2)})`;

        renderConvergenceChart(
          chartCanvas,
          [
            {
              label: 'WCA',
              color: '#38bdf8',
              fillTop: 'rgba(56, 189, 248, 0.28)',
              data: st.history
            }
          ],
          { maxIterations: st.maxIterations, title: 'Konvergensi Fitness Terbaik (WCA)' }
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
        onRender: (alpha, ts) => {
          renderer.render(simCanvas, engine.getState(), currentObj, {
            alpha,
            timestamp: ts,
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
          populationSize: Number(inpPop.value),
          nsr: Number(inpNsr.value),
          dmax: Number(inpDmax.value),
          flowConstant: Number(inpC.value),
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
      container.querySelector('#wca-close-params').addEventListener('click', () => {
        drawer.classList.add('hidden');
        btnParams.setAttribute('aria-expanded', 'false');
      });

      [
        [inpPop, '#val-wca-pop'],
        [inpNsr, '#val-wca-nsr'],
        [inpDmax, '#val-wca-dmax'],
        [inpC, '#val-wca-c']
      ].forEach(([inp, sel]) => {
        inp.addEventListener('input', () => {
          container.querySelector(sel).textContent = inp.value;
        });
      });

      container.querySelector('#wca-apply-params').addEventListener('click', () => {
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
