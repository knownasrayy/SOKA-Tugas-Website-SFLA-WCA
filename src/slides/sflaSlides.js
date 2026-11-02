/**
 * Bab SFLA: inspirasi, karakteristik, cara kerja bertahap, dan simulasi nyata.
 * Scene inspirasi & cara kerja adalah ilustrasi; hanya slide simulasi yang menjalankan SFLAEngine.
 */

import { clamp01, easeBack, easeOut, lerp, seg } from '../render/stage.js';
import {
  COLORS,
  arcPoint,
  drawArrow,
  drawCross,
  drawFrog,
  drawGlow,
  drawLilyPad,
  drawPill,
  drawRipple,
  drawText,
  fillBackground
} from '../render/sprites.js';
import { MEMEPLEX_COLORS } from '../render/sflaRenderer.js';
import { mountScene, noise } from './common.js';
import { mountSimulation } from './simulation.js';
import { SFLAEngine } from '../algorithms/sfla.js';
import { SFLARenderer } from '../render/sflaRenderer.js';

const POND_STOPS = ['#04302f', '#06403c', '#052f33'];

function drawPondWater(ctx, t) {
  fillBackground(ctx, 1920, 1080, POND_STOPS);
  ctx.save();
  ctx.strokeStyle = 'rgba(150, 240, 220, 0.07)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 11; row++) {
    const y = 90 + row * 92;
    ctx.beginPath();
    for (let x = 0; x <= 1920; x += 40) {
      const wave = Math.sin(x * 0.009 + t * 0.7 + row * 1.7) * 13 + Math.sin(x * 0.021 - t * 0.5 + row) * 5;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------- Slide: Inspirasi ---------- */

const PADS = [
  { x: 230, y: 520, r: 104, rot: 0.4 },
  { x: 560, y: 760, r: 122, rot: 2.2, flower: true },
  { x: 500, y: 400, r: 86, rot: 4.1 },
  { x: 900, y: 560, r: 116, rot: 1.2 },
  { x: 1000, y: 860, r: 96, rot: 3.3 },
  { x: 1300, y: 690, r: 128, rot: 5.2 },
  { x: 1290, y: 340, r: 98, rot: 0.9, flower: true },
  { x: 1660, y: 520, r: 138, rot: 2.8 },
  { x: 1710, y: 860, r: 92, rot: 4.6 }
];
const FOOD = { x: 1660, y: 500 };

// Tiap katak melompat dari daun ke daun, makin lama makin dekat ke makanan
const ROUTES = [
  [0, 2, 3, 5, 7],
  [1, 3, 5, 8, 7],
  [2, 3, 6, 5, 7],
  [4, 5, 6, 7, 8]
];
const HOP_SECONDS = 1.7;

function frogOnRoute(route, time, offset) {
  const cycle = route.length - 1;
  const local = Math.max(0, time - offset) / HOP_SECONDS;
  const looped = local % (cycle + 1.6);
  const index = Math.min(cycle, Math.floor(looped));
  const hopP = index >= cycle ? 0 : clamp01((looped - index) / 0.42);
  const from = PADS[route[index]];
  const to = PADS[route[Math.min(cycle, index + 1)]];
  const pos = arcPoint(from, to, 0, easeOut(hopP));
  return {
    x: pos.x,
    y: pos.y - 10,
    lift: Math.sin(Math.PI * hopP) * 90,
    angle: Math.atan2(to.x - from.x, from.y - to.y),
    landing: hopP >= 1 ? clamp01(((looped - index) - 0.42) / 0.4) : 0,
    landedAt: to
  };
}

function drawInspirationScene(ctx, { t, bt, beat }) {
  drawPondWater(ctx, t);
  PADS.forEach((pad) => drawLilyPad(ctx, pad.x, pad.y, pad.r, pad.rot, { flower: pad.flower }));

  // Makanan: serangga berpendar di daun terbesar
  const fx = FOOD.x + Math.sin(t * 2.1) * 26;
  const fy = FOOD.y + Math.cos(t * 2.9) * 18 - 60;
  drawGlow(ctx, fx, fy, 70 + Math.sin(t * 5) * 8, 'rgba(253, 187, 22, 0.75)');
  ctx.save();
  ctx.fillStyle = '#fff4c7';
  ctx.beginPath();
  ctx.arc(fx, fy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (beat === 0) {
    ROUTES.forEach((route, i) => {
      const frog = frogOnRoute(route, t, i * 0.55);
      if (frog.landing > 0) drawRipple(ctx, frog.landedAt.x, frog.landedAt.y, frog.landing, '#bff5ea', frog.landedAt.r);
      drawFrog(ctx, frog.x, frog.y, 38, i === 0 ? COLORS.gold : COLORS.toscaLight, {
        angle: frog.angle,
        lift: frog.lift,
        crown: i === 0
      });
    });
    return;
  }

  // Beat 2: katak terbaik membagikan informasi, yang lain menoleh lalu meniru arah lompatannya
  const leader = PADS[7];
  const followers = [PADS[0], PADS[1], PADS[3], PADS[5]];
  drawFrog(ctx, leader.x - 40, leader.y + 10, 46, COLORS.gold, { angle: -0.6, crown: true });

  followers.forEach((pad, i) => {
    const turn = seg(bt, 0.3 + i * 0.25, 0.6);
    const targetAngle = Math.atan2(leader.x - pad.x, pad.y - leader.y);
    drawFrog(ctx, pad.x, pad.y - 8, 38, COLORS.toscaLight, { angle: lerp(i * 1.7, targetAngle, turn) });

    // Pulsa "meme" berjalan dari pemimpin ke pengikut
    const from = { x: leader.x - 40, y: leader.y + 10 };
    const to = { x: pad.x, y: pad.y - 8 };
    ctx.save();
    ctx.strokeStyle = 'rgba(253, 187, 22, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 14]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo((from.x + to.x) / 2, (from.y + to.y) / 2 - 150, to.x, to.y);
    ctx.stroke();
    ctx.restore();
    for (let k = 0; k < 3; k++) {
      const p = ((t * 0.42 + k / 3 + i * 0.13) % 1);
      const dot = arcPoint(from, to, 150, p);
      drawGlow(ctx, dot.x, dot.y, 26, 'rgba(253, 187, 22, 0.8)');
    }
  });
  drawPill(ctx, 'meme', 1180, 300, { size: 34, alpha: seg(bt, 0.6, 0.5) });
}

/* ---------- Slide: Karakteristik ---------- */

const CARD_W = 420;
const CARD_H = 500;
const CARD_Y = 300;
const cardX = (i) => 60 + i * (CARD_W + 40);

export function drawCardFrame(ctx, index, bt, title, caption, accent) {
  const appear = seg(bt, index * 0.18, 0.6, easeOut);
  const x = cardX(index);
  ctx.globalAlpha = appear;
  ctx.translate(0, (1 - appear) * 40);
  ctx.beginPath();
  ctx.roundRect(x, CARD_Y, CARD_W, CARD_H, 28);
  ctx.fillStyle = 'rgba(2, 18, 34, 0.55)';
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, title, x + 32, CARD_Y + CARD_H - 96, { size: 38, weight: 800 });
  drawText(ctx, caption, x + 32, CARD_Y + CARD_H - 46, { size: 27, weight: 500, color: COLORS.muted });
  return x;
}

export function drawParamChips(ctx, chips, bt, fill) {
  const total = chips.reduce((sum, chip) => sum + chip.w, 0) + (chips.length - 1) * 22;
  let x = (1920 - total) / 2;
  chips.forEach((chip, i) => {
    const appear = seg(bt, 0.9 + i * 0.12, 0.45, easeOut);
    drawPill(ctx, chip.label, x + chip.w / 2, 900, { size: 28, fill, alpha: appear });
    x += chip.w + 22;
  });
}

function drawTraitsScene(ctx, { t, bt }) {
  drawPondWater(ctx, t);
  const size = 22;
  const panelMidY = CARD_Y + 170;

  // 1. Memeplex: tiga kelompok berputar pelan dengan warna berbeda
  ctx.save();
  let x = drawCardFrame(ctx, 0, bt, 'Memeplex', 'Populasi dibagi kelompok', COLORS.toscaLight);
  [[x + 120, panelMidY + 40], [x + 300, panelMidY + 40], [x + 210, panelMidY - 80]].forEach(([cx, cy], g) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fillStyle = `${MEMEPLEX_COLORS[g]}22`;
    ctx.fill();
    for (let k = 0; k < 3; k++) {
      const a = t * 0.4 + (k / 3) * Math.PI * 2 + g;
      drawFrog(ctx, cx + Math.cos(a) * 44, cy + Math.sin(a) * 44, 15, MEMEPLEX_COLORS[g], { angle: a + 1.57 });
    }
  });
  ctx.restore();

  // 2. Lompatan lokal: hanya satu katak bergerak menuju yang terbaik
  ctx.save();
  x = drawCardFrame(ctx, 1, bt, 'Lompatan lokal', 'Hanya katak terburuk', COLORS.toscaLight);
  const hop = (t % 3.2) / 3.2;
  const hopP = seg(hop, 0.15, 0.4);
  const worstFrom = { x: x + 80, y: panelMidY + 90 };
  const worstTo = { x: x + 260, y: panelMidY - 50 };
  const worstPos = arcPoint(worstFrom, worstTo, 0, hopP);
  drawFrog(ctx, x + 340, panelMidY - 100, size + 6, COLORS.gold, { crown: true, angle: -0.8 });
  drawFrog(ctx, x + 300, panelMidY + 100, size, COLORS.toscaLight, { angle: 0.7 });
  drawFrog(ctx, x + 120, panelMidY - 90, size, COLORS.toscaLight, { angle: 2.1 });
  if (hopP >= 1) drawRipple(ctx, worstTo.x, worstTo.y, seg(hop, 0.55, 0.4), COLORS.toscaLight, 70);
  drawFrog(ctx, worstPos.x, worstPos.y, size, COLORS.coral, {
    angle: 0.9,
    lift: Math.sin(Math.PI * hopP) * 70,
    ring: hopP < 0.02 || hopP >= 1 ? COLORS.danger : null
  });
  ctx.restore();

  // 3. Shuffle berkala: katak berpindah kelompok lalu berganti warna
  ctx.save();
  x = drawCardFrame(ctx, 2, bt, 'Shuffle berkala', 'Informasi menyebar', COLORS.toscaLight);
  const cycle = Math.floor(t / 2.6);
  const shuffleP = seg((t % 2.6) / 2.6, 0.35, 0.5);
  for (let i = 0; i < 9; i++) {
    const slot = (g, k) => ({
      x: x + 90 + g * 120 + (k - 1) * 12,
      y: panelMidY - 90 + k * 92
    });
    const groupA = (i + cycle * (i % 3 === 0 ? 1 : 2)) % 3;
    const groupB = (i + (cycle + 1) * (i % 3 === 0 ? 1 : 2)) % 3;
    const a = slot(groupA, Math.floor(i / 3));
    const b = slot(groupB, Math.floor(i / 3));
    const pos = arcPoint(a, b, 40, shuffleP);
    drawFrog(ctx, pos.x, pos.y, 18, MEMEPLEX_COLORS[shuffleP > 0.5 ? groupB : groupA], {
      lift: Math.sin(Math.PI * shuffleP) * 26
    });
  }
  ctx.restore();

  // 4. Evolusi memetik: informasi menyebar dari satu katak tanpa pewarisan
  ctx.save();
  x = drawCardFrame(ctx, 3, bt, 'Evolusi memetik', 'Meniru, bukan mewarisi', COLORS.toscaLight);
  const center = { x: x + CARD_W / 2, y: panelMidY };
  const pulse = (t % 2) / 2;
  drawRipple(ctx, center.x, center.y, pulse, COLORS.gold, 190);
  drawFrog(ctx, center.x, center.y, 28, COLORS.gold, { crown: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const fx = center.x + Math.cos(a) * 140;
    const fy = center.y + Math.sin(a) * 118;
    const lit = pulse > 0.45;
    drawFrog(ctx, fx, fy, 17, lit ? COLORS.gold : COLORS.toscaLight, {
      angle: Math.atan2(center.x - fx, fy - center.y)
    });
  }
  ctx.restore();

  drawParamChips(
    ctx,
    [
      { label: 'F  katak', w: 210 },
      { label: 'm  memeplex', w: 270 },
      { label: 'N  iterasi lokal', w: 340 },
      { label: 'Dmax  langkah maksimum', w: 420 }
    ],
    bt,
    COLORS.toscaLight
  );
}

/* ---------- Slide: Cara kerja ---------- */

const FROG_COUNT = 12;
const SCATTER = Array.from({ length: FROG_COUNT }, (_, i) => ({
  x: 620 + noise(i + 3) * 1160,
  y: 330 + noise(i + 40) * 560
}));
// Peringkat tiap katak acak tetapi tetap: order[0] adalah katak terbaik
const RANK_ORDER = Array.from({ length: FROG_COUNT }, (_, i) => i).sort((a, b) => noise(a + 9) - noise(b + 9));
const ROW_Y = 620;
const rowSlot = (rank) => ({ x: 600 + rank * 104, y: ROW_Y });
const GROUPS = [
  { x: 720, y: 640 },
  { x: 1170, y: 640 },
  { x: 1620, y: 640 }
];
const GROUP_R = 190;

function groupSlot(group, index) {
  const a = -Math.PI / 2 + (index / 4) * Math.PI * 2;
  return { x: GROUPS[group].x + Math.cos(a) * 100, y: GROUPS[group].y + Math.sin(a) * 100 };
}

function drawGroupPonds(ctx, alpha) {
  GROUPS.forEach((group, g) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(group.x, group.y, GROUP_R, 0, Math.PI * 2);
    ctx.fillStyle = `${MEMEPLEX_COLORS[g]}1c`;
    ctx.strokeStyle = MEMEPLEX_COLORS[g];
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawText(ctx, `M${g + 1}`, group.x, group.y - GROUP_R - 34, {
      size: 38,
      weight: 800,
      color: MEMEPLEX_COLORS[g],
      align: 'center',
      alpha
    });
  });
}

function beatSort(ctx, bt) {
  RANK_ORDER.forEach((frogIdx, rank) => {
    const pop = seg(bt, frogIdx * 0.05, 0.4, easeBack);
    const move = seg(bt, 1.3 + rank * 0.06, 0.8);
    const from = SCATTER[frogIdx];
    const to = rowSlot(rank);
    const pos = arcPoint(from, to, 60, move);
    const isBest = rank === 0;
    const isWorst = rank === FROG_COUNT - 1;
    drawFrog(ctx, pos.x, pos.y, 32 * Math.max(0.01, pop), isBest && move > 0.5 ? COLORS.gold : COLORS.toscaLight, {
      lift: Math.sin(Math.PI * move) * 30,
      crown: isBest && move > 0.5,
      ring: isWorst && move > 0.9 ? COLORS.danger : null
    });
    drawText(ctx, `${rank + 1}`, to.x, ROW_Y + 72, {
      size: 32,
      weight: 800,
      align: 'center',
      mono: true,
      alpha: seg(bt, 2 + rank * 0.06, 0.4)
    });
  });
  const labels = seg(bt, 2.9, 0.5);
  drawPill(ctx, 'terbaik', rowSlot(0).x, ROW_Y - 110, { size: 28, alpha: labels });
  drawPill(ctx, 'terburuk', rowSlot(FROG_COUNT - 1).x - 16, ROW_Y - 110, { size: 28, fill: COLORS.danger, alpha: labels });
}

function beatPartition(ctx, bt) {
  drawGroupPonds(ctx, seg(bt, 0, 0.6));
  RANK_ORDER.forEach((_, rank) => {
    const g = rank % 3;
    const deal = seg(bt, 0.5 + rank * 0.32, 0.55);
    const from = rowSlot(rank);
    const to = groupSlot(g, Math.floor(rank / 3));
    const pos = arcPoint(from, to, 130, deal);
    const landed = deal >= 1;
    drawFrog(ctx, pos.x, pos.y, 30, landed || deal > 0.5 ? (rank === 0 ? COLORS.gold : MEMEPLEX_COLORS[g]) : COLORS.toscaLight, {
      lift: Math.sin(Math.PI * deal) * 34,
      crown: rank === 0
    });
    if (deal > 0.8) {
      drawText(ctx, `${rank + 1}`, to.x, to.y + 52, {
        size: 28,
        weight: 800,
        mono: true,
        align: 'center',
        alpha: seg(deal, 0.8, 0.2)
      });
    }
  });
}

const XW = { x: 640, y: 830 };
const XB = { x: 1240, y: 480 };
const XG = { x: 1660, y: 400 };
const TRY_B = { x: 1010, y: 610 };
const TRY_G = { x: 1180, y: 660 };
const RESET_AT = { x: 1540, y: 800 };
const LEAP_LOOP = 12;

function beatLeap(ctx, bt) {
  const time = bt % LEAP_LOOP;

  drawText(ctx, 'Xb', XB.x, XB.y - 82, { size: 40, weight: 800, align: 'center', mono: true, color: COLORS.toscaLight });
  drawFrog(ctx, XB.x, XB.y, 42, COLORS.toscaLight, { angle: -2.2 });
  drawText(ctx, 'Xg', XG.x, XG.y - 100, { size: 40, weight: 800, align: 'center', mono: true, color: COLORS.gold });
  drawFrog(ctx, XG.x, XG.y, 48, COLORS.gold, { angle: -2.2, crown: true });
  drawText(ctx, 'Xw', XW.x - 88, XW.y, { size: 40, weight: 800, align: 'center', mono: true, color: COLORS.danger });

  const tryOut = (start, target, color) => {
    const out = seg(time, start, 0.9);
    const back = seg(time, start + 1.7, 0.6);
    const active = time >= start && time < start + 2.4;
    const failedAlpha = seg(time, start + 0.9, 0.2) * (1 - seg(time, start + 1.9, 0.3));
    if (active) drawArrow(ctx, XW, target, { bend: 120, color, width: 6, progress: out, dashed: true, alpha: 1 - back });
    if (failedAlpha > 0) {
      drawCross(ctx, target.x, target.y - 70, 22, COLORS.danger, failedAlpha);
      drawPill(ctx, 'tidak membaik', target.x + 130, target.y - 70, { size: 28, fill: COLORS.danger, alpha: failedAlpha });
    }
    if (!active) return null;
    if (out < 1) {
      const p = arcPoint(XW, target, 120, out);
      return { ...p, lift: Math.sin(Math.PI * out) * 30 };
    }
    return back > 0 ? { ...arcPoint(target, XW, -80, back), lift: Math.sin(Math.PI * back) * 24 } : { ...target, lift: 0 };
  };

  const attemptB = tryOut(0.6, TRY_B, COLORS.toscaLight);
  const attemptG = tryOut(3.6, TRY_G, COLORS.gold);
  const resetP = seg(time, 7, 0.9);
  let frog = attemptB || attemptG || { ...XW, lift: 0 };
  if (time >= 7) {
    frog = { ...arcPoint(XW, RESET_AT, 300, resetP), lift: 0 };
    drawArrow(ctx, XW, RESET_AT, { bend: 300, color: COLORS.coral, width: 6, progress: resetP, dashed: true });
    if (resetP >= 1) {
      drawRipple(ctx, RESET_AT.x, RESET_AT.y, seg(time, 7.9, 1.2), COLORS.coral, 130);
      drawPill(ctx, 'posisi acak baru', RESET_AT.x, RESET_AT.y + 92, { size: 28, fill: COLORS.coral });
    }
  }
  drawFrog(ctx, frog.x, frog.y, 36, COLORS.coral, { lift: frog.lift, angle: 0.9, ring: COLORS.danger });

  // Tangga tiga aturan beserta rumus yang sedang berlaku
  const activeRule = time < 3.4 ? 0 : time < 6.8 ? 1 : 2;
  const rules = [
    { text: 'Xw + r · (Xb − Xw)', color: COLORS.toscaLight },
    { text: 'Xw + r · (Xg − Xw)', color: COLORS.gold },
    { text: 'posisi acak', color: COLORS.coral }
  ];
  rules.forEach((rule, i) => {
    const y = 318 + i * 62;
    const on = i === activeRule;
    drawText(ctx, `${i + 1}`, 560, y, { size: 34, weight: 800, mono: true, color: on ? rule.color : COLORS.muted, alpha: on ? 1 : 0.5 });
    drawText(ctx, rule.text, 602, y, { size: 36, mono: true, weight: 700, color: on ? rule.color : COLORS.muted, alpha: on ? 1 : 0.5 });
  });
}

function beatShuffle(ctx, bt) {
  const gather = seg(bt, 0.2, 1.1);
  const redeal = seg(bt, 2.3, 1.4);
  const swirlSpeed = bt * 2.4;
  drawGroupPonds(ctx, 1 - gather * (1 - redeal));

  RANK_ORDER.forEach((_, rank) => {
    const oldGroup = rank % 3;
    const newRank = (rank * 5 + 2) % FROG_COUNT;
    const newGroup = newRank % 3;
    const start = groupSlot(oldGroup, Math.floor(rank / 3));
    const end = groupSlot(newGroup, Math.floor(newRank / 3));
    const angle = (rank / FROG_COUNT) * Math.PI * 2 + swirlSpeed;
    const swirl = { x: 1170 + Math.cos(angle) * 150, y: 640 + Math.sin(angle) * 150 };
    const gathered = {
      x: lerp(start.x, swirl.x, gather),
      y: lerp(start.y, swirl.y, gather)
    };
    const x = lerp(gathered.x, end.x, redeal);
    const y = lerp(gathered.y, end.y, redeal);
    const isBest = newRank === 0;
    let color = MEMEPLEX_COLORS[oldGroup];
    if (gather > 0.5) color = COLORS.toscaLight;
    if (redeal > 0.5) color = isBest ? COLORS.gold : MEMEPLEX_COLORS[newGroup];
    drawFrog(ctx, x, y, 30, color, {
      angle: gather > 0 && redeal < 1 ? angle + Math.PI : 0.4 * rank,
      crown: isBest && redeal > 0.5
    });
  });

  drawPill(ctx, 'ulangi sampai iterasi maksimum', 1170, 930, { size: 32, alpha: seg(bt, 3.9, 0.5) });
}

function drawHowScene(ctx, { t, bt, beat }) {
  drawPondWater(ctx, t);
  if (beat === 0) beatSort(ctx, bt);
  else if (beat === 1) beatPartition(ctx, bt);
  else if (beat === 2) beatLeap(ctx, bt);
  else beatShuffle(ctx, bt);
}

/* ---------- Registri slide ---------- */

const CHAPTER = { id: 'sfla', label: 'SFLA' };

export const sflaSlides = [
  {
    id: 'sfla-inspirasi',
    chapter: CHAPTER,
    title: 'SFLA: Inspirasi',
    beats: 2,
    notes: `
      <p><strong>SFLA</strong> diperkenalkan Eusuff &amp; Lansey (2003), awalnya untuk desain jaringan distribusi air.</p>
      <ul>
        <li>Sekelompok katak di kolam mencari lokasi dengan makanan terbanyak.</li>
        <li>Beat 2: katak tidak mewariskan gen, melainkan <em>meniru</em> informasi (meme) dari katak yang lebih baik, sehingga informasi menyebar dalam satu generasi.</li>
        <li>Gabungan pencarian lokal ala PSO dan shuffling ala Shuffled Complex Evolution.</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'SFLA · Eusuff &amp; Lansey, 2003',
        beats: [
          { title: 'Katak mencari makanan.', sub: 'Shuffled Frog-Leaping Algorithm' },
          { title: 'Katak meniru yang terbaik.', sub: 'Yang dibagikan adalah informasi (meme), bukan gen.' }
        ],
        draw: drawInspirationScene
      });
    }
  },
  {
    id: 'sfla-karakter',
    chapter: CHAPTER,
    title: 'SFLA: Karakteristik',
    notes: `
      <ul>
        <li><strong>Memeplex:</strong> populasi F dibagi ke m memeplex berukuran sama.</li>
        <li><strong>Lompatan lokal:</strong> tiap iterasi lokal hanya memperbarui Xw di tiap memeplex, sehingga evaluasi fungsi hemat.</li>
        <li><strong>Shuffle berkala:</strong> menyebarkan informasi antar-memeplex dan menjaga keragaman.</li>
        <li><strong>Evolusi memetik:</strong> perbaikan terjadi lewat peniruan, bukan persilangan genetik.</li>
        <li>Parameter: F, m, N (iterasi lokal), dan Dmax (langkah maksimum).</li>
      </ul>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'SFLA · Karakteristik',
        beats: [{ title: 'Karakteristik SFLA' }],
        draw: drawTraitsScene
      });
    }
  },
  {
    id: 'sfla-cara',
    chapter: CHAPTER,
    title: 'SFLA: Cara Kerja',
    beats: 4,
    notes: `
      <p>Tekan <kbd>&rarr;</kbd> untuk tiap tahap. Ini ilustrasi; simulasi langsung ada di slide berikutnya.</p>
      <ol>
        <li><strong>Pengurutan:</strong> evaluasi f(X) lalu urutkan dari terbaik ke terburuk. Xg = peringkat 1.</li>
        <li><strong>Partisi:</strong> dibagi bergilir dengan k = i mod m, sehingga tiap memeplex berisi katak baik dan buruk secara merata.</li>
        <li><strong>Lompatan lokal:</strong> Xw mencoba ke Xb; bila tidak membaik, ke Xg; bila masih gagal, diganti posisi acak. Berhenti saat posisinya membaik. Langkah dibatasi Dmax.</li>
        <li><strong>Shuffle:</strong> semua digabung, diurutkan ulang, lalu dipartisi kembali.</li>
      </ol>`,
    mount(container, ctx) {
      return mountScene(container, ctx, {
        kicker: 'SFLA · Cara kerja',
        steps: ['Pengurutan', 'Partisi', 'Lompatan lokal', 'Shuffle'],
        beats: [
          { title: 'Urutkan dari yang terbaik.' },
          { title: 'Bagi merata ke tiap memeplex.' },
          { title: 'Katak terburuk mencoba melompat.', sub: 'Berhenti saat posisinya membaik.' },
          { title: 'Shuffle, lalu bagi ulang.' }
        ],
        draw: drawHowScene
      });
    }
  },
  {
    id: 'sfla-sim',
    chapter: CHAPTER,
    title: 'SFLA: Simulasi',
    notes: `
      <p>Di sini <strong>SFLAEngine</strong> benar-benar berjalan. Tekan <kbd>S</kbd> per tahap atau <kbd>P</kbd> untuk otomatis.</p>
      <ul>
        <li>Warna = memeplex. Lingkaran merah = Xw, lingkaran putih = Xb, mahkota = Xg.</li>
        <li>Label lompatan menunjukkan aturan yang berhasil: ke Xb, ke Xg, atau acak.</li>
        <li>Peta: makin terang makin rendah biayanya. Bintang = optimum global (0, 0).</li>
        <li>Coba Rastrigin untuk memperlihatkan jebakan lokal, Sphere untuk konvergensi mulus.</li>
      </ul>`,
    mount(container, ctx) {
      return mountSimulation(container, ctx, {
        idPrefix: 'sfla',
        title: 'Simulasi SFLA',
        kicker: 'SFLA · Simulasi langsung',
        color: COLORS.toscaLight,
        fillFlat: 'rgba(95, 224, 210, 0.16)',
        Engine: SFLAEngine,
        renderer: new SFLARenderer(),
        bestOf: (state) => state.bestFrog,
        bestLabel: 'f(Xg) terbaik',
        phases: [
          { key: 'SORT', label: 'Pengurutan' },
          { key: 'PARTITION', label: 'Partisi' },
          { key: 'LOCAL_JUMP', label: 'Lompatan' },
          { key: 'SHUFFLE', label: 'Shuffle' }
        ],
        params: [
          { key: 'populationSize', label: 'Katak (F)', min: 12, max: 48, step: 4, value: 24 },
          { key: 'memeplexCount', label: 'Memeplex (m)', min: 2, max: 6, step: 1, value: 4 },
          { key: 'localIterations', label: 'Iterasi lokal (N)', min: 1, max: 8, step: 1, value: 3 },
          { key: 'maxStep', label: 'Dmax', min: 0.8, max: 5, step: 0.2, value: 3.2 }
        ]
      });
    }
  }
];
