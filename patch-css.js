const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

// ── 1. Fix mobile phase ordering ─────────────────────────────────────────────
// Replace 1180px block to use flex + display:contents so order:N on cards works
const OLD_1180 = "@media(max-width:1180px){.expedition{grid-template-columns:1fr;grid-template-areas:'center' 'left' 'right'}.left-col,.right-col{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4)}.phase-stack{display:contents}.details{grid-template-columns:1fr}}";
const NEW_1180 = "@media(max-width:1180px){.expedition{display:flex;flex-direction:column;gap:var(--space-4)}.left-col,.right-col,.center-col,.center-top,.below-map,.phase-stack{display:contents}.map-card{order:0}.legend{order:0}.details{grid-template-columns:1fr}}";

if (!css.includes(OLD_1180)) { console.error('Cannot find 1180px block'); process.exit(1); }
css = css.replace(OLD_1180, NEW_1180);
console.log('✓ Mobile flex ordering fixed');

// ── 2. Add phase filter bar styles ───────────────────────────────────────────
// Append before closing of last media query or at end of file
const filterBarCss = `.phase-filter-bar{display:flex;gap:var(--space-2);padding:var(--space-2) var(--space-4);flex-wrap:wrap;border-bottom:1px solid color-mix(in oklab,var(--color-ink) 10%,transparent)}.pfb{padding:var(--space-1) var(--space-3);border:2px solid color-mix(in oklab,var(--c,var(--color-ink)) 30%,transparent);border-radius:var(--radius-full);background:transparent;font-size:var(--text-xs);font-weight:900;cursor:pointer;color:var(--color-ink);transition:var(--transition-interactive)}.pfb.is-active{background:var(--c,var(--color-ink));color:#fff;border-color:var(--c,var(--color-ink))}.pfb:hover:not(.is-active){background:color-mix(in oklab,var(--c,var(--color-ink)) 12%,transparent)}`;

// Also add daylight-info style if missing
const daylightCss = `.daylight-info{margin-top:var(--space-1);font-size:var(--text-xs);opacity:0.85;color:var(--color-muted)}`;

css += filterBarCss + daylightCss;
console.log('✓ Phase filter bar CSS added');
console.log('✓ Daylight info CSS added');

fs.writeFileSync('style.css', css);
console.log('style.css updated');

