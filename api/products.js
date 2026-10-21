const demo = [
  ["look-safari","Safari mini ko‘ylak","Комплект Safari mini","boys","sets",219000,259000,"3–8 yosh",["#d5a76e","#819267","#e9e2d2"],"/images/product-baby-winter.webp","HIT","Yengil paxta • kundalik qulaylik","Лёгкий хлопок • комфорт на каждый день",["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"]],
  ["little-adventure","Adventure kundalik set","Повседневный комплект Adventure","boys","sets",289000,null,"2–6 yosh",["#2165d5","#f2d333","#f1ead9"],"/images/product-adventure-boy.webp","YANGI","O‘yin va sarguzasht uchun","Для игр и приключений",["2–3 yosh","3–4 yosh","5–6 yosh"]],
  ["sunshine-dress","Sunshine yozgi libos","Летнее платье Sunshine","girls","sets",249000,299000,"3–9 yosh",["#edd276","#efb7ae","#d9e6c2"],"/images/product-lilac-girl.webp","−17%","Yumshoq mato • bayramona kayfiyat","Мягкая ткань • праздничное настроение",["3–4 yosh","5–6 yosh","7–8 yosh","9–10 yosh"]],
  ["little-star-shirt","Little Star ko‘ylak","Рубашка Little Star","boys","tops",179000,null,"2–8 yosh",["#fffefa","#89a071","#c7dcf2"],"/images/product-streetwear-boy.webp","HIT","Nafas oluvchi paxta • qulay bichim","Дышащий хлопок • удобный крой",["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"]],
  ["mini-explorer-set","Mini Explorer to‘plami","Комплект Mini Explorer","boys","sets",329000,null,"4–10 yosh",["#2361d7","#e9dec6"],"/images/product-autumn-boy.webp","YANGI","Yengil qatlamlar • har kungi uslub","Лёгкие слои • стиль на каждый день",["3–4 yosh","5–6 yosh","7–8 yosh","9–10 yosh"]],
  ["flower-day-dress","Flower Day ko‘ylagi","Платье Flower Day","girls","tops",229000,null,"3–8 yosh",["#f3d9d5","#fffefa","#a2b37b"],"/images/product-floral-girl.webp","YANGI","Muloyim ranglar • erkin harakat","Нежные цвета • свобода движений",["3–4 yosh","5–6 yosh","7–8 yosh"]],
  ["sunny-day-set","Sunny Day qulay set","Комплект Sunny Day","boys","sets",269000,319000,"2–7 yosh",["#f3d34d","#2c61d6","#ede9df"],"/images/product-mustard-vest.webp","−16%","Yumshoq paxta • faol bolalar uchun","Мягкий хлопок • для активных детей",["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"]],
  ["weekend-dress","Weekend mini libos","Платье Weekend mini","girls","tops",199000,null,"2–7 yosh",["#aabd84","#e2c9a0","#eeb7a5"],"/images/product-green-girl.webp","HIT","Har bir kun — kichik bayram","Каждый день — маленький праздник",["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"]]
].map(([id,uz,ru,category,type,price,oldPrice,age,colors,image,badge,uzTag,ruTag,sizes])=>({id,name:{uz,ru},category,type,price,oldPrice,age,colors,image,badge,tagline:{uz:uzTag,ru:ruTag},sizes,stock:10}));

const { getSupabaseConfig, supabaseHeaders } = require("./_supabase");

