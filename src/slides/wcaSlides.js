/**
 * Bab WCA: inspirasi, karakteristik, cara kerja bertahap, dan simulasi nyata.
 * Scene inspirasi & cara kerja adalah ilustrasi; hanya slide simulasi yang menjalankan WCAEngine.
 */

import { clamp01, easeBack, lerp, seg } from '../render/stage.js';
import {
  COLORS,
  arcPoint,
  drawArrow,
  drawCloud,
  drawDrop,
  drawGlow,
  drawPill,
  drawRipple,
  drawText,
  fillBackground
} from '../render/sprites.js';
import { WCARenderer, drawRiverMarker, drawSeaMarker } from '../render/wcaRenderer.js';
import { mountScene, noise } from './common.js';
import { drawCardFrame, drawParamChips } from './sflaSlides.js';
import { mountSimulation } from './simulation.js';
import { WCAEngine } from '../algorithms/wca.js';

const SKY_STOPS = ['#06234f', '#0b3a73', '#12558f'];
const DEEP_STOPS = ['#031a3d', '#052a58', '#04254e'];

/* ---------- Slide: Inspirasi (siklus air tampak samping) ---------- */

const RIVER_MAIN = [
  { x: 370, y: 560 },
  { x: 560, y: 690 },
  { x: 760, y: 730 },
  { x: 980, y: 800 },
  { x: 1220, y: 850 }
];
const RIVER_BRANCH_A = [
  { x: 660, y: 540 },
  { x: 700, y: 620 },
  { x: 760, y: 730 }
];
const RIVER_BRANCH_B = [
  { x: 980, y: 660 },
  { x: 960, y: 730 },
  { x: 980, y: 800 }
];
const RIVERS = [
  { points: RIVER_MAIN, width: 16 },
  { points: RIVER_BRANCH_A, width: 8 },
  { points: RIVER_BRANCH_B, width: 8 }
];

function pathPoint(points, p) {
  const scaled = clamp01(p) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(scaled));
  const f = scaled - i;
  return { x: lerp(points[i].x, points[i + 1].x, f), y: lerp(points[i].y, points[i + 1].y, f) };
}

