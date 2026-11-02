/**
 * Renderer Peta Kontur 2D Berperforma Tinggi (Offscreen Bitmap Cache)
 * Dikalibrasi dengan Palet Identitas Resmi ITS (Biru ITS, Medical Tosca FKK, Summer Sky FTK, Kuning Tua ITS).
 * Skala piksel seragam (uniform scale) agar jarak Euclidean seperti radius dmax tetap bulat sempurna.
 */

import { drawStar } from './sprites.js';

function lerpColor(stops, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (stops.length - 1);
  const idx = Math.min(stops.length - 2, Math.floor(scaled));
  const frac = scaled - idx;
  const c0 = stops[idx];
  const c1 = stops[idx + 1];
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * frac),
    Math.round(c0[1] + (c1[1] - c0[1]) * frac),
    Math.round(c0[2] + (c1[2] - c0[2]) * frac)
  ];
}

// Lembah (biaya rendah) dibuat paling terang dan puncak paling gelap, sehingga mata penonton langsung tertuju ke target
const PALETTES = {
  // Kolam teratai SFLA: cekungan Medical Tosca FKK (#12B0A2) memudar ke Navy ITS (#03132B)
  pond: [
    [44, 190, 170],
    [18, 136, 128],
    [10, 92, 98],
    [7, 62, 76],
    [5, 40, 60],
    [3, 24, 46]
  ],
  // Siklus air WCA: cekungan Summer Sky FTK (#26AEE4) memudar ke Biru Lambang lalu Navy ITS
  water: [
    [70, 186, 236],
    [24, 128, 196],
    [14, 90, 156],
    [9, 62, 118],
    [5, 40, 84],
    [3, 22, 52]
  ]
};

export function createViewport(width, height, objective, paddingRatio = 0.08) {
  const domainSpan = objective.max - objective.min;
  const usable = Math.min(width, height) * (1 - paddingRatio * 2);
  const scale = Math.max(1, usable / domainSpan);
  const cx = width / 2;
  const cy = height / 2;
  const mid = (objective.min + objective.max) / 2;

  return {
    width,
    height,
    scale,
    min: objective.min,
    max: objective.max,
    worldToScreen(wx, wy) {
      return {
        x: cx + (wx - mid) * scale,
        y: cy - (wy - mid) * scale
      };
    },
    screenToWorld(px, py) {
      return {
        x: mid + (px - cx) / scale,
        y: mid - (py - cy) / scale
      };
    },
    worldDistToPx(dist) {
      return dist * scale;
    }
  };
}

export class ContourMapCache {
  constructor() {
    this.cacheKey = '';
    this.offscreen = null;
  }

  renderBackground(ctx, width, height, objective, paletteName = 'pond', options = {}) {
    if (width <= 2 || height <= 2) return null;
    const vp = createViewport(width, height, objective, options.paddingRatio ?? 0.07);
    const key = `${width}x${height}:${objective.id}:${paletteName}`;

    if (this.cacheKey !== key || !this.offscreen) {
      this.cacheKey = key;
      this.offscreen = this.buildOffscreen(width, height, objective, paletteName, vp);
    }

    ctx.drawImage(this.offscreen, 0, 0, width, height);

    // Batas domain pencarian teknis (Biru Muda Lambang ITS #75BDE0)
    const topLeft = vp.worldToScreen(objective.min, objective.max);
    const botRight = vp.worldToScreen(objective.max, objective.min);
    ctx.save();
    ctx.strokeStyle = 'rgba(117, 189, 224, 0.26)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      topLeft.x,
      topLeft.y,
      botRight.x - topLeft.x,
      botRight.y - topLeft.y
    );
    ctx.setLineDash([]);

    // Penanda Global Optimum (Kuning Tua Logo ITS #FDBB16)
    if (options.showOptimum !== false) {
      const optPos = vp.worldToScreen(objective.optimum.x, objective.optimum.y);
      drawStar(ctx, optPos.x, optPos.y, Math.max(9, Math.min(width, height) * 0.021));
    }
    ctx.restore();

    return vp;
  }

  buildOffscreen(width, height, objective, paletteName, vp) {
    const scaleDown = 2;
    const rw = Math.max(2, Math.ceil(width / scaleDown));
    const rh = Math.max(2, Math.ceil(height / scaleDown));

    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = rw;
    smallCanvas.height = rh;
    const sctx = smallCanvas.getContext('2d');
    const img = sctx.createImageData(rw, rh);
    const data = img.data;

    const stops = PALETTES[paletteName] || PALETTES.pond;
    const normField = new Float32Array(rw * rh);
    const maxVal = objective.maxVisualValue || 50;

    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        const world = vp.screenToWorld((px + 0.5) * scaleDown, (py + 0.5) * scaleDown);
        const raw = objective.evaluate(world.x, world.y);
        const norm = Math.pow(Math.min(1, Math.max(0, raw / maxVal)), 0.58);
        normField[py * rw + px] = norm;
      }
    }

    const numBands = 14;
    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        const idx = py * rw + px;
        const n = normField[idx];
        const rgb = lerpColor(stops, n);

        let isContour = false;
        if (px > 0 && py > 0) {
          const bCurr = Math.floor(n * numBands);
          const bLeft = Math.floor(normField[idx - 1] * numBands);
          const bTop = Math.floor(normField[idx - rw] * numBands);
          if (bCurr !== bLeft || bCurr !== bTop) {
            isContour = true;
          }
        }

        const p = idx * 4;
        if (isContour) {
          data[p] = Math.min(255, rgb[0] + 30);
          data[p + 1] = Math.min(255, rgb[1] + 42);
          data[p + 2] = Math.min(255, rgb[2] + 54);
          data[p + 3] = 255;
        } else {
          data[p] = rgb[0];
          data[p + 1] = rgb[1];
          data[p + 2] = rgb[2];
          data[p + 3] = 255;
        }
      }
    }

    sctx.putImageData(img, 0, 0);

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = width;
    fullCanvas.height = height;
    const fctx = fullCanvas.getContext('2d');
    fctx.imageSmoothingEnabled = true;
    fctx.imageSmoothingQuality = 'high';
    fctx.drawImage(smallCanvas, 0, 0, rw, rh, 0, 0, width, height);

    const grad = fctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.34,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.74
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(3, 19, 43, 0.52)');
    fctx.fillStyle = grad;
    fctx.fillRect(0, 0, width, height);

    return fullCanvas;
  }
}

export function syncCanvasSize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(10, Math.floor(rect.width));
  const h = Math.max(10, Math.floor(rect.height));
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: w, height: h };
}
