/**
 * fix-lightbox3.js — clean delegated-event approach
 * - Popup thumbnails get data-stop and data-idx attributes (no inline onclick)
 * - A single delegated listener on document handles gallery clicks
 * - window.__pr registry stores URLs per stop name (set on popup open)
 */
const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// ── 1. Fix popup gallery HTML — use data attrs, no inline onclick ─────────────
// Find current broken onclick pattern (any variant)
const OLD_IMG = src.match(/`<img src="\$\{p\.url\}"[^`]+onclick="[^`]*__openLightbox[^`]*" \/>`/);
if (!OLD_IMG) { console.error('Cannot find img pattern'); process.exit(1); }
console.log('Found img pattern:', OLD_IMG[0].substring(0,80)+'...');

const NEW_IMG = '`<img src="${p.url}" alt="Photo ${i+1} at ${h(stop.name)}" loading="lazy" data-stop="${stop.name.replace(/\"/g,\'&quot;\')}" data-idx="${i}" class="gallery-thumb" />`';
src = src.replace(OLD_IMG[0], NEW_IMG);
console.log('✓ Replaced inline onclick with data-stop/data-idx attributes');

// ── 2. Inject delegated click handler after the map init ─────────────────────
const DELEGATE = `
// ── Gallery delegated click handler ──────────────────────────────────────────
document.addEventListener('click', function(e) {
  const img = e.target.closest('.gallery-thumb');
  if (!img) return;
  const stopName = img.dataset.stop;
  const idx      = parseInt(img.dataset.idx, 10);
  const urls     = window.__pr && window.__pr[stopName];
  if (!urls) return;
  window.__openLightbox(urls, idx);
});
`;

const MARKER = `if(window.maplibregl){init()}else{window.addEventListener('load',init)}`;
if (!src.includes(MARKER)) { console.error('Cannot find init marker'); process.exit(1); }
src = src.replace(MARKER, MARKER + DELEGATE);
console.log('✓ Delegated click handler injected');

fs.writeFileSync('app.js', src);

// Verify
const check = src.indexOf('gallery-thumb');
console.log('\nVerify img tag:', src.substring(check - 10, check + 100));

