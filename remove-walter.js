const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

const before = d.turns.length;
d.turns = d.turns.filter(t => !JSON.stringify(t).toLowerCase().includes('walter mitty'));
console.log(`Removed ${before - d.turns.length} turn entry(s). Remaining: ${d.turns.length}`);

fs.writeFileSync('route-data.json', JSON.stringify(d));
