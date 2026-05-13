const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// ── 1. Find anchor points ────────────────────────────────────────────────────
const legendMarker = "routeData.phases.forEach(p=>legend.insertAdjacentHTML('beforeend',`<span><i class=\"swatch\" style=\"--c:${p.color}\"></i>Phase ${p.id}</span>`));";
const daysMarker   = "const days=document.getElementById('days');";
const turnsMarker  = "const turns=document.getElementById('turns');";

if (!src.includes(legendMarker)) { console.error('Cannot find legend marker'); process.exit(1); }
if (!src.includes(daysMarker))   { console.error('Cannot find days marker');   process.exit(1); }
if (!src.includes(turnsMarker))  { console.error('Cannot find turns marker');  process.exit(1); }

// ── 2. After legend: insert centerTop hide + tab switching ───────────────────
const centerTopAndTabs = `
const centerTop=document.getElementById('center-top-phases');if(centerTop&&!centerTop.children.length)centerTop.style.display='none';
document.addEventListener('click',e=>{const tab=e.target.closest('[data-map-tab]');if(!tab)return;const tabName=tab.dataset.mapTab;document.querySelectorAll('[data-map-tab]').forEach(btn=>{const active=btn===tab;btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',active?'true':'false')});document.querySelectorAll('[data-map-panel]').forEach(panel=>{panel.hidden=panel.dataset.mapPanel!==tabName});window.__setIcelandMapTab?.(tabName)});`;

src = src.replace(legendMarker, legendMarker + centerTopAndTabs);

// ── 3. Replace sync days.forEach with async sunrise/sunset version ───────────
// Find the full sync days block (from "const days=" up to the turns marker)
const daysStart = src.indexOf(daysMarker);
const turnsStart = src.indexOf(turnsMarker);
const oldDaysBlock = src.substring(daysStart, turnsStart);

const newDaysBlock = `const days=document.getElementById('days');async function renderDaysWithSunriseSunset(){for(const d of routeData.days){const c=phaseColor(d.phase);let sunrise='\u2014',sunset='\u2014';try{const m=d.date.match(/May (\\d+)/);const day=m?parseInt(m[1]):3;const apiDate=\`2026-05-\${String(day).padStart(2,'0')}\`;const res=await fetch(\`https://api.sunrise-sunset.org/json?lat=64.8&lng=-18&date=\${apiDate}&tzid=Atlantic/Reykjavik\`);if(res.ok){const data=await res.json();if(data.results){sunrise=data.results.sunrise;sunset=data.results.sunset;}}}catch(err){console.warn('Sunrise/sunset fetch failed:',err)}days.insertAdjacentHTML('beforeend',\`<section class="day" style="--phase-color:\${c}"><div class="day-top"><strong>\${h(d.title)}</strong><span class="date">\${h(d.date)} \u00b7 Phase \${d.phase}</span></div><p><strong>\${h(d.drive)}</strong> \u2014 \${h(d.plan)}</p><div class="daylight-info"><span>\uD83C\uDF05 \${sunrise}</span> \u00b7 <span>\uD83C\uDF07 \${sunset}</span></div></section>\`)}}renderDaysWithSunriseSunset();
`;

src = src.replace(oldDaysBlock, newDaysBlock);

fs.writeFileSync('app.js', src);
console.log('Done. Restored:');
console.log('  + centerTop auto-hide');
console.log('  + tab switching (data-map-tab + window.__setIcelandMapTab)');
console.log('  + async sunrise/sunset per day card');
console.log('New app.js size:', (src.length/1024).toFixed(0), 'KB');
