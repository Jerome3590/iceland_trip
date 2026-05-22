const fs   = require('fs');
const d    = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));
const u    = require('./unmatched.json').filter(p => !p.reason); // skip no-GPS

const CLUSTER_R_KM = 4.83; // 3 miles

function haversine(lat1,lon1,lat2,lon2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// Greedy clustering at 3-mile radius
const clusters = [];
for (const p of u) {
  const c = clusters.find(c => haversine(p.lat, p.lon, c.lat, c.lon) < CLUSTER_R_KM);
  if (c) {
    c.photos.push(p);
    c.lat = c.photos.reduce((s,x)=>s+x.lat,0) / c.photos.length;
    c.lon = c.photos.reduce((s,x)=>s+x.lon,0) / c.photos.length;
  } else {
    clusters.push({ lat:p.lat, lon:p.lon, photos:[p] });
  }
}
clusters.sort((a,b) => b.photos.length - a.photos.length);

// Known Iceland landmarks for reverse-matching
const landmarks = [
  { name: 'Þingvellir National Park',      lat: 64.2551, lon: -21.1308 },
  { name: 'Fjaðrárgljúfur Canyon',          lat: 63.7764, lon: -18.1756 },
  { name: 'Kirkjubæjarklaustur',            lat: 63.7975, lon: -18.0573 },
  { name: 'Glaumbaer Turf Farm',            lat: 65.5373, lon: -19.6789 },
  { name: 'Hraunfossar / Húsafell',         lat: 64.7090, lon: -21.1393 },
  { name: 'Bifröst / Grábrók Crater',       lat: 64.7937, lon: -21.7153 },
  { name: 'Borgarnes',                      lat: 64.5383, lon: -21.9225 },
  { name: 'Hvalfjörður',                    lat: 64.2328, lon: -21.8158 },
  { name: 'Seljavallalaug',                 lat: 63.5505, lon: -19.7735 },
  { name: 'Eyjafjallajökull Visitor Centre',lat: 63.6340, lon: -19.6275 },
  { name: 'Þórsmörk',                       lat: 63.6838, lon: -19.5038 },
  { name: 'Laki Craters approach',          lat: 63.8400, lon: -18.2300 },
  { name: 'Skaftafell / Svínafellsjökull',  lat: 64.0163, lon: -16.9731 },
  { name: 'Jökulsárlón area',               lat: 64.0784, lon: -16.2306 },
  { name: 'Nesjavellir Geothermal',         lat: 64.1128, lon: -21.2295 },
  { name: 'Varmahlíð',                      lat: 65.5500, lon: -19.5300 },
  { name: 'Akureyri outskirts',             lat: 65.6000, lon: -18.0800 },
  { name: 'Mývatn East shore',              lat: 65.5640, lon: -16.8230 },
  { name: 'Route 1 — Borgarfjörður',        lat: 64.4196, lon: -21.4812 },
  { name: 'Vik / Reynisfjara area',         lat: 63.4190, lon: -19.0050 },
  { name: 'Skógar / Þórsmörk trailhead',   lat: 63.5286, lon: -19.5104 },
  { name: 'Deildartunguhver area',          lat: 64.6822, lon: -21.4067 },
];

function bestMatch(lat, lon) {
  return landmarks
    .map(l => ({ ...l, dist: haversine(lat, lon, l.lat, l.lon) }))
    .sort((a,b) => a.dist - b.dist)[0];
}

console.log(`Unmatched photos: ${u.length} | Clusters at 3mi (${CLUSTER_R_KM}km):\n`);

const toAdd = [];
clusters.forEach((c, i) => {
  const best = bestMatch(c.lat, c.lon);
  const name = best.dist < 5 ? best.name : `Photo stop ${String(c.lat.toFixed(2))},${String(c.lon.toFixed(2))}`;
  console.log(`  Cluster ${i+1}: ${c.photos.length} photos | ${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}`);
  console.log(`    → ${name} (${best.dist.toFixed(1)} km)`);

  // Determine phase by latitude/region
  let phase = 1;
  if (c.lat < 64.0 && c.lon > -20.0) phase = 4; // south/east Iceland
  else if (c.lat < 64.0) phase = 4;
  else if (c.lat > 65.0) phase = 2; // north Iceland
  else if (c.lat > 64.5) phase = 1; // west mid Iceland

  toAdd.push({
    name,
    lat: Math.round(c.lat * 1e4) / 1e4,
    lon: Math.round(c.lon * 1e4) / 1e4,
    type: 'unplanned',
    phase,
    note: `Unplanned stop — ${c.photos.length} photo${c.photos.length>1?'s':''} taken here.`
  });
});

console.log('\nAdding stops:');
let added = 0;
toAdd.forEach(s => {
  if (d.stops.find(x => x.name === s.name)) {
    console.log('  skip (exists):', s.name);
    return;
  }
  d.stops.push(s);
  console.log(`  ✓ [Ph${s.phase}] ${s.name}`);
  added++;
});

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log(`\nAdded ${added} stops. Total: ${d.stops.length}`);

