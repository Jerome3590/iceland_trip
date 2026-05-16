// Move Keflavík Town Tour pin into the upper photo cluster so photos split from hospital
const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));
const kef = d.stops.find(s => s.name === 'Keflavík Town Tour');
console.log('Old pin:', kef.lat, kef.lon);
// Upper cluster of Phase 5 photos runs 64.007-64.009 — center it there
kef.lat = 64.0080;
kef.lon = -22.5565;
console.log('New pin:', kef.lat, kef.lon);
fs.writeFileSync('route-data.json', JSON.stringify(d));
