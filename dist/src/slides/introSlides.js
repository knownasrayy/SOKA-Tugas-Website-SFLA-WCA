/**
 * Slide 1–3: Pembuka, Masalah Optimasi, dan Ide Dasar Metaheuristik
 */

import { getObjective } from '../core/objectives.js';
import { createRng } from '../core/rng.js';
import { ContourMapCache, syncCanvasSize } from '../render/contourRenderer.js';

const STORAGE_TEAM_KEY = 'sfla_wca_team_names_v1';

export const introSlides = [
  // =========================================================================
  // SLIDE 1: JUDUL
  // =========================================================================
  {
    id: 'title',
    shortTitle: 'Judul',
    title: 'Algoritma Metaheuristik: SFLA & WCA',
    theme: 'intro',
    notes: `
      <ul>
        <li><strong>Pembuka (30 detik):</strong> Perkenalkan tim dan mata kuliah <em>Strategi Optimasi Komputasi Awan</em>.</li>
        <li><strong>Jembatan ide:</strong> Di komputasi awan, ribuan tugas harus dijadwalkan ke mesin virtual secepat mungkin. Mencoba semua kemungkinan mustahil, sehingga kita meniru strategi alam.</li>
        <li><strong>Dua bintang utama hari ini:</strong> <em>Shuffled Frog-Leaping Algorithm (SFLA)</em> yang meniru lompatan katak di kolam teratai, dan <em>Water Cycle Algorithm (WCA)</em> yang meniru aliran sungai menuju laut.</li>
        <li><em>Tips:</em> Klik teks nama penyaji di kartu bawah jika ingin menyesuaikan nama anggota kelompok sebelum presentasi dimulai.</li>
      </ul>
    `,
    mount(container, { deck, reducedMotion }) {
      const savedTeam =
        localStorage.getItem(STORAGE_TEAM_KEY) ||
        'Kelompok Penyaji: Klik di sini untuk mengisi Nama & NIM Anggota';

      container.innerHTML = `
        <div class="card-panel canvas-card" style="flex:1; display:flex; align-items:center; justify-content:center;">
          <canvas id="hero-bg-canvas" style="position:absolute; inset:0; width:100%; height:100%;"></canvas>
          <div style="position:relative; z-index:2; max-width:1180px; width:100%; padding:clamp(1.5rem, 3vw, 3.2rem); display:flex; flex-direction:column; gap:1.35rem; text-align:center; align-items:center;">
            <div style="display:inline-flex; align-items:center; gap:0.75rem; padding:0.45rem 1.15rem; border-radius:999px; background:#0e1824; border:1px solid #2b4560; font-size:var(--fs-ui); font-weight:700; color:#e2ecf5;">
              <span style="color:#43bf9c;">● SFLA</span>
              <span style="opacity:0.4;">|</span>
              <span>Mata Kuliah: Strategi Optimasi Komputasi Awan</span>
              <span style="opacity:0.4;">|</span>
              <span style="color:#53bce3;">● WCA</span>
            </div>

            <h1 style="margin:0; font-family:var(--ff-display); font-size:var(--fs-hero); font-weight:800; line-height:1.08; letter-spacing:-0.025em; max-width:20ch;">
              Optimasi Metaheuristik Berbasis Alam:<br/>
              <span style="color:#43bf9c;">Shuffled Frog-Leaping</span> &amp; <span style="color:#53bce3;">Water Cycle</span>
            </h1>

            <p style="margin:0; font-size:var(--fs-lead); color:var(--text-secondary); max-width:56ch; font-weight:500;">
              Memahami bagaimana kawanan katak di kolam teratai dan siklus aliran air menemukan solusi optimal untuk penjadwalan komputasi awan.
            </p>

            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:1rem; margin-top:0.35rem;">
              <button type="button" class="btn btn-accent" id="btn-start-present" style="padding:0.75rem 1.6rem; font-size:var(--fs-body);">
                Mulai Presentasi →
              </button>
              <button type="button" class="btn" id="btn-jump-sfla">Loncat ke Simulasi SFLA</button>
              <button type="button" class="btn" id="btn-jump-wca">Loncat ke Simulasi WCA</button>
            </div>

            <div style="margin-top:0.6rem; padding:0.8rem 1.4rem; border-radius:10px; background:#09131e; border:1px dashed #354b63; max-width:820px; width:100%;">
              <div style="font-size:var(--fs-small); font-weight:700; color:var(--gold-crown); margin-bottom:0.2rem;">Penyaji / Anggota Kelompok (Klik untuk Edit)</div>
              <div id="team-editable" contenteditable="true" spellcheck="false" style="font-size:var(--fs-ui); font-weight:700; color:var(--text-primary); outline:none;"></div>
            </div>
          </div>
        </div>
      `;

      const teamEl = container.querySelector('#team-editable');
      teamEl.textContent = savedTeam;
      teamEl.addEventListener('input', () => {
        try {
          localStorage.setItem(STORAGE_TEAM_KEY, teamEl.textContent.trim());
        } catch (_e) {
          // Abaikan jika penyimpanan lokal dibatasi
        }
      });

      container.querySelector('#btn-start-present').addEventListener('click', () => deck.next());
      container.querySelector('#btn-jump-sfla').addEventListener('click', () => deck.goTo(8));
      container.querySelector('#btn-jump-wca').addEventListener('click', () => deck.goTo(14));

      // Animasi latar kolam teratai (kiri) + aliran air menuju pusat emas (kanan)
      const canvas = container.querySelector('#hero-bg-canvas');
      let rafId = null;
      const rng = createRng(2026);
      const particles = Array.from({ length: 36 }, (_, i) => ({
        side: i < 18 ? 'frog' : 'drop',
        angle: rng.range(0, Math.PI * 2),
        radius: rng.range(0.14, 0.48),
        speed: rng.range(0.002, 0.006),
        size: rng.range(4, 9),
        phase: rng.range(0, Math.PI * 2)
      }));

      function drawHero(ts) {
        const { ctx, width, height } = syncCanvasSize(canvas);
        ctx.clearRect(0, 0, width, height);

        const gradLeft = ctx.createRadialGradient(width * 0.22, height * 0.5, 20, width * 0.22, height * 0.5, width * 0.48);
        gradLeft.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        gradLeft.addColorStop(1, 'rgba(6, 15, 25, 0)');
        ctx.fillStyle = gradLeft;
        ctx.fillRect(0, 0, width, height);

        const gradRight = ctx.createRadialGradient(width * 0.78, height * 0.5, 20, width * 0.78, height * 0.5, width * 0.48);
        gradRight.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
        gradRight.addColorStop(1, 'rgba(6, 15, 25, 0)');
        ctx.fillStyle = gradRight;
        ctx.fillRect(0, 0, width, height);

        // Gelombang kontur konsentris tipis di tengah
        const cx = width * 0.5;
        const cy = height * 0.5;
        for (let r = 60; r <= Math.max(width, height) * 0.55; r += 65) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        const t = reducedMotion ? 0 : ts * 0.001;
        for (const p of particles) {
          const a = p.angle + t * p.speed * 45 * (p.side === 'frog' ? 1 : -1);
          const pulse = 1 + 0.08 * Math.sin(t * 2 + p.phase);
          const rx = width * p.radius * pulse;
          const ry = height * p.radius * pulse;
          const x = cx + Math.cos(a) * rx;
          const y = cy + Math.sin(a) * ry;

          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle =
            p.side === 'frog' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(56, 189, 248, 0.35)';
          ctx.fill();
        }

        if (!reducedMotion) {
          rafId = requestAnimationFrame(drawHero);
        }
      }

      rafId = requestAnimationFrame(drawHero);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  },

  // =========================================================================
  // SLIDE 2: MASALAH OPTIMASI
  // =========================================================================
  {
    id: 'problem',
    shortTitle: 'Masalah Optimasi',
    title: 'Apa Itu Optimasi? Mencari Titik Terendah di Peta Berbukit',
    theme: 'intro',
    notes: `
      <ul>
        <li><strong>Analogi utama:</strong> Bayangkan kita ditutup matanya di wilayah berbukit berkabut, dan tugas kita adalah menemukan <em>dasar lembah paling rendah</em>.</li>
        <li><strong>Interaksi langsung:</strong> Klik di mana saja pada peta kontur untuk menjatuhkan sensor pengukur tinggi <code>f(x, y)</code>.</li>
        <li><strong>Tunjukkan perbedaan 3 peta:</strong>
          <ul>
            <li><em>Sphere:</em> 1 cekungan mulus, mudah dituruni.</li>
            <li><em>Rastrigin:</em> puluhan cekungan palsu (<em>local optima</em>) yang menjebak algoritma sederhana!</li>
            <li><em>Ackley:</em> dataran bergelombang luas dengan satu lubang curam di tengah.</li>
          </ul>
        </li>
      </ul>
    `,
    mount(container) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 2 · Masalah Dasar</div>
            <h1 class="slide-heading">Mencari Titik Terendah di Peta Berbukit</h1>
            <p class="slide-keyline">Optimasi berarti mencari koordinat solusi dengan biaya (<em>fitness</em>) paling rendah tanpa terjebak di lembah semu.</p>
          </div>
        </div>

        <div class="split-grid">
          <div class="card-panel canvas-card">
            <div class="stage-hud-overlay">
              <div class="stage-badge">
                <span class="stage-badge-code">KLIK PETA</span>
                <span id="probe-status">Klik titik mana pun untuk mengukur ketinggian f(x, y)</span>
              </div>
            </div>
            <canvas id="problem-contour-canvas"></canvas>
          </div>

          <div class="card-panel" style="justify-content:space-between; gap:1rem;">
            <div style="display:flex; flex-direction:column; gap:0.85rem;">
              <div style="font-size:var(--fs-ui); font-weight:700; color:var(--theme-primary);">Pilih Bentang Alam (Fungsi Objektif 2D)</div>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;" id="obj-btn-group">
                <button type="button" class="btn btn-accent" data-obj="sphere">Sphere (Mulus)</button>
                <button type="button" class="btn" data-obj="rastrigin">Rastrigin (Banyak Jebakan)</button>
                <button type="button" class="btn" data-obj="ackley">Ackley (Corong Curam)</button>
              </div>

              <div class="formula-box" id="prob-formula">f(x, y) = x² + y²</div>
              <p id="prob-desc" style="margin:0; font-size:var(--fs-body); color:var(--text-secondary);">
                Satu lembah mulus tanpa jebakan lokal, cocok untuk menguji kecepatan dasar algoritma.
              </p>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div style="padding:0.85rem 1rem; border-radius:10px; background:#0d2136; border:1px solid #2298c7;">
                <div style="font-size:var(--fs-small); color:var(--text-muted); font-weight:700;">Warna Biru Gelap</div>
                <div style="font-size:var(--fs-ui); font-weight:800; color:#7dd3fc;">Lembah Rendah (Solusi Baik)</div>
              </div>
              <div style="padding:0.85rem 1rem; border-radius:10px; background:#261f0d; border:1px solid #d8a33a;">
                <div style="font-size:var(--fs-small); color:var(--text-muted); font-weight:700;">Warna Kuning / Oker</div>
                <div style="font-size:var(--fs-ui); font-weight:800; color:#fae0a5;">Puncak Bukit (Biaya Mahal)</div>
              </div>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.6rem; padding-top:0.5rem; border-top:1px solid var(--border-subtle);">
              <label style="display:inline-flex; align-items:center; gap:0.55rem; font-size:var(--fs-ui); font-weight:700; cursor:pointer;">
                <input type="checkbox" id="chk-reveal-opt" checked style="width:20px; height:20px; accent-color:var(--gold-crown);" />
                <span>Tampilkan Titik Optimum Global (0, 0)</span>
              </label>
              <button type="button" class="btn" id="btn-clear-probes">Bersihkan Titik Uji</button>
            </div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#problem-contour-canvas');
      const formulaEl = container.querySelector('#prob-formula');
      const descEl = container.querySelector('#prob-desc');
      const probeStatus = container.querySelector('#probe-status');
      const chkReveal = container.querySelector('#chk-reveal-opt');
      const contourCache = new ContourMapCache();

      let currentObj = getObjective('rastrigin');
      let probes = [
        { x: -2.9, y: 2.1 },
        { x: 1.95, y: -1.02 }
      ];

      // Set default tombol aktif ke Rastrigin agar konsep bukit & lembah langsung terasa!
      function selectObj(id) {
        currentObj = getObjective(id);
        formulaEl.textContent = currentObj.formulaText;
        descEl.textContent = currentObj.character;
        container.querySelectorAll('#obj-btn-group .btn').forEach((b) => {
          b.classList.toggle('btn-accent', b.dataset.obj === id);
        });
        render();
      }

      function render() {
        const { ctx, width, height } = syncCanvasSize(canvas);
        const vp = contourCache.renderBackground(ctx, width, height, currentObj, 'terrain', {
          showOptimum: chkReveal.checked
        });
        if (!vp) return;

        probes.forEach((p, idx) => {
          const val = currentObj.evaluate(p.x, p.y);
          const s = vp.worldToScreen(p.x, p.y);

          ctx.save();
          ctx.beginPath();
          ctx.arc(s.x, s.y, 9, 0, Math.PI * 2);
          ctx.fillStyle = val < 3 ? '#34d399' : '#f43f5e';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.fill();
          ctx.stroke();

          const label = `#${idx + 1}: f=${val.toFixed(2)}`;
          ctx.font = '700 14px "Ubuntu Mono", monospace';
          const tw = ctx.measureText(label).width + 14;
          ctx.fillStyle = 'rgba(5, 13, 24, 0.9)';
          ctx.fillRect(s.x + 12, s.y - 14, tw, 26);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(s.x + 12, s.y - 14, tw, 26);
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(label, s.x + 19, s.y + 4);
          ctx.restore();
        });
      }

      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const { width, height } = syncCanvasSize(canvas);
        const vp = contourCache.renderBackground(
          canvas.getContext('2d'),
          width,
          height,
          currentObj,
          'terrain',
          { showOptimum: chkReveal.checked }
        );
        if (!vp) return;
        const w = vp.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        if (w.x < currentObj.min || w.x > currentObj.max || w.y < currentObj.min || w.y > currentObj.max) {
          return;
        }
        probes.push({ x: w.x, y: w.y });
        if (probes.length > 6) probes.shift();
        const fVal = currentObj.evaluate(w.x, w.y);
        probeStatus.textContent = `Titik (${w.x.toFixed(2)}, ${w.y.toFixed(2)}) → tinggi f = ${fVal.toFixed(3)}`;
        render();
      });

      container.querySelectorAll('#obj-btn-group .btn').forEach((btn) => {
        btn.addEventListener('click', () => selectObj(btn.dataset.obj));
      });
      chkReveal.addEventListener('change', render);
      container.querySelector('#btn-clear-probes').addEventListener('click', () => {
        probes = [];
        probeStatus.textContent = 'Klik titik mana pun untuk mengukur ketinggian f(x, y)';
        render();
      });

      const onResize = () => render();
      window.addEventListener('resize', onResize);
      selectObj('rastrigin');

      return () => {
        window.removeEventListener('resize', onResize);
      };
    }
  },

  // =========================================================================
  // SLIDE 3: IDE UMUM METAHEURISTIK (EKSPLORASI VS EKSPLOITASI)
  // =========================================================================
  {
    id: 'metaheuristics',
    shortTitle: 'Metaheuristik',
    title: 'Populasi Solusi: Eksplorasi vs Eksploitasi',
    theme: 'intro',
    notes: `
      <ul>
        <li><strong>Mengapa populasi?</strong> Satu pencari sendirian mudah tersesat di lembah lokal. Puluhan agen yang bekerja sama bisa saling berbagi informasi posisi terbaik.</li>
        <li><strong>Dua gaya tarik-menarik:</strong>
          <ul>
            <li><em>Eksplorasi (Menjelajah):</em> Menyebar ke area baru agar tidak terjebak di lembah palsu.</li>
            <li><em>Eksploitasi (Memusat):</em> Memperdalam pencarian di sekitar titik terbaik yang sudah ditemukan.</li>
          </ul>
        </li>
        <li><strong>Demo tombol di layar:</strong> Klik 3 mode di kanan untuk memperlihatkan akibat terlalu menyebar vs terjebak lokal vs seimbang!</li>
      </ul>
    `,
    mount(container, { reducedMotion }) {
      container.innerHTML = `
        <div class="slide-top">
          <div>
            <div class="slide-context">Slide 3 · Konsep Kunci Metaheuristik</div>
            <h1 class="slide-heading">Populasi Solusi: Eksplorasi vs Eksploitasi</h1>
            <p class="slide-keyline">Algoritma metaheuristik menyeimbangkan penjelajahan area luas dan pemusatan di sekitar lembah terbaik.</p>
          </div>
        </div>

        <div class="split-grid">
          <div class="card-panel canvas-card">
            <div class="stage-hud-overlay">
              <div class="stage-badge">
                <span class="stage-badge-code" id="meta-mode-code">SEIMBANG</span>
                <span id="meta-mode-desc">Menjelajah awal lalu memusat ke Optimum Global (0, 0)</span>
              </div>
            </div>
            <canvas id="meta-balance-canvas"></canvas>
          </div>

          <div class="card-panel" style="justify-content:space-between; gap:1rem;">
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <div style="font-size:var(--fs-ui); font-weight:700; color:var(--theme-primary);">Bandingkan 3 Perilaku Populasi</div>
              <button type="button" class="btn" data-mode="explore" style="justify-content:flex-start; text-align:left; padding:0.75rem 0.95rem;">
                <span class="role-chip">EKS</span>
                <span><strong>100% Eksplorasi:</strong> Acak terus-menerus, sulit akurat</span>
              </button>
              <button type="button" class="btn" data-mode="exploit" style="justify-content:flex-start; text-align:left; padding:0.75rem 0.95rem;">
                <span class="role-chip" style="color:#d95b5b;">LOK</span>
                <span><strong>100% Eksploitasi:</strong> Cepat kumpul, terjebak lembah lokal</span>
              </button>
              <button type="button" class="btn btn-accent" data-mode="balanced" style="justify-content:flex-start; text-align:left; padding:0.75rem 0.95rem;">
                <span class="role-chip" style="background:#071b27; color:#fae0a5; border-color:#d8a33a;">OPT</span>
                <span><strong>Metaheuristik (SFLA &amp; WCA):</strong> Lolos jebakan menuju optimum</span>
              </button>
            </div>

            <div style="padding:1rem 1.15rem; border-radius:10px; background:#0b1623; border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:0.65rem;">
              <div style="display:flex; justify-content:space-between; font-size:var(--fs-small); font-weight:700;">
                <span style="color:#53bce3;">Eksplorasi Global</span>
                <span style="color:#d8a33a;">Eksploitasi Lokal</span>
              </div>
              <div style="height:12px; border-radius:999px; background:#162638; overflow:hidden; display:flex;">
                <div id="bar-exp-left" style="width:50%; background-color:#2298c7; transition:width 0.3s ease-out;"></div>
                <div id="bar-exp-right" style="flex:1; background-color:#d8a33a;"></div>
              </div>
              <div id="meta-takeaway" style="font-size:var(--fs-ui); color:var(--text-secondary);">
                <strong>SFLA</strong> memakai <em>Shuffle + Sensor Acak</em> untuk eksplorasi &amp; <em>Lompatan Memeplex</em> untuk eksploitasi.<br/>
                <strong>WCA</strong> memakai <em>Penguapan + Hujan</em> untuk eksplorasi &amp; <em>Aliran ke Laut</em> untuk eksploitasi.
              </div>
            </div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('#meta-balance-canvas');
      const modeCodeEl = container.querySelector('#meta-mode-code');
      const modeDescEl = container.querySelector('#meta-mode-desc');
      const barLeft = container.querySelector('#bar-exp-left');
      const contour = new ContourMapCache();
      const obj = getObjective('rastrigin');

      let mode = 'balanced';
      let rafId = null;
      const rng = createRng(108);
      const agents = Array.from({ length: 24 }, () => ({
        x: rng.range(-4.5, 4.5),
        y: rng.range(-4.5, 4.5),
        vx: rng.range(-0.04, 0.04),
        vy: rng.range(-0.04, 0.04),
        phase: rng.range(0, Math.PI * 2)
      }));

      function setMode(newMode) {
        mode = newMode;
        container.querySelectorAll('[data-mode]').forEach((b) => {
          b.classList.toggle('btn-accent', b.dataset.mode === newMode);
        });
        if (newMode === 'explore') {
          modeCodeEl.textContent = 'EKSPLORASI MURNI';
          modeDescEl.textContent = 'Agen melompat acak ke segala arah tanpa pemusatan';
          barLeft.style.width = '88%';
        } else if (newMode === 'exploit') {
          modeCodeEl.textContent = 'JEBAKAN LOKAL';
          modeDescEl.textContent = 'Terlalu rakus: seluruh populasi terjebak di lembah palsu (-2, 2)';
          barLeft.style.width = '14%';
        } else {
          modeCodeEl.textContent = 'SEIMBANG (IDEAL)';
          modeDescEl.textContent = 'Sebagian menjelajah, sebagian memusat ke Optimum Global (0, 0)';
          barLeft.style.width = '50%';
        }
      }

      container.querySelectorAll('[data-mode]').forEach((b) => {
        b.addEventListener('click', () => setMode(b.dataset.mode));
      });

      function tick(ts) {
        const { ctx, width, height } = syncCanvasSize(canvas);
        const vp = contour.renderBackground(ctx, width, height, obj, 'terrain', { showOptimum: true });
        if (!vp) return;

        const t = ts * 0.001;
        // Gambar penanda jebakan lokal saat mode exploit
        if (mode === 'exploit') {
          const trap = vp.worldToScreen(-1.99, 1.99);
          ctx.save();
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.arc(trap.x, trap.y, 28, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#fda4af';
          ctx.fillText('Lembah Lokal (Jebakan!)', trap.x + 32, trap.y + 5);
          ctx.restore();
        }

        agents.forEach((a, idx) => {
          if (!reducedMotion) {
            if (mode === 'explore') {
              a.x += Math.sin(t * 2.1 + a.phase + idx) * 0.055;
              a.y += Math.cos(t * 1.9 + a.phase * 1.3) * 0.055;
              if (a.x > 4.6) a.x = -4.6;
              if (a.x < -4.6) a.x = 4.6;
              if (a.y > 4.6) a.y = -4.6;
              if (a.y < -4.6) a.y = 4.6;
            } else if (mode === 'exploit') {
              // Tertarik ke lembah lokal (-1.99, 1.99)
              const tx = -1.99 + Math.cos(a.phase + t) * 0.16;
              const ty = 1.99 + Math.sin(a.phase + t) * 0.16;
              a.x += (tx - a.x) * 0.06;
              a.y += (ty - a.y) * 0.06;
            } else {
              // Balanced: 18 agen konvergen ke (0,0), 6 agen tetap berpatroli lalu sesekali mendekat
              if (idx % 4 === 0) {
                const orbitR = 1.6 + 1.1 * Math.sin(t * 0.8 + a.phase);
                const tx = Math.cos(t * 0.9 + a.phase) * orbitR;
                const ty = Math.sin(t * 0.9 + a.phase) * orbitR;
                a.x += (tx - a.x) * 0.05;
                a.y += (ty - a.y) * 0.05;
              } else {
                const tx = Math.cos(a.phase + t * 1.5) * 0.18;
                const ty = Math.sin(a.phase + t * 1.5) * 0.18;
                a.x += (tx - a.x) * 0.055;
                a.y += (ty - a.y) * 0.055;
              }
            }
          }

          const s = vp.worldToScreen(a.x, a.y);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 7.5, 0, Math.PI * 2);
          ctx.fillStyle = mode === 'exploit' ? '#fb7185' : idx % 4 === 0 && mode === 'balanced' ? '#38bdf8' : '#34d399';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
        });

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }
];
