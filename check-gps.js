const lines = require('fs').readFileSync('photo-gps.csv','utf8').split(/\r?\n/);
console.log('Total lines:', lines.length);
const withGPS = lines.slice(1).filter(l => {
  const cols = l.split(',');
  return cols[2] && cols[2].trim() !== '';
});
console.log('Photos with GPS:', withGPS.length);
if (withGPS.length) {
  console.log('\nSample rows:');
  withGPS.slice(0,3).forEach(l => console.log(' ', l));
} else {
  console.log('\nNo GPS data found — checking unmatched sample:');
  lines.slice(1,6).forEach(l => console.log(' ', l));
}
