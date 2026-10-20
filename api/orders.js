const crypto=require("node:crypto");
const {getSupabaseConfig,supabaseHeaders}=require("./_supabase");
const {takeRateLimit,rateLimitResponse}=require("./_rate-limit");
const escapeHtml=(value)=>String(value||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function verifyTelegramInitData(initData,botToken){
  if(!initData)return false;
  const params=new URLSearchParams(initData);const hash=params.get("hash");if(!hash)return false;params.delete("hash");
  const dataCheck=[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join("\n");
  const secret=crypto.createHmac("sha256","WebAppData").update(botToken).digest();
  const expected=crypto.createHmac("sha256",secret).update(dataCheck).digest();
  let given;try{given=Buffer.from(hash,"hex");}catch{return false;}
  if(given.length!==expected.length||!crypto.timingSafeEqual(given,expected))return false;
  const authDate=Number(params.get("auth_date"));const age=Date.now()/1000-authDate;return Number.isFinite(authDate)&&age>=-60&&age<86400;
}
module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"method_not_allowed"});}
  const limit=takeRateLimit(req,"orders",5,10*60*1000);if(limit.limited)return rateLimitResponse(res,limit.retryAfter);
  const {url,key}=getSupabaseConfig();
  const {TELEGRAM_BOT_TOKEN,TELEGRAM_GROUP_ID,ORDERS_ENABLED}=process.env;
  if(ORDERS_ENABLED!=="true")return res.status(503).json({error:"orders_not_open"});
  if(!url||!key)return res.status(503).json({error:"database_not_configured"});
  if(!TELEGRAM_BOT_TOKEN||!TELEGRAM_GROUP_ID)return res.status(503).json({error:"telegram_not_configured"});
  const body=req.body||{};const c=body.customer||{};const items=Array.isArray(body.items)?body.items:[];
  const phone=String(c.phone||"").replace(/[^+\d]/g,"");
  if(String(c.name||"").trim().length<2||String(c.name||"").length>120||phone.replace(/\D/g,"").length<9||phone.replace(/\D/g,"").length>15||String(c.address||"").trim().length<5||String(c.address||"").length>500||!String(c.region||"").trim()||String(c.region).length>100||!String(c.district||"").trim()||String(c.district).length>100||String(c.comment||"").length>500||!items.length||items.length>20)return res.status(400).json({error:"invalid_order"});
  if(body.telegramInitData&&!verifyTelegramInitData(body.telegramInitData,TELEGRAM_BOT_TOKEN))return res.status(401).json({error:"invalid_telegram_session"});
  if(items.some(item=>!item||typeof item!=="object"||!String(item.productId||"").trim()||String(item.productId).length>80||!String(item.size||"").trim()||String(item.size).length>32||!Number.isInteger(Number(item.qty))||Number(item.qty)<1||Number(item.qty)>20))return res.status(400).json({error:"invalid_order_items"});
  const cleanItems=items.map(item=>({productId:String(item.productId).trim(),size:String(item.size).trim(),qty:Number(item.qty)}));
  const payload={customer:{name:String(c.name).trim().slice(0,120),phone,region:String(c.region).slice(0,100),district:String(c.district).slice(0,100),address:String(c.address).slice(0,500),comment:String(c.comment||"").slice(0,500)},payment:"cod",lang:body.lang==="ru"?"ru":"uz",items:cleanItems};
  try{
    const rpc=await fetch(new URL("/rest/v1/rpc/place_order",url),{method:"POST",headers:supabaseHeaders(key,{"Content-Type":"application/json"}),body:JSON.stringify({order_payload:payload})});
    const result=await rpc.json();if(!rpc.ok)throw new Error(result.message||"order_save_failed");
    const order=Array.isArray(result)?result[0]:result;const orderId=order.order_id||order.id;const total=Number(order.total||0);
    if(!orderId)throw new Error("order_save_failed");
    const tgItems=(order.items||[]).map(i=>`• ${escapeHtml(i.name)} — ${escapeHtml(i.size)} × ${i.qty}: ${Number(i.unitPrice*i.qty||0).toLocaleString("ru-RU")} сум`).join("\n");
    const report=`🧸 <b>KIDS-SHOP · YANGI BUYURTMA</b>\n\n<b>№ ${escapeHtml(String(orderId).slice(0,8).toUpperCase())}</b>\n👤 ${escapeHtml(payload.customer.name)}\n📞 <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>\n📍 ${escapeHtml(payload.customer.region)}, ${escapeHtml(payload.customer.district)}\n🏠 ${escapeHtml(payload.customer.address)}\n💳 ${payload.payment==="cod"?"Yetkazilganda to‘lov":"Karta (operator tasdiqlasin)"}\n\n${tgItems}\n\n<b>Jami: ${total.toLocaleString("ru-RU")} so‘m</b>${payload.customer.comment?`\n\n💬 ${escapeHtml(payload.customer.comment)}`:""}`;
    const send=async chat_id=>{const r=await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id,text:report,parse_mode:"HTML",disable_web_page_preview:true})});const result=await r.json().catch(()=>null);if(!r.ok||!result?.ok)throw new Error("telegram_delivery_failed");};
    const delivery=await Promise.allSettled([send(TELEGRAM_GROUP_ID)]);
    const notified=delivery[0].status==="fulfilled";
    if(!notified)console.error("order_telegram_delivery_failed",String(orderId));
    return res.status(201).json({orderId:String(orderId),total,notified});
  }catch(error){console.error("order_create_failed",error.message);return res.status(error.message==="order_save_failed"?500:400).json({error:"order_could_not_be_completed"});}
};
