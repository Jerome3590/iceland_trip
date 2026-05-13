const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// Current: respects system dark/light preference
const OLD = "let d=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';";
// New: always default to light
const NEW = "let d='light';";

if (!src.includes(OLD)) { console.error('Theme toggle pattern not found'); process.exit(1); }
src = src.replace(OLD, NEW);
fs.writeFileSync('app.js', src);
console.log('Done — theme defaults to light mode');
