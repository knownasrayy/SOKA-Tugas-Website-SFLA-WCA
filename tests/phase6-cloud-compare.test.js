import test from 'node:test';
import assert from 'node:assert/strict';
import { CloudScheduleOptimizer, generateCloudTasks } from '../src/algorithms/cloudScheduling.js';

test('CloudScheduleOptimizer menurunkan makespan dibanding jadwal awal dan tidak pernah memburuk', () => {
  const tasks = generateCloudTasks(16, 2026);
  const opt = new CloudScheduleOptimizer({
    tasks,
    populationSize: 28,
    maxIterations: 30,
    seed: 42
  });

  const initSfla = opt.getState().bestSfla.eval.makespan;
  const initWca = opt.getState().bestWca.eval.makespan;
  const rrMakespan = opt.getState().baselineRR.makespan;

  let prevSfla = initSfla;
  let prevWca = initWca;

  while (!opt.getState().done) {
    const st = opt.step();
    assert.ok(st.bestSfla.eval.makespan <= prevSfla + 1e-9);
    assert.ok(st.bestWca.eval.makespan <= prevWca + 1e-9);
    prevSfla = st.bestSfla.eval.makespan;
    prevWca = st.bestWca.eval.makespan;
  }

  const finalSfla = opt.getState().bestSfla.eval.makespan;
  const finalWca = opt.getState().bestWca.eval.makespan;

  assert.ok(finalSfla < rrMakespan, `SFLA (${finalSfla}) harus mengalahkan Round-Robin (${rrMakespan})`);
  assert.ok(finalWca < rrMakespan, `WCA (${finalWca}) harus mengalahkan Round-Robin (${rrMakespan})`);
});