const DEFAULT_STOREFRONT = {
  hero_title: "Kichik qadamlar,\nkatta sarguzashtlar.",
  hero_subtitle: "Har kun uchun qulay, bolalik uchun esa unutilmas kiyimlar. Kichkintoyingiz erkin harakat qilsin, uslubi esa o‘ziga xos bo‘lsin.",
  hero_image_url: "/images/look-safari.webp",
  banner_cta_text: "Xaridni boshlash",
  announcement_text: "Yangi kolleksiya — 2026",
  contact_phone: "+998900000000",
  contact_telegram: "",
  categories: [
    { id: "all", name_uz: "Barchasi", name_ru: "Все" },
    { id: "boys", name_uz: "O‘g‘il bolalar", name_ru: "Для мальчиков" },
    { id: "girls", name_uz: "Qiz bolalar", name_ru: "Для девочек" },
    { id: "sets", name_uz: "To‘plamlar", name_ru: "Комплекты" }
  ]
};

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Multi-tenant resolution: ?store=slug OR custom domain / subdomain from host header
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").toLowerCase().split(":")[0];
  let rawStore = req.query.store || req.query.store_id || "";
  
  if (!rawStore && host && !["localhost", "127.0.0.1"].includes(host) && !host.endsWith(".vercel.app")) {
    const parts = host.split(".");
    if (parts.length >= 3 && parts[0] !== "www") {
      rawStore = parts[0];
    }
  }
  const storeId = String(rawStore || "kids-shop").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) || "kids-shop";

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return res.status(200).json({
      store: { id: "kids-shop", name: "KIDS-SHOP", logo_url: "/images/look-safari.webp", theme_color: "#285ae8", status: "active", plan: "pro", ...DEFAULT_STOREFRONT },
      products: demo,
      source: "demo"
    });
  }

  try {
    // 1. Do'kon sozlamalari va holatini tekshirish
    let storeInfo = {
      id: storeId,
      name: storeId === "kids-shop" ? "KIDS-SHOP" : storeId,
      status: "active",
      logo_url: "/images/look-safari.webp",
      theme_color: "#285ae8",
      ...DEFAULT_STOREFRONT
    };

    try {
      const selectFields = "id,name,logo_url,theme_color,status,plan,hero_title,hero_subtitle,hero_image_url,banner_cta_text,announcement_text,contact_phone,contact_telegram,categories";
      let storeRes = await fetch(new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=${selectFields}`, url), {
        headers: supabaseHeaders(key),
      });

      // Agar yangi ustunlar hali migratsiya qilinmagan bo'lsa, asosiy ustunlar bilan qayta so'rash
      if (!storeRes.ok) {
        storeRes = await fetch(new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=id,name,logo_url,theme_color,status,plan`, url), {
          headers: supabaseHeaders(key),
        });
      }

      if (storeRes.ok) {
        const storeRows = await storeRes.json();
        if (storeRows && storeRows.length) {
          const row = storeRows[0];
          const isKids = row.id === "kids-shop";
          storeInfo = {
            ...storeInfo,
            ...row,
            hero_title: row.hero_title || (isKids ? DEFAULT_STOREFRONT.hero_title : `${row.name}\nOnlayn Do‘koni`),
            hero_subtitle: row.hero_subtitle || (isKids ? DEFAULT_STOREFRONT.hero_subtitle : "Sifatli mahsulotlar va tezkor yetkazib berish xizmati. Bizning do‘kondan qulay xarid qiling!"),
            hero_image_url: row.hero_image_url || DEFAULT_STOREFRONT.hero_image_url,
            banner_cta_text: row.banner_cta_text || (isKids ? DEFAULT_STOREFRONT.banner_cta_text : "Xarid qilish"),
            announcement_text: row.announcement_text || (isKids ? DEFAULT_STOREFRONT.announcement_text : `${row.name} onlayn do‘koniga xush kelibsiz!`),
            contact_phone: row.contact_phone || (isKids ? DEFAULT_STOREFRONT.contact_phone : ""),
            contact_telegram: row.contact_telegram || (isKids ? DEFAULT_STOREFRONT.contact_telegram : ""),
            categories: Array.isArray(row.categories) && row.categories.length ? row.categories : DEFAULT_STOREFRONT.categories
          };
          if (storeInfo.status !== "active") {
            return res.status(403).json({ error: "store_suspended", store: storeInfo });
          }
        }
      }
    } catch {}

    // 2. Ushbu do'kon tovarlarini yuklash (store_id bo'yicha)
    let endpoint = new URL(`/rest/v1/products?store_id=eq.${encodeURIComponent(storeId)}&active=eq.true&select=*&order=created_at.desc`, url);
    let result = await fetch(endpoint, { headers: supabaseHeaders(key) });

    // Agar do'kon hali migratsiyadan o'tmagan bo'lsa (default fallback)
    if (!result.ok && storeId === "kids-shop") {
      endpoint = new URL("/rest/v1/products?active=eq.true&select=*&order=created_at.desc", url);
      result = await fetch(endpoint, { headers: supabaseHeaders(key) });
    }

    if (!result.ok) throw new Error("catalog_unavailable");
    const rows = await result.json();

    const imageCounts = new Map();
    for (const product of rows) imageCounts.set(product.image_url, (imageCounts.get(product.image_url) || 0) + 1);
    const demoById = new Map(demo.map(product => [product.id, product]));
    const products = rows.map(p => ({
      id: p.id,
      storeId: p.store_id || storeId,
      name: { uz: p.name_uz, ru: p.name_ru },
      category: p.category,
      type: p.type,
      price: p.price,
      oldPrice: p.old_price,
      age: p.age,
      colors: p.colors || [],
      image: imageCounts.get(p.image_url) > 1 ? (demoById.get(p.id)?.image || p.image_url) : p.image_url,
      badge: p.badge,
      tagline: { uz: p.tagline_uz, ru: p.tagline_ru },
      sizes: p.sizes || [],
      stock: p.stock
    }));

    return res.status(200).json({ store: storeInfo, products, source: "database" });
  } catch {
    return res.status(503).json({ error: "catalog_temporarily_unavailable" });
  }
};
