const fs = require('fs');
const d  = JSON.parse(fs.readFileSync('route-data.json', 'utf8'));

const WAYPOINTS = [
  'Reykjavík charger recovery',
  'Reykjavík waypoint for Phase 3 extension',
];

const removed = d.stops.filter(s => WAYPOINTS.includes(s.name));
d.stops = d.stops.filter(s => !WAYPOINTS.includes(s.name));

console.log('Removed waypoint placeholders:');
removed.forEach(s => console.log(' ', s.name));
console.log('Remaining stops:', d.stops.length);

fs.writeFileSync('route-data.json', JSON.stringify(d));

// Append to TODO
const note = removed.map(s =>
  `- **${s.name}** — internal route waypoint, not a real stop`
).join('\n');

const todo = fs.readFileSync('TODO.md', 'utf8');
const updated = todo.replace(
  '## Skipped Stops (no photos — not visited)',
  `## Internal Waypoints Removed\n\n${note}\n\n## Skipped Stops (no photos — not visited)`
);
fs.writeFileSync('TODO.md', updated);
console.log('TODO.md updated');
