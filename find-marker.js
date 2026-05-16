const s = require('fs').readFileSync('app.js','utf8');
const logic = s.substring(s.indexOf('\nconst iconSvg'));
let p = 0, hits = [];
while ((p = logic.indexOf('stop-marker', p)) !== -1) { hits.push(p); p++; }
console.log('Hits:', hits.length);
hits.forEach(i => console.log('\n---\n', logic.substring(i-60, i+100)));

