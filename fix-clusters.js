const fs = require('fs');
const d = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

// ── 1. Remove the Virginia (USA) stops and bad photo-stop names ──────────────
const before = d.stops.length;
d.stops = d.stops.filter(s => {
  if (s.lat < 63 || s.lat > 67) return false;    // outside Iceland lat band
  if (s.lon < -25 || s.lon > -13) return false;  // outside Iceland lon band
  return true;
});
console.log(`Removed ${before - d.stops.length} non-Iceland stops`);

// ── 2. Remove duplicate Route 1 — Borgarfjörður (keep only one) ──────────────
const bfIdx = d.stops.filter(s => s.name === 'Route 1 — Borgarfjörður');
if (bfIdx.length > 1) {
  // Keep first, remove rest
  let found = false;
  d.stops = d.stops.filter(s => {
    if (s.name === 'Route 1 — Borgarfjörður') {
      if (!found) { found = true; return true; }
      return false;
    }
    return true;
  });
  console.log('Removed duplicate Route 1 — Borgarfjörður');
}

// ── 3. Rename generic photo-stop names to proper Iceland locations ────────────
const renames = {
  'Photo stop 65.60,-17.19': 'Mývatn / Goðafoss Corridor',   // 65.5955,-17.1877 — between Goðafoss & Mývatn
  'Photo stop 63.88,-16.65': 'Route 1 East — Glacier Coast', // 63.8816,-16.6459 — near Skaftafell/Svínafellsjökull
};
d.stops.forEach(s => {
  if (renames[s.name]) {
    const oldName = s.name;
    s.name = renames[s.name];
    // Update note
    s.note = s.note.replace('stop —', 'stop on Route 1 east —');
    console.log(`Renamed: "${oldName}" → "${s.name}"`);
  }
});

// Also update Borgarfjörður corridor to cover both clusters
const bf = d.stops.find(s => s.name === 'Route 1 — Borgarfjörður');
if (bf) {
  bf.note = 'Route 1 driving corridor between Hvalfjörður and Borgarnes. Unplanned stop — 17 photos taken along this stretch.';
  console.log('Updated Borgarfjörður note');
}

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('\nFinal stops:', d.stops.length);
console.log('Unplanned stops:', d.stops.filter(s=>s.type==='unplanned').map(s=>`[Ph${s.phase}] ${s.name}`).join('\n  '));

