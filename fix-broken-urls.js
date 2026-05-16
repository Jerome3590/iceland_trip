/**
 * fix-broken-urls.js
 * Builds filename → real S3 URL from s3-manifest.txt, then patches all
 * photo URLs in route-data.json to point to actual uploaded files.
 */
const fs  = require('fs');
const d   = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));
const CF  = 'https://jerome-dixon.io';

// Build filename → S3 path map from manifest
const manifest = fs.readFileSync('s3-manifest.txt', 'utf8')
  .split('\n').filter(Boolean);

const s3Map = {};   // IMG_XXXX.HEIC.jpg → full CF URL
manifest.forEach(line => {
  // line: "2026-05-16 15:53:55  143356 iceland_trip/photos/akureyri/IMG_8890.HEIC.jpg"
  const parts = line.trim().split(/\s+/);
  const key   = parts[parts.length - 1]; // e.g. iceland_trip/photos/akureyri/IMG_8890.HEIC.jpg
  const fname = key.split('/').pop();     // IMG_8890.HEIC.jpg
  s3Map[fname] = `${CF}/${key}`;
});

console.log(`S3 manifest: ${Object.keys(s3Map).length} files indexed\n`);

let fixed = 0, missing = 0, already = 0;

d.stops.forEach(stop => {
  (stop.photos || []).forEach(p => {
    const fname = p.url.split('/').pop();
    const correct = s3Map[fname];
    if (!correct) {
      console.warn(`  MISSING on S3: ${fname} (stop: ${stop.name})`);
      missing++;
    } else if (p.url !== correct) {
      p.url = correct;
      fixed++;
    } else {
      already++;
    }
  });
});

console.log(`Fixed:   ${fixed} URLs`);
console.log(`Already: ${already} correct`);
console.log(`Missing: ${missing} (not on S3)`);

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('\nroute-data.json saved');

