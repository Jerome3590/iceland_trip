/**
 * patch-gallery.js
 * Adds photo gallery lightbox to stop popups.
 * Run AFTER upload-photos.js completes and route-data.json has S3 URLs.
 * Then run: node build-app.js
 */
const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// ── 1. Replace popup HTML to include photo thumbnails ─────────────────────────
const OLD_POPUP = `\`<div class="popup-title">\${h(stop.name)}</div><div class="popup-note"><strong>\${h(stop.type==='unplanned'?'📍 Unplanned stop':stop.type)}</strong><br>\${h(stop.note)}\${stop.photos&&stop.photos.length?\`<br><span class="popup-photos">📷 \${stop.photos.length} photos taken here</span>\`:''}</div>\``;

const NEW_POPUP = `(()=>{
  const photoHtml=stop.photos&&stop.photos.length
    ?'<div class="popup-gallery">'+stop.photos.slice(0,12).map((p,i)=>\`<img src="\${p.url}" alt="Photo \${i+1} at \${h(stop.name)}" loading="lazy" onclick="window.__openLightbox(\${JSON.stringify(stop.photos.map(x=>x.url))},\${i})" />\`).join('')+(stop.photos.length>12?\`<span class="popup-gallery-more">+\${stop.photos.length-12} more</span>\`:'')+'</div>'
    :'';
  return \`<div class="popup-title">\${h(stop.name)}</div><div class="popup-note"><strong>\${h(stop.type==='unplanned'?'📍 Unplanned stop':stop.type)}</strong><br>\${h(stop.note)}</div>\${photoHtml}\`;
})()`;

if (!src.includes(OLD_POPUP)) {
  // Try original (before patch-unplanned-markers ran)
  const ORIG_POPUP = `\`<div class="popup-title">\${h(stop.name)}</div><div class="popup-note"><strong>\${h(stop.type)}</strong><br>\${h(stop.note)}</div>\``;
  if (!src.includes(ORIG_POPUP)) { console.error('Cannot find popup HTML'); process.exit(1); }
  src = src.replace(ORIG_POPUP, NEW_POPUP);
} else {
  src = src.replace(OLD_POPUP, NEW_POPUP);
}
console.log('✓ Popup gallery HTML added');

// ── 2. Inject lightbox overlay + logic before closing script ─────────────────
const LIGHTBOX_CSS = `
<style>
#lb-overlay{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);align-items:center;justify-content:center;flex-direction:column}
#lb-overlay.open{display:flex}
#lb-img{max-width:92vw;max-height:82vh;border-radius:8px;object-fit:contain;box-shadow:0 8px 40px #000c}
#lb-nav{display:flex;gap:2rem;margin-top:1rem;align-items:center}
#lb-nav button{background:none;border:2px solid #fff8;color:#fff;border-radius:6px;padding:.4rem 1.2rem;font-size:1.3rem;cursor:pointer;transition:background .15s}
#lb-nav button:hover{background:#fff2}
#lb-counter{color:#fff9;font-size:.9rem;min-width:5rem;text-align:center}
#lb-close{position:absolute;top:1.2rem;right:1.5rem;background:none;border:none;color:#fff;font-size:2rem;cursor:pointer;line-height:1}
</style>
<div id="lb-overlay" role="dialog" aria-modal="true">
  <button id="lb-close" aria-label="Close">&times;</button>
  <img id="lb-img" src="" alt="" />
  <div id="lb-nav">
    <button id="lb-prev" aria-label="Previous">&#8592;</button>
    <span id="lb-counter"></span>
    <button id="lb-next" aria-label="Next">&#8594;</button>
  </div>
</div>
<script>
(function(){
  let urls=[], idx=0;
  function show(i){
    idx=(i+urls.length)%urls.length;
    document.getElementById('lb-img').src=urls[idx];
    document.getElementById('lb-counter').textContent=(idx+1)+' / '+urls.length;
  }
  window.__openLightbox=function(u,i){urls=u;document.getElementById('lb-overlay').classList.add('open');show(i);};
  document.getElementById('lb-close').onclick=function(){document.getElementById('lb-overlay').classList.remove('open');};
  document.getElementById('lb-prev').onclick=function(){show(idx-1);};
  document.getElementById('lb-next').onclick=function(){show(idx+1);};
  document.getElementById('lb-overlay').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
  document.addEventListener('keydown',function(e){
    if(!document.getElementById('lb-overlay').classList.contains('open'))return;
    if(e.key==='ArrowRight')show(idx+1);
    if(e.key==='ArrowLeft')show(idx-1);
    if(e.key==='Escape')document.getElementById('lb-overlay').classList.remove('open');
  });
})();
</script>`;

const OLD_CLOSING = '</body>';
if (!src.includes(OLD_CLOSING)) { console.error('Cannot find </body>'); process.exit(1); }
src = src.replace(OLD_CLOSING, LIGHTBOX_CSS + '\n</body>');
console.log('✓ Lightbox overlay injected');

fs.writeFileSync('app.js', src);
console.log('app.js updated — run: node build-app.js to finalize');
