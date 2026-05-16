const fs = require('fs');
const d = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

// Two remaining clusters on Route 1 between Hvalfjörður and Borgarnes:
// 64.3913, -21.4278 (9 photos) and 64.4478, -21.5346 (8 photos)
// Both in Borgarfjörður approach corridor — combine into one stop at midpoint
const remaining = [
  {
    name: 'Route 1 — Borgarfjörður Corridor',
    lat: 64.4196,
    lon: -21.4812,
    type: 'unplanned',
    phase: 1,
    note: 'Route 1 driving corridor between Hvalfjörður and Borgarnes. Unplanned stop — 17 photos taken along this stretch.'
  }
];

remaining.forEach(s => {
  if (!d.stops.find(x => x.name === s.name)) {
    d.stops.push(s);
    console.log('✓ Added:', s.name, `[Phase ${s.phase}]`);
  }
});

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('Total stops:', d.stops.length);

