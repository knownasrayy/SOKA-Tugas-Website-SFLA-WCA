/**
 * Shuffled Frog-Leaping Algorithm (SFLA) — Mesin Status Murni (Tanpa DOM)
 * Referensi: Eusuff, M. M., & Lansey, K. E. (2003).
 *
 * Urutan event tahap (Acceptance Criterion #2):
 *   INIT -> SORT -> PARTITION -> LOCAL_JUMP (x N) -> SHUFFLE -> PARTITION -> ... -> DONE
 */

import { createRng } from '../core/rng.js';
import { clampCoord } from '../core/objectives.js';

export class SFLAEngine {
  /**
   * @param {Object} config
   * @param {Object} config.objective - Objek fungsi objektif { evaluate(x,y), min, max }
   * @param {number} [config.populationSize=24] - Jumlah katak total (F)
   * @param {number} [config.memeplexCount=4] - Jumlah memeplex (m)
   * @param {number} [config.localIterations=3] - Iterasi evolusi lokal per memeplex (N)
   * @param {number} [config.maxStep=3.2] - Langkah lompatan maksimum (Dmax)
   * @param {number} [config.maxIterations=40] - Maksimum siklus global (shuffle)
   * @param {number|string} [config.seed=42] - Seed PRNG
   * @param {Array<{x:number, y:number}>} [config.initialPositions] - Opsional posisi awal bersama
   */
  constructor(config) {
    this.configure(config);
  }

  configure(config = {}) {
    this.objective = config.objective;
    this.memeplexCount = Math.max(2, Math.min(8, Math.round(config.memeplexCount ?? 4)));
    const rawF = Math.max(this.memeplexCount * 2, Math.min(100, Math.round(config.populationSize ?? 24)));
    this.populationSize = rawF;
    this.localIterations = Math.max(1, Math.min(15, Math.round(config.localIterations ?? 3)));
    this.maxStep = Math.max(0.2, Number(config.maxStep ?? 3.2));
    this.maxIterations = Math.max(5, Math.round(config.maxIterations ?? 40));
    this.seed = config.seed ?? 42;
    this.initialPositions = config.initialPositions || null;
    this.reset();
  }

  reset() {
    this.rng = createRng(this.seed);
    const { min, max } = this.objective;

    this.frogs = Array.from({ length: this.populationSize }, (_, i) => {
      const preset = this.initialPositions && this.initialPositions[i];
      const x = preset ? clampCoord(preset.x, min, max) : this.rng.range(min, max);
      const y = preset ? clampCoord(preset.y, min, max) : this.rng.range(min, max);
      const fitness = this.objective.evaluate(x, y);
      return {
        id: i + 1,
        x,
        y,
        prevX: x,
        prevY: y,
        fitness,
        rank: -1,
        memeplex: -1,
        role: 'member',
        lastJumpType: null,
        trail: [{ x, y }]
      };
    });

    this.iteration = 0;
    this.localStep = 0;
    this.jumps = [];
    this.bestFrog = this.computeBestSnapshot();
    this.history = [
      {
        iteration: 0,
        bestFitness: this.bestFrog.fitness,
        meanFitness: this.computeMeanFitness()
      }
    ];

    this.phase = 'INIT';
    this.phaseLabel = 'Inisialisasi Kolam';
    this.phaseDetail = `Menyebar ${this.populationSize} katak secara acak di atas permukaan kolam.`;
    return this.getState();
  }

  computeBestSnapshot() {
    let best = this.frogs[0];
    for (const f of this.frogs) {
      if (f.fitness < best.fitness) best = f;
    }
    if (this.bestFrog && this.bestFrog.fitness < best.fitness) {
      return { ...this.bestFrog };
    }
    return { id: best.id, x: best.x, y: best.y, fitness: best.fitness };
  }

  computeMeanFitness() {
    let sum = 0;
    for (const f of this.frogs) sum += f.fitness;
    return sum / Math.max(1, this.frogs.length);
  }

