# app.js Architecture

`website/app.js` = `const routeData = {…JSON…}` injected at line 1 by `build-app.js`, followed by the JS logic section. Never edit the `routeData` block directly — always edit `data/route-data.json` and run `node build-app.js`.

---

## Logic section order (do not reorder)

1. `iconSvg` — SVG icon constant
2. `h()` — HTML escape helper
3. `t()` — time formatter (min → "Xh YYm")
4. `phaseColor()` — phase ID → hex color
5. **Theme toggle** — `data-theme-toggle` button handler
6. **Stats** — populates `#total-km`, `#total-time`
7. **`phaseCard()`** — renders phase card HTML with `order:${p.id}` for mobile ordering
8. **Phase cards injection** — inserts cards into `#left-phases`, `#center-top-phases`, `#right-phases`, `#bottom-phases`
9. **Legend** — populates `#legend` with phase swatches
10. **`#center-top-phases` auto-hide** — hides if empty
11. **Tab switching** — `document.addEventListener('click')` for `[data-map-tab]` + `window.__setIcelandMapTab`
12. **`renderDaysWithSunriseSunset()`** — ASYNC, fetches `api.sunrise-sunset.org` for each day at lat=64.8, lng=-18, Iceland/Reykjavik timezone
13. **Turns** — populates `#turns`
14. **`let map; let allMarkers=[]; let allFeatures=[];`** — outer scope state
15. **`function init()`** — MapLibre map init, route layers, stop markers (pushed to `allMarkers`), leg click popup
16. **`setPhaseFilter(pid)`** — filters route layers + hides markers, fits bounds
17. **Phase filter bar injection** — injects `.phase-filter-bar` buttons after `.map-title`
18. **`if(window.maplibregl){init()}…`** — deferred init guard

---

## Features that must not be dropped

When rebuilding `website/app.js`, verify these survive:

| Feature | What to check |
|---|---|
| **Sunrise/sunset per day** | `renderDaysWithSunriseSunset` async function + `api.sunrise-sunset.org` |
| **Phase filter tabs** | `.phase-filter-bar`, `setPhaseFilter`, `allMarkers.push` |
| **Mobile phase order** | `order:${p.id}` on phase card `<article>` |
| **Tab switching** | `data-map-tab` click listener + `window.__setIcelandMapTab` |
| **Center-top auto-hide** | `center-top-phases` display none if empty |
| **Marker tracking** | `allMarkers=[]`, `allFeatures=[]` declared before `init()` |

---

## CSS rules (website/style.css)

- Mobile breakpoint `≤1180px`: `.expedition` uses `display:flex; flex-direction:column`. All col/stack divs use `display:contents` so phase cards participate in flex order.
- Phase cards have `order:${p.id}` inline — phases render 1→5 on mobile.
- `.map-card` has `order:0` — map appears first on mobile.
- Phase filter bar: `.phase-filter-bar` + `.pfb` + `.pfb.is-active` classes.
- Daylight info: `.daylight-info` on each day card.

---

## Rebuild workflow

```powershell
# After editing data/route-data.json:
node build-app.js

# Deploy:
aws s3 cp website/app.js s3://jerome-dixon.io/iceland_trip/app.js
aws s3 cp data/route-data.json s3://jerome-dixon.io/iceland_trip/route-data.json
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"

# Full sync (CSS/HTML changes):
aws s3 sync website/ s3://jerome-dixon.io/iceland_trip/
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```
