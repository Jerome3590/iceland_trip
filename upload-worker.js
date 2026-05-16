// Worker thread — converts one HEIC/image file and signals done
const { workerData, parentPort } = require('worker_threads');
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');

const { srcFile, destFile, MAX_WIDTH, QUALITY } = workerData;

async function run() {
  const ext = path.extname(srcFile).toLowerCase();
  try {
    if (ext === '.heic' || ext === '.heif') {
      const heicConvert = require('heic-convert');
      const raw    = fs.readFileSync(srcFile);
      const buf    = await heicConvert({ buffer: raw, format: 'JPEG', quality: 1 });
      await sharp(Buffer.from(buf), { failOn: 'none' })
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(destFile);
    } else {
      await sharp(srcFile, { failOn: 'none' })
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(destFile);
    }
    parentPort.postMessage({ ok: true });
  } catch (err) {
    parentPort.postMessage({ ok: false, err: err.message });
  }
}

run();
