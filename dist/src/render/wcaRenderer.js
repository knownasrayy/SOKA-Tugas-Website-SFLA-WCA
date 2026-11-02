/**
 * Renderer Visual WCA (Metafora Siklus Air Hidrologi)
 * Menggunakan Palet Resmi ITS: Biru Tua Lambang (#127BBE), FTK Summer Sky (#26AEE4),
 * Biru Muda Lambang (#75BDE0), dan Kuning Tua ITS (#FDBB16) untuk titik Laut terbaik.
 * Seluruh ukuran mengikuti faktor `u` dari ukuran kanvas agar konsisten di layar apa pun.
 */

import { ContourMapCache, syncCanvasSize } from './contourRenderer.js';
import { COLORS, drawCloud, drawDrop, drawGlow, drawPill, drawText } from './sprites.js';

export function drawSeaMarker(ctx, x, y, size, time = 0) {
  drawGlow(ctx, x, y, size * 2.6, 'rgba(253, 187, 22, 0.42)');
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.blue;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = Math.max(2, size * 0.17);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.5, size * 0.13);
  ctx.lineCap = 'round';
  for (const row of [-0.26, 0.26]) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const px = -0.58 + (i / 12) * 1.16;
      const py = row + Math.sin(px * 7 + time * 2.4) * 0.09;
      if (i === 0) ctx.moveTo(x + px * size, y + py * size);
      else ctx.lineTo(x + px * size, y + py * size);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRiverMarker(ctx, x, y, size, label = '') {
  drawGlow(ctx, x, y, size * 2, 'rgba(38, 174, 228, 0.5)');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - size * 1.15);
  ctx.lineTo(x + size * 1.15, y);
  ctx.lineTo(x, y + size * 1.15);
  ctx.lineTo(x - size * 1.15, y);
  ctx.closePath();
  ctx.fillStyle = COLORS.sky;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1.5, size * 0.14);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (label) drawText(ctx, label, x, y + 1, { size: size * 0.82, weight: 800, color: COLORS.night, align: 'center' });
}

export class WCARenderer {
  constructor() {
    this.contourCache = new ContourMapCache();
  }

