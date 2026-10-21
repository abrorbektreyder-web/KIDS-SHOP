const { getSupabaseConfig, supabaseHeaders } = require("./_supabase");
const { takeRateLimit, rateLimitResponse } = require("./_rate-limit");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const limit = takeRateLimit(req, "subscribe", 5, 10 * 60 * 1000);
  if (limit.limited) return rateLimitResponse(res, limit.retryAfter);

  const { url: projectUrl, key } = getSupabaseConfig();
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_ID } = process.env;
  if (!projectUrl || !key) return res.status(503).json({ error: "subscription_not_configured" });

  const rawStore = req.body?.storeId || req.body?.store_id || "kids-shop";
  const storeId = String(rawStore).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) || "kids-shop";

  const phone = String(req.body?.phone || "").replace(/[^+\d]/g, "");
  const digits = phone.replace(/\D/g, "");
  const lang = req.body?.lang === "ru" ? "ru" : "uz";
  if (digits.length < 9 || digits.length > 15) {
    return res.status(400).json({ error: "invalid_phone" });
  }

  try {
    // 1. Agar do'kon ma'lumoti mavjud bo'lsa, Telegram bot va guruhini aniqlash
    let targetChatId = TELEGRAM_GROUP_ID;
    let botToken = TELEGRAM_BOT_TOKEN;
    let storeName = "KIDS-SHOP";

    try {
      const storeRes = await fetch(new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=name,telegram_chat_id,telegram_bot_token`, projectUrl), {
        headers: supabaseHeaders(key)
      });
      if (storeRes.ok) {
        const rows = await storeRes.json();
        if (rows && rows.length) {
          if (rows[0].name) storeName = rows[0].name;
          if (rows[0].telegram_chat_id) targetChatId = rows[0].telegram_chat_id;
          if (rows[0].telegram_bot_token) botToken = rows[0].telegram_bot_token;
        }
      }
    } catch {}

    // 2. Obunachini saqlash (store_id bilan)
    let saved = await fetch(new URL("/rest/v1/subscribers?on_conflict=store_id,phone", projectUrl), {
      method: "POST",
      headers: supabaseHeaders(key, {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify({ phone, language: lang, store_id: storeId }),
    });

    // Fallback: Agar baza hali yangilanmagan bo'lsa (faqat phone bo'yicha)
    if (!saved.ok) {
      saved = await fetch(new URL("/rest/v1/subscribers?on_conflict=phone", projectUrl), {
        method: "POST",
        headers: supabaseHeaders(key, {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        }),
        body: JSON.stringify({ phone, language: lang }),
      });
    }

    if (!saved.ok) return res.status(503).json({ error: "subscription_unavailable" });

    // 3. Telegram xabarini yuborish
    if (botToken && targetChatId) {
      const language = lang === "ru" ? "Русский" : "O‘zbekcha";
      const report = [
        `📩 <b>${storeName} · YANGI KLUB OBUNACHISI</b>`,
        "",
        `📞 ${phone}`,
        `🌐 Til: ${language}`,
        `🕒 ${new Date().toISOString()}`,
      ].join("\n");

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: targetChatId, text: report, parse_mode: "HTML", disable_web_page_preview: true }),
        });
      } catch (tgErr) {
        console.error("subscriber_telegram_error", tgErr.message);
      }
    }

    return res.status(201).json({ ok: true, storeId });
  } catch {
    return res.status(503).json({ error: "subscription_unavailable" });
  }
};
