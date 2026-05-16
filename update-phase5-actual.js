/**
 * update-phase5-actual.js
 * Update Phase 5 to reflect what was actually done:
 * - Remove Lava Centre if present
 * - Add Grindavík tour back (confirmed visited, photos may not have matched)
 * - Add Keflavík town tour (between hospital and airport)
 * - Order: Reykjavík → Garður Lighthouse → Grindavík → Keflavík → HSS Hospital → KEF Airport
 */
const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

// Remove Lava Centre if still present
const before = d.stops.length;
d.stops = d.stops.filter(s => !s.name.toLowerCase().includes('lava'));
if (d.stops.length < before) console.log('Removed LAVA Centre stop');

const ph5 = d.stops.filter(s => s.phase === 5);
console.log('Current Phase 5 stops:', ph5.map(s => s.name));

// Add Grindavík if not already there
if (!d.stops.find(s => s.name.toLowerCase().includes('grindav'))) {
  d.stops.push({
    name:  'Grindavík',
    type:  'scenic',
    phase: 5,
    lat:   63.8413,
    lon:   -22.4292,
    note:  'Fishing town tour on the Reykjanes Peninsula. Drove through town and harbor.',
    photos: []
  });
  console.log('Added Grindavík');
}

// Add Keflavík town tour if not already there
if (!d.stops.find(s => s.name.toLowerCase().includes('keflaví') || s.name.toLowerCase().includes('keflavík'))) {
  d.stops.push({
    name:  'Keflavík Town Tour',
    type:  'scenic',
    phase: 5,
    lat:   63.9936,
    lon:   -22.5567,
    note:  'Quick tour of Keflavík town and harbor area on the way to the airport.',
    photos: []
  });
  console.log('Added Keflavík Town Tour');
}

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('\nPhase 5 final:', d.stops.filter(s => s.phase === 5).map(s => s.name));
