import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slides } from '../src/slides/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

test('Deck presentasi memuat seluruh bab dengan urutan yang benar', () => {
  const chapterOrder = [...new Set(slides.map((s) => s.chapter.id))];
  assert.deepEqual(chapterOrder, ['pembuka', 'sfla', 'wca', 'adu', 'kasus', 'penutup']);

  const ids = slides.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'ID slide wajib unik');
  for (const required of ['sfla-inspirasi', 'sfla-karakter', 'sfla-cara', 'sfla-sim', 'wca-inspirasi', 'wca-karakter', 'wca-cara', 'wca-sim', 'kasus-run']) {
    assert.ok(ids.includes(required), `Slide ${required} wajib ada`);
  }

  for (const slide of slides) {
    assert.ok(slide.title && slide.title.length > 3, `Slide ${slide.id} wajib memiliki title`);
    assert.equal(typeof slide.mount, 'function', `Slide ${slide.id} wajib memiliki fungsi mount`);
    assert.ok(slide.notes && slide.notes.length > 20, `Slide ${slide.id} wajib memiliki catatan presenter`);
  }

  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  for (const id of ['deck', 'deck-stage', 'deck-rail', 'btn-prev', 'btn-next', 'presenter-notes', 'shortcuts-modal']) {
    assert.ok(html.includes(`id="${id}"`), `index.html wajib memuat #${id}`);
  }
});

test('Palet warna resmi ITS terpasang pada stylesheet utama', () => {
  const css = fs.readFileSync(path.join(rootDir, 'src', 'styles', 'main.css'), 'utf8').toLowerCase();
  const requiredTokens = [
    '#03132b', // ITS Dark Ground
    '#127bbe', // ITS Biru Tua Lambang
    '#243f81', // ITS Biru Cover
    '#fdbb16', // ITS Kuning Tua Logo
    '#12b0a2', // ITS FKK Medical Tosca (SFLA)
    '#26aee4'  // ITS FTK Summer Sky (WCA)
  ];
  for (const hex of requiredTokens) {
    assert.ok(css.includes(hex), `Token warna resmi ITS ${hex} wajib ada di main.css`);
  }
});

test('Modul src/algorithms/ 100% murni tanpa akses DOM (window/document)', () => {
  const algoDir = path.join(rootDir, 'src', 'algorithms');
  const files = fs.readdirSync(algoDir).filter((f) => f.endsWith('.js'));
  assert.ok(files.length >= 3);

  for (const file of files) {
    const code = fs.readFileSync(path.join(algoDir, file), 'utf8');
    assert.ok(!/\bdocument\./.test(code), `${file} tidak boleh mengakses document`);
    assert.ok(!/\bwindow\./.test(code), `${file} tidak boleh mengakses window`);
  }
});

test('Tidak ada dependensi CDN atau URL internet eksternal saat runtime', () => {
  const checkFiles = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, 'src', 'styles', 'main.css')
  ];

  function collectJs(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) collectJs(full);
      else if (ent.name.endsWith('.js')) checkFiles.push(full);
    }
  }
  collectJs(path.join(rootDir, 'src'));

  for (const fp of checkFiles) {
    const content = fs.readFileSync(fp, 'utf8');
    const cleaned = content.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '');
    assert.ok(
      !/https?:\/\//i.test(cleaned),
      `Ditemukan referensi URL eksternal pada ${path.relative(rootDir, fp)}`
    );
  }
});

