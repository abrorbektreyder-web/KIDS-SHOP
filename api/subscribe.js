module.exports=async function handler(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"method_not_allowed"});}
  const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:"subscription_not_configured"});
  const phone=String(req.body?.phone||"").replace(/[^+\d]/g,"");const lang=req.body?.lang==="ru"?"ru":"uz";
  if(phone.replace(/\D/g,"").length<9||phone.replace(/\D/g,"").length>15)return res.status(400).json({error:"invalid_phone"});
  try{const url=new URL("/rest/v1/subscribers?on_conflict=phone",SUPABASE_URL);const r=await fetch(url,{method:"POST",headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({phone,language:lang})});if(!r.ok)throw new Error("store_failed");return res.status(201).json({ok:true});}
  catch{return res.status(503).json({error:"subscription_unavailable"});}
};
