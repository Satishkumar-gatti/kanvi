/* Kanvi PWA helper: registers the service worker, shows an Install button, and small toasts. Safe to load on any page. */
(function(){
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const css=document.createElement('style');
  css.textContent='.kpwa{position:fixed;left:50%;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:10px;background:#3b2013;color:#fff;border-radius:16px;padding:10px 12px 10px 16px;font:600 14px system-ui,sans-serif;box-shadow:0 12px 32px #0006;max-width:92vw}'+
  '.kpwa button{border:0;border-radius:10px;padding:8px 14px;font:700 14px system-ui,sans-serif;cursor:pointer}.kpwa .go{background:#e4a23c;color:#1a1200}.kpwa .x{background:transparent;color:#fff;opacity:.7;padding:8px}'+
  '.kpwa:focus-within{outline:3px solid #e4a23c}@media (prefers-reduced-motion:no-preference){.kpwa{animation:kup .25s ease-out}@keyframes kup{from{opacity:0;transform:translate(-50%,10px)}}}';
  document.head.appendChild(css);
  let box=null;
  function show(html,actions,bottom,timeout){
    hide();box=document.createElement('div');box.className='kpwa';box.setAttribute('role','status');box.style.bottom=(bottom||96)+'px';
    const t=document.createElement('span');t.textContent=html;box.appendChild(t);
    (actions||[]).forEach(a=>{const b=document.createElement('button');b.textContent=a[0];b.className=a[2]||'go';b.onclick=()=>{a[1]();};box.appendChild(b)});
    document.body.appendChild(box);if(timeout)setTimeout(()=>{if(box&&box.firstChild&&box.firstChild.textContent===html)hide()},timeout);
  }
  function hide(){if(box){box.remove();box=null}}
  window.kanviToast=(text,ms)=>show(text,[],96,ms||4000);

  // Service worker
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    addEventListener('load',()=>navigator.serviceWorker.register('sw.js').then(reg=>{
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;
        w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)
          show('A new version is ready.',[['Refresh',()=>location.reload()],['Later',hide,'x']],96)})});
    }).catch(e=>console.warn('Service worker failed',e)));
  }

  // Install prompt
  const DISMISS='kanvi_pwa_dismissed',DAYS=7*864e5;let deferred=null;
  const recentlyDismissed=()=>{try{return Date.now()-Number(localStorage.getItem(DISMISS)||0)<DAYS}catch{return false}};
  const dismiss=()=>{try{localStorage.setItem(DISMISS,String(Date.now()))}catch{}hide()};
  const label=()=>/admin/i.test(location.pathname)?'Install Kanvi Admin on this phone':'Install Kanvi for faster ordering';
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(!standalone()&&!recentlyDismissed())setTimeout(()=>show(label(),[['Install',window.kanviInstall],['Not now',dismiss,'x']],96),4000)});
  addEventListener('appinstalled',()=>{deferred=null;hide();kanviToast('Installed. Open Kanvi from your home screen.')});
  window.kanviInstall=async()=>{
    if(deferred){hide();deferred.prompt();try{await deferred.userChoice}catch{}deferred=null;return}
    const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
    show(ios?'On iPhone: tap Share, then Add to Home Screen.':'Open your browser menu and choose Install app / Add to Home screen.',[['OK',hide]],96);
  };
  window.kanviCanInstall=()=>!standalone();
  // iPhone has no install event: show a one-time hint.
  if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!standalone()&&!recentlyDismissed())
    setTimeout(()=>show('Install: tap Share, then Add to Home Screen.',[['Got it',dismiss]],96),9000);
})();
