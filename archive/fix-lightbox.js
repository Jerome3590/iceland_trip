const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// Find and replace the broken onclick pattern
const OLD = `onclick=\"window.__openLightbox(\${JSON.stringify(stop.photos.map(x=>x.url))},\${i})\"`;
const NEW = `onclick=\"window.__openLightbox(window.__pr['\"+stop.name.replace(/'/g,\"\\\\\\\\'\")+\"'],\${i})\"`;

if (!src.includes(OLD)) {
  console.error('Pattern not found — dumping context:');
  const i = src.indexOf('__openLightbox');
  console.log(src.substring(i-10, i+120));
  process.exit(1);
}

// Also inject the registry assignment before the gallery div
const OLD_GALLERY = `?'<div class=\"popup-gallery\">'`;
const NEW_GALLERY = `?(window.__pr=window.__pr||{},window.__pr[stop.name]=stop.photos.map(x=>x.url),'<div class=\"popup-gallery\">'`;

const OLD_CLOSE = `+'</div>'\n    :''`;
const NEW_CLOSE = `+'</div>')\n    :''`;

src = src.replace(OLD, NEW);
console.log('✓ Fixed onclick to use registry');

if (src.includes(OLD_GALLERY) && !src.includes('window.__pr=window.__pr')) {
  src = src.replace(OLD_GALLERY, NEW_GALLERY);
  src = src.replace(OLD_CLOSE, NEW_CLOSE);
  console.log('✓ Added photo registry assignment');
} else {
  console.log('  (registry already present or gallery pattern changed)');
}

fs.writeFileSync('app.js', src);
console.log('app.js patched');

