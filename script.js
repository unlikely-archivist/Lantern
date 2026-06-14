const ARCHIVE_FILTERS = {
  subjects: { target: document.querySelector('#archiveSubjects'), values: ['Character Studies','Death Culture','Belief & Divination','Religious Practice','Performance','Institutional Life','Roadside America','Material Culture','Maintenance & Service Work','Occupational Life'] },
  imageStyle: { target: document.querySelector('#archiveImageStyle'), values: ['B&W','Color','Sepia','Tintype','Mixed','Unknown'] },
  peopleCount: { target: document.querySelector('#archivePeopleCount'), values: ['None','One Person','Two People','Small Group','Crowd','Unknown'] },
  shot: { target: document.querySelector('#archiveShot'), values: ['Close','Medium','Wide','Unknown'] },
  locationType: { target: document.querySelector('#archiveLocationType'), values: ['Studio','Interior','Exterior','Unknown'] },
  continent: { target: document.querySelector('#archiveContinent'), values: ['North America','South America','Europe','Africa','Asia','Antarctica','Unknown'] },
  timePeriod: { target: document.querySelector('#archiveTimePeriod'), values: ['Pre-1800','1800–1849','1850–1899','1900–1919','1920–1939','1940–1959','1960–1979','1980–1999','2000–Present','Unknown'] },
  medium: { target: document.querySelector('#archiveMedium'), values: ['Photography','Illustration','Print'] }
};

const SOURCES = {
  archive: { url: 'data/archive-data.json', grid: document.querySelector('#archiveGrid'), count: document.querySelector('#archiveCount'), search: document.querySelector('#archiveSearch'), empty: 'No approved archive records yet.' },
  references: { url: 'data/references-data.json', grid: document.querySelector('#referencesGrid'), count: document.querySelector('#referencesCount'), search: document.querySelector('#referencesSearch'), empty: 'No art reference records have been published yet.' }
};

const activeSources = Object.fromEntries(Object.entries(SOURCES).filter(([, config]) => config.grid));
const state = { archive: [], references: [] };

