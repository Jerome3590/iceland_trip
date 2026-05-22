import json
import time
import pathlib
import requests


PROJECT_DIR = pathlib.Path(__file__).parent.parent  # repo root
ROUTE_DATA_PATH = PROJECT_DIR / "data" / "route-data.json"
APP_JS_PATH = PROJECT_DIR / "website" / "app.js"
ITINERARY_MD_PATH = PROJECT_DIR / "docs" / "itinerary.md"

OSRM_BASE = "https://router.project-osrm.org/route/v1/driving/"


# Waypoints are stored as: name, longitude, latitude, phase.
POINTS = [
    ("Reykjavík", -21.9426, 64.1466, 1),
    ("Borgarnes", -21.9225, 64.5383, 1),
    ("Reykjavík charger recovery", -21.9426, 64.1466, 1),
    ("Borgarnes", -21.9225, 64.5383, 1),
    ("Deildartunguhver / Reykholt", -21.4106, 64.6636, 1),
    ("Hraunfossar / Barnafoss", -20.9775, 64.7014, 1),
    ("Borgarnes", -21.9225, 64.5383, 1),
    ("Arnarstapi / Hellnar", -23.6285, 64.7663, 1),
    ("Kirkjufell / Grundarfjörður", -23.3050, 64.9417, 1),
    ("Borgarnes", -21.9225, 64.5383, 1),
    ("Akureyri", -18.0878, 65.6835, 2),
    ("Goðafoss", -17.5502, 65.6828, 2),
    ("Mývatn / Hverir", -16.8081, 65.6415, 2),
    ("Dimmuborgir", -16.9109, 65.5919, 2),
    ("Mývatn Nature Baths", -16.8477, 65.6309, 2),
    ("Akureyri", -18.0878, 65.6835, 2),
    ("Bjarnaflag Geothermal Power Station", -16.8460, 65.6400, 2),
    ("Krafla Power Station", -16.7788, 65.7045, 2),
    ("Krafla / Víti area", -16.7792, 65.7175, 2),
    # This leg is forced via Reykjavík using ROUTE_OVERRIDES below.
    ("Selfoss via Reykjavík", -20.9971, 63.9334, 3),
    ("Seljalandsfoss / Gljúfrabúi", -19.9886, 63.6156, 3),
    ("Skógafoss", -19.5114, 63.5321, 3),
    ("Reynisfjara", -19.0450, 63.4040, 3),
    ("Selfoss", -20.9971, 63.9334, 3),
    ("Gullfoss", -20.1200, 64.3270, 3),
    ("Faxi / Vatnsleysufoss", -20.4458, 64.2256, 3),
    ("Kerið", -20.8851, 64.0413, 3),
    ("Selfoss", -20.9971, 63.9334, 3),
    ("LÁ Art Museum / Hveragerði", -21.1889, 64.0006, 3),
    ("Húsið Museum / Eyrarbakki", -21.1484, 63.8642, 3),
    ("Hvolsvöllur", -20.2240, 63.7526, 4),
    ("Urriðafoss", -20.6725, 63.9242, 4),
    ("Jökulsárlón", -16.2306, 64.0479, 4),
    ("Diamond Beach", -16.1773, 64.0438, 4),
    ("Reynisfjara", -19.0450, 63.4040, 4),
    ("Skógafoss / Kvernufoss", -19.5114, 63.5321, 4),
    ("Hvolsvöllur", -20.2240, 63.7526, 4),
    ("LAVA Centre", -20.2267, 63.7516, 5),
    ("Garður Old Lighthouse", -22.6877, 64.0819, 5),
    ("Reykjavík", -21.9426, 64.1466, 5),
    ("Stykkishólmur / Walter Mitty Bridge", -22.7297, 65.0757, 5),
    ("Kirkjufell", -23.3050, 64.9417, 5),
    ("Arnarstapi / Hellnar", -23.6285, 64.7663, 5),
    ("Reykjavík", -21.9426, 64.1466, 5),
]


# Force specific legs through required waypoints.
# Key format: (from_name, to_name).
ROUTE_OVERRIDES = {
    ("Krafla / Víti area", "Selfoss via Reykjavík"): [
        ("Krafla / Víti area", -16.7792, 65.7175),
        ("Reykjavík", -21.9426, 64.1466),
        ("Selfoss via Reykjavík", -20.9971, 63.9334),
    ]
}


