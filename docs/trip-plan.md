# Iceland Ring Road Expedition — Trip Plan

This file is the **input** to `scripts/build_route_data.py`.
Edit here, then run `python scripts/build_route_data.py` to regenerate
`data/route-data.json` and `website/app.js`.

---

## Phases

### 1 | Wild West — Complete | May 3-5 | Borgarnes | #0c6fa8
Completed Borgarnes base with charger recovery, Borgarfjörður geothermal stops and Snæfellsnes catch-up.

- **Charger recovery handled**: Borgarnes → Reykjavík → Borgarnes, then Deildartunguhver/Reykholt and Hraunfossar/Barnafoss where timing allowed.
- **Snæfellsnes loop**: Arnarstapi-Hellnar, Kirkjufell/Grundarfjörður and optional basalt/coastal stops moved into the catch-up day.

### 2 | North — Complete | May 6-8 | Akureyri | #148b63
Completed Akureyri base with town recovery, Goðafoss, Mývatn geology, Bjarnaflag Geothermal Power Station and Krafla Power Station. The southbound Krafla-to-Selfoss drive is now shown as the Phase 3 weather extension, not Phase 2 core.

- **Akureyri recovery base**: Town walk, harbor, café time and Forest Lagoon fit the colder-weather North Iceland day.
- **Mývatn geology + power stations**: Goðafoss, Hverir/Námafjall, Dimmuborgir, Mývatn Nature Baths, Bjarnaflag Geothermal Power Station, Krafla Power Station and Krafla/Víti area.

### 3 | Phase 2 Extension to Selfoss | May 8-10 | Selfoss | #f0b526
Weather-adjusted route: continue the same Phase 2 Route 1 corridor from the Krafla/Mývatn side, route through Reykjavík, and then extend south/east to Selfoss for compact add-on stops.

- **Same Route 1 corridor as Phase 2**: Stay on the practical Route 1 corridor from the Akureyri/Mývatn side, force Reykjavík as the routing waypoint, then continue to Selfoss.
- **Selfoss add-ons after arrival**: Use Gullfoss, Kerið, Faxi, Hveragerði/Eyrarbakki, Seljalandsfoss, Skógafoss and Reynisfjara as weather/energy add-ons from the Selfoss base.

### 4 | Deep South Big East Run | May 11–12 | Hvolsvöllur → Reykjavík | #8f3d97
Big east run from Hvolsvöllur to Jökulsárlón, Diamond Beach and back, then drive directly to Reykjavík.

- **Urriðafoss first**: Quick early stop for the missed high-flow waterfall before committing east on Route 1.
- **Glacier lagoon priority**: Jökulsárlón and Diamond Beach first, then Reynisfjara, Skógafoss and Kvernufoss on the westbound return.

### 5 | Reykjavík Return & Departure | May 13–15 | Reykjavík | #10a8bf
City rest day, then departure day Reykjanes loop: Grindavík, Garður Old Lighthouse, HSS hospital visit, EV top-up and fly home from KEF.

- **May 13–14 — Reykjavík city days**: National Museum, Perlan, Settlement Exhibition, Laugavegur and evening jazz/blues.
- **May 15 — Departure via Reykjanes**: Check out 8:30 AM, Grindavík coast, Garður Old Lighthouse, HSS Suðurnes Hospital 10:00 AM, EV charge + car return at KEF, FI631 KEF 17:10 → BOS 18:50.

---

## Waypoints
<!-- Order matters — legs are built from consecutive pairs. Coordinates: lon, lat (GeoJSON order — lon first). -->

