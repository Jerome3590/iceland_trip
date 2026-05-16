// Cluster unmatched photos by location to identify missing stops
const u = require('./unmatched.json').filter(p => !p.reason); // exclude no-GPS

function haversine(lat1,lon1,lat2,lon2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// Simple greedy clustering: 3km radius
const CLUSTER_R = 3;
const clusters = [];
for (const p of u) {
  const c = clusters.find(c => haversine(p.lat, p.lon, c.lat, c.lon) < CLUSTER_R);
  if (c) { c.photos.push(p); c.lat=(c.photos.reduce((s,x)=>s+x.lat,0)/c.photos.length); c.lon=(c.photos.reduce((s,x)=>s+x.lon,0)/c.photos.length); }
  else clusters.push({ lat:p.lat, lon:p.lon, photos:[p] });
}

clusters.sort((a,b) => b.photos.length - a.photos.length);
console.log('Clusters (>2 photos):');
clusters.filter(c=>c.photos.length>2).forEach(c => {
  console.log(`  ${String(c.photos.length).padStart(4)} photos | ${c.lat.toFixed(4)}, ${c.lon.toFixed(4)} | e.g. ${c.photos[0].file}`);
});
console.log('\nSmall clusters (1-2 photos):', clusters.filter(c=>c.photos.length<=2).length);
