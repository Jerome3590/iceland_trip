/**
 * clean-turns.js
 * - Remove technical Leg 19 routing correction entries (indices 0, 1)
 * - Remove redundant Phase 3 duplicate (index 6)
 * - Rewrite "coverage added" and "adjustment" titles to state the actual route
 * - Fix May 12 return entry (remove LAVA Centre — stop was removed)
 * - Clean up days titles/plans with non-weather adjustment language
 */
const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

// ── Replace turns entirely with cleaned set ──────────────────────────────────
d.turns = [
  {
    phase: 1,
    title: "Phase 1 — Borgarfjörður Loop",
    text:  "Borgarnes base. May 4: Reykjavík run then Deildartunguhver, Reykholt and Hraunfossar/Barnafoss. May 5: Snæfellsnes loop via Arnarstapi–Hellnar coastal path, Kirkjufell and Grundarfjörður."
  },
  {
    phase: 2,
    title: "North Iceland cold-weather adjustment",
    text:  "Akureyri stayed useful as a warm recovery base: town walk, harbor/cafés and Forest Lagoon, with Goðafoss/Mývatn kept to the strongest weather window."
  },
  {
    phase: 2,
    title: "Phase 2 — North Iceland Circuit",
    text:  "Route 1 north via Varmahlíð and Glaumbaer Turf Farm to Akureyri. Goðafoss, Lake Mývatn, Hverir/Námafjall, Bjarnaflag Geothermal Power Station, Krafla Power Station and Krafla/Víti."
  },
  {
    phase: 3,
    title: "Weather update: Phase 3 follows Phase 2 route plus extension",
    text:  "Due to weather, Phase 3 uses the same practical Route 1 corridor as Phase 2, forces the route through Reykjavík, and then extends to Selfoss. Golden Circle and South Coast items are optional add-ons from the Selfoss base."
  },
  {
    phase: 3,
    title: "Phase 3 — Route 1 South via Reykjavík",
    text:  "Krafla area → Reykjavík → Selfoss. South Coast: Seljalandsfoss/Gljúfrabúi, Skógafoss, Kerið. Golden Circle: Gullfoss. Base at Selfoss with LÁ Art Museum and Hveragerði nearby."
  },
  {
    phase: 3,
    title: "May 10 Selfoss priority order",
    text:  "Go to Gullfoss first while weather holds, then Faxi only if it fits, Kerið on the southbound return, and keep Hveragerði/Eyrarbakki culture stops as warm indoor options."
  },
  {
    phase: 4,
    title: "May 11 big east run",
    text:  "Base at Hvolsvöllur. Start early: Urriðafoss, Jökulsárlón, Diamond Beach, then Reynisfjara, Skógafoss and Kvernufoss as westbound return stops."
  },
  {
    phase: 5,
    title: "May 15 — Reykjanes Peninsula to KEF",
    text:  "Grindavík coast tour, Garður Old Lighthouse, HSS Suðurnes Hospital tour, Keflavík town, then KEF Airport."
  }
];

// ── Clean days titles/plans ───────────────────────────────────────────────────
d.days.forEach(day => {
  if (day.title === 'Charger recovery + Borgarfjörður') {
    day.title = 'Borgarfjörður Loop';
    day.plan  = 'Deildartunguhver, Reykholt and Hraunfossar/Barnafoss from Borgarnes base. Morning run to Reykjavík and back.';
  }
  if (day.title === 'Power stations, then Phase 3 extension via Reykjavík') {
    day.title = 'Power Stations + Krafla → Reykjavík';
    day.plan  = 'Bjarnaflag Geothermal Power Station, Krafla Power Station, Krafla/Víti. Then Route 1 south through Reykjavík toward Selfoss.';
  }
  if (day.title === 'Arrive Selfoss via Phase 2 extension') {
    day.title = 'Route 1 South — Selfoss';
    day.plan  = 'Route 1 south via Seljalandsfoss/Gljúfrabúi and Skógafoss to Selfoss base.';
  }
  if (day.title === 'Drive back to Reykjavík') {
    day.plan = day.plan.replace(/Use the LAVA Centre before checkout[^.]+\.\s*/i, '');
  }
});

fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('Turns:', d.turns.length);
d.turns.forEach(t => console.log(` Ph${t.phase} | ${t.title}`));
console.log('\nroute-data.json saved');
