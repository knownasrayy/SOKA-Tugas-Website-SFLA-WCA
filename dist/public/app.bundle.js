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
  // Kanvas hanya memakai font yang sudah dimuat; muat lebih awal agar label tidak sempat tampil dengan font cadangan
  document.fonts?.load('700 32px "Inter"');
  document.fonts?.load('700 32px "JetBrains Mono"');

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
 * Pengendali Deck Presentasi
 * Menangani panggung 1920x1080 yang diskalakan ke layar, perpindahan slide & beat,
 * rel progres per bab, pintasan keyboard/clicker, dan pembersihan loop animasi.
 */

const DECK_WIDTH = 1920;
const DECK_HEIGHT = 1080;
const LEAVE_MS = 420;
class DeckController {
  constructor(slides) {
    this.slides = slides;
    this.index = 0;
    this.beat = 0;
    this.activeCleanup = null;
    this.activeHooks = null;
    this.activeEl = null;
    this.notesOpen = false;
    this.reducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    this.deckEl = document.getElementById('deck');
    this.stageEl = document.getElementById('deck-stage');
    this.railEl = document.getElementById('deck-rail');
    this.counterEl = document.getElementById('deck-counter');
    this.wipeEl = document.getElementById('chapter-wipe');
    this.notesDrawer = document.getElementById('presenter-notes');
    this.notesTitle = document.getElementById('notes-title');
    this.notesContent = document.getElementById('notes-content');
    this.shortcutsModal = document.getElementById('shortcuts-modal');
  }

