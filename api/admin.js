const crypto=require("node:crypto");
const b64=value=>Buffer.from(value).toString("base64url");
function tokenFor(secret){const payload=b64(JSON.stringify({exp:Date.now()+8*60*60*1000,scope:"admin"}));const sig=crypto.createHmac("sha256",secret).update(payload).digest("base64url");return `${payload}.${sig}`;}
function validToken(token,secret){try{const [payload,sig]=String(token||"").split(".");if(!payload||!sig)return false;const expected=crypto.createHmac("sha256",secret).update(payload).digest();const actual=Buffer.from(sig,"base64url");if(expected.length!==actual.length||!crypto.timingSafeEqual(expected,actual))return false;const data=JSON.parse(Buffer.from(payload,"base64url").toString());return data.scope==="admin"&&data.exp>Date.now();}catch{return false;}}
function sameSecret(a,b){const x=Buffer.from(String(a||""));const y=Buffer.from(String(b||""));return x.length===y.length&&x.length>0&&crypto.timingSafeEqual(x,y);}
module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"method_not_allowed"});}
  const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,ADMIN_PASSWORD,ADMIN_SESSION_SECRET}=process.env;
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!ADMIN_PASSWORD||!ADMIN_SESSION_SECRET||ADMIN_SESSION_SECRET.length<32)return res.status(503).json({error:"admin_not_configured"});
  const body=req.body||{};const action=String(body.action||"");
  if(action==="login")return sameSecret(body.password,ADMIN_PASSWORD)?res.status(200).json({token:tokenFor(ADMIN_SESSION_SECRET)}):res.status(401).json({error:"login_failed"});
  const bearer=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");if(!validToken(bearer,ADMIN_SESSION_SECRET))return res.status(401).json({error:"session_expired"});
  const base=new URL("/rest/v1/",SUPABASE_URL);const request=async(path,options={})=>{const response=await fetch(new URL(path,base),{...options,headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json",...(options.headers||{})}});const text=await response.text();if(!response.ok)throw new Error("database_request_failed");return text?JSON.parse(text):null;};
  try{
    if(action==="products")return res.status(200).json({products:await request("products?select=*&order=created_at.desc")});
    if(action==="orders")return res.status(200).json({orders:await request("orders?select=*,order_items(*)&order=created_at.desc&limit=100")});
    if(action==="saveProduct"){
      const p=body.product||{};const id=String(p.id||"").toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,64);
      const price=Math.round(Number(p.price));const stock=Math.round(Number(p.stock));
      if(!id||!String(p.name_uz||"").trim()||!String(p.name_ru||"").trim()||!Number.isFinite(price)||price<0||!Number.isFinite(stock)||stock<0)return res.status(400).json({error:"invalid_product"});
      const row={id,name_uz:String(p.name_uz).trim().slice(0,140),name_ru:String(p.name_ru).trim().slice(0,140),category:p.category==="girls"?"girls":"boys",type:String(p.type||"sets").slice(0,32),price,old_price:p.old_price?Math.max(price,Math.round(Number(p.old_price))):null,age:String(p.age||"").slice(0,40),colors:Array.isArray(p.colors)?p.colors.slice(0,8).filter(x=>/^#[0-9a-f]{6}$/i.test(String(x))).map(String):[],image_url:/^\/images\/[A-Za-z0-9._/-]+$/.test(String(p.image_url||""))?String(p.image_url):"/images/look-safari.png",badge:String(p.badge||"").slice(0,32),tagline_uz:String(p.tagline_uz||"").slice(0,180),tagline_ru:String(p.tagline_ru||"").slice(0,180),sizes:Array.isArray(p.sizes)?p.sizes.slice(0,16).map(x=>String(x).slice(0,32)):[],stock,active:p.active!==false,updated_at:new Date().toISOString()};
      const saved=await request("products?on_conflict=id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(row)});return res.status(200).json({product:saved?.[0]||row});
    }
    if(action==="hideProduct"){
      const id=String(body.id||"").replace(/[^a-z0-9-]/gi,"");if(!id)return res.status(400).json({error:"invalid_product"});
      await request(`products?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({active:false,updated_at:new Date().toISOString()})});return res.status(200).json({ok:true});
    }
    if(action==="updateOrder"){
      const id=String(body.id||"");const status=String(body.status||"");if(!/^[0-9a-f-]{36}$/i.test(id)||!["new","confirmed","packing","sent","completed","cancelled"].includes(status))return res.status(400).json({error:"invalid_order_update"});
      await request(`orders?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status})});return res.status(200).json({ok:true});
    }
    return res.status(400).json({error:"unknown_action"});
  }catch(error){console.error("admin_request_failed",error.message);return res.status(503).json({error:"admin_service_unavailable"});}
};
