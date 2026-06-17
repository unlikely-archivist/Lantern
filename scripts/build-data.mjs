<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<title>The Lantern</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }

body {
  background-color: #d4d0c8;
  background-image: radial-gradient(rgba(255,255,255,.18) 1px, transparent 1px);
  background-size: 4px 4px;
  font-family: Arial, Helvetica, sans-serif;
  min-height: 100vh;
  padding: 22px;
  padding-top: calc(22px + env(safe-area-inset-top));
  padding-right: calc(22px + env(safe-area-inset-right));
  padding-bottom: calc(22px + env(safe-area-inset-bottom));
  padding-left: calc(22px + env(safe-area-inset-left));
}

.site-header { text-align: center; background: #ececec; border: 2px ridge #cfcfcf; padding: 24px 20px 20px; margin-bottom: 20px; }
.site-header h1 { font-family: Georgia, "Times New Roman", serif; color: #990000; font-size: clamp(34px, 12vw, 52px); letter-spacing: 4px; font-weight: normal; text-shadow: 1px 1px #ffffff; line-height: 1.05; }
.header-divider { color: #999; font-size: 13px; letter-spacing: 8px; margin-top: 8px; }
.site-header .tagline { font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 14px; color: #444; max-width: 620px; margin: 12px auto 0; line-height: 1.5; }

.filter-panel { background: #c8c8c8; border: 2px inset #eee; padding: 12px 14px; margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.filter-panel input, .filter-panel select, .filter-panel button { font-family: Arial, sans-serif; font-size: 13px; background: #ececec; border: 2px outset #fff; padding: 5px 9px; color: #000; cursor: pointer; border-radius: 0; }
.filter-panel input { flex: 1; min-width: 160px; }
.filter-panel button:active { border: 2px inset #fff; }
.filter-count { font-size: 12px; color: #555; margin-left: auto; white-space: nowrap; }
.btn-liked-active { background: #ffe0e0 !important; border-color: #cc0000 !important; color: #cc0000 !important; }

.hidden-bar { display: none; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12px; color: #555; margin-bottom: 10px; }
.hidden-bar button { font-family: Arial, sans-serif; font-size: 11px; background: #ececec; border: 2px outset #fff; padding: 3px 9px; cursor: pointer; }
.hidden-bar button:active { border: 2px inset #fff; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination button { font-family: Arial, sans-serif; font-size: 13px; background: #ececec; border: 2px outset #fff; padding: 5px 14px; cursor: pointer; }
.pagination button:active { border: 2px inset #fff; }
.pagination button:disabled { opacity: .4; cursor: default; }
.pagination span { font-size: 12px; color: #555; white-space: nowrap; }

#gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }

.card { background: #ececec; border: 2px ridge #c8c8c8; display: flex; flex-direction: column; cursor: pointer; transition: border-color .1s; }
.card:hover { border-color: #111166; }
.card.card-hidden { opacity: .5; }
.card.card-liked { border-color: #cc0000; }
.card-img-wrap { width: 100%; height: 160px; overflow: hidden; background: #bbb; display: flex; align-items: center; justify-content: center; position: relative; }
.card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-img-wrap .img-fallback { font-size: 11px; color: #666; text-align: center; padding: 8px; display: none; }
.card-body { padding: 10px 11px 12px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
.card-title { font-family: Georgia, "Times New Roman", serif; font-size: 15px; font-weight: bold; line-height: 1.25; color: #990000; }
.card-caption { font-size: 12px; color: #333; line-height: 1.45; font-style: italic; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
.card-meta { font-size: 11px; color: #555; line-height: 1.4; letter-spacing: .3px; }
.card-source { font-size: 10px; color: #777; line-height: 1.4; }
.card-tags { display: flex; flex-wrap: wrap; gap: 4px 8px; margin-top: 2px; }
.tag-link { font-size: 11px; color: #111166; text-decoration: none; cursor: pointer; white-space: nowrap; }
.tag-link:hover { text-decoration: underline; }
.card-actions { margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 4px; flex-wrap: wrap; }
.card-link { font-size: 11px; color: #111166; text-decoration: none; }
.card-link:hover { text-decoration: underline; }
.card-hide { font-size: 11px; color: #999; text-decoration: none; cursor: pointer; white-space: nowrap; }
.card-hide:hover { color: #cc0000; text-decoration: underline; }
.card-hide.unhide:hover { color: #067306; }
.card-like { font-size: 11px; color: #999; text-decoration: none; cursor: pointer; white-space: nowrap; }
.card-like:hover { color: #cc0000; text-decoration: underline; }
.card-like.liked { color: #cc0000; }
.card-like.liked:hover { color: #888; }
.flag-badge { position: absolute; top: 4px; right: 4px; background: #cc8800; color: #fff; font-size: 9px; padding: 2px 4px; font-weight: bold; }

#empty-state { display: none; text-align: center; padding: 60px 20px; color: #666; font-size: 14px; grid-column: 1 / -1; line-height: 1.5; }

.site-footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #b9b5ad; text-align: center; }
.site-footer a { font-family: Georgia, "Times New Roman", serif; color: #111166; font-size: 13px; text-decoration: none; margin: 0 8px; white-space: nowrap; }
.site-footer a:hover { text-decoration: underline; }

/* LIGHTBOX / MODAL */
.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.78); z-index: 1000;
  padding: 20px; padding-top: calc(20px + env(safe-area-inset-top)); padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
.modal-overlay.open { display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; }
.modal-panel { background: #ececec; border: 2px ridge #cfcfcf; width: 100%; max-width: 640px; margin: auto; position: relative; }
.modal-close { position: absolute; top: 6px; right: 6px; z-index: 2; font-family: Arial, sans-serif; font-size: 16px; line-height: 1; background: #ececec; border: 2px outset #fff; padding: 3px 10px; cursor: pointer; }
.modal-close:active { border: 2px inset #fff; }
.modal-img-wrap { background: #000; display: flex; align-items: center; justify-content: center; min-height: 120px; }
.modal-img-wrap img { max-width: 100%; max-height: 62vh; object-fit: contain; display: block; }
.modal-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.modal-title { font-family: Georgia, "Times New Roman", serif; font-size: 20px; font-weight: bold; color: #990000; line-height: 1.2; }
.modal-caption { font-size: 13px; color: #333; line-height: 1.5; font-style: italic; }
.modal-actions { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-top: 2px; flex-wrap: wrap; }
.modal-nav { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 16px 16px; }
.modal-nav button { font-family: Arial, sans-serif; font-size: 13px; background: #ececec; border: 2px outset #fff; padding: 6px 14px; cursor: pointer; }
.modal-nav button:active { border: 2px inset #fff; }
.modal-nav span { font-size: 12px; color: #555; white-space: nowrap; }
</style>
</head>
<body>

<header class="site-header">
  <h1>THE LANTERN</h1>
  <div class="header-divider">&#10039;</div>
  <p class="tagline">Filtering archives through the lens of my personal interests to discover the weird, the strange, the forgotten, and the overlooked details of everyday life.</p>
</header>

<div class="filter-panel">
  <input id="searchInput" type="text" placeholder="Search title or #tags..." oninput="onFilterChange()">
  <select id="colorFilter" onchange="onFilterChange()"><option value="">SAT</option></select>
  <select id="locFilter" onchange="onFilterChange()"><option value="">INT/EXT</option></select>
  <select id="continentFilter" onchange="onFilterChange()"><option value="">GEOGRAPHY</option></select>
  <select id="typeFilter" onchange="onFilterChange()"><option value="">TYPE</option></select>
  <select id="shotFilter" onchange="onFilterChange()"><option value="">SHOT</option></select>
  <button id="likedToggleBtn" onclick="toggleLikedOnly()">&#10084; Liked</button>
  <button onclick="resetFilters()">Reset</button>
  <span class="filter-count" id="filterCount"></span>
</div>

<div id="hiddenBar" class="hidden-bar"></div>

<div id="paginationTop" class="pagination"></div>
<div id="gallery"></div>
<div id="paginationBottom" class="pagination"></div>

<footer class="site-footer">
  <a href="#" onclick="return false;">[New]</a>
  <a href="#" onclick="return false;">[Contents]</a>
  <a href="#" onclick="return false;">[Info]</a>
  <a href="#" onclick="return false;">[Dept.]</a>
  <a href="#" onclick="return false;">[Agencies]</a>
</footer>

<!-- LIGHTBOX -->
<div id="modal" class="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal-panel">
    <button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
    <div class="modal-img-wrap"><img id="modalImg" src="" alt=""></div>
    <div class="modal-body">
      <div id="modalTitle" class="modal-title"></div>
      <div id="modalCaption" class="modal-caption"></div>
      <div id="modalMeta" class="card-meta"></div>
      <div id="modalSource" class="card-source"></div>
      <div id="modalTags" class="card-tags"></div>
      <div class="modal-actions">
        <a id="modalLink" class="card-link" href="#" target="_blank">View source &rarr;</a>
        <a id="modalLike" class="card-like" href="#">&#10084; Like</a>
        <a id="modalHide" class="card-hide" href="#">&#10005; Hide</a>
      </div>
    </div>
    <div class="modal-nav">
      <button onclick="modalPrev()">&lsaquo; Prev</button>
      <span id="modalCounter"></span>
      <button onclick="modalNext()">Next &rsaquo;</button>
    </div>
  </div>
</div>

<script>
const PAGE_SIZE = 24;

let lanternData = [];
let filteredList = [];
let pagedList = [];
let modalIndex = -1;
let currentPage = 1;

const HIDDEN_KEY = "lantern_hidden";
const LIKED_KEY  = "lantern_liked";
let hiddenSet = new Set();
let likedSet  = new Set();
let showHidden    = false;
let showLikedOnly = false;

const FILTERS = [
  { id: "colorFilter",     field: "color",     placeholder: "SAT" },
  { id: "locFilter",       field: "loc",        placeholder: "INT/EXT" },
  { id: "continentFilter", field: "continent",  placeholder: "GEOGRAPHY" },
  { id: "typeFilter",      field: "type",       placeholder: "TYPE" },
  { id: "shotFilter",      field: "shot",       placeholder: "SHOT" }
];

function jsStr(s) { return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }
function notUnknown(v) { return (v && v !== "Unknown") ? v : null; }

function normalize(r) {
  r = r || {};
  const sourceUrl = r.sourceUrl || r.record_link || "";
  const imgSrc = r.imgSrc || "";
  return {
    id: sourceUrl || imgSrc || (r.title || r.name || ""),
    title: r.title || r.name || "Untitled",
    imgSrc: imgSrc,
    sourceUrl: sourceUrl,
    caption: r.caption || "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    color: r.color || r.image_style || "",
    loc: r.loc || r.location_type || "",
    continent: r.continent || "",
    type: r.manifestation || r.medium || "",
    shot: r.shot || "",
    timePeriod: r.time_period || "",
    collection: r.collection_title || "",
    flag: r.flag || ""
  };
}

/* ---------- persistence ---------- */
function loadStored() {
  try { const r = localStorage.getItem(HIDDEN_KEY); if (r) hiddenSet = new Set(JSON.parse(r)); } catch(e) {}
  try { const r = localStorage.getItem(LIKED_KEY);  if (r) likedSet  = new Set(JSON.parse(r)); } catch(e) {}
}
function saveHidden() { try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(hiddenSet))); } catch(e) {} }
function saveLiked()  { try { localStorage.setItem(LIKED_KEY,  JSON.stringify(Array.from(likedSet)));  } catch(e) {} }

/* ---------- hide / like actions ---------- */
function hideItem(id)   { hiddenSet.add(id);    saveHidden(); render(); }
function unhideItem(id) { hiddenSet.delete(id); saveHidden(); render(); }

function toggleLike(id) {
  if (likedSet.has(id)) { likedSet.delete(id); } else { likedSet.add(id); }
  saveLiked();
  render();
}

function toggleShowHidden()  { showHidden = !showHidden; currentPage = 1; render(); }
function toggleLikedOnly()   { showLikedOnly = !showLikedOnly; currentPage = 1; render(); }

function copyHidden() {
  const txt = JSON.stringify(Array.from(hiddenSet), null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt)
      .then(function() { alert("Copied your hidden list (" + hiddenSet.size + " items)."); })
      .catch(function() { window.prompt("Copy your hidden list:", txt); });
  } else { window.prompt("Copy your hidden list:", txt); }
}

/* ---------- load ---------- */
async function load() {
  const gallery = document.getElementById("gallery");
  const sources = ["data/archive-data.json", "lantern-data.json"];
  let raw = null, lastErr = "no file found";
  for (let i = 0; i < sources.length; i++) {
    try {
      const res = await fetch(sources[i], { cache: "no-store" });
      if (!res.ok) { lastErr = "HTTP " + res.status + " for " + sources[i]; continue; }
      const json = await res.json();
      if (Array.isArray(json)) { raw = json; break; }
      lastErr = sources[i] + " is not a list";
    } catch(e) { lastErr = e.message; }
  }
  if (!raw) {
    gallery.innerHTML = '<div id="empty-state" style="display:block;">Couldn\u2019t load the data file (' + lastErr + ').<br>This page must be viewed on the live site (or a local server), not by double-clicking the file.</div>';
    return;
  }
  lanternData = raw.map(normalize);
  buildFilters();
  render();
}

function buildFilters() {
  FILTERS.forEach(function(cfg) {
    const sel = document.getElementById(cfg.id);
    const values = Array.from(new Set(lanternData.map(function(i){ return i[cfg.field]; }).filter(Boolean))).sort();
    sel.innerHTML = '<option value="">' + cfg.placeholder + '</option>' +
      values.map(function(v) {
        const safe = String(v).replace(/"/g, "&quot;");
        return '<option value="' + safe + '">' + v + '</option>';
      }).join("");
  });
}

function getFilters() {
  return {
    search:    document.getElementById("searchInput").value.toLowerCase().trim(),
    color:     document.getElementById("colorFilter").value,
    loc:       document.getElementById("locFilter").value,
    continent: document.getElementById("continentFilter").value,
    type:      document.getElementById("typeFilter").value,
    shot:      document.getElementById("shotFilter").value,
    tag:       window._activeTag || ""
  };
}

function matchesFilters(item, f) {
  if (f.color     && item.color     !== f.color)     return false;
  if (f.loc       && item.loc       !== f.loc)        return false;
  if (f.continent && item.continent !== f.continent)  return false;
  if (f.type      && item.type      !== f.type)       return false;
  if (f.shot      && item.shot      !== f.shot)       return false;
  if (f.tag       && item.tags.indexOf(f.tag) === -1) return false;
  if (f.search) {
    const hay = (item.title + " " + item.tags.join(" ") + " " + item.caption).toLowerCase();
    if (hay.indexOf(f.search) === -1) return false;
  }
  return true;
}

/* ---------- render ---------- */
function onFilterChange() { currentPage = 1; render(); }

function render() {
  const f = getFilters();
  let matched = lanternData.filter(function(item) { return matchesFilters(item, f); });

  // apply hide filter
  if (!showHidden) matched = matched.filter(function(n) { return !hiddenSet.has(n.id); });

  // apply liked-only filter
  if (showLikedOnly) matched = matched.filter(function(n) { return likedSet.has(n.id); });

  filteredList = matched;

  // pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  pagedList = filteredList.slice(start, start + PAGE_SIZE);

  // liked toggle button style
  const likedBtn = document.getElementById("likedToggleBtn");
  if (showLikedOnly) { likedBtn.classList.add("btn-liked-active"); }
  else               { likedBtn.classList.remove("btn-liked-active"); }

  document.getElementById("filterCount").textContent = filteredList.length + " / " + lanternData.length;
  renderHiddenBar();
  renderPagination();
  renderGallery();
}

function renderHiddenBar() {
  const bar = document.getElementById("hiddenBar");
  if (hiddenSet.size === 0) { bar.style.display = "none"; bar.innerHTML = ""; return; }
  bar.style.display = "flex";
  bar.innerHTML = hiddenSet.size + " hidden " +
    '<button onclick="toggleShowHidden()">' + (showHidden ? "Hide them" : "Show them") + '</button>' +
    '<button onclick="copyHidden()">Copy list</button>';
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const html = totalPages <= 1 ? "" :
    '<button onclick="goPage(' + (currentPage - 1) + ')" ' + (currentPage <= 1 ? "disabled" : "") + '>&lsaquo; Prev</button>' +
    '<span>Page ' + currentPage + ' of ' + totalPages + '</span>' +
    '<button onclick="goPage(' + (currentPage + 1) + ')" ' + (currentPage >= totalPages ? "disabled" : "") + '>Next &rsaquo;</button>';
  document.getElementById("paginationTop").innerHTML = html;
  document.getElementById("paginationBottom").innerHTML = html;
}

function goPage(p) {
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  currentPage = Math.max(1, Math.min(p, totalPages));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderGallery() {
  const gallery = document.getElementById("gallery");

  if (pagedList.length === 0) {
    gallery.innerHTML = '<div id="empty-state" style="display:block;">No results. <a href="#" onclick="resetFilters();return false;">Reset filters</a></div>';
    return;
  }

  gallery.innerHTML = pagedList.map(function(n, idx) {
    const isHidden = hiddenSet.has(n.id);
    const isLiked  = likedSet.has(n.id);

    const tagsHtml = n.tags.map(function(t) {
      return '<a class="tag-link" href="#" onclick="event.stopPropagation();filterByTag(\'' + jsStr(t) + '\');return false;">' + t + '</a>';
    }).join(" ");

    const attrs = [n.color, notUnknown(n.loc), notUnknown(n.shot)].filter(Boolean).join(" \u00b7 ");
    const src   = [n.continent, n.timePeriod, n.collection].filter(notUnknown).join(" | ");
    const flagHtml = n.flag ? '<span class="flag-badge" title="' + String(n.flag).replace(/"/g, "&quot;") + '">!</span>' : "";

    const hideLink = isHidden
      ? '<a class="card-hide unhide" href="#" onclick="event.stopPropagation();unhideItem(\'' + jsStr(n.id) + '\');return false;">\u21ba Unhide</a>'
      : '<a class="card-hide" href="#" onclick="event.stopPropagation();hideItem(\'' + jsStr(n.id) + '\');return false;">\u2715 Hide</a>';

    const likeLink = isLiked
      ? '<a class="card-like liked" href="#" onclick="event.stopPropagation();toggleLike(\'' + jsStr(n.id) + '\');return false;">&#10084; Liked</a>'
      : '<a class="card-like" href="#" onclick="event.stopPropagation();toggleLike(\'' + jsStr(n.id) + '\');return false;">&#10084; Like</a>';

    return '' +
      '<div class="card' + (isHidden ? ' card-hidden' : '') + (isLiked ? ' card-liked' : '') + '" onclick="openModal(' + idx + ')">' +
        '<div class="card-img-wrap">' +
          '<img src="' + n.imgSrc + '" alt="' + String(n.title).replace(/"/g, "&quot;") + '" loading="lazy" ' +
               'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">' +
          '<div class="img-fallback">Image unavailable<br><small>' + n.title + '</small></div>' +
          flagHtml +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-title">' + n.title + '</div>' +
          (n.caption ? '<div class="card-caption">' + n.caption + '</div>' : '') +
          (attrs ? '<div class="card-meta">' + attrs + '</div>' : '') +
          (src   ? '<div class="card-source">' + src + '</div>' : '') +
          '<div class="card-tags">' + tagsHtml + '</div>' +
          '<div class="card-actions">' +
            '<a class="card-link" href="' + n.sourceUrl + '" target="_blank" onclick="event.stopPropagation()">View source &rarr;</a>' +
            likeLink +
            hideLink +
          '</div>' +
        '</div>' +
      '</div>';
  }).join("");
}

/* ---------- lightbox ---------- */
function largeImg(url) { return String(url || "").replace(/\/full\/\d+,\//, "/full/1000,/"); }

function openModal(i) {
  modalIndex = i;
  renderModal();
  document.getElementById("modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modal").classList.remove("open");
  document.body.style.overflow = "";
  modalIndex = -1;
}

function modalPrev() {
  if (!pagedList.length) return;
  modalIndex = (modalIndex - 1 + pagedList.length) % pagedList.length;
  renderModal();
}

function modalNext() {
  if (!pagedList.length) return;
  modalIndex = (modalIndex + 1) % pagedList.length;
  renderModal();
}

function hideFromModal(id) {
  hiddenSet.add(id); saveHidden(); render();
  if (showHidden) { renderModal(); return; }
  if (!pagedList.length) { closeModal(); return; }
  if (modalIndex >= pagedList.length) modalIndex = pagedList.length - 1;
  renderModal();
}

function unhideFromModal(id) { hiddenSet.delete(id); saveHidden(); render(); renderModal(); }

function toggleLikeFromModal(id) { toggleLike(id); renderModal(); }

function renderModal() {
  const n = pagedList[modalIndex];
  if (!n) return;

  const img = document.getElementById("modalImg");
  img.onerror = function() { img.onerror = null; img.src = n.imgSrc; };
  img.src = largeImg(n.imgSrc);
  img.alt = n.title;

  document.getElementById("modalTitle").textContent = n.title;

  const cap = document.getElementById("modalCaption");
  cap.textContent = n.caption || "";
  cap.style.display = n.caption ? "" : "none";

  document.getElementById("modalMeta").textContent    = [n.color, notUnknown(n.loc), notUnknown(n.shot)].filter(Boolean).join(" \u00b7 ");
  document.getElementById("modalSource").textContent  = [n.continent, n.timePeriod, n.collection].filter(notUnknown).join(" | ");

  document.getElementById("modalTags").innerHTML = n.tags.map(function(t) {
    return '<a class="tag-link" href="#" onclick="closeModal();filterByTag(\'' + jsStr(t) + '\');return false;">' + t + '</a>';
  }).join(" ");

  document.getElementById("modalLink").href = n.sourceUrl;

  const id = n.id;

  const ml = document.getElementById("modalLike");
  if (likedSet.has(id)) {
    ml.className = "card-like liked";
    ml.innerHTML = "&#10084; Liked";
    ml.onclick = function() { toggleLikeFromModal(id); return false; };
  } else {
    ml.className = "card-like";
    ml.innerHTML = "&#10084; Like";
    ml.onclick = function() { toggleLikeFromModal(id); return false; };
  }

  const mh = document.getElementById("modalHide");
  if (hiddenSet.has(id)) {
    mh.className = "card-hide unhide";
    mh.innerHTML = "\u21ba Unhide";
    mh.onclick = function() { unhideFromModal(id); return false; };
  } else {
    mh.className = "card-hide";
    mh.innerHTML = "\u2715 Hide";
    mh.onclick = function() { hideFromModal(id); return false; };
  }

  document.getElementById("modalCounter").textContent = (modalIndex + 1) + " of " + pagedList.length + " on this page";
}

document.addEventListener("keydown", function(e) {
  if (modalIndex < 0) return;
  if (e.key === "Escape")      closeModal();
  else if (e.key === "ArrowLeft")  modalPrev();
  else if (e.key === "ArrowRight") modalNext();
});

function filterByTag(tag) {
  window._activeTag = tag;
  document.getElementById("searchInput").value = tag;
  currentPage = 1;
  render();
}

function resetFilters() {
  window._activeTag = "";
  showLikedOnly = false;
  document.getElementById("searchInput").value = "";
  FILTERS.forEach(function(cfg) { document.getElementById(cfg.id).value = ""; });
  currentPage = 1;
  render();
}

loadStored();
load();
</script>
</body>
</html>
