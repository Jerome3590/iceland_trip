const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

const NEW_STOPS = [
  {
    name:  'Route 1 — Skaftá Lava Field',
    type:  'unplanned',
    phase: 3,
    lat:   63.7338,
    lon:   -18.1982,
    note:  'Roadside stop on Suðurlandsvegur through the Skaftá lava fields, east of Fjaðrárgljúfur Canyon.',
    photos: []
  },
  {
    name:  'Route 1 — Vík Approach',
    type:  'unplanned',
    phase: 3,
    lat:   63.4981,
    lon:   -19.3980,
    note:  'Roadside stop on Suðurlandsvegur (Mýrdalshreppur) between Skógafoss and Vík.',
    photos: []
  },
];

NEW_STOPS.forEach(s => {
  if (!d.stops.find(x => x.name === s.name)) {
    d.stops.push(s);
    console.log(`✓ Added: ${s.name}`);
  }
});

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('Saved — run: node rematch-all.js');

