/**
 * build-data.mjs
 *
 * The Lantern has been reset to its site bones.
 *
 * This script intentionally does not harvest new records. It only guarantees that
 * the expected JSON data files exist and remain valid arrays. Re-enable source
 * harvesting later only after the new Lantern selection system is decided.
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

mkdirSync('data', { recursive: true });

for (const file of ['data/archive-data.json', 'data/references-data.json']) {
  if (!existsSync(file)) {
    writeFileSync(file, '[]\n');
  }
}

console.log('Lantern data scaffold is present. Automatic harvesting is disabled.');
