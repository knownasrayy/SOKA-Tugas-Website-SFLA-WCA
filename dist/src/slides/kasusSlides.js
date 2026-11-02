/**
 * Bab perbandingan & studi kasus: adu SFLA vs WCA pada peta yang sama, pemetaan solusi ke jadwal,
 * penjadwalan 16 tugas ke 4 VM, serta kesimpulan. Semua angka dihitung langsung dari mesin algoritma.
 */

import { createRng } from '../core/rng.js';
import { getObjective } from '../core/objectives.js';
import { SimulationRunner } from '../core/engine.js';
import { SFLAEngine } from '../algorithms/sfla.js';
import { WCAEngine } from '../algorithms/wca.js';
import {
  CloudScheduleOptimizer,
  DEFAULT_VMS,
  evaluateSchedule,
  generateCloudTasks
} from '../algorithms/cloudScheduling.js';
import { renderConvergenceChart } from '../render/chart.js';
import { SFLARenderer } from '../render/sflaRenderer.js';
import { WCARenderer } from '../render/wcaRenderer.js';
import { createStage, easeOut, lerp, seg } from '../render/stage.js';
import { COLORS, arcPoint, drawDrop, drawFrog, drawPill, drawText, fillBackground } from '../render/sprites.js';
import { mountScene } from './common.js';
import { formatFitness, objectiveButtonsHtml } from './simulation.js';

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

export const kasusSlides = [
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
