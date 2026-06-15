const ARCHIVE_FILTERS={subjects:{target:document.querySelector('#archiveSubjects'),values:['Character Studies','Death Culture','Belief & Divination','Religious Practice','Performance','Institutional Life','Roadside America','Material Culture','Maintenance & Service Work','Occupational Life']},imageStyle:{target:document.querySelector('#archiveImageStyle'),values:['B&W','Color','Sepia','Tintype','Mixed','Unknown']},peopleCount:{target:document.querySelector('#archivePeopleCount'),values:['None','One Person','Two People','Small Group','Crowd','Unknown']},shot:{target:document.querySelector('#archiveShot'),values:['Close','Medium','Wide','Unknown']},locationType:{target:document.querySelector('#archiveLocationType'),values:['Studio','Interior','Exterior','Unknown']},continent:{target:document.querySelector('#archiveContinent'),values:['North America','South America','Europe','Africa','Asia','Antarctica','Unknown']},timePeriod:{target:document.querySelector('#archiveTimePeriod'),values:['Pre-1800','1800–1849','1850–1899','1900–1919','1920–1939','1940–1959','1960–1979','1980–1999','2000–Present','Unknown']},medium:{target:document.querySelector('#archiveMedium'),values:['Photography','Illustration','Print']}};
const SOURCES={archive:{url:'data/archive-data.json',grid:document.querySelector('#archiveGrid'),count:document.querySelector('#archiveCount'),search:document.querySelector('#archiveSearch'),empty:'No approved archive records yet.'},references:{url:'data/references-data.json',grid:document.querySelector('#referencesGrid'),count:document.querySelector('#referencesCount'),search:document.querySelector('#referencesSearch'),empty:'No art reference records have been published yet.'}};
const FALLBACK_ARCHIVE=[{title:'Fortune Teller at the Louisiana State Fair',media:'Photography',imgSrc:'https://cdn.loc.gov/service/pnp/fsa/8a24000/8a24300/8a24308v.jpg',sourceUrl:'https://www.loc.gov/pictures/item/2017738093/',dateAdded:'2026-06-12',tags:['#character','#fortune_teller','#fairground','#louisiana','#work'],caption:'A fortune teller at a state fair booth.',color:'B&W',people:'Single',shot:'Medium',continent:'North America'}];
const activeSources=Object.fromEntries(Object.entries(SOURCES).filter(([,c])=>c.grid));
const state={archive:[],references:[]};

