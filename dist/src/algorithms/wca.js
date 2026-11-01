/**
 * Water Cycle Algorithm (WCA) — Mesin Status Murni (Tanpa DOM)
 * Referensi: Eskandar, H., Sadollah, A., Bahreininejad, A., & Hamdi, M. (2012).
 *
 * Urutan event tahap (Acceptance Criterion #3):
 *   INIT -> HIERARCHY -> FLOW -> ROLE_SWAP -> EVAPORATION -> RAIN -> FLOW -> ... -> DONE
 */

import { createRng } from '../core/rng.js';
import { clampCoord } from '../core/objectives.js';

export class WCAEngine {
  /**
   * @param {Object} config
   * @param {Object} config.objective - Objek fungsi objektif { evaluate(x,y), min, max }
   * @param {number} [config.populationSize=24] - Jumlah tetesan populasi total (Npop)
   * @param {number} [config.nsr=4] - Jumlah Sungai + 1 Laut (Nsr)
   * @param {number} [config.dmax=0.45] - Batas jarak penguapan awal (dmax0)
   * @param {number} [config.flowConstant=2.0] - Konstanta aliran C (sekitar 2)
   * @param {number} [config.maxIterations=40] - Maksimum siklus iterasi
   * @param {number|string} [config.seed=42] - Seed PRNG
   * @param {Array<{x:number, y:number}>} [config.initialPositions] - Opsional posisi awal bersama
   */
  constructor(config) {
    this.configure(config);
  }

  configure(config = {}) {
    this.objective = config.objective;
    this.populationSize = Math.max(8, Math.min(100, Math.round(config.populationSize ?? 24)));
    this.nsr = Math.max(2, Math.min(Math.floor(this.populationSize / 2), Math.round(config.nsr ?? 4)));
    this.dmax0 = Math.max(0.02, Number(config.dmax ?? 0.45));
    this.flowConstant = Math.max(1.0, Math.min(3.0, Number(config.flowConstant ?? 2.0)));
    this.maxIterations = Math.max(5, Math.round(config.maxIterations ?? 40));
    this.seed = config.seed ?? 42;
    this.initialPositions = config.initialPositions || null;
    this.reset();
  }

  reset() {
    this.rng = createRng(this.seed);
    const { min, max } = this.objective;

    this.drops = Array.from({ length: this.populationSize }, (_, i) => {
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
        role: 'stream', // 'sea' | 'river' | 'stream'
        riverIndex: -1, // 0 untuk Laut, 1..Nsr-1 untuk Sungai
        parentId: null, // ID sungai atau laut tujuan aliran
        evaporating: false,
        evapMode: null, // 'global' | 'local'
        justRained: false,
        trail: [{ x, y }]
      };
    });

    this.iteration = 0;
    this.dmax = this.dmax0;
    this.swaps = [];
    this.evaporatedIds = [];
    this.rainedDrops = [];
    this.streamAllocation = [];

    this.bestSea = this.computeBestSnapshot();
    this.history = [
      {
        iteration: 0,
        bestFitness: this.bestSea.fitness,
        meanFitness: this.computeMeanFitness()
      }
    ];

