(() => {
  const fallbackStations = [
    { id: 'reykjavik', name: 'Reykjavík', city: 'Capital Region', phase: 1, lat: 64.1466, lon: -21.9426, note: 'Best place to start fully charged and to recharge before the return leg.' },
    { id: 'mosfellsbaer', name: 'Mosfellsbær', city: 'Capital Region', phase: 1, lat: 64.17, lon: -21.7, note: 'Convenient first northbound top-up after leaving Reykjavík.' },
    { id: 'borgarnes', name: 'Borgarnes', city: 'West Iceland', phase: 1, lat: 64.5383, lon: -21.9225, note: 'Core west-coast charging hub for the Snæfellsnes base camp.' },
    { id: 'grundarfjordur', name: 'Grundarfjörður', city: 'Snæfellsnes', phase: 1, lat: 64.9247, lon: -23.2631, note: 'Useful charging point while circling the Snæfellsnes peninsula.' },
    { id: 'akureyri', name: 'Akureyri', city: 'North Iceland', phase: 2, lat: 65.6835, lon: -18.0878, note: 'Main North Iceland hub for overnight charging and town stops.' },
    { id: 'dalvik', name: 'Dalvík', city: 'North Iceland', phase: 2, lat: 65.9704, lon: -18.5287, note: 'Handy north-coast option if you add a fjord-side detour.' },
    { id: 'myvatn', name: 'Reykjahlíð / Mývatn', city: 'North Iceland', phase: 2, lat: 65.6415, lon: -16.909, note: 'Important top-up before the long repositioning back south.' },
    { id: 'hella', name: 'Hella', city: 'South Iceland', phase: 3, lat: 63.8432, lon: -20.4019, note: 'Useful stop between Selfoss, the south coast, and the eastern drive.' },
    { id: 'selfoss', name: 'Selfoss', city: 'South Iceland', phase: 3, lat: 63.9334, lon: -20.9971, note: 'South gateway base camp with strong charging coverage.' },
    { id: 'hveragerdi', name: 'Hveragerði', city: 'South Iceland', phase: 3, lat: 64.0007, lon: -21.214, note: 'Good charging stop before Reykjadalur or the south coast.' },
    { id: 'vik', name: 'Vík', city: 'South Iceland', phase: 4, lat: 63.4186, lon: -19.006, note: 'Practical stop on the way to black-sand and glacier-country days.' },
    { id: 'klaustur', name: 'Kirkjubæjarklaustur', city: 'South Iceland', phase: 4, lat: 63.787, lon: -18.056, note: 'Critical south-coast charging hub before Skaftafell and Jökulsárlón.' },
    { id: 'skaftafell', name: 'Skaftafell', city: 'Vatnajökull', phase: 4, lat: 64.015, lon: -16.9752, note: 'Best glacier-region top-up before the long East Fjords leg.' },
    { id: 'hofn', name: 'Höfn', city: 'Southeast Iceland', phase: 5, lat: 64.2497, lon: -15.2082, note: 'Last major southeast hub before the East Fjords drive.' },
    { id: 'breiddalsvik', name: 'Breiðdalsvík', city: 'East Fjords', phase: 5, lat: 64.7922, lon: -14.0071, note: 'Useful overnight top-up on the return side of the ring road.' },
    { id: 'reydarfjordur', name: 'Reyðarfjörður', city: 'East Fjords', phase: 5, lat: 65.0316, lon: -14.2171, note: 'Strong East Fjords fallback charging stop.' },
    { id: 'egilsstadir', name: 'Egilsstaðir', city: 'East Iceland', phase: 5, lat: 65.2669, lon: -14.3948, note: 'Largest east-side charging hub and a useful buffer before the final return.' },
    { id: 'seydisfjordur', name: 'Seyðisfjörður', city: 'East Iceland', phase: 5, lat: 65.2639, lon: -14.0058, note: 'Side-trip charger if you detour off the ring road into the fjord.' },
  ];

  const phasePalette = { 1: '#0c6fa8', 2: '#148b63', 3: '#f0b526', 4: '#8f3d97', 5: '#10a8bf' };
  const tabButtons = Array.from(document.querySelectorAll('[data-map-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-map-panel]'));
  const chargingPanelEl = document.getElementById('charging-panel');
  const phaseListEls = [1, 2, 3, 4, 5].map((n) => document.getElementById(`charging-list-phase-${n}`));
  const chargingCount = document.getElementById('charging-count');
  const chargingPhases = document.getElementById('charging-phases');
  const chargingSummary = document.getElementById('charging-summary-note');
  const stationCacheKey = 'iceland-charging-stations-cache-v2';
  const stationCacheMaxAgeMs = 12 * 60 * 60 * 1000;

  if (!tabButtons.length || !panels.length || !chargingPanelEl || phaseListEls.some((el) => !el) || !chargingCount || !chargingPhases) {
    return;
  }

  const markerById = new Map();
  let chargingMap = null;
  let currentStations = fallbackStations.slice();

  function updateSummary(message) {
    if (chargingSummary) {
      chargingSummary.textContent = message;
    }
  }

  function readCachedStations() {
    try {
      const rawValue = window.localStorage.getItem(stationCacheKey);
      if (!rawValue) {
        return null;
      }

      const parsed = JSON.parse(rawValue);
      if (!parsed || !Array.isArray(parsed.stations) || !Number.isFinite(parsed.updatedAt)) {
        return null;
      }

      const ageMs = Date.now() - parsed.updatedAt;
      return {
        stations: parsed.stations.filter(Boolean),
        updatedAt: parsed.updatedAt,
        isStale: ageMs > stationCacheMaxAgeMs,
      };
    } catch (_error) {
      return null;
    }
  }

  function writeCachedStations(stations) {
    try {
      window.localStorage.setItem(stationCacheKey, JSON.stringify({
        updatedAt: Date.now(),
        stations,
      }));
    } catch (_error) {}
  }

  function phaseColor(phase) {
    return phasePalette[phase] || '#0c6fa8';
  }

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
  }

  function inferPhase(lat, lon, name, city) {
    const text = `${name || ''} ${city || ''}`.toLowerCase();
    if (text.includes('reykjav') || text.includes('mosfells') || text.includes('borgarnes') || text.includes('grundarfj')) return 1;
    if (text.includes('akureyri') || text.includes('dalvík') || text.includes('dalvik') || text.includes('mývatn') || text.includes('myvatn')) return 2;
    if (text.includes('selfoss') || text.includes('hella') || text.includes('hverager') || text.includes('thingvellir') || text.includes('geysir') || text.includes('gullfoss')) return 3;
    if (text.includes('vík') || text.includes('vik') || text.includes('klaustur') || text.includes('skaftafell') || text.includes('seljalands') || text.includes('skógafoss') || text.includes('skogafoss')) return 4;
    if (text.includes('hofn') || text.includes('höfn') || text.includes('reð') || text.includes('reyd') || text.includes('egils') || text.includes('seydis') || text.includes('breiðd') || text.includes('breidd')) return 5;

    let nearestPhase = 5;
    let nearestDistance = Number.POSITIVE_INFINITY;
    fallbackStations.forEach((station) => {
      const distance = haversineKm(lat, lon, station.lat, station.lon);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPhase = station.phase;
      }
    });
    return nearestPhase;
  }

  function createMarkerElement(station) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'charging-marker';
    element.style.setProperty('--marker-color', phaseColor(station.phase));
    element.setAttribute('aria-label', station.name);
    element.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2L5 13h5l-1 9 8-11h-5l1-9Z" fill="currentColor"/></svg>';
    return element;
  }

  function buildGoogleMapsUrl(station) {
    const query = encodeURIComponent(`${station.name} ${station.address || station.city || 'Iceland'}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  function firstTag(tags, keys) {
    for (const key of keys) {
      const value = tags[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  function formatApproxCoords(lat, lon) {
    return `${lat.toFixed(4)}°N, ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`;
  }

  function formatAddress(tags, city) {
    const street = tags['addr:street'];
    const houseNumber = tags['addr:housenumber'];
    const place = tags['addr:place'];
    const postcode = tags['addr:postcode'];
    const suburb = tags['addr:suburb'];
    const cityName = firstTag(tags, ['addr:city', 'addr:town']) || city;
    const lineOne = [houseNumber, street].filter(Boolean).join(' ');
    const lineTwo = [suburb, place, cityName].filter(Boolean).join(', ');
    const lineThree = postcode ? `IS-${postcode}` : '';
    const built = [lineOne, lineTwo, lineThree].filter(Boolean).join(' · ');
    if (built) {
      return built;
    }
    return cityName || 'Iceland';
  }

  function clearChargingMarkers() {
    markerById.forEach((marker) => marker.remove());
    markerById.clear();
  }

  function stationArticleHtml(station) {
    return `
      <article class="charging-item" data-station-id="${station.id}" tabindex="0" role="button" aria-label="${station.name}">
        <strong>${station.name}</strong>
        <p class="charging-address">${station.address || station.city}</p>
        <p>${station.note}</p>
        <div class="charging-item-footer">
          <span class="route-metric">${station.live ? 'Live · OSM' : 'Itinerary hub'}</span>
          <a class="charging-link" href="${buildGoogleMapsUrl(station)}" target="_blank" rel="noopener noreferrer">Google Maps</a>
        </div>
      </article>`;
  }

  function activateStationById(stationId) {
    const station = currentStations.find((item) => item.id === stationId);
    if (!station || !chargingMap) {
      return;
    }
    chargingMap.flyTo({ center: [station.lon, station.lat], zoom: 8.3, speed: 0.8 });
    const marker = markerById.get(station.id);
    if (marker) {
      marker.togglePopup();
    }
  }

  function renderStationList() {
    const phaseCount = new Set(currentStations.map((station) => station.phase)).size;
    chargingCount.textContent = `${currentStations.length}`;
    chargingPhases.textContent = `${phaseCount}`;
    phaseListEls.forEach((el, index) => {
      const phase = index + 1;
      const items = currentStations.filter((station) => Number(station.phase) === phase);
      el.innerHTML = items.length
        ? items.map(stationArticleHtml).join('')
        : '<p class="charging-phase-empty">No stations in this phase for the current dataset.</p>';
    });

    if (!chargingPanelEl.dataset.stationActivateBound) {
      chargingPanelEl.dataset.stationActivateBound = '1';
      chargingPanelEl.addEventListener('click', (event) => {
        const row = event.target.closest('[data-station-id]');
        if (!row || event.target.closest('.charging-link')) {
          return;
        }
        activateStationById(row.dataset.stationId);
      });
      chargingPanelEl.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        const row = event.target.closest('[data-station-id]');
        if (!row || event.target.closest('.charging-link')) {
          return;
        }
        event.preventDefault();
        activateStationById(row.dataset.stationId);
      });
    }
  }

  function fitChargingBounds() {
    if (!chargingMap || !currentStations.length) {
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    currentStations.forEach((station) => bounds.extend([station.lon, station.lat]));
    chargingMap.fitBounds(bounds, { padding: { top: 28, right: 28, bottom: 28, left: 28 }, duration: 0 });
  }

  function renderChargingMapStations() {
    if (!chargingMap || !chargingMap.loaded()) {
      return;
    }

    clearChargingMarkers();
    currentStations.forEach((station) => {
      const marker = new maplibregl.Marker({ element: createMarkerElement(station) })
        .setLngLat([station.lon, station.lat])
        .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML(`<div class="popup-title">${station.name}</div><div class="popup-note"><strong>${station.address || station.city}</strong><br>${station.note}<br><a href="${buildGoogleMapsUrl(station)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a><br>Phase ${station.phase}${station.live ? '<br>Live OpenStreetMap result' : ''}</div>`))
        .addTo(chargingMap);
      markerById.set(station.id, marker);
    });

    fitChargingBounds();
  }

  function normalizeOverpassEntry(entry) {
    const tags = entry.tags || {};
    const center = entry.center || entry.Center || null;
    const lat = Number(entry.lat ?? center?.lat);
    const lon = Number(entry.lon ?? center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    const rawDesc = firstTag(tags, ['description']);
    const name =
      firstTag(tags, ['name', 'operator', 'brand', 'network', 'ref', 'ref:isil'])
      || (rawDesc && (rawDesc.length > 100 ? `${rawDesc.slice(0, 99)}…` : rawDesc))
      || `EV charger (${formatApproxCoords(lat, lon)})`;
    const city =
      firstTag(tags, [
        'addr:city',
        'addr:town',
        'addr:village',
        'addr:hamlet',
        'addr:suburb',
        'addr:municipality',
        'is_in:city',
        'is_in:town',
        'is_in:municipality',
        'place',
      ]) || 'Iceland';
    let address = formatAddress(tags, city);
    if (!address || address === 'Iceland') {
      address = city !== 'Iceland' ? city : `Map position · ${formatApproxCoords(lat, lon)}`;
    }
    const noteParts = [];
    if (tags.operator) {
      noteParts.push(tags.operator);
    }
    if (tags['socket:type2'] || tags['socket:ccs']) {
      const sockets = [];
      if (tags['socket:type2']) {
        sockets.push(`Type 2 ${tags['socket:type2']}`);
      }
      if (tags['socket:ccs']) {
        sockets.push(`CCS ${tags['socket:ccs']}`);
      }
      noteParts.push(sockets.join(', '));
    }
    if (tags.capacity) {
      noteParts.push(`${tags.capacity} connectors`);
    }
    if (tags.opening_hours) {
      noteParts.push(tags.opening_hours);
    }

    const phase = inferPhase(lat, lon, name, city);
    return {
      id: `osm-${entry.type}-${entry.id ?? `${lat.toFixed(4)}-${lon.toFixed(4)}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}`,
      name,
      city,
      phase,
      lat,
      lon,
      address,
      note: noteParts.join(' · ') || 'OpenStreetMap charging station',
      live: true,
    };
  }

  async function fetchLiveStations() {
    const query = `[out:json][timeout:45];\n(\n  node["amenity"="charging_station"](63.0,-25.0,67.5,-13.0);\n  way["amenity"="charging_station"](63.0,-25.0,67.5,-13.0);\n  relation["amenity"="charging_station"](63.0,-25.0,67.5,-13.0);\n);\nout center tags;`;
    const response = await fetch('https://overpass.kumi.systems/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) {
      throw new Error(`Overpass request failed: ${response.status}`);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.elements)) {
      return [];
    }
    return data.elements.map((entry) => normalizeOverpassEntry(entry)).filter(Boolean);
  }

  function dedupeStations(stations) {
    const byKey = new Map();
    stations.forEach((station) => {
      const key = `${station.name.toLowerCase()}|${station.lat.toFixed(3)}|${station.lon.toFixed(3)}`;
      if (!byKey.has(key)) {
        byKey.set(key, station);
      }
    });
    return Array.from(byKey.values());
  }

  async function loadStations() {
    const liveStations = await fetchLiveStations();
    const merged = dedupeStations([...liveStations, ...fallbackStations].map((station) => ({
      ...station,
      address: station.address || station.city,
    })));

    if (merged.length === 0) {
      return fallbackStations.slice();
    }

    return merged.sort((left, right) => left.phase - right.phase || left.name.localeCompare(right.name));
  }

  async function refreshStations() {
    updateSummary('Refreshing live charging data from OpenStreetMap Overpass...');
    try {
      currentStations = await loadStations();
      writeCachedStations(currentStations);
      updateSummary('Live charging data loaded from OpenStreetMap and cached for faster reloads.');
    } catch (_error) {
      const cachedStations = readCachedStations();
      currentStations = cachedStations?.stations || fallbackStations.slice();
      if (cachedStations) {
        updateSummary('Using cached charging data while the live feed is unavailable.');
      } else {
        updateSummary('Using the curated charging fallback while the live feed is unavailable.');
      }
    }

    renderStationList();
    renderChargingMapStations();
  }

  function initChargingMap() {
    if (chargingMap || !window.maplibregl) {
      return;
    }

    chargingMap = new maplibregl.Map({
      container: 'charging-map',
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [-18.8, 64.6],
      zoom: 5.1,
      attributionControl: true,
    });

    chargingMap.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
    chargingMap.on('load', () => {
      renderChargingMapStations();
    });
  }

  function setActiveTab(tabName) {
    tabButtons.forEach((button) => {
      const active = button.dataset.mapTab === tabName;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.mapPanel !== tabName;
    });

    if (tabName === 'charging') {
      initChargingMap();
      requestAnimationFrame(() => {
        if (chargingMap) {
          chargingMap.resize();
          renderChargingMapStations();
        }
      });
    }
  }

  window.__setIcelandMapTab = setActiveTab;

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTab(button.dataset.mapTab));
  });

  const cachedStations = readCachedStations();
  if (cachedStations) {
    currentStations = cachedStations.stations;
    updateSummary(cachedStations.isStale ? 'Loaded cached charging data and will refresh it now.' : 'Loaded cached charging data and will refresh it in the background.');
  } else {
    updateSummary('Loading live charging data from OpenStreetMap Overpass...');
  }

  renderStationList();
  setActiveTab('route');
  refreshStations();
})();