import json
import re
import time
import pathlib
import requests


PROJECT_DIR = pathlib.Path(__file__).parent.parent  # repo root
TRIP_PLAN_PATH = PROJECT_DIR / "docs" / "trip-plan.md"
ROUTE_DATA_PATH = PROJECT_DIR / "data" / "route-data.json"
APP_JS_PATH = PROJECT_DIR / "website" / "app.js"

OSRM_BASE = "https://router.project-osrm.org/route/v1/driving/"


# ── Markdown input parser ─────────────────────────────────────────────────────

def _split_sections(text):
    """Split markdown into top-level ## sections. Returns dict: name -> content."""
    sections = {}
    current = None
    buf = []
    for line in text.splitlines():
        if line.startswith("## "):
            if current:
                sections[current] = "\n".join(buf)
            current = line[3:].strip()
            buf = []
        elif current is not None:
            buf.append(line)
    if current:
        sections[current] = "\n".join(buf)
    return sections


def _split_subsections(text):
    """Split a section into ### subsections. Returns list of (header, content)."""
    subs = []
    current_h = None
    buf = []
    for line in text.splitlines():
        if line.startswith("### "):
            if current_h is not None:
                subs.append((current_h, "\n".join(buf).strip()))
            current_h = line[4:].strip()
            buf = []
        elif current_h is not None:
            buf.append(line)
    if current_h is not None:
        subs.append((current_h, "\n".join(buf).strip()))
    return subs


def parse_waypoints(text):
    """Parse ## Waypoints table → list of (name, lon, lat, phase)."""
    points = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("|---") or line.startswith("| Name") or line.startswith("<!--"):
            continue
        if line.startswith("|"):
            cols = [c.strip() for c in line.strip("|").split("|")]
            if len(cols) >= 4:
                try:
                    points.append((cols[0], float(cols[1]), float(cols[2]), int(cols[3])))
                except ValueError:
                    pass
    return points


def parse_overrides(text):
    """Parse ## Route Overrides → dict: (from, to) -> [(name, lon, lat), ...]."""
    overrides = {}
    for header, content in _split_subsections(text):
        m = re.match(r"\((.+?)\)\s*(?:→|->)\s*\((.+?)\)", header)
        if not m:
            continue
        key = (m.group(1).strip(), m.group(2).strip())
        wps = []
        for line in content.splitlines():
            line = line.strip().lstrip("- ")
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 3:
                try:
                    wps.append((parts[0], float(parts[1]), float(parts[2])))
                except ValueError:
                    pass
        if wps:
            overrides[key] = wps
    return overrides


def parse_phases(text):
    """Parse ## Phases subsections → list of phase dicts (without legs)."""
    phases = []
    for header, content in _split_subsections(text):
        parts = [p.strip() for p in header.split("|")]
        if len(parts) < 5:
            continue
        phase_id, name, dates, base, color = int(parts[0]), parts[1], parts[2], parts[3], parts[4]
        summary_lines, items = [], []
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("<!--"):
                continue
            m = re.match(r"[-*]\s+\*\*(.+?)\*\*:\s*(.+)", line)
            if m:
                items.append({"title": m.group(1), "desc": m.group(2)})
            else:
                summary_lines.append(line)
        phases.append({
            "id": phase_id,
            "name": name,
            "dates": dates,
            "base": base,
            "color": color,
            "summary": " ".join(summary_lines),
            "items": items,
        })
    return phases


def parse_days(text):
    """Parse ## Days subsections → list of day dicts."""
    days = []
    for header, content in _split_subsections(text):
        parts = [p.strip() for p in header.split("|")]
        if len(parts) < 3:
            continue
        date, phase, title = parts[0], int(parts[1]), parts[2]
        drive, plan_lines = "", []
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("<!--"):
                continue
            m = re.match(r"\*\*Drive\*\*:\s*(.+)", line)
            if m:
                drive = m.group(1)
            else:
                plan_lines.append(line)
        days.append({"date": date, "phase": phase, "title": title,
                     "drive": drive, "plan": " ".join(plan_lines)})
    return days


def parse_turns(text):
    """Parse ## Route Notes subsections → list of turn dicts."""
    turns = []
    for header, content in _split_subsections(text):
        parts = [p.strip() for p in header.split("|")]
        if len(parts) < 2:
            continue
        phase, title = int(parts[0]), parts[1]
        note_lines = [l.strip() for l in content.splitlines()
                      if l.strip() and not l.strip().startswith("<!--")]
        turns.append({"phase": phase, "title": title, "text": " ".join(note_lines)})
    return turns


def parse_trip_plan(md_path):
    """Read the markdown trip plan and return all structured data."""
    text = md_path.read_text(encoding="utf-8")
    sections = _split_sections(text)
    return (
        parse_waypoints(sections.get("Waypoints", "")),
        parse_overrides(sections.get("Route Overrides", "")),
        parse_phases(sections.get("Phases", "")),
        parse_days(sections.get("Days", "")),
        parse_turns(sections.get("Route Notes", "")),
    )


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


def build_legs(points, route_overrides):
    legs = []

    for idx in range(len(points) - 1):
        a = points[idx]
        b = points[idx + 1]

        from_name, from_lon, from_lat, _from_phase = a
        to_name, to_lon, to_lat, to_phase = b

        override_key = (from_name, to_name)

        if override_key in route_overrides:
            route_points = route_overrides[override_key]
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


def build_phases(phases_meta, phase_legs):
    """Merge parsed phase metadata with computed leg indices."""
    result = []
    for p in phases_meta:
        result.append({**p, "legs": phase_legs.get(p["id"], [])})
    return result


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


def build_stops(points):
    stops = []
    seen = set()
    for name, lon, lat, phase in points:
        key = (name, phase)
        if key in seen:
            continue
        seen.add(key)
        stops.append({
            "name": name,
            "lat": lat,
            "lon": lon,
            "type": infer_stop_type(name),
            "phase": phase,
            "note": f"Phase {phase} stop.",
        })
    return stops




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


def main():
    print(f"Reading trip plan from {TRIP_PLAN_PATH}...")
    points, route_overrides, phases_meta, days, turns = parse_trip_plan(TRIP_PLAN_PATH)
    print(f"  {len(points)} waypoints | {len(route_overrides)} overrides | "
          f"{len(phases_meta)} phases | {len(days)} days | {len(turns)} notes\n")

    legs = build_legs(points, route_overrides)
    phase_legs = build_phase_leg_index(legs)

    route_data = {
        "legs": legs,
        "phases": build_phases(phases_meta, phase_legs),
        "stops": build_stops(points),
        "turns": turns,
        "days": days,
        "totals": {
            "distance_km": round(sum(leg["distance_km"] for leg in legs), 1),
            "time_min": sum(leg["time_min"] for leg in legs),
        },
        "updated": "Generated from docs/trip-plan.md",
    }

    ROUTE_DATA_PATH.write_text(
        json.dumps(route_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    sync_app_js(route_data)

    print("\nWrote:")
    print(f"  {ROUTE_DATA_PATH}")
    print(f"  {APP_JS_PATH}")
    print(
        f"\nTotal: {route_data['totals']['distance_km']} km, "
        f"{route_data['totals']['time_min'] // 60}h "
        f"{route_data['totals']['time_min'] % 60:02d}"
    )


if __name__ == "__main__":
    main()
