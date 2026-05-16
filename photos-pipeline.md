# Iceland Photos → Map Pipeline

## Prerequisites (one-time install)
```powershell
winget install Rclone.Rclone OliverBetz.ExifTool
```

---

## Step 1 — Configure rclone for Google Photos (one-time)
```powershell
rclone config
```
Prompts:
1. `n` — new remote
2. Name: `gphotos`
3. Storage type: `google photos` (type the number shown)
4. client_id / client_secret: **leave blank** (uses rclone's shared credentials)
5. `read_only` → `true`
6. Follow browser OAuth prompt → sign in → allow
7. `y` to confirm

---

## Step 2 — Find your album name
```powershell
rclone lsd "gphotos:album"
```
Look for your Iceland album name (e.g. `Iceland May 2026`).

---

## Step 3 — Download album
```powershell
rclone copy "gphotos:album/Iceland May 2026" C:\Projects\iceland_trip\photos\ --progress --transfers 8
```
Downloads originals with EXIF GPS intact into `./photos/`.

---

## Step 4 — Extract GPS from all photos
```powershell
exiftool -csv -FileName -GPSLatitude -GPSLongitude -GPSLatitudeRef -GPSLongitudeRef -DateTimeOriginal C:\Projects\iceland_trip\photos\ > C:\Projects\iceland_trip\photo-gps.csv
```

---

## Step 5 — Match photos to stops
```powershell
node match-photos.js --radius 2 --photos ./photos --csv photo-gps.csv
```

Options:
| Flag | Default | Description |
|---|---|---|
| `--radius` | `2` | Match radius in km |
| `--csv` | `photo-gps.csv` | exiftool CSV input |
| `--photos` | `./photos` | photos directory |
| `--out` | `photo-stops.json` | matched output |

Outputs:
- `photo-stops.json` — photos grouped by stop
- `unmatched.json` — photos with no GPS or no nearby stop
- `route-data-photos.json` — updated route data with `photos` arrays on stops

---

## Step 6 — Review & deploy
```powershell
# Review matches
cat photo-stops.json

# If happy, promote to live data
Copy-Item route-data-photos.json route-data.json

# Rebuild and deploy
node build-app.js
aws s3 cp app.js s3://jerome-dixon.io/iceland_trip/app.js
aws s3 cp route-data.json s3://jerome-dixon.io/iceland_trip/route-data.json
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

---

## Notes
- Photos without GPS (`unmatched.json` with `reason: "no GPS"`) were likely taken with location off — skip them.
- Increase `--radius` to 5+ km for stops in remote areas where you may have been driving through.
- The `photos` array added to each stop is available in `route-data.json` for future popup integration.