  init() {
    this.buildRail();
    this.bindEvents();
    this.fitDeck();

    const hashId = window.location.hash.replace(/^#/, '').trim().toLowerCase();
    const matched = this.slides.findIndex((s) => s.id === hashId);
    this.goTo(matched >= 0 ? matched : 0);
  }

  /** Deck selalu berukuran 1920x1080 lalu diskalakan, jadi tata letak identik di layar apa pun. */
  fitDeck() {
    if (!this.deckEl) return;
    const scale = Math.min(window.innerWidth / DECK_WIDTH, window.innerHeight / DECK_HEIGHT);
    this.deckEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  beatsOf(slide) {
    return slide.beats || 1;
  }

  /** Bab berisi indeks slide yang berurutan, dipakai untuk rel progres dan lompat dengan angka. */
  get chapters() {
    const chapters = [];
    this.slides.forEach((slide, i) => {
      const last = chapters[chapters.length - 1];
      if (last && last.id === slide.chapter.id) last.indices.push(i);
      else chapters.push({ id: slide.chapter.id, label: slide.chapter.label, indices: [i] });
    });
    return chapters;
  }

  buildRail() {
    if (!this.railEl) return;
    this.railEl.innerHTML = this.chapters
      .map(
        (chapter) => `
          <div class="rail-chapter" data-chapter="${chapter.id}">
            <span class="rail-label">${chapter.label}</span>
            <div class="rail-track">
              ${chapter.indices
                .map(
                  (i) =>
                    `<button type="button" class="rail-seg" data-slide="${i}" aria-label="Slide ${i + 1}: ${this.slides[i].title}" title="${this.slides[i].title}"><i></i></button>`
                )
                .join('')}
            </div>
          </div>`
      )
      .join('');

    this.railSegs = [...this.railEl.querySelectorAll('.rail-seg')];
    this.railSegs.forEach((seg) => {
      seg.addEventListener('click', () => this.goTo(Number(seg.dataset.slide)));
    });
    this.railChapters = [...this.railEl.querySelectorAll('.rail-chapter')];
  }

  bindEvents() {
    document.getElementById('btn-prev')?.addEventListener('click', () => this.prev());
    document.getElementById('btn-next')?.addEventListener('click', () => this.next());
    document.getElementById('btn-notes')?.addEventListener('click', () => this.toggleNotes());
    document.getElementById('btn-close-notes')?.addEventListener('click', () => this.toggleNotes(false));
    document.getElementById('btn-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('btn-help')?.addEventListener('click', () => this.shortcutsModal?.classList.toggle('hidden'));
    document.getElementById('btn-close-help')?.addEventListener('click', () => this.shortcutsModal?.classList.add('hidden'));
    this.shortcutsModal?.addEventListener('click', (e) => {
      if (e.target === this.shortcutsModal) this.shortcutsModal.classList.add('hidden');
    });

    window.addEventListener('keydown', (e) => this.handleKeydown(e));
    window.addEventListener('resize', () => this.fitDeck());
    window.addEventListener('hashchange', () => {
      const hashId = window.location.hash.replace(/^#/, '').trim().toLowerCase();
      const idx = this.slides.findIndex((s) => s.id === hashId);
      if (idx >= 0 && idx !== this.index) this.goTo(idx);
    });

    // Tombol & slider yang diklik dengan mouse dilepas fokusnya agar panah dan spasi tetap mengendalikan slide
    document.addEventListener('click', (e) => {
      const button = e.target.closest?.('button');
      if (button && e.detail > 0) button.blur();
    });
    document.addEventListener('change', (e) => {
      if (e.target.type === 'range') e.target.blur();
    });
  }

  isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || el.isContentEditable === true;
  }

  handleKeydown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Escape') {
      this.shortcutsModal?.classList.add('hidden');
      if (this.notesOpen) this.toggleNotes(false);
      if (this.isTypingTarget(e.target)) e.target.blur?.();
      return;
    }

    if (this.isTypingTarget(e.target)) return;

    const onButton = e.target?.tagName === 'BUTTON';
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (key === 'ArrowRight' || key === 'PageDown' || ((key === ' ' || key === 'Enter') && !onButton)) {
      e.preventDefault();
      this.next();
    } else if (key === 'ArrowLeft' || key === 'PageUp') {
      e.preventDefault();
      this.prev();
    } else if (key === 'Home') {
      e.preventDefault();
      this.goTo(0);
    } else if (key === 'End') {
      e.preventDefault();
      this.goTo(this.slides.length - 1);
    } else if (key >= '1' && key <= '9' && key.length === 1) {
      const chapter = this.chapters[Number(key) - 1];
      if (chapter) {
        e.preventDefault();
        this.goTo(chapter.indices[0]);
      }
    } else if (key === 'f') {
      e.preventDefault();
      this.toggleFullscreen();
    } else if (key === 'n') {
      e.preventDefault();
      this.toggleNotes();
    } else if (key === '?' || key === 'h') {
      e.preventDefault();
      this.shortcutsModal?.classList.toggle('hidden');
    } else if (key === 'p' && this.activeHooks?.togglePlay) {
      e.preventDefault();
      this.activeHooks.togglePlay();
    } else if (key === 's' && this.activeHooks?.step) {
      e.preventDefault();
      this.activeHooks.step();
    } else if (key === 'r' && this.activeHooks?.reset) {
      e.preventDefault();
      this.activeHooks.reset();
    }
  }

  next() {
    if (this.beat < this.beatsOf(this.slides[this.index]) - 1) {
      this.setBeat(this.beat + 1);
    } else if (this.index < this.slides.length - 1) {
      this.goTo(this.index + 1);
    }
  }

  prev() {
    if (this.beat > 0) {
      this.setBeat(this.beat - 1);
    } else if (this.index > 0) {
      this.goTo(this.index - 1, { atEnd: true });
    }
  }

  setBeat(beat) {
    this.beat = beat;
    this.activeHooks?.setBeat?.(beat);
    this.updateRail();
  }

  toggleNotes(forceState) {
    this.notesOpen = typeof forceState === 'boolean' ? forceState : !this.notesOpen;
    this.notesDrawer?.classList.toggle('hidden', !this.notesOpen);
    document.getElementById('btn-notes')?.setAttribute('aria-pressed', String(this.notesOpen));
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  /**
   * @param {number} index - Slide tujuan
   * @param {{atEnd?: boolean}} [options] - atEnd membuka slide pada beat terakhirnya (saat mundur)
   */
  goTo(index, { atEnd = false } = {}) {
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

    const previousChapter = this.activeEl ? this.slides[this.index].chapter.id : null;
    const direction = index >= this.index ? 'forward' : 'backward';
    const slide = this.slides[index];
    this.index = index;
    this.beat = 0;

    document.body.dataset.chapter = slide.chapter.id;

    if (this.activeEl) {
      const leaving = this.activeEl;
      leaving.classList.add('leaving', `leaving-${direction}`);
      setTimeout(() => leaving.remove(), this.reducedMotion ? 0 : LEAVE_MS);
    }

    const panel = document.createElement('section');
    panel.className = `slide entering-${direction}`;
    panel.id = `slide-${slide.id}`;
    panel.setAttribute('aria-label', slide.title);
    this.stageEl?.appendChild(panel);
    this.activeEl = panel;

    const mountResult = slide.mount(panel, {
      reducedMotion: this.reducedMotion,
      registerHooks: (hooks) => {
        this.activeHooks = { ...this.activeHooks, ...hooks };
      }
    });
    if (typeof mountResult === 'function') this.activeCleanup = mountResult;

    if (atEnd && this.beatsOf(slide) > 1) this.setBeat(this.beatsOf(slide) - 1);

    if (previousChapter && previousChapter !== slide.chapter.id) this.playChapterWipe(slide.chapter.label);

    this.updateRail();

    if (this.notesTitle) this.notesTitle.textContent = slide.title;
    if (this.notesContent) this.notesContent.innerHTML = slide.notes || '';

    try {
      window.history.replaceState(null, '', `#${slide.id}`);
    } catch (_e) {
      // Riwayat bisa dibatasi pada protokol file://
    }
  }

  playChapterWipe(label) {
    if (!this.wipeEl || this.reducedMotion) return;
    this.wipeEl.textContent = label;
    this.wipeEl.classList.remove('play');
    void this.wipeEl.offsetWidth; // Memaksa reflow supaya animasi bisa diputar ulang
    this.wipeEl.classList.add('play');
  }

  updateRail() {
    const beats = this.beatsOf(this.slides[this.index]);
    const progress = (this.beat + 1) / beats;
    (this.railSegs || []).forEach((seg, i) => {
      const fill = i < this.index ? 1 : i === this.index ? progress : 0;
      seg.style.setProperty('--fill', String(fill));
      seg.classList.toggle('current', i === this.index);
    });
    const currentChapter = this.slides[this.index].chapter.id;
    (this.railChapters || []).forEach((el) => {
      el.classList.toggle('current', el.dataset.chapter === currentChapter);
    });
    if (this.counterEl) this.counterEl.textContent = `${this.index + 1} / ${this.slides.length}`;
  }
}

  exports.DeckController = DeckController;
  },
  "slides/index.js": function(exports, __require) {
const {  pembukaSlides  } = __require("slides/pembukaSlides.js");
const {  sflaSlides  } = __require("slides/sflaSlides.js");
const {  wcaSlides  } = __require("slides/wcaSlides.js");
const {  kasusSlides  } = __require("slides/kasusSlides.js");
const slides = [...pembukaSlides, ...sflaSlides, ...wcaSlides, ...kasusSlides];

  exports.slides = slides;
  },
  "slides/pembukaSlides.js": function(exports, __require) {
/**
 * Bab pembuka: judul, masalah penjadwalan cloud, dan alasan memakai metaheuristik.
 */
const {  clamp01, easeBack, easeOut, lerp, seg  } = __require("render/stage.js");
const { 
  COLORS,
  arcPoint,
  drawArrow,
  drawCross,
  drawDrop,
  drawFrog,
  drawGlow,
  drawPill,
  drawStar,
  drawText,
  fillBackground
 } = __require("render/sprites.js");
const {  mountScene, noise  } = __require("slides/common.js");
const {  DEFAULT_VMS, computeRoundRobinBaseline, generateCloudTasks  } = __require("algorithms/cloudScheduling.js");

const NIGHT_STOPS = ['#03132b', '#071f42', '#03132b'];
const TEAM_STORAGE_KEY = 'soka_its_team_identity_v2';
const DEFAULT_TEAM = 'Klik untuk isi nama & NRP';

/* ---------- Slide: Judul ---------- */

const TITLE_CENTER = { x: 1370, y: 520 };

function drawTopoRings(ctx, center, t) {
  ctx.save();
  for (let r = 1; r <= 10; r++) {
    ctx.beginPath();
    for (let a = 0; a <= 64; a++) {
      const angle = (a / 64) * Math.PI * 2;
      const wobble = 1 + Math.sin(angle * 3 + r) * 0.05 + Math.sin(angle * 5 - r * 1.7 + t * 0.12) * 0.03;
      const radius = r * 62 * wobble;
      const x = center.x + Math.cos(angle) * radius * 1.12;
      const y = center.y + Math.sin(angle) * radius * 0.92;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    // Sisi kiri cincin kolam (tosca), sisi kanan air (biru)
    const grad = ctx.createLinearGradient(center.x - 620, 0, center.x + 620, 0);
    const a = 0.46 - r * 0.028;
    grad.addColorStop(0, `rgba(95, 224, 210, ${a})`);
    grad.addColorStop(0.5, `rgba(253, 187, 22, ${a * 0.6})`);
    grad.addColorStop(1, `rgba(159, 220, 247, ${a})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawTitleScene(ctx, { t }) {
  fillBackground(ctx, 1920, 1080, NIGHT_STOPS);
  const center = TITLE_CENTER;
  drawTopoRings(ctx, center, t);
  drawGlow(ctx, center.x, center.y, 300, 'rgba(253, 187, 22, 0.22)');

  // Katak melompat dari tepi kiri menuju pusat
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.62 + (i / 6) * 0.78);
    const cycle = (t / 9 + i / 7) % 1;
    const hops = 5;
    const hopIndex = Math.floor(cycle * hops);
    const hopP = seg((cycle * hops) % 1, 0, 0.5);
    const radiusAt = (k) => lerp(600, 90, k / hops);
    const radius = lerp(radiusAt(hopIndex), radiusAt(hopIndex + 1), hopP);
    const wiggle = Math.sin(hopIndex * 2.4 + i) * 0.1;
    const x = center.x + Math.cos(angle + wiggle) * radius * 1.12;
    const y = center.y + Math.sin(angle + wiggle) * radius * 0.92;
    drawFrog(ctx, x, y, 28, COLORS.toscaLight, {
      angle: angle - Math.PI / 2,
      lift: Math.sin(Math.PI * hopP) * 34,
      alpha: Math.min(1, (1 - cycle) * 5, cycle * 12)
    });
  }

  // Tetesan mengalir berputar dari tepi kanan menuju pusat
  for (let i = 0; i < 16; i++) {
    const cycle = (t / 7 + noise(i)) % 1;
    const radius = lerp(620, 70, cycle);
    const angle = -Math.PI * 0.42 + (i / 15) * Math.PI * 0.84 + cycle * 1.1;
    const x = center.x + Math.cos(angle) * radius * 1.12;
    const y = center.y + Math.sin(angle) * radius * 0.92;
    drawDrop(ctx, x, y, 13, COLORS.skyLight, {
      angle: angle + Math.PI + 0.6,
      alpha: Math.min(1, (1 - cycle) * 5, cycle * 10)
    });
  }

  drawStar(ctx, center.x, center.y, 44 + Math.sin(t * 2) * 3);
}

/* ---------- Slide: Masalah ---------- */

const VM_BASE_Y = 910;
const VM_W = 250;
const vmX = (i) => 300 + i * 360;
const QUEUE_Y = 318;
const SECOND_PX = 30;

function buildProblemData() {
  const tasks = generateCloudTasks(16, 42);
  const schedule = computeRoundRobinBaseline(tasks, DEFAULT_VMS);
  const heights = new Array(DEFAULT_VMS.length).fill(0);
  const blocks = tasks.map((task, i) => {
    const vm = schedule.assignment[i];
    const height = (task.mi / DEFAULT_VMS[vm].mips) * SECOND_PX;
    const y = VM_BASE_Y - heights[vm] - height;
    heights[vm] += height;
    return { vm, y, height, queueX: 90 + i * 110, name: task.name };
  });
  return { blocks, heights, makespan: schedule.makespan };
}

const TASK_COLORS = ['#7fd0ff', '#5fe0d2', '#ffc66b', '#f9a071'];

function drawProblemScene(data) {
  return (ctx, { bt, beat }) => {
    fillBackground(ctx, 1920, 1080, NIGHT_STOPS);
    const time = beat === 0 ? bt : 60;
    const dim = beat === 0 ? 1 : 1 - seg(bt, 0, 0.5) * 0.8;
    const maxHeight = Math.max(...data.heights);

    ctx.save();
    ctx.globalAlpha = dim;

    DEFAULT_VMS.forEach((vm, i) => {
      const x = vmX(i);
      ctx.beginPath();
      ctx.roundRect(x, VM_BASE_Y - maxHeight - 26, VM_W, maxHeight + 26, 16);
      ctx.fillStyle = 'rgba(159, 220, 247, 0.06)';
      ctx.fill();
      ctx.fillStyle = '#c7d7ec';
      ctx.fillRect(x - 12, VM_BASE_Y, VM_W + 24, 6);
      drawText(ctx, `VM-${i + 1}`, x + 10, VM_BASE_Y + 44, { size: 32, weight: 800 });
      drawText(ctx, `${vm.mips} MIPS`, x + VM_W - 8, VM_BASE_Y + 44, { size: 26, mono: true, color: COLORS.muted, align: 'right' });
    });

    data.blocks.forEach((block, i) => {
      const fly = seg(time, 0.5 + i * 0.26, 0.7);
      const appear = seg(time, i * 0.03, 0.3, easeBack);
      const from = { x: block.queueX, y: QUEUE_Y };
      const to = { x: vmX(block.vm), y: block.y };
      const pos = arcPoint(from, to, 80, fly);
      const w = lerp(96, VM_W, fly);
      const h = lerp(66, block.height - 3, fly);
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, w, Math.max(3, h * appear), 10);
      ctx.fillStyle = TASK_COLORS[block.vm];
      ctx.fill();
      if (h > 26) {
        drawText(ctx, block.name, pos.x + w / 2, pos.y + h / 2, { size: 25, weight: 800, color: COLORS.night, align: 'center', mono: true });
      }
    });

    // Makespan: VM paling sibuk menentukan kapan semua tugas selesai
    const line = seg(time, 5.2, 0.7);
    const lineY = VM_BASE_Y - maxHeight;
    if (line > 0) {
      ctx.save();
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 5;
      ctx.setLineDash([18, 12]);
      ctx.beginPath();
      ctx.moveTo(240, lineY);
      ctx.lineTo(lerp(240, 1660, line), lineY);
      ctx.stroke();
      ctx.restore();
      drawPill(ctx, `Makespan ${data.makespan.toFixed(1)} dtk`, 1730, lineY, { size: 30, fill: COLORS.danger, alpha: line, weight: 800 });
    }
    ctx.restore();

    if (beat === 1) {
      const count = seg(bt, 0.3, 2.2, easeOut);
      const value = Math.floor(Math.pow(4, 16) * count);
      drawText(ctx, '4¹⁶', 960, 480, { size: 150, weight: 800, align: 'center', color: COLORS.gold, alpha: seg(bt, 0.1, 0.4) });
      drawText(ctx, value.toLocaleString('id-ID'), 960, 660, { size: 128, weight: 800, align: 'center', mono: true });
      drawText(ctx, 'kemungkinan jadwal', 960, 790, { size: 46, weight: 600, align: 'center', color: COLORS.muted, alpha: seg(bt, 2, 0.5) });
    }
  };
}

/* ---------- Slide: Lanskap ---------- */

const terrainValue = (u) => (u * u) / 25 * 0.62 + (0.38 * (1 - Math.cos((2 * Math.PI * u) / 1.6))) / 2;
const terrainX = (u) => 960 + u * 180;
const terrainY = (u) => 940 - terrainValue(u) * 520;

// Bola greedy: turun mengikuti kemiringan lokal hingga berhenti di lembah terdekat
const GREEDY_PATH = (() => {
  const path = [-4.05];
  for (let i = 0; i < 240; i++) {
    const u = path[path.length - 1];
    const slope = (terrainValue(u + 0.001) - terrainValue(u - 0.001)) / 0.002;
    path.push(u - slope * 0.035);
  }
  return path;
})();

const AGENT_COUNT = 16;
const AGENT_HOPS = 9;
const AGENT_PATHS = Array.from({ length: AGENT_COUNT }, (_, i) => {
  const path = [lerp(-4.7, 4.7, i / (AGENT_COUNT - 1))];
  for (let k = 0; k < AGENT_HOPS; k++) {
    const u = path[path.length - 1];
    const reach = 0.35 + noise(i * 13 + k) * 1.1;
    path.push(u * (1 - reach) + (noise(i + k * 7) - 0.5) * 0.9 * (1 - k / AGENT_HOPS));
  }
  path.push((noise(i + 77) - 0.5) * 0.3);
  return path;
});

function drawTerrain(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, 1080);
  for (let px = 0; px <= 1920; px += 8) {
    const u = (px - 960) / 180;
    ctx.lineTo(px, terrainY(u));
  }
  ctx.lineTo(1920, 1080);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 400, 0, 1080);
  grad.addColorStop(0, '#1c6e8a');
  grad.addColorStop(1, '#0a2d55');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = COLORS.skyLight;
  ctx.lineWidth = 5;
  ctx.stroke();
}

const BALL_R = 22;

function drawBall(ctx, u, color, lift = 0, radius = BALL_R) {
  const x = terrainX(u);
  const y = terrainY(u) - radius - lift;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.strokeStyle = COLORS.night;
  ctx.lineWidth = 4;
  ctx.fill();
  ctx.stroke();
  return { x, y };
}

function drawLandscapeScene(ctx, { bt, beat }) {
  fillBackground(ctx, 1920, 1080, NIGHT_STOPS);
  drawTerrain(ctx);

  const optimum = { x: terrainX(0), y: terrainY(0) };

  if (beat === 0) {
    for (let i = 0; i < 12; i++) {
      const u = lerp(-4.6, 4.6, noise(i + 21));
      drawBall(ctx, u, COLORS.ink, 0, 20 * seg(bt, 0.2 + i * 0.1, 0.4, easeBack));
    }
    // Penjelasan: tinggi titik = nilai makespan jadwal tersebut
    const u = 3.2;
    const top = terrainY(u) - 44;
    const appear = seg(bt, 1.8, 0.6);
    drawBall(ctx, u, COLORS.gold, 0, 26 * seg(bt, 1.6, 0.4, easeBack));
    drawArrow(ctx, { x: terrainX(u) + 74, y: 1010 }, { x: terrainX(u) + 74, y: top }, {
      color: COLORS.gold,
      width: 6,
      progress: appear
    });
    drawPill(ctx, 'tinggi = makespan', terrainX(u) + 74, top - 44, { size: 32, alpha: seg(bt, 2.3, 0.4) });
    drawPill(ctx, 'titik = satu jadwal', terrainX(u) - 90, top - 110, { size: 32, fill: COLORS.ink, alpha: seg(bt, 1.8, 0.4) });
    return;
  }

  drawStar(ctx, optimum.x, optimum.y + 26, 34);

  if (beat === 1) {
    const roll = seg(bt, 0.5, 2.4, easeOut);
    const u = GREEDY_PATH[Math.floor(roll * (GREEDY_PATH.length - 1))];
    const ball = drawBall(ctx, u, COLORS.coral);
    const stuck = seg(bt, 3, 0.4);
    if (stuck > 0) {
      drawCross(ctx, ball.x, ball.y - 72, 20, COLORS.danger, stuck);
      drawPill(ctx, 'minimum lokal', ball.x, ball.y - 138, { size: 34, fill: COLORS.danger, alpha: stuck });
      drawPill(ctx, 'minimum global', optimum.x + 40, optimum.y - 90, { size: 32, alpha: seg(bt, 3.5, 0.5) });
    }
    return;
  }

  // Beat 3: populasi menjelajah dulu, lalu berkumpul di lembah terdalam
  const hopSeconds = 0.8;
  const clock = bt / hopSeconds;
  const index = Math.min(AGENT_HOPS, Math.floor(clock));
  const hopP = index >= AGENT_HOPS ? 1 : seg(clock - index, 0, 0.72);

  AGENT_PATHS.forEach((path, i) => {
    const u = lerp(path[index], path[Math.min(path.length - 1, index + 1)], hopP);
    const lift = index >= AGENT_HOPS ? 0 : Math.sin(Math.PI * hopP) * 90;
    drawBall(ctx, u, i === 7 ? COLORS.gold : COLORS.toscaLight, lift, 20);
  });

  const exploring = clamp01(1 - clock / 4);
  const exploiting = clamp01((clock - 4) / 2);
  drawPill(ctx, 'Eksplorasi', 620, 300, { size: 40, fill: COLORS.toscaLight, alpha: 0.28 + exploring * 0.72, weight: 800 });
  drawPill(ctx, 'Eksploitasi', 1300, 300, { size: 40, alpha: 0.28 + exploiting * 0.72, weight: 800 });
  drawArrow(ctx, { x: 790, y: 300 }, { x: 1120, y: 300 }, { color: COLORS.ink, width: 5, progress: seg(clock, 2, 3, easeOut) });
}

/* ---------- Registri slide ---------- */

const CHAPTER = { id: 'pembuka', label: 'Pembuka' };
const pembukaSlides = [
  {
    id: 'judul',
    chapter: CHAPTER,
    title: 'Judul',
    notes: `
      <p>Sapa audiens dan sebutkan topik: dua algoritma metaheuristik dari alam, SFLA dan WCA, untuk menjadwalkan tugas di komputasi awan.</p>
      <p>Klik baris nama untuk mengisi anggota kelompok. Isinya tersimpan otomatis di browser ini.</p>`,
    mount(container, ctx) {
      let team = DEFAULT_TEAM;
      try {
        const stored = localStorage.getItem(TEAM_STORAGE_KEY);
        if (stored && stored.trim()) team = stored.trim();
      } catch (_e) {
        // Penyimpanan bisa saja dibatasi peramban; nama bawaan tetap dipakai
      }

      const cleanup = mountScene(container, ctx, {
        kicker: 'Strategi Optimasi Komputasi Awan · ITS',
        beats: [{ title: 'SFLA × WCA', sub: 'Optimasi penjadwalan tugas pada komputasi awan dengan algoritma metaheuristik.' }],
        draw: drawTitleScene,
        extraHtml: `<div class="team" id="team-line" contenteditable="true" spellcheck="false" role="textbox" aria-label="Nama kelompok dan NRP"></div>`
      });

      const teamEl = container.querySelector('#team-line');
      if (teamEl) {
        teamEl.textContent = team;
        teamEl.addEventListener('input', () => {
          try {
            localStorage.setItem(TEAM_STORAGE_KEY, teamEl.textContent || '');
          } catch (_e) {
            // Penyimpanan bisa saja dibatasi peramban; perubahan hanya berlaku sampai halaman ditutup
          }
        });
      }
      container.classList.add('slide-title');
      return cleanup;
    }
  },
  {
    id: 'masalah',
    chapter: CHAPTER,
    title: 'Masalah: Penjadwalan Tugas Cloud',
    beats: 2,
    notes: `
      <ul>
        <li>Broker cloud harus menempatkan 16 tugas ke 4 VM yang kecepatannya berbeda. Tampilan ini memakai jadwal Round-Robin dengan data yang sama seperti studi kasus.</li>
        <li><strong>Makespan</strong> = waktu selesai VM tersibuk, dan itulah yang ingin diperkecil.</li>
        <li>Beat 2: 16 tugas ke 4 VM menghasilkan 4<sup>16</sup> &asymp; 4,29 miliar jadwal. Inilah alasan kita tidak mencoba semuanya.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'Masalah',
        beats: [
          { title: 'Tugas ini dijalankan di VM mana?' },
          { title: 'Mustahil dicoba satu per satu.' }
        ],
        draw: drawProblemScene(buildProblemData())
      });
    }
  },
  {
    id: 'lanskap',
    chapter: CHAPTER,
    title: 'Mengapa Metaheuristik',
    beats: 3,
    notes: `
      <p>Lanskap ini ilustrasi, bukan data dari algoritma.</p>
      <ul>
        <li>Bayangkan setiap jadwal sebagai satu titik, dengan ketinggian sebesar makespan-nya. Mencari jadwal terbaik = mencari titik terendah.</li>
        <li>Pencarian greedy hanya mengikuti turunan terdekat dan berhenti di minimum lokal.</li>
        <li>Metaheuristik memakai banyak solusi sekaligus: <strong>eksplorasi</strong> menjelajah luas, lalu <strong>eksploitasi</strong> memusatkan pencarian. Tidak dijamin menemukan yang paling optimal, tetapi solusi yang baik didapat dengan cepat.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'Metaheuristik',
        beats: [
          { title: 'Setiap jadwal adalah satu titik.' },
          { title: 'Satu solusi mudah terjebak.' },
          { title: 'Populasi mencari lebih luas.' }
        ],
        draw: drawLandscapeScene
      });
    }
  }
];

  exports.pembukaSlides = pembukaSlides;
  },
  "render/stage.js": function(exports, __require) {
/**
 * Panggung animasi scene presentasi.
 * Scene digambar dalam koordinat tetap 1920x1080 (sama dengan ukuran deck) sehingga tata letak
 * kanvas dan teks DOM selalu sejajar di resolusi apa pun.
 */
const DECK_W = 1920;
const DECK_H = 1080;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

/** Kemajuan 0..1 (dengan easing) dari sebuah segmen waktu pada garis waktu animasi. */
function seg(time, start, duration, ease = easeInOut) {
  return ease(clamp01((time - start) / Math.max(1e-6, duration)));
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {(ctx: CanvasRenderingContext2D, frame: {t:number, bt:number, beat:number, dt:number}) => void} draw
 *   t = detik sejak scene dibuka, bt = detik sejak beat aktif dimulai, dt = selisih antar-frame.
 * @param {{reducedMotion?: boolean, width?: number, height?: number}} [options]
 */
function createStage(canvas, draw, { reducedMotion = false, width = DECK_W, height = DECK_H } = {}) {
  let rafId = null;
  let startTime = null;
  let beatStart = null;
  let lastTime = null;
  let beat = 0;

  function frame(now) {
    if (startTime === null) startTime = now;
    if (beatStart === null) beatStart = now;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bufferW = Math.max(10, Math.floor(rect.width * dpr));
    const bufferH = Math.max(10, Math.floor(rect.height * dpr));
    if (canvas.width !== bufferW || canvas.height !== bufferH) {
      canvas.width = bufferW;
      canvas.height = bufferH;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(bufferW / width, 0, 0, bufferH / height, 0, 0);

    const dt = lastTime === null ? 0 : Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // prefers-reduced-motion: gerakan dibekukan dan tiap beat langsung tampil pada kondisi akhirnya
    draw(ctx, {
      t: reducedMotion ? 0 : (now - startTime) / 1000,
      bt: reducedMotion ? 60 : (now - beatStart) / 1000,
      beat,
      dt
    });

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  return {
    setBeat(next) {
      beat = next;
      beatStart = null;
    },
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

  exports.seg = seg;
  exports.createStage = createStage;
  exports.DECK_W = DECK_W;
  exports.DECK_H = DECK_H;
  exports.clamp01 = clamp01;
  exports.lerp = lerp;
  exports.easeInOut = easeInOut;
  exports.easeOut = easeOut;
  exports.easeBack = easeBack;
  },
  "render/sprites.js": function(exports, __require) {
/**
 * Kumpulan gambar vektor Canvas 2D yang dipakai bersama oleh scene dan renderer simulasi:
 * katak, daun teratai, riak, tetesan, awan, bintang optimum, panah, dan label.
 */
const COLORS = {
  ink: '#f2f7ff',
  muted: '#a9bbd6',
  night: '#03132b',
  navy: '#0b1b34',
  gold: '#fdbb16',
  tosca: '#12b0a2',
  toscaLight: '#5fe0d2',
  sky: '#26aee4',
  skyLight: '#9fdcf7',
  coral: '#f47d52',
  danger: '#ff6b70',
  blue: '#127bbe'
};
const FONT_BODY = '"Inter", sans-serif';
const FONT_MONO = '"JetBrains Mono", monospace';
function drawText(ctx, text, x, y, options = {}) {
  const { size = 30, weight = 700, color = COLORS.ink, align = 'left', mono = false, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_BODY}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Label di dalam kapsul berwarna; (x, y) adalah titik tengah kapsul. */
function drawPill(ctx, text, x, y, options = {}) {
  const { size = 28, weight = 700, color = COLORS.night, fill = COLORS.gold, alpha = 1, mono = false } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_BODY}`;
  const w = ctx.measureText(text).width + size * 1.2;
  const h = size * 1.75;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}
function fillBackground(ctx, width, height, stops) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  stops.forEach((color, i) => grad.addColorStop(i / Math.max(1, stops.length - 1), color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
function drawGlow(ctx, x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
function drawCrown(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(-size * 1.1, -size * 1.05);
  ctx.lineTo(-size * 0.42, -size * 0.5);
  ctx.lineTo(0, -size * 1.3);
  ctx.lineTo(size * 0.42, -size * 0.5);
  ctx.lineTo(size * 1.1, -size * 1.05);
  ctx.lineTo(size, 0);
  ctx.closePath();
  ctx.fillStyle = COLORS.gold;
  ctx.strokeStyle = COLORS.night;
  ctx.lineWidth = Math.max(1, size * 0.2);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Katak tampak atas. `size` kira-kira setengah lebar badan, `angle` 0 berarti menghadap ke atas,
 * dan `lift` mengangkat katak dari bayangannya saat melompat.
 */
function drawFrog(ctx, x, y, size, color, options = {}) {
  const { angle = 0, lift = 0, crown = false, alpha = 1, outline = '#04201f', ring = null } = options;
  const airborne = lift > 0.5;
  const legReach = airborne ? 0.62 : 0;

  ctx.save();
  ctx.globalAlpha *= alpha;

  if (airborne) {
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.3, size * 0.95, size * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 12, 28, 0.38)';
    ctx.fill();
  }

  ctx.translate(x, y - lift);

  if (ring) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.75, 0, Math.PI * 2);
    ctx.strokeStyle = ring;
    ctx.lineWidth = Math.max(2, size * 0.2);
    ctx.stroke();
  }

  ctx.save();
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const limbPaths = [
    // Kaki belakang menekuk saat diam dan terentang saat melompat
    [[-0.5, 0.4], [-1.22, 0.42 + legReach * 0.5], [-0.72, 1.02 + legReach]],
    [[0.5, 0.4], [1.22, 0.42 + legReach * 0.5], [0.72, 1.02 + legReach]],
    // Kaki depan
    [[-0.48, -0.32], [-0.94, -0.5], [-0.9, -0.92 - legReach * 0.4]],
    [[0.48, -0.32], [0.94, -0.5], [0.9, -0.92 - legReach * 0.4]]
  ];
  for (const [strokeColor, widthFactor] of [[outline, 0.42], [color, 0.24]]) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size * widthFactor;
    for (const [a, b, c] of limbPaths) {
      ctx.beginPath();
      ctx.moveTo(a[0] * size, a[1] * size);
      ctx.quadraticCurveTo(b[0] * size, b[1] * size, c[0] * size, c[1] * size);
      ctx.stroke();
    }
  }

  ctx.beginPath();
  ctx.ellipse(0, size * 0.06, size * 0.76, size * 0.92, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(1, size * 0.12);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, size * 0.22, size * 0.38, size * 0.48, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fill();

  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(dir * size * 0.42, -size * 0.66, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = outline;
    ctx.lineWidth = Math.max(1, size * 0.09);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(dir * size * 0.42, -size * 0.72, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.night;
    ctx.fill();
  }
  ctx.restore();

  if (crown) drawCrown(ctx, 0, -size * 1.12, size * 0.56);
  ctx.restore();
}
function drawLilyPad(ctx, x, y, radius, rotation = 0, options = {}) {
  const { fill = '#1c8f6d', edge = '#3fc493', flower = false, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(1, 0.84);
  ctx.rotate(rotation);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, 0.24, Math.PI * 2 - 0.24);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1.5, radius * 0.035);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(190, 255, 225, 0.2)';
  ctx.lineWidth = Math.max(1, radius * 0.02);
  for (let i = 1; i <= 6; i++) {
    const a = 0.24 + (i / 7) * (Math.PI * 2 - 0.48);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9);
    ctx.stroke();
  }

  if (flower) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * radius * 0.16 - radius * 0.3,
        Math.sin(a) * radius * 0.16,
        radius * 0.16,
        radius * 0.08,
        a,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#ffd1e4';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(-radius * 0.3, 0, radius * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
  }
  ctx.restore();
}

/** Riak air; `progress` 0..1 membesar sambil memudar. */
function drawRipple(ctx, x, y, progress, color = '#bff5ea', maxRadius = 60) {
  if (progress <= 0 || progress >= 1) return;
  ctx.save();
  ctx.strokeStyle = color;
  for (const delay of [0, 0.22]) {
    const p = (progress - delay) / (1 - delay);
    if (p <= 0) continue;
    ctx.globalAlpha = (1 - p) * 0.85;
    ctx.lineWidth = Math.max(1.2, maxRadius * 0.05 * (1 - p));
    ctx.beginPath();
    ctx.ellipse(x, y, maxRadius * p, maxRadius * p * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Tetesan air; `angle` adalah arah gerak dan ujung lancipnya berada di belakang gerakan. */
function drawDrop(ctx, x, y, size, color = COLORS.skyLight, options = {}) {
  const { angle = Math.PI / 2, outline = '#04213f', alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-size * 1.7, 0);
  ctx.bezierCurveTo(-size * 0.7, -size * 0.28, -size * 0.3, -size * 0.92, size * 0.25, -size * 0.92);
  ctx.bezierCurveTo(size * 0.86, -size * 0.92, size, -size * 0.34, size, 0);
  ctx.bezierCurveTo(size, size * 0.34, size * 0.86, size * 0.92, size * 0.25, size * 0.92);
  ctx.bezierCurveTo(-size * 0.3, size * 0.92, -size * 0.7, size * 0.28, -size * 1.7, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(1, size * 0.14);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.3, -size * 0.32, size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fill();
  ctx.restore();
}
function drawCloud(ctx, x, y, size, color = '#dbe9f8', alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.fillStyle = color;
  const lobes = [
    [-1.05, 0.14, 0.55],
    [-0.42, -0.26, 0.74],
    [0.36, -0.14, 0.64],
    [1.02, 0.16, 0.5]
  ];
  ctx.beginPath();
  for (const [lx, ly, lr] of lobes) {
    ctx.moveTo(lx * size + lr * size, ly * size);
    ctx.arc(lx * size, ly * size, lr * size, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-1.55 * size, 0.06 * size, 3.1 * size, 0.62 * size, 0.3 * size);
  ctx.fill();
  ctx.restore();
}
function drawStar(ctx, x, y, size, options = {}) {
  const { glow = true, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow) drawGlow(ctx, x, y, size * 2.8, 'rgba(253, 187, 22, 0.62)');
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size * 0.44;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.gold;
  ctx.strokeStyle = COLORS.night;
  ctx.lineWidth = Math.max(1, size * 0.14);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Titik pada kurva kuadratik dari `from` ke `to` dengan lengkungan `bend` ke atas. */
function arcPoint(from, to, bend, p) {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 - bend;
  const q = 1 - p;
  return {
    x: q * q * from.x + 2 * q * p * cx + p * p * to.x,
    y: q * q * from.y + 2 * q * p * cy + p * p * to.y
  };
}

/** Panah melengkung yang tergambar bertahap sesuai `progress`. */
function drawArrow(ctx, from, to, options = {}) {
  const { bend = 0, color = COLORS.ink, width = 4, progress = 1, dashed = false, alpha = 1, head = true } = options;
  if (progress <= 0) return;
  const tip = arcPoint(from, to, bend, progress);
  const before = arcPoint(from, to, bend, Math.max(0, progress - 0.03));
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([width * 3, width * 2.4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  const steps = Math.max(2, Math.ceil(progress * 28));
  for (let i = 1; i <= steps; i++) {
    const pt = arcPoint(from, to, bend, (i / steps) * progress);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  if (head) {
    const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
    const len = width * 4;
    ctx.beginPath();
    ctx.moveTo(tip.x + Math.cos(angle) * len * 0.3, tip.y + Math.sin(angle) * len * 0.3);
    ctx.lineTo(tip.x - Math.cos(angle - 0.5) * len, tip.y - Math.sin(angle - 0.5) * len);
    ctx.lineTo(tip.x - Math.cos(angle + 0.5) * len, tip.y - Math.sin(angle + 0.5) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function drawCross(ctx, x, y, size, color = COLORS.danger, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.32);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
  ctx.restore();
}

  exports.drawText = drawText;
  exports.drawPill = drawPill;
  exports.fillBackground = fillBackground;
  exports.drawGlow = drawGlow;
  exports.drawCrown = drawCrown;
  exports.drawFrog = drawFrog;
  exports.drawLilyPad = drawLilyPad;
  exports.drawRipple = drawRipple;
  exports.drawDrop = drawDrop;
  exports.drawCloud = drawCloud;
  exports.drawStar = drawStar;
  exports.arcPoint = arcPoint;
  exports.drawArrow = drawArrow;
  exports.drawCross = drawCross;
  exports.COLORS = COLORS;
  exports.FONT_BODY = FONT_BODY;
  exports.FONT_MONO = FONT_MONO;
  },
  "slides/common.js": function(exports, __require) {
/**
 * Kerangka bersama scene presentasi: kanvas layar penuh + teks singkat yang berganti per beat.
 */
const {  createStage  } = __require("render/stage.js");

/**
 * @param {HTMLElement} container
 * @param {Object} ctx - Konteks mount dari DeckController ({ reducedMotion, registerHooks })
 * @param {Object} options
 * @param {string} options.kicker - Label kecil di atas judul
 * @param {Array<{title:string, sub?:string}>} options.beats - Teks tiap beat
 * @param {Function} options.draw - Fungsi gambar kanvas dalam koordinat 1920x1080
 * @param {string[]} [options.steps] - Daftar tahap yang disorot sesuai beat aktif
 * @param {string} [options.extraHtml] - Elemen DOM tambahan di atas kanvas
 */
function mountScene(container, { reducedMotion, registerHooks }, options) {
  const { kicker, beats, draw, steps, extraHtml = '' } = options;

  const stepsHtml = steps
    ? `<ol class="scene-steps">${steps
        .map((label, i) => `<li class="scene-step" data-step="${i}"><span>${i + 1}</span>${label}</li>`)
        .join('')}</ol>`
    : '';

  container.innerHTML = `
    <canvas class="scene-canvas" id="scene-canvas"></canvas>
    <div class="scene-copy">
      <p class="kicker">${kicker}</p>
      <h1 class="headline" id="scene-title"></h1>
      <p class="sub" id="scene-sub"></p>
    </div>
    ${stepsHtml}
    ${extraHtml}
  `;

  const titleEl = container.querySelector('#scene-title');
  const subEl = container.querySelector('#scene-sub');
  const stepEls = steps ? [...container.querySelectorAll('.scene-step')] : [];
  const stage = createStage(container.querySelector('#scene-canvas'), draw, { reducedMotion });

  function setBeat(index) {
    const beat = beats[Math.min(index, beats.length - 1)];
    titleEl.textContent = beat.title;
    subEl.textContent = beat.sub || '';
    for (const el of [titleEl, subEl]) {
      el.classList.remove('copy-in');
      void el.offsetWidth; // Memaksa reflow supaya animasi masuk terulang untuk teks baru
      el.classList.add('copy-in');
    }
    stepEls.forEach((el, i) => el.classList.toggle('active', i === index));
    stage.setBeat(index);
  }

  setBeat(0);
  registerHooks?.({ setBeat });

  return () => stage.destroy();
}

/** Bilangan semu tetap per indeks, agar gambar scene sama setiap kali dibuka. */
function noise(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

  exports.mountScene = mountScene;
  exports.noise = noise;
  },
  "algorithms/cloudScheduling.js": function(exports, __require) {
/**
 * Mini Studi Kasus Komputasi Awan: Penjadwalan n Tugas ke m Virtual Machine (PRD Bagian 9)
 * Logika murni tanpa DOM — memetakan vektor kontinu X in [0, m)^n menjadi jadwal diskrit VM
 * menggunakan pembulatan bawah floor(X[i]) untuk meminimalkan Makespan.
 */const {  createRng  } = __require("core/rng.js");const DEFAULT_VMS = [
  { id: 0, name: 'VM-1 (Small)', mips: 85 },
  { id: 1, name: 'VM-2 (Medium)', mips: 115 },
  { id: 2, name: 'VM-3 (Large)', mips: 145 },
  { id: 3, name: 'VM-4 (X-Large)', mips: 175 }
];function generateCloudTasks(count = 16, seed = 2026) {
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
 */function decodeSchedule(vector, vmCount) {
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
 */function evaluateSchedule(vector, tasks, vms = DEFAULT_VMS) {
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
}function computeRoundRobinBaseline(tasks, vms = DEFAULT_VMS) {
  const rrVector = tasks.map((_, i) => (i % vms.length) + 0.5);
  return evaluateSchedule(rrVector, tasks, vms);
}class CloudScheduleOptimizer {
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
  },
  "core/rng.js": function(exports, __require) {
/**
 * Seedable Pseudo-Random Number Generator (Mulberry32)
 * Menjamin hasil simulasi dapat diulang persis sama dengan seed yang sama (F-13 & Kriteria #5).
 */function hashSeed(seedInput) {
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
}function createRng(seedInput = 42) {
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
  "slides/sflaSlides.js": function(exports, __require) {
/**
 * Bab SFLA: inspirasi, karakteristik, cara kerja bertahap, dan simulasi nyata.
 * Scene inspirasi & cara kerja adalah ilustrasi; hanya slide simulasi yang menjalankan SFLAEngine.
 */
const {  clamp01, easeBack, easeOut, lerp, seg  } = __require("render/stage.js");
const { 
  COLORS,
  arcPoint,
  drawArrow,
  drawCross,
  drawFrog,
  drawGlow,
  drawLilyPad,
  drawPill,
  drawRipple,
  drawText,
  fillBackground
 } = __require("render/sprites.js");
const {  MEMEPLEX_COLORS  } = __require("render/sflaRenderer.js");
const {  mountScene, noise  } = __require("slides/common.js");
const {  mountSimulation  } = __require("slides/simulation.js");
const {  SFLAEngine  } = __require("algorithms/sfla.js");
const {  SFLARenderer  } = __require("render/sflaRenderer.js");

const POND_STOPS = ['#04302f', '#06403c', '#052f33'];

function drawPondWater(ctx, t) {
  fillBackground(ctx, 1920, 1080, POND_STOPS);
  ctx.save();
  ctx.strokeStyle = 'rgba(150, 240, 220, 0.07)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 11; row++) {
    const y = 90 + row * 92;
    ctx.beginPath();
    for (let x = 0; x <= 1920; x += 40) {
      const wave = Math.sin(x * 0.009 + t * 0.7 + row * 1.7) * 13 + Math.sin(x * 0.021 - t * 0.5 + row) * 5;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------- Slide: Inspirasi ---------- */

const PADS = [
  { x: 230, y: 520, r: 104, rot: 0.4 },
  { x: 560, y: 760, r: 122, rot: 2.2, flower: true },
  { x: 500, y: 400, r: 86, rot: 4.1 },
  { x: 900, y: 560, r: 116, rot: 1.2 },
  { x: 1000, y: 860, r: 96, rot: 3.3 },
  { x: 1300, y: 690, r: 128, rot: 5.2 },
  { x: 1290, y: 340, r: 98, rot: 0.9, flower: true },
  { x: 1660, y: 520, r: 138, rot: 2.8 },
  { x: 1710, y: 860, r: 92, rot: 4.6 }
];
const FOOD = { x: 1660, y: 500 };

// Tiap katak melompat dari daun ke daun, makin lama makin dekat ke makanan
const ROUTES = [
  [0, 2, 3, 5, 7],
  [1, 3, 5, 8, 7],
  [2, 3, 6, 5, 7],
  [4, 5, 6, 7, 8]
];
const HOP_SECONDS = 1.7;

function frogOnRoute(route, time, offset) {
  const cycle = route.length - 1;
  const local = Math.max(0, time - offset) / HOP_SECONDS;
  const looped = local % (cycle + 1.6);
  const index = Math.min(cycle, Math.floor(looped));
  const hopP = index >= cycle ? 0 : clamp01((looped - index) / 0.42);
  const from = PADS[route[index]];
  const to = PADS[route[Math.min(cycle, index + 1)]];
  const pos = arcPoint(from, to, 0, easeOut(hopP));
  return {
    x: pos.x,
    y: pos.y - 10,
    lift: Math.sin(Math.PI * hopP) * 90,
    angle: Math.atan2(to.x - from.x, from.y - to.y),
    landing: hopP >= 1 ? clamp01(((looped - index) - 0.42) / 0.4) : 0,
    landedAt: to
  };
}

function drawInspirationScene(ctx, { t, bt, beat }) {
  drawPondWater(ctx, t);
  PADS.forEach((pad) => drawLilyPad(ctx, pad.x, pad.y, pad.r, pad.rot, { flower: pad.flower }));

  // Makanan: serangga berpendar di daun terbesar
  const fx = FOOD.x + Math.sin(t * 2.1) * 26;
  const fy = FOOD.y + Math.cos(t * 2.9) * 18 - 60;
  drawGlow(ctx, fx, fy, 70 + Math.sin(t * 5) * 8, 'rgba(253, 187, 22, 0.75)');
  ctx.save();
  ctx.fillStyle = '#fff4c7';
  ctx.beginPath();
  ctx.arc(fx, fy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (beat === 0) {
    ROUTES.forEach((route, i) => {
      const frog = frogOnRoute(route, t, i * 0.55);
      if (frog.landing > 0) drawRipple(ctx, frog.landedAt.x, frog.landedAt.y, frog.landing, '#bff5ea', frog.landedAt.r);
      drawFrog(ctx, frog.x, frog.y, 38, i === 0 ? COLORS.gold : COLORS.toscaLight, {
        angle: frog.angle,
        lift: frog.lift,
        crown: i === 0
      });
    });
    return;
  }

  // Beat 2: katak terbaik membagikan informasi, yang lain menoleh lalu meniru arah lompatannya
  const leader = PADS[7];
  const followers = [PADS[0], PADS[1], PADS[3], PADS[5]];
  drawFrog(ctx, leader.x - 40, leader.y + 10, 46, COLORS.gold, { angle: -0.6, crown: true });

  followers.forEach((pad, i) => {
    const turn = seg(bt, 0.3 + i * 0.25, 0.6);
    const targetAngle = Math.atan2(leader.x - pad.x, pad.y - leader.y);
    drawFrog(ctx, pad.x, pad.y - 8, 38, COLORS.toscaLight, { angle: lerp(i * 1.7, targetAngle, turn) });

    // Pulsa "meme" berjalan dari pemimpin ke pengikut
    const from = { x: leader.x - 40, y: leader.y + 10 };
    const to = { x: pad.x, y: pad.y - 8 };
    ctx.save();
    ctx.strokeStyle = 'rgba(253, 187, 22, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 14]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo((from.x + to.x) / 2, (from.y + to.y) / 2 - 150, to.x, to.y);
    ctx.stroke();
    ctx.restore();
    for (let k = 0; k < 3; k++) {
      const p = ((t * 0.42 + k / 3 + i * 0.13) % 1);
      const dot = arcPoint(from, to, 150, p);
      drawGlow(ctx, dot.x, dot.y, 26, 'rgba(253, 187, 22, 0.8)');
    }
  });
  drawPill(ctx, 'meme', 1180, 300, { size: 34, alpha: seg(bt, 0.6, 0.5) });
}

/* ---------- Slide: Karakteristik ---------- */

const CARD_W = 420;
const CARD_H = 500;
const CARD_Y = 300;
const cardX = (i) => 60 + i * (CARD_W + 40);
function drawCardFrame(ctx, index, bt, title, caption, accent) {
  const appear = seg(bt, index * 0.18, 0.6, easeOut);
  const x = cardX(index);
  ctx.globalAlpha = appear;
  ctx.translate(0, (1 - appear) * 40);
  ctx.beginPath();
  ctx.roundRect(x, CARD_Y, CARD_W, CARD_H, 28);
  ctx.fillStyle = 'rgba(2, 18, 34, 0.55)';
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, title, x + 32, CARD_Y + CARD_H - 96, { size: 38, weight: 800 });
  drawText(ctx, caption, x + 32, CARD_Y + CARD_H - 46, { size: 27, weight: 500, color: COLORS.muted });
  return x;
}
function drawParamChips(ctx, chips, bt, fill) {
  const total = chips.reduce((sum, chip) => sum + chip.w, 0) + (chips.length - 1) * 22;
  let x = (1920 - total) / 2;
  chips.forEach((chip, i) => {
    const appear = seg(bt, 0.9 + i * 0.12, 0.45, easeOut);
    drawPill(ctx, chip.label, x + chip.w / 2, 900, { size: 28, fill, alpha: appear });
    x += chip.w + 22;
  });
}

function drawTraitsScene(ctx, { t, bt }) {
  drawPondWater(ctx, t);
  const size = 22;
  const panelMidY = CARD_Y + 170;

  // 1. Memeplex: tiga kelompok berputar pelan dengan warna berbeda
  ctx.save();
  let x = drawCardFrame(ctx, 0, bt, 'Memeplex', 'Populasi dibagi kelompok', COLORS.toscaLight);
  [[x + 120, panelMidY + 40], [x + 300, panelMidY + 40], [x + 210, panelMidY - 80]].forEach(([cx, cy], g) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fillStyle = `${MEMEPLEX_COLORS[g]}22`;
    ctx.fill();
    for (let k = 0; k < 3; k++) {
      const a = t * 0.4 + (k / 3) * Math.PI * 2 + g;
      drawFrog(ctx, cx + Math.cos(a) * 44, cy + Math.sin(a) * 44, 15, MEMEPLEX_COLORS[g], { angle: a + 1.57 });
    }
  });
  ctx.restore();

  // 2. Lompatan lokal: hanya satu katak bergerak menuju yang terbaik
  ctx.save();
  x = drawCardFrame(ctx, 1, bt, 'Lompatan lokal', 'Hanya katak terburuk', COLORS.toscaLight);
  const hop = (t % 3.2) / 3.2;
  const hopP = seg(hop, 0.15, 0.4);
  const worstFrom = { x: x + 80, y: panelMidY + 90 };
  const worstTo = { x: x + 260, y: panelMidY - 50 };
  const worstPos = arcPoint(worstFrom, worstTo, 0, hopP);
  drawFrog(ctx, x + 340, panelMidY - 100, size + 6, COLORS.gold, { crown: true, angle: -0.8 });
  drawFrog(ctx, x + 300, panelMidY + 100, size, COLORS.toscaLight, { angle: 0.7 });
  drawFrog(ctx, x + 120, panelMidY - 90, size, COLORS.toscaLight, { angle: 2.1 });
  if (hopP >= 1) drawRipple(ctx, worstTo.x, worstTo.y, seg(hop, 0.55, 0.4), COLORS.toscaLight, 70);
  drawFrog(ctx, worstPos.x, worstPos.y, size, COLORS.coral, {
    angle: 0.9,
    lift: Math.sin(Math.PI * hopP) * 70,
    ring: hopP < 0.02 || hopP >= 1 ? COLORS.danger : null
  });
  ctx.restore();

  // 3. Shuffle berkala: katak berpindah kelompok lalu berganti warna
  ctx.save();
  x = drawCardFrame(ctx, 2, bt, 'Shuffle berkala', 'Informasi menyebar', COLORS.toscaLight);
  const cycle = Math.floor(t / 2.6);
  const shuffleP = seg((t % 2.6) / 2.6, 0.35, 0.5);
  for (let i = 0; i < 9; i++) {
    const slot = (g, k) => ({
      x: x + 90 + g * 120 + (k - 1) * 12,
      y: panelMidY - 90 + k * 92
    });
    const groupA = (i + cycle * (i % 3 === 0 ? 1 : 2)) % 3;
    const groupB = (i + (cycle + 1) * (i % 3 === 0 ? 1 : 2)) % 3;
    const a = slot(groupA, Math.floor(i / 3));
    const b = slot(groupB, Math.floor(i / 3));
    const pos = arcPoint(a, b, 40, shuffleP);
    drawFrog(ctx, pos.x, pos.y, 18, MEMEPLEX_COLORS[shuffleP > 0.5 ? groupB : groupA], {
      lift: Math.sin(Math.PI * shuffleP) * 26
    });
  }
  ctx.restore();

  // 4. Evolusi memetik: informasi menyebar dari satu katak tanpa pewarisan
  ctx.save();
  x = drawCardFrame(ctx, 3, bt, 'Evolusi memetik', 'Meniru, bukan mewarisi', COLORS.toscaLight);
  const center = { x: x + CARD_W / 2, y: panelMidY };
  const pulse = (t % 2) / 2;
  drawRipple(ctx, center.x, center.y, pulse, COLORS.gold, 190);
  drawFrog(ctx, center.x, center.y, 28, COLORS.gold, { crown: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const fx = center.x + Math.cos(a) * 140;
    const fy = center.y + Math.sin(a) * 118;
    const lit = pulse > 0.45;
    drawFrog(ctx, fx, fy, 17, lit ? COLORS.gold : COLORS.toscaLight, {
      angle: Math.atan2(center.x - fx, fy - center.y)
    });
  }
  ctx.restore();

  drawParamChips(
    ctx,
    [
      { label: 'F  katak', w: 210 },
      { label: 'm  memeplex', w: 270 },
      { label: 'N  iterasi lokal', w: 340 },
      { label: 'Dmax  langkah maksimum', w: 420 }
    ],
    bt,
    COLORS.toscaLight
  );
}

/* ---------- Slide: Cara kerja ---------- */

const FROG_COUNT = 12;
const SCATTER = Array.from({ length: FROG_COUNT }, (_, i) => ({
  x: 620 + noise(i + 3) * 1160,
  y: 330 + noise(i + 40) * 560
}));
// Peringkat tiap katak acak tetapi tetap: order[0] adalah katak terbaik
const RANK_ORDER = Array.from({ length: FROG_COUNT }, (_, i) => i).sort((a, b) => noise(a + 9) - noise(b + 9));
const ROW_Y = 620;
const rowSlot = (rank) => ({ x: 600 + rank * 104, y: ROW_Y });
const GROUPS = [
  { x: 720, y: 640 },
  { x: 1170, y: 640 },
  { x: 1620, y: 640 }
];
const GROUP_R = 190;

function groupSlot(group, index) {
  const a = -Math.PI / 2 + (index / 4) * Math.PI * 2;
  return { x: GROUPS[group].x + Math.cos(a) * 100, y: GROUPS[group].y + Math.sin(a) * 100 };
}

function drawGroupPonds(ctx, alpha) {
  GROUPS.forEach((group, g) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(group.x, group.y, GROUP_R, 0, Math.PI * 2);
    ctx.fillStyle = `${MEMEPLEX_COLORS[g]}1c`;
    ctx.strokeStyle = MEMEPLEX_COLORS[g];
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawText(ctx, `M${g + 1}`, group.x, group.y - GROUP_R - 34, {
      size: 38,
      weight: 800,
      color: MEMEPLEX_COLORS[g],
      align: 'center',
      alpha
    });
  });
}

function beatSort(ctx, bt) {
  RANK_ORDER.forEach((frogIdx, rank) => {
    const pop = seg(bt, frogIdx * 0.05, 0.4, easeBack);
    const move = seg(bt, 1.3 + rank * 0.06, 0.8);
    const from = SCATTER[frogIdx];
    const to = rowSlot(rank);
    const pos = arcPoint(from, to, 60, move);
    const isBest = rank === 0;
    const isWorst = rank === FROG_COUNT - 1;
    drawFrog(ctx, pos.x, pos.y, 32 * Math.max(0.01, pop), isBest && move > 0.5 ? COLORS.gold : COLORS.toscaLight, {
      lift: Math.sin(Math.PI * move) * 30,
      crown: isBest && move > 0.5,
      ring: isWorst && move > 0.9 ? COLORS.danger : null
    });
    drawText(ctx, `${rank + 1}`, to.x, ROW_Y + 72, {
      size: 32,
      weight: 800,
      align: 'center',
      mono: true,
      alpha: seg(bt, 2 + rank * 0.06, 0.4)
    });
  });
  const labels = seg(bt, 2.9, 0.5);
  drawPill(ctx, 'terbaik', rowSlot(0).x, ROW_Y - 110, { size: 28, alpha: labels });
  drawPill(ctx, 'terburuk', rowSlot(FROG_COUNT - 1).x - 16, ROW_Y - 110, { size: 28, fill: COLORS.danger, alpha: labels });
}

function beatPartition(ctx, bt) {
  drawGroupPonds(ctx, seg(bt, 0, 0.6));
  RANK_ORDER.forEach((_, rank) => {
    const g = rank % 3;
    const deal = seg(bt, 0.5 + rank * 0.32, 0.55);
    const from = rowSlot(rank);
    const to = groupSlot(g, Math.floor(rank / 3));
    const pos = arcPoint(from, to, 130, deal);
    const landed = deal >= 1;
    drawFrog(ctx, pos.x, pos.y, 30, landed || deal > 0.5 ? (rank === 0 ? COLORS.gold : MEMEPLEX_COLORS[g]) : COLORS.toscaLight, {
      lift: Math.sin(Math.PI * deal) * 34,
      crown: rank === 0
    });
    if (deal > 0.8) {
      drawText(ctx, `${rank + 1}`, to.x, to.y + 52, {
        size: 28,
        weight: 800,
        mono: true,
        align: 'center',
        alpha: seg(deal, 0.8, 0.2)
      });
    }
  });
}

const XW = { x: 640, y: 830 };
const XB = { x: 1240, y: 480 };
const XG = { x: 1660, y: 400 };
const TRY_B = { x: 1010, y: 610 };
const TRY_G = { x: 1180, y: 660 };
const RESET_AT = { x: 1540, y: 800 };
const LEAP_LOOP = 12;

function beatLeap(ctx, bt) {
  const time = bt % LEAP_LOOP;

  drawText(ctx, 'Xb', XB.x, XB.y - 82, { size: 40, weight: 800, align: 'center', mono: true, color: COLORS.toscaLight });
  drawFrog(ctx, XB.x, XB.y, 42, COLORS.toscaLight, { angle: -2.2 });
  drawText(ctx, 'Xg', XG.x, XG.y - 100, { size: 40, weight: 800, align: 'center', mono: true, color: COLORS.gold });
  drawFrog(ctx, XG.x, XG.y, 48, COLORS.gold, { angle: -2.2, crown: true });
  drawText(ctx, 'Xw', XW.x - 88, XW.y, { size: 40, weight: 800, align: 'center', mono: true, color: COLORS.danger });

  const tryOut = (start, target, color) => {
    const out = seg(time, start, 0.9);
    const back = seg(time, start + 1.7, 0.6);
    const active = time >= start && time < start + 2.4;
    const failedAlpha = seg(time, start + 0.9, 0.2) * (1 - seg(time, start + 1.9, 0.3));
    if (active) drawArrow(ctx, XW, target, { bend: 120, color, width: 6, progress: out, dashed: true, alpha: 1 - back });
    if (failedAlpha > 0) {
      drawCross(ctx, target.x, target.y - 70, 22, COLORS.danger, failedAlpha);
      drawPill(ctx, 'tidak membaik', target.x + 130, target.y - 70, { size: 28, fill: COLORS.danger, alpha: failedAlpha });
    }
    if (!active) return null;
    if (out < 1) {
      const p = arcPoint(XW, target, 120, out);
      return { ...p, lift: Math.sin(Math.PI * out) * 30 };
    }
    return back > 0 ? { ...arcPoint(target, XW, -80, back), lift: Math.sin(Math.PI * back) * 24 } : { ...target, lift: 0 };
  };

  const attemptB = tryOut(0.6, TRY_B, COLORS.toscaLight);
  const attemptG = tryOut(3.6, TRY_G, COLORS.gold);
  const resetP = seg(time, 7, 0.9);
  let frog = attemptB || attemptG || { ...XW, lift: 0 };
  if (time >= 7) {
    frog = { ...arcPoint(XW, RESET_AT, 300, resetP), lift: 0 };
    drawArrow(ctx, XW, RESET_AT, { bend: 300, color: COLORS.coral, width: 6, progress: resetP, dashed: true });
    if (resetP >= 1) {
      drawRipple(ctx, RESET_AT.x, RESET_AT.y, seg(time, 7.9, 1.2), COLORS.coral, 130);
      drawPill(ctx, 'posisi acak baru', RESET_AT.x, RESET_AT.y + 92, { size: 28, fill: COLORS.coral });
    }
  }
  drawFrog(ctx, frog.x, frog.y, 36, COLORS.coral, { lift: frog.lift, angle: 0.9, ring: COLORS.danger });

  // Tangga tiga aturan beserta rumus yang sedang berlaku
  const activeRule = time < 3.4 ? 0 : time < 6.8 ? 1 : 2;
  const rules = [
    { text: 'Xw + r · (Xb − Xw)', color: COLORS.toscaLight },
    { text: 'Xw + r · (Xg − Xw)', color: COLORS.gold },
    { text: 'posisi acak', color: COLORS.coral }
  ];
  rules.forEach((rule, i) => {
    const y = 318 + i * 62;
    const on = i === activeRule;
    drawText(ctx, `${i + 1}`, 560, y, { size: 34, weight: 800, mono: true, color: on ? rule.color : COLORS.muted, alpha: on ? 1 : 0.5 });
    drawText(ctx, rule.text, 602, y, { size: 36, mono: true, weight: 700, color: on ? rule.color : COLORS.muted, alpha: on ? 1 : 0.5 });
  });
}

function beatShuffle(ctx, bt) {
  const gather = seg(bt, 0.2, 1.1);
  const redeal = seg(bt, 2.3, 1.4);
  const swirlSpeed = bt * 2.4;
  drawGroupPonds(ctx, 1 - gather * (1 - redeal));

  RANK_ORDER.forEach((_, rank) => {
    const oldGroup = rank % 3;
    const newRank = (rank * 5 + 2) % FROG_COUNT;
    const newGroup = newRank % 3;
    const start = groupSlot(oldGroup, Math.floor(rank / 3));
    const end = groupSlot(newGroup, Math.floor(newRank / 3));
    const angle = (rank / FROG_COUNT) * Math.PI * 2 + swirlSpeed;
    const swirl = { x: 1170 + Math.cos(angle) * 150, y: 640 + Math.sin(angle) * 150 };
    const gathered = {
      x: lerp(start.x, swirl.x, gather),
      y: lerp(start.y, swirl.y, gather)
    };
    const x = lerp(gathered.x, end.x, redeal);
    const y = lerp(gathered.y, end.y, redeal);
    const isBest = newRank === 0;
    let color = MEMEPLEX_COLORS[oldGroup];
    if (gather > 0.5) color = COLORS.toscaLight;
    if (redeal > 0.5) color = isBest ? COLORS.gold : MEMEPLEX_COLORS[newGroup];
    drawFrog(ctx, x, y, 30, color, {
      angle: gather > 0 && redeal < 1 ? angle + Math.PI : 0.4 * rank,
      crown: isBest && redeal > 0.5
    });
  });

  drawPill(ctx, 'ulangi sampai iterasi maksimum', 1170, 930, { size: 32, alpha: seg(bt, 3.9, 0.5) });
}

function drawHowScene(ctx, { t, bt, beat }) {
  drawPondWater(ctx, t);
  if (beat === 0) beatSort(ctx, bt);
  else if (beat === 1) beatPartition(ctx, bt);
  else if (beat === 2) beatLeap(ctx, bt);
  else beatShuffle(ctx, bt);
}

/* ---------- Registri slide ---------- */

const CHAPTER = { id: 'sfla', label: 'SFLA' };
const sflaSlides = [
  {
    id: 'sfla-inspirasi',
    chapter: CHAPTER,
    title: 'SFLA: Inspirasi',
    beats: 2,
    notes: `
      <p><strong>SFLA</strong> diperkenalkan Eusuff &amp; Lansey (2003), awalnya untuk desain jaringan distribusi air.</p>
      <ul>
        <li>Sekelompok katak di kolam mencari lokasi dengan makanan terbanyak.</li>
        <li>Beat 2: katak tidak mewariskan gen, melainkan <em>meniru</em> informasi (meme) dari katak yang lebih baik, sehingga informasi menyebar dalam satu generasi.</li>
        <li>Gabungan pencarian lokal ala PSO dan shuffling ala Shuffled Complex Evolution.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'SFLA · Eusuff &amp; Lansey, 2003',
        beats: [
          { title: 'Katak mencari makanan.', sub: 'Shuffled Frog-Leaping Algorithm' },
          { title: 'Katak meniru yang terbaik.', sub: 'Yang dibagikan adalah informasi (meme), bukan gen.' }
        ],
        draw: drawInspirationScene
      });
    }
  },
  {
    id: 'sfla-karakter',
    chapter: CHAPTER,
    title: 'SFLA: Karakteristik',
    notes: `
      <ul>
        <li><strong>Memeplex:</strong> populasi F dibagi ke m memeplex berukuran sama.</li>
        <li><strong>Lompatan lokal:</strong> tiap iterasi lokal hanya memperbarui Xw di tiap memeplex, sehingga evaluasi fungsi hemat.</li>
        <li><strong>Shuffle berkala:</strong> menyebarkan informasi antar-memeplex dan menjaga keragaman.</li>
        <li><strong>Evolusi memetik:</strong> perbaikan terjadi lewat peniruan, bukan persilangan genetik.</li>
        <li>Parameter: F, m, N (iterasi lokal), dan Dmax (langkah maksimum).</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'SFLA · Karakteristik',
        beats: [{ title: 'Karakteristik SFLA' }],
        draw: drawTraitsScene
      });
    }
  },
  {
    id: 'sfla-cara',
    chapter: CHAPTER,
    title: 'SFLA: Cara Kerja',
    beats: 4,
    notes: `
      <p>Tekan <kbd>&rarr;</kbd> untuk tiap tahap. Ini ilustrasi; simulasi langsung ada di slide berikutnya.</p>
      <ol>
        <li><strong>Pengurutan:</strong> evaluasi f(X) lalu urutkan dari terbaik ke terburuk. Xg = peringkat 1.</li>
        <li><strong>Partisi:</strong> dibagi bergilir dengan k = i mod m, sehingga tiap memeplex berisi katak baik dan buruk secara merata.</li>
        <li><strong>Lompatan lokal:</strong> Xw mencoba ke Xb; bila tidak membaik, ke Xg; bila masih gagal, diganti posisi acak. Berhenti saat posisinya membaik. Langkah dibatasi Dmax.</li>
        <li><strong>Shuffle:</strong> semua digabung, diurutkan ulang, lalu dipartisi kembali.</li>
      </ol>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'SFLA · Cara kerja',
        steps: ['Pengurutan', 'Partisi', 'Lompatan lokal', 'Shuffle'],
        beats: [
          { title: 'Urutkan dari yang terbaik.' },
          { title: 'Bagi merata ke tiap memeplex.' },
          { title: 'Katak terburuk mencoba melompat.', sub: 'Berhenti saat posisinya membaik.' },
          { title: 'Shuffle, lalu bagi ulang.' }
        ],
        draw: drawHowScene
      });
    }
  },
  {
    id: 'sfla-sim',
    chapter: CHAPTER,
    title: 'SFLA: Simulasi',
    notes: `
      <p>Di sini <strong>SFLAEngine</strong> benar-benar berjalan. Tekan <kbd>S</kbd> per tahap atau <kbd>P</kbd> untuk otomatis.</p>
      <ul>
        <li>Warna = memeplex. Lingkaran merah = Xw, lingkaran putih = Xb, mahkota = Xg.</li>
        <li>Label lompatan menunjukkan aturan yang berhasil: ke Xb, ke Xg, atau acak.</li>
        <li>Peta: makin terang makin rendah biayanya. Bintang = optimum global (0, 0).</li>
        <li>Coba Rastrigin untuk memperlihatkan jebakan lokal, Sphere untuk konvergensi mulus.</li>
      </ul>`,
    mount(container, ctx) {
      return mountSimulation(container, ctx, {
        idPrefix: 'sfla',
        title: 'Simulasi SFLA',
        kicker: 'SFLA · Simulasi langsung',
        color: COLORS.toscaLight,
        fillFlat: 'rgba(95, 224, 210, 0.16)',
        Engine: SFLAEngine,
        renderer: new SFLARenderer(),
        bestOf: (state) => state.bestFrog,
        bestLabel: 'f(Xg) terbaik',
        phases: [
          { key: 'SORT', label: 'Pengurutan' },
          { key: 'PARTITION', label: 'Partisi' },
          { key: 'LOCAL_JUMP', label: 'Lompatan' },
          { key: 'SHUFFLE', label: 'Shuffle' }
        ],
        params: [
          { key: 'populationSize', label: 'Katak (F)', min: 12, max: 48, step: 4, value: 24 },
          { key: 'memeplexCount', label: 'Memeplex (m)', min: 2, max: 6, step: 1, value: 4 },
          { key: 'localIterations', label: 'Iterasi lokal (N)', min: 1, max: 8, step: 1, value: 3 },
          { key: 'maxStep', label: 'Dmax', min: 0.8, max: 5, step: 0.2, value: 3.2 }
        ]
      });
    }
  }
];

  exports.drawCardFrame = drawCardFrame;
  exports.drawParamChips = drawParamChips;
  exports.sflaSlides = sflaSlides;
  },
  "render/sflaRenderer.js": function(exports, __require) {
/**
 * Renderer Visual SFLA (Metafora Katak di Kolam Teratai)
 * Menggunakan Palet Resmi ITS: FKK Medical Tosca (#12B0A2), Kuning Tua ITS (#FDBB16),
 * FTK Summer Sky (#26AEE4), FV Crusta (#F47D52), dan Biru Muda ITS (#75BDE0).
 * Seluruh ukuran mengikuti faktor `u` dari ukuran kanvas agar konsisten di layar apa pun.
 */
const {  ContourMapCache, syncCanvasSize  } = __require("render/contourRenderer.js");
const {  COLORS, arcPoint, drawArrow, drawCross, drawFrog, drawPill, drawRipple  } = __require("render/sprites.js");
const MEMEPLEX_COLORS = [
  '#3fe0c5', // M1: Tosca terang
  '#ffb0d0', // M2: Merah muda teratai
  '#7fd0ff', // M3: FTK Summer Sky terang
  '#f9a071', // M4: FV Crusta terang
  '#c7b8ff', // M5: Ungu muda
  '#d8ec6a', // M6: Hijau kekuningan
  '#ffffff', // M7: Putih
  '#f6ec1d'  // M8: ITS Kuning Lambang
];

const JUMP_STYLES = {
  XB_SUCCESS: { color: COLORS.toscaLight, label: 'ke Xb' },
  XG_SUCCESS: { color: COLORS.gold, label: 'ke Xg' },
  RANDOM_RESET: { color: COLORS.danger, label: 'acak' }
};

function memeplexColor(index) {
  return index >= 0 ? MEMEPLEX_COLORS[index % MEMEPLEX_COLORS.length] : '#bfe6df';
}
class SFLARenderer {
  constructor() {
    this.contourCache = new ContourMapCache();
  }

  render(canvas, state, objective, options = {}) {
    if (!canvas || !state) return;
    const { ctx, width, height } = syncCanvasSize(canvas);
    const alpha = options.alpha ?? 1;
    const compact = options.compact ?? false;
    const u = Math.min(width, height) / 900;

    const vp = this.contourCache.renderBackground(ctx, width, height, objective, 'pond', {
      showOptimum: options.showOptimum ?? true
    });
    if (!vp) return;

    const screenOf = (frog) =>
      vp.worldToScreen(frog.prevX + (frog.x - frog.prevX) * alpha, frog.prevY + (frog.y - frog.prevY) * alpha);

    if (!compact && (state.phase === 'PARTITION' || state.phase === 'LOCAL_JUMP')) {
      this.drawMemeplexLinks(ctx, state, screenOf, u);
    }

    if (state.phase === 'LOCAL_JUMP') {
      for (const jump of state.jumps) this.drawJump(ctx, vp, jump, alpha, u, compact);
    }

    if (state.phase === 'SHUFFLE' && state.bestFrog && !compact) {
      const center = vp.worldToScreen(state.bestFrog.x, state.bestFrog.y);
      drawRipple(ctx, center.x, center.y, alpha * 0.98, COLORS.toscaLight, 220 * u);
    }

    const jumpingIds = new Map(state.jumps.map((j) => [j.frogId, j]));
    const ordered = [...state.frogs].sort((a, b) => b.fitness - a.fitness);
    const baseSize = (compact ? 10 : 13) * u;

    for (const frog of ordered) {
      const pos = screenOf(frog);
      const isBest = frog.role === 'global_best';
      const jump = jumpingIds.get(frog.id);
      const lift = jump ? Math.sin(Math.PI * alpha) * 46 * u : 0;
      const angle = jump
        ? Math.atan2(jump.toX - jump.fromX, jump.toY - jump.fromY)
        : (frog.id * 2.399) % (Math.PI * 2);

      let color = memeplexColor(frog.memeplex);
      if (compact) color = COLORS.toscaLight;
      if (isBest) color = COLORS.gold;

      let ring = null;
      if (!compact && frog.role === 'memeplex_worst') ring = 'rgba(255, 107, 112, 0.85)';
      if (!compact && frog.role === 'memeplex_best') ring = 'rgba(255, 255, 255, 0.8)';

      drawFrog(ctx, pos.x, pos.y, isBest ? baseSize * 1.35 : baseSize, color, {
        angle,
        lift,
        ring,
        crown: isBest
      });

      if (!compact && state.phase === 'SORT' && frog.rank >= 0 && frog.rank < 5) {
        drawPill(ctx, `#${frog.rank + 1}`, pos.x, pos.y - 36 * u, {
          size: Math.max(11, 20 * u),
          fill: isBest ? COLORS.gold : COLORS.ink
        });
      }
    }
  }

  /** Jaring tipis dari katak terbaik memeplex ke anggotanya, supaya kelompok terlihat tanpa legenda. */
  drawMemeplexLinks(ctx, state, screenOf, u) {
    ctx.save();
    ctx.lineWidth = Math.max(1, 1.6 * u);
    ctx.globalAlpha = 0.34;
    const leaders = new Map();
    for (const frog of state.frogs) {
      if (frog.role === 'memeplex_best') leaders.set(frog.memeplex, frog);
    }
    for (const frog of state.frogs) {
      if (frog.role === 'global_best' && !leaders.has(frog.memeplex)) leaders.set(frog.memeplex, frog);
    }
    for (const frog of state.frogs) {
      const leader = leaders.get(frog.memeplex);
      if (!leader || leader === frog) continue;
      const a = screenOf(frog);
      const b = screenOf(leader);
      ctx.strokeStyle = memeplexColor(frog.memeplex);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawJump(ctx, vp, jump, alpha, u, compact) {
    const style = JUMP_STYLES[jump.type] || JUMP_STYLES.XB_SUCCESS;
    const from = vp.worldToScreen(jump.fromX, jump.fromY);
    const to = vp.worldToScreen(jump.toX, jump.toY);
    const bend = 46 * u;

    if (typeof jump.failedXbX === 'number' && !compact) {
      const failed = vp.worldToScreen(jump.failedXbX, jump.failedXbY);
      const miss = arcPoint(from, failed, 0, 0.5);
      drawArrow(ctx, from, miss, { color: COLORS.danger, width: 2.4 * u, dashed: true, head: false, alpha: 0.8 });
      drawCross(ctx, miss.x, miss.y, 8 * u, COLORS.danger, 0.9);
    }

    drawArrow(ctx, from, to, {
      bend,
      color: style.color,
      width: 3.2 * u,
      progress: Math.max(0.02, alpha),
      dashed: jump.type === 'RANDOM_RESET'
    });
    drawRipple(ctx, to.x, to.y, (alpha - 0.5) * 2, style.color, 52 * u);

    if (!compact) {
      drawPill(ctx, style.label, to.x, to.y + 34 * u, {
        size: Math.max(11, 19 * u),
        fill: style.color,
        alpha: Math.min(1, alpha * 2)
      });
    }
  }
}

  exports.SFLARenderer = SFLARenderer;
  exports.MEMEPLEX_COLORS = MEMEPLEX_COLORS;
  },
  "render/contourRenderer.js": function(exports, __require) {
/**
 * Renderer Peta Kontur 2D Berperforma Tinggi (Offscreen Bitmap Cache)
 * Dikalibrasi dengan Palet Identitas Resmi ITS (Biru ITS, Medical Tosca FKK, Summer Sky FTK, Kuning Tua ITS).
 * Skala piksel seragam (uniform scale) agar jarak Euclidean seperti radius dmax tetap bulat sempurna.
 */const {  drawStar  } = __require("render/sprites.js");

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

// Lembah (biaya rendah) dibuat paling terang dan puncak paling gelap, sehingga mata penonton langsung tertuju ke target
const PALETTES = {
  // Kolam teratai SFLA: cekungan Medical Tosca FKK (#12B0A2) memudar ke Navy ITS (#03132B)
  pond: [
    [44, 190, 170],
    [18, 136, 128],
    [10, 92, 98],
    [7, 62, 76],
    [5, 40, 60],
    [3, 24, 46]
  ],
  // Siklus air WCA: cekungan Summer Sky FTK (#26AEE4) memudar ke Biru Lambang lalu Navy ITS
  water: [
    [70, 186, 236],
    [24, 128, 196],
    [14, 90, 156],
    [9, 62, 118],
    [5, 40, 84],
    [3, 22, 52]
  ]
};function createViewport(width, height, objective, paddingRatio = 0.08) {
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
}class ContourMapCache {
  constructor() {
    this.cacheKey = '';
    this.offscreen = null;
  }

  renderBackground(ctx, width, height, objective, paletteName = 'pond', options = {}) {
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

    // Penanda Global Optimum (Kuning Tua Logo ITS #FDBB16)
    if (options.showOptimum !== false) {
      const optPos = vp.worldToScreen(objective.optimum.x, objective.optimum.y);
      drawStar(ctx, optPos.x, optPos.y, Math.max(9, Math.min(width, height) * 0.021));
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

    const stops = PALETTES[paletteName] || PALETTES.pond;
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
}function syncCanvasSize(canvas) {
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
  "slides/simulation.js": function(exports, __require) {
/**
 * Slide simulasi nyata yang dipakai bersama oleh SFLA dan WCA:
 * peta kontur besar di kiri, tahap aktif + nilai terbaik + grafik konvergensi di kanan,
 * dan panel parameter yang bisa disembunyikan agar layar tetap bersih saat presentasi.
 */
const {  getObjective  } = __require("core/objectives.js");
const {  SimulationRunner  } = __require("core/engine.js");
const {  renderConvergenceChart  } = __require("render/chart.js");

const OBJECTIVE_BUTTONS = [
  { id: 'rastrigin', label: 'Rastrigin' },
  { id: 'ackley', label: 'Ackley' },
  { id: 'sphere', label: 'Sphere' }
];
function formatFitness(value) {
  return value < 0.001 && value > 0 ? value.toExponential(2) : value.toFixed(3);
}
function objectiveButtonsHtml(activeId) {
  return OBJECTIVE_BUTTONS.map(
    (obj) => `<button type="button" class="seg-btn${obj.id === activeId ? ' active' : ''}" data-obj="${obj.id}">${obj.label}</button>`
  ).join('');
}
function mountSimulation(container, { reducedMotion, registerHooks }, spec) {
  const { idPrefix: id, title, kicker, color, fillFlat, Engine, renderer, bestOf, bestLabel, phases, params } = spec;
  const MAX_ITERATIONS = 40;
  const DEFAULT_SPEED = 1.5;

  const paramsHtml = params
    .map(
      (p) => `
        <label class="param" for="${id}-p-${p.key}">
          <span class="param-label">${p.label}<b id="${id}-v-${p.key}">${p.value}</b></span>
          <input type="range" id="${id}-p-${p.key}" data-param="${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}" />
        </label>`
    )
    .join('');

  container.innerHTML = `
    <div class="sim" style="--sim-accent:${color}">
      <div class="sim-map"><canvas id="${id}-canvas"></canvas></div>
      <aside class="sim-side">
        <p class="kicker">${kicker}</p>
        <h1 class="sim-title">${title}</h1>
        <ol class="sim-phases">
          ${phases.map((p) => `<li class="sim-phase" data-phase="${p.key}">${p.label}</li>`).join('')}
        </ol>
        <p class="sim-detail" id="${id}-detail"></p>
        <div class="sim-readout">
          <div>
            <span class="readout-label">${bestLabel}</span>
            <strong class="readout-value" id="${id}-best"></strong>
          </div>
          <div class="readout-right">
            <span class="readout-label">Iterasi</span>
            <strong class="readout-value readout-small" id="${id}-iter"></strong>
          </div>
        </div>
        <div class="sim-chart"><canvas id="${id}-chart"></canvas></div>
        <div class="transport">
          <button type="button" class="btn btn-primary" id="${id}-play">Mulai <kbd>P</kbd></button>
          <button type="button" class="btn" id="${id}-step">Langkah <kbd>S</kbd></button>
          <button type="button" class="btn" id="${id}-reset">Reset <kbd>R</kbd></button>
        </div>
        <div class="transport">
          <div class="seg-group" id="${id}-objectives">${objectiveButtonsHtml('rastrigin')}</div>
          <button type="button" class="btn" id="${id}-params-toggle" aria-expanded="false">Parameter</button>
        </div>
      </aside>
      <div class="param-panel hidden" id="${id}-params">
        ${paramsHtml}
        <label class="param" for="${id}-speed">
          <span class="param-label">Kecepatan<b id="${id}-v-speed">${DEFAULT_SPEED}</b></span>
          <input type="range" id="${id}-speed" min="0.5" max="12" step="0.5" value="${DEFAULT_SPEED}" />
        </label>
        <label class="param" for="${id}-seed">
          <span class="param-label">Seed</span>
          <input type="number" class="field" id="${id}-seed" value="42" min="1" max="99999" />
        </label>
      </div>
    </div>
  `;

  const canvas = container.querySelector(`#${id}-canvas`);
  const chartCanvas = container.querySelector(`#${id}-chart`);
  const playBtn = container.querySelector(`#${id}-play`);
  const speedInput = container.querySelector(`#${id}-speed`);
  const seedInput = container.querySelector(`#${id}-seed`);
  const paramPanel = container.querySelector(`#${id}-params`);
  const paramToggle = container.querySelector(`#${id}-params-toggle`);
  const paramInputs = [...container.querySelectorAll('[data-param]')];
  const phaseEls = [...container.querySelectorAll('.sim-phase')];
  const objectiveBtns = [...container.querySelectorAll(`#${id}-objectives .seg-btn`)];

  let objective = getObjective('rastrigin');
  let speed = DEFAULT_SPEED;

  function readConfig() {
    const config = { objective, maxIterations: MAX_ITERATIONS, seed: Number(seedInput?.value) || 42 };
    for (const input of paramInputs) config[input.dataset.param] = Number(input.value);
    return config;
  }

  const engine = new Engine(readConfig());

  function updateReadout(state) {
    for (const el of phaseEls) el.classList.toggle('active', el.dataset.phase === state.phase);
    const detail = container.querySelector(`#${id}-detail`);
    const best = container.querySelector(`#${id}-best`);
    const iter = container.querySelector(`#${id}-iter`);
    if (detail) detail.textContent = state.phaseDetail;
    if (best) best.textContent = formatFitness(bestOf(state).fitness);
    if (iter) iter.textContent = `${state.iteration}/${state.maxIterations}`;
    renderConvergenceChart(chartCanvas, [{ label: title, color, fillFlat, data: state.history }], {
      maxIterations: state.maxIterations
    });
  }

  const runner = new SimulationRunner({
    stepsPerSecond: DEFAULT_SPEED,
    reducedMotion,
    onStep: () => {
      const state = engine.step();
      updateReadout(state);
      return state.phase === 'DONE';
    },
    onRender: (alpha, now) => {
      renderer.render(canvas, engine.getState(), objective, { alpha, timestamp: reducedMotion ? 0 : now });
    }
  });

  runner.onPlayStateChange = (playing) => {
    if (playBtn) playBtn.innerHTML = `${playing ? 'Jeda' : 'Mulai'} <kbd>P</kbd>`;
  };

  // notifyReset & stepOnce mengubah durasi transisi; dipulihkan agar animasi tetap halus saat Play berikutnya
  const togglePlay = () => {
    runner.setSpeed(speed);
    runner.togglePlay();
  };
  const step = () => runner.stepOnce();
  const reset = () => {
    engine.reset();
    updateReadout(engine.getState());
    runner.notifyReset();
    runner.setSpeed(speed);
  };
  const reconfigure = () => {
    runner.pause();
    engine.configure(readConfig());
    updateReadout(engine.getState());
    runner.notifyReset();
    runner.setSpeed(speed);
  };

  playBtn?.addEventListener('click', togglePlay);
  container.querySelector(`#${id}-step`)?.addEventListener('click', step);
  container.querySelector(`#${id}-reset`)?.addEventListener('click', reset);

  paramToggle?.addEventListener('click', () => {
    const open = paramPanel.classList.toggle('hidden') === false;
    paramToggle.setAttribute('aria-expanded', String(open));
  });

  objectiveBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      objectiveBtns.forEach((b) => b.classList.toggle('active', b === btn));
      objective = getObjective(btn.dataset.obj);
      reconfigure();
    });
  });

  for (const input of paramInputs) {
    input.addEventListener('input', () => {
      const valueEl = container.querySelector(`#${id}-v-${input.dataset.param}`);
      if (valueEl) valueEl.textContent = input.value;
      reconfigure();
    });
  }
  speedInput?.addEventListener('input', () => {
    speed = Number(speedInput.value);
    const valueEl = container.querySelector(`#${id}-v-speed`);
    if (valueEl) valueEl.textContent = speedInput.value;
    runner.setSpeed(speed);
  });
  seedInput?.addEventListener('change', reconfigure);

  registerHooks?.({ togglePlay, step, reset });

  const onResize = () => updateReadout(engine.getState());
  window.addEventListener('resize', onResize);

  updateReadout(engine.getState());
  runner.startLoop();

  return () => {
    window.removeEventListener('resize', onResize);
    runner.destroy();
  };
}

  exports.formatFitness = formatFitness;
  exports.objectiveButtonsHtml = objectiveButtonsHtml;
  exports.mountSimulation = mountSimulation;
  },
  "core/objectives.js": function(exports, __require) {
/**
 * Fungsi Objektif 2D untuk Simulasi Visual (PRD Bagian 10 & F-07)
 * Semua fungsi diminimalkan menuju nilai global minimum f(0, 0) = 0.
 */

const TWO_PI = 2 * Math.PI;const OBJECTIVES = {
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
};function getObjective(id) {
  return OBJECTIVES[id] || OBJECTIVES.sphere;
}function clampCoord(val, min, max) {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}


  exports.getObjective = getObjective;
  exports.clampCoord = clampCoord;
  exports.OBJECTIVES = OBJECTIVES;
  },
  "core/engine.js": function(exports, __require) {
/**
 * Mesin Loop Animasi Presentasi (PRD Bagian 12 & 13)
 * Memisahkan detak logika algoritma (play/pause/step) dari loop rendering 60 FPS (requestAnimationFrame)
 * dengan interpolasi posisi halus antar langkah diskrit.
 */class SimulationRunner {
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
  "render/chart.js": function(exports, __require) {
/**
 * Grafik Konvergensi Fitness Terbaik per Iterasi
 * Ukuran huruf dan garis mengikuti ukuran kanvas agar tetap terbaca dari jarak jauh saat diproyeksikan.
 */
const {  syncCanvasSize  } = __require("render/contourRenderer.js");

function formatTick(val) {
  if (val === 0) return '0';
  if (val >= 10) return val.toFixed(0);
  if (val >= 0.1) return val.toFixed(1);
  return val.toExponential(0);
}
function renderConvergenceChart(canvas, seriesList, options = {}) {
  if (!canvas) return;
  const { ctx, width, height } = syncCanvasSize(canvas);
  ctx.clearRect(0, 0, width, height);

  const u = Math.max(0.55, Math.min(1.5, Math.min(width / 610, height / 220)));
  const padLeft = 62 * u;
  const padRight = 22 * u;
  const padTop = 18 * u;
  const padBottom = 34 * u;
  const plotW = Math.max(20, width - padLeft - padRight);
  const plotH = Math.max(20, height - padTop - padBottom);

  let maxIter = Math.max(10, options.maxIterations || 20);
  let maxVal = 0;
  for (const s of seriesList) {
    for (const pt of s.data) {
      if (pt.iteration > maxIter) maxIter = pt.iteration;
      if (pt.bestFitness > maxVal) maxVal = pt.bestFitness;
    }
  }
  const yCeil = maxVal <= 1e-6 ? 1 : maxVal * 1.08;

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(169, 187, 214, 0.2)';
  ctx.font = `600 ${16 * u}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#a9bbd6';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 2; i++) {
    const ratio = i / 2;
    const py = padTop + plotH - ratio * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, py);
    ctx.lineTo(padLeft + plotW, py);
    ctx.stroke();
    ctx.fillText(formatTick(ratio * yCeil), padLeft - 10 * u, py);
  }

  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const iterVal = Math.round((i / 4) * maxIter);
    ctx.fillText(`${iterVal}`, padLeft + (iterVal / maxIter) * plotW, padTop + plotH + 19 * u);
  }

  for (const s of seriesList) {
    if (!s.data || s.data.length === 0) continue;
    const color = s.color || '#12b0a2';
    const points = s.data.map((pt) => ({
      px: padLeft + (pt.iteration / maxIter) * plotW,
      py: padTop + plotH - Math.max(0, Math.min(1, pt.bestFitness / yCeil)) * plotH
    }));

    if (seriesList.length === 1 && points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].px, padTop + plotH);
      points.forEach((p) => ctx.lineTo(p.px, p.py));
      ctx.lineTo(points[points.length - 1].px, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = s.fillFlat || 'rgba(18, 176, 162, 0.16)';
      ctx.fill();
    }

    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.4 * u;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.px, last.py, 6 * u, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

  exports.renderConvergenceChart = renderConvergenceChart;
  },
  "algorithms/sfla.js": function(exports, __require) {
/**
 * Shuffled Frog-Leaping Algorithm (SFLA) — Mesin Status Murni (Tanpa DOM)
 * Referensi: Eusuff, M. M., & Lansey, K. E. (2003).
 *
 * Urutan event tahap (Acceptance Criterion #2):
 *   INIT -> SORT -> PARTITION -> LOCAL_JUMP (x N) -> SHUFFLE -> PARTITION -> ... -> DONE
 */const {  createRng  } = __require("core/rng.js");const {  clampCoord  } = __require("core/objectives.js");class SFLAEngine {
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
  "slides/wcaSlides.js": function(exports, __require) {
/**
 * Bab WCA: inspirasi, karakteristik, cara kerja bertahap, dan simulasi nyata.
 * Scene inspirasi & cara kerja adalah ilustrasi; hanya slide simulasi yang menjalankan WCAEngine.
 */
const {  clamp01, easeBack, lerp, seg  } = __require("render/stage.js");
const { 
  COLORS,
  arcPoint,
  drawArrow,
  drawCloud,
  drawDrop,
  drawGlow,
  drawPill,
  drawRipple,
  drawText,
  fillBackground
 } = __require("render/sprites.js");
const {  WCARenderer, drawRiverMarker, drawSeaMarker  } = __require("render/wcaRenderer.js");
const {  mountScene, noise  } = __require("slides/common.js");
const {  drawCardFrame, drawParamChips  } = __require("slides/sflaSlides.js");
const {  mountSimulation  } = __require("slides/simulation.js");
const {  WCAEngine  } = __require("algorithms/wca.js");

const SKY_STOPS = ['#06234f', '#0b3a73', '#12558f'];
const DEEP_STOPS = ['#031a3d', '#052a58', '#04254e'];

/* ---------- Slide: Inspirasi (siklus air tampak samping) ---------- */

const RIVER_MAIN = [
  { x: 370, y: 560 },
  { x: 560, y: 690 },
  { x: 760, y: 730 },
  { x: 980, y: 800 },
  { x: 1220, y: 850 }
];
const RIVER_BRANCH_A = [
  { x: 660, y: 540 },
  { x: 700, y: 620 },
  { x: 760, y: 730 }
];
const RIVER_BRANCH_B = [
  { x: 980, y: 660 },
  { x: 960, y: 730 },
  { x: 980, y: 800 }
];
const RIVERS = [
  { points: RIVER_MAIN, width: 16 },
  { points: RIVER_BRANCH_A, width: 8 },
  { points: RIVER_BRANCH_B, width: 8 }
];

function pathPoint(points, p) {
  const scaled = clamp01(p) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(scaled));
  const f = scaled - i;
  return { x: lerp(points[i].x, points[i + 1].x, f), y: lerp(points[i].y, points[i + 1].y, f) };
}

function strokePath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawLandscape(ctx, t) {
  fillBackground(ctx, 1920, 1080, SKY_STOPS);

  // Matahari
  drawGlow(ctx, 1640, 210, 240, 'rgba(253, 187, 22, 0.55)');
  ctx.beginPath();
  ctx.arc(1640, 210, 66, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.gold;
  ctx.fill();

  // Pegunungan belakang dan depan
  const ridge = (points, color) => {
    ctx.beginPath();
    ctx.moveTo(0, 1080);
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.lineTo(points[points.length - 1][0], 1080);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  ridge([[0, 620], [220, 420], [370, 520], [560, 390], [760, 560], [980, 640], [1300, 860], [1400, 1080]], '#123a68');
  ridge([[0, 760], [200, 590], [370, 540], [520, 680], [660, 520], [800, 690], [980, 650], [1120, 800], [1300, 880], [1420, 1080]], '#17704f');

  // Puncak bersalju
  ctx.fillStyle = '#e4eefa';
  for (const [x, y, w, h] of [[220, 420, 50, 60], [560, 390, 56, 66]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 0.2, y + h * 0.72);
    ctx.lineTo(x - w * 0.3, y + h);
    ctx.lineTo(x - w, y + h);
    ctx.closePath();
    ctx.fill();
  }

  // Sungai
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const river of RIVERS) {
    ctx.strokeStyle = '#2fa9e6';
    ctx.lineWidth = river.width;
    strokePath(ctx, river.points);
  }
  ctx.restore();

  // Laut berombak
  ctx.save();
  const seaTop = 840;
  ctx.beginPath();
  ctx.moveTo(1180, 1080);
  ctx.lineTo(1180, seaTop + 40);
  for (let x = 1180; x <= 1920; x += 20) {
    ctx.lineTo(x, seaTop + Math.sin(x * 0.012 + t * 1.3) * 9);
  }
  ctx.lineTo(1920, 1080);
  ctx.closePath();
  const seaGrad = ctx.createLinearGradient(0, seaTop, 0, 1080);
  seaGrad.addColorStop(0, '#1a8fd8');
  seaGrad.addColorStop(1, '#0a3f80');
  ctx.fillStyle = seaGrad;
  ctx.fill();
  ctx.restore();
}

function drawCycleScene(ctx, { t, bt, beat }) {
  drawLandscape(ctx, t);

  const cloudX = 430 + Math.sin(t * 0.25) * 60;

  // Beat 0: hujan deras di gunung; beat lain tetap ada tetapi lebih tipis
  const rainCount = beat === 0 ? 46 : 16;
  ctx.save();
  ctx.strokeStyle = '#cfeaff';
  ctx.lineWidth = beat === 0 ? 4 : 3;
  ctx.lineCap = 'round';
  ctx.globalAlpha = beat === 0 ? 0.95 : 0.45;
  for (let i = 0; i < rainCount; i++) {
    const baseX = cloudX - 210 + noise(i) * 420;
    const fall = ((t * (0.9 + noise(i + 90) * 0.5) + noise(i + 30)) % 1);
    const y = 380 + fall * 240;
    ctx.beginPath();
    ctx.moveTo(baseX - fall * 18, y);
    ctx.lineTo(baseX - fall * 18 - 5, y + 26);
    ctx.stroke();
  }
  ctx.restore();

  drawCloud(ctx, cloudX, 330, 100, '#eaf2fb');
  drawCloud(ctx, cloudX + 240, 390, 58, '#d4e3f3', 0.9);

  // Tetesan yang mengalir: makin besar saat beat 1
  const flowEmphasis = beat === 1;
  RIVERS.forEach((river, r) => {
    const count = flowEmphasis ? 7 : 3;
    for (let i = 0; i < count; i++) {
      const p = (t * (flowEmphasis ? 0.2 : 0.12) + i / count + r * 0.21) % 1;
      const pt = pathPoint(river.points, p);
      const ahead = pathPoint(river.points, Math.min(1, p + 0.02));
      drawDrop(ctx, pt.x, pt.y, flowEmphasis ? 15 : 10, '#e6f6ff', {
        angle: Math.atan2(ahead.y - pt.y, ahead.x - pt.x)
      });
    }
  });

  // Uap naik dari laut dan kembali membentuk awan
  const vaporEmphasis = beat === 2;
  const vaporCount = vaporEmphasis ? 26 : 8;
  ctx.save();
  for (let i = 0; i < vaporCount; i++) {
    const rise = (t * 0.17 + noise(i + 60)) % 1;
    const x = 1280 + noise(i + 7) * 560 + Math.sin(t + i) * 16;
    const y = 830 - rise * 470;
    ctx.beginPath();
    ctx.arc(x, y, 7 + rise * 16, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${(vaporEmphasis ? 0.55 : 0.28) * (1 - rise)})`;
    ctx.fill();
  }
  ctx.restore();
  if (vaporEmphasis) {
    drawArrow(ctx, { x: 1400, y: 360 }, { x: 780, y: 320 }, {
      bend: 60,
      color: '#ffffff',
      width: 7,
      dashed: true,
      progress: seg(bt, 0.5, 1.6)
    });
  }

  drawPill(ctx, 'Laut = titik terendah', 1560, 960, { size: 32, alpha: seg(bt, 0.4, 0.5) });
}

/* ---------- Slide: Karakteristik ---------- */

const CARD_W = 420;
const CARD_Y = 300;
const cardCenterY = CARD_Y + 170;

function drawTraitsScene(ctx, { t, bt }) {
  fillBackground(ctx, 1920, 1080, DEEP_STOPS);
  const size = 11;

  // 1. Hierarki: Laut, Sungai, Aliran
  ctx.save();
  let x = drawCardFrame(ctx, 0, bt, 'Hierarki', 'Laut › Sungai › Aliran', COLORS.skyLight);
  const sea = { x: x + CARD_W / 2, y: cardCenterY - 110 };
  const rivers = [{ x: x + 110, y: cardCenterY + 10 }, { x: x + 310, y: cardCenterY + 10 }];
  rivers.forEach((rv, r) => {
    drawArrow(ctx, rv, sea, { color: COLORS.ink, width: 4, head: false, alpha: 0.7 });
    [-54, 0, 54].forEach((dx, k) => {
      const st = { x: rv.x + dx, y: cardCenterY + 112 };
      drawArrow(ctx, st, rv, { color: COLORS.skyLight, width: 2.5, head: false, alpha: 0.6 });
      drawDrop(ctx, st.x, st.y, size, '#e6f6ff', { angle: -Math.PI / 2 });
      const p = (t * 0.5 + k * 0.3 + r * 0.17) % 1;
      drawGlow(ctx, lerp(st.x, rv.x, p), lerp(st.y, rv.y, p), 10, 'rgba(255, 255, 255, 0.9)');
    });
    drawRiverMarker(ctx, rv.x, rv.y, 24);
  });
  drawSeaMarker(ctx, sea.x, sea.y, 38, t);
  ctx.restore();

  // 2. Semua bergerak serentak
  ctx.save();
  x = drawCardFrame(ctx, 1, bt, 'Semua bergerak', 'Bukan hanya yang terburuk', COLORS.skyLight);
  const center = { x: x + CARD_W / 2, y: cardCenterY };
  drawSeaMarker(ctx, center.x, center.y, 30, t);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = (t * 0.28 + noise(i) * 0.25) % 1;
    const r = 170 * (1 - p * 0.72);
    drawDrop(ctx, center.x + Math.cos(a) * r, center.y + Math.sin(a) * r * 0.86, size, '#e6f6ff', {
      angle: a + Math.PI,
      alpha: Math.min(1, (1 - p) * 4)
    });
  }
  ctx.restore();

  // 3. Overshoot: C = 2 membuat tetesan bisa melewati induknya
  ctx.save();
  x = drawCardFrame(ctx, 2, bt, 'Melewati induk', 'C = 2, jarak hingga 2d', COLORS.skyLight);
  const startX = x + 60;
  const parentX = x + 210;
  const farX = x + 360;
  const y3 = cardCenterY + 10;
  ctx.fillStyle = 'rgba(159, 220, 247, 0.22)';
  ctx.beginPath();
  ctx.roundRect(startX, y3 - 34, farX - startX, 68, 34);
  ctx.fill();
  drawRiverMarker(ctx, parentX, y3, 26);
  const travel = ((t * 0.33) % 1);
  const dropX = lerp(startX, farX, seg(travel, 0.05, 0.75));
  drawDrop(ctx, dropX, y3, 15, '#e6f6ff', { angle: 0 });
  drawText(ctx, 'd', (startX + parentX) / 2, y3 - 70, { size: 34, mono: true, align: 'center' });
  drawText(ctx, 'd', (parentX + farX) / 2, y3 - 70, { size: 34, mono: true, align: 'center' });
  ctx.restore();

  // 4. dmax mengecil: makin lama makin sempit
  ctx.save();
  x = drawCardFrame(ctx, 3, bt, 'dmax mengecil', 'Dari luas ke terfokus', COLORS.skyLight);
  const shrink = (t * 0.16) % 1;
  const dmaxPx = lerp(150, 44, shrink);
  const c4 = { x: x + CARD_W / 2, y: cardCenterY };
  ctx.beginPath();
  ctx.arc(c4.x, c4.y, dmaxPx, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([11, 9]);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawSeaMarker(ctx, c4.x, c4.y, 26, t);
  drawText(ctx, 'dmax', c4.x, c4.y - dmaxPx - 24, { size: 28, mono: true, align: 'center' });
  ctx.restore();

  drawParamChips(
    ctx,
    [
      { label: 'Npop  tetesan', w: 300 },
      { label: 'Nsr  laut + sungai', w: 400 },
      { label: 'C  konstanta aliran', w: 410 },
      { label: 'dmax  batas penguapan', w: 400 }
    ],
    bt,
    COLORS.skyLight
  );
}

/* ---------- Slide: Cara kerja ---------- */

const HOW_SEA = { x: 1610, y: 620 };
const HOW_RIVERS = [
  { x: 1140, y: 390 },
  { x: 1140, y: 640 },
  { x: 1140, y: 870 }
];
// Alokasi proporsional NSn: Laut menerima aliran terbanyak
const STREAM_SLOTS = [
  { parent: -1, x: 1500, y: 340 },
  { parent: -1, x: 1720, y: 370 },
  { parent: -1, x: 1740, y: 860 },
  { parent: -1, x: 1480, y: 880 },
  { parent: 0, x: 690, y: 330 },
  { parent: 0, x: 680, y: 470 },
  { parent: 1, x: 660, y: 650 },
  { parent: 2, x: 690, y: 860 }
];
const parentOf = (slot) => (slot.parent < 0 ? HOW_SEA : HOW_RIVERS[slot.parent]);
const HOW_SCATTER = Array.from({ length: 12 }, (_, i) => ({
  x: 620 + noise(i + 12) * 1180,
  y: 320 + noise(i + 70) * 590
}));

function drawHierarchy(ctx, reveal) {
  STREAM_SLOTS.forEach((slot, i) => {
    const appear = seg(reveal, 0.4 + i * 0.05, 0.2);
    drawArrow(ctx, slot, parentOf(slot), {
      bend: 26,
      color: COLORS.skyLight,
      width: 4,
      progress: appear,
      head: false,
      alpha: 0.65
    });
  });
  HOW_RIVERS.forEach((rv, i) => {
    drawArrow(ctx, rv, HOW_SEA, { bend: 20, color: '#ffffff', width: 7, progress: seg(reveal, 0.3 + i * 0.06, 0.25), head: false });
  });
}

function beatHierarchy(ctx, bt, t) {
  const settle = seg(bt, 1.1, 1.0);
  const reveal = clamp01((bt - 2.1) / 1.6);
  drawHierarchy(ctx, reveal);

  // Tetesan acak bergerak ke posisi perannya
  HOW_SCATTER.forEach((from, i) => {
    const pop = seg(bt, i * 0.05, 0.4, easeBack);
    let to;
    if (i === 0) to = HOW_SEA;
    else if (i <= 3) to = HOW_RIVERS[i - 1];
    else to = STREAM_SLOTS[i - 4];
    const pos = arcPoint(from, to, 50, settle);
    if (settle > 0.7 && i === 0) drawSeaMarker(ctx, pos.x, pos.y, 62, t);
    else if (settle > 0.7 && i <= 3) drawRiverMarker(ctx, pos.x, pos.y, 34, `S${i}`);
    else drawDrop(ctx, pos.x, pos.y, 20 * Math.max(0.01, pop), '#e6f6ff', { angle: Math.PI / 2 });
  });

  const labels = seg(bt, 2.4, 0.5);
  drawPill(ctx, 'Laut · terbaik', HOW_SEA.x, HOW_SEA.y - 112, { size: 30, alpha: labels });
  drawPill(ctx, 'Sungai', HOW_RIVERS[0].x, HOW_RIVERS[0].y - 78, { size: 28, fill: COLORS.sky, alpha: labels });
  drawPill(ctx, 'Aliran', 680, 260, { size: 28, fill: '#e6f6ff', alpha: labels });
}

function beatFlow(ctx, bt, t) {
  drawHierarchy(ctx, 1);
  const loop = 3.2;
  const time = bt / loop;
  const cycle = Math.floor(time);
  const p = seg(time - cycle, 0.08, 0.6);

  STREAM_SLOTS.forEach((slot, i) => {
    const parent = parentOf(slot);
    const reach = 0.3 + noise(i + cycle * 3) * 1.7; // rand · C dengan C = 2
    const x = lerp(slot.x, lerp(slot.x, parent.x, reach), p);
    const y = lerp(slot.y, lerp(slot.y, parent.y, reach), p);
    drawDrop(ctx, x, y, 19, reach > 1 && p > 0.5 ? COLORS.gold : '#e6f6ff', {
      angle: Math.atan2(parent.y - slot.y, parent.x - slot.x)
    });
  });
  HOW_RIVERS.forEach((rv, i) => {
    const reach = 0.2 + noise(i + 30 + cycle * 3) * 0.5;
    drawRiverMarker(ctx, lerp(rv.x, HOW_SEA.x, reach * p), lerp(rv.y, HOW_SEA.y, reach * p), 34, `S${i + 1}`);
  });
  drawSeaMarker(ctx, HOW_SEA.x, HOW_SEA.y, 62, t);

  drawText(ctx, 'X + rand · C · (induk − X)', 1180, 300, { size: 40, mono: true, align: 'center', color: COLORS.gold, alpha: seg(bt, 0.3, 0.5) });
}

function beatSwap(ctx, bt) {
  const loop = bt % 7;
  const left = { x: 800, y: 660 };
  const right = { x: 1500, y: 660 };
  const swap = seg(loop, 2.2, 1);
  const flash = loop >= 2.2 ? Math.max(0, 1 - (loop - 2.2) / 1.4) : 0;

  const streamPos = arcPoint(left, right, 150, swap);
  const riverPos = arcPoint(right, left, 150, swap);

  // Sebelum tukar: Aliran di kiri (f lebih kecil), Sungai di kanan. Setelahnya posisi terbaik dipimpin Sungai.
  drawRiverMarker(ctx, riverPos.x, riverPos.y, 72);
  drawDrop(ctx, streamPos.x, streamPos.y, 44, '#e6f6ff', { angle: swap > 0.5 ? Math.PI : 0 });
  if (flash > 0) {
    drawGlow(ctx, 1150, 590, 360 * flash + 40, `rgba(253, 187, 22, ${0.75 * flash})`);
    drawRipple(ctx, 1150, 590, 1 - flash, COLORS.gold, 340);
  }

  const before = 1 - seg(loop, 1.9, 0.3);
  const after = seg(loop, 3.2, 0.4);
  drawPill(ctx, 'Aliran  f = 3,1', left.x, 830, { size: 34, fill: '#e6f6ff', alpha: before, mono: true });
  drawPill(ctx, 'Sungai  f = 4,7', right.x, 830, { size: 34, fill: COLORS.sky, alpha: before, mono: true });
  drawPill(ctx, 'Sungai baru  f = 3,1', left.x, 830, { size: 34, fill: COLORS.sky, alpha: after, mono: true });
  drawPill(ctx, 'Aliran baru  f = 4,7', right.x, 830, { size: 34, fill: '#e6f6ff', alpha: after, mono: true });
  drawText(ctx, 'f(aliran) < f(sungai)', 1150, 340, { size: 40, mono: true, align: 'center', color: COLORS.gold, alpha: seg(bt, 0.3, 0.5) });
}

function beatEvaporate(ctx, bt, t) {
  const loop = bt % 9;
  const sea = { x: 1180, y: 700 };
  const dmaxPx = lerp(230, 110, seg(loop, 6.4, 1.8));

  ctx.beginPath();
  ctx.arc(sea.x, sea.y, dmaxPx, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 12]);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawText(ctx, 'dmax', sea.x + dmaxPx + 18, sea.y, { size: 36, mono: true, weight: 800 });
  drawSeaMarker(ctx, sea.x, sea.y, 62, t);

  const cloud = { x: 1180, y: 345 };
  const cloudIn = seg(loop, 1.2, 0.8);
  drawCloud(ctx, cloud.x, cloud.y, 92, '#eaf2fb', cloudIn);

  // Sungai mendekat, masuk radius, menguap, lalu turun sebagai hujan di tempat acak
  const rivers = [
    { from: { x: 680, y: 560 }, inside: { x: 1040, y: 620 }, land: { x: 760, y: 860 } },
    { from: { x: 1680, y: 830 }, inside: { x: 1330, y: 790 }, land: { x: 1660, y: 520 } }
  ];
  rivers.forEach((rv, i) => {
    const approach = seg(loop, 0.1 + i * 0.25, 1.1);
    const vapor = seg(loop, 1.8 + i * 0.2, 1.6);
    const rain = seg(loop, 3.8 + i * 0.3, 1);
    const pos = { x: lerp(rv.from.x, rv.inside.x, approach), y: lerp(rv.from.y, rv.inside.y, approach) };

    if (vapor <= 0) {
      drawRiverMarker(ctx, pos.x, pos.y, 32, `S${i + 1}`);
    } else if (vapor < 1) {
      for (let k = 0; k < 5; k++) {
        const p = clamp01(vapor * 1.3 - k * 0.07);
        const vx = lerp(pos.x, cloud.x, p) + Math.sin(t * 3 + k) * 16;
        const vy = lerp(pos.y, cloud.y + 50, p);
        ctx.beginPath();
        ctx.arc(vx, vy, 13 + k * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * (1 - p * 0.65)})`;
        ctx.fill();
      }
    }

    if (rain > 0) {
      const start = { x: cloud.x, y: cloud.y + 60 };
      const dropPos = arcPoint(start, rv.land, -40, rain);
      if (rain < 1) drawDrop(ctx, dropPos.x, dropPos.y, 20, '#e6f6ff', { angle: Math.atan2(rv.land.y - start.y, rv.land.x - start.x) });
      else {
        drawDrop(ctx, rv.land.x, rv.land.y, 20, '#e6f6ff', { angle: Math.PI / 2 });
        drawRipple(ctx, rv.land.x, rv.land.y, seg(loop, 4.9 + i * 0.3, 1), '#ffffff', 90);
      }
    }
  });

  drawPill(ctx, 'dmax mengecil tiap iterasi', 1180, 960, { size: 30, alpha: seg(loop, 6.2, 0.4) });
  drawText(ctx, '‖Xsungai − Xlaut‖ < dmax', 1570, 300, { size: 34, mono: true, align: 'center', color: COLORS.gold, alpha: seg(bt, 0.3, 0.5) });
}

function drawHowScene(ctx, { t, bt, beat }) {
  fillBackground(ctx, 1920, 1080, DEEP_STOPS);
  if (beat === 0) beatHierarchy(ctx, bt, t);
  else if (beat === 1) beatFlow(ctx, bt, t);
  else if (beat === 2) beatSwap(ctx, bt);
  else beatEvaporate(ctx, bt, t);
}

/* ---------- Registri slide ---------- */

const CHAPTER = { id: 'wca', label: 'WCA' };
const wcaSlides = [
  {
    id: 'wca-inspirasi',
    chapter: CHAPTER,
    title: 'WCA: Inspirasi',
    beats: 3,
    notes: `
      <p><strong>WCA</strong> diperkenalkan Eskandar, Sadollah, Bahreininejad &amp; Hamdi (2012), diuji pada masalah desain rekayasa berkendala.</p>
      <ul>
        <li>Air hujan jatuh di pegunungan, membentuk aliran, bergabung ke sungai, lalu bermuara ke laut sebagai titik terendah.</li>
        <li>Penguapan dan hujan mengembalikan air ke tempat baru. Inilah cara WCA menjaga pencarian tetap luas.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'WCA · Eskandar dkk., 2012',
        beats: [
          { title: 'Hujan turun di gunung.', sub: 'Water Cycle Algorithm' },
          { title: 'Air mengalir ke titik terendah.', sub: 'Aliran → sungai → laut' },
          { title: 'Air menguap, lalu turun hujan.', sub: 'Pencarian berlanjut dari posisi baru.' }
        ],
        draw: drawCycleScene
      });
    }
  },
  {
    id: 'wca-karakter',
    chapter: CHAPTER,
    title: 'WCA: Karakteristik',
    notes: `
      <ul>
        <li><strong>Hierarki:</strong> 1 Laut (terbaik), Nsr − 1 Sungai, sisanya Aliran. Induk yang lebih baik menerima aliran lebih banyak.</li>
        <li><strong>Semua bergerak:</strong> seluruh aliran dan sungai diperbarui tiap iterasi, berbeda dari SFLA.</li>
        <li><strong>Melewati induk:</strong> dengan C = 2, langkah rand · C · d bisa sampai 2d, sehingga sisi seberang induk ikut dicari.</li>
        <li><strong>dmax mengecil:</strong> dmax berkurang tiap iterasi, peralihan dari eksplorasi ke eksploitasi.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'WCA · Karakteristik',
        beats: [{ title: 'Karakteristik WCA' }],
        draw: drawTraitsScene
      });
    }
  },
  {
    id: 'wca-cara',
    chapter: CHAPTER,
    title: 'WCA: Cara Kerja',
    beats: 4,
    notes: `
      <p>Tekan <kbd>&rarr;</kbd> untuk tiap tahap. Ini ilustrasi; simulasi langsung ada di slide berikutnya.</p>
      <ol>
        <li><strong>Hierarki:</strong> urutkan tetesan. Terbaik = Laut, berikutnya = Sungai, sisanya = Aliran. Jumlah aliran per induk proporsional dengan intensitasnya.</li>
        <li><strong>Aliran:</strong> X baru = X + rand · C · (induk − X). Tetesan emas menandai yang melewati induknya.</li>
        <li><strong>Pertukaran peran:</strong> bila aliran menemukan titik lebih rendah dari induknya, keduanya bertukar peran.</li>
        <li><strong>Penguapan &amp; hujan:</strong> sungai yang masuk radius dmax dari Laut menguap, lalu turun sebagai tetesan baru. dmax mengecil tiap iterasi.</li>
      </ol>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'WCA · Cara kerja',
        steps: ['Hierarki', 'Aliran', 'Pertukaran peran', 'Penguapan &amp; hujan'],
        beats: [
          { title: 'Solusi terbaik menjadi laut.' },
          { title: 'Aliran bergerak menuju induknya.' },
          { title: 'Lebih baik? Bertukar peran.' },
          { title: 'Terlalu dekat laut? Menguap.' }
        ],
        draw: drawHowScene
      });
    }
  },
  {
    id: 'wca-sim',
    chapter: CHAPTER,
    title: 'WCA: Simulasi',
    notes: `
      <p>Di sini <strong>WCAEngine</strong> benar-benar berjalan. Tekan <kbd>S</kbd> per tahap atau <kbd>P</kbd> untuk otomatis.</p>
      <ul>
        <li>Lingkaran bergaris = radius dmax di sekitar Laut, perhatikan radiusnya mengecil seiring iterasi.</li>
        <li>Belah ketupat = Sungai, tetesan = Aliran, lingkaran bercincin emas = Laut.</li>
        <li>Awan kecil menandai tetesan hujan baru setelah penguapan.</li>
      </ul>`,
    mount(container, ctx) {
      return mountSimulation(container, ctx, {
        idPrefix: 'wca',
        title: 'Simulasi WCA',
        kicker: 'WCA · Simulasi langsung',
        color: COLORS.skyLight,
        fillFlat: 'rgba(159, 220, 247, 0.16)',
        Engine: WCAEngine,
        renderer: new WCARenderer(),
        bestOf: (state) => state.bestSea,
        bestLabel: 'f(Laut) terbaik',
        phases: [
          { key: 'HIERARCHY', label: 'Hierarki' },
          { key: 'FLOW', label: 'Aliran' },
          { key: 'ROLE_SWAP', label: 'Tukar peran' },
          { key: 'EVAPORATION', label: 'Penguapan' },
          { key: 'RAIN', label: 'Hujan' }
        ],
        params: [
          { key: 'populationSize', label: 'Tetesan (Npop)', min: 12, max: 60, step: 4, value: 24 },
          { key: 'nsr', label: 'Laut + Sungai (Nsr)', min: 2, max: 8, step: 1, value: 4 },
          { key: 'dmax', label: 'dmax awal', min: 0.1, max: 1.5, step: 0.05, value: 0.45 },
          { key: 'flowConstant', label: 'Konstanta C', min: 1.2, max: 2, step: 0.1, value: 2 }
        ]
      });
    }
  }
];

  exports.wcaSlides = wcaSlides;
  },
  "render/wcaRenderer.js": function(exports, __require) {
/**
 * Renderer Visual WCA (Metafora Siklus Air Hidrologi)
 * Menggunakan Palet Resmi ITS: Biru Tua Lambang (#127BBE), FTK Summer Sky (#26AEE4),
 * Biru Muda Lambang (#75BDE0), dan Kuning Tua ITS (#FDBB16) untuk titik Laut terbaik.
 * Seluruh ukuran mengikuti faktor `u` dari ukuran kanvas agar konsisten di layar apa pun.
 */
const {  ContourMapCache, syncCanvasSize  } = __require("render/contourRenderer.js");
const {  COLORS, drawCloud, drawDrop, drawGlow, drawPill, drawText  } = __require("render/sprites.js");
function drawSeaMarker(ctx, x, y, size, time = 0) {
  drawGlow(ctx, x, y, size * 2.6, 'rgba(253, 187, 22, 0.42)');
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.blue;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = Math.max(2, size * 0.17);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.5, size * 0.13);
  ctx.lineCap = 'round';
  for (const row of [-0.26, 0.26]) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const px = -0.58 + (i / 12) * 1.16;
      const py = row + Math.sin(px * 7 + time * 2.4) * 0.09;
      if (i === 0) ctx.moveTo(x + px * size, y + py * size);
      else ctx.lineTo(x + px * size, y + py * size);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function drawRiverMarker(ctx, x, y, size, label = '') {
  drawGlow(ctx, x, y, size * 2, 'rgba(38, 174, 228, 0.5)');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - size * 1.15);
  ctx.lineTo(x + size * 1.15, y);
  ctx.lineTo(x, y + size * 1.15);
  ctx.lineTo(x - size * 1.15, y);
  ctx.closePath();
  ctx.fillStyle = COLORS.sky;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1.5, size * 0.14);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (label) drawText(ctx, label, x, y + 1, { size: size * 0.82, weight: 800, color: COLORS.night, align: 'center' });
}
class WCARenderer {
  constructor() {
    this.contourCache = new ContourMapCache();
  }

  render(canvas, state, objective, options = {}) {
    if (!canvas || !state) return;
    const { ctx, width, height } = syncCanvasSize(canvas);
    const alpha = options.alpha ?? 1;
    const timestamp = options.timestamp ?? 0;
    const compact = options.compact ?? false;
    const u = Math.min(width, height) / 900;

    const vp = this.contourCache.renderBackground(ctx, width, height, objective, 'water', {
      showOptimum: options.showOptimum ?? true
    });
    if (!vp) return;

    const screen = new Map();
    for (const d of state.drops) {
      screen.set(d.id, vp.worldToScreen(d.prevX + (d.x - d.prevX) * alpha, d.prevY + (d.y - d.prevY) * alpha));
    }

    const seaDrop = state.drops.find((d) => d.role === 'sea');

    // 1. Radius penguapan dmax di sekitar Laut
    if (seaDrop && state.phase !== 'INIT') {
      const seaPos = screen.get(seaDrop.id);
      const radius = Math.max(10 * u, vp.worldDistToPx(state.dmax));
      ctx.save();
      ctx.beginPath();
      ctx.arc(seaPos.x, seaPos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = state.phase === 'EVAPORATION' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(1.5, 2.4 * u);
      ctx.setLineDash([9 * u, 8 * u]);
      ctx.stroke();
      ctx.restore();
      if (!compact && radius > 34 * u) {
        drawText(ctx, 'dmax', seaPos.x + radius + 10 * u, seaPos.y, { size: 22 * u, color: COLORS.ink, mono: true });
      }
    }

    // 2. Jaringan aliran: garis bergerak menuju induk
    if (state.phase !== 'INIT') {
      ctx.save();
      ctx.lineCap = 'round';
      const dashOffset = -(timestamp * 0.05) % 40;
      for (const d of state.drops) {
        if (!d.parentId) continue;
        const from = screen.get(d.id);
        const to = screen.get(d.parentId);
        if (!from || !to || Math.hypot(to.x - from.x, to.y - from.y) < 6) continue;

        const isRiver = d.role === 'river';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(
          (from.x + to.x) / 2 - (to.y - from.y) * 0.14,
          (from.y + to.y) / 2 + (to.x - from.x) * 0.14,
          to.x,
          to.y
        );
        ctx.strokeStyle = isRiver ? 'rgba(255, 255, 255, 0.8)' : 'rgba(205, 236, 255, 0.42)';
        ctx.lineWidth = (isRiver ? 4 : 2) * u;
        ctx.setLineDash(isRiver ? [18 * u, 12 * u] : [8 * u, 10 * u]);
        ctx.lineDashOffset = dashOffset * u;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Kilatan pertukaran peran
    if (state.phase === 'ROLE_SWAP') {
      state.swaps.forEach((swap, i) => this.drawSwap(ctx, vp, swap, alpha, u, i === 0 && !compact));
    }

    // 4. Urutan gambar: Aliran -> Sungai -> Laut
    const orderRank = { stream: 0, river: 1, sea: 2 };
    const ordered = [...state.drops].sort((a, b) => (orderRank[a.role] ?? 0) - (orderRank[b.role] ?? 0));

    for (const d of ordered) {
      const pos = screen.get(d.id);
      if (d.role === 'sea') {
        drawSeaMarker(ctx, pos.x, pos.y, (compact ? 18 : 24) * u, timestamp / 1000);
        if (!compact) {
          drawPill(ctx, 'Laut', pos.x, pos.y - 48 * u, { size: Math.max(11, 20 * u) });
        }
      } else if (d.role === 'river') {
        drawRiverMarker(ctx, pos.x, pos.y, (compact ? 13 : 17) * u, compact ? '' : `S${d.riverIndex}`);
      } else {
        const parent = d.parentId ? screen.get(d.parentId) : null;
        const angle = parent ? Math.atan2(parent.y - pos.y, parent.x - pos.x) : Math.PI / 2;
        drawDrop(ctx, pos.x, pos.y, (compact ? 7.5 : 10) * u, '#e6f6ff', { angle });
      }

      if (state.phase === 'EVAPORATION' && d.evaporating) this.drawVapor(ctx, pos.x, pos.y, alpha, u);
      if (state.phase === 'RAIN' && d.justRained) this.drawRain(ctx, pos.x, pos.y, alpha, u);
    }
  }

  drawSwap(ctx, vp, swap, alpha, u, withLabel) {
    const a = vp.worldToScreen(swap.fromX, swap.fromY);
    const b = vp.worldToScreen(swap.toX, swap.toY);
    ctx.save();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4 * u;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.lineWidth = 3 * u;
    ctx.globalAlpha = 1 - alpha * 0.7;
    for (const pt of [a, b]) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (16 + alpha * 34) * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    if (withLabel) drawPill(ctx, 'Bertukar peran', a.x, a.y - 44 * u, { size: Math.max(11, 22 * u) });
  }

  drawVapor(ctx, x, y, alpha, u) {
    ctx.save();
    const rise = alpha * 70 * u;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + (i - 1) * 13 * u, y - rise - i * 16 * u, (8 + i * 3) * u, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.82 - alpha * 0.42})`;
      ctx.fill();
    }
    ctx.restore();
  }

  drawRain(ctx, x, y, alpha, u) {
    const cloudY = y - 92 * u;
    drawCloud(ctx, x, cloudY, 24 * u, '#e6f0fa', 1 - alpha * 0.8);
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * u;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 1 - alpha * 0.5;
    for (const dx of [-14, 0, 14]) {
      const top = cloudY + 22 * u + alpha * 34 * u + Math.abs(dx) * u;
      ctx.beginPath();
      ctx.moveTo(x + dx * u + 3 * u, top);
      ctx.lineTo(x + dx * u, top + 16 * u);
      ctx.stroke();
    }
    ctx.globalAlpha = Math.max(0, 0.9 - alpha * 0.9);
    ctx.lineWidth = 2.6 * u;
    ctx.beginPath();
    ctx.arc(x, y, (12 + alpha * 32) * u, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

  exports.drawSeaMarker = drawSeaMarker;
  exports.drawRiverMarker = drawRiverMarker;
  exports.WCARenderer = WCARenderer;
  },
  "algorithms/wca.js": function(exports, __require) {
/**
 * Water Cycle Algorithm (WCA) — Mesin Status Murni (Tanpa DOM)
 * Referensi: Eskandar, H., Sadollah, A., Bahreininejad, A., & Hamdi, M. (2012).
 *
 * Urutan event tahap (Acceptance Criterion #3):
 *   INIT -> HIERARCHY -> FLOW -> ROLE_SWAP -> EVAPORATION -> RAIN -> FLOW -> ... -> DONE
 */const {  createRng  } = __require("core/rng.js");const {  clampCoord  } = __require("core/objectives.js");class WCAEngine {
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
  "slides/kasusSlides.js": function(exports, __require) {
/**
 * Bab perbandingan & studi kasus: adu SFLA vs WCA pada peta yang sama, pemetaan solusi ke jadwal,
 * penjadwalan 16 tugas ke 4 VM, serta kesimpulan. Semua angka dihitung langsung dari mesin algoritma.
 */
const {  createRng  } = __require("core/rng.js");
const {  getObjective  } = __require("core/objectives.js");
const {  SimulationRunner  } = __require("core/engine.js");
const {  SFLAEngine  } = __require("algorithms/sfla.js");
const {  WCAEngine  } = __require("algorithms/wca.js");
const { 
  CloudScheduleOptimizer,
  DEFAULT_VMS,
  evaluateSchedule,
  generateCloudTasks
 } = __require("algorithms/cloudScheduling.js");
const {  renderConvergenceChart  } = __require("render/chart.js");
const {  SFLARenderer  } = __require("render/sflaRenderer.js");
const {  WCARenderer  } = __require("render/wcaRenderer.js");
const {  createStage, easeOut, lerp, seg  } = __require("render/stage.js");
const {  COLORS, arcPoint, drawDrop, drawFrog, drawPill, drawText, fillBackground  } = __require("render/sprites.js");
const {  mountScene  } = __require("slides/common.js");
const {  formatFitness, objectiveButtonsHtml  } = __require("slides/simulation.js");

const CHAPTER_DUEL = { id: 'adu', label: 'Perbandingan' };
const CHAPTER_CASE = { id: 'kasus', label: 'Studi kasus' };
const CHAPTER_END = { id: 'penutup', label: 'Penutup' };

const VM_COLORS = ['#7fd0ff', '#5fe0d2', '#ffc66b', '#f9a071'];

/* ---------- Slide: Adu SFLA vs WCA ---------- */

const DUEL_POP = 24;
const DUEL_ITER = 35;

function mountDuel(container, { reducedMotion, registerHooks }) {
  container.innerHTML = `
    <div class="duel">
      <header class="duel-head">
        <div>
          <p class="kicker">Posisi awal, fungsi, dan ukuran populasi sama</p>
          <h1 class="sim-title">Mana yang lebih cepat konvergen?</h1>
        </div>
        <div class="transport">
          <div class="seg-group" id="duel-objectives">${objectiveButtonsHtml('rastrigin')}</div>
          <button type="button" class="btn btn-primary" id="duel-play">Mulai <kbd>P</kbd></button>
          <button type="button" class="btn" id="duel-step">+1 <kbd>S</kbd></button>
          <button type="button" class="btn" id="duel-reset">Reset <kbd>R</kbd></button>
        </div>
      </header>
      <div class="duel-maps">
        <div class="duel-map duel-sfla">
          <canvas id="duel-sfla-canvas"></canvas>
          <div class="duel-score"><span>SFLA</span><strong id="duel-sfla-best"></strong></div>
        </div>
        <div class="duel-map duel-wca">
          <canvas id="duel-wca-canvas"></canvas>
          <div class="duel-score"><span>WCA</span><strong id="duel-wca-best"></strong></div>
        </div>
      </div>
      <div class="duel-chart">
        <canvas id="duel-chart"></canvas>
        <span class="duel-iter" id="duel-iter"></span>
      </div>
    </div>
  `;

  const sflaCanvas = container.querySelector('#duel-sfla-canvas');
  const wcaCanvas = container.querySelector('#duel-wca-canvas');
  const chartCanvas = container.querySelector('#duel-chart');
  const playBtn = container.querySelector('#duel-play');
  const objectiveBtns = [...container.querySelectorAll('#duel-objectives .seg-btn')];
  const sflaRenderer = new SFLARenderer();
  const wcaRenderer = new WCARenderer();

  let objective = getObjective('rastrigin');
  let sfla;
  let wca;

  function buildEngines() {
    const seed = 42;
    const rng = createRng(seed);
    const initialPositions = Array.from({ length: DUEL_POP }, () => ({
      x: rng.range(objective.min, objective.max),
      y: rng.range(objective.min, objective.max)
    }));
    sfla = new SFLAEngine({
      objective,
      populationSize: DUEL_POP,
      memeplexCount: 4,
      localIterations: 3,
      maxStep: 3.2,
      maxIterations: DUEL_ITER,
      seed,
      initialPositions
    });
    wca = new WCAEngine({
      objective,
      populationSize: DUEL_POP,
      nsr: 4,
      dmax: 0.45,
      flowConstant: 2,
      maxIterations: DUEL_ITER,
      seed,
      initialPositions
    });
  }

  function updateReadout() {
    const s = sfla.getState();
    const w = wca.getState();
    const sflaBest = container.querySelector('#duel-sfla-best');
    const wcaBest = container.querySelector('#duel-wca-best');
    const iter = container.querySelector('#duel-iter');
    if (sflaBest) sflaBest.textContent = formatFitness(s.bestFrog.fitness);
    if (wcaBest) wcaBest.textContent = formatFitness(w.bestSea.fitness);
    if (iter) iter.textContent = `Iterasi ${s.iteration}/${DUEL_ITER}`;
    renderConvergenceChart(
      chartCanvas,
      [
        { label: 'SFLA', color: COLORS.toscaLight, data: s.history },
        { label: 'WCA', color: COLORS.skyLight, data: w.history }
      ],
      { maxIterations: DUEL_ITER }
    );
  }

  // Satu iterasi penuh terdiri dari banyak tahap; posisi awal disimpan agar perpindahannya tetap teranimasi
  function advance(engine, agents) {
    const before = new Map(agents().map((a) => [a.id, { x: a.x, y: a.y }]));
    engine.stepFullIteration();
    for (const agent of agents()) {
      const from = before.get(agent.id);
      agent.prevX = from.x;
      agent.prevY = from.y;
    }
  }

  const runner = new SimulationRunner({
    stepsPerSecond: 2,
    reducedMotion,
    onStep: () => {
      advance(sfla, () => sfla.getState().frogs);
      advance(wca, () => wca.getState().drops);
      updateReadout();
      return sfla.getState().phase === 'DONE' && wca.getState().phase === 'DONE';
    },
    onRender: (alpha, now) => {
      sflaRenderer.render(sflaCanvas, sfla.getState(), objective, { alpha, compact: true });
      wcaRenderer.render(wcaCanvas, wca.getState(), objective, {
        alpha,
        compact: true,
        timestamp: reducedMotion ? 0 : now
      });
    }
  });

  runner.onPlayStateChange = (playing) => {
    if (playBtn) playBtn.innerHTML = `${playing ? 'Jeda' : 'Mulai'} <kbd>P</kbd>`;
  };

  const togglePlay = () => {
    runner.setSpeed(2);
    runner.togglePlay();
  };
  const step = () => runner.stepOnce();
  const reset = () => {
    runner.pause();
    buildEngines();
    updateReadout();
    runner.notifyReset();
    runner.setSpeed(2);
  };

  playBtn?.addEventListener('click', togglePlay);
  container.querySelector('#duel-step')?.addEventListener('click', step);
  container.querySelector('#duel-reset')?.addEventListener('click', reset);
  objectiveBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      objectiveBtns.forEach((b) => b.classList.toggle('active', b === btn));
      objective = getObjective(btn.dataset.obj);
      reset();
    });
  });

  registerHooks?.({ togglePlay, step, reset });

  const onResize = () => updateReadout();
  window.addEventListener('resize', onResize);

  buildEngines();
  updateReadout();
  runner.startLoop();

  return () => {
    window.removeEventListener('resize', onResize);
    runner.destroy();
  };
}

/* ---------- Slide: Dari posisi ke jadwal ---------- */

const CELL_W = 104;
const CELL_GAP = 8;
const CELLS_X = (1920 - (16 * CELL_W + 15 * CELL_GAP)) / 2;
const cellX = (i) => CELLS_X + i * (CELL_W + CELL_GAP);
const ROW_VALUE_Y = 370;
const ROW_VM_Y = 500;
const LANE_X = 200;
const LANE_Y = (vm) => 610 + vm * 92;
const LANE_H = 76;

function buildEncodingData() {
  const tasks = generateCloudTasks(16, 42);
  const rng = createRng(7);
  const vector = tasks.map(() => rng.range(0, DEFAULT_VMS.length - 1e-6));
  const result = evaluateSchedule(vector, tasks, DEFAULT_VMS);
  const secondPx = 1360 / result.makespan;
  const offsets = DEFAULT_VMS.map(() => 0);
  const blocks = tasks.map((task, i) => {
    const vm = result.assignment[i];
    const width = (task.mi / DEFAULT_VMS[vm].mips) * secondPx;
    const x = LANE_X + offsets[vm];
    offsets[vm] += width;
    return { vm, x, width, name: task.name };
  });
  return { vector, result, blocks, makespanX: LANE_X + result.makespan * secondPx };
}

function drawEncodingScene(data) {
  return (ctx, { t, bt, beat }) => {
    fillBackground(ctx, 1920, 1080, ['#03132b', '#07244a', '#03132b']);
    const time = beat === 0 ? bt : 60;

    // Katak dan tetesan sama-sama membawa satu vektor posisi
    drawFrog(ctx, 1590, 130, 48, COLORS.toscaLight, { lift: Math.abs(Math.sin(t * 2)) * 16 });
    drawText(ctx, '=', 1680, 130, { size: 58, weight: 800, align: 'center' });
    drawDrop(ctx, 1770, 130, 34, COLORS.skyLight, { angle: Math.PI / 2 });

    data.vector.forEach((value, i) => {
      const appear = seg(time, 0.1 + i * 0.06, 0.4, easeOut);
      const vm = data.result.assignment[i];
      const x = cellX(i);
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.beginPath();
      ctx.roundRect(x, ROW_VALUE_Y - 44, CELL_W, 88, 12);
      ctx.fillStyle = 'rgba(242, 247, 255, 0.1)';
      ctx.fill();
      ctx.restore();
      drawText(ctx, value.toFixed(2), x + CELL_W / 2, ROW_VALUE_Y, { size: 36, mono: true, align: 'center', alpha: appear });
      drawText(ctx, `T${i + 1}`, x + CELL_W / 2, ROW_VALUE_Y - 68, { size: 25, mono: true, align: 'center', color: COLORS.muted, alpha: appear });

      const mapped = seg(time, 1.8 + i * 0.08, 0.4);
      if (mapped > 0) {
        ctx.save();
        ctx.strokeStyle = VM_COLORS[vm];
        ctx.globalAlpha = mapped;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + CELL_W / 2, ROW_VALUE_Y + 46);
        ctx.lineTo(x + CELL_W / 2, ROW_VM_Y - 36);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(x, ROW_VM_Y - 34, CELL_W, 68, 12);
        ctx.fillStyle = VM_COLORS[vm];
        ctx.fill();
        ctx.restore();
        drawText(ctx, `VM${vm + 1}`, x + CELL_W / 2, ROW_VM_Y + 1, { size: 32, weight: 800, mono: true, align: 'center', color: COLORS.night, alpha: mapped });
      }
    });

    drawPill(ctx, 'VM = floor(x) + 1', 960, 1060 - 80, {
      size: 36,
      mono: true,
      alpha: beat === 0 ? seg(bt, 3.2, 0.5) : 0
    });

    if (beat === 1) {
      DEFAULT_VMS.forEach((vm, v) => {
        drawText(ctx, `VM${v + 1}`, LANE_X - 24, LANE_Y(v) + LANE_H / 2, { size: 32, weight: 800, align: 'right', color: VM_COLORS[v] });
        ctx.beginPath();
        ctx.roundRect(LANE_X, LANE_Y(v), 1520, LANE_H, 10);
        ctx.fillStyle = 'rgba(242, 247, 255, 0.05)';
        ctx.fill();
      });
      data.blocks.forEach((block, i) => {
        const fly = seg(bt, 0.2 + i * 0.14, 0.6);
        const from = { x: cellX(i), y: ROW_VM_Y - 34 };
        const to = { x: block.x, y: LANE_Y(block.vm) };
        const pos = arcPoint(from, to, 30, fly);
        ctx.beginPath();
        ctx.roundRect(pos.x, pos.y, lerp(CELL_W, block.width - 3, fly), lerp(68, LANE_H, fly), 8);
        ctx.fillStyle = VM_COLORS[block.vm];
        ctx.fill();
        if (fly >= 1 && block.width > 56) {
          drawText(ctx, block.name, block.x + block.width / 2, LANE_Y(block.vm) + LANE_H / 2, {
            size: 25,
            weight: 800,
            mono: true,
            align: 'center',
            color: COLORS.night
          });
        }
      });
      const reveal = seg(bt, 2.8, 0.6);
      if (reveal > 0) {
        ctx.save();
        ctx.globalAlpha = reveal;
        ctx.strokeStyle = COLORS.danger;
        ctx.lineWidth = 5;
        ctx.setLineDash([16, 10]);
        ctx.beginPath();
        ctx.moveTo(data.makespanX, 590);
        ctx.lineTo(data.makespanX, 985);
        ctx.stroke();
        ctx.restore();
        drawPill(ctx, `makespan ${data.result.makespan.toFixed(1)} dtk`, Math.min(1500, data.makespanX), 572, {
          size: 30,
          fill: COLORS.danger,
          alpha: reveal,
          weight: 800
        });
      }
    }
  };
}

/* ---------- Slide: Studi kasus berjalan ---------- */

const CLOUD_ITER = 35;
const PANEL_W = 600;
const PANEL_Y = 150;
const PANEL_H = 590;
const BAR_BASE = PANEL_Y + PANEL_H - 56;
const BAR_MAX = 340;
const panelX = (i) => 40 + i * (PANEL_W + 20);

function mountCloudRun(container, { reducedMotion, registerHooks }) {
  container.innerHTML = `
    <canvas class="scene-canvas" id="cloud-canvas"></canvas>
    <header class="duel-head cloud-head">
      <div>
        <p class="kicker">Studi kasus · 16 tugas ke 4 VM</p>
        <h1 class="sim-title">Makespan semakin kecil.</h1>
      </div>
      <div class="transport">
        <div class="seg-group" id="cloud-scenarios">
          <button type="button" class="seg-btn active" data-seed="42">Skenario A</button>
          <button type="button" class="seg-btn" data-seed="108">Skenario B</button>
          <button type="button" class="seg-btn" data-seed="2026">Skenario C</button>
        </div>
        <button type="button" class="btn btn-primary" id="cloud-play">Jalankan <kbd>P</kbd></button>
        <button type="button" class="btn" id="cloud-step">+1 <kbd>S</kbd></button>
        <button type="button" class="btn" id="cloud-reset">Reset <kbd>R</kbd></button>
      </div>
    </header>
    <div class="cloud-chart"><canvas id="cloud-chart"></canvas></div>
  `;

  const chartCanvas = container.querySelector('#cloud-chart');
  const playBtn = container.querySelector('#cloud-play');
  const scenarioBtns = [...container.querySelectorAll('#cloud-scenarios .seg-btn')];

  let seed = 42;
  let optimizer;
  let playing = false;
  let stepClock = 0;
  let scale = 1;
  const shown = { rr: null, sfla: null, wca: null };

  function resetOptimizer() {
    optimizer = new CloudScheduleOptimizer({
      tasks: generateCloudTasks(16, seed),
      populationSize: 28,
      maxIterations: CLOUD_ITER,
      seed
    });
    const state = optimizer.getState();
    // Skala tinggi dikunci pada kondisi terburuk di awal agar penurunan batang terlihat apa adanya
    scale = BAR_MAX / Math.max(state.baselineRR.makespan, state.bestSfla.eval.makespan, state.bestWca.eval.makespan);
    shown.rr = state.baselineRR.vmLoads.slice();
    shown.sfla = state.bestSfla.eval.vmLoads.slice();
    shown.wca = state.bestWca.eval.vmLoads.slice();
    renderChart();
  }

  function renderChart() {
    const state = optimizer.getState();
    renderConvergenceChart(
      chartCanvas,
      [
        { label: 'SFLA', color: COLORS.toscaLight, data: state.historySfla },
        { label: 'WCA', color: COLORS.skyLight, data: state.historyWca }
      ],
      { maxIterations: CLOUD_ITER }
    );
  }

  function setPlaying(next) {
    playing = next;
    if (playBtn) playBtn.innerHTML = `${playing ? 'Jeda' : 'Jalankan'} <kbd>P</kbd>`;
  }

  function stepOptimizer() {
    optimizer.step();
    renderChart();
    if (optimizer.getState().done) setPlaying(false);
  }

  function drawPanel(ctx, index, name, color, schedule, displayLoads, baseline) {
    const x = panelX(index);
    ctx.beginPath();
    ctx.roundRect(x, PANEL_Y, PANEL_W, PANEL_H, 24);
    ctx.fillStyle = 'rgba(242, 247, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    drawText(ctx, name, x + 32, PANEL_Y + 50, { size: 38, weight: 800, color });
    drawText(ctx, `${schedule.makespan.toFixed(2)} dtk`, x + PANEL_W - 30, PANEL_Y + 50, {
      size: 44,
      weight: 800,
      mono: true,
      align: 'right'
    });
    if (baseline && schedule.makespan < baseline) {
      const saved = ((baseline - schedule.makespan) / baseline) * 100;
      drawPill(ctx, `−${saved.toFixed(1)}%`, x + PANEL_W - 90, PANEL_Y + 108, { size: 28, fill: color, weight: 800 });
    }

    const barW = 112;
    const gap = (PANEL_W - 64 - barW * 4) / 3;
    let tallest = 0;
    DEFAULT_VMS.forEach((vm, v) => {
      const bx = x + 32 + v * (barW + gap);
      const target = schedule.vmLoads[v];
      displayLoads[v] = reducedMotion ? target : lerp(displayLoads[v], target, 0.16);
      const fullHeight = displayLoads[v] * scale;
      tallest = Math.max(tallest, fullHeight);

      // Blok per tugas; tingginya sebanding waktu eksekusi di VM ini
      const stretch = target > 1e-6 ? displayLoads[v] / target : 0;
      let top = BAR_BASE;
      for (const task of schedule.vmTasks[v]) {
        const h = task.execSec * scale * stretch;
        top -= h;
        ctx.beginPath();
        ctx.roundRect(bx, top, barW, Math.max(2, h - 2), 5);
        ctx.fillStyle = VM_COLORS[v];
        ctx.fill();
      }
      drawText(ctx, `VM${v + 1}`, bx + barW / 2, BAR_BASE + 28, { size: 26, weight: 700, align: 'center', color: COLORS.muted });
    });

    ctx.save();
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 9]);
    ctx.beginPath();
    ctx.moveTo(x + 16, BAR_BASE - tallest);
    ctx.lineTo(x + PANEL_W - 16, BAR_BASE - tallest);
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx, { dt }) {
    fillBackground(ctx, 1920, 1080, ['#03132b', '#07244a', '#03132b']);

    if (playing) {
      stepClock += dt;
      if (stepClock >= 0.14) {
        stepClock = 0;
        stepOptimizer();
      }
    }

    const state = optimizer.getState();
    const baseline = state.baselineRR.makespan;
    drawPanel(ctx, 0, 'Round-Robin', COLORS.coral, state.baselineRR, shown.rr, null);
    drawPanel(ctx, 1, 'SFLA', COLORS.toscaLight, state.bestSfla.eval, shown.sfla, baseline);
    drawPanel(ctx, 2, 'WCA', COLORS.skyLight, state.bestWca.eval, shown.wca, baseline);
    drawText(ctx, `Iterasi ${state.iteration}/${CLOUD_ITER}`, 1880, 776, { size: 26, mono: true, align: 'right', color: COLORS.muted });
  }

  const stage = createStage(container.querySelector('#cloud-canvas'), draw, { reducedMotion });

  const togglePlay = () => {
    if (optimizer.getState().done) resetOptimizer();
    setPlaying(!playing);
  };
  const step = () => {
    setPlaying(false);
    stepOptimizer();
  };
  const reset = () => {
    setPlaying(false);
    resetOptimizer();
  };

  playBtn?.addEventListener('click', togglePlay);
  container.querySelector('#cloud-step')?.addEventListener('click', step);
  container.querySelector('#cloud-reset')?.addEventListener('click', reset);
  scenarioBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      scenarioBtns.forEach((b) => b.classList.toggle('active', b === btn));
      seed = Number(btn.dataset.seed);
      reset();
    });
  });

  registerHooks?.({ togglePlay, step, reset });

  const onResize = () => renderChart();
  window.addEventListener('resize', onResize);

  resetOptimizer();

  return () => {
    window.removeEventListener('resize', onResize);
    stage.destroy();
  };
}

/* ---------- Slide: Perbandingan ringkas ---------- */

const COMPARE_ROWS = [
  { label: 'Inspirasi', sfla: 'Katak mencari makanan', wca: 'Siklus air' },
  { label: 'Struktur', sfla: 'Beberapa memeplex', wca: 'Laut › Sungai › Aliran' },
  { label: 'Agen yang bergerak', sfla: 'Katak terburuk tiap memeplex', wca: 'Semua aliran & sungai' },
  { label: 'Menghindari minimum lokal', sfla: 'Shuffle + posisi acak', wca: 'Penguapan + hujan' },
  { label: 'Parameter utama', sfla: 'm, N, Dmax', wca: 'Nsr, C, dmax' }
];

function mountCompare(container) {
  container.innerHTML = `
    <div class="compare">
      <p class="kicker">Perbandingan</p>
      <div class="compare-grid">
        <div class="compare-head compare-sfla">SFLA</div>
        <div></div>
        <div class="compare-head compare-wca">WCA</div>
        ${COMPARE_ROWS.map(
          (row, i) => `
            <div class="compare-cell compare-sfla" style="--i:${i}">${row.sfla}</div>
            <div class="compare-label" style="--i:${i}">${row.label}</div>
            <div class="compare-cell compare-wca" style="--i:${i}">${row.wca}</div>`
        ).join('')}
      </div>
    </div>
  `;
}

/* ---------- Slide: Kesimpulan ---------- */

const SUMMARY_SEEDS = [1, 7, 13, 42, 99, 123, 256, 512, 777, 2026];

/** Rata-rata makespan pada 10 beban kerja berbeda, dengan pengaturan yang sama seperti studi kasus. */
function computeSummary() {
  const total = { rr: 0, sfla: 0, wca: 0 };
  for (const seed of SUMMARY_SEEDS) {
    const optimizer = new CloudScheduleOptimizer({
      tasks: generateCloudTasks(16, seed),
      populationSize: 28,
      maxIterations: CLOUD_ITER,
      seed
    });
    while (!optimizer.getState().done) optimizer.step();
    const state = optimizer.getState();
    total.rr += state.baselineRR.makespan;
    total.sfla += state.bestSfla.eval.makespan;
    total.wca += state.bestWca.eval.makespan;
  }
  return {
    rr: total.rr / SUMMARY_SEEDS.length,
    sfla: total.sfla / SUMMARY_SEEDS.length,
    wca: total.wca / SUMMARY_SEEDS.length
  };
}

function drawSummaryScene(summary) {
  const rows = [
    { name: 'Round-Robin', value: summary.rr, color: COLORS.coral },
    { name: 'SFLA', value: summary.sfla, color: COLORS.toscaLight },
    { name: 'WCA', value: summary.wca, color: COLORS.skyLight }
  ];
  const trackX = 420;
  const trackW = 1130;

  return (ctx, { bt }) => {
    fillBackground(ctx, 1920, 1080, ['#03132b', '#071f42', '#03132b']);
    rows.forEach((row, i) => {
      const y = 330 + i * 118;
      const grow = seg(bt, 0.3 + i * 0.3, 1.1, easeOut);
      drawText(ctx, row.name, trackX - 30, y, { size: 40, weight: 800, align: 'right', color: row.color });
      ctx.beginPath();
      ctx.roundRect(trackX, y - 38, Math.max(4, (row.value / summary.rr) * trackW * grow), 76, 14);
      ctx.fillStyle = row.color;
      ctx.fill();
      drawText(ctx, `${(row.value * grow).toFixed(2)} dtk`, trackX + (row.value / summary.rr) * trackW * grow + 24, y, {
        size: 40,
        weight: 800,
        mono: true
      });
    });
    drawText(ctx, 'rata-rata makespan, 10 beban kerja', trackX, 668, { size: 28, weight: 500, color: COLORS.muted, alpha: seg(bt, 1.4, 0.5) });
  };
}

const REFERENCES_HTML = `
  <ol class="refs">
    <li>Eusuff &amp; Lansey (2003). Desain jaringan distribusi air dengan SFLA. <em>J. Water Resources Planning and Management</em>, 129(3).</li>
    <li>Eskandar dkk. (2012). WCA untuk desain rekayasa berkendala. <em>Computers &amp; Structures</em>, 110–111.</li>
  </ol>`;

/* ---------- Registri slide ---------- */
const kasusSlides = [
  {
    id: 'adu',
    chapter: CHAPTER_DUEL,
    title: 'Perbandingan SFLA vs WCA',
    notes: `
      <p>Kedua algoritma berjalan langsung dengan posisi awal yang sama, fungsi yang sama, dan 24 agen. Tiap langkah = 1 iterasi penuh.</p>
      <ul>
        <li>Pada uji 10 seed (40 iterasi), WCA rata-rata lebih rendah pada iterasi ke-5 di ketiga fungsi: awal yang lebih cepat.</li>
        <li>Hasil akhirnya bergantung fungsi dan seed. Tidak ada yang selalu menang, jadi hasil seed yang tampil belum tentu mewakili.</li>
      </ul>`,
    mount: mountDuel
  },
  {
    id: 'kasus-kode',
    chapter: CHAPTER_CASE,
    title: 'Dari Posisi ke Jadwal',
    beats: 2,
    notes: `
      <ul>
        <li>SFLA dan WCA bekerja di ruang kontinu, sedangkan jadwal bersifat diskrit. Satu katak atau tetesan = vektor 16 angka dalam [0, 4).</li>
        <li>Tiap angka mewakili satu tugas. floor(x) memilih VM-nya. Angka 2,71 berarti VM ke-3.</li>
        <li>Beat 2: vektor ini menjadi jadwal utuh, dan nilai fitness-nya adalah makespan jadwal itu (ditambah penalti kecil ketidakseimbangan beban di kode).</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'Studi kasus · Representasi solusi',
        beats: [
          { title: 'Satu katak = satu jadwal.' },
          { title: 'Fitness jadwal = makespan.' }
        ],
        draw: drawEncodingScene(buildEncodingData())
      });
    }
  },
  {
    id: 'kasus-run',
    chapter: CHAPTER_CASE,
    title: 'Studi Kasus: Penjadwalan 16 Tugas ke 4 VM',
    notes: `
      <p>Tekan <kbd>P</kbd>. Optimizer berjalan langsung dengan populasi awal yang sama untuk SFLA dan WCA: 28 agen, 35 iterasi.</p>
      <ul>
        <li>Round-Robin membagi tugas bergilir tanpa melihat ukuran tugas atau kecepatan VM, jadi nilainya tetap.</li>
        <li>Batang VM adalah beban waktu tiap VM, tiap blok satu tugas. Garis merah = makespan.</li>
        <li>VM-4 (175 MIPS) wajar menerima lebih banyak tugas karena paling cepat.</li>
        <li>Ganti Skenario A/B/C untuk menunjukkan beban kerja lain.</li>
      </ul>`,
    mount: mountCloudRun
  },
  {
    id: 'ringkas',
    chapter: CHAPTER_END,
    title: 'Perbandingan SFLA dan WCA',
    notes: `
      <p>Ringkasan perbedaan mekanisme. SFLA memperbarui sedikit agen per langkah dan mengandalkan shuffle. WCA menggerakkan semua agen dengan hierarki terpusat dan mengandalkan penguapan.</p>`,
    mount: mountCompare
  },
  {
    id: 'penutup',
    chapter: CHAPTER_END,
    title: 'Kesimpulan',
    notes: `
      <ul>
        <li>Grafik dihitung langsung saat slide dibuka: rata-rata 10 beban kerja, 16 tugas, 4 VM, 28 agen, 35 iterasi.</li>
        <li>Keduanya jauh lebih baik dari Round-Robin. Selisih SFLA dan WCA jauh lebih kecil daripada selisih keduanya dengan Round-Robin.</li>
        <li>Ini perbandingan demo pada satu skenario kecil, bukan uji statistik atau uji di cloud sungguhan.</li>
        <li>Algoritma terbaik bergantung pada masalahnya (<em>no free lunch</em>): pada uji fungsi benchmark, urutan keduanya berubah-ubah.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'Kesimpulan',
        beats: [{ title: 'Keduanya unggul dari Round-Robin.', sub: 'Algoritma terbaik bergantung pada masalahnya.' }],
        draw: drawSummaryScene(computeSummary()),
        extraHtml: REFERENCES_HTML
      });
    }
  }
];

  exports.kasusSlides = kasusSlides;
  }
});
