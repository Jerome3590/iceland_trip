# Iceland Ring Road Expedition Map

Interactive trip map for a May 2026 EV Ring Road expedition. Built with MapLibre GL JS, deployed to AWS S3 + CloudFront as a static site.

**Live site:** https://jerome-dixon.io/iceland_trip/
**GitHub:** https://github.com/Jerome3590/iceland_trip

---

## Features

- **Interactive MapLibre map** — color-coded route legs by phase, stop markers with popups
- **Phase filter tabs** — filter map to any phase via buttons above the map *or* by clicking a phase card
- **Sunrise/sunset per day** — live fetch from `api.sunrise-sunset.org` for each day card
- **Dark/light theme toggle** — defaults to light mode
- **Mobile-responsive** — single-column layout with phases in order 1→5
- **EV charging map** — `charging-map.js` (preserved, ready to re-wire)

## Route Summary

| | |
|---|---|
| **Dates** | May 3–15, 2026 |
| **Total distance** | 3,146.8 km |
| **Total drive time** | 47h 50m |
| **Legs** | 40 |
| **Stops** | 35 |
| **Days** | 12 |

## Phases

| Phase | Name | Dates | Base |
|---|---|---|---|
| 1 | Wild West | May 3–5 | Borgarnes |
| 2 | North | May 6–8 | Akureyri |
| 3 | Extension to Selfoss | May 9–10 | Selfoss |
| 4 | Deep South Big East Run | May 11–12 | Hvolsvöllur → Reykjavík |
| 5 | Reykjavík Return & Departure | May 13–15 | Reykjavík → KEF |

## File Structure

| File/Folder | Purpose |
|---|---|
| `website/` | **S3 deploy artifacts** — served at `jerome-dixon.io/iceland_trip/` |
| `website/app.js` | All-in-one bundle — `const routeData={…}` + all map/UI logic |
| `website/index.html` | Single-page HTML shell |
| `website/style.css` | All styles (map, cards, filter bar, mobile layout) |
| `website/charging-map.js` | EV charging station map |
| `data/route-data.json` | **Source of truth** for all route data — edit here, then rebuild |
| `pipeline/` | Numbered workflow scripts (Steps 1–5) |
| `pipeline/utils/geo-utils.js` | Shared: `haversine`, `slug`, `toDec`, `CF`, `photoUrl` |
| `build-app.js` | Bridge: `data/route-data.json` → `website/app.js` |
| `docs/` | Itinerary, pipeline docs, TODO |

## Dev Workflow

**After editing `data/route-data.json`:**
```powershell
node build-app.js        # rebuilds website/app.js with fresh route data
```

**Deploy to S3 + CloudFront:**
```powershell
aws s3 cp website/app.js s3://jerome-dixon.io/iceland_trip/app.js
aws s3 cp data/route-data.json s3://jerome-dixon.io/iceland_trip/route-data.json
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

**Full website sync (initial deploy or CSS/HTML changes):**
```powershell
aws s3 sync website/ s3://jerome-dixon.io/iceland_trip/
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

See `DEV_RULES.md` for full architecture notes and feature checklist.

## Photos Pipeline (GPS matching)

Full end-to-end pipeline — Google Photos → S3:

| Script | Step |
|---|---|
| *(rclone + exiftool)* | **0** — Download album & extract GPS → `data/photo-gps.csv` |
| `pipeline/1-match-photos.js` | **1** — Match GPS coords to stops (3-mile radius) |
| `pipeline/2-upload-photos.js` | **2** — Convert HEIC → JPEG and upload to S3 under stop slug |
| `pipeline/3-rematch-all.js` | **3** — Redistribute all photos at 3-mile radius (idempotent) |
| `pipeline/4-reupload-new-stops.js` | **4** — Copy photos to canonical S3 paths for new stops |
| `pipeline/5-cleanup-s3.js` | **5** — Remove stale S3 files no longer in `data/route-data.json` |

See `docs/photos-pipeline.md` for full step-by-step instructions.

## TODO / Dropped Stops

Stops removed from the active route but preserved for future trips — see `docs/TODO.md`:
- Snæfellsnes Peninsula day trip (Walter Mitty bridge, Kirkjufell, Arnarstapi)
- Húsið Museum / Eyrarbakki
- LAVA Centre (Hvolsvöllur)