    this.phase = 'INIT';
    this.phaseLabel = 'Inisialisasi Tetesan';
    this.phaseDetail = `Menyebar ${this.populationSize} tetesan hujan awal di bentang pegunungan.`;
    return this.getState();
  }

  computeBestSnapshot() {
    let best = this.drops[0];
    for (const d of this.drops) {
      if (d.fitness < best.fitness) best = d;
    }
    if (this.bestSea && this.bestSea.fitness < best.fitness) {
      return { ...this.bestSea };
    }
    return { id: best.id, x: best.x, y: best.y, fitness: best.fitness };
  }

  computeMeanFitness() {
    let sum = 0;
    for (const d of this.drops) sum += d.fitness;
    return sum / Math.max(1, this.drops.length);
  }

  syncPreviousPositions() {
    for (const d of this.drops) {
      d.prevX = d.x;
      d.prevY = d.y;
      d.justRained = false;
    }
  }

  findDropById(id) {
    return this.drops.find((d) => d.id === id) || null;
  }

  getSeaDrop() {
    return this.drops.find((d) => d.role === 'sea') || this.drops[0];
  }

  /**
   * Pembentukan hierarki Laut, Sungai, dan pembagian Aliran proporsional (Eskandar et al., 2012):
   *   C_n = f(X_n) - f(X_{Nsr + 1})   untuk n = 0 .. Nsr-1
   *   NS_n = round( |C_n / sum(C_k)| * N_stream )
   * Laut (fitness terkecil) memiliki |C_0| terbesar sehingga menerima anak aliran terbanyak.
   */
  assignHierarchy() {
    const sorted = [...this.drops].sort((a, b) => a.fitness - b.fitness);
    const nStreams = this.populationSize - this.nsr;
    const leaders = sorted.slice(0, this.nsr);
    const streams = sorted.slice(this.nsr);

    leaders.forEach((ld, idx) => {
      ld.role = idx === 0 ? 'sea' : 'river';
      ld.riverIndex = idx;
      ld.parentId = idx === 0 ? null : leaders[0].id;
      ld.evaporating = false;
    });

    // Hitung intensitas aliran proporsional terhadap selisih fitness ke aliran terbaik pertama
    const refFitness = streams.length > 0 ? streams[0].fitness + 1e-9 : leaders[leaders.length - 1].fitness + 1;
    const magnitudes = leaders.map((ld) => Math.abs(ld.fitness - refFitness) + 1e-9);
    const totalMag = magnitudes.reduce((a, b) => a + b, 0);

    const counts = magnitudes.map((m) => Math.round((m / totalMag) * nStreams));

    // Sesuaikan selisih pembulatan agar total tepat sama dengan nStreams
    let sumCounts = counts.reduce((a, b) => a + b, 0);
    let adjustIdx = 0;
    while (sumCounts < nStreams) {
      counts[adjustIdx % this.nsr] += 1;
      sumCounts += 1;
      adjustIdx += 1;
    }
    while (sumCounts > nStreams) {
      const idx = (this.nsr - 1 - (adjustIdx % this.nsr) + this.nsr) % this.nsr;
      if (counts[idx] > 0) {
        counts[idx] -= 1;
        sumCounts -= 1;
      }
      adjustIdx += 1;
    }

    this.streamAllocation = counts;

    // Bagikan aliran ke Laut & Sungai sesuai kuota NS_n
    let cursor = 0;
    for (let ldrIdx = 0; ldrIdx < this.nsr; ldrIdx++) {
      const quota = counts[ldrIdx];
      for (let q = 0; q < quota && cursor < streams.length; q++) {
        const st = streams[cursor++];
        st.role = 'stream';
        st.riverIndex = ldrIdx;
        st.parentId = leaders[ldrIdx].id;
        st.evaporating = false;
      }
    }

    const sea = leaders[0];
    if (!this.bestSea || sea.fitness <= this.bestSea.fitness) {
      this.bestSea = { id: sea.id, x: sea.x, y: sea.y, fitness: sea.fitness };
    }
  }

  /**
   * Menukar koordinat & atribut posisi antara dua agen saat bawahan menemukan titik lebih rendah,
   * sambil mempertahankan struktur graf induk-anak (parentId) tetap utuh dan bersih.
   */
  swapPositionsAndFitness(subordinate, superior) {
    const tmpX = superior.x;
    const tmpY = superior.y;
    const tmpPrevX = superior.prevX;
    const tmpPrevY = superior.prevY;
    const tmpFit = superior.fitness;
    const tmpTrail = superior.trail;

    superior.x = subordinate.x;
    superior.y = subordinate.y;
    superior.prevX = subordinate.prevX;
    superior.prevY = subordinate.prevY;
    superior.fitness = subordinate.fitness;
    superior.trail = subordinate.trail;

    subordinate.x = tmpX;
    subordinate.y = tmpY;
    subordinate.prevX = tmpPrevX;
    subordinate.prevY = tmpPrevY;
    subordinate.fitness = tmpFit;
    subordinate.trail = tmpTrail;
  }

  /**
   * Menjalankan tepat 1 event tahap WCA.
   */
  step() {
    if (this.phase === 'DONE') {
      return this.getState();
    }

    this.syncPreviousPositions();

    // Tahap 1 -> 2: Tetapkan hierarki Laut, Sungai, dan Aliran
    if (this.phase === 'INIT') {
      this.assignHierarchy();
      this.phase = 'HIERARCHY';
      this.phaseLabel = 'Hierarki Laut & Sungai';
      this.phaseDetail = `1 Laut (${this.streamAllocation[0]} aliran) & ${this.nsr - 1} Sungai dibentuk proporsional intensitas.`;
      return this.getState();
    }

    // Tahap 3 & 4: Aliran mengalir ke Sungai/Laut, Sungai mengalir ke Laut
    if (this.phase === 'HIERARCHY' || this.phase === 'RAIN') {
      this.swaps = [];
      this.evaporatedIds = [];
      this.rainedDrops = [];

      const { min, max } = this.objective;
      const sea = this.getSeaDrop();
      // Salin posisi induk pada awal langkah agar gerakan serentak sinkron
      const snapshotPos = new Map(this.drops.map((d) => [d.id, { x: d.x, y: d.y }]));

      for (const d of this.drops) {
        if (d.role === 'stream') {
          const parentPos = snapshotPos.get(d.parentId) || { x: sea.x, y: sea.y };
          const rx = this.rng.next();
          const ry = this.rng.next();
          d.x = clampCoord(d.x + rx * this.flowConstant * (parentPos.x - d.x), min, max);
          d.y = clampCoord(d.y + ry * this.flowConstant * (parentPos.y - d.y), min, max);
          d.fitness = this.objective.evaluate(d.x, d.y);
          d.trail.push({ x: d.x, y: d.y });
          if (d.trail.length > 8) d.trail.shift();
        } else if (d.role === 'river') {
          const seaPos = snapshotPos.get(sea.id);
          const rx = this.rng.next();
          const ry = this.rng.next();
          d.x = clampCoord(d.x + rx * this.flowConstant * (seaPos.x - d.x), min, max);
          d.y = clampCoord(d.y + ry * this.flowConstant * (seaPos.y - d.y), min, max);
          d.fitness = this.objective.evaluate(d.x, d.y);
          d.trail.push({ x: d.x, y: d.y });
          if (d.trail.length > 8) d.trail.shift();
        }
      }

      this.phase = 'FLOW';
      this.phaseLabel = 'Aliran Mengalir';
      this.phaseDetail = `Aliran bergerak menuju Sungai dan Sungai bermuara ke Laut (C = ${this.flowConstant.toFixed(1)}).`;
      return this.getState();
    }

    // Tahap 5: Pertukaran Peran (Role Swap) bila aliran/sungai lebih rendah dari atasannya
    if (this.phase === 'FLOW') {
      this.swaps = [];
      const sea = this.getSeaDrop();

      // 5a. Cek aliran terhadap induknya (sungai atau laut)
      const streams = this.drops.filter((d) => d.role === 'stream');
      for (const st of streams) {
        const parent = this.findDropById(st.parentId);
        if (parent && st.fitness < parent.fitness) {
          this.swaps.push({
            fromX: st.x,
            fromY: st.y,
            toX: parent.x,
            toY: parent.y,
            kind: parent.role === 'sea' ? 'STREAM_TO_SEA' : 'STREAM_TO_RIVER'
          });
          this.swapPositionsAndFitness(st, parent);
        }
      }

      // 5b. Cek sungai terhadap laut
      const rivers = this.drops.filter((d) => d.role === 'river');
      for (const rv of rivers) {
        if (rv.fitness < sea.fitness) {
          this.swaps.push({
            fromX: rv.x,
            fromY: rv.y,
            toX: sea.x,
            toY: sea.y,
            kind: 'RIVER_TO_SEA'
          });
          this.swapPositionsAndFitness(rv, sea);
        }
      }

      if (sea.fitness <= this.bestSea.fitness) {
        this.bestSea = { id: sea.id, x: sea.x, y: sea.y, fitness: sea.fitness };
      }

      this.phase = 'ROLE_SWAP';
      this.phaseLabel = 'Pertukaran Peran';
      this.phaseDetail =
        this.swaps.length > 0
          ? `${this.swaps.length} aliran/sungai menemukan titik lebih rendah dan bertukar peran!`
          : 'Tidak ada yang melampaui atasannya pada langkah ini; Laut tetap memimpin.';
      return this.getState();
    }

    // Tahap 6: Cek Kondisi Penguapan (jarak ke Laut < dmax)
    if (this.phase === 'ROLE_SWAP') {
      this.evaporatedIds = [];
      const sea = this.getSeaDrop();

      for (const d of this.drops) {
        d.evaporating = false;
        d.evapMode = null;
        if (d.role === 'sea') continue;

        const distToSea = Math.hypot(d.x - sea.x, d.y - sea.y);
        if (d.role === 'river') {
          if (distToSea < this.dmax || this.rng.next() < 0.08) {
            d.evaporating = true;
            d.evapMode = 'global';
            this.evaporatedIds.push(d.id);
          }
        } else if (d.role === 'stream' && d.parentId === sea.id) {
          // Aliran yang langsung bermuara ke Laut: menguap & hujan lokal di sekitar Laut (Eskandar et al., 2012)
          if (distToSea < this.dmax) {
            d.evaporating = true;
            d.evapMode = 'local';
            this.evaporatedIds.push(d.id);
          }
        }
      }

      this.phase = 'EVAPORATION';
      this.phaseLabel = 'Penguapan Air';
      this.phaseDetail =
        this.evaporatedIds.length > 0
          ? `${this.evaporatedIds.length} sungai/aliran berjarak < dmax (${this.dmax.toFixed(3)}) menguap ke atmosfer.`
          : `Belum ada sungai dalam radius dmax (${this.dmax.toFixed(3)}) dari Laut.`;
      return this.getState();
    }

    // Tahap 7 & 8: Proses Hujan & Penyusutan dmax
    if (this.phase === 'EVAPORATION') {
      const { min, max } = this.objective;
      const span = max - min;
      const sea = this.getSeaDrop();
      const mu = 0.1; // Parameter standar variansi hujan lokal sekitar Laut (Eskandar et al., 2012)
      this.rainedDrops = [];

      for (const d of this.drops) {
        if (!d.evaporating) continue;

        if (d.evapMode === 'local') {
          // Eksploitasi sekitar Laut: X_baru = X_laut + sqrt(mu) * N(0, 1)
          const stdStep = Math.sqrt(mu) * (span * 0.08);
          d.x = clampCoord(sea.x + this.rng.gaussian(0, stdStep), min, max);
          d.y = clampCoord(sea.y + this.rng.gaussian(0, stdStep), min, max);
        } else {
          // Eksplorasi global di seluruh domain
          d.x = this.rng.range(min, max);
          d.y = this.rng.range(min, max);
        }

        d.prevX = d.x;
        d.prevY = d.y;
        d.fitness = this.objective.evaluate(d.x, d.y);
        d.evaporating = false;
        d.justRained = true;
        d.trail = [{ x: d.x, y: d.y }];
        this.rainedDrops.push({ id: d.id, x: d.x, y: d.y, mode: d.evapMode });

        // Jaga sifat elitisme Laut bila tetesan hujan baru jatuh lebih rendah dari Laut
        if (d.fitness < sea.fitness) {
          this.swapPositionsAndFitness(d, sea);
        }
      }

      if (sea.fitness <= this.bestSea.fitness) {
        this.bestSea = { id: sea.id, x: sea.x, y: sea.y, fitness: sea.fitness };
      }

      // Update dmax: dmax(t+1) = dmax(t) - dmax(0) / iterasi_maks (PRD Bagian 8.3 poin 8)
      this.dmax = Math.max(1e-5, this.dmax - this.dmax0 / this.maxIterations);
      this.iteration += 1;

      this.history.push({
        iteration: this.iteration,
        bestFitness: this.bestSea.fitness,
        meanFitness: this.computeMeanFitness()
      });

      if (this.iteration >= this.maxIterations) {
        this.phase = 'DONE';
        this.phaseLabel = 'Selesai (Terminasi)';
        this.phaseDetail = `Mencapai ${this.iteration} iterasi. Titik Laut terbaik f = ${this.bestSea.fitness.toExponential(3)}.`;
      } else {
        this.phase = 'RAIN';
        this.phaseLabel = 'Hujan & Update dmax';
        this.phaseDetail =
          this.rainedDrops.length > 0
            ? `${this.rainedDrops.length} tetesan hujan baru turun; dmax menyusut menjadi ${this.dmax.toFixed(3)}.`
            : `Siklus #${this.iteration} selesai; radius dmax menyusut menjadi ${this.dmax.toFixed(3)}.`;
      }

      return this.getState();
    }

    return this.getState();
  }

  /**
   * Menjalankan langkah-langkah hingga menyelesaikan tepat 1 siklus iterasi penuh (+1 iterasi).
   */
  stepFullIteration() {
    if (this.phase === 'DONE') return this.getState();
    const targetIter = this.iteration + 1;
    let guard = 0;
    while (this.iteration < targetIter && this.phase !== 'DONE' && guard < 20) {
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
      dmax: this.dmax,
      dmax0: this.dmax0,
      nsr: this.nsr,
      flowConstant: this.flowConstant,
      drops: this.drops,
      swaps: this.swaps,
      evaporatedIds: this.evaporatedIds,
      rainedDrops: this.rainedDrops,
      streamAllocation: this.streamAllocation,
      bestSea: this.bestSea,
      history: this.history
    };
  }
}

