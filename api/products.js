const demo = [
  ["look-safari","Safari mini ko‘ylak","Комплект Safari mini","boys","sets",219000,259000,"3–8 yosh",["#d5a76e","#819267","#e9e2d2"],"/images/look-safari.png","HIT","Yengil paxta • kundalik qulaylik","Лёгкий хлопок • комфорт на каждый день",["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"]],
  ["little-adventure","Adventure kundalik set","Повседневный комплект Adventure","boys","sets",289000,null,"2–6 yosh",["#2165d5","#f2d333","#f1ead9"],"/images/look-adventure.png","YANGI","O‘yin va sarguzasht uchun","Для игр и приключений",["2–3 yosh","3–4 yosh","5–6 yosh"]],
  ["sunshine-dress","Sunshine yozgi libos","Летнее платье Sunshine","girls","sets",249000,299000,"3–9 yosh",["#edd276","#efb7ae","#d9e6c2"],"/images/kids-fashion-campaign.png","−17%","Yumshoq mato • bayramona kayfiyat","Мягкая ткань • праздничное настроение",["3–4 yosh","5–6 yosh","7–8 yosh","9–10 yosh"]],
  ["little-star-shirt","Little Star ko‘ylak","Рубашка Little Star","boys","tops",179000,null,"2–8 yosh",["#fffefa","#89a071","#c7dcf2"],"/images/look-safari.png","HIT","Nafas oluvchi paxta • qulay bichim","Дышащий хлопок • удобный крой",["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"]],
  ["mini-explorer-set","Mini Explorer to‘plami","Комплект Mini Explorer","boys","sets",329000,null,"4–10 yosh",["#2361d7","#e9dec6"],"/images/look-adventure.png","YANGI","Yengil qatlamlar • har kungi uslub","Лёгкие слои • стиль на каждый день",["3–4 yosh","5–6 yosh","7–8 yosh","9–10 yosh"]],
  ["flower-day-dress","Flower Day ko‘ylagi","Платье Flower Day","girls","tops",229000,null,"3–8 yosh",["#f3d9d5","#fffefa","#a2b37b"],"/images/kids-fashion-campaign.png","YANGI","Muloyim ranglar • erkin harakat","Нежные цвета • свобода движений",["3–4 yosh","5–6 yosh","7–8 yosh"]],
  ["sunny-day-set","Sunny Day qulay set","Комплект Sunny Day","boys","sets",269000,319000,"2–7 yosh",["#f3d34d","#2c61d6","#ede9df"],"/images/look-adventure.png","−16%","Yumshoq paxta • faol bolalar uchun","Мягкий хлопок • для активных детей",["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"]],
  ["weekend-dress","Weekend mini libos","Платье Weekend mini","girls","tops",199000,null,"2–7 yosh",["#aabd84","#e2c9a0","#eeb7a5"],"/images/kids-fashion-campaign.png","HIT","Har bir kun — kichik bayram","Каждый день — маленький праздник",["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"]]
].map(([id,uz,ru,category,type,price,oldPrice,age,colors,image,badge,uzTag,ruTag,sizes])=>({id,name:{uz,ru},category,type,price,oldPrice,age,colors,image,badge,tagline:{uz:uzTag,ru:ruTag},sizes,stock:10}));

module.exports = async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=300");
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"method_not_allowed"});}
  const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)return res.status(200).json({products:demo,source:"demo"});
  try{
    const url=new URL("/rest/v1/products?active=eq.true&select=*&order=created_at.desc",SUPABASE_URL);
    const result=await fetch(url,{headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`} });
    if(!result.ok)throw new Error("catalog_unavailable");
    const rows=await result.json();
    const products=rows.map(p=>({id:p.id,name:{uz:p.name_uz,ru:p.name_ru},category:p.category,type:p.type,price:p.price,oldPrice:p.old_price,age:p.age,colors:p.colors,image:p.image_url,badge:p.badge,tagline:{uz:p.tagline_uz,ru:p.tagline_ru},sizes:p.sizes,stock:p.stock}));
    return res.status(200).json({products,source:"database"});
  }catch{return res.status(503).json({error:"catalog_temporarily_unavailable"});}
};
