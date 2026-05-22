# route-data.json — Schema & Editing Guide

`data/route-data.json` is the **single source of truth** for the map. Edit it directly, then run `node build-app.js` to inject it into `website/app.js` and deploy.

---

## Top-level structure

```json
{
  "phases":  [ … ],   // Phase definitions (color, name, dates, leg index list)
  "legs":    [ … ],   // Driving segments connecting stops
  "stops":   [ … ],   // Named locations shown as map markers
  "turns":   [ … ],   // Route notes shown in the Notes tab
  "days":    [ … ],   // Day-by-day itinerary cards
  "totals":  { … },   // Aggregate distance / drive time
  "updated": "…"      // ISO date string — informational only
}
```

---

## `stops[]`

Each stop is a map marker with an optional photo gallery popup.

```json
{
  "name":   "Goðafoss",         // Display name — must be unique
  "lat":    65.6826,            // Decimal latitude
  "lon":    -17.5497,           // Decimal longitude
  "type":   "waterfall",        // Marker icon type (see types below)
  "phase":  2,                  // 1–5 — controls marker color and phase filter
  "note":   "Short stop note",  // Optional — shown in popup
  "photos": [                   // Populated by the photo pipeline — don't edit manually
    {
      "url":   "https://jerome-dixon.io/iceland_trip/photos/go-afoss/IMG_1234.jpg",
      "taken": "2026:05:07 11:23:45"
    }
  ]
}
```

### Stop types (marker icons)
| type | Icon |
|---|---|
| `base` | Home/camp icon |
| `waterfall` | Water icon |
| `geology` | Mountain icon |
| `geothermal` | Flame icon |
| `town` | Building icon |
| `glacier` | Snowflake icon |
| `beach` | Wave icon |
| `museum` | Book icon |
| `viewpoint` | Eye icon |
| `roadside` | Pin icon |

### Adding a new stop
1. Find coordinates via Google Maps (right-click → copy lat/lon).
2. Add entry to `stops[]` with `name`, `lat`, `lon`, `type`, `phase`.
3. Use the slug convention for S3 photo paths: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`.
4. Run `node build-app.js` to rebuild.
5. If the stop has photos, run `node pipeline/3-rematch-all.js` after adding.

---

## `legs[]`

Each leg is a driving segment drawn as a colored line on the map.

```json
{
  "from":        "Reykjavík",    // Must match a stop name exactly
  "to":          "Borgarnes",   // Must match a stop name exactly
  "phase":       1,             // Controls line color
  "distance_km": 76.1,
  "time_min":    74,
  "geometry":    [[lon, lat], …], // GeoJSON coordinate array [lon, lat] order
  "steps":       ["Turn left at…", …] // Optional turn-by-turn steps
}
```

Legs are ordered 1–N and drawn sequentially. The `geometry` array is `[longitude, latitude]` pairs (GeoJSON order — **lon first**).

### Adding a new leg
1. Get the route geometry from [geojson.io](https://geojson.io) or a routing API.
2. Confirm `from`/`to` match existing stop `name` values exactly.
3. Append to `legs[]` and update `phases[].legs` index list if needed.

---

## `phases[]`

Defines the color, label, and date range for each phase. Also lists which leg indices belong to it.

```json
{
  "id":      1,
  "name":    "Wild West — Complete",
  "dates":   "May 3–5",
  "base":    "Borgarnes",
  "color":   "#0c6fa8",       // Hex color — used for legs and phase filter button
  "legs":    [1, 2, 3, 4, 5, 6, 7, 8, 9], // 1-indexed leg numbers in this phase
  "summary": "One-line summary shown in phase card",
  "items":   [                // Bullet points shown in phase card
    { "title": "Item title", "desc": "Item description" }
  ]
}
```

---

## `days[]`

Day-by-day itinerary shown in the Days tab.

```json
{
  "date":  "May 7",
  "phase": 2,
  "title": "Goðafoss + Mývatn geology",
  "drive": "120 km · 2h15",   // Display string — manually maintained
  "plan":  "Goðafoss, Lake Mývatn, Hverir/Námafjall, Dimmuborgir and Mývatn Nature Baths."
}
```

---

## `turns[]`

Route notes shown in the Notes tab — weather context, priority orders, route decisions.

```json
{
  "phase": 3,
  "title": "Phase 3 — Route 1 South via Reykjavík",
  "text":  "Krafla area → Reykjavík → Selfoss. South Coast stops as add-ons."
}
```

---

## `totals`

Aggregated stats shown in the header banner. **Update manually** when legs change.

```json
{
  "distance_km":        3596.2,
  "time_min":           3308,
  "total_distance_km":  3146.8,   // Shown in UI header
  "total_time_min":     2870,
  "total_time_formatted": "47h 50m"
}
```

---

## Build & deploy after editing

```powershell
node build-app.js
aws s3 cp website/app.js s3://jerome-dixon.io/iceland_trip/app.js
aws s3 cp data/route-data.json s3://jerome-dixon.io/iceland_trip/route-data.json
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

> `build-app.js` reads `data/route-data.json`, injects it as `const routeData = {…}` at the top of `website/app.js`, and preserves all UI logic below it.
