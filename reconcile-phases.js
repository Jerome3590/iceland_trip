/**
 * reconcile-phases.js
 * 1. Check photo dates on unplanned stops → assign correct phase
 * 2. Remove planned stops with no photos from route-data.json
 * 3. Output TODO entries for removed stops
 */
const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

// Phase date ranges (Iceland local, UTC+0 in April/May)
const PHASES = [
  { phase: 1, start: '2026-04-03', end: '2026-05-05', label: 'Phase 1 — Wild West (May 3-5)' },
  { phase: 2, start: '2026-05-05', end: '2026-05-09', label: 'Phase 2 — True North (May 6-8)' },
  { phase: 3, start: '2026-05-08', end: '2026-05-11', label: 'Phase 3 — South Run (May 9-11)' },
  { phase: 4, start: '2026-05-10', end: '2026-05-13', label: 'Phase 4 — Deep South (May 11-12)' },
  { phase: 5, start: '2026-05-12', end: '2026-05-15', label: 'Phase 5 — Home Stretch (May 13-14)' },
];

function phaseFromDate(dateStr) {
  // dateStr from exiftool: "2026:05:08 10:30:00" → "2026-05-08"
  if (!dateStr) return null;
  const iso = dateStr.substring(0,10).replace(/:/g, '-');
  for (const p of PHASES) {
    if (iso >= p.start && iso <= p.end) return p.phase;
  }
  return null;
}

function medianDate(photos) {
  const dates = photos
    .map(p => p.taken)
    .filter(Boolean)
    .map(t => t.substring(0,10).replace(/:/g,'-'))
    .sort();
  if (!dates.length) return null;
  return dates[Math.floor(dates.length / 2)];
}

// ── 1. Fix unplanned stop phase assignments ──────────────────────────────────
console.log('=== Unplanned stop phase reassignments ===');
d.stops.filter(s => s.type === 'unplanned').forEach(s => {
  if (!s.photos || !s.photos.length) return;
  const med = medianDate(s.photos);
  const newPhase = phaseFromDate(med);
  if (newPhase && newPhase !== s.phase) {
    console.log(`  ${s.name}: Phase ${s.phase} → Phase ${newPhase} (median photo date: ${med})`);
    s.phase = newPhase;
  } else {
    console.log(`  ${s.name}: Phase ${s.phase} OK (median: ${med})`);
  }
});

// ── 2. Identify planned stops with no photos → remove + collect for TODO ─────
const KEEP_ALWAYS = ['Reykjavík', 'KEF Airport']; // always keep base stops

const toRemove = d.stops.filter(s =>
  s.type !== 'unplanned' &&
  (!s.photos || !s.photos.length) &&
  !KEEP_ALWAYS.some(k => s.name.includes(k))
);

console.log('\n=== Planned stops with no photos → moving to TODO ===');
toRemove.forEach(s => console.log(`  [Ph${s.phase}] ${s.name}`));

// Remove from stops
d.stops = d.stops.filter(s => !toRemove.includes(s));
console.log(`\nRemoved ${toRemove.length} stops. Remaining: ${d.stops.length}`);

// ── 3. Write updated route-data.json ─────────────────────────────────────────
fs.writeFileSync('route-data.json', JSON.stringify(d));
console.log('route-data.json saved');

// ── 4. Output TODO entries ────────────────────────────────────────────────────
const byPhase = {};
toRemove.forEach(s => {
  const key = `Phase ${s.phase}`;
  if (!byPhase[key]) byPhase[key] = [];
  byPhase[key].push(s);
});

let todoBlock = '\n## Skipped Stops (no photos — not visited)\n\n';
todoBlock += '> These were on the planned route but photo evidence shows they were not visited.\n\n';
Object.keys(byPhase).sort().forEach(ph => {
  todoBlock += `### ${ph}\n`;
  byPhase[ph].forEach(s => {
    todoBlock += `- **${s.name}** (\`${s.type}\`, ${s.lat}, ${s.lon})\n`;
    if (s.note) todoBlock += `  - ${s.note}\n`;
  });
  todoBlock += '\n';
});

// Append to TODO.md
const todo = fs.readFileSync('TODO.md', 'utf8');
if (!todo.includes('Skipped Stops')) {
  fs.writeFileSync('TODO.md', todo + todoBlock);
  console.log('\nTODO.md updated with skipped stops');
} else {
  console.log('\nTODO.md already has skipped stops section');
}
