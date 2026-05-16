const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// ── 1. Add data-phase-card attr to phase card article ────────────────────────
const OLD_ARTICLE = 'style="--phase:${p.color};order:${p.id}">';
const NEW_ARTICLE = 'style="--phase:${p.color};order:${p.id}" data-phase-card="${p.id}" tabindex="0" role="button" aria-pressed="false" title="Filter map to Phase ${p.id}">';
if (!src.includes(OLD_ARTICLE)) { console.error('Cannot find article attr'); process.exit(1); }
src = src.replace(OLD_ARTICLE, NEW_ARTICLE);
console.log('✓ Added data-phase-card to phase card articles');

// ── 2. Refactor setPhaseFilter to also sync card active states ───────────────
// Replace the existing setPhaseFilter body to also handle card highlighting
const OLD_FILTER_FN = `function setPhaseFilter(pid){
  const filt=pid?['==',['get','phase'],pid]:null;
  ['route-casing','route-line','route-labels'].forEach(id=>map.setFilter(id,filt));
  allMarkers.forEach(({marker,phase})=>{marker.getElement().style.display=(!pid||phase===pid)?'':'none'});
  const toFit=pid?allFeatures.filter(f=>f.properties.phase===pid):allFeatures;
  if(toFit.length){const b=new maplibregl.LngLatBounds();toFit.forEach(f=>f.geometry.coordinates.forEach(c=>b.extend(c)));map.fitBounds(b,{padding:{top:35,right:35,bottom:35,left:35}})}
}`;

const NEW_FILTER_FN = `function setPhaseFilter(pid){
  const filt=pid?['==',['get','phase'],pid]:null;
  ['route-casing','route-line','route-labels'].forEach(id=>map.setFilter(id,filt));
  allMarkers.forEach(({marker,phase})=>{marker.getElement().style.display=(!pid||phase===pid)?'':'none'});
  const toFit=pid?allFeatures.filter(f=>f.properties.phase===pid):allFeatures;
  if(toFit.length){const b=new maplibregl.LngLatBounds();toFit.forEach(f=>f.geometry.coordinates.forEach(c=>b.extend(c)));map.fitBounds(b,{padding:{top:35,right:35,bottom:35,left:35}})}
  document.querySelectorAll('[data-phase-card]').forEach(el=>{const active=pid&&Number(el.dataset.phaseCard)===pid;el.classList.toggle('is-active',!!active);el.setAttribute('aria-pressed',active?'true':'false')});
  document.querySelectorAll('.pfb').forEach(b=>{const bpid=b.dataset.pfb?Number(b.dataset.pfb):null;b.classList.toggle('is-active',bpid===pid)});
}`;

if (!src.includes(OLD_FILTER_FN)) { console.error('Cannot find setPhaseFilter body'); process.exit(1); }
src = src.replace(OLD_FILTER_FN, NEW_FILTER_FN);
console.log('✓ setPhaseFilter now syncs card highlights + filter bar');

// ── 3. Add card click handler after filter bar injection ─────────────────────
const OLD_AFTER_FILTERBAR = "document.querySelector('.map-title').after(filterBar);";
const NEW_AFTER_FILTERBAR = `document.querySelector('.map-title').after(filterBar);
document.addEventListener('click',e=>{const card=e.target.closest('[data-phase-card]');if(!card)return;const pid=Number(card.dataset.phaseCard);setPhaseFilter(card.classList.contains('is-active')?null:pid)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const card=e.target.closest('[data-phase-card]');if(card){e.preventDefault();card.click()}}});`;

if (!src.includes(OLD_AFTER_FILTERBAR)) { console.error('Cannot find filterBar injection point'); process.exit(1); }
src = src.replace(OLD_AFTER_FILTERBAR, NEW_AFTER_FILTERBAR);
console.log('✓ Card click + keyboard handler added');

fs.writeFileSync('app.js', src);
console.log('app.js updated');

