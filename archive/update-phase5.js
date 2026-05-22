const fs = require('fs');
const d = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

// ── 1. Remove Snæfellsnes legs (40-43, 1-based = indices 39-42) ──────────────
d.legs.splice(39, 4); // removes legs 40,41,42,43 in place

// ── 2. Add departure legs (now become legs 40 & 41) ──────────────────────────
d.legs.push({
  leg: 40,
  from: "Reykjavík",
  to: "HSS Suðurnes Hospital",
  distance_km: 38.2,
  time_min: 42,
  geometry: {
    type: "LineString",
    coordinates: [
      [-21.9426, 64.1466],
      [-21.98,   64.12],
      [-22.10,   64.09],
      [-22.28,   64.04],
      [-22.42,   64.01],
      [-22.5549,  64.0011]
    ]
  }
});
d.legs.push({
  leg: 41,
  from: "HSS Suðurnes Hospital",
  to: "KEF Airport",
  distance_km: 3.6,
  time_min: 6,
  geometry: {
    type: "LineString",
    coordinates: [
      [-22.5549, 64.0011],
      [-22.5800, 63.9920],
      [-22.6056, 63.9850]
    ]
  }
});

// ── 3. Remove Walter Mitty / Snæfellsnes stops (phase 5 only) ────────────────
const removeNames = [
  'Stykkishólmur / Walter Mitty Bridge',
  'Kirkjufell',         // phase 5 duplicate
  'Arnarstapi / Hellnar' // phase 5 duplicate
];
d.stops = d.stops.filter(s => !(s.phase === 5 && removeNames.includes(s.name)));

// ── 4. Add HSS Hospital + KEF Airport stops ───────────────────────────────────
d.stops.push({
  name: "HSS Suðurnes Hospital",
  lat: 64.0011,
  lon: -22.5549,
  type: "hospital",
  phase: 5,
  note: "10:00 AM hospital tour on departure day. ER 24/7 · +354 422 0500 · Skólavegur 6, Reykjanesbær"
});
d.stops.push({
  name: "KEF Airport",
  lat: 63.9850,
  lon: -22.6056,
  type: "airport",
  phase: 5,
  note: "Icelandair FI631 KEF 17:10 → BOS 18:50. EV charging: ISAVIA Leifstöð 50kW on site."
});

// ── 5. Remove May 13 Snæfellsnes day, update May 14, add May 15 ──────────────
d.days = d.days.filter(day => day.title !== 'Snæfellsnes day trip from Reykjavík');

const may14 = d.days.find(day => day.date === 'May 14');
if (may14) {
  may14.title = 'Reykjavík city day';
  may14.drive = 'Local only';
  may14.plan = 'National Museum, Perlan, Settlement Exhibition, Laugavegur shopping, Tjörnin lake walk and weather-dependent Nauthólsvík or live jazz/blues evening.';
}

d.days.push({
  date: "May 15",
  phase: 5,
  title: "Departure — Reykjavík → KEF → Boston",
  drive: "Reykjavík → HSS Hospital → KEF",
  plan: "Check out by 8:30 AM. HSS Suðurnes Hospital tour at 10:00 AM (Skólavegur 6, Reykjanesbær). EV top-up at ISAVIA Leifstöð at KEF. Car return by noon. Lunch at terminal. Clear security by 4:00 PM. Icelandair FI631 · KEF 17:10 → BOS 18:50 · Conf: BUTUWM."
});

// ── 6. Update Phase 5 metadata ───────────────────────────────────────────────
const p5 = d.phases.find(p => p.id === 5);
p5.name = "Reykjavík Return & Departure";
p5.dates = "May 12–15";
p5.legs = [37, 38, 39, 40, 41];
p5.summary = "LAVA Centre and Garður Old Lighthouse on the return to Reykjavík, city day, then hospital visit and fly home from KEF.";
p5.items = [
  {
    title: "Hvolsvöllur → Reykjavík",
    desc: "LAVA Centre before checkout, Garður Old Lighthouse detour, then Reykjavík harbor/church/city reset."
  },
  {
    title: "May 14 — City day",
    desc: "National Museum, Perlan, Settlement Exhibition, Laugavegur and evening jazz."
  },
  {
    title: "May 15 — Departure",
    desc: "HSS Suðurnes Hospital at 10:00 AM, EV charge & car return at KEF, FI631 KEF 17:10 → BOS 18:50."
  }
];

// ── 7. Recalculate totals ────────────────────────────────────────────────────
const totalKm  = d.legs.reduce((s, l) => s + l.distance_km, 0);
const totalMin = d.legs.reduce((s, l) => s + l.time_min, 0);
d.totals.total_distance_km = Math.round(totalKm * 10) / 10;
d.totals.total_time_min    = Math.round(totalMin);
const h = Math.floor(totalMin / 60), m = Math.round(totalMin % 60);
d.totals.total_time_formatted = `${h}h ${String(m).padStart(2,'0')}m`;

fs.writeFileSync('route-data.json', JSON.stringify(d));

console.log('route-data.json updated');
console.log('  Legs:', d.legs.length, '| Stops:', d.stops.length, '| Days:', d.days.length);
console.log('  Phase 5 legs:', p5.legs);
console.log('  Total km:', d.totals.total_distance_km, '| Time:', d.totals.total_time_formatted);
console.log('  Phase 5 stops:', d.stops.filter(s=>s.phase===5).map(s=>s.name));
console.log('  Days:', d.days.map(d2=>`${d2.date}: ${d2.title}`));

