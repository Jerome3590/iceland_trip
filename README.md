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

| File | Purpose |
|---|---|
| `index.html` | Single-page HTML shell |
| `app.js` | **All-in-one bundle** — `const routeData={…}` + all map/UI logic |
| `style.css` | All styles (map, cards, filter bar, mobile layout) |
| `route-data.json` | **Source of truth** for all route data — edit here, then rebuild |
| `charging-map.js` | EV charging station map (preserved, not currently wired) |
| `base.css` | Typography and CSS reset |

## Dev Workflow

**After editing `route-data.json`:**
```powershell
node build-app.js        # rebuilds app.js with fresh route data
node verify-patch.js     # confirms all 9 features still present
```

**Deploy to S3 + CloudFront:**
```powershell
aws s3 sync . s3://jerome-dixon.io/iceland_trip/ --delete `
  --exclude ".git/*" --exclude "node_modules/*" --exclude "iceland-route-map/*"
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

See `DEV_RULES.md` for full architecture notes and feature checklist.

## Photos Pipeline (GPS matching)

Download Iceland Trip album from Google Photos → extract GPS → match to stops:
```powershell
exiftool -csv -FileName -GPSLatitude -GPSLongitude -GPSLatitudeRef -GPSLongitudeRef -DateTimeOriginal .\photos\ > photo-gps.csv
node match-photos.js
```
See `photos-pipeline.md` for full steps.

## TODO / Dropped Stops

Stops removed from the active route but preserved for future trips — see `TODO.md`:
- Snæfellsnes Peninsula day trip (Walter Mitty bridge, Kirkjufell, Arnarstapi)
- Húsið Museum / Eyrarbakki
- LAVA Centre (Hvolsvöllur)
