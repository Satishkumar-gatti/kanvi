/* Public browser config only. Never put a service_role key here. */
window.KANVI_SUPABASE_CONFIG = {
  url: "https://ysjizuoeflwondqajfqo.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzaml6dW9lZmx3b25kcWFqZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NzgwMTcsImV4cCI6MjEwODQ1NDAxN30.-zG7W_KuF0MDNqk7tjkwCbPRMt5LSdkVEhE0k3YntNQ"
};
(function(){
  const cfg=window.KANVI_SUPABASE_CONFIG;
  const valid=cfg.url.startsWith('https://')&&!cfg.url.includes('YOUR-PROJECT')&&cfg.anonKey&&!cfg.anonKey.includes('YOUR_SUPABASE');
  window.kanviSupabaseReady=false;
  if(!valid){console.warn('Kanvi Supabase is not configured. See SUPABASE_SETUP.md.');return;}
  if(!window.supabase?.createClient){console.error('Supabase JS SDK did not load.');return;}
  window.kanviSupabase=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  window.kanviSupabaseReady=true;
  window.kanviCreateOrder=async function(order){
    if(!window.kanviSupabaseReady)throw new Error('Online ordering backend is not configured yet. Please contact the kitchen directly.');
    const fp=JSON.stringify([order.items,order.phone,order.name,order.area,order.address]);let saved=null;try{saved=JSON.parse(sessionStorage.getItem('kanvi_checkout_idempotency'))}catch{}
    let key=saved&&saved.fp===fp?saved.key:null;
    if(!key){key=crypto.randomUUID();sessionStorage.setItem('kanvi_checkout_idempotency',JSON.stringify({fp,key}))}
    const items=Object.entries(order.items||{}).map(([name,quantity])=>({name,quantity}));
    const {data,error}=await window.kanviSupabase.rpc('create_order_request',{p_idempotency_key:key,p_customer_name:order.name,p_customer_phone:order.phone,p_area:order.area,p_address:order.address,p_items:items});
    if(error)throw error;
    const result=Array.isArray(data)?data[0]:data;
    if(!result?.order_id)throw new Error('The server did not return an order ID.');
    return {id:result.order_id,total:Number(result.total),items:Array.isArray(result.items)?result.items:[],estimatedPrepMinutes:Number(result.estimated_prep_minutes||35),duplicate:Boolean(result.was_duplicate)};
  };
})();