| Name | Lon | Lat | Phase |
|---|---|---|---|
| Reykjavík | -21.9426 | 64.1466 | 1 |
| Borgarnes | -21.9225 | 64.5383 | 1 |
| Reykjavík charger recovery | -21.9426 | 64.1466 | 1 |
| Borgarnes | -21.9225 | 64.5383 | 1 |
| Deildartunguhver / Reykholt | -21.4106 | 64.6636 | 1 |
| Hraunfossar / Barnafoss | -20.9775 | 64.7014 | 1 |
| Borgarnes | -21.9225 | 64.5383 | 1 |
| Arnarstapi / Hellnar | -23.6285 | 64.7663 | 1 |
| Kirkjufell / Grundarfjörður | -23.3050 | 64.9417 | 1 |
| Borgarnes | -21.9225 | 64.5383 | 1 |
| Akureyri | -18.0878 | 65.6835 | 2 |
| Goðafoss | -17.5502 | 65.6828 | 2 |
| Mývatn / Hverir | -16.8081 | 65.6415 | 2 |
| Dimmuborgir | -16.9109 | 65.5919 | 2 |
| Mývatn Nature Baths | -16.8477 | 65.6309 | 2 |
| Akureyri | -18.0878 | 65.6835 | 2 |
| Bjarnaflag Geothermal Power Station | -16.8460 | 65.6400 | 2 |
| Krafla Power Station | -16.7788 | 65.7045 | 2 |
| Krafla / Víti area | -16.7792 | 65.7175 | 2 |
| Selfoss via Reykjavík | -20.9971 | 63.9334 | 3 |
| Seljalandsfoss / Gljúfrabúi | -19.9886 | 63.6156 | 3 |
| Skógafoss | -19.5114 | 63.5321 | 3 |
| Reynisfjara | -19.0450 | 63.4040 | 3 |
| Selfoss | -20.9971 | 63.9334 | 3 |
| Gullfoss | -20.1200 | 64.3270 | 3 |
| Faxi / Vatnsleysufoss | -20.4458 | 64.2256 | 3 |
| Kerið | -20.8851 | 64.0413 | 3 |
| Selfoss | -20.9971 | 63.9334 | 3 |
| LÁ Art Museum / Hveragerði | -21.1889 | 64.0006 | 3 |
| Húsið Museum / Eyrarbakki | -21.1484 | 63.8642 | 3 |
| Hvolsvöllur | -20.2240 | 63.7526 | 4 |
| Urriðafoss | -20.6725 | 63.9242 | 4 |
| Jökulsárlón | -16.2306 | 64.0479 | 4 |
| Diamond Beach | -16.1773 | 64.0438 | 4 |
| Reynisfjara | -19.0450 | 63.4040 | 4 |
| Skógafoss / Kvernufoss | -19.5114 | 63.5321 | 4 |
| Hvolsvöllur | -20.2240 | 63.7526 | 4 |
| LAVA Centre | -20.2267 | 63.7516 | 5 |
| Garður Old Lighthouse | -22.6877 | 64.0819 | 5 |
| Reykjavík | -21.9426 | 64.1466 | 5 |
| Stykkishólmur / Walter Mitty Bridge | -22.7297 | 65.0757 | 5 |
| Kirkjufell | -23.3050 | 64.9417 | 5 |
| Arnarstapi / Hellnar | -23.6285 | 64.7663 | 5 |
| Reykjavík | -21.9426 | 64.1466 | 5 |

---

## Route Overrides
<!-- Force a leg through an intermediate waypoint. Key: (from_name) → (to_name). Each line: - Name | lon | lat -->

### (Krafla / Víti area) → (Selfoss via Reykjavík)
- Krafla / Víti area | -16.7792 | 65.7175
- Reykjavík | -21.9426 | 64.1466
- Selfoss via Reykjavík | -20.9971 | 63.9334

---

## Days
<!-- Format: ### Date | Phase number | Title -->
<!-- Next line: **Drive**: distance · time -->
<!-- Remaining lines: plan text -->

### May 3 | 1 | Arrive Reykjavík → Borgarnes
**Drive**: 76 km · 1h14
Drive to Borgarnes base, check in, evening walk and reset.

### May 4 | 1 | Borgarfjörður Loop
**Drive**: 152 km charger round trip + local loop
Deildartunguhver, Reykholt and Hraunfossar/Barnafoss from Borgarnes base. Morning run to Reykjavík and back.

### May 5 | 1 | Snæfellsnes catch-up loop
**Drive**: 230-300 km local loop
Arnarstapi-Hellnar coastal path, Kirkjufell/Grundarfjörður and optional Gerðuberg basalt cliffs.

### May 6 | 2 | Borgarnes → Akureyri
**Drive**: ~286 km · 4h22 baseline
Route 1 north via Varmahlíð. Evening Akureyri town walk, harbor, cafés or Forest Lagoon.

### May 7 | 2 | Goðafoss + Mývatn geology
**Drive**: ~168 km round trip baseline
Goðafoss, Lake Mývatn, Hverir/Námafjall, Dimmuborgir and Mývatn Nature Baths.

