const { getSupabaseConfig, supabaseHeaders } = require("../_supabase");
const { verifyMerchantToken, extractMerchantToken } = require("./_auth-helper");

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
  res.setHeader("Cache-Control", "no-store");

  const token = extractMerchantToken(req);
  const session = verifyMerchantToken(token);
  if (!session) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return res.status(503).json({ error: "database_not_configured" });
  }

  const storeId = session.storeId;
  const method = req.method;

  // =========================================================================
  // GET: Do'kon sozlamalari
  // =========================================================================
  if (method === "GET") {
    try {
      const fullSelect = "id,name,owner_phone,custom_domain,logo_url,theme_color,telegram_chat_id,plan,status,plan_expires_at,hero_title,hero_subtitle,hero_image_url,banner_cta_text,announcement_text,contact_phone,contact_telegram,categories,created_at";
      let storeRes = await fetch(
        new URL(
          `/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=${fullSelect}`,
          url
        ),
        { headers: supabaseHeaders(key) }
      );

      if (!storeRes.ok) {
        storeRes = await fetch(
          new URL(
            `/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=id,name,owner_phone,custom_domain,logo_url,theme_color,telegram_chat_id,plan,status,plan_expires_at,created_at`,
            url
          ),
          { headers: supabaseHeaders(key) }
        );
      }

      if (!storeRes.ok) throw new Error("fetch_settings_failed");
      const rows = await storeRes.json();
      const row = rows[0] || {};
      const store = {
        ...DEFAULT_STOREFRONT,
        ...row,
        contact_phone: row.contact_phone || row.owner_phone || DEFAULT_STOREFRONT.contact_phone,
        categories: Array.isArray(row.categories) && row.categories.length ? row.categories : DEFAULT_STOREFRONT.categories
      };

      return res.status(200).json({ ok: true, store });
    } catch (err) {
      console.error("merchant_settings_get_error", err);
      return res.status(500).json({ error: "failed_to_load_settings" });
    }
  }

  // =========================================================================
  // PATCH: Sozlamalarni yangilash (Brending, Vitrina, Telegram)
  // =========================================================================
  if (method === "PATCH") {
    try {
      const b = req.body || {};
      const patch = { updated_at: new Date().toISOString() };

      if (b.name !== undefined) patch.name = String(b.name).trim().slice(0, 100);
      if (b.theme_color && /^#[0-9a-f]{6}$/i.test(b.theme_color)) patch.theme_color = b.theme_color;
      if (b.telegram_chat_id !== undefined) patch.telegram_chat_id = String(b.telegram_chat_id).trim();
      if (b.custom_domain !== undefined) patch.custom_domain = String(b.custom_domain).trim().slice(0, 120) || null;
      if (b.logo_url !== undefined) patch.logo_url = String(b.logo_url).trim().slice(0, 500);

      if (b.hero_title !== undefined) patch.hero_title = String(b.hero_title).trim().slice(0, 200);
      if (b.hero_subtitle !== undefined) patch.hero_subtitle = String(b.hero_subtitle).trim().slice(0, 500);
      if (b.hero_image_url !== undefined) patch.hero_image_url = String(b.hero_image_url).trim().slice(0, 500);
      if (b.banner_cta_text !== undefined) patch.banner_cta_text = String(b.banner_cta_text).trim().slice(0, 60);
      if (b.announcement_text !== undefined) patch.announcement_text = String(b.announcement_text).trim().slice(0, 250);
      if (b.contact_phone !== undefined) patch.contact_phone = String(b.contact_phone).trim().slice(0, 40);
      if (b.contact_telegram !== undefined) patch.contact_telegram = String(b.contact_telegram).trim().slice(0, 100);

      if (Array.isArray(b.categories)) {
        patch.categories = b.categories
          .filter(c => c && typeof c === "object" && c.id)
          .map(c => ({
            id: String(c.id).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32),
            name_uz: String(c.name_uz || c.name || "").trim().slice(0, 50),
            name_ru: String(c.name_ru || c.name_uz || c.name || "").trim().slice(0, 50)
          }))
          .filter(c => c.id && c.name_uz);
      }

      const updateRes = await fetch(new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}`, url), {
        method: "PATCH",
        headers: supabaseHeaders(key, {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }),
        body: JSON.stringify(patch),
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text().catch(() => "");
        console.error("patch_failed_detail", errText);
        throw new Error("update_failed");
      }
      const updatedRows = await updateRes.json();

      return res.status(200).json({ ok: true, store: updatedRows[0] });
    } catch (err) {
      console.error("merchant_settings_patch_error", err);
      return res.status(500).json({ error: "failed_to_update_settings" });
    }
  }

  // =========================================================================
  // POST: Telegram integratsiyasini sinash (Test xabari yuborish)
  // =========================================================================
  if (method === "POST") {
    try {
      const { TELEGRAM_BOT_TOKEN } = process.env;

      // 1. Do'konning telegram_chat_id sini bazadan olish
      const storeRes = await fetch(
        new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=name,telegram_chat_id,telegram_bot_token`, url),
        { headers: supabaseHeaders(key) }
      );
      const rows = await storeRes.json();
      const store = rows && rows[0];

      if (!store || !store.telegram_chat_id) {
        return res.status(400).json({ error: "missing_telegram_chat_id", message: "Telegram Guruh ID kiritilmagan!" });
      }

      const botToken = store.telegram_bot_token || TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(503).json({ error: "telegram_bot_not_configured" });
      }

      const testMsg = [
        `🤖 <b>${store.name} · TELEGRAM BOT INTEGRATSIYASI SINOVI</b>`,
        "",
        "✅ Tabriklaymiz! Guruhingiz SaaS platformasiga muvaffaqiyatli ulandi.",
        "Endi do‘koningizga tushgan har bir yangi buyurtma avtomatik shu yerga yuboriladi.",
        "",
        `🕒 Vaqt: ${new Date().toLocaleString("uz-UZ")}`,
      ].join("\n");

      const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: store.telegram_chat_id,
          text: testMsg,
          parse_mode: "HTML",
        }),
      });

      const tgResult = await sendRes.json().catch(() => null);
      if (!sendRes.ok || !tgResult?.ok) {
        return res.status(400).json({
          error: "telegram_send_failed",
          message: tgResult?.description || "Telegram xabar yuborilmadi. Guruh ID yoki bot admin qilinganini tekshiring.",
        });
      }

      return res.status(200).json({ ok: true, sent: true });
    } catch (err) {
      console.error("test_telegram_error", err);
      return res.status(500).json({ error: "telegram_test_failed" });
    }
  }

  res.setHeader("Allow", "GET, PATCH, POST");
  return res.status(405).json({ error: "method_not_allowed" });
};
