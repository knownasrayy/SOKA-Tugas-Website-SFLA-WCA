/**
 * Renderer Visual SFLA (Metafora Katak di Kolam Teratai)
 * Menggunakan Palet Resmi ITS: FKK Medical Tosca (#12B0A2), Kuning Tua ITS (#FDBB16),
 * FTK Summer Sky (#26AEE4), FV Crusta (#F47D52), dan Biru Muda ITS (#75BDE0).
 * Seluruh ukuran mengikuti faktor `u` dari ukuran kanvas agar konsisten di layar apa pun.
 */

import { ContourMapCache, syncCanvasSize } from './contourRenderer.js';
import { COLORS, arcPoint, drawArrow, drawCross, drawFrog, drawPill, drawRipple } from './sprites.js';

export const MEMEPLEX_COLORS = [
  '#3fe0c5', // M1: Tosca terang
  '#ffb0d0', // M2: Merah muda teratai
  '#7fd0ff', // M3: FTK Summer Sky terang
  '#f9a071', // M4: FV Crusta terang
  '#c7b8ff', // M5: Ungu muda
  '#d8ec6a', // M6: Hijau kekuningan
  '#ffffff', // M7: Putih
  '#f6ec1d'  // M8: ITS Kuning Lambang
];

const JUMP_STYLES = {
  XB_SUCCESS: { color: COLORS.toscaLight, label: 'ke Xb' },
  XG_SUCCESS: { color: COLORS.gold, label: 'ke Xg' },
  RANDOM_RESET: { color: COLORS.danger, label: 'acak' }
};

function memeplexColor(index) {
  return index >= 0 ? MEMEPLEX_COLORS[index % MEMEPLEX_COLORS.length] : '#bfe6df';
}

export class SFLARenderer {
  constructor() {
    this.contourCache = new ContourMapCache();
  }

  render(canvas, state, objective, options = {}) {
    if (!canvas || !state) return;
    const { ctx, width, height } = syncCanvasSize(canvas);
    const alpha = options.alpha ?? 1;
    const compact = options.compact ?? false;
    const u = Math.min(width, height) / 900;

    const vp = this.contourCache.renderBackground(ctx, width, height, objective, 'pond', {
      showOptimum: options.showOptimum ?? true
    });
    if (!vp) return;

    const screenOf = (frog) =>
      vp.worldToScreen(frog.prevX + (frog.x - frog.prevX) * alpha, frog.prevY + (frog.y - frog.prevY) * alpha);

    if (!compact && (state.phase === 'PARTITION' || state.phase === 'LOCAL_JUMP')) {
      this.drawMemeplexLinks(ctx, state, screenOf, u);
    }

    if (state.phase === 'LOCAL_JUMP') {
      for (const jump of state.jumps) this.drawJump(ctx, vp, jump, alpha, u, compact);
    }

    if (state.phase === 'SHUFFLE' && state.bestFrog && !compact) {
      const center = vp.worldToScreen(state.bestFrog.x, state.bestFrog.y);
      drawRipple(ctx, center.x, center.y, alpha * 0.98, COLORS.toscaLight, 220 * u);
    }

    const jumpingIds = new Map(state.jumps.map((j) => [j.frogId, j]));
    const ordered = [...state.frogs].sort((a, b) => b.fitness - a.fitness);
    const baseSize = (compact ? 10 : 13) * u;

    for (const frog of ordered) {
      const pos = screenOf(frog);
      const isBest = frog.role === 'global_best';
      const jump = jumpingIds.get(frog.id);
      const lift = jump ? Math.sin(Math.PI * alpha) * 46 * u : 0;
      const angle = jump
        ? Math.atan2(jump.toX - jump.fromX, jump.toY - jump.fromY)
        : (frog.id * 2.399) % (Math.PI * 2);

      let color = memeplexColor(frog.memeplex);
      if (compact) color = COLORS.toscaLight;
      if (isBest) color = COLORS.gold;

      let ring = null;
      if (!compact && frog.role === 'memeplex_worst') ring = 'rgba(255, 107, 112, 0.85)';
      if (!compact && frog.role === 'memeplex_best') ring = 'rgba(255, 255, 255, 0.8)';

      drawFrog(ctx, pos.x, pos.y, isBest ? baseSize * 1.35 : baseSize, color, {
        angle,
        lift,
        ring,
        crown: isBest
      });

      if (!compact && state.phase === 'SORT' && frog.rank >= 0 && frog.rank < 5) {
        drawPill(ctx, `#${frog.rank + 1}`, pos.x, pos.y - 36 * u, {
          size: Math.max(11, 20 * u),
          fill: isBest ? COLORS.gold : COLORS.ink
        });
      }
    }
  }

  /** Jaring tipis dari katak terbaik memeplex ke anggotanya, supaya kelompok terlihat tanpa legenda. */
  drawMemeplexLinks(ctx, state, screenOf, u) {
    ctx.save();
    ctx.lineWidth = Math.max(1, 1.6 * u);
    ctx.globalAlpha = 0.34;
    const leaders = new Map();
    for (const frog of state.frogs) {
      if (frog.role === 'memeplex_best') leaders.set(frog.memeplex, frog);
    }
    for (const frog of state.frogs) {
      if (frog.role === 'global_best' && !leaders.has(frog.memeplex)) leaders.set(frog.memeplex, frog);
    }
    for (const frog of state.frogs) {
      const leader = leaders.get(frog.memeplex);
      if (!leader || leader === frog) continue;
      const a = screenOf(frog);
      const b = screenOf(leader);
      ctx.strokeStyle = memeplexColor(frog.memeplex);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawJump(ctx, vp, jump, alpha, u, compact) {
    const style = JUMP_STYLES[jump.type] || JUMP_STYLES.XB_SUCCESS;
    const from = vp.worldToScreen(jump.fromX, jump.fromY);
    const to = vp.worldToScreen(jump.toX, jump.toY);
    const bend = 46 * u;

    if (typeof jump.failedXbX === 'number' && !compact) {
      const failed = vp.worldToScreen(jump.failedXbX, jump.failedXbY);
      const miss = arcPoint(from, failed, 0, 0.5);
      drawArrow(ctx, from, miss, { color: COLORS.danger, width: 2.4 * u, dashed: true, head: false, alpha: 0.8 });
      drawCross(ctx, miss.x, miss.y, 8 * u, COLORS.danger, 0.9);
    }

    drawArrow(ctx, from, to, {
      bend,
      color: style.color,
      width: 3.2 * u,
      progress: Math.max(0.02, alpha),
      dashed: jump.type === 'RANDOM_RESET'
    });
    drawRipple(ctx, to.x, to.y, (alpha - 0.5) * 2, style.color, 52 * u);

    if (!compact) {
      drawPill(ctx, style.label, to.x, to.y + 34 * u, {
        size: Math.max(11, 19 * u),
        fill: style.color,
        alpha: Math.min(1, alpha * 2)
      });
    }
  }
}
