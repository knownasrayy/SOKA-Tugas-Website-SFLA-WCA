/**
 * Renderer Visual SFLA — Metafora Katak di Kolam Teratai (PRD Bagian 7.2 & 14)
 * Menampilkan daun teratai, warna & label memeplex (M1..Mm), panah lompatan, riak air,
 * dan mahkota emas untuk katak terbaik global (Xg).
 */

import { ContourMapCache, syncCanvasSize } from './contourRenderer.js';

// Palet warna memeplex kontras tinggi di atas latar kolam zamrud gelap
export const MEMEPLEX_COLORS = [
  '#43bf9c', // M1: Hijau teratai
  '#d8a33a', // M2: Oker keemasan
  '#53bce3', // M3: Biru langit hidrologi
  '#e07a9a', // M4: Merah muda teratai
  '#48b8d0', // M5: Biru teluk
  '#e08544', // M6: Jingga terakota
  '#9ccf4e', // M7: Hijau pucuk
  '#27a89a'  // M8: Toska dalam
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

    // 1. Gambar daun teratai dekoratif halus di beberapa titik kolam
    this.drawLilyPads(ctx, vp, objective);

    // 2. Gambar jejak pergerakan katak jika diaktifkan
    if (showTrails) {
      for (const frog of state.frogs) {
        if (!frog.trail || frog.trail.length < 2) continue;
        const mColor =
          frog.memeplex >= 0
            ? MEMEPLEX_COLORS[frog.memeplex % MEMEPLEX_COLORS.length]
            : 'rgba(148, 163, 184, 0.5)';
        ctx.save();
        ctx.beginPath();
        frog.trail.forEach((pt, idx) => {
          const s = vp.worldToScreen(pt.x, pt.y);
          if (idx === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.strokeStyle = mColor;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Gambar panah lompatan & riak percikan air pada tahap LOCAL_JUMP
    if (state.phase === 'LOCAL_JUMP' && state.jumps.length > 0) {
      for (const jmp of state.jumps) {
        this.drawJumpEffect(ctx, vp, jmp, alpha);
      }
    }

    // 4. Gambar garis pusaran tipis saat SHUFFLE
    if (state.phase === 'SHUFFLE' && state.bestFrog) {
      const center = vp.worldToScreen(state.bestFrog.x, state.bestFrog.y);
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.28)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 48 + (1 - alpha) * 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Urutkan penggambaran katak agar katak terbaik digambar paling atas (tidak tertutup)
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
      // Daun teratai dengan celah huruf V kecil
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, p.r, p.rot + 0.22, p.rot + Math.PI * 2 - 0.22);
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
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

    // Bila percobaan ke Xb gagal lalu pindah ke Xg, tampilkan garis tipis gagal ke Xb
    if (jmp.triedXbFailed && typeof jmp.failedXbX === 'number') {
      const fxb = vp.worldToScreen(jmp.failedXbX, jmp.failedXbY);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(fxb.x, fxb.y);
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    let strokeColor = '#43bf9c';
    let badgeText = '→ Xb [OK]';
    if (jmp.type === 'XG_SUCCESS') {
      strokeColor = '#d8a33a';
      badgeText = '→ Xg [OK]';
    } else if (jmp.type === 'RANDOM_RESET') {
      strokeColor = '#d95b5b';
      badgeText = 'Acak ↺';
    }

    // Busur lompatan melengkung
    const midX = (from.x + curX) / 2;
    const midY = (from.y + curY) / 2 - 22 * Math.sin(alpha * Math.PI * 0.5 + 0.3);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, midY, curX, curY);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.4;
    if (jmp.type === 'RANDOM_RESET') ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Kepala panah di ujung lompatan
    const angle = Math.atan2(curY - midY, curX - midX);
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(curX - 9 * Math.cos(angle - 0.45), curY - 9 * Math.sin(angle - 0.45));
    ctx.lineTo(curX - 9 * Math.cos(angle + 0.45), curY - 9 * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fillStyle = strokeColor;
    ctx.fill();

    // Riak percikan air saat mendarat
    if (alpha > 0.35) {
      const rippleProgress = (alpha - 0.35) / 0.65;
      const r1 = 8 + rippleProgress * 18;
      ctx.beginPath();
      ctx.arc(to.x, to.y, r1, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = Math.max(0, 0.75 * (1 - rippleProgress));
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Label kecil status lompatan
    ctx.font = '700 11px "Ubuntu Mono", monospace';
    ctx.fillStyle = strokeColor;
    ctx.fillText(badgeText, to.x + 11, to.y - 11);

    ctx.restore();
  }

  drawFrog(ctx, x, y, frog, objective, phase, compact = false) {
    const isGlobalBest = frog.role === 'global_best';
    const isMemeplexBest = frog.role === 'memeplex_best';
    const normFit = Math.min(1, Math.max(0, frog.fitness / (objective.maxVisualValue || 50)));

    // Katak dengan fitness lebih baik sedikit lebih besar & bercahaya
    const baseR = compact ? 6.5 : 8.2;
    const radius = isGlobalBest ? baseR + 3.5 : baseR + (1 - normFit) * 2.5;

    const fill =
      frog.memeplex >= 0
        ? MEMEPLEX_COLORS[frog.memeplex % MEMEPLEX_COLORS.length]
        : '#94a3b8';

    ctx.save();
    ctx.translate(x, y);

    // Pendar cahaya untuk katak terbaik global atau terbaik kelompok
    if (isGlobalBest || isMemeplexBest) {
      const glowR = isGlobalBest ? radius * 2.6 : radius * 1.9;
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, glowR);
      g.addColorStop(0, isGlobalBest ? 'rgba(251, 191, 36, 0.7)' : 'rgba(52, 211, 153, 0.45)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Siluet tubuh katak bergaya ikon bersih (badan bulat + 2 mata kecil di atas)
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = isGlobalBest ? '#fbbf24' : fill;
    ctx.strokeStyle = isGlobalBest ? '#fef08a' : '#041311';
    ctx.lineWidth = isGlobalBest ? 2.6 : 2;
    ctx.fill();
    ctx.stroke();

    // Dua mata katak di bagian atas agar bentuk katak langsung dikenali tanpa bergantung warna saja
    const eyeOffset = radius * 0.56;
    const eyeR = Math.max(2, radius * 0.28);
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(dir * eyeOffset, -radius * 0.68, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dir * eyeOffset, -radius * 0.68, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    }

    // Mahkota emas untuk katak terbaik global (Xg)
    if (isGlobalBest) {
      ctx.beginPath();
      ctx.moveTo(-7, -radius - 4);
      ctx.lineTo(-5, -radius - 12);
      ctx.lineTo(0, -radius - 7);
      ctx.lineTo(5, -radius - 12);
      ctx.lineTo(7, -radius - 4);
      ctx.closePath();
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.4;
      ctx.fill();
      ctx.stroke();
    }

    // Label nomor memeplex (M1..Mm) atau peringkat saat SORT agar aksesibel bagi buta warna
    if (!compact) {
      ctx.font = '700 10px "Ubuntu Mono", monospace';
      ctx.textAlign = 'center';
      if (frog.memeplex >= 0) {
        ctx.fillStyle = '#021310';
        ctx.fillText(`M${frog.memeplex + 1}`, 0, 3.5);
      } else if (phase === 'SORT' && frog.rank >= 0 && frog.rank < 9) {
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`${frog.rank + 1}`, 0, 3.5);
      }
    }

    ctx.restore();
  }
}

