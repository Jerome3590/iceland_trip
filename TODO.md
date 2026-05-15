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
