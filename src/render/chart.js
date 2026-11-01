/**
 * Grafik Konvergensi Fitness Terbaik per Iterasi
 * Mengikuti aturan visual flat data-terminal ITS: latar datar #000E25, 4 garis grid tipis #243F81,
 * segmen garis lurus tegas, dan warna seri resmi ITS (#12B0A2 SFLA, #26AEE4 WCA, #FDBB16 Laut/Optimum).
 */

import { syncCanvasSize } from './contourRenderer.js';

export function renderConvergenceChart(canvas, seriesList, options = {}) {
  if (!canvas) return;
  const { ctx, width, height } = syncCanvasSize(canvas);
  ctx.clearRect(0, 0, width, height);

  const padLeft = 58;
  const padRight = 18;
  const padTop = 30;
  const padBottom = 30;
  const plotW = Math.max(20, width - padLeft - padRight);
  const plotH = Math.max(20, height - padTop - padBottom);

  // Latar belakang datar kontainer grafik (surface-container-lowest ITS)
  ctx.fillStyle = '#041126';
  ctx.fillRect(0, 0, width, height);

  // Judul grafik di kiri atas
  ctx.font = '700 12.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#d6e3ff';
  ctx.textAlign = 'left';
  ctx.fillText(options.title || 'Kurva Konvergensi Fitness', 14, 19);

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

  // Empat garis grid horizontal (Biru Cover ITS #243F81 dengan opasitas tenang)
  ctx.strokeStyle = 'rgba(36, 63, 129, 0.48)';
  ctx.lineWidth = 1;
  ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#8a99b2';
  ctx.textAlign = 'right';

  for (let i = 0; i <= 3; i++) {
    const ratio = i / 3;
    const py = padTop + plotH - ratio * plotH;
    const val = yFloor + ratio * (yCeil - yFloor);

    ctx.beginPath();
    ctx.moveTo(padLeft, py);
    ctx.lineTo(padLeft + plotW, py);
    ctx.stroke();

    const formatted =
      val >= 10 ? val.toFixed(1) : val >= 0.1 ? val.toFixed(2) : val === 0 ? '0' : val.toExponential(1);
    ctx.fillText(formatted, padLeft - 7, py + 3.5);
  }

  // Label sumbu X
  ctx.textAlign = 'center';
  const xTicks = 4;
  for (let i = 0; i <= xTicks; i++) {
    const iterVal = Math.round((i / xTicks) * maxIter);
    const px = padLeft + (iterVal / maxIter) * plotW;
    ctx.fillText(`${iterVal}`, px, padTop + plotH + 17);
  }
  ctx.fillStyle = '#8a99b2';
  ctx.fillText(options.xLabel || 'Iterasi', padLeft + plotW / 2, height - 3);

  // Gambar seri data
  seriesList.forEach((s, sIdx) => {
    if (!s.data || s.data.length === 0) return;
    const color = s.color || '#12b0a2';

    const points = s.data.map((pt) => {
      const px = padLeft + (pt.iteration / maxIter) * plotW;
      const normY = (pt.bestFitness - yFloor) / Math.max(1e-9, yCeil - yFloor);
      const py = padTop + plotH - Math.max(0, Math.min(1, normY)) * plotH;
      return { px, py, val: pt.bestFitness };
    });

    // Isian datar 14% opasitas untuk grafik seri tunggal (sesuai app-screens.md)
    if (seriesList.length === 1 && points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].px, padTop + plotH);
      points.forEach((p) => ctx.lineTo(p.px, p.py));
      ctx.lineTo(points[points.length - 1].px, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = s.fillFlat || 'rgba(18, 176, 162, 0.14)';
      ctx.fill();
    }

    // Garis lurus antar titik iterasi
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Titik nilai terkini di ujung kurva
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.px, last.py, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#041126';
    ctx.lineWidth = 1.6;
    ctx.fill();
    ctx.stroke();

    // Legenda kanan atas untuk perbandingan multi-seri
    if (seriesList.length > 1) {
      const slotW = 118;
      const rightEdge = width - padRight - (seriesList.length - 1 - sIdx) * slotW;
      const disp = last.val < 0.001 && last.val > 0 ? last.val.toExponential(1) : last.val.toFixed(3);
      const labelStr = `${s.label}: ${disp}`;

      ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(labelStr, rightEdge, 19);

      const textW = ctx.measureText(labelStr).width;
      ctx.beginPath();
      ctx.arc(rightEdge - textW - 7, 15, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  });

  ctx.textAlign = 'left';
}
