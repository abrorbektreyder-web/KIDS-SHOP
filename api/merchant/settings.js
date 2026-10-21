const { getSupabaseConfig, supabaseHeaders } = require("../_supabase");
const { verifyMerchantToken, extractMerchantToken } = require("./_auth-helper");

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
      const storeRes = await fetch(
        new URL(
          `/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=id,name,owner_phone,custom_domain,logo_url,theme_color,telegram_chat_id,plan,status,plan_expires_at,created_at`,
          url
        ),
        { headers: supabaseHeaders(key) }
      );

      if (!storeRes.ok) throw new Error("fetch_settings_failed");
      const rows = await storeRes.json();
      return res.status(200).json({ ok: true, store: rows[0] });
    } catch (err) {
      console.error("merchant_settings_get_error", err);
      return res.status(500).json({ error: "failed_to_load_settings" });
    }
  }

  // =========================================================================
  // PATCH: Sozlamalarni yangilash
  // =========================================================================
  if (method === "PATCH") {
    try {
      const b = req.body || {};
      const patch = { updated_at: new Date().toISOString() };

      if (b.name) patch.name = String(b.name).trim().slice(0, 100);
      if (b.theme_color && /^#[0-9a-f]{6}$/i.test(b.theme_color)) patch.theme_color = b.theme_color;
      if (b.telegram_chat_id !== undefined) patch.telegram_chat_id = String(b.telegram_chat_id).trim();

      const updateRes = await fetch(new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}`, url), {
        method: "PATCH",
        headers: supabaseHeaders(key, {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }),
        body: JSON.stringify(patch),
      });

      if (!updateRes.ok) throw new Error("update_failed");
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
