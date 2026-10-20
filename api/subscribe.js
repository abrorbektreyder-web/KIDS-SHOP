const { getSupabaseConfig, supabaseHeaders } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { url: projectUrl, key } = getSupabaseConfig();
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_ID } = process.env;
  if (!projectUrl || !key) return res.status(503).json({ error: "subscription_not_configured" });
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_GROUP_ID) {
    return res.status(503).json({ error: "telegram_not_configured" });
  }

  const phone = String(req.body?.phone || "").replace(/[^+\d]/g, "");
  const digits = phone.replace(/\D/g, "");
  const lang = req.body?.lang === "ru" ? "ru" : "uz";
  if (digits.length < 9 || digits.length > 15) {
    return res.status(400).json({ error: "invalid_phone" });
  }

  try {
    const subscriberUrl = new URL("/rest/v1/subscribers?on_conflict=phone", projectUrl);
    const saved = await fetch(subscriberUrl, {
      method: "POST",
      headers: supabaseHeaders(key, {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify({ phone, language: lang }),
    });
    if (!saved.ok) return res.status(503).json({ error: "subscription_unavailable" });

    const language = lang === "ru" ? "Русский" : "O‘zbekcha";
    const report = [
      "📩 KIDS-SHOP · YANGI KIDS CLUB OBUNACHISI",
      "",
      `📞 ${phone}`,
      `🌐 Til: ${language}`,
      `🕒 ${new Date().toISOString()}`,
    ].join("\n");
    const telegram = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_GROUP_ID, text: report, disable_web_page_preview: true }),
    });
    const telegramResult = await telegram.json().catch(() => null);
    if (!telegram.ok || !telegramResult?.ok) {
      console.error("subscriber_telegram_delivery_failed", telegramResult?.error_code || telegram.status);
      return res.status(502).json({ error: "notification_unavailable" });
    }

    return res.status(201).json({ ok: true });
  } catch {
    return res.status(503).json({ error: "subscription_unavailable" });
  }
};
