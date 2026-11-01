/**
 * Seedable Pseudo-Random Number Generator (Mulberry32)
 * Menjamin hasil simulasi dapat diulang persis sama dengan seed yang sama (F-13 & Kriteria #5).
 */

export function hashSeed(seedInput) {
  if (typeof seedInput === 'number' && Number.isFinite(seedInput)) {
    let h = (seedInput | 0) ^ 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  }
  const str = String(seedInput ?? '42');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seedInput = 42) {
  let state = hashSeed(seedInput);
  if (state === 0) state = 0x6d2b79f5;

  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min, max) {
    return min + next() * (max - min);
  }

  function int(min, maxInclusive) {
    return Math.floor(min + next() * (maxInclusive - min + 1));
  }

  function gaussian(mean = 0, std = 1) {
    // Transformasi Box-Muller untuk distribusi normal N(mean, std^2)
    const u1 = Math.max(1e-12, next());
    const u2 = next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * std;
  }

  return {
    next,
    range,
    int,
    gaussian,
    getState: () => state >>> 0,
    setState: (newState) => {
      state = newState >>> 0;
    }
  };
}

