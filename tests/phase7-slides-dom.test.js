import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slides } from '../src/slides/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

test('Struktur deck presentasi memuat tepat 18 slide sesuai PRD Bagian 6', () => {
  assert.equal(slides.length, 18, `Harus 18 slide, ditemukan ${slides.length}`);
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    assert.ok(s.id, `Slide ${i + 1} wajib memiliki id`);
    assert.ok(s.title, `Slide ${i + 1} wajib memiliki title`);
    assert.equal(typeof s.mount, 'function', `Slide ${i + 1} wajib memiliki fungsi mount`);
    assert.ok(s.notes && s.notes.length > 20, `Slide ${i + 1} wajib memiliki catatan presenter`);
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

test('Seluruh 18 slide berhasil di-mount, me-render Canvas 2D, dan dieksekusi tanpa error runtime', () => {
  // Buat mock Canvas 2D & elemen DOM ringan untuk menguji seluruh selector & logika render 18 slide
  function createMockCtx() {
    return {
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      arc() {},
      arcTo() {},
      roundRect() {},
      quadraticCurveTo() {},
      fill() {},
      stroke() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      setTransform() {},
      setLineDash() {},
      drawImage() {},
      putImageData() {},
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      measureText: (txt) => ({ width: String(txt).length * 7 }),
      fillText() {},
      createRadialGradient: () => ({ addColorStop() {} }),
      createLinearGradient: () => ({ addColorStop() {} })
    };
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
        style: {},
        children: [],
        classList: {
          add() {},
          remove() {},
          toggle: () => false
        },
        setAttribute() {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
        getContext: () => createMockCtx(),
        width: 960,
        height: 540,
        addEventListener(type, fn) {
          if (!listeners.has(type)) listeners.set(type, []);
          listeners.get(type).push(fn);
        },
        removeEventListener() {},
        click() {
          for (const fn of listeners.get('click') || []) {
            fn({ target: el, clientX: 480, clientY: 270, preventDefault() {} });
          }
        },
        querySelector(sel) {
          const list = el.querySelectorAll(sel);
          return list[0] || null;
        },
        querySelectorAll(sel) {
          // Dukung selector umum seperti '#id', '.cls', '#id .cls', '[data-x]'
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
            const key = attrMatch[1];
            return allElements.filter((x) => key in x.dataset);
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

    // Ekstrak seluruh tag pembuka HTML beserta id, class, value, checked, selected, dan data-*
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

  for (let idx = 0; idx < slides.length; idx++) {
    const slide = slides[idx];
    const { makeEl } = parseHtmlElements('');
    const container = makeEl('SECTION');
    let hooks = null;

    const cleanup = slide.mount(container, {
      deck: { next() {}, prev() {}, goTo() {} },
      reducedMotion: false,
      registerHooks: (h) => {
        hooks = h;
      }
    });

    // Eksekusi frame animasi yang terjadwal pada slide ini
    const pending = rafQueue.splice(0, rafQueue.length);
    for (const cb of pending) {
      cb(performance.now() + 120);
    }

    // Jika slide memiliki simulasi (SFLA, WCA, Perbandingan, Cloud), uji tombol Step & Reset!
    if (hooks) {
      hooks.step();
      hooks.step();
      const afterStep = rafQueue.splice(0, rafQueue.length);
      for (const cb of afterStep) cb(performance.now() + 260);
      hooks.reset();
    }

    if (typeof cleanup === 'function') cleanup();
  }
});
