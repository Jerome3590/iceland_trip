# Lessons learned

Operational notes from building and maintaining the Iceland Ring Road expedition map. Use this to avoid repeating mistakes and to debug when something breaks in production.

## Source of truth and workflow

- **Treat the Git repo as canonical.** A copy under Google Drive (or any sync folder) is fine for editing, but deploy and version history should follow `git` so a sync conflict or hand-merged “updates” folder cannot silently overwrite good work.
- **Avoid parallel duplicate trees** (e.g. an `updates/` folder that later gets copied over the live files). Prefer branches, or a single directory with normal commits.
- **Pin third-party assets when stability matters.** The page loads MapLibre from `unpkg.com/.../maplibre-gl@latest`. `@latest` can change behavior or URLs without you redeploying; pin a specific version for repeatable builds.

## Map stack (route and charging tabs)

### MapLibre + raster/vector tiles (OpenFreeMap)

- **What we use:** Both maps use `https://tiles.openfreemap.org/styles/positron` as the MapLibre style URL.
- **Failure modes:** Tile CDN outages, TLS or DNS issues, CORS changes, or rate limiting on the free tier can leave a blank map or partially loaded tiles.
- **Mitigation:** Check the browser network tab for failed `tiles.openfreemap.org` requests. Have a fallback style URL or self-hosted tiles only if you need higher reliability; for a personal trip map, reloading later is usually enough.

### MapLibre library CDN (unpkg)

- **What we use:** `unpkg.com/maplibre-gl@latest` for JS and CSS.
- **Failure modes:** CDN down, version drift (`@latest` breaks an API you rely on), ad blockers or corporate proxies blocking `unpkg`.
- **Mitigation:** Pin a version in `index.html`. If the map never initializes, confirm `window.maplibregl` exists in the console.

### Sunrise / sunset (day list)

- **What we use:** `app.js` calls `https://api.sunrise-sunset.org/json` once per day row (with `lat=64.8`, `lng=-18` for all days—rough central Iceland, not per stop).
- **Failure modes:** API rate limits or downtime; responses are in **UTC** and the code takes the time portion only—fine for “ballpark daylight” but not local Icelandic civil twilight precision.
- **Mitigation:** Failures are caught; the UI shows an em dash for missing times. For accuracy, switch to a timezone-aware source or compute from a small library using official coordinates per night’s base camp.

## Charging station data (EV tab)

### OpenStreetMap via Overpass

- **What we use:** `charging-map.js` POSTs an Overpass QL query to **`https://overpass.kumi.systems/api/interpreter`** (a public Overpass endpoint). It requests `amenity=charging_station` nodes/ways/relations inside a bounding box covering Iceland.
- **Failure modes:**
  - **Instance availability:** Any third-party Overpass mirror can be slow, return 429/5xx, or disappear. The official `overpass-api.de` has usage policies; mirrors vary.
  - **Timeouts:** The query sets `[timeout:45]`; slow responses still fail from the browser’s perspective if the network stalls.
  - **CORS:** The mirror must send headers that allow browser `fetch`. If you change endpoints, test from the deployed origin (S3/CloudFront), not only `file://`.
  - **Data quality:** OSM is community-maintained; coverage and tag detail (power, connectors, operator) vary. Stations can be missing, duplicated, or outdated.
- **Mitigation already in code:**
  - **Curated `fallbackStations`** if the network request fails or returns nothing useful.
  - **`localStorage` cache** (`iceland-charging-stations-cache-v2`, 12-hour freshness hint) so a repeat visit works offline-ish and reduces hammering the API.
  - **Phase assignment** for live points uses heuristics (`inferPhase`) and may mis-bucket edge cases; the fallback list is phase-stable.

### When debugging charging issues

1. Open DevTools → Network → filter `interpreter` or `kumi.systems`.
2. Confirm POST returns 200 and JSON with `elements`.
3. If Overpass fails, confirm the summary text switches to cached or curated fallback (see `refreshStations()` in `charging-map.js`).

## Hosting multiple projects on the same S3 bucket / CloudFront domain

### Problem encountered
The S3 bucket (`jerome-dixon.io`) hosts multiple independent projects under different key prefixes:
- `iceland_trip/` — Iceland expedition map
- `vcu/pgx-risk-calculator/` — PGX clinical risk dashboard
- `uva/` — UVA research notebooks

When the bucket policy was set up, only the first project's prefix was granted public read access:
```json
{ "Resource": "arn:aws:s3:::jerome-dixon.io/iceland_trip/*" }
```
Every other path returned **403 Forbidden**, even though the objects existed and were correctly uploaded.

### Rule: add a policy statement per project prefix

Each hosted project needs its own `s3:GetObject` statement. After adding a project, verify it immediately:
```powershell
Invoke-WebRequest "https://jerome-dixon.io/<project-path>/" -Method Head -UseBasicParsing | Select-Object StatusCode
# Must return 200; 403 = missing bucket policy statement
```

Current policy covers:
| Prefix | Sid |
|--------|-----|
| `iceland_trip/*` | `PublicReadGetIcelandTrip` |
| `vcu/pgx-risk-calculator/*` | `PublicReadGetPGXDashboard` |

### Rule: use the custom domain — never a raw CloudFront URL

The CloudFront distribution `E3MZK5HYTJ14P3` serves `jerome-dixon.io`. Always use:
```js
const CF = 'https://jerome-dixon.io';
```
Do **not** hardcode the raw `*.cloudfront.net` domain. The actual CF domain can be verified with:
```
aws cloudfront get-distribution --id E3MZK5HYTJ14P3 --query "Distribution.DomainName"
```
Using the wrong raw domain causes all asset URLs to silently 404 in production.

### Checklist when adding a new project to the bucket

1. Upload files to `s3://jerome-dixon.io/<project-prefix>/`
2. Add a new `s3:GetObject` statement for `arn:aws:s3:::jerome-dixon.io/<project-prefix>/*`
3. Confirm `200 OK` via `Invoke-WebRequest` before sharing the URL
4. Invalidate CloudFront if previously cached: `aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/<project-prefix>/*"`

---

## Deploy reminders

- After changing `app.js`, `route-data.json`, or `itinerary.md`, remember **`app.js` embeds `routeData`**—regenerate or paste from `route-data.json` if you edit JSON only.
- **S3 + CloudFront:** upload changed objects and **invalidate** paths (e.g. `/iceland_trip/*`) or users may see stale `app.js` for hours.

## Related files

| Concern | File(s) |
|--------|---------|
| Route map, phases, embedded JSON | `app.js`, `route-data.json` |
| Tiles + MapLibre init | `app.js`, `charging-map.js`, `index.html` |
| Charging Overpass + cache + fallbacks | `charging-map.js` |
| Sunrise API | `app.js` (`renderDaysWithSunriseSunset`) |
