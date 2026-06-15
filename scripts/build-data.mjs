/**
 * build-data.mjs
 * Searches the Library of Congress for images matching Lantern/New Mercy criteria.
 * Writes results to data/archive-data.json for publication.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

mkdirSync('data', { recursive: true });

const SEARCH_TERMS = [
  'fortune teller', 'circus sideshow', 'spirit photography',
  'ventriloquist dummy', 'medical curiosities', 'taxidermy',
  'patent medicine', 'wax figures', 'stereographs',
  'blacksmith', 'lighthouse keeper', 'switchboard operator',
  'telegraph operator', 'shipyard worker', 'beekeeper',
  'embalmer', 'deep sea diver', 'watchmaker', 'bookbinder',
  'revival meeting', 'baptism ceremony', 'county fair',
  'roadside attraction', 'barbershop', 'spiritualism',
  'mesmerism', 'fortune telling', 'psychical research',
  'occupational portrait', 'carnival worker', 'railroad worker',
];

const PER_TERM = 5;
const MAX_NEW_PER_RUN = 50;

// Read existing records — check both possible locations
let existing = [];
for (const path of ['data/archive-data.json', 'lantern-data.json']) {
  if (existsSync(path)) {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      if (Array.isArray(raw) && raw.length > existing.length) existing = raw;
    } catch {}
  }
}
const existingUrls = new Set(existing.map(r => r.sourceUrl || r.imgSrc).filter(Boolean));
console.log(`Existing records: ${existing.length}`);

async function searchLOC(term, count = PER_TERM) {
  const url = new URL('https://www.loc.gov/photos/');
  url.searchParams.set('q', term);
  url.searchParams.set('fo', 'json');
  url.searchParams.set('c', String(count));
  url.searchParams.set('at', 'results,pagination');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'LanternArchive/1.0 (https://unlikely-archivist.github.io/Lantern; archival research project)',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      console.warn(`LOC search failed for "${term}": ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn(`LOC fetch error for "${term}":`, err.message);
    return [];
  }
}

function buildRecord(item) {
  const imgSrc = item.image_url?.[0]
    || item.resources?.[0]?.url
    || item.thumbnail
    || '';
  const sourceUrl = item.url || item.id || '';
  if (!imgSrc || !sourceUrl) return null;
  if (existingUrls.has(sourceUrl) || existingUrls.has(imgSrc)) return null;

  const title = item.title || item.aka?.[0] || 'Untitled';
  const dateAdded = new Date().toISOString().slice(0, 10);

  const rawDate = item.date || item.dates?.[0] || '';
  const year = parseInt(rawDate?.match(/\d{4}/)?.[0] || '0', 10);
  let time_period = 'Unknown';
  if (year) {
    if (year < 1800) time_period = 'Pre-1800';
    else if (year <= 1849) time_period = '1800–1849';
    else if (year <= 1899) time_period = '1850–1899';
    else if (year <= 1919) time_period = '1900–1919';
    else if (year <= 1939) time_period = '1920–1939';
    else if (year <= 1959) time_period = '1940–1959';
    else if (year <= 1979) time_period = '1960–1979';
    else if (year <= 1999) time_period = '1980–1999';
    else time_period = '2000–Present';
  }

  const formats = (item.original_format || []).join(' ').toLowerCase();
  let medium = 'Photography';
  if (formats.includes('print') || formats.includes('lithograph')) medium = 'Print';
  if (formats.includes('illustration') || formats.includes('drawing')) medium = 'Illustration';

  const desc = (Array.isArray(item.description) ? item.description.join(' ') : item.description || '').toLowerCase();
  let image_style = 'Unknown';
  if (desc.includes('black and white') || desc.includes('b&w')) image_style = 'B&W';
  else if (desc.includes('color') || desc.includes('colour')) image_style = 'Color';
  else if (desc.includes('sepia')) image_style = 'Sepia';
  else if (desc.includes('tintype')) image_style = 'Tintype';

  const caption = Array.isArray(item.description) ? item.description[0] || '' : item.description || '';
  const collection_title = item.partof?.[0]?.title || item.collection?.title || 'Library of Congress';

  const rawSubjects = [...(item.subject || []), ...(item.subject_headings || [])]
    .map(s => (typeof s === 'string' ? s : s.title || '').toLowerCase());
  const tags = rawSubjects.slice(0, 8)
    .map(s => '#' + s.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
    .filter(t => t.length > 1);

  return {
    title, imgSrc, sourceUrl, caption,
    subjects: [], tags, medium, image_style,
    people_count: 'Unknown', shot: 'Unknown',
    location_type: 'Unknown', continent: 'North America',
    time_period, dateAdded,
    source_id: 'SRC-LOC', collection_title, source_type: 'A',
  };
}

async function main() {
  const newRecords = [];
  const dayIndex = Math.floor(Date.now() / 86400000);
  const rotated = [...SEARCH_TERMS.slice(dayIndex % SEARCH_TERMS.length), ...SEARCH_TERMS.slice(0, dayIndex % SEARCH_TERMS.length)];

  for (const term of rotated) {
    if (newRecords.length >= MAX_NEW_PER_RUN) break;
    console.log(`Searching LOC: "${term}"`);
    const results = await searchLOC(term, PER_TERM);
    for (const item of results) {
      if (newRecords.length >= MAX_NEW_PER_RUN) break;
      const record = buildRecord(item);
      if (record) {
        newRecords.push(record);
        existingUrls.add(record.sourceUrl);
        existingUrls.add(record.imgSrc);
        console.log(`  + ${record.title}`);
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nNew records found: ${newRecords.length}`);
  const combined = [...newRecords, ...existing];
  writeFileSync('data/archive-data.json', `${JSON.stringify(combined, null, 2)}\n`);
  writeFileSync('data/references-data.json', '[]\n');
  console.log(`Total records: ${combined.length}`);
}

main().catch(err => { console.error('Build failed:', err); process.exit(1); });
