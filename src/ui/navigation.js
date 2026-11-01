/**
 * Pengelola Navigasi 4-Tab Workspace ITS
 * Menangani perpindahan antar tab modul (#konsep, #sfla, #wca, #komparasi),
 * pintasan keyboard laboratorium (1-4, P, S, R, N, F, ?), dan pembersihan loop Canvas 2D.
 */

export class WorkspaceController {
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

export { WorkspaceController as DeckController };
