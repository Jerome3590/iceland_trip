/**
 * add-missing-locations.js
 * 1. Re-pin Deildartunguhver and Urriðafoss to actual photo centroids
 * 2. Add new stops for unmatched clusters (>= 5 photos)
 * 3. Exclude non-Iceland photos (Richmond VA)
 */
const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

// ── 1. Fix Deildartunguhver pin ───────────────────────────────────────────────
const deil = d.stops.find(s => s.name.includes('Deildartunguhver'));
if (deil) {
  deil.lat = 64.6222; deil.lon = -21.5994;
  console.log('✓ Deildartunguhver repinned to', deil.lat, deil.lon);
}

// ── 2. Fix Urriðafoss pin ─────────────────────────────────────────────────────
const urr = d.stops.find(s => s.name.includes('Urri'));
if (urr) {
  urr.lat = 63.8803; urr.lon = -20.7864;
  console.log('✓ Urriðafoss repinned to', urr.lat, urr.lon);
}

// ── 3. Add new stops for significant unmatched clusters ───────────────────────
// Identified from find-unmatched-clusters.js output
const NEW_STOPS = [
  {
    name:  'Skógar / Þórsmörk Trail',
    type:  'unplanned',
    phase: 3,
    lat:   63.5452,
    lon:   -19.6098,
    note:  'Trail photos near Skógar village and Þórsmörk approach. 11 photos taken here.',
    photos: []
  },
  {
    name:  'Route 1 — Hvalfjörður South',
    type:  'unplanned',
    phase: 1,
    lat:   64.4478,
    lon:   -21.5346,
    note:  'Roadside stop on Route 1 south of Borgarnes. 8 photos taken here.',
    photos: []
  },
  {
    name:  'Route 1 — Seljalands Valley',
    type:  'unplanned',
    phase: 3,
    lat:   63.6789,
    lon:   -19.9463,
    note:  'Roadside stop in the Seljalands Valley, north of Seljalandsfoss. 7 photos taken here.',
    photos: []
  },
];

NEW_STOPS.forEach(s => {
  if (!d.stops.find(x => x.name === s.name)) {
    d.stops.push(s);
    console.log(`✓ Added: ${s.name} (Ph${s.phase})`);
  } else {
    console.log(`  Already exists: ${s.name}`);
  }
});

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('\nroute-data.json saved — now run: node rematch-all.js');
