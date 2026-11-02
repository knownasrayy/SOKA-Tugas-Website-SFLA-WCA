/**
 * Bab pembuka: judul, masalah penjadwalan cloud, dan alasan memakai metaheuristik.
 */

import { clamp01, easeBack, easeOut, lerp, seg } from '../render/stage.js';
import {
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
} from '../render/sprites.js';
import { mountScene, noise } from './common.js';
import { DEFAULT_VMS, computeRoundRobinBaseline, generateCloudTasks } from '../algorithms/cloudScheduling.js';

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

export const pembukaSlides = [
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
