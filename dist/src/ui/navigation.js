/**
 * Pengendali Deck Presentasi
 * Menangani panggung 1920x1080 yang diskalakan ke layar, perpindahan slide & beat,
 * rel progres per bab, pintasan keyboard/clicker, dan pembersihan loop animasi.
 */

const DECK_WIDTH = 1920;
const DECK_HEIGHT = 1080;
const LEAVE_MS = 420;

export class DeckController {
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
