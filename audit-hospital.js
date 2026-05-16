const fs = require('fs');
const d   = require('./route-data.json');
const csv = fs.readFileSync('photo-gps.csv','utf8').split('\n').slice(1).filter(Boolean);

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

const stops5 = d.stops.filter(s => s.phase === 5 && s.name !== 'Reykjavík');
const h = d.stops.find(s => s.name.includes('Hospital'));
const fileNames = h.photos.map(p => p.url.split('/').pop().replace('.jpg',''));

console.log('Hospital photo coordinates + nearest Ph5 stop:\n');

fileNames.forEach(f => {
  const row = csv.find(r => r.includes(f.replace('.HEIC','').replace('.JPG','').replace('.PNG','')));
  if (!row) return;
  const parts = row.split(',');
  const lat = toDec(parts[2], parts[4]);
  const lon = toDec(parts[3], parts[5]);
  if (!lat || !lon) return;

  // Find nearest Phase 5 stop
  let nearest = null, minDist = Infinity;
  stops5.forEach(s => {
    const dist = haversine(lat, lon, s.lat, s.lon);
    if (dist < minDist) { minDist = dist; nearest = s.name; }
  });

  console.log(`  ${f.padEnd(20)} ${lat.toFixed(4)}, ${lon.toFixed(4)}  →  ${nearest} (${(minDist*0.621).toFixed(2)} mi)`);
});
