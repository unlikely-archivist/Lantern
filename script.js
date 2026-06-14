const SOURCES = {
  archive: {
    url: 'data/archive-data.json',
    grid: document.querySelector('#archiveGrid'),
    count: document.querySelector('#archiveCount'),
    search: document.querySelector('#archiveSearch'),
    type: document.querySelector('#archiveType'),
    color: document.querySelector('#archiveColor'),
    empty: 'No approved archive records yet.'
  },
  references: {
    url: 'data/references-data.json',
    grid: document.querySelector('#referencesGrid'),
    count: document.querySelector('#referencesCount'),
    search: document.querySelector('#referencesSearch'),
    type: document.querySelector('#referencesType'),
    empty: 'Artist References is ready, but no approved records have been published yet.'
  }
};

const state = {
  archive: [],
  references: []
};

function normalizeRecord(record) {
  return {
    title: record.title || record.name || 'Untitled record',
    media: record.media || record.medium || '',
    manifestation: record.manifestation || record.type || record.category || '',
    imgSrc: record.imgSrc || record.imageUrl || record.image_url || record.thumbnail || '',
    sourceUrl: record.sourceUrl || record.source_url || record.url || '',
    dateAdded: record.dateAdded || record.date_added || '',
    tags: Array.isArray(record.tags) ? record.tags : [],
    caption: record.caption || record.notes || record.description || '',
    color: record.color || '',
    loc: record.loc || record.location_type || '',
    people: record.people || '',
    shot: record.shot || '',
    continent: record.continent || ''
  };
}

async function loadJson(url) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data.map(normalizeRecord) : [];
  } catch (error) {
    console.warn(`Could not load ${url}`, error);
    return [];
  }
}

function uniqueOptions(records, key) {
  return [...new Set(records.map((record) => record[key]).filter(Boolean))].sort();
}

function populateSelect(select, values) {
  if (!select) return;
  const first = select.querySelector('option')?.cloneNode(true);
  select.replaceChildren(first || new Option('ALL', ''));
  values.forEach((value) => select.append(new Option(value, value)));
}

function searchableText(record) {
  return [
    record.title,
    record.media,
    record.manifestation,
    record.caption,
    record.color,
    record.loc,
    record.people,
    record.shot,
    record.continent,
    ...record.tags
  ].join(' ').toLowerCase();
}

function filterRecords(section) {
  const config = SOURCES[section];
  const query = config.search?.value.trim().toLowerCase() || '';
  const type = config.type?.value || '';
  const color = config.color?.value || '';

  return state[section].filter((record) => {
    const matchesQuery = !query || searchableText(record).includes(query);
    const matchesType = !type || record.manifestation === type;
    const matchesColor = !color || record.color === color;
    return matchesQuery && matchesType && matchesColor;
  });
}

function renderCard(record) {
  const tags = record.tags.map((tag) => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('');
  const img = record.imgSrc
    ? `<img src="${escapeAttribute(record.imgSrc)}" alt="${escapeAttribute(record.title)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'), { className: 'img-fallback', textContent: 'Image unavailable' }))" />`
    : '<div class="img-fallback">No image yet</div>';
  const source = record.sourceUrl
    ? `<a class="card-link" href="${escapeAttribute(record.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>`
    : '';

  return `
    <article class="card">
      <div class="card-img-wrap">${img}</div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(record.title)}</h3>
        <p class="card-meta">${escapeHtml([record.media, record.manifestation, record.color].filter(Boolean).join(' · '))}</p>
        ${record.caption ? `<p class="card-caption">${escapeHtml(record.caption)}</p>` : ''}
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        ${source}
      </div>
    </article>
  `;
}

function render(section) {
  const config = SOURCES[section];
  const records = filterRecords(section);
  config.count.textContent = `${records.length} shown / ${state[section].length} total`;
  config.grid.innerHTML = records.length
    ? records.map(renderCard).join('')
    : `<div class="empty-state">${config.empty}</div>`;
}

function reset(section) {
  const config = SOURCES[section];
  if (config.search) config.search.value = '';
  if (config.type) config.type.value = '';
  if (config.color) config.color.value = '';
  render(section);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

async function init() {
  await Promise.all(Object.entries(SOURCES).map(async ([section, config]) => {
    state[section] = await loadJson(config.url);
    populateSelect(config.type, uniqueOptions(state[section], 'manifestation'));
    populateSelect(config.color, uniqueOptions(state[section], 'color'));
    config.search?.addEventListener('input', () => render(section));
    config.type?.addEventListener('change', () => render(section));
    config.color?.addEventListener('change', () => render(section));
    document.querySelector(`[data-reset="${section}"]`)?.addEventListener('click', () => reset(section));
    render(section);
  }));
}

init();