def osrm_route(points):
    """Fetch one OSRM route. Points are tuples: (name, lon, lat)."""
    coords = ";".join(f"{lon},{lat}" for _, lon, lat in points)
    url = OSRM_BASE + coords + "?overview=full&geometries=geojson&steps=true"

    response = requests.get(url, timeout=60)
    response.raise_for_status()
    data = response.json()

    if data.get("code") != "Ok":
        raise RuntimeError(f"OSRM failed: {data}")

    return data["routes"][0]


def extract_steps(route):
    steps = []

    for leg in route["legs"]:
        for step in leg["steps"]:
            if step.get("distance", 0) > 300:
                steps.append(
                    {
                        "name": step.get("name"),
                        "distance": round(step["distance"] / 1000, 1),
                        "duration_min": round(step["duration"] / 60),
                        "maneuver": step["maneuver"].get("type"),
                        "modifier": step["maneuver"].get("modifier"),
                    }
                )

    return steps


def build_legs():
    legs = []

    for idx in range(len(POINTS) - 1):
        a = POINTS[idx]
        b = POINTS[idx + 1]

        from_name, from_lon, from_lat, _from_phase = a
        to_name, to_lon, to_lat, to_phase = b

        override_key = (from_name, to_name)

        if override_key in ROUTE_OVERRIDES:
            route_points = ROUTE_OVERRIDES[override_key]
            via = [p[0] for p in route_points[1:-1]]
        else:
            route_points = [
                (from_name, from_lon, from_lat),
                (to_name, to_lon, to_lat),
            ]
            via = []

        route = osrm_route(route_points)

        leg = {
            "from": from_name,
            "to": to_name,
            "phase": to_phase,
            "distance_km": round(route["distance"] / 1000, 1),
            "time_min": round(route["duration"] / 60),
            "geometry": route["geometry"],
            "steps": extract_steps(route),
        }

        if via:
            leg["via"] = via
            leg["route_role"] = "phase_2_extension"

        if to_phase == 2:
            leg["route_role"] = "phase_2_core"
        elif to_phase == 3 and not leg.get("route_role"):
            leg["route_role"] = "phase_2_extension"

        legs.append(leg)

        print(
            f"Leg {idx + 1}: {from_name} -> {to_name} | "
            f"{leg['distance_km']} km | {leg['time_min']} min"
        )

        time.sleep(0.25)

    return legs


def build_phase_leg_index(legs):
    phase_legs = {i: [] for i in range(1, 6)}

    for idx, leg in enumerate(legs, 1):
        phase_legs[leg["phase"]].append(idx)

    return phase_legs


