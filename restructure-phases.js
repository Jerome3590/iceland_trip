const fs = require('fs');
const d = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

// Helper: find leg index by from+to names
function legIdx(from, to) {
  const i = d.legs.findIndex(l => l.from === from && l.to === to);
  if (i === -1) throw new Error(`Leg not found: ${from} -> ${to}`);
  return i;
}

// ── 1. Remove Húsið Museum: merge leg 29 (Hveragerði→Húsið) + leg 30 (Húsið→Hvolsvöllur) ──
const idxHusid  = legIdx('LÁ Art Museum / Hveragerði', 'Húsið Museum / Eyrarbakki'); // 28
const idxAfter  = legIdx('Húsið Museum / Eyrarbakki', 'Hvolsvöllur');                 // 29
const legA = d.legs[idxHusid];
const legB = d.legs[idxAfter];
const mergedLeg = {
  from: legA.from,
  to: legB.to,
  distance_km: Math.round((legA.distance_km + legB.distance_km) * 10) / 10,
  time_min: Math.round(legA.time_min + legB.time_min),
  geometry: {
    type: 'LineString',
    coordinates: [...legA.geometry.coordinates, ...legB.geometry.coordinates.slice(1)]
  }
};
d.legs.splice(idxHusid, 2, mergedLeg);
console.log('✓ Merged Hveragerði→Húsið + Húsið→Hvolsvöllur into single leg');

// ── 2. Change LAVA Centre → Garður Old Lighthouse  →  LAVA Centre → Reykjavík ─
const idxLavaGardur = legIdx('LAVA Centre', 'Garður Old Lighthouse');
d.legs[idxLavaGardur] = {
  from: 'LAVA Centre',
  to: 'Reykjavík',
  distance_km: 131.2,
  time_min: 95,
  geometry: {
    type: 'LineString',
    coordinates: [
      [-20.2267, 63.7516],
      [-20.55,   63.86],
      [-20.90,   63.93],
      [-21.30,   64.02],
      [-21.70,   64.08],
      [-21.9426, 64.1466]
    ]
  }
};
console.log('✓ Changed LAVA Centre → Garður to LAVA Centre → Reykjavík (direct, Phase 4 end)');

// ── 3. Remove old Garður Old Lighthouse → Reykjavík leg (no longer on the route) ──
const idxGardurRey = legIdx('Garður Old Lighthouse', 'Reykjavík');
d.legs.splice(idxGardurRey, 1);
console.log('✓ Removed Garður → Reykjavík leg');

// ── 4. Change Reykjavík → HSS  →  Garður Old Lighthouse → HSS ──────────────────
const idxReyHSS = legIdx('Reykjavík', 'HSS Suðurnes Hospital');
d.legs[idxReyHSS] = {
  from: 'Garður Old Lighthouse',
  to: 'HSS Suðurnes Hospital',
  distance_km: 12.4,
  time_min: 14,
  geometry: {
    type: 'LineString',
    coordinates: [
      [-22.6877, 64.0819],
      [-22.6200, 64.0450],
      [-22.5549, 64.0011]
    ]
  }
};
console.log('✓ Changed Reykjavík→HSS to Garður Old Lighthouse→HSS');

// ── 5. Insert Phase 5 legs: Reykjavík→Grindavík and Grindavík→Garður before Garður→HSS ─
const idxGardurHSS = legIdx('Garður Old Lighthouse', 'HSS Suðurnes Hospital');
d.legs.splice(idxGardurHSS, 0,
  {
    from: 'Reykjavík',
    to: 'Grindavík',
    distance_km: 48.5,
    time_min: 42,
    geometry: {
      type: 'LineString',
      coordinates: [
        [-21.9426, 64.1466],
        [-22.05,   64.04],
        [-22.20,   63.98],
        [-22.35,   63.93],
        [-22.4338, 63.8439]
      ]
    }
  },
  {
    from: 'Grindavík',
    to: 'Garður Old Lighthouse',
    distance_km: 32.1,
    time_min: 30,
    geometry: {
      type: 'LineString',
      coordinates: [
        [-22.4338, 63.8439],
        [-22.5200, 63.9100],
        [-22.6100, 63.9600],
        [-22.6877, 64.0819]
      ]
    }
  }
);
console.log('✓ Inserted Reykjavík→Grindavík and Grindavík→Garður Old Lighthouse');

// ── 6. Rebuild phase.legs arrays by position ─────────────────────────────────
// After all changes, assign 1-based leg numbers
function legsInRange(from1Based, to1Based) {
  return Array.from({length: to1Based - from1Based + 1}, (_, i) => from1Based + i);
}
// Phase 3 ends at Hveragerði (leg 28)
// Phase 4: Hveragerði→Hvolsvöllur (29) through LAVA→Reykjavík
// Phase 5: Reykjavík→Grindavík through KEF
const idxLavaRey   = legIdx('LAVA Centre', 'Reykjavík');         // last Phase 4 leg (0-based)
const idxReyGrind  = legIdx('Reykjavík', 'Grindavík');           // first Phase 5 leg (0-based)
const idxHverHvols = legIdx('LÁ Art Museum / Hveragerði', 'Hvolsvöllur'); // first Phase 4 leg (0-based)