function strokePath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawLandscape(ctx, t) {
  fillBackground(ctx, 1920, 1080, SKY_STOPS);

  // Matahari
  drawGlow(ctx, 1640, 210, 240, 'rgba(253, 187, 22, 0.55)');
  ctx.beginPath();
  ctx.arc(1640, 210, 66, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.gold;
  ctx.fill();

  // Pegunungan belakang dan depan
  const ridge = (points, color) => {
    ctx.beginPath();
    ctx.moveTo(0, 1080);
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.lineTo(points[points.length - 1][0], 1080);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  ridge([[0, 620], [220, 420], [370, 520], [560, 390], [760, 560], [980, 640], [1300, 860], [1400, 1080]], '#123a68');
  ridge([[0, 760], [200, 590], [370, 540], [520, 680], [660, 520], [800, 690], [980, 650], [1120, 800], [1300, 880], [1420, 1080]], '#17704f');

  // Puncak bersalju
  ctx.fillStyle = '#e4eefa';
  for (const [x, y, w, h] of [[220, 420, 50, 60], [560, 390, 56, 66]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 0.2, y + h * 0.72);
    ctx.lineTo(x - w * 0.3, y + h);
    ctx.lineTo(x - w, y + h);
    ctx.closePath();
    ctx.fill();
  }

  // Sungai
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const river of RIVERS) {
    ctx.strokeStyle = '#2fa9e6';
    ctx.lineWidth = river.width;
    strokePath(ctx, river.points);
  }
  ctx.restore();

  // Laut berombak
  ctx.save();
  const seaTop = 840;
  ctx.beginPath();
  ctx.moveTo(1180, 1080);
  ctx.lineTo(1180, seaTop + 40);
  for (let x = 1180; x <= 1920; x += 20) {
    ctx.lineTo(x, seaTop + Math.sin(x * 0.012 + t * 1.3) * 9);
  }
  ctx.lineTo(1920, 1080);
  ctx.closePath();
  const seaGrad = ctx.createLinearGradient(0, seaTop, 0, 1080);
  seaGrad.addColorStop(0, '#1a8fd8');
  seaGrad.addColorStop(1, '#0a3f80');
  ctx.fillStyle = seaGrad;
  ctx.fill();
  ctx.restore();
}

function drawCycleScene(ctx, { t, bt, beat }) {
  drawLandscape(ctx, t);

  const cloudX = 430 + Math.sin(t * 0.25) * 60;

  // Beat 0: hujan deras di gunung; beat lain tetap ada tetapi lebih tipis
  const rainCount = beat === 0 ? 46 : 16;
  ctx.save();
  ctx.strokeStyle = '#cfeaff';
  ctx.lineWidth = beat === 0 ? 4 : 3;
  ctx.lineCap = 'round';
  ctx.globalAlpha = beat === 0 ? 0.95 : 0.45;
  for (let i = 0; i < rainCount; i++) {
    const baseX = cloudX - 210 + noise(i) * 420;
    const fall = ((t * (0.9 + noise(i + 90) * 0.5) + noise(i + 30)) % 1);
    const y = 380 + fall * 240;
    ctx.beginPath();
    ctx.moveTo(baseX - fall * 18, y);
    ctx.lineTo(baseX - fall * 18 - 5, y + 26);
    ctx.stroke();
  }
  ctx.restore();

  drawCloud(ctx, cloudX, 330, 100, '#eaf2fb');
  drawCloud(ctx, cloudX + 240, 390, 58, '#d4e3f3', 0.9);

  // Tetesan yang mengalir: makin besar saat beat 1
  const flowEmphasis = beat === 1;
  RIVERS.forEach((river, r) => {
    const count = flowEmphasis ? 7 : 3;
    for (let i = 0; i < count; i++) {
      const p = (t * (flowEmphasis ? 0.2 : 0.12) + i / count + r * 0.21) % 1;
      const pt = pathPoint(river.points, p);
      const ahead = pathPoint(river.points, Math.min(1, p + 0.02));
      drawDrop(ctx, pt.x, pt.y, flowEmphasis ? 15 : 10, '#e6f6ff', {
        angle: Math.atan2(ahead.y - pt.y, ahead.x - pt.x)
      });
    }
  });

  // Uap naik dari laut dan kembali membentuk awan
  const vaporEmphasis = beat === 2;
  const vaporCount = vaporEmphasis ? 26 : 8;
  ctx.save();
  for (let i = 0; i < vaporCount; i++) {
    const rise = (t * 0.17 + noise(i + 60)) % 1;
    const x = 1280 + noise(i + 7) * 560 + Math.sin(t + i) * 16;
    const y = 830 - rise * 470;
    ctx.beginPath();
    ctx.arc(x, y, 7 + rise * 16, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${(vaporEmphasis ? 0.55 : 0.28) * (1 - rise)})`;
    ctx.fill();
  }
  ctx.restore();
  if (vaporEmphasis) {
    drawArrow(ctx, { x: 1400, y: 360 }, { x: 780, y: 320 }, {
      bend: 60,
      color: '#ffffff',
      width: 7,
      dashed: true,
      progress: seg(bt, 0.5, 1.6)
    });
  }

  drawPill(ctx, 'Laut = titik terendah', 1560, 960, { size: 32, alpha: seg(bt, 0.4, 0.5) });
}

/* ---------- Slide: Karakteristik ---------- */

const CARD_W = 420;
const CARD_Y = 300;
const cardCenterY = CARD_Y + 170;

function drawTraitsScene(ctx, { t, bt }) {
  fillBackground(ctx, 1920, 1080, DEEP_STOPS);
  const size = 11;

  // 1. Hierarki: Laut, Sungai, Aliran
  ctx.save();
  let x = drawCardFrame(ctx, 0, bt, 'Hierarki', 'Laut › Sungai › Aliran', COLORS.skyLight);
  const sea = { x: x + CARD_W / 2, y: cardCenterY - 110 };
  const rivers = [{ x: x + 110, y: cardCenterY + 10 }, { x: x + 310, y: cardCenterY + 10 }];
  rivers.forEach((rv, r) => {
    drawArrow(ctx, rv, sea, { color: COLORS.ink, width: 4, head: false, alpha: 0.7 });
    [-54, 0, 54].forEach((dx, k) => {
      const st = { x: rv.x + dx, y: cardCenterY + 112 };
      drawArrow(ctx, st, rv, { color: COLORS.skyLight, width: 2.5, head: false, alpha: 0.6 });
      drawDrop(ctx, st.x, st.y, size, '#e6f6ff', { angle: -Math.PI / 2 });
      const p = (t * 0.5 + k * 0.3 + r * 0.17) % 1;
      drawGlow(ctx, lerp(st.x, rv.x, p), lerp(st.y, rv.y, p), 10, 'rgba(255, 255, 255, 0.9)');
    });
    drawRiverMarker(ctx, rv.x, rv.y, 24);
  });
  drawSeaMarker(ctx, sea.x, sea.y, 38, t);
  ctx.restore();

  // 2. Semua bergerak serentak
  ctx.save();
  x = drawCardFrame(ctx, 1, bt, 'Semua bergerak', 'Bukan hanya yang terburuk', COLORS.skyLight);
  const center = { x: x + CARD_W / 2, y: cardCenterY };
  drawSeaMarker(ctx, center.x, center.y, 30, t);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = (t * 0.28 + noise(i) * 0.25) % 1;
    const r = 170 * (1 - p * 0.72);
    drawDrop(ctx, center.x + Math.cos(a) * r, center.y + Math.sin(a) * r * 0.86, size, '#e6f6ff', {
      angle: a + Math.PI,
      alpha: Math.min(1, (1 - p) * 4)
    });
  }
  ctx.restore();

  // 3. Overshoot: C = 2 membuat tetesan bisa melewati induknya
  ctx.save();
  x = drawCardFrame(ctx, 2, bt, 'Melewati induk', 'C = 2, jarak hingga 2d', COLORS.skyLight);
  const startX = x + 60;
  const parentX = x + 210;
  const farX = x + 360;
  const y3 = cardCenterY + 10;
  ctx.fillStyle = 'rgba(159, 220, 247, 0.22)';
  ctx.beginPath();
  ctx.roundRect(startX, y3 - 34, farX - startX, 68, 34);
  ctx.fill();
  drawRiverMarker(ctx, parentX, y3, 26);
  const travel = ((t * 0.33) % 1);
  const dropX = lerp(startX, farX, seg(travel, 0.05, 0.75));
  drawDrop(ctx, dropX, y3, 15, '#e6f6ff', { angle: 0 });
  drawText(ctx, 'd', (startX + parentX) / 2, y3 - 70, { size: 34, mono: true, align: 'center' });
  drawText(ctx, 'd', (parentX + farX) / 2, y3 - 70, { size: 34, mono: true, align: 'center' });
  ctx.restore();

  // 4. dmax mengecil: makin lama makin sempit
  ctx.save();
  x = drawCardFrame(ctx, 3, bt, 'dmax mengecil', 'Dari luas ke terfokus', COLORS.skyLight);
  const shrink = (t * 0.16) % 1;
  const dmaxPx = lerp(150, 44, shrink);
  const c4 = { x: x + CARD_W / 2, y: cardCenterY };
  ctx.beginPath();
  ctx.arc(c4.x, c4.y, dmaxPx, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([11, 9]);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawSeaMarker(ctx, c4.x, c4.y, 26, t);
  drawText(ctx, 'dmax', c4.x, c4.y - dmaxPx - 24, { size: 28, mono: true, align: 'center' });
  ctx.restore();

  drawParamChips(
    ctx,
    [
      { label: 'Npop  tetesan', w: 300 },
      { label: 'Nsr  laut + sungai', w: 400 },
      { label: 'C  konstanta aliran', w: 410 },
      { label: 'dmax  batas penguapan', w: 400 }
    ],
    bt,
    COLORS.skyLight
  );
}

/* ---------- Slide: Cara kerja ---------- */

const HOW_SEA = { x: 1610, y: 620 };
const HOW_RIVERS = [
  { x: 1140, y: 390 },
  { x: 1140, y: 640 },
  { x: 1140, y: 870 }
];
// Alokasi proporsional NSn: Laut menerima aliran terbanyak
const STREAM_SLOTS = [
  { parent: -1, x: 1500, y: 340 },
  { parent: -1, x: 1720, y: 370 },
  { parent: -1, x: 1740, y: 860 },
  { parent: -1, x: 1480, y: 880 },
  { parent: 0, x: 690, y: 330 },
  { parent: 0, x: 680, y: 470 },
  { parent: 1, x: 660, y: 650 },
  { parent: 2, x: 690, y: 860 }
];
const parentOf = (slot) => (slot.parent < 0 ? HOW_SEA : HOW_RIVERS[slot.parent]);
const HOW_SCATTER = Array.from({ length: 12 }, (_, i) => ({
  x: 620 + noise(i + 12) * 1180,
  y: 320 + noise(i + 70) * 590
}));

function drawHierarchy(ctx, reveal) {
  STREAM_SLOTS.forEach((slot, i) => {
    const appear = seg(reveal, 0.4 + i * 0.05, 0.2);
    drawArrow(ctx, slot, parentOf(slot), {
      bend: 26,
      color: COLORS.skyLight,
      width: 4,
      progress: appear,
      head: false,
      alpha: 0.65
    });
  });
  HOW_RIVERS.forEach((rv, i) => {
    drawArrow(ctx, rv, HOW_SEA, { bend: 20, color: '#ffffff', width: 7, progress: seg(reveal, 0.3 + i * 0.06, 0.25), head: false });
  });
}

function beatHierarchy(ctx, bt, t) {
  const settle = seg(bt, 1.1, 1.0);
  const reveal = clamp01((bt - 2.1) / 1.6);
  drawHierarchy(ctx, reveal);

  // Tetesan acak bergerak ke posisi perannya
  HOW_SCATTER.forEach((from, i) => {
    const pop = seg(bt, i * 0.05, 0.4, easeBack);
    let to;
    if (i === 0) to = HOW_SEA;
    else if (i <= 3) to = HOW_RIVERS[i - 1];
    else to = STREAM_SLOTS[i - 4];
    const pos = arcPoint(from, to, 50, settle);
    if (settle > 0.7 && i === 0) drawSeaMarker(ctx, pos.x, pos.y, 62, t);
    else if (settle > 0.7 && i <= 3) drawRiverMarker(ctx, pos.x, pos.y, 34, `S${i}`);
    else drawDrop(ctx, pos.x, pos.y, 20 * Math.max(0.01, pop), '#e6f6ff', { angle: Math.PI / 2 });
  });

  const labels = seg(bt, 2.4, 0.5);
  drawPill(ctx, 'Laut · terbaik', HOW_SEA.x, HOW_SEA.y - 112, { size: 30, alpha: labels });
  drawPill(ctx, 'Sungai', HOW_RIVERS[0].x, HOW_RIVERS[0].y - 78, { size: 28, fill: COLORS.sky, alpha: labels });
  drawPill(ctx, 'Aliran', 680, 260, { size: 28, fill: '#e6f6ff', alpha: labels });
}

function beatFlow(ctx, bt, t) {
  drawHierarchy(ctx, 1);
  const loop = 3.2;
  const time = bt / loop;
  const cycle = Math.floor(time);
  const p = seg(time - cycle, 0.08, 0.6);

  STREAM_SLOTS.forEach((slot, i) => {
    const parent = parentOf(slot);
    const reach = 0.3 + noise(i + cycle * 3) * 1.7; // rand · C dengan C = 2
    const x = lerp(slot.x, lerp(slot.x, parent.x, reach), p);
    const y = lerp(slot.y, lerp(slot.y, parent.y, reach), p);
    drawDrop(ctx, x, y, 19, reach > 1 && p > 0.5 ? COLORS.gold : '#e6f6ff', {
      angle: Math.atan2(parent.y - slot.y, parent.x - slot.x)
    });
  });
  HOW_RIVERS.forEach((rv, i) => {
    const reach = 0.2 + noise(i + 30 + cycle * 3) * 0.5;
    drawRiverMarker(ctx, lerp(rv.x, HOW_SEA.x, reach * p), lerp(rv.y, HOW_SEA.y, reach * p), 34, `S${i + 1}`);
  });
  drawSeaMarker(ctx, HOW_SEA.x, HOW_SEA.y, 62, t);

  drawText(ctx, 'X + rand · C · (induk − X)', 1180, 300, { size: 40, mono: true, align: 'center', color: COLORS.gold, alpha: seg(bt, 0.3, 0.5) });
}

function beatSwap(ctx, bt) {
  const loop = bt % 7;
  const left = { x: 800, y: 660 };
  const right = { x: 1500, y: 660 };
  const swap = seg(loop, 2.2, 1);
  const flash = loop >= 2.2 ? Math.max(0, 1 - (loop - 2.2) / 1.4) : 0;

  const streamPos = arcPoint(left, right, 150, swap);
  const riverPos = arcPoint(right, left, 150, swap);

  // Sebelum tukar: Aliran di kiri (f lebih kecil), Sungai di kanan. Setelahnya posisi terbaik dipimpin Sungai.
  drawRiverMarker(ctx, riverPos.x, riverPos.y, 72);
  drawDrop(ctx, streamPos.x, streamPos.y, 44, '#e6f6ff', { angle: swap > 0.5 ? Math.PI : 0 });
  if (flash > 0) {
    drawGlow(ctx, 1150, 590, 360 * flash + 40, `rgba(253, 187, 22, ${0.75 * flash})`);
    drawRipple(ctx, 1150, 590, 1 - flash, COLORS.gold, 340);
  }

  const before = 1 - seg(loop, 1.9, 0.3);
  const after = seg(loop, 3.2, 0.4);
  drawPill(ctx, 'Aliran  f = 3,1', left.x, 830, { size: 34, fill: '#e6f6ff', alpha: before, mono: true });
  drawPill(ctx, 'Sungai  f = 4,7', right.x, 830, { size: 34, fill: COLORS.sky, alpha: before, mono: true });
  drawPill(ctx, 'Sungai baru  f = 3,1', left.x, 830, { size: 34, fill: COLORS.sky, alpha: after, mono: true });
  drawPill(ctx, 'Aliran baru  f = 4,7', right.x, 830, { size: 34, fill: '#e6f6ff', alpha: after, mono: true });
  drawText(ctx, 'f(aliran) < f(sungai)', 1150, 340, { size: 40, mono: true, align: 'center', color: COLORS.gold, alpha: seg(bt, 0.3, 0.5) });
}

function beatEvaporate(ctx, bt, t) {
  const loop = bt % 9;
  const sea = { x: 1180, y: 700 };
  const dmaxPx = lerp(230, 110, seg(loop, 6.4, 1.8));

  ctx.beginPath();
  ctx.arc(sea.x, sea.y, dmaxPx, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 12]);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawText(ctx, 'dmax', sea.x + dmaxPx + 18, sea.y, { size: 36, mono: true, weight: 800 });
  drawSeaMarker(ctx, sea.x, sea.y, 62, t);

  const cloud = { x: 1180, y: 345 };
  const cloudIn = seg(loop, 1.2, 0.8);
  drawCloud(ctx, cloud.x, cloud.y, 92, '#eaf2fb', cloudIn);

  // Sungai mendekat, masuk radius, menguap, lalu turun sebagai hujan di tempat acak
  const rivers = [
    { from: { x: 680, y: 560 }, inside: { x: 1040, y: 620 }, land: { x: 760, y: 860 } },
    { from: { x: 1680, y: 830 }, inside: { x: 1330, y: 790 }, land: { x: 1660, y: 520 } }
  ];
  rivers.forEach((rv, i) => {
    const approach = seg(loop, 0.1 + i * 0.25, 1.1);
    const vapor = seg(loop, 1.8 + i * 0.2, 1.6);
    const rain = seg(loop, 3.8 + i * 0.3, 1);
    const pos = { x: lerp(rv.from.x, rv.inside.x, approach), y: lerp(rv.from.y, rv.inside.y, approach) };

    if (vapor <= 0) {
      drawRiverMarker(ctx, pos.x, pos.y, 32, `S${i + 1}`);
    } else if (vapor < 1) {
      for (let k = 0; k < 5; k++) {
        const p = clamp01(vapor * 1.3 - k * 0.07);
        const vx = lerp(pos.x, cloud.x, p) + Math.sin(t * 3 + k) * 16;
        const vy = lerp(pos.y, cloud.y + 50, p);
        ctx.beginPath();
        ctx.arc(vx, vy, 13 + k * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * (1 - p * 0.65)})`;
        ctx.fill();
      }
    }

    if (rain > 0) {
      const start = { x: cloud.x, y: cloud.y + 60 };
      const dropPos = arcPoint(start, rv.land, -40, rain);
      if (rain < 1) drawDrop(ctx, dropPos.x, dropPos.y, 20, '#e6f6ff', { angle: Math.atan2(rv.land.y - start.y, rv.land.x - start.x) });
      else {
        drawDrop(ctx, rv.land.x, rv.land.y, 20, '#e6f6ff', { angle: Math.PI / 2 });
        drawRipple(ctx, rv.land.x, rv.land.y, seg(loop, 4.9 + i * 0.3, 1), '#ffffff', 90);
      }
    }
  });

  drawPill(ctx, 'dmax mengecil tiap iterasi', 1180, 960, { size: 30, alpha: seg(loop, 6.2, 0.4) });
  drawText(ctx, '‖Xsungai − Xlaut‖ < dmax', 1570, 300, { size: 34, mono: true, align: 'center', color: COLORS.gold, alpha: seg(bt, 0.3, 0.5) });
}

