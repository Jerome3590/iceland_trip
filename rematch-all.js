/**
 * rematch-all.js
 * Re-match ALL photos to stops using nearest-stop-wins within 3-mile radius.
 * Preserves existing S3 URLs — only reassigns which stop array a photo lives in.
 * Run: node rematch-all.js
 */
const fs = require('fs');
const d   = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));
const csv = fs.readFileSync('photo-gps.csv','utf8').split('\n').slice(1).filter(Boolean);

const RADIUS_MI = 3.0;
const RADIUS_KM = RADIUS_MI * 1.60934;

function toDec(dms, ref) {
  if (!dms) return null;
  const r = (ref || '').trim().toUpperCase();
  const neg = r === 'S' || r === 'W' || r === 'SOUTH' || r === 'WEST';
  if (/^-?\d+(\.\d+)?$/.test(dms.trim())) {
    let n = parseFloat(dms); if (neg) n = -Math.abs(n); return n;
  }
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

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

const CF = 'https://d2q3a6n9jy3k2l.cloudfront.net/iceland_trip/photos';

// Build filename → existing S3 URL map from current route-data
const existingUrls = {};
d.stops.forEach(s => (s.photos || []).forEach(p => {
  const fname = p.url.split('/').pop();
  existingUrls[fname] = p.url;
}));
console.log(`Existing URL cache: ${Object.keys(existingUrls).length} photos`);

// Clear all stop photos
d.stops.forEach(s => { s.photos = []; });

// Re-match from CSV
const VIDEO = /\.(mp4|mov|avi|m4v|mkv|wmv|3gp)$/i;
let matched = 0, unmatched = 0, noGps = 0;

const before = {};
csv.forEach(line => {
  const parts = line.split(',');
  const file  = parts[1];
  if (!file || VIDEO.test(file)) return;

  const lat = toDec(parts[2], parts[4]);
  const lon = toDec(parts[3], parts[5]);
  if (lat === null || lon === null) { noGps++; return; }

  // Nearest stop within 3 miles
  let best = null, bestDist = Infinity;
  d.stops.forEach(s => {
    const dist = haversine(lat, lon, s.lat, s.lon);
    if (dist < RADIUS_KM && dist < bestDist) { best = s; bestDist = dist; }
  });

  if (best) {
    // Use existing S3 URL if available, otherwise construct from new stop slug
    const url = existingUrls[file + '.jpg'] ||
                existingUrls[file] ||
                `${CF}/${slug(best.name)}/${file}.jpg`;
    best.photos.push({ url, taken: parts[6] });
    matched++;
  } else {
    unmatched++;
  }
});

console.log(`\nMatched: ${matched} | No GPS: ${noGps} | Outside 3mi: ${unmatched}`);
console.log('\nStop photo counts after re-match:');
d.stops
  .filter(s => s.photos.length > 0)
  .sort((a,b) => b.photos.length - a.photos.length)
  .forEach(s => console.log(`  Ph${s.phase} ${String(s.photos.length).padStart(4)} | ${s.name}`));

const empty = d.stops.filter(s => s.photos.length === 0);
if (empty.length) {
  console.log('\nStops with no photos:');
  empty.forEach(s => console.log(`  Ph${s.phase} | ${s.name}`));
}

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('\nroute-data.json saved');
