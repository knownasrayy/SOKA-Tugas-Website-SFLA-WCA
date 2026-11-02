/**
 * Grafik Konvergensi Fitness Terbaik per Iterasi
 * Ukuran huruf dan garis mengikuti ukuran kanvas agar tetap terbaca dari jarak jauh saat diproyeksikan.
 */

import { syncCanvasSize } from './contourRenderer.js';

function formatTick(val) {
  if (val === 0) return '0';
  if (val >= 10) return val.toFixed(0);
  if (val >= 0.1) return val.toFixed(1);
  return val.toExponential(0);
}

export function renderConvergenceChart(canvas, seriesList, options = {}) {
  if (!canvas) return;
  const { ctx, width, height } = syncCanvasSize(canvas);
  ctx.clearRect(0, 0, width, height);

  const u = Math.max(0.55, Math.min(1.5, Math.min(width / 610, height / 220)));
  const padLeft = 62 * u;
  const padRight = 22 * u;
  const padTop = 18 * u;
  const padBottom = 34 * u;
  const plotW = Math.max(20, width - padLeft - padRight);
  const plotH = Math.max(20, height - padTop - padBottom);

  let maxIter = Math.max(10, options.maxIterations || 20);
  let maxVal = 0;
  for (const s of seriesList) {
    for (const pt of s.data) {
      if (pt.iteration > maxIter) maxIter = pt.iteration;
      if (pt.bestFitness > maxVal) maxVal = pt.bestFitness;
    }
  }
  const yCeil = maxVal <= 1e-6 ? 1 : maxVal * 1.08;

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(169, 187, 214, 0.2)';
  ctx.font = `600 ${16 * u}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#a9bbd6';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 2; i++) {
    const ratio = i / 2;
    const py = padTop + plotH - ratio * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, py);
    ctx.lineTo(padLeft + plotW, py);
    ctx.stroke();
    ctx.fillText(formatTick(ratio * yCeil), padLeft - 10 * u, py);
  }

  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const iterVal = Math.round((i / 4) * maxIter);
    ctx.fillText(`${iterVal}`, padLeft + (iterVal / maxIter) * plotW, padTop + plotH + 19 * u);
  }

  for (const s of seriesList) {
    if (!s.data || s.data.length === 0) continue;
    const color = s.color || '#12b0a2';
    const points = s.data.map((pt) => ({
      px: padLeft + (pt.iteration / maxIter) * plotW,
      py: padTop + plotH - Math.max(0, Math.min(1, pt.bestFitness / yCeil)) * plotH
    }));

    if (seriesList.length === 1 && points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].px, padTop + plotH);
      points.forEach((p) => ctx.lineTo(p.px, p.py));
      ctx.lineTo(points[points.length - 1].px, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = s.fillFlat || 'rgba(18, 176, 162, 0.16)';
      ctx.fill();
    }

    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.4 * u;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.px, last.py, 6 * u, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
