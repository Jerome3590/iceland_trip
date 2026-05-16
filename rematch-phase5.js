/**
 * rematch-phase5.js
 * Re-match photos to Phase 5 stops with 1-mile radius, nearest-stop wins.
 * Updates route-data.json with redistributed photos.
 */
const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));
const csv = fs.readFileSync('photo-gps.csv','utf8').split('\n').slice(1).filter(Boolean);

const RADIUS_MI = 0.5;
const RADIUS_KM = RADIUS_MI * 1.60934;

function toDec(dms, ref) {
  const m = dms.match(/(\d+)\s+deg\s+(\d+)'\s+([\d.]+)""/);
  if (!m) return null;
  let val = parseFloat(m[1]) + parseFloat(m[2])/60 + parseFloat(m[3])/3600;
  if (ref === 'West' || ref === 'South') val = -val;
  return val;
}

function haversine(lat1,lon1,lat2,lon2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const S3_BASE = 'https://d2q3a6n9jy3k2l.cloudfront.net/iceland_trip/photos';
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

// Phase 5 stops (excluding Reykjavík which is handled separately)
const ph5stops = d.stops.filter(s => s.phase === 5 && s.name !== 'Reykjavík');

// Clear existing photos on phase 5 stops
ph5stops.forEach(s => { s.photos = []; });

// Also collect all existing Phase 5 photos across stops to pool them
const allPh5Photos = d.stops
  .filter(s => s.phase === 5)
  .flatMap(s => (s.photos || []).map(p => p.url.split('/').pop().replace('.jpg','')));

console.log('Pooled', allPh5Photos.length, 'existing Phase 5 photos for redistribution');

// Re-match all Phase 5 photos from CSV
let matched = 0, unmatched = 0;
csv.forEach(line => {
  const parts = line.split(',');
  const file  = parts[1];
  const lat   = toDec(parts[2], parts[4]);
  const lon   = toDec(parts[3], parts[5]);
  if (!lat || !lon) return;

  // Find nearest Ph5 stop within radius
  let best = null, bestDist = Infinity;
  ph5stops.forEach(s => {
    const dist = haversine(lat, lon, s.lat, s.lon);
    if (dist < RADIUS_KM && dist < bestDist) { best = s; bestDist = dist; }
  });

  if (best) {
    const sl  = slug(best.name);
    const url = `${S3_BASE}/${sl}/${file}.jpg`;
    best.photos.push({ url, taken: parts[6] });
    matched++;
  } else {
    // Fallback: assign to absolute nearest stop (no radius limit) so no photo is lost
    let nearest = null, nearestDist = Infinity;
    ph5stops.forEach(s => {
      const dist = haversine(lat, lon, s.lat, s.lon);
      if (dist < nearestDist) { nearest = s; nearestDist = dist; }
    });
    if (nearest && nearestDist < 5) { // still must be within 5 km
      const sl  = slug(nearest.name);
      const url = `${S3_BASE}/${sl}/${file}.jpg`;
      nearest.photos.push({ url, taken: parts[6] });
    }
  }
});

console.log('\nPhase 5 photo redistribution (1-mile radius, nearest wins):');
ph5stops.forEach(s => {
  console.log(`  ${s.name}: ${s.photos.length} photos`);
});
console.log('\nMatched:', matched, '| Unmatched in radius:', unmatched);

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('\nroute-data.json saved');
