/**
 * build-data.mjs
 * Searches the Library of Congress for images matching Lantern/New Mercy criteria.
 * Writes results to data/archive-data.json for publication.
 *
 * Run: node scripts/build-data.mjs
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

mkdirSync('data', { recursive: true });

// ── SEARCH TERMS ──────────────────────────────────────────────────────────────
// From Hunter's Guide. GitHub rotates through these on each run.
const SEARCH_TERMS = [
  // Weirdness
  'fortune teller', 'circus sideshow', 'spirit photography', 'séance mediums',
  'ventriloquist dummy', 'medical curiosities', 'Halloween mask', 'taxidermy',
  'patent medicine', 'World\'s Fair', 'wax figures', 'automatons', 'stereographs',
  // People at work
  'blacksmith', 'lighthouse keeper', 'switchboard operator', 'telegraph operator',
  'shipyard worker', 'oyster shucker', 'beekeeper', 'taxidermist', 'embalmer',
  'deep sea diver', 'mapmaker', 'watchmaker', 'printer', 'bookbinder', 'ferryman',
  // Southern Gothic
  'revival meeting', 'baptism ceremony', 'folk religion', 'hoodoo rootwork',
  'weathered church', 'rural poverty', 'Southern funerary',
  // Americana
  'county fair', 'roadside attraction', 'river town', 'barbershop',
  'family business', 'agricultural community',
  // Spiritualism / occult (use historical language)
  'spiritualism', 'mesmerism', 'fortune telling', 'astrology witchcraft',
  'superstition ghosts', 'psychical research',
  // Portraits
  'occupational portrait', 'carnival worker', 'railroad worker', 'religious figure',
  'folk practitioner',
];

// Fields to extract from LOC API
const LOC_API_BASE = 'https://www.loc.gov/photos/';

// How many items to fetch per search term per run
const PER_TERM = 5;
// Maximum total records to add per run (keeps runs fast)
const MAX_NEW_PER_RUN = 50;

// ── EXISTING DATA ─────────────────────────────────────────────────────────────
let existing = [];
if (existsSync('data/archive-data.json')) {
  try {
    existing = JSON.parse(readFileSync('data/archive-data.json', 'utf8'));
  } catch {
    existing = [];
  }
}
const existingUrls = new Set(existing.map(r => r.sourceUrl).filter(Boolean));
console.log(`Existing records: ${existing.length}`);

// ── LOC API FETCH ─────────────────────────────────────────────────────────────
async function searchLOC(term, count = PER_TERM) {
  const url = new URL('https://www.loc.gov/photos/');
  url.searchParams.set('q', term);
  url.searchParams.set('fo', 'json');
  url.searchParams.set('c', count);
  url.searchParams.set('at', 'results,pagination');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
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

// ── RECORD BUILDER ─────────────────────────────────────────────────────────────
function buildRecord(item) {
  // Find best image URL
  const imgSrc = item.image_url?.[0]
    || item.resources?.[0]?.url
    || item.thumbnail
    || '';

  const sourceUrl = item.url || item.id || '';

  // Skip if no image
  if (!imgSrc || !sourceUrl) return null;
  // Skip if already in dataset
  if (existingUrls.has(sourceUrl)) return null;

  const title = item.title || item.aka?.[0] || 'Untitled';
  const dateAdded = new Date().toISOString().slice(0, 10);

  // Time period from date
  const rawDate = item.date || item.dates?.[0] || '';
  const year = parseInt(rawDate?.match(/\d{4}/)?.[0] || '0', 10);
  let timePeriod = 'Unknown';
  if (year) {
    if (year < 1800) timePeriod = 'Pre-1800';
    else if (year <= 1849) timePeriod = '1800–1849';
    else if (year <= 1899) timePeriod = '1850–1899';
    else if (year <= 1919) timePeriod = '1900–1919';
    else if (year <= 1939) timePeriod = '1920–1939';
    else if (year <= 1959) timePeriod = '1940–1959';
    else if (year <= 1979) timePeriod = '1960–1979';
    else if (year <= 1999) timePeriod = '1980–1999';
    else timePeriod = '2000–Present';
  }

  // Medium
  const formats = (item.original_format || []).join(' ').toLowerCase();
  let medium = 'Photography';
  if (formats.includes('print') || formats.includes('lithograph')) medium = 'Print';
  if (formats.includes('illustration') || formats.includes('drawing')) medium = 'Illustration';

  // Image style
  const description = (item.description || []).join(' ').toLowerCase();
  let image_style = 'Unknown';
  if (description.includes('black and white') || description.includes('b&w')) image_style = 'B&W';
  else if (description.includes('color') || description.includes('colour')) image_style = 'Color';
  else if (description.includes('sepia')) image_style = 'Sepia';
  else if (description.includes('tintype')) image_style = 'Tintype';

  // Caption from description
  const caption = Array.isArray(item.description)
    ? item.description[0] || ''
    : item.description || '';

  // Collection
  const collection_title = item.partof?.[0]?.title
    || item.collection?.title
    || 'Library of Congress';

  // Tags from subject headings
  const rawSubjects = [
    ...(item.subject || []),
    ...(item.subject_headings || []),
  ].map(s => (typeof s === 'string' ? s : s.title || '').toLowerCase());

  const tags = rawSubjects
    .slice(0, 8)
    .map(s => '#' + s.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
    .filter(t => t.length > 1);

  return {
    title,
    imgSrc,
    sourceUrl,
    caption,
    subjects: [],
    tags,
    medium,
    image_style,
    people_count: 'Unknown',
    shot: 'Unknown',
    location_type: 'Unknown',
    continent: 'North America',
    time_period: timePeriod,
    dateAdded,
    source_id: 'SRC-LOC',
    collection_title,
    source_type: 'A',
  };
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  const newRecords = [];

  // Rotate search terms based on day so each run covers different ground
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
        console.log(`  + ${record.title}`);
      }
    }

    // Be polite to LOC API
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nNew records found: ${newRecords.length}`);

  const combined = [...newRecords, ...existing];

  writeFileSync(
    'data/archive-data.json',
    `${JSON.stringify(combined, null, 2)}\n`,
  );

  // References gallery stays empty for now
  writeFileSync('data/references-data.json', '[]\n');

  console.log(`Total records: ${combined.length}`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
