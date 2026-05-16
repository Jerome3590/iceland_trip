const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// The regex replace in patch-app.js turned:
//   {type:'FeatureCollection',features}   (shorthand, key=features)
// into:
//   {type:'FeatureCollection',allFeatures} (shorthand, key=allFeatures)
// GeoJSON requires the key to be "features" — fix it back to explicit key:value
const OLD = "type:'FeatureCollection',allFeatures}";
const NEW = "type:'FeatureCollection',features:allFeatures}";

if (!src.includes(OLD)) {
  console.error('Pattern not found — checking what exists...');
  const idx = src.indexOf("FeatureCollection");
  console.log(src.substring(idx - 5, idx + 80));
  process.exit(1);
}

src = src.replace(OLD, NEW);
fs.writeFileSync('app.js', src);
console.log('Fixed: GeoJSON source now uses features:allFeatures');

// Verify
const logic = src.substring(src.indexOf('\nconst iconSvg'));
console.log('features:allFeatures in source:', logic.includes("features:allFeatures}"));
console.log('No bare allFeatures} shorthand:', !logic.includes("type:'FeatureCollection',allFeatures}"));

