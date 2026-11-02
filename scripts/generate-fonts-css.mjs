import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const interPath = path.join(rootDir, 'public', 'fonts', 'Inter-Variable.ttf');
const monoPath = path.join(rootDir, 'public', 'fonts', 'JetBrainsMono-Variable.ttf');

const interB64 = fs.readFileSync(interPath).toString('base64');
const monoB64 = fs.readFileSync(monoPath).toString('base64');

const css = `/* Auto-generated local bundled fonts (100% offline & file:// CORS-safe) */
@font-face {
  font-family: 'Inter';
  src: url('data:font/ttf;base64,${interB64}') format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('data:font/ttf;base64,${monoB64}') format('truetype');
  font-weight: 100 800;
  font-style: normal;
  font-display: block;
}
`;

const outPath = path.join(rootDir, 'src', 'styles', 'fonts.css');
fs.writeFileSync(outPath, css, 'utf8');
console.log('Generated src/styles/fonts.css (' + Math.round(css.length / 1024) + ' KB)');
