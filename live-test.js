const puppeteer = require('puppeteer');

const URL = 'https://jerome-dixon.io/iceland_trip/';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));

  console.log('Loading', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));

  // ── Basic page checks ────────────────────────────────────────────────────
  const title = await page.title();
  console.log('\n[PAGE]');
  console.log('  Title:', title);

  const totalKm = await page.$eval('#total-km', el => el.textContent).catch(() => 'NOT FOUND');
  const totalTime = await page.$eval('#total-time', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('  Total KM:', totalKm);
  console.log('  Total time:', totalTime);

  // ── Tab switching ────────────────────────────────────────────────────────
  console.log('\n[TABS]');
  const tabs = await page.$$eval('[data-map-tab]', els => els.map(el => ({
    name: el.dataset.mapTab,
    active: el.classList.contains('is-active'),
    ariaSelected: el.getAttribute('aria-selected')
  })));
  tabs.forEach(t => console.log(`  Tab "${t.name}": active=${t.active}, aria-selected=${t.ariaSelected}`));

  // ── Sunrise/sunset ───────────────────────────────────────────────────────
  console.log('\n[DAYS]');
  const dayCount = await page.$$eval('.day', els => els.length).catch(() => 0);
  console.log('  Day cards rendered:', dayCount);
  // Wait briefly for async fetch
  await new Promise(r => setTimeout(r, 4000));
  const sunriseText = await page.$eval('.daylight-info', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('  First daylight-info:', sunriseText);

  // ── Stops / Grindavik (via DOM markers) ─────────────────────────────────
  console.log('\n[STOPS]');
  const markerCount = await page.$$eval('.marker', els => els.length).catch(() => 0);
  const markerLabels = await page.$$eval('.marker', els => els.map(el => el.getAttribute('aria-label'))).catch(() => []);
  const hasGrindavik = markerLabels.includes('Grindavík');
  console.log('  Map markers rendered:', markerCount);
  console.log('  Grindavík marker on map:', hasGrindavik ? '✅ YES' : '❌ NOT FOUND');
  console.log('  All marker labels:', markerLabels.join(', '));

  // ── Leg 19 via embedded script text ─────────────────────────────────────
  console.log('\n[LEG 19]');
  const leg19check = await page.evaluate(() => {
    // routeData is const in script scope — read via JS evaluation trick
    try {
      const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
      return { scripts };
    } catch(e) { return { error: e.message }; }
  });
  // Check route-data via fetch
  const rdRes = await page.evaluate(async () => {
    try {
      const r = await fetch('/iceland_trip/route-data.json');
      const d = await r.json();
      const leg19 = d.legs[18];
      const grindavik = d.stops.find(s => s.name === 'Grindavík');
      return {
        leg19coords: leg19.geometry.coordinates.length,
        leg19dist: leg19.distance_km,
        totalStops: d.stops.length,
        grindavikInJson: grindavik ? JSON.stringify(grindavik) : 'NOT FOUND',
      };
    } catch(e) { return { error: e.message }; }
  });
  console.log('  Leg 19 coords:', rdRes.leg19coords);
  console.log('  Leg 19 distance:', rdRes.leg19dist, 'km');
  console.log('  Total stops in JSON:', rdRes.totalStops);
  console.log('  Grindavík in route-data.json:', rdRes.grindavikInJson);

  // ── Map rendered ─────────────────────────────────────────────────────────
  console.log('\n[MAP]');
  const mapCanvas = await page.$('.maplibregl-canvas').catch(() => null);
  console.log('  MapLibre canvas present:', !!mapCanvas);

  // ── Console errors ───────────────────────────────────────────────────────
  console.log('\n[ERRORS]');
  if (consoleErrors.length === 0) {
    console.log('  No console errors');
  } else {
    consoleErrors.forEach(e => console.log('  ❌', e));
  }

  await browser.close();
  console.log('\nTest complete.');
})();

