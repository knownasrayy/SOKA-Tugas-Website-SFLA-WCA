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

export class DeckController {
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

