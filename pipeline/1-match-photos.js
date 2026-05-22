/**
 * match-photos.js
 *
 * Reads photo-gps.csv (produced by exiftool) and matches each photo to the
 * nearest stop in route-data.json within RADIUS_KM.
 *
 * Usage:
 *   node match-photos.js [--radius 2] [--photos ./photos] [--out photo-stops.json]
 *
 * Outputs:
 *   photo-stops.json  — per-stop photo lists
 *   unmatched.json    — photos with no nearby stop (for manual review)
 *   route-data-photos.json — updated route-data with photos arrays on stops
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const DATA_DIR   = path.join(__dirname, '../data');
const RADIUS_KM  = parseFloat(argVal(args, '--radius') || '2');
const PHOTOS_DIR = argVal(args, '--photos') || path.join(__dirname, '../photos');
const OUT_FILE   = argVal(args, '--out')    || path.join(DATA_DIR, 'photo-stops.json');
const CSV_FILE   = argVal(args, '--csv')    || path.join(DATA_DIR, 'photo-gps.csv');

function argVal(a, flag) { const i = a.indexOf(flag); return i !== -1 ? a[i+1] : null; }

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Parse exiftool CSV ────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    // RFC-4180 CSV: quoted fields, "" = escaped quote inside field
    const cols = [];
    let cur = '', inQ = false, i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i += 2; continue; } // escaped quote
        inQ = !inQ; i++; continue;
      }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; i++; continue; }
      cur += ch; i++;
    }
    cols.push(cur.trim());
    const obj = {};
    headers.forEach((h, idx) => obj[h] = cols[idx] || '');
    return obj;
  });
}

// ── DMS → decimal helper (exiftool sometimes outputs DMS strings) ─────────────
function toDec(val, ref) {
  if (!val) return null;
  const r = (ref || '').trim().toUpperCase();
  const negative = r === 'S' || r === 'W' || r === 'SOUTH' || r === 'WEST';
  // Already decimal
  if (/^-?\d+(\.\d+)?$/.test(val.trim())) {
    let n = parseFloat(val);
    if (negative) n = -Math.abs(n);
    return n;
  }
  // DMS: "64 deg 8' 55.97" N" or "64 deg 8' 55.97"
  const m = val.match(/(\d+)\s*deg\s*(\d+)'\s*([\d.]+)/);
  if (!m) return null;
  let dec = parseFloat(m[1]) + parseFloat(m[2])/60 + parseFloat(m[3])/3600;
  if (negative) dec = -dec;
  return dec;
}

// ── Main ──────────────────────────────────────────────────────────────────────
if (!fs.existsSync(CSV_FILE)) {
  console.error(`\n${CSV_FILE} not found.\nRun exiftool first:\n\n  exiftool -csv -FileName -GPSLatitude -GPSLongitude -GPSLatitudeRef -GPSLongitudeRef -DateTimeOriginal "${PHOTOS_DIR}" > ${CSV_FILE}\n`);
  process.exit(1);
}

const routeData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'route-data.json'), 'utf8'));
const stops     = routeData.stops;
const photos    = parseCSV(fs.readFileSync(CSV_FILE, 'utf8'));

console.log(`Loaded ${photos.length} photos from ${CSV_FILE}`);
console.log(`Matching to ${stops.length} stops (radius ${RADIUS_KM} km)\n`);

const stopMatches = {};   // stopName → [photo entries]
const unmatched   = [];

stops.forEach(s => { stopMatches[s.name] = []; });

const VIDEO_EXT = /\.(mp4|mov|avi|m4v|mkv|wmv|3gp)$/i;
let matched = 0;
for (const photo of photos) {
  if (VIDEO_EXT.test(photo.FileName)) continue;
  const lat = toDec(photo.GPSLatitude,  photo.GPSLatitudeRef);
  const lon = toDec(photo.GPSLongitude, photo.GPSLongitudeRef);

  if (lat === null || lon === null) {
    unmatched.push({ file: photo.FileName, reason: 'no GPS' });
    continue;
  }

  let best = null, bestDist = Infinity;
  for (const stop of stops) {
    const d = haversine(lat, lon, stop.lat, stop.lon);
    if (d < bestDist) { bestDist = d; best = stop; }
  }

  const entry = {
    file:    photo.FileName,
    lat:     Math.round(lat * 1e6) / 1e6,
    lon:     Math.round(lon * 1e6) / 1e6,
    taken:   photo.DateTimeOriginal || '',
    dist_km: Math.round(bestDist * 100) / 100
  };

  if (best && bestDist <= RADIUS_KM) {
    stopMatches[best.name].push(entry);
    matched++;
  } else {
    entry.nearest_stop = best?.name;
    unmatched.push(entry);
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log(`Matched:   ${matched} photos`);
console.log(`Unmatched: ${unmatched.length} photos (see unmatched.json)\n`);

const summary = Object.entries(stopMatches)
  .filter(([, v]) => v.length > 0)
  .map(([name, photos]) => ({ stop: name, count: photos.length, photos }));

summary.forEach(({ stop, count }) => console.log(`  ${count.toString().padStart(3)} photos → ${stop}`));

// ── Write outputs ─────────────────────────────────────────────────────────────
fs.writeFileSync(OUT_FILE, JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'unmatched.json'), JSON.stringify(unmatched, null, 2));
console.log(`\nWrote ${OUT_FILE} and unmatched.json`);

// ── Patch route-data with photos arrays ───────────────────────────────────────
const patched = JSON.parse(JSON.stringify(routeData));
for (const { stop, photos } of summary) {
  const s = patched.stops.find(s => s.name === stop);
  if (s) s.photos = photos;
}
fs.writeFileSync(path.join(DATA_DIR, 'route-data-photos.json'), JSON.stringify(patched));
console.log('Wrote data/route-data-photos.json — review then copy to data/route-data.json and run: node build-app.js');

