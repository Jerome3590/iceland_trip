const fs = require('fs');
const d = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

function legIdx(from, to) {
  const i = d.legs.findIndex(l => l.from === from && l.to === to);
  if (i === -1) throw new Error(`Leg not found: ${from} -> ${to}`);
  return i;
}

// ── 1. Merge Hvolsvöllur→LAVA (0.5km) + LAVA→Reykjavík (131.2km) ─────────────
const idxA = legIdx('Hvolsvöllur', 'LAVA Centre');
const idxB = legIdx('LAVA Centre', 'Reykjavík');
const legA = d.legs[idxA];
const legB = d.legs[idxB];

const merged = {
  from: 'Hvolsvöllur',
  to: 'Reykjavík',
  distance_km: Math.round((legA.distance_km + legB.distance_km) * 10) / 10,
  time_min: Math.round(legA.time_min + legB.time_min),
  geometry: {
    type: 'LineString',
    coordinates: [...legA.geometry.coordinates, ...legB.geometry.coordinates.slice(1)]
  }
};
d.legs.splice(idxA, 2, merged);
console.log('✓ Merged Hvolsvöllur→LAVA + LAVA→Reykjavík →', merged.distance_km, 'km');

// ── 2. Remove LAVA Centre stop ────────────────────────────────────────────────
d.stops = d.stops.filter(s => s.name !== 'LAVA Centre');
console.log('✓ Removed LAVA Centre stop');

// ── 3. Rebuild phase leg arrays (Phase 4 loses one leg, Phase 5 shifts) ───────
function legsInRange(from1, to1) {
  return Array.from({length: to1 - from1 + 1}, (_, i) => from1 + i);
}
const idxHvolsRey  = d.legs.findIndex(l => l.from === 'Hvolsvöllur' && l.to === 'Reykjavík');
const idxReyGrind  = d.legs.findIndex(l => l.from === 'Reykjavík'   && l.to === 'Grindavík');

d.phases.find(p => p.id === 4).legs = legsInRange(29, idxHvolsRey + 1);
d.phases.find(p => p.id === 5).legs = legsInRange(idxReyGrind + 1, d.legs.length);
console.log('✓ Phase 4 legs:', d.phases.find(p=>p.id===4).legs);
console.log('✓ Phase 5 legs:', d.phases.find(p=>p.id===5).legs);

// ── 4. Update Phase 4 metadata ────────────────────────────────────────────────
const p4 = d.phases.find(p => p.id === 4);
p4.summary = 'Big east run from Hvolsvöllur to Jökulsárlón, Diamond Beach and back, then drive directly to Reykjavík.';
p4.items = p4.items.filter(item => !item.title.includes('LAVA'));
p4.items.push({
  title: 'May 12 — Back to Reykjavík',
  desc: 'Direct drive west on Route 1 from Hvolsvöllur back to Reykjavík. Hallgrímskirkja, Harpa, Old Harbour and seafood dinner.'
});

// ── 5. Update May 12 day plan ─────────────────────────────────────────────────
const may12 = d.days.find(dy => dy.date === 'May 12');
if (may12) {
  may12.title = 'Drive back to Reykjavík';
  may12.drive = 'Hvolsvöllur → Reykjavík';
  may12.plan = 'Drive west on Route 1 from Hvolsvöllur back to Reykjavík (~131 km). Arrive early afternoon. Hallgrímskirkja, Harpa, Old Harbour and seafood dinner.';
}

// ── 6. Recalculate totals ─────────────────────────────────────────────────────
const totalKm  = d.legs.reduce((s, l) => s + l.distance_km, 0);
const totalMin = d.legs.reduce((s, l) => s + l.time_min, 0);
d.totals.total_distance_km    = Math.round(totalKm * 10) / 10;
d.totals.total_time_min       = Math.round(totalMin);
const h = Math.floor(totalMin / 60), m = Math.round(totalMin % 60);
d.totals.total_time_formatted = `${h}h ${String(m).padStart(2,'0')}m`;

fs.writeFileSync('route-data.json', JSON.stringify(d));

console.log('\nDone:');
console.log('  Legs:', d.legs.length, '| Stops:', d.stops.length, '| Days:', d.days.length);
console.log('  Total:', d.totals.total_distance_km, 'km |', d.totals.total_time_formatted);
console.log('\nPhase 4 tail + Phase 5:');
for (let i = 34; i < d.legs.length; i++) {
  const ph = d.phases.find(p => p.legs.includes(i+1));
  const l = d.legs[i];
  console.log(`  Leg ${i+1} [Ph${ph?.id}]: ${l.from} → ${l.to} | ${l.distance_km} km`);
}

