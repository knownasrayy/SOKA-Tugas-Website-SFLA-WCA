import { DeckController } from './ui/navigation.js';
import { slides } from './slides/index.js';

// Polyfill ringan CanvasRenderingContext2D.roundRect untuk kompatibilitas proyektor/browser lama
if (
  typeof CanvasRenderingContext2D !== 'undefined' &&
  !CanvasRenderingContext2D.prototype.roundRect
) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 0) {
    const rad = typeof r === 'number' ? Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2) : 0;
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

function bootstrap() {
  const deck = new DeckController(slides);
  deck.init();
  window.__SFLA_WCA_DECK__ = deck;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
