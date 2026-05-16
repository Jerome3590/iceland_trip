const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// The broken onclick: stop.name.replace is literal text, not in a template expression
const OLD = `onclick=\"window.__openLightbox(window.__pr['\"+stop.name.replace(/'/g,\"\\\\\\\\'\")+\"'],\${i})\"`;

// Fix: put stop.name inside ${} so it's evaluated, HTML-encode any single quotes
const NEW = `onclick=\"window.__openLightbox(window.__pr['\${stop.name.replace(/'/g,\\\"\\\\'\\\")}'],\${i})\"`;

if (!src.includes(OLD)) {
  console.error('Old pattern not found. Actual content:');
  const idx = src.indexOf('__openLightbox');
  console.log(JSON.stringify(src.substring(idx - 10, idx + 150)));
  process.exit(1);
}

src = src.replace(OLD, NEW);
console.log('✓ Fixed onclick — stop.name now evaluated in template expression');

fs.writeFileSync('app.js', src);

// Verify
const check = src.indexOf('__openLightbox');
console.log('Result:', JSON.stringify(src.substring(check - 5, check + 100)));
