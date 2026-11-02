/**
 * Panggung animasi scene presentasi.
 * Scene digambar dalam koordinat tetap 1920x1080 (sama dengan ukuran deck) sehingga tata letak
 * kanvas dan teks DOM selalu sejajar di resolusi apa pun.
 */

export const DECK_W = 1920;
export const DECK_H = 1080;

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

/** Kemajuan 0..1 (dengan easing) dari sebuah segmen waktu pada garis waktu animasi. */
export function seg(time, start, duration, ease = easeInOut) {
  return ease(clamp01((time - start) / Math.max(1e-6, duration)));
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {(ctx: CanvasRenderingContext2D, frame: {t:number, bt:number, beat:number, dt:number}) => void} draw
 *   t = detik sejak scene dibuka, bt = detik sejak beat aktif dimulai, dt = selisih antar-frame.
 * @param {{reducedMotion?: boolean, width?: number, height?: number}} [options]
 */
export function createStage(canvas, draw, { reducedMotion = false, width = DECK_W, height = DECK_H } = {}) {
  let rafId = null;
  let startTime = null;
  let beatStart = null;
  let lastTime = null;
  let beat = 0;

  function frame(now) {
    if (startTime === null) startTime = now;
    if (beatStart === null) beatStart = now;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bufferW = Math.max(10, Math.floor(rect.width * dpr));
    const bufferH = Math.max(10, Math.floor(rect.height * dpr));
    if (canvas.width !== bufferW || canvas.height !== bufferH) {
      canvas.width = bufferW;
      canvas.height = bufferH;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(bufferW / width, 0, 0, bufferH / height, 0, 0);

    const dt = lastTime === null ? 0 : Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // prefers-reduced-motion: gerakan dibekukan dan tiap beat langsung tampil pada kondisi akhirnya
    draw(ctx, {
      t: reducedMotion ? 0 : (now - startTime) / 1000,
      bt: reducedMotion ? 60 : (now - beatStart) / 1000,
      beat,
      dt
    });

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  return {
    setBeat(next) {
      beat = next;
      beatStart = null;
    },
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
