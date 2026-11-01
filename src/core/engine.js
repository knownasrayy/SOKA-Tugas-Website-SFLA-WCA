/**
 * Mesin Loop Animasi Presentasi (PRD Bagian 12 & 13)
 * Memisahkan detak logika algoritma (play/pause/step) dari loop rendering 60 FPS (requestAnimationFrame)
 * dengan interpolasi posisi halus antar langkah diskrit.
 */

export class SimulationRunner {
  /**
   * @param {Object} options
   * @param {Function} options.onStep - Dipanggil saat 1 langkah algoritma dieksekusi; mengembalikan apakah sudah selesai ('DONE')
   * @param {Function} options.onRender - Dipanggil setiap frame animasi dengan (alpha, timestamp)
   * @param {number} [options.stepsPerSecond=2.5] - Kecepatan langkah saat mode Play
   * @param {boolean} [options.reducedMotion=false]
   */
  constructor({ onStep, onRender, stepsPerSecond = 2.5, reducedMotion = false }) {
    this.onStep = onStep;
    this.onRender = onRender;
    this.stepsPerSecond = stepsPerSecond;
    this.reducedMotion = reducedMotion;

    this.playing = false;
    this.rafId = null;
    this.lastStepTime = 0;
    this.transitionStart = 0;
    this.transitionDuration = this.computeTransitionMs(stepsPerSecond);
    this.onPlayStateChange = null;
  }

  computeTransitionMs(sps) {
    if (this.reducedMotion) return 1;
    const interval = 1000 / Math.max(0.25, sps);
    return Math.min(520, Math.max(60, interval * 0.78));
  }

  setSpeed(stepsPerSecond) {
    this.stepsPerSecond = Math.max(0.3, Math.min(30, Number(stepsPerSecond) || 2.5));
    this.transitionDuration = this.computeTransitionMs(this.stepsPerSecond);
  }

  startLoop() {
    if (this.rafId) return;
    const loop = (now) => {
      if (this.playing) {
        const intervalMs = 1000 / this.stepsPerSecond;
        if (now - this.lastStepTime >= intervalMs) {
          this.lastStepTime = now;
          this.transitionStart = now;
          const done = this.onStep();
          if (done) {
            this.pause();
          }
        }
      }

      const rawAlpha =
        this.transitionDuration <= 2
          ? 1
          : Math.min(1, Math.max(0, (now - this.transitionStart) / this.transitionDuration));
      // Cubic ease-out agar lompatan katak & aliran air mendarat mulus
      const easedAlpha = 1 - Math.pow(1 - rawAlpha, 3);

      this.onRender(easedAlpha, now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.lastStepTime = 0;
    this.onPlayStateChange?.(true);
    this.startLoop();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.onPlayStateChange?.(false);
  }

  togglePlay() {
    if (this.playing) this.pause();
    else this.play();
  }

  stepOnce() {
    this.pause();
    const now = performance.now();
    this.transitionStart = now;
    this.transitionDuration = this.reducedMotion ? 1 : 420;
    this.onStep();
    this.startLoop();
  }

  notifyReset() {
    this.pause();
    this.transitionStart = performance.now();
    this.transitionDuration = 1;
    this.startLoop();
  }

  destroy() {
    this.playing = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

