/**
 * Kumpulan gambar vektor Canvas 2D yang dipakai bersama oleh scene dan renderer simulasi:
 * katak, daun teratai, riak, tetesan, awan, bintang optimum, panah, dan label.
 */

export const COLORS = {
  ink: '#f2f7ff',
  muted: '#a9bbd6',
  night: '#03132b',
  navy: '#0b1b34',
  gold: '#fdbb16',
  tosca: '#12b0a2',
  toscaLight: '#5fe0d2',
  sky: '#26aee4',
  skyLight: '#9fdcf7',
  coral: '#f47d52',
  danger: '#ff6b70',
  blue: '#127bbe'
};

export const FONT_BODY = '"Inter", sans-serif';
export const FONT_MONO = '"JetBrains Mono", monospace';

export function drawText(ctx, text, x, y, options = {}) {
  const { size = 30, weight = 700, color = COLORS.ink, align = 'left', mono = false, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_BODY}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Label di dalam kapsul berwarna; (x, y) adalah titik tengah kapsul. */
export function drawPill(ctx, text, x, y, options = {}) {
  const { size = 28, weight = 700, color = COLORS.night, fill = COLORS.gold, alpha = 1, mono = false } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_BODY}`;
  const w = ctx.measureText(text).width + size * 1.2;
  const h = size * 1.75;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

export function fillBackground(ctx, width, height, stops) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  stops.forEach((color, i) => grad.addColorStop(i / Math.max(1, stops.length - 1), color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

export function drawGlow(ctx, x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCrown(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(-size * 1.1, -size * 1.05);
  ctx.lineTo(-size * 0.42, -size * 0.5);
  ctx.lineTo(0, -size * 1.3);
  ctx.lineTo(size * 0.42, -size * 0.5);
  ctx.lineTo(size * 1.1, -size * 1.05);
  ctx.lineTo(size, 0);
  ctx.closePath();
  ctx.fillStyle = COLORS.gold;
  ctx.strokeStyle = COLORS.night;
  ctx.lineWidth = Math.max(1, size * 0.2);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Katak tampak atas. `size` kira-kira setengah lebar badan, `angle` 0 berarti menghadap ke atas,
 * dan `lift` mengangkat katak dari bayangannya saat melompat.
 */
export function drawFrog(ctx, x, y, size, color, options = {}) {
  const { angle = 0, lift = 0, crown = false, alpha = 1, outline = '#04201f', ring = null } = options;
  const airborne = lift > 0.5;
  const legReach = airborne ? 0.62 : 0;

  ctx.save();
  ctx.globalAlpha *= alpha;

  if (airborne) {
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.3, size * 0.95, size * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 12, 28, 0.38)';
    ctx.fill();
  }

  ctx.translate(x, y - lift);

  if (ring) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.75, 0, Math.PI * 2);
    ctx.strokeStyle = ring;
    ctx.lineWidth = Math.max(2, size * 0.2);
    ctx.stroke();
  }

  ctx.save();
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const limbPaths = [
    // Kaki belakang menekuk saat diam dan terentang saat melompat
    [[-0.5, 0.4], [-1.22, 0.42 + legReach * 0.5], [-0.72, 1.02 + legReach]],
    [[0.5, 0.4], [1.22, 0.42 + legReach * 0.5], [0.72, 1.02 + legReach]],
    // Kaki depan
    [[-0.48, -0.32], [-0.94, -0.5], [-0.9, -0.92 - legReach * 0.4]],
    [[0.48, -0.32], [0.94, -0.5], [0.9, -0.92 - legReach * 0.4]]
  ];
  for (const [strokeColor, widthFactor] of [[outline, 0.42], [color, 0.24]]) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size * widthFactor;
    for (const [a, b, c] of limbPaths) {
      ctx.beginPath();
      ctx.moveTo(a[0] * size, a[1] * size);
      ctx.quadraticCurveTo(b[0] * size, b[1] * size, c[0] * size, c[1] * size);
      ctx.stroke();
    }
  }

  ctx.beginPath();
  ctx.ellipse(0, size * 0.06, size * 0.76, size * 0.92, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(1, size * 0.12);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, size * 0.22, size * 0.38, size * 0.48, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fill();

  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(dir * size * 0.42, -size * 0.66, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = outline;
    ctx.lineWidth = Math.max(1, size * 0.09);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(dir * size * 0.42, -size * 0.72, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.night;
    ctx.fill();
  }
  ctx.restore();

  if (crown) drawCrown(ctx, 0, -size * 1.12, size * 0.56);
  ctx.restore();
}

export function drawLilyPad(ctx, x, y, radius, rotation = 0, options = {}) {
  const { fill = '#1c8f6d', edge = '#3fc493', flower = false, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(1, 0.84);
  ctx.rotate(rotation);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, 0.24, Math.PI * 2 - 0.24);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1.5, radius * 0.035);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(190, 255, 225, 0.2)';
  ctx.lineWidth = Math.max(1, radius * 0.02);
  for (let i = 1; i <= 6; i++) {
    const a = 0.24 + (i / 7) * (Math.PI * 2 - 0.48);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9);
    ctx.stroke();
  }

  if (flower) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * radius * 0.16 - radius * 0.3,
        Math.sin(a) * radius * 0.16,
        radius * 0.16,
        radius * 0.08,
        a,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#ffd1e4';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(-radius * 0.3, 0, radius * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
  }
  ctx.restore();
}

/** Riak air; `progress` 0..1 membesar sambil memudar. */
export function drawRipple(ctx, x, y, progress, color = '#bff5ea', maxRadius = 60) {
  if (progress <= 0 || progress >= 1) return;
  ctx.save();
  ctx.strokeStyle = color;
  for (const delay of [0, 0.22]) {
    const p = (progress - delay) / (1 - delay);
    if (p <= 0) continue;
    ctx.globalAlpha = (1 - p) * 0.85;
    ctx.lineWidth = Math.max(1.2, maxRadius * 0.05 * (1 - p));
    ctx.beginPath();
    ctx.ellipse(x, y, maxRadius * p, maxRadius * p * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Tetesan air; `angle` adalah arah gerak dan ujung lancipnya berada di belakang gerakan. */
export function drawDrop(ctx, x, y, size, color = COLORS.skyLight, options = {}) {
  const { angle = Math.PI / 2, outline = '#04213f', alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-size * 1.7, 0);
  ctx.bezierCurveTo(-size * 0.7, -size * 0.28, -size * 0.3, -size * 0.92, size * 0.25, -size * 0.92);
  ctx.bezierCurveTo(size * 0.86, -size * 0.92, size, -size * 0.34, size, 0);
  ctx.bezierCurveTo(size, size * 0.34, size * 0.86, size * 0.92, size * 0.25, size * 0.92);
  ctx.bezierCurveTo(-size * 0.3, size * 0.92, -size * 0.7, size * 0.28, -size * 1.7, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(1, size * 0.14);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.3, -size * 0.32, size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fill();
  ctx.restore();
}

export function drawCloud(ctx, x, y, size, color = '#dbe9f8', alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.fillStyle = color;
  const lobes = [
    [-1.05, 0.14, 0.55],
    [-0.42, -0.26, 0.74],
    [0.36, -0.14, 0.64],
    [1.02, 0.16, 0.5]
  ];
  ctx.beginPath();
  for (const [lx, ly, lr] of lobes) {
    ctx.moveTo(lx * size + lr * size, ly * size);
    ctx.arc(lx * size, ly * size, lr * size, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-1.55 * size, 0.06 * size, 3.1 * size, 0.62 * size, 0.3 * size);
  ctx.fill();
  ctx.restore();
}

export function drawStar(ctx, x, y, size, options = {}) {
  const { glow = true, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow) drawGlow(ctx, x, y, size * 2.8, 'rgba(253, 187, 22, 0.62)');
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size * 0.44;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.gold;
  ctx.strokeStyle = COLORS.night;
  ctx.lineWidth = Math.max(1, size * 0.14);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Titik pada kurva kuadratik dari `from` ke `to` dengan lengkungan `bend` ke atas. */
export function arcPoint(from, to, bend, p) {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 - bend;
  const q = 1 - p;
  return {
    x: q * q * from.x + 2 * q * p * cx + p * p * to.x,
    y: q * q * from.y + 2 * q * p * cy + p * p * to.y
  };
}

/** Panah melengkung yang tergambar bertahap sesuai `progress`. */
export function drawArrow(ctx, from, to, options = {}) {
  const { bend = 0, color = COLORS.ink, width = 4, progress = 1, dashed = false, alpha = 1, head = true } = options;
  if (progress <= 0) return;
  const tip = arcPoint(from, to, bend, progress);
  const before = arcPoint(from, to, bend, Math.max(0, progress - 0.03));
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([width * 3, width * 2.4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  const steps = Math.max(2, Math.ceil(progress * 28));
  for (let i = 1; i <= steps; i++) {
    const pt = arcPoint(from, to, bend, (i / steps) * progress);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  if (head) {
    const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
    const len = width * 4;
    ctx.beginPath();
    ctx.moveTo(tip.x + Math.cos(angle) * len * 0.3, tip.y + Math.sin(angle) * len * 0.3);
    ctx.lineTo(tip.x - Math.cos(angle - 0.5) * len, tip.y - Math.sin(angle - 0.5) * len);
    ctx.lineTo(tip.x - Math.cos(angle + 0.5) * len, tip.y - Math.sin(angle + 0.5) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawCross(ctx, x, y, size, color = COLORS.danger, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.32);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
  ctx.restore();
}