def build_phases(phase_legs):
    return [
        {
            "id": 1,
            "name": "Wild West - Complete",
            "dates": "May 3-5",
            "base": "Borgarnes",
            "color": "#0c6fa8",
            "legs": phase_legs[1],
            "summary": "Completed Borgarnes base with charger recovery, Borgarfjörður geothermal stops and Snæfellsnes catch-up.",
            "items": [
                {
                    "title": "Charger recovery handled",
                    "desc": "Borgarnes → Reykjavík → Borgarnes, then Deildartunguhver/Reykholt and Hraunfossar/Barnafoss where timing allowed.",
                },
                {
                    "title": "Snæfellsnes loop",
                    "desc": "Arnarstapi-Hellnar, Kirkjufell/Grundarfjörður and optional basalt/coastal stops moved into the catch-up day.",
                },
            ],
        },
        {
            "id": 2,
            "name": "North - Complete",
            "dates": "May 6-8",
            "base": "Akureyri",
            "color": "#148b63",
            "legs": phase_legs[2],
            "summary": "Completed Akureyri base with town recovery, Goðafoss, Mývatn geology, Bjarnaflag Geothermal Power Station and Krafla Power Station.",
            "items": [
                {
                    "title": "Akureyri recovery base",
                    "desc": "Town walk, harbor, café time and Forest Lagoon fit the colder-weather North Iceland day.",
                },
                {
                    "title": "Mývatn geology + power stations",
                    "desc": "Goðafoss, Hverir/Námafjall, Dimmuborgir, Mývatn Nature Baths, Bjarnaflag Geothermal Power Station, Krafla Power Station and Krafla/Víti area.",
                },
            ],
        },
        {
            "id": 3,
            "name": "Phase 2 Extension to Selfoss",
            "dates": "May 8-10",
            "base": "Selfoss",
            "color": "#f0b526",
            "legs": phase_legs[3],
            "summary": "Weather-adjusted route: continue the same Phase 2 Route 1 corridor from the Krafla/Mývatn side, route through Reykjavík, and then extend south/east to Selfoss for compact add-on stops.",
            "items": [
                {
                    "title": "Same Route 1 corridor as Phase 2",
                    "desc": "Stay on the practical Route 1 corridor from the Akureyri/Mývatn side, force Reykjavík as the routing waypoint, then continue to Selfoss.",
                },
                {
                    "title": "Selfoss add-ons after arrival",
                    "desc": "Use Gullfoss, Kerið, Faxi, Hveragerði/Eyrarbakki, Seljalandsfoss, Skógafoss and Reynisfjara as weather/energy add-ons from the Selfoss base.",
                },
            ],
        },
        {
            "id": 4,
            "name": "Deep South Big East Run",
            "dates": "May 11",
            "base": "Hvolsvöllur",
            "color": "#8f3d97",
            "legs": phase_legs[4],
            "summary": "A single high-value South Coast push from Hvolsvöllur to Urriðafoss, Jökulsárlón, Diamond Beach and back west.",
            "items": [
                {
                    "title": "Urriðafoss first",
                    "desc": "Quick early stop for the missed high-flow waterfall before committing east on Route 1.",
                },
                {
                    "title": "Glacier lagoon priority",
                    "desc": "Jökulsárlón and Diamond Beach first, then Reynisfjara, Skógafoss and Kvernufoss on the westbound return.",
                },
            ],
        },
        {
            "id": 5,
            "name": "Reykjavík Return & Bonus Snæfellsnes",
            "dates": "May 12-14",
            "base": "Reykjavík",
            "color": "#10a8bf",
            "legs": phase_legs[5],
            "summary": "Lava Centre and Reykjanes lighthouse detour on the Reykjavík return, then a Walter Mitty/Snæfellsnes day trip and city day.",
            "items": [
                {
                    "title": "Hvolsvöllur → Reykjavík",
                    "desc": "LAVA Centre before checkout, Garður Old Lighthouse detour, then Reykjavík harbor/church/city reset.",
                },
                {
                    "title": "May 13 Snæfellsnes day trip",
                    "desc": "Stykkishólmur/Walter Mitty bridge, Kirkjufell and Arnarstapi-Hellnar from Reykjavík.",
                },
            ],
        },
    ]


def infer_stop_type(name):
    lower = name.lower()

    if name in ["Borgarnes", "Akureyri", "Selfoss", "Hvolsvöllur", "Reykjavík"]:
        return "base camp"
    if "power station" in lower:
        return "power station"
    if any(
        x in name
        for x in ["foss", "Goðafoss", "Skógafoss", "Urriðafoss", "Faxi", "Hraunfossar"]
    ):
        return "waterfall"
    if any(
        x in name
        for x in ["Mývatn", "Hverir", "Dimmuborgir", "Krafla", "Bjarnaflag", "Kerið", "LAVA"]
    ):
        return "geology"
    if any(
        x in name
        for x in ["Reynisfjara", "Diamond", "Garður", "Arnarstapi", "Stykkishólmur"]
    ):
        return "coast/town"

    return "stop"


def build_stops():
    stops = []
    seen = set()

    for name, lon, lat, phase in POINTS:
        key = (name, phase)
        if key in seen:
            continue

        seen.add(key)

        stops.append(
            {
                "name": name,
                "lat": lat,
                "lon": lon,
                "type": infer_stop_type(name),
                "phase": phase,
                "note": f"Phase {phase} latest-itinerary stop.",
            }
        )

    stops.append(
        {
            "name": "Reykjavík waypoint for Phase 3 extension",
            "lat": 64.1466,
            "lon": -21.9426,
            "type": "route waypoint",
            "phase": 3,
            "note": "Required waypoint forcing Leg 19 to use the practical Route 1 corridor through Reykjavík before continuing to Selfoss.",
        }
    )

    return stops


