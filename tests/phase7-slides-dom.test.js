import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tabs } from '../src/tabs/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

test('Struktur workspace berbasis 4 tab ITS (bukan slide deck)', () => {
  assert.equal(tabs.length, 4, `Harus 4 tab utama, ditemukan ${tabs.length}`);
  const expectedIds = ['konsep', 'sfla', 'wca', 'komparasi'];
  tabs.forEach((tab, idx) => {
    assert.equal(tab.id, expectedIds[idx]);
    assert.ok(tab.label && tab.label.length > 3, `Tab ${tab.id} wajib memiliki label`);
    assert.ok(tab.title && tab.title.length > 5, `Tab ${tab.id} wajib memiliki title`);
    assert.equal(typeof tab.mount, 'function', `Tab ${tab.id} wajib memiliki fungsi mount`);
    assert.ok(tab.notes && tab.notes.length > 20, `Tab ${tab.id} wajib memiliki panduan narasi`);
  });

  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(html.includes('id="workspace-tabs"'), 'Wajib memuat navigasi tab utama');
  assert.ok(html.includes('role="tablist"'), 'Navigasi tab wajib memiliki role="tablist"');
  assert.ok(html.includes('id="workspace-stage"'), 'Wajib memuat panggung tab scrollable');
  assert.ok(!html.includes('deck-footer'), 'Tidak boleh lagi memuat footer navigasi slide');
  assert.ok(!html.includes('1 / 18'), 'Tidak boleh lagi memuat penghitung slide 1 / 18');
  assert.ok(!html.includes('slide-dots'), 'Tidak boleh lagi memuat titik-titik slide');
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

test('Seluruh 4 tab dan sub-modul interaktif berhasil di-mount, me-render Canvas 2D, dan dieksekusi tanpa error', () => {
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

  for (const tab of tabs) {
    const { makeEl } = parseHtmlElements('');
    const container = makeEl('SECTION');
    let hooks = null;

    const cleanup = tab.mount(container, {
      workspace: { goToTab() {} },
      reducedMotion: false,
      registerHooks: (h) => {
        hooks = h;
      }
    });

    const pending = rafQueue.splice(0, rafQueue.length);
    for (const cb of pending) {
      cb(performance.now() + 120);
    }

    // Uji klik seluruh sub-tab dan tombol skenario di dalam tab
    for (const subBtn of container.querySelectorAll('[data-sub]')) {
      subBtn.click();
    }
    for (const leapBtn of container.querySelectorAll('[data-leap]')) {
      leapBtn.click();
    }
    for (const flowBtn of container.querySelectorAll('[data-flow]')) {
      flowBtn.click();
    }

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
