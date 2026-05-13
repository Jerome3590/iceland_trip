# Iceland Trip Map — Dev Rules & Architecture

## Project Overview
Static site deployed to AWS S3 + CloudFront at `https://jerome-dixon.io/iceland_trip/`.
Source files live at `C:\Projects\iceland_trip\`.
Reference/staging area: `iceland-route-map/` (gitignored, used to build updated app.js).

---

## File Architecture

| File | Role |
|---|---|
| `index.html` | Single-page HTML shell. No tab/panel structure — just map + phase cards. |
| `app.js` | **All-in-one bundle**: `const routeData = {…JSON…}` at line 1, then JS logic. Rebuilt via `build-app.js`. |
| `style.css` | All styling including map, phase cards, filter bar, mobile layout. |
| `route-data.json` | Source of truth for all route data (legs, stops, phases, days, turns, totals). **Rebuild app.js after editing this.** |
| `charging-map.js` | EV charging station map (not currently wired to index.html — preserved for future use). |
| `base.css` | Typography and CSS reset. |

---

## app.js Architecture (CRITICAL — do not break)

`app.js` = `const routeData = {JSON}` + JS logic section.

**The logic section contains these features in order:**

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
18. **`if(window.maplibregl){init()}...`** — deferred init guard

---

## Rebuild Workflow

**After editing `route-data.json`:**
```
node build-app.js
```
This reads `route-data.json`, prepends `const routeData = `, and appends the existing logic section from `app.js`.

**After patching logic in `app.js`:**
Use `patch-app.js` as a reference for how to make targeted string replacements.
Always run `verify-patch.js` to confirm all features are still present after any edit.

**Verify all features present:**
```
node verify-patch.js
```
Expected output — all `true`:
- `order:p.id in phaseCard`
- `allMarkers declared`
- `allFeatures declared`
- `setPhaseFilter fn`
- `phase-filter-bar`
- `allMarkers.push`
- `Grindavik in data`
- `sunrise/sunset`
- `tab switching`

---

## Deploy Workflow

```powershell
# Sync all files to S3
aws s3 sync . s3://jerome-dixon.io/iceland_trip/ --delete `
  --exclude ".git/*" --exclude ".github/*" `
  --exclude "node_modules/*" --exclude "iceland-route-map/*"

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E3MZK5HYTJ14P3 --paths "/iceland_trip/*"
```

**S3 Bucket:** `jerome-dixon.io`  
**S3 Prefix:** `iceland_trip`  
**CloudFront Distribution ID:** `E3MZK5HYTJ14P3`

---

## Stop / Route Data Rules

- **`route-data.json`** is the single source of truth. Never edit `app.js` data directly.
- After adding/removing stops or legs, always run `node build-app.js` before deploying.
- Stop fields: `name`, `lat`, `lon`, `type` (`base camp` | `stop` | `coast/town` | `geology` | etc.), `phase` (1–5), `note`
- To add photo links: add `photos_url` field to a stop — the popup HTML checks `stop.photos_url` if present.

## Legs / Geometry Fix Scripts

| Script | Purpose |
|---|---|
| `fix-leg19.js` | Reconstructs Leg 19 (Krafla→Selfoss) from reversed existing legs |
| `build-app.js` | Rebuilds app.js from route-data.json (run after any data change) |
| `patch-app.js` | Reference for targeted JS logic patches |
| `patch-css.js` | Reference for targeted CSS patches |
| `restore-features.js` | Restores features dropped during app.js rebuilds (check git history) |
| `verify-patch.js` | Confirms all critical features present in app.js |
| `live-test.js` | Puppeteer live test of deployed site (requires `npm install puppeteer`) |

---

## Features That Must Not Be Dropped

When rebuilding `app.js`, always verify these survive:

| Feature | What to check |
|---|---|
| **Sunrise/sunset per day** | `renderDaysWithSunriseSunset` async function + `api.sunrise-sunset.org` |
| **Phase filter tabs** | `.phase-filter-bar`, `setPhaseFilter`, `allMarkers.push` |
| **Mobile phase order** | `order:${p.id}` on phase card `<article>` |
| **Tab switching** | `data-map-tab` click listener + `window.__setIcelandMapTab` |
| **Center-top auto-hide** | `center-top-phases` display none if empty |
| **Marker tracking** | `allMarkers=[]`, `allFeatures=[]` declared before `init()` |

---

## CSS Rules

- Mobile breakpoint `≤1180px`: `.expedition` uses `display:flex; flex-direction:column`. All col/stack divs use `display:contents` so phase cards participate in flex order.
- Phase cards have `order:${p.id}` inline — phases render 1→5 on mobile.
- `.map-card` has `order:0` — map appears first on mobile.
- Phase filter bar: `.phase-filter-bar` + `.pfb` + `.pfb.is-active` classes.
- Daylight info: `.daylight-info` on each day card.
