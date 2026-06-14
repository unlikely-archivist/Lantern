import { readFileSync } from 'node:fs';

const files = ['data/archive-data.json', 'data/references-data.json'];

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`${file} must contain a JSON array.`);
  }

  parsed.forEach((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`${file}[${index}] must be an object.`);
    }

    if (!record.title && !record.name) {
      throw new Error(`${file}[${index}] is missing title/name.`);
    }

    if (record.tags && !Array.isArray(record.tags)) {
      throw new Error(`${file}[${index}].tags must be an array when present.`);
    }
  });
}

console.log('Lantern data files are valid.');
