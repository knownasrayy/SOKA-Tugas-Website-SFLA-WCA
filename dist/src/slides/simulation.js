/**
 * Slide simulasi nyata yang dipakai bersama oleh SFLA dan WCA:
 * peta kontur besar di kiri, tahap aktif + nilai terbaik + grafik konvergensi di kanan,
 * dan panel parameter yang bisa disembunyikan agar layar tetap bersih saat presentasi.
 */

import { getObjective } from '../core/objectives.js';
import { SimulationRunner } from '../core/engine.js';
import { renderConvergenceChart } from '../render/chart.js';

const OBJECTIVE_BUTTONS = [
  { id: 'rastrigin', label: 'Rastrigin' },
  { id: 'ackley', label: 'Ackley' },
  { id: 'sphere', label: 'Sphere' }
];

export function formatFitness(value) {
  return value < 0.001 && value > 0 ? value.toExponential(2) : value.toFixed(3);
}

export function objectiveButtonsHtml(activeId) {
  return OBJECTIVE_BUTTONS.map(
    (obj) => `<button type="button" class="seg-btn${obj.id === activeId ? ' active' : ''}" data-obj="${obj.id}">${obj.label}</button>`
  ).join('');
}

export function mountSimulation(container, { reducedMotion, registerHooks }, spec) {
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
