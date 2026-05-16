const d = require('./route-data.json');

for (let ph = 1; ph <= 5; ph++) {
  const stops = d.stops.filter(s => s.phase === ph);
  if (!stops.length) continue;
  console.log(`\n=== PHASE ${ph} ===`);
  stops.forEach(s => {
    const n     = s.photos ? s.photos.length : 0;
    const tag   = s.type === 'unplanned' ? '[UNPLANNED]' : '[PLANNED]  ';
    const photo = n ? `📷 ${n}` : '❌ no photos';
    console.log(`  ${tag} ${photo.padEnd(12)} | ${s.name}`);
  });
  const planned   = stops.filter(s => s.type !== 'unplanned');
  const withPhoto = planned.filter(s => s.photos && s.photos.length);
  const missed    = planned.filter(s => !s.photos || !s.photos.length);
  if (missed.length) {
    console.log(`  → Planned but NO photos: ${missed.map(s=>s.name).join(', ')}`);
  }
}
