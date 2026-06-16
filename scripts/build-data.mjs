/**
 * build-data.mjs
 * Searches the Smithsonian Open Access API for images matching Lantern/New Mercy
 * criteria and writes results to data/archive-data.json for publication.
 *
 * Why Smithsonian instead of LOC: the Library of Congress blocks requests coming
 * from data-center IPs (which is what GitHub Actions runs on), returning 403 to
 * every request. The Smithsonian Open Access API is built for automated access
 * and works fine from GitHub. It returns public-domain (CC0) images as JSON.
 *
 * Requires a free api.data.gov key, stored as the repo secret SMITHSONIAN_API_KEY.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

mkdirSync('data', { recursive: true });

const API_KEY = process.env.SMITHSONIAN_API_KEY;
const API_BASE = 'https://api.si.edu/openaccess/api/v1.0/search';

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

const PER_TERM = 8;
const MAX_NEW_PER_RUN = 50;
const PAGE_WINDOW = 12;

// Read existing records — check both possible locations.
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

function resultStartFor(termIndex, attempt = 0) {
  const dayIndex = Math.floor(Date.now() / 86400000);
  const page = (dayIndex + termIndex + attempt) % PAGE_WINDOW;
  return page * PER_TERM;
}

async function searchSmithsonian(term, count = PER_TERM, start = 0) {
  if (!API_KEY) {
    console.error('Missing SMITHSONIAN_API_KEY. Add it as a repo secret (Settings -> Secrets and variables -> Actions).');
    return [];
  }

  const url = new URL(API_BASE);
  url.searchParams.set('api_key', API_KEY);
  // Only return objects that actually have images.
  url.searchParams.set('q', `${term} AND online_media_type:"Images"`);
  url.searchParams.set('start', String(start));
  url.searchParams.set('rows', String(count));

  try {
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const body = await res.text();
      console.warn(`Smithsonian "${term}" start ${start} -> HTTP ${res.status}: ${body.slice(0, 200)}`);
      return [];
    }
    const data = await res.json();
    const rows = data?.response?.rows || [];
    console.log(`  ${term} start ${start}: ${rows.length} raw results`);
    return rows;
  } catch (err) {
    console.warn(`Smithsonian fetch error for "${term}":`, err.message);
    return [];
  }
}

function buildRecord(item) {
  const content = item.content || {};
  const dnr = content.descriptiveNonRepeating || {};
  const indexed = content.indexedStructured || {};
  const freetext = content.freetext || {};

  // Image URL: prefer a CC0 image, fall back to first available media.
  const media = dnr.online_media?.media || [];
  const cc0 = media.find(m => m?.usage?.access === 'CC0' && m?.type === 'Images');
  const chosen = cc0 || media[0] || {};
  const imgSrc = chosen.content || chosen.thumbnail || '';
  const sourceUrl = dnr.record_link || dnr.guid || item.id || '';

  if (!imgSrc || !sourceUrl) return null;
  if (existingUrls.has(sourceUrl) || existingUrls.has(imgSrc)) return null;

  const title = dnr.title?.content || item.title || 'Untitled';
  const dateAdded = new Date().toISOString().slice(0, 10);

  // Year: scan the likely date fields for a 4-digit year.
  const dateCandidates = [
    ...(indexed.date || []),
    ...((freetext.date || []).map(d => d?.content || '')),
  ].join(' ');
  const year = parseInt(dateCandidates.match(/\d{4}/)?.[0] || '0', 10);
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

  const objectType = (indexed.object_type || []).join(' ').toLowerCase();
  let medium = 'Photography';
  if (objectType.includes('print') || objectType.includes('lithograph')) medium = 'Print';
  if (objectType.includes('illustration') || objectType.includes('drawing')) medium = 'Illustration';

  const notes = (freetext.notes || []).map(n => n?.content || '').join(' ');
  const caption = (freetext.notes?.[0]?.content) || dnr.title?.content || '';

  const collection_title =
    (freetext.setName?.[0]?.content) ||
    (dnr.data_source) ||
    'Smithsonian Institution';

  const topics = (indexed.topic || []).map(t => (typeof t === 'string' ? t : t?.content || ''));
  const tags = topics.slice(0, 8)
    .map(s => '#' + s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
    .filter(t => t.length > 1);

  let image_style = 'Unknown';
  const blob = (notes + ' ' + caption).toLowerCase();
  if (blob.includes('black and white') || blob.includes('b&w')) image_style = 'B&W';
  else if (blob.includes('sepia')) image_style = 'Sepia';
  else if (blob.includes('tintype')) image_style = 'Tintype';
  else if (blob.includes('color') || blob.includes('colour')) image_style = 'Color';

  return {
    title, imgSrc, sourceUrl, caption,
    subjects: [], tags, medium, image_style,
    people_count: 'Unknown', shot: 'Unknown',
    location_type: 'Unknown', continent: 'North America',
    time_period, dateAdded,
    source_id: 'SRC-SI', collection_title, source_type: 'A',
  };
}

async function main() {
  const newRecords = [];
  const dayIndex = Math.floor(Date.now() / 86400000);
  const offset = dayIndex % SEARCH_TERMS.length;
  const rotated = [...SEARCH_TERMS.slice(offset), ...SEARCH_TERMS.slice(0, offset)];

  for (let termIndex = 0; termIndex < rotated.length; termIndex += 1) {
    if (newRecords.length >= MAX_NEW_PER_RUN) break;
    const term = rotated[termIndex];
    console.log(`Searching Smithsonian: "${term}"`);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (newRecords.length >= MAX_NEW_PER_RUN) break;
      const results = await searchSmithsonian(term, PER_TERM, resultStartFor(termIndex, attempt));
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
      await new Promise(r => setTimeout(r, 250));
      if (newRecords.length && attempt === 0) break;
    }
  }

  console.log(`\nNew records found: ${newRecords.length}`);
  const combined = [...newRecords, ...existing];
  writeFileSync('data/archive-data.json', `${JSON.stringify(combined, null, 2)}\n`);
  writeFileSync('data/references-data.json', '[]\n');
  console.log(`Total records: ${combined.length}`);
}

main().catch(err => { console.error('Build failed:', err); process.exit(1); });
