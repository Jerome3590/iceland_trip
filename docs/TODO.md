# Iceland Trip — TODO / Future Trips

## Dropped from May 2026 Itinerary

### Snæfellsnes Peninsula Day Trip (Walter Mitty)
Removed from Phase 5 due to schedule constraints. High priority for a return trip.

**Route:** Reykjavík → Stykkishólmur → Kirkjufell → Arnarstapi/Hellnar → Reykjavík (~459 km day trip)

| Stop | Coords | Notes |
|---|---|---|
| Stykkishólmur / Walter Mitty Bridge | 65.0757, -22.7297 | Harbor from *The Secret Life of Walter Mitty* |
| Kirkjufell | 64.9417, -23.305 | Iconic arrowhead mountain, best at sunrise |
| Arnarstapi / Hellnar | 64.7663, -23.6285 | Coastal lava arch walk between the two villages |

**Legs removed:**
- Leg 40: Reykjavík → Stykkishólmur (173.3 km)
- Leg 41: Stykkishólmur → Kirkjufell (42.3 km)
- Leg 42: Kirkjufell → Arnarstapi/Hellnar (50.1 km)
- Leg 43: Arnarstapi/Hellnar → Reykjavík (193.5 km)
- Total round trip: ~459 km / ~1 full day

**To restore:** Add stops + legs back to `route-data.json`, run `node build-app.js`, redeploy.

---

### Húsið Museum / Eyrarbakki
Removed from Phase 3 / May 10 add-on day due to schedule constraints.

| Stop | Coords | Notes |
|---|---|---|
| Húsið Museum / Eyrarbakki | 63.8642, -21.1484 | Small coastal fishing village museum; the "House" museum with Icelandic heritage exhibits |

**Original position:** Between Hveragerði and Hvolsvöllur on the south coast (old leg 29: Hveragerði → Húsið, leg 30: Húsið → Hvolsvöllur).

**To restore:** Add stop back, re-split the merged Hveragerði→Hvolsvöllur leg into two legs via Húsið, re-run `node build-app.js`, redeploy.

---

### LAVA Centre (Hvolsvöllur)
Removed from Phase 4 — drove straight from Hvolsvöllur to Reykjavík on May 12.

| Stop | Coords | Notes |
|---|---|---|
| LAVA Centre | 63.7516, -20.2267 | Volcanic eruption exhibition museum in Hvolsvöllur. Highly rated, ~1 hr visit. |

**Original position:** Hvolsvöllur → LAVA Centre (0.5 km) → Reykjavík. Was the last stop before Phase 4 ended at Reykjavík.

**To restore:** Add stop + re-split the merged Hvolsvöllur→Reykjavík leg into two (via LAVA Centre), re-run `node build-app.js`, redeploy.

## Internal Waypoints Removed

- **Reykjavík charger recovery** — internal route waypoint, not a real stop
- **Reykjavík waypoint for Phase 3 extension** — internal route waypoint, not a real stop

## Skipped Stops (no photos — not visited)

> These were on the planned route but photo evidence shows they were not visited.

### Phase 1
- **Borgarnes** (`base camp`, 64.5383, -21.9225)
  - Phase 1 latest-itinerary stop.
- **Hraunfossar / Barnafoss** (`waterfall`, 64.7014, -20.9775)
  - Phase 1 latest-itinerary stop.
- **Arnarstapi / Hellnar** (`coast/town`, 64.7663, -23.6285)
  - Phase 1 latest-itinerary stop.
- **Kirkjufell / Grundarfjörður** (`stop`, 64.9417, -23.305)
  - Phase 1 latest-itinerary stop.

### Phase 2
- **Goðafoss** (`waterfall`, 65.6828, -17.5502)
  - Phase 2 latest-itinerary stop.
- **Dimmuborgir** (`geology`, 65.5919, -16.9109)
  - Phase 2 latest-itinerary stop.
- **Mývatn Nature Baths** (`geology`, 65.6309, -16.8477)
  - Phase 2 latest-itinerary stop.
- **Krafla / Víti area** (`geology`, 65.7175, -16.7792)
  - Krafla volcano / Víti crater area paired with the power-station coverage.

### Phase 3
- **Reynisfjara** (`coast/town`, 63.404, -19.045)
  - Phase 3 latest-itinerary stop.
- **Gullfoss** (`waterfall`, 64.327, -20.12)
  - Phase 3 latest-itinerary stop.
- **Faxi / Vatnsleysufoss** (`waterfall`, 64.2256, -20.4458)
  - Phase 3 latest-itinerary stop.

### Phase 4
- **Hvolsvöllur** (`base camp`, 63.7526, -20.224)
  - Phase 4 latest-itinerary stop.
- **Jökulsárlón** (`stop`, 64.0479, -16.2306)
  - Phase 4 latest-itinerary stop.
- **Reynisfjara** (`coast/town`, 63.404, -19.045)
  - Phase 4 latest-itinerary stop.
- **Skógafoss / Kvernufoss** (`waterfall`, 63.5321, -19.5114)
  - Phase 4 latest-itinerary stop.

### Phase 5
- **Grindavík** (`coast/town`, 63.8439, -22.4338)
  - Phase 5 latest-itinerary stop.

