/* Kanvi customer: "My orders" history + live order tracking.
   Loaded after the main script on index.html. Uses globals: MENU, SHOP, cart, saveCart, render, esc. */
(function(){
  const KEY='kanvi_orders',SEEN_KEY='kanvi_alert_seen';
  const STEPS=[['Awaiting kitchen confirmation','Placed'],['Confirmed','Confirmed'],['Preparing','Cooking'],['Ready','Ready'],['Delivered','Delivered']];
  const ACTIVE=s=>s!=='Delivered'&&s!=='Cancelled';
  const HEADLINE={
    'Awaiting kitchen confirmation':'Order placed. Waiting for the kitchen to confirm.',
    'Confirmed':'The kitchen confirmed your order.',
    'Preparing':'Your food is being cooked fresh.',
    'Ready':'Packed and ready. It will reach you shortly.',
    'Delivered':'Delivered. Enjoy your meal!',
    'Cancelled':'This order was cancelled.'
  };
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)?v:[]}catch{return[]}};
  const write=a=>{try{localStorage.setItem(KEY,JSON.stringify(a.slice(-20)))}catch{}};
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const clock=t=>new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  const ago=t=>{const m=Math.max(0,Math.round((Date.now()-new Date(t))/6e4));if(m<1)return'just now';if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<24)return h+' hr ago';return new Date(t).toLocaleDateString([],{day:'numeric',month:'short'})};
  const live=()=>window.kanviSupabaseReady&&window.kanviSupabase;
  const state={open:false,busy:false,err:'',lastSync:0,focus:null,openId:null};

  /* ---------- styles ---------- */
  const st=document.createElement('style');
  st.textContent=`
  #ordersSheet{position:fixed;inset:0;z-index:70;background:#3b2013aa;display:none;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px)}
  #ordersSheet.on{display:flex}
  .os-card{background:var(--rice,#f4f1ee);color:var(--leaf,#3b2013);width:100%;max-width:34rem;max-height:92vh;display:flex;flex-direction:column;border-radius:22px 22px 0 0}
  @media(min-width:640px){#ordersSheet{align-items:center;padding:16px}.os-card{border-radius:22px}}
  .os-head{display:flex;align-items:center;gap:10px;padding:16px 18px 10px}.os-head h3{font:800 22px/1.1 'Bricolage Grotesque',system-ui,sans-serif;flex:1}
  .os-ic{border:1px solid var(--line,#e7e0d8);background:#fff;border-radius:12px;min-width:44px;height:44px;font-weight:700;color:inherit;padding:0 12px}
  .os-body{overflow:auto;padding:4px 18px 18px;display:grid;gap:12px;-webkit-overflow-scrolling:touch}
  .oc{background:#fff;border:1px solid var(--line,#e7e0d8);border-radius:18px;padding:14px}
  .oc.focus{outline:2px solid var(--saf,#e4a23c)}
  .oc-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.oc-top b{font-size:15px}
  .oc-meta{font-size:12px;color:var(--mut,#6c5b4f)}
  .pill{display:inline-block;border-radius:999px;font-size:12px;font-weight:700;padding:3px 10px;background:#efe9e0}
  .pill.s-Awaiting{background:#fdecc8;color:#7a4b00}.pill.s-Confirmed,.pill.s-Preparing{background:#e4efc9;color:#3c4a0d}.pill.s-Ready{background:#d6ecd9;color:#14532d}
  .pill.s-Delivered{background:#e5e7e0;color:#374151}.pill.s-Cancelled{background:#f9d9d3;color:#8a1f0e}
  .oc-items{font-size:14px;margin:10px 0 2px}
  .oc-head{font-weight:700;font-size:15px;margin:12px 0 2px}
  .stp5{list-style:none;display:grid;grid-template-columns:repeat(5,1fr);gap:0;margin:12px 0 4px;padding:0}
  .stp5 li{position:relative;text-align:center;font-size:11px;color:var(--mut,#6c5b4f);padding-top:22px;line-height:1.2}
  .stp5 li::before{content:"";position:absolute;top:5px;left:50%;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:#e1d9cf;z-index:1}
  .stp5 li::after{content:"";position:absolute;top:11px;left:-50%;width:100%;height:3px;background:#e1d9cf}
  .stp5 li:first-child::after{display:none}
  .stp5 li.done::before,.stp5 li.done::after,.stp5 li.now::before,.stp5 li.now::after{background:var(--olive,#76882a)}
  .stp5 li.now{color:var(--leaf,#3b2013);font-weight:700}
  .stp5 li.now::before{box-shadow:0 0 0 5px #76882a33}
  .stp5 li small{display:block;font-weight:500;opacity:.8}
  @media(prefers-reduced-motion:no-preference){.stp5 li.now::before{animation:op 1.6s ease-in-out infinite}@keyframes op{50%{box-shadow:0 0 0 8px #76882a14}}}
  .oc-eta{font-size:13px;margin:6px 0 0}
  .oc-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .oc-act a,.oc-act button{border:1px solid var(--line,#e7e0d8);background:#fff;border-radius:12px;font-weight:700;font-size:13px;padding:10px 14px;min-height:44px;color:inherit;text-decoration:none;display:inline-flex;align-items:center}
  .oc-act .pri{background:var(--saf,#e4a23c);border-color:var(--saf,#e4a23c);color:#1a1200}
  .os-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;color:var(--mut,#6c5b4f);padding-top:4px}
  .os-foot button{background:none;border:0;text-decoration:underline;color:inherit;font-size:12px;min-height:36px;padding:0 6px}
  .os-note{font-size:12px;background:#fdecc8;color:#7a4b00;border-radius:12px;padding:8px 12px}
  .os-empty{text-align:center;background:#fff;border:1px dashed #d8cdbf;border-radius:18px;padding:28px 16px}
  .os-empty b{display:block;font-size:16px;margin-bottom:4px}.os-empty p{font-size:13px;color:var(--mut,#6c5b4f);margin-bottom:14px}
  [data-ob]{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#b8341d;color:#fff;font:700 11px/18px system-ui;text-align:center;padding:0 5px;font-style:normal}
  [data-ob][hidden]{display:none}
  #tabs button.ordtab{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.68rem;font-weight:600;color:var(--mut,#6c5b4f);padding:.3rem .5rem;background:none;border:0;position:relative}
  .ordtab span.w{position:relative;display:inline-block}`;
  document.head.appendChild(st);

  /* ---------- sheet shell ---------- */
  const sheet=document.createElement('div');sheet.id='ordersSheet';
  sheet.innerHTML=`<div class="os-card" role="dialog" aria-modal="true" aria-labelledby="osT"><div class="os-head"><h3 id="osT">My orders</h3><button class="os-ic" id="osRef" aria-label="Refresh order status">Refresh</button><button class="os-ic" id="osX" aria-label="Close">✕</button></div><div class="os-body" id="osBody" aria-live="polite"></div></div>`;
  document.body.appendChild(sheet);
  let lastFocus=null;
  sheet.addEventListener('click',e=>{if(e.target===sheet)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.open)close()});
  sheet.querySelector('#osX').onclick=()=>close();
  sheet.querySelector('#osRef').onclick=()=>sync(true);

  /* ---------- data ---------- */
  function itemsOf(o){
    if(Array.isArray(o.serverItems)&&o.serverItems.length)return o.serverItems.map(x=>({name:x.name,qty:Number(x.quantity)||1}));
    return Object.entries(o.items||{}).map(([name,qty])=>({name,qty:Number(qty)||1}));
  }
  const activeCount=()=>read().filter(o=>ACTIVE(o.status)).length;
  function badge(){
    const n=activeCount();
    document.querySelectorAll('[data-ob]').forEach(b=>{b.textContent=n;b.hidden=!n});
  }

  async function sync(manual){
    const list=read().filter(o=>/^KNV-/.test(o.id||'')).slice(-10);
    if(!list.length){state.err='';draw();return}
    if(!live()){state.err=manual?'Live tracking needs the online ordering service.':'';draw();return}
    if(!navigator.onLine){state.err='You are offline. Showing the last known status.';draw();return}
    state.busy=true;if(state.open)draw();
    try{
      const {data,error}=await window.kanviSupabase.rpc('track_orders',{p_orders:list.map(o=>({code:o.id,phone:o.phone}))});
      if(error)throw error;
      const all=read();const changed=[];
      for(const r of data||[]){
        const o=all.find(x=>x.id===r.order_code);if(!o)continue;
        if(o.status!==r.status)changed.push({id:o.id,from:o.status,to:r.status});
        Object.assign(o,{status:r.status,total:Number(r.total),estimatedPrepMinutes:Number(r.estimated_prep_minutes),serverItems:r.items,timeline:r.timeline,createdAt:r.created_at,updatedAt:r.updated_at});
      }
      write(all);state.err='';state.lastSync=Date.now();
      changed.forEach(announce);
    }catch(e){
      state.err=/track_orders/.test(e.message||'')?'Live tracking is not switched on yet (the kitchen needs to update the database). Showing the last known status.':'Could not refresh right now. Showing the last known status.';
    }finally{state.busy=false;badge();draw()}
  }

  function announce(c){
    const key=c.id+':'+c.to;let seen={};try{seen=JSON.parse(sessionStorage.getItem(SEEN_KEY))||{}}catch{}
    if(seen[key])return;seen[key]=1;try{sessionStorage.setItem(SEEN_KEY,JSON.stringify(seen))}catch{}
    const text=`Order ${c.id}: ${HEADLINE[c.to]||c.to}`;
    if(navigator.vibrate)navigator.vibrate([120,60,120]);
    if(!state.open&&window.kanviToast)kanviToast(text,6000);
    if('Notification' in window&&Notification.permission==='granted'&&document.visibilityState!=='visible'){
      const opts={body:HEADLINE[c.to]||c.to,icon:'icons/icon-192.png',tag:c.id,data:{url:'./index.html?view=orders'}};
      if(navigator.serviceWorker&&navigator.serviceWorker.ready)navigator.serviceWorker.ready.then(r=>r.showNotification('Kanvi order update',opts)).catch(()=>{});
      else try{new Notification('Kanvi order update',opts)}catch{}
    }
  }

  /* ---------- drawing ---------- */
  function stepper(o){
    const idx=STEPS.findIndex(s=>s[0]===o.status);
    const times={};(o.timeline||[]).forEach(t=>{if(!times[t.status])times[t.status]=t.at});
    return `<ol class="stp5" aria-label="Order progress">`+STEPS.map(([k,label],i)=>`<li class="${i<idx?'done':i===idx?'now':''}" ${i===idx?'aria-current="step"':''}>${label}${times[k]?`<small>${clock(times[k])}</small>`:''}</li>`).join('')+`</ol>`;
  }
  function eta(o){
    if(o.status==='Cancelled')return `<p class="oc-eta">Questions? Message the kitchen and we will help.</p>`;
    if(o.status==='Delivered')return `<p class="oc-eta">Delivered${o.updatedAt?' at '+clock(o.updatedAt):''}.</p>`;
    const p=Number(o.estimatedPrepMinutes)||35,t=new Date(o.createdAt).getTime();
    const a=t+p*6e4,b=t+(p+10)*6e4;
    if(Date.now()>b+10*6e4)return `<p class="oc-eta">Taking longer than expected. Message the kitchen for an update.</p>`;
    return `<p class="oc-eta">Estimated ready between <b>${clock(a)}</b> and <b>${clock(b)}</b>.</p>`;
  }
  function card(o,full){
    const items=itemsOf(o),sum=items.map(i=>`${i.qty} × ${E(i.name)}`).join(', ');
    const key=(o.status||'').split(' ')[0];
    const waText=encodeURIComponent(`Hi ${SHOP.name}, about my order ${o.id} (${o.status}).`);
    const tel=String(SHOP.phone||'').replace(/\D/g,'');
    const local=/^LOCAL-/.test(o.id||'');
    return `<article class="oc ${state.focus===o.id?'focus':''}" data-code="${E(o.id)}"><div class="oc-top"><div><b>${E(o.id)}</b><div class="oc-meta">${ago(o.createdAt)} · ${money(o.total)}</div></div><span class="pill s-${E(key)}">${E(o.status==='Awaiting kitchen confirmation'?'Waiting':o.status)}</span></div>
<p class="oc-items">${sum}</p>
${local?`<p class="oc-eta">Live tracking is not available for this order. Message the kitchen for its status.</p>`:`<p class="oc-head">${E(HEADLINE[o.status]||o.status)}</p>${o.status==='Cancelled'?'':stepper(o)}${eta(o)}`}
<div class="oc-act"><button class="pri" data-re="${E(o.id)}">Order again</button><a href="https://wa.me/${E(SHOP.phone)}?text=${waText}" target="_blank" rel="noopener">Message kitchen</a>${tel?`<a href="tel:+${E(tel)}">Call</a>`:''}</div></article>`;
  }
  function draw(){
    const body=sheet.querySelector('#osBody');if(!body)return;
    const list=read().slice().reverse();
    sheet.querySelector('#osRef').textContent=state.busy?'Updating…':'Refresh';
    let h='';
    if(state.err)h+=`<div class="os-note" role="status">${E(state.err)}</div>`;
    if(!list.length)h+=`<div class="os-empty"><b>No orders on this phone yet</b><p>Orders you place here show up with live status, so you can track them or order again in one tap.</p><button class="btn" onclick="kanviOrders.close();document.getElementById('menu').scrollIntoView({behavior:'smooth'})">Browse the menu</button></div>`;
    else h+=list.slice(0,10).map(o=>card(o)).join('');
    h+=`<div class="os-foot"><span>${state.lastSync?'Updated '+clock(state.lastSync)+'. ':''}Status refreshes about every 20 seconds while this is open.</span>${'Notification' in window&&Notification.permission==='default'?`<button id="osNote">Turn on order alerts</button>`:''}${list.length?`<button id="osClr">Clear history on this phone</button>`:''}</div>`;
    body.innerHTML=h;
    const n=body.querySelector('#osNote');if(n)n.onclick=async()=>{try{await Notification.requestPermission()}catch{}draw()};
    const c=body.querySelector('#osClr');if(c)c.onclick=()=>{if(confirm('Remove your order history from this phone? The kitchen keeps its own records.')){write([]);state.focus=null;badge();draw()}};
  }
  sheet.addEventListener('click',e=>{const b=e.target.closest('[data-re]');if(b)reorder(b.dataset.re)});

  function reorder(id){
    const o=read().find(x=>x.id===id);if(!o)return;
    const added=[],skipped=[];
    itemsOf(o).forEach(({name,qty})=>{
      const d=MENU.find(m=>m.name===name);
      if(!d||d.soldOut){skipped.push(name);return}
      cart[name]=Math.min(20,(cart[name]||0)+qty);added.push(name);
    });
    saveCart();render();
    close();
    if(window.kanviToast)kanviToast(added.length?`Added ${added.length} dish${added.length>1?'es':''} to your cart${skipped.length?'. Not available now: '+skipped.join(', '):'.'}`:'Those dishes are not available right now.',5000);
  }

  /* ---------- open / close ---------- */
  function open(focusId){
    lastFocus=document.activeElement;state.open=true;state.focus=focusId||null;
    sheet.classList.add('on');document.body.style.overflow='hidden';draw();sync(false);
    setTimeout(()=>sheet.querySelector('#osX').focus(),30);
    if(state.focus)setTimeout(()=>{const el=sheet.querySelector('[data-code="'+CSS.escape(state.focus)+'"]');el&&el.scrollIntoView({block:'nearest'})},80);
  }
  function close(){state.open=false;sheet.classList.remove('on');document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()}

  /* ---------- background refresh ---------- */
  setInterval(()=>{if(document.visibilityState!=='visible')return;const act=activeCount();if(!act)return;if(state.open||Date.now()-state.lastSync>60000)sync(false)},20000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&activeCount())sync(false)});
  addEventListener('storage',e=>{if(e.key===KEY){badge();if(state.open)draw()}});

  window.kanviOrders={open,close,sync};
  window.openOrders=open;
  window.kanviOrderPlaced=id=>{badge();setTimeout(()=>open(id),500)};

  /* ---------- bottom tab + top button ---------- */
  function wire(){
    const tabs=document.getElementById('tabs');
    if(tabs&&!tabs.querySelector('.ordtab')){
      const old=[...tabs.querySelectorAll('a')].find(a=>/#offers/.test(a.getAttribute('href')||''));
      const b=document.createElement('button');b.className='ordtab';b.type='button';b.setAttribute('aria-label','My orders');
      b.innerHTML='<span class="w"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2z"/><path d="M9 8h6M9 12h6"/></svg><em data-ob hidden>0</em></span>Orders';
      b.onclick=()=>open();
      if(old)old.replaceWith(b);else tabs.appendChild(b);
    }
    const nav=document.querySelector('nav .glass');
    if(nav&&!document.getElementById('ordTop')){
      const t=document.createElement('button');t.id='ordTop';t.type='button';t.className='hidden md:inline-flex btn !py-2 !px-4 text-sm';t.style.cssText='background:#fff;border:1px solid var(--line,#e7e0d8);position:relative';
      t.innerHTML='My orders <em data-ob hidden>0</em>';t.onclick=()=>open();
      const orderBtn=[...nav.querySelectorAll('a.btn')].pop();if(orderBtn)nav.insertBefore(t,orderBtn);else nav.appendChild(t);
      const links=nav.querySelector('.md\\:flex');if(links&&!links.querySelector('[href="#offers"]')){const a=document.createElement('a');a.href='#offers';a.textContent='Offers';links.insertBefore(a,links.firstChild)}
    }
    badge();
  }
  wire();
  const q=new URLSearchParams(location.search);
  if(q.get('view')==='orders')setTimeout(()=>open(),400);
  if(activeCount())setTimeout(()=>sync(false),1500);
})();
