/**
 * review-unmatched.js
 * Generates data/unmatched-review.html — a local thumbnail viewer for all
 * photos in unmatched.json. Opens the file in the default browser.
 * Usage: node review-unmatched.js
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PHOTOS_DIR  = path.resolve(__dirname, '../photos', 'Iceland Trip');
const UNMATCHED   = path.join(__dirname, '../data/unmatched.json');
const OUT_HTML    = path.join(__dirname, '../data', 'unmatched-review.html');

const photos = JSON.parse(fs.readFileSync(UNMATCHED, 'utf8'));

function toFileUrl(absPath) {
  return 'file:///' + absPath.replace(/\\/g, '/');
}

function badge(p) {
  if (p.reason === 'no GPS') return '<span class="badge nogps">No GPS</span>';
  return `<span class="badge outofrange">GPS · ${(p.dist_km / 1.60934).toFixed(0)} mi from nearest stop</span>`;
}

function meta(p) {
  const lines = [];
  if (p.taken)        lines.push(`<b>Taken:</b> ${p.taken}`);
  if (p.lat)          lines.push(`<b>Coords:</b> ${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`);
  if (p.nearest_stop) lines.push(`<b>Nearest:</b> ${p.nearest_stop}`);
  if (p.dist_km)      lines.push(`<b>Distance:</b> ${p.dist_km.toFixed(1)} km · ${(p.dist_km * 0.621).toFixed(1)} mi`);
  return lines.join('<br>');
}

function card(p) {
  const abs  = path.join(PHOTOS_DIR, p.file);
  const url  = toFileUrl(abs);
  const ext  = path.extname(p.file).toLowerCase();
  const isImg = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  const isHeic = ext === '.heic';

  const thumb = isImg
    ? `<a href="${url}" target="_blank"><img src="${url}" alt="${p.file}"></a>`
    : isHeic
      ? `<a href="${url}" target="_blank" class="heic-link">📷 ${p.file}<br><small>HEIC — click to open</small></a>`
      : `<a href="${url}" target="_blank" class="heic-link">📄 ${p.file}</a>`;

  return `
  <div class="card">
    <div class="thumb">${thumb}</div>
    <div class="info">
      ${badge(p)}
      <div class="filename">${p.file}</div>
      <div class="meta">${meta(p)}</div>
    </div>
  </div>`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Unmatched Photos Review</title>
<style>
  body { font-family: sans-serif; background: #111; color: #eee; margin: 0; padding: 20px; }
  h1   { font-size: 1.3rem; margin-bottom: 4px; }
  p.sub { color: #888; font-size: .85rem; margin: 0 0 20px; }
  .grid { display: flex; flex-wrap: wrap; gap: 16px; }
  .card { background: #1e1e1e; border-radius: 8px; overflow: hidden; width: 220px; }
  .thumb { width: 220px; height: 165px; background: #2a2a2a; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; }
  .heic-link { color: #7aadff; text-align: center; padding: 12px; display: block; text-decoration: none; font-size: .85rem; }
  .info { padding: 10px 12px 12px; }
  .badge { display: inline-block; font-size: .7rem; padding: 2px 7px; border-radius: 4px; margin-bottom: 6px; font-weight: 600; }
  .nogps     { background: #444; color: #bbb; }
  .outofrange { background: #5a2a00; color: #ffa060; }
  .filename  { font-size: .8rem; color: #ccc; word-break: break-all; margin-bottom: 6px; }
  .meta      { font-size: .75rem; color: #888; line-height: 1.6; }
</style>
</head>
<body>
<h1>Unmatched Photos — ${photos.length} total</h1>
<p class="sub">
  ${photos.filter(p => p.reason === 'no GPS').length} no GPS &nbsp;·&nbsp;
  ${photos.filter(p => p.lat).length} GPS but out of range
  &nbsp;·&nbsp; Source: unmatched.json
</p>
<div class="grid">
${photos.map(card).join('')}
</div>
</body>
</html>`;

fs.writeFileSync(OUT_HTML, html, 'utf8');
console.log(`Written: ${OUT_HTML}`);

// Open in default browser
try {
  execSync(`start "" "${OUT_HTML}"`);
} catch (e) {
  console.log('Open manually:', OUT_HTML);
}
