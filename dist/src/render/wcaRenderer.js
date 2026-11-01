/**
 * Renderer Visual WCA (Metafora Siklus Air Hidrologi)
 * Menggunakan Palet Resmi ITS: Biru Tua Lambang (#127BBE), FTK Summer Sky (#26AEE4),
 * Biru Muda Lambang (#75BDE0), dan Kuning Tua ITS (#FDBB16) untuk titik Laut terbaik.
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

    // 1. Lingkaran radius penguapan dmax di sekitar Laut
    if (seaDrop && state.phase !== 'INIT') {
      const seaPos = dropScreenMap.get(seaDrop.id);
      const dmaxPx = Math.max(8, vp.worldDistToPx(state.dmax));
      ctx.save();
      ctx.beginPath();
      ctx.arc(seaPos.x, seaPos.y, dmaxPx, 0, Math.PI * 2);
      ctx.fillStyle =
        state.phase === 'EVAPORATION'
          ? 'rgba(38, 174, 228, 0.18)'
          : 'rgba(117, 189, 224, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(117, 189, 224, 0.72)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!options.compact && dmaxPx > 22) {
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#cee5ff';
        ctx.fillText('dmax', seaPos.x + dmaxPx + 6, seaPos.y + 4);
      }
      ctx.restore();
    }

    // 2. Jaringan aliran hidrologi (Stream -> River/Sea, River -> Sea)
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

        const nx = -dy * 0.14;
        const ny = dx * 0.14;
        const cx = (from.x + to.x) / 2 + nx;
        const cy = (from.y + to.y) / 2 + ny;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(cx, cy, to.x, to.y);

        if (d.role === 'river') {
          ctx.strokeStyle = 'rgba(38, 174, 228, 0.58)';
          ctx.lineWidth = 2.3;
          ctx.setLineDash([8, 5]);
          ctx.lineDashOffset = dashOffset;
        } else {
          ctx.strokeStyle = 'rgba(117, 189, 224, 0.28)';
          ctx.lineWidth = 1.25;
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. Kilatan pertukaran peran (ROLE_SWAP)
    if (state.phase === 'ROLE_SWAP' && state.swaps.length > 0) {
      for (const sw of state.swaps) {
        this.drawSwapFlash(ctx, vp, sw, alpha);
      }
    }

    // 4. Urutan render: Stream -> River -> Sea
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

      if (state.phase === 'EVAPORATION' && d.evaporating) {
        this.drawVaporEffect(ctx, pos.x, pos.y, alpha);
      }

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

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(-2, 5.8, -6, 0);
    ctx.quadraticCurveTo(-2, -5.8, 8, 0);
    ctx.closePath();
    ctx.fillStyle = '#cee5ff';
    ctx.strokeStyle = '#03132b';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawRiver(ctx, x, y, riverIdx, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 17);
    glow.addColorStop(0, 'rgba(38, 174, 228, 0.55)');
    glow.addColorStop(1, 'rgba(38, 174, 228, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();

    const r = compact ? 8.5 : 10.5;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fillStyle = '#26aee4';
    ctx.strokeStyle = '#ecf3ff';
    ctx.lineWidth = 1.9;
    ctx.fill();
    ctx.stroke();

    if (!compact) {
      ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#03132b';
      ctx.textAlign = 'center';
      ctx.fillText(`S${riverIdx}`, 0, 3.4);
    }
    ctx.restore();
  }

  drawSea(ctx, x, y, compact = false) {
    ctx.save();
    ctx.translate(x, y);

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 26);
    glow.addColorStop(0, 'rgba(18, 123, 190, 0.82)');
    glow.addColorStop(0.55, 'rgba(253, 187, 22, 0.34)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    const r = compact ? 11 : 13.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#127bbe';
    ctx.strokeStyle = '#fdbb16';
    ctx.lineWidth = 2.8;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.quadraticCurveTo(-3, -3, 0, 1);
    ctx.quadraticCurveTo(3, 5, 6, 1);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.1;
    ctx.stroke();

    if (!compact) {
      ctx.font = '800 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fdbb16';
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
    ctx.strokeStyle = '#fdbb16';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    const r = 10 + (1 - alpha) * 15;
    ctx.beginPath();
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#fdbb16';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#fdbb16';
    ctx.fillText('TUKAR PERAN', a.x + 12, a.y - 10);
    ctx.restore();
  }

  drawVaporEffect(ctx, x, y, alpha) {
    ctx.save();
    const lift = alpha * 32;
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 8;
      const oy = -lift - i * 7;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, 4.8 + i * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(214, 227, 255, ${Math.max(0.16, 0.76 - alpha * 0.5)})`;
      ctx.fill();
    }
    ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#d6e3ff';
    ctx.fillText('UAP', x + 10, y - lift - 8);
    ctx.restore();
  }

  drawRainEffect(ctx, x, y, alpha) {
    ctx.save();
    const dropY = y - (1 - alpha) * 42;

    ctx.strokeStyle = '#75bde0';
    ctx.lineWidth = 2;
    for (const dx of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(x + dx + 4, dropY - 18);
      ctx.lineTo(x + dx, dropY - 4);
      ctx.stroke();
    }

    if (alpha > 0.3) {
      ctx.beginPath();
      ctx.arc(x, y, 8 + alpha * 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(117, 189, 224, ${Math.max(0, 0.82 - alpha * 0.68)})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    ctx.restore();
  }
}
