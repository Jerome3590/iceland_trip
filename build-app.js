/**
 * build-app.js
 * Rebuilds app.js by bundling route-data.json into the logic template.
 * Usage: node build-app.js
 */
const fs = require('fs');
const path = require('path');

const routeDataPath = path.join(__dirname, 'route-data.json');
const appPath       = path.join(__dirname, 'app.js');

// Read the current app.js and extract the logic section (everything after the routeData declaration)
const current = fs.readFileSync(appPath, 'utf8');
const logicStart = current.indexOf('\nconst iconSvg');
if (logicStart === -1) { console.error('Could not find logic section in app.js'); process.exit(1); }
const logic = current.substring(logicStart); // "\nconst iconSvg = ..."

// Read fresh route-data.json
const routeData = fs.readFileSync(routeDataPath, 'utf8');

// Bundle
const output = `const routeData = ${routeData}${logic}`;
fs.writeFileSync(appPath, output);
console.log(`app.js rebuilt: ${(output.length / 1024).toFixed(0)} KB`);

// Also copy to iceland-route-map if it exists
const mirrorPath = path.join(__dirname, 'iceland-route-map', 'app.js');
if (fs.existsSync(path.dirname(mirrorPath))) {
  fs.writeFileSync(mirrorPath, output);
  console.log('Mirrored to iceland-route-map/app.js');
}

