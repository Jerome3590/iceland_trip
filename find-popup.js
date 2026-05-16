const s = require('fs').readFileSync('app.js', 'utf8');
const i = s.indexOf('popup-title');
if (i === -1) { console.log('Not found'); process.exit(); }
// Find the popup content generation block
let p = i;
while (p > 0 && s[p] !== '`' && s.substring(p-2,p) !== '()') p--;
console.log(s.substring(i - 100, i + 400));
