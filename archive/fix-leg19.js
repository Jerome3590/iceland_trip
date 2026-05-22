const fs = require('fs');
const data = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

const rev = arr => [...arr].reverse();

function nearest(coords, lon, lat) {
  let minD = Infinity, idx = 0;
  for (let i = 0; i < coords.length; i++) {
    const d = Math.hypot(coords[i][0] - lon, coords[i][1] - lat);
    if (d < minD) { minD = d; idx = i; }
  }
  return idx;
}

// ── Krafla/Víti → Akureyri  (reverse the Akureyri→Krafla detour) ────────────
const kraflaToAkureyri = [
  ...rev(data.legs[17].geometry.coordinates), // rev leg18
  ...rev(data.legs[16].geometry.coordinates), // rev leg17
  ...rev(data.legs[15].geometry.coordinates), // rev leg16
];

// ── Akureyri → Borgarnes  (reversed leg10) ──────────────────────────────────
const akureyriToBorgarnes = rev(data.legs[9].geometry.coordinates);

// ── Borgarnes → Reykjavík  (reversed leg1) ──────────────────────────────────
const borgaresToReykjavik = rev(data.legs[0].geometry.coordinates);
const reykjavikCoord = borgaresToReykjavik[borgaresToReykjavik.length - 1];

// ── Reykjavík → Selfoss via actual Route 1 road geometry ────────────────────
// Leg 38 (idx 37): LAVA Centre → Garður Old Lighthouse
// goes Hvolsvöllur→Selfoss→Hveragerði→Reykjavík→Reykjanes→Garður
// Reversed: Garður→Reykjavík→Hveragerði→Selfoss→Hvolsvöllur
// Slice the Reykjavík→Selfoss portion from this reversed leg.
const leg38rev = rev(data.legs[37].geometry.coordinates);

const reykIdx    = nearest(leg38rev, reykjavikCoord[0], reykjavikCoord[1]);
const selfossIdx = nearest(leg38rev.slice(reykIdx), -20.9971, 63.9334) + reykIdx;

const reykToSelfoss = leg38rev.slice(reykIdx, selfossIdx + 1);

console.log(`leg38rev nearest Reykjavik idx=${reykIdx}: ${JSON.stringify(leg38rev[reykIdx])}`);
console.log(`leg38rev nearest Selfoss   idx=${selfossIdx}: ${JSON.stringify(leg38rev[selfossIdx])}`);
console.log(`Reykjavík→Selfoss segment: ${reykToSelfoss.length} coords`);

// ── Assemble full route ──────────────────────────────────────────────────────
const newCoords = [
  ...kraflaToAkureyri,
  ...akureyriToBorgarnes,
  ...borgaresToReykjavik,
  ...reykToSelfoss,
];

const distKm =
  data.legs[17].distance_km +
  data.legs[16].distance_km +
  data.legs[15].distance_km +
  data.legs[9].distance_km  +
  data.legs[0].distance_km  +
  52;

const timeMin = Math.round(distKm / 90 * 60);

data.legs[18] = {
  ...data.legs[18],
  distance_km: Math.round(distKm * 10) / 10,
  time_min: timeMin,
  geometry: { type: 'LineString', coordinates: newCoords },
};

data.totals.distance_km = Math.round(data.legs.reduce((s, l) => s + l.distance_km, 0) * 10) / 10;
data.totals.time_min    = data.legs.reduce((s, l) => s + l.time_min, 0);

fs.writeFileSync('route-data.json', JSON.stringify(data));

const c = newCoords;
console.log(`Leg 19 rebuilt: ${c.length} coords, ${data.legs[18].distance_km} km`);
console.log(`  Start : [${c[0]}]  (Krafla/Víti)`);
console.log(`  Via30%: [${c[Math.floor(c.length*0.30)]}]`);
console.log(`  Via60%: [${c[Math.floor(c.length*0.60)]}]`);
console.log(`  Via80%: [${c[Math.floor(c.length*0.80)]}]`);
console.log(`  Via90%: [${c[Math.floor(c.length*0.90)]}]`);
console.log(`  End   : [${c[c.length-1]}]  (Selfoss)`);
console.log(`New totals: ${data.totals.distance_km} km, ${data.totals.time_min} min`);

