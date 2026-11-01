/**
 * Renderer Peta Kontur 2D Berperforma Tinggi (Offscreen Bitmap Cache)
 * Mendukung palet 'pond' (SFLA), 'water' (WCA), dan 'terrain' (Umum).
 * Skala piksel seragam (uniform scale) agar jarak Euclidean seperti radius dmax tetap bulat sempurna.
 */

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

const PALETTES = {
  // Kolam teratai: cekungan terdalam zamrud gelap bercahaya -> tepi kolam lumut hangat
  pond: [
    [3, 46, 42],
    [6, 78, 64],
    [13, 108, 92],
    [17, 75, 68],
    [25, 58, 48],
    [44, 66, 38]
  ],
  // Siklus air: palung laut biru safir -> lereng sian -> punggung pegunungan batu-salju
  water: [
    [3, 35, 68],
    [7, 74, 122],
    [14, 105, 142],
    [22, 68, 98],
    [38, 62, 86],
    [76, 98, 122]
  ],
  // Peta topografi umum untuk pengantar optimasi
  terrain: [
    [6, 38, 68],
    [12, 92, 132],
    [16, 142, 118],
    [74, 152, 76],
    [168, 142, 48],
    [198, 98, 56]
  ]
};

export function createViewport(width, height, objective, paddingRatio = 0.08) {
  const domainSpan = objective.max - objective.min;
  const usable = Math.min(width, height) * (1 - paddingRatio * 2);
  const scale = Math.max(1, usable / domainSpan); // piksel per 1 satuan koordinat
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

  renderBackground(ctx, width, height, objective, paletteName = 'terrain', options = {}) {
    if (width <= 2 || height <= 2) return null;
    const vp = createViewport(width, height, objective, options.paddingRatio ?? 0.07);
    const key = `${width}x${height}:${objective.id}:${paletteName}`;

    if (this.cacheKey !== key || !this.offscreen) {
      this.cacheKey = key;
      this.offscreen = this.buildOffscreen(width, height, objective, paletteName, vp);
    }

    ctx.drawImage(this.offscreen, 0, 0, width, height);

    // Gambar batas domain pencarian yang halus
    const topLeft = vp.worldToScreen(objective.min, objective.max);
    const botRight = vp.worldToScreen(objective.max, objective.min);
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.lineWidth = 1.25;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(
      topLeft.x,
      topLeft.y,
      botRight.x - topLeft.x,
      botRight.y - topLeft.y
    );
    ctx.setLineDash([]);

    // Garis sumbu tipis melalui (0,0)
    const origin = vp.worldToScreen(0, 0);
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, origin.y);
    ctx.lineTo(botRight.x, origin.y);
    ctx.moveTo(origin.x, topLeft.y);
    ctx.lineTo(origin.x, botRight.y);
    ctx.stroke();

    // Tampilkan penanda global optimum jika diaktifkan (PRD Bagian 10)
    if (options.showOptimum !== false) {
      const optPos = vp.worldToScreen(objective.optimum.x, objective.optimum.y);
      this.drawOptimumStar(ctx, optPos.x, optPos.y);
    }
    ctx.restore();

    return vp;
  }

  buildOffscreen(width, height, objective, paletteName, vp) {
    // Render pada resolusi 1/2 untuk kecepatan pembentukan awal (< 8ms), lalu haluskan
    const scaleDown = 2;
    const rw = Math.max(2, Math.ceil(width / scaleDown));
    const rh = Math.max(2, Math.ceil(height / scaleDown));

    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = rw;
    smallCanvas.height = rh;
    const sctx = smallCanvas.getContext('2d');
    const img = sctx.createImageData(rw, rh);
    const data = img.data;

    const stops = PALETTES[paletteName] || PALETTES.terrain;
    const normField = new Float32Array(rw * rh);
    const maxVal = objective.maxVisualValue || 50;

    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        const world = vp.screenToWorld((px + 0.5) * scaleDown, (py + 0.5) * scaleDown);
        const raw = objective.evaluate(world.x, world.y);
        // Kurva gamma lembut agar lembah dekat 0 terlihat jelas konturnya
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

        // Deteksi garis kontur (isoline) antar piksel tetangga
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
          data[p] = Math.min(255, rgb[0] + 34);
          data[p + 1] = Math.min(255, rgb[1] + 42);
          data[p + 2] = Math.min(255, rgb[2] + 44);
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

    // Vignette halus di tepi kanvas agar fokus mata ke tengah peta
    const grad = fctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.32,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(3, 9, 17, 0.48)');
    fctx.fillStyle = grad;
    fctx.fillRect(0, 0, width, height);

    return fullCanvas;
  }

  drawOptimumStar(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Lingkaran pendaran target global
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Bintang 5 sudut
    ctx.beginPath();
    const spikes = 5;
    const outerR = 10;
    const innerR = 4.5;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.8;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
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