### May 8 | 2 | Power Stations + Krafla → Reykjavík
**Drive**: Akureyri → Bjarnaflag → Krafla, then Krafla → Reykjavík → Selfoss
Bjarnaflag Geothermal Power Station, Krafla Power Station, Krafla/Víti. Then Route 1 south through Reykjavík toward Selfoss.

### May 9 | 3 | Route 1 South — Selfoss
**Drive**: Route 1 southbound extension + optional arrival stops
Route 1 south via Seljalandsfoss/Gljúfrabúi and Skógafoss to Selfoss base.

### May 10 | 3 | Selfoss add-on day
**Drive**: Compact Golden Circle / local loop from Selfoss
Treat Gullfoss, optional Faxi, Kerið, LÁ Art Museum, Greenhouse Café and dinner as add-ons from Selfoss rather than the main Phase 3 route.

### May 11 | 4 | Hvolsvöllur big east run
**Drive**: Hvolsvöllur ↔ Jökulsárlón out-and-back
Leave early: Urriðafoss, Jökulsárlón, Diamond Beach, Reynisfjara, Skógafoss/Kvernufoss, then back to Hvolsvöllur.

### May 12 | 4 | Drive back to Reykjavík
**Drive**: Hvolsvöllur → Reykjavík
Drive west on Route 1 from Hvolsvöllur back to Reykjavík (~131 km). Arrive early afternoon. Hallgrímskirkja, Harpa, Old Harbour and seafood dinner.

### May 14 | 5 | Reykjavík city day
**Drive**: Local only
National Museum, Perlan, Settlement Exhibition, Laugavegur shopping, Tjörnin lake walk and weather-dependent Nauthólsvík or live jazz/blues evening.

### May 15 | 5 | Departure — Reykjavík → KEF → Boston
**Drive**: Reykjavík → Grindavík → Garður → HSS → KEF
Check out by 8:30 AM. Quick Grindavík coast stop, Garður Old Lighthouse photo stop, HSS Suðurnes Hospital tour at 10:00 AM (Skólavegur 6, Reykjanesbær). EV top-up at ISAVIA Leifstöð at KEF. Car return by noon. Lunch at terminal. Clear security by 4:00 PM. Icelandair FI631 · KEF 17:10 → BOS 18:50 · Conf: BUTUWM.

---

## Route Notes
<!-- Format: ### Phase number | Title -->
<!-- Remaining lines: note text -->

### 1 | Phase 1 — Borgarfjörður Loop
Borgarnes base. May 4: Reykjavík run then Deildartunguhver, Reykholt and Hraunfossar/Barnafoss. May 5: Snæfellsnes loop via Arnarstapi–Hellnar coastal path, Kirkjufell and Grundarfjörður.

### 2 | North Iceland cold-weather adjustment
Akureyri stayed useful as a warm recovery base: town walk, harbor/cafés and Forest Lagoon, with Goðafoss/Mývatn kept to the strongest weather window.

### 2 | Phase 2 — North Iceland Circuit
Route 1 north via Varmahlíð and Glaumbaer Turf Farm to Akureyri. Goðafoss, Lake Mývatn, Hverir/Námafjall, Bjarnaflag Geothermal Power Station, Krafla Power Station and Krafla/Víti.

### 3 | Weather update: Phase 3 follows Phase 2 route plus extension
Due to weather, Phase 3 uses the same practical Route 1 corridor as Phase 2, forces the route through Reykjavík, and then extends to Selfoss. Golden Circle and South Coast items are optional add-ons from the Selfoss base.

### 3 | Phase 3 — Route 1 South via Reykjavík
Krafla area → Reykjavík → Selfoss. South Coast: Seljalandsfoss/Gljúfrabúi, Skógafoss, Kerið. Golden Circle: Gullfoss. Base at Selfoss with LÁ Art Museum and Hveragerði nearby.

### 3 | May 10 Selfoss priority order
Go to Gullfoss first while weather holds, then Faxi only if it fits, Kerið on the southbound return, and keep Hveragerði/Eyrarbakki culture stops as warm indoor options.

### 4 | May 11 big east run
Base at Hvolsvöllur. Start early: Urriðafoss, Jökulsárlón, Diamond Beach, then Reynisfjara, Skógafoss and Kvernufoss as westbound return stops.

### 5 | May 15 — Reykjanes Peninsula to KEF
Grindavík coast tour, Garður Old Lighthouse, HSS Suðurnes Hospital tour, Keflavík town, then KEF Airport.
