// InstantWeb LivePreviewer v1.0.0 — by TechSetuApps
const PLUGIN_ID   = 'com.techsetuapps.instantweb.livepreviewer';
const PREVIEW_URL = 'http://127.0.0.1:8080';
const AMAZON_LINK = 'https://apkpure.net/instantweb/app.techsetuapps.instantweb';

let panel=null, iframe=null, fab=null;
let isVisible=false, isFs=false, resizing=false, resizeTimer;


function getViewportTop() {
  return window.visualViewport ? window.visualViewport.offsetTop : 0;
}
function getViewportHeight() {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}
function applyViewportPosition() {
  if (!panel || isFs) return;
  const isLand = window.innerWidth > window.innerHeight;
  if (isLand) {
    panel.style.top    = getViewportTop() + 'px';
    panel.style.height = getViewportHeight() + 'px';
  } else {
    // Portrait: keep bottom:0, adjust height to exclude keyboard bar
    // This way resize (height only) still expands panel upward correctly
    const keyboardH = window.innerHeight - getViewportHeight() - getViewportTop();
    const currentH = panel.offsetHeight;
    // Don't override height if user is resizing
    if (!resizing) {
      panel.style.bottom = keyboardH + 'px';
    }
  }
}
function initViewportListener() {
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', applyViewportPosition);
    window.visualViewport.addEventListener('scroll', applyViewportPosition);
  }
}
function destroyViewportListener() {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', applyViewportPosition);
    window.visualViewport.removeEventListener('scroll', applyViewportPosition);
  }
}

const ic = {
  refresh: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  close:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  fullscr: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  exitfs:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>`,
  dl:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
};

function mkBtn(html, title, color, cb) {
  const b = document.createElement('button');
  b.innerHTML = html; b.title = title;
  b.style.cssText = `display:flex;align-items:center;justify-content:center;width:38px;height:38px;background:transparent;border:none;cursor:pointer;border-radius:8px;color:${color};flex-shrink:0;-webkit-tap-highlight-color:transparent;`;
  let _t = false;
  b.addEventListener('touchstart', () => b.style.background='rgba(255,255,255,0.12)', {passive:true});
  b.addEventListener('touchend', e => { b.style.background='transparent'; _t=true; e.preventDefault(); cb(); }, {passive:false});
  b.addEventListener('click', () => { if(_t){_t=false;return;} cb(); });
  return b;
}

function showError() {
  if (!panel) return;
  const old = document.getElementById('iw-err'); if (old) old.remove();
  const d = document.createElement('div');
  d.id = 'iw-err';
  d.style.cssText = `position:absolute;inset:0;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;z-index:5;`;
  d.innerHTML = `
    <button id="iw-err-close" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.07);border:none;border-radius:8px;width:36px;height:36px;color:#64748b;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">${ic.close}</button>
    <div style="width:68px;height:68px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:#fff;margin-bottom:20px;box-shadow:0 8px 28px rgba(37,99,235,0.45);">W</div>
    <p style="color:#e2e8f0;font-size:15px;font-weight:700;margin-bottom:8px;">InstantWeb is not running</p>
    <p style="color:#64748b;font-size:12px;margin-bottom:22px;line-height:1.7;max-width:230px;">Please download InstantWeb, host any HTML file, then tap Live Preview.</p>
    <a href="${AMAZON_LINK}" style="display:flex;align-items:center;gap:8px;background:#2563eb;color:#fff;padding:11px 22px;border-radius:11px;text-decoration:none;font-size:13px;font-weight:700;margin-bottom:12px;">${ic.dl} Download InstantWeb</a>
    <button id="iw-retry" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;padding:9px 20px;border-radius:9px;cursor:pointer;font-size:12px;">Retry</button>
  `;
  panel.appendChild(d);
  document.getElementById('iw-err-close').onclick = () => { d.remove(); hidePanel(); };
  document.getElementById('iw-retry').onclick     = () => { d.remove(); loadPreview(); };
}

// Eruda local file — bundled inside plugin zip
// ACode stores plugin files at this path on Android


// KEY FIX: onload set BEFORE src — never misses load event
function loadPreview() {
  if (!iframe) return;
  const sb = document.getElementById('iw-sb');
  if (sb) { sb.textContent='Connecting...'; sb.style.color='#64748b'; }
  // Reset srcdoc so src works
  iframe.removeAttribute('srcdoc');
  fetch(PREVIEW_URL+'/__iw_ping?t='+Date.now(), {mode:'no-cors',cache:'no-store'})
    .then(() => {
      iframe.src = PREVIEW_URL+'/?__iw_acode=1&t='+Date.now();
      if (sb) { sb.textContent='● localhost:8080'; sb.style.color='#22c55e'; }
    })
    .catch(() => {
      showError();
      if (sb) { sb.textContent='● Not running'; sb.style.color='#ef4444'; }
    });
}

function toggleFullscreen() {
  if (!panel) return;
  isFs = !isFs;
  if (isFs) {
    destroyViewportListener();
    panel.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;background:#0f172a;z-index:9999;display:flex;flex-direction:column;`;
  } else {
    buildPanel();
  }
  const fsBtn = document.getElementById('iw-fs-btn');
  if (fsBtn) fsBtn.innerHTML = isFs ? ic.exitfs : ic.fullscr;
}






