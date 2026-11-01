import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { OBJECTIVES, getObjective } from '../src/core/objectives.js';

test('RNG deterministik: seed yang sama menghasilkan deret angka identik', () => {
  const rngA = createRng(12345);
  const rngB = createRng(12345);
  const rngC = createRng(99999);

  const seqA = Array.from({ length: 20 }, () => rngA.next());
  const seqB = Array.from({ length: 20 }, () => rngB.next());
  const seqC = Array.from({ length: 20 }, () => rngC.next());

  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, seqC);
});

test('Fungsi objektif Sphere, Rastrigin, dan Ackley memiliki global minimum f(0,0) = 0', () => {
  for (const key of ['sphere', 'rastrigin', 'ackley']) {
    const fn = getObjective(key);
    assert.ok(fn, `Fungsi ${key} harus tersedia`);
    const atZero = fn.evaluate(0, 0);
    assert.ok(Math.abs(atZero) < 1e-12, `${key} di (0,0) harus 0, dapat ${atZero}`);

    // Nilai di luar titik (0,0) harus positif (> 0)
    const offZero = fn.evaluate(1.5, -1.2);
    assert.ok(offZero > 0, `${key} di luar (0,0) harus > 0, dapat ${offZero}`);
  }
});

test('Rastrigin memiliki jebakan lokal (multimodal)', () => {
  const rastrigin = OBJECTIVES.rastrigin;
  // Di x=0.995, y=0 merupakan lembah lokal (~0.995), sedangkan di x=0.5, y=0 adalah puncak (~20.25)
  const localValley = rastrigin.evaluate(0.995, 0);
  const ridgeBetween = rastrigin.evaluate(0.5, 0);
  assert.ok(localValley < ridgeBetween);
  assert.ok(rastrigin.evaluate(0, 0) < localValley);
});

