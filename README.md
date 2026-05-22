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

## Required Inputs

Two inputs drive everything else — all other files are generated.

| Input | Description |
|---|---|
| [`docs/trip-plan.md`](docs/trip-plan.md) | Markdown itinerary — waypoints, phases, days, route notes |
| **Google Photos album** | HEIC photos with embedded GPS EXIF |

---

## Documentation

| Doc | Contents |
|---|---|
| [`data/README.md`](data/README.md) | `route-data.json` schema, markdown parsing, file inventory |
| [`pipeline/README.md`](pipeline/README.md) | End-to-end photo pipeline with Mermaid flow chart |
| [`docs/build-route-data.md`](docs/build-route-data.md) | How to add stops, force waypoints, run `build_route_data.py` |
| [`docs/route-data-schema.md`](docs/route-data-schema.md) | Full field-level schema for `route-data.json` |
| [`docs/app-architecture.md`](docs/app-architecture.md) | `app.js` logic order, features checklist, CSS rules |
| [`docs/photos-pipeline.md`](docs/photos-pipeline.md) | Step-by-step photo pipeline instructions |
| [`docs/TODO.md`](docs/TODO.md) | Dropped stops and future ideas |

---

## Quick Reference

**Edit the itinerary → rebuild:**
```powershell
# Edit docs/trip-plan.md, then:
python scripts/build_route_data.py   # re-queries OSRM, rewrites route-data.json + app.js
# — or for minor edits to data/route-data.json only —
node build-app.js
```

**Deploy:**
```powershell
aws s3 cp website/app.js s3://jerome-dixon.io/iceland_trip/app.js
aws s3 cp data/route-data.json s3://jerome-dixon.io/iceland_trip/route-data.json
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

**Add photos → see [`pipeline/README.md`](pipeline/README.md)**