  syncPreviousPositions() {
    for (const f of this.frogs) {
      f.prevX = f.x;
      f.prevY = f.y;
    }
  }

  sortPopulation() {
    const ordered = [...this.frogs].sort((a, b) => a.fitness - b.fitness);
    ordered.forEach((frog, idx) => {
      frog.rank = idx;
      frog.role = idx === 0 ? 'global_best' : 'member';
    });
    const top = ordered[0];
    if (!this.bestFrog || top.fitness <= this.bestFrog.fitness) {
      this.bestFrog = { id: top.id, x: top.x, y: top.y, fitness: top.fitness };
    }
    return ordered;
  }

  updateRolesWithinMemeplexes() {
    // Tandai Xb (terbaik kelompok), Xw (terburuk kelompok), dan Xg (terbaik global)
    let globalBestFrog = this.frogs[0];
    for (const f of this.frogs) {
      f.role = 'member';
      if (f.fitness < globalBestFrog.fitness) globalBestFrog = f;
    }

    for (let k = 0; k < this.memeplexCount; k++) {
      const group = this.frogs
        .filter((f) => f.memeplex === k)
        .sort((a, b) => a.fitness - b.fitness);
      if (group.length >= 1) group[0].role = 'memeplex_best';
      if (group.length >= 2) group[group.length - 1].role = 'memeplex_worst';
    }
    globalBestFrog.role = 'global_best';

    if (globalBestFrog.fitness <= this.bestFrog.fitness) {
      this.bestFrog = {
        id: globalBestFrog.id,
        x: globalBestFrog.x,
        y: globalBestFrog.y,
        fitness: globalBestFrog.fitness
      };
    }
  }

  /**
   * Pemilihan submemeplex menggunakan distribusi peluang segitiga (Eusuff & Lansey, 2003):
   *   p_j = 2 * (n + 1 - j) / (n * (n + 1)), untuk j = 1..n (terurut terbaik -> terburuk).
   * Katak dengan fitness lebih baik berpeluang lebih besar terpilih ke submemeplex,
   * namun katak lemah tetap berpeluang masuk untuk diperbaiki posisinya.
   */
  selectSubmemeplex(sortedGroup) {
    const n = sortedGroup.length;
    if (n <= 6) return sortedGroup;

    const q = Math.max(4, Math.ceil(n * 0.65));
    const pool = sortedGroup.map((frog, idx) => ({
      frog,
      weight: (2 * (n - idx)) / (n * (n + 1))
    }));

    const chosen = [];
    for (let pick = 0; pick < q && pool.length > 0; pick++) {
      const totalW = pool.reduce((acc, item) => acc + item.weight, 0);
      let r = this.rng.next() * totalW;
      let selectedIdx = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        r -= pool[i].weight;
        if (r <= 0) {
          selectedIdx = i;
          break;
        }
      }
      chosen.push(pool[selectedIdx].frog);
      pool.splice(selectedIdx, 1);
    }

