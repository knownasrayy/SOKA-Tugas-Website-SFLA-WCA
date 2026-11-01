/**
 * Grafik Konvergensi Fitness Terbaik per Iterasi (F-09)
 * Mendukung satu seri (SFLA atau WCA) maupun multi-seri (Perbandingan SFLA vs WCA).
 */

import { syncCanvasSize } from './contourRenderer.js';

export function renderConvergenceChart(canvas, seriesList, options = {}) {
  if (!canvas) return;
  const { ctx, width, height } = syncCanvasSize(canvas);
  ctx.clearRect(0, 0, width, height);

  const padLeft = 58;
  const padRight = 18;
  const padTop = 28;
  const padBottom = 32;
  const plotW = Math.max(20, width - padLeft - padRight);
  const plotH = Math.max(20, height - padTop - padBottom);

  // Latar belakang area plot
  ctx.fillStyle = 'rgba(4, 12, 22, 0.72)';
  ctx.fillRect(0, 0, width, height);

  // Judul mini grafik
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(options.title || 'Grafik Konvergensi (Fitness Terbaik)', 14, 18);

  // Kumpulkan rentang data X dan Y
  let maxIter = Math.max(10, options.maxIterations || 20);
  let maxVal = 0;
  let minVal = Infinity;

  for (const s of seriesList) {
    for (const pt of s.data) {
      if (pt.iteration > maxIter) maxIter = pt.iteration;
      if (pt.bestFitness > maxVal) maxVal = pt.bestFitness;
      if (pt.bestFitness < minVal) minVal = pt.bestFitness;
    }
  }

  if (!Number.isFinite(minVal)) {
    minVal = 0;
    maxVal = 10;
  }
  const yFloor = options.zeroBaseline !== false ? 0 : Math.max(0, minVal * 0.9);
  const yCeil = maxVal <= yFloor + 1e-6 ? yFloor + 1 : maxVal * 1.08;

  // Grid horizontal (4 garis)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
  ctx.lineWidth = 1;
  ctx.font = '400 11px "Ubuntu Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';

  for (let i = 0; i <= 3; i++) {
    const ratio = i / 3;
    const py = padTop + plotH - ratio * plotH;
    const val = yFloor + ratio * (yCeil - yFloor);

    ctx.beginPath();
    ctx.moveTo(padLeft, py);
    ctx.lineTo(padLeft + plotW, py);
    ctx.stroke();

    const formatted = val >= 10 ? val.toFixed(1) : val >= 0.1 ? val.toFixed(2) : val.toExponential(1);
    ctx.fillText(formatted, padLeft - 6, py + 4);
  }

  // Label sumbu X
  ctx.textAlign = 'center';
  const xTicks = 4;
  for (let i = 0; i <= xTicks; i++) {
    const iterVal = Math.round((i / xTicks) * maxIter);
    const px = padLeft + (iterVal / maxIter) * plotW;
    ctx.fillText(`${iterVal}`, px, padTop + plotH + 18);
  }
  ctx.fillStyle = '#64748b';
  ctx.fillText('Iterasi', padLeft + plotW / 2, height - 3);

  // Gambar kurva tiap seri
  seriesList.forEach((s, sIdx) => {
    if (!s.data || s.data.length === 0) return;
    const color = s.color || '#34d399';

    const points = s.data.map((pt) => {
      const px = padLeft + (pt.iteration / maxIter) * plotW;
      const normY = (pt.bestFitness - yFloor) / Math.max(1e-9, yCeil - yFloor);
      const py = padTop + plotH - Math.max(0, Math.min(1, normY)) * plotH;
      return { px, py, val: pt.bestFitness };
    });

    // Area gradien tipis di bawah kurva bila hanya 1 seri
    if (seriesList.length === 1 && points.length > 1) {
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      grad.addColorStop(0, s.fillTop || 'rgba(16, 185, 129, 0.28)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      ctx.beginPath();
      ctx.moveTo(points[0].px, padTop + plotH);
      points.forEach((p) => ctx.lineTo(p.px, p.py));
      ctx.lineTo(points[points.length - 1].px, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Garis kurva utama
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Titik ujung terakhir
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.px, last.py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // Legenda kanan atas untuk multi-seri
    if (seriesList.length > 1) {
      const lx = width - padRight - (seriesList.length - 1 - sIdx) * 110 - 6;
      ctx.textAlign = 'right';
      ctx.font = '700 12px "Ubuntu Mono", monospace';
      ctx.fillStyle = color;
      const disp = last.val < 0.001 ? last.val.toExponential(1) : last.val.toFixed(3);
      ctx.fillText(`● ${s.label}: ${disp}`, lx, 18);
    }
  });

  ctx.textAlign = 'left';
}

