const crypto = require("node:crypto");
const { getSupabaseConfig, supabaseHeaders } = require("./_supabase");
const { takeRateLimit, rateLimitResponse } = require("./_rate-limit");
const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function verifyTelegramInitData(initData, botToken) {
  if (!initData) return false;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const dataCheck = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = crypto.createHmac("sha256", secret).update(dataCheck).digest();
  let given;
  try { given = Buffer.from(hash, "hex"); } catch { return false; }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return false;
  const authDate = Number(params.get("auth_date"));
  const age = Date.now() / 1000 - authDate;
  return Number.isFinite(authDate) && age >= -60 && age < 86400;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const limit = takeRateLimit(req, "orders", 5, 10 * 60 * 1000);
  if (limit.limited) return rateLimitResponse(res, limit.retryAfter);

  const { url, key } = getSupabaseConfig();
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_ID, ORDERS_ENABLED } = process.env;

  if (ORDERS_ENABLED !== "true") return res.status(503).json({ error: "orders_not_open" });
  if (!url || !key) return res.status(503).json({ error: "database_not_configured" });

  const body = req.body || {};
  const c = body.customer || {};
  const items = Array.isArray(body.items) ? body.items : [];
  const rawStore = body.storeId || body.store_id || "kids-shop";
  const storeId = String(rawStore).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) || "kids-shop";

  const phone = String(c.phone || "").replace(/[^+\d]/g, "");
  if (
    String(c.name || "").trim().length < 2 || String(c.name || "").length > 120 ||
    phone.replace(/\D/g, "").length < 9 || phone.replace(/\D/g, "").length > 15 ||
    String(c.address || "").trim().length < 5 || String(c.address || "").length > 500 ||
    !String(c.region || "").trim() || String(c.region).length > 100 ||
    !String(c.district || "").trim() || String(c.district).length > 100 ||
    String(c.comment || "").length > 500 ||
    !items.length || items.length > 20
  ) {
    return res.status(400).json({ error: "invalid_order" });
  }

  // Telegram Mini App initData validation
  if (body.telegramInitData && TELEGRAM_BOT_TOKEN && !verifyTelegramInitData(body.telegramInitData, TELEGRAM_BOT_TOKEN)) {
    return res.status(401).json({ error: "invalid_telegram_session" });
  }

  if (
    items.some(
      (item) =>
        !item || typeof item !== "object" ||
        !String(item.productId || "").trim() || String(item.productId).length > 80 ||
        !String(item.size || "").trim() || String(item.size).length > 32 ||
        !Number.isInteger(Number(item.qty)) || Number(item.qty) < 1 || Number(item.qty) > 20
    )
  ) {
    return res.status(400).json({ error: "invalid_order_items" });
  }

  const cleanItems = items.map((item) => ({
    productId: String(item.productId).trim(),
    size: String(item.size).trim(),
    color: String(item.colorName || item.color || "").trim().slice(0, 50),
    qty: Number(item.qty),
  }));

  const payload = {
    storeId,
    customer: {
      name: String(c.name).trim().slice(0, 120),
      phone,
      region: String(c.region).slice(0, 100),
      district: String(c.district).slice(0, 100),
      address: String(c.address).slice(0, 500),
      comment: String(c.comment || "").slice(0, 500),
    },
    payment: "cod",
    lang: body.lang === "ru" ? "ru" : "uz",
    items: cleanItems.map((i) => ({ productId: i.productId, size: i.size, color: i.color, qty: i.qty })),
  };

  try {
    const rpc = await fetch(new URL("/rest/v1/rpc/place_order", url), {
      method: "POST",
      headers: supabaseHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ order_payload: payload }),
    });

    const result = await rpc.json();
    if (!rpc.ok) throw new Error(result.message || "order_save_failed");

    const order = Array.isArray(result) ? result[0] : result;
    const orderId = order.order_id || order.id;
    const total = Number(order.total || 0);
    if (!orderId) throw new Error("order_save_failed");

    // Dynamic Telegram Routing for Multi-Tenancy
    const targetChatId = order.telegram_chat_id || TELEGRAM_GROUP_ID;
    const botToken = order.telegram_bot_token || TELEGRAM_BOT_TOKEN;
    const storeTitle = order.store_name || "KIDS-SHOP";

    const tgItems = (order.items || []).map((i, idx) => {
      const col = cleanItems[idx]?.color ? ` [Rang: ${escapeHtml(cleanItems[idx].color)}]` : "";
      return `• ${escapeHtml(i.name)} — ${escapeHtml(i.size)}${col} × ${i.qty}: ${Number(i.unitPrice * i.qty || 0).toLocaleString("ru-RU")} сум`;
    }).join("\n");

    const report = [
      `🛍 <b>${escapeHtml(storeTitle)} · YANGI BUYURTMA</b>`,
      "",
      `<b>№ ${escapeHtml(String(orderId).slice(0, 8).toUpperCase())}</b>`,
      `👤 ${escapeHtml(payload.customer.name)}`,
      `📞 <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>`,
      `📍 ${escapeHtml(payload.customer.region)}, ${escapeHtml(payload.customer.district)}`,
      `🏠 ${escapeHtml(payload.customer.address)}`,
      `💳 ${payload.payment === "cod" ? "Yetkazilganda to‘lov" : "Karta (operator tasdiqlasin)"}`,
      "",
      tgItems,
      "",
      `<b>Jami: ${total.toLocaleString("ru-RU")} so‘m</b>`,
      payload.customer.comment ? `\n💬 ${escapeHtml(payload.customer.comment)}` : "",
    ].filter(Boolean).join("\n");

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "✅ Qabul qilish", callback_data: `order:confirm:${orderId}` }
        ],
        [
          { text: "🚚 Yetkazildi", callback_data: `order:sent:${orderId}` },
          { text: "❌ Bekor qilish", callback_data: `order:cancel:${orderId}` }
        ]
      ]
    };

    let notified = false;
    if (botToken && targetChatId) {
      try {
        const sendResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: report,
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: inlineKeyboard,
          }),
        });
        const tgResult = await sendResponse.json().catch(() => null);
        notified = Boolean(sendResponse.ok && tgResult?.ok);

        if (notified && tgResult?.result?.message_id) {
          fetch(new URL(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, url), {
            method: "PATCH",
            headers: supabaseHeaders(key, { "Content-Type": "application/json" }),
            body: JSON.stringify({ telegram_message_id: String(tgResult.result.message_id) }),
          }).catch(() => {});
        }
      } catch (tgErr) {
        console.error("order_telegram_delivery_error", tgErr.message);
      }
    }

    if (!notified) {
      console.error("order_telegram_delivery_failed", String(orderId), "targetChatId:", targetChatId);
    }

    return res.status(201).json({ orderId: String(orderId), storeId, total, notified });
  } catch (error) {
    console.error("order_create_failed", error.message);
    return res.status(error.message === "order_save_failed" ? 500 : 400).json({ error: "order_could_not_be_completed" });
  }
};