function norm(v){return String(v||'').trim()}
function esc(v){return String(v).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}
function attr(v){return esc(v).replace(/'/g,'&#39;')}
function tag(t){const v=norm(t);return v?(v.startsWith('#')?v:`#${v}`):''}
function list(v){if(Array.isArray(v))return v.map(norm).filter(Boolean);if(typeof v==='string')return v.split(',').map(norm).filter(Boolean);return[]}
function tags(v){return list(v).map(tag).filter(Boolean)}
function people(v){const n=norm(v).toLowerCase();if(!n)return'Unknown';if(['none','no people','0'].includes(n))return'None';if(['single','one','one person','1'].includes(n))return'One Person';if(['pair','two','two people','2'].includes(n))return'Two People';if(['multi','multiple','group','small group'].includes(n))return'Small Group';if(['crowd','crowded'].includes(n))return'Crowd';return v||'Unknown'}
function period(r){const e=r.time_period||r.timePeriod||r.period;if(e)return e;const y=Number(String(r.date||r.originalDate||r.year||'').match(/\d{4}/)?.[0]);if(!y)return'Unknown';if(y<1800)return'Pre-1800';if(y<=1849)return'1800–1849';if(y<=1899)return'1850–1899';if(y<=1919)return'1900–1919';if(y<=1939)return'1920–1939';if(y<=1959)return'1940–1959';if(y<=1979)return'1960–1979';if(y<=1999)return'1980–1999';return'2000–Present'}
function subjects(r,t){const text=[r.title,r.caption,r.notes,r.description,...t].join(' ').toLowerCase();const s=new Set(list(r.subjects||r.subject));if(/character|portrait|fortune|guard|keeper|attendant/.test(text))s.add('Character Studies');if(/work|labor|attendant|guard|service/.test(text))s.add('Occupational Life');if(/religion|ritual|baptism|temple|shrine/.test(text))s.add('Religious Practice');if(/fortune|divination|occult|spiritual/.test(text))s.add('Belief & Divination');if(/fair|roadside|service station|louisiana/.test(text))s.add('Roadside America');return[...s]}
function rec(r){const t=tags(r.final_tags||r.finalTags||r.tags);return{title:r.title||r.name||'Untitled record',medium:r.medium||r.media||'Unknown',imgSrc:r.imgSrc||r.imageUrl||r.image_url||r.thumbnail||'',sourceUrl:r.sourceUrl||r.source_url||r.url||'',dateAdded:r.dateAdded||r.date_added||'',sortDate:Date.parse(r.dateAdded||r.date_added||r.date||'')||0,subjects:subjects(r,t),tags:t,caption:r.caption||r.notes||r.description||'',imageStyle:r.image_style||r.imageStyle||r.color||'Unknown',peopleCount:people(r.people_count||r.peopleCount||r.people),shot:r.shot||'Unknown',locationType:r.location_type||r.locationType||r.loc||'Unknown',continent:r.continent||'Unknown',timePeriod:period(r)}}
async function load(url,section){try{const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error(res.status);let data=await res.json();if(section==='archive'&&Array.isArray(data)&&data.length===0)data=FALLBACK_ARCHIVE;return Array.isArray(data)?data.map(rec).sort((a,b)=>b.sortDate-a.sortDate||a.title.localeCompare(b.title)):[]}catch(e){console.warn('Could not load',url,e);return section==='archive'?FALLBACK_ARCHIVE.map(rec):[]}}
function selected(k){return[...document.querySelectorAll(`[data-filter-key="${k}"]:checked`)].map(i=>i.value)}
function searchable(r){return[r.title,r.medium,r.caption,r.imageStyle,r.peopleCount,r.shot,r.locationType,r.continent,r.timePeriod,...r.subjects,...r.tags].join(' ').toLowerCase()}
function match(r,k,sel){if(!sel.length)return true;const v=r[k];return Array.isArray(v)?sel.every(x=>v.includes(x)):sel.includes(v)}
function filter(section){const c=activeSources[section];const q=c.search?.value.trim().toLowerCase()||'';return state[section].filter(r=>{const mq=!q||searchable(r).includes(q);return section==='archive'?mq&&Object.keys(ARCHIVE_FILTERS).every(k=>match(r,k,selected(k))):mq})}
function renderFilters(){if(!activeSources.archive)return;Object.entries(ARCHIVE_FILTERS).forEach(([k,f])=>{if(!f.target)return;const av=new Set();state.archive.forEach(r=>{const v=r[k];Array.isArray(v)?v.forEach(x=>av.add(x)):v&&av.add(v)});const vals=f.values.filter(v=>av.has(v));f.target.innerHTML=vals.length?vals.map(v=>`<label class="filter-option"><input type="checkbox" value="${attr(v)}" data-filter-key="${k}"/><span>${esc(v)}</span></label>`).join(''):'<p class="filter-empty">—</p>'});document.querySelectorAll('[data-filter-key]').forEach(i=>i.addEventListener('change',()=>render('archive')))}

// ── LIGHTBOX ──
let lbRecords=[];
let lbIndex=0;

const lb=document.getElementById('lightbox');
const lbImg=document.getElementById('lb-img');
const lbTitle=document.getElementById('lb-title');
const lbMeta=document.getElementById('lb-meta');
const lbCaption=document.getElementById('lb-caption');
const lbSubjects=document.getElementById('lb-subjects');
const lbTags=document.getElementById('lb-tags');
const lbLink=document.getElementById('lb-link');

function openLightbox(records,index){
  lbRecords=records;
  lbIndex=index;
  showLightboxRecord();
  lb.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeLightbox(){
  lb.classList.remove('open');
  document.body.style.overflow='';
}

function showLightboxRecord(){
  const r=lbRecords[lbIndex];
  if(!r)return;
  lbImg.src=r.imgSrc||'';
  lbImg.alt=r.title;
  lbTitle.textContent=r.title;
  const meta=[r.medium,r.imageStyle,r.peopleCount,r.shot,r.locationType,r.continent,r.timePeriod].filter(v=>v&&v!=='Unknown').join(' · ');
  lbMeta.textContent=meta;
  lbCaption.textContent=r.caption||'';
  lbCaption.style.display=r.caption?'':'none';
  lbSubjects.textContent=r.subjects.length?r.subjects.join(' · '):'';
  lbSubjects.style.display=r.subjects.length?'':'none';
  lbTags.innerHTML=r.tags.map(t=>`<span class="lb-tag">${esc(t)}</span>`).join('');
  if(r.sourceUrl){lbLink.href=r.sourceUrl;lbLink.style.display='';}
  else{lbLink.style.display='none';}
}

document.getElementById('lb-close').addEventListener('click',closeLightbox);
document.getElementById('lb-prev').addEventListener('click',()=>{lbIndex=(lbIndex-1+lbRecords.length)%lbRecords.length;showLightboxRecord();});
document.getElementById('lb-next').addEventListener('click',()=>{lbIndex=(lbIndex+1)%lbRecords.length;showLightboxRecord();});
lb.addEventListener('click',e=>{if(e.target===lb)closeLightbox();});
document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft'){lbIndex=(lbIndex-1+lbRecords.length)%lbRecords.length;showLightboxRecord();}if(e.key==='ArrowRight'){lbIndex=(lbIndex+1)%lbRecords.length;showLightboxRecord();}});

// ── CARDS ──
function card(r,index){
  const img=r.imgSrc?`<img src="${attr(r.imgSrc)}" alt="${attr(r.title)}" loading="lazy"/>`:'<div class="img-fallback">No image</div>';
  const meta=[r.medium,r.imageStyle,r.timePeriod].filter(v=>v&&v!=='Unknown').join(' / ')||'Archive record';
  const tagLine=r.tags.slice(0,3).join(' ');
  return`<article class="card" data-index="${index}"><div class="card-number">${String(index+1).padStart(2,'0')}</div><div class="card-img-wrap">${img}</div><div class="card-body"><p class="card-title">${esc(r.title)}</p><p class="card-meta">${esc(meta)}</p><p class="card-tags">${esc(tagLine)}</p></div></article>`
}

function render(section){
  const c=activeSources[section];
  if(!c)return;
  const rows=filter(section);
  c.count.textContent=`${rows.length} / ${state[section].length}`;
  if(!rows.length){c.grid.innerHTML=`<div class="empty-state">${c.empty}</div>`;return;}
  c.grid.innerHTML=rows.map((r,i)=>card(r,i)).join('');
  c.grid.querySelectorAll('.card').forEach(el=>{
    el.addEventListener('click',()=>{
      const i=parseInt(el.dataset.index,10);
      openLightbox(rows,i);
    });
  });
}

function reset(section){const c=activeSources[section];if(c.search)c.search.value='';if(section==='archive')document.querySelectorAll('[data-filter-key]').forEach(i=>i.checked=false);render(section)}
function applyTag(){const t=new URLSearchParams(location.search).get('tag');if(!t)return;const nt=tag(t);if(activeSources.archive?.search)activeSources.archive.search.value=nt;if(activeSources.references?.search)activeSources.references.search.value=nt}
async function init(){await Promise.all(Object.entries(activeSources).map(async([section,c])=>{state[section]=await load(c.url,section);c.search?.addEventListener('input',()=>render(section));document.querySelector(`[data-reset="${section}"]`)?.addEventListener('click',()=>reset(section))}));renderFilters();applyTag();Object.keys(activeSources).forEach(render)}
init();