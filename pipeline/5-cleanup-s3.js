/**
 * cleanup-s3.js
 * Deletes S3 photo files that are no longer referenced in route-data.json.
 * Safe: only removes files NOT in any stop's photos array.
 * Pass --dry-run to preview without deleting.
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');
const CF  = 'https://jerome-dixon.io';
const S3  = 's3://jerome-dixon.io';
const DATA = path.join(__dirname, '../data');

const d = JSON.parse(fs.readFileSync(path.join(DATA, 'route-data.json'), 'utf8'));

// Build set of all referenced S3 keys
const referenced = new Set();
d.stops.forEach(s => (s.photos || []).forEach(p => {
  const key = p.url.replace(`${CF}/`, '');
  referenced.add(key);
}));
console.log(`Referenced in route-data.json: ${referenced.size} files`);

// Read manifest of all S3 files
const manifest = fs.readFileSync(path.join(DATA, 's3-manifest.txt'), 'utf8')
  .split('\n').filter(Boolean);

const toDelete = [];
manifest.forEach(line => {
  const parts = line.trim().split(/\s+/);
  const key   = parts[parts.length - 1];
  if (!referenced.has(key)) toDelete.push(key);
});

console.log(`\nTo delete (unreferenced): ${toDelete.length} files`);

// Group by folder for readability
const byFolder = {};
toDelete.forEach(k => {
  const folder = k.split('/').slice(0, -1).join('/');
  if (!byFolder[folder]) byFolder[folder] = [];
  byFolder[folder].push(k);
});

Object.entries(byFolder).sort().forEach(([folder, files]) => {
  console.log(`\n  ${folder}/ (${files.length} files)`);
  files.slice(0, 3).forEach(f => console.log(`    ${f.split('/').pop()}`));
  if (files.length > 3) console.log(`    ... +${files.length - 3} more`);
});

if (DRY_RUN) {
  console.log('\n[DRY RUN] — rerun without --dry-run to delete');
  process.exit(0);
}

console.log('\nDeleting...');
let deleted = 0, failed = 0;
toDelete.forEach(key => {
  try {
    execSync(`aws s3 rm "${S3}/${key}" --quiet`);
    deleted++;
  } catch (e) {
    console.error(`  FAILED: ${key}`);
    failed++;
  }
});

console.log(`\nDeleted: ${deleted} | Failed: ${failed}`);

