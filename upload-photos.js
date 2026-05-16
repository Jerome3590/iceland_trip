/**
 * upload-photos.js
 *
 * Converts all matched photos to JPEG (1200px wide, q80),
 * uploads to S3 organized by stop slug, updates route-data.json
 * with S3 URLs on each stop's photos array.
 *
 * Usage: node upload-photos.js
 */

const fs     = require('fs');
const path   = require('path');
const { execSync, spawn } = require('child_process');
const sharp       = require('sharp');
const heicConvert = require('heic-convert');

const PHOTOS_DIR  = path.resolve('./photos/Iceland Trip');
const WORK_DIR    = path.resolve('./photos-web');        // local converted cache
const S3_BUCKET   = 'jerome-dixon.io';
const S3_PREFIX   = 'iceland_trip/photos';
const CDN_BASE    = 'https://jerome-dixon.io/iceland_trip/photos';
const MAX_WIDTH   = 1200;
const QUALITY     = 80;
const CONCURRENCY = 8;

// ── Helpers ───────────────────────────────────────────────────────────────────
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function convertOne(srcFile, destFile) {
  const ext = path.extname(srcFile).toLowerCase();
  let inputBuffer;

  if (ext === '.heic' || ext === '.heif') {
    const raw = fs.readFileSync(srcFile);
    inputBuffer = await heicConvert({ buffer: raw, format: 'JPEG', quality: 1 });
  }

  const pipeline = inputBuffer
    ? sharp(Buffer.from(inputBuffer), { failOn: 'none' })
    : sharp(srcFile, { failOn: 'none' });

  await pipeline
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(destFile);
}

function s3Upload(localFile, s3Key) {
  execSync(
    `aws s3 cp "${localFile}" "s3://${S3_BUCKET}/${s3Key}" --content-type image/jpeg --cache-control "max-age=31536000,public"`,
    { stdio: 'pipe' }
  );
}

async function processQueue(items, worker, concurrency) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
    }
  });
  await Promise.all(workers);
}

// ── Main ──────────────────────────────────────────────────────────────────────
const photoStops = JSON.parse(fs.readFileSync('photo-stops.json', 'utf8'));
const routeData  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });

// Build work list
const tasks = [];
for (const { stop, photos } of photoStops) {
  const stopSlug = slug(stop);
  const outDir   = path.join(WORK_DIR, stopSlug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const photo of photos) {
    const srcExt  = path.extname(photo.file).toLowerCase();
    const baseName = path.basename(photo.file, srcExt) + '.jpg';
    const srcFile  = path.join(PHOTOS_DIR, photo.file);
    const destFile = path.join(outDir, baseName);
    const s3Key    = `${S3_PREFIX}/${stopSlug}/${baseName}`;
    const cdnUrl   = `${CDN_BASE}/${stopSlug}/${baseName}`;

    tasks.push({ stop, photo, srcFile, destFile, s3Key, cdnUrl, baseName });
  }
}

console.log(`Total photos to process: ${tasks.length} across ${photoStops.length} stops\n`);

let done = 0, errors = 0;
const urlMap = {}; // stopName → [url, ...]

(async () => {
  await processQueue(tasks, async ({ stop, photo, srcFile, destFile, s3Key, cdnUrl }) => {
    try {
      // Convert if not already done
      if (!fs.existsSync(destFile)) {
        await convertOne(srcFile, destFile);
      }
      // Upload
      s3Upload(destFile, s3Key);

      if (!urlMap[stop]) urlMap[stop] = [];
      urlMap[stop].push({ file: photo.file, url: cdnUrl, lat: photo.lat, lon: photo.lon, taken: photo.taken });

      done++;
      if (done % 50 === 0 || done === tasks.length) {
        process.stdout.write(`\r  ${done}/${tasks.length} uploaded...`);
      }
    } catch (err) {
      errors++;
      console.error(`\n  ✗ ${photo.file}: ${err.message}`);
    }
  }, CONCURRENCY);

  console.log(`\n\nDone: ${done} uploaded, ${errors} errors`);

  // ── Patch route-data.json with S3 URLs ─────────────────────────────────────
  for (const stopObj of routeData.stops) {
    if (urlMap[stopObj.name]) {
      stopObj.photos = urlMap[stopObj.name];
    }
  }
  fs.writeFileSync('route-data.json', JSON.stringify(routeData));
  console.log('route-data.json updated with S3 URLs');

  // ── Invalidate CloudFront photos path ──────────────────────────────────────
  try {
    execSync(`aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/photos/*"`, { stdio: 'pipe' });
    console.log('CloudFront invalidated for /iceland_trip/photos/*');
  } catch (e) {
    console.warn('CloudFront invalidation skipped:', e.message);
  }
})();

