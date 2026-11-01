/* Auto-generated offline bundle for SFLA & WCA Interactive Presentation */
(function(modules) {
  const cache = Object.create(null);
  function __require(id) {
    if (cache[id]) return cache[id].exports;
    if (!modules[id]) throw new Error('Module not found: ' + id);
    const mod = { exports: {} };
    cache[id] = mod;
    modules[id](mod.exports, __require);
    return mod.exports;
  }
  __require("main.js");
})({
  "main.js": function(exports, __require) {
const {  WorkspaceController  } = __require("ui/navigation.js");
const {  tabs  } = __require("tabs/index.js");

if (
  typeof CanvasRenderingContext2D !== 'undefined' &&
  !CanvasRenderingContext2D.prototype.roundRect
) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 0) {
    const rad = typeof r === 'number' ? Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2) : 0;
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

function bootstrap() {
  const workspace = new WorkspaceController(tabs);
  workspace.init();
  window.__SFLA_WCA_WORKSPACE__ = workspace;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

  
  },
  "ui/navigation.js": function(exports, __require) {
/**
 * Pengelola Navigasi 4-Tab Workspace ITS
 * Menangani perpindahan antar tab modul (#konsep, #sfla, #wca, #komparasi),
 * pintasan keyboard laboratorium (1-4, P, S, R, N, F, ?), dan pembersihan loop Canvas 2D.
 */
class WorkspaceController {
  constructor(tabs) {
    this.tabs = tabs;
    this.currentIndex = 0;
    this.activeCleanup = null;
    this.activeHooks = null;
    this.notesOpen = false;
    this.reducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    this.stageEl = document.getElementById('workspace-stage');
    this.tabsNavEl = document.getElementById('workspace-tabs');
    this.btnNotes = document.getElementById('btn-notes');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.btnHelp = document.getElementById('btn-help');

    this.notesDrawer = document.getElementById('presenter-notes');
    this.notesTitle = document.getElementById('notes-tab-title');
    this.notesContent = document.getElementById('notes-content');
    this.shortcutsModal = document.getElementById('shortcuts-modal');
  }

  init() {
    this.buildTabButtons();
    this.bindEvents();

    const hashId = window.location.hash.replace(/^#/, '').trim().toLowerCase();
    const matchedIdx = this.tabs.findIndex((t) => t.id === hashId);
    this.activateTab(matchedIdx >= 0 ? matchedIdx : 0, false);
  }

  buildTabButtons() {
    if (!this.tabsNavEl) return;
    this.tabsNavEl.innerHTML = '';

    this.tabs.forEach((tab, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'workspace-tab';
      btn.setAttribute('data-ui', '');
      btn.setAttribute('role', 'tab');
      btn.id = `tab-btn-${tab.id}`;
      btn.dataset.tabId = tab.id;
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.innerHTML = `<span>${tab.label}</span><span class="tab-key">[${idx + 1}]</span>`;
      btn.addEventListener('click', () => this.activateTab(idx));
      this.tabsNavEl.appendChild(btn);
    });
  }

  bindEvents() {
    this.btnNotes?.addEventListener('click', () => this.toggleNotes());
    document.getElementById('btn-close-notes')?.addEventListener('click', () => this.toggleNotes(false));

    this.btnFullscreen?.addEventListener('click', () => this.toggleFullscreen());

    this.btnHelp?.addEventListener('click', () => {
      this.shortcutsModal?.classList.toggle('hidden');
    });
    document.getElementById('btn-close-help')?.addEventListener('click', () => {
      this.shortcutsModal?.classList.add('hidden');
    });
    this.shortcutsModal?.addEventListener('click', (e) => {
      if (e.target === this.shortcutsModal) this.shortcutsModal.classList.add('hidden');
    });

    window.addEventListener('keydown', (e) => this.handleKeydown(e));
    window.addEventListener('hashchange', () => {
      const hashId = window.location.hash.replace(/^#/, '').trim().toLowerCase();
      const idx = this.tabs.findIndex((t) => t.id === hashId);
      if (idx >= 0 && idx !== this.currentIndex) {
        this.activateTab(idx, false);
      }
    });
  }

  isInteractiveElement(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  handleKeydown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Escape') {
      this.shortcutsModal?.classList.add('hidden');
      if (this.notesOpen) this.toggleNotes(false);
      return;
    }

    if (this.isInteractiveElement(e.target)) return;

    if (e.key >= '1' && e.key <= '4') {
      const targetIdx = Number(e.key) - 1;
      if (targetIdx < this.tabs.length) {
        e.preventDefault();
        this.activateTab(targetIdx);
      }
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      this.toggleFullscreen();
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      this.toggleNotes();
    } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      this.shortcutsModal?.classList.toggle('hidden');
    } else if ((e.key === 'p' || e.key === 'P') && this.activeHooks?.togglePlay) {
      e.preventDefault();
      this.activeHooks.togglePlay();
    } else if ((e.key === 's' || e.key === 'S') && this.activeHooks?.step) {
      e.preventDefault();
      this.activeHooks.step();
    } else if ((e.key === 'r' || e.key === 'R') && this.activeHooks?.reset) {
      e.preventDefault();
      this.activeHooks.reset();
    }
  }

  toggleNotes(forceState) {
    this.notesOpen = typeof forceState === 'boolean' ? forceState : !this.notesOpen;
    this.notesDrawer?.classList.toggle('hidden', !this.notesOpen);
    this.btnNotes?.setAttribute('aria-pressed', String(this.notesOpen));
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  goToTab(idOrIndex) {
    if (typeof idOrIndex === 'string') {
      const idx = this.tabs.findIndex((t) => t.id === idOrIndex);
      if (idx >= 0) this.activateTab(idx);
    } else if (typeof idOrIndex === 'number') {
      this.activateTab(idOrIndex);
    }
  }

  activateTab(index, updateHash = true) {
    if (index < 0 || index >= this.tabs.length) return;

    if (typeof this.activeCleanup === 'function') {
      try {
        this.activeCleanup();
      } catch (err) {
        console.error(err);
      }
    }
    this.activeCleanup = null;
    this.activeHooks = null;

    this.currentIndex = index;
    const tab = this.tabs[index];

    document.body.dataset.module = tab.id;
    if (this.stageEl) {
      this.stageEl.innerHTML = '';

      const panel = document.createElement('section');
      panel.className = 'tab-view';
      panel.id = `tabpanel-${tab.id}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-btn-${tab.id}`);
      this.stageEl.appendChild(panel);

      const mountResult = tab.mount(panel, {
        workspace: this,
        reducedMotion: this.reducedMotion,
        registerHooks: (hooks) => {
          this.activeHooks = hooks;
        }
      });

      if (typeof mountResult === 'function') {
        this.activeCleanup = mountResult;
      } else if (mountResult && typeof mountResult.cleanup === 'function') {
        this.activeCleanup = mountResult.cleanup;
      }
    }

    if (this.tabsNavEl) {
      Array.from(this.tabsNavEl.children).forEach((btn, i) => {
        btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    }

    if (this.notesTitle) {
      this.notesTitle.textContent = tab.title;
    }
    if (this.notesContent) {
      this.notesContent.innerHTML = tab.notes || '<p>Gunakan kontrol interaktif untuk mendemonstrasikan perilaku algoritma.</p>';
    }

    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    if (updateHash) {
      try {
        window.history.replaceState(null, '', `#${tab.id}`);
      } catch (_e) {
        // Ignore file:// history restrictions
      }
    }
  }
}


  exports.WorkspaceController = WorkspaceController;
  exports.DeckController = WorkspaceController;
  },
  "tabs/index.js": function(exports, __require) {
const {  tabKonsep  } = __require("tabs/tabKonsep.js");
const {  tabSfla  } = __require("tabs/tabSfla.js");
const {  tabWca  } = __require("tabs/tabWca.js");
const {  tabKomparasi  } = __require("tabs/tabKomparasi.js");
const tabs = [tabKonsep, tabSfla, tabWca, tabKomparasi];



  exports.tabs = tabs;
  exports.slides = tabs;
  },
  "tabs/tabKonsep.js": function(exports, __require) {
/**
 * Tab 1: Konsep & Lanskap Optimasi Metaheuristik
 * Memuat identitas mata kuliah SOKA ITS, eksplorasi interaktif lanskap kontur 2D (klik untuk evaluasi f(x,y)),
 * simulator dinamika Eksplorasi vs Eksploitasi, dan pengantar taksonomi SFLA & WCA.
 */
const {  OBJECTIVES, getObjective, clampCoord  } = __require("core/objectives.js");
const {  createRng  } = __require("core/rng.js");
const {  ContourMapCache, syncCanvasSize  } = __require("render/contourRenderer.js");

const TEAM_STORAGE_KEY = 'soka_its_team_identity_v2';
const tabKonsep = {
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

  exports.tabKonsep = tabKonsep;
  },
  "core/objectives.js": function(exports, __require) {
/**
 * Fungsi Objektif 2D untuk Simulasi Visual (PRD Bagian 10 & F-07)
 * Semua fungsi diminimalkan menuju nilai global minimum f(0, 0) = 0.
 */

const TWO_PI = 2 * Math.PI;
const OBJECTIVES = {
  sphere: {
    id: 'sphere',
    name: 'Sphere',
    character: 'Satu lembah mulus (Unimodal)',
    formulaText: 'f(x, y) = x² + y²',
    min: -5.12,
    max: 5.12,
    maxVisualValue: 52,
    optimum: { x: 0, y: 0, value: 0 },
    evaluate(x, y) {
      return x * x + y * y;
    }
  },

  rastrigin: {
    id: 'rastrigin',
    name: 'Rastrigin',
    character: 'Banyak lembah lokal (Multimodal)',
    formulaText: 'f(x, y) = 20 + (x² − 10 cos 2πx) + (y² − 10 cos 2πy)',
    min: -5.12,
    max: 5.12,
    maxVisualValue: 82,
    optimum: { x: 0, y: 0, value: 0 },
    evaluate(x, y) {
      return (
        20 +
        (x * x - 10 * Math.cos(TWO_PI * x)) +
        (y * y - 10 * Math.cos(TWO_PI * y))
      );
    }
  },

  ackley: {
    id: 'ackley',
    name: 'Ackley',
    character: 'Banyak riak lokal dengan lembah pusat curam',
    formulaText: 'f(x, y) = −20 exp(−0.2√(0.5(x²+y²))) − exp(0.5(cos 2πx + cos 2πy)) + e + 20',
    min: -5.0,
    max: 5.0,
    maxVisualValue: 22.5,
    optimum: { x: 0, y: 0, value: 0 },
    evaluate(x, y) {
      const sumSq = 0.5 * (x * x + y * y);
      const sumCos = 0.5 * (Math.cos(TWO_PI * x) + Math.cos(TWO_PI * y));
      const val = -20 * Math.exp(-0.2 * Math.sqrt(sumSq)) - Math.exp(sumCos) + Math.E + 20;
      return val < 1e-14 ? 0 : val;
    }
  }
};
function getObjective(id) {
  return OBJECTIVES[id] || OBJECTIVES.sphere;
}
function clampCoord(val, min, max) {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}


  exports.getObjective = getObjective;
  exports.clampCoord = clampCoord;
  exports.OBJECTIVES = OBJECTIVES;
  },
  "core/rng.js": function(exports, __require) {
/**
 * Seedable Pseudo-Random Number Generator (Mulberry32)
 * Menjamin hasil simulasi dapat diulang persis sama dengan seed yang sama (F-13 & Kriteria #5).
 */
function hashSeed(seedInput) {
  if (typeof seedInput === 'number' && Number.isFinite(seedInput)) {
    let h = (seedInput | 0) ^ 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  }
  const str = String(seedInput ?? '42');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function createRng(seedInput = 42) {
  let state = hashSeed(seedInput);
  if (state === 0) state = 0x6d2b79f5;

  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min, max) {
    return min + next() * (max - min);
  }

  function int(min, maxInclusive) {
    return Math.floor(min + next() * (maxInclusive - min + 1));
  }

  function gaussian(mean = 0, std = 1) {
    // Transformasi Box-Muller untuk distribusi normal N(mean, std^2)
    const u1 = Math.max(1e-12, next());
    const u2 = next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * std;
  }

  return {
    next,
    range,
    int,
    gaussian,
    getState: () => state >>> 0,
    setState: (newState) => {
      state = newState >>> 0;
    }
  };
}


  exports.hashSeed = hashSeed;
  exports.createRng = createRng;
  },
  "render/contourRenderer.js": function(exports, __require) {
/**
 * Renderer Peta Kontur 2D Berperforma Tinggi (Offscreen Bitmap Cache)
 * Dikalibrasi dengan Palet Identitas Resmi ITS (Biru ITS, Medical Tosca FKK, Summer Sky FTK, Kuning Tua ITS).
 * Skala piksel seragam (uniform scale) agar jarak Euclidean seperti radius dmax tetap bulat sempurna.
 */

function lerpColor(stops, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (stops.length - 1);
  const idx = Math.min(stops.length - 2, Math.floor(scaled));
  const frac = scaled - idx;
  const c0 = stops[idx];
  const c1 = stops[idx + 1];
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * frac),
    Math.round(c0[1] + (c1[1] - c0[1]) * frac),
    Math.round(c0[2] + (c1[2] - c0[2]) * frac)
  ];
}

const PALETTES = {
  // Kolam teratai SFLA: palung Navy ITS (#03132B) menuju cekungan Medical Tosca FKK (#12B0A2) & tepi Biru Cover
  pond: [
    [3, 19, 43],
    [8, 46, 72],
    [13, 86, 98],
    [18, 112, 108],
    [22, 68, 92],
    [32, 54, 96]
  ],
  // Siklus air WCA: palung samudra Navy ITS (#03132B) -> Biru Lambang (#127BBE) -> punggung pegunungan Biru Muda
  water: [
    [2, 15, 38],
    [10, 44, 92],
    [18, 92, 152],
    [25, 72, 124],
    [35, 63, 124],
    [62, 92, 138]
  ],
  // Peta topografi umum: gradasi tenang Navy ITS menuju Biru Cover & Tosca dalam agar titik data kontras tajam
  terrain: [
    [3, 19, 43],
    [10, 38, 76],
    [16, 68, 114],
    [18, 94, 122],
    [24, 58, 96],
    [30, 46, 82]
  ]
};
function createViewport(width, height, objective, paddingRatio = 0.08) {
  const domainSpan = objective.max - objective.min;
  const usable = Math.min(width, height) * (1 - paddingRatio * 2);
  const scale = Math.max(1, usable / domainSpan);
  const cx = width / 2;
  const cy = height / 2;
  const mid = (objective.min + objective.max) / 2;

  return {
    width,
    height,
    scale,
    min: objective.min,
    max: objective.max,
    worldToScreen(wx, wy) {
      return {
        x: cx + (wx - mid) * scale,
        y: cy - (wy - mid) * scale
      };
    },
    screenToWorld(px, py) {
      return {
        x: mid + (px - cx) / scale,
        y: mid - (py - cy) / scale
      };
    },
    worldDistToPx(dist) {
      return dist * scale;
    }
  };
}
class ContourMapCache {
  constructor() {
    this.cacheKey = '';
    this.offscreen = null;
  }

  renderBackground(ctx, width, height, objective, paletteName = 'terrain', options = {}) {
    if (width <= 2 || height <= 2) return null;
    const vp = createViewport(width, height, objective, options.paddingRatio ?? 0.07);
    const key = `${width}x${height}:${objective.id}:${paletteName}`;

    if (this.cacheKey !== key || !this.offscreen) {
      this.cacheKey = key;
      this.offscreen = this.buildOffscreen(width, height, objective, paletteName, vp);
    }

    ctx.drawImage(this.offscreen, 0, 0, width, height);

    // Batas domain pencarian teknis (Biru Muda Lambang ITS #75BDE0)
    const topLeft = vp.worldToScreen(objective.min, objective.max);
    const botRight = vp.worldToScreen(objective.max, objective.min);
    ctx.save();
    ctx.strokeStyle = 'rgba(117, 189, 224, 0.26)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      topLeft.x,
      topLeft.y,
      botRight.x - topLeft.x,
      botRight.y - topLeft.y
    );
    ctx.setLineDash([]);

    // Garis sumbu kartesian melalui (0, 0)
    const origin = vp.worldToScreen(0, 0);
    ctx.strokeStyle = 'rgba(117, 189, 224, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, origin.y);
    ctx.lineTo(botRight.x, origin.y);
    ctx.moveTo(origin.x, topLeft.y);
    ctx.lineTo(origin.x, botRight.y);
    ctx.stroke();

    // Label koordinat domain tipis di sudut bawah peta agar tidak bertumpuk dengan HUD atas
    if (width >= 320) {
      const labelY = Math.min(botRight.y - 10, height - 10);
      ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(184, 197, 217, 0.64)';
      ctx.textAlign = 'left';
      ctx.fillText(`min (${objective.min}, ${objective.min})`, topLeft.x + 8, labelY);
      ctx.textAlign = 'right';
      ctx.fillText(`max (${objective.max}, ${objective.max})`, botRight.x - 8, labelY);
    }

    // Penanda Global Optimum (Kuning Tua Logo ITS #FDBB16)
    if (options.showOptimum !== false) {
      const optPos = vp.worldToScreen(objective.optimum.x, objective.optimum.y);
      this.drawOptimumStar(ctx, optPos.x, optPos.y);
    }
    ctx.restore();

    return vp;
  }

  buildOffscreen(width, height, objective, paletteName, vp) {
    const scaleDown = 2;
    const rw = Math.max(2, Math.ceil(width / scaleDown));
    const rh = Math.max(2, Math.ceil(height / scaleDown));

    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = rw;
    smallCanvas.height = rh;
    const sctx = smallCanvas.getContext('2d');
    const img = sctx.createImageData(rw, rh);
    const data = img.data;

    const stops = PALETTES[paletteName] || PALETTES.terrain;
    const normField = new Float32Array(rw * rh);
    const maxVal = objective.maxVisualValue || 50;

    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        const world = vp.screenToWorld((px + 0.5) * scaleDown, (py + 0.5) * scaleDown);
        const raw = objective.evaluate(world.x, world.y);
        const norm = Math.pow(Math.min(1, Math.max(0, raw / maxVal)), 0.58);
        normField[py * rw + px] = norm;
      }
    }

    const numBands = 14;
    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        const idx = py * rw + px;
        const n = normField[idx];
        const rgb = lerpColor(stops, n);

        let isContour = false;
        if (px > 0 && py > 0) {
          const bCurr = Math.floor(n * numBands);
          const bLeft = Math.floor(normField[idx - 1] * numBands);
          const bTop = Math.floor(normField[idx - rw] * numBands);
          if (bCurr !== bLeft || bCurr !== bTop) {
            isContour = true;
          }
        }

        const p = idx * 4;
        if (isContour) {
          data[p] = Math.min(255, rgb[0] + 30);
          data[p + 1] = Math.min(255, rgb[1] + 42);
          data[p + 2] = Math.min(255, rgb[2] + 54);
          data[p + 3] = 255;
        } else {
          data[p] = rgb[0];
          data[p + 1] = rgb[1];
          data[p + 2] = rgb[2];
          data[p + 3] = 255;
        }
      }
    }

    sctx.putImageData(img, 0, 0);

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = width;
    fullCanvas.height = height;
    const fctx = fullCanvas.getContext('2d');
    fctx.imageSmoothingEnabled = true;
    fctx.imageSmoothingQuality = 'high';
    fctx.drawImage(smallCanvas, 0, 0, rw, rh, 0, 0, width, height);

    const grad = fctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.34,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.74
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(3, 19, 43, 0.52)');
    fctx.fillStyle = grad;
    fctx.fillRect(0, 0, width, height);

    return fullCanvas;
  }

  drawOptimumStar(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
    glow.addColorStop(0, 'rgba(253, 187, 22, 0.72)');
    glow.addColorStop(1, 'rgba(253, 187, 22, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    const spikes = 5;
    const outerR = 9.5;
    const innerR = 4.2;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fillStyle = '#fdbb16';
    ctx.strokeStyle = '#03132b';
    ctx.lineWidth = 1.6;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
function syncCanvasSize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(10, Math.floor(rect.width));
  const h = Math.max(10, Math.floor(rect.height));
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: w, height: h };
}

  exports.createViewport = createViewport;
  exports.syncCanvasSize = syncCanvasSize;
  exports.ContourMapCache = ContourMapCache;
  },
  "tabs/tabSfla.js": function(exports, __require) {
/**
 * Tab 2: Laboratorium Simulasi Shuffled Frog-Leaping Algorithm (SFLA)
 * Menggabungkan kanvas simulasi live 2D Kolam Teratai, kontrol hiperparameter real-time,
 * kurva konvergensi, dan meja kerja interaktif 4 tahap mekanisme internal SFLA.
 */
const {  getObjective  } = __require("core/objectives.js");
const {  SimulationRunner  } = __require("core/engine.js");
const {  SFLAEngine  } = __require("algorithms/sfla.js");
const {  SFLARenderer, MEMEPLEX_COLORS  } = __require("render/sflaRenderer.js");
const {  renderConvergenceChart  } = __require("render/chart.js");
const {  syncCanvasSize  } = __require("render/contourRenderer.js");
const tabSfla = {
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


  exports.tabSfla = tabSfla;
  },
  "core/engine.js": function(exports, __require) {
/**
 * Mesin Loop Animasi Presentasi (PRD Bagian 12 & 13)
 * Memisahkan detak logika algoritma (play/pause/step) dari loop rendering 60 FPS (requestAnimationFrame)
 * dengan interpolasi posisi halus antar langkah diskrit.
 */
class SimulationRunner {
  /**
   * @param {Object} options
   * @param {Function} options.onStep - Dipanggil saat 1 langkah algoritma dieksekusi; mengembalikan apakah sudah selesai ('DONE')
   * @param {Function} options.onRender - Dipanggil setiap frame animasi dengan (alpha, timestamp)
   * @param {number} [options.stepsPerSecond=2.5] - Kecepatan langkah saat mode Play
   * @param {boolean} [options.reducedMotion=false]
   */
  constructor({ onStep, onRender, stepsPerSecond = 2.5, reducedMotion = false }) {
    this.onStep = onStep;
    this.onRender = onRender;
    this.stepsPerSecond = stepsPerSecond;
    this.reducedMotion = reducedMotion;

    this.playing = false;
    this.rafId = null;
    this.lastStepTime = 0;
    this.transitionStart = 0;
    this.transitionDuration = this.computeTransitionMs(stepsPerSecond);
    this.onPlayStateChange = null;
  }

  computeTransitionMs(sps) {
    if (this.reducedMotion) return 1;
    const interval = 1000 / Math.max(0.25, sps);
    return Math.min(520, Math.max(60, interval * 0.78));
  }

  setSpeed(stepsPerSecond) {
    this.stepsPerSecond = Math.max(0.3, Math.min(30, Number(stepsPerSecond) || 2.5));
    this.transitionDuration = this.computeTransitionMs(this.stepsPerSecond);
  }

  startLoop() {
    if (this.rafId) return;
    const loop = (now) => {
      if (this.playing) {
        const intervalMs = 1000 / this.stepsPerSecond;
        if (now - this.lastStepTime >= intervalMs) {
          this.lastStepTime = now;
          this.transitionStart = now;
          const done = this.onStep();
          if (done) {
            this.pause();
          }
        }
      }

      const rawAlpha =
        this.transitionDuration <= 2
          ? 1
          : Math.min(1, Math.max(0, (now - this.transitionStart) / this.transitionDuration));
      // Cubic ease-out agar lompatan katak & aliran air mendarat mulus
      const easedAlpha = 1 - Math.pow(1 - rawAlpha, 3);

      this.onRender(easedAlpha, now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.lastStepTime = 0;
    this.onPlayStateChange?.(true);
    this.startLoop();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.onPlayStateChange?.(false);
  }

  togglePlay() {
    if (this.playing) this.pause();
    else this.play();
  }

  stepOnce() {
    this.pause();
    const now = performance.now();
    this.transitionStart = now;
    this.transitionDuration = this.reducedMotion ? 1 : 420;
    this.onStep();
    this.startLoop();
  }

  notifyReset() {
    this.pause();
    this.transitionStart = performance.now();
    this.transitionDuration = 1;
    this.startLoop();
  }

  destroy() {
    this.playing = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}


  exports.SimulationRunner = SimulationRunner;
  },
  "algorithms/sfla.js": function(exports, __require) {
/**
 * Shuffled Frog-Leaping Algorithm (SFLA) — Mesin Status Murni (Tanpa DOM)
 * Referensi: Eusuff, M. M., & Lansey, K. E. (2003).
 *
 * Urutan event tahap (Acceptance Criterion #2):
 *   INIT -> SORT -> PARTITION -> LOCAL_JUMP (x N) -> SHUFFLE -> PARTITION -> ... -> DONE
 */
const {  createRng  } = __require("core/rng.js");
const {  clampCoord  } = __require("core/objectives.js");
class SFLAEngine {
  /**
   * @param {Object} config
   * @param {Object} config.objective - Objek fungsi objektif { evaluate(x,y), min, max }
   * @param {number} [config.populationSize=24] - Jumlah katak total (F)
   * @param {number} [config.memeplexCount=4] - Jumlah memeplex (m)
   * @param {number} [config.localIterations=3] - Iterasi evolusi lokal per memeplex (N)
   * @param {number} [config.maxStep=3.2] - Langkah lompatan maksimum (Dmax)
   * @param {number} [config.maxIterations=40] - Maksimum siklus global (shuffle)
   * @param {number|string} [config.seed=42] - Seed PRNG
   * @param {Array<{x:number, y:number}>} [config.initialPositions] - Opsional posisi awal bersama
   */
  constructor(config) {
    this.configure(config);
  }

  configure(config = {}) {
    this.objective = config.objective;
    this.memeplexCount = Math.max(2, Math.min(8, Math.round(config.memeplexCount ?? 4)));
    const rawF = Math.max(this.memeplexCount * 2, Math.min(100, Math.round(config.populationSize ?? 24)));
    this.populationSize = rawF;
    this.localIterations = Math.max(1, Math.min(15, Math.round(config.localIterations ?? 3)));
    this.maxStep = Math.max(0.2, Number(config.maxStep ?? 3.2));
    this.maxIterations = Math.max(5, Math.round(config.maxIterations ?? 40));
    this.seed = config.seed ?? 42;
    this.initialPositions = config.initialPositions || null;
    this.reset();
  }

  reset() {
    this.rng = createRng(this.seed);
    const { min, max } = this.objective;

    this.frogs = Array.from({ length: this.populationSize }, (_, i) => {
      const preset = this.initialPositions && this.initialPositions[i];
      const x = preset ? clampCoord(preset.x, min, max) : this.rng.range(min, max);
      const y = preset ? clampCoord(preset.y, min, max) : this.rng.range(min, max);
      const fitness = this.objective.evaluate(x, y);
      return {
        id: i + 1,
        x,
        y,
        prevX: x,
        prevY: y,
        fitness,
        rank: -1,
        memeplex: -1,
        role: 'member',
        lastJumpType: null,
        trail: [{ x, y }]
      };
    });

    this.iteration = 0;
    this.localStep = 0;
    this.jumps = [];
    this.bestFrog = this.computeBestSnapshot();
    this.history = [
      {
        iteration: 0,
        bestFitness: this.bestFrog.fitness,
        meanFitness: this.computeMeanFitness()
      }
    ];

    this.phase = 'INIT';
    this.phaseLabel = 'Inisialisasi Kolam';
    this.phaseDetail = `Menyebar ${this.populationSize} katak secara acak di atas permukaan kolam.`;
    return this.getState();
  }

  computeBestSnapshot() {
    let best = this.frogs[0];
    for (const f of this.frogs) {
      if (f.fitness < best.fitness) best = f;
    }
    if (this.bestFrog && this.bestFrog.fitness < best.fitness) {
      return { ...this.bestFrog };
    }
    return { id: best.id, x: best.x, y: best.y, fitness: best.fitness };
  }

  computeMeanFitness() {
    let sum = 0;
    for (const f of this.frogs) sum += f.fitness;
    return sum / Math.max(1, this.frogs.length);
  }

  syncPreviousPositions() {
    for (const f of this.frogs) {
      f.prevX = f.x;
      f.prevY = f.y;
    }
  }

  sortPopulation() {
    const ordered = [...this.frogs].sort((a, b) => a.fitness - b.fitness);
    ordered.forEach((frog, idx) => {
      frog.rank = idx;
      frog.role = idx === 0 ? 'global_best' : 'member';
    });
    const top = ordered[0];
    if (!this.bestFrog || top.fitness <= this.bestFrog.fitness) {
      this.bestFrog = { id: top.id, x: top.x, y: top.y, fitness: top.fitness };
    }
    return ordered;
  }

  updateRolesWithinMemeplexes() {
    // Tandai Xb (terbaik kelompok), Xw (terburuk kelompok), dan Xg (terbaik global)
    let globalBestFrog = this.frogs[0];
    for (const f of this.frogs) {
      f.role = 'member';
      if (f.fitness < globalBestFrog.fitness) globalBestFrog = f;
    }

    for (let k = 0; k < this.memeplexCount; k++) {
      const group = this.frogs
        .filter((f) => f.memeplex === k)
        .sort((a, b) => a.fitness - b.fitness);
      if (group.length >= 1) group[0].role = 'memeplex_best';
      if (group.length >= 2) group[group.length - 1].role = 'memeplex_worst';
    }
    globalBestFrog.role = 'global_best';

    if (globalBestFrog.fitness <= this.bestFrog.fitness) {
      this.bestFrog = {
        id: globalBestFrog.id,
        x: globalBestFrog.x,
        y: globalBestFrog.y,
        fitness: globalBestFrog.fitness
      };
    }
  }

  /**
   * Pemilihan submemeplex menggunakan distribusi peluang segitiga (Eusuff & Lansey, 2003):
   *   p_j = 2 * (n + 1 - j) / (n * (n + 1)), untuk j = 1..n (terurut terbaik -> terburuk).
   * Katak dengan fitness lebih baik berpeluang lebih besar terpilih ke submemeplex,
   * namun katak lemah tetap berpeluang masuk untuk diperbaiki posisinya.
   */
  selectSubmemeplex(sortedGroup) {
    const n = sortedGroup.length;
    if (n <= 6) return sortedGroup;

    const q = Math.max(4, Math.ceil(n * 0.65));
    const pool = sortedGroup.map((frog, idx) => ({
      frog,
      weight: (2 * (n - idx)) / (n * (n + 1))
    }));

    const chosen = [];
    for (let pick = 0; pick < q && pool.length > 0; pick++) {
      const totalW = pool.reduce((acc, item) => acc + item.weight, 0);
      let r = this.rng.next() * totalW;
      let selectedIdx = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        r -= pool[i].weight;
        if (r <= 0) {
          selectedIdx = i;
          break;
        }
      }
      chosen.push(pool[selectedIdx].frog);
      pool.splice(selectedIdx, 1);
    }

    return chosen.sort((a, b) => a.fitness - b.fitness);
  }

  /**
   * Menghitung posisi lompatan baru:
   *   X_baru = X_w + r * (X_target - X_w), dengan r acak [0, 1] dan ||langkah|| <= Dmax.
   * Asumsi standar literatur kontinu: r menggabungkan faktor langkah utama & variasi mikro 2D
   * yang keduanya berada di [0, 1] agar katak tidak kolinear kaku namun tetap mengarah jelas ke target.
   */
  computeLeapPosition(xw, target) {
    const { min, max } = this.objective;
    const rBase = this.rng.next();
    const rx = 0.75 * rBase + 0.25 * this.rng.next();
    const ry = 0.75 * rBase + 0.25 * this.rng.next();

    let dx = rx * (target.x - xw.x);
    let dy = ry * (target.y - xw.y);

    const stepLen = Math.hypot(dx, dy);
    if (stepLen > this.maxStep && stepLen > 1e-12) {
      const scale = this.maxStep / stepLen;
      dx *= scale;
      dy *= scale;
    }

    return {
      x: clampCoord(xw.x + dx, min, max),
      y: clampCoord(xw.y + dy, min, max)
    };
  }

  /**
   * Menjalankan tepat 1 event tahap SFLA.
   */
  step() {
    if (this.phase === 'DONE') {
      return this.getState();
    }

    this.syncPreviousPositions();
    this.jumps = [];

    // Tahap 1 -> 2: Evaluasi & urutkan peringkat dari terbaik ke terburuk
    if (this.phase === 'INIT') {
      this.sortPopulation();
      this.phase = 'SORT';
      this.phaseLabel = 'Evaluasi & Urutkan';
      this.phaseDetail = `Katak diurutkan #1 s.d. #${this.populationSize}; terbaik f = ${this.bestFrog.fitness.toFixed(4)}.`;
      return this.getState();
    }

    // Tahap 2/5 -> 3: Partisi bergilir (round-robin) ke m memeplex
    if (this.phase === 'SORT' || this.phase === 'SHUFFLE') {
      const ordered = this.sortPopulation();
      ordered.forEach((frog, rankIdx) => {
        frog.memeplex = rankIdx % this.memeplexCount;
        frog.lastJumpType = null;
      });
      this.localStep = 0;
      this.updateRolesWithinMemeplexes();
      this.phase = 'PARTITION';
      this.phaseLabel = 'Partisi Memeplex';
      this.phaseDetail = `Pembagian bergilir ke ${this.memeplexCount} memeplex (Katak #1→M1, #2→M2, dst.).`;
      return this.getState();
    }

    // Tahap 3 -> 4: Evolusi lokal sebanyak N langkah di tiap memeplex
    if (
      (this.phase === 'PARTITION' || this.phase === 'LOCAL_JUMP') &&
      this.localStep < this.localIterations
    ) {
      this.localStep += 1;
      let countXb = 0;
      let countXg = 0;
      let countRand = 0;

      // Simpan referensi terbaik global saat awal gelombang lokal
      const xgRef = { x: this.bestFrog.x, y: this.bestFrog.y, fitness: this.bestFrog.fitness };

      for (let k = 0; k < this.memeplexCount; k++) {
        const group = this.frogs
          .filter((f) => f.memeplex === k)
          .sort((a, b) => a.fitness - b.fitness);
        if (group.length < 2) continue;

        const sub = this.selectSubmemeplex(group);
        const xb = sub[0];
        const xw = sub[sub.length - 1];

        const fromX = xw.x;
        const fromY = xw.y;
        const oldFitness = xw.fitness;

        // Percobaan 1: Lompat ke arah terbaik submemeplex/memeplex (Xb)
        const tryXb = this.computeLeapPosition(xw, xb);
        const fitXb = this.objective.evaluate(tryXb.x, tryXb.y);

        if (fitXb < oldFitness) {
          xw.x = tryXb.x;
          xw.y = tryXb.y;
          xw.fitness = fitXb;
          xw.lastJumpType = 'XB_SUCCESS';
          countXb += 1;
          this.jumps.push({
            frogId: xw.id,
            memeplex: k,
            fromX,
            fromY,
            toX: xw.x,
            toY: xw.y,
            targetX: xb.x,
            targetY: xb.y,
            type: 'XB_SUCCESS',
            improved: true,
            triedXbFailed: false
          });
        } else {
          // Percobaan 2: Jika tidak membaik, lompat ke arah terbaik global (Xg)
          const tryXg = this.computeLeapPosition(xw, xgRef);
          const fitXg = this.objective.evaluate(tryXg.x, tryXg.y);

          if (fitXg < oldFitness) {
            xw.x = tryXg.x;
            xw.y = tryXg.y;
            xw.fitness = fitXg;
            xw.lastJumpType = 'XG_SUCCESS';
            countXg += 1;
            this.jumps.push({
              frogId: xw.id,
              memeplex: k,
              fromX,
              fromY,
              toX: xw.x,
              toY: xw.y,
              targetX: xgRef.x,
              targetY: xgRef.y,
              failedXbX: xb.x,
              failedXbY: xb.y,
              type: 'XG_SUCCESS',
              improved: true,
              triedXbFailed: true
            });
          } else {
            // Percobaan 3: Ganti dengan katak acak baru (sensor eksplorasi)
            const randX = this.rng.range(this.objective.min, this.objective.max);
            const randY = this.rng.range(this.objective.min, this.objective.max);
            xw.x = randX;
            xw.y = randY;
            xw.fitness = this.objective.evaluate(randX, randY);
            xw.lastJumpType = 'RANDOM_RESET';
            countRand += 1;
            this.jumps.push({
              frogId: xw.id,
              memeplex: k,
              fromX,
              fromY,
              toX: xw.x,
              toY: xw.y,
              targetX: xw.x,
              targetY: xw.y,
              type: 'RANDOM_RESET',
              improved: xw.fitness < oldFitness,
              triedXbFailed: true
            });
          }
        }

        xw.trail.push({ x: xw.x, y: xw.y });
        if (xw.trail.length > 8) xw.trail.shift();

        if (xw.fitness < this.bestFrog.fitness) {
          this.bestFrog = { id: xw.id, x: xw.x, y: xw.y, fitness: xw.fitness };
        }
      }

      this.updateRolesWithinMemeplexes();
      this.phase = 'LOCAL_JUMP';
      this.phaseLabel = `Lompatan Lokal (${this.localStep}/${this.localIterations})`;
      this.phaseDetail = `Hasil lompatan: ${countXb} ke Xb, ${countXg} ke Xg, ${countRand} katak acak baru.`;
      return this.getState();
    }

    // Tahap 5: Shuffle seluruh katak & cek terminasi
    this.iteration += 1;
    this.sortPopulation();
    for (const f of this.frogs) {
      f.memeplex = -1; // Menunjukkan seluruh kelompok dilebur kembali
    }

    this.history.push({
      iteration: this.iteration,
      bestFitness: this.bestFrog.fitness,
      meanFitness: this.computeMeanFitness()
    });

    if (this.iteration >= this.maxIterations) {
      this.phase = 'DONE';
      this.phaseLabel = 'Selesai (Terminasi)';
      this.phaseDetail = `Mencapai ${this.iteration} siklus. Terbaik global f = ${this.bestFrog.fitness.toExponential(3)}.`;
    } else {
      this.phase = 'SHUFFLE';
      this.phaseLabel = 'Shuffle Global';
      this.phaseDetail = `Siklus #${this.iteration}: seluruh katak dicampur & diurutkan ulang untuk bertukar informasi.`;
    }

    return this.getState();
  }

  /**
   * Menjalankan langkah-langkah hingga menyelesaikan tepat 1 siklus global (iterasi +1).
   * Berguna untuk perbandingan adil per iterasi dengan WCA pada Slide 16.
   */
  stepFullIteration() {
    if (this.phase === 'DONE') return this.getState();
    const targetIter = this.iteration + 1;
    let guard = 0;
    while (this.iteration < targetIter && this.phase !== 'DONE' && guard < 40) {
      this.step();
      guard += 1;
    }
    return this.getState();
  }

  getState() {
    return {
      phase: this.phase,
      phaseLabel: this.phaseLabel,
      phaseDetail: this.phaseDetail,
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      localStep: this.localStep,
      localIterations: this.localIterations,
      frogs: this.frogs,
      jumps: this.jumps,
      bestFrog: this.bestFrog,
      history: this.history
    };
  }
}

  exports.SFLAEngine = SFLAEngine;
  },
  "render/sflaRenderer.js": function(exports, __require) {
/**
 * Renderer Visual SFLA (Metafora Katak di Kolam Teratai)
 * Menggunakan Palet Resmi ITS: FKK Medical Tosca (#12B0A2), Kuning Tua ITS (#FDBB16),
 * FTK Summer Sky (#26AEE4), FV Crusta (#F47D52), dan Biru Muda ITS (#75BDE0).
 */
const {  ContourMapCache, syncCanvasSize  } = __require("render/contourRenderer.js");
const MEMEPLEX_COLORS = [
  '#12b0a2', // M1: FKK Medical Tosca
  '#fdbb16', // M2: ITS Kuning Tua
  '#26aee4', // M3: FTK Summer Sky
  '#f47d52', // M4: FV Crusta
  '#75bde0', // M5: ITS Biru Muda Lambang
  '#127bbe', // M6: ITS Biru Tua Lambang
  '#52d1c6', // M7: Tosca Muda Kontras
  '#f6ec1d'  // M8: ITS Kuning Lambang
];
class SFLARenderer {
  constructor() {
    this.contourCache = new ContourMapCache();
  }

  render(canvas, state, objective, options = {}) {
    if (!canvas || !state) return;
    const { ctx, width, height } = syncCanvasSize(canvas);
    const alpha = options.alpha ?? 1;
    const showOptimum = options.showOptimum ?? true;
    const showTrails = options.showTrails ?? true;

    const vp = this.contourCache.renderBackground(ctx, width, height, objective, 'pond', {
      showOptimum
    });
    if (!vp) return;

    // 1. Daun teratai geometris di beberapa titik referensi kolam
    this.drawLilyPads(ctx, vp, objective);

    // 2. Jejak lintasan lompatan katak
    if (showTrails) {
      for (const frog of state.frogs) {
        if (!frog.trail || frog.trail.length < 2) continue;
        const mColor =
          frog.memeplex >= 0
            ? MEMEPLEX_COLORS[frog.memeplex % MEMEPLEX_COLORS.length]
            : 'rgba(184, 197, 217, 0.45)';
        ctx.save();
        ctx.beginPath();
        frog.trail.forEach((pt, idx) => {
          const s = vp.worldToScreen(pt.x, pt.y);
          if (idx === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.strokeStyle = mColor;
        ctx.globalAlpha = 0.24;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Vektor lompatan & riak air pada tahap LOCAL_JUMP
    if (state.phase === 'LOCAL_JUMP' && state.jumps.length > 0) {
      for (const jmp of state.jumps) {
        this.drawJumpEffect(ctx, vp, jmp, alpha);
      }
    }

    // 4. Lingkaran konsolidasi global saat SHUFFLE
    if (state.phase === 'SHUFFLE' && state.bestFrog) {
      const center = vp.worldToScreen(state.bestFrog.x, state.bestFrog.y);
      ctx.save();
      ctx.strokeStyle = 'rgba(18, 176, 162, 0.38)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 46 + (1 - alpha) * 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Urutkan penggambaran katak agar solusi terbaik berada paling atas
    const frogsToDraw = [...state.frogs].sort((a, b) => b.fitness - a.fitness);
    for (const frog of frogsToDraw) {
      const ix = frog.prevX + (frog.x - frog.prevX) * alpha;
      const iy = frog.prevY + (frog.y - frog.prevY) * alpha;
      const pos = vp.worldToScreen(ix, iy);
      this.drawFrog(ctx, pos.x, pos.y, frog, objective, state.phase, options.compact);
    }
  }

  drawLilyPads(ctx, vp, objective) {
    const pads = [
      { x: -3.2, y: 2.8, r: 17, rot: 0.4 },
      { x: 3.1, y: 2.6, r: 15, rot: 2.1 },
      { x: -2.9, y: -3.0, r: 16, rot: -1.1 },
      { x: 2.8, y: -2.7, r: 18, rot: 1.3 },
      { x: 0, y: 0, r: 22, rot: 0.8 }
    ];
    ctx.save();
    for (const p of pads) {
      if (p.x < objective.min || p.x > objective.max) continue;
      const s = vp.worldToScreen(p.x, p.y);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, p.r, p.rot + 0.22, p.rot + Math.PI * 2 - 0.22);
      ctx.closePath();
      ctx.fillStyle = 'rgba(18, 176, 162, 0.12)';
      ctx.strokeStyle = 'rgba(18, 176, 162, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawJumpEffect(ctx, vp, jmp, alpha) {
    const from = vp.worldToScreen(jmp.fromX, jmp.fromY);
    const to = vp.worldToScreen(jmp.toX, jmp.toY);
    const curX = from.x + (to.x - from.x) * alpha;
    const curY = from.y + (to.y - from.y) * alpha;

    ctx.save();

    if (jmp.triedXbFailed && typeof jmp.failedXbX === 'number') {
      const fxb = vp.worldToScreen(jmp.failedXbX, jmp.failedXbY);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(fxb.x, fxb.y);
      ctx.strokeStyle = 'rgba(224, 90, 95, 0.38)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    let strokeColor = '#12b0a2';
    let badgeText = 'Ke Xb';
    if (jmp.type === 'XG_SUCCESS') {
      strokeColor = '#fdbb16';
      badgeText = 'Ke Xg';
    } else if (jmp.type === 'RANDOM_RESET') {
      strokeColor = '#e05a5f';
      badgeText = 'Reset Acak';
    }

    const midX = (from.x + curX) / 2;
    const midY = (from.y + curY) / 2 - 20 * Math.sin(alpha * Math.PI * 0.5 + 0.3);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, midY, curX, curY);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    if (jmp.type === 'RANDOM_RESET') ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const angle = Math.atan2(curY - midY, curX - midX);
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(curX - 8.5 * Math.cos(angle - 0.45), curY - 8.5 * Math.sin(angle - 0.45));
    ctx.lineTo(curX - 8.5 * Math.cos(angle + 0.45), curY - 8.5 * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fillStyle = strokeColor;
    ctx.fill();

    if (alpha > 0.35) {
      const rippleProgress = (alpha - 0.35) / 0.65;
      const r1 = 8 + rippleProgress * 17;
      ctx.beginPath();
      ctx.arc(to.x, to.y, r1, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = Math.max(0, 0.72 * (1 - rippleProgress));
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = strokeColor;
    ctx.fillText(badgeText, to.x + 10, to.y - 10);

    ctx.restore();
  }

  drawFrog(ctx, x, y, frog, objective, phase, compact = false) {
    const isGlobalBest = frog.role === 'global_best';
    const isMemeplexBest = frog.role === 'memeplex_best';
    const normFit = Math.min(1, Math.max(0, frog.fitness / (objective.maxVisualValue || 50)));

    const baseR = compact ? 6.5 : 8.2;
    const radius = isGlobalBest ? baseR + 3.4 : baseR + (1 - normFit) * 2.4;

    const fill =
      frog.memeplex >= 0
        ? MEMEPLEX_COLORS[frog.memeplex % MEMEPLEX_COLORS.length]
        : '#8a99b2';

    ctx.save();
    ctx.translate(x, y);

    if (isGlobalBest || isMemeplexBest) {
      const glowR = isGlobalBest ? radius * 2.5 : radius * 1.8;
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, glowR);
      g.addColorStop(0, isGlobalBest ? 'rgba(253, 187, 22, 0.68)' : 'rgba(18, 176, 162, 0.42)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = isGlobalBest ? '#fdbb16' : fill;
    ctx.strokeStyle = isGlobalBest ? '#fff3c4' : '#03132b';
    ctx.lineWidth = isGlobalBest ? 2.4 : 1.9;
    ctx.fill();
    ctx.stroke();

    const eyeOffset = radius * 0.56;
    const eyeR = Math.max(2, radius * 0.27);
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(dir * eyeOffset, -radius * 0.68, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#ecf3ff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dir * eyeOffset, -radius * 0.68, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#03132b';
      ctx.fill();
    }

    if (isGlobalBest) {
      ctx.beginPath();
      ctx.moveTo(-7, -radius - 4);
      ctx.lineTo(-5, -radius - 11);
      ctx.lineTo(0, -radius - 7);
      ctx.lineTo(5, -radius - 11);
      ctx.lineTo(7, -radius - 4);
      ctx.closePath();
      ctx.fillStyle = '#fdbb16';
      ctx.strokeStyle = '#03132b';
      ctx.lineWidth = 1.4;
      ctx.fill();
      ctx.stroke();
    }

    if (!compact) {
      ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      if (frog.memeplex >= 0) {
        ctx.fillStyle = '#03132b';
        ctx.fillText(`M${frog.memeplex + 1}`, 0, 3.4);
      } else if (phase === 'SORT' && frog.rank >= 0 && frog.rank < 9) {
        ctx.fillStyle = '#03132b';
        ctx.fillText(`${frog.rank + 1}`, 0, 3.4);
      }
    }

    ctx.restore();
  }
}

  exports.SFLARenderer = SFLARenderer;
  exports.MEMEPLEX_COLORS = MEMEPLEX_COLORS;
  },
  "render/chart.js": function(exports, __require) {
/**
 * Grafik Konvergensi Fitness Terbaik per Iterasi
 * Mengikuti aturan visual flat data-terminal ITS: latar datar #000E25, 4 garis grid tipis #243F81,
 * segmen garis lurus tegas, dan warna seri resmi ITS (#12B0A2 SFLA, #26AEE4 WCA, #FDBB16 Laut/Optimum).
 */
const {  syncCanvasSize  } = __require("render/contourRenderer.js");
function renderConvergenceChart(canvas, seriesList, options = {}) {
  if (!canvas) return;
  const { ctx, width, height } = syncCanvasSize(canvas);
  ctx.clearRect(0, 0, width, height);

  const padLeft = 58;
  const padRight = 18;
  const padTop = 30;
  const padBottom = 30;
  const plotW = Math.max(20, width - padLeft - padRight);
  const plotH = Math.max(20, height - padTop - padBottom);

  // Latar belakang datar kontainer grafik (surface-container-lowest ITS)
  ctx.fillStyle = '#041126';
  ctx.fillRect(0, 0, width, height);

  // Judul grafik di kiri atas
  ctx.font = '700 12.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#d6e3ff';
  ctx.textAlign = 'left';
  ctx.fillText(options.title || 'Kurva Konvergensi Fitness', 14, 19);

  let maxIter = Math.max(10, options.maxIterations || 20);
  let maxVal = 0;
  let minVal = Infinity;

  for (const s of seriesList) {
    for (const pt of s.data) {
      if (pt.iteration > maxIter) maxIter = pt.iteration;
      if (pt.bestFitness > maxVal) maxVal = pt.bestFitness;
      if (pt.bestFitness < minVal) minVal = pt.bestFitness;
    }
  }

  if (!Number.isFinite(minVal)) {
    minVal = 0;
    maxVal = 10;
  }
  const yFloor = options.zeroBaseline !== false ? 0 : Math.max(0, minVal * 0.9);
  const yCeil = maxVal <= yFloor + 1e-6 ? yFloor + 1 : maxVal * 1.08;

  // Empat garis grid horizontal (Biru Cover ITS #243F81 dengan opasitas tenang)
  ctx.strokeStyle = 'rgba(36, 63, 129, 0.48)';
  ctx.lineWidth = 1;
  ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#8a99b2';
  ctx.textAlign = 'right';

  for (let i = 0; i <= 3; i++) {
    const ratio = i / 3;
    const py = padTop + plotH - ratio * plotH;
    const val = yFloor + ratio * (yCeil - yFloor);

    ctx.beginPath();
    ctx.moveTo(padLeft, py);
    ctx.lineTo(padLeft + plotW, py);
    ctx.stroke();

    const formatted =
      val >= 10 ? val.toFixed(1) : val >= 0.1 ? val.toFixed(2) : val === 0 ? '0' : val.toExponential(1);
    ctx.fillText(formatted, padLeft - 7, py + 3.5);
  }

  // Label sumbu X
  ctx.textAlign = 'center';
  const xTicks = 4;
  for (let i = 0; i <= xTicks; i++) {
    const iterVal = Math.round((i / xTicks) * maxIter);
    const px = padLeft + (iterVal / maxIter) * plotW;
    ctx.fillText(`${iterVal}`, px, padTop + plotH + 17);
  }
  ctx.fillStyle = '#8a99b2';
  ctx.fillText(options.xLabel || 'Iterasi', padLeft + plotW / 2, height - 3);

  // Gambar seri data
  seriesList.forEach((s, sIdx) => {
    if (!s.data || s.data.length === 0) return;
    const color = s.color || '#12b0a2';

    const points = s.data.map((pt) => {
      const px = padLeft + (pt.iteration / maxIter) * plotW;
      const normY = (pt.bestFitness - yFloor) / Math.max(1e-9, yCeil - yFloor);
      const py = padTop + plotH - Math.max(0, Math.min(1, normY)) * plotH;
      return { px, py, val: pt.bestFitness };
    });

    // Isian datar 14% opasitas untuk grafik seri tunggal (sesuai app-screens.md)
    if (seriesList.length === 1 && points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].px, padTop + plotH);
      points.forEach((p) => ctx.lineTo(p.px, p.py));
      ctx.lineTo(points[points.length - 1].px, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = s.fillFlat || 'rgba(18, 176, 162, 0.14)';
      ctx.fill();
    }

    // Garis lurus antar titik iterasi
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Titik nilai terkini di ujung kurva
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.px, last.py, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#041126';
    ctx.lineWidth = 1.6;
    ctx.fill();
    ctx.stroke();

    // Legenda kanan atas untuk perbandingan multi-seri
    if (seriesList.length > 1) {
      const slotW = 118;
      const rightEdge = width - padRight - (seriesList.length - 1 - sIdx) * slotW;
      const disp = last.val < 0.001 && last.val > 0 ? last.val.toExponential(1) : last.val.toFixed(3);
      const labelStr = `${s.label}: ${disp}`;

      ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(labelStr, rightEdge, 19);

      const textW = ctx.measureText(labelStr).width;
      ctx.beginPath();
      ctx.arc(rightEdge - textW - 7, 15, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  });

  ctx.textAlign = 'left';
}

  exports.renderConvergenceChart = renderConvergenceChart;
  },
  "tabs/tabWca.js": function(exports, __require) {
/**
 * Tab 3: Laboratorium Simulasi Water Cycle Algorithm (WCA)
 * Menampilkan simulasi live 2D Siklus Hidrologi (Aliran, Sungai, Laut, lingkaran penguapan dmax,
 * pertukaran peran, dan hujan baru) beserta meja kerja interaktif 4 mekanisme internal WCA.
 */
const {  getObjective  } = __require("core/objectives.js");
const {  SimulationRunner  } = __require("core/engine.js");
const {  WCAEngine  } = __require("algorithms/wca.js");
const {  WCARenderer  } = __require("render/wcaRenderer.js");
const {  renderConvergenceChart  } = __require("render/chart.js");
const {  syncCanvasSize  } = __require("render/contourRenderer.js");
const tabWca = {
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


  exports.tabWca = tabWca;
  },
  "algorithms/wca.js": function(exports, __require) {
/**
 * Water Cycle Algorithm (WCA) — Mesin Status Murni (Tanpa DOM)
 * Referensi: Eskandar, H., Sadollah, A., Bahreininejad, A., & Hamdi, M. (2012).
 *
 * Urutan event tahap (Acceptance Criterion #3):
 *   INIT -> HIERARCHY -> FLOW -> ROLE_SWAP -> EVAPORATION -> RAIN -> FLOW -> ... -> DONE
 */
const {  createRng  } = __require("core/rng.js");
const {  clampCoord  } = __require("core/objectives.js");
class WCAEngine {
  /**
   * @param {Object} config
   * @param {Object} config.objective - Objek fungsi objektif { evaluate(x,y), min, max }
   * @param {number} [config.populationSize=24] - Jumlah tetesan populasi total (Npop)
   * @param {number} [config.nsr=4] - Jumlah Sungai + 1 Laut (Nsr)
   * @param {number} [config.dmax=0.45] - Batas jarak penguapan awal (dmax0)
   * @param {number} [config.flowConstant=2.0] - Konstanta aliran C (sekitar 2)
   * @param {number} [config.maxIterations=40] - Maksimum siklus iterasi
   * @param {number|string} [config.seed=42] - Seed PRNG
   * @param {Array<{x:number, y:number}>} [config.initialPositions] - Opsional posisi awal bersama
   */
  constructor(config) {
    this.configure(config);
  }

  configure(config = {}) {
    this.objective = config.objective;
    this.populationSize = Math.max(8, Math.min(100, Math.round(config.populationSize ?? 24)));
    this.nsr = Math.max(2, Math.min(Math.floor(this.populationSize / 2), Math.round(config.nsr ?? 4)));
    this.dmax0 = Math.max(0.02, Number(config.dmax ?? 0.45));
    this.flowConstant = Math.max(1.0, Math.min(3.0, Number(config.flowConstant ?? 2.0)));
    this.maxIterations = Math.max(5, Math.round(config.maxIterations ?? 40));
    this.seed = config.seed ?? 42;
    this.initialPositions = config.initialPositions || null;
    this.reset();
  }

  reset() {
    this.rng = createRng(this.seed);
    const { min, max } = this.objective;

    this.drops = Array.from({ length: this.populationSize }, (_, i) => {
      const preset = this.initialPositions && this.initialPositions[i];
      const x = preset ? clampCoord(preset.x, min, max) : this.rng.range(min, max);
      const y = preset ? clampCoord(preset.y, min, max) : this.rng.range(min, max);
      const fitness = this.objective.evaluate(x, y);
      return {
        id: i + 1,
        x,
        y,
        prevX: x,
        prevY: y,
        fitness,
        role: 'stream', // 'sea' | 'river' | 'stream'
        riverIndex: -1, // 0 untuk Laut, 1..Nsr-1 untuk Sungai
        parentId: null, // ID sungai atau laut tujuan aliran
        evaporating: false,
        evapMode: null, // 'global' | 'local'
        justRained: false,
        trail: [{ x, y }]
      };
    });

    this.iteration = 0;
    this.dmax = this.dmax0;
    this.swaps = [];
    this.evaporatedIds = [];
    this.rainedDrops = [];
    this.streamAllocation = [];

    this.bestSea = this.computeBestSnapshot();
    this.history = [
      {
        iteration: 0,
        bestFitness: this.bestSea.fitness,
        meanFitness: this.computeMeanFitness()
      }
    ];

    this.phase = 'INIT';
    this.phaseLabel = 'Inisialisasi Tetesan';
    this.phaseDetail = `Menyebar ${this.populationSize} tetesan hujan awal di bentang pegunungan.`;
    return this.getState();
  }

  computeBestSnapshot() {
    let best = this.drops[0];
    for (const d of this.drops) {
      if (d.fitness < best.fitness) best = d;
    }
    if (this.bestSea && this.bestSea.fitness < best.fitness) {
      return { ...this.bestSea };
    }
    return { id: best.id, x: best.x, y: best.y, fitness: best.fitness };
  }

  computeMeanFitness() {
    let sum = 0;
    for (const d of this.drops) sum += d.fitness;
    return sum / Math.max(1, this.drops.length);
  }

  syncPreviousPositions() {
    for (const d of this.drops) {
      d.prevX = d.x;
      d.prevY = d.y;
      d.justRained = false;
    }
  }

  findDropById(id) {
    return this.drops.find((d) => d.id === id) || null;
  }

  getSeaDrop() {
    return this.drops.find((d) => d.role === 'sea') || this.drops[0];
  }

  /**
   * Pembentukan hierarki Laut, Sungai, dan pembagian Aliran proporsional (Eskandar et al., 2012):
   *   C_n = f(X_n) - f(X_{Nsr + 1})   untuk n = 0 .. Nsr-1
   *   NS_n = round( |C_n / sum(C_k)| * N_stream )
   * Laut (fitness terkecil) memiliki |C_0| terbesar sehingga menerima anak aliran terbanyak.
   */
  assignHierarchy() {
    const sorted = [...this.drops].sort((a, b) => a.fitness - b.fitness);
    const nStreams = this.populationSize - this.nsr;
    const leaders = sorted.slice(0, this.nsr);
    const streams = sorted.slice(this.nsr);

    leaders.forEach((ld, idx) => {
      ld.role = idx === 0 ? 'sea' : 'river';
      ld.riverIndex = idx;
      ld.parentId = idx === 0 ? null : leaders[0].id;
      ld.evaporating = false;
    });

    // Hitung intensitas aliran proporsional terhadap selisih fitness ke aliran terbaik pertama
    const refFitness = streams.length > 0 ? streams[0].fitness + 1e-9 : leaders[leaders.length - 1].fitness + 1;
    const magnitudes = leaders.map((ld) => Math.abs(ld.fitness - refFitness) + 1e-9);
    const totalMag = magnitudes.reduce((a, b) => a + b, 0);

    const counts = magnitudes.map((m) => Math.round((m / totalMag) * nStreams));

    // Sesuaikan selisih pembulatan agar total tepat sama dengan nStreams
    let sumCounts = counts.reduce((a, b) => a + b, 0);
    let adjustIdx = 0;
    while (sumCounts < nStreams) {
      counts[adjustIdx % this.nsr] += 1;
      sumCounts += 1;
      adjustIdx += 1;
    }
    while (sumCounts > nStreams) {
      const idx = (this.nsr - 1 - (adjustIdx % this.nsr) + this.nsr) % this.nsr;
      if (counts[idx] > 0) {
        counts[idx] -= 1;
        sumCounts -= 1;
      }
      adjustIdx += 1;
    }

    this.streamAllocation = counts;

    // Bagikan aliran ke Laut & Sungai sesuai kuota NS_n
    let cursor = 0;
    for (let ldrIdx = 0; ldrIdx < this.nsr; ldrIdx++) {
      const quota = counts[ldrIdx];
      for (let q = 0; q < quota && cursor < streams.length; q++) {
        const st = streams[cursor++];
        st.role = 'stream';
        st.riverIndex = ldrIdx;
        st.parentId = leaders[ldrIdx].id;
        st.evaporating = false;
      }
    }

    const sea = leaders[0];
    if (!this.bestSea || sea.fitness <= this.bestSea.fitness) {
      this.bestSea = { id: sea.id, x: sea.x, y: sea.y, fitness: sea.fitness };
    }
  }

  /**
   * Menukar koordinat & atribut posisi antara dua agen saat bawahan menemukan titik lebih rendah,
   * sambil mempertahankan struktur graf induk-anak (parentId) tetap utuh dan bersih.
   */
  swapPositionsAndFitness(subordinate, superior) {
    const tmpX = superior.x;
    const tmpY = superior.y;
    const tmpPrevX = superior.prevX;
    const tmpPrevY = superior.prevY;
    const tmpFit = superior.fitness;
    const tmpTrail = superior.trail;

    superior.x = subordinate.x;
    superior.y = subordinate.y;
    superior.prevX = subordinate.prevX;
    superior.prevY = subordinate.prevY;
    superior.fitness = subordinate.fitness;
    superior.trail = subordinate.trail;

    subordinate.x = tmpX;
    subordinate.y = tmpY;
    subordinate.prevX = tmpPrevX;
    subordinate.prevY = tmpPrevY;
    subordinate.fitness = tmpFit;
    subordinate.trail = tmpTrail;
  }

  /**
   * Menjalankan tepat 1 event tahap WCA.
   */
  step() {
    if (this.phase === 'DONE') {
      return this.getState();
    }

    this.syncPreviousPositions();

    // Tahap 1 -> 2: Tetapkan hierarki Laut, Sungai, dan Aliran
    if (this.phase === 'INIT') {
      this.assignHierarchy();
      this.phase = 'HIERARCHY';
      this.phaseLabel = 'Hierarki Laut & Sungai';
      this.phaseDetail = `1 Laut (${this.streamAllocation[0]} aliran) & ${this.nsr - 1} Sungai dibentuk proporsional intensitas.`;
      return this.getState();
    }

    // Tahap 3 & 4: Aliran mengalir ke Sungai/Laut, Sungai mengalir ke Laut
    if (this.phase === 'HIERARCHY' || this.phase === 'RAIN') {
      this.swaps = [];
      this.evaporatedIds = [];
      this.rainedDrops = [];

      const { min, max } = this.objective;
      const sea = this.getSeaDrop();
      // Salin posisi induk pada awal langkah agar gerakan serentak sinkron
      const snapshotPos = new Map(this.drops.map((d) => [d.id, { x: d.x, y: d.y }]));

      for (const d of this.drops) {
        if (d.role === 'stream') {
          const parentPos = snapshotPos.get(d.parentId) || { x: sea.x, y: sea.y };
          const rx = this.rng.next();
          const ry = this.rng.next();
          d.x = clampCoord(d.x + rx * this.flowConstant * (parentPos.x - d.x), min, max);
          d.y = clampCoord(d.y + ry * this.flowConstant * (parentPos.y - d.y), min, max);
          d.fitness = this.objective.evaluate(d.x, d.y);
          d.trail.push({ x: d.x, y: d.y });
          if (d.trail.length > 8) d.trail.shift();
        } else if (d.role === 'river') {
          const seaPos = snapshotPos.get(sea.id);
          const rx = this.rng.next();
          const ry = this.rng.next();
          d.x = clampCoord(d.x + rx * this.flowConstant * (seaPos.x - d.x), min, max);
          d.y = clampCoord(d.y + ry * this.flowConstant * (seaPos.y - d.y), min, max);
          d.fitness = this.objective.evaluate(d.x, d.y);
          d.trail.push({ x: d.x, y: d.y });
          if (d.trail.length > 8) d.trail.shift();
        }
      }

      this.phase = 'FLOW';
      this.phaseLabel = 'Aliran Mengalir';
      this.phaseDetail = `Aliran bergerak menuju Sungai dan Sungai bermuara ke Laut (C = ${this.flowConstant.toFixed(1)}).`;
      return this.getState();
    }

    // Tahap 5: Pertukaran Peran (Role Swap) bila aliran/sungai lebih rendah dari atasannya
    if (this.phase === 'FLOW') {
      this.swaps = [];
      const sea = this.getSeaDrop();

      // 5a. Cek aliran terhadap induknya (sungai atau laut)
      const streams = this.drops.filter((d) => d.role === 'stream');
      for (const st of streams) {
        const parent = this.findDropById(st.parentId);
        if (parent && st.fitness < parent.fitness) {
          this.swaps.push({
            fromX: st.x,
            fromY: st.y,
            toX: parent.x,
            toY: parent.y,
            kind: parent.role === 'sea' ? 'STREAM_TO_SEA' : 'STREAM_TO_RIVER'
          });
          this.swapPositionsAndFitness(st, parent);
        }
      }

      // 5b. Cek sungai terhadap laut
      const rivers = this.drops.filter((d) => d.role === 'river');
      for (const rv of rivers) {
        if (rv.fitness < sea.fitness) {
          this.swaps.push({
            fromX: rv.x,
            fromY: rv.y,
            toX: sea.x,
            toY: sea.y,
            kind: 'RIVER_TO_SEA'
          });
          this.swapPositionsAndFitness(rv, sea);
        }
      }

      if (sea.fitness <= this.bestSea.fitness) {
        this.bestSea = { id: sea.id, x: sea.x, y: sea.y, fitness: sea.fitness };
      }

      this.phase = 'ROLE_SWAP';
      this.phaseLabel = 'Pertukaran Peran';
      this.phaseDetail =
        this.swaps.length > 0
          ? `${this.swaps.length} aliran/sungai menemukan titik lebih rendah dan bertukar peran!`
          : 'Tidak ada yang melampaui atasannya pada langkah ini; Laut tetap memimpin.';
      return this.getState();
    }

    // Tahap 6: Cek Kondisi Penguapan (jarak ke Laut < dmax)
    if (this.phase === 'ROLE_SWAP') {
      this.evaporatedIds = [];
      const sea = this.getSeaDrop();

      for (const d of this.drops) {
        d.evaporating = false;
        d.evapMode = null;
        if (d.role === 'sea') continue;

        const distToSea = Math.hypot(d.x - sea.x, d.y - sea.y);
        if (d.role === 'river') {
          if (distToSea < this.dmax || this.rng.next() < 0.08) {
            d.evaporating = true;
            d.evapMode = 'global';
            this.evaporatedIds.push(d.id);
          }
        } else if (d.role === 'stream' && d.parentId === sea.id) {
          // Aliran yang langsung bermuara ke Laut: menguap & hujan lokal di sekitar Laut (Eskandar et al., 2012)
          if (distToSea < this.dmax) {
            d.evaporating = true;
            d.evapMode = 'local';
            this.evaporatedIds.push(d.id);
          }
        }
      }

      this.phase = 'EVAPORATION';
      this.phaseLabel = 'Penguapan Air';
      this.phaseDetail =
        this.evaporatedIds.length > 0
          ? `${this.evaporatedIds.length} sungai/aliran berjarak < dmax (${this.dmax.toFixed(3)}) menguap ke atmosfer.`
          : `Belum ada sungai dalam radius dmax (${this.dmax.toFixed(3)}) dari Laut.`;
      return this.getState();
    }

    // Tahap 7 & 8: Proses Hujan & Penyusutan dmax
    if (this.phase === 'EVAPORATION') {
      const { min, max } = this.objective;
      const span = max - min;
      const sea = this.getSeaDrop();
      const mu = 0.1; // Parameter standar variansi hujan lokal sekitar Laut (Eskandar et al., 2012)
      this.rainedDrops = [];

      for (const d of this.drops) {
        if (!d.evaporating) continue;

        if (d.evapMode === 'local') {
          // Eksploitasi sekitar Laut: X_baru = X_laut + sqrt(mu) * N(0, 1)
          const stdStep = Math.sqrt(mu) * (span * 0.08);
          d.x = clampCoord(sea.x + this.rng.gaussian(0, stdStep), min, max);
          d.y = clampCoord(sea.y + this.rng.gaussian(0, stdStep), min, max);
        } else {
          // Eksplorasi global di seluruh domain
          d.x = this.rng.range(min, max);
          d.y = this.rng.range(min, max);
        }

        d.prevX = d.x;
        d.prevY = d.y;
        d.fitness = this.objective.evaluate(d.x, d.y);
        d.evaporating = false;
        d.justRained = true;
        d.trail = [{ x: d.x, y: d.y }];
        this.rainedDrops.push({ id: d.id, x: d.x, y: d.y, mode: d.evapMode });

        // Jaga sifat elitisme Laut bila tetesan hujan baru jatuh lebih rendah dari Laut
        if (d.fitness < sea.fitness) {
          this.swapPositionsAndFitness(d, sea);
        }
      }

      if (sea.fitness <= this.bestSea.fitness) {
        this.bestSea = { id: sea.id, x: sea.x, y: sea.y, fitness: sea.fitness };
      }

      // Update dmax: dmax(t+1) = dmax(t) - dmax(0) / iterasi_maks (PRD Bagian 8.3 poin 8)
      this.dmax = Math.max(1e-5, this.dmax - this.dmax0 / this.maxIterations);
      this.iteration += 1;

      this.history.push({
        iteration: this.iteration,
        bestFitness: this.bestSea.fitness,
        meanFitness: this.computeMeanFitness()
      });

      if (this.iteration >= this.maxIterations) {
        this.phase = 'DONE';
        this.phaseLabel = 'Selesai (Terminasi)';
        this.phaseDetail = `Mencapai ${this.iteration} iterasi. Titik Laut terbaik f = ${this.bestSea.fitness.toExponential(3)}.`;
      } else {
        this.phase = 'RAIN';
        this.phaseLabel = 'Hujan & Update dmax';
        this.phaseDetail =
          this.rainedDrops.length > 0
            ? `${this.rainedDrops.length} tetesan hujan baru turun; dmax menyusut menjadi ${this.dmax.toFixed(3)}.`
            : `Siklus #${this.iteration} selesai; radius dmax menyusut menjadi ${this.dmax.toFixed(3)}.`;
      }

      return this.getState();
    }

    return this.getState();
  }

  /**
   * Menjalankan langkah-langkah hingga menyelesaikan tepat 1 siklus iterasi penuh (+1 iterasi).
   */
  stepFullIteration() {
    if (this.phase === 'DONE') return this.getState();
    const targetIter = this.iteration + 1;
    let guard = 0;
    while (this.iteration < targetIter && this.phase !== 'DONE' && guard < 20) {
      this.step();
      guard += 1;
    }
    return this.getState();
  }

  getState() {
    return {
      phase: this.phase,
      phaseLabel: this.phaseLabel,
      phaseDetail: this.phaseDetail,
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      dmax: this.dmax,
      dmax0: this.dmax0,
      nsr: this.nsr,
      flowConstant: this.flowConstant,
      drops: this.drops,
      swaps: this.swaps,
      evaporatedIds: this.evaporatedIds,
      rainedDrops: this.rainedDrops,
      streamAllocation: this.streamAllocation,
      bestSea: this.bestSea,
      history: this.history
    };
  }
}


  exports.WCAEngine = WCAEngine;
  },
  "render/wcaRenderer.js": function(exports, __require) {
/**
 * Renderer Visual WCA (Metafora Siklus Air Hidrologi)
 * Menggunakan Palet Resmi ITS: Biru Tua Lambang (#127BBE), FTK Summer Sky (#26AEE4),
 * Biru Muda Lambang (#75BDE0), dan Kuning Tua ITS (#FDBB16) untuk titik Laut terbaik.
 */
const {  ContourMapCache, syncCanvasSize  } = __require("render/contourRenderer.js");
class WCARenderer {
  constructor() {
    this.contourCache = new ContourMapCache();
  }

  render(canvas, state, objective, options = {}) {
    if (!canvas || !state) return;
    const { ctx, width, height } = syncCanvasSize(canvas);
    const alpha = options.alpha ?? 1;
    const timestamp = options.timestamp ?? 0;
    const showOptimum = options.showOptimum ?? true;
    const showTrails = options.showTrails ?? true;

    const vp = this.contourCache.renderBackground(ctx, width, height, objective, 'water', {
      showOptimum
    });
    if (!vp) return;

    const dropScreenMap = new Map();
    for (const d of state.drops) {
      const ix = d.prevX + (d.x - d.prevX) * alpha;
      const iy = d.prevY + (d.y - d.prevY) * alpha;
      dropScreenMap.set(d.id, vp.worldToScreen(ix, iy));
    }

    const seaDrop = state.drops.find((d) => d.role === 'sea');

    // 1. Lingkaran radius penguapan dmax di sekitar Laut
    if (seaDrop && state.phase !== 'INIT') {
      const seaPos = dropScreenMap.get(seaDrop.id);
      const dmaxPx = Math.max(8, vp.worldDistToPx(state.dmax));
      ctx.save();
      ctx.beginPath();
      ctx.arc(seaPos.x, seaPos.y, dmaxPx, 0, Math.PI * 2);
      ctx.fillStyle =
        state.phase === 'EVAPORATION'
          ? 'rgba(38, 174, 228, 0.18)'
          : 'rgba(117, 189, 224, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(117, 189, 224, 0.72)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!options.compact && dmaxPx > 22) {
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#cee5ff';
        ctx.fillText('dmax', seaPos.x + dmaxPx + 6, seaPos.y + 4);
      }
      ctx.restore();
    }

    // 2. Jaringan aliran hidrologi (Stream -> River/Sea, River -> Sea)
    if (state.phase !== 'INIT' && showTrails) {
      ctx.save();
      const dashOffset = -(timestamp * 0.03) % 24;
      for (const d of state.drops) {
        if (!d.parentId) continue;
        const from = dropScreenMap.get(d.id);
        const to = dropScreenMap.get(d.parentId);
        if (!from || !to) continue;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) continue;

        const nx = -dy * 0.14;
        const ny = dx * 0.14;
        const cx = (from.x + to.x) / 2 + nx;
        const cy = (from.y + to.y) / 2 + ny;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(cx, cy, to.x, to.y);

        if (d.role === 'river') {
          ctx.strokeStyle = 'rgba(38, 174, 228, 0.58)';
          ctx.lineWidth = 2.3;
          ctx.setLineDash([8, 5]);
          ctx.lineDashOffset = dashOffset;
        } else {
          ctx.strokeStyle = 'rgba(117, 189, 224, 0.28)';
          ctx.lineWidth = 1.25;
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. Kilatan pertukaran peran (ROLE_SWAP)
    if (state.phase === 'ROLE_SWAP' && state.swaps.length > 0) {
      for (const sw of state.swaps) {
        this.drawSwapFlash(ctx, vp, sw, alpha);
      }
    }

    // 4. Urutan render: Stream -> River -> Sea
    const orderRank = { stream: 0, river: 1, sea: 2 };
    const orderedDrops = [...state.drops].sort(
      (a, b) => (orderRank[a.role] ?? 0) - (orderRank[b.role] ?? 0)
    );

    for (const d of orderedDrops) {
      const pos = dropScreenMap.get(d.id);
      if (!pos) continue;

      if (d.role === 'sea') {
        this.drawSea(ctx, pos.x, pos.y, options.compact);
      } else if (d.role === 'river') {
        this.drawRiver(ctx, pos.x, pos.y, d.riverIndex, options.compact);
      } else {
        const parentPos = d.parentId ? dropScreenMap.get(d.parentId) : null;
        this.drawStream(ctx, pos.x, pos.y, parentPos);
      }

      if (state.phase === 'EVAPORATION' && d.evaporating) {
        this.drawVaporEffect(ctx, pos.x, pos.y, alpha);
      }

      if (state.phase === 'RAIN' && d.justRained) {
        this.drawRainEffect(ctx, pos.x, pos.y, alpha);
      }
    }
  }

  drawStream(ctx, x, y, parentPos) {
    ctx.save();
    ctx.translate(x, y);
    let angle = -Math.PI / 2;
    if (parentPos) {
      angle = Math.atan2(parentPos.y - y, parentPos.x - x);
    }
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(-2, 5.8, -6, 0);
    ctx.quadraticCurveTo(-2, -5.8, 8, 0);
    ctx.closePath();
    ctx.fillStyle = '#cee5ff';
    ctx.strokeStyle = '#03132b';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawRiver(ctx, x, y, riverIdx, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 17);
    glow.addColorStop(0, 'rgba(38, 174, 228, 0.55)');
    glow.addColorStop(1, 'rgba(38, 174, 228, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();

    const r = compact ? 8.5 : 10.5;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fillStyle = '#26aee4';
    ctx.strokeStyle = '#ecf3ff';
    ctx.lineWidth = 1.9;
    ctx.fill();
    ctx.stroke();

    if (!compact) {
      ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#03132b';
      ctx.textAlign = 'center';
      ctx.fillText(`S${riverIdx}`, 0, 3.4);
    }
    ctx.restore();
  }

  drawSea(ctx, x, y, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 26);
    glow.addColorStop(0, 'rgba(18, 123, 190, 0.82)');
    glow.addColorStop(0.55, 'rgba(253, 187, 22, 0.34)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    const r = compact ? 11 : 13.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#127bbe';
    ctx.strokeStyle = '#fdbb16';
    ctx.lineWidth = 2.8;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.quadraticCurveTo(-3, -3, 0, 1);
    ctx.quadraticCurveTo(3, 5, 6, 1);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.1;
    ctx.stroke();

    if (!compact) {
      ctx.font = '800 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fdbb16';
      ctx.textAlign = 'center';
      ctx.fillText('LAUT', 0, -r - 6);
    }
    ctx.restore();
  }

  drawSwapFlash(ctx, vp, sw, alpha) {
    const a = vp.worldToScreen(sw.fromX, sw.fromY);
    const b = vp.worldToScreen(sw.toX, sw.toY);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = '#fdbb16';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    const r = 10 + (1 - alpha) * 15;
    ctx.beginPath();
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#fdbb16';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#fdbb16';
    ctx.fillText('TUKAR PERAN', a.x + 12, a.y - 10);
    ctx.restore();
  }

  drawVaporEffect(ctx, x, y, alpha) {
    ctx.save();
    const lift = alpha * 32;
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 8;
      const oy = -lift - i * 7;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, 4.8 + i * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(214, 227, 255, ${Math.max(0.16, 0.76 - alpha * 0.5)})`;
      ctx.fill();
    }
    ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#d6e3ff';
    ctx.fillText('UAP', x + 10, y - lift - 8);
    ctx.restore();
  }

  drawRainEffect(ctx, x, y, alpha) {
    ctx.save();
    const dropY = y - (1 - alpha) * 42;

    ctx.strokeStyle = '#75bde0';
    ctx.lineWidth = 2;
    for (const dx of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(x + dx + 4, dropY - 18);
      ctx.lineTo(x + dx, dropY - 4);
      ctx.stroke();
    }

    if (alpha > 0.3) {
      ctx.beginPath();
      ctx.arc(x, y, 8 + alpha * 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(117, 189, 224, ${Math.max(0, 0.82 - alpha * 0.68)})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    ctx.restore();
  }
}

  exports.WCARenderer = WCARenderer;
  },
  "tabs/tabKomparasi.js": function(exports, __require) {
/**
 * Tab 4: Komparasi Sinkron SFLA vs WCA & Studi Kasus Penjadwalan Tugas Cloud VM
 * Menampilkan arena pengujian head-to-head pada seed dan koordinat awal identik,
 * matriks perbandingan arsitektur, serta simulator minimasi Makespan 16 Cloudlet pada 4 VM heterogen.
 */
const {  getObjective  } = __require("core/objectives.js");
const {  createRng  } = __require("core/rng.js");
const {  SimulationRunner  } = __require("core/engine.js");
const {  SFLAEngine  } = __require("algorithms/sfla.js");
const {  WCAEngine  } = __require("algorithms/wca.js");
const {  CloudScheduleOptimizer, generateCloudTasks, DEFAULT_VMS  } = __require("algorithms/cloudScheduling.js");
const {  SFLARenderer  } = __require("render/sflaRenderer.js");
const {  WCARenderer  } = __require("render/wcaRenderer.js");
const {  renderConvergenceChart  } = __require("render/chart.js");
const {  syncCanvasSize  } = __require("render/contourRenderer.js");
const tabKomparasi = {
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

  exports.tabKomparasi = tabKomparasi;
  },
  "algorithms/cloudScheduling.js": function(exports, __require) {
/**
 * Mini Studi Kasus Komputasi Awan: Penjadwalan n Tugas ke m Virtual Machine (PRD Bagian 9)
 * Logika murni tanpa DOM — memetakan vektor kontinu X in [0, m)^n menjadi jadwal diskrit VM
 * menggunakan pembulatan bawah floor(X[i]) untuk meminimalkan Makespan.
 */
const {  createRng  } = __require("core/rng.js");
const DEFAULT_VMS = [
  { id: 0, name: 'VM-1 (Small)', mips: 85 },
  { id: 1, name: 'VM-2 (Medium)', mips: 115 },
  { id: 2, name: 'VM-3 (Large)', mips: 145 },
  { id: 3, name: 'VM-4 (X-Large)', mips: 175 }
];
function generateCloudTasks(count = 16, seed = 2026) {
  const rng = createRng(seed);
  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `T${idx + 1}`,
    mi: rng.int(140, 620) // Beban instruksi tugas dalam Million Instructions (MI)
  }));
}

/**
 * Pemetaan solusi kontinu ke indeks VM diskrit:
 *   vmIndex = clamp(floor(x_i), 0, m - 1)
 */
function decodeSchedule(vector, vmCount) {
  const maxIdx = vmCount - 1;
  return vector.map((val) => {
    const idx = Math.floor(val);
    if (idx < 0) return 0;
    if (idx > maxIdx) return maxIdx;
    return idx;
  });
}

/**
 * Menghitung waktu eksekusi tiap VM dan nilai Makespan = max(waktu selesai VM).
 */
function evaluateSchedule(vector, tasks, vms = DEFAULT_VMS) {
  const assignment = decodeSchedule(vector, vms.length);
  const vmLoads = vms.map(() => 0);
  const vmTasks = vms.map(() => []);

  for (let i = 0; i < tasks.length; i++) {
    const vmIdx = assignment[i];
    const execSec = tasks[i].mi / vms[vmIdx].mips;
    vmLoads[vmIdx] += execSec;
    vmTasks[vmIdx].push({
      ...tasks[i],
      execSec
    });
  }

  let makespan = 0;
  let sumLoad = 0;
  for (const load of vmLoads) {
    if (load > makespan) makespan = load;
    sumLoad += load;
  }
  const meanLoad = sumLoad / vms.length;
  let variance = 0;
  for (const load of vmLoads) {
    variance += (load - meanLoad) * (load - meanLoad);
  }
  const imbalanceStd = Math.sqrt(variance / vms.length);

  // Fitness utama adalah Makespan, ditambah penalti keseimbangan mikro (1e-3) untuk memandu gradien plato
  const fitness = makespan + 0.001 * imbalanceStd;

  return {
    assignment,
    vmLoads,
    vmTasks,
    makespan,
    imbalanceStd,
    fitness
  };
}
function computeRoundRobinBaseline(tasks, vms = DEFAULT_VMS) {
  const rrVector = tasks.map((_, i) => (i % vms.length) + 0.5);
  return evaluateSchedule(rrVector, tasks, vms);
}
class CloudScheduleOptimizer {
  /**
   * Menjalankan SFLA dan WCA secara paralel pada masalah penjadwalan tugas VM yang sama.
   */
  constructor({ tasks, vms = DEFAULT_VMS, populationSize = 28, maxIterations = 35, seed = 42 } = {}) {
    this.tasks = tasks || generateCloudTasks(16, seed);
    this.vms = vms;
    this.populationSize = populationSize;
    this.maxIterations = maxIterations;
    this.seed = seed;
    this.reset();
  }

  clampDim(val) {
    const upper = this.vms.length - 1e-6;
    if (val < 0) return 0;
    if (val > upper) return upper;
    return val;
  }

  reset() {
    const rngInit = createRng(this.seed);
    this.rngSfla = createRng(Number(this.seed) + 101);
    this.rngWca = createRng(Number(this.seed) + 202);
    const dim = this.tasks.length;
    const m = this.vms.length;

    // Populasi awal yang sengaja identik untuk SFLA & WCA agar perbandingan adil
    const initVectors = Array.from({ length: this.populationSize }, () =>
      Array.from({ length: dim }, () => rngInit.range(0, m - 1e-6))
    );

    this.sflaPop = initVectors.map((vec) => ({
      vec: [...vec],
      eval: evaluateSchedule(vec, this.tasks, this.vms)
    }));

    this.wcaPop = initVectors.map((vec) => ({
      vec: [...vec],
      eval: evaluateSchedule(vec, this.tasks, this.vms)
    }));

    this.sflaPop.sort((a, b) => a.eval.fitness - b.eval.fitness);
    this.wcaPop.sort((a, b) => a.eval.fitness - b.eval.fitness);

    this.bestSfla = { vec: [...this.sflaPop[0].vec], eval: this.sflaPop[0].eval };
    this.bestWca = { vec: [...this.wcaPop[0].vec], eval: this.wcaPop[0].eval };
    this.baselineRR = computeRoundRobinBaseline(this.tasks, this.vms);

    this.iteration = 0;
    this.dmax = 1.2;
    this.dmax0 = 1.2;
    this.done = false;

    this.historySfla = [{ iteration: 0, bestFitness: this.bestSfla.eval.makespan }];
    this.historyWca = [{ iteration: 0, bestFitness: this.bestWca.eval.makespan }];
    return this.getState();
  }

  step() {
    if (this.done) return this.getState();
    this.iteration += 1;

    this.stepSFLAOnce();
    this.stepWCAOnce();

    this.historySfla.push({ iteration: this.iteration, bestFitness: this.bestSfla.eval.makespan });
    this.historyWca.push({ iteration: this.iteration, bestFitness: this.bestWca.eval.makespan });

    if (this.iteration >= this.maxIterations) {
      this.done = true;
    }
    return this.getState();
  }

  stepSFLAOnce() {
    const mCount = 4;
    const localN = 4;
    const dim = this.tasks.length;
    const vmCount = this.vms.length;

    this.sflaPop.sort((a, b) => a.eval.fitness - b.eval.fitness);
    const memeplexes = Array.from({ length: mCount }, () => []);
    this.sflaPop.forEach((agent, idx) => {
      memeplexes[idx % mCount].push(agent);
    });

    for (let k = 0; k < mCount; k++) {
      const group = memeplexes[k];
      if (group.length < 2) continue;

      for (let step = 0; step < localN; step++) {
        group.sort((a, b) => a.eval.fitness - b.eval.fitness);
        const xb = group[0];
        const xw = group[group.length - 1];

        // 1. Lompat menuju Xb
        const candXb = xw.vec.map((v, d) =>
          this.clampDim(v + this.rngSfla.next() * 1.6 * (xb.vec[d] - v))
        );
        const evalXb = evaluateSchedule(candXb, this.tasks, this.vms);

        if (evalXb.fitness < xw.eval.fitness) {
          xw.vec = candXb;
          xw.eval = evalXb;
        } else {
          // 2. Lompat menuju Xg
          const candXg = xw.vec.map((v, d) =>
            this.clampDim(v + this.rngSfla.next() * 1.6 * (this.bestSfla.vec[d] - v))
          );
          const evalXg = evaluateSchedule(candXg, this.tasks, this.vms);
          if (evalXg.fitness < xw.eval.fitness) {
            xw.vec = candXg;
            xw.eval = evalXg;
          } else {
            // 3. Jadwal acak baru
            const randVec = Array.from({ length: dim }, () =>
              this.rngSfla.range(0, vmCount - 1e-6)
            );
            xw.vec = randVec;
            xw.eval = evaluateSchedule(randVec, this.tasks, this.vms);
          }
        }

        if (xw.eval.fitness < this.bestSfla.eval.fitness) {
          this.bestSfla = { vec: [...xw.vec], eval: xw.eval };
        }
      }
    }

    // Gabung kembali (Shuffle)
    this.sflaPop = memeplexes.flat().sort((a, b) => a.eval.fitness - b.eval.fitness);
  }

  stepWCAOnce() {
    const nsr = 4;
    const C = 2.0;
    const dim = this.tasks.length;
    const vmCount = this.vms.length;

    this.wcaPop.sort((a, b) => a.eval.fitness - b.eval.fitness);
    const leaders = this.wcaPop.slice(0, nsr);
    const streams = this.wcaPop.slice(nsr);

    // Pembagian aliran proporsional intensitas
    const refFit = streams.length > 0 ? streams[0].eval.fitness + 1e-6 : leaders[nsr - 1].eval.fitness + 1;
    const weights = leaders.map((ld) => Math.abs(ld.eval.fitness - refFit) + 1e-6);
    const totalW = weights.reduce((a, b) => a + b, 0);
    const quotas = weights.map((w) => Math.round((w / totalW) * streams.length));
    while (quotas.reduce((a, b) => a + b, 0) < streams.length) quotas[0] += 1;
    while (quotas.reduce((a, b) => a + b, 0) > streams.length) {
      const idx = quotas.findIndex((q) => q > 0);
      if (idx >= 0) quotas[idx] -= 1;
      else break;
    }

    // Aliran menuju sungai/laut induk
    let ptr = 0;
    for (let l = 0; l < nsr; l++) {
      const parent = leaders[l];
      for (let q = 0; q < quotas[l] && ptr < streams.length; q++) {
        const st = streams[ptr++];
        const nextVec = st.vec.map((v, d) =>
          this.clampDim(v + this.rngWca.next() * C * (parent.vec[d] - v))
        );
        st.vec = nextVec;
        st.eval = evaluateSchedule(nextVec, this.tasks, this.vms);

        // Pertukaran peran aliran <-> induk
        if (st.eval.fitness < parent.eval.fitness) {
          const tmpV = parent.vec;
          const tmpE = parent.eval;
          parent.vec = st.vec;
          parent.eval = st.eval;
          st.vec = tmpV;
          st.eval = tmpE;
        }
      }
    }

    // Sungai mengalir ke Laut (leaders[0])
    const sea = leaders[0];
    for (let r = 1; r < nsr; r++) {
      const rv = leaders[r];
      const nextVec = rv.vec.map((v, d) =>
        this.clampDim(v + this.rngWca.next() * C * (sea.vec[d] - v))
      );
      rv.vec = nextVec;
      rv.eval = evaluateSchedule(nextVec, this.tasks, this.vms);

      if (rv.eval.fitness < sea.eval.fitness) {
        const tmpV = sea.vec;
        const tmpE = sea.eval;
        sea.vec = rv.vec;
        sea.eval = rv.eval;
        rv.vec = tmpV;
        rv.eval = tmpE;
      }

      // Cek penguapan jarak vektor ke Laut
      let sqDist = 0;
      for (let d = 0; d < dim; d++) {
        const diff = rv.vec[d] - sea.vec[d];
        sqDist += diff * diff;
      }
      const normDist = Math.sqrt(sqDist / dim);
      if (normDist < this.dmax || this.rngWca.next() < 0.08) {
        rv.vec = Array.from({ length: dim }, () => this.rngWca.range(0, vmCount - 1e-6));
        rv.eval = evaluateSchedule(rv.vec, this.tasks, this.vms);
        if (rv.eval.fitness < sea.eval.fitness) {
          const tmpV = sea.vec;
          const tmpE = sea.eval;
          sea.vec = rv.vec;
          sea.eval = rv.eval;
          rv.vec = tmpV;
          rv.eval = tmpE;
        }
      }
    }

    if (sea.eval.fitness < this.bestWca.eval.fitness) {
      this.bestWca = { vec: [...sea.vec], eval: sea.eval };
    }

    this.dmax = Math.max(0.05, this.dmax - this.dmax0 / this.maxIterations);
    this.wcaPop = [...leaders, ...streams];
  }

  getState() {
    return {
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      done: this.done,
      vms: this.vms,
      tasks: this.tasks,
      baselineRR: this.baselineRR,
      bestSfla: this.bestSfla,
      bestWca: this.bestWca,
      historySfla: this.historySfla,
      historyWca: this.historyWca
    };
  }
}


  exports.generateCloudTasks = generateCloudTasks;
  exports.decodeSchedule = decodeSchedule;
  exports.evaluateSchedule = evaluateSchedule;
  exports.computeRoundRobinBaseline = computeRoundRobinBaseline;
  exports.CloudScheduleOptimizer = CloudScheduleOptimizer;
  exports.DEFAULT_VMS = DEFAULT_VMS;
  }
});
