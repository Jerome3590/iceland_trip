/**
 * fix-lost-stops.js
 * 1. Remove duplicate Ph5 Reykjavík
 * 2. Find actual photo centroid for stops that lost photos at 3mi radius
 * 3. Re-pin those stops to centroid, then re-run rematch
 */
const fs  = require('fs');
const d   = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));
const csv = fs.readFileSync('photo-gps.csv','utf8').split('\n').slice(1).filter(Boolean);

function toDec(dms, ref) {
  if (!dms) return null;
  const r = (ref || '').trim().toUpperCase();
  const neg = r === 'S' || r === 'W' || r === 'SOUTH' || r === 'WEST';
  if (/^-?\d+(\.\d+)?$/.test(dms.trim())) { let n=parseFloat(dms); if(neg)n=-Math.abs(n); return n; }
  const m = dms.match(/(\d+)\s*deg\s*(\d+)'\s*([\d.]+)/);
  if (!m) return null;
  let v = parseFloat(m[1]) + parseFloat(m[2])/60 + parseFloat(m[3])/3600;
  if (neg) v = -v; return v;
}
function haversine(lat1,lon1,lat2,lon2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ── 1. Remove duplicate Ph5 Reykjavík ────────────────────────────────────────
const before = d.stops.length;
d.stops = d.stops.filter(s => !(s.name === 'Reykjavík' && s.phase === 5));
console.log(`Removed ${before - d.stops.length} duplicate Ph5 Reykjavík`);

// ── 2. Find centroid of photos that were originally at these stops ────────────
// We know filenames from the S3 URLs stored before rematch wiped them
// Instead, search CSV for photos near original pin within 15 miles
const REPIN_STOPS = [
  { name: 'Deildartunguhver / Reykholt', lat: 64.6636, lon: -21.4106 },
  { name: 'Bifröst / Grábrók Crater',    lat: 64.7937, lon: -21.7153 },
  { name: 'Urriðafoss',                  lat: 63.9242, lon: -20.6725 },
];

const SEARCH_KM = 25; // wide net to find photos

REPIN_STOPS.forEach(target => {
  const nearby = [];
  csv.forEach(line => {
    const parts = line.split(',');
    const lat = toDec(parts[2], parts[4]);
    const lon = toDec(parts[3], parts[5]);
    if (!lat || !lon) return;
    const dist = haversine(lat, lon, target.lat, target.lon);
    if (dist < SEARCH_KM) nearby.push({ lat, lon, dist });
  });

  if (!nearby.length) {
    console.log(`\n${target.name}: no photos within ${SEARCH_KM}km of pin`);
    return;
  }

  // Centroid of nearby photos
  const avgLat = nearby.reduce((s,p)=>s+p.lat,0)/nearby.length;
  const avgLon = nearby.reduce((s,p)=>s+p.lon,0)/nearby.length;
  const minDist = Math.min(...nearby.map(p=>p.dist));
  const maxDist = Math.max(...nearby.map(p=>p.dist));

  console.log(`\n${target.name}:`);
  console.log(`  ${nearby.length} photos within ${SEARCH_KM}km`);
  console.log(`  dist range: ${(minDist*0.621).toFixed(2)}–${(maxDist*0.621).toFixed(2)} mi from pin`);
  console.log(`  centroid: ${avgLat.toFixed(4)}, ${avgLon.toFixed(4)}`);

  // Update pin to centroid
  const stop = d.stops.find(s => s.name === target.name);
  if (stop) {
    stop.lat = Math.round(avgLat * 10000) / 10000;
    stop.lon = Math.round(avgLon * 10000) / 10000;
    console.log(`  ✓ Pin updated: ${stop.lat}, ${stop.lon}`);
  }
});

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('\nroute-data.json saved — now run: node rematch-all.js');