test('Seluruh slide dan beat berhasil di-mount, me-render Canvas 2D, dan dieksekusi tanpa error', () => {
  function createMockCtx() {
    const known = {
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      measureText: (txt) => ({ width: String(txt).length * 7 }),
      createRadialGradient: () => ({ addColorStop() {} }),
      createLinearGradient: () => ({ addColorStop() {} })
    };
    // Metode gambar lain cukup menjadi no-op, sedangkan nilai non-finite tetap ditolak seperti pemeriksa posisi
    return new Proxy(known, {
      get(target, prop) {
        if (prop in target) return target[prop];
        return (...args) => {
          if (prop !== 'setLineDash') {
            for (const arg of args) {
              if (typeof arg === 'number') assert.ok(Number.isFinite(arg), `ctx.${String(prop)} menerima ${arg}`);
            }
          }
        };
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      }
    });
  }

  function parseHtmlElements(html) {
    const mapById = new Map();
    const allElements = [];

    function makeEl(tag = 'DIV', attrs = {}) {
      const listeners = new Map();
      const el = {
        tagName: tag.toUpperCase(),
        id: attrs.id || '',
        dataset: { ...(attrs.dataset || {}) },
        value: attrs.value ?? '',
        checked: Boolean(attrs.checked),
        textContent: '',
        _innerHTML: '',
        style: { setProperty() {} },
        children: [],
        offsetWidth: 960,
        classList: {
          add() {},
          remove() {},
          toggle: () => false
        },
        setAttribute() {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 480 }),
        getContext: () => createMockCtx(),
        width: 960,
        height: 480,
        addEventListener(type, fn) {
          if (!listeners.has(type)) listeners.set(type, []);
          listeners.get(type).push(fn);
        },
        removeEventListener() {},
        click() {
          for (const fn of listeners.get('click') || []) {
            fn({ target: el, clientX: 420, clientY: 220, preventDefault() {} });
          }
        },
        querySelector(sel) {
          const list = el.querySelectorAll(sel);
          return list[0] || null;
        },
        querySelectorAll(sel) {
          const parts = sel.trim().split(/\s+/);
          const leaf = parts[parts.length - 1];
          if (leaf.startsWith('#')) {
            const found = mapById.get(leaf.slice(1));
            return found ? [found] : [];
          }
          if (leaf.startsWith('.')) {
            const cls = leaf.slice(1);
            return allElements.filter((x) => (x._classes || []).includes(cls));
          }
          const attrMatch = leaf.match(/^\[data-([a-z0-9-]+)\]$/i);
          if (attrMatch) {
            const camel = attrMatch[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            return allElements.filter((x) => camel in x.dataset);
          }
          return [];
        }
      };

      Object.defineProperty(el, 'innerHTML', {
        get: () => el._innerHTML,
        set: (val) => {
          el._innerHTML = String(val);
          const parsed = parseHtmlElements(el._innerHTML);
          parsed.mapById.forEach((v, k) => mapById.set(k, v));
          allElements.push(...parsed.allElements);
        }
      });
      return el;
    }

    const tagRegex = /<([a-zA-Z0-9]+)\b([^>]*)>/g;
    let match;
    let lastSelectEl = null;

    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[1].toUpperCase();
      const attrStr = match[2];

      const idMatch = attrStr.match(/\bid="([^"]+)"/);
      const classMatch = attrStr.match(/\bclass="([^"]+)"/);
      const valMatch = attrStr.match(/\bvalue="([^"]*)"/);
      const isChecked = /\bchecked\b/.test(attrStr);
      const isSelected = /\bselected\b/.test(attrStr);

      const dataset = {};
      const dataRegex = /\bdata-([a-z0-9-]+)="([^"]*)"/gi;
      let dm;
      while ((dm = dataRegex.exec(attrStr)) !== null) {
        const camel = dm[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        dataset[camel] = dm[2];
      }

      if (tag === 'OPTION' && lastSelectEl) {
        if (isSelected && valMatch) lastSelectEl.value = valMatch[1];
        else if (!lastSelectEl.value && valMatch) lastSelectEl.value = valMatch[1];
        continue;
      }

      const el = makeEl(tag, {
        id: idMatch ? idMatch[1] : '',
        value: valMatch ? valMatch[1] : '',
        checked: isChecked,
        dataset
      });
      el._classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];

      if (tag === 'SELECT') lastSelectEl = el;
      if (el.id) mapById.set(el.id, el);
      allElements.push(el);
    }

    return { makeEl, mapById, allElements };
  }

  const rafQueue = [];
  globalThis.window = {
    devicePixelRatio: 1,
    addEventListener() {},
    removeEventListener() {},
    scrollTo() {},
    matchMedia: () => ({ matches: false })
  };
  globalThis.localStorage = {
    getItem: () => null,
    setItem() {}
  };
  globalThis.document = {
    createElement: (tag) => {
      const { makeEl } = parseHtmlElements('');
      return makeEl(tag);
    }
  };
  globalThis.requestAnimationFrame = (cb) => {
    rafQueue.push(cb);
    return rafQueue.length;
  };
  globalThis.cancelAnimationFrame = () => {};

  // Menjalankan frame sepanjang garis waktu animasi, termasuk titik awal, tengah, dan akhir tiap beat
  function runFrames(startMs, seconds) {
    for (let elapsed = 0; elapsed <= seconds; elapsed += 0.4) {
      const pending = rafQueue.splice(0, rafQueue.length);
      for (const cb of pending) cb(startMs + elapsed * 1000);
    }
    return startMs + seconds * 1000;
  }

  for (const reducedMotion of [false, true]) {
    for (const slide of slides) {
      const { makeEl } = parseHtmlElements('');
      const container = makeEl('SECTION');
      let hooks = {};
      rafQueue.length = 0;

      const cleanup = slide.mount(container, {
        reducedMotion,
        registerHooks: (h) => {
          hooks = { ...hooks, ...h };
        }
      });

      let clock = runFrames(performance.now(), 14);
      for (let beat = 1; beat < (slide.beats || 1); beat++) {
        hooks.setBeat(beat);
        clock = runFrames(clock, 14);
      }

      if (hooks.step) {
        for (let i = 0; i < 8; i++) hooks.step();
        clock = runFrames(clock, 2);
        hooks.togglePlay();
        clock = runFrames(clock, 6);
        hooks.reset();
        runFrames(clock, 1);
      }

      for (const objBtn of container.querySelectorAll('[data-obj]')) objBtn.click();

      if (typeof cleanup === 'function') cleanup();
    }
  }
});
