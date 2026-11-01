import test from 'node:test';
import assert from 'node:assert/strict';
import { getObjective } from '../src/core/objectives.js';
import { WCAEngine } from '../src/algorithms/wca.js';

test('WCA menghasilkan urutan tahap yang benar: INIT -> HIERARCHY -> FLOW -> ROLE_SWAP -> EVAPORATION -> RAIN', () => {
  const engine = new WCAEngine({
    objective: getObjective('sphere'),
    populationSize: 20,
    nsr: 4,
    dmax: 0.45,
    flowConstant: 2.0,
    maxIterations: 10,
    seed: 101
  });

  assert.equal(engine.getState().phase, 'INIT');
  const stHier = engine.step();
  assert.equal(stHier.phase, 'HIERARCHY');

  // Jumlah aliran total harus sama dengan Npop - Nsr = 16, dan Laut menerima paling banyak/sama aliran dibanding sungai terakhir
  const totalStreams = stHier.streamAllocation.reduce((a, b) => a + b, 0);
  assert.equal(totalStreams, 16);
  assert.ok(stHier.streamAllocation[0] >= stHier.streamAllocation[stHier.streamAllocation.length - 1]);

  assert.equal(engine.step().phase, 'FLOW');
  assert.equal(engine.step().phase, 'ROLE_SWAP');
  assert.equal(engine.step().phase, 'EVAPORATION');
  const stRain = engine.step();
  assert.equal(stRain.phase, 'RAIN');
  assert.equal(stRain.iteration, 1);
  assert.ok(stRain.dmax < 0.45, 'dmax harus menyusut setelah hujan');
});

test('WCA konvergen signifikan pada Sphere dan fitness terbaik tidak pernah memburuk', () => {
  const engine = new WCAEngine({
    objective: getObjective('sphere'),
    populationSize: 24,
    nsr: 4,
    dmax: 0.45,
    flowConstant: 2.0,
    maxIterations: 35,
    seed: 42
  });

  const initialBest = engine.getState().bestSea.fitness;
  let prevBest = initialBest;

  while (engine.getState().phase !== 'DONE') {
    const st = engine.step();
    assert.ok(
      st.bestSea.fitness <= prevBest + 1e-12,
      `Fitness Laut terbaik tidak boleh memburuk: ${st.bestSea.fitness} > ${prevBest}`
    );
    prevBest = st.bestSea.fitness;
  }

  const finalBest = engine.getState().bestSea.fitness;
  assert.ok(finalBest < initialBest * 0.01, `Harus jauh lebih kecil dari awal (${initialBest} -> ${finalBest})`);
  assert.ok(finalBest < 0.005, `WCA harus konvergen mendekati 0 pada Sphere, dapat ${finalBest}`);
});

test('WCA deterministik dengan seed yang sama dan responsif terhadap perubahan parameter', () => {
  const cfg = {
    objective: getObjective('ackley'),
    populationSize: 24,
    nsr: 4,
    dmax: 0.45,
    flowConstant: 2.0,
    maxIterations: 15,
    seed: 555
  };

  const runA = new WCAEngine(cfg);
  const runB = new WCAEngine(cfg);
  const runC = new WCAEngine({ ...cfg, nsr: 6 });

  for (let i = 0; i < 10; i++) {
    runA.stepFullIteration();
    runB.stepFullIteration();
    runC.stepFullIteration();
  }

  assert.equal(runA.getState().bestSea.fitness, runB.getState().bestSea.fitness);
  assert.notEqual(runA.getState().streamAllocation.length, runC.getState().streamAllocation.length);
});

