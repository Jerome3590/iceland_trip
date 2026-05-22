# Iceland Photos → Map Pipeline

Full end-to-end flow: **Google Photos album → S3 CDN → interactive map popups**.

## Prerequisites (one-time install)
```powershell
winget install Rclone.Rclone OliverBetz.ExifTool
npm install   # sharp, heic-convert, @aws-sdk/client-s3
```

---

## Step 0 — Google Photos: configure rclone (one-time)
```powershell
rclone config
```
Prompts:
1. `n` — new remote
2. Name: `gphotos`
3. Storage type: `google photos`
4. client_id / client_secret: **leave blank**
5. `read_only` → `true`
6. Follow browser OAuth → sign in → allow

---

## Step 0b — Find album name & download
```powershell
rclone lsd "gphotos:album"
rclone copy "gphotos:album/Iceland May 2026" .\photos\ --progress --transfers 8
```
Downloads originals with EXIF GPS intact into `./photos/`.

---

## Step 0c — Extract GPS metadata
```powershell
exiftool -csv -FileName -GPSLatitude -GPSLongitude -GPSLatitudeRef -GPSLongitudeRef -DateTimeOriginal .\photos\ > photo-gps.csv
```
Produces `photo-gps.csv` — input for all pipeline scripts.

---

## Step 1 — Match photos to stops (`1-match-photos.js`)
```powershell
node 1-match-photos.js
```
Reads `photo-gps.csv` + `route-data.json`. Assigns each photo to nearest stop within **3-mile radius**.

Outputs:
- `photo-stops.json` — photos grouped by stop
- `unmatched.json` — photos with no GPS or outside 3 miles of any stop

---

## Step 2 — Upload to S3 (`2-upload-photos.js`)
```powershell
node 2-upload-photos.js
```
Converts HEIC → JPEG (via `sharp`/`heic-convert`), uploads to:
`s3://jerome-dixon.io/iceland_trip/photos/{stop-slug}/{filename}.jpg`

Uses worker threads (`upload-worker.js`) for parallel uploads.

---

## Step 3 — Rematch all photos (`3-rematch-all.js`)
```powershell
node 3-rematch-all.js
```
Re-runs full photo-to-stop matching across all stops at 3-mile radius. **Idempotent** — safe to re-run after adding new stops or adjusting pins. Updates `route-data.json` in place.

---

## Step 4 — Reupload new stops (`4-reupload-new-stops.js`)
```powershell
node 4-reupload-new-stops.js
```
For stops added after initial upload, copies photos from old S3 paths to canonical new slug paths. Only runs copies where source ≠ destination.

---

## Step 5 — Clean up stale S3 files (`5-cleanup-s3.js`)
```powershell
node 5-cleanup-s3.js --dry-run   # preview
node 5-cleanup-s3.js             # delete
```
Removes S3 files no longer referenced in `route-data.json`. Always dry-run first.

Requires current `s3-manifest.txt`:
```powershell
aws s3 ls s3://jerome-dixon.io/iceland_trip/photos/ --recursive --output text > s3-manifest.txt
```

---

## Step 6 — Build & deploy
```powershell
node build-app.js
aws s3 cp app.js s3://jerome-dixon.io/iceland_trip/app.js
aws s3 cp route-data.json s3://jerome-dixon.io/iceland_trip/route-data.json
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

---

## Diagnosing unmatched photos
```powershell
node find-unmatched-clusters.js
```
Clusters photos outside 3 miles of any stop, reverse-geocodes via Nominatim, and suggests new stop locations.

---

## Shared utilities
All pipeline scripts import from `scripts/utils/geo-utils.js`:
- `haversine(lat1,lon1,lat2,lon2)` → distance in km
- `slug(name)` → S3-safe folder name
- `toDec(dms, ref)` → decimal degrees from EXIF DMS
- `CF` → `'https://jerome-dixon.io'` (canonical URL base)
- `photoUrl(stopName, filename)` → full S3/CF URL

---

## Notes
- Photos without GPS (`unmatched.json`, `reason: "no GPS"`) — location services were off, skip.
- Matching radius is **3 miles** — tuned to balance clustering vs. separation for Iceland stop density.
- Videos (`.mp4`, `.mov`) are automatically excluded from all pipeline steps.
