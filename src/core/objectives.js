/**
 * Fungsi Objektif 2D untuk Simulasi Visual (PRD Bagian 10 & F-07)
 * Semua fungsi diminimalkan menuju nilai global minimum f(0, 0) = 0.
 */

const TWO_PI = 2 * Math.PI;

export const OBJECTIVES = {
  sphere: {
    id: 'sphere',
    name: 'Sphere',
    character: 'Satu lembah mulus (Unimodal)',
    formulaText: 'f(x, y) = x² + y²',
    min: -5.12,
    max: 5.12,
    maxVisualValue: 52,
    optimum: { x: 0, y: 0, value: 0 },
    evaluate(x, y) {
      return x * x + y * y;
    }
  },

  rastrigin: {
    id: 'rastrigin',
    name: 'Rastrigin',
    character: 'Banyak lembah lokal (Multimodal)',
    formulaText: 'f(x, y) = 20 + (x² − 10 cos 2πx) + (y² − 10 cos 2πy)',
    min: -5.12,
    max: 5.12,
    maxVisualValue: 82,
    optimum: { x: 0, y: 0, value: 0 },
    evaluate(x, y) {
      return (
        20 +
        (x * x - 10 * Math.cos(TWO_PI * x)) +
        (y * y - 10 * Math.cos(TWO_PI * y))
      );
    }
  },

  ackley: {
    id: 'ackley',
    name: 'Ackley',
    character: 'Banyak riak lokal dengan lembah pusat curam',
    formulaText: 'f(x, y) = −20 exp(−0.2√(0.5(x²+y²))) − exp(0.5(cos 2πx + cos 2πy)) + e + 20',
    min: -5.0,
    max: 5.0,
    maxVisualValue: 22.5,
    optimum: { x: 0, y: 0, value: 0 },
    evaluate(x, y) {
      const sumSq = 0.5 * (x * x + y * y);
      const sumCos = 0.5 * (Math.cos(TWO_PI * x) + Math.cos(TWO_PI * y));
      const val = -20 * Math.exp(-0.2 * Math.sqrt(sumSq)) - Math.exp(sumCos) + Math.E + 20;
      return val < 1e-14 ? 0 : val;
    }
  }
};

export function getObjective(id) {
  return OBJECTIVES[id] || OBJECTIVES.sphere;
}

export function clampCoord(val, min, max) {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

