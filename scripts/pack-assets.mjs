/**
 * Re-encodes a binary asset back into assets-src/binary-assets.json.
 *
 *   node scripts/pack-assets.mjs public/images/new-hero.webp
 *   node scripts/pack-assets.mjs public/og-image.jpg public/favicon.ico
 *
 * Use this after replacing an image on disk so the change is committed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'assets-src/binary-assets.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error('usage: node scripts/pack-assets.mjs <file> [...files]');
  process.exit(1);
}

for (const input of inputs) {
  const abs = resolve(process.cwd(), input);
  const key = relative(root, abs).split('\\').join('/');
  manifest[key] = readFileSync(abs).toString('base64');
  console.log(`[assets] packed ${key}`);
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestPath, JSON.stringify(sorted, null, 0) + '\n');
console.log('[assets] assets-src/binary-assets.json updated');
