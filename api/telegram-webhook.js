const crypto = require("node:crypto");
const { getSupabaseConfig, supabaseHeaders } = require("./_supabase");

const escapeHtml = (val) =>
  String(val || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async function handler(req, res) {
  const { TELEGRAM_BOT_TOKEN } = process.env;
  const { url, key } = getSupabaseConfig();

  // =========================================================================
  // 1. GET: Webhook holati, tekshirish yoki ro'yxatdan o'tkazish
  // =========================================================================
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");

    // Mini App Launch redirect: ?launch=1 yoki /api/telegram-launch
    if (req.query.launch === "1" || (req.url && req.url.includes("telegram-launch"))) {
      const username = String(process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "");
      if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) {
        return res.status(503).send("Telegram Mini App link is not configured yet.");
      }
      const store = String(req.query.store || req.query.store_id || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64);
      const targetUrl = store 
        ? `https://t.me/${encodeURIComponent(username)}?startapp=${encodeURIComponent(store)}`
        : `https://t.me/${encodeURIComponent(username)}?startapp`;
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      return res.redirect(302, targetUrl);
    }

    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(503).json({ error: "telegram_bot_token_not_configured" });
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host || "kids-shop-six.vercel.app";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const currentWebhookUrl = `${proto}://${host}/api/telegram-webhook`;

    // ?setup=1 orqali Telegramda webhookni avtomatik o'rnatish
    if (req.query.setup === "1" || req.query.setup === "true") {
      try {
        const expectedSecret = crypto.createHash("sha256").update(TELEGRAM_BOT_TOKEN).digest("hex").slice(0, 32);
        const tgRes = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(currentWebhookUrl)}&secret_token=${expectedSecret}&drop_pending_updates=true`
        );
        const data = await tgRes.json();
        return res.status(200).json({
          ok: true,
          action: "setWebhook",
          webhookUrl: currentWebhookUrl,
          telegram_response: data,
        });
      } catch (err) {
        return res.status(500).json({ error: "failed_to_set_webhook", detail: err.message });
      }
    }

    // ?info=1 orqali joriy webhook holatini tekshirish
    if (req.query.info === "1") {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
        const data = await tgRes.json();
        return res.status(200).json({ ok: true, action: "getWebhookInfo", webhook: data.result });
      } catch (err) {
        return res.status(500).json({ error: "failed_to_get_webhook_info", detail: err.message });
      }
    }

    return res.status(200).json({
      ok: true,
      service: "KIDS-SHOP SaaS Telegram Webhook",
      url: currentWebhookUrl,
      instructions: "Webhookni o'rnatish uchun: /api/telegram-webhook?setup=1",
    });
  }

  // =========================================================================
  // 2. POST: Telegram serverlaridan kelgan Update'larni qayta ishlash
  // =========================================================================
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const expectedSecret = TELEGRAM_BOT_TOKEN
    ? crypto.createHash("sha256").update(TELEGRAM_BOT_TOKEN).digest("hex").slice(0, 32)
    : null;
  const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
  if (expectedSecret && incomingSecret && incomingSecret !== expectedSecret) {
    return res.status(401).json({ error: "invalid_secret_token" });
  }

  const update = req.body || {};

  // Telegramga darhol 200 OK qaytarish (qayta-qayta yubormasligi uchun)
  try {
    // -----------------------------------------------------------------------
    // A. CALLBACK QUERY (Operator guruhda inline tugmani bosganda)
    // -----------------------------------------------------------------------
    if (update.callback_query) {
      const cq = update.callback_query;
      const callbackId = cq.id;
      const data = String(cq.data || "");
      const from = cq.from || {};
      const message = cq.message;
      const chatId = message?.chat?.id;
      const messageId = message?.message_id;

      const rawOperator = from.username ? `@${from.username}` : (from.first_name || "Operator");
      const operatorName = escapeHtml(rawOperator);

      // data format: order:action:orderId (masalan: order:confirm:0c8f1854...)
      const parts = data.split(":");
      if (parts[0] === "order" && parts[1] && parts[2]) {
        const action = parts[1];
        const orderId = parts[2];

        let newStatus = "";
        let statusLabel = "";
        let toastText = "";
        let nextButtons = [];

        if (action === "confirm") {
          newStatus = "confirmed";
          statusLabel = "✅ Qabul qilindi";
          toastText = "Buyurtma qabul qilindi!";
          nextButtons = [
            [
              { text: "🚚 Yetkazildi", callback_data: `order:sent:${orderId}` },
              { text: "❌ Bekor qilish", callback_data: `order:cancel:${orderId}` }
            ]
          ];
        } else if (action === "sent") {
          newStatus = "sent";
          statusLabel = "🚚 Yetkazildi (Yetkazishga berildi)";
          toastText = "Buyurtma yetkazishga jo'natildi!";
          nextButtons = [
            [
              { text: "🎉 Yakunlash", callback_data: `order:completed:${orderId}` },
              { text: "❌ Bekor qilish", callback_data: `order:cancel:${orderId}` }
            ]
          ];
        } else if (action === "completed") {
          newStatus = "completed";
          statusLabel = "🎉 Muvaffaqiyatli yakunlandi";
          toastText = "Buyurtma yetkazildi va yopildi!";
          nextButtons = [];
        } else if (action === "cancel") {
          newStatus = "cancelled";
          statusLabel = "❌ Bekor qilindi";
          toastText = "Buyurtma bekor qilindi!";
          nextButtons = [];
        }

        // 1. Bazada buyurtma holatini yangilash
        if (newStatus && url && key) {
          try {
            await fetch(new URL(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, url), {
              method: "PATCH",
              headers: supabaseHeaders(key, { "Content-Type": "application/json" }),
              body: JSON.stringify({
                status: newStatus,
                accepted_by: rawOperator,
              }),
            });
          } catch (dbErr) {
            console.error("webhook_db_update_error", dbErr.message);
          }
        }

        // 2. Telegram xabar matnini va tugmalarini yangilash (editMessageText)
        if (TELEGRAM_BOT_TOKEN && chatId && messageId && message.text) {
          try {
            let baseText = message.text;
            const sepIdx = baseText.indexOf("\n\n━━━━━━━━━━━━━━━━━━━━\n📌 Holati:");
            if (sepIdx !== -1) {
              baseText = baseText.slice(0, sepIdx);
            }

            const timeStr = new Date().toLocaleTimeString("uz-UZ", {
              timeZone: "Asia/Tashkent",
              hour: "2-digit",
              minute: "2-digit",
            });

            const statusSection = [
              "",
              "━━━━━━━━━━━━━━━━━━━━",
              `📌 <b>Holati:</b> ${statusLabel}`,
              `👤 <b>Operator:</b> ${operatorName}`,
              `🕒 <b>Vaqt:</b> ${timeStr}`,
            ].join("\n");

            // Xabarni yangilash
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: baseText + statusSection,
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_markup: nextButtons.length ? { inline_keyboard: nextButtons } : { inline_keyboard: [] },
              }),
            });
          } catch (editErr) {
            console.error("webhook_edit_message_error", editErr.message);
          }
        }

        // 3. Operatorga tezkor bildirishnoma (Toast / answerCallbackQuery)
        if (TELEGRAM_BOT_TOKEN && callbackId) {
          try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                callback_query_id: callbackId,
                text: toastText,
                show_alert: false,
              }),
            });
          } catch {}
        }

        return res.status(200).json({ ok: true, processed: "callback_query", action, orderId });
      }
    }

    // -----------------------------------------------------------------------
    // B. MESSAGE (/start yoki do'konga havola)
    // -----------------------------------------------------------------------
    if (update.message && update.message.text) {
      const msg = update.message;
      const text = msg.text.trim();
      const chatId = msg.chat.id;

      if (text.startsWith("/start") && TELEGRAM_BOT_TOKEN) {
        // Deep linking: /start {storeSlug}
        const parts = text.split(" ");
        const storeSlug = (parts[1] || "kids-shop").toLowerCase().replace(/[^a-z0-9-]/g, "");

        const appUrl = `https://kids-shop-six.vercel.app/?store=${encodeURIComponent(storeSlug)}`;

        const welcomeText = [
          "👋 <b>Assalomu alaykum!</b>",
          "",
          "Bizning onlayn do‘konimizga xush kelibsiz.",
          "Quyidagi tugma orqali do‘kon katalogini ochishingiz, mahsulotlarni tanlashingiz va to‘g‘ridan-to‘g‘ri buyurtma berishingiz mumkin:",
        ].join("\n");

        try {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: welcomeText,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🛍 Do‘konni ochish",
                      web_app: { url: appUrl },
                    },
                  ],
                ],
              },
            }),
          });
        } catch (msgErr) {
          console.error("webhook_send_message_error", msgErr.message);
        }

        return res.status(200).json({ ok: true, processed: "start_message", store: storeSlug });
      }
    }

    return res.status(200).json({ ok: true, received: true });
  } catch (err) {
    console.error("telegram_webhook_error", err);
    return res.status(200).json({ ok: false, error: err.message });
  }
};
