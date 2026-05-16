/**
 * patch-app.js
 * Adds:
 *   1. Phase filter buttons on the map (filter route + markers by phase)
 *   2. Mobile phase ordering (order:N on phase cards)
 *   3. Rebuilds app.js from latest route-data.json
 */
const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// ── 1. Add order:${p.id} to phase card article ───────────────────────────────
const OLD_CARD = 'style="--phase:${p.color}">';
const NEW_CARD = 'style="--phase:${p.color};order:${p.id}">';
if (!src.includes(OLD_CARD)) { console.error('Cannot find phase card style'); process.exit(1); }
src = src.replace(OLD_CARD, NEW_CARD);
console.log('✓ Phase card order applied');

// ── 2. Add allMarkers / allFeatures before init ──────────────────────────────
const OLD_MAP_VAR = 'let map;';
const NEW_MAP_VAR = 'let map;let allMarkers=[];let allFeatures=[];';
if (!src.includes(OLD_MAP_VAR)) { console.error('Cannot find let map'); process.exit(1); }
src = src.replace(OLD_MAP_VAR, NEW_MAP_VAR);
console.log('✓ allMarkers/allFeatures vars added');

// ── 3. Capture features into outer allFeatures ───────────────────────────────
const OLD_FEATURES = 'const features=routeData.legs.map(';
const NEW_FEATURES = 'allFeatures=routeData.legs.map(';
if (!src.includes(OLD_FEATURES)) { console.error('Cannot find const features'); process.exit(1); }
src = src.replace(OLD_FEATURES, NEW_FEATURES);
// Fix the subsequent reference where features is used for fitBounds
// Need to use allFeatures everywhere features was used
src = src.replace(/\bfeatures\b/g, 'allFeatures');
console.log('✓ features → allFeatures');

// ── 4. Store markers + inject phase filter after stops forEach ───────────────
const OLD_MARKER = 'new maplibregl.Marker({element:el}).setLngLat([stop.lon,stop.lat]).setPopup(';
const NEW_MARKER = 'const _mk=new maplibregl.Marker({element:el}).setLngLat([stop.lon,stop.lat]).setPopup(';
if (!src.includes(OLD_MARKER)) { console.error('Cannot find Marker creation'); process.exit(1); }
src = src.replace(OLD_MARKER, NEW_MARKER);

// After .addTo(map)}); (end of stops forEach), insert phase filter setup
const OLD_AFTER_STOPS = '.addTo(map)});map.on(\'click\',\'route-line\'';
const NEW_AFTER_STOPS = `.addTo(map);allMarkers.push({marker:_mk,phase:stop.phase})});
// ── Phase filter setup ──────────────────────────────────────────────────────
function setPhaseFilter(pid){
  const filt=pid?['==',['get','phase'],pid]:null;
  ['route-casing','route-line','route-labels'].forEach(id=>map.setFilter(id,filt));
  allMarkers.forEach(({marker,phase})=>{marker.getElement().style.display=(!pid||phase===pid)?'':'none'});
  const toFit=pid?allFeatures.filter(f=>f.properties.phase===pid):allFeatures;
  if(toFit.length){const b=new maplibregl.LngLatBounds();toFit.forEach(f=>f.geometry.coordinates.forEach(c=>b.extend(c)));map.fitBounds(b,{padding:{top:35,right:35,bottom:35,left:35}})}
}
const filterBar=document.createElement('div');
filterBar.className='phase-filter-bar';
filterBar.innerHTML='<button class="pfb is-active" data-pfb="">All</button>'+routeData.phases.map(p=>'<button class="pfb" data-pfb="'+p.id+'" style="--c:'+p.color+'">Phase '+p.id+'</button>').join('');
filterBar.addEventListener('click',e=>{const btn=e.target.closest('[data-pfb]');if(!btn)return;const pid=btn.dataset.pfb?Number(btn.dataset.pfb):null;setPhaseFilter(pid);filterBar.querySelectorAll('.pfb').forEach(b=>b.classList.toggle('is-active',b===btn))});
document.querySelector('.map-title').after(filterBar);
map.on('click','route-line'`;

if (!src.includes(OLD_AFTER_STOPS)) { console.error('Cannot find end of stops forEach'); process.exit(1); }
src = src.replace(OLD_AFTER_STOPS, NEW_AFTER_STOPS);
console.log('✓ Phase filter buttons + setPhaseFilter injected');

// ── 5. Rebuild with latest route-data.json ───────────────────────────────────
const routeData = fs.readFileSync('route-data.json', 'utf8');
const logicStart = src.indexOf('\nconst iconSvg');
if (logicStart === -1) { console.error('Cannot find logic section'); process.exit(1); }
const logic = src.substring(logicStart);
const output = `const routeData = ${routeData}${logic}`;
fs.writeFileSync('app.js', output);
console.log('✓ Rebuilt app.js with latest route-data.json (Grindavík included)');
console.log('  New size:', (output.length / 1024).toFixed(0), 'KB');

