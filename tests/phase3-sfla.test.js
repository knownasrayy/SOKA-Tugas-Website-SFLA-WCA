import test from 'node:test';
import assert from 'node:assert/strict';
import { getObjective } from '../src/core/objectives.js';
import { SFLAEngine } from '../src/algorithms/sfla.js';

test('SFLA menghasilkan urutan tahap yang benar: INIT -> SORT -> PARTITION -> LOCAL_JUMP -> SHUFFLE', () => {
  const engine = new SFLAEngine({
    objective: getObjective('sphere'),
    populationSize: 12,
    memeplexCount: 3,
    localIterations: 2,
    maxStep: 3.0,
    maxIterations: 10,
    seed: 77
  });

  assert.equal(engine.getState().phase, 'INIT');
  assert.equal(engine.step().phase, 'SORT');
  assert.equal(engine.step().phase, 'PARTITION');
  assert.equal(engine.step().phase, 'LOCAL_JUMP'); // langkah lokal 1/2
  assert.equal(engine.step().phase, 'LOCAL_JUMP'); // langkah lokal 2/2
  assert.equal(engine.step().phase, 'SHUFFLE');    // akhir siklus #1
  assert.equal(engine.getState().iteration, 1);
});

test('SFLA konvergen signifikan pada Sphere dan fitness terbaik tidak pernah memburuk', () => {
  const engine = new SFLAEngine({
    objective: getObjective('sphere'),
    populationSize: 24,
    memeplexCount: 4,
    localIterations: 4,
    maxStep: 3.2,
    maxIterations: 35,
    seed: 42
  });

  const initialBest = engine.getState().bestFrog.fitness;
  let prevBest = initialBest;

  while (engine.getState().phase !== 'DONE') {
    const st = engine.step();
    assert.ok(
      st.bestFrog.fitness <= prevBest + 1e-12,
      `Fitness terbaik tidak boleh memburuk: ${st.bestFrog.fitness} > ${prevBest}`
    );
    prevBest = st.bestFrog.fitness;
  }

  const finalBest = engine.getState().bestFrog.fitness;
  assert.ok(finalBest < initialBest * 0.01, `Harus jauh lebih kecil dari awal (${initialBest} -> ${finalBest})`);
  assert.ok(finalBest < 0.005, `Harus konvergen mendekati 0 pada Sphere, dapat ${finalBest}`);
});

test('SFLA deterministik dengan seed yang sama dan responsif terhadap perubahan parameter', () => {
  const cfg = {
    objective: getObjective('rastrigin'),
    populationSize: 20,
    memeplexCount: 4,
    localIterations: 3,
    maxStep: 3.0,
    maxIterations: 12,
    seed: 2026
  };

  const runA = new SFLAEngine(cfg);
  const runB = new SFLAEngine(cfg);
  const runDiffParam = new SFLAEngine({ ...cfg, populationSize: 36 });

  for (let i = 0; i < 8; i++) {
    runA.stepFullIteration();
    runB.stepFullIteration();
    runDiffParam.stepFullIteration();
  }

  assert.equal(runA.getState().bestFrog.fitness, runB.getState().bestFrog.fitness);
  assert.notEqual(runA.getState().frogs.length, runDiffParam.getState().frogs.length);
});

