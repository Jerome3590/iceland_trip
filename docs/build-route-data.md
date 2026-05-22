# Building route-data.json from Scratch

`scripts/build_route_data.py` regenerates `data/route-data.json` by querying the
[OSRM](https://project-osrm.org/) public routing API for every leg of the trip.
Use this when adding new stops, reordering legs, or resetting geometry after major
route changes.

> **Normal editing** (tweaking notes, fixing stop pins, updating day plans) does NOT
> require running this script — edit `data/route-data.json` directly and run
> `node build-app.js`. See `docs/route-data-schema.md`.

---

## Prerequisites

```powershell
pip install -r scripts/requirements.txt   # only needs: requests
```

---

## What it does

1. **`build_legs()`** — Iterates through `POINTS[]` pairs, calls OSRM for each
   segment, and stores `distance_km`, `time_min`, GeoJSON `geometry`, and turn
   `steps`.
2. **`build_stops()`** — Deduplicates `POINTS[]` into a unique stop list with
   inferred `type` values.
3. **`build_phases()`** — Assigns each phase its color, dates, summary and the
   list of leg indices that belong to it.
4. **`build_days()`** — Returns the day-by-day itinerary (hardcoded).
5. **`build_turns()`** — Returns the route notes shown in the Notes tab
   (hardcoded).
6. **`sync_app_js()`** — Injects the new `routeData` into `website/app.js`
   (same as `node build-app.js`).
7. **`write_itinerary_md()`** — Regenerates `docs/itinerary.md` from the new
   route data.

Writes:
- `data/route-data.json`
- `website/app.js`
- `docs/itinerary.md`

---

## Running it

```powershell
python scripts/build_route_data.py
```

Each leg prints as it resolves:
```
Leg 1: Reykjavík -> Borgarnes | 76.1 km | 74 min
Leg 2: Borgarnes -> Reykjavík charger recovery | 76.0 km | 73 min
…
```

A 0.25 s delay between requests respects the OSRM public API rate limit.

---

## Adding or changing stops

Edit the `POINTS` list at the top of the script. Each entry is a tuple:

```python
("Stop Name", longitude, latitude, phase_number)
```

Order matters — legs are built from consecutive pairs.

```python
POINTS = [
    ("Reykjavík",  -21.9426, 64.1466, 1),
    ("Borgarnes",  -21.9225, 64.5383, 1),
    # …
]
```

> Coordinates are **(longitude, latitude)** order — matching GeoJSON / OSRM
> convention. This is the **opposite** of Google Maps display order.

---

## Forcing a leg through a waypoint

Some legs must travel via a specific city even if a shorter inland route exists.
Add an entry to `ROUTE_OVERRIDES`:

```python
ROUTE_OVERRIDES = {
    ("Krafla / Víti area", "Selfoss via Reykjavík"): [
        ("Krafla / Víti area", -16.7792, 65.7175),
        ("Reykjavík",          -21.9426, 64.1466),   # forced waypoint
        ("Selfoss via Reykjavík", -20.9971, 63.9334),
    ]
}
```

The key is `(from_name, to_name)` exactly matching the names in `POINTS`.

---

## After running

```powershell
# Deploy updated artifacts
aws s3 cp website/app.js s3://jerome-dixon.io/iceland_trip/app.js
aws s3 cp data/route-data.json s3://jerome-dixon.io/iceland_trip/route-data.json
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

---

## Notes

- **OSRM public API** (`router.project-osrm.org`) has no auth key required but
  has rate limits — the built-in 0.25 s sleep is sufficient for a single full run.
- **`sync_app_js()`** is equivalent to `node build-app.js` — both are safe, but
  prefer `node build-app.js` for day-to-day edits since it preserves patches.
- **`POINTS` vs `stops[]`** — `POINTS` drives leg geometry; `stops[]` in
  `route-data.json` can be edited independently (e.g. re-pinning a coordinate)
  without re-running this script.
- Stop types (`waterfall`, `geology`, etc.) are inferred by `infer_stop_type()`
  — override manually in `data/route-data.json` after generation if needed.
