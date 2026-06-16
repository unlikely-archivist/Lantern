/**
 * build-data.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
mkdirSync('data', { recursive: true });
const API_KEY = process.env.SMITHSONIAN_API_KEY;
const API_BASE = 'https://api.si.edu/openaccess/api/v1.0/search';
const SEARCH_TERMS = ['fortune teller','circus sideshow','spirit photography','ventriloquist dummy','medical curiosities','taxidermy','patent medicine','wax figures','stereographs','blacksmith','lighthouse keeper','switchboard operator','telegraph operator','shipyard worker','beekeeper','embalmer','deep sea diver','watchmaker','bookbinder','revival meeting','baptism ceremony','county fair','roadside attraction','barbershop','spiritualism','mesmerism','fortune telling','psychical research','occupational portrait','carnival worker','railroad worker'];
const PER_TERM=5; const MAX_NEW_PER_RUN=50;
let existing=[];
for (const path of ['data/archive-data.json','lantern-data.json']) {
 if (existsSync(path)) { try { const raw=JSON.parse(readFileSync(path,'utf8')); if(Array.isArray(raw)&&raw.length>existing.length) existing=raw;} catch {} }
}
const existingUrls=new Set(existing.map(r=>r.sourceUrl||r.imgSrc).filter(Boolean));
async function searchSmithsonian(term,count=PER_TERM){ if(!API_KEY)return[]; const url=new URL(API_BASE); url.searchParams.set('api_key',API_KEY); url.searchParams.set('q',`${term} AND online_media_type:"Images"`); url.searchParams.set('start','0'); url.searchParams.set('rows',String(count)); try{const res=await fetch(url.toString(),{headers:{Accept:'application/json'}}); if(!res.ok)return[]; const data=await res.json(); return data?.response?.rows||[];}catch{return[];} }
function buildRecord(item){ const c=item.content||{}; const d=c.descriptiveNonRepeating||{}; const i=c.indexedStructured||{}; const f=c.freetext||{}; const media=d.online_media?.media||[]; const chosen=media[0]||{}; const imgSrc=chosen.content||chosen.thumbnail||''; const sourceUrl=d.record_link||d.guid||item.id||''; if(!imgSrc||!sourceUrl||existingUrls.has(sourceUrl)||existingUrls.has(imgSrc)) return null; return {title:d.title?.content||item.title||'Untitled',imgSrc,sourceUrl,caption:(f.notes?.[0]?.content)||'',subjects:[],tags:[],medium:'Photography',image_style:'Unknown',people_count:'Unknown',shot:'Unknown',location_type:'Unknown',continent:'North America',time_period:'Unknown',dateAdded:new Date().toISOString().slice(0,10),source_id:'SRC-SI',collection_title:(f.setName?.[0]?.content)||d.data_source||'Smithsonian Institution',source_type:'A'}; }
async function main(){ const newRecords=[]; const dayIndex=Math.floor(Date.now()/86400000); const offset=dayIndex%SEARCH_TERMS.length; const rotated=[...SEARCH_TERMS.slice(offset),...SEARCH_TERMS.slice(0,offset)]; for(const term of rotated){ if(newRecords.length>=MAX_NEW_PER_RUN) break; const results=await searchSmithsonian(term,PER_TERM); for(const item of results){ const record=buildRecord(item); if(record){ newRecords.push(record); existingUrls.add(record.sourceUrl); } if(newRecords.length>=MAX_NEW_PER_RUN) break; } }
const combined=[...newRecords,...existing]; writeFileSync('data/archive-data.json',JSON.stringify(combined,null,2)+'\n'); writeFileSync('data/references-data.json','[]\n'); writeFileSync('data/stats.json',JSON.stringify({archiveCount:combined.length,recordsAddedThisRun:newRecords.length,lastRun:new Date().toISOString()},null,2)+'\n'); }
main().catch(err=>{console.error(err);process.exit(1);});