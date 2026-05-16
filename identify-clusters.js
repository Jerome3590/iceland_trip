// Known Iceland landmarks to reverse-match clusters against
const landmarks = [
  { name: 'Fjaðrárgljúfur Canyon',     lat: 63.7764, lon: -18.1756 },
  { name: 'Kirkjubæjarklaustur',        lat: 63.7975, lon: -18.0573 },
  { name: 'Glaumbaer Turf Farm',        lat: 65.5373, lon: -19.6789 },
  { name: 'Hraunfossar / Húsafell',     lat: 64.7090, lon: -21.1393 },
  { name: 'Snæfellsjökull Glacier',     lat: 64.8023, lon: -23.7779 },
  { name: 'Arnarstapi',                 lat: 64.7663, lon: -23.6285 },
  { name: 'Lýsuhóll / Snæfellsnes',    lat: 64.8437, lon: -22.7800 },
  { name: 'Þórsmörk',                   lat: 63.6838, lon: -19.5038 },
  { name: 'Seljavallalaug',             lat: 63.5505, lon: -19.7735 },
  { name: 'Dyrhólaey',                  lat: 63.4025, lon: -19.1292 },
  { name: 'Eyjafjallajökull viewpoint', lat: 63.6340, lon: -19.6275 },
  { name: 'Borgarnes',                  lat: 64.5383, lon: -21.9225 },
  { name: 'Hvalfjörður area',           lat: 64.2328, lon: -21.8158 },
  { name: 'Hvammstangi',                lat: 65.5095, lon: -20.9500 },
  { name: 'Varmahlíð',                  lat: 65.5500, lon: -19.5300 },
  { name: 'Eiríksstaðir',              lat: 64.8763, lon: -21.7748 },
  { name: 'Deildartunguhver',           lat: 64.6822, lon: -21.4067 },
  { name: 'Bifröst / Grábrók',         lat: 64.7937, lon: -21.7153 },
];

function haversine(lat1,lon1,lat2,lon2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const clusters = [
  { count: 118, lat: 63.7777, lon: -18.1736 },
  { count:  88, lat: 64.7715, lon: -21.5355 },
  { count:  23, lat: 63.7922, lon: -18.0384 },
  { count:  13, lat: 65.5095, lon: -19.6902 },
  { count:  11, lat: 64.2328, lon: -21.8158 },
  { count:   9, lat: 64.3913, lon: -21.4278 },
  { count:   9, lat: 63.5508, lon: -19.7738 },
  { count:   8, lat: 64.4478, lon: -21.5346 },
];

console.log('Cluster identification:\n');
clusters.forEach(c => {
  const scored = landmarks.map(l => ({ ...l, dist: haversine(c.lat, c.lon, l.lat, l.lon) }))
    .sort((a,b) => a.dist - b.dist);
  const best = scored[0];
  console.log(`${String(c.count).padStart(4)} photos | ${c.lat}, ${c.lon}`);
  console.log(`  → ${best.name} (${best.dist.toFixed(1)} km away)`);
  console.log(`  2nd: ${scored[1].name} (${scored[1].dist.toFixed(1)} km)`);
  console.log();
});

