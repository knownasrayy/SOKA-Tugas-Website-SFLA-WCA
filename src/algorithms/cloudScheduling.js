/**
 * Mini Studi Kasus Komputasi Awan: Penjadwalan n Tugas ke m Virtual Machine (PRD Bagian 9)
 * Logika murni tanpa DOM — memetakan vektor kontinu X in [0, m)^n menjadi jadwal diskrit VM
 * menggunakan pembulatan bawah floor(X[i]) untuk meminimalkan Makespan.
 */

import { createRng } from '../core/rng.js';

export const DEFAULT_VMS = [
  { id: 0, name: 'VM-1 (Small)', mips: 85 },
  { id: 1, name: 'VM-2 (Medium)', mips: 115 },
  { id: 2, name: 'VM-3 (Large)', mips: 145 },
  { id: 3, name: 'VM-4 (X-Large)', mips: 175 }
];

export function generateCloudTasks(count = 16, seed = 2026) {
  const rng = createRng(seed);
  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `T${idx + 1}`,
    mi: rng.int(140, 620) // Beban instruksi tugas dalam Million Instructions (MI)
  }));
}

/**
 * Pemetaan solusi kontinu ke indeks VM diskrit:
 *   vmIndex = clamp(floor(x_i), 0, m - 1)
 */
export function decodeSchedule(vector, vmCount) {
  const maxIdx = vmCount - 1;
  return vector.map((val) => {
    const idx = Math.floor(val);
    if (idx < 0) return 0;
    if (idx > maxIdx) return maxIdx;
    return idx;
  });
}

/**
 * Menghitung waktu eksekusi tiap VM dan nilai Makespan = max(waktu selesai VM).
 */
export function evaluateSchedule(vector, tasks, vms = DEFAULT_VMS) {
  const assignment = decodeSchedule(vector, vms.length);
  const vmLoads = vms.map(() => 0);
  const vmTasks = vms.map(() => []);

  for (let i = 0; i < tasks.length; i++) {
    const vmIdx = assignment[i];
    const execSec = tasks[i].mi / vms[vmIdx].mips;
    vmLoads[vmIdx] += execSec;
    vmTasks[vmIdx].push({
      ...tasks[i],
      execSec
    });
  }

  let makespan = 0;
  let sumLoad = 0;
  for (const load of vmLoads) {
    if (load > makespan) makespan = load;
    sumLoad += load;
  }
  const meanLoad = sumLoad / vms.length;
  let variance = 0;
  for (const load of vmLoads) {
    variance += (load - meanLoad) * (load - meanLoad);
  }
  const imbalanceStd = Math.sqrt(variance / vms.length);

  // Fitness utama adalah Makespan, ditambah penalti keseimbangan mikro (1e-3) untuk memandu gradien plato
  const fitness = makespan + 0.001 * imbalanceStd;

  return {
    assignment,
    vmLoads,
    vmTasks,
    makespan,
    imbalanceStd,
    fitness
  };
}

export function computeRoundRobinBaseline(tasks, vms = DEFAULT_VMS) {
  const rrVector = tasks.map((_, i) => (i % vms.length) + 0.5);
  return evaluateSchedule(rrVector, tasks, vms);
}

export class CloudScheduleOptimizer {
  /**
   * Menjalankan SFLA dan WCA secara paralel pada masalah penjadwalan tugas VM yang sama.
   */
  constructor({ tasks, vms = DEFAULT_VMS, populationSize = 28, maxIterations = 35, seed = 42 } = {}) {
    this.tasks = tasks || generateCloudTasks(16, seed);
    this.vms = vms;
    this.populationSize = populationSize;
    this.maxIterations = maxIterations;
    this.seed = seed;
    this.reset();
  }

  clampDim(val) {
    const upper = this.vms.length - 1e-6;
    if (val < 0) return 0;
    if (val > upper) return upper;
    return val;
  }