const p3LastLeg   = idxHverHvols;                 // 0-based index, Phase 3 ends just before this
const p4FirstLeg  = idxHverHvols + 1;             // 1-based
const p4LastLeg   = idxLavaRey + 1;               // 1-based
const p5FirstLeg  = idxReyGrind + 1;              // 1-based
const p5LastLeg   = d.legs.length;                // 1-based

d.phases.find(p => p.id === 3).legs = legsInRange(19, idxHverHvols); // up to leg before Hveragerði→Hvolsvöllur
d.phases.find(p => p.id === 4).legs = legsInRange(idxHverHvols + 1, idxLavaRey + 1);
d.phases.find(p => p.id === 5).legs = legsInRange(idxReyGrind + 1, d.legs.length);
console.log('✓ Phase 3 legs:', d.phases.find(p=>p.id===3).legs);
console.log('✓ Phase 4 legs:', d.phases.find(p=>p.id===4).legs);
console.log('✓ Phase 5 legs:', d.phases.find(p=>p.id===5).legs);

// ── 7. Update phase metadata ──────────────────────────────────────────────────
const p4 = d.phases.find(p => p.id === 4);
p4.dates = 'May 11–12';
p4.base = 'Hvolsvöllur → Reykjavík';
p4.summary = 'Big east run from Hvolsvöllur to Jökulsárlón, Diamond Beach and back, then LAVA Centre and drive north to Reykjavík base camp.';
p4.items.push({
  title: 'May 12 — Back to Reykjavík',
  desc: 'Morning LAVA Centre, then direct drive up Route 1 to Reykjavík. Hallgrímskirkja, Harpa, Old Harbour and seafood dinner.'
});

const p5 = d.phases.find(p => p.id === 5);
p5.dates = 'May 13–15';
p5.base = 'Reykjavík';
p5.summary = 'City rest day, then departure day Reykjanes loop: Grindavík, Garður Old Lighthouse, HSS hospital visit, EV top-up and fly home from KEF.';
p5.items = [
  {
    title: 'May 13–14 — Reykjavík city days',
    desc: 'National Museum, Perlan, Settlement Exhibition, Laugavegur and evening jazz/blues.'
  },
  {
    title: 'May 15 — Departure via Reykjanes',
    desc: 'Check out 8:30 AM, Grindavík coast, Garður Old Lighthouse, HSS Suðurnes Hospital 10:00 AM, EV charge + car return at KEF, FI631 KEF 17:10 → BOS 18:50.'
  }
];

// ── 8. Update days ────────────────────────────────────────────────────────────
// May 12: move from phase 5 → phase 4, update plan
const may12 = d.days.find(dy => dy.date === 'May 12');
if (may12) {
  may12.phase = 4;
  may12.title = 'LAVA Centre + drive to Reykjavík';
  may12.drive = 'Hvolsvöllur → LAVA Centre → Reykjavík';
  may12.plan = 'Morning LAVA Centre in Hvolsvöllur before checkout, then direct drive north on Route 1 to Reykjavík. Hallgrímskirkja, Harpa, Old Harbour and seafood dinner.';
}

// May 15: update to include Reykjanes peninsula
const may15 = d.days.find(dy => dy.date === 'May 15');
if (may15) {
  may15.drive = 'Reykjavík → Grindavík → Garður → HSS → KEF';
  may15.plan = 'Check out by 8:30 AM. Quick Grindavík coast stop, Garður Old Lighthouse photo stop, HSS Suðurnes Hospital tour at 10:00 AM (Skólavegur 6, Reykjanesbær). EV top-up at ISAVIA Leifstöð at KEF. Car return by noon. Lunch at terminal. Clear security by 4:00 PM. Icelandair FI631 · KEF 17:10 → BOS 18:50 · Conf: BUTUWM.';
}

// May 10: remove Húsið Museum mention
const may10 = d.days.find(dy => dy.date === 'May 10');
if (may10) {
  may10.plan = may10.plan.replace(', Húsið Museum', '').replace('Húsið Museum and dinner', 'dinner');
}

// ── 9. Remove Húsið Museum from stops ─────────────────────────────────────────
d.stops = d.stops.filter(s => s.name !== 'Húsið Museum / Eyrarbakki');
console.log('✓ Removed Húsið Museum stop');

// ── 10. Recalculate totals ────────────────────────────────────────────────────
const totalKm  = d.legs.reduce((s, l) => s + l.distance_km, 0);
const totalMin = d.legs.reduce((s, l) => s + l.time_min, 0);
d.totals.total_distance_km    = Math.round(totalKm * 10) / 10;
d.totals.total_time_min       = Math.round(totalMin);
const h = Math.floor(totalMin / 60), m = Math.round(totalMin % 60);
d.totals.total_time_formatted = `${h}h ${String(m).padStart(2,'0')}m`;

fs.writeFileSync('route-data.json', JSON.stringify(d));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\nDone. route-data.json updated:');
console.log('  Legs:', d.legs.length, '| Stops:', d.stops.length, '| Days:', d.days.length);
console.log('  Total:', d.totals.total_distance_km, 'km |', d.totals.total_time_formatted);
console.log('\nLegs 28-41:');
for (let i = 27; i < d.legs.length; i++) {
  const l = d.legs[i];
  const ph = d.phases.find(p => p.legs.includes(i+1));
  console.log(`  Leg ${i+1} [Ph${ph?.id||'?'}]: ${l.from} → ${l.to} | ${l.distance_km} km`);
}

