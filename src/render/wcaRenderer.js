/**
 * Renderer Visual WCA — Metafora Siklus Air (PRD Bagian 8.2 & 14)
 * Menampilkan Laut, Sungai, Aliran, garis lengkung aliran air, kilatan pertukaran peran,
 * lingkaran radius penguapan dmax, uap naik, dan rintik hujan.
 */

import { ContourMapCache, syncCanvasSize } from './contourRenderer.js';

export class WCARenderer {
  constructor() {
    this.contourCache = new ContourMapCache();
  }

  render(canvas, state, objective, options = {}) {
    if (!canvas || !state) return;
    const { ctx, width, height } = syncCanvasSize(canvas);
    const alpha = options.alpha ?? 1;
    const timestamp = options.timestamp ?? 0;
    const showOptimum = options.showOptimum ?? true;
    const showTrails = options.showTrails ?? true;

    const vp = this.contourCache.renderBackground(ctx, width, height, objective, 'water', {
      showOptimum
    });
    if (!vp) return;

    const dropScreenMap = new Map();
    for (const d of state.drops) {
      const ix = d.prevX + (d.x - d.prevX) * alpha;
      const iy = d.prevY + (d.y - d.prevY) * alpha;
      dropScreenMap.set(d.id, vp.worldToScreen(ix, iy));
    }

    const seaDrop = state.drops.find((d) => d.role === 'sea');

    // 1. Gambar lingkaran radius penguapan dmax di sekitar Laut
    if (seaDrop && state.phase !== 'INIT') {
      const seaPos = dropScreenMap.get(seaDrop.id);
      const dmaxPx = Math.max(8, vp.worldDistToPx(state.dmax));
      ctx.save();
      ctx.beginPath();
      ctx.arc(seaPos.x, seaPos.y, dmaxPx, 0, Math.PI * 2);
      ctx.fillStyle =
        state.phase === 'EVAPORATION'
          ? 'rgba(103, 232, 249, 0.16)'
          : 'rgba(56, 189, 248, 0.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!options.compact && dmaxPx > 22) {
        ctx.font = '700 11px "Ubuntu Mono", monospace';
        ctx.fillStyle = '#a5f3fc';
        ctx.fillText(`dmax`, seaPos.x + dmaxPx + 5, seaPos.y + 4);
      }
      ctx.restore();
    }

    // 2. Gambar jaringan garis lengkung aliran (Stream -> River/Sea, River -> Sea)
    if (state.phase !== 'INIT' && showTrails) {
      ctx.save();
      const dashOffset = -(timestamp * 0.03) % 24;
      for (const d of state.drops) {
        if (!d.parentId) continue;
        const from = dropScreenMap.get(d.id);
        const to = dropScreenMap.get(d.parentId);
        if (!from || !to) continue;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) continue;

        // Titik kontrol lengkung organik seperti sungai alami
        const nx = -dy * 0.14;
        const ny = dx * 0.14;
        const cx = (from.x + to.x) / 2 + nx;
        const cy = (from.y + to.y) / 2 + ny;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(cx, cy, to.x, to.y);

        if (d.role === 'river') {
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.52)';
          ctx.lineWidth = 2.4;
          ctx.setLineDash([8, 5]);
          ctx.lineDashOffset = dashOffset;
        } else {
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.26)';
          ctx.lineWidth = 1.3;
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. Efek Kilatan Pertukaran Peran (ROLE_SWAP)
    if (state.phase === 'ROLE_SWAP' && state.swaps.length > 0) {
      for (const sw of state.swaps) {
        this.drawSwapFlash(ctx, vp, sw, alpha);
      }
    }

    // 4. Gambar agen dari kasta terendah ke tertinggi: Stream -> River -> Sea
    const orderRank = { stream: 0, river: 1, sea: 2 };
    const orderedDrops = [...state.drops].sort(
      (a, b) => (orderRank[a.role] ?? 0) - (orderRank[b.role] ?? 0)
    );

