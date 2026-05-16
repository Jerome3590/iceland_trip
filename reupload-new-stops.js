/**
 * reupload-new-stops.js
 * For each stop whose photos live under a different S3 slug,
 * copy the files to the canonical new slug path and update URLs.
 * Uses: aws s3 cp (server-side copy, no download needed)
 */
const fs   = require('fs');
const { execSync } = require('child_process');

const d   = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));
const CF  = 'https://jerome-dixon.io';
const S3  = 's3://jerome-dixon.io';

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Stops that didn't exist at upload time — need canonical S3 paths
const NEW_STOP_NAMES = [
  'Route 1 — Skaftá Lava Field',
  'Route 1 — Vík Approach',
  'Skógar / Þórsmörk Trail',
  'Route 1 — Hvalfjörður South',
  'Route 1 — Seljalands Valley',
  'Keflavík Town Tour',
  'Bifröst / Grábrók Crater',     // repinned — check if slug matches S3 folder
  'Deildartunguhver / Reykholt',  // repinned — check if slug matches S3 folder
  'Urriðafoss',                   // repinned — check if slug matches S3 folder
];

let totalCopied = 0, totalSkipped = 0;

NEW_STOP_NAMES.forEach(stopName => {
  const stop = d.stops.find(s => s.name === stopName);
  if (!stop || !stop.photos?.length) {
    console.log(`${stopName}: no photos, skipping`);
    return;
  }

  const canonSlug = `iceland_trip/photos/${slug(stopName)}`;
  console.log(`\n${stopName} (${stop.photos.length} photos)`);
  console.log(`  → ${canonSlug}/`);

  let copied = 0;
  stop.photos.forEach(p => {
    const fname      = p.url.split('/').pop();
    const currentKey = p.url.replace(`${CF}/`, '');   // iceland_trip/photos/old-slug/file.jpg
    const newKey     = `${canonSlug}/${fname}`;
    const newUrl     = `${CF}/${newKey}`;

    if (currentKey === newKey) {
      totalSkipped++; return; // already at canonical path
    }

    try {
      execSync(`aws s3 cp "${S3}/${currentKey}" "${S3}/${newKey}" --content-type image/jpeg --cache-control "public,max-age=31536000" --quiet`);
      p.url = newUrl;
      copied++;
    } catch (e) {
      console.error(`  FAILED: ${fname}`, e.message.substring(0, 80));
    }
  });

  console.log(`  Copied: ${copied}, Already canonical: ${stop.photos.length - copied}`);
  totalCopied += copied;
});

console.log(`\nTotal copied: ${totalCopied} | Already OK: ${totalSkipped}`);
fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('route-data.json saved');

