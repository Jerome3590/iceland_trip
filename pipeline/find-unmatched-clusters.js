/**
 * find-unmatched-clusters.js
 * Finds photos outside 3-mile radius of any stop, clusters them at 3-mile 
 * increments, identifies location, and adds missing stops.
 */
const fs   = require('fs');
const path = require('path');
const DATA  = path.join(__dirname, '../data');
const d   = JSON.parse(fs.readFileSync(path.join(DATA, 'route-data.json'), 'utf8'));
const csv = fs.readFileSync(path.join(DATA, 'photo-gps.csv'),'utf8').split('\n').slice(1).filter(Boolean);

const RADIUS_KM = 3 * 1.60934; // 3 miles

function toDec(dms, ref) {
  if (!dms) return null;
  const r = (ref||'').trim().toUpperCase();
  const neg = r==='S'||r==='W'||r==='SOUTH'||r==='WEST';
  if (/^-?\d+(\.\d+)?$/.test(dms.trim())) { let n=parseFloat(dms); if(neg)n=-Math.abs(n); return n; }
  const m = dms.match(/(\d+)\s*deg\s*(\d+)'\s*([\d.]+)/);
  if (!m) return null;
  let v = parseFloat(m[1]) + parseFloat(m[2])/60 + parseFloat(m[3])/3600;
  if (neg) v=-v; return v;
}
function haversine(a,b,c,e){
  const R=6371,dL=(c-a)*Math.PI/180,dO=(e-b)*Math.PI/180;
  const x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

const VIDEO = /\.(mp4|mov|avi|m4v|mkv|wmv|3gp)$/i;

// Collect unmatched photos
const unmatched = [];
csv.forEach(line => {
  const parts = line.split(',');
  const file  = parts[1];
  if (!file || VIDEO.test(file)) return;
  const lat = toDec(parts[2], parts[4]);
  const lon = toDec(parts[3], parts[5]);
  if (!lat || !lon) return;

  const nearest = d.stops.reduce((best, s) => {
    const dist = haversine(lat, lon, s.lat, s.lon);
    return dist < best.dist ? { stop: s, dist } : best;
  }, { stop: null, dist: Infinity });

  if (nearest.dist > RADIUS_KM) {
    unmatched.push({ file, lat, lon, nearest: nearest.stop?.name, nearestMi: (nearest.dist*0.621).toFixed(1) });
  }
});

console.log(`${unmatched.length} unmatched photos — clustering at 3-mile radius:\n`);

// Greedy 3-mile cluster
const clusters = [];
const used = new Set();
unmatched.forEach((p, i) => {
  if (used.has(i)) return;
  const cluster = [p];
  used.add(i);
  unmatched.forEach((q, j) => {
    if (used.has(j)) return;
    if (haversine(p.lat, p.lon, q.lat, q.lon) <= RADIUS_KM) {
      cluster.push(q); used.add(j);
    }
  });
  const avgLat = cluster.reduce((s,x)=>s+x.lat,0)/cluster.length;
  const avgLon = cluster.reduce((s,x)=>s+x.lon,0)/cluster.length;
  clusters.push({ lat: avgLat, lon: avgLon, count: cluster.length, photos: cluster });
});

clusters.sort((a,b) => b.count - a.count);

// Find nearest existing stop + date range for each cluster
clusters.forEach(c => {
  const nearest = d.stops.reduce((best, s) => {
    const dist = haversine(c.lat, c.lon, s.lat, s.lon);
    return dist < best.dist ? { name: s.name, phase: s.phase, dist } : best;
  }, { name: null, dist: Infinity });

  const dates = c.photos.map(p => p.file).filter(Boolean);
  const sample = c.photos[0];
  
  console.log(`Cluster (${c.count} photos) @ ${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}`);
  console.log(`  Nearest stop: ${nearest.name} (Ph${nearest.phase}, ${(nearest.dist*0.621).toFixed(1)} mi away)`);
  console.log(`  Sample file: ${sample?.file}, nearest to: ${sample?.nearest} (${sample?.nearestMi} mi)`);
  console.log();
});

// Also show where Deildartunguhver and Urridafoss photos ended up
console.log('=== Stops still with 0 photos ===');
d.stops.filter(s => !s.photos || s.photos.length === 0).forEach(s => {
  // Find closest photos
  const close = unmatched.filter(p => haversine(p.lat, p.lon, s.lat, s.lon) < 20);
  console.log(`${s.name} (Ph${s.phase}) @ ${s.lat}, ${s.lon} — ${close.length} unmatched photos within 20km`);
  if (close.length) {
    const nearest = close.sort((a,b) => haversine(a.lat,a.lon,s.lat,s.lon) - haversine(b.lat,b.lon,s.lat,s.lon))[0];
    console.log(`  Closest unmatched: ${nearest.file} @ ${nearest.lat.toFixed(4)},${nearest.lon.toFixed(4)} (${nearest.nearestMi} mi from nearest stop)`);
  }
});

