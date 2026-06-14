import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('data', { recursive: true });

const archive = [];
const references = [];

writeFileSync('data/archive-data.json', `${JSON.stringify(archive, null, 2)}\n`);
writeFileSync('data/references-data.json', `${JSON.stringify(references, null, 2)}\n`);

console.log('Spreadsheet import is not configured yet. Published Lantern data remains empty.');
console.log('Next setup step: wire this script to the Approved JSON sheet once the sheet has live rows and the Approved JSON gid is confirmed.');
