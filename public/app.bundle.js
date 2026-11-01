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
const {  DeckController  } = __require("ui/navigation.js");
const {  slides  } = __require("slides/index.js");

// Polyfill ringan CanvasRenderingContext2D.roundRect untuk kompatibilitas proyektor/browser lama
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
  const deck = new DeckController(slides);
  deck.init();
  window.__SFLA_WCA_DECK__ = deck;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

  
  },
  "ui/navigation.js": function(exports, __require) {
/**
 * Navigasi & Pengelola Deck Presentasi (F-01, F-02, F-14)
 * Menangani perpindahan 18 slide, shortcut keyboard, mode layar penuh, dan catatan presenter.
 */

const SECTIONS = [
  { id: 'intro', label: 'Pengantar', startSlide: 0, endSlide: 2 },
  { id: 'sfla', label: 'SFLA (Katak)', startSlide: 3, endSlide: 8 },
  { id: 'wca', label: 'WCA (Siklus Air)', startSlide: 9, endSlide: 14 },
  { id: 'compare', label: 'Perbandingan', startSlide: 15, endSlide: 15 },
  { id: 'cloud', label: 'Cloud VM', startSlide: 16, endSlide: 16 },
  { id: 'outro', label: 'Kesimpulan', startSlide: 17, endSlide: 17 }
];
class DeckController {
  constructor(slides) {
    this.slides = slides;
    this.currentIndex = 0;
    this.activeCleanup = null;
    this.activeHooks = null; // { togglePlay, step, reset } untuk shortcut P / S / R
    this.notesOpen = false;
    this.reducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    this.stageEl = document.getElementById('slide-stage');
    this.progressFill = document.getElementById('progress-fill');
    this.progressContainer = document.getElementById('progress-bar-container');
    this.slideNumberLabel = document.getElementById('slide-number-label');
    this.slideTitleMini = document.getElementById('slide-title-mini');
    this.dotsContainer = document.getElementById('slide-dots');
    this.sectionTabsEl = document.getElementById('section-tabs');

    this.btnPrev = document.getElementById('btn-prev');
    this.btnNext = document.getElementById('btn-next');
    this.btnNotes = document.getElementById('btn-notes');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.btnHelp = document.getElementById('btn-help');
    this.btnSlideMenu = document.getElementById('btn-slide-menu');

    this.notesDrawer = document.getElementById('presenter-notes');
    this.notesTitle = document.getElementById('notes-slide-title');
    this.notesContent = document.getElementById('notes-content');
    this.jumpModal = document.getElementById('slide-jump-modal');
    this.jumpList = document.getElementById('slide-jump-list');
    this.shortcutsModal = document.getElementById('shortcuts-modal');
  }

  init() {
    this.buildSectionTabs();
    this.buildDots();
    this.buildJumpMenu();
    this.bindEvents();

    // Pulihkan nomor slide dari hash URL jika tersedia (#slide-9)
    const hashMatch = window.location.hash.match(/^#slide-(\d+)$/);
    const startIdx = hashMatch
      ? Math.max(0, Math.min(this.slides.length - 1, Number(hashMatch[1]) - 1))
      : 0;

    this.goTo(startIdx, false);
  }

  buildSectionTabs() {
    this.sectionTabsEl.innerHTML = '';
    SECTIONS.forEach((sec) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'section-tab';
      btn.dataset.section = sec.id;
      btn.textContent = sec.label;
      btn.addEventListener('click', () => this.goTo(sec.startSlide));
      this.sectionTabsEl.appendChild(btn);
    });
  }

  buildDots() {
    this.dotsContainer.innerHTML = '';
    this.slides.forEach((slide, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slide-dot';
      dot.title = `${idx + 1}. ${slide.shortTitle || slide.title}`;
      dot.setAttribute('aria-label', `Slide ${idx + 1}: ${slide.shortTitle || slide.title}`);
      dot.addEventListener('click', () => this.goTo(idx));
      this.dotsContainer.appendChild(dot);
    });
  }

  buildJumpMenu() {
    this.jumpList.innerHTML = '';
    this.slides.forEach((slide, idx) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'jump-item';
      item.innerHTML = `<span class="jump-num">${idx + 1}.</span><span>${slide.shortTitle || slide.title}</span>`;
      item.addEventListener('click', () => {
        this.jumpModal.classList.add('hidden');
        this.goTo(idx);
      });
      this.jumpList.appendChild(item);
    });
  }

  bindEvents() {
    this.btnPrev.addEventListener('click', () => this.prev());
    this.btnNext.addEventListener('click', () => this.next());

    this.btnNotes.addEventListener('click', () => this.toggleNotes());
    document.getElementById('btn-close-notes').addEventListener('click', () => this.toggleNotes(false));

    this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

    this.btnSlideMenu.addEventListener('click', () => {
      this.jumpModal.classList.toggle('hidden');
    });
    document.getElementById('btn-close-jump').addEventListener('click', () => {
      this.jumpModal.classList.add('hidden');
    });
    this.jumpModal.addEventListener('click', (e) => {
      if (e.target === this.jumpModal) this.jumpModal.classList.add('hidden');
    });

    this.btnHelp.addEventListener('click', () => {
      this.shortcutsModal.classList.toggle('hidden');
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
      this.shortcutsModal.classList.add('hidden');
    });
    this.shortcutsModal.addEventListener('click', (e) => {
      if (e.target === this.shortcutsModal) this.shortcutsModal.classList.add('hidden');
    });

    window.addEventListener('keydown', (e) => this.handleKeydown(e));
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
      this.jumpModal.classList.add('hidden');
      this.shortcutsModal.classList.add('hidden');
      if (this.notesOpen) this.toggleNotes(false);
      return;
    }

    if (this.isInteractiveElement(e.target)) return;

    const tag = e.target ? e.target.tagName : '';

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      this.next();
    } else if (e.key === ' ' && tag !== 'BUTTON') {
      e.preventDefault();
      this.next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      this.prev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.goTo(this.slides.length - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      this.toggleFullscreen();
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      this.toggleNotes();
    } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      this.shortcutsModal.classList.toggle('hidden');
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
    this.notesDrawer.classList.toggle('hidden', !this.notesOpen);
    this.btnNotes.setAttribute('aria-pressed', String(this.notesOpen));
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  next() {
    if (this.currentIndex < this.slides.length - 1) {
      this.goTo(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
  }

  goTo(index, updateHash = true) {
    if (index < 0 || index >= this.slides.length) return;

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
    const slide = this.slides[index];

    document.body.dataset.theme = slide.theme || 'intro';
    this.stageEl.innerHTML = '';

    const frame = document.createElement('section');
    frame.className = 'slide-frame';
    frame.setAttribute('aria-label', slide.title);
    this.stageEl.appendChild(frame);

    const mountResult = slide.mount(frame, {
      deck: this,
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

    // Update UI indicators
    const total = this.slides.length;
    const pct = ((index + 1) / total) * 100;
    this.progressFill.style.width = `${pct.toFixed(2)}%`;
    this.progressContainer.setAttribute('aria-valuenow', String(index + 1));
    this.progressContainer.setAttribute('aria-valuemax', String(total));

    this.slideNumberLabel.textContent = `${index + 1} / ${total}`;
    this.slideTitleMini.textContent = slide.shortTitle || slide.title;

    this.btnPrev.disabled = index === 0;
    this.btnNext.disabled = index === total - 1;

    Array.from(this.dotsContainer.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    Array.from(this.jumpList.children).forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    SECTIONS.forEach((sec) => {
      const tab = this.sectionTabsEl.querySelector(`[data-section="${sec.id}"]`);
      if (tab) {
        tab.classList.toggle('active', index >= sec.startSlide && index <= sec.endSlide);
      }
    });

    // Update presenter notes
    this.notesTitle.textContent = `Slide ${index + 1}: ${slide.shortTitle || slide.title}`;
    this.notesContent.innerHTML = slide.notes || '<p>Sampaikan poin utama visual pada layar.</p>';

    if (updateHash) {
      try {
        window.history.replaceState(null, '', `#slide-${index + 1}`);
      } catch (_e) {
        // Ignore history restrictions on strict file:// environments
      }
    }
  }
}


  exports.DeckController = DeckController;
  },
  "slides/index.js": function(exports, __require) {
const {  introSlides  } = __require("slides/introSlides.js");
const {  sflaSlides  } = __require("slides/sflaSlides.js");
const {  wcaSlides  } = __require("slides/wcaSlides.js");
const {  outroSlides  } = __require("slides/outroSlides.js");
const slides = [...introSlides, ...sflaSlides, ...wcaSlides, ...outroSlides];

  exports.slides = slides;
  },
  "slides/introSlides.js": function(exports, __require) {
/**
 * Slide 1–3: Pembuka, Masalah Optimasi, dan Ide Dasar Metaheuristik
 */
const {  getObjective  } = __require("core/objectives.js");
const {  createRng  } = __require("core/rng.js");
const {  ContourMapCache, syncCanvasSize  } = __require("render/contourRenderer.js");

const STORAGE_TEAM_KEY = 'sfla_wca_team_names_v1';
const introSlides = [
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

  exports.introSlides = introSlides;
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
 * Mendukung palet 'pond' (SFLA), 'water' (WCA), dan 'terrain' (Umum).
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
  // Kolam teratai: cekungan terdalam zamrud gelap bercahaya -> tepi kolam lumut hangat
  pond: [
    [3, 46, 42],
    [6, 78, 64],
    [13, 108, 92],
    [17, 75, 68],
    [25, 58, 48],
    [44, 66, 38]
  ],
  // Siklus air: palung laut biru safir -> lereng sian -> punggung pegunungan batu-salju
  water: [
    [3, 35, 68],
    [7, 74, 122],
    [14, 105, 142],
    [22, 68, 98],
    [38, 62, 86],
    [76, 98, 122]
  ],
  // Peta topografi umum untuk pengantar optimasi
  terrain: [
    [6, 38, 68],
    [12, 92, 132],
    [16, 142, 118],
    [74, 152, 76],
    [168, 142, 48],
    [198, 98, 56]
  ]
};
function createViewport(width, height, objective, paddingRatio = 0.08) {
  const domainSpan = objective.max - objective.min;
  const usable = Math.min(width, height) * (1 - paddingRatio * 2);
  const scale = Math.max(1, usable / domainSpan); // piksel per 1 satuan koordinat
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

    // Gambar batas domain pencarian yang halus
    const topLeft = vp.worldToScreen(objective.min, objective.max);
    const botRight = vp.worldToScreen(objective.max, objective.min);
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.lineWidth = 1.25;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(
      topLeft.x,
      topLeft.y,
      botRight.x - topLeft.x,
      botRight.y - topLeft.y
    );
    ctx.setLineDash([]);

    // Garis sumbu tipis melalui (0,0)
    const origin = vp.worldToScreen(0, 0);
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, origin.y);
    ctx.lineTo(botRight.x, origin.y);
    ctx.moveTo(origin.x, topLeft.y);
    ctx.lineTo(origin.x, botRight.y);
    ctx.stroke();

    // Tampilkan penanda global optimum jika diaktifkan (PRD Bagian 10)
    if (options.showOptimum !== false) {
      const optPos = vp.worldToScreen(objective.optimum.x, objective.optimum.y);
      this.drawOptimumStar(ctx, optPos.x, optPos.y);
    }
    ctx.restore();

    return vp;
  }

  buildOffscreen(width, height, objective, paletteName, vp) {
    // Render pada resolusi 1/2 untuk kecepatan pembentukan awal (< 8ms), lalu haluskan
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
        // Kurva gamma lembut agar lembah dekat 0 terlihat jelas konturnya
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

        // Deteksi garis kontur (isoline) antar piksel tetangga
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
          data[p] = Math.min(255, rgb[0] + 34);
          data[p + 1] = Math.min(255, rgb[1] + 42);
          data[p + 2] = Math.min(255, rgb[2] + 44);
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

    // Vignette halus di tepi kanvas agar fokus mata ke tengah peta
    const grad = fctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.32,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(3, 9, 17, 0.48)');
    fctx.fillStyle = grad;
    fctx.fillRect(0, 0, width, height);

    return fullCanvas;
  }

  drawOptimumStar(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Lingkaran pendaran target global
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Bintang 5 sudut
    ctx.beginPath();
    const spikes = 5;
    const outerR = 10;
    const innerR = 4.5;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.8;
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
  "slides/sflaSlides.js": function(exports, __require) {
/**
 * Modul Slide SFLA (Slide 4–9) — Metafora Katak di Kolam Teratai (PRD Bagian 7)
 */
const {  getObjective  } = __require("core/objectives.js");
const {  SimulationRunner  } = __require("core/engine.js");
const {  SFLAEngine  } = __require("algorithms/sfla.js");
const {  SFLARenderer, MEMEPLEX_COLORS  } = __require("render/sflaRenderer.js");
const {  syncCanvasSize  } = __require("render/contourRenderer.js");
const {  renderConvergenceChart  } = __require("render/chart.js");
const sflaSlides = [
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

  exports.sflaSlides = sflaSlides;
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
 * Renderer Visual SFLA — Metafora Katak di Kolam Teratai (PRD Bagian 7.2 & 14)
 * Menampilkan daun teratai, warna & label memeplex (M1..Mm), panah lompatan, riak air,
 * dan mahkota emas untuk katak terbaik global (Xg).
 */
const {  ContourMapCache, syncCanvasSize  } = __require("render/contourRenderer.js");

// Palet warna memeplex kontras tinggi di atas latar kolam zamrud gelap
const MEMEPLEX_COLORS = [
  '#43bf9c', // M1: Hijau teratai
  '#d8a33a', // M2: Oker keemasan
  '#53bce3', // M3: Biru langit hidrologi
  '#e07a9a', // M4: Merah muda teratai
  '#48b8d0', // M5: Biru teluk
  '#e08544', // M6: Jingga terakota
  '#9ccf4e', // M7: Hijau pucuk
  '#27a89a'  // M8: Toska dalam
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

    // 1. Gambar daun teratai dekoratif halus di beberapa titik kolam
    this.drawLilyPads(ctx, vp, objective);

    // 2. Gambar jejak pergerakan katak jika diaktifkan
    if (showTrails) {
      for (const frog of state.frogs) {
        if (!frog.trail || frog.trail.length < 2) continue;
        const mColor =
          frog.memeplex >= 0
            ? MEMEPLEX_COLORS[frog.memeplex % MEMEPLEX_COLORS.length]
            : 'rgba(148, 163, 184, 0.5)';
        ctx.save();
        ctx.beginPath();
        frog.trail.forEach((pt, idx) => {
          const s = vp.worldToScreen(pt.x, pt.y);
          if (idx === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.strokeStyle = mColor;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Gambar panah lompatan & riak percikan air pada tahap LOCAL_JUMP
    if (state.phase === 'LOCAL_JUMP' && state.jumps.length > 0) {
      for (const jmp of state.jumps) {
        this.drawJumpEffect(ctx, vp, jmp, alpha);
      }
    }

    // 4. Gambar garis pusaran tipis saat SHUFFLE
    if (state.phase === 'SHUFFLE' && state.bestFrog) {
      const center = vp.worldToScreen(state.bestFrog.x, state.bestFrog.y);
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.28)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 48 + (1 - alpha) * 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Urutkan penggambaran katak agar katak terbaik digambar paling atas (tidak tertutup)
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
      // Daun teratai dengan celah huruf V kecil
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, p.r, p.rot + 0.22, p.rot + Math.PI * 2 - 0.22);
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
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

    // Bila percobaan ke Xb gagal lalu pindah ke Xg, tampilkan garis tipis gagal ke Xb
    if (jmp.triedXbFailed && typeof jmp.failedXbX === 'number') {
      const fxb = vp.worldToScreen(jmp.failedXbX, jmp.failedXbY);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(fxb.x, fxb.y);
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    let strokeColor = '#43bf9c';
    let badgeText = '→ Xb [OK]';
    if (jmp.type === 'XG_SUCCESS') {
      strokeColor = '#d8a33a';
      badgeText = '→ Xg [OK]';
    } else if (jmp.type === 'RANDOM_RESET') {
      strokeColor = '#d95b5b';
      badgeText = 'Acak ↺';
    }

    // Busur lompatan melengkung
    const midX = (from.x + curX) / 2;
    const midY = (from.y + curY) / 2 - 22 * Math.sin(alpha * Math.PI * 0.5 + 0.3);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, midY, curX, curY);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.4;
    if (jmp.type === 'RANDOM_RESET') ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Kepala panah di ujung lompatan
    const angle = Math.atan2(curY - midY, curX - midX);
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(curX - 9 * Math.cos(angle - 0.45), curY - 9 * Math.sin(angle - 0.45));
    ctx.lineTo(curX - 9 * Math.cos(angle + 0.45), curY - 9 * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fillStyle = strokeColor;
    ctx.fill();

    // Riak percikan air saat mendarat
    if (alpha > 0.35) {
      const rippleProgress = (alpha - 0.35) / 0.65;
      const r1 = 8 + rippleProgress * 18;
      ctx.beginPath();
      ctx.arc(to.x, to.y, r1, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = Math.max(0, 0.75 * (1 - rippleProgress));
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Label kecil status lompatan
    ctx.font = '700 11px "Ubuntu Mono", monospace';
    ctx.fillStyle = strokeColor;
    ctx.fillText(badgeText, to.x + 11, to.y - 11);

    ctx.restore();
  }

  drawFrog(ctx, x, y, frog, objective, phase, compact = false) {
    const isGlobalBest = frog.role === 'global_best';
    const isMemeplexBest = frog.role === 'memeplex_best';
    const normFit = Math.min(1, Math.max(0, frog.fitness / (objective.maxVisualValue || 50)));

    // Katak dengan fitness lebih baik sedikit lebih besar & bercahaya
    const baseR = compact ? 6.5 : 8.2;
    const radius = isGlobalBest ? baseR + 3.5 : baseR + (1 - normFit) * 2.5;

    const fill =
      frog.memeplex >= 0
        ? MEMEPLEX_COLORS[frog.memeplex % MEMEPLEX_COLORS.length]
        : '#94a3b8';

    ctx.save();
    ctx.translate(x, y);

    // Pendar cahaya untuk katak terbaik global atau terbaik kelompok
    if (isGlobalBest || isMemeplexBest) {
      const glowR = isGlobalBest ? radius * 2.6 : radius * 1.9;
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, glowR);
      g.addColorStop(0, isGlobalBest ? 'rgba(251, 191, 36, 0.7)' : 'rgba(52, 211, 153, 0.45)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Siluet tubuh katak bergaya ikon bersih (badan bulat + 2 mata kecil di atas)
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = isGlobalBest ? '#fbbf24' : fill;
    ctx.strokeStyle = isGlobalBest ? '#fef08a' : '#041311';
    ctx.lineWidth = isGlobalBest ? 2.6 : 2;
    ctx.fill();
    ctx.stroke();

    // Dua mata katak di bagian atas agar bentuk katak langsung dikenali tanpa bergantung warna saja
    const eyeOffset = radius * 0.56;
    const eyeR = Math.max(2, radius * 0.28);
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(dir * eyeOffset, -radius * 0.68, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dir * eyeOffset, -radius * 0.68, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    }

    // Mahkota emas untuk katak terbaik global (Xg)
    if (isGlobalBest) {
      ctx.beginPath();
      ctx.moveTo(-7, -radius - 4);
      ctx.lineTo(-5, -radius - 12);
      ctx.lineTo(0, -radius - 7);
      ctx.lineTo(5, -radius - 12);
      ctx.lineTo(7, -radius - 4);
      ctx.closePath();
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.4;
      ctx.fill();
      ctx.stroke();
    }

    // Label nomor memeplex (M1..Mm) atau peringkat saat SORT agar aksesibel bagi buta warna
    if (!compact) {
      ctx.font = '700 10px "Ubuntu Mono", monospace';
      ctx.textAlign = 'center';
      if (frog.memeplex >= 0) {
        ctx.fillStyle = '#021310';
        ctx.fillText(`M${frog.memeplex + 1}`, 0, 3.5);
      } else if (phase === 'SORT' && frog.rank >= 0 && frog.rank < 9) {
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`${frog.rank + 1}`, 0, 3.5);
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
 * Grafik Konvergensi Fitness Terbaik per Iterasi (F-09)
 * Mendukung satu seri (SFLA atau WCA) maupun multi-seri (Perbandingan SFLA vs WCA).
 */
const {  syncCanvasSize  } = __require("render/contourRenderer.js");
function renderConvergenceChart(canvas, seriesList, options = {}) {
  if (!canvas) return;
  const { ctx, width, height } = syncCanvasSize(canvas);
  ctx.clearRect(0, 0, width, height);

  const padLeft = 58;
  const padRight = 18;
  const padTop = 28;
  const padBottom = 32;
  const plotW = Math.max(20, width - padLeft - padRight);
  const plotH = Math.max(20, height - padTop - padBottom);

  // Latar belakang area plot
  ctx.fillStyle = 'rgba(4, 12, 22, 0.72)';
  ctx.fillRect(0, 0, width, height);

  // Judul mini grafik
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(options.title || 'Grafik Konvergensi (Fitness Terbaik)', 14, 18);

  // Kumpulkan rentang data X dan Y
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

  // Grid horizontal (4 garis)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
  ctx.lineWidth = 1;
  ctx.font = '400 11px "Ubuntu Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';

  for (let i = 0; i <= 3; i++) {
    const ratio = i / 3;
    const py = padTop + plotH - ratio * plotH;
    const val = yFloor + ratio * (yCeil - yFloor);

    ctx.beginPath();
    ctx.moveTo(padLeft, py);
    ctx.lineTo(padLeft + plotW, py);
    ctx.stroke();

    const formatted = val >= 10 ? val.toFixed(1) : val >= 0.1 ? val.toFixed(2) : val.toExponential(1);
    ctx.fillText(formatted, padLeft - 6, py + 4);
  }

  // Label sumbu X
  ctx.textAlign = 'center';
  const xTicks = 4;
  for (let i = 0; i <= xTicks; i++) {
    const iterVal = Math.round((i / xTicks) * maxIter);
    const px = padLeft + (iterVal / maxIter) * plotW;
    ctx.fillText(`${iterVal}`, px, padTop + plotH + 18);
  }
  ctx.fillStyle = '#64748b';
  ctx.fillText('Iterasi', padLeft + plotW / 2, height - 3);

  // Gambar kurva tiap seri
  seriesList.forEach((s, sIdx) => {
    if (!s.data || s.data.length === 0) return;
    const color = s.color || '#34d399';

    const points = s.data.map((pt) => {
      const px = padLeft + (pt.iteration / maxIter) * plotW;
      const normY = (pt.bestFitness - yFloor) / Math.max(1e-9, yCeil - yFloor);
      const py = padTop + plotH - Math.max(0, Math.min(1, normY)) * plotH;
      return { px, py, val: pt.bestFitness };
    });

    // Area gradien tipis di bawah kurva bila hanya 1 seri
    if (seriesList.length === 1 && points.length > 1) {
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      grad.addColorStop(0, s.fillTop || 'rgba(16, 185, 129, 0.28)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      ctx.beginPath();
      ctx.moveTo(points[0].px, padTop + plotH);
      points.forEach((p) => ctx.lineTo(p.px, p.py));
      ctx.lineTo(points[points.length - 1].px, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Garis kurva utama
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Titik ujung terakhir
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.px, last.py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // Legenda kanan atas untuk multi-seri
    if (seriesList.length > 1) {
      const lx = width - padRight - (seriesList.length - 1 - sIdx) * 110 - 6;
      ctx.textAlign = 'right';
      ctx.font = '700 12px "Ubuntu Mono", monospace';
      ctx.fillStyle = color;
      const disp = last.val < 0.001 ? last.val.toExponential(1) : last.val.toFixed(3);
      ctx.fillText(`● ${s.label}: ${disp}`, lx, 18);
    }
  });

  ctx.textAlign = 'left';
}


  exports.renderConvergenceChart = renderConvergenceChart;
  },
  "slides/wcaSlides.js": function(exports, __require) {
/**
 * Modul Slide WCA (Slide 10–15) — Metafora Siklus Air (PRD Bagian 8)
 */
const {  getObjective  } = __require("core/objectives.js");
const {  SimulationRunner  } = __require("core/engine.js");
const {  WCAEngine  } = __require("algorithms/wca.js");
const {  WCARenderer  } = __require("render/wcaRenderer.js");
const {  syncCanvasSize  } = __require("render/contourRenderer.js");
const {  renderConvergenceChart  } = __require("render/chart.js");
const wcaSlides = [
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

  exports.wcaSlides = wcaSlides;
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
 * Renderer Visual WCA — Metafora Siklus Air (PRD Bagian 8.2 & 14)
 * Menampilkan Laut, Sungai, Aliran, garis lengkung aliran air, kilatan pertukaran peran,
 * lingkaran radius penguapan dmax, uap naik, dan rintik hujan.
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

    // 1. Gambar lingkaran radius penguapan dmax di sekitar Laut
    if (seaDrop && state.phase !== 'INIT') {
      const seaPos = dropScreenMap.get(seaDrop.id);
      const dmaxPx = Math.max(8, vp.worldDistToPx(state.dmax));
      ctx.save();
      ctx.beginPath();
      ctx.arc(seaPos.x, seaPos.y, dmaxPx, 0, Math.PI * 2);
      ctx.fillStyle =
        state.phase === 'EVAPORATION'
          ? 'rgba(103, 232, 249, 0.16)'
          : 'rgba(56, 189, 248, 0.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!options.compact && dmaxPx > 22) {
        ctx.font = '700 11px "Ubuntu Mono", monospace';
        ctx.fillStyle = '#a5f3fc';
        ctx.fillText(`dmax`, seaPos.x + dmaxPx + 5, seaPos.y + 4);
      }
      ctx.restore();
    }

    // 2. Gambar jaringan garis lengkung aliran (Stream -> River/Sea, River -> Sea)
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

        // Titik kontrol lengkung organik seperti sungai alami
        const nx = -dy * 0.14;
        const ny = dx * 0.14;
        const cx = (from.x + to.x) / 2 + nx;
        const cy = (from.y + to.y) / 2 + ny;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(cx, cy, to.x, to.y);

        if (d.role === 'river') {
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.52)';
          ctx.lineWidth = 2.4;
          ctx.setLineDash([8, 5]);
          ctx.lineDashOffset = dashOffset;
        } else {
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.26)';
          ctx.lineWidth = 1.3;
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. Efek Kilatan Pertukaran Peran (ROLE_SWAP)
    if (state.phase === 'ROLE_SWAP' && state.swaps.length > 0) {
      for (const sw of state.swaps) {
        this.drawSwapFlash(ctx, vp, sw, alpha);
      }
    }

    // 4. Gambar agen dari kasta terendah ke tertinggi: Stream -> River -> Sea
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

      // 5. Efek uap membubung saat EVAPORATION
      if (state.phase === 'EVAPORATION' && d.evaporating) {
        this.drawVaporEffect(ctx, pos.x, pos.y, alpha);
      }

      // 6. Efek rintik hujan jatuh saat RAIN
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

    // Bentuk tetesan air meruncing ke arah aliran
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(-2, 6, -6, 0);
    ctx.quadraticCurveTo(-2, -6, 8, 0);
    ctx.closePath();
    ctx.fillStyle = '#bae6fd';
    ctx.strokeStyle = '#082f49';
    ctx.lineWidth = 1.6;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawRiver(ctx, x, y, riverIdx, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    glow.addColorStop(0, 'rgba(34, 211, 238, 0.55)');
    glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Bentuk belah ketupat membulat (diamond) untuk Sungai agar mudah dibedakan dari Aliran & Laut
    const r = compact ? 8.5 : 10.5;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fillStyle = '#22d3ee';
    ctx.strokeStyle = '#ecfeff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    if (!compact) {
      ctx.font = '800 10px "Ubuntu Mono", monospace';
      ctx.fillStyle = '#042f2e';
      ctx.textAlign = 'center';
      ctx.fillText(`S${riverIdx}`, 0, 3.5);
    }
    ctx.restore();
  }

  drawSea(ctx, x, y, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 28);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
    glow.addColorStop(0.55, 'rgba(251, 191, 36, 0.35)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    const r = compact ? 11 : 13.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    // Ikon gelombang air putih di tengah Laut
    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.quadraticCurveTo(-3, -3, 0, 1);
    ctx.quadraticCurveTo(3, 5, 6, 1);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    if (!compact) {
      ctx.font = '800 11px "Ubuntu Mono", monospace';
      ctx.fillStyle = '#fde047';
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
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Kilatan bintang cahaya di titik pemimpin baru
    const r = 10 + (1 - alpha) * 16;
    ctx.beginPath();
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText('TUKAR PERAN', a.x + 12, a.y - 10);
    ctx.restore();
  }

  drawVaporEffect(ctx, x, y, alpha) {
    ctx.save();
    const lift = alpha * 34;
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 8;
      const oy = -lift - i * 7;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, 5 + i * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0.15, 0.78 - alpha * 0.5)})`;
      ctx.fill();
    }
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText('UAP', x + 10, y - lift - 8);
    ctx.restore();
  }

  drawRainEffect(ctx, x, y, alpha) {
    ctx.save();
    const dropY = y - (1 - alpha) * 44;

    // Garis rintik hujan jatuh dari atas
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2;
    for (const dx of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(x + dx + 4, dropY - 18);
      ctx.lineTo(x + dx, dropY - 4);
      ctx.stroke();
    }

    // Riak pendaratan hujan
    if (alpha > 0.3) {
      ctx.beginPath();
      ctx.arc(x, y, 8 + alpha * 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(125, 211, 252, ${Math.max(0, 0.85 - alpha * 0.7)})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    ctx.restore();
  }
}


  exports.WCARenderer = WCARenderer;
  },
  "slides/outroSlides.js": function(exports, __require) {
/**
 * Slide 16–18: Perbandingan SFLA vs WCA Berdampingan, Studi Kasus Cloud VM, dan Kesimpulan
 */
const {  getObjective  } = __require("core/objectives.js");
const {  createRng  } = __require("core/rng.js");
const {  SimulationRunner  } = __require("core/engine.js");
const {  SFLAEngine  } = __require("algorithms/sfla.js");
const {  WCAEngine  } = __require("algorithms/wca.js");
const {  CloudScheduleOptimizer, generateCloudTasks  } = __require("algorithms/cloudScheduling.js");
const {  SFLARenderer  } = __require("render/sflaRenderer.js");
const {  WCARenderer  } = __require("render/wcaRenderer.js");
const {  syncCanvasSize  } = __require("render/contourRenderer.js");
const {  renderConvergenceChart  } = __require("render/chart.js");
const outroSlides = [
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

  exports.outroSlides = outroSlides;
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
