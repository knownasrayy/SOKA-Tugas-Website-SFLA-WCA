/**
 * Renderer Visual SFLA (Metafora Katak di Kolam Teratai)
 * Menggunakan Palet Resmi ITS: FKK Medical Tosca (#12B0A2), Kuning Tua ITS (#FDBB16),
 * FTK Summer Sky (#26AEE4), FV Crusta (#F47D52), dan Biru Muda ITS (#75BDE0).
 */

import { ContourMapCache, syncCanvasSize } from './contourRenderer.js';

export const MEMEPLEX_COLORS = [
  '#12b0a2', // M1: FKK Medical Tosca
  '#fdbb16', // M2: ITS Kuning Tua
  '#26aee4', // M3: FTK Summer Sky
  '#f47d52', // M4: FV Crusta
  '#75bde0', // M5: ITS Biru Muda Lambang
  '#127bbe', // M6: ITS Biru Tua Lambang
  '#52d1c6', // M7: Tosca Muda Kontras
  '#f6ec1d'  // M8: ITS Kuning Lambang
];

export class SFLARenderer {
  constructor() {
    this.contourCache = new ContourMapCache();
  }

  render(canvas, state, objective, options = {}) {
    if (!canvas || !state) return;
    const { ctx, width, height } = syncCanvasSize(canvas);
    const alpha = options.alpha ?? 1;
    const showOptimum = options.showOptimum ?? true;
    const showTrails = options.showTrails ?? true;

    const vp = this.contourCache.renderBackground(ctx, width, height, objective, 'pond', {
      showOptimum
    });
    if (!vp) return;

    // 1. Daun teratai geometris di beberapa titik referensi kolam
    this.drawLilyPads(ctx, vp, objective);

    // 2. Jejak lintasan lompatan katak
    if (showTrails) {
      for (const frog of state.frogs) {
        if (!frog.trail || frog.trail.length < 2) continue;
        const mColor =
          frog.memeplex >= 0
            ? MEMEPLEX_COLORS[frog.memeplex % MEMEPLEX_COLORS.length]
            : 'rgba(184, 197, 217, 0.45)';
        ctx.save();
        ctx.beginPath();
        frog.trail.forEach((pt, idx) => {
          const s = vp.worldToScreen(pt.x, pt.y);
          if (idx === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.strokeStyle = mColor;
        ctx.globalAlpha = 0.24;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Vektor lompatan & riak air pada tahap LOCAL_JUMP
    if (state.phase === 'LOCAL_JUMP' && state.jumps.length > 0) {
      for (const jmp of state.jumps) {
        this.drawJumpEffect(ctx, vp, jmp, alpha);
      }
    }

    // 4. Lingkaran konsolidasi global saat SHUFFLE
    if (state.phase === 'SHUFFLE' && state.bestFrog) {
      const center = vp.worldToScreen(state.bestFrog.x, state.bestFrog.y);
      ctx.save();
      ctx.strokeStyle = 'rgba(18, 176, 162, 0.38)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 46 + (1 - alpha) * 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Urutkan penggambaran katak agar solusi terbaik berada paling atas
    const frogsToDraw = [...state.frogs].sort((a, b) => b.fitness - a.fitness);
    for (const frog of frogsToDraw) {
      const ix = frog.prevX + (frog.x - frog.prevX) * alpha;
      const iy = frog.prevY + (frog.y - frog.prevY) * alpha;
      const pos = vp.worldToScreen(ix, iy);
      this.drawFrog(ctx, pos.x, pos.y, frog, objective, state.phase, options.compact);
    }
  }

  drawLilyPads(ctx, vp, objective) {
    const pads = [
      { x: -3.2, y: 2.8, r: 17, rot: 0.4 },
      { x: 3.1, y: 2.6, r: 15, rot: 2.1 },
      { x: -2.9, y: -3.0, r: 16, rot: -1.1 },
      { x: 2.8, y: -2.7, r: 18, rot: 1.3 },
      { x: 0, y: 0, r: 22, rot: 0.8 }
    ];
    ctx.save();
    for (const p of pads) {
      if (p.x < objective.min || p.x > objective.max) continue;
      const s = vp.worldToScreen(p.x, p.y);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, p.r, p.rot + 0.22, p.rot + Math.PI * 2 - 0.22);
      ctx.closePath();
      ctx.fillStyle = 'rgba(18, 176, 162, 0.12)';
      ctx.strokeStyle = 'rgba(18, 176, 162, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawJumpEffect(ctx, vp, jmp, alpha) {
    const from = vp.worldToScreen(jmp.fromX, jmp.fromY);
    const to = vp.worldToScreen(jmp.toX, jmp.toY);
    const curX = from.x + (to.x - from.x) * alpha;
    const curY = from.y + (to.y - from.y) * alpha;

    ctx.save();

    if (jmp.triedXbFailed && typeof jmp.failedXbX === 'number') {
      const fxb = vp.worldToScreen(jmp.failedXbX, jmp.failedXbY);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(fxb.x, fxb.y);
      ctx.strokeStyle = 'rgba(224, 90, 95, 0.38)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    let strokeColor = '#12b0a2';
    let badgeText = 'Ke Xb';
    if (jmp.type === 'XG_SUCCESS') {
      strokeColor = '#fdbb16';
      badgeText = 'Ke Xg';
    } else if (jmp.type === 'RANDOM_RESET') {
      strokeColor = '#e05a5f';
      badgeText = 'Reset Acak';
    }

    const midX = (from.x + curX) / 2;
    const midY = (from.y + curY) / 2 - 20 * Math.sin(alpha * Math.PI * 0.5 + 0.3);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, midY, curX, curY);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    if (jmp.type === 'RANDOM_RESET') ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const angle = Math.atan2(curY - midY, curX - midX);
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(curX - 8.5 * Math.cos(angle - 0.45), curY - 8.5 * Math.sin(angle - 0.45));
    ctx.lineTo(curX - 8.5 * Math.cos(angle + 0.45), curY - 8.5 * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fillStyle = strokeColor;
    ctx.fill();

    if (alpha > 0.35) {
      const rippleProgress = (alpha - 0.35) / 0.65;
      const r1 = 8 + rippleProgress * 17;
      ctx.beginPath();
      ctx.arc(to.x, to.y, r1, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = Math.max(0, 0.72 * (1 - rippleProgress));
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = strokeColor;
    ctx.fillText(badgeText, to.x + 10, to.y - 10);

    ctx.restore();
  }

  drawFrog(ctx, x, y, frog, objective, phase, compact = false) {
    const isGlobalBest = frog.role === 'global_best';
    const isMemeplexBest = frog.role === 'memeplex_best';
    const normFit = Math.min(1, Math.max(0, frog.fitness / (objective.maxVisualValue || 50)));

    const baseR = compact ? 6.5 : 8.2;
    const radius = isGlobalBest ? baseR + 3.4 : baseR + (1 - normFit) * 2.4;

    const fill =
      frog.memeplex >= 0
        ? MEMEPLEX_COLORS[frog.memeplex % MEMEPLEX_COLORS.length]
        : '#8a99b2';

    ctx.save();
    ctx.translate(x, y);

    if (isGlobalBest || isMemeplexBest) {
      const glowR = isGlobalBest ? radius * 2.5 : radius * 1.8;
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, glowR);
      g.addColorStop(0, isGlobalBest ? 'rgba(253, 187, 22, 0.68)' : 'rgba(18, 176, 162, 0.42)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = isGlobalBest ? '#fdbb16' : fill;
    ctx.strokeStyle = isGlobalBest ? '#fff3c4' : '#03132b';
    ctx.lineWidth = isGlobalBest ? 2.4 : 1.9;
    ctx.fill();
    ctx.stroke();

    const eyeOffset = radius * 0.56;
    const eyeR = Math.max(2, radius * 0.27);
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(dir * eyeOffset, -radius * 0.68, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#ecf3ff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dir * eyeOffset, -radius * 0.68, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#03132b';
      ctx.fill();
    }

    if (isGlobalBest) {
      ctx.beginPath();
      ctx.moveTo(-7, -radius - 4);
      ctx.lineTo(-5, -radius - 11);
      ctx.lineTo(0, -radius - 7);
      ctx.lineTo(5, -radius - 11);
      ctx.lineTo(7, -radius - 4);
      ctx.closePath();
      ctx.fillStyle = '#fdbb16';
      ctx.strokeStyle = '#03132b';
      ctx.lineWidth = 1.4;
      ctx.fill();
      ctx.stroke();
    }

    if (!compact) {
      ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      if (frog.memeplex >= 0) {
        ctx.fillStyle = '#03132b';
        ctx.fillText(`M${frog.memeplex + 1}`, 0, 3.4);
      } else if (phase === 'SORT' && frog.rank >= 0 && frog.rank < 9) {
        ctx.fillStyle = '#03132b';
        ctx.fillText(`${frog.rank + 1}`, 0, 3.4);
      }
    }

    ctx.restore();
  }
}