function drawHowScene(ctx, { t, bt, beat }) {
  fillBackground(ctx, 1920, 1080, DEEP_STOPS);
  if (beat === 0) beatHierarchy(ctx, bt, t);
  else if (beat === 1) beatFlow(ctx, bt, t);
  else if (beat === 2) beatSwap(ctx, bt);
  else beatEvaporate(ctx, bt, t);
}

/* ---------- Registri slide ---------- */

const CHAPTER = { id: 'wca', label: 'WCA' };

export const wcaSlides = [
  {
    id: 'wca-inspirasi',
    chapter: CHAPTER,
    title: 'WCA: Inspirasi',
    beats: 3,
    notes: `
      <p><strong>WCA</strong> diperkenalkan Eskandar, Sadollah, Bahreininejad &amp; Hamdi (2012), diuji pada masalah desain rekayasa berkendala.</p>
      <ul>
        <li>Air hujan jatuh di pegunungan, membentuk aliran, bergabung ke sungai, lalu bermuara ke laut sebagai titik terendah.</li>
        <li>Penguapan dan hujan mengembalikan air ke tempat baru. Inilah cara WCA menjaga pencarian tetap luas.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'WCA · Eskandar dkk., 2012',
        beats: [
          { title: 'Hujan turun di gunung.', sub: 'Water Cycle Algorithm' },
          { title: 'Air mengalir ke titik terendah.', sub: 'Aliran → sungai → laut' },
          { title: 'Air menguap, lalu turun hujan.', sub: 'Pencarian berlanjut dari posisi baru.' }
        ],
        draw: drawCycleScene
      });
    }
  },
  {
    id: 'wca-karakter',
    chapter: CHAPTER,
    title: 'WCA: Karakteristik',
    notes: `
      <ul>
        <li><strong>Hierarki:</strong> 1 Laut (terbaik), Nsr − 1 Sungai, sisanya Aliran. Induk yang lebih baik menerima aliran lebih banyak.</li>
        <li><strong>Semua bergerak:</strong> seluruh aliran dan sungai diperbarui tiap iterasi, berbeda dari SFLA.</li>
        <li><strong>Melewati induk:</strong> dengan C = 2, langkah rand · C · d bisa sampai 2d, sehingga sisi seberang induk ikut dicari.</li>
        <li><strong>dmax mengecil:</strong> dmax berkurang tiap iterasi, peralihan dari eksplorasi ke eksploitasi.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'WCA · Karakteristik',
        beats: [{ title: 'Karakteristik WCA' }],
        draw: drawTraitsScene
      });
    }
  },
  {
    id: 'wca-cara',
    chapter: CHAPTER,
    title: 'WCA: Cara Kerja',
    beats: 4,
    notes: `
      <p>Tekan <kbd>&rarr;</kbd> untuk tiap tahap. Ini ilustrasi; simulasi langsung ada di slide berikutnya.</p>
      <ol>
        <li><strong>Hierarki:</strong> urutkan tetesan. Terbaik = Laut, berikutnya = Sungai, sisanya = Aliran. Jumlah aliran per induk proporsional dengan intensitasnya.</li>
        <li><strong>Aliran:</strong> X baru = X + rand · C · (induk − X). Tetesan emas menandai yang melewati induknya.</li>
        <li><strong>Pertukaran peran:</strong> bila aliran menemukan titik lebih rendah dari induknya, keduanya bertukar peran.</li>
        <li><strong>Penguapan &amp; hujan:</strong> sungai yang masuk radius dmax dari Laut menguap, lalu turun sebagai tetesan baru. dmax mengecil tiap iterasi.</li>
      </ol>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'WCA · Cara kerja',
        steps: ['Hierarki', 'Aliran', 'Pertukaran peran', 'Penguapan &amp; hujan'],
        beats: [
          { title: 'Solusi terbaik menjadi laut.' },
          { title: 'Aliran bergerak menuju induknya.' },
          { title: 'Lebih baik? Bertukar peran.' },
          { title: 'Terlalu dekat laut? Menguap.' }
        ],
        draw: drawHowScene
      });
    }
  },
  {
    id: 'wca-sim',
    chapter: CHAPTER,
    title: 'WCA: Simulasi',
    notes: `
      <p>Di sini <strong>WCAEngine</strong> benar-benar berjalan. Tekan <kbd>S</kbd> per tahap atau <kbd>P</kbd> untuk otomatis.</p>
      <ul>
        <li>Lingkaran bergaris = radius dmax di sekitar Laut, perhatikan radiusnya mengecil seiring iterasi.</li>
        <li>Belah ketupat = Sungai, tetesan = Aliran, lingkaran bercincin emas = Laut.</li>
        <li>Awan kecil menandai tetesan hujan baru setelah penguapan.</li>
      </ul>`,
    mount(container, ctx) {
      return mountSimulation(container, ctx, {
        idPrefix: 'wca',
        title: 'Simulasi WCA',
        kicker: 'WCA · Simulasi langsung',
        color: COLORS.skyLight,
        fillFlat: 'rgba(159, 220, 247, 0.16)',
        Engine: WCAEngine,
        renderer: new WCARenderer(),
        bestOf: (state) => state.bestSea,
        bestLabel: 'f(Laut) terbaik',
        phases: [
          { key: 'HIERARCHY', label: 'Hierarki' },
          { key: 'FLOW', label: 'Aliran' },
          { key: 'ROLE_SWAP', label: 'Tukar peran' },
          { key: 'EVAPORATION', label: 'Penguapan' },
          { key: 'RAIN', label: 'Hujan' }
        ],
        params: [
          { key: 'populationSize', label: 'Tetesan (Npop)', min: 12, max: 60, step: 4, value: 24 },
          { key: 'nsr', label: 'Laut + Sungai (Nsr)', min: 2, max: 8, step: 1, value: 4 },
          { key: 'dmax', label: 'dmax awal', min: 0.1, max: 1.5, step: 0.05, value: 0.45 },
          { key: 'flowConstant', label: 'Konstanta C', min: 1.2, max: 2, step: 0.1, value: 2 }
        ]
      });
    }
  }
];