  render(canvas, state, objective, options = {}) {
    if (!canvas || !state) return;
    const { ctx, width, height } = syncCanvasSize(canvas);
    const alpha = options.alpha ?? 1;
    const timestamp = options.timestamp ?? 0;
    const compact = options.compact ?? false;
    const u = Math.min(width, height) / 900;

    const vp = this.contourCache.renderBackground(ctx, width, height, objective, 'water', {
      showOptimum: options.showOptimum ?? true
    });
    if (!vp) return;

    const screen = new Map();
    for (const d of state.drops) {
      screen.set(d.id, vp.worldToScreen(d.prevX + (d.x - d.prevX) * alpha, d.prevY + (d.y - d.prevY) * alpha));
    }

    const seaDrop = state.drops.find((d) => d.role === 'sea');

    // 1. Radius penguapan dmax di sekitar Laut
    if (seaDrop && state.phase !== 'INIT') {
      const seaPos = screen.get(seaDrop.id);
      const radius = Math.max(10 * u, vp.worldDistToPx(state.dmax));
      ctx.save();
      ctx.beginPath();
      ctx.arc(seaPos.x, seaPos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = state.phase === 'EVAPORATION' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(1.5, 2.4 * u);
      ctx.setLineDash([9 * u, 8 * u]);
      ctx.stroke();
      ctx.restore();
      if (!compact && radius > 34 * u) {
        drawText(ctx, 'dmax', seaPos.x + radius + 10 * u, seaPos.y, { size: 22 * u, color: COLORS.ink, mono: true });
      }
    }

    // 2. Jaringan aliran: garis bergerak menuju induk
    if (state.phase !== 'INIT') {
      ctx.save();
      ctx.lineCap = 'round';
      const dashOffset = -(timestamp * 0.05) % 40;
      for (const d of state.drops) {
        if (!d.parentId) continue;
        const from = screen.get(d.id);
        const to = screen.get(d.parentId);
        if (!from || !to || Math.hypot(to.x - from.x, to.y - from.y) < 6) continue;

        const isRiver = d.role === 'river';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(
          (from.x + to.x) / 2 - (to.y - from.y) * 0.14,
          (from.y + to.y) / 2 + (to.x - from.x) * 0.14,
          to.x,
          to.y
        );
        ctx.strokeStyle = isRiver ? 'rgba(255, 255, 255, 0.8)' : 'rgba(205, 236, 255, 0.42)';
        ctx.lineWidth = (isRiver ? 4 : 2) * u;
        ctx.setLineDash(isRiver ? [18 * u, 12 * u] : [8 * u, 10 * u]);
        ctx.lineDashOffset = dashOffset * u;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Kilatan pertukaran peran
    if (state.phase === 'ROLE_SWAP') {
      state.swaps.forEach((swap, i) => this.drawSwap(ctx, vp, swap, alpha, u, i === 0 && !compact));
    }

    // 4. Urutan gambar: Aliran -> Sungai -> Laut
    const orderRank = { stream: 0, river: 1, sea: 2 };
    const ordered = [...state.drops].sort((a, b) => (orderRank[a.role] ?? 0) - (orderRank[b.role] ?? 0));

    for (const d of ordered) {
      const pos = screen.get(d.id);
      if (d.role === 'sea') {
        drawSeaMarker(ctx, pos.x, pos.y, (compact ? 18 : 24) * u, timestamp / 1000);
        if (!compact) {
          drawPill(ctx, 'Laut', pos.x, pos.y - 48 * u, { size: Math.max(11, 20 * u) });
        }
      } else if (d.role === 'river') {
        drawRiverMarker(ctx, pos.x, pos.y, (compact ? 13 : 17) * u, compact ? '' : `S${d.riverIndex}`);
      } else {
        const parent = d.parentId ? screen.get(d.parentId) : null;
        const angle = parent ? Math.atan2(parent.y - pos.y, parent.x - pos.x) : Math.PI / 2;
        drawDrop(ctx, pos.x, pos.y, (compact ? 7.5 : 10) * u, '#e6f6ff', { angle });
      }

      if (state.phase === 'EVAPORATION' && d.evaporating) this.drawVapor(ctx, pos.x, pos.y, alpha, u);
      if (state.phase === 'RAIN' && d.justRained) this.drawRain(ctx, pos.x, pos.y, alpha, u);
    }
  }

  drawSwap(ctx, vp, swap, alpha, u, withLabel) {
    const a = vp.worldToScreen(swap.fromX, swap.fromY);
    const b = vp.worldToScreen(swap.toX, swap.toY);
    ctx.save();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4 * u;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.lineWidth = 3 * u;
    ctx.globalAlpha = 1 - alpha * 0.7;
    for (const pt of [a, b]) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (16 + alpha * 34) * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    if (withLabel) drawPill(ctx, 'Bertukar peran', a.x, a.y - 44 * u, { size: Math.max(11, 22 * u) });
  }

  drawVapor(ctx, x, y, alpha, u) {
    ctx.save();
    const rise = alpha * 70 * u;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + (i - 1) * 13 * u, y - rise - i * 16 * u, (8 + i * 3) * u, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.82 - alpha * 0.42})`;
      ctx.fill();
    }
    ctx.restore();
  }

  drawRain(ctx, x, y, alpha, u) {
    const cloudY = y - 92 * u;
    drawCloud(ctx, x, cloudY, 24 * u, '#e6f0fa', 1 - alpha * 0.8);
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * u;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 1 - alpha * 0.5;
    for (const dx of [-14, 0, 14]) {
      const top = cloudY + 22 * u + alpha * 34 * u + Math.abs(dx) * u;
      ctx.beginPath();
      ctx.moveTo(x + dx * u + 3 * u, top);
      ctx.lineTo(x + dx * u, top + 16 * u);
      ctx.stroke();
    }
    ctx.globalAlpha = Math.max(0, 0.9 - alpha * 0.9);
    ctx.lineWidth = 2.6 * u;
    ctx.beginPath();
    ctx.arc(x, y, (12 + alpha * 32) * u, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
