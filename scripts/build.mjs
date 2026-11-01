import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

function normalizeId(absPath) {
  return path.relative(srcDir, absPath).split(path.sep).join('/');
}

function transformModule(code, absFilePath, collectDependency) {
  const fileDir = path.dirname(absFilePath);
  const exportedNames = [];

  // Transform static imports: import { a, b as c } from './x.js' or import * as ns from './x.js'
  let transformed = code.replace(
    /^\s*import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]\s*;?/gm,
    (_match, clause, spec) => {
      const resolved = path.resolve(fileDir, spec);
      const depId = normalizeId(resolved);
      collectDependency(resolved);

      const trimmed = clause.trim();
      if (trimmed.startsWith('* as ')) {
        const ns = trimmed.slice(5).trim();
        return `const ${ns} = __require(${JSON.stringify(depId)});`;
      }
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const inner = trimmed
          .slice(1, -1)
          .replace(/\bas\b/g, ':');
        return `const { ${inner} } = __require(${JSON.stringify(depId)});`;
      }
      return `const ${trimmed} = __require(${JSON.stringify(depId)}).default;`;
    }
  );

  // Transform export function Name / export async function Name
  transformed = transformed.replace(
    /^\s*export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)/gm,
    (_m, asyncKw = '', name) => {
      exportedNames.push({ local: name, exported: name });
      return `${asyncKw}function ${name}`;
    }
  );

  // Transform export class Name
  transformed = transformed.replace(
    /^\s*export\s+class\s+([A-Za-z0-9_$]+)/gm,
    (_m, name) => {
      exportedNames.push({ local: name, exported: name });
      return `class ${name}`;
    }
  );

  // Transform export const/let/var Name
  transformed = transformed.replace(
    /^\s*export\s+(const|let|var)\s+([A-Za-z0-9_$]+)/gm,
    (_m, kind, name) => {
      exportedNames.push({ local: name, exported: name });
      return `${kind} ${name}`;
    }
  );

  // Transform export { a, b as c }
  transformed = transformed.replace(
    /^\s*export\s*\{([^}]+)\}\s*;?/gm,
    (_m, list) => {
      for (const item of list.split(',')) {
        const part = item.trim();
        if (!part) continue;
        const [local, exported] = part.split(/\s+as\s+/).map((s) => s.trim());
        exportedNames.push({ local, exported: exported || local });
      }
      return '';
    }
  );

  const exportLines = exportedNames
    .map(({ local, exported }) => `exports.${exported} = ${local};`)
    .join('\n  ');

  return `${transformed}\n  ${exportLines}`;
}

function buildBundle(entryAbsPath) {
  const visited = new Map();

  function visit(absPath) {
    const id = normalizeId(absPath);
    if (visited.has(id)) return;
    visited.set(id, ''); // placeholder to prevent cycles
    const raw = fs.readFileSync(absPath, 'utf8');
    const deps = [];
    const body = transformModule(raw, absPath, (depAbs) => deps.push(depAbs));
    for (const dep of deps) {
      visit(dep);
    }
    visited.set(id, body);
  }

  visit(entryAbsPath);

  const modulesStr = Array.from(visited.entries())
    .map(
      ([id, body]) =>
        `  ${JSON.stringify(id)}: function(exports, __require) {\n${body}\n  }`
    )
    .join(',\n');

  const entryId = normalizeId(entryAbsPath);
  return `/* Auto-generated offline bundle for SFLA & WCA Interactive Presentation */
(function(modules) {
  const cache = Object.create(null);
  function __require(id) {
    if (cache[id]) return cache[id].exports;
    if (!modules[id]) throw new Error('Module not found: ' + id);
    const mod = { exports: {} };
    cache[id] = mod;
    modules[id](mod.exports, __require);
    return mod.exports;
  }
  __require(${JSON.stringify(entryId)});
})({
${modulesStr}
});
`;
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

const entry = path.join(srcDir, 'main.js');
const bundleCode = buildBundle(entry);

const publicBundlePath = path.join(rootDir, 'public', 'app.bundle.js');
fs.writeFileSync(publicBundlePath, bundleCode, 'utf8');

// Verify syntax using node --check
execFileSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', '--check', publicBundlePath], { stdio: 'inherit' });

// Also build standalone dist/ folder for static deployment / flashdisk copy
const distDir = path.join(rootDir, 'dist');
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));
copyRecursive(path.join(rootDir, 'public'), path.join(distDir, 'public'));
copyRecursive(path.join(rootDir, 'src'), path.join(distDir, 'src'));

console.log(
  `Build berhasil: public/app.bundle.js (${Math.round(bundleCode.length / 1024)} KB) & folder dist/ siap dipakai offline.`
);