function addResizeHandle(p, isLand) {
  const h = document.createElement('div');
  h.style.cssText = `position:absolute;background:rgba(255,255,255,0.09);border-radius:4px;z-index:2;${isLand?'left:0;top:50%;transform:translateY(-50%);width:6px;height:52px;cursor:ew-resize;':'top:0;left:50%;transform:translateX(-50%);height:6px;width:52px;cursor:ns-resize;'}`;
  h.onmouseenter=()=>h.style.background='rgba(37,99,235,0.55)';
  h.onmouseleave=()=>{if(!resizing)h.style.background='rgba(255,255,255,0.09)';};
  let s0,sz0;
  const start=(x,y)=>{
    resizing=true; s0=isLand?x:y; sz0=isLand?p.offsetWidth:p.offsetHeight;
    if(!isLand){
      // Lock panel to bottom:0 so height changes expand panel upward
      p.style.bottom='0px';
      p.style.top='auto';
    }
  };
  const move=(x,y)=>{
    if(!resizing)return;
    if(isLand){
      // Landscape: left handle, drag left=grow, drag right=shrink
      const d=s0-x;
      const v=Math.max(180,Math.min(window.innerWidth*0.82,sz0+d));
      p.style.width=v+'px';
    } else {
      // Portrait: top handle, panel bottom-anchored
      // Drag UP (y decreases): s0-y > 0 → height grows → panel expands upward ✓
      // Drag DOWN (y increases): s0-y < 0 → height shrinks ✓
      const d=s0-y;
      const v=Math.max(120,Math.min(window.innerHeight*0.88,sz0+d));
      p.style.height=v+'px';
    }
  };
  h.addEventListener('touchstart',e=>{start(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
  document.addEventListener('touchmove',e=>{if(resizing){move(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();}},{passive:false});
  document.addEventListener('touchend',()=>resizing=false);
  h.onmousedown=e=>start(e.clientX,e.clientY);
  document.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  document.addEventListener('mouseup',()=>resizing=false);
  p.appendChild(h);
}

function buildPanel() {
  if (panel) { panel.remove(); panel=null; iframe=null; }
  destroyViewportListener();
  const isLand = window.innerWidth > window.innerHeight;
  const vTop   = getViewportTop();
  const vH     = getViewportHeight();
  const panelH = Math.round(window.innerHeight * 0.46);

  panel = document.createElement('div');
  panel.id = 'iw-panel';
  panel.style.cssText = `
    position:fixed;background:#0f172a;z-index:9999;
    display:flex;flex-direction:column;
    ${isLand
      ? `right:0;top:${vTop}px;width:46%;height:${vH}px;border-left:1.5px solid #1e3a5f;box-shadow:-4px 0 32px rgba(0,0,0,0.6);`
      : `left:0;bottom:0;width:100%;height:${panelH}px;border-top:1.5px solid #1e3a5f;border-radius:16px 16px 0 0;box-shadow:0 -4px 32px rgba(0,0,0,0.6);`
    }
  `;

  const hd = document.createElement('div');
  hd.style.cssText = `display:flex;align-items:center;padding:0 6px 0 14px;background:#1e293b;gap:4px;flex-shrink:0;height:50px;${!isLand?'border-radius:16px 16px 0 0;':''}`;

  const ico = document.createElement('div');
  ico.style.cssText = `width:28px;height:28px;background:#2563eb;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#fff;flex-shrink:0;`;
  ico.textContent = 'W';

  const ttl = document.createElement('span');
  ttl.style.cssText = `color:#94a3b8;font-size:12px;font-weight:600;flex:1;user-select:none;padding-left:8px;`;
  ttl.textContent = 'Live Preview';

  const sb = document.createElement('span');
  sb.id='iw-sb';
  sb.style.cssText=`font-size:10px;color:#64748b;margin-right:2px;white-space:nowrap;`;
  sb.textContent='...';

  const refreshB = mkBtn(ic.refresh,'Refresh',   '#94a3b8',()=>{const e=document.getElementById('iw-err');if(e)e.remove();loadPreview();});
  const fsBtn    = mkBtn(ic.fullscr,'Fullscreen','#94a3b8',toggleFullscreen);
  fsBtn.id='iw-fs-btn';
  const closeB   = mkBtn(ic.close,  'Close',     '#ef4444',hidePanel);

  hd.appendChild(ico);hd.appendChild(ttl);hd.appendChild(sb);
  hd.appendChild(refreshB);hd.appendChild(fsBtn);hd.appendChild(closeB);

  const webArea = document.createElement('div');
  webArea.style.cssText=`flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative;min-height:0;`;

  iframe = document.createElement('iframe');
  iframe.style.cssText=`flex:1;border:none;background:#fff;width:100%;height:100%;display:block;`;
  iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
  webArea.appendChild(iframe);

  panel.appendChild(hd);
  panel.appendChild(webArea);
  addResizeHandle(panel, isLand);
  document.body.appendChild(panel);

  isVisible = true;
  initViewportListener();
  updateFab();
  loadPreview();
}

function hidePanel() {
  if (panel) { panel.remove(); panel=null; iframe=null; }
  isVisible=false; isFs=false; consoleVisible=false;
  destroyViewportListener();
  updateFab();
}

function togglePanel() {
  isVisible && panel ? hidePanel() : buildPanel();
}

function createFab() {
  fab = document.createElement('div');
  fab.id='iw-fab';
  fab.style.cssText=`
    position:fixed;top:64px;right:14px;
    width:48px;height:48px;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);
    border-radius:14px;
    display:flex;align-items:center;justify-content:center;
    font-size:22px;font-weight:900;color:#fff;
    z-index:99998;
    box-shadow:0 4px 20px rgba(37,99,235,0.5);
    user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;
  `;
  fab.textContent='W';
  fab.title='Live Preview (Ctrl+Shift+I)';

  let dragging=false,moved=false,offX=0,offY=0,startT=0;
  fab.addEventListener('touchstart',e=>{
    const t=e.touches[0],r=fab.getBoundingClientRect();
    offX=t.clientX-r.left;offY=t.clientY-r.top;
    dragging=true;moved=false;startT=Date.now();
    e.preventDefault();
  },{passive:false});
  document.addEventListener('touchmove',e=>{
    if(!dragging)return;
    const t=e.touches[0];
    const dx=Math.abs(t.clientX-offX-fab.getBoundingClientRect().left);
    const dy=Math.abs(t.clientY-offY-fab.getBoundingClientRect().top);
    if(dx>5||dy>5)moved=true;
    fab.style.left=Math.max(0,Math.min(window.innerWidth-48,t.clientX-offX))+'px';
    fab.style.top=Math.max(0,Math.min(window.innerHeight-48,t.clientY-offY))+'px';
    fab.style.right='auto';fab.style.bottom='auto';
    e.preventDefault();
  },{passive:false});
  document.addEventListener('touchend',()=>{
    if(!dragging)return;
    dragging=false;
    if(!moved||Date.now()-startT<200)togglePanel();
  });
  document.body.appendChild(fab);
}

function updateFab() {
  if(!fab)return;
  fab.style.background=isVisible
    ?'linear-gradient(135deg,#1d4ed8,#1e3a5f)'
    :'linear-gradient(135deg,#2563eb,#1d4ed8)';
}

let _lastW=window.innerWidth,_lastH=window.innerHeight;
function onResize() {
  const w=window.innerWidth,h=window.innerHeight;
  if(w!==_lastW||h!==_lastH){
    _lastW=w;_lastH=h;
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{if(isVisible&&panel&&!isFs)buildPanel();},320);
  }
}

acode.setPluginInit(PLUGIN_ID, () => {
  // Support both CodeMirror and ACE
  try {
    const commands = acode.require('commands');
    if (commands && commands.addCommand) {
      commands.addCommand({
        name:'iw-preview',
        description:'Toggle InstantWeb Live Preview',
        bindKey:{win:'Ctrl-Shift-W',mac:'Ctrl-Shift-W'},
        exec:togglePanel,
      });
    } else {
      editorManager.editor.commands.addCommand({
        name:'iw-preview',
        bindKey:{win:'Ctrl-Shift-W',mac:'Ctrl-Shift-W'},
        exec:togglePanel,
      });
    }
  } catch(e) {
    try {
      editorManager.editor.commands.addCommand({
        name:'iw-preview',
        bindKey:{win:'Ctrl-Shift-W',mac:'Ctrl-Shift-W'},
        exec:togglePanel,
      });
    } catch(e2) {}
  }
  createFab();
  window.addEventListener('orientationchange',onResize);
  window.addEventListener('resize',onResize);
  window.toast&&window.toast('InstantWeb LivePreviewer ready!',2500);
});

acode.setPluginUnmount(PLUGIN_ID, () => {
  hidePanel();
  if(fab) fab.remove();
  window.removeEventListener('orientationchange', onResize);
  window.removeEventListener('resize', onResize);
  try {
    const commands = acode.require('commands');
    if (commands && commands.removeCommand) {
      commands.removeCommand('iw-preview');
    } else {
      editorManager.editor.commands.removeCommand('iw-preview');
    }
  } catch(e) {
    try { editorManager.editor.commands.removeCommand('iw-preview'); } catch(e2) {}
  }
});
