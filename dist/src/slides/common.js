/**
 * Kerangka bersama scene presentasi: kanvas layar penuh + teks singkat yang berganti per beat.
 */

import { createStage } from '../render/stage.js';

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
export function mountScene(container, { reducedMotion, registerHooks }, options) {
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
export function noise(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