  reset() {
    const rngInit = createRng(this.seed);
    this.rngSfla = createRng(Number(this.seed) + 101);
    this.rngWca = createRng(Number(this.seed) + 202);
    const dim = this.tasks.length;
    const m = this.vms.length;

    // Populasi awal yang sengaja identik untuk SFLA & WCA agar perbandingan adil
    const initVectors = Array.from({ length: this.populationSize }, () =>
      Array.from({ length: dim }, () => rngInit.range(0, m - 1e-6))
    );

    this.sflaPop = initVectors.map((vec) => ({
      vec: [...vec],
      eval: evaluateSchedule(vec, this.tasks, this.vms)
    }));

    this.wcaPop = initVectors.map((vec) => ({
      vec: [...vec],
      eval: evaluateSchedule(vec, this.tasks, this.vms)
    }));

    this.sflaPop.sort((a, b) => a.eval.fitness - b.eval.fitness);
    this.wcaPop.sort((a, b) => a.eval.fitness - b.eval.fitness);

    this.bestSfla = { vec: [...this.sflaPop[0].vec], eval: this.sflaPop[0].eval };
    this.bestWca = { vec: [...this.wcaPop[0].vec], eval: this.wcaPop[0].eval };
    this.baselineRR = computeRoundRobinBaseline(this.tasks, this.vms);

    this.iteration = 0;
    this.dmax = 1.2;
    this.dmax0 = 1.2;
    this.done = false;

    this.historySfla = [{ iteration: 0, bestFitness: this.bestSfla.eval.makespan }];
    this.historyWca = [{ iteration: 0, bestFitness: this.bestWca.eval.makespan }];
    return this.getState();
  }

  step() {
    if (this.done) return this.getState();
    this.iteration += 1;

    this.stepSFLAOnce();
    this.stepWCAOnce();

    this.historySfla.push({ iteration: this.iteration, bestFitness: this.bestSfla.eval.makespan });
    this.historyWca.push({ iteration: this.iteration, bestFitness: this.bestWca.eval.makespan });

    if (this.iteration >= this.maxIterations) {
      this.done = true;
    }
    return this.getState();
  }

  stepSFLAOnce() {
    const mCount = 4;
    const localN = 4;
    const dim = this.tasks.length;
    const vmCount = this.vms.length;

    this.sflaPop.sort((a, b) => a.eval.fitness - b.eval.fitness);
    const memeplexes = Array.from({ length: mCount }, () => []);
    this.sflaPop.forEach((agent, idx) => {
      memeplexes[idx % mCount].push(agent);
    });

    for (let k = 0; k < mCount; k++) {
      const group = memeplexes[k];
      if (group.length < 2) continue;

      for (let step = 0; step < localN; step++) {
        group.sort((a, b) => a.eval.fitness - b.eval.fitness);
        const xb = group[0];
        const xw = group[group.length - 1];

        // 1. Lompat menuju Xb
        const candXb = xw.vec.map((v, d) =>
          this.clampDim(v + this.rngSfla.next() * 1.6 * (xb.vec[d] - v))
        );
        const evalXb = evaluateSchedule(candXb, this.tasks, this.vms);

        if (evalXb.fitness < xw.eval.fitness) {
          xw.vec = candXb;
          xw.eval = evalXb;
        } else {
          // 2. Lompat menuju Xg
          const candXg = xw.vec.map((v, d) =>
            this.clampDim(v + this.rngSfla.next() * 1.6 * (this.bestSfla.vec[d] - v))
          );
          const evalXg = evaluateSchedule(candXg, this.tasks, this.vms);
          if (evalXg.fitness < xw.eval.fitness) {
            xw.vec = candXg;
            xw.eval = evalXg;
          } else {
            // 3. Jadwal acak baru
            const randVec = Array.from({ length: dim }, () =>
              this.rngSfla.range(0, vmCount - 1e-6)
            );
            xw.vec = randVec;
            xw.eval = evaluateSchedule(randVec, this.tasks, this.vms);
          }
        }

        if (xw.eval.fitness < this.bestSfla.eval.fitness) {
          this.bestSfla = { vec: [...xw.vec], eval: xw.eval };
        }
      }
    }

    // Gabung kembali (Shuffle)
    this.sflaPop = memeplexes.flat().sort((a, b) => a.eval.fitness - b.eval.fitness);
  }

