const DATA_URLS = [
  'data/archive-data.json',
  'data/references-data.json'
];

const tagIndex = document.querySelector('#tagIndex');
const tagSearch = document.querySelector('#tagSearch');
const tagCount = document.querySelector('#tagCount');

function normalizeTag(tag) {
  const value = String(tag || '').trim();
  if (!value) return '';
  return value.startsWith('#') ? value : `#${value}`;
}

function normalizeRecord(record) {
  return {
    title: record.title || record.name || 'Untitled record',
    tags: Array.isArray(record.tags) ? record.tags.map(normalizeTag).filter(Boolean) : []
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

function buildTagCounts(records) {
  return records.reduce((counts, record) => {
    const recordTags = new Set(record.tags);
    recordTags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    return counts;
  }, new Map());
}

function sortTags(tagCounts) {
  return [...tagCounts.entries()].sort(([tagA, countA], [tagB, countB]) => {
    if (countA !== countB) return countB - countA;
    return tagA.localeCompare(tagB);
  });
}

function renderTags(tags) {
  const query = tagSearch.value.trim().toLowerCase();
  const filteredTags = tags.filter(([tag]) => tag.toLowerCase().includes(query));

  tagCount.textContent = `${filteredTags.length} shown / ${tags.length} total`;

  tagIndex.innerHTML = filteredTags.length
    ? filteredTags.map(([tag, count]) => `
      <a class="tag-index-item" href="index.html#archive?tag=${encodeURIComponent(tag)}">
        <span>${escapeHtml(tag)}</span>
        <span class="tag-count">${count}</span>
      </a>
    `).join('')
    : '<div class="empty-state">No tags have been published yet.</div>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[character]);
}

async function init() {
  const records = (await Promise.all(DATA_URLS.map(loadJson))).flat();
  const tags = sortTags(buildTagCounts(records));

  tagSearch.addEventListener('input', () => renderTags(tags));
  renderTags(tags);
}

init();