function normalizeTag(tag) { const value = String(tag || '').trim(); return value ? (value.startsWith('#') ? value : `#${value}`) : ''; }
function normalizeTerm(value) { return String(value || '').trim(); }
function parseList(value) { if (Array.isArray(value)) return value.map(normalizeTerm).filter(Boolean); if (typeof value === 'string') return value.split(',').map(normalizeTerm).filter(Boolean); return []; }
function parseTags(value) { return parseList(value).map(normalizeTag).filter(Boolean); }
function normalizePeopleCount(value) { const n = normalizeTerm(value).toLowerCase(); if (!n) return 'Unknown'; if (['none','no people','0'].includes(n)) return 'None'; if (['single','one','one person','1'].includes(n)) return 'One Person'; if (['pair','two','two people','2'].includes(n)) return 'Two People'; if (['multi','multiple','group','small group'].includes(n)) return 'Small Group'; if (['crowd','crowded'].includes(n)) return 'Crowd'; return value || 'Unknown'; }
function normalizeImageStyle(record) { return record.image_style || record.imageStyle || record.color || 'Unknown'; }
function normalizeLocationType(record) { return record.location_type || record.locationType || record.loc || 'Unknown'; }
function normalizeMedium(record) { return record.medium || record.media || 'Unknown'; }
function normalizeTimePeriod(record) {
  const explicit = record.time_period || record.timePeriod || record.period;
  if (explicit) return explicit;
  const dateText = String(record.date || record.originalDate || record.year || '').match(/\d{4}/)?.[0];
  if (!dateText) return 'Unknown';
  const year = Number(dateText);
  if (year < 1800) return 'Pre-1800';
  if (year <= 1849) return '1800–1849';
  if (year <= 1899) return '1850–1899';
  if (year <= 1919) return '1900–1919';
  if (year <= 1939) return '1920–1939';
  if (year <= 1959) return '1940–1959';
  if (year <= 1979) return '1960–1979';
  if (year <= 1999) return '1980–1999';
  return '2000–Present';
}
function inferSubjects(record, tags) {
  const existingSubjects = parseList(record.subjects || record.subject);
  const text = [record.title, record.caption, record.notes, record.description, ...tags].join(' ').toLowerCase();
  const subjects = new Set(existingSubjects);
  if (text.match(/character|portrait|undertaker|fortune|watchman|guard|janitor|peddler|keeper|attendant|carpenter|blacksmith|seamstress|cooper/)) subjects.add('Character Studies');
  if (text.match(/work|occupation|labor|attendant|guard|keeper|janitor|carpenter|blacksmith|seamstress|cooper|watchmaker|peddler|agriculture|service/)) subjects.add('Occupational Life');
  if (text.match(/death|undertaker|embalm|funeral|mourning|cemetery|burial/)) subjects.add('Death Culture');
  if (text.match(/fortune|divination|spiritualism|seance|medium|occult|astrology|houdini/)) subjects.add('Belief & Divination');
  if (text.match(/religion|ritual|baptism|temple|monastery|shrine/)) subjects.add('Religious Practice');
  if (text.match(/performance|puppet|theater|television|medicine show|stage/)) subjects.add('Performance');
  if (text.match(/institution|college|government|capitol|census|zoo|plant|lighthouse/)) subjects.add('Institutional Life');
  if (text.match(/roadside|service station|truck stop|fair|americana|louisiana|tennessee|mississippi|south/)) subjects.add('Roadside America');
  if (text.match(/tools|broom|barrel|machine|book|poster|print|object|material/)) subjects.add('Material Culture');
  if (text.match(/maintenance|service|janitor|security|guard|keeper|attendant/)) subjects.add('Maintenance & Service Work');
  return [...subjects];
}
function normalizeRecord(record) {
  const tags = parseTags(record.final_tags || record.finalTags || record.tags);
  return {
    title: record.title || record.name || 'Untitled record',
    medium: normalizeMedium(record),
    imgSrc: record.imgSrc || record.imageUrl || record.image_url || record.thumbnail || '',
    sourceUrl: record.sourceUrl || record.source_url || record.url || '',
    dateAdded: record.dateAdded || record.date_added || '',
    sortDate: Date.parse(record.dateAdded || record.date_added || record.date || record.originalDate || '') || 0,
    subjects: inferSubjects(record, tags),
    tags,
    caption: record.caption || record.notes || record.description || '',
    imageStyle: normalizeImageStyle(record),
    peopleCount: normalizePeopleCount(record.people_count || record.peopleCount || record.people),
    shot: record.shot || 'Unknown',
    locationType: normalizeLocationType(record),
    continent: record.continent || 'Unknown',
    timePeriod: normalizeTimePeriod(record)
  };
}
async function loadJson(url) { try { const response = await fetch(url, { cache: 'no-store' }); if (!response.ok) return []; const data = await response.json(); return Array.isArray(data) ? data.map(normalizeRecord).sort((a, b) => b.sortDate - a.sortDate || a.title.localeCompare(b.title)) : []; } catch (error) { console.warn(`Could not load ${url}`, error); return []; } }
function selectedValues(filterKey) { return [...document.querySelectorAll(`[data-filter-key="${filterKey}"]:checked`)].map((input) => input.value); }
function searchableText(record) { return [record.title, record.medium, record.caption, record.imageStyle, record.peopleCount, record.shot, record.locationType, record.continent, record.timePeriod, ...record.subjects, ...record.tags].join(' ').toLowerCase(); }
function recordMatchesSelectedValues(record, key, selected) { if (!selected.length) return true; const value = record[key]; if (Array.isArray(value)) return selected.every((item) => value.includes(item)); return selected.includes(value); }
function filterRecords(section) {
  const config = activeSources[section];
  if (!config) return [];
  const query = config.search?.value.trim().toLowerCase() || '';
  return state[section].filter((record) => {
    const matchesQuery = !query || searchableText(record).includes(query);
    if (section !== 'archive') return matchesQuery;
    return matchesQuery && Object.keys(ARCHIVE_FILTERS).every((key) => recordMatchesSelectedValues(record, key, selectedValues(key)));
  });
}
function renderFilterOptions() {
  if (!activeSources.archive) return;
  Object.entries(ARCHIVE_FILTERS).forEach(([key, filter]) => {
    if (!filter.target) return;
    const available = new Set();
    state.archive.forEach((record) => { const value = record[key]; if (Array.isArray(value)) value.forEach((item) => available.add(item)); else if (value) available.add(value); });
    const values = filter.values.filter((value) => available.has(value));
    filter.target.innerHTML = values.length ? values.map((value) => `<label class="filter-option"><input type="checkbox" value="${escapeAttribute(value)}" data-filter-key="${key}" /><span>${escapeHtml(value)}</span></label>`).join('') : '<p class="filter-empty">No values yet</p>';
  });
  document.querySelectorAll('[data-filter-key]').forEach((input) => input.addEventListener('change', () => render('archive')));
}
function renderCard(record) {
  const shownTags = record.tags.slice(0, 6).map((tag) => `<a class="tag-pill" href="index.html?tag=${encodeURIComponent(tag)}#archive">${escapeHtml(tag)}</a>`).join('');
  const moreTagCount = record.tags.length > 6 ? `<span class="tag-more">+${record.tags.length - 6}</span>` : '';
  const img = record.imgSrc ? `<img src="${escapeAttribute(record.imgSrc)}" alt="${escapeAttribute(record.title)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'), { className: 'img-fallback', textContent: 'Image unavailable' }))" />` : '<div class="img-fallback">No image yet</div>';
  const source = record.sourceUrl ? `<a class="card-link" href="${escapeAttribute(record.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>` : '';
  const meta = [record.medium, record.imageStyle, record.peopleCount, record.shot, record.locationType, record.continent, record.timePeriod].filter((value) => value && value !== 'Unknown').join(' · ');
  return `<article class="card"><div class="card-img-wrap">${img}</div><div class="card-body"><h3 class="card-title">${escapeHtml(record.title)}</h3>${meta ? `<p class="card-meta">${escapeHtml(meta)}</p>` : ''}${record.caption ? `<p class="card-caption">${escapeHtml(record.caption)}</p>` : ''}${record.subjects.length ? `<p class="card-subjects">${escapeHtml(record.subjects.slice(0, 3).join(' · '))}</p>` : ''}${shownTags ? `<div class="card-tags">${shownTags}${moreTagCount}</div>` : ''}${source}</div></article>`;
}
function render(section) { const config = activeSources[section]; if (!config) return; const records = filterRecords(section); config.count.textContent = `${records.length} shown / ${state[section].length} total`; config.grid.innerHTML = records.length ? records.map(renderCard).join('') : `<div class="empty-state">${config.empty}</div>`; }
function reset(section) { const config = activeSources[section]; if (!config) return; if (config.search) config.search.value = ''; if (section === 'archive') document.querySelectorAll('[data-filter-key]').forEach((input) => { input.checked = false; }); render(section); }
function applyTagFromUrl() { const tag = new URLSearchParams(window.location.search).get('tag'); if (!tag) return; const normalizedTag = normalizeTag(tag); if (activeSources.archive?.search) activeSources.archive.search.value = normalizedTag; if (activeSources.references?.search) activeSources.references.search.value = normalizedTag; }
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]); }
function escapeAttribute(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }
async function init() {
  await Promise.all(Object.entries(activeSources).map(async ([section, config]) => { state[section] = await loadJson(config.url); config.search?.addEventListener('input', () => render(section)); document.querySelector(`[data-reset="${section}"]`)?.addEventListener('click', () => reset(section)); }));
  renderFilterOptions();
  applyTagFromUrl();
  Object.keys(activeSources).forEach(render);
}
init();