def build_days():
    return [
        {
            "date": "May 3",
            "phase": 1,
            "title": "Arrive Reykjavík → Borgarnes",
            "drive": "76 km · 1h14",
            "plan": "Drive to Borgarnes base, check in, evening walk and reset.",
        },
        {
            "date": "May 4",
            "phase": 1,
            "title": "Charger recovery + Borgarfjörður",
            "drive": "152 km charger round trip + local loop",
            "plan": "Borgarnes → Reykjavík → Borgarnes for the laptop charger. Afternoon: Deildartunguhver, Reykholt and Hraunfossar/Barnafoss if timing allowed.",
        },
        {
            "date": "May 5",
            "phase": 1,
            "title": "Snæfellsnes catch-up loop",
            "drive": "230-300 km local loop",
            "plan": "Arnarstapi-Hellnar coastal path, Kirkjufell/Grundarfjörður and optional Gerðuberg basalt cliffs.",
        },
        {
            "date": "May 6",
            "phase": 2,
            "title": "Borgarnes → Akureyri",
            "drive": "~286 km · 4h22 baseline",
            "plan": "Route 1 north via Varmahlíð. Evening Akureyri town walk, harbor, cafés or Forest Lagoon.",
        },
        {
            "date": "May 7",
            "phase": 2,
            "title": "Goðafoss + Mývatn geology",
            "drive": "~168 km round trip baseline",
            "plan": "Goðafoss, Lake Mývatn, Hverir/Námafjall, Dimmuborgir and Mývatn Nature Baths.",
        },
        {
            "date": "May 8",
            "phase": 3,
            "title": "Power stations, then Phase 3 extension via Reykjavík",
            "drive": "Akureyri → Bjarnaflag → Krafla, then Krafla → Reykjavík → Selfoss",
            "plan": "Capture Bjarnaflag Geothermal Power Station, Krafla Power Station and Krafla/Víti area as Phase 2 coverage. Leg 19 then forces the practical Route 1 corridor through Reykjavík before continuing to Selfoss as the Phase 3 weather extension.",
        },
        {
            "date": "May 9",
            "phase": 3,
            "title": "Arrive Selfoss via Phase 2 extension",
            "drive": "Route 1 southbound extension + optional arrival stops",
            "plan": "Complete the weather-forced extension to Selfoss using the same Route 1 corridor as Phase 2. Add Seljalandsfoss, Skógafoss and Reynisfjara only as weather and energy allow after arrival.",
        },
        {
            "date": "May 10",
            "phase": 3,
            "title": "Selfoss add-on day",
            "drive": "Compact Golden Circle / local loop from Selfoss",
            "plan": "Treat Gullfoss, optional Faxi, Kerið, LÁ Art Museum, Greenhouse Café, Húsið Museum and dinner as add-ons from Selfoss rather than the main Phase 3 route.",
        },
        {
            "date": "May 11",
            "phase": 4,
            "title": "Hvolsvöllur big east run",
            "drive": "Hvolsvöllur ↔ Jökulsárlón out-and-back",
            "plan": "Leave early: Urriðafoss, Jökulsárlón, Diamond Beach, Reynisfjara, Skógafoss/Kvernufoss, then back to Hvolsvöllur.",
        },
        {
            "date": "May 12",
            "phase": 5,
            "title": "LAVA Centre + return to Reykjavík",
            "drive": "Hvolsvöllur → Garður → Reykjavík",
            "plan": "Morning LAVA Centre in Hvolsvöllur, checkout, west on Route 1, optional Garður Old Lighthouse, then Hallgrímskirkja, Harpa, Old Harbour and seafood dinner.",
        },
        {
            "date": "May 13",
            "phase": 5,
            "title": "Snæfellsnes day trip from Reykjavík",
            "drive": "Reykjavík ↔ Stykkishólmur/Kirkjufell/Arnarstapi",
            "plan": "Walter Mitty bridge/harbor in Stykkishólmur, Kirkjufell, Arnarstapi-Hellnar coastal path, back to Reykjavík for dinner/live music.",
        },
        {
            "date": "May 14",
            "phase": 5,
            "title": "Reykjavík city day",
            "drive": "Local only",
            "plan": "National Museum, Perlan, Settlement Exhibition, Laugavegur, Tjörnin and weather-dependent Nauthólsvík or live jazz/blues.",
        },
    ]


