import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const jakartaPath = path.join(rootDir, 'public', 'fonts', 'PlusJakartaSans-VariableFont_wght.ttf');
const monoPath = path.join(rootDir, 'public', 'fonts', 'UbuntuMono-R.ttf');

const jakartaB64 = fs.readFileSync(jakartaPath).toString('base64');
const monoB64 = fs.readFileSync(monoPath).toString('base64');

const css = `/* Auto-generated local bundled fonts (100% offline & file:// CORS-safe) */
@font-face {
  font-family: 'Plus Jakarta Display';
  src: url('data:font/ttf;base64,${jakartaB64}') format('truetype');
  font-weight: 600 800;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('data:font/ttf;base64,${jakartaB64}') format('truetype');
  font-weight: 300 800;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'Ubuntu Mono'; /* taste-skill-ignore: registers code font face */
  src: url('data:font/ttf;base64,${monoB64}') format('truetype');
  font-weight: 400 700;
  font-style: normal;
  font-display: block;
}
`;

const outPath = path.join(rootDir, 'src', 'styles', 'fonts.css');
fs.writeFileSync(outPath, css, 'utf8');
console.log('Generated src/styles/fonts.css (' + Math.round(css.length / 1024) + ' KB)');

