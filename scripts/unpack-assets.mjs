/**
 * Unpacks the site's binary assets (images, icons, social share image) from
 * assets-src/binary-assets.json into public/ before dev and build.
 *
 * Why they live as base64 text: the tooling used to maintain this repo can only
 * write text files, so the binaries are stored encoded and materialised here.
 * They are gitignored in public/ — this file is the source of truth.
 *
 * Replacing an image with a real file? Two options:
 *   1. Drop the file into public/ locally and remove its entry from
 *      assets-src/binary-assets.json, then un-ignore it in .gitignore. Or
 *   2. Re-encode it:  node scripts/pack-assets.mjs public/images/your-file.webp
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'assets-src/binary-assets.json');

if (!existsSync(manifestPath)) {
  console.warn('[assets] no assets-src/binary-assets.json — nothing to unpack');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
let written = 0;

for (const [relPath, base64] of Object.entries(manifest)) {
  const outPath = resolve(root, relPath);
  const bytes = Buffer.from(base64, 'base64');

  // Skip if already identical — keeps rebuilds fast and avoids touching mtimes.
  if (existsSync(outPath) && Buffer.compare(readFileSync(outPath), bytes) === 0) continue;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, bytes);
  written++;
}

console.log(
  `[assets] ${Object.keys(manifest).length} asset(s) ready` +
    (written ? `, ${written} written` : ' (all up to date)')
);