    for (const d of orderedDrops) {
      const pos = dropScreenMap.get(d.id);
      if (!pos) continue;

      if (d.role === 'sea') {
        this.drawSea(ctx, pos.x, pos.y, options.compact);
      } else if (d.role === 'river') {
        this.drawRiver(ctx, pos.x, pos.y, d.riverIndex, options.compact);
      } else {
        const parentPos = d.parentId ? dropScreenMap.get(d.parentId) : null;
        this.drawStream(ctx, pos.x, pos.y, parentPos);
      }

      // 5. Efek uap membubung saat EVAPORATION
      if (state.phase === 'EVAPORATION' && d.evaporating) {
        this.drawVaporEffect(ctx, pos.x, pos.y, alpha);
      }

      // 6. Efek rintik hujan jatuh saat RAIN
      if (state.phase === 'RAIN' && d.justRained) {
        this.drawRainEffect(ctx, pos.x, pos.y, alpha);
      }
    }
  }

  drawStream(ctx, x, y, parentPos) {
    ctx.save();
    ctx.translate(x, y);
    let angle = -Math.PI / 2;
    if (parentPos) {
      angle = Math.atan2(parentPos.y - y, parentPos.x - x);
    }
    ctx.rotate(angle);

    // Bentuk tetesan air meruncing ke arah aliran
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(-2, 6, -6, 0);
    ctx.quadraticCurveTo(-2, -6, 8, 0);
    ctx.closePath();
    ctx.fillStyle = '#bae6fd';
    ctx.strokeStyle = '#082f49';
    ctx.lineWidth = 1.6;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawRiver(ctx, x, y, riverIdx, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    glow.addColorStop(0, 'rgba(34, 211, 238, 0.55)');
    glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Bentuk belah ketupat membulat (diamond) untuk Sungai agar mudah dibedakan dari Aliran & Laut
    const r = compact ? 8.5 : 10.5;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fillStyle = '#22d3ee';
    ctx.strokeStyle = '#ecfeff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    if (!compact) {
      ctx.font = '800 10px "Ubuntu Mono", monospace';
      ctx.fillStyle = '#042f2e';
      ctx.textAlign = 'center';
      ctx.fillText(`S${riverIdx}`, 0, 3.5);
    }
    ctx.restore();
  }

  drawSea(ctx, x, y, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 28);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
    glow.addColorStop(0.55, 'rgba(251, 191, 36, 0.35)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    const r = compact ? 11 : 13.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    // Ikon gelombang air putih di tengah Laut
    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.quadraticCurveTo(-3, -3, 0, 1);
    ctx.quadraticCurveTo(3, 5, 6, 1);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    if (!compact) {
      ctx.font = '800 11px "Ubuntu Mono", monospace';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText('LAUT', 0, -r - 6);
    }
    ctx.restore();
  }

  drawSwapFlash(ctx, vp, sw, alpha) {
    const a = vp.worldToScreen(sw.fromX, sw.fromY);
    const b = vp.worldToScreen(sw.toX, sw.toY);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Kilatan bintang cahaya di titik pemimpin baru
    const r = 10 + (1 - alpha) * 16;
    ctx.beginPath();
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText('TUKAR PERAN', a.x + 12, a.y - 10);
    ctx.restore();
  }

  drawVaporEffect(ctx, x, y, alpha) {
    ctx.save();
    const lift = alpha * 34;
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 8;
      const oy = -lift - i * 7;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, 5 + i * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0.15, 0.78 - alpha * 0.5)})`;
      ctx.fill();
    }
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText('UAP', x + 10, y - lift - 8);
    ctx.restore();
  }

  drawRainEffect(ctx, x, y, alpha) {
    ctx.save();
    const dropY = y - (1 - alpha) * 44;

    // Garis rintik hujan jatuh dari atas
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2;
    for (const dx of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(x + dx + 4, dropY - 18);
      ctx.lineTo(x + dx, dropY - 4);
      ctx.stroke();
    }

    // Riak pendaratan hujan
    if (alpha > 0.3) {
      ctx.beginPath();
      ctx.arc(x, y, 8 + alpha * 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(125, 211, 252, ${Math.max(0, 0.85 - alpha * 0.7)})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    ctx.restore();
  }
}

