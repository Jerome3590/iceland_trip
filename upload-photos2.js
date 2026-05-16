/**
 * upload-photos2.js — parallel worker-threads version
 * Skips already-converted files. Resumes safely.
 */
const fs      = require('fs');
const path    = require('path');
const { execSync }     = require('child_process');
const { Worker }       = require('worker_threads');

const PHOTOS_DIR  = path.resolve('./photos/Iceland Trip');
const WORK_DIR    = path.resolve('./photos-web');
const S3_BUCKET   = 'jerome-dixon.io';
const S3_PREFIX   = 'iceland_trip/photos';
const CDN_BASE    = 'https://jerome-dixon.io/iceland_trip/photos';
const MAX_WIDTH   = 1200;
const QUALITY     = 80;
const WORKERS     = 12;   // 12 of 16 cores

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function s3Upload(localFile, s3Key) {
  execSync(
    `aws s3 cp "${localFile}" "s3://${S3_BUCKET}/${s3Key}" --content-type image/jpeg --cache-control "max-age=31536000,public"`,
    { stdio: 'pipe' }
  );
}

function runWorker(srcFile, destFile) {
  return new Promise((resolve, reject) => {
    const w = new Worker(path.resolve('./upload-worker.js'), {
      workerData: { srcFile, destFile, MAX_WIDTH, QUALITY }
    });
    w.on('message', msg => msg.ok ? resolve() : reject(new Error(msg.err)));
    w.on('error', reject);
    w.on('exit', code => { if (code !== 0) reject(new Error(`Worker exited ${code}`)); });
  });
}

// ── Build task list ───────────────────────────────────────────────────────────
const photoStops = JSON.parse(fs.readFileSync('photo-stops.json', 'utf8'));
if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });

const tasks = [];
for (const { stop, photos } of photoStops) {
  const stopSlug = slug(stop);
  const outDir   = path.join(WORK_DIR, stopSlug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  for (const photo of photos) {
    const ext      = path.extname(photo.file).toLowerCase();
    const baseName = path.basename(photo.file, ext) + '.jpg';
    const srcFile  = path.join(PHOTOS_DIR, photo.file);
    const destFile = path.join(outDir, baseName);
    const s3Key    = `${S3_PREFIX}/${stopSlug}/${baseName}`;
    const cdnUrl   = `${CDN_BASE}/${stopSlug}/${baseName}`;
    tasks.push({ stop, photo, srcFile, destFile, s3Key, cdnUrl });
  }
}

const total     = tasks.length;
const alreadyDone = tasks.filter(t => fs.existsSync(t.destFile)).length;
console.log(`Total: ${total} | Already converted: ${alreadyDone} | Remaining: ${total - alreadyDone}`);
console.log(`Running ${WORKERS} parallel workers\n`);

// ── Process with bounded concurrency ─────────────────────────────────────────
let done = 0, errors = 0, uploadErrors = 0;
const urlMap = {};

(async () => {
  let idx = 0;

  async function processNext() {
    while (idx < tasks.length) {
      const task = tasks[idx++];
      const { stop, photo, srcFile, destFile, s3Key, cdnUrl } = task;

      try {
        // Convert if not cached
        if (!fs.existsSync(destFile)) {
          await runWorker(srcFile, destFile);
        }
        // Upload to S3
        s3Upload(destFile, s3Key);

        if (!urlMap[stop]) urlMap[stop] = [];
        urlMap[stop].push({ file: photo.file, url: cdnUrl, lat: photo.lat, lon: photo.lon, taken: photo.taken });

        done++;
      } catch (err) {
        errors++;
        // Write placeholder so we don't retry corrupt files
        process.stderr.write(`  ✗ ${photo.file}: ${err.message}\n`);
      }

      if ((done + errors) % 25 === 0 || done + errors === total) {
        process.stdout.write(`\r  ${done} uploaded, ${errors} errors — ${Math.round((done+errors)/total*100)}% done`);
      }
    }
  }

  const workers = Array.from({ length: WORKERS }, () => processNext());
  await Promise.all(workers);

  console.log(`\n\nFinished: ${done} uploaded, ${errors} convert errors`);

  // ── Patch route-data.json with S3 URLs ─────────────────────────────────────
  const routeData = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));
  for (const stopObj of routeData.stops) {
    if (urlMap[stopObj.name]) stopObj.photos = urlMap[stopObj.name];
  }
  fs.writeFileSync('route-data.json', JSON.stringify(routeData));
  console.log('route-data.json updated with S3 URLs');

  // ── Invalidate CloudFront ──────────────────────────────────────────────────
  try {
    execSync(`aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/photos/*"`, { stdio: 'pipe' });
    console.log('CloudFront invalidated');
  } catch(e) { console.warn('CF invalidation skipped'); }
})();