  stepWCAOnce() {
    const nsr = 4;
    const C = 2.0;
    const dim = this.tasks.length;
    const vmCount = this.vms.length;

    this.wcaPop.sort((a, b) => a.eval.fitness - b.eval.fitness);
    const leaders = this.wcaPop.slice(0, nsr);
    const streams = this.wcaPop.slice(nsr);

    // Pembagian aliran proporsional intensitas
    const refFit = streams.length > 0 ? streams[0].eval.fitness + 1e-6 : leaders[nsr - 1].eval.fitness + 1;
    const weights = leaders.map((ld) => Math.abs(ld.eval.fitness - refFit) + 1e-6);
    const totalW = weights.reduce((a, b) => a + b, 0);
    const quotas = weights.map((w) => Math.round((w / totalW) * streams.length));
    while (quotas.reduce((a, b) => a + b, 0) < streams.length) quotas[0] += 1;
    while (quotas.reduce((a, b) => a + b, 0) > streams.length) {
      const idx = quotas.findIndex((q) => q > 0);
      if (idx >= 0) quotas[idx] -= 1;
      else break;
    }

    // Aliran menuju sungai/laut induk
    let ptr = 0;
    for (let l = 0; l < nsr; l++) {
      const parent = leaders[l];
      for (let q = 0; q < quotas[l] && ptr < streams.length; q++) {
        const st = streams[ptr++];
        const nextVec = st.vec.map((v, d) =>
          this.clampDim(v + this.rngWca.next() * C * (parent.vec[d] - v))
        );
        st.vec = nextVec;
        st.eval = evaluateSchedule(nextVec, this.tasks, this.vms);

        // Pertukaran peran aliran <-> induk
        if (st.eval.fitness < parent.eval.fitness) {
          const tmpV = parent.vec;
          const tmpE = parent.eval;
          parent.vec = st.vec;
          parent.eval = st.eval;
          st.vec = tmpV;
          st.eval = tmpE;
        }
      }
    }

    // Sungai mengalir ke Laut (leaders[0])
    const sea = leaders[0];
    for (let r = 1; r < nsr; r++) {
      const rv = leaders[r];
      const nextVec = rv.vec.map((v, d) =>
        this.clampDim(v + this.rngWca.next() * C * (sea.vec[d] - v))
      );
      rv.vec = nextVec;
      rv.eval = evaluateSchedule(nextVec, this.tasks, this.vms);

      if (rv.eval.fitness < sea.eval.fitness) {
        const tmpV = sea.vec;
        const tmpE = sea.eval;
        sea.vec = rv.vec;
        sea.eval = rv.eval;
        rv.vec = tmpV;
        rv.eval = tmpE;
      }

      // Cek penguapan jarak vektor ke Laut
      let sqDist = 0;
      for (let d = 0; d < dim; d++) {
        const diff = rv.vec[d] - sea.vec[d];
        sqDist += diff * diff;
      }
      const normDist = Math.sqrt(sqDist / dim);
      if (normDist < this.dmax || this.rngWca.next() < 0.08) {
        rv.vec = Array.from({ length: dim }, () => this.rngWca.range(0, vmCount - 1e-6));
        rv.eval = evaluateSchedule(rv.vec, this.tasks, this.vms);
        if (rv.eval.fitness < sea.eval.fitness) {
          const tmpV = sea.vec;
          const tmpE = sea.eval;
          sea.vec = rv.vec;
          sea.eval = rv.eval;
          rv.vec = tmpV;
          rv.eval = tmpE;
        }
      }
    }

    if (sea.eval.fitness < this.bestWca.eval.fitness) {
      this.bestWca = { vec: [...sea.vec], eval: sea.eval };
    }

    this.dmax = Math.max(0.05, this.dmax - this.dmax0 / this.maxIterations);
    this.wcaPop = [...leaders, ...streams];
  }

  getState() {
    return {
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      done: this.done,
      vms: this.vms,
      tasks: this.tasks,
      baselineRR: this.baselineRR,
      bestSfla: this.bestSfla,
      bestWca: this.bestWca,
      historySfla: this.historySfla,
      historyWca: this.historyWca
    };
  }
}