    return chosen.sort((a, b) => a.fitness - b.fitness);
  }

  /**
   * Menghitung posisi lompatan baru:
   *   X_baru = X_w + r * (X_target - X_w), dengan r acak [0, 1] dan ||langkah|| <= Dmax.
   * Asumsi standar literatur kontinu: r menggabungkan faktor langkah utama & variasi mikro 2D
   * yang keduanya berada di [0, 1] agar katak tidak kolinear kaku namun tetap mengarah jelas ke target.
   */
  computeLeapPosition(xw, target) {
    const { min, max } = this.objective;
    const rBase = this.rng.next();
    const rx = 0.75 * rBase + 0.25 * this.rng.next();
    const ry = 0.75 * rBase + 0.25 * this.rng.next();

    let dx = rx * (target.x - xw.x);
    let dy = ry * (target.y - xw.y);

    const stepLen = Math.hypot(dx, dy);
    if (stepLen > this.maxStep && stepLen > 1e-12) {
      const scale = this.maxStep / stepLen;
      dx *= scale;
      dy *= scale;
    }

    return {
      x: clampCoord(xw.x + dx, min, max),
      y: clampCoord(xw.y + dy, min, max)
    };
  }

  /**
   * Menjalankan tepat 1 event tahap SFLA.
   */
  step() {
    if (this.phase === 'DONE') {
      return this.getState();
    }

    this.syncPreviousPositions();
    this.jumps = [];

    // Tahap 1 -> 2: Evaluasi & urutkan peringkat dari terbaik ke terburuk
    if (this.phase === 'INIT') {
      this.sortPopulation();
      this.phase = 'SORT';
      this.phaseLabel = 'Evaluasi & Urutkan';
      this.phaseDetail = `Katak diurutkan #1 s.d. #${this.populationSize}; terbaik f = ${this.bestFrog.fitness.toFixed(4)}.`;
      return this.getState();
    }

    // Tahap 2/5 -> 3: Partisi bergilir (round-robin) ke m memeplex
    if (this.phase === 'SORT' || this.phase === 'SHUFFLE') {
      const ordered = this.sortPopulation();
      ordered.forEach((frog, rankIdx) => {
        frog.memeplex = rankIdx % this.memeplexCount;
        frog.lastJumpType = null;
      });
      this.localStep = 0;
      this.updateRolesWithinMemeplexes();
      this.phase = 'PARTITION';
      this.phaseLabel = 'Partisi Memeplex';
      this.phaseDetail = `Pembagian bergilir ke ${this.memeplexCount} memeplex (Katak #1→M1, #2→M2, dst.).`;
      return this.getState();
    }

    // Tahap 3 -> 4: Evolusi lokal sebanyak N langkah di tiap memeplex
    if (
      (this.phase === 'PARTITION' || this.phase === 'LOCAL_JUMP') &&
      this.localStep < this.localIterations
    ) {
      this.localStep += 1;
      let countXb = 0;
      let countXg = 0;
      let countRand = 0;

      // Simpan referensi terbaik global saat awal gelombang lokal
      const xgRef = { x: this.bestFrog.x, y: this.bestFrog.y, fitness: this.bestFrog.fitness };

      for (let k = 0; k < this.memeplexCount; k++) {
        const group = this.frogs
          .filter((f) => f.memeplex === k)
          .sort((a, b) => a.fitness - b.fitness);
        if (group.length < 2) continue;

        const sub = this.selectSubmemeplex(group);
        const xb = sub[0];
        const xw = sub[sub.length - 1];

        const fromX = xw.x;
        const fromY = xw.y;
        const oldFitness = xw.fitness;

        // Percobaan 1: Lompat ke arah terbaik submemeplex/memeplex (Xb)
        const tryXb = this.computeLeapPosition(xw, xb);
        const fitXb = this.objective.evaluate(tryXb.x, tryXb.y);

        if (fitXb < oldFitness) {
          xw.x = tryXb.x;
          xw.y = tryXb.y;
          xw.fitness = fitXb;
          xw.lastJumpType = 'XB_SUCCESS';
          countXb += 1;
          this.jumps.push({
            frogId: xw.id,
            memeplex: k,
            fromX,
            fromY,
            toX: xw.x,
            toY: xw.y,
            targetX: xb.x,
            targetY: xb.y,
            type: 'XB_SUCCESS',
            improved: true,
            triedXbFailed: false
          });
        } else {
          // Percobaan 2: Jika tidak membaik, lompat ke arah terbaik global (Xg)
          const tryXg = this.computeLeapPosition(xw, xgRef);
          const fitXg = this.objective.evaluate(tryXg.x, tryXg.y);

          if (fitXg < oldFitness) {
            xw.x = tryXg.x;
            xw.y = tryXg.y;
            xw.fitness = fitXg;
            xw.lastJumpType = 'XG_SUCCESS';
            countXg += 1;
            this.jumps.push({
              frogId: xw.id,
              memeplex: k,
              fromX,
              fromY,
              toX: xw.x,
              toY: xw.y,
              targetX: xgRef.x,
              targetY: xgRef.y,
              failedXbX: xb.x,
              failedXbY: xb.y,
              type: 'XG_SUCCESS',
              improved: true,
              triedXbFailed: true
            });
          } else {
            // Percobaan 3: Ganti dengan katak acak baru (sensor eksplorasi)
            const randX = this.rng.range(this.objective.min, this.objective.max);
            const randY = this.rng.range(this.objective.min, this.objective.max);
            xw.x = randX;
            xw.y = randY;
            xw.fitness = this.objective.evaluate(randX, randY);
            xw.lastJumpType = 'RANDOM_RESET';
            countRand += 1;
            this.jumps.push({
              frogId: xw.id,
              memeplex: k,
              fromX,
              fromY,
              toX: xw.x,
              toY: xw.y,
              targetX: xw.x,
              targetY: xw.y,
              type: 'RANDOM_RESET',
              improved: xw.fitness < oldFitness,
              triedXbFailed: true
            });
          }
        }

        xw.trail.push({ x: xw.x, y: xw.y });
        if (xw.trail.length > 8) xw.trail.shift();

        if (xw.fitness < this.bestFrog.fitness) {
          this.bestFrog = { id: xw.id, x: xw.x, y: xw.y, fitness: xw.fitness };
        }
      }

      this.updateRolesWithinMemeplexes();
      this.phase = 'LOCAL_JUMP';
      this.phaseLabel = `Lompatan Lokal (${this.localStep}/${this.localIterations})`;
      this.phaseDetail = `Hasil lompatan: ${countXb} ke Xb, ${countXg} ke Xg, ${countRand} katak acak baru.`;
      return this.getState();
    }

    // Tahap 5: Shuffle seluruh katak & cek terminasi
    this.iteration += 1;
    this.sortPopulation();
    for (const f of this.frogs) {
      f.memeplex = -1; // Menunjukkan seluruh kelompok dilebur kembali
    }

    this.history.push({
      iteration: this.iteration,
      bestFitness: this.bestFrog.fitness,
      meanFitness: this.computeMeanFitness()
    });

    if (this.iteration >= this.maxIterations) {
      this.phase = 'DONE';
      this.phaseLabel = 'Selesai (Terminasi)';
      this.phaseDetail = `Mencapai ${this.iteration} siklus. Terbaik global f = ${this.bestFrog.fitness.toExponential(3)}.`;
    } else {
      this.phase = 'SHUFFLE';
      this.phaseLabel = 'Shuffle Global';
      this.phaseDetail = `Siklus #${this.iteration}: seluruh katak dicampur & diurutkan ulang untuk bertukar informasi.`;
    }

    return this.getState();
  }

  /**
   * Menjalankan langkah-langkah hingga menyelesaikan tepat 1 siklus global (iterasi +1).
   * Berguna untuk perbandingan adil per iterasi dengan WCA pada Slide 16.
   */
  stepFullIteration() {
    if (this.phase === 'DONE') return this.getState();
    const targetIter = this.iteration + 1;
    let guard = 0;
    while (this.iteration < targetIter && this.phase !== 'DONE' && guard < 40) {
      this.step();
      guard += 1;
    }
    return this.getState();
  }

  getState() {
    return {
      phase: this.phase,
      phaseLabel: this.phaseLabel,
      phaseDetail: this.phaseDetail,
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      localStep: this.localStep,
      localIterations: this.localIterations,
      frogs: this.frogs,
      jumps: this.jumps,
      bestFrog: this.bestFrog,
      history: this.history
    };
  }
}
