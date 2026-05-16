const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// Find the stop marker creation block and add unplanned class + popup photo count
const OLD_MARKER = `el.className='marker '+(stop.type==='base camp'?'base':'');`;
const NEW_MARKER = `el.className='marker'+(stop.type==='base camp'?' base':stop.type==='unplanned'?' unplanned':'')+'';`;

if (!src.includes(OLD_MARKER)) { console.error('Cannot find marker className — pattern:\n'+OLD_MARKER); process.exit(1); }
src = src.replace(OLD_MARKER, NEW_MARKER);
console.log('✓ Added unplanned class to stop markers');

// Enhance popup to show photo count if stop has photos
const OLD_POPUP = `\`<div class="popup-title">\${h(stop.name)}</div><div class="popup-note"><strong>\${h(stop.type)}</strong><br>\${h(stop.note)}</div>\``;
const NEW_POPUP = `\`<div class="popup-title">\${h(stop.name)}</div><div class="popup-note"><strong>\${h(stop.type==='unplanned'?'📍 Unplanned stop':stop.type)}</strong><br>\${h(stop.note)}\${stop.photos&&stop.photos.length?\`<br><span class="popup-photos">📷 \${stop.photos.length} photos taken here</span>\`:''}</div>\``;

if (!src.includes(OLD_POPUP)) { console.error('Cannot find popup HTML'); process.exit(1); }
src = src.replace(OLD_POPUP, NEW_POPUP);
console.log('✓ Popup shows photo count for stops with photos');

fs.writeFileSync('app.js', src);
console.log('app.js updated');

