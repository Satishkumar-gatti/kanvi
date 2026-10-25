/* Kanvi service worker. Bump VERSION when you change the precache list. */
const VERSION='kanvi-v8';
const SHELL=['./','index.html','admin.html','offline.html','theme.css','menu.js','supabase-client.js','pwa.js','orders.js',
  'manifest.webmanifest','admin.webmanifest','assets/pot-biryani.jpg','assets/starter.svg','assets/biryani.svg','assets/curry.svg','assets/rice.svg',
  'icons/icon-192.png','icons/admin-192.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

const isCode=u=>/\.(?:html|js|css|webmanifest)$/.test(u.pathname)||u.pathname.endsWith('/');
function networkFirst(req,ms){
  return new Promise(resolve=>{
    let done=false;const fallback=()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('offline.html'));
    const timer=setTimeout(()=>{if(!done)fallback().then(r=>{if(r&&!done){done=true;resolve(r)}})},ms);
    fetch(req).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy))}
      if(!done){done=true;clearTimeout(timer);resolve(res)}
    }).catch(()=>{if(!done){done=true;clearTimeout(timer);fallback().then(resolve)}});
  });
}
function staleWhileRevalidate(req){
  return caches.open(VERSION).then(c=>c.match(req).then(hit=>{
    const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(req,res.clone());return res}).catch(()=>hit);
    return hit||net;
  }));
}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Never cache live data: Supabase API/auth/realtime and analytics. Dish photos in public Storage are fine to cache.
  if(url.hostname.endsWith('.supabase.co')&&!url.pathname.startsWith('/storage/v1/object/public/'))return;
  if(/googletagmanager|google-analytics/.test(url.hostname))return;
  if(req.mode==='navigate'){e.respondWith(networkFirst(req,4000));return}
  if(url.origin===location.origin&&isCode(url)){e.respondWith(networkFirst(req,4000));return}
  e.respondWith(staleWhileRevalidate(req));
});

// Tapping a notification focuses the app (or opens it).
self.addEventListener('notificationclick',e=>{
  e.notification.close();const target=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs){if('focus' in c)return c.focus()}
    return self.clients.openWindow(target);
  }));
});
