const fs = require('fs');
const d = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

const actualStops = [
  {
    name: 'Fjaðrárgljúfur Canyon',
    lat: 63.7764,
    lon: -18.1756,
    type: 'unplanned',
    phase: 4,
    note: 'Dramatic 100m-deep canyon carved by the Fjaðrá river. Unplanned stop — 118 photos taken here.'
  },
  {
    name: 'Kirkjubæjarklaustur',
    lat: 63.7975,
    lon: -18.0573,
    type: 'unplanned',
    phase: 4,
    note: 'South coast village between Vík and Skaftafell. Unplanned stop — 23 photos taken here.'
  },
  {
    name: 'Seljavallalaug',
    lat: 63.5505,
    lon: -19.7735,
    type: 'unplanned',
    phase: 4,
    note: 'Hidden geothermal pool in a valley near Skógafoss, one of Iceland\'s oldest swimming pools. Unplanned stop — 9 photos taken here.'
  },
  {
    name: 'Bifröst / Grábrók Crater',
    lat: 64.7937,
    lon: -21.7153,
    type: 'unplanned',
    phase: 1,
    note: 'Grábrók volcanic crater on Route 1 in west Iceland. Unplanned stop — 88 photos taken in this area.'
  },
  {
    name: 'Hvalfjörður',
    lat: 64.2328,
    lon: -21.8158,
    type: 'unplanned',
    phase: 1,
    note: 'Whale Fjord — scenic detour between Reykjavík and Borgarnes. Unplanned stop — 11 photos taken here.'
  },
  {
    name: 'Glaumbaer Turf Farm',
    lat: 65.5373,
    lon: -19.6789,
    type: 'unplanned',
    phase: 2,
    note: 'Historic 18th-century turf farmhouse museum in north Iceland. Unplanned stop — 13 photos taken here.'
  }
];

// Avoid duplicates
actualStops.forEach(s => {
  if (!d.stops.find(x => x.name === s.name)) {
    d.stops.push(s);
    console.log('✓ Added:', s.name, `[Phase ${s.phase}]`);
  } else {
    console.log('  Skipped (exists):', s.name);
  }
});

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('\nTotal stops:', d.stops.length);

