const d = require('./route-data.json');
d.stops.forEach(s => {
  const n   = s.photos ? s.photos.length : 0;
  const tag = s.type === 'unplanned' ? '[ACT]' : '[PLN]';
  console.log(`[Ph${s.phase}] ${tag} ${String(n).padStart(3)}ph | ${s.name}`);
});
console.log('\nTotal stops:', d.stops.length);