def build_turns():
    return [
        {
            "phase": 3,
            "title": "Leg 19 Reykjavík routing correction",
            "text": "Leg 19 is now forced through Reykjavík: Krafla/Víti area → Reykjavík → Selfoss. This prevents the map engine from drawing a shorter inland route and keeps Phase 3 on the practical Route 1 corridor.",
        },
        {
            "phase": 2,
            "title": "Power-station coverage added",
            "text": "The May 8 north segment shows Bjarnaflag Geothermal Power Station and Krafla Power Station as distinct visits, with Krafla/Víti as the nearby geology stop before the southbound extension.",
        },
        {
            "phase": 3,
            "title": "Weather update: Phase 3 follows Phase 2 route plus extension",
            "text": "Due to weather, Phase 3 uses the same practical Route 1 corridor as Phase 2, forces the route through Reykjavík, and then extends to Selfoss. Golden Circle and South Coast items are optional add-ons from the Selfoss base.",
        },
    ]


def sync_app_js(route_data):
    """Replace the embedded const routeData in app.js."""
    app = APP_JS_PATH.read_text(encoding="utf-8")
    boundary = app.find("const iconSvg")

    if boundary < 0:
        raise RuntimeError("Could not find `const iconSvg` boundary in app.js")

    updated = (
        "const routeData = "
        + json.dumps(route_data, ensure_ascii=False)
        + ";\n\n"
        + app[boundary:]
    )

    APP_JS_PATH.write_text(updated, encoding="utf-8")


def write_itinerary_md(route_data):
    lines = [
        "# Iceland Ring Road Expedition - Latest Itinerary Update\n\n",
        "Generated from build_route_data.py.\n\n",
        (
            f"Mapped latest itinerary baseline: "
            f"{route_data['totals']['distance_km']} km, "
            f"{route_data['totals']['time_min'] // 60}h "
            f"{route_data['totals']['time_min'] % 60:02d}m driving.\n\n"
        ),
    ]

    for phase in route_data["phases"]:
        dist = sum(route_data["legs"][i - 1]["distance_km"] for i in phase["legs"])
        mins = sum(route_data["legs"][i - 1]["time_min"] for i in phase["legs"])

        lines.append(f"## Phase {phase['id']} - {phase['name']} ({phase['dates']})\n\n")
        lines.append(
            f"Base: **{phase['base']}**. "
            f"Mapped phase baseline: {dist:.0f} km, "
            f"{mins // 60}h {mins % 60:02d}.\n\n"
        )
        lines.append(phase["summary"] + "\n\n")

        for item in phase["items"]:
            lines.append(f"- **{item['title']}**: {item['desc']}\n")

        lines.append("\n")

    lines.append("## Day-by-day plan\n\n")

    for day in route_data["days"]:
        lines.append(
            f"- **{day['date']} - {day['title']}**: "
            f"{day['drive']}. {day['plan']}\n"
        )

    lines.append("\n## Route notes\n\n")

    for note in route_data["turns"]:
        lines.append(f"- **Phase {note['phase']} - {note['title']}**: {note['text']}\n")

    ITINERARY_MD_PATH.write_text("".join(lines), encoding="utf-8")


def main():
    PROJECT_DIR.mkdir(parents=True, exist_ok=True)

    legs = build_legs()
    phase_legs = build_phase_leg_index(legs)

    route_data = {
        "legs": legs,
        "phases": build_phases(phase_legs),
        "stops": build_stops(),
        "turns": build_turns(),
        "days": build_days(),
        "totals": {
            "distance_km": round(sum(leg["distance_km"] for leg in legs), 1),
            "time_min": sum(leg["time_min"] for leg in legs),
        },
        "updated": "Generated from build_route_data.py",
    }

    ROUTE_DATA_PATH.write_text(
        json.dumps(route_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    sync_app_js(route_data)
    write_itinerary_md(route_data)

    print("\nWrote:")
    print(f"- {ROUTE_DATA_PATH}")
    print(f"- {APP_JS_PATH}")
    print(f"- {ITINERARY_MD_PATH}")
    print(
        f"\nTotal: {route_data['totals']['distance_km']} km, "
        f"{route_data['totals']['time_min'] // 60}h "
        f"{route_data['totals']['time_min'] % 60:02d}"
    )


if __name__ == "__main__":
    main()
